import { db } from '../db';
import { ClientStatus, InteractionType, NotificationType, Client, Interaction } from '../../types';

export const createFromProfile = async ({ leadData, agentId }: { leadData: any, agentId: number }) => {
    // 1. Create the new client record with 'Lead' status
    const newClient = await db.clients.create({
        ...leadData,
        status: ClientStatus.LEAD,
        joinDate: new Date().toISOString().split('T')[0],
        agentId: agentId,
    });

    // 2. Create an internal message from the client to the agent
    await db.createRecord('messages', {
        // In a real system, you'd have a 'system' user or handle this differently,
        // but for now, we'll simulate it as if the client sent it.
        // A real implementation would need a user record for the lead, which is out of scope here.
        senderId: 0, // Using 0 for "System/Website"
        receiverId: agentId,
        text: `New lead from your profile page:\n\nName: ${leadData.firstName} ${leadData.lastName}\nEmail: ${leadData.email}\nPhone: ${leadData.phone}\n\nMessage:\n${leadData.message}`,
        timestamp: new Date().toISOString(),
        status: 'active',
        source: 'public_profile',
    });

    // 3. Create a notification for the agent
    await db.createRecord('notifications', {
        userId: agentId,
        type: NotificationType.LEAD_ASSIGNED,
        message: `You have a new lead: ${leadData.firstName} ${leadData.lastName}.`,
        timestamp: new Date().toISOString(),
        isRead: false,
        link: `client/${newClient.id}`
    });

    return { client: newClient };
};


export const saveOnboardingData = async (clientId: number, { clientData, interactions }: { clientData: Partial<Client>, interactions: Omit<Interaction, 'id' | 'clientId'>[] }) => {
    // 1. Update the client record
    const updatedClient = await db.clients.update(clientId, clientData);

    // 2. Add all new interactions
    const createdInteractions = [];
    for (const interaction of interactions) {
        const newInteraction = await db.createRecord('interactions', {
            ...interaction,
            clientId,
        });
        createdInteractions.push(newInteraction);
    }

    return { client: updatedClient, interactions: createdInteractions };
};