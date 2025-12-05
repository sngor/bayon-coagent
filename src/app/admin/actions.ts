/**
 * Admin Role Management Server Actions
 * 
 * This file contains server actions for managing user roles.
 * These actions are only accessible to SuperAdmin users.
 * 
 * Features:
 * - Role assignment and revocation with authorization checks
 * - Atomic updates across Cognito and DynamoDB with rollback on failure
 * - Comprehensive error handling and CloudWatch logging
 * - Email notifications for role changes
 * - Audit logging for compliance
 */

'use server';

import { z } from 'zod';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getRepository } from '@/aws/dynamodb/repository';
import { getCognitoClient } from '@/aws/auth/cognito-client';
import { hasSuperAdminAccess } from '@/aws/auth/role-utils';
import { createLogger } from '@/aws/logging/logger';
import {
    sendRoleAssignmentEmail,
    sendRoleRevocationEmail,
    sendRoleChangeEmail,
    type UserRole
} from '@/services/email/role-notification-service';
import { randomUUID } from 'crypto';

const logger = createLogger({ service: 'admin-actions' });

/**
 * Error types for role management operations
 */
class RoleManagementError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly userMessage: string,
        public readonly context?: Record<string, any>
    ) {
        super(message);
        this.name = 'RoleManagementError';
    }
}

/**
 * Rollback state for tracking changes that need to be reverted
 */
interface RollbackState {
    cognitoUpdated: boolean;
    dynamoDBUpdated: boolean;
    auditLogCreated: boolean;
    previousRole?: string;
}

// Validation schemas
const assignRoleSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    role: z.enum(['admin', 'superadmin'], {
        errorMap: () => ({ message: 'Role must be admin or superadmin' }),
    }),
});

const revokeRoleSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
});

const auditLogFiltersSchema = z.object({
    userId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.number().min(1).max(100).optional(),
    lastKey: z.string().optional(),
});

export interface AssignRoleInput {
    userId: string;
    role: 'admin' | 'superadmin';
}

export interface RevokeRoleInput {
    userId: string;
}

export interface AuditLogFilters {
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    lastKey?: string;
}

/**
 * Assigns an admin or superadmin role to a user
 * Only callable by SuperAdmins
 * 
 * Implements atomic updates with rollback on failure:
 * 1. Validates authorization and input
 * 2. Updates Cognito custom:role attribute
 * 3. Updates DynamoDB user profile
 * 4. Creates audit log entry
 * 5. Sends email notification (non-blocking)
 * 
 * If any step fails, all changes are rolled back to maintain consistency.
 */
