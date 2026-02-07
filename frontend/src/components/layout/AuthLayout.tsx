import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className= "min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8" >
        <div className="sm:mx-auto sm:w-full sm:max-w-md" >
            {/* Back link */ }
            < div className = "mb-8" >
                <Link to="/" className = "flex items-center text-sm text-gray-500 hover:text-gray-700" >
             ← Back to home
    </Link>
    </div>

    < div className = "bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100" >
        <div className="flex flex-col items-center justify-center mb-6" >
            <div className="flex items-center gap-2 text-primary-600 mb-2" >
                <LayoutDashboard size={ 24 } />
                    < span className = "text-xl font-bold text-gray-900" > TaskFlow </span>
                        </div>
                        < h2 className = "mt-2 text-center text-2xl font-bold tracking-tight text-gray-900" >
                            { title }
                            </h2>
{
    subtitle && (
        <p className="mt-1 text-center text-sm text-gray-600" >
            { subtitle }
            </p>
            )
}
</div>

{ children }
</div>
    </div>
    </div>
  );
};
