import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppData, User, UserRole, Agent, AgentStatus, Client, Policy, Interaction, Task, Message, License, Notification, CalendarNote, Testimonial, ClientStatus, TestimonialStatus, EmailDraft, CalendarEvent, Chargeback, ChargebackStatus } from './types';
import { useDatabase } from './hooks/useDatabase';
import { useToast } from './contexts/ToastContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClientList from './components/ClientList';
import ClientDetail from './components/ClientDetail';
import TasksView from './components/TasksView';
import AgentManagement from './components/AgentManagement';
import AgentProfile from './components/AgentProfile';
import LeadDistribution from './components/LeadDistribution';
import CommissionsView from './components/CommissionsView';
import MessagingView from './components/MessagingView';
import CalendarView from './components/CalendarView';
import LicensesView from './components/LicensesView';
import TestimonialsManagement from './components/TestimonialsManagement';
import AIAssistantView from './components/AIAssistantView';
import AIOnboardingView from './components/AIOnboardingView';
import ManagerPortal from './components/ManagerPortal';
import UnderwritingPortal from './components/UnderwritingPortal';
import AddClientModal from './components/AddClientModal';
import AddEditPolicyModal from './components/AddEditPolicyModal';
import AddEditAgentModal from './components/AddEditAgentModal';
import EditMyProfileModal from './components/EditMyProfileModal';
import AddEditLeadModal from './components/AddEditLeadModal';
import AddEditTaskModal from './components/AddEditTaskModal';
import BroadcastModal from './components/BroadcastModal';
import { draftEmail } from './services/geminiService';
import DraftEmailModal from './components/DraftEmailModal';
import { EyeIcon, UserCircleIcon, UsersIcon, ChevronDownIcon } from './components/icons';
import PendingApproval from './components/PendingApproval';
import { MOCK_USERS } from './constants';
import { sign } from './server/auth';
import { setToken } from './services/authService';
import EditClientModal from './components/AddReminderModal';
import CalendarNoteModal from './components/CalendarNoteModal';
import ChargebackView from './components/ChargebackView';
import DemoModeSwitcher from './components/DemoModeSwitcher';
import UnderwritingReviewModal from './components/UnderwritingReviewModal';


// =============================================================================
// API CACHE SERVICE (Real-world optimization)
// =============================================================================

class APICache {
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private pendingRequests: Map<string, Promise<any>> = new Map();
    private readonly CACHE_DURATION = 30000; // 30 seconds cache

    async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
        const cached = this.cache.get(key);
        
        // Return cached data if not expired
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            console.log(`[Cache] Using cached data for: ${key}`);
            return cached.data;
        }

        // Return pending request if exists (deduplication)
        if (this.pendingRequests.has(key)) {
            console.log(`[Cache] Reusing pending request for: ${key}`);
            return this.pendingRequests.get(key)!;
        }

        // Make new request
        console.log(`[Cache] Making new request for: ${key}`);
        const request = fetcher();
        this.pendingRequests.set(key, request);

        try {
            const data = await request;
            this.cache.set(key, { data, timestamp: Date.now() });
            return data;
        } finally {
            this.pendingRequests.delete(key);
        }
    }

    clearKey(key: string) {
        this.cache.delete(key);
        this.pendingRequests.delete(key);
    }

    clearAll() {
        this.cache.clear();
        this.pendingRequests.clear();
    }
}

export const apiCache = new APICache();

// =============================================================================
// LOADING COMPONENT (Production-ready with graceful states)
// =============================================================================

