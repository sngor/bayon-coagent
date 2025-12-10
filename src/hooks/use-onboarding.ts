'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onboardingService, OnboardingError } from '@/services/onboarding/onboarding-service';
import { onboardingAnalytics } from '@/services/onboarding/onboarding-analytics';
import type { OnboardingState, OnboardingStep, OnboardingFlowType } from '@/types/onboarding';
import { getStepsForFlow, getNextStep as getNextStepHelper, calculateProgress } from '@/types/onboarding';
import { useToast } from '@/hooks/use-toast';
import {
    getErrorInfo,
    retryWithBackoff,
    logError,
    OnboardingErrorSeverity,
} from '@/services/onboarding/onboarding-error-handler';

/**
 * Custom hook for managing onboarding state
 * 
 * Provides:
 * - Current onboarding state access
 * - Methods for completing steps, skipping, and checking status
 * - Optimistic UI updates
 * - Error handling and retry logic
 * - In-memory caching for performance
 * - Automatic state persistence
 * 
 * Requirements: 6.1, 6.2, 6.3, 18.1, 18.2, 18.3, 18.4, 19.1
 */

interface UseOnboardingOptions {
    /** User ID */
    userId: string;
    /** Whether to enable automatic state syncing */
    autoSync?: boolean;
    /** Sync interval in milliseconds (default: 30000 = 30 seconds) */
    syncInterval?: number;
}

interface UseOnboardingReturn {
    /** Current onboarding state */
    state: OnboardingState | null;
    /** Whether state is loading */
    isLoading: boolean;
    /** Whether an operation is in progress */
    isUpdating: boolean;
    /** Error if any */
    error: Error | null;
    /** Complete a step */
    completeStep: (stepId: string) => Promise<void>;
    /** Skip a step */
    skipStep: (stepId: string) => Promise<void>;
    /** Complete entire onboarding */
    completeOnboarding: () => Promise<void>;
    /** Check if user needs onboarding */
    needsOnboarding: () => Promise<boolean>;
    /** Get next incomplete step */
    getNextStep: () => OnboardingStep | null;
    /** Get all steps for current flow */
    getSteps: () => OnboardingStep[];
    /** Calculate progress percentage */
    getProgress: () => number;
    /** Refresh state from server */
    refresh: () => Promise<void>;
    /** Navigate to next step */
    navigateToNextStep: () => void;
    /** Navigate to specific step */
    navigateToStep: (stepId: string) => void;
}

/**
 * In-memory cache for onboarding state
 * Shared across all hook instances for the same user
 */
const stateCache = new Map<string, {
    state: OnboardingState;
    timestamp: number;
}>();

const CACHE_TTL = 60000; // 1 minute

/**
 * Custom hook for onboarding state management
 */
