'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAIGenerationOptions<TInput, TOutput> {
    onGenerate: (input: TInput) => Promise<TOutput>;
    onSuccess?: (output: TOutput) => void;
    onError?: (error: Error) => void;
    successTitle?: string;
    successDescription?: string;
    errorTitle?: string;
    errorDescription?: string;
    loadingMessages?: readonly string[];
}

interface UseAIGenerationReturn<TOutput> {
    output: TOutput | null;
    setOutput: (output: TOutput | null) => void;
    isLoading: boolean;
    error: string | null;
    generate: (input: any) => Promise<void>;
    reset: () => void;
    copied: boolean;
    copyToClipboard: (text: string) => void;
    currentLoadingMessage: string;
}

/**
 * Reusable hook for AI generation workflows
 * Handles loading states, error handling, and toast notifications
 */
const DEFAULT_LOADING_MESSAGES = [
    'Analyzing your request...',
    'Crafting compelling content...',
    'Polishing the details...',
    'Almost there...',
];

export function useAIGeneration<TInput = any, TOutput = string>({
    onGenerate,
    onSuccess,
    onError,
    successTitle = 'Generated Successfully',
    successDescription = 'Your content is ready',
    errorTitle = 'Generation Failed',
    errorDescription = 'Could not generate content. Please try again.',
    loadingMessages = DEFAULT_LOADING_MESSAGES,
}: UseAIGenerationOptions<TInput, TOutput>): UseAIGenerationReturn<TOutput> {
    const [output, setOutput] = useState<TOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [currentLoadingMessage, setCurrentLoadingMessage] = useState('');
    const { toast } = useToast();

    const generate = useCallback(
        async (input: TInput) => {
            setIsLoading(true);
            setError(null);
            setOutput(null);

            // Cycle through loading messages
            let messageIndex = 0;
            setCurrentLoadingMessage(loadingMessages[0]);

            const messageInterval = setInterval(() => {
                messageIndex = (messageIndex + 1) % loadingMessages.length;
                setCurrentLoadingMessage(loadingMessages[messageIndex]);
            }, 3000);

            try {
                const result = await onGenerate(input);
                setOutput(result);

                if (onSuccess) {
                    onSuccess(result);
                }

                toast({
                    title: successTitle,
                    description: successDescription,
                });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : errorDescription;
                setError(errorMessage);

                if (onError && err instanceof Error) {
                    onError(err);
                }

                toast({
                    variant: 'destructive',
                    title: errorTitle,
                    description: errorMessage,
                });
            } finally {
                clearInterval(messageInterval);
                setIsLoading(false);
                setCurrentLoadingMessage('');
            }
        },
        [onGenerate, onSuccess, onError, successTitle, successDescription, errorTitle, errorDescription, loadingMessages, toast]
    );

    const reset = useCallback(() => {
        setOutput(null);
        setError(null);
        setIsLoading(false);
        setCopied(false);
    }, []);

    const copyToClipboard = useCallback(
        (text: string) => {
            navigator.clipboard.writeText(text);
            setCopied(true);
            toast({
                title: 'Copied to Clipboard!',
                description: 'Content is ready to paste',
                duration: 2000,
            });
            setTimeout(() => setCopied(false), 2000);
        },
        [toast]
    );

    return {
        output,
        setOutput,
        isLoading,
        error,
        generate,
        reset,
        copied,
        copyToClipboard,
        currentLoadingMessage,
    };
}
