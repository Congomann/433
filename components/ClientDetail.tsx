import React, { useState, useMemo } from 'react';
import { Client, Policy, Interaction, PolicyStatus, InteractionType, Agent, User, UserRole, ClientStatus, PolicyUnderwritingStatus } from '../types';
import { summarizeNotes } from '../services/geminiService';
import { AiSparklesIcon, PlusIcon, PencilIcon, EllipsisVerticalIcon, CalendarIcon, DollarSignIcon, ShieldIcon, DocumentTextIcon, ChevronDownIcon, UsersIcon } from './icons';

interface ClientDetailProps {
  client: Client;
  policies: Policy[];
  interactions: Interaction[];
  assignedAgent?: Agent;
  onBack: () => void;
  currentUser: User;
  onUpdateStatus: (clientId: number, newStatus: ClientStatus) => Promise<void>;
  onOpenAddPolicyModal: () => void;
  onOpenEditPolicyModal: (policy: Policy) => void;
  onUpdatePolicy: (policyId: number, updates: Partial<Policy>) => void;
  onSaveInteraction: (interaction: Omit<Interaction, 'id'>) => void;
  onOpenAddReminderModal: () => void;
  onOpenEditClientModal: (client: Client) => void;
  onOpenUnderwritingReviewModal: (policy: Policy) => void;
  agents: Agent[];
  onOpenAssignModal: (client: Client) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
};

const getPolicyStatusColor = (status: PolicyStatus) => {
    switch (status) {
      case PolicyStatus.ACTIVE: return 'border-emerald-500';
      case PolicyStatus.EXPIRED: return 'border-amber-500';
      case PolicyStatus.CANCELLED: return 'border-rose-500';
    }
};

const getInteractionIcon = (type: InteractionType) => {
    switch(type) {
        case InteractionType.CALL: return '📞';
        case InteractionType.EMAIL: return '✉️';
        case InteractionType.MEETING: return '🤝';
        case InteractionType.NOTE: return '📝';
    }
}

const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
  const displayValue = (value !== null && value !== undefined && value !== '') ? value : <span className="text-slate-400 italic">Not Provided</span>;
  return (
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-md text-slate-800">{displayValue}</p>
    </div>
  );
};

const AddInteractionForm: React.FC<{
  clientId: number;
  onSave: (interaction: Omit<Interaction, 'id'>) => void;
}> = ({ clientId, onSave }) => {
  const [type, setType] = useState<InteractionType>(InteractionType.CALL);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;
    onSave({ clientId, type, date, summary });
    setSummary('');
  };

  return (
    <div className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl border border-white/50 shadow-premium mt-8">
      <h3 className="text-xl font-bold text-slate-700 mb-4">Log a New Interaction</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="interactionType" className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
            <select
              id="interactionType"
              value={type}
              onChange={(e) => setType(e.target.value as InteractionType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50"
            >
              <option value={InteractionType.CALL}>Call</option>
              <option value={InteractionType.EMAIL}>Email</option>
              <option value={InteractionType.MEETING}>Meeting</option>
            </select>
          </div>
          <div>
            <label htmlFor="interactionDate" className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
            <input
              id="interactionDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50"
            />
          </div>
        </div>
        <div>
          <label htmlFor="interactionSummary" className="block text-sm font-medium text-slate-700 mb-1.5">Summary</label>
          <textarea
            id="interactionSummary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50"
            placeholder="Log details about the call, email, or meeting..."
            required
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="flex items-center bg-primary-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-primary-700 disabled:bg-slate-400">
            <PlusIcon className="w-5 h-5 mr-2" /> Log Interaction
          </button>
        </div>
      </form>
    </div>
  );
};

const AddNoteForm: React.FC<{
  clientId: number;
  onSave: (interaction: Omit<Interaction, 'id'>) => void;
}> = ({ clientId, onSave }) => {
  const [summary, setSummary] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;
    onSave({
      clientId,
      type: InteractionType.NOTE,
      date: new Date().toISOString().split('T')[0],
      summary,
    });
    setSummary('');
  };

  return (
    <div className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl border border-white/50 shadow-premium">
      <h2 className="text-xl font-bold text-slate-700 mb-4">Add a new note</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={5}
          className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50"
          placeholder="Add notes about your client..."
        />
        <div className="flex justify-end mt-4">
          <button type="submit" disabled={!summary.trim()} className="flex items-center bg-primary-600 text-white px-4 py-2 text-sm rounded-lg shadow-md hover:bg-primary-700 transition-colors disabled:bg-slate-400">
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Note
          </button>
        </div>
      </form>
    </div>
  );
};

