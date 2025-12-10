'use client';

import { useCallback } from 'react';
import { showErrorToast, showSuccessToast, showWarningToast } from './use-toast';
import { WorkflowErrorType } from '@/lib/workflow-error-handler';

/**
 * Action result type (matches server action result)
 */
type ActionResult<T = any> = {
    message: string;
    data?: T;
    errors: Record<string, string[]>;
    errorType?: WorkflowErrorType;
};

/**
 * Hook for handling workflow action results with toast notifications
 * 
 * Provides consistent error handling and user feedback for workflow actions.
 * 
 * Requirements: 12.5, 14.5
 * 
 * @example
 * ```tsx
 * const { handleActionResult } = useWorkflowActionHandler();
 * 
 * const result = await startWorkflow(prevState, formData);
 * const success = handleActionResult(result, {
 *   successMessage: 'Workflow started successfully',
 *   onSuccess: (data) => router.push(`/workflow/${data.id}`),
 * });
 * ```
 */
export function useWorkflowActionHandler() {
    /**
     * Handles an action result and displays appropriate toast notifications
     * 
     * @param result - The action result from a server action
     * @param options - Options for handling the result
     * @returns True if the action was successful, false otherwise
     */
    const handleActionResult = useCallback(
        <T = any>(
            result: ActionResult<T>,
            options?: {
                /** Custom success message (default: uses result.message) */
                successMessage?: string;
                /** Callback to execute on success */
                onSuccess?: (data: T) => void;
                /** Callback to execute on error */
                onError?: (error: ActionResult<T>) => void;
                /** Whether to show success toast (default: true) */
                showSuccessToast?: boolean;
                /** Whether to show error toast (default: true) */
                showErrorToast?: boolean;
            }
        ): boolean => {
            const {
                successMessage,
                onSuccess,
                onError,
                showSuccessToast: showSuccess = true,
                showErrorToast: showError = true,
            } = options || {};

            // Check if action was successful
            const isSuccess = result.message === 'success' && Object.keys(result.errors).length === 0;

            if (isSuccess) {
                // Show success toast
                if (showSuccess && successMessage) {
                    showSuccessToast('Success', successMessage);
                }

                // Execute success callback
                if (onSuccess && result.data) {
                    onSuccess(result.data);
                }

                return true;
            } else {
                // Handle error
                if (showError) {
                    displayErrorToast(result);
                }

                // Execute error callback
                if (onError) {
                    onError(result);
                }

                return false;
            }
        },
        []
    );

    /**
     * Displays an error toast based on the error type
     */
    const displayErrorToast = useCallback((result: ActionResult) => {
        const { message, errorType, errors } = result;

        // Get first error message if available
        const firstErrorKey = Object.keys(errors)[0];
        const firstError = firstErrorKey ? errors[firstErrorKey][0] : null;
        const errorMessage = firstError || message;

        // Display appropriate toast based on error type
        switch (errorType) {
            case WorkflowErrorType.NETWORK:
                showErrorToast(
                    'Connection Error',
                    'Please check your internet connection and try again.'
                );
                break;

            case WorkflowErrorType.VALIDATION:
                showWarningToast('Validation Error', errorMessage);
                break;

            case WorkflowErrorType.NOT_FOUND:
                showErrorToast('Not Found', errorMessage);
                break;

            case WorkflowErrorType.UNAUTHORIZED:
                showErrorToast('Unauthorized', errorMessage);
                break;

            case WorkflowErrorType.CONCURRENT_UPDATE:
                showWarningToast(
                    'Workflow Updated',
                    'This workflow was updated by another session. Please refresh and try again.'
                );
                break;

            case WorkflowErrorType.DATABASE:
                showErrorToast(
                    'Service Unavailable',
                    'The service is temporarily unavailable. Please try again in a moment.'
                );
                break;

            default:
                showErrorToast('Error', errorMessage);
                break;
        }
    }, []);

    /**
     * Wraps an async action with error handling
     * 
     * @param action - The async action to execute
     * @param options - Options for handling the result
     * @returns The action result
     */
    const executeAction = useCallback(
        async <T = any>(
            action: () => Promise<ActionResult<T>>,
            options?: Parameters<typeof handleActionResult>[1]
        ): Promise<ActionResult<T>> => {
            try {
                const result = await action();
                handleActionResult(result, options);
                return result;
            } catch (error) {
                // Handle unexpected errors
                const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

                showErrorToast('Error', errorMessage);

                return {
                    message: errorMessage,
                    errors: { unexpected: [errorMessage] },
                    errorType: WorkflowErrorType.UNKNOWN,
                };
            }
        },
        [handleActionResult]
    );

    return {
        handleActionResult,
        executeAction,
    };
}
