import React from 'react';
import clsx from 'clsx';
import type { TaskStatus } from '@/types/api';

interface StatusBadgeProps {
    status: TaskStatus;
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
    OPEN: {
        label: 'Open',
        className: 'bg-gray-100 text-gray-700 border-gray-200'
    },
    IN_PROGRESS: {
        label: 'In Progress',
        className: 'bg-blue-50 text-blue-700 border-blue-100'
    },
    UNDER_REVIEW: {
        label: 'Under Review',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-100'
    },
    COMPLETED: {
        label: 'Completed',
        className: 'bg-green-50 text-green-700 border-green-100'
    },
    CLOSED: {
        label: 'Closed',
        className: 'bg-purple-50 text-purple-700 border-purple-100'
    },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const config = statusConfig[status] || statusConfig.OPEN;

    return (
        <span className= {
            clsx(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                config.className
        )}>
    { config.label }
    </span>
    );
};