const getUnderwritingStatusBadge = (status: PolicyUnderwritingStatus | undefined) => {
    if (!status) return null;
    const styles = {
        [PolicyUnderwritingStatus.PENDING]: 'bg-amber-100 text-amber-800',
        [PolicyUnderwritingStatus.APPROVED]: 'bg-emerald-100 text-emerald-800',
        [PolicyUnderwritingStatus.REJECTED]: 'bg-rose-100 text-rose-800',
        [PolicyUnderwritingStatus.MORE_INFO_REQUIRED]: 'bg-sky-100 text-sky-800',
    };
    const style = styles[status] || 'bg-slate-100 text-slate-800';
    return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${style}`}>{status}</span>;
};


const PolicyCard: React.FC<{ policy: Policy; onEdit: (policy: Policy) => void; onUpdatePolicy: (policyId: number, updates: Partial<Policy>) => void; currentUser: User; onReview: (policy: Policy) => void; }> = ({ policy, onEdit, onUpdatePolicy, currentUser, onReview }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isUnderwriter = currentUser.role === UserRole.UNDERWRITING;
    const canSeeNotes = useMemo(() => [UserRole.ADMIN, UserRole.UNDERWRITING, UserRole.MANAGER].includes(currentUser.role), [currentUser.role]);


    const handleStatusChange = (status: PolicyStatus) => {
        if (window.confirm(`Are you sure you want to mark this policy as ${status}?`)) {
            onUpdatePolicy(policy.id, { status });
        }
        setIsMenuOpen(false);
    }
    
    return (
        <div className={`bg-white/70 backdrop-blur-lg p-5 rounded-2xl shadow-premium border border-white/50 border-l-4 ${getPolicyStatusColor(policy.status)} relative group`}>
            <div className="absolute top-3 right-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => onEdit(policy)}
                    className="p-1.5 rounded-full bg-slate-100/50 text-slate-500 hover:bg-primary-600 hover:text-white focus:opacity-100" 
                    aria-label="Edit Policy"
                    title="Edit Policy"
                >
                    <PencilIcon className="w-5 h-5" />
                </button>
                
                {policy.status === PolicyStatus.ACTIVE && (
                    <div className="relative">
                        <button 
                            onClick={() => setIsMenuOpen(prev => !prev)} 
                            onBlur={() => setTimeout(() => setIsMenuOpen(false), 150)}
                            className="p-1.5 rounded-full bg-slate-100/50 text-slate-500 hover:bg-primary-600 hover:text-white focus:opacity-100" 
                            aria-label="More Actions"
                            title="More Actions"
                        >
                            <EllipsisVerticalIcon className="w-5 h-5" />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-xl shadow-premium-lg ring-1 ring-black ring-opacity-5 z-20 modal-panel">
                                <div className="py-1">
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleStatusChange(PolicyStatus.CANCELLED); }} className="block px-4 py-2 text-sm text-rose-700 hover:bg-rose-50">Cancel Policy</a>
                                    <a href="#" onClick={(e) => { e.preventDefault(); handleStatusChange(PolicyStatus.EXPIRED); }} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100/50">Mark as Expired</a>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-primary-700">{policy.type} Insurance</h3>
                    <p className="text-sm text-slate-600 mt-1">Carrier: {policy.carrier || 'N/A'}</p>
                    <p className="text-sm text-slate-600 mt-1">Policy #: {policy.policyNumber}</p>
                </div>
                <div className="flex flex-col items-end gap-y-2">
                    <span className="text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-1 rounded-full">{policy.status}</span>
                    {getUnderwritingStatusBadge(policy.underwritingStatus)}
                </div>
            </div>
            <div className="flex justify-between items-baseline mt-4">
                <div>
                    <p className="text-2xl font-semibold text-slate-800">${policy.monthlyPremium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-sm font-normal text-slate-500">/month</p>
                </div>
                <div>
                    <p className="text-lg font-medium text-slate-600">${policy.annualPremium.toLocaleString()}</p>
                    <p className="text-xs font-normal text-slate-500 text-right">/year</p>
                </div>
            </div>
            <p className="text-sm text-slate-500 mt-2 border-t border-slate-200/50 pt-2">Effective: {policy.startDate} - {policy.endDate}</p>
            {policy.underwritingNotes && canSeeNotes && (
                <div className="mt-3 pt-3 border-t border-slate-200/50">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Underwriting Notes</h4>
                    <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{policy.underwritingNotes}</p>
                </div>
            )}
            {isUnderwriter && (
                <div className={`mt-3 pt-3 ${canSeeNotes && policy.underwritingNotes ? '' : 'border-t border-slate-200/50'}`}>
                    <button 
                        onClick={() => onReview(policy)}
                        className="w-full flex items-center justify-center bg-indigo-100 text-indigo-700 font-semibold px-3 py-2 text-sm rounded-lg hover:bg-indigo-200 transition-colors"
                    >
                        <DocumentTextIcon className="w-5 h-5 mr-2" />
                        Underwriting Review
                    </button>
                </div>
            )}
        </div>
    );
};


const ClientDetail: React.FC<ClientDetailProps> = ({ client, policies, interactions, assignedAgent, onBack, currentUser, onUpdateStatus, onOpenAddPolicyModal, onOpenEditPolicyModal, onUpdatePolicy, onSaveInteraction, onOpenAddReminderModal, onOpenEditClientModal, onOpenUnderwritingReviewModal, onOpenAssignModal }) => {
  const [activeTab, setActiveTab] = useState<'policies' | 'interactions' | 'notes'>('policies');
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const noteInteractions = useMemo(() => interactions
    .filter(i => i.type === InteractionType.NOTE)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [interactions]);

  const { activePolicies, totalAnnualPremium } = useMemo(() => {
    const active = policies.filter(p => p.status === PolicyStatus.ACTIVE);
    const premium = active.reduce((sum, p) => sum + p.annualPremium, 0);
    return { activePolicies: active, totalAnnualPremium: premium };
  }, [policies]);


  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummary('');
    const notesToSummarize = noteInteractions.map(note => `Note from ${note.date}:\n${note.summary}`).join('\n\n');
    if (!notesToSummarize.trim()) {
        setSummary("There are no notes to summarize.");
        setIsSummarizing(false);
        return;
    }
    const result = await summarizeNotes(notesToSummarize);
    setSummary(result);
    setIsSummarizing(false);
  };

  const getStatusColor = (status: ClientStatus) => {
    switch (status) {
        case ClientStatus.ACTIVE: return { badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' };
        case ClientStatus.LEAD: return { badge: 'bg-amber-100 text-amber-800 ring-amber-200', dot: 'bg-amber-500' };
        case ClientStatus.INACTIVE: return { badge: 'bg-rose-100 text-rose-800 ring-rose-200', dot: 'bg-rose-500' };
        default: return { badge: 'bg-slate-100 text-slate-800 ring-slate-200', dot: 'bg-slate-500' };
    }
  };

  const handleStatusChange = async (newStatus: ClientStatus) => {
    if (newStatus !== client.status) {
      await onUpdateStatus(client.id, newStatus);
    }
    setIsStatusDropdownOpen(false);
  };

  const canChangeStatus = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUB_ADMIN) return true;
    if (currentUser.role === UserRole.AGENT && currentUser.id === client.agentId) return true;
    return false;
  }, [currentUser, client.agentId]);
  
  const canManageAssignments = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUB_ADMIN;

  const TabButton: React.FC<{tabId: 'policies'|'interactions'|'notes', label: string}> = ({ tabId, label }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-5 py-2 font-medium text-sm rounded-lg ${activeTab === tabId ? 'bg-primary-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100/50'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-10">
      <button onClick={onBack} className="text-primary-600 hover:underline mb-8">&larr; Back to List</button>
      
      <div className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl border border-white/50 shadow-premium mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center">
          <img src={`https://i.pravatar.cc/150?u=${client.id}`} alt={`${client.firstName} ${client.lastName}`} className="w-20 h-20 rounded-full mr-6 mb-4 sm:mb-0" />
          <div className="flex-1">
            <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-800">{client.firstName} {client.lastName}</h1>
                {(currentUser.role !== UserRole.AGENT || currentUser.id === client.agentId) && (
                    <button 
                        onClick={() => onOpenEditClientModal(client)} 
                        className="text-slate-500 hover:text-primary-600 p-2 rounded-full hover:bg-slate-100/80 transition-colors"
                        aria-label="Edit client profile"
                        title="Edit client profile"
                    >
                        <PencilIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
            <p className="text-slate-600">Client since {client.joinDate}</p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-6 flex flex-col items-start sm:items-end space-y-2">
            <div className="relative">
                <button
                    onClick={() => canChangeStatus && setIsStatusDropdownOpen(prev => !prev)}
                    onBlur={() => setTimeout(() => setIsStatusDropdownOpen(false), 150)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ring-1 ring-inset transition-colors ${getStatusColor(client.status).badge} ${canChangeStatus ? 'hover:opacity-80' : 'cursor-default'}`}
                >
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(client.status).dot}`}></div>
                    <span>{client.status}</span>
                    {canChangeStatus && <ChevronDownIcon className="w-4 h-4" />}
                </button>
                {isStatusDropdownOpen && canChangeStatus && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white/90 backdrop-blur-xl rounded-xl shadow-premium-lg ring-1 ring-black ring-opacity-5 z-20 modal-panel">
                        <div className="py-1">
                            {Object.values(ClientStatus).map(status => (
                                <a
                                    href="#"
                                    key={status}
                                    onClick={(e) => { e.preventDefault(); handleStatusChange(status); }}
                                    className={`block px-4 py-2 text-sm ${client.status === status ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-100/50'}`}
                                >
                                    {status}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="md:col-span-1 bg-white/70 backdrop-blur-lg p-6 rounded-2xl border border-white/50 shadow-premium space-y-4 flex flex-col">
          <h3 className="text-xl font-bold text-slate-800 border-b border-slate-200/50 pb-2">Contact & Agent</h3>
          <div>
            <p className="text-sm font-medium text-slate-500">Email</p>
            <a href={`mailto:${client.email}`} className="text-md text-primary-600 hover:underline break-all">{client.email}</a>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Phone</p>
            <a href={`tel:${client.phone}`} className="text-md text-primary-600 hover:underline">{client.phone}</a>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Address</p>
            <p className="text-md text-slate-800">{client.address}</p>
          </div>
          <div>
              <p className="text-sm font-medium text-slate-500">Assigned Agent</p>
              {assignedAgent ? (
                  <div className="flex items-center gap-3 mt-1">
                      <p className="text-md font-semibold text-slate-800">{assignedAgent.name}</p>
                      {canManageAssignments && (
                          <button onClick={() => onOpenAssignModal(client)} className="text-xs font-semibold text-primary-600 hover:underline">(Re-assign)</button>
                      )}
                  </div>
              ) : (
                  <div className="flex items-center gap-3 mt-1">
                      <p className="text-md font-semibold text-amber-600">Unassigned</p>
                       {canManageAssignments && (
                          <button onClick={() => onOpenAssignModal(client)} className="flex items-center bg-primary-100 text-primary-700 text-xs font-bold px-2 py-1 rounded-md hover:bg-primary-200">
                              <UsersIcon className="w-4 h-4 mr-1" />
                              Assign
                          </button>
                      )}
                  </div>
              )}
          </div>
          <div className="mt-auto pt-4">
              <button 
                onClick={onOpenAddReminderModal}
                className="w-full flex items-center justify-center bg-secondary text-white font-semibold px-4 py-2.5 rounded-lg shadow-md hover:bg-slate-700 button-press"
              >
                <CalendarIcon className="w-5 h-5 mr-2" /> Add Calendar Reminder
              </button>
          </div>
        </div>
        <div className="md:col-span-2 bg-white/70 backdrop-blur-lg p-6 rounded-2xl border border-white/50 shadow-premium">
            <h3 className="text-xl font-bold text-slate-800 border-b border-slate-200/50 pb-2 mb-6">Client Snapshot</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="flex items-center">
                    <div className="p-4 bg-emerald-100 rounded-xl mr-4"><DollarSignIcon className="w-8 h-8 text-emerald-600" /></div>
                    <div>
                        <p className="text-sm text-slate-500">Total Annual Premium</p>
                        <p className="text-3xl font-bold text-slate-800">{formatCurrency(totalAnnualPremium)}</p>
                    </div>
                </div>
                 <div className="flex items-center">
                    <div className="p-4 bg-sky-100 rounded-xl mr-4"><ShieldIcon className="w-8 h-8 text-sky-600" /></div>
                    <div>
                        <p className="text-sm text-slate-500">Active Policies</p>
                        <p className="text-3xl font-bold text-slate-800">{activePolicies.length}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>


       <div className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl border border-white/50 shadow-premium mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200/50 pb-2">Sensitive Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
              {/* Personal & Medical Details */}
              <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary-700">Personal & Medical</h3>
                  <DetailItem label="Date of Birth" value={client.dob} />
                  <DetailItem label="SSN" value={client.ssn} />
                  <DetailItem label="Height" value={client.height} />
                  <DetailItem label="Weight" value={client.weight ? `${client.weight} lbs` : null} />
                  <DetailItem label="Birth State" value={client.birthState} />
                  <DetailItem label="City" value={client.city} />
                  <DetailItem label="Current State" value={client.state} />
              </div>

              {/* Financial Details */}
              <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary-700">Financial Details</h3>
                  <DetailItem label="Bank Name" value={client.bankName} />
                  <DetailItem label="Account Type" value={client.accountType} />
                  <DetailItem label="Routing Number" value={client.routingNumber} />
                  <DetailItem label="Account Number" value={client.accountNumber} />
              </div>

              {/* Medication Details */}
              <div className="space-y-4 lg:col-span-1 md:col-span-2">
                  <h3 className="text-lg font-semibold text-primary-700">Current Medications</h3>
                  {client.medications ? (
                      <p className="text-md text-slate-800 whitespace-pre-wrap bg-slate-100/50 p-3 rounded-lg">{client.medications}</p>
                  ) : (
                      <p className="text-md text-slate-400 italic">Not Provided</p>
                  )}
              </div>
          </div>
      </div>

      <div className="mb-6">
        <div className="flex space-x-2 border-b border-slate-200/50 pb-2">
            <TabButton tabId="policies" label="Policies" />
            <TabButton tabId="interactions" label="Interactions" />
            <TabButton tabId="notes" label="Notes & AI Summary" />
        </div>
      </div>
      
      <div>
        {activeTab === 'policies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {policies.map(policy => <PolicyCard key={policy.id} policy={policy} onEdit={onOpenEditPolicyModal} onUpdatePolicy={onUpdatePolicy} currentUser={currentUser} onReview={onOpenUnderwritingReviewModal} />)}
            <button onClick={onOpenAddPolicyModal} className="border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-4 text-slate-500 hover:bg-slate-100/50 hover:border-primary-500 hover:text-primary-600 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500">
                <PlusIcon className="w-8 h-8 mb-2" />
                <span className="font-semibold">Add New Policy</span>
            </button>
          </div>
        )}

        {activeTab === 'interactions' && (
          <div>
            <div className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl border border-white/50 shadow-premium">
               <h2 className="text-xl font-bold text-slate-700 mb-4">Interaction History</h2>
               <div className="relative border-l-2 border-slate-200/80 ml-3">
               {interactions.filter(i => i.type !== InteractionType.NOTE).map(interaction => (
                   <div key={interaction.id} className="mb-8 ml-8">
                      <span className="absolute -left-4 flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full text-xl">{getInteractionIcon(interaction.type)}</span>
                      <div className="p-4 bg-slate-100/50 rounded-lg border border-slate-200/50">
                          <div className="flex justify-between items-center">
                              <p className="font-semibold text-slate-800">{interaction.type}</p>
                              <time className="text-sm font-normal text-slate-500">{interaction.date}</time>
                          </div>
                          <p className="mt-2 text-slate-600">{interaction.summary}</p>
                      </div>
                  </div>
               ))}
               </div>
            </div>
            <AddInteractionForm clientId={client.id} onSave={onSaveInteraction} />
          </div>
        )}
        
        {activeTab === 'notes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <AddNoteForm clientId={client.id} onSave={onSaveInteraction} />
              <div className="mt-8 bg-white/70 backdrop-blur-lg p-8 rounded-2xl border border-white/50 shadow-premium">
                <h2 className="text-xl font-bold text-slate-700 mb-4">Note History</h2>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {noteInteractions.length > 0 ? noteInteractions.map(note => (
                    <div key={note.id} className="bg-slate-100/50 p-4 rounded-lg border border-slate-200/50">
                      <p className="text-xs font-semibold text-slate-500 mb-1">{note.date}</p>
                      <p className="text-slate-700 whitespace-pre-wrap">{note.summary}</p>
                    </div>
                  )) : <p className="text-slate-500">No notes recorded yet.</p>}
                </div>
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-lg p-8 rounded-2xl border border-white/50 shadow-premium">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-slate-700">AI Summary</h2>
                 <button onClick={handleSummarize} disabled={isSummarizing || noteInteractions.length === 0} className="flex items-center bg-primary-600 text-white px-3 py-2 text-sm rounded-lg shadow-md hover:bg-primary-700 transition-colors disabled:bg-slate-400">
                    <AiSparklesIcon className="w-5 h-5 mr-2"/>
                    {isSummarizing ? 'Summarizing...' : 'Summarize Notes'}
                 </button>
              </div>
              <div className="prose prose-sm max-w-none bg-slate-100/50 p-4 rounded-lg h-[calc(100%-4rem)] overflow-y-auto">
                {isSummarizing && <p className="text-slate-500 animate-pulse">Generating summary...</p>}
                {summary ? <div dangerouslySetInnerHTML={{ __html: summary.replace(/\\n/g, '<br />') }} /> : !isSummarizing && <p className="text-slate-400">Click "Summarize Notes" to generate an AI summary of your notes.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetail;