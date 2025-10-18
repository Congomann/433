import React, { useState, useMemo, useEffect } from 'react';
import { Agent, AgentStatus, User, UserRole, Client, Policy } from '../types';
import { PlusIcon } from './icons';
import ApproveAgentModal from './ApproveAgentModal';
import Pagination from './Pagination';

const ITEMS_PER_PAGE = 10;

interface AgentManagementProps {
  currentUser: User;
  agents: Agent[];
  users: User[];
  clients: Client[];
  policies: Policy[];
  onNavigate: (view: string) => void;
  onAddAgent: () => void;
  onEditAgent: (agent: Agent) => void;
  onApproveAgent: (agentId: number, newRole: UserRole) => void;
  onDeactivateAgent: (agentId: number) => void;
  onReactivateAgent: (agentId: number) => void;
  onRejectAgent: (agentId: number) => void;
  onDeleteAgent: (agentId: number) => void;
  highlightedAgentId: number | null;
}

type AgentTableTab = 'active' | 'pending' | 'inactive';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

const TabButton: React.FC<{tabId: AgentTableTab, label: string, count: number, activeTab: AgentTableTab, setActiveTab: (tabId: AgentTableTab) => void}> = ({ tabId, label, count, activeTab, setActiveTab }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-4 py-2 font-medium text-sm rounded-t-lg border-b-2 transition-colors ${activeTab === tabId ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
    >
      {label} <span className="ml-2 px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs">{count}</span>
    </button>
);

const ActionButton: React.FC<{ onClick: () => void, text: string, color: 'emerald' | 'amber' | 'rose' | 'slate', ariaLabel: string, title?: string }> = ({ onClick, text, color, ariaLabel, title }) => {
    const colorClasses = {
        emerald: 'text-emerald-600 hover:text-emerald-800',
        amber: 'text-amber-600 hover:text-amber-800',
        rose: 'text-rose-600 hover:text-rose-800',
        slate: 'text-slate-500 hover:text-primary-600'
    };
    return (
      <button 
          onClick={onClick} 
          className={`font-medium ${colorClasses[color]} transition-colors`}
          aria-label={ariaLabel}
          title={title || text}
      >
          {text}
      </button>
    );
};

const ActiveAgentsTable: React.FC<{agents: (Agent & { totalPremium: number })[], highlightedAgentId: number | null, onNavigate: (view: string) => void, onEditAgent: (agent: Agent) => void, onDeactivateAgent: (agentId: number) => void, canManage: boolean}> = ({ agents, highlightedAgentId, onNavigate, onEditAgent, onDeactivateAgent, canManage }) => (
    <div className="bg-white rounded-t-lg border-x border-t border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Clients</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Commission</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total AP</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
              {canManage && <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {agents.map((agent) => (
              <tr key={agent.id} className={`transition-colors duration-1000 ${highlightedAgentId === agent.id ? 'bg-emerald-50' : 'hover:bg-slate-50'} row-enter`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img className="h-10 w-10 rounded-full" src={agent.avatar} alt={`${agent.name}'s avatar`} />
                    <div className="ml-4">
                      <button onClick={() => onNavigate(`agent/${agent.slug}`)} className="text-sm font-medium text-primary-600 hover:underline focus:outline-none">
                        {agent.name}
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900">{agent.email}</div>
                  <div className="text-sm text-slate-500">{agent.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{agent.clientCount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{(agent.commissionRate * 100).toFixed(0)}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">{formatCurrency(agent.totalPremium)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{agent.joinDate}</td>
                {canManage && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                       <div className="flex items-center space-x-4">
                            <ActionButton
                                onClick={() => onEditAgent(agent)}
                                text="Edit Profile"
                                color="slate"
                                ariaLabel={`Edit ${agent.name}`}
                                title="Edit agent profile"
                            />
                            <ActionButton
                                onClick={() => {
                                    if (window.confirm("Are you sure you want to deactivate this agent's account? Their access will be revoked, and they will be moved to the Inactive list. This action is reversible.")) {
                                        onDeactivateAgent(agent.id);
                                    }
                                }}
                                text="Deactivate"
                                color="amber"
                                ariaLabel={`Deactivate ${agent.name}`}
                                title="Deactivate agent"
                            />
                        </div>
                    </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
);

const InactiveAgentsTable: React.FC<{agents: Agent[], highlightedAgentId: number | null, onReactivateAgent: (agentId: number) => void, onDeleteAgent: (agentId: number) => void, canManage: boolean}> = ({ agents, highlightedAgentId, onReactivateAgent, onDeleteAgent, canManage }) => (
    <div className="bg-white rounded-t-lg border-x border-t border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
              {canManage && <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {agents.map((agent) => (
              <tr key={agent.id} className={`transition-colors duration-1000 ${highlightedAgentId === agent.id ? 'bg-rose-50' : 'hover:bg-slate-50'} row-enter`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img className="h-10 w-10 rounded-full" src={agent.avatar} alt={`${agent.name}'s avatar`} />
                    <div className="ml-4 font-medium text-slate-900">{agent.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{agent.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{agent.location}</td>
                {canManage && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-4">
                            <ActionButton
                                onClick={() => {
                                    if (window.confirm('Reactivate this agent’s account? They will regain access immediately.')) {
                                        onReactivateAgent(agent.id);
                                    }
                                }}
                                text="Reactivate"
                                color="emerald"
                                ariaLabel={`Reactivate ${agent.name}`}
                                title="Reactivate agent"
                            />
                             <ActionButton
                                onClick={() => {
                                    if (window.confirm("PERMANENT ACTION: This will delete the agent's profile, user login, and unassign all their clients. This should only be done if the agent has left New Holland Financial Group or committed a policy violation. This action CANNOT be undone. Are you sure you want to proceed?")) {
                                        onDeleteAgent(agent.id);
                                    }
                                }}
                                text="Delete Permanently"
                                color="rose"
                                ariaLabel={`Permanently Delete ${agent.name}`}
                                title="Delete agent permanently"
                            />
                        </div>
                    </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
);

const PendingAgentsTable: React.FC<{agents: Agent[], onEditAgent: (agent: Agent) => void, onRejectAgent: (agentId: number) => void, setAgentToApprove: (agent: Agent) => void, canManage: boolean}> = ({ agents, onEditAgent, onRejectAgent, setAgentToApprove, canManage }) => (
    <div className="bg-white rounded-t-lg border-x border-t border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
              {canManage && <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {agents.map((agent) => (
              <tr key={agent.id} className="hover:bg-slate-50 row-enter">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img className="h-10 w-10 rounded-full" src={agent.avatar} alt={`${agent.name}'s avatar`} />
                    <div className="ml-4 font-medium text-slate-900">{agent.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{agent.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{agent.location}</td>
                {canManage && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-4">
                            <ActionButton
                                onClick={() => setAgentToApprove(agent)}
                                text="Approve"
                                color="emerald"
                                ariaLabel={`Approve ${agent.name}`}
                                title="Approve application"
                            />
                            <ActionButton
                                onClick={() => onEditAgent(agent)}
                                text="Edit"
                                color="slate"
                                ariaLabel={`Edit ${agent.name}`}
                                title="Edit agent application"
                            />
                            <ActionButton
                                onClick={() => {
                                    if (window.confirm('Rejecting this application will move the agent to the Inactive list. Continue?')) {
                                        onRejectAgent(agent.id);
                                    }
                                }}
                                text="Reject"
                                color="rose"
                                ariaLabel={`Reject ${agent.name}`}
                                title="Reject application"
                            />
                        </div>
                    </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
);


const AgentManagement: React.FC<AgentManagementProps> = ({ currentUser, agents, users, clients, policies, onNavigate, onAddAgent, onEditAgent, onApproveAgent, onDeactivateAgent, onReactivateAgent, onRejectAgent, onDeleteAgent, highlightedAgentId }) => {
  const [activeTab, setActiveTab] = useState<AgentTableTab>('active');
  const [agentToApprove, setAgentToApprove] = useState<Agent | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const canManage = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER;

  const agentPerformanceData = useMemo(() => {
    return agents.map(agent => {
        const agentClientIds = clients.filter(c => c.agentId === agent.id).map(c => c.id);
        const agentPolicies = policies.filter(p => agentClientIds.includes(p.clientId) && p.status === 'Active');
        const totalPremium = agentPolicies.reduce((sum, p) => sum + p.annualPremium, 0);
        return { ...agent, totalPremium };
    });
  }, [agents, clients, policies]);

  // Group agents by status in a single pass for efficiency and clarity.
  const { activeAgents, pendingAgents, inactiveAgents } = useMemo(() => {
    const grouped = {
      [AgentStatus.ACTIVE]: [] as (Agent & { totalPremium: number })[],
      [AgentStatus.PENDING]: [] as (Agent & { totalPremium: number })[],
      [AgentStatus.INACTIVE]: [] as (Agent & { totalPremium: number })[],
    };

    agentPerformanceData.forEach(agent => {
      if (grouped[agent.status]) {
          grouped[agent.status].push(agent);
      }
    });

    return {
      activeAgents: grouped[AgentStatus.ACTIVE].sort((a, b) => b.totalPremium - a.totalPremium),
      pendingAgents: grouped[AgentStatus.PENDING],
      inactiveAgents: grouped[AgentStatus.INACTIVE],
    };
  }, [agentPerformanceData]);
  
  const userForApproval = users.find(u => u.id === agentToApprove?.id);

  const paginatedActive = useMemo(() => activeAgents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [activeAgents, currentPage]);
  const paginatedPending = useMemo(() => pendingAgents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [pendingAgents, currentPage]);
  const paginatedInactive = useMemo(() => inactiveAgents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [inactiveAgents, currentPage]);

  const totalPages = useMemo(() => {
    switch (activeTab) {
        case 'active': return Math.ceil(activeAgents.length / ITEMS_PER_PAGE);
        case 'pending': return Math.ceil(pendingAgents.length / ITEMS_PER_PAGE);
        case 'inactive': return Math.ceil(inactiveAgents.length / ITEMS_PER_PAGE);
        default: return 1;
    }
  }, [activeTab, activeAgents, pendingAgents, inactiveAgents]);


  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-slate-800">Agent Management</h1>
        {canManage && (
            <button onClick={onAddAgent} className="flex items-center bg-primary-600 text-white font-semibold px-4 py-2 rounded-md shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors button-press">
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Agent
            </button>
        )}
      </div>
      
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <TabButton tabId="active" label="Active Agents" count={activeAgents.length} activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton tabId="pending" label="Pending Applications" count={pendingAgents.length} activeTab={activeTab} setActiveTab={setActiveTab} />
          <TabButton tabId="inactive" label="Inactive Agents" count={inactiveAgents.length} activeTab={activeTab} setActiveTab={setActiveTab} />
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === 'active' && (
            <div className="rounded-lg shadow-sm border border-slate-200">
                <ActiveAgentsTable agents={paginatedActive} highlightedAgentId={highlightedAgentId} onNavigate={onNavigate} onEditAgent={onEditAgent} onDeactivateAgent={(id) => {onDeactivateAgent(id); setActiveTab('inactive');}} canManage={canManage} />
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        )}
        {activeTab === 'pending' && (
            <div className="rounded-lg shadow-sm border border-slate-200">
                <PendingAgentsTable agents={paginatedPending} onEditAgent={onEditAgent} onRejectAgent={(id) => {onRejectAgent(id); setActiveTab('inactive');}} setAgentToApprove={setAgentToApprove} canManage={canManage} />
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        )}
        {activeTab === 'inactive' && (
            <div className="rounded-lg shadow-sm border border-slate-200">
                <InactiveAgentsTable agents={paginatedInactive} highlightedAgentId={highlightedAgentId} onReactivateAgent={(id) => {onReactivateAgent(id); setActiveTab('active');}} onDeleteAgent={onDeleteAgent} canManage={canManage} />
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
        )}
      </div>
      {canManage && (
        <ApproveAgentModal
            isOpen={!!agentToApprove}
            onClose={() => setAgentToApprove(null)}
            agentName={agentToApprove?.name || ''}
            currentRole={userForApproval?.role as UserRole.AGENT | UserRole.SUB_ADMIN || UserRole.AGENT}
            onConfirm={(newRole) => {
                if (agentToApprove) {
                    onApproveAgent(agentToApprove.id, newRole);
                    setAgentToApprove(null);
                    setActiveTab('active');
                }
            }}
        />
      )}
    </div>
  );
};

export default AgentManagement;