export async function assignRole(
    input: AssignRoleInput
): Promise<{ success: boolean; message: string; error?: string }> {
    const rollbackState: RollbackState = {
        cognitoUpdated: false,
        dynamoDBUpdated: false,
        auditLogCreated: false,
    };

    const operationId = randomUUID();
    const startTime = Date.now();

    try {
        // Validate input
        const validatedInput = assignRoleSchema.parse(input);

        logger.info('Starting role assignment', {
            operationId,
            userId: validatedInput.userId,
            role: validatedInput.role,
        });

        // Get current user and verify SuperAdmin access
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            throw new RoleManagementError(
                'User not authenticated',
                'UNAUTHORIZED',
                'You must be signed in to perform this action'
            );
        }

        // Authorization check
        const userRole = (currentUser.attributes?.['custom:role'] as UserRole) || 'user';
        if (!hasSuperAdminAccess(userRole)) {
            logger.warn('Unauthorized role assignment attempt', {
                operationId,
                actingUserId: currentUser.id,
                actingUserRole: userRole,
                targetUserId: validatedInput.userId,
            });

            throw new RoleManagementError(
                'Insufficient permissions',
                'FORBIDDEN',
                'Only SuperAdmins can assign roles',
                { actingUserRole: userRole }
            );
        }

        // Get target user profile
        const repository = getRepository();
        const targetUser = await repository.getUserProfile(validatedInput.userId);

        if (!targetUser || !targetUser.Data) {
            throw new RoleManagementError(
                'Target user not found',
                'USER_NOT_FOUND',
                'The specified user does not exist',
                { targetUserId: validatedInput.userId }
            );
        }

        const oldRole = targetUser.Data.role || 'user';
        rollbackState.previousRole = oldRole;

        // Check if role is already assigned
        if (oldRole === validatedInput.role) {
            logger.info('Role already assigned, skipping update', {
                operationId,
                userId: validatedInput.userId,
                role: validatedInput.role,
            });

            return {
                success: true,
                message: `User already has ${validatedInput.role} role`,
            };
        }

        // Step 1: Update Cognito
        logger.debug('Updating Cognito role', {
            operationId,
            userId: validatedInput.userId,
            role: validatedInput.role,
        });

        try {
            const cognitoClient = getCognitoClient();
            await cognitoClient.updateUserRole(validatedInput.userId, validatedInput.role);
            rollbackState.cognitoUpdated = true;

            logger.debug('Cognito role updated successfully', {
                operationId,
                userId: validatedInput.userId,
            });
        } catch (error) {
            logger.error('Failed to update Cognito role', error as Error, {
                operationId,
                userId: validatedInput.userId,
                role: validatedInput.role,
            });

            throw new RoleManagementError(
                'Failed to update authentication system',
                'COGNITO_UPDATE_FAILED',
                'Failed to update role. Please try again.',
                { originalError: error instanceof Error ? error.message : 'Unknown error' }
            );
        }

        // Step 2: Update DynamoDB
        logger.debug('Updating DynamoDB profile', {
            operationId,
            userId: validatedInput.userId,
            role: validatedInput.role,
        });

        try {
            await repository.updateUserRole(
                validatedInput.userId,
                validatedInput.role,
                currentUser.id
            );
            rollbackState.dynamoDBUpdated = true;

            logger.debug('DynamoDB profile updated successfully', {
                operationId,
                userId: validatedInput.userId,
            });
        } catch (error) {
            logger.error('Failed to update DynamoDB profile', error as Error, {
                operationId,
                userId: validatedInput.userId,
                role: validatedInput.role,
            });

            // Rollback Cognito change
            await rollbackCognitoUpdate(
                validatedInput.userId,
                oldRole,
                operationId
            );

            throw new RoleManagementError(
                'Failed to update user profile',
                'DYNAMODB_UPDATE_FAILED',
                'Failed to update role. Changes have been rolled back.',
                { originalError: error instanceof Error ? error.message : 'Unknown error' }
            );
        }

        // Step 3: Create audit log
        logger.debug('Creating audit log entry', {
            operationId,
            userId: validatedInput.userId,
        });

        try {
            const timestamp = Date.now();
            await repository.createRoleAuditLog({
                auditId: operationId,
                timestamp,
                actingAdminId: currentUser.id,
                actingAdminEmail: currentUser.email,
                affectedUserId: validatedInput.userId,
                affectedUserEmail: targetUser.Data.email || '',
                oldRole,
                newRole: validatedInput.role,
                ipAddress: 'N/A', // TODO: Extract from request headers
                userAgent: 'N/A', // TODO: Extract from request headers
                action: 'assign',
            });
            rollbackState.auditLogCreated = true;

            logger.debug('Audit log created successfully', {
                operationId,
                auditId: operationId,
            });
        } catch (error) {
            logger.error('Failed to create audit log', error as Error, {
                operationId,
                userId: validatedInput.userId,
            });

            // Rollback both Cognito and DynamoDB changes
            await rollbackCognitoUpdate(
                validatedInput.userId,
                oldRole,
                operationId
            );
            await rollbackDynamoDBUpdate(
                validatedInput.userId,
                oldRole,
                currentUser.id,
                operationId
            );

            throw new RoleManagementError(
                'Failed to create audit log',
                'AUDIT_LOG_FAILED',
                'Failed to complete role assignment. Changes have been rolled back.',
                { originalError: error instanceof Error ? error.message : 'Unknown error' }
            );
        }

        // Step 4: Send email notification (non-blocking, failures don't rollback)
        try {
            await sendRoleChangeEmail({
                recipientEmail: targetUser.Data.email || '',
                recipientName: targetUser.Data.name || targetUser.Data.email || 'User',
                oldRole: oldRole as UserRole,
                newRole: validatedInput.role,
                changedBy: currentUser.attributes?.given_name || currentUser.email,
                changedByEmail: currentUser.email,
            });

            logger.info('Role assignment email sent', {
                operationId,
                userId: validatedInput.userId,
                role: validatedInput.role,
            });
        } catch (emailError) {
            // Log the error but don't fail the role assignment
            logger.warn('Failed to send role assignment email', {
                operationId,
                userId: validatedInput.userId,
                role: validatedInput.role,
                error: emailError instanceof Error ? emailError.message : 'Unknown error',
            });
        }

        const duration = Date.now() - startTime;
        logger.info('Role assignment completed successfully', {
            operationId,
            userId: validatedInput.userId,
            role: validatedInput.role,
            oldRole,
            duration,
        });

        return {
            success: true,
            message: 'Role assigned successfully',
        };
    } catch (error) {
        const duration = Date.now() - startTime;

        if (error instanceof RoleManagementError) {
            logger.error('Role assignment failed', undefined, {
                operationId,
                userId: input.userId,
                role: input.role,
                code: error.code,
                message: error.message,
                context: error.context,
                duration,
                rollbackState,
            });

            return {
                success: false,
                message: error.userMessage,
                error: error.code,
            };
        }

        // Handle validation errors
        if (error instanceof z.ZodError) {
            logger.error('Invalid input for role assignment', undefined, {
                operationId,
                userId: input.userId,
                role: input.role,
                validationErrors: error.errors,
                duration,
            });

            return {
                success: false,
                message: 'Invalid input',
                error: error.errors.map(e => e.message).join(', '),
            };
        }

        // Handle unexpected errors
        logger.error('Unexpected error during role assignment', error as Error, {
            operationId,
            userId: input.userId,
            role: input.role,
            duration,
            rollbackState,
        });

        return {
            success: false,
            message: 'Failed to assign role',
            error: 'An unexpected error occurred. Please try again.',
        };
    }
}

