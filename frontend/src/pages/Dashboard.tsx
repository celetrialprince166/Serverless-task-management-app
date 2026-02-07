/**
 * Dashboard Page
 * Admin and Member dashboard views with live API data
 */
import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
    ListTodo,
    Clock,
    AlertCircle,
    CheckCircle2,
    MoreVertical,
    Flag,
    Loader2,
    RefreshCw,
    Plus
} from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import { TaskDetailsModal } from '@/components/tasks/TaskDetailsModal';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { EditTaskModal } from '@/components/tasks/EditTaskModal';
import { useAuth } from '@/context/AuthContext';
import { MemberDashboard } from './MemberDashboard';
import { getTasks, updateTaskStatus } from '@/services/tasks';
import type { Task, TaskStatus } from '@/types/api';

// Priority colors for display
const priorityColors: Record<string, string> = {
    URGENT: 'text-red-500',
    HIGH: 'text-orange-500',
    MEDIUM: 'text-yellow-500',
    LOW: 'text-green-500',
};

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch tasks from API
    const fetchTasks = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedTasks = await getTasks();
            setTasks(fetchedTasks);
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
            setError(err instanceof Error ? err.message : 'Failed to load tasks');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

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
            // Could add toast notification here
        }
    };

    const handleTaskCreated = () => {
        fetchTasks();
    };

    const handleEditTask = () => {
        setIsEditModalOpen(true);
    };

    const handleTaskUpdated = () => {
        fetchTasks();
        setIsEditModalOpen(false);
        setSelectedTask(null);
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

        return [
            { label: 'Total Tasks', value: tasks.length, icon: ListTodo, color: 'bg-orange-50 text-orange-600' },
            { label: 'In Progress', value: statusCounts.IN_PROGRESS, icon: Clock, color: 'bg-blue-50 text-blue-600' },
            { label: 'In Review', value: statusCounts.UNDER_REVIEW, icon: AlertCircle, color: 'bg-yellow-50 text-yellow-600' },
            { label: 'Completed', value: statusCounts.COMPLETED, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
        ];
    }, [tasks]);

    // Get recent 5 tasks sorted by creation date
    const recentTasks = useMemo(() => {
        return [...tasks]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
    }, [tasks]);

    // Calculate task distribution and completion rate
    const distribution = useMemo(() => {
        const statusCounts: Record<string, { label: string; count: number; color: string }> = {
            OPEN: { label: 'Open', count: 0, color: 'bg-gray-500' },
            IN_PROGRESS: { label: 'In Progress', count: 0, color: 'bg-blue-500' },
            UNDER_REVIEW: { label: 'In Review', count: 0, color: 'bg-yellow-500' },
            COMPLETED: { label: 'Completed', count: 0, color: 'bg-green-500' },
            CLOSED: { label: 'Closed', count: 0, color: 'bg-purple-500' },
        };

        tasks.forEach(task => {
            if (statusCounts[task.status]) {
                statusCounts[task.status].count++;
            }
        });

        const completedCount = statusCounts.COMPLETED.count + statusCounts.CLOSED.count;
        const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

        return {
            items: Object.values(statusCounts).filter(item => item.count > 0 || item.label !== 'Closed'),
            completionRate,
        };
    }, [tasks]);

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (isLoading) {
        return (
            <DashboardLayout>
            <div className= "flex items-center justify-center h-64" >
            <div className="flex items-center gap-3 text-gray-500" >
                <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading dashboard...</span>
                        </div>
                        </div>
                        </DashboardLayout>
        );
    }

return (
    <DashboardLayout>
    <TaskDetailsModal
                isOpen={!!selectedTask && !isEditModalOpen}
                onClose={() => { setSelectedTask(null); setIsEditModalOpen(false); }}
                task={selectedTask}
                onEdit={handleEditTask}
                onStatusChange={handleStatusChange}
            />

            <EditTaskModal
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setSelectedTask(null); }}
                task={selectedTask}
                onTaskUpdated={handleTaskUpdated}
            />

    <CreateTaskModal 
                isOpen={ isCreateModalOpen }
onClose = {() => setIsCreateModalOpen(false)}
onTaskCreated = { handleTaskCreated }
    />

    {/* Welcome Section */ }
    < div className = "mb-8 flex items-start justify-between" >
        <div>
        <h1 className="text-2xl font-bold text-gray-900" >
            Welcome back, {user?.name || user?.email?.split('@')[0] || (user?.role === 'ADMIN' ? 'Admin' : 'User')}! 👋
