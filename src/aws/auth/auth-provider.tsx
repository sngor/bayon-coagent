'use client';

/**
 * AWS Cognito Authentication Provider
 * 
 * This module provides a React context for managing authentication state
 * using AWS Cognito. It handles automatic token refresh and provides
 * authentication state to the entire application.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getCognitoClient, CognitoUser, AuthSession } from './cognito-client';

interface AuthContextValue {
    user: CognitoUser | null;
    session: AuthSession | null;
    isLoading: boolean;
    error: Error | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<{ userConfirmed: boolean }>;
    confirmSignUp: (email: string, code: string) => Promise<void>;
    resendConfirmationCode: (email: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
    children: React.ReactNode;
}

/**
 * Authentication Provider Component
 * 
 * Wraps the application and provides authentication state and methods
 * to all child components.
 */
export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<CognitoUser | null>(null);
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const cognitoClient = getCognitoClient();

    /**
     * Load the current session and user on mount
     */
    const loadSession = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const currentSession = await cognitoClient.getSession();

            if (currentSession) {
                setSession(currentSession);

                // Fetch user information
                try {
                    const currentUser = await cognitoClient.getCurrentUser(currentSession.accessToken);
                    setUser(currentUser);
                } catch (userError) {
                    console.error('Failed to fetch user:', userError);
                    // Session might be invalid, clear it
                    setSession(null);
                    setUser(null);
                }
            } else {
                setSession(null);
                setUser(null);
            }
        } catch (err) {
            console.error('Failed to load session:', err);
            setError(err instanceof Error ? err : new Error('Failed to load session'));
            setSession(null);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, [cognitoClient]);

    /**
     * Sign in with email and password
     */
    const signIn = useCallback(async (email: string, password: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const newSession = await cognitoClient.signIn(email, password);
            setSession(newSession);

            // Fetch user information
            const currentUser = await cognitoClient.getCurrentUser(newSession.accessToken);
            setUser(currentUser);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to sign in');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [cognitoClient]);

    /**
     * Sign up with email and password
     */
    const signUp = useCallback(async (email: string, password: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await cognitoClient.signUp(email, password);

            // Return whether user needs to confirm email
            return { userConfirmed: result.userConfirmed };
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to sign up');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [cognitoClient]);

    /**
     * Confirm sign up with verification code
     */
    const confirmSignUp = useCallback(async (email: string, code: string) => {
        try {
            setIsLoading(true);
            setError(null);

            await cognitoClient.confirmSignUp(email, code);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to confirm sign up');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [cognitoClient]);

    /**
     * Resend confirmation code
     */
    const resendConfirmationCode = useCallback(async (email: string) => {
        try {
            setIsLoading(true);
            setError(null);

            await cognitoClient.resendConfirmationCode(email);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to resend confirmation code');
            setError(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [cognitoClient]);

    /**
     * Sign out the current user
     */
    const signOut = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            if (session?.accessToken) {
                await cognitoClient.signOut(session.accessToken);
            }

            setSession(null);
            setUser(null);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to sign out');
            setError(error);
            // Even if sign out fails on the server, clear local state
            setSession(null);
            setUser(null);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [cognitoClient, session]);

    /**
     * Manually refresh the session
     */
    const refreshSession = useCallback(async () => {
        try {
            if (!session?.refreshToken) {
                throw new Error('No refresh token available');
            }

            const newSession = await cognitoClient.refreshSession(session.refreshToken);
            setSession(newSession);

            // Fetch updated user information
            const currentUser = await cognitoClient.getCurrentUser(newSession.accessToken);
            setUser(currentUser);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to refresh session');
            setError(error);
            // If refresh fails, clear the session
            setSession(null);
            setUser(null);
            throw error;
        }
    }, [cognitoClient, session]);

    /**
     * Set up automatic token refresh
     */
    useEffect(() => {
        if (!session) {
            return;
        }

        // Calculate when to refresh (5 minutes before expiration)
        const now = Date.now();
        const expiresIn = session.expiresAt - now;
        const refreshBuffer = 5 * 60 * 1000; // 5 minutes
        const refreshIn = Math.max(0, expiresIn - refreshBuffer);

        const timeoutId = setTimeout(() => {
            refreshSession().catch((err) => {
                console.error('Automatic token refresh failed:', err);
            });
        }, refreshIn);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [session, refreshSession]);

    /**
     * Load session on mount
     */
    useEffect(() => {
        loadSession();
    }, [loadSession]);

    const value: AuthContextValue = {
        user,
        session,
        isLoading,
        error,
        signIn,
        signUp,
        confirmSignUp,
        resendConfirmationCode,
        signOut,
        refreshSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access the authentication context
 */
export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}
