import React, { useState, useEffect } from 'react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Mail, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ConfirmSignupPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { confirmSignup, resendConfirmationCode, isLoading, error, clearError } = useAuth();

    // Get email from navigation state
    const email = (location.state as { email?: string })?.email || '';

    const [code, setCode] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    // Redirect if no email provided
    useEffect(() => {
        if (!email) {
            navigate('/signup');
        }
    }, [email, navigate]);

    // Clear error when code changes
    useEffect(() => {
        clearError();
        setResendSuccess(false);
    }, [code, clearError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await confirmSignup(email, code);
            setIsConfirmed(true);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch {
            // Error is handled by AuthContext
        }
    };

    const handleResendCode = async () => {
        setResendLoading(true);
        setResendSuccess(false);

        try {
            await resendConfirmationCode(email);
            setResendSuccess(true);
        } catch {
            // Error is handled by AuthContext
        } finally {
            setResendLoading(false);
        }
    };

    if (isConfirmed) {
        return (
            <AuthLayout
                title= "Email Verified!"
        subtitle = "Your account has been confirmed successfully"
            >
            <div className="text-center py-8" >
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4" >
                    <CheckCircle2 size={ 32 } className = "text-green-600" />
                        </div>
                        < p className = "text-gray-600 mb-4" >
                            Redirecting you to login...
        </p>
            < Link
        to = "/login"
        className = "text-primary-600 hover:text-primary-500 font-medium"
            >
            Click here if not redirected
                </Link>
                </div>
                </AuthLayout>
        );
    }

return (
    <AuthLayout
            title= "Verify your email"
subtitle = "We've sent a verification code to your email"
    >
    <div className="mb-6" >
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg" >
            <Mail className="text-blue-600 shrink-0" size = { 24} />
                <div>
                <p className="text-sm text-blue-900" >
                    Check your inbox at:
</p>
    < p className = "font-medium text-blue-700" > { email } </p>
        </div>
        </div>
        </div>

        < form className = "space-y-6" onSubmit = { handleSubmit } >
            { error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md flex items-start gap-2" >
                    <AlertCircle size={ 16 } className = "mt-0.5 shrink-0" />
                        <span>{ error } </span>
                        </div>
                )}

{
    resendSuccess && (
        <div className="bg-green-50 text-green-600 text-sm p-3 rounded-md flex items-start gap-2" >
            <CheckCircle2 size={ 16 } className = "mt-0.5 shrink-0" />
                <span>Verification code sent! Check your email.</span>
                    </div>
                )
}

<Input
                    label="Verification Code"
type = "text"
placeholder = "Enter 6-digit code"
value = { code }
onChange = {(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
required
autoComplete = "one-time-code"
className = "text-center text-2xl tracking-widest"
    />

    <Button
                    type="submit"
fullWidth
isLoading = { isLoading }
variant = "primary"
disabled = { code.length !== 6 }
    >
    Verify Email
        </Button>

        < div className = "text-center" >
            <button
                        type="button"
onClick = { handleResendCode }
disabled = { resendLoading }
className = "inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 disabled:opacity-50"
    >
    <RefreshCw size={ 14 } className = { resendLoading? 'animate-spin': '' } />
        { resendLoading? 'Sending...': 'Resend verification code' }
        </button>
        </div>

        < div className = "flex items-center justify-center text-sm pt-4 border-t border-gray-100" >
            <span className="text-gray-500" > Wrong email ? </span>
                < Link to = "/signup" className = "ml-1 font-medium text-primary-600 hover:text-primary-500" >
                    Go back
                        </Link>
                        </div>
                        </form>
                        </AuthLayout>
    );
};