</h1>
    < p className = "text-gray-500 mt-1" > Here's an overview of all tasks and team activity.</p>
        </div>
        < div className = "flex gap-3" >
            <button 
                        onClick={ () => setIsCreateModalOpen(true) }
className = "flex items-center gap-2 px-3 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
    >
    <Plus size={ 16 } />
                        Create Task
    </button>
    < button
onClick = { fetchTasks }
className = "flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
title = "Refresh data"
    >
    <RefreshCw size={ 16 } />
Refresh
    </button>
    </div>
    </div>

{/* Error Message */ }
{
    error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700" >
            <p className="font-medium" > Failed to load tasks </p>
                < p className = "text-sm mt-1" > { error } </p>
                    < button
    onClick = { fetchTasks }
    className = "mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
        >
        Try again
            </button>
            </div>
            )
}

{/* Stats Grid */ }
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" >
{
    stats.map((stat) => (
        <div key= { stat.label } className = "bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between" >
        <div>
        <p className="text-sm font-medium text-gray-500 mb-1" > { stat.label } </p>
    < h3 className = "text-3xl font-bold text-gray-900" > { stat.value } </h3>
    </div>
    < div className = {`p-3 rounded-lg ${stat.color}`} >
    <stat.icon size={ 20 } />
        </div>
        </div>
                ))}
</div>

    < div className = "grid grid-cols-1 lg:grid-cols-3 gap-8" >
        {/* Recent Tasks */ }
        < div className = "lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6" >
            <div className="flex items-center justify-between mb-6" >
                <div>
                <h2 className="text-lg font-bold text-gray-900" > Recent Tasks </h2>
                    < p className = "text-sm text-gray-500" > Latest tasks across all team members </p>
                        </div>
                        < button className = "text-gray-400 hover:text-gray-600" >
                            <MoreVertical size={ 20 } />
                                </button>
                                </div>

{
    recentTasks.length === 0 ? (
        <div className= "text-center py-8 text-gray-500" >
        <ListTodo className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No tasks yet </p>
                < p className = "text-sm mt-1" > Tasks will appear here once created </p>
                    </div>
                    ) : (
        <div className= "space-y-4" >
        {
            recentTasks.map((task) => (
                <div
                                    key= { task.id }
                                    onClick = {() => setSelectedTask(task)}
    className = "flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:border-primary-200 hover:shadow-sm transition-all group cursor-pointer"
        >
        <div className="flex items-center gap-4" >
            <StatusBadge status={ task.status } />
                < span className = "font-medium text-gray-900 group-hover:text-primary-600 transition-colors" >
                    { task.title }
                    </span>
                    </div>
                    < div className = "flex items-center gap-4 text-gray-400 text-sm" >
                        <span>{ task.dueDate ? formatDate(task.dueDate) : formatDate(task.createdAt) } </span>
                        < Flag size = { 16} className = { priorityColors[task.priority] || 'text-gray-400' } />
                            </div>
                            </div>
                            ))
}
</div>
                    )}
</div>

{/* Task Distribution */ }
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" >
    <h2 className="text-lg font-bold text-gray-900 mb-1" > Task Distribution </h2>
        < p className = "text-sm text-gray-500 mb-6" > Tasks by status </p>

            < div className = "space-y-6" >
                {
                    distribution.items.map((item) => (
                        <div key= { item.label } className = "flex items-center justify-between group" >
                        <div className="flex items-center gap-3" >
                    <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-sm font-medium text-gray-700" > { item.label } </span>
                    </div>
                    < span className = "text-xs font-semibold px-2 py-1 rounded-full bg-gray-50 text-gray-600" >
                        { item.count }
                        </span>
                        </div>
                        ))}
</div>

    < div className = "mt-8 pt-6 border-t border-gray-100" >
        <div className="flex justify-between text-sm mb-2" >
            <span className="text-gray-500" > Completion Rate </span>
                < span className = "font-bold text-gray-900" > { distribution.completionRate } % </span>
                    </div>
                    < div className = "h-2 w-full bg-gray-100 rounded-full overflow-hidden" >
                        <div 
                                className="h-full bg-green-500 rounded-full transition-all duration-500"
style = {{ width: `${distribution.completionRate}%` }}
                            />
    </div>
    </div>
    </div>
    </div>
    </DashboardLayout>
    );
};

export const Dashboard: React.FC = () => {
    const { user } = useAuth();

    if (user?.role === 'MEMBER') {
        return <MemberDashboard />;
    }

    return <AdminDashboard />;
};
