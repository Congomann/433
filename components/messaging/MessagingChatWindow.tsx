import React, { useState, useRef, useEffect } from 'react';
import { User, Conversation, Message } from '../../types';
import * as messagingService from '../../services/messagingService';
import { ArrowUpIcon } from '../icons';

interface MessagingChatWindowProps {
  currentUser: User;
  activeConversation: Conversation | null;
  messages: Message[];
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

const MessagingChatWindow: React.FC<MessagingChatWindowProps> = ({ currentUser, activeConversation, messages }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const textareaRef = useRef<null | HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const otherUser = activeConversation ? activeConversation.participantInfo[activeConversation.participantIds.find(id => id !== currentUser.id)!] : null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && activeConversation && otherUser) {
      const text = newMessage.trim();
      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height
      }

      await messagingService.sendMessage(
        activeConversation.id,
        currentUser,
        { ...otherUser, id: activeConversation.participantIds.find(id => id !== currentUser.id)! } as User,
        text
      );
    }
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
                        <div className={`flex items-end gap-2 my-1 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                            {!isMyMessage && <img src={otherUser.avatar} className="w-6 h-6 rounded-full"/>}
                            <div className={`px-4 py-2 rounded-2xl max-w-md break-words ${isMyMessage ? 'bg-primary-600 text-white rounded-br-none' : 'bg-slate-200 text-slate-900 rounded-bl-none'}`}>
                                {msg.messageText}
                            </div>
                        </div>
                    </React.Fragment>
                );
            })}
            <div ref={messagesEndRef}></div>
        </div>
      </div>
       <div className="p-2 border-t border-slate-200/80">
          <form onSubmit={handleSendMessage} className="flex items-end">
            <textarea ref={textareaRef} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onInput={handleTextareaInput} onKeyDown={handleKeyDown} placeholder="Type a message..." className="flex-1 bg-slate-100/70 rounded-2xl px-4 py-2.5 resize-none border-0 focus:ring-2 focus:ring-primary-500 max-h-32 transition-height" rows={1}></textarea>
            <button type="submit" className="ml-2 w-10 h-10 flex-shrink-0 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:bg-slate-300 button-press" disabled={!newMessage.trim()}>
                <ArrowUpIcon className="w-5 h-5" />
            </button>
          </form>
       </div>
    </div>
  );
};

export default MessagingChatWindow;