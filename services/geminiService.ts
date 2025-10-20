import { GoogleGenAI, Type, Modality } from "@google/genai";
import { User, Client, Task, Agent, Policy, UserRole, AISuggestion, EmailDraft, Interaction, PolicyStatus, PolicyType, PolicyUnderwritingStatus, AICallAnalysis, AICallLog, ClientStatus } from '../types';

// FIX: Per @google/genai guidelines, the API key must be obtained directly from the environment variable.
// Fallbacks and warnings are removed as the key is assumed to be configured.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const summarizeNotes = async (notes: string): Promise<string> => {
  // FIX: Per @google/genai guidelines, the API_KEY availability check is removed.
  // The application assumes the key is valid and present.
  try {
    const prompt = `Summarize the following client notes for a busy insurance agent. Extract key points, action items, and any client concerns. Format the output clearly with headings. Notes:\n\n${notes}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error summarizing notes:", error);
    return "Error: Could not summarize notes.";
  }
};

const suggestionSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        action: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['CREATE_TASK', 'DRAFT_EMAIL', 'ASSIGN_LEAD', 'INFO_ONLY'] },
            clientId: { type: Type.INTEGER },
            prompt: { type: Type.STRING },
            assignToAgentId: { type: Type.INTEGER },
            assignToAgentName: { type: Type.STRING },
          },
          required: ["type"],
        },
      },
      required: ["priority", "title", "description", "action"],
    },
};

const getRoleSpecificPrompt = (currentUser: User, allData: { clients: Client[], tasks: Task[], agents: Agent[], policies: Policy[], interactions: Interaction[] }): string => {
    const today = new Date().toISOString().split('T')[0];
    let roleInstructions = '';
    let dataPayload = {};

    switch(currentUser.role) {
        case UserRole.AGENT: {
            const agentClients = allData.clients.filter(c => c.agentId === currentUser.id);
            const agentClientIds = new Set(agentClients.map(c => c.id));
            const allAgentPolicies = allData.policies.filter(p => agentClientIds.has(p.clientId));
            
            const todayDate = new Date(today);
            todayDate.setUTCHours(0, 0, 0, 0);

            const expiringPolicies = allAgentPolicies
                .filter(p => p.status === PolicyStatus.ACTIVE && p.endDate)
                .map(p => {
                    const endDate = new Date(p.endDate);
                    if (isNaN(endDate.getTime())) return null;

                    endDate.setUTCHours(0,0,0,0);
                    
                    const diffTime = endDate.getTime() - todayDate.getTime();
                    const daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    return {
                        clientId: p.clientId,
                        type: p.type as PolicyType,
                        daysUntilExpiration,
                    };
                })
                .filter((p): p is { clientId: number; type: PolicyType; daysUntilExpiration: number } => 
                    p !== null && p.daysUntilExpiration >= 0 && p.daysUntilExpiration <= 45
                );

            const policies = allAgentPolicies.map(p => ({
                clientId: p.clientId,
                type: p.type,
                status: p.status,
            }));

            const clientSummaryForPrompt = agentClients.map(c => {
                 const lastInteraction = allData.interactions.filter(i => i.clientId === c.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                 const clientPolicyTypes = allAgentPolicies.filter(p => p.clientId === c.id).map(p => p.type);
                 return { id: c.id, name: `${c.firstName} ${c.lastName}`, status: c.status, joinDate: c.joinDate, lastContact: lastInteraction?.date, policies: clientPolicyTypes };
            });

            // Pre-process cross-sell opportunities to make the AI's job easier and more reliable.
            const activeClients = agentClients.filter(c => c.status === ClientStatus.ACTIVE);
            
            const crossSellOpportunities = activeClients.map(client => {
                const clientPolicies = allAgentPolicies.filter(p => p.clientId === client.id);
                if (clientPolicies.length !== 1) {
                    return null;
                }
                
                const policy = clientPolicies[0];
                const existingPolicyType = policy.type;
                let suggestedPolicyType: PolicyType | null = null;
                
                // Determine complementary policy based on user's request
                if (existingPolicyType === PolicyType.AUTO) {
                    suggestedPolicyType = PolicyType.HOME;
                } else if (existingPolicyType === PolicyType.HOME) {
                    suggestedPolicyType = PolicyType.AUTO;
                } else if (existingPolicyType.includes('Life')) {
                    suggestedPolicyType = PolicyType.AUTO;
                }

                if (suggestedPolicyType) {
                    return {
                        clientId: client.id,
                        clientName: `${client.firstName} ${client.lastName}`,
                        existingPolicyType,
                        suggestedPolicyType,
                    };
                }
                
                return null;
            }).filter((opportunity): opportunity is { clientId: number; clientName: string; existingPolicyType: PolicyType; suggestedPolicyType: PolicyType } => opportunity !== null);


            roleInstructions = `
                You are an AI assistant for an insurance agent named ${currentUser.name}. Your goal is to provide actionable suggestions to help them manage their clients and policies effectively. Today's date is ${today}.
                1.  **Policy Renewals:** The 'expiringPolicies' list contains policies that need renewal attention. For each policy in this list, generate a 'CREATE_TASK' suggestion.
                    - The task's title should be: "Initiate renewal process for [Client Name]'s [Policy Type] policy". You must find the client's name from the 'clients' list using the 'clientId'.
                    - The task's priority must be 'High' if 'daysUntilExpiration' is 15 or less. Otherwise, set the priority to 'Medium'.
                2.  **Client Follow-ups:** Identify active clients who have not been contacted in over 90 days. Suggest a "CREATE_TASK" to 'Check in with [Client Name]'.
                3.  **Cross-sell Opportunities:** The 'crossSellOpportunities' list identifies clients with a single policy who are prime candidates for adding another. For each person in this list:
                    - Generate a 'Low' priority suggestion with the "DRAFT_EMAIL" action.
                    - The suggestion title should be: "Propose new policy to [Client Name]".
                    - The action's prompt must be: 'Draft an email to [Client Name] about adding a [Suggested Policy Type] policy to complement their existing [Existing Policy Type] coverage.' Use the 'clientName', 'suggestedPolicyType', and 'existingPolicyType' fields from the data provided in the 'crossSellOpportunities' list.
                4.  **Lead Nurturing:** Identify leads that have not been contacted in over 7 days. Suggest a "CREATE_TASK" to 'Follow up with lead [Lead Name]'.
            `;
            dataPayload = { clients: clientSummaryForPrompt, expiringPolicies, crossSellOpportunities };
            break;
        }
        case UserRole.SUB_ADMIN:
            const unassignedLeads = allData.clients.filter(c => c.status === 'Lead' && !c.agentId).map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}`, joinDate: c.joinDate }));
            // Calculate a 'workload' score for each active agent to simplify the AI's task.
            const agentWorkloads = allData.agents
                .filter(a => a.status === 'Active')
                .map(a => ({ 
                    id: a.id, 
                    name: a.name, 
                    clientCount: a.clientCount, 
                    leadCount: a.leads,
                    workload: a.clientCount + a.leads // Dynamic calculation
                }));

            roleInstructions = `
                You are an AI assistant for a Sub-Admin responsible for lead distribution. Your task is to assign new leads to the best available agent.
                1.  Review the list of 'unassignedLeads'.
                2.  For each unassigned lead, examine the 'agentWorkloads' data.
                3.  Identify the single agent with the lowest 'workload' score. This score represents their current capacity. If there is a tie, you may pick any of the agents with the lowest score.
                4.  Create one suggestion for each unassigned lead using the "ASSIGN_LEAD" action.
                5.  The suggestion's title should be "Assign Lead: [Lead Name] to [Best Agent's Name]".
                6.  The suggestion's description should state that the recommended agent has the lowest current workload.
                7.  Crucially, the 'assignToAgentId' and 'assignToAgentName' in the action payload MUST correspond to the agent you identified with the lowest workload score.
            `;
            dataPayload = { unassignedLeads, agentWorkloads };
            break;
        case UserRole.ADMIN:
            const agentPerformance = allData.agents.filter(a => a.status === 'Active').map(a => ({ name: a.name, clientCount: a.clientCount, conversionRate: a.conversionRate }));
            const policyDistribution = allData.policies.reduce((acc, p) => {
                acc[p.type] = (acc[p.type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
             roleInstructions = `
                You are an AI assistant for the Admin of the insurance agency.
                1.  Provide high-level strategic insights using the "INFO_ONLY" action.
                2.  Analyze agent performance and identify the top-performing agent based on client count and conversion rate.
                3.  Analyze the policy distribution and identify the most and least popular policy types.
            `;
            dataPayload = { agentPerformance, policyDistribution };
            break;
    }

    return `
        SYSTEM: You are a helpful AI assistant for an insurance CRM. Your goal is to provide actionable suggestions to help users be more productive. Analyze the provided JSON data and generate a list of suggestions in the specified JSON format. Today's date is ${today}.
        
        USER_ROLE_INSTRUCTIONS:
        ${roleInstructions}

        DATA:
        ${JSON.stringify(dataPayload)}
    `;
}

export const getAIAssistantSuggestions = async (
  currentUser: User,
  allData: { clients: Client[], tasks: Task[], agents: Agent[], policies: Policy[], interactions: Interaction[] }
): Promise<AISuggestion[]> => {
  try {
    const prompt = getRoleSpecificPrompt(currentUser, allData);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: suggestionSchema,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) return [];
    
    return JSON.parse(jsonText);

  } catch (error) {
    console.error("Error getting AI assistant suggestions:", error);
    // Return a user-friendly error suggestion instead of crashing
    return [{
        priority: 'High',
        title: 'AI Assistant Error',
        description: `Could not generate suggestions. The AI model may be temporarily unavailable. Please try again later. Error: ${error instanceof Error ? error.message : String(error)}`,
        action: { type: 'INFO_ONLY' }
    }];
  }
};

export const draftEmail = async (prompt: string, clientName: string): Promise<Omit<EmailDraft, 'to' | 'clientName'>> => {
    try {
        const fullPrompt = `As an insurance agent, draft a professional and friendly email to a client named ${clientName}.
        
        The email should be based on this objective: "${prompt}".
        
        Return a JSON object with two keys: "subject" and "body". The body should use paragraphs for readability.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subject: { type: Type.STRING },
                        body: { type: Type.STRING }
                    },
                    required: ["subject", "body"]
                }
            }
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error drafting email:", error);
        return {
            subject: "Follow-up",
            body: "Could not generate email draft. Please write your message manually."
        }
    }
};

export const analyzeOnboardingDocument = async (base64Image: string, mimeType: string): Promise<any> => {
    try {
        const prompt = "Analyze the provided image, which could be a driver's license or other ID document. Extract the following personal information. If a field is not present, return null for that value.";
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Image } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        fullName: { type: Type.STRING, description: "Full name of the person." },
                        dob: { type: Type.STRING, description: "Date of birth in YYYY-MM-DD format." },
                        address: { type: Type.STRING, description: "Full mailing address." }
                    }
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error analyzing document:", error);
        throw new Error("Failed to analyze the document. Please ensure it is a clear image of an ID.");
    }
};

export const summarizeOnboardingConversation = async (callDetails: string): Promise<any> => {
    try {
        const prompt = `You are an expert insurance agent assistant. Analyze the following notes and/or transcript from a follow-up call between an agent and a lead. Your goal is to extract key outcomes and structure it as a JSON object for the CRM.

        Call Details:
        ${callDetails}

        Based on the conversation, provide a summary covering the following points:
        1.  **Client Intent:** Categorize the client's final intent as 'Interested', 'Not Interested', 'Callback Requested', or 'Unknown'.
        2.  **Call Synopsis:** A brief, one-paragraph summary of the conversation's purpose and outcome.
        3.  **Lead's Interest Level:** A bulleted list assessing the lead's interest (e.g., "Highly interested, asked about pricing," "Still considering, mentioned competitor X," "Not interested at this time").
        4.  **Key Objections/Questions:** A bulleted list of any new concerns, objections, or specific questions the lead raised.
        5.  **Actionable Next Steps:** A short, bulleted list of 2-3 concrete next steps for the agent (e.g., "Schedule a formal appointment for Tuesday," "Send comparison quote for competitor X," "Follow up in one week."). If an appointment was set, specify the date and time.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        intent: { type: Type.STRING, enum: ['Interested', 'Not Interested', 'Callback Requested', 'Unknown'], description: "The client's primary intent at the end of the call." },
                        profileSummary: { type: Type.STRING, description: "A one-paragraph summary of the call's purpose and outcome." },
                        identifiedNeeds: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the lead's current interest level and any objections or questions they raised." },
                        nextSteps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of concrete next steps the agent should take, including any appointments set." }
                    },
                    required: ["intent", "profileSummary", "identifiedNeeds", "nextSteps"]
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error summarizing conversation:", error);
        throw new Error("Failed to generate a summary from the conversation.");
    }
};

