/**
 * Tasks Page
 * Kanban board view with task columns and filtering
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KanbanColumn } from '@/components/tasks/KanbanColumn';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { TaskDetailsModal } from '@/components/tasks/TaskDetailsModal';
import { EditTaskModal } from '@/components/tasks/EditTaskModal';
import { RequireRole } from '@/components/auth/RequireRole';
import { Button } from '@/components/common/Button';
import { Plus, User, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getTasks, deleteTask, updateTaskStatus } from '@/services/tasks';
import type { Task, TaskStatus } from '@/types/api';
import clsx from 'clsx';

const columns: { status: TaskStatus; title: string }[] = [
    { status: 'OPEN', title: 'Open' },
    { status: 'IN_PROGRESS', title: 'In Progress' },
    { status: 'UNDER_REVIEW', title: 'Under Review' },
    { status: 'COMPLETED', title: 'Completed' },
    { status: 'CLOSED', title: 'Closed' },
];

type FilterType = 'all' | 'my-tasks';

export const TasksPage: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterType>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Fetch tasks from API
    const fetchTasks = useCallback(async () => {
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
    }, []);

    // Load tasks on mount
    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Open create modal when navigated from sidebar "New Task" (admin)
    useEffect(() => {
        const state = location.state as { openCreateModal?: boolean } | null;
        if (state?.openCreateModal && user?.role === 'ADMIN') {
            setIsCreateModalOpen(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, location.pathname, navigate, user?.role]);

    // Filter tasks based on selection
    const filteredTasks = useMemo(() => {
        if (filter === 'my-tasks' && user) {
            return tasks.filter(task =>
                task.assignedTo?.some(assignee =>
                    assignee.email === user.email || assignee.id === user.id
                )
            );
        }
        return tasks;
    }, [tasks, filter, user]);

    // Group tasks by status
    const tasksByStatus = useMemo(() => {
        const grouped: Record<TaskStatus, Task[]> = {
            OPEN: [],
            IN_PROGRESS: [],
            UNDER_REVIEW: [],
            COMPLETED: [],
            CLOSED: [],
        };

        filteredTasks.forEach(task => {
            if (grouped[task.status]) {
                grouped[task.status].push(task);
            }
        });

        return grouped;
    }, [filteredTasks]);

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setIsDetailsModalOpen(true);
    };

    const handleTaskCreated = () => {
        fetchTasks();
    };

    const handleTaskUpdated = () => {
        fetchTasks();
    };

    const handleEditTask = (task: Task) => {
        setSelectedTask(task);
        setIsDetailsModalOpen(false);
        setIsEditModalOpen(true);
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            await deleteTask(taskId);
            setIsDetailsModalOpen(false);
            setSelectedTask(null);
            fetchTasks();
        } catch (err) {
            console.error('Failed to delete task:', err);
            alert(err instanceof Error ? err.message : 'Failed to delete task');
        }
    };

    const handleStatusChange = async (taskId: string, status: TaskStatus) => {
        try {
            await updateTaskStatus(taskId, { status });
            fetchTasks();
        } catch (err) {
            console.error('Failed to update task status:', err);
            alert(err instanceof Error ? err.message : 'Failed to update status');
        }
    };

    const handleTaskDrop = async (taskId: string, newStatus: TaskStatus) => {
        try {
            const updatedTask = await updateTaskStatus(taskId, { status: newStatus });
            setTasks(prev => prev.map(t => (t.id === taskId ? updatedTask : t)));
        } catch (err) {
            console.error('Failed to update task status:', err);
            alert(err instanceof Error ? err.message : 'Failed to update status');
        }
    };

    return (
        <DashboardLayout>
            {/* Page Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">All Tasks</h1>
                    <p className="text-gray-500 mt-1">
                        Manage and track all project tasks across your team.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {/* Refresh Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        icon={RefreshCw}
                        onClick={fetchTasks}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'Refresh'}
                    </Button>

                    {/* Filter Tabs */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setFilter('all')}
                            className={clsx(
                                'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                                filter === 'all'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            )}
                        >
                            All Tasks
                        </button>
                        <button
                            onClick={() => setFilter('my-tasks')}
                            className={clsx(
                                'px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5',
                                filter === 'my-tasks'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            )}
                        >
                            <User size={14} />
                            My Tasks
                        </button>
                    </div>

                    {/* Create Task Button (Admin Only) */}
                    <RequireRole role="ADMIN">
                        <Button
                            icon={Plus}
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            Create Task
                        </Button>
                    </RequireRole>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                    <button 
                        onClick={fetchTasks}
                        className="ml-2 underline hover:no-underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Loading State */}
            {isLoading && tasks.length === 0 && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                        <p className="text-gray-500">Loading tasks...</p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && tasks.length === 0 && !error && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <p className="text-gray-500 mb-4">No tasks found</p>
                        <RequireRole role="ADMIN">
                            <Button
                                icon={Plus}
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                Create Your First Task
                            </Button>
                        </RequireRole>
                    </div>
                </div>
            )}

            {/* Kanban Board */}
            {tasks.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
                    {columns.map(column => (
                        <KanbanColumn
                            key={column.status}
                            title={column.title}
                            status={column.status}
                            tasks={tasksByStatus[column.status]}
                            count={tasksByStatus[column.status].length}
                            onTaskClick={handleTaskClick}
                            onTaskDrop={handleTaskDrop}
                        />
                    ))}
                </div>
            )}

            {/* Task Stats Summary */}
            {tasks.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">Total:</span>
                            <span className="font-semibold text-gray-900">{filteredTasks.length} tasks</span>
                        </div>
                        <div className="w-px h-4 bg-gray-300" />
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-gray-600">In Progress: {tasksByStatus.IN_PROGRESS.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <span className="text-gray-600">Under Review: {tasksByStatus.UNDER_REVIEW.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-gray-600">Completed: {tasksByStatus.COMPLETED.length}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onTaskCreated={handleTaskCreated}
            />

            {/* Task Details Modal */}
            <TaskDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedTask(null);
                }}
                task={selectedTask}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
            />

            {/* Edit Task Modal */}
            <EditTaskModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedTask(null);
                }}
                task={selectedTask}
                onTaskUpdated={handleTaskUpdated}
            />
        </DashboardLayout>
    );
};
