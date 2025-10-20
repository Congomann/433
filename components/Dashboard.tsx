import React, { useMemo } from 'react';
import SummaryCard from './SummaryCard';
import { ClientsIcon, DashboardIcon, TasksIcon } from './icons';
import { Client, Policy, Task, User, UserRole, Agent } from '../types';
import AgentPerformanceDetail from './AgentPerformanceDetail';
import AgentPerformanceMetrics from './AgentPerformanceMetrics';
import AgentRankWidget from './AgentRankWidget';
import AdminManagerDashboard from './AdminManagerDashboard';

interface DashboardProps {
    user: User;
    clients: Client[];
    policies: Policy[];
    tasks: Task[];
    agentsCount: number;
    agents: Agent[];
    onNavigate: (path: string) => void;
}

const AgentDashboard: React.FC<{
    user: User;
    clients: Client[];
    policies: Policy[];
    tasks: Task[];
    agents: Agent[];
    onNavigate: (path: string) => void;
}> = ({ user, clients, policies, tasks, agents, onNavigate }) => {
    const totalPremium = policies.reduce((sum, p) => p.status === 'Active' ? sum + p.annualPremium : sum, 0);
    const openTasks = tasks.filter(t => !t.completed).length;
    const currentAgent = useMemo(() => agents.find(a => a.id === user.id), [agents, user.id]);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-10">
                <SummaryCard title="My Active Clients" value={clients.filter(c => c.status === 'Active').length.toString()} change="+2" icon={<ClientsIcon className="w-8 h-8" />} style={{ animationDelay: '0.1s' }} />
                <SummaryCard title="My Annual Premium" value={`$${(totalPremium / 1000).toFixed(1)}k`} change="+0.8k" icon={<DashboardIcon className="w-8 h-8" />} style={{ animationDelay: '0.2s' }}/>
                <SummaryCard title="Open Tasks" value={openTasks.toString()} icon={<TasksIcon className="w-8 h-8" />} style={{ animationDelay: '0.3s' }}/>
            </div>
             {currentAgent && (
                <div className="mb-10">
                    <AgentRankWidget
                        currentAgent={currentAgent}
                        allAgents={agents}
                        clients={clients}
                        policies={policies}
                        onNavigate={onNavigate}
                    />
                </div>
            )}
            {currentAgent && (
                 <>
                    <AgentPerformanceMetrics agent={currentAgent} clients={clients} policies={policies} />
                    <div className="bg-white/70 backdrop-blur-lg p-6 sm:p-8 rounded-2xl border border-white/50 shadow-premium mb-8 card-enter" style={{ animationDelay: '0.5s' }}>
                        <AgentPerformanceDetail agent={currentAgent} policies={policies} clients={clients} />
                    </div>
                </>
            )}
        </>
    );
};

const SubAdminDashboard: React.FC<Pick<DashboardProps, 'clients'>> = ({ clients }) => {
    const newLeads = clients.filter(c => c.status === 'Lead').length;
    const unassignedLeads = clients.filter(c => c.status === 'Lead' && !c.agentId).length;
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-10">
            <SummaryCard title="New Leads" value={newLeads.toString()} change="+3" icon={<ClientsIcon className="w-8 h-8" />} style={{ animationDelay: '0.1s' }} />
            <SummaryCard title="Unassigned Leads" value={unassignedLeads.toString()} icon={<ClientsIcon className="w-8 h-8" />} style={{ animationDelay: '0.2s' }}/>
            <SummaryCard title="Distribution Rate" value="85%" change="+5%" icon={<DashboardIcon className="w-8 h-8" />} style={{ animationDelay: '0.3s' }}/>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ user, clients, policies, tasks, agentsCount, agents, onNavigate }) => {

    const renderDashboardContent = () => {
        switch (user.role) {
            case UserRole.ADMIN:
            case UserRole.MANAGER:
            case UserRole.UNDERWRITING:
                return <AdminManagerDashboard clients={clients} policies={policies} agents={agents} onNavigate={onNavigate} />;
            case UserRole.AGENT:
                return <AgentDashboard user={user} agents={agents} clients={clients} policies={policies} tasks={tasks} onNavigate={onNavigate} />;
            case UserRole.SUB_ADMIN:
                return <SubAdminDashboard clients={clients} />;
            default:
                return <div className="p-8 text-center">Dashboard not available for this role.</div>;
        }
    };

    return (
        <div className="p-6 sm:p-10">
            <div className="mb-10">
                <h1 className="text-4xl font-extrabold text-slate-800">Welcome back, {user.name.split(' ')[0]}!</h1>
                <p className="text-lg text-slate-500 mt-1">Here's your performance overview for today.</p>
            </div>
            {renderDashboardContent()}
        </div>
    );
};

export default Dashboard;