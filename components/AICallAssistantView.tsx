import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Client, Interaction, InteractionType, ClientStatus, Agent, User } from '../types';
import { PhoneIcon, SearchIcon, UserCircleIcon, CheckCircleIcon, AiSparklesIcon, PhoneHangupIcon, PlusIcon, MicrophoneIcon } from './icons';
import { useToast } from '../contexts/ToastContext';
import { summarizeOnboardingConversation } from '../services/geminiService';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from "@google/genai";

// --- Helper functions for Audio Processing ---
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


interface AICallAssistantViewProps {
  clients: Client[];
  onSaveInteraction: (interaction: Omit<Interaction, 'id'>) => void;
  onNavigate: (view: string) => void;
  onUpdateClient: (clientId: number, updates: Partial<Client>) => void;
  onAddLead: () => void;
  agent: Agent;
  currentUser: User;
}

const Waveform: React.FC = () => (
    <div className="flex items-center justify-center h-8 gap-1">
        <div className="w-1 h-6 bg-emerald-400 rounded-full waveform-bar"></div>
        <div className="w-1 h-8 bg-emerald-400 rounded-full waveform-bar"></div>
        <div className="w-1 h-5 bg-emerald-400 rounded-full waveform-bar"></div>
        <div className="w-1 h-7 bg-emerald-400 rounded-full waveform-bar"></div>
        <div className="w-1 h-6 bg-emerald-400 rounded-full waveform-bar"></div>
    </div>
);


