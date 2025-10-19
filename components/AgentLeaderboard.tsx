import React, { useMemo } from 'react';
import { Agent, Client, Policy, PolicyUnderwritingStatus } from '../types';
import { TrophyIcon } from './icons';

interface AgentLeaderboardProps {
  agents: Agent[];
  clients: Client[];
  policies: Policy[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const AgentLeaderboard: React.FC<AgentLeaderboardProps> = ({ agents, clients, policies }) => {
  const leaderboardData = useMemo(() => {
    const activeAgents = agents.filter(a => a.status === 'Active');

    const performanceData = activeAgents.map(agent => {
      const agentClients = clients.filter(c => c.agentId === agent.id);
      const agentClientIds = agentClients.map(c => c.id);
      const agentPolicies = policies.filter(p => agentClientIds.includes(p.clientId));

      const activePolicies = agentPolicies.filter(p => p.status === 'Active');
      const totalPremium = activePolicies.reduce((sum, p) => sum + p.annualPremium, 0);

      const approvedPoliciesCount = agentPolicies.filter(p => p.underwritingStatus === PolicyUnderwritingStatus.APPROVED).length;

      return {
        ...agent,
        clientCount: agentClients.length,
        totalPremium,
        approvedPoliciesCount,
      };
    });

    return performanceData.sort((a, b) => {
        if (b.totalPremium !== a.totalPremium) {
            return b.totalPremium - a.totalPremium;
        }
        return b.approvedPoliciesCount - a.approvedPoliciesCount;
    });
  }, [agents, clients, policies]);

  const getRankIndicator = (rank: number) => {
    const rankColors: { [key: number]: string } = {
      1: 'text-amber-400',
      2: 'text-slate-400',
      3: 'text-amber-600',
    };
    const rankColor = rank <= 3 ? rankColors[rank] : 'text-slate-500';

    if (rank <= 3) {
      return <TrophyIcon className={`w-8 h-8 ${rankColor}`} />;
    }
    return <span className={`text-2xl font-bold ${rankColor}`}>#{rank}</span>;
  };

  return (
    <div className="p-6 sm:p-10 page-enter">
      <div className="flex items-center mb-8">
        <TrophyIcon className="w-10 h-10 text-primary-600 mr-4" />
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800">Agent Leaderboard</h1>
          <p className="text-slate-500 mt-1">Ranking agents by total Annual Premium (AP) sold.</p>
        </div>
      </div>

      <div className="space-y-4">
        {leaderboardData.map((agent, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;

          return (
            <div
              key={agent.id}
              className={`bg-white/70 backdrop-blur-lg rounded-2xl border transition-all duration-300 row-enter ${
                isTop3 ? 'shadow-premium-lg border-primary-200' : 'shadow-premium border-white/50'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-4 flex items-center gap-4">
                <div className="w-16 flex-shrink-0 flex items-center justify-center">
                  {getRankIndicator(rank)}
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-5 items-center gap-4">
                  {/* Agent Info */}
                  <div className="sm:col-span-2 flex items-center">
                    <img src={agent.avatar} alt={agent.name} className="w-12 h-12 rounded-full mr-4 border-2 border-slate-200" />
                    <div>
                      <p className="font-bold text-slate-800">{agent.name}</p>
                      <p className="text-sm text-slate-500">{agent.location}</p>
                    </div>
                  </div>
                  {/* Stats */}
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-semibold text-slate-500">Clients</p>
                    <p className="text-lg font-bold text-slate-700">{agent.clientCount}</p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-semibold text-slate-500">Approved Policies</p>
                    <p className="text-lg font-bold text-slate-700">{agent.approvedPoliciesCount}</p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-semibold text-slate-500">Total AP Sold</p>
                    <p className="text-lg font-bold text-emerald-600">{formatCurrency(agent.totalPremium)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentLeaderboard;