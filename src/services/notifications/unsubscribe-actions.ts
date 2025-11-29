'use server';

/**
 * Unsubscribe Server Actions
 * 
 * Server actions for email unsubscribe functionality and compliance.
 * Validates Requirements: 4.5
 */

import { getUnsubscribeService } from '@/lib/notifications/unsubscribe-service';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { NotificationType } from '@/lib/notifications/types';
import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

const processUnsubscribeSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    reason: z.string().optional(),
    alertTypes: z.array(z.nativeEnum(NotificationType)).optional(),
});

const resubscribeSchema = z.object({
    alertTypes: z.array(z.nativeEnum(NotificationType)).optional(),
});

const validateTokenSchema = z.object({
    token: z.string().min(1, 'Token is required'),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the current authenticated user
 */
async function getCurrentUser() {
    try {
        const user = await getCurrentUserServer();
        return user;
    } catch (error) {
        console.error('Failed to get current user:', error);
        return null;
    }
}

/**
 * Standard error response format
 */
function errorResponse(message: string, errors: any = {}) {
    return {
        message,
        data: null,
        errors,
    };
}

/**
 * Standard success response format
 */
function successResponse(data: any, message: string = 'Success') {
    return {
        message,
        data,
        errors: {},
    };
}

// ============================================================================
// Unsubscribe Actions
// ============================================================================

/**
 * Processes an unsubscribe request using a token
 * Validates Requirements: 4.5
 * 
 * @param formData Form data containing token and options
 * @returns Action result
 */
export async function processUnsubscribeAction(
    prevState: any,
    formData: FormData
): Promise<{ message: string; data: any; errors: any }> {
    try {
        // Parse and validate input
        const rawData = {
            token: formData.get('token'),
            reason: formData.get('reason') || undefined,
            alertTypes: formData.get('alertTypes')
                ? JSON.parse(formData.get('alertTypes') as string)
                : undefined,
        };

        const validation = processUnsubscribeSchema.safeParse(rawData);
        if (!validation.success) {
            return errorResponse(
                'Validation failed',
                validation.error.flatten().fieldErrors
            );
        }

        // Get IP address and user agent from headers (if available)
        // Note: In a real implementation, you'd get these from the request
        const ipAddress = undefined; // Would come from request headers
        const userAgent = undefined; // Would come from request headers

        // Process unsubscribe
        const service = getUnsubscribeService();
        const result = await service.processUnsubscribe(validation.data.token, {
            reason: validation.data.reason,
            alertTypes: validation.data.alertTypes,
            ipAddress,
            userAgent,
        });

        if (!result.success) {
            return errorResponse(result.message);
        }

        return successResponse(
            { unsubscribed: true },
            result.message
        );
    } catch (error) {
        console.error('Process unsubscribe error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to process unsubscribe request'
        );
    }
}

/**
 * Validates an unsubscribe token
 * Validates Requirements: 4.5
 * 
 * @param formData Form data containing token
 * @returns Action result with token validation status
 */
export async function validateUnsubscribeTokenAction(
    prevState: any,
    formData: FormData
): Promise<{ message: string; data: any; errors: any }> {
    try {
        // Parse and validate input
        const rawData = {
            token: formData.get('token'),
        };

        const validation = validateTokenSchema.safeParse(rawData);
        if (!validation.success) {
            return errorResponse(
                'Validation failed',
                validation.error.flatten().fieldErrors
            );
        }

        // Validate token
        const service = getUnsubscribeService();
        const tokenData = service.validateUnsubscribeToken(validation.data.token);

        if (!tokenData) {
            return errorResponse('Invalid or expired unsubscribe link');
        }

        return successResponse(
            {
                valid: true,
                userId: tokenData.userId,
                email: tokenData.email,
            },
            'Token is valid'
        );
    } catch (error) {
        console.error('Validate token error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to validate token'
        );
    }
}

/**
 * Re-subscribes a user to email notifications
 * Validates Requirements: 4.5
 * 
 * @param formData Form data containing re-subscribe options
 * @returns Action result
 */
export async function resubscribeAction(
    prevState: any,
    formData: FormData
): Promise<{ message: string; data: any; errors: any }> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return errorResponse('Authentication required', { auth: ['You must be logged in'] });
        }

        // Parse and validate input
        const rawData = {
            alertTypes: formData.get('alertTypes')
                ? JSON.parse(formData.get('alertTypes') as string)
                : undefined,
        };

        const validation = resubscribeSchema.safeParse(rawData);
        if (!validation.success) {
            return errorResponse(
                'Validation failed',
                validation.error.flatten().fieldErrors
            );
        }

        // Process resubscribe
        const service = getUnsubscribeService();
        const result = await service.resubscribe(
            user.id,
            validation.data.alertTypes || []
        );

        if (!result.success) {
            return errorResponse(result.message);
        }

        return successResponse(
            { resubscribed: true },
            result.message
        );
    } catch (error) {
        console.error('Resubscribe error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to process resubscribe request'
        );
    }
}

/**
 * Gets unsubscribe preferences for the current user
 * Validates Requirements: 4.5
 * 
 * @returns Action result with unsubscribe preferences
 */
export async function getUnsubscribePreferencesAction(): Promise<{
    message: string;
    data: any;
    errors: any;
}> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return errorResponse('Authentication required', { auth: ['You must be logged in'] });
        }

        // Get preferences
        const service = getUnsubscribeService();
        const preferences = await service.getUnsubscribePreferences(user.id);

        return successResponse(preferences);
    } catch (error) {
        console.error('Get unsubscribe preferences error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to get unsubscribe preferences'
        );
    }
}

/**
 * Gets unsubscribe history for the current user
 * Validates Requirements: 4.5
 * 
 * @param formData Form data containing limit
 * @returns Action result with unsubscribe history
 */
export async function getUnsubscribeHistoryAction(
    prevState: any,
    formData: FormData
): Promise<{ message: string; data: any; errors: any }> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return errorResponse('Authentication required', { auth: ['You must be logged in'] });
        }

        // Parse limit
        const limit = formData.get('limit')
            ? parseInt(formData.get('limit') as string)
            : 10;

        // Get history
        const service = getUnsubscribeService();
        const history = await service.getUnsubscribeHistory(user.id, limit);

        return successResponse({ history });
    } catch (error) {
        console.error('Get unsubscribe history error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to get unsubscribe history'
        );
    }
}

/**
 * Generates an unsubscribe URL for the current user
 * Validates Requirements: 4.5
 * 
 * @returns Action result with unsubscribe URL
 */
export async function generateUnsubscribeUrlAction(): Promise<{
    message: string;
    data: any;
    errors: any;
}> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return errorResponse('Authentication required', { auth: ['You must be logged in'] });
        }

        // Get user email
        const { getRepository } = await import('@/aws/dynamodb/repository');
        const repository = getRepository();
        const profile = await repository.get(`USER#${user.id}`, 'PROFILE');
        const email = (profile as any)?.Data?.email || '';

        if (!email) {
            return errorResponse('User email not found');
        }

        // Generate URL
        const service = getUnsubscribeService();
        const url = service.generateUnsubscribeUrl(user.id, email);

        return successResponse({ url });
    } catch (error) {
        console.error('Generate unsubscribe URL error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to generate unsubscribe URL'
        );
    }
}
