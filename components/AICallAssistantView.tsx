import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from "@google/genai";
import { Client, Interaction, InteractionType, ClientStatus } from '../types';
import { PhoneIcon, SearchIcon, UserCircleIcon, CheckCircleIcon, AiSparklesIcon, SpeakerOnIcon, SpeakerOffIcon, StopCircleIcon, PhoneHangupIcon } from './icons';
import { useToast } from '../contexts/ToastContext';
import { summarizeOnboardingConversation } from '../services/geminiService'; // Reusing this for summarization

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

// --- Component Props ---
interface AICallAssistantViewProps {
  clients: Client[];
  onSaveInteraction: (interaction: Omit<Interaction, 'id'>) => void;
  onNavigate: (view: string) => void;
}

const Waveform = () => (
    <div className="flex items-center justify-center h-8 gap-1">
        <div className="w-1 h-6 bg-emerald-400 rounded-full waveform-bar"></div>
        <div className="w-1 h-8 bg-emerald-400 rounded-full waveform-bar"></div>
        <div className="w-1 h-5 bg-emerald-400 rounded-full waveform-bar"></div>
        <div className="w-1 h-7 bg-emerald-400 rounded-full waveform-bar"></div>
        <div className="w-1 h-6 bg-emerald-400 rounded-full waveform-bar"></div>
    </div>
);


