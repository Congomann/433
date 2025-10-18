import React, { useMemo } from 'react';
import SummaryCard from './SummaryCard';
import { ClientsIcon, DashboardIcon, TasksIcon, TrophyIcon, UsersIcon, ShieldIcon } from './icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Client, Policy, PolicyType, Task, User, UserRole, Agent, ClientStatus, PolicyStatus } from '../types';
import AgentPerformanceDetail from './AgentPerformanceDetail';
import AgentPerformanceMetrics from './AgentPerformanceMetrics';

interface DashboardProps {
    user: User;
    clients: Client[];
    policies: Policy[];
    tasks: Task[];
    agentsCount: number;
    agents: Agent[];
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

const AgentMetricsSummary: React.FC<{ clients: Client[]; policies: Policy[] }> = ({ clients, policies }) => {
    const metrics = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const newLeadsAssignedThisMonth = clients.filter(c => {
            if (c.status !== ClientStatus.LEAD || !c.agentId) return false;
            try {
                const joinDate = new Date(c.joinDate);
                return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
            } catch(e) { return false; }
        }).length;

        const totalActiveClients = clients.filter(c => c.status === ClientStatus.ACTIVE).length;

        const policiesSoldThisMonth = policies.filter(p => {
             try {
                const startDate = new Date(p.startDate);
                return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
            } catch(e) { return false; }
        }).length;

        return { newLeadsAssignedThisMonth, totalActiveClients, policiesSoldThisMonth };
    }, [clients, policies]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-10">
            <SummaryCard title="New Leads Assigned" value={metrics.newLeadsAssignedThisMonth.toString()} change="+1" icon={<UsersIcon className="w-8 h-8" />} style={{ animationDelay: '0.5s' }} />
            <SummaryCard title="Active Clients" value={metrics.totalActiveClients.toString()} change="+2" icon={<ClientsIcon className="w-8 h-8" />} style={{ animationDelay: '0.6s' }}/>
            <SummaryCard title="Policies Sold This Month" value={metrics.policiesSoldThisMonth.toString()} change="+3" icon={<ShieldIcon className="w-8 h-8" />} style={{ animationDelay: '0.7s' }}/>
        </div>
    );
};


const AdminDashboard: React.FC<Pick<DashboardProps, 'clients' | 'policies' | 'agentsCount'>> = ({ clients, policies, agentsCount }) => {
    const totalPremium = policies.reduce((sum, p) => p.status === 'Active' ? sum + p.annualPremium : sum, 0);
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-10">
                <SummaryCard title="Total Clients" value={clients.length.toString()} change="+5" icon={<ClientsIcon className="w-8 h-8" />} style={{ animationDelay: '0.1s' }} />
                <SummaryCard title="Active Policies" value={policies.filter(p => p.status === 'Active').length.toString()} change="-2" icon={<DashboardIcon className="w-8 h-8" />} style={{ animationDelay: '0.2s' }}/>
                <SummaryCard title="Total Annual Premium" value={`$${(totalPremium / 1000).toFixed(1)}k`} change="+1.2k" icon={<DashboardIcon className="w-8 h-8" />} style={{ animationDelay: '0.3s' }}/>
                <SummaryCard title="Total Agents" value={agentsCount.toString()} change="+1" icon={<ClientsIcon className="w-8 h-8" />} style={{ animationDelay: '0.4s' }}/>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Agency-Wide Metrics</h2>
            <AgentMetricsSummary clients={clients} policies={policies} />
        </>
    );
};

const AgentDashboard: React.FC<Pick<DashboardProps, 'clients' | 'policies' | 'tasks'>> = ({ clients, policies, tasks }) => {
    const totalPremium = policies.reduce((sum, p) => p.status === 'Active' ? sum + p.annualPremium : sum, 0);
    const openTasks = tasks.filter(t => !t.completed).length;
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-10">
            <SummaryCard title="My Active Clients" value={clients.filter(c => c.status === 'Active').length.toString()} change="+2" icon={<ClientsIcon className="w-8 h-8" />} style={{ animationDelay: '0.1s' }} />
            <SummaryCard title="My Annual Premium" value={`$${(totalPremium / 1000).toFixed(1)}k`} change="+0.8k" icon={<DashboardIcon className="w-8 h-8" />} style={{ animationDelay: '0.2s' }}/>
            <SummaryCard title="Open Tasks" value={openTasks.toString()} icon={<TasksIcon className="w-8 h-8" />} style={{ animationDelay: '0.3s' }}/>
        </div>
    );
};

