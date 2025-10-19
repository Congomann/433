import React, { useState, useEffect, useCallback } from 'react';
import { User, Conversation, Message, UserRole } from '../types';
import { db, collection, query, where, onSnapshot, orderBy } from '../services/firebase';
import * as messagingService from '../services/messagingService';
import MessagingSidebar from './messaging/MessagingSidebar';
import MessagingChatWindow from './messaging/MessagingChatWindow';
import { BroadcastIcon } from './icons';

interface MessagingViewProps {
  currentUser: User;
  users: User[];
  onOpenBroadcast: () => void;
  initialSelectedUserId?: number;
}

const MessagingView: React.FC<MessagingViewProps> = ({ currentUser, users, onOpenBroadcast, initialSelectedUserId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);

  // Effect to fetch all conversations for the current user
  useEffect(() => {
    if (!currentUser) return;
    setIsLoading(true);
    const q = query(
      collection(db, "conversations"),
      where('participantIds', 'array-contains', currentUser.id)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedConversations: Conversation[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedConversations.push({
          id: doc.id,
          ...data,
          lastMessageTimestamp: data.lastMessageTimestamp?.toDate(),
        } as Conversation);
      });
      setConversations(fetchedConversations);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // FIX: Added useEffect to fetch messages for the active conversation.
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    setIsMessagesLoading(true);
    const messagesQuery = query(
        collection(db, "conversations", activeConversation.id, "messages"),
        orderBy("timestamp")
    );

    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      const fetchedMessages: Message[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMessages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate(),
        } as Message);
      });
      setMessages(fetchedMessages);
      setIsMessagesLoading(false);
      
      // Mark conversation as read once messages are loaded
      if (activeConversation.unreadCounts[currentUser.id] > 0) {
        messagingService.markConversationAsRead(activeConversation.id, currentUser.id);
      }
    });

    return () => unsubscribe();
  }, [activeConversation, currentUser.id]);

  // FIX: Defined handleSelectContact to manage conversation state.
  const handleSelectContact = useCallback(async (user: User) => {
    if (!currentUser) return;
    try {
        const conversation = await messagingService.createOrGetConversation(currentUser, user);
        setActiveConversation(conversation);
        if (conversation.unreadCounts[currentUser.id] > 0) {
            messagingService.markConversationAsRead(conversation.id, currentUser.id);
        }
    } catch (error) {
        console.error("Error creating or getting conversation:", error);
    }
  }, [currentUser]);

  // Effect to handle initial selection from URL parameter
  useEffect(() => {
    if (initialSelectedUserId && users.length > 0 && conversations.length > 0) {
      const userToSelect = users.find(u => u.id === initialSelectedUserId);
      if (userToSelect) {
        // FIX: Replaced undefined function with the newly defined handleSelectContact.
        handleSelectContact(userToSelect);
      }
    }
  }, [initialSelectedUserId, users, conversations, handleSelectContact]);

  return (
    <div className="flex h-screen bg-white font-sans text-slate-900">
      <MessagingSidebar
        currentUser={currentUser}
        users={users}
        conversations={conversations}
        onSelectContact={handleSelectContact}
        activeConversationId={activeConversation?.id}
        isLoading={isLoading}
        onOpenBroadcast={onOpenBroadcast}
      />
      <MessagingChatWindow
        currentUser={currentUser}
        activeConversation={activeConversation}
        messages={messages}
        isMessagesLoading={isMessagesLoading}
      />
    </div>
  );
};

// FIX: Added default export to resolve module loading error in App.tsx.
export default MessagingView;
