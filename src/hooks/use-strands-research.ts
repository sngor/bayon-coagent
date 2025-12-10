/**
 * React hook for Strands research agent integration
 * 
 * Follows the established hook patterns in the codebase
 * Provides optimistic UI updates and error handling
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { executeResearchAction, checkStrandsHealthAction } from '@/app/strands-actions';

interface ResearchState {
    isLoading: boolean;
    isHealthy: boolean | null;
    error: string | null;
    lastResult: {
        reportId?: string;
        report?: string;
        citations?: string[];
    } | null;
}

interface ResearchInput {
    topic: string;
    searchDepth: 'basic' | 'advanced'; // Made required to fix type error
    includeMarketAnalysis: boolean;    // Made required to fix type error
    saveToLibrary: boolean;           // Made required to fix type error
}

/**
 * Hook for managing Strands research agent interactions
 * Optimized with useCallback and useMemo for better performance
 */
export function useStrandsResearch() {
    const { toast } = useToast();
    const [state, setState] = useState<ResearchState>(() => ({
        isLoading: false,
        isHealthy: null,
        error: null,
        lastResult: null,
    }));

    /**
     * Execute research with optimistic UI updates
     */
    const executeResearch = useCallback(async (input: ResearchInput) => {
        setState(prev => ({
            ...prev,
            isLoading: true,
            error: null,
        }));

        try {
            // Ensure all required fields have defaults
            const completeInput = {
                searchDepth: 'advanced' as const,
                includeMarketAnalysis: true,
                saveToLibrary: true,
                ...input, // Override with provided values
            };

            const result = await executeResearchAction(completeInput);

            if (result.success) {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    lastResult: result.data || null,
                    error: null,
                }));

                toast({
                    title: "Research Complete",
                    description: result.message,
                });

                return result.data;
            } else {
                const errorMessage = result.errors
                    ? Object.values(result.errors).flat().join(', ')
                    : result.message;

                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: errorMessage,
                }));

                toast({
                    title: "Research Failed",
                    description: errorMessage,
                    variant: "destructive",
                });

                return null;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));

            toast({
                title: "Research Error",
                description: errorMessage,
                variant: "destructive",
            });

            return null;
        }
    }, [toast]);

    /**
     * Check Strands agent health
     */
    const checkHealth = useCallback(async () => {
        try {
            const result = await checkStrandsHealthAction();

            setState(prev => ({
                ...prev,
                isHealthy: result.data?.healthy || false,
            }));

            return result.data?.healthy || false;
        } catch (error) {
            setState(prev => ({
                ...prev,
                isHealthy: false,
            }));
            return false;
        }
    }, []);

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setState(prev => ({
            ...prev,
            error: null,
        }));
    }, []);

    /**
     * Reset all state
     */
    const reset = useCallback(() => {
        setState({
            isLoading: false,
            isHealthy: null,
            error: null,
            lastResult: null,
        });
    }, []);

    return {
        // State
        isLoading: state.isLoading,
        isHealthy: state.isHealthy,
        error: state.error,
        lastResult: state.lastResult,

        // Actions
        executeResearch,
        checkHealth,
        clearError,
        reset,
    };
}