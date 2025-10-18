import React from 'react';
import { Policy, PolicyUnderwritingStatus, Client, Agent } from '../types';
import { DocumentTextIcon } from './icons';

interface UnderwritingPortalProps {
  policies: Policy[];
  clients: Client[];
  agents: Agent[];
  onNavigate: (path: string) => void;
  onReviewPolicy: (policy: Policy) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const StatusBadge: React.FC<{ status: PolicyUnderwritingStatus }> = ({ status }) => {
  const styles = {
    [PolicyUnderwritingStatus.PENDING]: 'bg-amber-100 text-amber-800 ring-amber-200',
    [PolicyUnderwritingStatus.APPROVED]: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    [PolicyUnderwritingStatus.REJECTED]: 'bg-rose-100 text-rose-800 ring-rose-200',
    [PolicyUnderwritingStatus.MORE_INFO_REQUIRED]: 'bg-sky-100 text-sky-800 ring-sky-200',
  };
  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ring-1 ring-inset ${styles[status]}`}>
      {status}
    </span>
  );
};


const UnderwritingPortal: React.FC<UnderwritingPortalProps> = ({ policies, clients, agents, onNavigate, onReviewPolicy }) => {
  const pendingPolicies = policies.filter(p => p.underwritingStatus === PolicyUnderwritingStatus.PENDING);

  const clientMap = clients.reduce((map, client) => {
    map[client.id] = client;
    return map;
  }, {} as Record<number, Client>);

  const agentMap = agents.reduce((map, agent) => {
    map[agent.id] = agent;
    return map;
  }, {} as Record<number, Agent>);

  return (
    <div className="p-10">
      <div className="flex items-center mb-8">
        <DocumentTextIcon className="w-10 h-10 text-primary-600 mr-4" />
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800">Underwriting Queue</h1>
          <p className="text-slate-500 mt-1">Policies that require review and approval.</p>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/50 shadow-premium overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50/50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Client & Policy Type</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Annual Premium</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Agent</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted Date</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingPolicies.length > 0 ? pendingPolicies.map(policy => {
              const client = clientMap[policy.clientId];
              const agent = client?.agentId ? agentMap[client.agentId] : null;
              return (
                <tr key={policy.id} onClick={() => onReviewPolicy(policy)} className="border-b border-slate-200/50 last:border-b-0 hover:bg-slate-100/50 row-enter cursor-pointer">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-900">{client ? `${client.firstName} ${client.lastName}` : 'N/A'}</div>
                    <div className="text-sm text-slate-500">{policy.type}</div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">{formatCurrency(policy.annualPremium)}</td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">{agent?.name || 'Unassigned'}</td>
                   <td className="px-6 py-5 whitespace-nowrap">
                    <StatusBadge status={policy.underwritingStatus || PolicyUnderwritingStatus.PENDING} />
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-500 max-w-xs truncate">
                    {policy.underwritingNotes || <span className="italic">No notes</span>}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-500">{policy.startDate}</td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <button onClick={(e) => { e.stopPropagation(); onReviewPolicy(policy); }} className="text-sm font-semibold text-primary-600 hover:underline">
                      Review
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={7} className="text-center p-12 text-slate-500">
                  <p className="font-semibold">The underwriting queue is clear!</p>
                  <p className="text-sm mt-1">No new policies are currently pending review.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UnderwritingPortal;