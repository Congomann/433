import React, { useState, useEffect, useMemo } from 'react';
import { User, Client, Task, Agent, Policy, Interaction, AISuggestion, AISuggestionAction, EmailDraft } from '../types';
import { getAIAssistantSuggestions, draftEmail } from '../services/geminiService';
import { AiSparklesIcon, CheckCircleIcon, PlusIcon, EnvelopeIcon, UserCircleIcon } from './icons';
import AddEditTaskModal from './AddEditTaskModal';
import DraftEmailModal from './DraftEmailModal';
import { useToast } from '../contexts/ToastContext';

interface AIAssistantViewProps {
  currentUser: User;
  clients: Client[];
  tasks: Task[];
  agents: Agent[];
  policies: Policy[];
  interactions: Interaction[];
  onSaveTask: (task: Omit<Task, 'id' | 'completed'> & { id?: number }) => void;
  onAssignLead: (clientId: number, updates: Partial<Client>) => void;
  onNavigate: (view: string) => void;
}

const AIAssistantView: React.FC<AIAssistantViewProps> = ({ currentUser, clients, tasks, agents, policies, interactions, onSaveTask, onAssignLead, onNavigate }) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  
  const [completedActions, setCompletedActions] = useState<number[]>([]); // To track completed suggestions by index

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToCreate, setTaskToCreate] = useState<Omit<Task, 'id' | 'completed' | 'agentId'> | null>(null);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [isDraftingEmail, setIsDraftingEmail] = useState(false);


  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      const result = await getAIAssistantSuggestions(currentUser, { clients, tasks, agents, policies, interactions });
      setSuggestions(result);
      setIsLoading(false);
    };
    fetchSuggestions();
  }, [currentUser, clients, tasks, agents, policies, interactions]);

  const handleCreateTask = (clientId?: number, title?: string) => {
    if (clientId && title) {
      setTaskToCreate({
        title,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
        clientId: clientId,
      });
      setIsTaskModalOpen(true);
    }
  };

  const handleDraftEmail = async (clientId?: number, prompt?: string) => {
    if (!clientId || !prompt) return;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    setIsDraftingEmail(true);
    const draft = await draftEmail(prompt, `${client.firstName} ${client.lastName}`);
    setEmailDraft({
      to: client.email,
      clientName: `${client.firstName} ${client.lastName}`,
      ...draft,
    });
    setIsDraftingEmail(false);
    setIsEmailModalOpen(true);
  };
  
  const handleAssignLead = (clientId?: number, agentId?: number, agentName?: string) => {
    if (!clientId || !agentId || !agentName) return;
    onAssignLead(clientId, { agentId });
    addToast('Lead Assigned', `Lead has been assigned to ${agentName}.`, 'success');
  };

  const handleAction = (action: AISuggestionAction, index: number) => {
    const client = clients.find(c => c.id === action.clientId);
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'the client';

    switch (action.type) {
      case 'CREATE_TASK':
        handleCreateTask(action.clientId, `Follow up with ${clientName}`);
        break;
      case 'DRAFT_EMAIL':
        handleDraftEmail(action.clientId, action.prompt);
        break;
      case 'ASSIGN_LEAD':
        handleAssignLead(action.clientId, action.assignToAgentId, action.assignToAgentName);
        break;
      case 'INFO_ONLY':
        // No action needed
        break;
    }
    // Mark this action as completed to provide visual feedback.
    setCompletedActions(prev => [...prev, index]);
  };

  const PRIORITY_STYLES = {
    High: { bg: 'bg-rose-50', border: 'border-rose-500', icon: 'bg-rose-500', text: 'text-rose-800' },
    Medium: { bg: 'bg-amber-50', border: 'border-amber-500', icon: 'bg-amber-500', text: 'text-amber-800' },
    Low: { bg: 'bg-sky-50', border: 'border-sky-500', icon: 'bg-sky-500', text: 'text-sky-800' },
  };

  const ACTION_BUTTONS: { [key in AISuggestion['action']['type']]?: { text: string, icon: React.ReactNode } } = {
    CREATE_TASK: { text: 'Create Task', icon: <PlusIcon className="w-4 h-4 mr-2" /> },
    DRAFT_EMAIL: { text: 'Draft Email', icon: <EnvelopeIcon className="w-4 h-4 mr-2" /> },
    ASSIGN_LEAD: { text: 'Assign Lead', icon: <UserCircleIcon className="w-4 h-4 mr-2" /> },
  };

  return (
    <div className="p-8">
      <div className="flex items-center mb-8">
        <AiSparklesIcon className="w-10 h-10 text-primary-600 mr-4" />
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">AI Daily Briefing</h1>
          <p className="text-slate-500">Your personalized, AI-powered suggestions for today.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Your AI assistant is analyzing your data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {suggestions.length > 0 ? suggestions.map((suggestion, index) => {
            const styles = PRIORITY_STYLES[suggestion.priority] || PRIORITY_STYLES.Low;
            const buttonInfo = ACTION_BUTTONS[suggestion.action.type];
            const isCompleted = completedActions.includes(index);
            return (
              <div key={index} className={`p-5 rounded-lg border-l-4 ${styles.bg} ${styles.border} card-enter`} style={{ animationDelay: `${index * 100}ms`}}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles.icon} text-white`}>
                      {suggestion.priority} Priority
                    </span>
                    <h3 className={`text-lg font-bold mt-2 ${styles.text}`}>{suggestion.title}</h3>
                    <p className="text-slate-600 mt-1">{suggestion.description}</p>
                  </div>
                  {buttonInfo && suggestion.action.type !== 'INFO_ONLY' && (
                     isCompleted ? (
                        <div className="flex items-center text-emerald-600 font-semibold text-sm ml-4 flex-shrink-0">
                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                            Action Completed
                        </div>
                    ) : (
                        <button
                          onClick={() => handleAction(suggestion.action, index)}
                          className="flex items-center bg-primary-600 text-white font-semibold px-4 py-2 rounded-md shadow-sm hover:bg-primary-500 text-sm ml-4 flex-shrink-0 button-press"
                        >
                          {isDraftingEmail && suggestion.action.type === 'DRAFT_EMAIL' ? 'Drafting...' : buttonInfo.icon}
                          {isDraftingEmail && suggestion.action.type === 'DRAFT_EMAIL' ? '' : buttonInfo.text}
                        </button>
                    )
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
                <CheckCircleIcon className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-800">All Caught Up!</h3>
                <p className="text-slate-500 mt-2">Your AI assistant has no new suggestions for you at this time.</p>
            </div>
          )}
        </div>
      )}
      
      <AddEditTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={(task) => {
            onSaveTask({...task, agentId: currentUser.id});
            setIsTaskModalOpen(false);
        }}
        taskToEdit={taskToCreate}
        clients={clients}
      />

      <DraftEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        draft={emailDraft}
        onSend={() => {
            setIsEmailModalOpen(false);
            addToast("Email Sent", `Your email to ${emailDraft?.clientName} has been sent successfully.`, "success");
        }}
      />
    </div>
  );
};

export default AIAssistantView;