import { handleRequest } from '../server/api';
import { User, AgentStatus } from '../types';

let authToken: string | null = null;
// Initialize token from localStorage on script load
const storedToken = localStorage.getItem('authToken');
if (storedToken) {
    authToken = storedToken;
}

export const getToken = () => authToken;

export const setToken = (token: string) => {
    authToken = token;
    localStorage.setItem('authToken', token);
};

export const clearToken = () => {
    authToken = null;
    localStorage.removeItem('authToken');
};

export const login = async (email: string, password: string): Promise<{ user: User, token: string }> => {
    const response: any = await handleRequest('POST', '/api/auth/login', { email, password });
    if (response.token) {
        setToken(response.token);
    }
    return response;
};

export const register = async (userData: Omit<User, 'id' | 'title' | 'avatar'>): Promise<{ user: User }> => {
    return handleRequest('POST', '/api/auth/register', userData) as Promise<{ user: User }>;
};

export const verifyEmail = async (userId: number, code: string): Promise<{ success: boolean }> => {
    return handleRequest('POST', '/api/auth/verify', { userId, code }) as Promise<{ success: boolean }>;
};

export const getMe = async (): Promise<{ user: User; agentStatus: AgentStatus | null }> => {
    if (!authToken) {
        throw new Error("No auth token found");
    }
    return handleRequest('GET', '/api/auth/me', undefined, { 'Authorization': `Bearer ${authToken}` }) as Promise<{ user: User; agentStatus: AgentStatus | null }>;
};

export const logout = () => {
    clearToken();
};
