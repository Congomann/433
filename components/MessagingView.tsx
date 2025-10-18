import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Message, UserRole } from '../types';
import { PencilIcon, TrashIcon, BroadcastIcon, ArrowUpIcon, SearchIcon, ChevronDownIcon, CloseIcon } from './icons';
import { useToast } from '../contexts/ToastContext';

interface MessagingViewProps {
  currentUser: User;
  users: User[];
  messages: Message[];
  onSendMessage: (receiverId: number, text: string) => void;
  onEditMessage: (messageId: number, newText: string) => void;
  onTrashMessage: (messageId: number) => void;
  onRestoreMessage: (messageId: number) => void;
  onPermanentlyDeleteMessage: (messageId: number) => void;
  initialSelectedUserId?: number;
  onMarkConversationAsRead: (senderId: number) => void;
  onOpenBroadcast: () => void;
  onTyping: () => void;
  typingStatus: Record<number, boolean>;
}

// --- Helper Functions for iMessage UI ---

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) {
        return `Today`;
    }
    if (isSameDay(date, yesterday)) {
        return `Yesterday`;
    }
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    if (date > oneWeekAgo) {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    }
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const DateSeparator: React.FC<{date: string}> = ({date}) => (
    <div className="flex justify-center my-4">
        <span className="text-xs font-semibold text-slate-500 bg-slate-200/70 backdrop-blur-sm rounded-full px-3 py-1">
            {formatDateSeparator(date)}
        </span>
    </div>
);

const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (isSameDay(date, today)) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    if (isSameDay(date, yesterday)) {
        return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
};

const HighlightedText: React.FC<{ text: string; highlight: string; }> = ({ text, highlight }) => {
    if (!highlight.trim()) {
        return <>{text}</>;
    }
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} className="bg-amber-300 rounded px-0.5 text-black">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
};


