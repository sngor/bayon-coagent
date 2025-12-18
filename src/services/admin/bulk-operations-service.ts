/**
 * Bulk Operations Service
 * 
 * Handles bulk operations on users including email sending, data export,
 * and role changes. Provides progress tracking, result reporting, and
 * performance optimization through batching and concurrency control.
 * 
 * Features:
 * - Batch processing for large operations
 * - Progress tracking with time estimates
 * - Retry logic with exponential backoff
 * - Input validation and error handling
 * - Concurrent processing with rate limiting
 * - Operation cancellation support
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import { getProfileKeys } from '@/aws/dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { getConfig, getAWSCredentials } from '@/aws/config';


export interface BulkOperationFailure {
    itemId: string;
    error: string;
}

export interface BulkOperationResult {
    operationId: string;
    totalItems: number;
    successCount: number;
    failureCount: number;
    failures: BulkOperationFailure[];
    startedAt: number;
    completedAt: number;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    progressPercentage?: number;
    estimatedTimeRemaining?: number;
}

export interface BulkEmailTemplate {
    subject: string;
    body: string;
    variables?: Record<string, string>;
}

export interface UserProfile {
    email: string;
    name?: string;
    role?: 'agent' | 'admin' | 'super_admin';
    [key: string]: any;
}

export class BulkOperationsService {
    private repository: DynamoDBRepository;
    private sesClient: SESClient;
    private readonly BATCH_SIZE = 50; // Process in batches to avoid overwhelming services
    private readonly MAX_CONCURRENT_OPERATIONS = 10;

    constructor() {
        this.repository = new DynamoDBRepository();

        const config = getConfig();
        const credentials = getAWSCredentials();

        const clientConfig: any = { region: config.region };
        if (credentials && credentials.accessKeyId && credentials.secretAccessKey) {
            clientConfig.credentials = credentials;
        }

        this.sesClient = new SESClient(clientConfig);
    }

    /**
     * Sends bulk emails to multiple users with template support
     */
    async sendBulkEmail(
        userIds: string[],
        template: BulkEmailTemplate,
        fromEmail: string = 'noreply@bayoncoagent.com'
    ): Promise<BulkOperationResult> {
        // Input validation
        if (!userIds?.length) {
            throw new Error('User IDs array cannot be empty');
        }
        
        if (!template?.subject?.trim() || !template?.body?.trim()) {
            throw new Error('Email template must have both subject and body');
        }
        
        if (userIds.length > 1000) {
            throw new Error('Bulk email operations are limited to 1000 users per batch');
        }
        const result = this.initializeOperationResult(`bulk_email_${Date.now()}`, userIds.length);
        
        try {
            const userProfiles = await this.fetchUserProfiles(userIds);
            
            // Process in batches for better performance and rate limiting
            const batches = this.createBatches(userIds, this.BATCH_SIZE);
            
            for (const batch of batches) {
                const batchPromises = batch.map(userId => 
                    this.processSingleEmail(userId, userProfiles, template, fromEmail, result)
                );
                
                // Process batch with limited concurrency
                await this.processConcurrently(batchPromises, this.MAX_CONCURRENT_OPERATIONS);
            }
            
            result.status = 'completed';
        } catch (error: any) {
            console.error('Bulk email operation failed:', error);
            result.status = 'failed';
        }

        result.completedAt = Date.now();
        await this.storeOperationResult(result);
        return result;
    }

    /**
     * Processes a single email within a bulk operation
     */
    private async processSingleEmail(
        userId: string,
        userProfiles: Map<string, any>,
        template: BulkEmailTemplate,
        fromEmail: string,
        result: BulkOperationResult
    ): Promise<void> {
        try {
            const profile = userProfiles.get(userId);

            if (!profile?.email) {
                this.recordFailure(result, userId, 'User profile or email not found');
                return;
            }

            const { subject, body } = this.processEmailTemplate(template, profile);
            await this.sendSingleEmail(fromEmail, profile.email, subject, body);
            
            result.successCount++;
        } catch (error: any) {
            this.recordFailure(result, userId, error.message || 'Failed to send email');
            console.error(`Failed to send email to user ${userId}:`, error);
        }
    }

    /**
     * Processes email template with variable substitution
     */
    private processEmailTemplate(template: BulkEmailTemplate, profile: any): { subject: string; body: string } {
        let { subject, body } = template;

        // Replace custom variables
        if (template.variables) {
            Object.entries(template.variables).forEach(([key, value]) => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                body = body.replace(regex, value);
                subject = subject.replace(regex, value);
            });
        }

        // Replace user-specific variables
        const userName = profile.name || 'User';
        body = body.replace(/{{name}}/g, userName).replace(/{{email}}/g, profile.email);
        subject = subject.replace(/{{name}}/g, userName);

        return { subject, body };
    }

    /**
     * Sends a single email via SES with retry logic
     */
    private async sendSingleEmail(fromEmail: string, toEmail: string, subject: string, body: string): Promise<void> {
        const command = new SendEmailCommand({
            Source: fromEmail,
            Destination: { ToAddresses: [toEmail] },
            Message: {
                Subject: { Data: subject },
                Body: {
                    Html: { Data: body },
                    Text: { Data: body.replace(/<[^>]*>/g, '') }, // Strip HTML for text version
                },
            },
        });

        await this.retryWithBackoff(async () => {
            await this.sesClient.send(command);
        }, 3);
    }

    /**
     * Retry logic with exponential backoff
     */
    private async retryWithBackoff<T>(
        operation: () => Promise<T>,
        maxRetries: number,
        baseDelay: number = 1000
    ): Promise<T> {
        let lastError: Error;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error: any) {
                lastError = error;
                
                if (attempt === maxRetries) {
                    throw lastError;
                }
                
                // Exponential backoff with jitter
                const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw lastError!;
    }

    /**
     * Exports user data in bulk with field selection
     */
    async exportUserData(
        userIds: string[],
        fields: string[]
    ): Promise<BulkOperationResult & { csvContent?: string }> {
        // Input validation
        if (!userIds?.length) {
            throw new Error('User IDs array cannot be empty');
        }
        
        if (!fields?.length) {
            throw new Error('Fields array cannot be empty');
        }

        const result = {
            ...this.initializeOperationResult(`bulk_export_${Date.now()}`, userIds.length),
            csvContent: undefined as string | undefined,
        };
        
        result.status = 'in_progress';

        try {
            const userProfiles = await this.fetchUserProfiles(userIds);
            const csvRows: string[][] = [];

            // Add header row
            csvRows.push(fields);

            // Process users in batches
            const batches = this.createBatches(userIds, this.BATCH_SIZE);
            
            for (const batch of batches) {
                for (const userId of batch) {
                    try {
                        const profile = userProfiles.get(userId);

                        if (!profile) {
                            this.recordFailure(result, userId, 'User profile not found');
                            continue;
                        }

                        const row = fields.map(field => {
                            const value = this.getFieldValue(profile, field);
                            return value !== null && value !== undefined ? String(value) : '';
                        });

                        csvRows.push(row);
                        result.successCount++;
                    } catch (error: any) {
                        this.recordFailure(result, userId, error.message || 'Failed to export user data');
                    }
                }
                
                this.updateProgress(result);
            }

            // Generate CSV content with proper escaping
            result.csvContent = csvRows
                .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                .join('\n');

            result.status = 'completed';
        } catch (error: any) {
            console.error('Error exporting user data:', error);
            result.status = 'failed';
            this.recordFailure(result, 'all', error.message || 'Failed to export data');
        }

        result.completedAt = Date.now();
        await this.storeOperationResult(result);
        return result;
    }

    /**
     * Performs bulk role changes (SuperAdmin only)
     */
    async bulkRoleChange(
        userIds: string[],
        newRole: 'agent' | 'admin' | 'super_admin',
        adminId: string
    ): Promise<BulkOperationResult> {
        // Input validation
        if (!userIds?.length) {
            throw new Error('User IDs array cannot be empty');
        }
        
        if (!['agent', 'admin', 'super_admin'].includes(newRole)) {
            throw new Error('Invalid role specified');
        }
        
        if (!adminId?.trim()) {
            throw new Error('Admin ID is required for audit logging');
        }

        const result = this.initializeOperationResult(`bulk_role_change_${Date.now()}`, userIds.length);
        result.status = 'in_progress';

        try {
            // Process in batches for better performance
            const batches = this.createBatches(userIds, this.BATCH_SIZE);
            
            for (const batch of batches) {
                const batchPromises = batch.map(userId => 
                    this.processSingleRoleChange(userId, newRole, adminId, result)
                );
                
                await this.processConcurrently(batchPromises, this.MAX_CONCURRENT_OPERATIONS);
                this.updateProgress(result);
            }
            
            result.status = 'completed';
        } catch (error: any) {
            console.error('Bulk role change operation failed:', error);
            result.status = 'failed';
        }

        result.completedAt = Date.now();
        await this.storeOperationResult(result);
        return result;
    }

    /**
     * Processes a single role change within a bulk operation
     */
    private async processSingleRoleChange(
        userId: string,
        newRole: 'agent' | 'admin' | 'super_admin',
        adminId: string,
        result: BulkOperationResult
    ): Promise<void> {
        try {
            const profileKeys = getProfileKeys(userId);
            const profile = await this.repository.get<UserProfile>(profileKeys.PK, profileKeys.SK);

            if (!profile) {
                this.recordFailure(result, userId, 'User profile not found');
                return;
            }

            // Update role
            await this.repository.update(profileKeys.PK, profileKeys.SK, {
                role: newRole,
                updatedAt: new Date().toISOString(),
            });

            // Create audit log entry
            await this.createAuditLog({
                action: 'bulk_role_change',
                adminId,
                targetUserId: userId,
                oldValue: profile.role,
                newValue: newRole,
                timestamp: Date.now(),
            });

            result.successCount++;
        } catch (error: any) {
            this.recordFailure(result, userId, error.message || 'Failed to update role');
            console.error(`Failed to update role for user ${userId}:`, error);
        }
    }

    /**
     * Gets the status of a bulk operation
     */
    async getOperationStatus(operationId: string): Promise<BulkOperationResult | null> {
        try {
            const result = await this.repository.get<BulkOperationResult>(
                `BULK_OPERATION#${operationId}`,
                'RESULT'
            );
            return result;
        } catch (error) {
            console.error(`Failed to get operation status for ${operationId}:`, error);
            return null;
        }
    }

    /**
     * Gets recent bulk operations with pagination
     */
    async getRecentOperations(
        limit: number = 10,
        lastEvaluatedKey?: string
    ): Promise<{ operations: BulkOperationResult[]; nextKey?: string }> {
        try {
            const queryOptions: any = { 
                limit, 
                scanIndexForward: false 
            };
            
            if (lastEvaluatedKey) {
                queryOptions.exclusiveStartKey = { SK: lastEvaluatedKey };
            }

            const result = await this.repository.query(
                'BULK_OPERATIONS_INDEX',
                undefined,
                queryOptions
            );

            return {
                operations: result.items as BulkOperationResult[],
                nextKey: result.lastEvaluatedKey?.SK,
            };
        } catch (error) {
            console.error('Failed to get recent operations:', error);
            return { operations: [] };
        }
    }

    /**
     * Cancels a pending bulk operation (if supported)
     */
    async cancelOperation(operationId: string): Promise<boolean> {
        try {
            const operation = await this.getOperationStatus(operationId);
            
            if (!operation || operation.status === 'completed' || operation.status === 'failed') {
                return false;
            }

            // Update status to cancelled
            await this.repository.update(
                `BULK_OPERATION#${operationId}`,
                'RESULT',
                {
                    status: 'failed',
                    completedAt: Date.now(),
                    failures: [
                        ...operation.failures,
                        { itemId: 'operation', error: 'Operation cancelled by user' }
                    ]
                }
            );

            return true;
        } catch (error) {
            console.error(`Failed to cancel operation ${operationId}:`, error);
            return false;
        }
    }

    /**
     * Initializes a bulk operation result object
     */
    private initializeOperationResult(operationId: string, totalItems: number): BulkOperationResult {
        return {
            operationId,
            totalItems,
            successCount: 0,
            failureCount: 0,
            failures: [],
            startedAt: Date.now(),
            completedAt: 0,
            status: 'pending',
            progressPercentage: 0,
        };
    }

    /**
     * Updates operation progress
     */
    private updateProgress(result: BulkOperationResult): void {
        const processed = result.successCount + result.failureCount;
        result.progressPercentage = Math.round((processed / result.totalItems) * 100);
        
        if (processed > 0) {
            const avgTimePerItem = (Date.now() - result.startedAt) / processed;
            const remainingItems = result.totalItems - processed;
            result.estimatedTimeRemaining = Math.round(avgTimePerItem * remainingItems);
        }
    }

    /**
     * Records a failure in the operation result
     */
    private recordFailure(result: BulkOperationResult, itemId: string, error: string): void {
        result.failureCount++;
        result.failures.push({ itemId, error });
    }

    /**
     * Creates batches from an array for processing
     */
    private createBatches<T>(items: T[], batchSize: number): T[][] {
        const batches: T[][] = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * Processes promises with limited concurrency
     */
    private async processConcurrently<T>(promises: Promise<T>[], maxConcurrency: number): Promise<T[]> {
        const results: T[] = [];
        
        for (let i = 0; i < promises.length; i += maxConcurrency) {
            const batch = promises.slice(i, i + maxConcurrency);
            const batchResults = await Promise.allSettled(batch);
            
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                } else {
                    console.error(`Promise ${i + index} failed:`, result.reason);
                }
            });
        }
        
        return results;
    }

    /**
     * Helper: Fetches user profiles for multiple users
     */
    private async fetchUserProfiles(userIds: string[]): Promise<Map<string, UserProfile>> {
        const profiles = new Map<string, UserProfile>();

        // Use Promise.allSettled for better performance with concurrent requests
        const profilePromises = userIds.map(async (userId) => {
            try {
                const profileKeys = getProfileKeys(userId);
                const profile = await this.repository.get<UserProfile>(profileKeys.PK, profileKeys.SK);
                return { userId, profile };
            } catch (error) {
                console.error(`Failed to fetch profile for user ${userId}:`, error);
                return { userId, profile: null };
            }
        });

        const results = await Promise.allSettled(profilePromises);
        
        results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.profile) {
                profiles.set(result.value.userId, result.value.profile);
            }
        });

        return profiles;
    }

    /**
     * Helper: Gets a field value from a profile object with safe navigation
     */
    private getFieldValue(profile: UserProfile, field: string): string | null {
        try {
            // Handle nested fields with dot notation
            const parts = field.split('.');
            let value: any = profile;

            for (const part of parts) {
                if (value && typeof value === 'object' && part in value) {
                    value = value[part];
                } else {
                    return null;
                }
            }

            // Handle null/undefined
            if (value === null || value === undefined) {
                return null;
            }

            // Format dates
            if (value instanceof Date) {
                return value.toISOString();
            }

            // Format objects and arrays as JSON
            if (typeof value === 'object') {
                return JSON.stringify(value);
            }

            // Convert to string
            return String(value);
        } catch (error) {
            console.error(`Error extracting field ${field}:`, error);
            return null;
        }
    }

    /**
     * Helper: Stores operation result for tracking
     */
    private async storeOperationResult(result: BulkOperationResult): Promise<void> {
        try {
            await this.repository.put({
                PK: `BULK_OPERATION#${result.operationId}`,
                SK: 'RESULT',
                EntityType: 'BulkOperationResult',
                Data: result,
                CreatedAt: result.startedAt,
                UpdatedAt: result.completedAt,
            });

            // Also store in index for listing
            await this.repository.put({
                PK: 'BULK_OPERATIONS_INDEX',
                SK: `${result.startedAt}#${result.operationId}`,
                EntityType: 'BulkOperationIndex',
                Data: result,
                CreatedAt: result.startedAt,
                UpdatedAt: Date.now(),
            });
        } catch (error) {
            console.error('Failed to store operation result:', error);
        }
    }

    /**
     * Helper: Creates an audit log entry
     */
    private async createAuditLog(entry: {
        action: string;
        adminId: string;
        targetUserId: string;
        oldValue?: any;
        newValue?: any;
        timestamp: number;
    }): Promise<void> {
        try {
            const auditId = `audit_${entry.timestamp}_${Math.random().toString(36).substring(2, 9)}`;

            await this.repository.put({
                PK: `AUDIT_LOG#${entry.adminId}`,
                SK: `${entry.timestamp}#${auditId}`,
                EntityType: 'AuditLog',
                Data: entry,
                GSI1PK: 'AUDIT_LOGS',
                GSI1SK: `${entry.timestamp}#${auditId}`,
                CreatedAt: entry.timestamp,
                UpdatedAt: Date.now(),
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
        }
    }
}

// Export singleton instance
export const bulkOperationsService = new BulkOperationsService();
