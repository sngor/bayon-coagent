import { useState, useCallback, useMemo } from 'react';

interface LoadingState {
    isLoading: boolean;
    message?: string;
    progress?: number;
    stage?: string;
    error?: string;
}

interface UseLoadingStateOptions {
    initialMessage?: string;
    stages?: string[];
    onComplete?: () => void;
    onError?: (error: string) => void;
}

export function useLoadingState(options: UseLoadingStateOptions = {}) {
    const { initialMessage, stages = [], onComplete, onError } = options;
    
    const [state, setState] = useState<LoadingState>({
        isLoading: false,
        message: initialMessage,
        progress: 0,
        stage: stages[0],
        error: undefined
    });

    const startLoading = useCallback((message?: string) => {
        setState(prev => ({
            ...prev,
            isLoading: true,
            message: message || prev.message,
            progress: 0,
            error: undefined
        }));
    }, []);

    const updateProgress = useCallback((progress: number, message?: string) => {
        setState(prev => ({
            ...prev,
            progress: Math.min(100, Math.max(0, progress)),
            message: message || prev.message
        }));
    }, []);

    const nextStage = useCallback((stageIndex?: number) => {
        const index = stageIndex ?? Math.min(stages.length - 1, Math.floor((state.progress / 100) * stages.length));
        const stage = stages[index];
        
        setState(prev => ({
            ...prev,
            stage,
            progress: ((index + 1) / stages.length) * 100
        }));
    }, [stages, state.progress]);

    const completeLoading = useCallback((message?: string) => {
        setState(prev => ({
            ...prev,
            isLoading: false,
            progress: 100,
            message: message || prev.message
        }));
        onComplete?.();
    }, [onComplete]);

    const setError = useCallback((error: string) => {
        setState(prev => ({
            ...prev,
            isLoading: false,
            error
        }));
        onError?.(error);
    }, [onError]);

    const reset = useCallback(() => {
        setState({
            isLoading: false,
            message: initialMessage,
            progress: 0,
            stage: stages[0],
            error: undefined
        });
    }, [initialMessage, stages]);

    // Memoized loading props for components
    const loadingProps = useMemo(() => ({
        isLoading: state.isLoading,
        message: state.message,
        progress: state.progress,
        stage: state.stage,
        error: state.error
    }), [state]);

    return {
        ...loadingProps,
        startLoading,
        updateProgress,
        nextStage,
        completeLoading,
        setError,
        reset
    };
}