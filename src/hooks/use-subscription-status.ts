/**
 * Subscription Status Hook
 * 
 * React hook for managing subscription status with error handling and loading states
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/aws/auth';
import { useToast } from '@/hooks/use-toast';
import { withTimeout } from '@/lib/utils/timeout';
import { SubscriptionPlan } from '@/lib/constants/stripe-config';
import { SUBSCRIPTION_CONSTANTS } from '@/lib/constants/subscription-constants';

const LOADING_TIMEOUT = SUBSCRIPTION_CONSTANTS.LOADING_TIMEOUT;

interface SubscriptionStatus {
    isActive: boolean;
    plan: SubscriptionPlan | null;
    status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    customerId: string | null;
    subscriptionId: string | null;
    trialEndsAt: Date | null;
    isInTrial: boolean;
    trialDaysRemaining: number;
}

type ErrorType = 'network' | 'timeout' | 'auth' | 'server' | null;

interface UseSubscriptionStatusReturn {
    subscriptionStatus: SubscriptionStatus;
    isLoading: boolean;
    error: string | null;
    errorType: ErrorType;
    refetch: () => Promise<void>;
}

const initialStatus: SubscriptionStatus = {
    isActive: false,
    plan: null,
    status: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    customerId: null,
    subscriptionId: null,
    trialEndsAt: null,
    isInTrial: false,
    trialDaysRemaining: 0,
};

export function useSubscriptionStatus(): UseSubscriptionStatusReturn {
    const { user } = useUser();
    const { toast } = useToast();
    
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(initialStatus);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [errorType, setErrorType] = useState<'network' | 'timeout' | 'auth' | 'server' | null>(null);

    const handleError = useCallback((error: unknown, showToast = true) => {
        let errorMessage = 'Failed to load subscription status';
        let type: 'network' | 'timeout' | 'auth' | 'server' = 'server';
        
        if (error instanceof Error) {
            errorMessage = error.message;
            
            // Categorize error types
            if (error.message.includes('timeout') || error.message.includes('took too long')) {
                type = 'timeout';
            } else if (error.message.includes('not authenticated') || error.message.includes('unauthorized')) {
                type = 'auth';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                type = 'network';
            }
        }
        
        console.error('Subscription status error:', error);
        setError(errorMessage);
        setErrorType(type);
        
        if (showToast && type !== 'auth') {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: errorMessage,
            });
        }
    }, [toast]);

    const loadSubscriptionStatus = useCallback(async () => {
        if (!user) {
            setSubscriptionStatus(initialStatus);
            setIsLoading(false);
            setError(null);
            setErrorType(null);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            setErrorType(null);

            const response = await withTimeout(
                fetch(`/api/subscription/status?userId=${user.id}`),
                LOADING_TIMEOUT,
                'Loading subscription status took too long. Please check your connection and try again.'
            );

            const data = await response.json();

            if (data.success) {
                setSubscriptionStatus(data.subscription);
            } else {
                throw new Error(data.error || 'Failed to load subscription status');
            }
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoading(false);
        }
    }, [user, handleError]);

    // Load subscription status on mount and user changes
    useEffect(() => {
        loadSubscriptionStatus();
    }, [loadSubscriptionStatus]);

    return {
        subscriptionStatus,
        isLoading,
        error,
        errorType,
        refetch: loadSubscriptionStatus,
    };
}