import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    signIn as amplifySignIn,
    signUp as amplifySignUp,
    signOut as amplifySignOut,
    confirmSignUp as amplifyConfirmSignUp,
    getCurrentUser as amplifyGetCurrentUser,
    fetchAuthSession,
    resendSignUpCode,
} from 'aws-amplify/auth';

// User type matching our API
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'MEMBER';
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<{ needsConfirmation: boolean }>;
    confirmSignup: (email: string, code: string) => Promise<void>;
    resendConfirmationCode: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to extract role from Cognito groups
function extractRoleFromSession(session: Awaited<ReturnType<typeof fetchAuthSession>>): 'ADMIN' | 'MEMBER' {
    try {
        const groups = session.tokens?.idToken?.payload?.['cognito:groups'];
        if (Array.isArray(groups)) {
            if (groups.includes('Admin') || groups.includes('ADMIN')) {
                return 'ADMIN';
            }
        }
        return 'MEMBER';
    } catch {
        return 'MEMBER';
    }
}

// Helper to extract user info from session
function extractUserFromSession(
    cognitoUser: Awaited<ReturnType<typeof amplifyGetCurrentUser>>,
    session: Awaited<ReturnType<typeof fetchAuthSession>>
): User {
    const payload = session.tokens?.idToken?.payload;
    return {
        id: cognitoUser.userId,
        email: payload?.email as string || cognitoUser.signInDetails?.loginId || '',
        name: payload?.name as string || payload?.email as string || '',
        role: extractRoleFromSession(session),
    };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check for existing session on mount
    useEffect(() => {
        checkAuthState();
    }, []);

    const checkAuthState = async () => {
        try {
            const cognitoUser = await amplifyGetCurrentUser();
            const session = await fetchAuthSession();

            if (session.tokens) {
                const extractedUser = extractUserFromSession(cognitoUser, session);
                setUser(extractedUser);
            }
        } catch {
            // No authenticated user
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await amplifySignIn({
                username: email,
                password,
            });

            if (result.isSignedIn) {
                const cognitoUser = await amplifyGetCurrentUser();
                const session = await fetchAuthSession();
                const extractedUser = extractUserFromSession(cognitoUser, session);
                setUser(extractedUser);
            } else if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
                throw new Error('Please verify your email before signing in.');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const signup = useCallback(async (email: string, password: string, name: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await amplifySignUp({
                username: email,
                password,
                options: {
                    userAttributes: {
                        email,
                        name,
                    },
                },
            });

            if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
                return { needsConfirmation: true };
            }

            return { needsConfirmation: false };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Signup failed';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const confirmSignup = useCallback(async (email: string, code: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await amplifyConfirmSignUp({
                username: email,
                confirmationCode: code,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Confirmation failed';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const resendConfirmationCode = useCallback(async (email: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await resendSignUpCode({ username: email });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to resend code';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await amplifySignOut();
            setUser(null);
        } catch (err) {
            console.error('Logout error:', err);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return (
        <AuthContext.Provider
            value= {{
        user,
            isAuthenticated: !!user,
                isLoading,
                error,
                login,
                signup,
                confirmSignup,
                resendConfirmationCode,
                logout,
                clearError,
            }
}
        >
    { children }
    </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
