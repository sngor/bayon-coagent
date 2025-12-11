import { useCallback } from 'react';

/**
 * Custom hook for retrieving authentication token from localStorage
 * Provides a consistent way to access Cognito session tokens across the app
 */
export function useAuthToken() {
    const getAuthToken = useCallback((): string | undefined => {
        try {
            const sessionStr = localStorage.getItem('cognito_session');
            if (sessionStr) {
                const session = JSON.parse(sessionStr);
                return session.accessToken;
            }
            return undefined;
        } catch (error) {
            console.error('Failed to parse cognito session:', error);
            return undefined;
        }
    }, []);

    return { getAuthToken };
}