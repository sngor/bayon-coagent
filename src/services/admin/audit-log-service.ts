/**
 * Audit Log Service
 * 
 * Handles comprehensive audit logging for all administrative actions.
 * Ensures immutability, tracks IP addresses and user agents, and provides
 * filtering and export capabilities.
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import { getAdminAuditLogKeys } from '@/aws/dynamodb';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogEntry {
    auditId: string;
    timestamp: number;
    adminId: string;
    adminEmail: string;
    adminRole: 'admin' | 'superadmin';
    actionType: string;
    resourceType: string;
    resourceId: string;
    description: string;
    beforeValue?: any;
    afterValue?: any;
    ipAddress: string;
    userAgent: string;
    metadata?: Record<string, any>;
}

export interface AuditLogFilter {
    actionType?: string;
    adminId?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    lastKey?: string;
}

export class AuditLogService {
    private repository: DynamoDBRepository;

    constructor() {
        this.repository = new DynamoDBRepository();
    }

    /**
     * Creates an immutable audit log entry
     * This should be called for all administrative actions
     */
    async createAuditLog(
        entry: Omit<AuditLogEntry, 'auditId' | 'timestamp'>
    ): Promise<AuditLogEntry> {
        const auditId = uuidv4();
        const timestamp = Date.now();
        const date = new Date(timestamp).toISOString().split('T')[0]; // YYYY-MM-DD

        const keys = getAdminAuditLogKeys(
            date,
            auditId,
            timestamp,
            entry.adminId,
            entry.actionType
        );

        const fullEntry: AuditLogEntry = {
            ...entry,
            auditId,
            timestamp,
        };

        // Store audit log entry
        // Note: We use put directly to ensure immutability (no updates allowed)
        const now = Date.now();
        await this.repository.put({
            PK: keys.PK,
            SK: keys.SK,
            EntityType: 'AuditLog',
            Data: fullEntry,
            CreatedAt: now,
            UpdatedAt: now,
            GSI1PK: keys.GSI1PK,
            GSI1SK: keys.GSI1SK,
            GSI2PK: keys.GSI2PK,
            GSI2SK: keys.GSI2SK,
        });

        return fullEntry;
    }

    /**
     * Gets audit logs with filtering and pagination
     */
    async getAuditLog(filter?: AuditLogFilter): Promise<{
        entries: AuditLogEntry[];
        lastKey?: string;
    }> {
        const limit = filter?.limit || 50;
        const entries: AuditLogEntry[] = [];

        // If filtering by admin, use GSI1
        if (filter?.adminId) {
            const keys = getAdminAuditLogKeys('', '', 0, filter.adminId);
            const result = await this.repository.query(
                keys.GSI1PK!,
                undefined,
                {
                    indexName: 'GSI1',
                    limit,
                    scanIndexForward: false, // Most recent first
                }
            );

            entries.push(...result.items as AuditLogEntry[]);
        }
        // If filtering by action type, use GSI2
        else if (filter?.actionType) {
            const keys = getAdminAuditLogKeys('', '', 0, undefined, filter.actionType);
            const result = await this.repository.query(
                keys.GSI2PK!,
                undefined,
                {
                    indexName: 'GSI2',
                    limit,
                    scanIndexForward: false, // Most recent first
                }
            );

            entries.push(...result.items as AuditLogEntry[]);
        }
        // Otherwise, query by date range
        else {
            const startDate = filter?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
            const endDate = filter?.endDate || new Date();

            // Query each day in the range
            const currentDate = new Date(startDate);
            while (currentDate <= endDate && entries.length < limit) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const keys = getAdminAuditLogKeys(dateStr, '', 0);

                const result = await this.repository.query(
                    keys.PK,
                    undefined,
                    {
                        limit: limit - entries.length,
                        scanIndexForward: false, // Most recent first
                    }
                );

                entries.push(...result.items as AuditLogEntry[]);

                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        // Apply additional filters in memory
        let filteredEntries = entries;

        if (filter?.actionType) {
            filteredEntries = filteredEntries.filter(
                entry => entry.actionType === filter.actionType
            );
        }

        if (filter?.startDate) {
            const startTime = filter.startDate.getTime();
            filteredEntries = filteredEntries.filter(
                entry => entry.timestamp >= startTime
            );
        }

        if (filter?.endDate) {
            const endTime = filter.endDate.getTime();
            filteredEntries = filteredEntries.filter(
                entry => entry.timestamp <= endTime
            );
        }

        // Sort by timestamp (most recent first)
        filteredEntries.sort((a, b) => b.timestamp - a.timestamp);

        // Apply limit
        const limitedEntries = filteredEntries.slice(0, limit);

        return {
            entries: limitedEntries,
            lastKey: limitedEntries.length >= limit ? 'has-more' : undefined,
        };
    }

    /**
     * Exports audit logs as JSON or CSV
     */
    async exportAuditLog(
        filter?: AuditLogFilter,
        format: 'json' | 'csv' = 'json'
    ): Promise<string> {
        // Get all entries (no limit)
        const allEntries: AuditLogEntry[] = [];
        let hasMore = true;
        let currentFilter = { ...filter, limit: 100 };

        while (hasMore) {
            const result = await this.getAuditLog(currentFilter);
            allEntries.push(...result.entries);
            hasMore = !!result.lastKey;

            if (hasMore) {
                currentFilter.lastKey = result.lastKey;
            }
        }

        if (format === 'json') {
            return JSON.stringify(allEntries, null, 2);
        } else {
            // CSV format
            const headers = [
                'Audit ID',
                'Timestamp',
                'Date/Time',
                'Admin ID',
                'Admin Email',
                'Admin Role',
                'Action Type',
                'Resource Type',
                'Resource ID',
                'Description',
                'Before Value',
                'After Value',
                'IP Address',
                'User Agent',
            ];

            const rows = allEntries.map(entry => [
                entry.auditId,
                entry.timestamp.toString(),
                new Date(entry.timestamp).toISOString(),
                entry.adminId,
                entry.adminEmail,
                entry.adminRole,
                entry.actionType,
                entry.resourceType,
                entry.resourceId,
                entry.description,
                entry.beforeValue ? JSON.stringify(entry.beforeValue) : '',
                entry.afterValue ? JSON.stringify(entry.afterValue) : '',
                entry.ipAddress,
                entry.userAgent,
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row =>
                    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
                ),
            ].join('\n');

            return csvContent;
        }
    }

    /**
     * Gets audit log statistics
     */
    async getAuditLogStats(
        startDate: Date,
        endDate: Date
    ): Promise<{
        totalActions: number;
        actionsByType: Record<string, number>;
        actionsByAdmin: Record<string, number>;
        actionsByResource: Record<string, number>;
    }> {
        const result = await this.getAuditLog({
            startDate,
            endDate,
            limit: 10000, // Get a large sample
        });

        const stats = {
            totalActions: result.entries.length,
            actionsByType: {} as Record<string, number>,
            actionsByAdmin: {} as Record<string, number>,
            actionsByResource: {} as Record<string, number>,
        };

        result.entries.forEach(entry => {
            // Count by action type
            stats.actionsByType[entry.actionType] =
                (stats.actionsByType[entry.actionType] || 0) + 1;

            // Count by admin
            const adminKey = `${entry.adminEmail} (${entry.adminRole})`;
            stats.actionsByAdmin[adminKey] =
                (stats.actionsByAdmin[adminKey] || 0) + 1;

            // Count by resource type
            stats.actionsByResource[entry.resourceType] =
                (stats.actionsByResource[entry.resourceType] || 0) + 1;
        });

        return stats;
    }

    /**
     * Helper method to log user management actions
     */
    async logUserAction(
        adminId: string,
        adminEmail: string,
        adminRole: 'admin' | 'superadmin',
        action: 'create' | 'update' | 'delete' | 'role_change',
        userId: string,
        description: string,
        beforeValue?: any,
        afterValue?: any,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        await this.createAuditLog({
            adminId,
            adminEmail,
            adminRole,
            actionType: `user_${action}`,
            resourceType: 'user',
            resourceId: userId,
            description,
            beforeValue,
            afterValue,
            ipAddress: ipAddress || 'unknown',
            userAgent: userAgent || 'unknown',
        });
    }

    /**
     * Helper method to log content moderation actions
     */
    async logContentAction(
        adminId: string,
        adminEmail: string,
        adminRole: 'admin' | 'superadmin',
        action: 'approve' | 'flag' | 'hide' | 'delete',
        contentId: string,
        description: string,
        beforeValue?: any,
        afterValue?: any,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        await this.createAuditLog({
            adminId,
            adminEmail,
            adminRole,
            actionType: `content_${action}`,
            resourceType: 'content',
            resourceId: contentId,
            description,
            beforeValue,
            afterValue,
            ipAddress: ipAddress || 'unknown',
            userAgent: userAgent || 'unknown',
        });
    }

    /**
     * Helper method to log configuration changes
     */
    async logConfigAction(
        adminId: string,
        adminEmail: string,
        adminRole: 'admin' | 'superadmin',
        action: 'update' | 'create' | 'delete',
        configType: 'feature_flag' | 'setting' | 'integration',
        configId: string,
        description: string,
        beforeValue?: any,
        afterValue?: any,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        await this.createAuditLog({
            adminId,
            adminEmail,
            adminRole,
            actionType: `config_${action}`,
            resourceType: configType,
            resourceId: configId,
            description,
            beforeValue,
            afterValue,
            ipAddress: ipAddress || 'unknown',
            userAgent: userAgent || 'unknown',
        });
    }

    /**
     * Helper method to log support ticket actions
     */
    async logTicketAction(
        adminId: string,
        adminEmail: string,
        adminRole: 'admin' | 'superadmin',
        action: 'create' | 'update' | 'close' | 'assign',
        ticketId: string,
        description: string,
        beforeValue?: any,
        afterValue?: any,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        await this.createAuditLog({
            adminId,
            adminEmail,
            adminRole,
            actionType: `ticket_${action}`,
            resourceType: 'support_ticket',
            resourceId: ticketId,
            description,
            beforeValue,
            afterValue,
            ipAddress: ipAddress || 'unknown',
            userAgent: userAgent || 'unknown',
        });
    }

    /**
     * Helper method to log billing actions
     */
    async logBillingAction(
        adminId: string,
        adminEmail: string,
        adminRole: 'admin' | 'superadmin',
        action: 'trial_extension' | 'refund' | 'subscription_cancel',
        userId: string,
        description: string,
        beforeValue?: any,
        afterValue?: any,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        await this.createAuditLog({
            adminId,
            adminEmail,
            adminRole,
            actionType: `billing_${action}`,
            resourceType: 'billing',
            resourceId: userId,
            description,
            beforeValue,
            afterValue,
            ipAddress: ipAddress || 'unknown',
            userAgent: userAgent || 'unknown',
        });
    }
}

// Export singleton instance
export const auditLogService = new AuditLogService();
