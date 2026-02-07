/**
 * Member Dashboard
 * Shows tasks assigned to the current logged-in member
 */
import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
    ListTodo,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    RefreshCw,
    Flag
} from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { TaskDetailsModal } from '@/components/tasks/TaskDetailsModal';
import { useAuth } from '@/context/AuthContext';
import { getTasks, updateTaskStatus } from '@/services/tasks';
import type { Task, TaskStatus } from '@/types/api';

// Priority colors
const priorityColors: Record<string, string> = {
    URGENT: 'text-red-500',
    HIGH: 'text-orange-500',
    MEDIUM: 'text-yellow-500',
    LOW: 'text-green-500',
};

export const MemberDashboard: React.FC = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch tasks assigned to current user (for members, API returns only their assigned tasks)
    const fetchMyTasks = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const allTasks = await getTasks();
            // Backend already filters by assignment for members; use list as-is so we don't hide tasks when assignee email is missing
            setTasks(allTasks);
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
            setError(err instanceof Error ? err.message : 'Failed to load tasks');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.email) {
            fetchMyTasks();
        }
    }, [user?.email]);

    const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
        try {
            const updatedTask = await updateTaskStatus(taskId, { status: newStatus });

            // Update local state and selected task
            setTasks(prevTasks => prevTasks.map(t =>
                t.id === taskId ? updatedTask : t
            ));

            if (selectedTask?.id === taskId) {
                setSelectedTask(updatedTask);
            }
        } catch (err) {
            console.error('Failed to update task status:', err);
        }
    };

    // Calculate stats from actual task data
    const stats = useMemo(() => {
        const statusCounts: Record<TaskStatus, number> = {
            OPEN: 0,
            IN_PROGRESS: 0,
            UNDER_REVIEW: 0,
            COMPLETED: 0,
            CLOSED: 0,
        };

        tasks.forEach(task => {
            statusCounts[task.status]++;
        });

        return {
            toDo: statusCounts.OPEN,
            inProgress: statusCounts.IN_PROGRESS,
            completed: statusCounts.COMPLETED + statusCounts.CLOSED,
        };
    }, [tasks]);

    // Format date for display
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (isLoading) {
        return (
            <DashboardLayout>
            <div className= "flex items-center justify-center h-64" >
            <div className="flex items-center gap-3 text-gray-500" >
                <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading your tasks...</span>
                        </div>
                        </div>
                        </DashboardLayout>
        );
    }

return (
    <DashboardLayout>
    <TaskDetailsModal
                isOpen= {!!selectedTask}
onClose = {() => setSelectedTask(null)}
task = { selectedTask }
onStatusChange = { handleStatusChange }
    />

    {/* Header */ }
    < div className = "mb-8 flex items-start justify-between" >
        <div>
        <h1 className="text-2xl font-bold text-gray-900" >
            My Dashboard
                </h1>
                < p className = "text-gray-500 mt-1" >
                    Here's an overview of your assigned tasks.
                        </p>
                        </div>
                        < button
onClick = { fetchMyTasks }
className = "flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
title = "Refresh data"
    >
    <RefreshCw size={ 16 } />
Refresh
    </button>
    </div>

{/* Error Message */ }
{
    error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700" >
            <p className="font-medium" > Failed to load tasks </p>
                < p className = "text-sm mt-1" > { error } </p>
                    < button
    onClick = { fetchMyTasks }
    className = "mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
        >
        Try again
            </button>
            </div>
            )
}

{/* Stats Grid */ }
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" >
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100" >
        <div className="flex items-center gap-4" >
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg" >
                <ListTodo size={ 24 } />
                    </div>
                    < div >
                    <p className="text-sm font-medium text-gray-500" > To Do </p>
                        < h3 className = "text-2xl font-bold text-gray-900" > { stats.toDo } </h3>
                            </div>
                            </div>
                            </div>
                            < div className = "bg-white p-6 rounded-xl shadow-sm border border-gray-100" >
                                <div className="flex items-center gap-4" >
                                    <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg" >
                                        <Clock size={ 24 } />
                                            </div>
                                            < div >
                                            <p className="text-sm font-medium text-gray-500" > In Progress </p>
                                                < h3 className = "text-2xl font-bold text-gray-900" > { stats.inProgress } </h3>
                                                    </div>
                                                    </div>
                                                    </div>
                                                    < div className = "bg-white p-6 rounded-xl shadow-sm border border-gray-100" >
                                                        <div className="flex items-center gap-4" >
                                                            <div className="p-3 bg-green-50 text-green-600 rounded-lg" >
                                                                <CheckCircle2 size={ 24 } />
                                                                    </div>
                                                                    < div >
                                                                    <p className="text-sm font-medium text-gray-500" > Completed </p>
                                                                        < h3 className = "text-2xl font-bold text-gray-900" > { stats.completed } </h3>
                                                                            </div>
                                                                            </div>
                                                                            </div>
                                                                            </div>

{/* My Tasks List */ }
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" >
    <h2 className="text-lg font-bold text-gray-900 mb-4" > My Tasks </h2>

{
    tasks.length === 0 ? (
        <div className= "text-center py-12 text-gray-500" >
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium" > No tasks assigned to you </p>
                < p className = "text-sm mt-1" > Tasks will appear here when assigned by an admin </p>
                    </div>
                ) : (
        <div className= "space-y-3" >
        {
            tasks.map((task) => (
                <div
                                key= { task.id }
                                onClick = {() => setSelectedTask(task)}
    className = "flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-primary-200 hover:shadow-sm transition-all group cursor-pointer"
        >
        <div className="flex items-center gap-4" >
            <StatusBadge status={ task.status } />
                < span className = "font-medium text-gray-900 group-hover:text-primary-600 transition-colors" >
                    { task.title }
                    </span>
                    </div>
                    < div className = "flex items-center gap-4 text-gray-400 text-sm" >
                    {
                        task.dueDate && (
                            <span>{ formatDate(task.dueDate) } </span>
                        )
                    }
                        < Flag size = { 16} className = { priorityColors[task.priority] || 'text-gray-400' } />
                            </div>
                            </div>
                        ))
}
</div>
                )}
</div>
    </DashboardLayout>
    );
};
