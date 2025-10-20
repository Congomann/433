import React, { useMemo } from 'react';
import { Agent, Client, Policy, PolicyStatus, PolicyType, UserRole } from '../types';
import SummaryCard from './SummaryCard';
import { DollarSignIcon, ShieldIcon, UsersIcon, TrophyIcon } from './icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface AdminManagerDashboardProps {
    agents: Agent[];
    clients: Client[];
    policies: Policy[];
    onNavigate: (path: string) => void;
}

const ChartContainer: React.FC<{ title: string, children: React.ReactNode, className?: string, style?: React.CSSProperties }> = ({ title, children, className = '', style }) => (
    <div className={`bg-white/70 backdrop-blur-lg p-6 sm:p-8 rounded-2xl border border-white/50 shadow-premium card-enter ${className}`} style={style}>
        <h2 className="text-xl font-bold text-slate-800 mb-6">{title}</h2>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                {children}
            </ResponsiveContainer>
        </div>
    </div>
);

const AdminManagerDashboard: React.FC<AdminManagerDashboardProps> = ({ agents, clients, policies, onNavigate }) => {

    const metrics = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const activePolicies = policies.filter(p => p.status === PolicyStatus.ACTIVE);
        const totalAnnualPremium = activePolicies.reduce((sum, p) => sum + p.annualPremium, 0);

        const policiesThisMonth = policies.filter(p => {
            try {
                const startDate = new Date(p.startDate);
                return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
            } catch (e) { return false; }
        }).length;

        const activeAgentsCount = agents.filter(a => a.status === 'Active').length;

        return {
            totalAnnualPremium,
            policiesThisMonth,
            activeAgentsCount,
            totalActivePolicies: activePolicies.length,
        };
    }, [policies, agents]);

    const policiesByType = useMemo(() => {
        const counts = policies.reduce((acc, policy) => {
            acc[policy.type] = (acc[policy.type] || 0) + 1;
            return acc;
        }, {} as Record<PolicyType, number>);
        // FIX: Cast value to number to resolve type inference issue.
        return Object.entries(counts).map(([name, value]) => ({ name, value: value as number }));
    }, [policies]);

    const policiesByCarrier = useMemo(() => {
        const counts = policies.reduce((acc, policy) => {
            if (policy.carrier) {
                acc[policy.carrier] = (acc[policy.carrier] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        // FIX: Cast value to number to resolve type inference issue where it's treated as 'unknown'.
        const mappedData: { name: string; value: number }[] = Object.entries(counts).map(([name, value]) => ({ name, value: value as number }));
        return mappedData.sort((a,b) => b.value - a.value);
    }, [policies]);

    const policyStatusCounts = useMemo(() => {
        return policies.reduce((acc, policy) => {
            acc[policy.status] = (acc[policy.status] || 0) + 1;
            return acc;
        }, {} as Record<PolicyStatus, number>);
    }, [policies]);


    const agentLeaderboard = useMemo(() => {
        return agents
            .filter(a => a.status === 'Active')
            .map(agent => {
                const agentClients = clients.filter(c => c.agentId === agent.id);
                const agentPolicies = policies.filter(p => agentClients.some(c => c.id === p.clientId) && p.status === PolicyStatus.ACTIVE);
                const totalAP = agentPolicies.reduce((sum, p) => sum + p.annualPremium, 0);
                return {
                    id: agent.id,
                    name: agent.name,
                    slug: agent.slug,
                    policiesSold: agentPolicies.length,
                    totalAP,
                };
            })
            .sort((a, b) => b.totalAP - a.totalAP)
            .slice(0, 5);
    }, [agents, clients, policies]);

    const PIE_COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-10">
                <SummaryCard title="Total Annual Premium" value={`$${(metrics.totalAnnualPremium / 1000).toFixed(1)}k`} icon={<DollarSignIcon className="w-8 h-8" />} style={{ animationDelay: '0.1s' }} />
                <SummaryCard title="Policies Written (Month)" value={metrics.policiesThisMonth.toString()} icon={<ShieldIcon className="w-8 h-8" />} style={{ animationDelay: '0.2s' }} />
                <SummaryCard title="Active Agents" value={metrics.activeAgentsCount.toString()} icon={<UsersIcon className="w-8 h-8" />} style={{ animationDelay: '0.3s' }} />
                <SummaryCard title="Total Active Policies" value={metrics.totalActivePolicies.toString()} icon={<ShieldIcon className="w-8 h-8" />} style={{ animationDelay: '0.4s' }} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <ChartContainer title="Policies by Type" style={{ animationDelay: '0.5s' }}>
                    <PieChart>
                        <Pie data={policiesByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                            {policiesByType.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} policies`} />
                        <Legend />
                    </PieChart>
                </ChartContainer>
                <ChartContainer title="Policies by Carrier" style={{ animationDelay: '0.6s' }}>
                    <BarChart data={policiesByCarrier} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => `${value} policies`} />
                        <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20}>
                            {policiesByCarrier.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white/70 backdrop-blur-lg p-6 rounded-2xl border border-white/50 shadow-premium card-enter" style={{ animationDelay: '0.7s' }}>
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center"><TrophyIcon className="w-6 h-6 mr-3 text-amber-500"/> Agent Leaderboard (Top 5)</h2>
                     <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Rank</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Agent</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Policies Sold</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Total AP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agentLeaderboard.map((agent, index) => (
                                    <tr key={agent.id} className="border-b border-slate-200/50 last:border-b-0 hover:bg-slate-100/50">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-700">#{index + 1}</td>
                                        <td className="px-6 py-4"><button onClick={() => onNavigate(`agent/${agent.slug}`)} className="text-sm font-semibold text-primary-600 hover:underline">{agent.name}</button></td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{agent.policiesSold}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-emerald-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(agent.totalAP)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                 <div className="bg-white/70 backdrop-blur-lg p-6 rounded-2xl border border-white/50 shadow-premium card-enter" style={{ animationDelay: '0.8s' }}>
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Policy Status Breakdown</h2>
                    <div className="space-y-4 pt-2">
                        {Object.entries(policyStatusCounts).map(([status, count]) => (
                            <div key={status} className="flex justify-between items-center">
                                <span className="font-semibold text-slate-700">{status}</span>
                                <span className="px-3 py-1 text-sm font-bold bg-slate-200 text-slate-800 rounded-full">{count}</span>
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        </>
    );
};

export default AdminManagerDashboard;
