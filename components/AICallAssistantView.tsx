import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Client, Interaction, InteractionType, ClientStatus, Agent, User } from '../types';
import { PhoneIcon, SearchIcon, UserCircleIcon, CheckCircleIcon, AiSparklesIcon, PhoneHangupIcon, PlusIcon } from './icons';
import { useToast } from '../contexts/ToastContext';
import { summarizeNotes } from '../services/geminiService';
import * as apiClient from '../services/apiClient';

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
    const [callStatus, setCallStatus] = useState<'idle' | 'pre-call' | 'dialing' | 'active' | 'summarizing' | 'complete'>('idle');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [editablePhoneNumber, setEditablePhoneNumber] = useState('');
    const [agentPhoneNumber, setAgentPhoneNumber] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useToast();
    
    // Call state
    const [callSid, setCallSid] = useState<string | null>(null);
    const [callNotes, setCallNotes] = useState('');
    const [summary, setSummary] = useState<any | null>(null);
    const [callDuration, setCallDuration] = useState(0);
    const callTimerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (callTimerRef.current) clearInterval(callTimerRef.current);
        };
    }, []);

    const leads = useMemo(() => clients.filter(c => c.status === ClientStatus.LEAD || c.status === ClientStatus.ACTIVE), [clients]);

    const filteredLeads = useMemo(() =>
        leads.filter(lead =>
            `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchTerm.toLowerCase())
        ), [leads, searchTerm]
    );
    
    const handleSelectClient = (client: Client) => {
        setSelectedClient(client);
        setEditablePhoneNumber(client.phone || '');
        setAgentPhoneNumber(agent.phone || '');
        setCallStatus('pre-call');
    };

    const handleBackToSelection = () => {
        setSelectedClient(null);
        setCallStatus('idle');
        setCallNotes('');
        setSummary(null);
        setCallDuration(0);
    };

    const handleStartCall = async () => {
        if (!selectedClient || !agentPhoneNumber.trim() || !editablePhoneNumber.trim()) {
            addToast('Missing Information', 'Both your phone number and the client\'s phone number are required.', 'warning');
            return;
        }

        setCallStatus('dialing');

        if (editablePhoneNumber !== selectedClient.phone) {
            try {
                await onUpdateClient(selectedClient.id, { phone: editablePhoneNumber });
                addToast('Client Updated', 'Client phone number has been updated.', 'success');
            } catch (error) {
                addToast('Update Failed', 'Could not update client phone number.', 'error');
                setCallStatus('pre-call');
                return;
            }
        }
        
        try {
            // Simulate dialing agent first
            await new Promise(res => setTimeout(res, 1500));
            setCallStatus('active');
            const { callSid } = await apiClient.startPstnCall({ agentPhone: agentPhoneNumber, clientPhone: editablePhoneNumber });
            setCallSid(callSid);
            callTimerRef.current = window.setInterval(() => setCallDuration(d => d + 1), 1000);
        } catch (error) {
            addToast('Call Failed', 'Could not initiate the call.', 'error');
            setCallStatus('pre-call');
        }
    };

    const handleEndCall = async () => {
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        if (callSid) {
            try {
                await apiClient.endPstnCall({ callSid });
            } catch (error) {
                console.error("Failed to formally end call on backend", error);
            }
        }
        setCallStatus('complete');
    };

    const handleSummarizeNotes = async () => {
        if (!callNotes.trim()) {
            addToast('No Notes', 'There are no notes to summarize.', 'info');
            return;
        }
        setCallStatus('summarizing');
        try {
            const result = await summarizeNotes(callNotes);
            setSummary({ profileSummary: result });
            addToast('Summary Generated', 'AI summary is ready.', 'success');
        } catch (error) {
            addToast('Summarization Failed', 'Could not generate summary.', 'error');
        } finally {
            setCallStatus('complete');
        }
    };

    const handleSaveAndExit = () => {
        if (!selectedClient) return;
        
        const interactions: Omit<Interaction, 'id'|'clientId'>[] = [];

        if (callNotes.trim()) {
            interactions.push({
                type: InteractionType.CALL,
                date: new Date().toISOString().split('T')[0],
                summary: `Call Notes:\n\n${callNotes}`
            });
        }
        
        if (summary?.profileSummary) {
            interactions.push({
                type: InteractionType.NOTE,
                date: new Date().toISOString().split('T')[0],
                summary: `AI Call Summary:\n\n${summary.profileSummary}`
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
                <p className="text-slate-500 mb-8">Select a client or lead to place a call.</p>
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
            <div className="max-w-3xl mx-auto">
                <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/50 shadow-premium p-8">
                    {/* Pre-Call State */}
                    {callStatus === 'pre-call' && selectedClient && (
                         <div className="text-center py-10 animate-scale-in">
                            <UserCircleIcon className="w-24 h-24 text-slate-300 mx-auto" />
                            <h3 className="text-2xl font-bold text-slate-800 mt-4">{selectedClient.firstName} {selectedClient.lastName}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto mt-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Phone Number</label>
                                    <input type="tel" value={agentPhoneNumber} onChange={(e) => setAgentPhoneNumber(e.target.value)} className="w-full text-center text-lg font-semibold text-slate-800 bg-white border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Client's Phone Number</label>
                                    <input type="tel" value={editablePhoneNumber} onChange={(e) => setEditablePhoneNumber(e.target.value)} className="w-full text-center text-lg font-semibold text-slate-800 bg-white border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                                </div>
                            </div>
                            <p className="text-slate-600 mt-6 max-w-md mx-auto text-sm">The system will call your number first, then connect you to the client.</p>
                            <button onClick={handleStartCall} className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-emerald-700 transition-transform hover:scale-105 button-press flex items-center mx-auto mt-6">
                                <PhoneIcon className="w-6 h-6 mr-2" /> Start Call
                            </button>
                        </div>
                    )}
                    
                    {/* Active Call States */}
                    {(callStatus === 'dialing' || callStatus === 'active') && selectedClient && (
                        <div>
                            <div className="text-center">
                                <p className="text-slate-500">{callStatus === 'dialing' ? 'Dialing your phone...' : `On call with`}</p>
                                <h2 className="text-3xl font-bold text-slate-800">{selectedClient.firstName} {selectedClient.lastName}</h2>
                                <div className="font-mono text-2xl text-slate-700 mt-2">{String(Math.floor(callDuration / 60)).padStart(2, '0')}:{String(callDuration % 60).padStart(2, '0')}</div>
                                {callStatus === 'active' && <Waveform />}
                            </div>
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Call Notes</label>
                                <textarea value={callNotes} onChange={(e) => setCallNotes(e.target.value)} rows={8} className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50" placeholder="Type your notes here..."></textarea>
                            </div>
                            <div className="flex justify-center mt-6">
                                <button onClick={handleEndCall} className="bg-rose-600 text-white w-16 h-16 flex items-center justify-center rounded-full shadow-lg hover:bg-rose-700 transition-transform hover:scale-105 button-press">
                                    <PhoneHangupIcon className="w-8 h-8" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Post-Call State */}
                    {(callStatus === 'summarizing' || callStatus === 'complete') && selectedClient && (
                         <div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">Post-Call Summary</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Call Notes</label>
                                    <textarea value={callNotes} onChange={(e) => setCallNotes(e.target.value)} rows={6} className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50"></textarea>
                                </div>
                                <button onClick={handleSummarizeNotes} disabled={callStatus === 'summarizing'} className="flex items-center bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-primary-700 disabled:bg-slate-400">
                                    {callStatus === 'summarizing' ? 'Summarizing...' : <><AiSparklesIcon className="w-5 h-5 mr-2" /> AI Summarize Notes</>}
                                </button>
                                {summary && (
                                    <div className="animate-scale-in">
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">AI-Generated Summary</label>
                                        <div className="p-3 bg-slate-100/80 rounded-lg border border-slate-200/80 prose prose-sm max-w-none">
                                            <p>{summary.profileSummary}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end mt-8">
                                <button onClick={handleSaveAndExit} className="bg-emerald-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-emerald-700 button-press flex items-center">
                                    <CheckCircleIcon className="w-5 h-5 mr-2" /> Save Notes & Exit
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