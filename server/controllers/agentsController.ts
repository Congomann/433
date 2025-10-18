import { db } from '../db';
import { AgentStatus, UserRole, User, NotificationType } from '../../types';

export const approveAgent = async (agentId: number, { role }: { role: UserRole }) => {
    const agent = await db.agents.findById(agentId);
    const user = await db.users.findById(agentId);

    if (!agent || !user) {
        throw { status: 404, message: 'Agent or user not found.' };
    }

    const updatedAgent = await db.agents.update(agentId, { 
        status: AgentStatus.ACTIVE, 
        joinDate: new Date().toISOString().split('T')[0] 
    });
    
    let title = 'Insurance Agent';
    switch(role) {
        case UserRole.SUB_ADMIN:
            title = 'Lead Manager';
            break;
        case UserRole.MANAGER:
            title = 'Regional Manager';
            break;
        case UserRole.UNDERWRITING:
            title = 'Underwriting Specialist';
            break;
        case UserRole.AGENT:
        default:
            title = 'Insurance Agent';
            break;
    }

    const updatedUser = await db.users.update(agentId, { 
        role: role, 
        title: title
    });
    
    // Create a notification for the agent
    await db.createRecord('notifications', {
        userId: agentId,
        type: NotificationType.AGENT_APPROVED,
        message: `Congratulations! Your application has been approved. Welcome to New Holland Financial.`,
        timestamp: new Date().toISOString(),
        isRead: false,
        link: 'dashboard'
    });

    return { agent: updatedAgent, user: updatedUser };
};

export const updateAgentStatus = async (agentId: number, { status }: { status: AgentStatus }) => {
    const agent = await db.agents.findById(agentId);
    if (!agent) {
        throw { status: 404, message: 'Agent not found.' };
    }
    
    const updatedAgent = await db.agents.update(agentId, { status });

    // Also update the user's title to reflect their status
    if (status === AgentStatus.INACTIVE) {
        await db.users.update(agentId, { title: 'Inactive Agent' });
    } else if (status === AgentStatus.ACTIVE) {
        const user = await db.users.findById(agentId);
        await db.users.update(agentId, { title: user?.role === UserRole.SUB_ADMIN ? 'Lead Manager' : 'Insurance Agent' });
    }
    
    return updatedAgent;
};

export const deleteAgent = async (agentId: number) => {
    // The DB method now handles cascading the delete to the users table and unassigning clients
    const success = await db.agents.delete(agentId);
    if (!success) {
        throw { status: 404, message: 'Agent not found.' };
    }
    return { success: true };
};