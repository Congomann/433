import React from 'react';
import { Client } from '../types';
import { TrashIcon, PencilIcon, PlusIcon } from './icons';
import { useToast } from '../contexts/ToastContext';

interface LeadDistributionProps {
  leads: Client[];
  onSelectLead: (id: number) => void;
  onCreateLead: () => void;
  onEditLead: (lead: Client) => void;
  onDeleteLead: (id: number) => void;
}

const LeadDistribution: React.FC<LeadDistributionProps> = ({ leads, onSelectLead, onCreateLead, onEditLead, onDeleteLead }) => {
  const { addToast } = useToast();
  const unassignedLeads = leads.filter(lead => !lead.agentId);

  const handleDelete = (e: React.MouseEvent, leadId: number) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      onDeleteLead(leadId);
    }
  };

  const handleEdit = (e: React.MouseEvent, lead: Client) => {
    e.stopPropagation();
    onEditLead(lead);
  };


  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800">Lead Distribution</h1>
        <div className="flex space-x-2">
            <button onClick={onCreateLead} className="flex items-center bg-primary-600 text-white font-semibold px-4 py-2 rounded-md shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors button-press">
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Lead
            </button>
        </div>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-700">Unassigned Leads ({unassignedLeads.length})</h2>
            <div className="flex space-x-2">
                <button onClick={() => addToast('Feature Coming Soon', 'Broadcasting to all available agents is not yet implemented.', 'info')} className="bg-secondary text-white px-3 py-1.5 text-sm rounded-md shadow-sm hover:bg-slate-700 transition-colors button-press">Broadcast</button>
                <button onClick={() => addToast('Feature Coming Soon', 'Round-robin assignment to the next available agent is not yet implemented.', 'info')} className="bg-secondary text-white px-3 py-1.5 text-sm rounded-md shadow-sm hover:bg-slate-700 transition-colors button-press">Round-Robin</button>
            </div>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Join Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {unassignedLeads.map((lead) => (
              <tr key={lead.id} onClick={() => onSelectLead(lead.id)} className="hover:bg-slate-50 group cursor-pointer row-enter">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900">{lead.firstName} {lead.lastName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900">{lead.email}</div>
                  <div className="text-sm text-slate-500">{lead.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{lead.joinDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-4">
                    <button onClick={(e) => handleEdit(e, lead)} className="text-slate-400 hover:text-primary-600" aria-label={`Edit ${lead.firstName} ${lead.lastName}`} title="Edit lead">
                      <PencilIcon />
                    </button>
                    <button onClick={(e) => handleDelete(e, lead.id)} className="text-slate-400 hover:text-rose-600" aria-label={`Delete ${lead.firstName} ${lead.lastName}`} title="Delete lead">
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadDistribution;