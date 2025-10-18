import React, { useState, useMemo } from 'react';
import { DashboardIcon, ClientsIcon, CrmLogoIcon, TasksIcon, ChevronDownIcon, MessageIcon, UserCircleIcon, DollarSignIcon, PencilIcon, ShieldIcon, BellIcon, EyeIcon, CalendarDaysIcon, ChatBubbleLeftRightIcon, AiSparklesIcon, UsersIcon, ShieldCheckIcon, BroadcastIcon, LogoutIcon, RocketLaunchIcon, ExclamationTriangleIcon, TrophyIcon, DocumentTextIcon } from './icons';
import { User, UserRole, Notification, NotificationType } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: User;
  onEditMyProfile: () => void;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onClearAllNotifications: (userId: number) => void;
  impersonatedRole: UserRole | null;
  onLogout: () => void;
}

const navConfig = {
  [UserRole.ADMIN]: [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'ai-assistant', label: 'AI Assistant', icon: <AiSparklesIcon /> },
    { id: 'ai-onboarding', label: 'AI Onboarding', icon: <RocketLaunchIcon /> },
    { id: 'clients', label: 'Clients', icon: <ClientsIcon /> },
    { id: 'agents', label: 'Agents', icon: <ClientsIcon /> },
    { id: 'tasks', label: 'Tasks', icon: <TasksIcon /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarDaysIcon /> },
    { id: 'commissions', label: 'Commissions', icon: <DollarSignIcon /> },
    { id: 'messages', label: 'Messages', icon: <MessageIcon /> },
  ],
  [UserRole.MANAGER]: [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'manager-portal', label: 'Manager Portal', icon: <TrophyIcon /> },
    { id: 'agents', label: 'Manage Agents', icon: <UsersIcon /> },
    { id: 'clients', label: 'View Clients', icon: <ClientsIcon /> },
    { id: 'messages', label: 'Messages', icon: <MessageIcon /> },
  ],
  [UserRole.UNDERWRITING]: [
    { id: 'underwriting-portal', label: 'Underwriting Queue', icon: <DocumentTextIcon /> },
    { id: 'clients', label: 'View Clients', icon: <ClientsIcon /> },
    { id: 'messages', label: 'Messages', icon: <MessageIcon /> },
  ],
  [UserRole.SUB_ADMIN]: [
    { id: 'dashboard', label: 'Lead Dashboard', icon: <DashboardIcon /> },
    { id: 'ai-assistant', label: 'AI Assistant', icon: <AiSparklesIcon /> },
    { id: 'ai-onboarding', label: 'AI Onboarding', icon: <RocketLaunchIcon /> },
    { id: 'leads', label: 'Lead Distribution', icon: <ClientsIcon /> },
    { id: 'agents', label: 'View Agents', icon: <UsersIcon /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarDaysIcon /> },
    { id: 'messages', label: 'Messages', icon: <MessageIcon /> },
  ],
  [UserRole.AGENT]: [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'ai-assistant', label: 'AI Assistant', icon: <AiSparklesIcon /> },
    { id: 'clients', label: 'My Clients', icon: <ClientsIcon /> },
    { id: 'tasks', label: 'My Tasks', icon: <TasksIcon /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarDaysIcon /> },
    { id: 'commissions', label: 'Commissions', icon: <DollarSignIcon /> },
    { id: 'chargebacks', label: 'Debt / Chargeback', icon: <ExclamationTriangleIcon /> },
    { id: 'messages', label: 'Messages', icon: <MessageIcon /> },
    { id: 'testimonials', label: 'Testimonials', icon: <ChatBubbleLeftRightIcon /> },
    { id: 'licenses', label: 'Licenses', icon: <ShieldIcon /> },
    { id: 'my-profile', label: 'My Public Profile', icon: <UserCircleIcon /> },
  ],
};


