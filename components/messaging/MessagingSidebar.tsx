import React, { useState, useMemo } from 'react';
import { User, Conversation, UserRole } from '../../types';
import { SearchIcon, BroadcastIcon } from '../icons';

interface MessagingSidebarProps {
  currentUser: User;
  users: User[];
  conversations: Conversation[];
  onSelectContact: (user: User) => void;
  activeConversationId: string | null | undefined;
  isLoading: boolean;
  onOpenBroadcast: () => void;
}

const formatTimestamp = (date?: Date) => {
    if (!date) return '';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    
    if (isSameDay(date, today)) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (isSameDay(date, yesterday)) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
};


const MessagingSidebar: React.FC<MessagingSidebarProps> = ({ currentUser, users, conversations, onSelectContact, activeConversationId, isLoading, onOpenBroadcast }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { sortedConversations, otherContacts } = useMemo(() => {
    const internalStaffRoles = [UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.AGENT, UserRole.MANAGER, UserRole.UNDERWRITING];
    
    const conversationList = conversations.map(conv => {
      const otherUserId = conv.participantIds.find(id => id !== currentUser.id);
      const otherUserInfo = otherUserId ? conv.participantInfo[otherUserId] : null;
      const unreadCount = conv.unreadCounts[currentUser.id] || 0;

      return {
        ...conv,
        otherUser: otherUserInfo ? { ...users.find(u => u.id === otherUserId)!, ...otherUserInfo } : null,
        unreadCount
      };
    }).filter(conv => conv.otherUser); // Filter out conversations where other user might not exist

    // Sort by unread, then by timestamp
    conversationList.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
      return (b.lastMessageTimestamp?.getTime() || 0) - (a.lastMessageTimestamp?.getTime() || 0);
    });

    const contactsInConversations = new Set(conversationList.map(c => c.otherUser?.id));
    
    const remainingContacts = users.filter(u => 
      u.id !== currentUser.id && 
      internalStaffRoles.includes(u.role) &&
      !contactsInConversations.has(u.id)
    ).sort((a, b) => a.name.localeCompare(b.name));

    const filterFn = (name: string) => name.toLowerCase().includes(searchTerm.toLowerCase());

    return {
        sortedConversations: conversationList.filter(c => filterFn(c.otherUser?.name || '')),
        otherContacts: remainingContacts.filter(c => filterFn(c.name))
    };

  }, [conversations, users, currentUser, searchTerm]);
  
  return (
    <div className="w-full max-w-sm border-r border-slate-200/80 flex flex-col">
      <div className="p-4 border-b border-slate-200/80 flex justify-between items-center h-[80px]">
          <h1 className="text-2xl font-bold text-slate-800">Messages</h1>
          {(currentUser.role === UserRole.ADMIN) && (
              <button onClick={onOpenBroadcast} className="flex items-center text-sm font-semibold text-primary-600 hover:text-primary-800 bg-primary-100/50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors button-press">
                  <BroadcastIcon className="w-5 h-5 mr-2" /> Broadcast
              </button>
          )}
      </div>
      <div className="p-3 border-b border-slate-200/80">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search contacts..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100/80 rounded-lg pl-10 pr-4 py-2 border-transparent focus:ring-2 focus:ring-primary-500 focus:bg-white"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
            <div className="p-4 text-center text-slate-500">Loading conversations...</div>
        ) : (
            <>
                {sortedConversations.map(conv => {
                    if (!conv.otherUser) return null;
                    const isSelected = activeConversationId === conv.id;
                    return (
                        <div key={conv.id} onClick={() => onSelectContact(conv.otherUser!)} className={`p-3 m-2 flex items-center cursor-pointer rounded-xl transition-colors ${isSelected ? 'bg-primary-100' : 'hover:bg-slate-100/50'}`}>
                            <div className="relative flex-shrink-0">
                                <img src={conv.otherUser.avatar} alt={conv.otherUser.name} className="w-12 h-12 rounded-full" />
                                {conv.unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white ring-2 ring-white">{conv.unreadCount}</span>}
                            </div>
                            <div className="ml-3 flex-1 overflow-hidden">
                                <div className="flex justify-between items-baseline">
                                    <p className={`font-bold truncate ${isSelected ? 'text-primary-800' : 'text-slate-800'}`}>{conv.otherUser.name}</p>
                                    <p className={`text-xs ml-2 flex-shrink-0 ${isSelected ? 'text-primary-500' : 'text-slate-400'}`}>{formatTimestamp(conv.lastMessageTimestamp)}</p>
                                </div>
                                <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>
                                    {conv.lastMessageText ? (<>{conv.lastMessageSenderId === currentUser.id && 'You: '} {conv.lastMessageText}</>) : (<span className="italic">No messages yet.</span>)}
                                </p>
                            </div>
                        </div>
                    );
                })}
                 {otherContacts.length > 0 && (
                    <>
                        <h3 className="px-5 pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Other Contacts</h3>
                        {otherContacts.map(user => (
                            <div key={user.id} onClick={() => onSelectContact(user)} className="p-3 m-2 flex items-center cursor-pointer rounded-xl hover:bg-slate-100/50">
                                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
                                <div className="ml-3 flex-1 overflow-hidden">
                                    <p className="font-bold truncate text-slate-800">{user.name}</p>
                                    <p className="text-sm truncate text-slate-500">{user.title}</p>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default MessagingSidebar;