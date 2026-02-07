/**
 * Team Members Page
 * Admin: see all team members and change their role (Member ↔ Admin).
 * Member: see all team members only.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Users, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUsers, updateUserRole } from '@/services/users';
import type { User, Role } from '@/types/api';
import { RequireRole } from '@/components/auth/RequireRole';
import clsx from 'clsx';

const roleColors: Record<Role, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    MEMBER: 'bg-blue-100 text-blue-700',
};

function getInitials(name?: string, email?: string): string {
    if (name?.trim()) {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }
    if (email?.length) {
        return email.slice(0, 2).toUpperCase();
    }
    return '?';
}

export const TeamPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [members, setMembers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchMembers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const list = await getUsers();
            setMembers(list);
        } catch (err) {
            console.error('Failed to fetch team members:', err);
            setError(err instanceof Error ? err.message : 'Failed to load team members');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleRoleChange = async (userId: string, newRole: Role) => {
        if (userId === currentUser?.id) {
            return; // don't allow changing own role from this UI
        }
        setUpdatingId(userId);
        try {
            const updated = await updateUserRole(userId, { role: newRole });
            setMembers(prev => prev.map(m => (m.id === userId ? updated : m)));
        } catch (err) {
            console.error('Failed to update role:', err);
            alert(err instanceof Error ? err.message : 'Failed to update role');
        } finally {
            setUpdatingId(null);
        }
    };

    const isAdmin = currentUser?.role === 'ADMIN';

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
                    <p className="text-gray-500 mt-1">View and manage team collaboration.</p>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3 text-gray-500">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Loading team members...</span>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
                    <p className="text-gray-500 mt-1">
                        {isAdmin
                            ? 'View and manage team members. Change roles (Admin/Member) below.'
                            : 'View your team members.'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={fetchMembers}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Refresh"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <p className="font-medium">Failed to load team members</p>
                    <p className="text-sm mt-1">{error}</p>
                    <button
                        type="button"
                        onClick={fetchMembers}
                        className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Project Team</h3>
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                            {members.length} {members.length === 1 ? 'Member' : 'Members'}
                        </span>
                    </div>
                </div>

                <div className="divide-y divide-gray-50">
                    {members.length === 0 && !error ? (
                        <div className="p-8 text-center text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No team members found.</p>
                        </div>
                    ) : (
                        members.map((member) => (
                            <div
                                key={member.id}
                                className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={clsx(
                                            'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
                                            roleColors[member.role] || 'bg-gray-100 text-gray-700'
                                        )}
                                    >
                                        {getInitials(member.name, member.email)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {member.name || member.email || 'Unknown'}
                                        </p>
                                        <p className="text-xs text-gray-500">{member.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <RequireRole role="ADMIN">
                                        {member.id !== currentUser?.id ? (
                                            <select
                                                value={member.role}
                                                disabled={!!updatingId}
                                                onChange={(e) =>
                                                    handleRoleChange(member.id, e.target.value as Role)
                                                }
                                                className={clsx(
                                                    'text-sm rounded-lg border border-gray-200 bg-white px-2 py-1.5',
                                                    'focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                                                    updatingId === member.id && 'opacity-60 pointer-events-none'
                                                )}
                                            >
                                                <option value="MEMBER">Member</option>
                                                <option value="ADMIN">Admin</option>
                                            </select>
                                        ) : (
                                            <span
                                                className={clsx(
                                                    'text-xs px-2 py-1 rounded',
                                                    roleColors[currentUser?.role ?? member.role] || 'bg-gray-100 text-gray-600'
                                                )}
                                            >
                                                {currentUser?.role ?? member.role} (you)
                                            </span>
                                        )}
                                    </RequireRole>
                                    {!isAdmin && (
                                        <span
                                            className={clsx(
                                                'text-xs px-2 py-1 rounded',
                                                roleColors[member.role] || 'bg-gray-100 text-gray-600'
                                            )}
                                        >
                                            {member.role}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};