const SubAdminDashboard: React.FC<Pick<DashboardProps, 'clients' | 'policies'>> = ({ clients, policies }) => {
    const newLeads = clients.filter(c => c.status === 'Lead').length;
    const unassignedLeads = clients.filter(c => c.status === 'Lead' && !c.agentId).length;
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-10">
                <SummaryCard title="New Leads" value={newLeads.toString()} change="+3" icon={<ClientsIcon className="w-8 h-8" />} style={{ animationDelay: '0.1s' }} />
                <SummaryCard title="Unassigned Leads" value={unassignedLeads.toString()} icon={<ClientsIcon className="w-8 h-8" />} style={{ animationDelay: '0.2s' }}/>
                <SummaryCard title="Distribution Rate" value="85%" change="+5%" icon={<DashboardIcon className="w-8 h-8" />} style={{ animationDelay: '0.3s' }}/>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Agent Activity Metrics</h2>
            <AgentMetricsSummary clients={clients} policies={policies} />
        </>
    );
};

const TopClients: React.FC<{ clients: Client[]; policies: Policy[] }> = ({ clients, policies }) => {
    const topClients = useMemo(() => {
        const clientData = new Map<number, { totalPremium: number; policyCount: number }>();

        policies.forEach(policy => {
            if (policy.status === PolicyStatus.ACTIVE) {
                const data = clientData.get(policy.clientId) || { totalPremium: 0, policyCount: 0 };
                data.totalPremium += policy.annualPremium;
                data.policyCount += 1;
                clientData.set(policy.clientId, data);
            }
        });

        const sortedClients = Array.from(clientData.entries())
            .map(([clientId, data]) => {
                const client = clients.find(c => c.id === clientId);
                return {
                    client,
                    ...data,
                };
            })
            .filter(item => item.client) // Ensure client exists
            .sort((a, b) => b.totalPremium - a.totalPremium);

        return sortedClients.slice(0, 3);
    }, [clients, policies]);

    if (topClients.length === 0) {
        return (
            <div className="bg-white/70 backdrop-blur-lg p-6 sm:p-8 rounded-2xl border border-white/50 shadow-premium card-enter" style={{ animationDelay: '0.9s' }}>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Top Value Clients</h2>
                <div className="text-center text-slate-500 py-4">
                    <p>No active clients with policies to display.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white/70 backdrop-blur-lg p-6 sm:p-8 rounded-2xl border border-white/50 shadow-premium card-enter" style={{ animationDelay: '0.9s' }}>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Top Value Clients</h2>
            <ul className="space-y-3">
                {topClients.map((item, index) => (
                    <li key={item.client!.id} className="p-3 flex justify-between items-center rounded-lg hover:bg-slate-100/50 transition-colors">
                        <div className="flex items-center">
                            <span className={`font-bold text-lg w-8 text-center ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : 'text-amber-700'}`}>#{index + 1}</span>
                            <div className="ml-3">
                                <p className="font-semibold text-slate-800 flex items-center">
                                    {item.client!.firstName} {item.client!.lastName}
                                    {index === 0 && <TrophyIcon className="w-5 h-5 text-amber-400 ml-2" />}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {item.policyCount} active {item.policyCount > 1 ? 'policies' : 'policy'}
                                </p>
                            </div>
                        </div>
                        <p className="text-lg font-bold text-emerald-600">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(item.totalPremium)}
                        </p>
                    </li>
                ))}
            </ul>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ user, clients, policies, tasks, agentsCount, agents }) => {

    const policiesByType = policies.reduce((acc, policy) => {
        acc[policy.type] = (acc[policy.type] || 0) + 1;
        return acc;
    }, {} as Record<PolicyType, number>);

    const pieData = Object.entries(policiesByType).map(([name, value]) => ({ name, value }));
    const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

    const clientStatusData = useMemo(() => {
        if (!clients) return [];
        const counts = clients.reduce((acc, client) => {
            acc[client.status] = (acc[client.status] || 0) + 1;
            return acc;
        }, {} as Record<ClientStatus, number>);

        return Object.values(ClientStatus).map(status => ({
            name: status,
            value: counts[status] || 0,
        })).filter(item => item.value > 0);
    }, [clients]);

    const STATUS_COLORS = {
        [ClientStatus.ACTIVE]: '#34d399', // emerald-400
        [ClientStatus.LEAD]: '#facc15', // amber-400
        [ClientStatus.INACTIVE]: '#fb7185', // rose-400
    };


    const salesData = [
        { name: 'Jan', premium: 4000 }, { name: 'Feb', premium: 3000 },
        { name: 'Mar', premium: 5000 }, { name: 'Apr', premium: 4500 },
        { name: 'May', premium: 6000 }, { name: 'Jun', premium: 5500 },
    ];

    const upcomingTasks = tasks.filter(t => !t.completed).slice(0, 5);

    const currentAgent = user.role === UserRole.AGENT ? agents.find(a => a.id === user.id) : undefined;
    const isAgent = user.role === UserRole.AGENT;
    const isAdmin = user.role === UserRole.ADMIN;

    const renderSummaryCards = () => {
        switch (user.role) {
            case UserRole.ADMIN:
                return <AdminDashboard clients={clients} policies={policies} agentsCount={agentsCount} />;
            case UserRole.AGENT:
                return <AgentDashboard clients={clients} policies={policies} tasks={tasks} />;
            case UserRole.SUB_ADMIN:
                return <SubAdminDashboard clients={clients} policies={policies} />;
            default:
                return null;
        }
    };

    return (
        <div className="p-6 sm:p-10">
            <div className="mb-10">
                <h1 className="text-4xl font-extrabold text-slate-800">Welcome back, {user.name.split(' ')[0]}!</h1>
                <p className="text-lg text-slate-500 mt-1">Here's your performance overview for today.</p>
            </div>

            {renderSummaryCards()}

            {isAgent && currentAgent && (
                <>
                    <AgentPerformanceMetrics agent={currentAgent} clients={clients} policies={policies} />
                    <div className="bg-white/70 backdrop-blur-lg p-6 sm:p-8 rounded-2xl border border-white/50 shadow-premium mb-8 card-enter" style={{ animationDelay: '0.5s' }}>
                        <AgentPerformanceDetail agent={currentAgent} policies={policies} clients={clients} />
                    </div>
                </>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
                <ChartContainer title="Monthly Premiums" className="lg:col-span-3" style={{ animationDelay: '0.6s' }}>
                    <BarChart data={salesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                        <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                        <YAxis tick={{ fill: '#64748b' }} />
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(5px)', borderRadius: '0.75rem', borderColor: '#e0e7ff' }}/>
                        <Legend />
                        <Bar dataKey="premium" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartContainer>
                <ChartContainer title="Policies by Type" className="lg:col-span-2" style={{ animationDelay: '0.7s' }}>
                     <PieChart>
                        <Pie 
                            data={pieData} 
                            cx="50%" 
                            cy="50%" 
                            labelLine={false} 
                            outerRadius="80%" 
                            fill="#8884d8" 
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${((+(percent || 0)) * 100).toFixed(0)}%`}
                            labelStyle={{ fill: '#475569', fontSize: '12px' }}
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(5px)', borderRadius: '0.75rem', borderColor: '#e0e7ff' }}/>
                    </PieChart>
                </ChartContainer>
            </div>
             <div className={`grid grid-cols-1 ${isAdmin || isAgent ? 'lg:grid-cols-2' : ''} gap-8`}>
                <div className="bg-white/70 backdrop-blur-lg p-6 sm:p-8 rounded-2xl border border-white/50 shadow-premium card-enter" style={{ animationDelay: '0.8s' }}>
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Upcoming Tasks</h2>
                    <ul className="space-y-3">
                        {upcomingTasks.length > 0 ? upcomingTasks.map(task => (
                            <li key={task.id} className="p-3 flex justify-between items-center rounded-lg hover:bg-slate-100/50 transition-colors">
                                <div className="flex items-center">
                                    <div className="p-2 bg-primary-50 rounded-full mr-4">
                                        <TasksIcon className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800">{task.title}</p>
                                        <p className="text-sm text-rose-500 font-semibold">Due: {task.dueDate}</p>
                                    </div>
                                </div>
                                {task.clientId && <button className="text-sm font-semibold text-primary-600 hover:underline">View Client</button>}
                            </li>
                        )) : <p className="text-center text-slate-500 py-4">No upcoming tasks. Great job!</p>}
                    </ul>
                </div>

                {isAgent && (
                    <TopClients clients={clients} policies={policies} />
                )}

                {isAdmin && (
                    <ChartContainer title="Client Status Distribution" style={{ animationDelay: '0.9s' }}>
                        <PieChart>
                            <Pie 
                                data={clientStatusData} 
                                cx="50%" 
                                cy="50%" 
                                labelLine={false} 
                                outerRadius="80%" 
                                fill="#8884d8" 
                                dataKey="value" 
                                nameKey="name" 
                                label={({ name, percent }) => `${name} ${((+(percent || 0)) * 100).toFixed(0)}%`}
                                labelStyle={{ fill: '#475569', fontSize: '12px' }}
                            >
                                {clientStatusData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={STATUS_COLORS[entry.name as ClientStatus]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} clients`} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(5px)', borderRadius: '0.75rem', borderColor: '#e0e7ff' }} />
                            <Legend />
                        </PieChart>
                    </ChartContainer>
                )}
            </div>
        </div>
    );
};

export default Dashboard;