const MessagingView: React.FC<MessagingViewProps> = ({ currentUser, users, messages, onSendMessage, onEditMessage, onTrashMessage, onRestoreMessage, onPermanentlyDeleteMessage, initialSelectedUserId, onMarkConversationAsRead, onOpenBroadcast, onTyping, typingStatus }) => {
  const [viewMode, setViewMode] = useState<'INBOX' | 'TRASH'>('INBOX');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(initialSelectedUserId || null);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState<{ id: number; text: string } | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const editInputRef = useRef<null | HTMLTextAreaElement>(null);
  const textareaRef = useRef<null | HTMLTextAreaElement>(null);
  const { addToast } = useToast();

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<number>>(new Set());

  // Search state
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const messageRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedMessageIds(new Set()); // Clear selection when toggling mode
  };

  const handleToggleMessageSelection = (messageId: number) => {
    setSelectedMessageIds(prevSelected => {
      const newSelection = new Set(prevSelected);
      if (newSelection.has(messageId)) {
        newSelection.delete(messageId);
      } else {
        newSelection.add(messageId);
      }
      return newSelection;
    });
  };

  const handleBulkTrash = () => {
    if (selectedMessageIds.size === 0) return;
    selectedMessageIds.forEach(id => onTrashMessage(id));
    addToast('Messages Trashed', `${selectedMessageIds.size} messages have been moved to the trash.`, 'success');
    handleToggleSelectionMode(); // Exit selection mode
  };
  
  const handleBulkDelete = () => {
    if (selectedMessageIds.size === 0) return;
    if (window.confirm(`Are you sure you want to permanently delete ${selectedMessageIds.size} messages? This action cannot be undone.`)) {
      selectedMessageIds.forEach(id => onPermanentlyDeleteMessage(id));
      addToast('Messages Deleted', `${selectedMessageIds.size} messages have been permanently deleted.`, 'success');
      handleToggleSelectionMode(); // Exit selection mode
    }
  };


  const otherUsers = users.filter(u => u.id !== currentUser.id && (u.role === UserRole.ADMIN || u.role === UserRole.SUB_ADMIN || u.role === UserRole.AGENT));
  
  const conversation = useMemo(() => messages.filter(
    msg =>
      msg.status === 'active' &&
      ((msg.senderId === currentUser.id && msg.receiverId === selectedUserId) ||
      (msg.senderId === selectedUserId && msg.receiverId === currentUser.id))
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()), [messages, currentUser.id, selectedUserId]);

  // --- Search Logic ---
  useEffect(() => {
    if (isSearchActive) {
        searchInputRef.current?.focus();
    } else {
        setSearchQuery('');
    }
  }, [isSearchActive]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
        setSearchResults([]);
        setCurrentResultIndex(-1);
        return;
    }
    const results = conversation
        .filter(msg => msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
        .map(msg => msg.id);
    setSearchResults(results);
    setCurrentResultIndex(results.length > 0 ? 0 : -1);
  }, [searchQuery, conversation]);

  useEffect(() => {
    if (currentResultIndex !== -1 && searchResults.length > 0) {
        const messageId = searchResults[currentResultIndex];
        const messageEl = messageRefs.current.get(messageId);
        messageEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentResultIndex, searchResults]);

  const handleNextResult = () => {
      if (searchResults.length === 0) return;
      setCurrentResultIndex(prev => (prev + 1) % searchResults.length);
  };
  const handlePrevResult = () => {
      if (searchResults.length === 0) return;
      setCurrentResultIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
  };
  // --- End Search Logic ---

  useEffect(() => {
    if (viewMode === 'INBOX' && otherUsers.length > 0 && selectedUserId === null) {
        setSelectedUserId(otherUsers[0].id);
    }
  }, [users, currentUser, selectedUserId, viewMode]);

  useEffect(() => {
    if (selectedUserId && viewMode === 'INBOX' && !isSelectionMode) {
        onMarkConversationAsRead(selectedUserId);
    }
  }, [selectedUserId, onMarkConversationAsRead, messages, viewMode, isSelectionMode]);

  useEffect(() => {
    if (editingMessage && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.style.height = 'auto';
      editInputRef.current.style.height = `${editInputRef.current.scrollHeight}px`;
    }
  }, [editingMessage]);

  useEffect(() => {
    if (!searchQuery) { // Only auto-scroll if not searching
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedUserId, typingStatus, viewMode, searchQuery]);
  
  const trashedMessages = useMemo(() => messages.filter(msg => msg.status === 'trashed').sort((a, b) => new Date(b.deletedTimestamp || 0).getTime() - new Date(a.deletedTimestamp || 0).getTime()), [messages]);

  const lastMyMessage = useMemo(() => {
    return [...conversation].reverse().find(m => m.senderId === currentUser.id);
  }, [conversation, currentUser.id]);

  const conversationData = useMemo(() => {
    const data: Record<string, { lastMessage: Message | null; unreadCount: number; }> = {};
    otherUsers.forEach(user => {
        const userMessages = messages
            .filter(m => m.status === 'active' && ((m.senderId === user.id && m.receiverId === currentUser.id) || (m.senderId === currentUser.id && m.receiverId === user.id)))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        data[user.id] = {
            lastMessage: userMessages[0] || null,
            unreadCount: userMessages.filter(m => m.receiverId === currentUser.id && !m.isRead).length
        };
    });
    return data;
  }, [messages, currentUser.id, otherUsers]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedUserId) {
      onSendMessage(selectedUserId, newMessage.trim());
      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };
  
    const handleStartEdit = (message: Message) => {
        const messageTime = new Date(message.timestamp).getTime();
        const currentTime = new Date().getTime();
        if ((currentTime - messageTime) > 2 * 60 * 1000) { // 2 minute edit window
            addToast('Edit Error', 'You can only edit messages sent within the last 2 minutes.', 'warning');
            return;
        }
        setEditingMessage({ id: message.id, text: message.text });
    };

    const handleCancelEdit = () => {
        setEditingMessage(null);
    };

    const handleSaveEdit = () => {
        if (editingMessage && editingMessage.text.trim()) {
            onEditMessage(editingMessage.id, editingMessage.text.trim());
        }
        setEditingMessage(null);
    };

  const selectedUser = users.find(u => u.id === selectedUserId);

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
  
  const Checkbox = ({checked}: {checked: boolean}) => (
    <div className="flex items-center justify-center self-center w-8 flex-shrink-0">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${checked ? 'bg-primary-600 border-primary-600' : 'border-slate-300 bg-white'}`}>
            {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
        </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 h-full flex">
      <div className="flex h-full w-full bg-white/70 backdrop-blur-lg rounded-2xl border border-white/50 shadow-premium overflow-hidden">
        {/* Left Pane: Conversation List */}
        <div className="w-full max-w-sm border-r border-slate-200/80 flex flex-col">
          <div className="p-4 border-b border-slate-200/80 flex justify-between items-center h-[80px]">
              <h1 className="text-2xl font-bold text-slate-800">Messages</h1>
              {currentUser.role === UserRole.ADMIN && viewMode === 'INBOX' && (
                  <button onClick={onOpenBroadcast} className="flex items-center text-sm font-semibold text-primary-600 hover:text-primary-800 bg-primary-100/50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors button-press" aria-label="Broadcast an announcement">
                      <BroadcastIcon className="w-5 h-5 mr-2" /> Broadcast
                  </button>
              )}
          </div>
          <div className="p-2 border-b border-slate-200/80">
                <div className="flex bg-slate-100/70 p-1 rounded-lg">
                    <button onClick={() => setViewMode('INBOX')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${viewMode === 'INBOX' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>Inbox</button>
                    <button onClick={() => setViewMode('TRASH')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${viewMode === 'TRASH' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}>Trash</button>
                </div>
          </div>
          <div className="flex-1 overflow-y-auto">
              {viewMode === 'INBOX' ? otherUsers.map(user => {
                  const data = conversationData[user.id];
                  const lastMessage = data?.lastMessage;
                  const unreadCount = data?.unreadCount || 0;
                  const isSelected = selectedUserId === user.id;

                  return (
                      <div key={user.id} onClick={() => setSelectedUserId(user.id)} className={`p-3 m-2 flex items-center cursor-pointer rounded-xl transition-colors ${isSelected ? 'bg-primary-100' : 'hover:bg-slate-100/50'}`}>
                          <div className="relative flex-shrink-0">
                              <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
                              {unreadCount > 0 && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-primary-500 ring-2 ring-white"></span>}
                          </div>
                          <div className="ml-3 flex-1 overflow-hidden">
                              <div className="flex justify-between items-baseline">
                                  <p className={`font-bold truncate ${isSelected ? 'text-primary-800' : 'text-slate-800'}`}>{user.name}</p>
                                  {lastMessage && <p className={`text-xs ml-2 flex-shrink-0 ${isSelected ? 'text-primary-500' : 'text-slate-400'}`}>{formatTimestamp(lastMessage.timestamp)}</p>}
                              </div>
                              <p className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>
                                  {lastMessage ? (<>{lastMessage.senderId === currentUser.id && 'You: '} {lastMessage.text}</>) : (<span className="italic">No messages yet.</span>)}
                              </p>
                          </div>
                      </div>
                  );
              }) : (
                <p className="p-4 text-center text-sm text-slate-500">Trash is empty.</p>
              )}
          </div>
        </div>

        {/* Right Pane: Chat Window */}
        <div className="flex-1 flex flex-col">
          {viewMode === 'TRASH' ? (
                <>
                <div className="p-3 border-b border-slate-200/80 flex items-center h-[80px]"><h2 className="text-lg font-bold text-slate-800 ml-3">Trash</h2></div>
                <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                    {trashedMessages.map(msg => {
                        const sender = users.find(u => u.id === msg.senderId);
                        const receiver = users.find(u => u.id === msg.receiverId);
                        return (
                            <div key={msg.id} className="p-4 border-b border-slate-200/80">
                                <p className="text-sm text-slate-500">From: <strong>{sender?.name}</strong> To: <strong>{receiver?.name}</strong></p>
                                <p className="text-slate-700 my-2">"{msg.text}"</p>
                                <div className="flex justify-between items-center text-xs text-slate-400">
                                    <span>Trashed: {new Date(msg.deletedTimestamp!).toLocaleString()}</span>
                                    <div className="space-x-2">
                                        <button onClick={() => onRestoreMessage(msg.id)} className="font-semibold text-emerald-600 hover:underline">Restore</button>
                                        {currentUser.role === UserRole.ADMIN && <button onClick={() => onPermanentlyDeleteMessage(msg.id)} className="font-semibold text-rose-600 hover:underline">Delete Permanently</button>}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                </>
            ) : selectedUser ? (
            <>
              <div className="p-3 border-b border-slate-200/80 backdrop-blur-md flex items-center justify-between shadow-sm h-[80px]">
                {isSearchActive ? (
                    <div className="flex items-center w-full">
                        <SearchIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search in conversation"
                            className="flex-grow bg-transparent px-3 text-slate-800 focus:outline-none"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && searchResults.length > 0 && (
                            <span className="text-sm text-slate-500 ml-4 flex-shrink-0">{currentResultIndex + 1} of {searchResults.length}</span>
                        )}
                        <button onClick={handlePrevResult} disabled={searchResults.length < 2} className="p-2 text-slate-500 disabled:opacity-50 hover:text-slate-800"><ChevronDownIcon className="w-5 h-5 transform rotate-180"/></button>
                        <button onClick={handleNextResult} disabled={searchResults.length < 2} className="p-2 text-slate-500 disabled:opacity-50 hover:text-slate-800"><ChevronDownIcon className="w-5 h-5"/></button>
                        <button onClick={() => { setIsSearchActive(false); setSearchQuery(''); }} className="p-2 text-slate-500 hover:text-slate-800"><CloseIcon className="w-5 h-5"/></button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center">
                            <img src={selectedUser.avatar} alt={selectedUser.name} className="w-10 h-10 rounded-full" />
                            <h2 className="text-lg font-bold text-slate-800 ml-3">{selectedUser.name}</h2>
                        </div>
                        <div className="flex items-center space-x-1">
                             <button onClick={() => setIsSearchActive(true)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100/80 hover:text-slate-800 transition-colors">
                                <SearchIcon className="w-5 h-5"/>
                            </button>
                            <button 
                                onClick={handleToggleSelectionMode}
                                className="text-sm font-semibold text-primary-600 hover:text-primary-800 bg-primary-100/50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors button-press"
                            >
                                {isSelectionMode ? 'Cancel' : 'Select'}
                            </button>
                        </div>
                    </>
                 )}
              </div>
              <div className={`flex-1 p-4 md:p-6 overflow-y-auto ${isSelectionMode && selectedMessageIds.size > 0 ? 'pb-24' : ''}`}>
                  <div className="flex flex-col">
                      {conversation.map((msg, index) => {
                          const prevMsg = conversation[index - 1];
                          const nextMsg = conversation[index + 1];
                          const isMyMessage = msg.senderId === currentUser.id;
                          const showDateSeparator = !prevMsg || !isSameDay(new Date(msg.timestamp), new Date(prevMsg.timestamp));
                          const isFirstInSequence = !prevMsg || prevMsg.senderId !== msg.senderId || !isSameDay(new Date(msg.timestamp), new Date(prevMsg.timestamp));
                          const isLastInSequence = !nextMsg || nextMsg.senderId !== msg.senderId || !isSameDay(new Date(msg.timestamp), new Date(nextMsg.timestamp));
                          const bubbleClasses = ['px-3.5 py-2.5 rounded-3xl max-w-md lg:max-w-xl break-words relative shadow-sm', isMyMessage ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-900', isFirstInSequence && isMyMessage ? 'rounded-tr-lg' : '', isFirstInSequence && !isMyMessage ? 'rounded-tl-lg' : '', isLastInSequence && isMyMessage ? 'rounded-br-lg' : '', isLastInSequence && !isMyMessage ? 'rounded-bl-lg' : ''].join(' ');
                          const isEditingThis = editingMessage?.id === msg.id;
                          const isCurrentSearchResult = searchResults[currentResultIndex] === msg.id;
                          
                          const messageTime = new Date(msg.timestamp).getTime();
                          const currentTime = new Date().getTime();
                          const isEditable = (currentTime - messageTime) <= 2 * 60 * 1000; // 2 minutes

                          return (
                               <React.Fragment key={msg.id}>
                                  {showDateSeparator && <DateSeparator date={msg.timestamp} />}
                                    <div 
                                        ref={el => { if (el) messageRefs.current.set(msg.id, el); else messageRefs.current.delete(msg.id); }}
                                        className={`flex items-center gap-1.5 group ${isMyMessage ? 'justify-end' : 'justify-start'} ${isFirstInSequence ? 'mt-3' : 'mt-1'} -mx-2 px-2 py-1 rounded-lg transition-all ${isSelectionMode ? 'cursor-pointer' : ''} ${selectedMessageIds.has(msg.id) ? 'bg-primary-100/50' : ''} ${isCurrentSearchResult ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
                                        onClick={() => isSelectionMode && handleToggleMessageSelection(msg.id)}
                                    >
                                      {isSelectionMode && !isMyMessage && <Checkbox checked={selectedMessageIds.has(msg.id)} />}
                                      <div className={`flex items-start gap-2.5 ${isMyMessage ? 'flex-1 justify-end' : 'flex-1'}`}>
                                          {!isMyMessage && (<div className="w-8 flex-shrink-0 self-end">{isLastInSequence && <img src={selectedUser.avatar} alt={selectedUser.name} className="w-8 h-8 rounded-full" />}</div>)}
                                          <div className={`flex items-center ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                              <div className={bubbleClasses}>
                                                  {isEditingThis ? (
                                                      <div className="w-80"><textarea ref={editInputRef} value={editingMessage.text} onChange={(e) => setEditingMessage(prev => prev ? { ...prev, text: e.target.value } : null)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); } if (e.key === 'Escape') { e.preventDefault(); handleCancelEdit(); }}} className="w-full bg-primary-700 text-white rounded-lg focus:outline-none resize-none p-1" rows={1} onInput={handleTextareaInput} />
                                                          <div className="text-xs text-primary-200 mt-1"><button onClick={handleSaveEdit} className="font-semibold hover:underline">Save</button> &middot; <button onClick={handleCancelEdit} className="hover:underline">Cancel</button></div>
                                                      </div>
                                                  ) : (
                                                    <div className="whitespace-pre-wrap">
                                                      <HighlightedText text={msg.text} highlight={searchQuery} />
                                                      {msg.edited && <span className="text-xs opacity-70 ml-1">(edited)</span>}
                                                    </div>
                                                  )}
                                              </div>
                                              {isMyMessage && !isSelectionMode && (
                                                <div className="flex items-center self-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity px-2">
                                                    <button 
                                                        onClick={() => handleStartEdit(msg)} 
                                                        className={`p-1.5 rounded-full hover:bg-slate-200 ${isEditable ? 'text-slate-400 hover:text-slate-800' : 'text-slate-300 cursor-not-allowed'}`}
                                                        aria-label={isEditable ? "Edit message" : "Edit disabled"}
                                                        title={isEditable ? "Edit message" : "Can only edit for 2 minutes"}
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => onTrashMessage(msg.id)} 
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-full hover:bg-slate-200" 
                                                        aria-label="Delete message" 
                                                        title="Delete message"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                              )}
                                          </div>
                                      </div>
                                      {isSelectionMode && isMyMessage && <Checkbox checked={selectedMessageIds.has(msg.id)} />}
                                  </div>
                              </React.Fragment>
                          );
                      })}
                       {typingStatus[selectedUserId] && selectedUser && (<div className="flex items-end gap-2 justify-start mt-2"><div className="w-8 flex-shrink-0"><img src={selectedUser.avatar} alt={selectedUser.name} className="w-8 h-8 rounded-full" /></div><div className="px-4 py-3 rounded-3xl bg-slate-200 text-slate-900 flex items-center rounded-bl-lg"><div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div></div></div>)}
                  </div>
                   {lastMyMessage && lastMyMessage.isRead && (<div className="text-right text-xs text-slate-500 mt-1 pr-2">Read</div>)}
                  <div ref={messagesEndRef} />
              </div>

              {isSelectionMode && selectedMessageIds.size > 0 && (
                <div className="p-3 bg-white/90 backdrop-blur-md border-t border-slate-200/80 shadow-md flex justify-between items-center transition-transform duration-300 page-enter">
                    <span className="font-semibold text-slate-700">{selectedMessageIds.size} selected</span>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleBulkTrash} className="flex items-center text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg button-press">
                            <TrashIcon className="w-4 h-4 mr-1.5" /> Trash
                        </button>
                        {currentUser.role === UserRole.ADMIN && (
                            <button onClick={handleBulkDelete} className="flex items-center text-sm font-semibold bg-rose-100 text-rose-700 hover:bg-rose-200 px-3 py-1.5 rounded-lg button-press">
                                <TrashIcon className="w-4 h-4 mr-1.5" /> Delete Permanently
                            </button>
                        )}
                    </div>
                </div>
              )}

              <div className="p-4 bg-white/50 border-t border-slate-200/80">
                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                  <textarea ref={textareaRef} value={newMessage} onChange={(e) => { setNewMessage(e.target.value); onTyping(); }} onInput={handleTextareaInput} onKeyDown={handleKeyDown} placeholder={`Message ${selectedUser.name}`} className="w-full px-4 py-2.5 bg-slate-100/70 border border-slate-300/70 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none max-h-[120px]" rows={1} />
                  <button type="submit" disabled={!newMessage.trim()} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${newMessage.trim() ? 'bg-primary-600 text-white shadow-md scale-100' : 'bg-slate-300 text-slate-500 scale-90 cursor-not-allowed'}`} aria-label="Send message" title="Send message"><ArrowUpIcon className="w-5 h-5"/></button>
                </form>
              </div>
            </>
          ) : ( <div className="flex-1 flex items-center justify-center text-slate-500"><p>Select a conversation to begin messaging.</p></div> )}
        </div>
      </div>
    </div>
  );
};

export default MessagingView;