export function useOnboarding(options: UseOnboardingOptions): UseOnboardingReturn {
    const { userId, autoSync = true, syncInterval = 30000 } = options;
    const router = useRouter();
    const { toast } = useToast();

    // State
    const [state, setState] = useState<OnboardingState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Refs for tracking
    const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastSyncRef = useRef<number>(0);
    const pendingUpdatesRef = useRef<Set<string>>(new Set());

    /**
     * Load state from cache or server with retry logic
     */
    const loadState = useCallback(async (forceRefresh = false) => {
        try {
            setIsLoading(true);
            setError(null);

            // Check cache first
            if (!forceRefresh) {
                const cached = stateCache.get(userId);
                if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                    setState(cached.state);
                    setIsLoading(false);
                    return;
                }
            }

            // Load from server with retry logic for network errors
            const loadedState = await retryWithBackoff(
                () => onboardingService.getOnboardingState(userId),
                {
                    maxRetries: 3,
                    initialDelay: 1000,
                    maxDelay: 5000,
                    backoffMultiplier: 2,
                    jitter: true,
                },
                (attempt, error) => {
                    console.log(`[USE_ONBOARDING] Retry attempt ${attempt} after error:`, error.message);
                }
            );

            if (loadedState) {
                setState(loadedState);
                // Update cache
                stateCache.set(userId, {
                    state: loadedState,
                    timestamp: Date.now(),
                });
            } else {
                setState(null);
            }
        } catch (err) {
            logError(err, { userId, operation: 'loadState' });
            setError(err as Error);

            // Get user-friendly error info
            const errorInfo = getErrorInfo(err);

            // Show appropriate error message based on severity
            toast({
                title: errorInfo.title,
                description: errorInfo.description,
                variant: errorInfo.severity === OnboardingErrorSeverity.CRITICAL ? 'destructive' : 'default',
            });
        } finally {
            setIsLoading(false);
        }
    }, [userId, toast]);

    /**
     * Save state to server with retry logic
     */
    const saveState = useCallback(async (updatedState: OnboardingState, retryCount = 0): Promise<void> => {
        const MAX_RETRIES = 3;
        const RETRY_DELAY = 1000;

        try {
            // Update cache immediately for optimistic UI
            stateCache.set(userId, {
                state: updatedState,
                timestamp: Date.now(),
            });

            // Save to server (the service handles the actual DynamoDB update)
            // We don't need to call a separate save method since completeStep/skipStep already save
            lastSyncRef.current = Date.now();
        } catch (err) {
            console.error('[USE_ONBOARDING] Error saving state:', err);

            // Retry on network errors
            if (err instanceof OnboardingError && err.retryable && retryCount < MAX_RETRIES) {
                console.log(`[USE_ONBOARDING] Retrying save (attempt ${retryCount + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retryCount)));
                return saveState(updatedState, retryCount + 1);
            }

            throw err;
        }
    }, [userId]);

    /**
     * Complete a step with optimistic update and retry logic
     */
    const completeStep = useCallback(async (stepId: string) => {
        if (!state) {
            throw new Error('Onboarding state not initialized');
        }

        // Optimistic update
        const optimisticState: OnboardingState = {
            ...state,
            completedSteps: [...state.completedSteps, stepId],
            skippedSteps: state.skippedSteps.filter(id => id !== stepId),
            lastAccessedAt: new Date().toISOString(),
        };

        setState(optimisticState);
        setIsUpdating(true);
        pendingUpdatesRef.current.add(stepId);

        try {
            // Save to server with retry logic
            const updatedState = await retryWithBackoff(
                () => onboardingService.completeStep(userId, stepId),
                {
                    maxRetries: 3,
                    initialDelay: 1000,
                    maxDelay: 5000,
                    backoffMultiplier: 2,
                    jitter: true,
                },
                (attempt) => {
                    toast({
                        title: 'Retrying...',
                        description: `Attempting to save progress (${attempt}/3)`,
                    });
                }
            );

            setState(updatedState);
            await saveState(updatedState);

            // Track analytics
            await onboardingAnalytics.trackStepCompleted(userId, state.flowType, stepId);

            // Show success message
            toast({
                title: 'Progress Saved',
                description: 'Your progress has been saved automatically.',
            });
        } catch (err) {
            logError(err, { userId, stepId, operation: 'completeStep' });

            // Revert optimistic update
            setState(state);

            // Get user-friendly error info
            const errorInfo = getErrorInfo(err);

            // Show error with suggested actions
            toast({
                title: errorInfo.title,
                description: errorInfo.description,
                variant: 'destructive',
            });

            throw err;
        } finally {
            setIsUpdating(false);
            pendingUpdatesRef.current.delete(stepId);
        }
    }, [state, userId, saveState, toast]);

    /**
     * Skip a step with optimistic update and retry logic
     */
    const skipStep = useCallback(async (stepId: string) => {
        if (!state) {
            throw new Error('Onboarding state not initialized');
        }

        // Optimistic update
        const optimisticState: OnboardingState = {
            ...state,
            skippedSteps: [...state.skippedSteps, stepId],
            completedSteps: state.completedSteps.filter(id => id !== stepId),
            lastAccessedAt: new Date().toISOString(),
        };

        setState(optimisticState);
        setIsUpdating(true);
        pendingUpdatesRef.current.add(stepId);

        try {
            // Save to server with retry logic
            const updatedState = await retryWithBackoff(
                () => onboardingService.skipStep(userId, stepId),
                {
                    maxRetries: 3,
                    initialDelay: 1000,
                    maxDelay: 5000,
                    backoffMultiplier: 2,
                    jitter: true,
                },
                (attempt) => {
                    toast({
                        title: 'Retrying...',
                        description: `Attempting to save skip (${attempt}/3)`,
                    });
                }
            );

            setState(updatedState);
            await saveState(updatedState);

            // Track analytics
            await onboardingAnalytics.trackStepSkipped(userId, state.flowType, stepId);

            // Show success message
            toast({
                title: 'Step Skipped',
                description: 'You can access this step later from settings.',
            });
        } catch (err) {
            logError(err, { userId, stepId, operation: 'skipStep' });

            // Revert optimistic update
            setState(state);

            // Get user-friendly error info
            const errorInfo = getErrorInfo(err);

            // Show error with suggested actions
            toast({
                title: errorInfo.title,
                description: errorInfo.description,
                variant: 'destructive',
            });

            throw err;
        } finally {
            setIsUpdating(false);
            pendingUpdatesRef.current.delete(stepId);
        }
    }, [state, userId, saveState, toast]);

    /**
     * Complete entire onboarding
     */
    const completeOnboarding = useCallback(async () => {
        if (!state) {
            throw new Error('Onboarding state not initialized');
        }

        setIsUpdating(true);

        try {
            const updatedState = await onboardingService.completeOnboarding(userId);
            setState(updatedState);
            await saveState(updatedState);

            // Track analytics
            await onboardingAnalytics.trackOnboardingCompleted(
                userId,
                state.flowType,
                Date.now() - new Date(state.startedAt).getTime()
            );

            // Show success message
            toast({
                title: 'Onboarding Complete!',
                description: 'Welcome to Bayon Coagent. Let\'s get started!',
            });
        } catch (err) {
            console.error('[USE_ONBOARDING] Error completing onboarding:', err);

            toast({
                title: 'Error',
                description: 'Failed to complete onboarding. Please try again.',
                variant: 'destructive',
            });

            throw err;
        } finally {
            setIsUpdating(false);
        }
    }, [state, userId, saveState, toast]);

    /**
     * Check if user needs onboarding
     */
    const needsOnboarding = useCallback(async (): Promise<boolean> => {
        try {
            return await onboardingService.needsOnboarding(userId);
        } catch (err) {
            console.error('[USE_ONBOARDING] Error checking needs onboarding:', err);
            return false;
        }
    }, [userId]);

    /**
     * Get next incomplete step
     */
    const getNextStep = useCallback((): OnboardingStep | null => {
        if (!state) return null;

        const steps = getStepsForFlow(state.flowType);
        return steps.find(
            step => !state.completedSteps.includes(step.id) && !state.skippedSteps.includes(step.id)
        ) || null;
    }, [state]);

    /**
     * Get all steps for current flow
     */
    const getSteps = useCallback((): OnboardingStep[] => {
        if (!state) return [];
        return getStepsForFlow(state.flowType);
    }, [state]);

    /**
     * Calculate progress percentage
     */
    const getProgress = useCallback((): number => {
        if (!state) return 0;
        return calculateProgress(state.completedSteps, state.flowType);
    }, [state]);

    /**
     * Refresh state from server
     */
    const refresh = useCallback(async () => {
        await loadState(true);
    }, [loadState]);

    /**
     * Navigate to next step
     */
    const navigateToNextStep = useCallback(() => {
        const nextStep = getNextStep();
        if (nextStep) {
            router.push(nextStep.path);
        } else {
            // All steps complete, go to dashboard
            router.push('/dashboard');
        }
    }, [getNextStep, router]);

    /**
     * Navigate to specific step
     */
    const navigateToStep = useCallback((stepId: string) => {
        if (!state) return;

        const steps = getStepsForFlow(state.flowType);
        const step = steps.find(s => s.id === stepId);

        if (step) {
            router.push(step.path);
        }
    }, [state, router]);

    /**
     * Auto-sync state periodically
     */
    useEffect(() => {
        if (!autoSync || !state) return;

        // Set up periodic sync
        syncTimerRef.current = setInterval(async () => {
            // Only sync if there are no pending updates
            if (pendingUpdatesRef.current.size === 0) {
                try {
                    await loadState(true);
                } catch (err) {
                    console.error('[USE_ONBOARDING] Auto-sync failed:', err);
                }
            }
        }, syncInterval);

        return () => {
            if (syncTimerRef.current) {
                clearInterval(syncTimerRef.current);
            }
        };
    }, [autoSync, syncInterval, state, loadState]);

    /**
     * Load initial state
     */
    useEffect(() => {
        loadState();
    }, [loadState]);

    /**
     * Save state before page unload
     */
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Flush any pending updates
            if (state && pendingUpdatesRef.current.size === 0) {
                // Use navigator.sendBeacon for reliable data transmission during page unload
                const data = JSON.stringify({
                    userId,
                    state,
                    timestamp: Date.now(),
                });

                // Send beacon to sync endpoint
                // Requirement 6.2: Data preservation on navigation away
                const blob = new Blob([data], { type: 'application/json' });
                navigator.sendBeacon('/api/onboarding/sync', blob);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [state, userId]);

    return {
        state,
        isLoading,
        isUpdating,
        error,
        completeStep,
        skipStep,
        completeOnboarding,
        needsOnboarding,
        getNextStep,
        getSteps,
        getProgress,
        refresh,
        navigateToNextStep,
        navigateToStep,
    };
}
