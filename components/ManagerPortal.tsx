import React from 'react';
import { Agent, Client, Policy, User } from '../types';
import SummaryCard from './SummaryCard';
import { UsersIcon, ShieldIcon, DollarSignIcon } from './icons';
import AgentPerformanceChart from './AgentPerformanceChart';

interface ManagerPortalProps {
  currentUser: User;
  agents: Agent[];
  clients: Client[];
  policies: Policy[];
  onNavigate: (path: string) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const ManagerPortal: React.FC<ManagerPortalProps> = ({ agents, clients, policies, onNavigate }) => {
  const activeAgents = agents.filter(a => a.status === 'Active');

  const agentPerformanceData = activeAgents.map(agent => {
    const agentClients = clients.filter(c => c.agentId === agent.id);
    const agentClientIds = agentClients.map(c => c.id);
    const agentPolicies = policies.filter(p => agentClientIds.includes(p.clientId) && p.status === 'Active');
    const totalPremium = agentPolicies.reduce((sum, p) => sum + p.annualPremium, 0);
    const overrideEarned = totalPremium * (1 - agent.commissionRate);
    return { ...agent, totalPremium, overrideEarned };
  });

  const totalTeamAP = agentPerformanceData.reduce((sum, a) => sum + a.totalPremium, 0);
  const totalTeamOverride = agentPerformanceData.reduce((sum, a) => sum + a.overrideEarned, 0);

  return (
    <div className="p-10">
      <h1 className="text-4xl font-extrabold text-slate-800 mb-2">Manager Dashboard</h1>
      <p className="text-slate-500 mb-8">An overview of your team's performance and key metrics.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <SummaryCard title="Active Agents" value={activeAgents.length.toString()} icon={<UsersIcon className="w-8 h-8" />} />
        <SummaryCard title="Total Team AP" value={formatCurrency(totalTeamAP)} icon={<ShieldIcon className="w-8 h-8" />} />
        <SummaryCard title="Total Override Earned" value={formatCurrency(totalTeamOverride)} icon={<DollarSignIcon className="w-8 h-8" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-white/70 backdrop-blur-lg p-6 rounded-2xl border border-white/50 shadow-premium card-enter">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Agent Leaderboard</h2>
           <div className="overflow-x-auto">
             <table className="min-w-full">
                <thead className="bg-slate-50/50">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Agent</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Clients</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Total AP Sold</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Agency Override</th>
                    </tr>
                </thead>
                <tbody>
                    {agentPerformanceData.sort((a,b) => b.totalPremium - a.totalPremium).map(agent => (
                        <tr key={agent.id} className="border-b border-slate-200/50 last:border-b-0 hover:bg-slate-100/50">
                            <td className="px-6 py-5 whitespace-nowrap">
                                <button onClick={() => onNavigate(`agent/${agent.slug}`)} className="text-sm font-bold text-primary-600 hover:underline">{agent.name}</button>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">{agent.clientCount}</td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">{formatCurrency(agent.totalPremium)}</td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-emerald-700">{formatCurrency(agent.overrideEarned)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-lg p-6 rounded-2xl border border-white/50 shadow-premium card-enter">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Team Performance Chart</h2>
          <AgentPerformanceChart data={agentPerformanceData} />
        </div>
      </div>
    </div>
  );
};

export default ManagerPortal;
