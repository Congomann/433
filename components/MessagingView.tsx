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

  // Effect to handle initial selection from URL parameter
  useEffect(() => {
    if (initialSelectedUserId && users.length > 0 && conversations.length > 0) {
      const userToSelect = users.find(u => u.id === initialSelectedUserId);
      if (userToSelect) {
        handleSelectContact(userToSelect);
      }
    }
  }, [initialSelectedUserId, users, conversations]);


  // Effect to fetch messages for the active conversation
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }
    
    // Mark messages as read when a conversation is opened
    messagingService.markConversationAsRead(activeConversation.id, currentUser.id);

    const q = query(
      collection(db, `conversations/${activeConversation.id}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
    });

    return () => unsubscribe();
  }, [activeConversation, currentUser.id]);

  const handleSelectContact = useCallback(async (otherUser: User) => {
    if (otherUser.id === activeConversation?.participantIds.find(id => id !== currentUser.id)) return;
    
    const conversation = await messagingService.createOrGetConversation(currentUser, otherUser);
    setActiveConversation(conversation);
  }, [currentUser, activeConversation]);

  return (
    <div className="p-4 sm:p-6 h-full flex">
      <div className="flex h-full w-full bg-white/70 backdrop-blur-lg rounded-2xl border border-white/50 shadow-premium overflow-hidden">
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
        />
      </div>
    </div>
  );
};

export default MessagingView;