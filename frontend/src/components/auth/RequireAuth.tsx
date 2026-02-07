import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center" > Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state = {{ from: location }
    } replace />;
}

return <>{ children } </>;
};
