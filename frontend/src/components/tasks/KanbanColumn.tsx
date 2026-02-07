/**
 * KanbanColumn Component
 * A column in the Kanban board containing task cards
 */
import React from 'react';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '@/types/api';
import clsx from 'clsx';

const DRAG_TYPE = 'application/x-task-id';

interface KanbanColumnProps {
    title: string;
    status: TaskStatus;
    tasks: Task[];
    count: number;
    onTaskClick?: (task: Task) => void;
    onTaskDrop?: (taskId: string, newStatus: TaskStatus) => void;
    headerColor?: string;
}

const columnColors: Record<TaskStatus, { bg: string; accent: string; dot: string }> = {
    OPEN: {
        bg: 'bg-gray-50',
        accent: 'border-gray-300',
        dot: 'bg-gray-400'
    },
    IN_PROGRESS: {
        bg: 'bg-blue-50/50',
        accent: 'border-blue-300',
        dot: 'bg-blue-500'
    },
    UNDER_REVIEW: {
        bg: 'bg-yellow-50/50',
        accent: 'border-yellow-300',
        dot: 'bg-yellow-500'
    },
    COMPLETED: {
        bg: 'bg-green-50/50',
        accent: 'border-green-300',
        dot: 'bg-green-500'
    },
    CLOSED: {
        bg: 'bg-purple-50/50',
        accent: 'border-purple-300',
        dot: 'bg-purple-500'
    },
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
    title,
    status,
    tasks,
    count,
    onTaskClick,
    onTaskDrop,
}) => {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const colors = columnColors[status];

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const raw = e.dataTransfer.getData(DRAG_TYPE);
        if (!raw || !onTaskDrop) return;
        try {
            const { taskId, status: fromStatus } = JSON.parse(raw) as { taskId: string; status: TaskStatus };
            if (fromStatus !== status) {
                onTaskDrop(taskId, status);
            }
        } catch {
            // ignore invalid data
        }
    };

    return (
        <div
            className={clsx(
                'flex flex-col rounded-xl border-t-2 min-w-[280px] max-w-[320px] flex-1 transition-colors',
                colors.bg,
                colors.accent,
                isDragOver && 'ring-2 ring-primary-400 ring-offset-2'
            )}
        >
            {/* Column Header */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={clsx('w-2.5 h-2.5 rounded-full', colors.dot)} />
                        <h3 className="font-semibold text-gray-900">{title}</h3>
                    </div>
                    <span className="text-sm text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                        {count}
                    </span>
                </div>
            </div>

            {/* Cards Container - drop zone */}
            <div
                className={clsx(
                    'flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] min-h-[120px] rounded-b-xl',
                    isDragOver && 'bg-primary-50/30'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
    {
        tasks.length === 0 ? (
            <div className= "flex items-center justify-center h-24 text-gray-400 text-sm" >
            No tasks
            </ div >
                ) : (
    tasks.map((task) => (
        <TaskCard
                            key= { task.id }
                            task = { task }
                            onClick = {() => onTaskClick?.(task)}
                        />
    ))
                )}
</div>
    </div>
    );
};
