/**
 * EditTaskModal Component
 * Modal form for editing existing tasks (Admin only)
 */
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Save, X } from 'lucide-react';
import { updateTask, assignUsersToTask, unassignUserFromTask } from '@/services/tasks';
import { getUsers } from '@/services/users';
import type { Task, UpdateTaskRequest, Priority, User } from '@/types/api';
import clsx from 'clsx';

interface EditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
    onTaskUpdated?: () => void;
}

const priorities: { value: Priority; label: string; color: string }[] = [
    { value: 'LOW', label: 'Low', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200' },
];

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
    isOpen,
    onClose,
    task,
    onTaskUpdated,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Priority>('MEDIUM');
    const [dueDate, setDueDate] = useState('');
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
    const [originalAssignees, setOriginalAssignees] = useState<string[]>([]);
    const [users, setUsers] = useState<Pick<User, 'id' | 'name' | 'email'>[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load task data when modal opens or task changes
    useEffect(() => {
        if (isOpen && task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setPriority(task.priority);
            setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
            const assigneeIds = (task.assignedTo?.map(a => a.id).filter(Boolean) || []) as string[];
            setSelectedAssignees(assigneeIds);
            setOriginalAssignees(assigneeIds);
            setError(null);
            loadUsers();
        }
    }, [isOpen, task]);

    const loadUsers = async () => {
        try {
            const fetchedUsers = await getUsers();
            if (fetchedUsers.length > 0) {
                setUsers(fetchedUsers);
            }
        } catch (err) {
            console.warn('Failed to fetch users:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!task) return;

        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Update task details
            const taskData: UpdateTaskRequest = {
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                dueDate: dueDate || undefined,
            };

            await updateTask(task.id, taskData);

            // Handle assignment changes
            const toAdd = selectedAssignees.filter(id => !originalAssignees.includes(id));
            const toRemove = originalAssignees.filter(id => !selectedAssignees.includes(id));

            // Add new assignments
            if (toAdd.length > 0) {
                await assignUsersToTask(task.id, { userIds: toAdd });
            }

            // Remove old assignments
            for (const userId of toRemove) {
                try {
                    await unassignUserFromTask(task.id, userId);
                } catch (err) {
                    console.warn('Failed to unassign user:', userId, err);
                }
            }

            onTaskUpdated?.();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update task');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleAssignee = (userId: string) => {
        setSelectedAssignees(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleClose = () => {
        setError(null);
        onClose();
    };

    if (!task) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <form onSubmit={handleSubmit} className="p-6 md:p-8">
                {/* Header */}
                <div className="mb-6 pr-8">
                    <h2 className="text-xl font-bold text-gray-900">Edit Task</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Update task details and assignments
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Title */}
                <div className="mb-4">
                    <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                        Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                        id="edit-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter task title"
                        required
                    />
                </div>

                {/* Description */}
                <div className="mb-4">
                    <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <textarea
                        id="edit-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter task description..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-sm"
                    />
                </div>

                {/* Priority */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                    </label>
                    <div className="flex gap-2">
                        {priorities.map((p) => (
                            <button
                                key={p.value}
                                type="button"
                                onClick={() => setPriority(p.value)}
                                className={clsx(
                                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                                    priority === p.value
                                        ? p.color
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Due Date */}
                <div className="mb-4">
                    <label htmlFor="edit-dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date
                    </label>
                    <Input
                        id="edit-dueDate"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                </div>

                {/* Assignees */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assignees
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {users.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => toggleAssignee(user.id)}
                                className={clsx(
                                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all',
                                    selectedAssignees.includes(user.id)
                                        ? 'bg-primary-100 text-primary-700 border border-primary-300'
                                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                                )}
                            >
                                <div className={clsx(
                                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                                    selectedAssignees.includes(user.id)
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-300 text-gray-600'
                                )}>
                                    {user.name.charAt(0)}
                                </div>
                                <span>{user.name}</span>
                                {selectedAssignees.includes(user.id) && (
                                    <X size={14} className="ml-1" />
                                )}
                            </button>
                        ))}
                        {users.length === 0 && (
                            <p className="text-sm text-gray-500">Loading users...</p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        icon={Save}
                        disabled={isSubmitting || !title.trim()}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
