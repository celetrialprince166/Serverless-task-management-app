import React from 'react';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const Header: React.FC = () => {
    const { user } = useAuth();
    const roleLabel = user?.role === 'ADMIN' ? 'Admin' : 'Member';
    const displayInitial = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();

    return (
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 fixed w-[calc(100%-16rem)] ml-64 z-10">
            {/* Left: Search */}
            <div className="w-96">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                <div className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-medium border border-orange-100">
                    {roleLabel}
                </div>

                <button type="button" className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
                </button>

                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold border border-primary-200" title={user?.name || user?.email}>
                    {displayInitial}
                </div>
            </div>
        </header>
    );
};
