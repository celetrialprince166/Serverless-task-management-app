/**
 * TaskCard Component
 * Displays a task card for use in Kanban board columns
 */
import React from 'react';
import { Calendar, Flag } from 'lucide-react';
import type { Task, Priority } from '@/types/api';
import clsx from 'clsx';

interface TaskCardProps {
    task: Task;
    onClick?: () => void;
}

const priorityConfig: Record<Priority, { className: string; label: string }> = {
    LOW: {
        className: 'text-green-600 bg-green-50 border-green-100',
        label: 'Low'
    },
    MEDIUM: {
        className: 'text-yellow-600 bg-yellow-50 border-yellow-100',
        label: 'Medium'
    },
    HIGH: {
        className: 'text-orange-600 bg-orange-50 border-orange-100',
        label: 'High'
    },
    URGENT: {
        className: 'text-red-600 bg-red-50 border-red-100',
        label: 'Urgent'
    },
};

function formatDate(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const DRAG_TYPE = 'application/x-task-id';

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const priorityStyle = priorityConfig[task.priority];
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' && task.status !== 'CLOSED';

    const handleDragStart = (e: React.DragEvent) => {
        setIsDragging(true);
        e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ taskId: task.id, status: task.status }));
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', task.title);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const handleClick = () => {
        if (!isDragging) onClick?.();
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
            className={clsx(
                'bg-white rounded-lg border border-gray-200 p-4 shadow-sm',
                'hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-grab active:cursor-grabbing',
                isDragging && 'opacity-50 shadow-lg',
                'group'
            )}
        >
        {/* Header: Title + Priority */ }
        < div className = "flex items-start justify-between gap-2 mb-3" >
            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors" >
                { task.title }
                </h4>
                < div className = {
                    clsx(
                    'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border shrink-0',
                        priorityStyle.className
                )}>
    <Flag size={ 10 } fill = "currentColor" />
        <span className="hidden sm:inline" > { priorityStyle.label } </span>
            </div>
            </div>

{/* Description preview */ }
{
    task.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3" >
            { task.description }
            </p>
            )
}

{/* Assignees */ }
{
    task.assignedTo && task.assignedTo.length > 0 && (
        <div className="flex items-center gap-1 mb-3" >
            <div className="flex -space-x-1.5" >
            {
                task.assignedTo.slice(0, 3).map((assignee, index) => (
                    <div
                                key={assignee.id || index}
                                className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white"
                                title={assignee.name || assignee.email}
                    >
                        {(assignee.name || assignee.email || '?').charAt(0).toUpperCase()}
                    </div>
                ))
            }
    {
        task.assignedTo.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-bold border-2 border-white" >
                +{ task.assignedTo.length - 3 }
                </div>
                        )
    }
    </div>
        <span className="text-xs text-gray-500 ml-1">
            {task.assignedTo.length === 1
                ? (task.assignedTo[0].name || task.assignedTo[0].email || 'Assignee').split(' ')[0]
                : `${task.assignedTo.length} assignees`}
            </span>
            </div>
            )
}

{/* Footer: Due Date */ }
{
    task.dueDate && (
        <div className={
            clsx(
                'flex items-center gap-1.5 text-xs',
                isOverdue ? 'text-red-600' : 'text-gray-500'
            )
    }>
        <Calendar size={ 12 } />
            < span > { formatDate(task.dueDate) } </span>
    { isOverdue && <span className="font-medium" > (Overdue) </span> }
    </div>
            )
}
</div>
    );
};
