import { useState, useEffect, useCallback } from 'react';
import * as apiClient from '../services/apiClient';
import { AppData, User, Agent, Client, Policy, Interaction, Task, Message, ClientStatus, UserRole, InteractionType, AgentStatus, License, Notification, CalendarNote, Testimonial, TestimonialStatus, CalendarEvent, Chargeback, ChargebackStatus, PolicyUnderwritingStatus, AICallLog } from '../types';
import { useToast } from '../contexts/ToastContext';

export const useDatabase = (currentUser: User | null) => {
    const [data, setData] = useState<AppData>({
        users: [], agents: [], clients: [], policies: [], interactions: [],
        tasks: [], messages: [], licenses: [], notifications: [],
        calendarNotes: [], testimonials: [], calendarEvents: [], chargebacks: [],
        aiCallLogs: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();
    const isLoggedIn = !!currentUser;

    const fetchData = useCallback(async (isPolling = false) => {
        if (!isLoggedIn) {
            if (!isPolling) setIsLoading(false);
            return;
        }
        if (!isPolling) setIsLoading(true);
        try {
            const appData = await apiClient.get<AppData>('/api/data');
            setData(currentData => {
                if (JSON.stringify(currentData) === JSON.stringify(appData)) {
                    return currentData;
                }
                return appData;
            });
        } catch (error) {
            console.error("Failed to fetch data", error);
            if (!isPolling) addToast("Error", "Could not load CRM data.", "error");
        } finally {
            if (!isPolling) setIsLoading(false);
        }
    }, [isLoggedIn, addToast]);

    useEffect(() => {
        if (isLoggedIn) {
            fetchData(false);

            const intervalId = setInterval(() => {
                fetchData(true); 
            }, 1500);

            return () => clearInterval(intervalId);
        }
    }, [isLoggedIn, fetchData]);
    
    const handleApiCall = async (
        apiCall: () => Promise<any>,
        successTitle: string,
        successMessage: string
    ) => {
        try {
            const result = await apiCall();
            if (successTitle || successMessage) {
                addToast(successTitle, successMessage, 'success');
            }
            await fetchData(true);
            return result;
        } catch (error: any) {
            addToast('Error', error.message || 'An unexpected error occurred.', 'error');
            throw error;
        }
    };
    
    const handlers = {
        onRegister: (userData: Omit<User, 'id' | 'title' | 'avatar'>) => handleApiCall(
            () => apiClient.register(userData), 'Registration Submitted', 'Your application is pending approval.'
        ),
        onUpdateAgentProfile: (agentData: Agent, role?: UserRole) => handleApiCall(
            () => apiClient.put(`/api/agents/${agentData.id}`, { ...agentData, role }),
            'Profile Updated', 'Agent profile has been saved.'
        ),
        onMarkNotificationRead: (id: number) => handleApiCall(
            () => apiClient.put(`/api/notifications/${id}`, { isRead: true }), '', ''
        ),
        onMarkAllNotificationsRead: (userId: number) => handleApiCall(
            () => apiClient.put(`/api/notifications/mark-all-read`, { userId }), '', ''
        ),
        onAddTestimonial: (testimonialData: Omit<Testimonial, 'id' | 'status' | 'submissionDate'>) => handleApiCall(
            () => apiClient.post('/api/testimonials', testimonialData),
            'Testimonial Submitted', 'Thank you! Your testimonial is pending approval.'
        ),
        // FIX: Added missing handlers for updating and deleting testimonials.
        handleUpdateTestimonialStatus: (testimonialId: number, status: TestimonialStatus) => handleApiCall(
            () => apiClient.put(`/api/testimonials/${testimonialId}`, { status }),
            'Testimonial Updated', 'The testimonial status has been updated.'
        ),
        handleDeleteTestimonial: (testimonialId: number) => handleApiCall(
            () => apiClient.del(`/api/testimonials/${testimonialId}`),
            'Testimonial Deleted', 'The testimonial has been removed.'
        ),
        handleAddClient: (clientData: Omit<Client, 'id'>) => handleApiCall(
            () => apiClient.post('/api/clients', clientData),
            'Client Added', 'New client has been successfully created.'
        ),
        handleUpdateClient: (clientId: number, clientData: Partial<Client>) => handleApiCall(
            () => apiClient.put(`/api/clients/${clientId}`, clientData),
            'Client Updated', 'Client details have been successfully updated.'
        ),
        handleUpdateClientAndAddInteractions: (clientId: number, clientData: Partial<Client>, interactions: Omit<Interaction, 'id' | 'clientId'>[]) => handleApiCall(
            () => apiClient.post(`/api/clients/${clientId}/onboarding-data`, { clientData, interactions }),
            'Onboarding Complete', 'Client profile has been updated with onboarding data.'
        ),
        handleSaveTask: async (taskData: Omit<Task, 'id'|'completed'> & { id?: number }) => {
            const apiCall = taskData.id
                ? () => apiClient.put(`/api/tasks/${taskData.id}`, taskData)
                : () => apiClient.post('/api/tasks', { ...taskData, completed: false });
            await handleApiCall(apiCall, 'Task Saved', 'Task details have been updated.');
        },
        handleToggleTask: (taskId: number) => {
            const task = data.tasks.find(t => t.id === taskId);
            if(task) {
                handleApiCall(
                    () => apiClient.put(`/api/tasks/${taskId}`, { completed: !task.completed }),
                    'Task Updated', `Task marked as ${!task.completed ? 'complete' : 'active'}.`
                )
            }
        },
        handleDeleteTask: (taskId: number) => handleApiCall(
            () => apiClient.del(`/api/tasks/${taskId}`),
            'Task Deleted', 'The task has been permanently removed.'
        ),
        handleSavePolicy: async (policyData: Omit<Policy, 'id'> & { id?: number }) => {
             const apiCall = policyData.id
                ? () => apiClient.put(`/api/policies/${policyData.id}`, policyData)
                : () => apiClient.post('/api/policies', policyData);
            await handleApiCall(apiCall, 'Policy Saved', 'Policy details have been updated.');
        },
        handleUpdatePolicy: (policyId: number, updates: Partial<Policy>) => handleApiCall(
            () => apiClient.put(`/api/policies/${policyId}`, updates),
            'Policy Updated', 'The policy has been successfully updated.'
        ),
        handleSaveUnderwritingReview: (policyId: number, updates: { underwritingStatus: PolicyUnderwritingStatus, underwritingNotes: string }) => handleApiCall(
            () => apiClient.put(`/api/policies/${policyId}`, updates),
            'Review Saved', 'The underwriting review has been saved.'
        ),
        handleAddLicense: (licenseData: Omit<License, 'id'>) => handleApiCall(
            () => apiClient.post('/api/licenses', licenseData),
            'License Added', 'New license has been successfully uploaded.'
        ),
        onDeleteLicense: (licenseId: number) => handleApiCall(
            () => apiClient.del(`/api/licenses/${licenseId}`),
            'License Deleted', 'The license has been removed.'
        ),
        handleSaveCalendarNote: async (noteData: Omit<CalendarNote, 'id'> & { id?: number }) => {
             const apiCall = noteData.id
                ? () => apiClient.put(`/api/calendarNotes/${noteData.id}`, noteData)
                : () => apiClient.post('/api/calendarNotes', noteData);
            await handleApiCall(apiCall, 'Note Saved', 'Calendar note has been saved.');
        },
        handleDeleteCalendarNote: (noteId: number) => handleApiCall(
            () => apiClient.del(`/api/calendarNotes/${noteId}`),
            'Note Deleted', 'The calendar note has been removed.'
        ),
        handleUpdateChargebackStatus: (id: number, status: ChargebackStatus) => handleApiCall(
            () => apiClient.put(`/api/chargebacks/${id}`, { status }),
            'Status Updated', 'Chargeback status has been updated.'
        ),
        handleSaveInteraction: (interactionData: Omit<Interaction, 'id'>) => handleApiCall(
            () => apiClient.post('/api/interactions', interactionData),
            'Interaction Logged', 'The interaction has been saved.'
        ),
        handleSendMessage: async (receiverId: number, text: string) => {
            if (!currentUser) return;
            const tempId = -Date.now();
            const tempMessage: Message = { id: tempId, senderId: currentUser.id, receiverId: receiverId, text: text, timestamp: new Date().toISOString(), status: 'active', source: 'internal', isRead: true };
            setData(prevData => ({ ...prevData, messages: [...prevData.messages, tempMessage] }));

            try {
                const savedMessage = await apiClient.sendMessage(receiverId, text);
                setData(prevData => {
                    const finalMessages = prevData.messages.filter(m => m.id !== tempId);
                    finalMessages.push(savedMessage);
                    finalMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                    return { ...prevData, messages: finalMessages };
                });
            } catch (error: any) {
                addToast('Error', error.message || 'Failed to send message.', 'error');
                setData(prevData => ({ ...prevData, messages: prevData.messages.filter(m => m.id !== tempId) }));
            }
        },
        handleEditMessage: (messageId: number, text: string) => handleApiCall(() => apiClient.editMessage(messageId, text), 'Message Edited', 'Your message has been updated.'),
        handleTrashMessage: (messageId: number) => handleApiCall(() => apiClient.trashMessage(messageId), 'Message Trashed', 'The message has been moved to the trash.'),
        handleRestoreMessage: (messageId: number) => handleApiCall(() => apiClient.restoreMessage(messageId), 'Message Restored', 'The message has been moved back to the inbox.'),
        handlePermanentlyDeleteMessage: (messageId: number) => handleApiCall(() => apiClient.permanentlyDeleteMessage(messageId), 'Message Deleted', 'The message has been permanently deleted.'),
        handleBroadcastMessage: (text: string) => handleApiCall(() => apiClient.broadcastMessage(text), 'Broadcast Sent', 'Your message has been sent to all active users.'),
        handleMarkConversationAsRead: (senderId: number) => handleApiCall(() => apiClient.markConversationAsRead(senderId), '', ''),
        handleUpdateClientStatus: (id: number, status: ClientStatus) => handleApiCall(() => apiClient.put(`/api/clients/${id}`, { status }), 'Client Status Updated', `Client is now marked as ${status}.`),
        handleApproveAgent: (agentId: number, role: UserRole) => handleApiCall(() => apiClient.approveAgent(agentId, role), 'Agent Approved', 'The agent account has been activated.'),
        handleDeactivateAgent: (id: number) => handleApiCall(() => apiClient.updateAgentStatus(id, AgentStatus.INACTIVE), 'Agent Deactivated', 'The agent account is now inactive.'),
        handleReactivateAgent: (id: number) => handleApiCall(() => apiClient.updateAgentStatus(id, AgentStatus.ACTIVE), 'Agent Reactivated', 'The agent account has been reactivated.'),
        handleRejectAgent: (id: number) => handleApiCall(() => apiClient.updateAgentStatus(id, AgentStatus.INACTIVE), 'Agent Rejected', 'The agent application has been rejected.'),
        handleDeleteAgent: (id: number) => handleApiCall(() => apiClient.deleteAgent(id), 'Agent Deleted', 'The agent and their user account have been permanently deleted.'),
        handleUpdateMyProfile: async (user: User) => {
            await handleApiCall(() => apiClient.updateMyProfile(user), 'Profile Updated', 'Your profile has been saved successfully.');
        },
        handleAddLeadFromProfile: async (leadData: any, agentId: number) => {
            try {
                await apiClient.createLeadFromProfile(leadData, agentId);
                addToast('Message Sent!', 'The agent will review your message and contact you shortly.', 'success');
            } catch (error: any) {
                addToast('Error', error.message || 'Could not send message.', 'error');
            }
        },
    };

    return { isLoading, ...data, handlers, refetchData: fetchData };
};