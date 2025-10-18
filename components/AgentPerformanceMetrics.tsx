import React, { useMemo } from 'react';
import { Agent, Client, Policy } from '../types';
import { UsersIcon, DollarSignIcon, ChartTrendingUpIcon } from './icons';

interface AgentPerformanceMetricsProps {
  agent: Agent;
  clients: Client[];
  policies: Policy[];
}

const MetricCard: React.FC<{ icon: React.ReactNode; title: string; value: string }> = ({ icon, title, value }) => (
    <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center">
        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const AgentPerformanceMetrics: React.FC<AgentPerformanceMetricsProps> = ({ agent, clients, policies }) => {
    const metrics = useMemo(() => {
        // New Clients (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newClientsLast7Days = clients.filter(client => 
            client.agentId === agent.id && new Date(client.joinDate) >= sevenDaysAgo
        ).length;

        // Average Policy Value
        const agentClientIds = clients.filter(c => c.agentId === agent.id).map(c => c.id);
        const agentPolicies = policies.filter(p => agentClientIds.includes(p.clientId));
        const totalPremium = agentPolicies.reduce((sum, policy) => sum + policy.annualPremium, 0);
        const averagePolicyValue = agentPolicies.length > 0 ? totalPremium / agentPolicies.length : 0;
        
        // Conversion Rate
        const conversionRate = `${(agent.conversionRate * 100).toFixed(0)}%`;

        return { newClientsLast7Days, averagePolicyValue, conversionRate };
    }, [agent, clients, policies]);

    return (
        <div className="mb-8 card-enter" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Recent Performance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard 
                    icon={<UsersIcon className="w-6 h-6" />}
                    title="New Clients (7 Days)"
                    value={metrics.newClientsLast7Days.toString()}
                />
                <MetricCard 
                    icon={<DollarSignIcon className="w-6 h-6" />}
                    title="Avg. Policy Value"
                    value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(metrics.averagePolicyValue)}
                />
                <MetricCard 
                    icon={<ChartTrendingUpIcon className="w-6 h-6" />}
                    title="Conversion Rate"
                    value={metrics.conversionRate}
                />
            </div>
        </div>
    );
};

export default AgentPerformanceMetrics;
