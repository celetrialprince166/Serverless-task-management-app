import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ListTodo,
    Users,
    Settings,
    LogOut,
    Plus,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import clsx from 'clsx';
import { useAuth } from '@/context/AuthContext';

export const Sidebar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNewTask = () => {
        navigate('/tasks', { state: { openCreateModal: true } });
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: ListTodo, label: 'All Tasks', path: '/tasks' },
        { icon: Users, label: 'Team Members', path: '/team' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <aside className="w-64 bg-[#0f172a] text-white flex flex-col fixed h-full transition-all duration-300">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3">
                <div className="bg-primary-600 p-1.5 rounded-lg">
                    <LayoutDashboard size={20} className="text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">TaskFlow</span>
            </div>

            {/* New Task Button (Admin only) */}
            {user?.role === 'ADMIN' && (
                <div className="px-4 mb-6">
                    <Button
                        fullWidth
                        className="bg-primary-600 hover:bg-primary-700 text-white justify-center gap-2"
                        onClick={handleNewTask}
                    >
                        <Plus size={18} />
                        <span>New Task</span>
                    </Button>
                </div>
            )}

    {/* Navigation */ }
    <nav className="flex-1 px-4 space-y-1" >
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2" >
            Navigation
            </div>
    {
        navItems.map((item) => (
            <NavLink
            key= { item.path }
            to = { item.path }
            className = {({ isActive }) =>
clsx(
    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
    isActive
        ? 'bg-[#1e293b] text-white shadow-sm'
        : 'text-gray-400 hover:bg-[#1e293b] hover:text-white'
)
            }
          >
    <item.icon size={ 18 } />
{ item.label }
</NavLink>
        ))}
</nav>

{/* User Profile & Logout */ }
<div className="p-4 border-t border-gray-800" >
    <div className="flex items-center gap-3 mb-4 px-2" >
        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white" >
            {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
            < div className = "flex-1 min-w-0" >
                <p className="text-sm font-medium text-white truncate">{user?.name || user?.email?.split('@')[0] || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                        </div>
                        </div>

                        < button
onClick = { handleLogout }
className = "flex items-center gap-3 px-2 py-2 text-sm font-medium text-gray-400 hover:text-white w-full transition-colors rounded-lg hover:bg-[#1e293b]"
    >
    <LogOut size={ 18 } />
        < span > Sign out </span>
            </button>
            </div>
            </aside>
  );
};
