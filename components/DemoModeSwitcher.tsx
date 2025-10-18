import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { User, UserRole, Agent } from '../types';
import { EyeIcon, UserCircleIcon, UsersIcon, ChevronDownIcon, TrophyIcon, DocumentTextIcon } from './icons';
import { useToast } from '../contexts/ToastContext';

interface DemoModeSwitcherProps {
    adminUser: User;
    subAdminUser?: User;
    managerUser?: User;
    underwriterUser?: User;
    agents: Agent[];
    impersonatedUserId: number | null;
    onSwitchUser: (userId: number | null) => void;
}

const DemoModeSwitcher: React.FC<DemoModeSwitcherProps> = ({
    adminUser,
    subAdminUser,
    managerUser,
    underwriterUser,
    agents,
    impersonatedUserId,
    onSwitchUser
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { addToast } = useToast();

    const allUsers = useMemo(() => [adminUser, subAdminUser, managerUser, underwriterUser, ...agents].filter(Boolean), [adminUser, subAdminUser, managerUser, underwriterUser, agents]);

    const currentUserInfo = useMemo(() => {
        if (impersonatedUserId === null) return adminUser;
        const user = allUsers.find(u => u.id === impersonatedUserId);
        if (user) {
            // Agent type doesn't have a role, so we add it for display
            if (!('role' in user)) return { ...user, role: UserRole.AGENT };
            return user as User;
        }
        return adminUser;
    }, [impersonatedUserId, allUsers, adminUser]);

    const handleSwitchUser = useCallback((userId: number | null) => {
        onSwitchUser(userId);
        const user = allUsers.find(u => u.id === userId) || adminUser;
        const role = 'role' in user ? (user as User).role : UserRole.AGENT;
        addToast(`Switched to ${role} Mode`, `Now viewing as ${user.name}`, 'info');
        window.location.hash = `#/dashboard?t=${Date.now()}`;
        setIsExpanded(false);
    }, [onSwitchUser, addToast, allUsers, adminUser]);

    const handleExitDemo = useCallback(() => {
        onSwitchUser(null);
        addToast('Demo Mode Exited', 'Returned to administrator view', 'info');
        window.location.hash = `#/dashboard?t=${Date.now()}`;
        setIsExpanded(false);
    }, [onSwitchUser, addToast]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!(event.target as HTMLElement).closest('.demo-mode-switcher')) {
                setIsExpanded(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="fixed top-6 right-6 z-50 bg-white/80 backdrop-blur-lg text-primary-600 px-4 py-2 rounded-full shadow-premium-lg border border-white/50 hover:shadow-premium-glow transition-all duration-300 demo-mode-switcher flex items-center"
            >
                <EyeIcon className="w-5 h-5 mr-2" />
                <span className="font-semibold">Demo Mode</span>
            </button>
        );
    }

    const RoleButton: React.FC<{ user: User | Agent; icon: React.ReactNode }> = ({ user, icon }) => {
        const role = 'role' in user ? (user as User).role : UserRole.AGENT;
        const userId = 'role' in user ? user.id : null;
        if (role === UserRole.ADMIN && userId === null) {
            // special case for admin
        } else if (!user) {
            return null;
        }

        return (
             <button
                onClick={() => handleSwitchUser(user.id)}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                    impersonatedUserId === user.id
                        ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-inner'
                        : 'bg-white/50 border-slate-200/80 text-slate-700 hover:bg-slate-100/50 hover:border-slate-300'
                }`}
            >
                <div className="font-semibold text-base flex items-center">{icon} {role.replace('_', ' ')}</div>
            </button>
        );
    };

    return (
        <div className="fixed top-6 right-6 z-50 bg-white/80 backdrop-blur-2xl rounded-2xl shadow-premium-lg border border-white/50 p-6 w-80 demo-mode-switcher">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/80">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Demo Mode</h3>
                    <p className="text-sm text-slate-600">Switch between user roles</p>
                </div>
                <button onClick={() => setIsExpanded(false)} className="text-xs bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-300 transition-colors font-medium shadow-sm">&times;</button>
            </div>

            <div className="mb-4 p-3 bg-slate-100/50 rounded-lg border border-slate-200/50">
                <div className="text-sm font-medium text-slate-700">Currently Viewing:</div>
                <div className="text-lg font-bold text-slate-900">{currentUserInfo?.name}</div>
                <div className="text-xs text-slate-500 capitalize">{currentUserInfo?.role.replace('_', ' ')}</div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                <RoleButton user={adminUser} icon={<UserCircleIcon className="w-5 h-5 mr-2" />} />
                {managerUser && <RoleButton user={managerUser} icon={<TrophyIcon className="w-5 h-5 mr-2" />} />}
                {subAdminUser && <RoleButton user={subAdminUser} icon={<UsersIcon className="w-5 h-5 mr-2" />} />}
                {underwriterUser && <RoleButton user={underwriterUser} icon={<DocumentTextIcon className="w-5 h-5 mr-2" />} />}
                {agents.map((agent) => (
                    <button
                        key={agent.id}
                        onClick={() => handleSwitchUser(agent.id)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                            impersonatedUserId === agent.id
                                ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-inner'
                                : 'bg-white/50 border-slate-200/80 text-slate-700 hover:bg-slate-100/50 hover:border-slate-300'
                        }`}
                    >
                        <div className="font-semibold text-sm flex items-center"><UserCircleIcon className="w-5 h-5 mr-2" /> {agent.name}</div>
                    </button>
                ))}
            </div>
            
            <button
                onClick={handleExitDemo}
                className="w-full mt-4 text-center text-xs bg-rose-100 text-rose-700 px-3 py-2 rounded-md hover:bg-rose-200 transition-colors font-medium shadow-sm"
            >
                Exit Demo Mode & Return to Admin
            </button>
        </div>
    );
};

export default DemoModeSwitcher;