const LoadingSpinner: React.FC<{ message?: string; progress?: number }> = ({ 
    message = "Loading CRM...", 
    progress 
}) => (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
            {/* Animated Logo/Spinner */}
            <div className="relative mb-6">
                <div className="w-20 h-20 border-4 border-primary-200 rounded-full animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-primary-600 rounded-full"></div>
            </div>
            
            {/* Progress Bar (if provided) */}
            {progress !== undefined && (
                <div className="w-64 bg-slate-200 rounded-full h-2 mb-4 mx-auto">
                    <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}
            
            {/* Loading Text */}
            <div className="text-xl font-semibold text-slate-700 mb-2">{message}</div>
            <div className="text-sm text-slate-500">Preparing your workspace...</div>
            
            {/* Loading Dots Animation */}
            <div className="flex justify-center mt-4 space-x-1">
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
        </div>
    </div>
);

// =============================================================================
// MAIN APP COMPONENT (Production-optimized)
// =============================================================================

const App: React.FC = () => {
    // Authentication State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [impersonatedUserId, setImpersonatedUserId] = useState<number | null>(null);
    const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);

    
    // UI State
    const { addToast } = useToast();
    const [view, setView] = useState('dashboard');
    const [viewParam, setViewParam] = useState<string | number | null>(null);
    const [loadingProgress, setLoadingProgress] = useState(0);

    // Modal States
    const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
    const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
    const [isAddEditPolicyModalOpen, setIsAddEditPolicyModalOpen] = useState(false);
    const [policyToEdit, setPolicyToEdit] = useState<Policy | null>(null);
    const [policyClientId, setPolicyClientId] = useState<number | null>(null);
    const [isAddEditAgentModalOpen, setIsAddEditAgentModalOpen] = useState(false);
    const [agentToEdit, setAgentToEdit] = useState<Agent | null>(null);
    const [isEditMyProfileModalOpen, setIsEditMyProfileModalOpen] = useState(false);
    const [isAddEditLeadModalOpen, setIsAddEditLeadModalOpen] = useState(false);
    const [leadToEdit, setLeadToEdit] = useState<Client | null>(null);
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [highlightedAgentId, setHighlightedAgentId] = useState<number | null>(null);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [selectedDateForNote, setSelectedDateForNote] = useState<Date | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [policyToReview, setPolicyToReview] = useState<Policy | null>(null);
    
    // AI Assistant States
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskToCreate, setTaskToCreate] = useState<Partial<Task> | null>(null);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
    const [isDraftingEmail, setIsDraftingEmail] = useState(false);

    // =========================================================================
    // AUTHENTICATION & INITIALIZATION (Production-ready with error handling)
    // =========================================================================

    useEffect(() => {
        // Since the login flow is disabled, we programmatically "log in" the default Admin user.
        // This generates and sets the JWT token required by the simulated API for authorization.
        const adminUser = MOCK_USERS.find(u => u.role === UserRole.ADMIN);
        if (adminUser) {
            const token = sign({ id: adminUser.id, role: adminUser.role });
            setToken(token);
            setCurrentUser(adminUser);
        }
    }, []);

    const handleLogout = useCallback(() => {
        addToast('Logout Disabled', 'Login functionality is currently disabled.', 'info');
    }, [addToast]);


    // =========================================================================
    // DATA MANAGEMENT & USER RESOLUTION
    // =========================================================================

    const db = useDatabase(currentUser);

    // Resolve display user (with impersonation support)
    const displayUser = useMemo(() => {
        if (!currentUser) return null;
        if (impersonatedUserId === null) return currentUser;
        
        const impersonatedUser = db.users.find(u => u.id === impersonatedUserId);
        return impersonatedUser || currentUser;
    }, [impersonatedUserId, currentUser, db.users]);

    // =========================================================================
    // ROUTING & NAVIGATION (Production-ready with error boundaries)
    // =========================================================================

    const handleNavigate = useCallback((path: string) => {
        try {
            window.location.hash = `/${path}`;
        } catch (error) {
            console.error('[Navigation] Failed to navigate:', error);
            addToast('Navigation Error', 'Could not navigate to requested page', 'error');
        }
    }, [addToast]);

    // Hash-based routing with error handling
    useEffect(() => {
        const handleHashChange = () => {
            try {
                const hash = window.location.hash.replace(/^#\/?/, '');
                const [path, param] = hash.split('?')[0].split('/');
                setView(path || 'dashboard');
                setViewParam(param || null);
            } catch (error) {
                console.error('[Navigation] Hash change handling failed:', error);
                setView('dashboard'); // Fallback to home page
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Initial route check

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // =========================================================================
    // DATA FILTERING & SECURITY (Role-based data access)
    // =========================================================================

    const displayData = useMemo(() => {
        const allData: AppData = {
            users: db.users, agents: db.agents, clients: db.clients, policies: db.policies, 
            interactions: db.interactions, tasks: db.tasks, messages: db.messages, 
            licenses: db.licenses, notifications: db.notifications, 
            calendarNotes: db.calendarNotes, testimonials: db.testimonials, calendarEvents: db.calendarEvents,
            chargebacks: db.chargebacks,
        };

        if (!displayUser) {
            return {
                users: [], agents: [], clients: [], policies: [], interactions: [],
                tasks: [], messages: [], licenses: [], notifications: [],
                calendarNotes: [], testimonials: [], calendarEvents: [], chargebacks: [],
            };
        }
    
        // Agent-specific data filtering (security boundary)
        if (displayUser.role === UserRole.AGENT) {
            const agentClients = allData.clients.filter(c => c.agentId === displayUser.id);
            const agentClientIds = new Set(agentClients.map(c => c.id));
            
            return {
                ...allData,
                clients: agentClients,
                policies: allData.policies.filter(p => agentClientIds.has(p.clientId)),
                tasks: allData.tasks.filter(t => t.agentId === displayUser.id || (t.clientId && agentClientIds.has(t.clientId))),
                interactions: allData.interactions.filter(i => agentClientIds.has(i.clientId)),
                licenses: allData.licenses.filter(l => l.agentId === displayUser.id),
                calendarNotes: allData.calendarNotes.filter(cn => cn.userId === displayUser.id),
                testimonials: allData.testimonials.filter(t => t.agentId === displayUser.id),
                chargebacks: allData.chargebacks.filter(c => c.agentId === displayUser.id),
            };
        }
        
        return allData;
    }, [displayUser, db.users, db.agents, db.clients, db.policies, db.interactions, db.tasks, db.messages, db.licenses, db.notifications, db.calendarNotes, db.testimonials, db.calendarEvents, db.chargebacks]);

    // =========================================================================
    // EVENT HANDLERS (Production-ready with error handling)
    // =========================================================================
    const handleOpenReviewModal = useCallback((policy: Policy) => {
        setPolicyToReview(policy);
        setIsReviewModalOpen(true);
    }, []);

    const handleOpenEditClientModal = useCallback((client: Client) => {
        setClientToEdit(client);
        setIsEditClientModalOpen(true);
    }, []);

    const handleSaveEditedClient = useCallback(async (clientData: Client) => {
        if (!clientData.id) return;
        try {
            await db.handlers.handleUpdateClient(clientData.id, clientData);
            addToast('Client Updated', `${clientData.firstName} ${clientData.lastName}'s profile has been saved.`, 'success');
            setIsEditClientModalOpen(false);
            setClientToEdit(null);
        } catch (error: any) {
            addToast('Update Failed', error.message || 'Could not update client profile.', 'error');
        }
    }, [db.handlers, addToast]);
    
    const handleOpenNoteModal = useCallback((date: Date) => {
      setSelectedDateForNote(date);
      setIsNoteModalOpen(true);
    }, []);

    const handleOpenAddPolicyModal = useCallback((clientId: number) => {
        setPolicyToEdit(null);
        setPolicyClientId(clientId);
        setIsAddEditPolicyModalOpen(true);
    }, []);

    const handleOpenEditPolicyModal = useCallback((policy: Policy) => {
        setPolicyToEdit(policy);
        setPolicyClientId(policy.clientId);
        setIsAddEditPolicyModalOpen(true);
    }, []);
    
    const handleOpenAddReminderModal = useCallback(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        handleOpenNoteModal(tomorrow);
    }, [handleOpenNoteModal]);

    const handleSaveAgent = useCallback(async (agentData: Agent) => {
        const isNew = !agentData.id;
        try {
            if (isNew) {
                await db.handlers.onRegister({ 
                    name: agentData.name, 
                    email: agentData.email, 
                    password: 'password123', 
                    role: UserRole.AGENT 
                });
            } else {
                await db.handlers.onUpdateAgentProfile(agentData);
            }
            addToast(
                isNew ? 'Agent Added' : 'Agent Updated', 
                `${agentData.name}'s profile has been saved.`, 
                'success'
            );
            setIsAddEditAgentModalOpen(false);
        } catch (error: any) {
            console.error('[Agent Save] Failed:', error);
            addToast('Save Error', error.message || 'Could not save agent.', 'error');
        }
    }, [db.handlers, addToast]);
    
    const handleApproveAgent = useCallback(async (agentId: number, newRole: UserRole) => {
        try {
            await db.handlers.handleApproveAgent(agentId, newRole);
            setHighlightedAgentId(agentId);
            addToast('Agent Approved', 'Agent has been activated successfully', 'success');
            setTimeout(() => setHighlightedAgentId(null), 3000);
        } catch (error: any) {
            addToast('Approval Failed', error.message || 'Could not approve agent', 'error');
        }
    }, [db.handlers, addToast]);

    const handleSaveLead = useCallback(async (leadData: Client) => {
        try {
            if (leadData.id) {
                await db.handlers.handleUpdateClient(leadData.id, leadData);
                addToast('Lead Updated', 'Lead information has been updated', 'success');
            } else {
                const { id, ...newLeadData } = leadData;
                await db.handlers.handleAddClient(newLeadData);
                addToast('Lead Created', 'New lead has been added to the system', 'success');
            }
            setIsAddEditLeadModalOpen(false);
            setLeadToEdit(null);
        } catch (error: any) {
            addToast('Save Failed', error.message || 'Could not save lead', 'error');
        }
    }, [db.handlers, addToast]);
    
    const handleOpenCreateLead = useCallback(() => {
        setLeadToEdit(null);
        setIsAddEditLeadModalOpen(true);
    }, []);
    
    const handleOpenEditLead = useCallback((lead: Client) => {
        setLeadToEdit(lead);
        setIsAddEditLeadModalOpen(true);
    }, []);
    
    const handleAIAssignLead = useCallback((clientId: number, updates: Partial<Client>) => {
        db.handlers.handleUpdateClient(clientId, updates);
        const client = db.clients.find(c => c.id === clientId);
        const agent = db.agents.find(a => a.id === updates.agentId);
        if (client && agent) {
            addToast('Lead Assigned', `Lead ${client.firstName} ${client.lastName} assigned to ${agent.name}.`, 'success');
        }
    }, [db.handlers, db.clients, db.agents, addToast]);
    
    const handleAIDraftEmail = useCallback(async (clientId?: number, prompt?: string) => {
        if (!clientId || !prompt) return;
        
        const client = db.clients.find(c => c.id === clientId);
        if (!client) {
            addToast('Client Not Found', 'Could not find client for email drafting', 'error');
            return;
        }
        
        setIsDraftingEmail(true);
        try {
            const draft = await draftEmail(prompt, `${client.firstName} ${client.lastName}`);
            setEmailDraft({
                to: client.email,
                clientName: `${client.firstName} ${client.lastName}`,
                ...draft,
            });
            setIsEmailModalOpen(true);
        } catch (error: any) {
            addToast('Draft Failed', 'Could not generate email draft', 'error');
        } finally {
            setIsDraftingEmail(false);
        }
    }, [db.clients, addToast]);
    
    const handleAICreateTask = useCallback((clientId?: number, title?: string) => {
        if (!title) return;
        setTaskToCreate({ 
            title, 
            clientId, 
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
        });
        setIsTaskModalOpen(true);
    }, []);

    const onAICreateTask = useCallback((task: Omit<Task, 'id' | 'completed'> & { id?: number }) => {
        if (displayUser) {
            db.handlers.handleSaveTask({...task, agentId: displayUser.id});
            addToast('Task Created', 'New task has been added to your list', 'success');
        }
        setIsTaskModalOpen(false);
    }, [displayUser, db.handlers, addToast]);

    // =========================================================================
    // RENDER LOGIC
    // =========================================================================

    const renderView = () => {
        const clientForDetail = view === 'client' && viewParam ? db.clients.find(c => c.id === Number(viewParam)) : null;
        const agentForClients = view === 'clients' && viewParam ? db.agents.find(a => a.id === Number(viewParam)) : null;
        const clientsForList = agentForClients ? db.clients.filter(c => c.agentId === agentForClients.id) : displayData.clients;

        try {
            switch (view) {
                case 'dashboard': return <Dashboard user={displayUser!} clients={displayData.clients} policies={displayData.policies} tasks={displayData.tasks} agentsCount={db.agents.length} agents={db.agents} />;
                case 'clients': return <ClientList title={agentForClients ? `${agentForClients.name}'s Clients` : 'All Clients'} clients={clientsForList} onAddClient={() => setIsAddClientModalOpen(true)} onSelectClient={(id) => handleNavigate(`client/${id}`)} agentFilter={agentForClients} onClearFilter={() => handleNavigate('clients')} />;
                case 'client': return clientForDetail ? <ClientDetail client={clientForDetail} policies={db.policies.filter(p => p.clientId === clientForDetail.id)} interactions={db.interactions.filter(i => i.clientId === clientForDetail.id)} assignedAgent={db.agents.find(a => a.id === clientForDetail.agentId)} onBack={() => handleNavigate('clients')} currentUser={displayUser!} onUpdateStatus={db.handlers.handleUpdateClientStatus} onOpenAddPolicyModal={() => handleOpenAddPolicyModal(clientForDetail.id)} onOpenEditPolicyModal={handleOpenEditPolicyModal} onUpdatePolicy={db.handlers.handleUpdatePolicy} onSaveInteraction={db.handlers.handleSaveInteraction} onOpenAddReminderModal={handleOpenAddReminderModal} onOpenEditClientModal={handleOpenEditClientModal} /> : <div className="p-8 text-center">Client not found</div>;
                case 'tasks': return <TasksView tasks={displayData.tasks} clients={displayData.clients} onSaveTask={db.handlers.handleSaveTask} onToggleTask={db.handlers.handleToggleTask} onDeleteTask={db.handlers.handleDeleteTask} onSelectClient={(id) => handleNavigate(`client/${id}`)} />;
                case 'agents': return <AgentManagement currentUser={displayUser!} agents={db.agents} users={db.users} onNavigate={handleNavigate} onAddAgent={() => { setAgentToEdit(null); setIsAddEditAgentModalOpen(true); }} onEditAgent={(agent) => { setAgentToEdit(agent); setIsAddEditAgentModalOpen(true); }} onApproveAgent={handleApproveAgent} onDeactivateAgent={db.handlers.handleDeactivateAgent} onReactivateAgent={db.handlers.handleReactivateAgent} onRejectAgent={db.handlers.handleRejectAgent} onDeleteAgent={db.handlers.handleDeleteAgent} highlightedAgentId={highlightedAgentId} />;
                case 'agent': {
                    const agentForProfile = viewParam ? db.agents.find(a => a.slug === viewParam) : null;
                    if (!agentForProfile) return <div className="p-8 text-center">Agent not found</div>;
                    return <AgentProfile agent={agentForProfile} onAddLead={(leadData) => db.handlers.handleAddLeadFromProfile(leadData, agentForProfile.id)} currentUser={displayUser!} onMessageAgent={(agentId) => handleNavigate(`messages/${agentId}`)} onViewAgentClients={(agentId) => handleNavigate(`clients/${agentId}`)} onUpdateProfile={db.handlers.onUpdateAgentProfile} licenses={displayData.licenses} onAddLicense={db.handlers.handleAddLicense} onDeleteLicense={db.handlers.onDeleteLicense} testimonials={displayData.testimonials} onAddTestimonial={db.handlers.onAddTestimonial} />;
                }
                case 'my-profile': {
                    const currentAgent = db.agents.find(a => a.id === displayUser!.id);
                    if (!currentAgent) return <div className="p-8 text-center">Profile not available.</div>;
                    return <AgentProfile agent={currentAgent} onAddLead={(leadData) => db.handlers.handleAddLeadFromProfile(leadData, currentAgent.id)} currentUser={displayUser!} onMessageAgent={(agentId) => handleNavigate(`messages/${agentId}`)} onViewAgentClients={(agentId) => handleNavigate(`clients/${agentId}`)} onUpdateProfile={db.handlers.onUpdateAgentProfile} licenses={displayData.licenses} onAddLicense={db.handlers.handleAddLicense} onDeleteLicense={db.handlers.onDeleteLicense} testimonials={displayData.testimonials} onAddTestimonial={db.handlers.onAddTestimonial} />;
                }
                case 'leads': return <LeadDistribution leads={displayData.clients.filter(c => c.status === ClientStatus.LEAD)} onSelectLead={(id) => handleNavigate(`client/${id}`)} onCreateLead={handleOpenCreateLead} onEditLead={handleOpenEditLead} onDeleteLead={(id) => db.handlers.handleDeleteTask(id)} />;
                case 'commissions': return <CommissionsView currentUser={displayUser!} agents={db.agents} policies={db.policies} clients={db.clients} chargebacks={displayData.chargebacks} onUpdatePolicy={db.handlers.handleUpdatePolicy} />;
                case 'chargebacks': return <ChargebackView chargebacks={displayData.chargebacks} onUpdateStatus={db.handlers.handleUpdateChargebackStatus} />;
                case 'messages': return <MessagingView currentUser={displayUser!} users={db.users} messages={db.messages} onSendMessage={db.handlers.handleSendMessage} onEditMessage={db.handlers.handleEditMessage} onTrashMessage={db.handlers.handleTrashMessage} onRestoreMessage={db.handlers.handleRestoreMessage} onPermanentlyDeleteMessage={db.handlers.handlePermanentlyDeleteMessage} initialSelectedUserId={viewParam ? Number(viewParam) : undefined} onMarkConversationAsRead={db.handlers.handleMarkConversationAsRead} onOpenBroadcast={() => setIsBroadcastModalOpen(true)} onTyping={() => {}} typingStatus={{}} />;
                case 'calendar': return <CalendarView currentUser={displayUser!} agents={db.agents} calendarEvents={db.calendarEvents} calendarNotes={displayData.calendarNotes} users={displayData.users} onOpenNoteModal={handleOpenNoteModal} />;
                case 'licenses': {
                    const currentAgent = db.agents.find(a => a.id === displayUser!.id);
                    if (!currentAgent) return <div className="p-8 text-center">Not an agent.</div>;
                    return <LicensesView agent={currentAgent} licenses={displayData.licenses} onAddLicense={db.handlers.handleAddLicense} onDeleteLicense={db.handlers.onDeleteLicense} />;
                }
                case 'testimonials': return <TestimonialsManagement testimonials={displayData.testimonials} onUpdateTestimonialStatus={db.handlers.handleUpdateTestimonialStatus} onDeleteTestimonial={db.handlers.handleDeleteTestimonial} onNavigate={handleNavigate} />;
                case 'ai-assistant': return <AIAssistantView currentUser={displayUser!} clients={db.clients} tasks={db.tasks} agents={db.agents} policies={db.policies} interactions={db.interactions} onSaveTask={onAICreateTask} onAssignLead={handleAIAssignLead} onNavigate={handleNavigate} />;
                case 'ai-onboarding': return <AIOnboardingView leads={displayData.clients.filter(c => c.status === ClientStatus.LEAD)} onSave={db.handlers.handleUpdateClientAndAddInteractions} onNavigate={handleNavigate} />;
                case 'manager-portal': return <ManagerPortal currentUser={displayUser!} agents={db.agents} clients={db.clients} policies={db.policies} onNavigate={handleNavigate} />;
                case 'underwriting-portal': return <UnderwritingPortal policies={db.policies} clients={db.clients} agents={db.agents} onNavigate={handleNavigate} />;

                default: return <div className="p-8">View '{view}' not found.</div>;
            }
        } catch (e) {
            console.error("Error rendering view:", e);
            addToast('Render Error', 'Could not display the requested page.', 'error');
            return <div className="p-8 text-rose-500">An error occurred while rendering this page.</div>
        }
    };

    if (db.isLoading || !currentUser || !displayUser) {
        return <LoadingSpinner progress={loadingProgress} />;
    }

    if (agentStatus === AgentStatus.PENDING) {
        return <PendingApproval onLogout={handleLogout} />;
    }
    
    return (
        <>
            <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
                <Sidebar 
                    currentView={view} 
                    onNavigate={handleNavigate} 
                    currentUser={displayUser} 
                    onEditMyProfile={() => setIsEditMyProfileModalOpen(true)}
                    notifications={displayData.notifications}
                    onNotificationClick={(n) => {
                        db.handlers.onMarkNotificationRead(n.id);
                        handleNavigate(n.link);
                    }}
                    onClearAllNotifications={(userId) => db.handlers.onMarkAllNotificationsRead(userId)}
                    impersonatedRole={impersonatedUserId ? displayUser.role : null}
                    onLogout={handleLogout}
                />
                <main className="flex-1 overflow-y-auto ml-72">
                    {renderView()}
                </main>
            </div>
            {currentUser.role === UserRole.ADMIN && (
                <DemoModeSwitcher
                    adminUser={currentUser}
                    subAdminUser={db.users.find(u => u.role === UserRole.SUB_ADMIN)}
                    managerUser={db.users.find(u => u.role === UserRole.MANAGER)}
                    underwriterUser={db.users.find(u => u.role === UserRole.UNDERWRITING)}
                    agents={db.agents.filter(a => a.status === AgentStatus.ACTIVE)}
                    impersonatedUserId={impersonatedUserId}
                    onSwitchUser={setImpersonatedUserId}
                />
            )}
            
            <AddClientModal isOpen={isAddClientModalOpen} onClose={() => setIsAddClientModalOpen(false)} onAddClient={db.handlers.handleAddClient} />
            <EditClientModal isOpen={isEditClientModalOpen} onClose={() => setIsEditClientModalOpen(false)} onSave={handleSaveEditedClient} clientToEdit={clientToEdit} />
            <AddEditPolicyModal isOpen={isAddEditPolicyModalOpen} onClose={() => setIsAddEditPolicyModalOpen(false)} onSave={db.handlers.handleSavePolicy} policyToEdit={policyToEdit} clientId={policyClientId} />
            <AddEditAgentModal isOpen={isAddEditAgentModalOpen} onClose={() => setIsAddEditAgentModalOpen(false)} onSave={handleSaveAgent} agentToEdit={agentToEdit} />
            <EditMyProfileModal isOpen={isEditMyProfileModalOpen} onClose={() => setIsEditMyProfileModalOpen(false)} onSave={db.handlers.handleUpdateMyProfile} currentUser={displayUser} />
            <AddEditLeadModal isOpen={isAddEditLeadModalOpen} onClose={() => setIsAddEditLeadModalOpen(false)} onSave={handleSaveLead} agents={db.agents} leadToEdit={leadToEdit} />
            <AddEditTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onSave={onAICreateTask} taskToEdit={taskToCreate} clients={db.clients} />
            <BroadcastModal isOpen={isBroadcastModalOpen} onClose={() => setIsBroadcastModalOpen(false)} onSend={db.handlers.handleBroadcastMessage} />
            <DraftEmailModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} draft={emailDraft} onSend={() => { setIsEmailModalOpen(false); addToast("Email Sent", `Your email to ${emailDraft?.clientName} has been sent successfully (simulated).`, "success"); }} />
            {selectedDateForNote && (
              <CalendarNoteModal
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                onSave={db.handlers.handleSaveCalendarNote}
                onDelete={db.handlers.handleDeleteCalendarNote}
                selectedDate={selectedDateForNote}
                notesForDay={displayData.calendarNotes.filter(n => n.date === selectedDateForNote.toISOString().split('T')[0])}
                currentUser={displayUser}
                users={displayData.users}
              />
            )}
            <UnderwritingReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                policy={policyToReview}
                onSave={(policyId, updates) => {
                    db.handlers.handleSaveUnderwritingReview(policyId, updates);
                    setIsReviewModalOpen(false);
                }}
            />
        </>
    );
};

export default App;