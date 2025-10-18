import { GoogleGenAI, Type } from "@google/genai";
import { User, Client, Task, Agent, Policy, UserRole, AISuggestion, EmailDraft, Interaction, PolicyStatus, PolicyType, PolicyUnderwritingStatus } from '../types';

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

            roleInstructions = `
                You are an AI assistant for an insurance agent named ${currentUser.name}. Your goal is to provide actionable suggestions to help them manage their clients and policies effectively. Today's date is ${today}.
                1.  **Policy Renewals:** The 'expiringPolicies' list contains policies that need renewal attention. For each policy in this list, generate a 'CREATE_TASK' suggestion.
                    - The task's title should be: "Initiate renewal process for [Client Name]'s [Policy Type] policy". You must find the client's name from the 'clients' list using the 'clientId'.
                    - The task's priority must be 'High' if 'daysUntilExpiration' is 15 or less. Otherwise, set the priority to 'Medium'.
                2.  **Client Follow-ups:** Identify active clients who have not been contacted in over 90 days. Suggest a "CREATE_TASK" to 'Check in with [Client Name]'.
                3.  **Cross-sell Opportunities:** Using the 'policies' data, identify active clients who have exactly one policy. For these clients, generate a 'Low' priority suggestion with the "DRAFT_EMAIL" action.
                    - The action's prompt should be: 'Draft an email to [Client Name] to discuss adding a [Complementary Policy Type] policy to their portfolio.'
                    - To determine the [Complementary Policy Type]:
                        - If the client's only policy is 'Auto Insurance', suggest 'Home Insurance'.
                        - If the client's only policy is 'Home Insurance', suggest 'Auto Insurance'.
                        - If the client's only policy contains the word 'Life', suggest 'Auto Insurance'.
                4.  **Lead Nurturing:** Identify leads that have not been contacted in over 7 days. Suggest a "CREATE_TASK" to 'Follow up with lead [Lead Name]'.
            `;
            dataPayload = { clients: clientSummaryForPrompt, policies, expiringPolicies };
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

export const summarizeOnboardingConversation = async (transcript: string): Promise<any> => {
    try {
        const prompt = `You are an expert insurance agent assistant. Analyze the following follow-up call transcript between an agent and a lead. Your goal is to extract key outcomes and structure it as a JSON object for the CRM.

        Transcript:
        ${transcript}

        Based on the conversation, provide a summary covering the following points:
        1.  **Call Synopsis:** A brief, one-paragraph summary of the conversation's purpose and outcome.
        2.  **Lead's Interest Level:** A bulleted list assessing the lead's interest (e.g., "Highly interested, asked about pricing," "Still considering, mentioned competitor X," "Not interested at this time").
        3.  **Key Objections/Questions:** A bulleted list of any new concerns, objections, or specific questions the lead raised.
        4.  **Actionable Next Steps:** A short, bulleted list of 2-3 concrete next steps for the agent (e.g., "Schedule a formal appointment for Tuesday," "Send comparison quote for competitor X," "Follow up in one week."). If an appointment was set, specify the date and time.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        profileSummary: { type: Type.STRING, description: "A one-paragraph summary of the call's purpose and outcome." },
                        identifiedNeeds: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the lead's current interest level and any objections or questions they raised." },
                        productRecommendations: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    productName: { type: Type.STRING, description: "This key is not needed. Instead, put the lead's interest level and objections in the 'identifiedNeeds' array." },
                                    reason: { type: Type.STRING, description: "This key is not needed." }
                                }
                            },
                            description: "This key is not needed."
                        },
                        nextSteps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of concrete next steps the agent should take, including any appointments set." }
                    },
                    required: ["profileSummary", "identifiedNeeds", "nextSteps"]
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
