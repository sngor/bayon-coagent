import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ErrorHandlerOptions {
    showToast?: boolean;
    logError?: boolean;
    fallbackMessage?: string;
}

export function useAdminErrorHandler() {
    const { toast } = useToast();

    const handleError = useCallback((
        error: unknown,
        context: string,
        options: ErrorHandlerOptions = {}
    ) => {
        const {
            showToast = true,
            logError = true,
            fallbackMessage = 'An unexpected error occurred'
        } = options;

        const errorMessage = error instanceof Error ? error.message : fallbackMessage;

        if (logError) {
            console.error(`[${context}] Error:`, error);
        }

        if (showToast) {
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });
        }

        return errorMessage;
    }, [toast]);

    return { handleError };
}