import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    return (
        <div className= "min-h-screen bg-gray-50" >
        <Sidebar />
        < Header />
        <main className="ml-64 pt-16 min-h-screen" >
            <div className="p-8" >
                { children }
                </div>
                </main>
                </div>
  );
};
