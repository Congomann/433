import { db, collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment, setDoc, getDoc } from './firebase';
import { User, Conversation } from '../types';

/**
 * Finds an existing conversation between two users or creates a new one if it doesn't exist.
 * This prevents duplicate conversation threads.
 * @param currentUser - The logged-in user object.
 * @param otherUser - The other user object in the conversation.
 * @returns A promise that resolves to the conversation object.
 */
export const createOrGetConversation = async (currentUser: User, otherUser: User): Promise<Conversation> => {
    const participantIds = [currentUser.id, otherUser.id].sort((a, b) => a - b);
    const conversationId = participantIds.join('_'); // Create a predictable ID

    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
        const data = conversationSnap.data();
        return {
            id: conversationSnap.id,
            ...data,
            lastMessageTimestamp: data.lastMessageTimestamp?.toDate(),
        } as Conversation;
    } else {
        const newConversation: Omit<Conversation, 'id'> = {
            participantIds: participantIds,
            participantInfo: {
                [currentUser.id]: { name: currentUser.name, avatar: currentUser.avatar },
                [otherUser.id]: { name: otherUser.name, avatar: otherUser.avatar },
            },
            lastMessageText: '',
            lastMessageTimestamp: new Date(),
            lastMessageSenderId: 0,
            unreadCounts: {
                [currentUser.id]: 0,
                [otherUser.id]: 0,
            },
        };
        await setDoc(conversationRef, newConversation);
        return {
            id: conversationId,
            ...newConversation,
        } as Conversation;
    }
};

/**
 * Sends a message within a specific conversation.
 * It adds the message to the 'messages' subcollection and updates the parent conversation document.
 * @param conversationId - The ID of the conversation.
 * @param sender - The user object of the message sender.
 * @param receiver - The user object of the message receiver.
 * @param messageText - The content of the message.
 */
export const sendMessage = async (conversationId: string, sender: User, receiver: User, messageText: string): Promise<void> => {
    const conversationRef = doc(db, 'conversations', conversationId);
    const messagesColRef = collection(conversationRef, 'messages');

    // 1. Add the new message to the subcollection
    await addDoc(messagesColRef, {
        senderId: sender.id,
        messageText,
        timestamp: serverTimestamp(),
    });

    // 2. Update the parent conversation document for sorting and notifications
    await updateDoc(conversationRef, {
        lastMessageText: messageText,
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSenderId: sender.id,
        [`unreadCounts.${receiver.id}`]: increment(1)
    });
};

/**
 * Marks all messages in a conversation as read for the current user.
 * This is done by setting the user's unread count to 0 in the conversation document.
 * @param conversationId - The ID of the conversation to mark as read.
 * @param currentUserId - The ID of the user for whom the conversation is being marked as read.
 */
export const markConversationAsRead = async (conversationId: string, currentUserId: number): Promise<void> => {
    const conversationRef = doc(db, 'conversations', conversationId);
    try {
        await updateDoc(conversationRef, {
            [`unreadCounts.${currentUserId}`]: 0
        });
    } catch (error) {
        console.error("Error marking conversation as read:", error);
    }
};

/**
 * "Deletes" a message by updating its content to indicate deletion.
 * This is a soft delete; the document remains but its content is changed.
 * @param conversationId The ID of the conversation containing the message.
 * @param messageId The ID of the message to delete.
 */
export const deleteMessage = async (conversationId: string, messageId: string): Promise<void> => {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    try {
        await updateDoc(messageRef, {
            messageText: 'This message was deleted',
            isDeleted: true
        });
    } catch (error) {
        console.error("Error deleting message:", error);
        // Propagate the error so the UI can handle it
        throw new Error("Could not delete the message.");
    }
};