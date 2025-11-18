'use client';

/**
 * Cognito User Hook
 * 
 * This hook provides access to the current authenticated user's state.
 * It maintains compatibility with the Firebase useUser hook interface
 * to minimize changes required in existing components.
 */

import { useAuth } from './auth-provider';
import { CognitoUser } from './cognito-client';

/**
 * Interface for the return value of the useUser hook.
 * This matches the Firebase useUser interface for compatibility.
 */
export interface UserAuthState {
    user: CognitoUser | null;
    isUserLoading: boolean;
    userError: Error | null;
}

/**
 * Hook for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * 
 * @returns {UserAuthState} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserAuthState => {
    const { user, isLoading, error } = useAuth();

    return {
        user,
        isUserLoading: isLoading,
        userError: error,
    };
};

/**
 * Hook for accessing authentication methods.
 * Provides sign in, sign up, sign out, and email verification functionality.
 */
export const useAuthMethods = () => {
    const { signIn, signUp, confirmSignUp, resendConfirmationCode, signOut, refreshSession } = useAuth();

    return {
        signIn,
        signUp,
        confirmSignUp,
        resendConfirmationCode,
        signOut,
        refreshSession,
    };
};

/**
 * Hook for accessing the current session.
 * Provides access to tokens for making authenticated API calls.
 */
export const useSession = () => {
    const { session } = useAuth();

    return session;
};