const AICallAssistantView: React.FC<AICallAssistantViewProps> = ({ clients, onSaveInteraction, onNavigate }) => {
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useToast();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    // Call state
    const [callStatus, setCallStatus] = useState<'idle' | 'dialing' | 'connecting' | 'active' | 'summarizing' | 'complete'>('idle');
    const [transcript, setTranscript] = useState<{ speaker: 'Agent' | 'Client'; text: string }[]>([]);
    const [summary, setSummary] = useState<any | null>(null);
    const [callDuration, setCallDuration] = useState(0);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);

    // Gemini Live API state
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const callTimerRef = useRef<number | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const nextStartTimeRef = useRef(0);
    const outputGainNodeRef = useRef<GainNode | null>(null);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);
    
    const leads = useMemo(() => clients.filter(c => c.status === ClientStatus.LEAD), [clients]);

    const filteredLeads = useMemo(() =>
        leads.filter(lead =>
            `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchTerm.toLowerCase())
        ), [leads, searchTerm]
    );

    const cleanupAudio = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        if (inputAudioContextRef.current?.state !== 'closed') {
            inputAudioContextRef.current?.close();
        }
        if (outputAudioContextRef.current?.state !== 'closed') {
            outputAudioContextRef.current?.close();
        }
        if (callTimerRef.current) clearInterval(callTimerRef.current);
    }, []);

    useEffect(() => {
        return () => cleanupAudio();
    }, [cleanupAudio]);
    
    useEffect(() => {
        if (outputGainNodeRef.current && outputAudioContextRef.current) {
            outputGainNodeRef.current.gain.setValueAtTime(isSpeakerOn ? 1 : 0, outputAudioContextRef.current.currentTime);
        }
    }, [isSpeakerOn]);

    const startCall = async () => {
        if (!selectedClient) return;

        setCallStatus('dialing');
        setTimeout(() => {
            setCallStatus('connecting');
        }, 1500); // Simulate dialing delay

        setTranscript([]);
        setSummary(null);
        setCallDuration(0);
        nextStartTimeRef.current = 0;
        sourcesRef.current.clear();
        let currentInputTranscription = '';
        let currentOutputTranscription = '';

        try {
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            outputGainNodeRef.current = outputAudioContextRef.current.createGain();
            outputGainNodeRef.current.connect(outputAudioContextRef.current.destination);
            outputGainNodeRef.current.gain.value = isSpeakerOn ? 1 : 0;
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setCallStatus('active');
                        callTimerRef.current = window.setInterval(() => setCallDuration(d => d + 1), 1000);
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
                            currentOutputTranscription += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscription += message.serverContent.inputTranscription.text;
                        }

                        if (message.serverContent?.turnComplete) {
                            if(currentInputTranscription.trim()) {
                                setTranscript(prev => [...prev, { speaker: 'Agent', text: currentInputTranscription.trim() }]);
                            }
                            if(currentOutputTranscription.trim()) {
                                setTranscript(prev => [...prev, { speaker: 'Client', text: currentOutputTranscription.trim() }]);
                            }
                            currentInputTranscription = '';
                            currentOutputTranscription = '';
                        }
                        
                        const interrupted = message.serverContent?.interrupted;
                        if (interrupted) {
                            for (const source of sourcesRef.current.values()) {
                                source.stop();
                                sourcesRef.current.delete(source);
                            }
                            nextStartTimeRef.current = 0;
                        }
                        
                        const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (audio && outputAudioContextRef.current) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audio), outputAudioContextRef.current, 24000, 1);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputGainNodeRef.current!);
                            source.addEventListener('ended', () => sourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => { addToast('Call Error', 'An error occurred during the call.', 'error'); setCallStatus('idle'); cleanupAudio(); },
                    onclose: () => { console.log('Session closed'); if (callStatus !== 'idle') endCall(false); },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    systemInstruction: `You are an AI assistant for New Holland Financial Group, performing a follow-up call with a lead named ${selectedClient.firstName}. Your goal is to be friendly, re-engage them, ask if they had a chance to review any information previously sent, and see if they have any new questions or are ready to move forward. Keep your responses natural and concise.`,
                },
            });

        } catch (error) {
            console.error(error);
            addToast('Audio Error', 'Could not access microphone. Please grant permission and try again.', 'error');
            setCallStatus('idle');
        }
    };

    const endCall = useCallback(async (shouldSummarize = true) => {
        cleanupAudio();
        setCallStatus(shouldSummarize ? 'summarizing' : 'complete');

        if (shouldSummarize && transcript.length > 0) {
            try {
                const fullTranscript = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
                const result = await summarizeOnboardingConversation(fullTranscript);
                setSummary(result);
                addToast('Summary Generated', 'The call summary is ready for review.', 'success');
            } catch (error) {
                addToast('Summarization Failed', 'Could not generate call summary.', 'error');
            }
        }
        setCallStatus('complete');
    }, [cleanupAudio, transcript, addToast]);

    const handleInterrupt = () => {
        if (callStatus !== 'active') return;
        for (const source of sourcesRef.current.values()) {
            source.stop();
            sourcesRef.current.delete(source);
        }
        nextStartTimeRef.current = 0;
        addToast('Interrupted', 'AI voice has been stopped.', 'info');
    };
    
    const handleSaveAndExit = () => {
        if (!selectedClient || !summary) return;

        const summaryInteraction: Omit<Interaction, 'id' | 'clientId'> = {
            type: InteractionType.CALL,
            date: new Date().toISOString().split('T')[0],
            summary: `AI Call Summary:\n\n${summary.profileSummary}\n\nIdentified Needs:\n- ${summary.identifiedNeeds?.join('\n- ')}\n\nNext Steps:\n- ${summary.nextSteps?.join('\n- ')}`
        };

        const transcriptInteraction: Omit<Interaction, 'id' | 'clientId'> = {
            type: InteractionType.NOTE,
            date: new Date().toISOString().split('T')[0],
            summary: `AI Call Transcript:\n\n${transcript.map(t => `${t.speaker}: ${t.text}`).join('\n')}`
        };

        onSaveInteraction({ ...summaryInteraction, clientId: selectedClient.id });
        onSaveInteraction({ ...transcriptInteraction, clientId: selectedClient.id });
        
        onNavigate(`client/${selectedClient.id}`);
    };
    
    if (!selectedClient) {
        return (
          <div className="p-10 page-enter">
            <h1 className="text-4xl font-extrabold text-slate-800 mb-2">AI Lead Follow-up Assistant</h1>
            <p className="text-slate-500 mb-8">Select a lead to place an automated follow-up call.</p>
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
                <div key={lead.id} onClick={() => setSelectedClient(lead)} className="p-5 bg-white/70 backdrop-blur-lg border border-white/50 rounded-2xl cursor-pointer hover:border-primary-500/50 hover:shadow-premium-lg hover:-translate-y-1 transition-all row-enter">
                  <p className="font-semibold text-slate-800">{lead.firstName} {lead.lastName}</p>
                  <p className="text-sm text-slate-500">{lead.email}</p>
                </div>
              ))}
            </div>
          </div>
        );
    }

    return (
        <div className="p-10 page-enter">
            <button onClick={() => setSelectedClient(null)} className="text-primary-600 hover:underline mb-8">&larr; Back to Lead Selection</button>
            <div className="max-w-5xl mx-auto">
                <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/50 shadow-premium p-8">
                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-200/80">
                        <div>
                            <p className="text-sm text-slate-500">AI Follow-up Call with</p>
                            <h2 className="text-3xl font-bold text-slate-800">{selectedClient.firstName} {selectedClient.lastName}</h2>
                        </div>
                        <div className="text-right">
                             <div className="flex items-center text-xl font-mono text-slate-700 bg-slate-200/50 px-3 py-1 rounded-lg">
                                 <span>{String(Math.floor(callDuration / 60)).padStart(2, '0')}</span>
                                 <span>:</span>
                                 <span>{String(callDuration % 60).padStart(2, '0')}</span>
                             </div>
                        </div>
                    </div>

                    {callStatus === 'idle' && (
                        <div className="text-center py-10">
                            <label className="text-sm font-medium text-slate-600">Calling:</label>
                            <input type="text" readOnly value={selectedClient.phone} className="text-center text-lg font-semibold text-slate-800 bg-slate-100 rounded-md px-3 py-1 mt-1 mb-4 border border-slate-300" />
                            <p className="text-slate-600 mb-6 max-w-lg mx-auto">The AI will simulate a follow-up call with {selectedClient.firstName}. You will be able to speak naturally, and your voice will be transcribed in real-time.</p>
                            <button onClick={startCall} className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-emerald-700 transition-transform hover:scale-105 button-press flex items-center mx-auto">
                                <PhoneIcon className="w-6 h-6 mr-2" /> Start Follow-up Call
                            </button>
                        </div>
                    )}

                    {(callStatus === 'dialing' || callStatus === 'connecting' || callStatus === 'active') && (
                         <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center text-emerald-600 font-semibold">
                                    {callStatus === 'dialing' && <div className="animate-pulse">Dialing...</div>}
                                    {callStatus === 'connecting' && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600 mr-2"></div>}
                                    {callStatus === 'active' && <div className="relative flex items-center justify-center w-5 h-5 mr-2"><div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></div><PhoneIcon className="w-5 h-5" /></div>}
                                    {callStatus === 'connecting' ? 'Connecting...' : callStatus === 'active' ? 'Call Active' : ''}
                                </div>
                                {callStatus === 'active' && <Waveform />}
                            </div>
                            <div className="p-4 bg-slate-100/50 rounded-lg h-80 overflow-y-auto border border-slate-200/50">
                                <h3 className="text-sm font-semibold text-slate-600 mb-2">Live Transcript</h3>
                                <div className="space-y-3" ref={transcriptEndRef}>
                                    {transcript.map((entry, i) => (
                                        <div key={i} className={`flex ${entry.speaker === 'Client' ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`max-w-md p-3 rounded-2xl ${entry.speaker === 'Client' ? 'bg-slate-200 text-slate-800 rounded-bl-none' : 'bg-primary-600 text-white rounded-br-none'}`}>
                                                <p className="text-sm">{entry.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {transcript.length === 0 && <p className="text-slate-400 text-center pt-8">Live transcript will appear here...</p>}
                                </div>
                            </div>
                             <div className="flex justify-center items-center gap-4 pt-4 bg-white/50 p-4 rounded-b-lg -m-8 mt-4 border-t border-slate-200/50">
                                <button onClick={() => setIsSpeakerOn(prev => !prev)} className="bg-slate-200 text-slate-700 w-14 h-14 flex items-center justify-center rounded-full shadow-sm hover:bg-slate-300 button-press" title={isSpeakerOn ? "Mute Speaker" : "Unmute Speaker"}>
                                    {isSpeakerOn ? <SpeakerOnIcon className="w-6 h-6"/> : <SpeakerOffIcon className="w-6 h-6" />}
                                </button>
                                <button onClick={handleInterrupt} className="bg-slate-200 text-slate-700 w-14 h-14 flex items-center justify-center rounded-full shadow-sm hover:bg-slate-300 button-press" title="Interrupt AI Voice">
                                    <StopCircleIcon className="w-6 h-6" />
                                </button>
                                <button onClick={() => endCall()} className="bg-rose-600 text-white w-14 h-14 flex items-center justify-center rounded-full shadow-lg hover:bg-rose-700 transition-transform hover:scale-105 button-press">
                                    <PhoneHangupIcon className="w-7 h-7" />
                                </button>
                            </div>
                         </div>
                    )}
                    
                    {(callStatus === 'summarizing' || callStatus === 'complete') && (
                        <div>
                             <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                <div className="lg:col-span-2 space-y-4">
                                    <h3 className="text-xl font-bold text-slate-800">Final Transcript</h3>
                                    <div className="p-4 bg-slate-100/50 rounded-lg h-[400px] overflow-y-auto border border-slate-200/50">
                                        {transcript.map((t, i) => <p key={i} className={`mb-2 ${t.speaker === 'Client' ? 'text-slate-800' : 'text-primary-700'}`}><strong>{t.speaker}:</strong> {t.text}</p>)}
                                    </div>
                                </div>
                                <div className="lg:col-span-3 space-y-4">
                                    <h3 className="text-xl font-bold text-slate-800">AI-Generated Summary & Actions</h3>
                                    <div className="p-4 bg-slate-100/50 rounded-lg h-[400px] overflow-y-auto border border-slate-200/50">
                                        {callStatus === 'summarizing' && <p className="text-slate-500 animate-pulse">Generating summary...</p>}
                                        {summary ? (
                                            <div className="prose prose-sm max-w-none">
                                                <h4>Call Synopsis</h4>
                                                <p>{summary.profileSummary}</p>
                                                <h4>Identified Needs & Objections</h4>
                                                <ul>{summary.identifiedNeeds.map((need: string, i: number) => <li key={i}>{need}</li>)}</ul>
                                                <h4>Actionable Next Steps</h4>
                                                <ul>{summary.nextSteps.map((step: string, i: number) => <li key={i}>{step}</li>)}</ul>
                                            </div>
                                        ) : callStatus === 'complete' && <p className="text-slate-500">No summary was generated for this call.</p>}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-4 pt-8">
                                <button onClick={() => setCallStatus('idle')} className="bg-slate-200 text-slate-700 font-semibold px-6 py-2 rounded-lg hover:bg-slate-300 button-press">
                                    Start New Call
                                </button>
                                <button onClick={handleSaveAndExit} disabled={!summary} className="bg-primary-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-primary-700 disabled:bg-slate-400 button-press flex items-center">
                                    <CheckCircleIcon className="w-5 h-5 mr-2" /> Save to Profile & Exit
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