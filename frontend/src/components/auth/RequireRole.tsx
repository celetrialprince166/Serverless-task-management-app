import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface RequireRoleProps {
    role: 'ADMIN' | 'MEMBER';
    children: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ role, children }) => {
    const { user } = useAuth();

    if (!user || user.role !== role) {
        return null;
    }

    return <>{ children } </>;
};
