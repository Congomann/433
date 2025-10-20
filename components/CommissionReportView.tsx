import React, { useState, useMemo } from 'react';
import { Agent, Policy, Chargeback, Client, UserRole, User, AgentStatus } from '../types';
import SummaryCard from './SummaryCard';
import { DollarSignIcon, ExclamationTriangleIcon, ShieldIcon } from './icons';

// Props for the new component
interface CommissionReportViewProps {
  currentUser: User;
  agents: Agent[];
  policies: Policy[];
  clients: Client[];
  chargebacks: Chargeback[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const CommissionReportView: React.FC<CommissionReportViewProps> = ({ currentUser, agents, policies, clients, chargebacks }) => {
    const [selectedAgentId, setSelectedAgentId] = useState<'all' | number>('all');
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    const clientMap = useMemo(() => {
        return clients.reduce((map, client) => {
            map[client.id] = `${client.firstName} ${client.lastName}`;
            return map;
        }, {} as Record<number, string>);
    }, [clients]);
    
    const agentMap = useMemo(() => {
        return agents.reduce((map, agent) => {
            map[agent.id] = agent;
            return map;
        }, {} as Record<number, Agent>);
    }, [agents]);

    const filteredData = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the whole end day

        const relevantAgents = selectedAgentId === 'all'
            ? agents.filter(a => a.status === AgentStatus.ACTIVE)
            : agents.filter(a => a.id === selectedAgentId);
        const relevantAgentIds = new Set(relevantAgents.map(a => a.id));

        const commissionPolicies = policies.filter(p => {
            const policyDate = new Date(p.startDate);
            const client = clients.find(c => c.id === p.clientId);
            return client && client.agentId && relevantAgentIds.has(client.agentId) && policyDate >= start && policyDate <= end;
        });

        const commissionDetails = commissionPolicies.map(policy => {
            const agent = agentMap[clients.find(c => c.id === policy.clientId)?.agentId!];
            if (!agent) return null;
            const commissionAmount = policy.annualPremium * agent.commissionRate;
            return {
                ...policy,
                agentName: agent.name,
                clientName: clientMap[policy.clientId] || 'Unknown',
                commissionRate: agent.commissionRate,
                commissionAmount,
            };
        }).filter((p): p is Policy & { agentName: string; clientName: string; commissionRate: number; commissionAmount: number } => p !== null);

        const relevantChargebacks = chargebacks.filter(c => {
            const chargebackDate = new Date(c.cancellationDate);
            return relevantAgentIds.has(c.agentId) && chargebackDate >= start && chargebackDate <= end;
        });

        const totalGrossCommission = commissionDetails.reduce((sum, item) => sum + item.commissionAmount, 0);
        const totalChargebacks = relevantChargebacks.reduce((sum, item) => sum + item.debtAmount, 0);
        const totalNetCommission = totalGrossCommission - totalChargebacks;
        
        return {
            totalGrossCommission,
            totalChargebacks,
            totalNetCommission,
            commissionDetails,
            chargebacks: relevantChargebacks,
        };

    }, [selectedAgentId, startDate, endDate, agents, policies, clients, chargebacks, clientMap, agentMap]);

    return (
        <div className="p-6 sm:p-10 page-enter">
            <h1 className="text-4xl font-extrabold text-slate-800 mb-2">Commission Report</h1>
            <p className="text-slate-500 mb-8">Detailed breakdown of agent commissions and chargebacks.</p>

            {/* Filter Section */}
            <div className="mb-8 p-6 bg-white/70 backdrop-blur-lg rounded-2xl border border-white/50 shadow-premium flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 w-full md:w-auto">
                    <label htmlFor="agent-filter" className="block text-sm font-medium text-slate-700 mb-1">Agent</label>
                    <select id="agent-filter" value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                        <option value="all">All Agents</option>
                        {agents.filter(a => a.status === AgentStatus.ACTIVE).map(agent => (
                            <option key={agent.id} value={agent.id}>{agent.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 w-full md:w-auto">
                    <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                    <input type="date" id="start-date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
                </div>
                 <div className="flex-1 w-full md:w-auto">
                    <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                    <input type="date" id="end-date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white" />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <SummaryCard title="Gross Commission" value={formatCurrency(filteredData.totalGrossCommission)} icon={<ShieldIcon className="w-8 h-8" />} />
                <SummaryCard title="Total Chargebacks" value={formatCurrency(filteredData.totalChargebacks)} icon={<ExclamationTriangleIcon className="w-8 h-8" />} />
                <SummaryCard title="Net Commission" value={formatCurrency(filteredData.totalNetCommission)} icon={<DollarSignIcon className="w-8 h-8" />} />
            </div>

            {/* Commission Details Table */}
            <div className="mb-8 bg-white/70 backdrop-blur-lg rounded-2xl border border-white/50 shadow-premium">
                 <h2 className="text-xl font-bold text-slate-800 p-6 border-b border-slate-200/80">Commission Details</h2>
                 <div className="overflow-x-auto">
                     <table className="min-w-full">
                         <thead className="bg-slate-50/50">
                             <tr>
                                 <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Policy / Client</th>
                                 {selectedAgentId === 'all' && <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Agent</th>}
                                 <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Annual Premium</th>
                                 <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Comm. Rate</th>
                                 <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Commission Earned</th>
                                 <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Policy Start Date</th>
                             </tr>
                         </thead>
                         <tbody>
                            {filteredData.commissionDetails.map(item => (
                                <tr key={item.id} className="border-b border-slate-200/50 last:border-b-0">
                                    <td className="px-6 py-4"><div className="text-sm font-bold text-slate-900">{item.policyNumber}</div><div className="text-xs text-slate-500">{item.clientName}</div></td>
                                    {selectedAgentId === 'all' && <td className="px-6 py-4 text-sm text-slate-600">{item.agentName}</td>}
                                    <td className="px-6 py-4 text-sm text-slate-600">{formatCurrency(item.annualPremium)}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{(item.commissionRate * 100).toFixed(0)}%</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-emerald-700">{formatCurrency(item.commissionAmount)}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{item.startDate}</td>
                                </tr>
                            ))}
                         </tbody>
                     </table>
                     {filteredData.commissionDetails.length === 0 && <p className="text-center p-8 text-slate-500">No commissions found for the selected criteria.</p>}
                 </div>
            </div>
            
            {/* Chargebacks Table */}
            <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/50 shadow-premium">
                 <h2 className="text-xl font-bold text-slate-800 p-6 border-b border-slate-200/80">Chargebacks in Period</h2>
                 <div className="overflow-x-auto">
                    <table className="min-w-full">
                         <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Client</th>
                                 {selectedAgentId === 'all' && <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Agent</th>}
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Policy Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Cancellation Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Debt Amount</th>
                            </tr>
                         </thead>
                         <tbody>
                            {filteredData.chargebacks.map(item => (
                                <tr key={item.id} className="border-b border-slate-200/50 last:border-b-0">
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.clientName}</td>
                                    {selectedAgentId === 'all' && <td className="px-6 py-4 text-sm text-slate-600">{agentMap[item.agentId]?.name}</td>}
                                    <td className="px-6 py-4 text-sm text-slate-600">{item.policyType}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{item.cancellationDate}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-rose-600">{formatCurrency(item.debtAmount)}</td>
                                </tr>
                            ))}
                         </tbody>
                    </table>
                     {filteredData.chargebacks.length === 0 && <p className="text-center p-8 text-slate-500">No chargebacks found for the selected criteria.</p>}
                 </div>
            </div>
        </div>
    );
};

export default CommissionReportView;
