import React, { useState, useEffect } from 'react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Get the redirect destination from location state
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    // Clear error when component mounts or inputs change
    useEffect(() => {
        clearError();
    }, [email, password, clearError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await login(email, password);
            navigate(from, { replace: true });
        } catch {
            // Error is handled by AuthContext
        }
    };

    return (
        <AuthLayout
            title= "Welcome back"
    subtitle = "Sign in to your account to continue"
        >
        <form className="space-y-6" onSubmit = { handleSubmit } >
            { error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md flex items-start gap-2" >
                    <AlertCircle size={ 16 } className = "mt-0.5 shrink-0" />
                        <span>{ error } </span>
                        </div>
                )}

<Input
                    label="Email"
type = "email"
placeholder = "you@amalitech.com"
value = { email }
onChange = {(e) => setEmail(e.target.value)}
required
autoComplete = "email"
    />

    <Input
                    label="Password"
type = "password"
placeholder = "Enter your password"
value = { password }
onChange = {(e) => setPassword(e.target.value)}
required
autoComplete = "current-password"
    />

    <Button
                    type="submit"
fullWidth
isLoading = { isLoading }
variant = "primary"
className = "bg-primary-500 hover:bg-primary-600 focus:ring-primary-500"
    >
    Sign in
    </Button>

    < div className = "flex items-center justify-center text-sm" >
        <span className="text-gray-500" > Don't have an account?</span>
            < Link to = "/signup" className = "ml-1 font-medium text-primary-600 hover:text-primary-500" >
                Sign up
                    </Link>
                    </div>
                    </form>

{/* Demo Credentials Box */ }
<div className="mt-8 bg-gray-50 rounded-md p-4 border border-gray-100" >
    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2" >
        Test Credentials:
</h4>
    < div className = "space-y-1 text-xs text-gray-600 font-mono" >
        <p>Admin: testadmin @amalitech.com</p>
            < p > Password: TestAdmin123! </p>
                </div>
                </div>
                </AuthLayout>
    );
};
