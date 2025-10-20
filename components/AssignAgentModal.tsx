import React, { useState, useMemo, useEffect } from 'react';
import { Client, Agent, AgentStatus, User, UserRole } from '../types';
import { CloseIcon, AiSparklesIcon, UserCircleIcon, CheckCircleIcon } from './icons';

interface AssignAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (clientId: number, agentId: number, updates: Partial<Client>) => void;
  client: Client | null;
  agents: Agent[];
  clients: Client[];
  currentUser: User;
}

const getRecommendedAgent = (agents: Agent[], clients: Client[]): Agent | null => {
    const activeAgents = agents.filter(a => a.status === AgentStatus.ACTIVE);
    if (activeAgents.length === 0) return null;

    const agentWorkloads = activeAgents.map(agent => {
        const workload = clients.filter(c => c.agentId === agent.id).length;
        return { ...agent, workload };
    });

    agentWorkloads.sort((a, b) => a.workload - b.workload);
    return agentWorkloads[0];
};

const AssignAgentModal: React.FC<AssignAgentModalProps> = ({ isOpen, onClose, onAssign, client, agents, clients, currentUser }) => {
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');
    const [address, setAddress] = useState('');

    const recommendedAgent = useMemo(() => getRecommendedAgent(agents, clients), [agents, clients]);
    const activeAgents = useMemo(() => agents.filter(a => a.status === AgentStatus.ACTIVE), [agents]);

    useEffect(() => {
        if (client) {
            setSelectedAgentId(client.agentId?.toString() || '');
            setAddress(client.address || '');
        }
    }, [client]);

    const handleAssign = (agentId: number | null) => {
        if (client && agentId) {
            const updates: Partial<Client> = {};
            if (currentUser.role === UserRole.SUB_ADMIN && address !== (client.address || '')) {
                updates.address = address;
            }
            onAssign(client.id, agentId, updates);
        }
    };

    if (!isOpen || !client) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 modal-backdrop">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-premium-lg p-8 w-full max-w-lg m-4 modal-panel border border-white/50">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Assign Agent</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal" title="Close">
                        <CloseIcon />
                    </button>
                </div>
                <p className="text-slate-600 mb-6">Assign <strong className="text-slate-800">{client.firstName} {client.lastName}</strong> to an agent.</p>
                
                {currentUser.role === UserRole.SUB_ADMIN && (
                    <div className="mb-6">
                        <label htmlFor="address" className="block text-sm font-semibold text-slate-700 mb-2">Client Address (Optional)</label>
                        <input
                            type="text"
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50"
                            placeholder="Enter street and number"
                        />
                    </div>
                )}

                {recommendedAgent && (
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-2 flex items-center">
                            <AiSparklesIcon className="w-5 h-5 mr-2" /> AI Recommendation
                        </h3>
                        <div className="bg-primary-50/70 border-2 border-primary-200 rounded-xl p-4 flex justify-between items-center">
                            <div className="flex items-center">
                                <img src={recommendedAgent.avatar} alt={recommendedAgent.name} className="w-12 h-12 rounded-full mr-4" />
                                <div>
                                    <p className="font-bold text-primary-800">{recommendedAgent.name}</p>
                                    <p className="text-sm text-primary-700">{recommendedAgent.workload} clients assigned</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleAssign(recommendedAgent.id)}
                                className="bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-primary-700 button-press"
                            >
                                Assign
                            </button>
                        </div>
                    </div>
                )}

                <div>
                    <label htmlFor="agent-select" className="block text-sm font-semibold text-slate-700 mb-2">Or, manually select an agent</label>
                    <select
                        id="agent-select"
                        value={selectedAgentId}
                        onChange={(e) => setSelectedAgentId(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50"
                    >
                        <option value="">-- Select an agent --</option>
                        {activeAgents.map(agent => (
                            <option key={agent.id} value={agent.id}>
                                {agent.name} ({clients.filter(c => c.agentId === agent.id).length} clients)
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end items-center gap-3 mt-8 pt-6 border-t border-slate-200/50">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-900 bg-white rounded-lg shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 button-press">Cancel</button>
                    <button
                        onClick={() => handleAssign(Number(selectedAgentId))}
                        disabled={!selectedAgentId}
                        className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg shadow-md hover:bg-emerald-700 flex items-center button-press disabled:bg-slate-400"
                    >
                        <CheckCircleIcon className="w-5 h-5 mr-2" /> Confirm Assignment
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignAgentModal;