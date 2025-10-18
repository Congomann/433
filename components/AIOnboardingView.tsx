import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from "@google/genai";
import { Client, ClientStatus, Interaction, InteractionType } from '../types';
import { RocketLaunchIcon, SearchIcon, DocumentTextIcon, CameraIcon, MicrophoneIcon, UserCircleIcon, CheckCircleIcon, AiSparklesIcon } from './icons';
import { useToast } from '../contexts/ToastContext';
import { analyzeOnboardingDocument, summarizeOnboardingConversation } from '../services/geminiService';

// --- Helper functions for Base64 and Audio Processing ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
const fileToBase64 = (file: File) => new Promise<{ base64: string; mimeType: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({ base64, mimeType: file.type });
    };
    reader.onerror = error => reject(error);
});


// --- Component Props ---
interface AIOnboardingViewProps {
  leads: Client[];
  onSave: (clientId: number, clientData: Partial<Client>, interactions: Omit<Interaction, 'id'|'clientId'>[]) => void;
  onNavigate: (view: string) => void;
}

// --- Main Component ---
const AIOnboardingView: React.FC<AIOnboardingViewProps> = ({ leads, onSave, onNavigate }) => {
  const [selectedLead, setSelectedLead] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Onboarding process state
  const [onboardingStatus, setOnboardingStatus] = useState<'idle' | 'analyzing' | 'conversation' | 'summarizing' | 'complete'>('idle');
  const [docAnalysisResult, setDocAnalysisResult] = useState<any | null>(null);
  const [transcript, setTranscript] = useState<{ speaker: 'user' | 'model'; text: string }[]>([]);
  const [summary, setSummary] = useState<any | null>(null);

  // Gemini Live API state
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isConversationActive, setIsConversationActive] = useState(false);
  
  const { addToast } = useToast();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });


  const filteredLeads = useMemo(() =>
    leads.filter(lead =>
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    ), [leads, searchTerm]);

  // Cleanup function for audio resources
  const cleanupAudio = useCallback(() => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
    scriptProcessorRef.current?.disconnect();
    scriptProcessorRef.current = null;
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    setIsConversationActive(false);
  }, []);

  useEffect(() => {
    return () => cleanupAudio();
  }, [cleanupAudio]);
    
  if (!selectedLead) {
    return (
      <div className="p-10 page-enter">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-2">AI Client Onboarding</h1>
        <p className="text-slate-500 mb-8">Select a lead to begin the automated onboarding process.</p>
        <div className="relative mb-6 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
                type="text"
                placeholder="Search for a lead..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50"
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map(lead => (
            <div key={lead.id} onClick={() => setSelectedLead(lead)} className="p-5 bg-white/70 backdrop-blur-lg border border-white/50 rounded-2xl cursor-pointer hover:border-primary-500/50 hover:shadow-premium-lg hover:-translate-y-1 transition-all row-enter">
              <p className="font-semibold text-slate-800">{lead.firstName} {lead.lastName}</p>
              <p className="text-sm text-slate-500">{lead.email}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  const handleSaveToProfile = () => {
        if (!summary) return;
        
        const clientUpdates: Partial<Client> = {};
        if (docAnalysisResult?.fullName && (!selectedLead.firstName || !selectedLead.lastName)) {
            const [firstName, ...lastNameParts] = docAnalysisResult.fullName.split(' ');
            clientUpdates.firstName = firstName;
            clientUpdates.lastName = lastNameParts.join(' ');
        }
        if (docAnalysisResult?.dob && !selectedLead.dob) clientUpdates.dob = docAnalysisResult.dob;
        if (docAnalysisResult?.address && !selectedLead.address) clientUpdates.address = docAnalysisResult.address;
        
        const newInteractions: Omit<Interaction, 'id'|'clientId'>[] = [
            {
                type: InteractionType.NOTE,
                date: new Date().toISOString().split('T')[0],
                summary: `AI Onboarding Summary:\n\n${summary.profileSummary}\n\nIdentified Needs:\n- ${summary.identifiedNeeds?.join('\n- ')}\n\nRecommended Products:\n- ${summary.productRecommendations?.map((r:any) => `${r.productName}: ${r.reason}`).join('\n- ')}\n\nNext Steps:\n- ${summary.nextSteps?.join('\n- ')}`
            },
            {
                type: InteractionType.NOTE,
                date: new Date().toISOString().split('T')[0],
                summary: `AI Onboarding Conversation Transcript:\n\n${transcript.map(t => `${t.speaker === 'user' ? 'Client' : 'AI'}: ${t.text}`).join('\n')}`
            }
        ];
        
        onSave(selectedLead.id, clientUpdates, newInteractions);
        onNavigate(`client/${selectedLead.id}`);
  };

  return (
    <div className="p-10 page-enter">
        <button onClick={() => { setSelectedLead(null); cleanupAudio(); }} className="text-primary-600 hover:underline mb-8">&larr; Back to Lead Selection</button>
        <div className="flex items-center mb-8">
            <RocketLaunchIcon className="w-10 h-10 text-primary-600 mr-4" />
            <div>
                <h1 className="text-4xl font-extrabold text-slate-800">AI Onboarding for {selectedLead.firstName} {selectedLead.lastName}</h1>
                <p className="text-slate-500">Follow the steps below to automate the onboarding process.</p>
            </div>
        </div>

        <div className="space-y-8">
            <StepCard title="Step 1: Document Analysis" icon={<DocumentTextIcon />}>
                <DocumentAnalysisStep 
                    onAnalysisComplete={(result) => {
                        setDocAnalysisResult(result);
                        setOnboardingStatus('conversation');
                        addToast('Analysis Complete', 'Client data extracted successfully.', 'success');
                    }}
                    onStatusChange={setOnboardingStatus}
                    status={onboardingStatus}
                />
            </StepCard>

            <StepCard title="Step 2: Conversational Needs Analysis" icon={<MicrophoneIcon />} isActive={onboardingStatus !== 'idle'}>
                <ConversationStep
                    leadName={selectedLead.firstName}
                    isEnabled={onboardingStatus !== 'idle' && onboardingStatus !== 'analyzing'}
                    isActive={isConversationActive}
                    onConversationStart={() => setIsConversationActive(true)}
                    onConversationEnd={(finalTranscript) => {
                        setIsConversationActive(false);
                        cleanupAudio();
                        setOnboardingStatus('summarizing');
                        setTranscript(finalTranscript);
                    }}
                    transcript={transcript}
                    setTranscript={setTranscript}
                    ai={ai}
                    sessionPromiseRef={sessionPromiseRef}
                    inputAudioContextRef={inputAudioContextRef}
                    outputAudioContextRef={outputAudioContextRef}
                    scriptProcessorRef={scriptProcessorRef}
                    mediaStreamRef={mediaStreamRef}
                    setIsConversationActive={setIsConversationActive}
                />
            </StepCard>
            
            <StepCard title="Step 3: Summary & Action Plan" icon={<AiSparklesIcon />} isActive={onboardingStatus === 'summarizing' || onboardingStatus === 'complete'}>
                <SummaryStep
                    transcript={transcript.map(t => `${t.speaker === 'user' ? 'Agent' : 'Client'}: ${t.text}`).join('\n')}
                    isEnabled={onboardingStatus === 'summarizing' || onboardingStatus === 'complete'}
                    summary={summary}
                    onSummaryComplete={(result) => {
                        setSummary(result);
                        setOnboardingStatus('complete');
                        addToast('Summary Generated', 'Action plan is ready for review.', 'success');
                    }}
                />
            </StepCard>
            
            {onboardingStatus === 'complete' && (
                <div className="flex justify-end mt-8">
                    <button onClick={handleSaveToProfile} className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-emerald-700 transition-transform hover:scale-105 button-press flex items-center">
                        <CheckCircleIcon className="w-6 h-6 mr-2" /> Save to Client Profile
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};


// --- Sub-components for each step ---

const StepCard: React.FC<{ title: string; icon: React.ReactElement<{ className?: string }>; children: React.ReactNode; isActive?: boolean }> = ({ title, icon, children, isActive = true }) => (
    <div className={`bg-white/70 backdrop-blur-lg rounded-2xl border border-white/50 shadow-premium transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-40 bg-slate-50/50'}`}>
        <div className="p-5 border-b border-slate-200/50 flex items-center">
            <div className={`p-2 rounded-xl mr-4 ${isActive ? 'bg-primary-100 text-primary-600' : 'bg-slate-200 text-slate-500'}`}>
                {React.cloneElement(icon, { className: 'w-6 h-6' })}
            </div>
            <h2 className={`text-xl font-bold ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{title}</h2>
        </div>
        <div className="p-8">
            {isActive ? children : <p className="text-slate-400 text-center">Complete previous steps to unlock.</p>}
        </div>
    </div>
);

const DocumentAnalysisStep: React.FC<{
    onAnalysisComplete: (result: any) => void;
    onStatusChange: (status: 'analyzing') => void;
    status: string;
}> = ({ onAnalysisComplete, onStatusChange, status }) => {
    const [file, setFile] = useState<File | null>(null);
    const { addToast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFile(e.target.files[0]);
    };

    const handleAnalyze = async () => {
        if (!file) {
            addToast('No File', 'Please select a document to analyze.', 'warning');
            return;
        }
        onStatusChange('analyzing');
        try {
            const { base64, mimeType } = await fileToBase64(file);
            const result = await analyzeOnboardingDocument(base64, mimeType);
            onAnalysisComplete(result);
        } catch (error: any) {
            addToast('Analysis Failed', error.message, 'error');
        }
    };

    return (
        <div>
            <p className="text-slate-600 mb-4">Upload a client document (e.g., driver's license) to automatically extract their personal information.</p>
            <div className="flex items-center gap-4">
                <input type="file" onChange={handleFileChange} accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"/>
                <button onClick={handleAnalyze} disabled={!file || status === 'analyzing'} className="bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-primary-700 disabled:bg-slate-400 flex items-center">
                    {status === 'analyzing' ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Analyzing...
                        </>
                    ) : (
                        <><AiSparklesIcon className="w-5 h-5 mr-2" /> Analyze Document</>
                    )}
                </button>
            </div>
        </div>
    );
};

const ConversationStep: React.FC<{
    leadName: string; isEnabled: boolean; isActive: boolean;
    onConversationStart: () => void; onConversationEnd: (transcript: { speaker: 'user' | 'model'; text: string }[]) => void;
    transcript: { speaker: 'user' | 'model'; text: string }[]; setTranscript: React.Dispatch<React.SetStateAction<{ speaker: 'user' | 'model'; text: string }[]>>;
    ai: GoogleGenAI;
    sessionPromiseRef: React.MutableRefObject<Promise<LiveSession> | null>;
    inputAudioContextRef: React.MutableRefObject<AudioContext | null>;
    outputAudioContextRef: React.MutableRefObject<AudioContext | null>;
    scriptProcessorRef: React.MutableRefObject<ScriptProcessorNode | null>;
    mediaStreamRef: React.MutableRefObject<MediaStream | null>;
    setIsConversationActive: React.Dispatch<React.SetStateAction<boolean>>;
}> = (props) => {
    const { leadName, isEnabled, isActive, onConversationStart, onConversationEnd, transcript, setTranscript, ai, sessionPromiseRef, inputAudioContextRef, outputAudioContextRef, scriptProcessorRef, mediaStreamRef, setIsConversationActive } = props;
    const { addToast } = useToast();
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const startConversation = async () => {
        onConversationStart();
        setTranscript([]);
        let nextStartTime = 0;
        const sources = new Set<AudioBufferSourceNode>();

        try {
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = { data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)), mimeType: 'audio/pcm;rate=16000' };
                            sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription) {
                            setTranscript(prev => [...prev, { speaker: 'model', text: message.serverContent!.outputTranscription!.text }]);
                        } else if (message.serverContent?.inputTranscription) {
                            setTranscript(prev => [...prev, { speaker: 'user', text: message.serverContent!.inputTranscription!.text }]);
                        }
                        
                        const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (audio && outputAudioContextRef.current) {
                            nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audio), outputAudioContextRef.current, 24000, 1);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current.destination);
                            source.addEventListener('ended', () => sources.delete(source));
                            source.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                            sources.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => { addToast('Conversation Error', 'An error occurred during the conversation.', 'error'); setIsConversationActive(false); },
                    onclose: () => { console.log('Session closed'); setIsConversationActive(false); },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    systemInstruction: `You are simulating a prospective insurance client named ${leadName} for an agent's training. Be friendly, slightly unsure of what you need, and answer the agent's questions naturally. Mention you have a spouse and two young children, a new mortgage, and are concerned about financial security if something happens to you.`,
                },
            });

        } catch (error) {
            console.error(error);
            addToast('Audio Error', 'Could not access microphone.', 'error');
            setIsConversationActive(false);
        }
    };
    
    return (
        <div>
            <p className="text-slate-600 mb-4">Start a simulated conversation with the client to understand their needs. The AI will respond as the client based on a predefined scenario.</p>
            <div className="flex items-center gap-4 mb-4">
                <button onClick={startConversation} disabled={!isEnabled || isActive} className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-emerald-700 disabled:bg-slate-400">Start Conversation</button>
                <button onClick={() => onConversationEnd(transcript)} disabled={!isActive} className="bg-rose-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-rose-700 disabled:bg-slate-400">End & Summarize</button>
            </div>
            {isActive && (
                <div className="flex items-center text-emerald-600 font-semibold">
                    <div className="relative flex items-center justify-center w-5 h-5 mr-2">
                        <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></div>
                        <MicrophoneIcon className="w-5 h-5" />
                    </div>
                    Listening...
                </div>
            )}
            <div ref={transcriptEndRef} className="mt-4 p-4 bg-slate-100/50 rounded-lg max-h-60 overflow-y-auto border border-slate-200/50">
                {transcript.length > 0 ? transcript.map((entry, i) => (
                    <p key={i} className={entry.speaker === 'model' ? 'text-slate-800' : 'text-primary-700 font-medium'}>
                        <strong>{entry.speaker === 'model' ? `${leadName}:` : 'You:'}</strong> {entry.text}
                    </p>
                )) : <p className="text-slate-400">Conversation transcript will appear here...</p>}
            </div>
        </div>
    );
};

const SummaryStep: React.FC<{
    transcript: string; isEnabled: boolean; summary: any | null;
    onSummaryComplete: (summary: any) => void;
}> = ({ transcript, isEnabled, summary, onSummaryComplete }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleSummarize = async () => {
        setIsLoading(true);
        try {
            const result = await summarizeOnboardingConversation(transcript);
            onSummaryComplete(result);
        } catch (error: any) {
            alert(error.message); // Replace with a toast
        } finally {
            setIsLoading(false);
        }
    };

    if (!isEnabled) {
        return <p className="text-slate-400 text-center">Complete the conversation to generate a summary.</p>
    }

    if (summary) {
        return (
            <div className="prose prose-sm max-w-none">
                <h4>Profile Summary</h4>
                <p>{summary.profileSummary}</p>
                <h4>Identified Needs</h4>
                <ul>{summary.identifiedNeeds.map((need: string, i: number) => <li key={i}>{need}</li>)}</ul>
                <h4>Recommended Products</h4>
                <ul>{summary.productRecommendations.map((rec: any, i: number) => <li key={i}><strong>{rec.productName}:</strong> {rec.reason}</li>)}</ul>
                <h4>Next Steps</h4>
                <ul>{summary.nextSteps.map((step: string, i: number) => <li key={i}>{step}</li>)}</ul>
            </div>
        )
    }

    return (
        <div className="text-center">
             <button onClick={handleSummarize} disabled={isLoading} className="bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-primary-700 disabled:bg-slate-400 flex items-center mx-auto">
                {isLoading ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Generating...
                    </>
                ) : (
                    <><AiSparklesIcon className="w-5 h-5 mr-2" /> Generate Summary & Action Plan</>
                )}
            </button>
        </div>
    );
};


export default AIOnboardingView;