const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, currentUser, onEditMyProfile, notifications, onNotificationClick, onClearAllNotifications, impersonatedRole, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const displayRole = impersonatedRole || currentUser.role;
  const navItems = navConfig[displayRole];

  const baseClasses = 'flex items-center px-4 py-3 text-sm font-medium rounded-xl group';
  const activeClasses = 'bg-primary-50 text-primary-600 font-semibold shadow-[0_2px_10px_-3px_rgba(99,102,241,0.3)]';
  const inactiveClasses = 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-800';
  
  const userNotifications = useMemo(() => {
    return notifications
        .filter(n => n.userId === currentUser.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications, currentUser.id]);

  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const handleNotificationItemClick = (notification: Notification) => {
    onNotificationClick(notification);
    setIsNotificationsOpen(false);
  };
  
  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
  }

  const getNotificationIcon = (type: NotificationType) => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    switch (type) {
      case NotificationType.NEW_MESSAGE:
        return <MessageIcon className={`${iconClass} text-sky-500`} />;
      case NotificationType.LEAD_ASSIGNED:
        return <UsersIcon className={`${iconClass} text-emerald-500`} />;
      case NotificationType.TASK_DUE:
        return <TasksIcon className={`${iconClass} text-amber-500`} />;
      case NotificationType.AGENT_APPROVED:
        return <ShieldCheckIcon className={`${iconClass} text-violet-500`} />;
      case NotificationType.BROADCAST:
        return <BroadcastIcon className={`${iconClass} text-rose-500`} />;
      case NotificationType.POLICY_RENEWAL:
        return <ShieldCheckIcon className={`${iconClass} text-blue-500`} />;
      case NotificationType.CHARGEBACK_ISSUED:
        return <ExclamationTriangleIcon className={`${iconClass} text-rose-500`} />;
      case NotificationType.UNDERWRITING_REVIEWED:
        return <DocumentTextIcon className={`${iconClass} text-indigo-500`} />;
      default:
        return <BellIcon className={`${iconClass} text-slate-500`} />;
    }
  };

  return (
    <div className="w-72 bg-white/90 backdrop-blur-xl h-screen p-6 flex flex-col fixed shadow-lg border-r border-slate-200/80">
      <div className="flex items-center justify-between mb-10 px-2">
        <CrmLogoIcon className="w-40" variant="light" />
        <div className="relative">
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="text-slate-500 hover:text-primary-600 relative" aria-label="Open notifications" title="Notifications">
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">{unreadCount}</span>}
            </button>
            {isNotificationsOpen && (
                 <div className="absolute top-full mt-2 right-0 w-80 bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-premium-lg z-20 dropdown-panel">
                    <div className="p-3 flex justify-between items-center border-b border-slate-200">
                        <h3 className="font-semibold text-slate-800">Notifications</h3>
                        <button onClick={() => onClearAllNotifications(currentUser.id)} className="text-xs text-primary-600 hover:underline">Mark all as read</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {userNotifications.length > 0 ? userNotifications.map(n => (
                            <div key={n.id} onClick={() => handleNotificationItemClick(n)} className="p-3 flex items-start border-b border-slate-200/80 hover:bg-slate-100/50 cursor-pointer">
                                <div className="mt-0.5">{getNotificationIcon(n.type)}</div>
                                <div className="ml-3">
                                    <p className={`text-sm ${n.isRead ? 'text-slate-500' : 'text-slate-800'}`}>{n.message}</p>
                                    <p className="text-xs text-slate-400 mt-1">{timeSince(n.timestamp)}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="p-4 text-center text-sm text-slate-500">No notifications yet.</p>
                        )}
                    </div>
                 </div>
            )}
        </div>
      </div>
      <nav className="flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={`${baseClasses} ${currentView.startsWith(item.id) ? activeClasses : inactiveClasses} w-full text-left button-press`}
              >
                <span className="mr-3 transition-transform duration-200 group-hover:scale-110">{React.cloneElement(item.icon, { className: 'w-5 h-5' })}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-auto relative">
        <div className="p-2 rounded-xl hover:bg-slate-100/80 cursor-pointer" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
          <div className="flex items-center">
            <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-slate-200" />
            <div className="ml-3 flex-1">
                <p className="font-semibold text-sm text-slate-800">{currentUser.name}</p>
                <p className="text-xs text-slate-500">{currentUser.title}</p>
            </div>
            <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
        {isDropdownOpen && (
            <div className="absolute bottom-full mb-2 w-full bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-xl shadow-premium-lg py-1 z-10 dropdown-panel">
                <a href="#" onClick={(e) => { e.preventDefault(); onEditMyProfile(); setIsDropdownOpen(false); }} className="flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-100/50">
                    <PencilIcon className="w-4 h-4 mr-3 text-slate-500" />
                    <span>Edit My Profile</span>
                </a>
                <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); setIsDropdownOpen(false); }} className="flex items-center px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                    <LogoutIcon className="w-4 h-4 mr-3" />
                    <span>Logout</span>
                </a>
            </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;