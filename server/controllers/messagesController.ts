import { db } from '../db';
import { User, UserRole, Message, AgentStatus, NotificationType, Notification } from '../../types';

export const sendMessage = async (currentUser: User, { receiverId, text }: { receiverId: number, text: string }) => {
    const newMessage = await db.createRecord('messages', {
        senderId: currentUser.id,
        receiverId,
        text,
        timestamp: new Date().toISOString(),
        status: 'active',
        source: 'internal',
        isRead: false,
    });

    // Create a notification for the receiver
    await db.createRecord('notifications', {
        userId: receiverId,
        type: NotificationType.NEW_MESSAGE,
        message: `You have a new message from ${currentUser.name}.`,
        timestamp: new Date().toISOString(),
        isRead: false,
        link: `messages/${currentUser.id}`
    });

    return newMessage;
};

export const editMessage = async (currentUser: User, messageId: number, { text }: { text: string }) => {
    const messages = await db.getAll('messages') as Message[];
    const message = messages.find(m => m.id === messageId);
    if (!message) throw { status: 404, message: 'Message not found.' };
    if (message.senderId !== currentUser.id) throw { status: 403, message: 'You can only edit your own messages.' };

    const messageTime = new Date(message.timestamp).getTime();
    const currentTime = new Date().getTime();
    if ((currentTime - messageTime) > 2 * 60 * 1000) { // 2 minute edit window
        throw { status: 403, message: 'Edit time window has expired.' };
    }

    return await db.updateRecord<Message>('messages', messageId, { text, edited: true });
};

export const trashMessage = async (currentUser: User, messageId: number) => {
    const messages = await db.getAll('messages') as Message[];
    const message = messages.find(m => m.id === messageId);
    if (!message) throw { status: 404, message: 'Message not found.' };

    const isSender = message.senderId === currentUser.id;
    const isReceiver = message.receiverId === currentUser.id;
    const isAdmin = currentUser.role === UserRole.ADMIN;
    
    if (!isSender && !isReceiver && !isAdmin) {
        throw { status: 403, message: 'You are not authorized to perform this action.' };
    }

    const messageTime = new Date(message.timestamp).getTime();
    const currentTime = new Date().getTime();
    const isRecent = (currentTime - messageTime) < 24 * 60 * 60 * 1000;

    if (isSender && isRecent) {
        const success = await db.deleteRecord('messages', messageId);
        if (!success) {
            throw { status: 500, message: 'Failed to delete message.' };
        }
        return { success, action: 'deleted_for_everyone' };
    }

    return await db.updateRecord<Message>('messages', messageId, { 
        status: 'trashed', 
        deletedTimestamp: new Date().toISOString(),
        deletedBy: currentUser.id 
    });
};

export const restoreMessage = async (currentUser: User, messageId: number) => {
    const messages = await db.getAll('messages') as Message[];
    const message = messages.find(m => m.id === messageId);
    if (!message) throw { status: 404, message: 'Message not found.' };

    if (message.deletedBy !== currentUser.id && currentUser.role !== UserRole.ADMIN) {
         throw { status: 403, message: 'You are not authorized to restore this message.' };
    }

    return await db.updateRecord<Message>('messages', messageId, { 
        status: 'active', 
        deletedTimestamp: undefined, 
        deletedBy: undefined 
    });
};

export const permanentlyDeleteMessage = async (currentUser: User, messageId: number) => {
    if (currentUser.role !== UserRole.ADMIN) {
        throw { status: 403, message: 'Only administrators can permanently delete messages.' };
    }
    const success = await db.deleteRecord('messages', messageId);
    if (!success) {
        throw { status: 404, message: 'Message not found for permanent deletion.' };
    }
    return { success };
};

export const broadcastMessage = async (adminUser: User, { text }: { text: string }) => {
    if (adminUser.role !== UserRole.ADMIN) {
        throw { status: 403, message: 'Only administrators can broadcast messages.' };
    }

    const allUsers = await db.users.find();
    const allAgents = await db.agents.find();

    const activeUsers = allUsers.filter(
        u => u.id !== adminUser.id && (u.role === UserRole.AGENT || u.role === UserRole.SUB_ADMIN)
    );
    const activeAgentIds = new Set(allAgents.filter(a => a.status === AgentStatus.ACTIVE).map(a => a.id));

    const recipients = activeUsers.filter(u => activeAgentIds.has(u.id));

    const createdMessages: Message[] = [];

    for (const recipient of recipients) {
        const newMessage = await db.createRecord('messages', {
            senderId: adminUser.id,
            receiverId: recipient.id,
            text: text,
            timestamp: new Date().toISOString(),
            status: 'active',
            source: 'internal',
            isRead: false,
        });

        await db.createRecord('notifications', {
            userId: recipient.id,
            type: NotificationType.BROADCAST,
            message: `New broadcast message from ${adminUser.name}.`,
            timestamp: new Date().toISOString(),
            isRead: false,
            link: `messages/${adminUser.id}`
        });

        createdMessages.push(newMessage as any);
    }

    return { success: true, count: createdMessages.length };
};

export const markConversationAsRead = async (currentUser: User, { senderId }: { senderId: number }) => {
    const allMessages = await db.getAll('messages') as Message[];
    let updatedCount = 0;
    
    for (const message of allMessages) {
        if (
            message.receiverId === currentUser.id &&
            message.senderId === senderId &&
            !message.isRead
        ) {
            await db.updateRecord<Message>('messages', message.id, { isRead: true });
            updatedCount++;
        }
    }

    return { success: true, updatedCount };
};

export const markAllNotificationsRead = async (userId: number) => {
    const allNotifications = await db.getAll('notifications') as Notification[];
    let updatedCount = 0;

    for (const notification of allNotifications) {
        if (notification.userId === userId && !notification.isRead) {
            await db.updateRecord<Notification>('notifications', notification.id, { isRead: true });
            updatedCount++;
        }
    }
    return { success: true, updatedCount };
};