/**
 * Revokes admin/superadmin role from a user (resets to 'user')
 * Only callable by SuperAdmins
 * 
 * Implements atomic updates with rollback on failure:
 * 1. Validates authorization and prevents self-revocation
 * 2. Updates Cognito custom:role attribute to 'user'
 * 3. Updates DynamoDB user profile to 'user'
 * 4. Creates audit log entry
 * 5. Sends email notification (non-blocking)
 * 
 * If any step fails, all changes are rolled back to maintain consistency.
 */
export async function revokeRole(
    input: RevokeRoleInput
): Promise<{ success: boolean; message: string; error?: string }> {
    const rollbackState: RollbackState = {
        cognitoUpdated: false,
        dynamoDBUpdated: false,
        auditLogCreated: false,
    };

    const operationId = randomUUID();
    const startTime = Date.now();

    try {
        // Validate input
        const validatedInput = revokeRoleSchema.parse(input);

        logger.info('Starting role revocation', {
            operationId,
            userId: validatedInput.userId,
        });

        // Get current user and verify SuperAdmin access
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            throw new RoleManagementError(
                'User not authenticated',
                'UNAUTHORIZED',
                'You must be signed in to perform this action'
            );
        }

        // Authorization check
        const userRole = (currentUser.attributes?.['custom:role'] as UserRole) || 'user';
        if (!hasSuperAdminAccess(userRole)) {
            logger.warn('Unauthorized role revocation attempt', {
                operationId,
                actingUserId: currentUser.id,
                actingUserRole: userRole,
                targetUserId: validatedInput.userId,
            });

            throw new RoleManagementError(
                'Insufficient permissions',
                'FORBIDDEN',
                'Only SuperAdmins can revoke roles',
                { actingUserRole: userRole }
            );
        }

        // Prevent self-revocation
        if (currentUser.id === validatedInput.userId) {
            logger.warn('Self-revocation attempt blocked', {
                operationId,
                userId: currentUser.id,
            });

            throw new RoleManagementError(
                'Self-revocation not allowed',
                'SELF_REVOCATION',
                'You cannot revoke your own SuperAdmin role',
                { userId: currentUser.id }
            );
        }

        // Get target user profile
        const repository = getRepository();
        const targetUser = await repository.getUserProfile(validatedInput.userId);

        if (!targetUser || !targetUser.Data) {
            throw new RoleManagementError(
                'Target user not found',
                'USER_NOT_FOUND',
                'The specified user does not exist',
                { targetUserId: validatedInput.userId }
            );
        }

        const oldRole = targetUser.Data.role || 'user';
        rollbackState.previousRole = oldRole;

        // Check if user already has user role
        if (oldRole === 'user') {
            logger.info('User already has user role, skipping revocation', {
                operationId,
                userId: validatedInput.userId,
            });

            return {
                success: true,
                message: 'User already has standard user role',
            };
        }

        // Step 1: Update Cognito to 'user'
        logger.debug('Updating Cognito role to user', {
            operationId,
            userId: validatedInput.userId,
        });

        try {
            const cognitoClient = getCognitoClient();
            await cognitoClient.updateUserRole(validatedInput.userId, 'user');
            rollbackState.cognitoUpdated = true;

            logger.debug('Cognito role updated to user successfully', {
                operationId,
                userId: validatedInput.userId,
            });
        } catch (error) {
            logger.error('Failed to update Cognito role to user', error as Error, {
                operationId,
                userId: validatedInput.userId,
            });

            throw new RoleManagementError(
                'Failed to update authentication system',
                'COGNITO_UPDATE_FAILED',
                'Failed to revoke role. Please try again.',
                { originalError: error instanceof Error ? error.message : 'Unknown error' }
            );
        }

        // Step 2: Update DynamoDB to 'user'
        logger.debug('Updating DynamoDB profile to user', {
            operationId,
            userId: validatedInput.userId,
        });

        try {
            await repository.updateUserRole(
                validatedInput.userId,
                'user',
                currentUser.id
            );
            rollbackState.dynamoDBUpdated = true;

            logger.debug('DynamoDB profile updated to user successfully', {
                operationId,
                userId: validatedInput.userId,
            });
        } catch (error) {
            logger.error('Failed to update DynamoDB profile to user', error as Error, {
                operationId,
                userId: validatedInput.userId,
            });

            // Rollback Cognito change
            await rollbackCognitoUpdate(
                validatedInput.userId,
                oldRole,
                operationId
            );

            throw new RoleManagementError(
                'Failed to update user profile',
                'DYNAMODB_UPDATE_FAILED',
                'Failed to revoke role. Changes have been rolled back.',
                { originalError: error instanceof Error ? error.message : 'Unknown error' }
            );
        }

        // Step 3: Create audit log
        logger.debug('Creating audit log entry for revocation', {
            operationId,
            userId: validatedInput.userId,
        });

        try {
            const timestamp = Date.now();
            await repository.createRoleAuditLog({
                auditId: operationId,
                timestamp,
                actingAdminId: currentUser.id,
                actingAdminEmail: currentUser.email,
                affectedUserId: validatedInput.userId,
                affectedUserEmail: targetUser.Data.email || '',
                oldRole,
                newRole: 'user',
                ipAddress: 'N/A', // TODO: Extract from request headers
                userAgent: 'N/A', // TODO: Extract from request headers
                action: 'revoke',
            });
            rollbackState.auditLogCreated = true;

            logger.debug('Audit log created successfully for revocation', {
                operationId,
                auditId: operationId,
            });
        } catch (error) {
            logger.error('Failed to create audit log for revocation', error as Error, {
                operationId,
                userId: validatedInput.userId,
            });

            // Rollback both Cognito and DynamoDB changes
            await rollbackCognitoUpdate(
                validatedInput.userId,
                oldRole,
                operationId
            );
            await rollbackDynamoDBUpdate(
                validatedInput.userId,
                oldRole,
                currentUser.id,
                operationId
            );

            throw new RoleManagementError(
                'Failed to create audit log',
                'AUDIT_LOG_FAILED',
                'Failed to complete role revocation. Changes have been rolled back.',
                { originalError: error instanceof Error ? error.message : 'Unknown error' }
            );
        }

        // Step 4: Send email notification (non-blocking, failures don't rollback)
        try {
            await sendRoleChangeEmail({
                recipientEmail: targetUser.Data.email || '',
                recipientName: targetUser.Data.name || targetUser.Data.email || 'User',
                oldRole: oldRole as UserRole,
                newRole: 'user',
                changedBy: currentUser.attributes?.given_name || currentUser.email,
                changedByEmail: currentUser.email,
            });

            logger.info('Role revocation email sent', {
                operationId,
                userId: validatedInput.userId,
            });
        } catch (emailError) {
            // Log the error but don't fail the role revocation
            logger.warn('Failed to send role revocation email', {
                operationId,
                userId: validatedInput.userId,
                error: emailError instanceof Error ? emailError.message : 'Unknown error',
            });
        }

        const duration = Date.now() - startTime;
        logger.info('Role revocation completed successfully', {
            operationId,
            userId: validatedInput.userId,
            oldRole,
            duration,
        });

        return {
            success: true,
            message: 'Role revoked successfully',
        };
    } catch (error) {
        const duration = Date.now() - startTime;

        if (error instanceof RoleManagementError) {
            logger.error('Role revocation failed', undefined, {
                operationId,
                userId: input.userId,
                code: error.code,
                message: error.message,
                context: error.context,
                duration,
                rollbackState,
            });

            return {
                success: false,
                message: error.userMessage,
                error: error.code,
            };
        }

        // Handle validation errors
        if (error instanceof z.ZodError) {
            logger.error('Invalid input for role revocation', undefined, {
                operationId,
                userId: input.userId,
                validationErrors: error.errors,
                duration,
            });

            return {
                success: false,
                message: 'Invalid input',
                error: error.errors.map(e => e.message).join(', '),
            };
        }

        // Handle unexpected errors
        logger.error('Unexpected error during role revocation', error as Error, {
            operationId,
            userId: input.userId,
            duration,
            rollbackState,
        });

        return {
            success: false,
            message: 'Failed to revoke role',
            error: 'An unexpected error occurred. Please try again.',
        };
    }
}

