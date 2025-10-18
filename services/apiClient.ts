import { handleRequest } from '../server/api';
import { getToken } from './authService';
import { User, UserRole, AgentStatus, Message } from '../types';

const getAuthHeaders = () => {
    const authToken = getToken();
    return authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
};

// --- Generic Data Methods ---
export const get = async <T>(path: string): Promise<T> => {
    return handleRequest('GET', path, undefined, getAuthHeaders()) as Promise<T>;
};

export const post = async <T>(path: string, data: any): Promise<T> => {
    return handleRequest('POST', path, data, getAuthHeaders()) as Promise<T>;
};

export const put = async <T>(path: string, data: any): Promise<T> => {
    return handleRequest('PUT', path, data, getAuthHeaders()) as Promise<T>;
};

export const del = async <T>(path: string): Promise<T> => {
    return handleRequest('DELETE', path, undefined, getAuthHeaders()) as Promise<T>;
};

// --- Auth Method ---
export const register = async (userData: Omit<User, 'id' | 'title' | 'avatar'>): Promise<{ user: User }> => {
    // This is a public route, so no auth headers
    return handleRequest('POST', '/api/auth/register', userData) as Promise<{ user: User }>;
};


// --- Message Methods ---
export const sendMessage = (receiverId: number, text: string): Promise<Message> => {
    return post<Message>('/api/messages', { receiverId, text });
};

export const editMessage = (messageId: number, text: string) => {
    return put(`/api/messages/${messageId}`, { text });
};

export const trashMessage = (messageId: number) => {
    return put(`/api/messages/${messageId}/trash`, {});
};

export const restoreMessage = (messageId: number) => {
    return put(`/api/messages/${messageId}/restore`, {});
};

export const permanentlyDeleteMessage = (messageId: number) => {
    return del(`/api/messages/${messageId}`);
};

export const broadcastMessage = (text: string) => {
    return post('/api/messages/broadcast', { text });
};

export const markConversationAsRead = (senderId: number) => {
    return put('/api/messages/mark-as-read', { senderId });
};


// --- Specific Business Logic Methods ---
export const approveAgent = async (agentId: number, role: UserRole) => {
    return post(`/api/agents/${agentId}/approve`, { role });
};

export const updateAgentStatus = async (agentId: number, status: AgentStatus) => {
    return put(`/api/agents/${agentId}/status`, { status });
};

export const deleteAgent = async (agentId: number) => {
    return del(`/api/agents/${agentId}`);
};

export const createLeadFromProfile = async (leadData: any, agentId: number) => {
    return post('/api/leads/from-profile', { leadData, agentId });
};

export const updateMyProfile = async (userData: Partial<User>) => {
    return put('/api/users/me', userData);
};

export const startPstnCall = (data: { agentPhone: string; clientPhone: string }): Promise<{ callSid: string }> => {
    return post<{ callSid: string }>('/api/calls/start', data);
};

export const endPstnCall = (data: { callSid: string }): Promise<{ success: boolean }> => {
    return post<{ success: boolean }>('/api/calls/end', data);
};