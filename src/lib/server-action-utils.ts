import { z } from 'zod';

/**
 * Standard server action response type
 */
export interface ServerActionResponse<T = any> {
    message: string;
    data?: T;
    errors: Record<string, string[]>;
    success?: boolean;
}

/**
 * Type-safe server action result
 */
export type ServerActionResult<T> =
    | { success: true; data: T; message: string; errors: Record<string, string[]> }
    | { success: false; data?: T; message: string; errors: Record<string, string[]> };

/**
 * Creates a success response
 */
export function createSuccessResponse<T>(data: T, message = 'success'): ServerActionResponse<T> {
    return {
        message,
        data,
        errors: {},
        success: true
    };
}

/**
 * Creates an error response
 */
export function createErrorResponse(
    message: string,
    errors: Record<string, string[]> = {},
    data?: any
): ServerActionResponse {
    return {
        message,
        data,
        errors,
        success: false
    };
}

/**
 * Creates a validation error response from Zod
 */
export function createValidationErrorResponse(
    zodError: z.ZodError,
    prevData?: any
): ServerActionResponse {
    const fieldErrors = zodError.flatten().fieldErrors;
    // Convert undefined values to empty arrays to match Record<string, string[]>
    const cleanedErrors: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(fieldErrors)) {
        cleanedErrors[key] = value || [];
    }

    return {
        message: 'Validation failed',
        data: prevData,
        errors: cleanedErrors,
        success: false
    };
}

/**
 * Higher-order function for server actions with error handling
 */
export function withErrorHandling<T extends any[], R>(
    action: (...args: T) => Promise<ServerActionResponse<R>>,
    actionName?: string
) {
    return async (...args: T): Promise<ServerActionResponse<R>> => {
        try {
            return await action(...args);
        } catch (error) {
            const errorContext = actionName ? `[${actionName}]` : '';
            console.error(`Server action error ${errorContext}:`, error);

            // Handle specific error types
            if (error instanceof z.ZodError) {
                return createValidationErrorResponse(error);
            }

            return createErrorResponse(
                error instanceof Error ? error.message : 'An unexpected error occurred'
            );
        }
    };
}

/**
 * Validates form data with Zod schema
 */
export function validateFormData<T>(
    schema: z.ZodSchema<T>,
    formData: FormData
): { success: true; data: T } | { success: false; error: z.ZodError } {
    try {
        // Convert FormData to plain object, handling arrays and empty values
        const formObject: Record<string, any> = {};
        for (const [key, value] of formData.entries()) {
            if (formObject[key]) {
                // Handle multiple values for same key (arrays)
                if (Array.isArray(formObject[key])) {
                    formObject[key].push(value);
                } else {
                    formObject[key] = [formObject[key], value];
                }
            } else {
                formObject[key] = value;
            }
        }

        const data = schema.parse(formObject);
        return { success: true, data };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error };
        }
        throw error;
    }
}

/**
 * Type-safe wrapper for server actions that ensures consistent return types
 */
export function createServerAction<TInput, TOutput>(
    schema: z.ZodSchema<TInput>,
    handler: (input: TInput) => Promise<TOutput>
) {
    return async (prevState: any, formData: FormData): Promise<ServerActionResponse<TOutput>> => {
        try {
            const validation = validateFormData(schema, formData);

            if (!validation.success) {
                return createValidationErrorResponse(validation.error, prevState?.data);
            }

            const result = await handler(validation.data);
            return createSuccessResponse(result);
        } catch (error) {
            console.error('Server action error:', error);
            return createErrorResponse(
                error instanceof Error ? error.message : 'An unexpected error occurred',
                {},
                prevState?.data
            );
        }
    };
}

/**
 * Utility to check if a server action response indicates success
 */
export function isSuccessResponse<T>(response: ServerActionResponse<T>): response is ServerActionResponse<T> & { success: true; data: T } {
    return response.success === true && response.data !== undefined;
}

/**
 * Utility to extract error messages from server action response
 */
export function getErrorMessages(response: ServerActionResponse): string[] {
    const messages = [response.message];

    // Add field-specific errors
    Object.values(response.errors).forEach(fieldErrors => {
        messages.push(...fieldErrors);
    });

    return messages.filter(Boolean);
}