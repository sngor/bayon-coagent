/**
 * Bulk Operations Service
 * 
 * Handles bulk operations on users including email sending, data export,
 * and role changes. Provides progress tracking and result reporting.
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import { getProfileKeys } from '@/aws/dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { getConfig, getAWSCredentials } from '@/aws/config';
import { asyncJobService, AsyncJob } from './async-job-service';
import { SSEHelpers } from './websocket-service';

export interface BulkOperationResult {
    operationId: string;
    totalItems: number;
    successCount: number;
    failureCount: number;
    failures: Array<{
        itemId: string;
        error: string;
    }>;
    startedAt: number;
    completedAt: number;
}

export interface BulkEmailTemplate {
    subject: string;
    body: string;
    variables?: Record<string, string>;
}

export class BulkOperationsService {
    private repository: DynamoDBRepository;
    private sesClient: SESClient;

    constructor() {
        this.repository = new DynamoDBRepository();

        const config = getConfig();
        const credentials = getAWSCredentials();

        const clientConfig: any = { region: config.region };
        if (credentials.accessKeyId && credentials.secretAccessKey) {
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
        const operationId = `bulk_email_${Date.now()}`;
        const startedAt = Date.now();

        const result: BulkOperationResult = {
            operationId,
            totalItems: userIds.length,
            successCount: 0,
            failureCount: 0,
            failures: [],
            startedAt,
            completedAt: 0,
        };

        // Fetch user profiles to get email addresses
        const userProfiles = await this.fetchUserProfiles(userIds);

        for (const userId of userIds) {
            try {
                const profile = userProfiles.get(userId);

                if (!profile || !profile.email) {
                    result.failureCount++;
                    result.failures.push({
                        itemId: userId,
                        error: 'User profile or email not found',
                    });
                    continue;
                }

                // Replace variables in template
                let emailBody = template.body;
                let emailSubject = template.subject;

                if (template.variables) {
                    Object.entries(template.variables).forEach(([key, value]) => {
                        emailBody = emailBody.replace(new RegExp(`{{${key}}}`, 'g'), value);
                        emailSubject = emailSubject.replace(new RegExp(`{{${key}}}`, 'g'), value);
                    });
                }

                // Replace user-specific variables
                emailBody = emailBody.replace(/{{name}}/g, profile.name || 'User');
                emailBody = emailBody.replace(/{{email}}/g, profile.email);
                emailSubject = emailSubject.replace(/{{name}}/g, profile.name || 'User');

                // Send email via SES
                const command = new SendEmailCommand({
                    Source: fromEmail,
                    Destination: {
                        ToAddresses: [profile.email],
                    },
                    Message: {
                        Subject: {
                            Data: emailSubject,
                        },
                        Body: {
                            Html: {
                                Data: emailBody,
                            },
                            Text: {
                                Data: emailBody.replace(/<[^>]*>/g, ''), // Strip HTML for text version
                            },
                        },
                    },
                });

                await this.sesClient.send(command);
                result.successCount++;
            } catch (error: any) {
                result.failureCount++;
                result.failures.push({
                    itemId: userId,
                    error: error.message || 'Failed to send email',
                });
                console.error(`Failed to send email to user ${userId}:`, error);
            }
        }

        result.completedAt = Date.now();

        // Store operation result for tracking
        await this.storeOperationResult(result);

        return result;
    }

    /**
     * Exports user data in bulk with field selection
     */
    async exportUserData(
        userIds: string[],
        fields: string[]
    ): Promise<BulkOperationResult & { csvContent?: string }> {
        const operationId = `bulk_export_${Date.now()}`;
        const startedAt = Date.now();

        const result: BulkOperationResult & { csvContent?: string } = {
            operationId,
            totalItems: userIds.length,
            successCount: 0,
            failureCount: 0,
            failures: [],
            startedAt,
            completedAt: 0,
        };

        try {
            // Fetch user profiles
            const userProfiles = await this.fetchUserProfiles(userIds);

            // Build CSV content
            const csvRows: string[][] = [];

            // Add header row
            csvRows.push(fields);

            // Add data rows
            for (const userId of userIds) {
                try {
                    const profile = userProfiles.get(userId);

                    if (!profile) {
                        result.failureCount++;
                        result.failures.push({
                            itemId: userId,
                            error: 'User profile not found',
                        });
                        continue;
                    }

                    const row = fields.map(field => {
                        const value = this.getFieldValue(profile, field);
                        return value !== null && value !== undefined ? String(value) : '';
                    });

                    csvRows.push(row);
                    result.successCount++;
                } catch (error: any) {
                    result.failureCount++;
                    result.failures.push({
                        itemId: userId,
                        error: error.message || 'Failed to export user data',
                    });
                }
            }

            // Generate CSV content
            result.csvContent = csvRows
                .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
                .join('\n');

        } catch (error: any) {
            console.error('Error exporting user data:', error);
            result.failureCount = userIds.length;
            result.failures.push({
                itemId: 'all',
                error: error.message || 'Failed to export data',
            });
        }

        result.completedAt = Date.now();

        // Store operation result
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
        const operationId = `bulk_role_change_${Date.now()}`;
        const startedAt = Date.now();

        const result: BulkOperationResult = {
            operationId,
            totalItems: userIds.length,
            successCount: 0,
            failureCount: 0,
            failures: [],
            startedAt,
            completedAt: 0,
        };

        for (const userId of userIds) {
            try {
                const profileKeys = getProfileKeys(userId);

                // Check if profile exists
                const profile = await this.repository.get<any>(profileKeys.PK, profileKeys.SK);

                if (!profile) {
                    result.failureCount++;
                    result.failures.push({
                        itemId: userId,
                        error: 'User profile not found',
                    });
                    continue;
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
                result.failureCount++;
                result.failures.push({
                    itemId: userId,
                    error: error.message || 'Failed to update role',
                });
                console.error(`Failed to update role for user ${userId}:`, error);
            }
        }

        result.completedAt = Date.now();

        // Store operation result
        await this.storeOperationResult(result);

        return result;
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
     * Gets recent bulk operations
     */
    async getRecentOperations(limit: number = 10): Promise<BulkOperationResult[]> {
        try {
            const result = await this.repository.query(
                'BULK_OPERATIONS_INDEX',
                undefined,
                { limit, scanIndexForward: false }
            );

            return result.items as BulkOperationResult[];
        } catch (error) {
            console.error('Failed to get recent operations:', error);
            return [];
        }
    }

    /**
     * Helper: Fetches user profiles for multiple users
     */
    private async fetchUserProfiles(userIds: string[]): Promise<Map<string, any>> {
        const profiles = new Map<string, any>();

        for (const userId of userIds) {
            try {
                const profileKeys = getProfileKeys(userId);
                const profile = await this.repository.get<any>(profileKeys.PK, profileKeys.SK);

                if (profile) {
                    profiles.set(userId, profile);
                }
            } catch (error) {
                console.error(`Failed to fetch profile for user ${userId}:`, error);
            }
        }

        return profiles;
    }

    /**
     * Helper: Gets a field value from a profile object
     */
    private getFieldValue(profile: any, field: string): any {
        // Handle nested fields with dot notation
        const parts = field.split('.');
        let value = profile;

        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            } else {
                return null;
            }
        }

        // Format dates
        if (value instanceof Date) {
            return value.toISOString();
        }

        // Format objects and arrays
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }

        return value;
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
