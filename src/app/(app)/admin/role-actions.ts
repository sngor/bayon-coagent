'use server';

import { getRepository } from '@/aws/dynamodb/repository';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { RoleAuditLog } from '@/aws/dynamodb/admin-types';
import { DynamoDBKey } from '@/aws/dynamodb/types';

/**
 * Server action to get role audit logs
 * Only accessible by SuperAdmins
 */
export async function getRoleAuditLog(filters: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    lastKey?: string;
}): Promise<{
    success: boolean;
    data?: { logs: RoleAuditLog[]; lastKey?: string };
    error?: string;
}> {
    try {
        // 1. Authenticate and authorize
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        // Check if user has SuperAdmin role
        const repository = getRepository();
        const profileKeys = { PK: `USER#${currentUser.id}`, SK: 'PROFILE' };
        const profile = await repository.get<any>(profileKeys.PK, profileKeys.SK);

        if (!profile || profile.role !== 'superadmin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        // 2. Build query options
        const queryOptions: any = {
            limit: filters.limit || 100,
        };

        // Parse lastKey if provided
        if (filters.lastKey) {
            try {
                queryOptions.exclusiveStartKey = JSON.parse(filters.lastKey);
            } catch (error) {
                console.error('Failed to parse lastKey:', error);
            }
        }

        // Add date filters if provided
        if (filters.startDate) {
            queryOptions.startDate = new Date(filters.startDate).getTime();
        }
        if (filters.endDate) {
            queryOptions.endDate = new Date(filters.endDate).getTime();
        }

        // 3. Query audit logs
        const result = await repository.queryRoleAuditLogs({
            userId: filters.userId,
            ...queryOptions,
        });

        // 4. Serialize lastKey for client
        const lastKey = result.lastEvaluatedKey
            ? JSON.stringify(result.lastEvaluatedKey)
            : undefined;

        return {
            success: true,
            data: {
                logs: result.items as RoleAuditLog[],
                lastKey,
            },
        };
    } catch (error: any) {
        console.error('Error fetching role audit logs:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch audit logs',
        };
    }
}
