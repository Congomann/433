import React from 'react';
import { User, Agent, Policy, Client, UserRole, PolicyType, Chargeback, ChargebackStatus } from '../types';
import SummaryCard from './SummaryCard';
import { DollarSignIcon, ShieldIcon, InfoIcon, ExclamationTriangleIcon } from './icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import AgentPerformanceChart from './AgentPerformanceChart';
import { INSURANCE_CARRIERS } from '../constants';

interface CommissionsViewProps {
  currentUser: User;
  agents: Agent[];
  policies: Policy[];
  clients: Client[];
  chargebacks: Chargeback[];
  onUpdatePolicy: (policyId: number, updates: Partial<Omit<Policy, 'id'>>) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
};

const InfoTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
    <div className="relative flex items-center group">
        {children}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-slate-800 text-white text-sm rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
            {text}
             <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-800"></div>
        </div>
    </div>
);

// Agent-specific view props
interface AgentCommissionsProps {
    agent: Agent;
    policies: Policy[];
    clients: Client[];
    chargebacks: Chargeback[];
    onUpdatePolicy: (policyId: number, updates: Partial<Omit<Policy, 'id'>>) => void;
}


// Agent-specific view
const AgentCommissions: React.FC<AgentCommissionsProps> = ({ policies, clients, agent, chargebacks, onUpdatePolicy }) => {
    const agentClientIds = clients.filter(c => c.agentId === agent.id).map(c => c.id);
    const agentPolicies = policies.filter(p => agentClientIds.includes(p.clientId) && p.status === 'Active');
    const totalPremium = agentPolicies.reduce((sum, p) => sum + p.annualPremium, 0);

    const agentChargebacks = chargebacks.filter(c => c.agentId === agent.id);
    const totalUnpaidDebt = agentChargebacks
        .filter(c => c.status === ChargebackStatus.UNPAID)
        .reduce((sum, c) => sum + c.debtAmount, 0);
    
    const totalCommission = (totalPremium * agent.commissionRate) - totalUnpaidDebt;

    const commissionByPolicyType = agentPolicies.reduce((acc, policy) => {
        const commission = policy.annualPremium * agent.commissionRate;
        acc[policy.type] = (acc[policy.type] || 0) + commission;
        return acc;
    }, {} as Record<PolicyType, number>);

    const chartData = Object.entries(commissionByPolicyType).map(([name, value]) => ({ name, Commission: value }));
    const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc'];


    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <SummaryCard title="Total AP Sold" value={formatCurrency(totalPremium)} icon={<ShieldIcon className="w-8 h-8" />} style={{animationDelay: '0.1s'}} />
                <SummaryCard 
                    title={
                        <div className="flex items-center">
                            Commission Rate
                            <InfoTooltip text="This is the percentage of the Annual Premium (AP) you earn as commission for each policy you sell.">
                                <InfoIcon className="w-4 h-4 ml-2 text-slate-400" />
                            </InfoTooltip>
                        </div>
                    } 
                    value={`${(agent.commissionRate * 100)}%`} 
                    icon={<DollarSignIcon className="w-8 h-8" />} 
                    style={{animationDelay: '0.2s'}}
                />
                 <SummaryCard title="Active Debt" value={formatCurrency(totalUnpaidDebt)} icon={<ExclamationTriangleIcon className="w-8 h-8" />} style={{animationDelay: '0.3s'}} />
                <SummaryCard title="Net Commission Earned" value={formatCurrency(totalCommission)} icon={<DollarSignIcon className="w-8 h-8" />} style={{animationDelay: '0.4s'}} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white/70 backdrop-blur-lg p-6 rounded-2xl border border-white/50 shadow-premium card-enter" style={{animationDelay: '0.4s'}}>
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Commission Breakdown by Policy</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Policy</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Carrier</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Annual Premium</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Comm. Rate</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Commission Earned</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agentPolicies.map(policy => (
                                    <tr key={policy.id} className="border-b border-slate-200/50 last:border-b-0 hover:bg-slate-100/50">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="text-sm font-bold text-slate-900">{policy.policyNumber}</div>
                                            <div className="text-xs text-slate-500">{policy.type}</div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">{policy.carrier || 'N/A'}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">{formatCurrency(policy.annualPremium)}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">{(agent.commissionRate * 100)}%</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-emerald-700">{formatCurrency(policy.annualPremium * agent.commissionRate)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white/70 backdrop-blur-lg p-6 rounded-2xl border border-white/50 shadow-premium card-enter" style={{animationDelay: '0.5s'}}>
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Commissions by Type</h2>
                    <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                            <XAxis type="number" tickFormatter={(value) => formatCurrency(Number(value))} tick={{ fill: '#64748b' }} />
                            <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#475569', fontSize: 12 }} />
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(5px)', borderRadius: '0.75rem', borderColor: '#e0e7ff' }}/>
                            <Bar dataKey="Commission" fill="#818cf8" radius={[0, 4, 4, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
}

// Admin-specific view
const AdminCommissions: React.FC<Omit<CommissionsViewProps, 'currentUser' | 'onUpdatePolicy'>> = ({ agents, policies, clients }) => {
    // For each agent, calculate their total premium sold and the override commission earned by the agency.
    const agentData = agents.map(agent => {
        // Find clients for the current agent being mapped.
        const agentClientIds = clients.filter(c => c.agentId === agent.id).map(c => c.id);
        
        // Filter for active policies belonging to those clients.
        const agentPolicies = policies.filter(p => agentClientIds.includes(p.clientId) && p.status === 'Active');
        
        // Sum the annual premium of all active policies for the agent.
        const totalPremium = agentPolicies.reduce((sum, p) => sum + p.annualPremium, 0);
        
        // The override is the portion of the premium not paid to the agent.
        const agencyOverride = totalPremium * (1 - agent.commissionRate);
        
        return {
            ...agent,
            totalPremium,
            agencyOverride,
        };
    });

    // Sum the totals for the entire agency.
    const totalAgencyPremium = agentData.reduce((sum, a) => sum + a.totalPremium, 0);
    const totalOverride = agentData.reduce((sum, a) => sum + a.agencyOverride, 0);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <SummaryCard title="Total Agency AP" value={formatCurrency(totalAgencyPremium)} icon={<ShieldIcon className="w-8 h-8" />} style={{animationDelay: '0.1s'}} />
                <SummaryCard title="Total Agency Override" value={formatCurrency(totalOverride)} icon={<DollarSignIcon className="w-8 h-8" />} style={{animationDelay: '0.2s'}} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                 <div className="lg:col-span-3 bg-white/70 backdrop-blur-lg p-6 rounded-2xl border border-white/50 shadow-premium card-enter" style={{animationDelay: '0.3s'}}>
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Agent Performance Breakdown</h2>
                    <div className="overflow-x-auto">
                         <table className="min-w-full">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Agent</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Comm. Rate</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Total AP Sold</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Agent Commission</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Agency Override</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agentData.map(agent => (
                                    <tr key={agent.id} className="border-b border-slate-200/50 last:border-b-0 hover:bg-slate-100/50">
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-slate-900">{agent.name}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">{agent.commissionRate * 100}%</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">{formatCurrency(agent.totalPremium)}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">{formatCurrency(agent.totalPremium * agent.commissionRate)}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-emerald-700">{formatCurrency(agent.agencyOverride)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white/70 backdrop-blur-lg p-6 rounded-2xl border border-white/50 shadow-premium card-enter" style={{animationDelay: '0.4s'}}>
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Agent Performance Overview</h2>
                    <AgentPerformanceChart data={agentData.map(a => ({...a, overrideEarned: a.agencyOverride}))} />
                </div>
            </div>
        </>
    );
};


const CommissionsView: React.FC<CommissionsViewProps> = ({ currentUser, agents, policies, clients, chargebacks, onUpdatePolicy }) => {
  return (
    <div className="p-6 sm:p-10">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-800">Commissions</h1>
        <p className="text-lg text-slate-500 mt-1">Track your earnings and agency performance.</p>
      </div>
      {currentUser.role === UserRole.AGENT ? (
        (() => {
          const agent = agents.find(a => a.id === currentUser.id);
          if (!agent) {
            return <div className="p-4 bg-rose-100 text-rose-700 rounded-lg">Error: Your agent profile could not be found. You may have been removed from the system.</div>;
          }
          return <AgentCommissions agent={agent} policies={policies} clients={clients} chargebacks={chargebacks} onUpdatePolicy={onUpdatePolicy} />;
        })()
      ) : (
        <AdminCommissions agents={agents} policies={policies} clients={clients} chargebacks={chargebacks} />
      )}
    </div>
  );
};

export default CommissionsView;