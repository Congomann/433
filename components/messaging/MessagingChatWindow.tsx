import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Conversation, Message } from '../../types';
import * as messagingService from '../../services/messagingService';
import { ArrowUpIcon, EllipsisVerticalIcon, TrashIcon } from '../icons';
import { useToast } from '../../contexts/ToastContext';

interface MessagingChatWindowProps {
  currentUser: User;
  users: User[];
  activeConversation: Conversation | null;
  messages: Message[];
  isMessagesLoading: boolean;
}

const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

const formatDateSeparator = (date: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) return `Today`;
    if (isSameDay(date, yesterday)) return `Yesterday`;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    if (date > oneWeekAgo) return date.toLocaleDateString('en-US', { weekday: 'long' });
    
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const MessagingChatWindow: React.FC<MessagingChatWindowProps> = ({ currentUser, users, activeConversation, messages, isMessagesLoading }) => {
  const [newMessage, setNewMessage] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { addToast } = useToast();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const textareaRef = useRef<null | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isMessagesLoading) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMessagesLoading]);

  const otherUser = useMemo(() => {
    if (!activeConversation) return null;
    const otherUserId = activeConversation.participantIds.find(id => id !== currentUser.id);
    return users.find(u => u.id === otherUserId) || null;
  }, [activeConversation, currentUser.id, users]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && activeConversation && otherUser && !isSending) {
      setIsSending(true);
      const text = newMessage.trim();
      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height
      }

      try {
        await messagingService.sendMessage(
            activeConversation.id,
            currentUser,
            otherUser,
            text
        );
      } catch (error) {
          console.error("Failed to send message:", error);
          addToast('Error', 'Could not send message. Please try again.', 'error');
          setNewMessage(text); // Restore message on failure
      } finally {
          setIsSending(false);
      }
    }
  };
  
  const handleDeleteMessage = async (messageId: string) => {
    if (!activeConversation) return;

    if (window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
        try {
            await messagingService.deleteMessage(activeConversation.id, messageId);
        } catch (error) {
            console.error(error);
            addToast('Error', 'Failed to delete message. Please try again.', 'error');
        }
    }
    setOpenMenuId(null); // Always close the menu
  };


  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    const maxHeight = 120; // max height of ~6 lines
    target.style.height = `${Math.min(target.scrollHeight, maxHeight)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(e as any);
    }
  };

  if (!activeConversation || !otherUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 p-8">
        <h2 className="text-xl font-bold text-slate-800">Welcome to your inbox</h2>
        <p>Select a conversation from the list to start messaging.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-3 border-b border-slate-200/80 backdrop-blur-md flex items-center justify-between shadow-sm h-[80px]">
        <div className="flex items-center">
            <img src={otherUser.avatar} alt={otherUser.name} className="w-10 h-10 rounded-full" />
            <h2 className="text-lg font-bold text-slate-800 ml-3">{otherUser.name}</h2>
        </div>
      </div>
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {isMessagesLoading ? (
             <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        ) : (
            <div className="flex flex-col">
                {messages.map((msg, index) => {
                    const prevMsg = messages[index - 1];
                    const showDateSeparator = !prevMsg || !isSameDay(msg.timestamp, prevMsg.timestamp);
                    const isMyMessage = msg.senderId === currentUser.id;
                    return (
                        <React.Fragment key={msg.id}>
                            {showDateSeparator && (
                            <div className="flex justify-center my-4">
                                <span className="text-xs font-semibold text-slate-500 bg-slate-200/70 rounded-full px-3 py-1">{formatDateSeparator(msg.timestamp)}</span>
                            </div>
                            )}
                            <div className={`flex items-end gap-2 my-1 group ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                                {isMyMessage && !msg.isDeleted && (
                                    <div className="relative">
                                        <button 
                                            onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full text-slate-500 hover:bg-slate-300/50"
                                            aria-label="Message options"
                                        >
                                            <EllipsisVerticalIcon className="w-5 h-5" />
                                        </button>
                                        {openMenuId === msg.id && (
                                            <div className="absolute bottom-full right-0 mb-1 w-32 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                                                <button
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    className="w-full text-left flex items-center px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg"
                                                >
                                                    <TrashIcon className="w-4 h-4 mr-2" /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {!isMyMessage && <img src={otherUser.avatar} className="w-6 h-6 rounded-full"/>}
                                <div className={`px-4 py-2 rounded-2xl max-w-md break-words ${
                                    msg.isDeleted 
                                    ? 'bg-transparent border border-slate-200 text-slate-500 italic'
                                    : isMyMessage 
                                        ? 'bg-primary-600 text-white rounded-br-none' 
                                        : 'bg-slate-200 text-slate-900 rounded-bl-none'
                                }`}>
                                    {msg.messageText}
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
                <div ref={messagesEndRef}></div>
            </div>
        )}
      </div>
       <div className="p-2 border-t border-slate-200/80">
          <form onSubmit={handleSendMessage} className="flex items-end">
            <textarea ref={textareaRef} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onInput={handleTextareaInput} onKeyDown={handleKeyDown} placeholder="Type a message..." className="flex-1 bg-slate-100/70 rounded-2xl px-4 py-2.5 resize-none border-0 focus:ring-2 focus:ring-primary-500 max-h-32 transition-height" rows={1}></textarea>
            <button type="submit" className="ml-2 w-10 h-10 flex-shrink-0 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:bg-slate-300 button-press" disabled={!newMessage.trim() || isSending}>
                {isSending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                    <ArrowUpIcon className="w-5 h-5" />
                )}
            </button>
          </form>
       </div>
    </div>
  );
};

export default MessagingChatWindow;