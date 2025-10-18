import React, { useState, useMemo } from 'react';
import { Client, ClientStatus, Agent } from '../types';
import { PlusIcon, CloseIcon, SearchIcon, UserCircleIcon } from './icons';

interface ClientListProps {
  title: string;
  clients: Client[];
  onSelectClient: (id: number) => void;
  onAddClient: () => void;
  agentFilter?: Agent | null;
  onClearFilter?: () => void;
}

const ClientList: React.FC<ClientListProps> = ({ title, clients, onSelectClient, onAddClient, agentFilter, onClearFilter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const fullName = `${client.firstName} ${client.lastName}`;
      const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            client.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  const getStatusColor = (status: ClientStatus) => {
    switch (status) {
      case ClientStatus.ACTIVE: return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
      case ClientStatus.LEAD: return 'bg-amber-100 text-amber-800 ring-amber-200';
      case ClientStatus.INACTIVE: return 'bg-rose-100 text-rose-800 ring-rose-200';
      default: return 'bg-slate-100 text-slate-800 ring-slate-200';
    }
  };

  return (
    <div className="p-6 sm:p-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
            <h1 className="text-4xl font-extrabold text-slate-800">{title}</h1>
            <p className="text-slate-500 mt-1">Manage and view your client records.</p>
        </div>
        <button onClick={onAddClient} className="flex items-center justify-center bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 button-press">
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Client
        </button>
      </div>
      
      {agentFilter && onClearFilter && (
        <div className="bg-primary-50 border border-primary-200 text-primary-800 px-4 py-2.5 rounded-xl mb-6 flex justify-between items-center animate-fadeIn">
            <span className="font-medium">Viewing clients for <strong>{agentFilter.name}</strong>.</span>
            <button onClick={onClearFilter} className="flex items-center font-semibold hover:underline">
                <CloseIcon className="w-4 h-4 mr-1" />
                Clear Filter
            </button>
        </div>
      )}

      {/* Control Panel for Search and Filter */}
      <div className="mb-6 bg-white/50 p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full sm:w-2/3 md:w-1/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            />
            {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600" aria-label="Clear search" title="Clear search">
                    <CloseIcon className="h-4 w-4" />
                </button>
            )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ClientStatus | 'all')}
          className="px-4 py-2 border border-slate-300 rounded-lg bg-white w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Statuses</option>
          {Object.values(ClientStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-white/50 shadow-premium overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50/50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Join Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr 
                key={client.id} 
                onClick={() => onSelectClient(client.id)} 
                className="hover:shadow-md hover:bg-slate-50/50 cursor-pointer transition-all duration-200 row-enter border-b border-slate-200/50 last:border-b-0 group"
                >
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center">
                    <UserCircleIcon className="h-10 w-10 text-slate-300" />
                    <div className="ml-4">
                      <div className="text-sm font-bold text-slate-900">{client.firstName} {client.lastName}</div>
                      <div className="text-sm text-slate-500">{client.address}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm text-slate-900">{client.email}</div>
                  <div className="text-sm text-slate-500">{client.phone}</div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ring-1 ring-inset ${getStatusColor(client.status)}`}>
                    {client.status}
                  </span>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-500">{client.joinDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
         {filteredClients.length === 0 && (
            <div className="text-center p-12 text-slate-500">
                <p className="font-semibold">No clients found</p>
                <p className="text-sm mt-1">Try adjusting your search or filter.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ClientList;
