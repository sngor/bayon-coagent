'use server';

import { getRepository } from '@/aws/dynamodb/repository';
import { checkAdminStatusAction } from '@/app/actions';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { DynamoDBKey } from '@/aws/dynamodb/types';
import { FeatureToggle } from '@/lib/feature-toggles';
import { revalidatePath } from 'next/cache';

export async function getUsersListAction(
    limit: number = 50,
    lastEvaluatedKey?: DynamoDBKey
): Promise<{
    message: string;
    data: any[];
    lastEvaluatedKey?: DynamoDBKey;
    errors: any;
}> {
    try {
        // 1. Check Admin
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', data: [], errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', data: [], errors: {} };

        // 2. Scan for profiles
        const repository = getRepository();

        // Scan for items where SK = 'PROFILE'
        const result = await repository.scan({
            limit,
            exclusiveStartKey: lastEvaluatedKey,
            filterExpression: 'SK = :sk',
            expressionAttributeValues: {
                ':sk': 'PROFILE'
            }
        });

        return {
            message: 'success',
            data: result.items,
            lastEvaluatedKey: result.lastEvaluatedKey,
            errors: {},
        };
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return {
            message: 'Failed to fetch users',
            data: [],
            errors: { system: error.message },
        };
    }
}

export async function getAdminDashboardStats() {
    try {
        const repository = getRepository();

        // 1. Users Count
        const usersResult = await repository.scan({
            filterExpression: 'SK = :sk',
            expressionAttributeValues: { ':sk': 'PROFILE' }
        });
        const totalUsers = usersResult.count;

        // 2. Feedback Count
        const feedbackResult = await repository.query('FEEDBACK', undefined, { limit: 1000 });
        const totalFeedback = feedbackResult.count;
        const pendingFeedback = feedbackResult.items.filter((item: any) => item.status === 'submitted').length;

        // 3. AI Requests (Mock for now)
        const totalAiRequests = 0;

        return {
            message: 'success',
            data: {
                totalUsers,
                totalFeedback,
                pendingFeedback,
                totalAiRequests
            },
            errors: {}
        };
    } catch (error: any) {
        console.error('Error fetching admin stats:', error);
        return {
            message: 'Failed to fetch stats',
            data: null,
            errors: { system: error.message }
        };
    }
}

// --- Feature Management Actions ---

export async function getFeaturesAction(): Promise<{
    message: string;
    data: FeatureToggle[];
    errors: any;
}> {
    try {
        const repository = getRepository();
        // Assuming we store features with PK starting with 'FEATURE#' and SK = 'CONFIG'
        // Since we don't have a direct way to query by prefix on PK without GSI, 
        // and we might not have many features, we can scan or use a known list.
        // For now, let's assume we store them in a specific partition or use scan.
        // A better approach for a small number of features is to store them all in one item or use a GSI.
        // Let's use a scan for now as features are few.

        const result = await repository.scan({
            filterExpression: 'begins_with(PK, :pk) AND SK = :sk',
            expressionAttributeValues: {
                ':pk': 'FEATURE#',
                ':sk': 'CONFIG'
            }
        });

        return {
            message: 'success',
            data: result.items as FeatureToggle[],
            errors: {}
        };
    } catch (error: any) {
        console.error('Error fetching features:', error);
        return {
            message: 'Failed to fetch features',
            data: [],
            errors: { system: error.message }
        };
    }
}

export async function createFeatureAction(prevState: any, formData: FormData): Promise<{
    message: string;
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', errors: {} };

        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const category = formData.get('category') as 'hub' | 'feature';
        const icon = formData.get('icon') as string;
        const enabled = formData.get('enabled') === 'true';
        const status = (formData.get('status') as 'enabled' | 'disabled' | 'beta' | 'development') || 'enabled';
        const rollout = parseInt(formData.get('rollout') as string || '0', 10);

        if (!id || !name) {
            return { message: 'Missing required fields', errors: {} };
        }

        const repository = getRepository();
        const feature: FeatureToggle = {
            id,
            name,
            description,
            category,
            icon,
            enabled,
            dependencies: [],
            status,
            rollout,
            users: 0
        };

        await repository.create(`FEATURE#${id}`, 'CONFIG', 'FeatureToggle', feature);

        revalidatePath('/super-admin/features');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error creating feature:', error);
        return { message: 'Failed to create feature', errors: { system: error.message } };
    }
}

export async function updateFeatureAction(prevState: any, formData: FormData): Promise<{
    message: string;
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', errors: {} };

        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const category = formData.get('category') as 'hub' | 'feature';
        const icon = formData.get('icon') as string;

        // Handle enabled state carefully - if it's not in formData, it might be unchecked or not sent
        // But for update, we usually want to be explicit. 
        // Let's assume the form sends 'true' or 'false' string.
        const enabledStr = formData.get('enabled');
        const enabled = enabledStr === 'true';

        const status = (formData.get('status') as 'enabled' | 'disabled' | 'beta' | 'development') || 'enabled';
        const rollout = parseInt(formData.get('rollout') as string || '0', 10);

        if (!id) {
            return { message: 'Missing feature ID', errors: {} };
        }

        const repository = getRepository();

        const updates: Partial<FeatureToggle> = {
            name,
            description,
            category,
            icon,
            enabled,
            status,
            rollout
        };

        await repository.update(`FEATURE#${id}`, 'CONFIG', updates);

        revalidatePath('/super-admin/features');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error updating feature:', error);
        return { message: 'Failed to update feature', errors: { system: error.message } };
    }
}

export async function toggleFeatureAction(featureId: string, enabled: boolean): Promise<{
    message: string;
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', errors: {} };

        const repository = getRepository();
        await repository.update(`FEATURE#${featureId}`, 'CONFIG', { enabled });

        revalidatePath('/super-admin/features');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error toggling feature:', error);
        return { message: 'Failed to toggle feature', errors: { system: error.message } };
    }
}

export async function deleteFeatureAction(featureId: string): Promise<{
    message: string;
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', errors: {} };

        const repository = getRepository();
        await repository.delete(`FEATURE#${featureId}`, 'CONFIG');

        revalidatePath('/super-admin/features');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error deleting feature:', error);
        return { message: 'Failed to delete feature', errors: { system: error.message } };
    }
}
