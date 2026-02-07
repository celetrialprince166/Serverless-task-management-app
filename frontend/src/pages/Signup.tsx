import React, { useState, useEffect } from 'react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const { signup, isLoading, error, clearError } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [validationError, setValidationError] = useState<string | null>(null);
    const [passwordValidation, setPasswordValidation] = useState({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false,
    });

    // Clear errors when inputs change
    useEffect(() => {
        clearError();
        setValidationError(null);
    }, [formData, clearError]);

    // Validate password in real-time
    useEffect(() => {
        const { password } = formData;
        setPasswordValidation({
            minLength: password.length >= 12,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        });
    }, [formData.password]);

    const validateEmail = (email: string) => {
        const allowedDomains = ['@amalitech.com', '@amalitechtraining.org', '@gmail.com'];
        return allowedDomains.some(domain => email.toLowerCase().endsWith(domain));
    };

    const isPasswordValid = () => {
        return Object.values(passwordValidation).every(Boolean);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        // Validate email domain
        if (!validateEmail(formData.email)) {
            setValidationError('Only approved organizational emails (@amalitech.com, @amalitechtraining.org) are allowed.');
            return;
        }

        // Validate password match
        if (formData.password !== formData.confirmPassword) {
            setValidationError('Passwords do not match.');
            return;
        }

        // Validate password strength
        if (!isPasswordValid()) {
            setValidationError('Password does not meet all requirements.');
            return;
        }

        try {
            const result = await signup(formData.email, formData.password, formData.name);

            if (result.needsConfirmation) {
                // Redirect to confirmation page with email
                navigate('/confirm-signup', { state: { email: formData.email } });
            } else {
                // Direct to login
                navigate('/login');
            }
        } catch {
            // Error is handled by AuthContext
        }
    };

    const displayError = validationError || error;

    return (
        <AuthLayout 
            title= "Create an account"
    subtitle = "Join the team to manage tasks and projects"
        >
        <form className="space-y-5" onSubmit = { handleSubmit } >
            { displayError && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md flex items-start gap-2" >
                    <AlertCircle size={ 16 } className = "mt-0.5 shrink-0" />
                        <span>{ displayError } </span>
                        </div>
                )}

<Input
                    label="Full Name"
type = "text"
name = "name"
placeholder = "John Doe"
value = { formData.name }
onChange = { handleChange }
required
autoComplete = "name"
    />

    <Input
                    label="Work Email"
type = "email"
name = "email"
placeholder = "you@amalitech.com"
value = { formData.email }
onChange = { handleChange }
required
autoComplete = "email"
    />

    <div>
    <Input
                        label="Password"
type = "password"
name = "password"
placeholder = "Create a strong password"
value = { formData.password }
onChange = { handleChange }
required
autoComplete = "new-password"
    />

    {/* Password requirements */ }
{
    formData.password && (
        <div className="mt-2 space-y-1" >
            <p className="text-xs text-gray-500 mb-1" > Password requirements: </p>
                < div className = "grid grid-cols-2 gap-1 text-xs" >
                    <Requirement met={ passwordValidation.minLength }>
                        12 + characters
                        </Requirement>
                        < Requirement met = { passwordValidation.hasUppercase } >
                            Uppercase letter
                                </Requirement>
                                < Requirement met = { passwordValidation.hasLowercase } >
                                    Lowercase letter
                                        </Requirement>
                                        < Requirement met = { passwordValidation.hasNumber } >
                                            Number
                                            </Requirement>
                                            < Requirement met = { passwordValidation.hasSpecial } >
                                                Special character
                                                    </Requirement>
                                                    </div>
                                                    </div>
                    )
}
</div>

    < Input
label = "Confirm Password"
type = "password"
name = "confirmPassword"
placeholder = "Confirm your password"
value = { formData.confirmPassword }
onChange = { handleChange }
required
autoComplete = "new-password"
    />

    <Button
                    type="submit"
fullWidth
isLoading = { isLoading }
variant = "primary"
    >
    Create Account
        </Button>

        < div className = "flex items-center justify-center text-sm" >
            <span className="text-gray-500" > Already have an account ? </span>
                < Link to = "/login" className = "ml-1 font-medium text-primary-600 hover:text-primary-500" >
                    Sign in
                    </Link>
                    </div>
                    </form>

                    < div className = "mt-6 text-center text-xs text-gray-500" >
                        By creating an account, you agree to our Terms of Service and Privacy Policy.
            </div>
                            </AuthLayout>
    );
};

// Helper component for password requirements
const Requirement: React.FC<{ met: boolean; children: React.ReactNode }> = ({ met, children }) => (
    <div className= {`flex items-center gap-1 ${met ? 'text-green-600' : 'text-gray-400'}`}>
        <CheckCircle size={ 12 } className = { met? 'text-green-500': 'text-gray-300' } />
            <span>{ children } </span>
            </div>
);