/**
 * Gets the audit log of role changes
 * Only callable by SuperAdmins
 * 
 * TODO (Task 4.1): Implement the full logic
 */
export async function getAuditLog(filters: AuditLogFilters): Promise<{
    success: boolean;
    data?: { logs: any[]; lastKey?: string };
    error?: string;
}> {
    try {
        // Validate input
        const validatedFilters = auditLogFiltersSchema.parse(filters);

        // Get current user and verify SuperAdmin access
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return {
                success: false,
                error: 'You must be signed in to perform this action',
            };
        }

        // TODO (Task 4.1): Implement authorization and query logic

        return {
            success: true,
            data: { logs: [], lastKey: undefined },
        };
    } catch (error) {
        logger.error('Failed to get audit log', error as Error);

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Gets all users with their roles
 * Only callable by Admins and SuperAdmins
 * 
 * TODO (Task 4.1): Implement the full logic
 */
export async function getAllUsers(options?: {
    limit?: number;
    lastKey?: string;
}): Promise<{
    success: boolean;
    data?: { users: any[]; lastKey?: string };
    error?: string;
}> {
    try {
        // Get current user and verify Admin access
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return {
                success: false,
                error: 'You must be signed in to perform this action',
            };
        }

        // TODO (Task 4.1): Implement authorization and query logic

        return {
            success: true,
            data: { users: [], lastKey: undefined },
        };
    } catch (error) {
        logger.error('Failed to get users', error as Error);

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Rollback helper functions for error recovery
 */

/**
 * Rolls back a Cognito role update
 * Attempts to restore the previous role in Cognito
 */
async function rollbackCognitoUpdate(
    userId: string,
    previousRole: string,
    operationId: string
): Promise<void> {
    try {
        logger.warn('Rolling back Cognito update', {
            operationId,
            userId,
            previousRole,
        });

        const cognitoClient = getCognitoClient();
        await cognitoClient.updateUserRole(userId, previousRole as UserRole);

        logger.info('Cognito rollback successful', {
            operationId,
            userId,
            restoredRole: previousRole,
        });
    } catch (rollbackError) {
        // Log critical error - manual intervention may be required
        logger.error('CRITICAL: Cognito rollback failed', rollbackError as Error, {
            operationId,
            userId,
            previousRole,
            severity: 'CRITICAL',
            requiresManualIntervention: true,
        });

        // Don't throw - we want to continue with other rollback attempts
    }
}

/**
 * Rolls back a DynamoDB role update
 * Attempts to restore the previous role in DynamoDB
 */
async function rollbackDynamoDBUpdate(
    userId: string,
    previousRole: string,
    assignedBy: string,
    operationId: string
): Promise<void> {
    try {
        logger.warn('Rolling back DynamoDB update', {
            operationId,
            userId,
            previousRole,
        });

        const repository = getRepository();
        await repository.updateUserRole(userId, previousRole, assignedBy);

        logger.info('DynamoDB rollback successful', {
            operationId,
            userId,
            restoredRole: previousRole,
        });
    } catch (rollbackError) {
        // Log critical error - manual intervention may be required
        logger.error('CRITICAL: DynamoDB rollback failed', rollbackError as Error, {
            operationId,
            userId,
            previousRole,
            severity: 'CRITICAL',
            requiresManualIntervention: true,
        });

        // Don't throw - we want to log the error but not fail the overall operation
    }
}