const AICallAssistantView: React.FC<AICallAssistantViewProps> = ({ clients, onSaveInteraction, onNavigate, onUpdateClient, onAddLead, agent }) => {
    const [callStatus, setCallStatus] = useState<'idle' | 'pre-call' | 'connecting' | 'active' | 'summarizing' | 'complete'>('idle');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useToast();
    
    // Call state
    const [callNotes, setCallNotes] = useState('');
    const [summary, setSummary] = useState<any | null>(null);
    const [transcript, setTranscript] = useState<{ speaker: 'user' | 'model'; text: string }[]>([]);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    // Gemini Live API state
    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY! }), []);
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const [isConversationActive, setIsConversationActive] = useState(false);
    
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    const leads = useMemo(() => clients.filter(c => c.status === ClientStatus.LEAD || c.status === ClientStatus.ACTIVE), [clients]);

    const filteredLeads = useMemo(() =>
        leads.filter(lead =>
            `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchTerm.toLowerCase())
        ), [leads, searchTerm]
    );

    const cleanupAudio = useCallback(() => {
        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;
    
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
    
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close().catch(console.error);
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(console.error);
        }
    
        setIsConversationActive(false);
    }, []);

    useEffect(() => {
        return () => cleanupAudio();
    }, [cleanupAudio]);
    
    const handleSelectClient = (client: Client) => {
        setSelectedClient(client);
        setCallStatus('pre-call');
    };

    const handleBackToSelection = () => {
        cleanupAudio();
        setSelectedClient(null);
        setCallStatus('idle');
        setCallNotes('');
        setSummary(null);
        setTranscript([]);
    };

    const handleStartCall = async () => {
        if (!selectedClient) return;

        setCallStatus('connecting');
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
                        setCallStatus('active');
                        setIsConversationActive(true);
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
                    onerror: (e: ErrorEvent) => { addToast('Conversation Error', 'An error occurred. Please try again.', 'error'); cleanupAudio(); setCallStatus('pre-call'); },
                    onclose: () => { setIsConversationActive(false); }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    systemInstruction: `You are simulating a client named ${selectedClient.firstName} ${selectedClient.lastName}. You are speaking with an insurance agent. Be helpful but ask relevant questions. Client context: has a family, interested in life insurance, and may have questions about policy types.`,
                }
            });

        } catch (error) {
            addToast('Microphone Error', 'Could not access your microphone. Please grant permission.', 'error');
            setCallStatus('pre-call');
        }
    };
    
    const handleEndCall = useCallback(async () => {
        cleanupAudio();
        handleGenerateSummary();
    }, [callNotes, transcript]);

    const handleGenerateSummary = async () => {
        setCallStatus('summarizing');
        const fullConversation = transcript.map(t => `${t.speaker === 'user' ? 'Agent' : 'Client'}: ${t.text}`).join('\n');
        const notesToSummarize = `Conversation Transcript:\n${fullConversation}\n\nAgent's Manual Notes:\n${callNotes}`;
        
        try {
            const result = await summarizeOnboardingConversation(notesToSummarize);
            setSummary(result);
            addToast('Summary Generated', 'AI summary is ready.', 'success');
        } catch (error) {
            addToast('Summarization Failed', 'Could not generate summary from the conversation.', 'error');
        } finally {
            setCallStatus('complete');
        }
    };

    const handleSaveAndExit = () => {
        if (!selectedClient) return;
        
        const interactions: Omit<Interaction, 'id'|'clientId'>[] = [];
        const fullConversationText = transcript.map(t => `${t.speaker === 'user' ? 'Agent' : 'Client'}: ${t.text}`).join('\n');

        if (fullConversationText.trim()) {
            interactions.push({
                type: InteractionType.CALL,
                date: new Date().toISOString().split('T')[0],
                summary: `Live Call Transcript:\n\n${fullConversationText}`
            });
        }
        
        if (callNotes.trim()) {
             interactions.push({
                type: InteractionType.NOTE,
                date: new Date().toISOString().split('T')[0],
                summary: `Manual Call Notes:\n\n${callNotes}`
            });
        }

        if (summary) {
            interactions.push({
                type: InteractionType.NOTE,
                date: new Date().toISOString().split('T')[0],
                summary: `AI Call Summary:\n\n${summary.profileSummary}\n\nNext Steps:\n- ${summary.nextSteps?.join('\n- ')}`
            });
        }
        
        if (interactions.length > 0) {
            interactions.forEach(interaction => onSaveInteraction({ ...interaction, clientId: selectedClient.id }));
        }
        
        onNavigate(`client/${selectedClient.id}`);
    };

    if (callStatus === 'idle') {
        return (
            <div className="p-10 page-enter">
                <h1 className="text-4xl font-extrabold text-slate-800 mb-2">AI Call Assistant</h1>
                <p className="text-slate-500 mb-8">Select a client to start a live voice conversation.</p>
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-grow max-w-md">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input type="text" placeholder="Search for a client or lead..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50" />
                    </div>
                    <button onClick={onAddLead} className="flex items-center bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-primary-700 button-press">
                        <PlusIcon className="w-5 h-5 mr-2" /> Add New Lead
                    </button>
                </div>
                <div className="space-y-3">
                    {filteredLeads.map(lead => (
                        <div key={lead.id} className="p-4 bg-white/70 backdrop-blur-lg border border-white/50 rounded-2xl flex justify-between items-center row-enter">
                            <div><p className="font-semibold text-slate-800">{lead.firstName} {lead.lastName}</p><p className="text-sm text-slate-500">{lead.email}</p></div>
                            <button onClick={() => handleSelectClient(lead)} className="bg-slate-200 text-slate-700 font-semibold px-4 py-1.5 rounded-lg hover:bg-slate-300 text-sm button-press">Select</button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    return (
        <div className="p-10 page-enter">
            <button onClick={handleBackToSelection} className="text-primary-600 hover:underline mb-8">&larr; Back to Client Selection</button>
            <div className="max-w-4xl mx-auto">
                <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/50 shadow-premium p-8">
                    {/* Pre-Call State */}
                    {callStatus === 'pre-call' && selectedClient && (
                         <div className="text-center py-10 animate-scale-in">
                            <UserCircleIcon className="w-24 h-24 text-slate-300 mx-auto" />
                            <h3 className="text-2xl font-bold text-slate-800 mt-4">{selectedClient.firstName} {selectedClient.lastName}</h3>
                            <p className="text-slate-500 mt-1">Ready to start a live voice conversation?</p>
                            <button onClick={handleStartCall} className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-emerald-700 transition-transform hover:scale-105 button-press flex items-center mx-auto mt-6">
                                <MicrophoneIcon className="w-6 h-6 mr-2" /> Start Conversation
                            </button>
                        </div>
                    )}
                    
                    {/* Active Call States */}
                    {(callStatus === 'connecting' || callStatus === 'active') && selectedClient && (
                        <div>
                            <div className="text-center">
                                <p className="text-slate-500">Live conversation with</p>
                                <h2 className="text-3xl font-bold text-slate-800">{selectedClient.firstName} {selectedClient.lastName}</h2>
                                {callStatus === 'active' ? (
                                    <div className="mt-2 h-14"><Waveform /></div>
                                ) : (
                                    <div className="mt-2 text-slate-600 h-14 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-700 mr-3"></div>
                                        Connecting...
                                    </div>
                                )}
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Live Transcript</label>
                                    <div ref={transcriptEndRef} className="h-64 p-3 bg-slate-100/70 border border-slate-200/80 rounded-lg overflow-y-auto text-sm space-y-2">
                                        {transcript.map((t, i) => <p key={i}><strong className={t.speaker === 'user' ? 'text-primary-700' : 'text-slate-700'}>{t.speaker === 'user' ? 'You:' : `${selectedClient.firstName}:`}</strong> {t.text}</p>)}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Manual Notes</label>
                                    <textarea value={callNotes} onChange={(e) => setCallNotes(e.target.value)} rows={10} className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50" placeholder="Type your notes here..."></textarea>
                                </div>
                            </div>
                            <div className="flex justify-center mt-6">
                                <button onClick={handleEndCall} className="bg-rose-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-rose-700 transition-transform hover:scale-105 button-press flex items-center">
                                    <PhoneHangupIcon className="w-6 h-6 mr-2" /> End & Summarize
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Post-Call State */}
                    {(callStatus === 'summarizing' || callStatus === 'complete') && selectedClient && (
                         <div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">Post-Call Summary</h2>
                            {callStatus === 'summarizing' && (
                                <div className="text-center py-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                                    <p className="text-slate-600">AI is summarizing your conversation...</p>
                                </div>
                            )}
                            {callStatus === 'complete' && (
                                <div className="space-y-4 animate-scale-in">
                                    {summary ? (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1.5">AI-Generated Summary</label>
                                            <div className="p-4 bg-slate-100/80 rounded-lg border border-slate-200/80 prose prose-sm max-w-none">
                                                <h4>Summary</h4>
                                                <p>{summary.profileSummary}</p>
                                                <h4>Next Steps</h4>
                                                <ul>{summary.nextSteps.map((step: string, i: number) => <li key={i}>{step}</li>)}</ul>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-500 bg-slate-100 p-4 rounded-lg">No summary could be generated from the conversation.</p>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-between mt-8">
                                <button onClick={handleBackToSelection} className="bg-slate-200 text-slate-700 font-semibold px-6 py-2 rounded-lg hover:bg-slate-300 button-press">
                                    Make Another Call
                                </button>
                                <button onClick={handleSaveAndExit} className="bg-emerald-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-emerald-700 button-press flex items-center">
                                    <CheckCircleIcon className="w-5 h-5 mr-2" /> Save & Exit
                                </button>
                            </div>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AICallAssistantView;