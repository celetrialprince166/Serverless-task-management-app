/**
 * CreateTaskModal Component
 * Modal form for creating new tasks (Admin only)
 */
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Plus, X } from 'lucide-react';
import { createTask } from '@/services/tasks';
import { getUsers } from '@/services/users';
import type { CreateTaskRequest, Priority, User } from '@/types/api';
import clsx from 'clsx';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskCreated?: () => void;
}

const priorities: { value: Priority; label: string; color: string }[] = [
    { value: 'LOW', label: 'Low', color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200' },
];

// Mock users with valid UUID format for fallback
const mockUsers: Pick<User, 'id' | 'name' | 'email'>[] = [
    { id: 'a1b2c3d4-e5f6-7890-abcd-111111111111', name: 'John Doe', email: 'john@amalitech.com' },
    { id: 'a1b2c3d4-e5f6-7890-abcd-222222222222', name: 'Jane Smith', email: 'jane@amalitech.com' },
    { id: 'a1b2c3d4-e5f6-7890-abcd-333333333333', name: 'Bob Wilson', email: 'bob@amalitech.com' },
];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
    isOpen,
    onClose,
    onTaskCreated,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Priority>('MEDIUM');
    const [dueDate, setDueDate] = useState('');
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
    const [users, setUsers] = useState<Pick<User, 'id' | 'name' | 'email'>[]>(mockUsers);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load users when modal opens
    useEffect(() => {
        if (isOpen) {
            loadUsers();
        }
    }, [isOpen]);

    const loadUsers = async () => {
        try {
            const fetchedUsers = await getUsers();
            if (fetchedUsers.length > 0) {
                setUsers(fetchedUsers);
            } else {
                console.warn('No users returned from API, using mock users');
            }
        } catch (err) {
            console.warn('Failed to fetch users from API, using mock users:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const taskData: CreateTaskRequest = {
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                dueDate: dueDate || undefined,
                assignedTo: selectedAssignees.length > 0 ? selectedAssignees : undefined,
            };

            await createTask(taskData);

            // Reset form
            setTitle('');
            setDescription('');
            setPriority('MEDIUM');
            setDueDate('');
            setSelectedAssignees([]);

            onTaskCreated?.();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create task');
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

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('MEDIUM');
        setDueDate('');
        setSelectedAssignees([]);
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal isOpen= { isOpen } onClose = { handleClose } size = "lg" >
            <form onSubmit={ handleSubmit } className = "p-6 md:p-8" >
                {/* Header */ }
                < div className = "mb-6 pr-8" >
                    <h2 className="text-xl font-bold text-gray-900" > Create New Task </h2>
                        < p className = "text-sm text-gray-500 mt-1" >
                            Fill in the details to create a new task
                                </p>
                                </div>

    {/* Error Message */ }
    {
        error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" >
                { error }
                </div>
                )}

{/* Title */ }
<div className="mb-4" >
    <label htmlFor="title" className = "block text-sm font-medium text-gray-700 mb-1" >
        Title < span className = "text-red-500" >* </span>
            </label>
            < Input
id = "title"
type = "text"
value = { title }
onChange = {(e) => setTitle(e.target.value)}
placeholder = "Enter task title"
required
    />
    </div>

{/* Description */ }
<div className="mb-4" >
    <label htmlFor="description" className = "block text-sm font-medium text-gray-700 mb-1" >
        Description
        </label>
        < textarea
id = "description"
value = { description }
onChange = {(e) => setDescription(e.target.value)}
placeholder = "Enter task description..."
rows = { 3}
className = "w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-sm"
    />
    </div>

{/* Priority */ }
<div className="mb-4" >
    <label className="block text-sm font-medium text-gray-700 mb-2" >
        Priority
        </label>
        < div className = "flex gap-2" >
        {
            priorities.map((p) => (
                <button
                                key= { p.value }
                                type = "button"
                                onClick = {() => setPriority(p.value)}
className = {
    clsx(
                                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
        priority === p.value
    ? p.color
    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                )}
                            >
    { p.label }
    </button>
                        ))}
</div>
    </div>

{/* Due Date */ }
<div className="mb-4" >
    <label htmlFor="dueDate" className = "block text-sm font-medium text-gray-700 mb-1" >
        Due Date
            </label>
            < Input
id = "dueDate"
type = "date"
value = { dueDate }
onChange = {(e) => setDueDate(e.target.value)}
min = { new Date().toISOString().split('T')[0] }
    />
    </div>

{/* Assignees */ }
<div className="mb-6" >
    <label className="block text-sm font-medium text-gray-700 mb-2" >
        Assignees
        </label>
        < div className = "flex flex-wrap gap-2" >
        {
            users.map((user) => (
                <button
                                key= { user.id }
                                type = "button"
                                onClick = {() => toggleAssignee(user.id)}
className = {
    clsx(
                                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all',
        selectedAssignees.includes(user.id)
            ? 'bg-primary-100 text-primary-700 border border-primary-300'
            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                                )
}
    >
    <div className={
        clsx(
            'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
            selectedAssignees.includes(user.id)
                ? 'bg-primary-600 text-white'
                : 'bg-gray-300 text-gray-600'
        )
}>
    { user.name.charAt(0) }
    </div>
    < span > { user.name } </span>
{
    selectedAssignees.includes(user.id) && (
        <X size={ 14 } className = "ml-1" />
                                )
}
</button>
                        ))}
</div>
    </div>

{/* Actions */ }
<div className="flex justify-end gap-3 pt-4 border-t border-gray-100" >
    <Button
                        type="button"
variant = "outline"
onClick = { handleClose }
disabled = { isSubmitting }
    >
    Cancel
    </Button>
    < Button
type = "submit"
icon = { Plus }
disabled = { isSubmitting || !title.trim()}
                    >
    { isSubmitting? 'Creating...': 'Create Task' }
    </Button>
    </div>
    </form>
    </Modal>
    );
};
