import React, { useMemo } from 'react';
import { Agent, Client, Policy } from '../types';
import { TrophyIcon } from './icons';

interface AgentRankWidgetProps {
  currentAgent: Agent;
  allAgents: Agent[];
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


const AgentRankWidget: React.FC<AgentRankWidgetProps> = ({ currentAgent, allAgents, clients, policies, onNavigate }) => {
    const leaderboardData = useMemo(() => {
        const activeAgents = allAgents.filter(a => a.status === 'Active');

        const performanceData = activeAgents.map((agent, index) => {
            const agentClients = clients.filter(c => c.agentId === agent.id);
            const agentClientIds = agentClients.map(c => c.id);
            const agentPolicies = policies.filter(p => agentClientIds.includes(p.clientId) && p.status === 'Active');
            const totalPremium = agentPolicies.reduce((sum, p) => sum + p.annualPremium, 0);

            return {
                ...agent,
                totalPremium,
                rank: 0, // Placeholder, will be assigned after sorting
            };
        });

        // Sort by premium to determine rank
        performanceData.sort((a, b) => b.totalPremium - a.totalPremium);
        
        // Assign ranks
        return performanceData.map((agent, index) => ({ ...agent, rank: index + 1 }));

    }, [allAgents, clients, policies]);

    const agentRankInfo = useMemo(() => {
        const agentIndex = leaderboardData.findIndex(a => a.id === currentAgent.id);
        if (agentIndex === -1) {
            return {
                rank: 'N/A',
                totalPremium: 0,
                above: null,
                below: null
            };
        }

        const agent = leaderboardData[agentIndex];
        return {
            rank: agent.rank,
            totalPremium: agent.totalPremium,
            above: agentIndex > 0 ? leaderboardData[agentIndex - 1] : null,
            below: agentIndex < leaderboardData.length - 1 ? leaderboardData[agentIndex + 1] : null,
        };
    }, [leaderboardData, currentAgent.id]);

    const RankRow: React.FC<{agent: {name: string, totalPremium: number, rank: number} | null, isCurrentUser?: boolean}> = ({ agent, isCurrentUser = false }) => {
        if (!agent) return null;
        return (
             <div className={`flex items-center justify-between p-2 rounded-md ${isCurrentUser ? 'bg-primary-100/70' : ''}`}>
                <div className="flex items-center">
                    <span className={`font-bold w-8 text-center ${isCurrentUser ? 'text-primary-600' : 'text-slate-500'}`}>#{agent.rank}</span>
                    <span className={`font-semibold ml-3 ${isCurrentUser ? 'text-primary-800' : 'text-slate-700'}`}>{agent.name}</span>
                </div>
                <span className={`font-semibold ${isCurrentUser ? 'text-primary-700' : 'text-slate-600'}`}>{formatCurrency(agent.totalPremium)}</span>
            </div>
        )
    };
    
    return (
        <div className="bg-white/70 backdrop-blur-lg p-6 rounded-2xl border border-white/50 shadow-premium card-enter">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold text-slate-800 flex items-center">
                    <TrophyIcon className="w-6 h-6 mr-3 text-amber-500"/>
                    Your Leaderboard Rank
                </h3>
                <button onClick={() => onNavigate('leaderboard')} className="text-sm font-semibold text-primary-600 hover:underline">View Full Leaderboard</button>
            </div>

            <div className="space-y-1">
                <RankRow agent={agentRankInfo.above} />
                <RankRow agent={{...currentAgent, ...agentRankInfo}} isCurrentUser={true} />
                <RankRow agent={agentRankInfo.below} />
            </div>
            
            {agentRankInfo.rank === 1 && (
                <p className="text-center text-sm font-semibold text-amber-600 mt-4">Congratulations! You're at the top of the leaderboard!</p>
            )}
        </div>
    );
};

export default AgentRankWidget;