const eAppSchema = {
  type: Type.OBJECT,
  properties: {
    policyNumber: { type: Type.STRING, description: "The policy number or application ID." },
    annualPremium: { type: Type.NUMBER, description: "The total annual premium amount, as a number." },
    status: { 
      type: Type.STRING, 
      enum: Object.values(PolicyUnderwritingStatus),
      description: "The final status of the application." 
    },
  },
  required: ["policyNumber", "annualPremium", "status"],
};

export const analyzeEAppConfirmation = async (confirmationText: string): Promise<{policyNumber: string; annualPremium: number; status: PolicyUnderwritingStatus}> => {
  try {
    const prompt = `Analyze the following insurance application confirmation text. Extract the policy number (or application ID), the total annual premium amount, and the final status of the application (e.g., Approved, Pending Review, etc.). The text is unstructured, so find the most relevant pieces of information. If a numeric value isn't present for premium, return null.

    Confirmation Text:
    ---
    ${confirmationText}
    ---
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: eAppSchema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error analyzing e-app confirmation:", error);
    throw new Error("Could not analyze the provided text. Please ensure it contains policy information and try again.");
  }
};

const callAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A brief, one-paragraph summary of the call's outcome and key discussion points." },
        sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative'], description: "The overall sentiment of the client during the call." },
        keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 5-7 key topics or keywords discussed (e.g., 'IUL', 'premium cost', 'children's future')." },
        actionItems: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of concrete next steps for the agent (e.g., 'Send IUL illustration', 'Follow up on Friday')." }
    },
    required: ["summary", "sentiment", "keywords", "actionItems"]
};

export const analyzeCallRecording = async (callLog: { intent: string, status: string }): Promise<AICallAnalysis> => {
    try {
        const prompt = `You are an AI assistant that analyzes call recordings for an insurance agency. Based on the following call summary, generate a structured analysis. The call has already been categorized with an intent of "${callLog.intent}" and a status of "${callLog.status}".

        Your task is to expand on this by providing a detailed summary, client sentiment, keywords, and actionable next steps for the agent.

        Example Output for an "Interested" client:
        - Summary: "The client, John Smith, expressed strong interest in a life insurance policy after a quote was provided. He is concerned about protecting his family's future and asked about the differences between term and whole life."
        - Sentiment: "Positive"
        - Keywords: ["life insurance", "quote", "family protection", "term life", "whole life"]
        - Action Items: ["Send a comparison of Term vs. Whole Life", "Schedule a follow-up call for Tuesday to review options."]

        Now, analyze this call:
        - Intent: ${callLog.intent}
        - Status/Notes: ${callLog.status}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: callAnalysisSchema,
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error analyzing call recording:", error);
        throw new Error("Failed to generate call analysis.");
    }
};

export const generateAudioFromText = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data returned from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating audio from text:", error);
        throw new Error("Failed to generate audio summary.");
    }
};