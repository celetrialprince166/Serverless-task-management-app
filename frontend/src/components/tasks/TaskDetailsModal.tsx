/**
 * TaskDetailsModal Component
 * Shows detailed task information with edit/delete actions for admins
 */
import React from 'react';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import {
    Pencil,
    Trash2,
    Calendar,
    Clock,
    Flag,
    User
} from 'lucide-react';
import { RequireRole } from '@/components/auth/RequireRole';
import type { Task, TaskStatus } from '@/types/api';

interface TaskDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
    onEdit?: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

// Priority display configuration
const priorityConfig: Record<string, { label: string; color: string }> = {
    URGENT: { label: 'Urgent', color: 'text-red-600 bg-red-50 border-red-100' },
    HIGH: { label: 'High', color: 'text-orange-600 bg-orange-50 border-orange-100' },
    MEDIUM: { label: 'Medium', color: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
    LOW: { label: 'Low', color: 'text-green-600 bg-green-50 border-green-100' },
};

// Status options for the dropdown
const statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CLOSED', label: 'Closed' },
];

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
    isOpen,
    onClose,
    task,
    onEdit,
    onDelete,
    onStatusChange,
}) => {
    if (!task) return null;

    const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;

    // Format date for display
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (onStatusChange) {
            onStatusChange(task.id, e.target.value as TaskStatus);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <div className="p-6 md:p-8">

                {/* Header Actions */}
                <div className="flex items-center justify-between mb-6 pr-8">
                    <div className="flex items-center gap-3">
                        <StatusBadge status={task.status} />
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${priority.color}`}>
                            <Flag size={12} fill="currentColor" />
                            <span>{priority.label}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <RequireRole role="ADMIN">
                            <Button
                                variant="outline"
                                size="sm"
                                icon={Pencil}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onEdit?.(task);
                                }}
                            >
                                Edit
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                icon={Trash2}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => onDelete?.(task.id)}
                            >
                                Delete
                            </Button>
                        </RequireRole>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {task.title}
                </h2>

                {/* Description */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                        Description
                    </label>
                    <p className="text-gray-900 leading-relaxed">
                        {task.description || 'No description provided.'}
                    </p>
                </div>

                {/* Status Select */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                        Status
                    </label>
                    <select
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5"
                        value={task.status}
                        onChange={handleStatusChange}
                        disabled={!onStatusChange}
                    >
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {!onStatusChange && (
                        <p className="text-xs text-gray-400 mt-1">
                            Status update not available yet
                        </p>
                    )}
                </div>

                {/* Assignees */}
                <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-medium text-gray-500">
                            Assignees ({task.assignedTo?.length || 0})
                        </label>
                    </div>

                    {task.assignedTo && task.assignedTo.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                            {task.assignedTo.map((assignee) => (
                                <div
                                    key={assignee.id || assignee.email}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm"
                                >
                                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                                        {assignee.name?.charAt(0) || assignee.email?.charAt(0) || '?'}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                        {assignee.name || assignee.email}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <User size={16} />
                            <span>No assignees</span>
                        </div>
                    )}
                </div>

                {/* Created By */}
                {task.createdBy && (
                    <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-xs text-gray-500">Created by </span>
                        <span className="text-sm font-medium text-gray-700">
                            {task.createdBy.name || task.createdBy.email}
                        </span>
                    </div>
                )}

                {/* Footer Metadata */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 border-t border-gray-100 text-sm text-gray-500 gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>Due {formatDate(task.dueDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>Created {formatDate(task.createdAt)}</span>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
