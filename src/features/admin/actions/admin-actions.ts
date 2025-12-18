'use server';

import { getRepository } from '@/aws/dynamodb/repository';
import { checkAdminStatusAction } from '@/app/actions';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { DynamoDBKey } from '@/aws/dynamodb/types';
import { FeatureToggle } from '@/lib/feature-toggles';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import {
    Organization,
    OrganizationSettings,
    TeamMember,
    Invitation,
    InvitationStatus,
    generateInvitationToken,
    getInvitationExpirationDate,
    isInvitationExpired
} from '@/lib/types/organization-types';
import {
    getOrganizationKeys,
    getTeamMemberKeys,
    getInvitationKeys,
    getOrganizationMembersQueryKeys,
    getOrganizationInvitationsQueryKeys,
    getInvitationsByEmailQueryKeys,
    getInvitationByTokenQueryKeys,
    getUserOrganizationsQueryKeys
} from '@/aws/dynamodb/organization-keys';
import { getProfileKeys } from '@/aws/dynamodb/keys';
import { getAnnouncementKeys } from '@/aws/dynamodb/extra-keys';
import { sendInvitationEmail } from '@/lib/email-service';
import { analyticsService, PlatformMetrics } from '@/services/admin/analytics-service';
import { announcementService, Announcement, AnnouncementStats } from '@/services/admin/announcement-service';

// ============================================
// Analytics Actions
// ============================================

export async function getPlatformAnalytics(
    startDate: string,
    endDate: string
): Promise<{ success: boolean; data?: PlatformMetrics; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        const metrics = await analyticsService.getPlatformMetrics(start, end);

        return { success: true, data: metrics };
    } catch (error: any) {
        console.error('Error fetching platform analytics:', error);
        return { success: false, error: error.message || 'Failed to fetch analytics' };
    }
}

export async function getFeatureUsageStats(
    startDate: string,
    endDate: string
): Promise<{ success: boolean; data?: Record<string, number>; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        const featureUsage = await analyticsService.getFeatureUsage(start, end);

        return { success: true, data: featureUsage };
    } catch (error: any) {
        console.error('Error fetching feature usage stats:', error);
        return { success: false, error: error.message || 'Failed to fetch feature usage' };
    }
}

// ============================================
// User Management Actions
// ============================================

export async function getUsersListAction(
    accessToken?: string,
    limit: number = 60,
    lastEvaluatedKey?: DynamoDBKey,
    options?: { filterByTeam?: boolean }
): Promise<{
    message: string;
    data: any[];
    lastEvaluatedKey?: DynamoDBKey;
    errors: any;
}> {
    try {
        // 1. Check Admin - try server session first, then fallback to provided token
        let currentUser = await getCurrentUserServer();

        // If no server session but access token provided, validate it directly
        if (!currentUser && accessToken) {
            console.log('[getUsersListAction] No server session, using provided access token...');
            const { getCognitoClient } = await import('@/aws/auth/cognito-client');
            const client = getCognitoClient();
            try {
                currentUser = await client.getCurrentUser(accessToken);
                console.log('[getUsersListAction] User authenticated via access token:', currentUser.id);
            } catch (error) {
                console.error('[getUsersListAction] Failed to validate access token:', error);
            }
        }

        if (!currentUser) {
            console.error('[getUsersListAction] No authentication found');
            return {
                message: 'Not authenticated. Please refresh the page.',
                data: [],
                errors: { auth: 'No valid authentication' }
            };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { message: 'Unauthorized: Admin access required', data: [], errors: {} };
        }

        // 2. Get users from Cognito (source of truth for all registered users)
        const { CognitoIdentityProviderClient, ListUsersCommand } = await import('@aws-sdk/client-cognito-identity-provider');
        const { getConfig, getAWSCredentials } = await import('@/aws/config');

        const config = getConfig();
        const credentials = getAWSCredentials();

        // Build client config
        const clientConfig: any = { region: config.region };
        if (credentials && credentials.accessKeyId && credentials.secretAccessKey) {
            clientConfig.credentials = credentials;
        }

        const cognitoClient = new CognitoIdentityProviderClient(clientConfig);

        const listUsersCommand = new ListUsersCommand({
            UserPoolId: config.cognito.userPoolId,
            Limit: Math.min(limit, 60), // Cognito max is 60
        });

        const cognitoResponse = await cognitoClient.send(listUsersCommand);
        const cognitoUsers = cognitoResponse.Users || [];

        console.log(`[getUsersListAction] Found ${cognitoUsers.length} users in Cognito`);

        // 3. Get profiles from DynamoDB
        const repository = getRepository();
        const profilesResult = await repository.scan({
            filterExpression: 'SK = :sk',
            expressionAttributeValues: {
                ':sk': 'PROFILE'
            }
        });

        // Create a map of userId -> profile
        const profilesMap = new Map();
        profilesResult.items.forEach((profile: any) => {
            if (profile.id) {
                profilesMap.set(profile.id, profile);
            }
        });

        console.log(`[getUsersListAction] Found ${profilesResult.items.length} profiles in DynamoDB`);

        // Get all teams to map team IDs to names
        const teamsResult = await repository.scan({
            filterExpression: 'begins_with(PK, :pk) AND SK = :sk',
            expressionAttributeValues: {
                ':pk': 'TEAM#',
                ':sk': 'CONFIG'
            }
        });
        const teamsMap = new Map();
        teamsResult.items.forEach((team: any) => {
            if (team.id) {
                teamsMap.set(team.id, team.name);
            }
        });

        // 4. Merge Cognito users with DynamoDB profiles
        const mergedUsers = cognitoUsers.map((cognitoUser: any) => {
            const userId = cognitoUser.Username;
            const email = cognitoUser.Attributes?.find((attr: any) => attr.Name === 'email')?.Value || '';
            const emailVerified = cognitoUser.Attributes?.find((attr: any) => attr.Name === 'email_verified')?.Value === 'true';
            const profile = profilesMap.get(userId);

            const teamId = profile?.teamId;
            const teamName = teamId ? teamsMap.get(teamId) : undefined;

            return {
                id: userId,
                email: email,
                emailVerified: emailVerified,
                name: profile?.name || email.split('@')[0] || 'Unknown',
                role: profile?.role || 'agent',
                teamId: teamId,
                teamName: teamName,
                status: cognitoUser.UserStatus === 'CONFIRMED' ? 'active' : 'pending',
                enabled: cognitoUser.Enabled ?? true,
                createdAt: profile?.createdAt || cognitoUser.UserCreateDate?.toISOString() || new Date().toISOString(),
                updatedAt: profile?.updatedAt || cognitoUser.UserLastModifiedDate?.toISOString() || new Date().toISOString(),
                hasProfile: !!profile,
                cognitoStatus: cognitoUser.UserStatus,
            };
        });

        // Filter users based on admin role
        let filteredUsers = mergedUsers;

        // If regular admin (not super_admin) OR explicit filter requested, only show users from their teams
        const shouldFilterByTeam = options?.filterByTeam || adminStatus.role === 'admin';

        if (shouldFilterByTeam) {
            console.log('[getUsersListAction] Filtering for admin:', currentUser.id);

            // Get teams where this admin is the team admin
            const teamsResult = await repository.scan({
                filterExpression: 'begins_with(PK, :pk) AND SK = :sk AND adminId = :adminId',
                expressionAttributeValues: {
                    ':pk': 'TEAM#',
                    ':sk': 'CONFIG',
                    ':adminId': currentUser.id
                }
            });

            const adminTeamIds = teamsResult.items.map((team: any) => team.id);
            console.log('[getUsersListAction] Admin team IDs:', adminTeamIds);
            console.log('[getUsersListAction] Admin team names:', teamsResult.items.map((t: any) => t.name));

            // Filter users to only those in admin's teams
            filteredUsers = mergedUsers.filter(user => {
                const isInTeam = user.teamId && adminTeamIds.includes(user.teamId);
                if (isInTeam) {
                    console.log('[getUsersListAction] Including user:', user.email, 'in team:', user.teamName);
                }
                return isInTeam;
            });

            console.log('[getUsersListAction] Filtered to', filteredUsers.length, 'users in admin teams');
        }

        // Log role distribution for debugging
        const roleCount = filteredUsers.reduce((acc: any, user: any) => {
            const role = user.role || 'user';
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {});
        console.log('[getUsersListAction] Role distribution:', roleCount);
        console.log('[getUsersListAction] Users with profiles:', filteredUsers.filter(u => u.hasProfile).length);

        return {
            message: 'success',
            data: filteredUsers, // Returns filtered users based on admin role
            lastEvaluatedKey: undefined, // Cognito pagination works differently
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

// ============================================
// Team Management Actions
// ============================================

export async function createTeamAction(
    teamName: string,
    teamAdminId: string,
    accessToken?: string
): Promise<{
    message: string;
    data?: any;
    errors: any;
}> {
    try {
        let currentUser = await getCurrentUserServer();

        if (!currentUser && accessToken) {
            const { getCognitoClient } = await import('@/aws/auth/cognito-client');
            const client = getCognitoClient();
            try {
                currentUser = await client.getCurrentUser(accessToken);
            } catch (error) {
                console.error('[createTeamAction] Failed to validate access token:', error);
            }
        }

        if (!currentUser) {
            return { message: 'Not authenticated', errors: {} };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (adminStatus.role !== 'super_admin') {
            return { message: 'Unauthorized: Super Admin access required', errors: {} };
        }

        const repository = getRepository();
        const teamId = `team_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const team = {
            id: teamId,
            name: teamName,
            adminId: teamAdminId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await repository.create(`TEAM#${teamId}`, 'CONFIG', 'Team', team);

        revalidatePath('/super-admin/teams');
        return { message: 'success', data: team, errors: {} };
    } catch (error: any) {
        console.error('Error creating team:', error);
        return { message: 'Failed to create team', errors: { system: error.message } };
    }
}

export async function getTeamsAction(
    accessToken?: string
): Promise<{
    message: string;
    data: any[];
    errors: any;
}> {
    try {
        let currentUser = await getCurrentUserServer();

        if (!currentUser && accessToken) {
            const { getCognitoClient } = await import('@/aws/auth/cognito-client');
            const client = getCognitoClient();
            try {
                currentUser = await client.getCurrentUser(accessToken);
            } catch (error) {
                console.error('[getTeamsAction] Failed to validate access token:', error);
            }
        }

        if (!currentUser) {
            return { message: 'Not authenticated', data: [], errors: {} };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { message: 'Unauthorized', data: [], errors: {} };
        }

        const repository = getRepository();

        // If super admin, get all teams
        let teams = [];
        if (adminStatus.role === 'super_admin') {
            const result = await repository.scan({
                filterExpression: 'begins_with(PK, :pk) AND SK = :sk',
                expressionAttributeValues: {
                    ':pk': 'TEAM#',
                    ':sk': 'CONFIG'
                }
            });
            teams = result.items;
        } else {
            // If regular admin, get only their teams
            const result = await repository.scan({
                filterExpression: 'begins_with(PK, :pk) AND SK = :sk AND adminId = :adminId',
                expressionAttributeValues: {
                    ':pk': 'TEAM#',
                    ':sk': 'CONFIG',
                    ':adminId': currentUser.id
                }
            });
            teams = result.items;
        }

        // Get member counts
        const profilesResult = await repository.scan({
            filterExpression: 'SK = :sk',
            expressionAttributeValues: {
                ':sk': 'PROFILE'
            }
        });

        const memberCounts = new Map<string, number>();
        profilesResult.items.forEach((profile: any) => {
            if (profile.teamId) {
                memberCounts.set(profile.teamId, (memberCounts.get(profile.teamId) || 0) + 1);
            }
        });

        const teamsWithCounts = teams.map((team: any) => ({
            ...team,
            memberCount: memberCounts.get(team.id) || 0
        }));

        return { message: 'success', data: teamsWithCounts, errors: {} };
    } catch (error: any) {
        console.error('Error fetching teams:', error);
        return { message: 'Failed to fetch teams', data: [], errors: { system: error.message } };
    }
}

export async function updateTeamAction(
    teamId: string,
    teamName: string,
    teamAdminId: string,
    accessToken?: string
): Promise<{
    message: string;
    errors: any;
}> {
    try {
        let currentUser = await getCurrentUserServer();

        if (!currentUser && accessToken) {
            const { getCognitoClient } = await import('@/aws/auth/cognito-client');
            const client = getCognitoClient();
            try {
                currentUser = await client.getCurrentUser(accessToken);
            } catch (error) {
                console.error('[updateTeamAction] Failed to validate access token:', error);
            }
        }

        if (!currentUser) {
            return { message: 'Not authenticated', errors: {} };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (adminStatus.role !== 'super_admin') {
            return { message: 'Unauthorized: Super Admin access required', errors: {} };
        }

        const repository = getRepository();
        await repository.update(`TEAM#${teamId}`, 'CONFIG', {
            name: teamName,
            adminId: teamAdminId,
            updatedAt: new Date().toISOString(),
        });

        revalidatePath('/super-admin/teams');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error updating team:', error);
        return { message: 'Failed to update team', errors: { system: error.message } };
    }
}

export async function deleteTeamAction(
    teamId: string,
    accessToken?: string
): Promise<{
    message: string;
    errors: any;
}> {
    try {
        let currentUser = await getCurrentUserServer();

        if (!currentUser && accessToken) {
            const { getCognitoClient } = await import('@/aws/auth/cognito-client');
            const client = getCognitoClient();
            try {
                currentUser = await client.getCurrentUser(accessToken);
            } catch (error) {
                console.error('[deleteTeamAction] Failed to validate access token:', error);
            }
        }

        if (!currentUser) {
            return { message: 'Not authenticated', errors: {} };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (adminStatus.role !== 'super_admin') {
            return { message: 'Unauthorized: Super Admin access required', errors: {} };
        }

        const repository = getRepository();
        await repository.delete(`TEAM#${teamId}`, 'CONFIG');

        revalidatePath('/super-admin/teams');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error deleting team:', error);
        return { message: 'Failed to delete team', errors: { system: error.message } };
    }
}

export async function disableUserAction(
    userId: string,
    disable: boolean,
    accessToken?: string
): Promise<{
    message: string;
    errors: any;
}> {
    try {
        let currentUser = await getCurrentUserServer();

        if (!currentUser && accessToken) {
            const { getCognitoClient } = await import('@/aws/auth/cognito-client');
            const client = getCognitoClient();
            try {
                currentUser = await client.getCurrentUser(accessToken);
            } catch (error) {
                console.error('[disableUserAction] Failed to validate access token:', error);
            }
        }

        if (!currentUser) {
            return { message: 'Not authenticated', errors: {} };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { message: 'Unauthorized: Admin access required', errors: {} };
        }

        // If not super_admin, verify the target user is in the admin's team
        if (adminStatus.role !== 'super_admin') {
            const repository = getRepository();

            // Get user profile to find their team
            const profileKeys = getProfileKeys(userId);
            const userProfile = await repository.get<any>(profileKeys.PK, profileKeys.SK);

            if (!userProfile || !userProfile.teamId) {
                return { message: 'Unauthorized: User not found or not in a team', errors: {} };
            }

            // Get admin's teams
            const teamsResult = await repository.scan({
                filterExpression: 'begins_with(PK, :pk) AND SK = :sk AND adminId = :adminId',
                expressionAttributeValues: {
                    ':pk': 'TEAM#',
                    ':sk': 'CONFIG',
                    ':adminId': currentUser.id
                }
            });

            const adminTeamIds = teamsResult.items.map((t: any) => t.id);

            if (!adminTeamIds.includes(userProfile.teamId)) {
                return { message: 'Unauthorized: You can only manage users in your teams', errors: {} };
            }
        }

        // Disable/Enable user in Cognito
        const { CognitoIdentityProviderClient, AdminDisableUserCommand, AdminEnableUserCommand } = await import('@aws-sdk/client-cognito-identity-provider');
        const { getConfig, getAWSCredentials } = await import('@/aws/config');

        const config = getConfig();
        const credentials = getAWSCredentials();

        const clientConfig: any = { region: config.region };
        if (credentials && credentials.accessKeyId && credentials.secretAccessKey) {
            clientConfig.credentials = credentials;
        }

        const cognitoClient = new CognitoIdentityProviderClient(clientConfig);

        if (disable) {
            const command = new AdminDisableUserCommand({
                UserPoolId: config.cognito.userPoolId,
                Username: userId,
            });
            await cognitoClient.send(command);
        } else {
            const command = new AdminEnableUserCommand({
                UserPoolId: config.cognito.userPoolId,
                Username: userId,
            });
            await cognitoClient.send(command);
        }

        revalidatePath('/super-admin/users');
        revalidatePath('/admin/users');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error disabling/enabling user:', error);
        return { message: 'Failed to update user status', errors: { system: error.message } };
    }
}

export async function updateUserRoleAction(
    userId: string,
    newRole: 'agent' | 'admin' | 'super_admin',
    teamName?: string,
    accessToken?: string
): Promise<{
    message: string;
    errors: any;
}> {
    try {
        // 1. Check Admin - must be super_admin to update roles
        let currentUser = await getCurrentUserServer();

        if (!currentUser && accessToken) {
            const { getCognitoClient } = await import('@/aws/auth/cognito-client');
            const client = getCognitoClient();
            try {
                currentUser = await client.getCurrentUser(accessToken);
            } catch (error) {
                console.error('[updateUserRoleAction] Failed to validate access token:', error);
            }
        }

        if (!currentUser) {
            return { message: 'Not authenticated', errors: {} };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (adminStatus.role !== 'super_admin') {
            return { message: 'Unauthorized: Super Admin access required', errors: {} };
        }

        // 2. Update the user's profile in DynamoDB
        const repository = getRepository();
        const profileKeys = getProfileKeys(userId);

        // Check if profile exists
        const existingProfile = await repository.get<any>(profileKeys.PK, profileKeys.SK);

        if (existingProfile) {
            // Update existing profile
            console.log('[updateUserRoleAction] Updating profile for user:', userId);
            console.log('[updateUserRoleAction] Team name provided:', teamName);

            // Find team ID from team name
            let teamId: string | undefined;
            if (teamName) {
                // Get all teams and find the matching one in code (DynamoDB filter isn't working)
                const allTeamsResult = await repository.scan({
                    filterExpression: 'begins_with(PK, :pk) AND SK = :sk',
                    expressionAttributeValues: {
                        ':pk': 'TEAM#',
                        ':sk': 'CONFIG'
                    }
                });
                console.log('[updateUserRoleAction] All teams in DB:', allTeamsResult.items.map((t: any) => ({ id: t.id, name: t.name })));

                // Find team by name in the results
                const matchingTeam = allTeamsResult.items.find((t: any) => t.name === teamName);
                if (matchingTeam) {
                    teamId = (matchingTeam as any).id;
                    console.log('[updateUserRoleAction] Team ID found:', teamId);
                } else {
                    console.error('[updateUserRoleAction] No team found with name:', teamName);
                    console.error('[updateUserRoleAction] Available team names:', allTeamsResult.items.map((t: any) => t.name));
                }
            }

            const updates: any = {
                role: newRole,
                updatedAt: new Date().toISOString(),
            };
            if (teamName !== undefined) {
                updates.teamId = teamId || null;
                console.log('[updateUserRoleAction] Setting teamId to:', updates.teamId);
            }
            console.log('[updateUserRoleAction] Updates to apply:', updates);
            await repository.update(profileKeys.PK, profileKeys.SK, updates);
            console.log('[updateUserRoleAction] Profile updated successfully');
        } else {
            // Create profile if it doesn't exist (for users who haven't logged in yet)
            // Get user email from Cognito
            const { CognitoIdentityProviderClient, AdminGetUserCommand } = await import('@aws-sdk/client-cognito-identity-provider');
            const { getConfig, getAWSCredentials } = await import('@/aws/config');

            const config = getConfig();
            const credentials = getAWSCredentials();

            const clientConfig: any = { region: config.region };
            if (credentials && credentials.accessKeyId && credentials.secretAccessKey) {
                clientConfig.credentials = credentials;
            }

            const cognitoClient = new CognitoIdentityProviderClient(clientConfig);

            try {
                const getUserCommand = new AdminGetUserCommand({
                    UserPoolId: config.cognito.userPoolId,
                    Username: userId,
                });

                const userResponse = await cognitoClient.send(getUserCommand);
                const email = userResponse.UserAttributes?.find(attr => attr.Name === 'email')?.Value || '';

                // Create new profile
                // Find team ID from team name
                let teamId: string | undefined;
                if (teamName) {
                    const allTeamsResult = await repository.scan({
                        filterExpression: 'begins_with(PK, :pk) AND SK = :sk',
                        expressionAttributeValues: {
                            ':pk': 'TEAM#',
                            ':sk': 'CONFIG'
                        }
                    });
                    const matchingTeam = allTeamsResult.items.find((t: any) => t.name === teamName);
                    if (matchingTeam) {
                        teamId = (matchingTeam as any).id;
                    }
                }

                await repository.create(profileKeys.PK, profileKeys.SK, 'UserProfile', {
                    id: userId,
                    email: email,
                    role: newRole,
                    teamId: teamId || null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });
            } catch (error) {
                console.error('[updateUserRoleAction] Failed to get user from Cognito:', error);
                return { message: 'Failed to get user information', errors: { system: error } };
            }
        }

        revalidatePath('/super-admin/users');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error updating user role:', error);
        return { message: 'Failed to update role', errors: { system: error.message } };
    }
}

export async function getAdminDashboardStats(options?: { filterByTeam?: boolean }) {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', data: null, errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', data: null, errors: {} };

        const repository = getRepository();
        let stats: any = {};

        const shouldFilterByTeam = options?.filterByTeam || adminStatus.role === 'admin';

        if (!shouldFilterByTeam && adminStatus.role === 'super_admin') {
            // 1. Users Count
            const usersResult = await repository.scan({
                filterExpression: 'SK = :sk',
                expressionAttributeValues: { ':sk': 'PROFILE' }
            });
            stats.totalUsers = usersResult.count;

            // 2. Feedback Count
            const feedbackResult = await repository.query('FEEDBACK', undefined, { limit: 1000 });
            stats.totalFeedback = feedbackResult.count;
            stats.pendingFeedback = feedbackResult.items.filter((item: any) => item.status === 'submitted').length;

            // 3. AI Requests & Costs
            // Scan for execution logs (Note: In a high-scale system, this should use a GSI or aggregated metrics table)
            const logsResult = await repository.scan({
                filterExpression: '#type = :type',
                expressionAttributeNames: {
                    '#type': 'type'
                },
                expressionAttributeValues: {
                    ':type': 'execution-log'
                }
            });

            const logs = logsResult.items as any[];
            stats.totalAiRequests = logs.length;

            // Calculate total cost
            let totalCost = 0;
            try {
                const { calculateExecutionCost } = await import('@/aws/bedrock/cost-tracker');
                for (const log of logs) {
                    if (log.tokenUsage && log.modelId) {
                        try {
                            const cost = calculateExecutionCost(log.tokenUsage, log.modelId);
                            totalCost += cost.totalCost;
                        } catch (e) {
                            // Ignore errors for unknown models etc
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to calculate AI costs:', error);
            }
            stats.totalAiCosts = totalCost;

            // 4. Feature Count
            const featuresResult = await repository.scan({
                filterExpression: 'begins_with(PK, :pk) AND SK = :sk',
                expressionAttributeValues: {
                    ':pk': 'FEATURE#',
                    ':sk': 'CONFIG'
                }
            });
            stats.activeFeatures = featuresResult.items.filter((f: any) => f.status === 'enabled').length;
            stats.betaFeatures = featuresResult.items.filter((f: any) => f.status === 'beta').length;

            // 5. Teams Count
            const teamsResult = await repository.scan({
                filterExpression: 'begins_with(PK, :pk) AND SK = :sk',
                expressionAttributeValues: {
                    ':pk': 'TEAM#',
                    ':sk': 'CONFIG'
                }
            });
            stats.totalTeams = teamsResult.count;

            stats.pendingInvitations = 0;
            stats.systemStatus = 'Healthy';
        } else {
            // Regular Admin Stats (or forced team filter)
            const usersList = await getUsersListAction(undefined, undefined, undefined, { filterByTeam: true });
            stats.totalUsers = usersList.message === 'success' ? usersList.data.length : 0;

            const invitations = await getPendingInvitationsAction();
            stats.pendingInvitations = invitations.message === 'success' && invitations.data ? invitations.data.length : 0;

            stats.systemStatus = 'Healthy';
        }

        return {
            message: 'success',
            data: stats,
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

export async function getRecentActivityAction(
    limit: number = 5,
    options?: { filterByTeam?: boolean }
): Promise<{
    message: string;
    data: any[];
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', data: [], errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', data: [], errors: {} };

        const repository = getRepository();

        let users = [];

        const shouldFilterByTeam = options?.filterByTeam || adminStatus.role === 'admin';

        if (!shouldFilterByTeam && adminStatus.role === 'super_admin') {
            const usersResult = await repository.scan({
                limit,
                filterExpression: 'SK = :sk',
                expressionAttributeValues: { ':sk': 'PROFILE' }
            });
            users = usersResult.items;
        } else {
            // For regular admin, get their teams first
            const teamsResult = await repository.scan({
                filterExpression: 'begins_with(PK, :pk) AND SK = :sk AND adminId = :adminId',
                expressionAttributeValues: {
                    ':pk': 'TEAM#',
                    ':sk': 'CONFIG',
                    ':adminId': currentUser.id
                }
            });
            const adminTeamIds = teamsResult.items.map((t: any) => t.id);

            // Then scan users and filter by team
            // Note: In a real app with many users, we should query by GSI or index
            const usersResult = await repository.scan({
                filterExpression: 'SK = :sk',
                expressionAttributeValues: { ':sk': 'PROFILE' }
            });

            users = usersResult.items.filter((u: any) => u.teamId && adminTeamIds.includes(u.teamId));
        }

        // Sort by createdAt descending (client-side since scan doesn't sort)
        const recentUsers = users
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit)
            .map((user: any) => ({
                id: user.id,
                type: 'user_signup',
                description: `New user joined: ${user.email}`,
                timestamp: user.createdAt,
                user: {
                    name: user.name,
                    email: user.email
                }
            }));

        return {
            message: 'success',
            data: recentUsers,
            errors: {}
        };
    } catch (error: any) {
        console.error('Error fetching recent activity:', error);
        return {
            message: 'Failed to fetch activity',
            data: [],
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
            rollout: rollout,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await repository.create(`FEATURE#${id}`, 'CONFIG', 'FeatureToggle', feature);

        revalidatePath('/super-admin/features');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error creating feature:', error);
        return { message: 'Failed to create feature', errors: { system: error.message } };
    }
}

export async function getAgentStatsAction(
    agentId: string,
    accessToken?: string
): Promise<{
    message: string;
    data: any;
    errors: any;
}> {
    try {
        let currentUser = await getCurrentUserServer();

        if (!currentUser && accessToken) {
            const { getCognitoClient } = await import('@/aws/auth/cognito-client');
            const client = getCognitoClient();
            try {
                currentUser = await client.getCurrentUser(accessToken);
            } catch (error) {
                console.error('[getAgentStatsAction] Failed to validate access token:', error);
            }
        }

        if (!currentUser) {
            return { message: 'Not authenticated', data: null, errors: {} };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { message: 'Unauthorized', data: null, errors: {} };
        }

        const repository = getRepository();

        // 1. Get Dashboard Count
        // Query PK: AGENT#<agentId>, SK begins_with DASHBOARD#
        const dashboardsResult = await repository.query(
            `AGENT#${agentId}`,
            'DASHBOARD#'
        );
        const dashboardCount = dashboardsResult.count;

        // 2. Get Last Login (from Profile if available, or just return null for now)
        // We can get the profile to see updated at
        const profileKeys = getProfileKeys(agentId);
        const profile = await repository.get<any>(profileKeys.PK, profileKeys.SK);

        // 3. Get Recent Activity (mock for now or reuse logic if possible)
        // For now, we'll just return the dashboard count and profile info

        return {
            message: 'success',
            data: {
                dashboardCount,
                lastActive: profile?.updatedAt || null,
                profile: profile
            },
            errors: {}
        };
    } catch (error: any) {
        console.error('Error fetching agent stats:', error);
        return {
            message: 'Failed to fetch agent stats',
            data: null,
            errors: { system: error.message }
        };
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
        const enabled = formData.get('enabled') === 'true';
        const status = (formData.get('status') as 'enabled' | 'disabled' | 'beta' | 'development') || 'enabled';
        const rollout = parseInt(formData.get('rollout') as string || '0', 10);

        if (!id || !name) {
            return { message: 'Missing required fields', errors: {} };
        }

        const repository = getRepository();
        await repository.update(`FEATURE#${id}`, 'CONFIG', {
            name,
            description,
            category,
            icon,
            enabled,
            status,
            rollout: rollout
        });

        revalidatePath('/super-admin/features');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error updating feature:', error);
        return { message: 'Failed to update feature', errors: { system: error.message } };
    }
}

export async function toggleFeatureAction(
    featureId: string,
    enabled: boolean
): Promise<{
    message: string;
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', errors: {} };

        const repository = getRepository();
        await repository.update(`FEATURE#${featureId}`, 'CONFIG', {
            enabled,
            updatedAt: new Date().toISOString()
        });

        revalidatePath('/super-admin/features');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error toggling feature:', error);
        return { message: 'Failed to toggle feature', errors: { system: error.message } };
    }
}

export async function deleteFeatureAction(
    featureId: string
): Promise<{
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

export async function createUserAction(
    email: string,
    name: string,
    role: 'agent' | 'admin' | 'super_admin',
    teamId?: string,
    accessToken?: string
): Promise<{
    message: string;
    data?: any;
    errors: any;
}> {
    try {
        // 1. Check Admin - must be super_admin to create users
        let currentUser = await getCurrentUserServer();

        if (!currentUser && accessToken) {
            const { getCognitoClient } = await import('@/aws/auth/cognito-client');
            const client = getCognitoClient();
            try {
                currentUser = await client.getCurrentUser(accessToken);
            } catch (error) {
                console.error('[createUserAction] Failed to validate access token:', error);
            }
        }

        if (!currentUser) {
            return { message: 'Not authenticated', errors: {} };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (adminStatus.role !== 'super_admin') {
            return { message: 'Unauthorized: Super Admin access required', errors: {} };
        }

        // 2. Create user in Cognito
        const { CognitoIdentityProviderClient, AdminCreateUserCommand } = await import('@aws-sdk/client-cognito-identity-provider');
        const { getConfig, getAWSCredentials } = await import('@/aws/config');

        const config = getConfig();
        const credentials = getAWSCredentials();

        const clientConfig: any = { region: config.region };
        if (credentials && credentials.accessKeyId && credentials.secretAccessKey) {
            clientConfig.credentials = credentials;
        }

        const cognitoClient = new CognitoIdentityProviderClient(clientConfig);

        // Generate a temporary password
        const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

        const command = new AdminCreateUserCommand({
            UserPoolId: config.cognito.userPoolId,
            Username: email,
            UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'email_verified', Value: 'true' },
                { Name: 'name', Value: name }
            ],
            TemporaryPassword: tempPassword,
            MessageAction: 'SUPPRESS', // Don't send email automatically, we might want to send a custom one later
        });

        const cognitoResponse = await cognitoClient.send(command);
        const userId = cognitoResponse.User?.Username;

        if (!userId) {
            throw new Error('Failed to get User ID from Cognito response');
        }

        // 3. Create profile in DynamoDB
        const repository = getRepository();
        const profileKeys = getProfileKeys(userId);

        await repository.create(profileKeys.PK, profileKeys.SK, 'UserProfile', {
            id: userId,
            email: email,
            name: name,
            role: role,
            teamId: teamId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        revalidatePath('/super-admin/users');
        return { message: 'success', data: { id: userId, email, tempPassword }, errors: {} };

    } catch (error: any) {
        console.error('Error creating user:', error);
        return { message: 'Failed to create user', errors: { system: error.message } };
    }
}

// ============================================
// Organization Settings Actions
// ============================================

export async function getOrganizationSettingsAction(): Promise<{
    message: string;
    data?: any;
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', errors: {} };

        // For now, we'll mock the settings or fetch from a fixed location
        // In a real app, this would be fetched based on the admin's organization ID
        const settings = {
            name: 'Bayon Coagent',
            description: 'AI-powered real estate platform',
            website: 'https://bayon.coagent.com',
            allowMemberInvites: true,
            requireApproval: false,
            logo: '',
            brandColor: '#0f172a',
        };

        return { message: 'success', data: settings, errors: {} };
    } catch (error: any) {
        console.error('Error fetching organization settings:', error);
        return { message: 'Failed to fetch settings', errors: { system: error.message } };
    }
}

export async function updateOrganizationSettingsAction(settings: any): Promise<{
    message: string;
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', errors: {} };

        // Mock update
        console.log('Updating organization settings:', settings);

        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error updating organization settings:', error);
        return { message: 'Failed to update settings', errors: { system: error.message } };
    }
}

// ============================================
// Team Member Actions
// ============================================

export async function getTeamMembersAction(): Promise<{
    message: string;
    data?: any[];
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', errors: {} };

        // Reuse getUsersListAction logic but filtered for this admin's team
        // For simplicity, we'll just call getUsersListAction and filter
        // In a real optimized scenario, we'd query the team members directly
        const usersResult = await getUsersListAction(undefined, undefined, undefined, { filterByTeam: true });

        if (usersResult.message !== 'success') {
            return { message: usersResult.message, errors: usersResult.errors };
        }

        const members = usersResult.data.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role === 'admin' ? 'admin' : 'member',
            status: user.status,
            joinedAt: user.createdAt,
        }));

        return { message: 'success', data: members, errors: {} };
    } catch (error: any) {
        console.error('Error fetching team members:', error);
        return { message: 'Failed to fetch team members', errors: { system: error.message } };
    }
}

export async function inviteTeamMemberAction(email: string, role: 'member' | 'admin'): Promise<{
    message: string;
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', errors: {} };

        // Create invitation
        const invitation: Invitation = {
            id: generateInvitationToken(),
            organizationId: 'default-org', // Replace with actual org ID
            email,
            role,
            status: 'pending',
            invitedBy: currentUser.id,
            token: generateInvitationToken(),
            expiresAt: getInvitationExpirationDate(),
            createdAt: new Date().toISOString(),
        };

        // Save to DB (mock for now or use repository)
        const repository = getRepository();
        // await repository.create(...) 
        console.log('Created invitation:', invitation);

        // Send email (mock)
        // await sendInvitationEmail(...)

        revalidatePath('/admin/team');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error inviting team member:', error);
        return { message: 'Failed to invite member', errors: { system: error.message } };
    }
}

export async function removeTeamMemberAction(memberId: string): Promise<{
    message: string;
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', errors: {} };

        // Remove member logic
        console.log('Removing member:', memberId);

        revalidatePath('/admin/team');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error removing team member:', error);
        return { message: 'Failed to remove member', errors: { system: error.message } };
    }
}

export async function updateTeamMemberRoleAction(memberId: string, newRole: 'member' | 'admin'): Promise<{
    message: string;
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', errors: {} };

        // Update role logic
        console.log('Updating member role:', memberId, newRole);

        revalidatePath('/admin/team');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error updating team member role:', error);
        return { message: 'Failed to update role', errors: { system: error.message } };
    }
}

export async function getPendingInvitationsAction(): Promise<{
    message: string;
    data?: any[];
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', errors: {} };

        // Fetch pending invitations
        // Mock data for now
        const invitations: any[] = [];

        return { message: 'success', data: invitations, errors: {} };
    } catch (error: any) {
        console.error('Error fetching pending invitations:', error);
        return { message: 'Failed to fetch invitations', errors: { system: error.message } };
    }
}

export async function cancelInvitationAction(invitationId: string): Promise<{
    message: string;
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', errors: {} };

        // Cancel invitation logic
        console.log('Cancelling invitation:', invitationId);

        revalidatePath('/admin/team');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error cancelling invitation:', error);
        return { message: 'Failed to cancel invitation', errors: { system: error.message } };
    }
}

// ============================================
// ============================================
// Announcement Actions
// ============================================

/**
 * Creates a new announcement
 */
export async function createAnnouncementAction(
    title: string,
    content: string,
    richContent: string | undefined,
    targetAudience: 'all' | 'role' | 'custom',
    targetValue: string[] | undefined,
    deliveryMethod: 'email' | 'in_app' | 'both',
    scheduledFor?: string
): Promise<{
    success: boolean;
    data?: Announcement;
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized' };
        }

        const announcement = await announcementService.createAnnouncement(
            title,
            content,
            richContent,
            targetAudience,
            targetValue,
            deliveryMethod,
            currentUser.id,
            scheduledFor
        );

        revalidatePath('/admin/announcements');

        return { success: true, data: announcement };
    } catch (error: any) {
        console.error('Error creating announcement:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Gets all announcements with optional filtering
 */
export async function getAnnouncementsAction(options?: {
    status?: 'draft' | 'scheduled' | 'sent' | 'failed';
    limit?: number;
    lastKey?: string;
}): Promise<{
    success: boolean;
    data?: { announcements: Announcement[]; lastKey?: string };
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await announcementService.getAnnouncements(options);

        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error fetching announcements:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Gets a specific announcement by ID
 */
export async function getAnnouncementAction(
    announcementId: string
): Promise<{
    success: boolean;
    data?: Announcement;
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized' };
        }

        const announcement = await announcementService.getAnnouncement(announcementId);

        if (!announcement) {
            return { success: false, error: 'Announcement not found' };
        }

        return { success: true, data: announcement };
    } catch (error: any) {
        console.error('Error fetching announcement:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Updates an announcement
 */
export async function updateAnnouncementAction(
    announcementId: string,
    updates: Partial<Announcement>
): Promise<{
    success: boolean;
    data?: Announcement;
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized' };
        }

        const announcement = await announcementService.updateAnnouncement(
            announcementId,
            updates,
            currentUser.id
        );

        revalidatePath('/admin/announcements');

        return { success: true, data: announcement };
    } catch (error: any) {
        console.error('Error updating announcement:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sends an announcement immediately
 */
export async function sendAnnouncementAction(
    announcementId: string
): Promise<{
    success: boolean;
    data?: { sent: number; delivered: number; failed: number };
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized' };
        }

        const result = await announcementService.sendAnnouncement(
            announcementId,
            currentUser.id
        );

        revalidatePath('/admin/announcements');

        return {
            success: true,
            data: {
                sent: result.sent,
                delivered: result.delivered,
                failed: result.failed,
            },
        };
    } catch (error: any) {
        console.error('Error sending announcement:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Cancels a scheduled announcement
 */
export async function cancelAnnouncementAction(
    announcementId: string
): Promise<{
    success: boolean;
    message: string;
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, message: '', error: 'Unauthorized' };
        }

        await announcementService.cancelScheduledAnnouncement(
            announcementId,
            currentUser.id
        );

        revalidatePath('/admin/announcements');

        return { success: true, message: 'Announcement cancelled successfully' };
    } catch (error: any) {
        console.error('Error cancelling announcement:', error);
        return { success: false, message: '', error: error.message };
    }
}

/**
 * Deletes an announcement
 */
export async function deleteAnnouncementAction(
    announcementId: string
): Promise<{
    success: boolean;
    message: string;
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, message: '', error: 'Unauthorized' };
        }

        await announcementService.deleteAnnouncement(
            announcementId,
            currentUser.id
        );

        revalidatePath('/admin/announcements');

        return { success: true, message: 'Announcement deleted successfully' };
    } catch (error: any) {
        console.error('Error deleting announcement:', error);
        return { success: false, message: '', error: error.message };
    }
}

/**
 * Gets announcement statistics
 */
export async function getAnnouncementStatsAction(
    announcementId: string
): Promise<{
    success: boolean;
    data?: AnnouncementStats;
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized' };
        }

        const stats = await announcementService.getAnnouncementStats(announcementId);

        return { success: true, data: stats };
    } catch (error: any) {
        console.error('Error fetching announcement stats:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Tracks announcement open
 */
export async function trackAnnouncementOpenAction(
    announcementId: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        await announcementService.trackOpen(announcementId, currentUser.id);

        return { success: true };
    } catch (error: any) {
        console.error('Error tracking announcement open:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Tracks announcement click
 */
export async function trackAnnouncementClickAction(
    announcementId: string,
    linkUrl?: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        await announcementService.trackClick(announcementId, currentUser.id, linkUrl);

        return { success: true };
    } catch (error: any) {
        console.error('Error tracking announcement click:', error);
        return { success: false, error: error.message };
    }
}

export async function getAuditLogsAction(
    params: {
        adminUserId?: string;
        action?: string;
        resourceType?: string;
        resourceId?: string;
        startTime?: string;
        endTime?: string;
        limit?: number;
        nextToken?: string;
    }
): Promise<{
    message: string;
    data: {
        logs: any[];
        nextToken?: string;
        searchedLogStreams?: number;
    };
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', data: { logs: [] }, errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (adminStatus.role !== 'super_admin') {
            return { message: 'Unauthorized: Super Admin access required', data: { logs: [] }, errors: {} };
        }

        const { CloudWatchLogsClient, FilterLogEventsCommand } = await import('@aws-sdk/client-cloudwatch-logs');
        const { getConfig, getAWSCredentials } = await import('@/aws/config');

        const config = getConfig();
        const credentials = getAWSCredentials();

        const clientConfig: any = { region: config.region };
        if (credentials && credentials.accessKeyId && credentials.secretAccessKey) {
            clientConfig.credentials = credentials;
        }

        const logsClient = new CloudWatchLogsClient(clientConfig);
        const AUDIT_LOG_GROUP = '/aws/bayon-coagent/admin-audit';

        const endTime = params.endTime ? new Date(params.endTime).getTime() : Date.now();
        const startTime = params.startTime
            ? new Date(params.startTime).getTime()
            : endTime - 24 * 60 * 60 * 1000; // Default: last 24 hours

        // Build filter pattern
        const filterPatterns: string[] = [];

        if (params.adminUserId) {
            filterPatterns.push(`{ $.adminUserId = "${params.adminUserId}" }`);
        }

        if (params.action) {
            filterPatterns.push(`{ $.action = "${params.action}" }`);
        }

        if (params.resourceType) {
            filterPatterns.push(`{ $.resourceType = "${params.resourceType}" }`);
        }

        if (params.resourceId) {
            filterPatterns.push(`{ $.resourceId = "${params.resourceId}" }`);
        }

        const filterPattern = filterPatterns.length > 0 ? filterPatterns.join(' && ') : undefined;

        const command = new FilterLogEventsCommand({
            logGroupName: AUDIT_LOG_GROUP,
            startTime,
            endTime,
            filterPattern,
            limit: params.limit || 100,
            nextToken: params.nextToken,
        });

        try {
            const response = await logsClient.send(command);

            const logs = response.events?.map(event => {
                try {
                    return {
                        timestamp: event.timestamp ? new Date(event.timestamp).toISOString() : undefined,
                        message: event.message ? JSON.parse(event.message) : undefined,
                        logStreamName: event.logStreamName,
                    };
                } catch (error) {
                    return {
                        timestamp: event.timestamp ? new Date(event.timestamp).toISOString() : undefined,
                        message: event.message,
                        logStreamName: event.logStreamName,
                    };
                }
            }) || [];

            return {
                message: 'success',
                data: {
                    logs,
                    nextToken: response.nextToken,
                    searchedLogStreams: response.searchedLogStreams?.length || 0,
                },
                errors: {}
            };
        } catch (error: any) {
            if (error.name === 'ResourceNotFoundException') {
                return {
                    message: 'No audit logs found (log group does not exist yet)',
                    data: {
                        logs: [],
                        nextToken: undefined,
                        searchedLogStreams: 0,
                    },
                    errors: {}
                };
            }
            throw error;
        }
    } catch (error: any) {
        console.error('Error fetching audit logs:', error);
        return {
            message: 'Failed to fetch audit logs',
            data: { logs: [] },
            errors: { system: error.message }
        };
    }
}

// ============================================
// Impersonation Actions
// ============================================

export async function impersonateUserAction(userId: string): Promise<{ message: string; errors: any }> {
    try {
        // Verify the *real* user is an admin
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('bayon-session');

        if (!sessionCookie?.value) {
            return { message: 'Not authenticated', errors: {} };
        }

        let session;
        try {
            session = JSON.parse(sessionCookie.value);
        } catch (e) {
            return { message: 'Invalid session', errors: {} };
        }

        // Get the real user directly from Cognito using the access token
        // This bypasses any impersonation logic in getCurrentUserServer
        const { getCognitoClient } = await import('@/aws/auth/cognito-client');
        const client = getCognitoClient();

        let realUser;
        try {
            realUser = await client.getCurrentUser(session.accessToken);
        } catch (e) {
            return { message: 'Session expired or invalid', errors: {} };
        }

        const adminStatus = await checkAdminStatusAction(realUser.id);
        if (!adminStatus.isAdmin) {
            return { message: 'Unauthorized: Only admins can impersonate', errors: {} };
        }

        // Set the impersonation cookie
        cookieStore.set('bayon-impersonation-target', userId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });

        console.log(`[impersonateUserAction] Admin ${realUser.id} is now impersonating ${userId}`);
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error starting impersonation:', error);
        return { message: 'Failed to start impersonation', errors: { system: error.message } };
    }
}

export async function stopImpersonationAction(): Promise<{ message: string; errors: any }> {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('bayon-impersonation-target');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error stopping impersonation:', error);
        return { message: 'Failed to stop impersonation', errors: { system: error.message } };
    }
}

export async function getImpersonationStatusAction(): Promise<{
    isImpersonating: boolean;
    targetUserId?: string;
}> {
    try {
        const cookieStore = await cookies();
        const impersonationCookie = cookieStore.get('bayon-impersonation-target');

        if (!impersonationCookie?.value) {
            return { isImpersonating: false };
        }

        return {
            isImpersonating: true,
            targetUserId: impersonationCookie.value
        };
    } catch (error) {
        return { isImpersonating: false };
    }
}

// ============================================
// User Activity Actions
// ============================================

import { userActivityService, UserActivity, UserActivityTimeline } from '@/services/admin/user-activity-service';

export async function getAllUserActivity(options?: {
    activityLevel?: 'active' | 'inactive' | 'dormant';
    sortBy?: 'lastLogin' | 'totalSessions' | 'contentCreated';
    limit?: number;
    lastKey?: string;
}): Promise<{
    success: boolean;
    data?: { users: UserActivity[]; lastKey?: string };
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const result = await userActivityService.getAllUserActivity(options);

        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error fetching user activity:', error);
        return { success: false, error: error.message || 'Failed to fetch user activity' };
    }
}

export async function getUserActivityTimeline(
    userId: string,
    startDate?: string,
    endDate?: string
): Promise<{ success: boolean; data?: UserActivityTimeline; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;

        const timeline = await userActivityService.getUserActivityTimeline(userId, start, end);

        return { success: true, data: timeline };
    } catch (error: any) {
        console.error('Error fetching user activity timeline:', error);
        return { success: false, error: error.message || 'Failed to fetch activity timeline' };
    }
}

export async function exportUserActivityData(
    userIds?: string[]
): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const csvContent = await userActivityService.exportUserActivity(userIds);

        return { success: true, data: csvContent };
    } catch (error: any) {
        console.error('Error exporting user activity:', error);
        return { success: false, error: error.message || 'Failed to export user activity' };
    }
}

// ============================================
// Content Moderation Actions
// ============================================

import { contentModerationService, ModerationItem } from '@/services/admin/content-moderation-service';

export async function getContentForModeration(options?: {
    status?: string;
    contentType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    lastKey?: string;
}): Promise<{
    success: boolean;
    data?: { items: ModerationItem[]; lastKey?: string };
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const result = await contentModerationService.getContentForModeration({
            status: options?.status as any,
            contentType: options?.contentType,
            userId: options?.userId,
            startDate: options?.startDate ? new Date(options.startDate) : undefined,
            endDate: options?.endDate ? new Date(options.endDate) : undefined,
            limit: options?.limit,
            lastKey: options?.lastKey,
        });

        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error fetching content for moderation:', error);
        return { success: false, error: error.message || 'Failed to fetch content' };
    }
}

export async function moderateContent(
    contentId: string,
    action: 'approve' | 'flag' | 'hide',
    reason?: string
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, message: '', error: 'Unauthorized: Admin access required' };
        }

        switch (action) {
            case 'approve':
                await contentModerationService.approveContent(contentId, currentUser.id);
                return { success: true, message: 'Content approved successfully' };

            case 'flag':
                if (!reason) {
                    return { success: false, message: '', error: 'Reason is required for flagging content' };
                }
                await contentModerationService.flagContent(contentId, currentUser.id, reason);
                return { success: true, message: 'Content flagged successfully' };

            case 'hide':
                if (!reason) {
                    return { success: false, message: '', error: 'Reason is required for hiding content' };
                }
                await contentModerationService.hideContent(contentId, currentUser.id, reason);
                return { success: true, message: 'Content hidden successfully' };

            default:
                return { success: false, message: '', error: 'Invalid action' };
        }
    } catch (error: any) {
        console.error('Error moderating content:', error);
        return { success: false, message: '', error: error.message || 'Failed to moderate content' };
    }
}


// ============================================
// Support Ticket Actions
// ============================================

import { supportTicketService, SupportTicket, TicketMessage } from '@/services/admin/support-ticket-service';

export async function createSupportTicket(
    subject: string,
    description: string,
    category: 'bug' | 'feature_request' | 'help' | 'billing' | 'other'
): Promise<{ success: boolean; data?: SupportTicket; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get user profile for name and email
        const repository = getRepository();
        const profileKeys = getProfileKeys(currentUser.id);
        const profile: any = await repository.get(profileKeys.PK, profileKeys.SK);

        const userName = profile?.Data?.name || currentUser.email || 'Unknown User';
        const userEmail = currentUser.email || 'no-email@example.com';

        const ticket = await supportTicketService.createTicket(
            currentUser.id,
            userName,
            userEmail,
            subject,
            description,
            category
        );

        return { success: true, data: ticket };
    } catch (error: any) {
        console.error('Error creating support ticket:', error);
        return { success: false, error: error.message || 'Failed to create support ticket' };
    }
}

export async function getSupportTickets(options?: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    limit?: number;
    lastKey?: string;
}): Promise<{
    success: boolean;
    data?: { tickets: SupportTicket[]; lastKey?: string };
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const result = await supportTicketService.getTickets(options);

        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error fetching support tickets:', error);
        return { success: false, error: error.message || 'Failed to fetch support tickets' };
    }
}

export async function getSupportTicket(
    ticketId: string
): Promise<{ success: boolean; data?: SupportTicket; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const ticket = await supportTicketService.getTicket(ticketId);

        if (!ticket) {
            return { success: false, error: 'Ticket not found' };
        }

        return { success: true, data: ticket };
    } catch (error: any) {
        console.error('Error fetching support ticket:', error);
        return { success: false, error: error.message || 'Failed to fetch support ticket' };
    }
}

export async function respondToTicket(
    ticketId: string,
    message: string
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, message: '', error: 'Unauthorized: Admin access required' };
        }

        // Get admin profile for name
        const repository = getRepository();
        const profileKeys = getProfileKeys(currentUser.id);
        const profile: any = await repository.get(profileKeys.PK, profileKeys.SK);
        const adminName = profile?.Data?.name || currentUser.email || 'Admin';

        await supportTicketService.addMessage(
            ticketId,
            currentUser.id,
            adminName,
            'admin',
            message
        );

        // Update ticket status to in_progress if it's open
        const ticket = await supportTicketService.getTicket(ticketId);
        if (ticket && ticket.status === 'open') {
            await supportTicketService.updateTicketStatus(ticketId, 'in_progress', currentUser.id);
        }

        return { success: true, message: 'Response sent successfully' };
    } catch (error: any) {
        console.error('Error responding to ticket:', error);
        return { success: false, message: '', error: error.message || 'Failed to send response' };
    }
}

export async function updateTicketStatus(
    ticketId: string,
    status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed',
    resolutionNote?: string
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, message: '', error: 'Unauthorized: Admin access required' };
        }

        await supportTicketService.updateTicketStatus(ticketId, status, currentUser.id, resolutionNote);

        return { success: true, message: 'Ticket status updated successfully' };
    } catch (error: any) {
        console.error('Error updating ticket status:', error);
        return { success: false, message: '', error: error.message || 'Failed to update ticket status' };
    }
}

export async function assignTicket(
    ticketId: string,
    adminId: string
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, message: '', error: 'Unauthorized: Admin access required' };
        }

        await supportTicketService.assignTicket(ticketId, adminId);

        return { success: true, message: 'Ticket assigned successfully' };
    } catch (error: any) {
        console.error('Error assigning ticket:', error);
        return { success: false, message: '', error: error.message || 'Failed to assign ticket' };
    }
}

// ============================================
// System Health Actions
// ============================================

import { systemHealthService, SystemHealthMetrics, ErrorLogEntry } from '@/services/admin/system-health-service';

export async function getSystemHealthMetrics(): Promise<{
    success: boolean;
    data?: SystemHealthMetrics;
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const metrics = await systemHealthService.getSystemHealth();

        return { success: true, data: metrics };
    } catch (error: any) {
        console.error('Error fetching system health metrics:', error);
        return { success: false, error: error.message || 'Failed to fetch system health' };
    }
}

export async function getErrorLogs(options?: {
    errorType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
}): Promise<{ success: boolean; data?: ErrorLogEntry[]; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const logs = await systemHealthService.getErrorLogs({
            errorType: options?.errorType,
            startDate: options?.startDate ? new Date(options.startDate) : undefined,
            endDate: options?.endDate ? new Date(options.endDate) : undefined,
            limit: options?.limit,
        });

        return { success: true, data: logs };
    } catch (error: any) {
        console.error('Error fetching error logs:', error);
        return { success: false, error: error.message || 'Failed to fetch error logs' };
    }
}

export async function getAWSServiceMetrics(
    service: 'dynamodb' | 'bedrock' | 's3',
    metricName: string,
    startDate: string,
    endDate: string
): Promise<{ success: boolean; data?: Array<{ timestamp: number; value: number }>; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const metrics = await systemHealthService.getAWSMetrics(
            service,
            metricName,
            new Date(startDate),
            new Date(endDate)
        );

        return { success: true, data: metrics };
    } catch (error: any) {
        console.error('Error fetching AWS service metrics:', error);
        return { success: false, error: error.message || 'Failed to fetch AWS metrics' };
    }
}

// ============================================
// Platform Configuration Actions
// ============================================

import { platformConfigService, FeatureFlag, PlatformSettings } from '@/services/admin/platform-config-service';

export async function getFeatureFlags(): Promise<{
    success: boolean;
    data?: FeatureFlag[];
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const flags = await platformConfigService.getFeatureFlags();

        return { success: true, data: flags };
    } catch (error: any) {
        console.error('Error fetching feature flags:', error);
        return { success: false, error: error.message || 'Failed to fetch feature flags' };
    }
}

export async function updateFeatureFlag(
    flagId: string,
    config: Partial<FeatureFlag>
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, message: '', error: 'Unauthorized: SuperAdmin access required' };
        }

        // Validate rollout percentage
        if (config.rolloutPercentage !== undefined) {
            if (config.rolloutPercentage < 0 || config.rolloutPercentage > 100) {
                return { success: false, message: '', error: 'Rollout percentage must be between 0 and 100' };
            }
        }

        await platformConfigService.setFeatureFlag(flagId, config, currentUser.id);

        // Revalidate admin pages
        revalidatePath('/admin/config/features');

        return { success: true, message: 'Feature flag updated successfully' };
    } catch (error: any) {
        console.error('Error updating feature flag:', error);
        return { success: false, message: '', error: error.message || 'Failed to update feature flag' };
    }
}

export async function createFeatureFlag(
    flagId: string,
    name: string,
    description: string,
    enabled: boolean = false,
    rolloutPercentage: number = 0,
    targetUsers?: string[],
    targetRoles?: string[]
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, message: '', error: 'Unauthorized: SuperAdmin access required' };
        }

        // Validate inputs
        if (!flagId || !name) {
            return { success: false, message: '', error: 'Flag ID and name are required' };
        }

        if (rolloutPercentage < 0 || rolloutPercentage > 100) {
            return { success: false, message: '', error: 'Rollout percentage must be between 0 and 100' };
        }

        await platformConfigService.setFeatureFlag(
            flagId,
            {
                name,
                description,
                enabled,
                rolloutPercentage,
                targetUsers,
                targetRoles,
            },
            currentUser.id
        );

        // Revalidate admin pages
        revalidatePath('/admin/config/features');

        return { success: true, message: 'Feature flag created successfully' };
    } catch (error: any) {
        console.error('Error creating feature flag:', error);
        return { success: false, message: '', error: error.message || 'Failed to create feature flag' };
    }
}

export async function checkFeatureEnabled(
    flagId: string,
    userId: string,
    userRole?: string
): Promise<{ success: boolean; enabled: boolean; error?: string }> {
    try {
        const enabled = await platformConfigService.isFeatureEnabled(flagId, userId, userRole);

        return { success: true, enabled };
    } catch (error: any) {
        console.error('Error checking feature flag:', error);
        return { success: false, enabled: false, error: error.message || 'Failed to check feature flag' };
    }
}

export async function getPlatformSettings(
    category?: 'general' | 'ai' | 'billing' | 'email' | 'security'
): Promise<{ success: boolean; data?: PlatformSettings[]; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const settings = await platformConfigService.getSettings(category);

        return { success: true, data: settings };
    } catch (error: any) {
        console.error('Error fetching platform settings:', error);
        return { success: false, error: error.message || 'Failed to fetch platform settings' };
    }
}

export async function updatePlatformSetting(
    category: 'general' | 'ai' | 'billing' | 'email' | 'security',
    key: string,
    value: any
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, message: '', error: 'Unauthorized: SuperAdmin access required' };
        }

        // Validate inputs
        if (!category || !key) {
            return { success: false, message: '', error: 'Category and key are required' };
        }

        // Basic validation for specific settings
        if (category === 'ai' && key === 'max_tokens' && typeof value === 'number') {
            if (value < 0 || value > 100000) {
                return { success: false, message: '', error: 'Max tokens must be between 0 and 100000' };
            }
        }

        await platformConfigService.updateSetting(category, key, value, currentUser.id);

        // Revalidate admin pages
        revalidatePath('/admin/config/settings');

        return { success: true, message: 'Platform setting updated successfully' };
    } catch (error: any) {
        console.error('Error updating platform setting:', error);
        return { success: false, message: '', error: error.message || 'Failed to update platform setting' };
    }
}

// ============================================
// Billing Actions
// ============================================

import { billingService, BillingDashboardMetrics, UserBillingInfo, PaymentFailure, BillingExportData } from '@/services/admin/billing-service';

export async function getBillingDashboardMetrics(): Promise<{
    success: boolean;
    data?: BillingDashboardMetrics;
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const metrics = await billingService.getBillingDashboardMetrics();

        return { success: true, data: metrics };
    } catch (error: any) {
        console.error('Error fetching billing dashboard metrics:', error);
        return { success: false, error: error.message || 'Failed to fetch billing metrics' };
    }
}

export async function getUserBillingInfo(
    userId: string
): Promise<{ success: boolean; data?: UserBillingInfo; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const billingInfo = await billingService.getUserBillingInfo(userId);

        if (!billingInfo) {
            return { success: false, error: 'User not found' };
        }

        return { success: true, data: billingInfo };
    } catch (error: any) {
        console.error('Error fetching user billing info:', error);
        return { success: false, error: error.message || 'Failed to fetch user billing information' };
    }
}

export async function getPaymentFailures(): Promise<{
    success: boolean;
    data?: PaymentFailure[];
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const failures = await billingService.getPaymentFailures();

        return { success: true, data: failures };
    } catch (error: any) {
        console.error('Error fetching payment failures:', error);
        return { success: false, error: error.message || 'Failed to fetch payment failures' };
    }
}

export async function grantTrialExtension(
    userId: string,
    extensionDays: number,
    reason: string
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, message: '', error: 'Unauthorized: SuperAdmin access required' };
        }

        // Validate inputs
        if (extensionDays <= 0 || extensionDays > 365) {
            return { success: false, message: '', error: 'Extension days must be between 1 and 365' };
        }

        if (!reason || reason.trim().length === 0) {
            return { success: false, message: '', error: 'Reason is required' };
        }

        await billingService.grantTrialExtension(userId, extensionDays, currentUser.id, reason);

        return { success: true, message: `Trial extended by ${extensionDays} days` };
    } catch (error: any) {
        console.error('Error granting trial extension:', error);
        return { success: false, message: '', error: error.message || 'Failed to grant trial extension' };
    }
}

export async function exportBillingData(
    startDate: string,
    endDate: string
): Promise<{ success: boolean; data?: BillingExportData; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validate date range
        if (start > end) {
            return { success: false, error: 'Start date must be before end date' };
        }

        const exportData = await billingService.exportBillingData(start, end);

        return { success: true, data: exportData };
    } catch (error: any) {
        console.error('Error exporting billing data:', error);
        return { success: false, error: error.message || 'Failed to export billing data' };
    }
}

export async function retryPayment(
    invoiceId: string
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, message: '', error: 'Unauthorized: SuperAdmin access required' };
        }

        const success = await billingService.retryPayment(invoiceId);

        if (success) {
            return { success: true, message: 'Payment retry initiated successfully' };
        } else {
            return { success: false, message: '', error: 'Failed to retry payment. Invoice may not be in a retryable state.' };
        }
    } catch (error: any) {
        console.error('Error retrying payment:', error);
        return { success: false, message: '', error: error.message || 'Failed to retry payment' };
    }
}

export async function cancelSubscription(
    subscriptionId: string
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, message: '', error: 'Unauthorized: SuperAdmin access required' };
        }

        await billingService.cancelSubscription(subscriptionId, currentUser.id);

        return { success: true, message: 'Subscription canceled successfully' };
    } catch (error: any) {
        console.error('Error canceling subscription:', error);
        return { success: false, message: '', error: error.message || 'Failed to cancel subscription' };
    }
}

// ============================================
// Bulk Operations Actions
// ============================================

import { bulkOperationsService, BulkEmailTemplate } from '@/services/admin/bulk-operations-service';

export async function sendBulkEmail(
    userIds: string[],
    subject: string,
    body: string,
    template?: string
): Promise<{
    success: boolean;
    data?: { sent: number; failed: number };
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        // Validate inputs
        if (!userIds || userIds.length === 0) {
            return { success: false, error: 'No users selected' };
        }

        if (!subject || !body) {
            return { success: false, error: 'Subject and body are required' };
        }

        // Apply template if provided
        let emailBody = body;
        if (template) {
            // Apply predefined templates
            switch (template) {
                case 'welcome':
                    emailBody = `
                        <h1>Welcome to Bayon Coagent!</h1>
                        <p>Hi {{name}},</p>
                        ${body}
                        <p>Best regards,<br>The Bayon Coagent Team</p>
                    `;
                    break;
                case 'announcement':
                    emailBody = `
                        <h2>${subject}</h2>
                        <p>Hi {{name}},</p>
                        ${body}
                        <p>Best regards,<br>The Bayon Coagent Team</p>
                    `;
                    break;
                case 'plain':
                default:
                    emailBody = body;
            }
        }

        const emailTemplate: BulkEmailTemplate = {
            subject,
            body: emailBody,
        };

        const result = await bulkOperationsService.sendBulkEmail(userIds, emailTemplate);

        return {
            success: true,
            data: {
                sent: result.successCount,
                failed: result.failureCount,
            },
        };
    } catch (error: any) {
        console.error('Error sending bulk email:', error);
        return { success: false, error: error.message || 'Failed to send bulk email' };
    }
}

export async function exportBulkUserData(
    userIds: string[],
    fields: string[]
): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        // Validate inputs
        if (!userIds || userIds.length === 0) {
            return { success: false, error: 'No users selected' };
        }

        if (!fields || fields.length === 0) {
            return { success: false, error: 'No fields selected' };
        }

        const result = await bulkOperationsService.exportUserData(userIds, fields);

        if (result.csvContent) {
            return {
                success: true,
                data: result.csvContent,
            };
        } else {
            return {
                success: false,
                error: 'Failed to generate CSV content',
            };
        }
    } catch (error: any) {
        console.error('Error exporting bulk user data:', error);
        return { success: false, error: error.message || 'Failed to export user data' };
    }
}

export async function bulkRoleChange(
    userIds: string[],
    newRole: 'agent' | 'admin' | 'super_admin'
): Promise<{
    success: boolean;
    data?: { updated: number; failed: number };
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        // Validate inputs
        if (!userIds || userIds.length === 0) {
            return { success: false, error: 'No users selected' };
        }

        if (!['agent', 'admin', 'super_admin'].includes(newRole)) {
            return { success: false, error: 'Invalid role' };
        }

        const result = await bulkOperationsService.bulkRoleChange(
            userIds,
            newRole,
            currentUser.id
        );

        return {
            success: true,
            data: {
                updated: result.successCount,
                failed: result.failureCount,
            },
        };
    } catch (error: any) {
        console.error('Error performing bulk role change:', error);
        return { success: false, error: error.message || 'Failed to change roles' };
    }
}

export async function getBulkOperationStatus(
    operationId: string
): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const result = await bulkOperationsService.getOperationStatus(operationId);

        if (result) {
            return { success: true, data: result };
        } else {
            return { success: false, error: 'Operation not found' };
        }
    } catch (error: any) {
        console.error('Error getting bulk operation status:', error);
        return { success: false, error: error.message || 'Failed to get operation status' };
    }
}

export async function getRecentBulkOperations(
    limit: number = 10
): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const operations = await bulkOperationsService.getRecentOperations(limit);

        return { success: true, data: operations };
    } catch (error: any) {
        console.error('Error getting recent bulk operations:', error);
        return { success: false, error: error.message || 'Failed to get recent operations' };
    }
}

// ============================================
// Audit Log Actions
// ============================================

import { auditLogService, AuditLogEntry, AuditLogFilter } from '@/services/admin/audit-log-service';

export async function getAuditLogs(filter?: {
    actionType?: string;
    adminId?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
}): Promise<{
    success: boolean;
    data?: { entries: AuditLogEntry[]; lastKey?: string };
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        // Convert string dates to Date objects
        const auditFilter: AuditLogFilter = {
            ...filter,
            startDate: filter?.startDate ? new Date(filter.startDate) : undefined,
            endDate: filter?.endDate ? new Date(filter.endDate) : undefined,
        };

        const result = await auditLogService.getAuditLog(auditFilter);

        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error fetching audit logs:', error);
        return { success: false, error: error.message || 'Failed to fetch audit logs' };
    }
}

export async function exportAuditLogs(
    filter?: {
        actionType?: string;
        adminId?: string;
        resourceType?: string;
        resourceId?: string;
        startDate?: string;
        endDate?: string;
    },
    format: 'json' | 'csv' = 'json'
): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        // Convert string dates to Date objects
        const auditFilter: AuditLogFilter = {
            ...filter,
            startDate: filter?.startDate ? new Date(filter.startDate) : undefined,
            endDate: filter?.endDate ? new Date(filter.endDate) : undefined,
        };

        const exportData = await auditLogService.exportAuditLog(auditFilter, format);

        return { success: true, data: exportData };
    } catch (error: any) {
        console.error('Error exporting audit logs:', error);
        return { success: false, error: error.message || 'Failed to export audit logs' };
    }
}

export async function getAuditLogStats(
    startDate: string,
    endDate: string
): Promise<{
    success: boolean;
    data?: {
        totalActions: number;
        actionsByType: Record<string, number>;
        actionsByAdmin: Record<string, number>;
        actionsByResource: Record<string, number>;
    };
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validate date range
        if (start > end) {
            return { success: false, error: 'Start date must be before end date' };
        }

        const stats = await auditLogService.getAuditLogStats(start, end);

        return { success: true, data: stats };
    } catch (error: any) {
        console.error('Error fetching audit log stats:', error);
        return { success: false, error: error.message || 'Failed to fetch audit log statistics' };
    }
}

/**
 * Helper function to create audit log entries from other actions
 * This should be called internally by other admin actions
 */
export async function createAuditLogEntry(
    entry: Omit<AuditLogEntry, 'auditId' | 'timestamp'>
): Promise<void> {
    try {
        await auditLogService.createAuditLog(entry);
    } catch (error) {
        console.error('Error creating audit log entry:', error);
        // Don't throw - audit logging should not block primary operations
    }
}

// ============================================
// Engagement Reporting Actions
// ============================================

import {
    engagementReportingService,
    EngagementReport,
    FeatureAdoptionRate,
    CohortRetentionData,
    ContentCreationStats
} from '@/services/admin/engagement-reporting-service';

export async function getEngagementReport(
    startDate: string,
    endDate: string
): Promise<{ success: boolean; data?: EngagementReport; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        const report = await engagementReportingService.createEngagementReport(start, end);

        return { success: true, data: report };
    } catch (error: any) {
        console.error('Error generating engagement report:', error);
        return { success: false, error: error.message || 'Failed to generate engagement report' };
    }
}

export async function getFeatureAdoptionRates(
    startDate: string,
    endDate: string
): Promise<{ success: boolean; data?: FeatureAdoptionRate[]; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        const adoptionRates = await engagementReportingService.calculateFeatureAdoption(start, end);

        return { success: true, data: adoptionRates };
    } catch (error: any) {
        console.error('Error fetching feature adoption rates:', error);
        return { success: false, error: error.message || 'Failed to fetch feature adoption rates' };
    }
}

export async function getCohortRetentionData(
    startDate: string,
    endDate: string
): Promise<{ success: boolean; data?: CohortRetentionData[]; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        const retentionData = await engagementReportingService.calculateCohortRetention(start, end);

        return { success: true, data: retentionData };
    } catch (error: any) {
        console.error('Error fetching cohort retention data:', error);
        return { success: false, error: error.message || 'Failed to fetch cohort retention data' };
    }
}

export async function getContentCreationStats(
    startDate: string,
    endDate: string
): Promise<{ success: boolean; data?: ContentCreationStats; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        const contentStats = await engagementReportingService.generateContentStats(start, end);

        return { success: true, data: contentStats };
    } catch (error: any) {
        console.error('Error fetching content creation stats:', error);
        return { success: false, error: error.message || 'Failed to fetch content creation stats' };
    }
}

export async function exportEngagementReportPDF(
    startDate: string,
    endDate: string
): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        const report = await engagementReportingService.createEngagementReport(start, end);
        const pdfBuffer = await engagementReportingService.exportReportAsPDF(report);

        // Convert buffer to base64 for transmission
        const base64PDF = pdfBuffer.toString('base64');

        return { success: true, data: base64PDF };
    } catch (error: any) {
        console.error('Error exporting engagement report:', error);
        return { success: false, error: error.message || 'Failed to export engagement report' };
    }
}

// ============================================
// API Key Management Actions
// ============================================

import { apiKeyService, APIKey, APIUsageMetrics, ThirdPartyIntegration, RateLimitAlert } from '@/services/admin/api-key-service';

export async function generateAPIKey(
    name: string,
    permissions: string[]
): Promise<{ success: boolean; data?: { keyId: string; plainKey: string; apiKey: APIKey }; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const result = await apiKeyService.generateAPIKey(name, permissions, currentUser.id);

        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error generating API key:', error);
        return { success: false, error: error.message || 'Failed to generate API key' };
    }
}

export async function getAllAPIKeys(options?: {
    status?: 'active' | 'revoked';
    limit?: number;
    lastKey?: string;
}): Promise<{ success: boolean; data?: { keys: APIKey[]; lastKey?: string }; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const result = await apiKeyService.getAllAPIKeys(options);

        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error fetching API keys:', error);
        return { success: false, error: error.message || 'Failed to fetch API keys' };
    }
}

export async function getAPIKeyUsage(
    keyId: string
): Promise<{ success: boolean; data?: APIUsageMetrics; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const usage = await apiKeyService.getAPIUsage(keyId);

        if (!usage) {
            return { success: false, error: 'API key not found' };
        }

        return { success: true, data: usage };
    } catch (error: any) {
        console.error('Error fetching API key usage:', error);
        return { success: false, error: error.message || 'Failed to fetch API key usage' };
    }
}

export async function revokeAPIKey(
    keyId: string
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, message: '', error: 'Unauthorized: SuperAdmin access required' };
        }

        await apiKeyService.revokeAPIKey(keyId, currentUser.id);

        return { success: true, message: 'API key revoked successfully' };
    } catch (error: any) {
        console.error('Error revoking API key:', error);
        return { success: false, message: '', error: error.message || 'Failed to revoke API key' };
    }
}

export async function getRateLimitAlerts(options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
}): Promise<{ success: boolean; data?: RateLimitAlert[]; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const startDate = options?.startDate ? new Date(options.startDate) : undefined;
        const endDate = options?.endDate ? new Date(options.endDate) : undefined;

        const alerts = await apiKeyService.getRateLimitAlerts({
            startDate,
            endDate,
            limit: options?.limit,
        });

        return { success: true, data: alerts };
    } catch (error: any) {
        console.error('Error fetching rate limit alerts:', error);
        return { success: false, error: error.message || 'Failed to fetch rate limit alerts' };
    }
}

export async function getIntegrations(): Promise<{
    success: boolean;
    data?: ThirdPartyIntegration[];
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const integrations = await apiKeyService.getIntegrations();

        return { success: true, data: integrations };
    } catch (error: any) {
        console.error('Error fetching integrations:', error);
        return { success: false, error: error.message || 'Failed to fetch integrations' };
    }
}

export async function updateIntegrationStatus(
    integrationId: string,
    status: 'active' | 'inactive' | 'error'
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, message: '', error: 'Unauthorized: SuperAdmin access required' };
        }

        await apiKeyService.updateIntegrationStatus(integrationId, status, currentUser.id);

        return { success: true, message: 'Integration status updated successfully' };
    } catch (error: any) {
        console.error('Error updating integration status:', error);
        return { success: false, message: '', error: error.message || 'Failed to update integration status' };
    }
}


// ============================================
// Feedback Management Actions
// ============================================

import { feedbackService, Feedback, FeedbackSummaryReport } from '@/services/admin/feedback-service';

export async function createFeedbackAction(
    feedbackText: string
): Promise<{ success: boolean; data?: Feedback; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get user profile for name and email
        const repository = getRepository();
        const profileKeys = getProfileKeys(currentUser.id);
        const profile: any = await repository.get(profileKeys.PK, profileKeys.SK);

        const userName = profile?.Data?.name || currentUser.email || 'Unknown User';
        const userEmail = currentUser.email || 'no-email@example.com';

        const feedback = await feedbackService.createFeedback(
            currentUser.id,
            userName,
            userEmail,
            feedbackText
        );

        return { success: true, data: feedback };
    } catch (error: any) {
        console.error('Error creating feedback:', error);
        return { success: false, error: error.message || 'Failed to create feedback' };
    }
}

export async function getFeedbackAction(options?: {
    status?: string;
    category?: string;
    sentiment?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    lastKey?: string;
}): Promise<{
    success: boolean;
    data?: { feedback: Feedback[]; lastKey?: string };
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const result = await feedbackService.getFeedback({
            status: options?.status,
            category: options?.category,
            sentiment: options?.sentiment,
            userId: options?.userId,
            startDate: options?.startDate ? new Date(options.startDate) : undefined,
            endDate: options?.endDate ? new Date(options.endDate) : undefined,
            limit: options?.limit,
            lastKey: options?.lastKey,
        });

        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error fetching feedback:', error);
        return { success: false, error: error.message || 'Failed to fetch feedback' };
    }
}

export async function getFeedbackByIdAction(
    feedbackId: string
): Promise<{ success: boolean; data?: Feedback; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const feedback = await feedbackService.getFeedbackById(feedbackId);

        if (!feedback) {
            return { success: false, error: 'Feedback not found' };
        }

        return { success: true, data: feedback };
    } catch (error: any) {
        console.error('Error fetching feedback:', error);
        return { success: false, error: error.message || 'Failed to fetch feedback' };
    }
}

export async function categorizeFeedbackAction(
    feedbackId: string,
    category: 'bug' | 'feature_request' | 'general' | 'uncategorized'
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, message: '', error: 'Unauthorized: Admin access required' };
        }

        await feedbackService.categorizeFeedback(feedbackId, category, currentUser.id);

        return { success: true, message: 'Feedback categorized successfully' };
    } catch (error: any) {
        console.error('Error categorizing feedback:', error);
        return { success: false, message: '', error: error.message || 'Failed to categorize feedback' };
    }
}

export async function respondToFeedbackAction(
    feedbackId: string,
    response: string
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, message: '', error: 'Unauthorized: Admin access required' };
        }

        // Get admin profile for name
        const repository = getRepository();
        const profileKeys = getProfileKeys(currentUser.id);
        const profile: any = await repository.get(profileKeys.PK, profileKeys.SK);
        const adminName = profile?.Data?.name || currentUser.email || 'Admin';

        await feedbackService.respondToFeedback(feedbackId, currentUser.id, adminName, response);

        return { success: true, message: 'Response sent successfully' };
    } catch (error: any) {
        console.error('Error responding to feedback:', error);
        return { success: false, message: '', error: error.message || 'Failed to send response' };
    }
}

export async function archiveFeedbackAction(
    feedbackId: string
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, message: '', error: 'Unauthorized: Admin access required' };
        }

        await feedbackService.archiveFeedback(feedbackId);

        return { success: true, message: 'Feedback archived successfully' };
    } catch (error: any) {
        console.error('Error archiving feedback:', error);
        return { success: false, message: '', error: error.message || 'Failed to archive feedback' };
    }
}

export async function generateFeedbackSummaryReportAction(options?: {
    startDate?: string;
    endDate?: string;
}): Promise<{ success: boolean; data?: FeedbackSummaryReport; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) {
            return { success: false, error: 'Unauthorized: Admin access required' };
        }

        const report = await feedbackService.generateSummaryReport({
            startDate: options?.startDate ? new Date(options.startDate) : undefined,
            endDate: options?.endDate ? new Date(options.endDate) : undefined,
        });

        return { success: true, data: report };
    } catch (error: any) {
        console.error('Error generating feedback summary report:', error);
        return { success: false, error: error.message || 'Failed to generate feedback summary report' };
    }
}


// ============================================
// Maintenance Mode Actions
// ============================================

import { maintenanceModeService, MaintenanceWindow, MaintenanceBanner } from '@/services/admin/maintenance-mode-service';

/**
 * Schedules a new maintenance window
 * Validates: Requirements 15.1
 */
export async function scheduleMaintenanceWindowAction(
    title: string,
    description: string,
    startTime: string,
    endTime: string
): Promise<{ success: boolean; data?: MaintenanceWindow; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const window = await maintenanceModeService.scheduleMaintenanceWindow(
            title,
            description,
            new Date(startTime).getTime(),
            new Date(endTime).getTime(),
            currentUser.id
        );

        revalidatePath('/admin/system/maintenance');

        return { success: true, data: window };
    } catch (error: any) {
        console.error('Error scheduling maintenance window:', error);
        return { success: false, error: error.message || 'Failed to schedule maintenance window' };
    }
}

/**
 * Gets all maintenance windows
 * Validates: Requirements 15.3
 */
export async function getMaintenanceWindowsAction(options?: {
    status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
    limit?: number;
    lastKey?: string;
}): Promise<{
    success: boolean;
    data?: { windows: MaintenanceWindow[]; lastKey?: string };
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const result = await maintenanceModeService.getMaintenanceWindows(options);

        return { success: true, data: result };
    } catch (error: any) {
        console.error('Error fetching maintenance windows:', error);
        return { success: false, error: error.message || 'Failed to fetch maintenance windows' };
    }
}

/**
 * Gets a specific maintenance window
 */
export async function getMaintenanceWindowAction(
    windowId: string
): Promise<{ success: boolean; data?: MaintenanceWindow; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const window = await maintenanceModeService.getMaintenanceWindow(windowId);

        if (!window) {
            return { success: false, error: 'Maintenance window not found' };
        }

        return { success: true, data: window };
    } catch (error: any) {
        console.error('Error fetching maintenance window:', error);
        return { success: false, error: error.message || 'Failed to fetch maintenance window' };
    }
}

/**
 * Gets the current maintenance banner for display
 * Validates: Requirements 15.1
 */
export async function getMaintenanceBannerAction(): Promise<{
    success: boolean;
    data?: MaintenanceBanner | null;
    error?: string;
}> {
    try {
        const banner = await maintenanceModeService.getMaintenanceBanner();

        return { success: true, data: banner };
    } catch (error: any) {
        console.error('Error fetching maintenance banner:', error);
        return { success: false, error: error.message || 'Failed to fetch maintenance banner' };
    }
}

/**
 * Checks if maintenance mode is currently active
 * Validates: Requirements 15.2
 */
export async function isMaintenanceModeActiveAction(): Promise<{
    success: boolean;
    active: boolean;
    error?: string;
}> {
    try {
        const active = await maintenanceModeService.isMaintenanceModeActive();

        return { success: true, active };
    } catch (error: any) {
        console.error('Error checking maintenance mode:', error);
        return { success: false, active: false, error: error.message };
    }
}

/**
 * Enables maintenance mode immediately
 * Validates: Requirements 15.2
 */
export async function enableMaintenanceModeAction(
    title: string,
    description: string,
    durationMinutes: number
): Promise<{ success: boolean; data?: MaintenanceWindow; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const window = await maintenanceModeService.enableMaintenanceMode(
            title,
            description,
            durationMinutes,
            currentUser.id
        );

        revalidatePath('/admin/system/maintenance');

        return { success: true, data: window };
    } catch (error: any) {
        console.error('Error enabling maintenance mode:', error);
        return { success: false, error: error.message || 'Failed to enable maintenance mode' };
    }
}

/**
 * Disables maintenance mode immediately
 * Validates: Requirements 15.4
 */
export async function disableMaintenanceModeAction(): Promise<{
    success: boolean;
    message: string;
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, message: '', error: 'Unauthorized: SuperAdmin access required' };
        }

        await maintenanceModeService.disableMaintenanceMode(currentUser.id);

        revalidatePath('/admin/system/maintenance');

        return { success: true, message: 'Maintenance mode disabled successfully' };
    } catch (error: any) {
        console.error('Error disabling maintenance mode:', error);
        return { success: false, message: '', error: error.message || 'Failed to disable maintenance mode' };
    }
}

/**
 * Completes a maintenance window
 * Validates: Requirements 15.4
 */
export async function completeMaintenanceWindowAction(
    windowId: string
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, message: '', error: 'Unauthorized: SuperAdmin access required' };
        }

        await maintenanceModeService.completeMaintenanceWindow(windowId, currentUser.id);

        revalidatePath('/admin/system/maintenance');

        return { success: true, message: 'Maintenance window completed successfully' };
    } catch (error: any) {
        console.error('Error completing maintenance window:', error);
        return { success: false, message: '', error: error.message || 'Failed to complete maintenance window' };
    }
}

/**
 * Cancels a scheduled maintenance window
 * Validates: Requirements 15.5
 */
export async function cancelMaintenanceWindowAction(
    windowId: string
): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, message: '', error: 'Unauthorized: SuperAdmin access required' };
        }

        await maintenanceModeService.cancelMaintenanceWindow(windowId, currentUser.id);

        revalidatePath('/admin/system/maintenance');

        return { success: true, message: 'Maintenance window cancelled successfully' };
    } catch (error: any) {
        console.error('Error cancelling maintenance window:', error);
        return { success: false, message: '', error: error.message || 'Failed to cancel maintenance window' };
    }
}

/**
 * Gets upcoming maintenance windows (next 7 days)
 */
export async function getUpcomingMaintenanceWindowsAction(): Promise<{
    success: boolean;
    data?: MaintenanceWindow[];
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const windows = await maintenanceModeService.getUpcomingMaintenanceWindows();

        return { success: true, data: windows };
    } catch (error: any) {
        console.error('Error fetching upcoming maintenance windows:', error);
        return { success: false, error: error.message || 'Failed to fetch upcoming maintenance windows' };
    }
}

/**
 * Gets past maintenance windows
 */
export async function getPastMaintenanceWindowsAction(
    limit: number = 20
): Promise<{
    success: boolean;
    data?: MaintenanceWindow[];
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin || adminStatus.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized: SuperAdmin access required' };
        }

        const windows = await maintenanceModeService.getPastMaintenanceWindows(limit);

        return { success: true, data: windows };
    } catch (error: any) {
        console.error('Error fetching past maintenance windows:', error);
        return { success: false, error: error.message || 'Failed to fetch past maintenance windows' };
    }
}


// ============================================
// Alert Preferences Actions
// ============================================

import { getAlertPreferencesService, AlertPreferences } from '@/services/admin/alert-preferences-service';

/**
 * Gets alert preferences for the current SuperAdmin
 */
export async function getAlertPreferences(): Promise<{
    success: boolean;
    data?: AlertPreferences;
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();

        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        if (currentUser.role !== 'super_admin') {
            return { success: false, error: 'Unauthorized - SuperAdmin access required' };
        }

        const service = getAlertPreferencesService();
        const preferences = await service.getPreferences(currentUser.userId);

        return { success: true, data: preferences };
    } catch (error: any) {
        console.error('Error getting alert preferences:', error);
        return { success: false, error: error.message || 'Failed to get alert preferences' };
    }
}

/**
 * Updates alert preferences for the current SuperAdmin
 */
export async function updateAlertPreferences(
    preferences: Partial<AlertPreferences>
): Promise<{
    success: boolean;
    message: string;
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();

        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        if (currentUser.role !== 'super_admin') {
            return { success: false, message: '', error: 'Unauthorized - SuperAdmin access required' };
        }

        const service = getAlertPreferencesService();
        await service.updatePreferences(currentUser.userId, preferences);

        return { success: true, message: 'Alert preferences updated successfully' };
    } catch (error: any) {
        console.error('Error updating alert preferences:', error);
        return { success: false, message: '', error: error.message || 'Failed to update alert preferences' };
    }
}

// ============================================
// Email Notification Actions
// ============================================

import { getEmailNotificationService, EmailNotification } from '@/services/admin/email-notification-service';

/**
 * Gets email notification history
 */
export async function getEmailNotificationHistory(options?: {
    type?: EmailNotification['type'];
    status?: EmailNotification['status'];
    limit?: number;
}): Promise<{
    success: boolean;
    data?: EmailNotification[];
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();

        if (!currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        if (currentUser.role !== 'super_admin' && currentUser.role !== 'admin') {
            return { success: false, error: 'Unauthorized - Admin access required' };
        }

        const service = getEmailNotificationService();
        const notifications = await service.getNotificationHistory(options);

        return { success: true, data: notifications };
    } catch (error: any) {
        console.error('Error getting notification history:', error);
        return { success: false, error: error.message || 'Failed to get notification history' };
    }
}

/**
 * Retries failed email notifications
 */
export async function retryFailedNotifications(): Promise<{
    success: boolean;
    message: string;
    error?: string;
}> {
    try {
        const currentUser = await getCurrentUserServer();

        if (!currentUser) {
            return { success: false, message: '', error: 'Not authenticated' };
        }

        if (currentUser.role !== 'super_admin') {
            return { success: false, message: '', error: 'Unauthorized - SuperAdmin access required' };
        }

        const service = getEmailNotificationService();
        await service.retryFailedNotifications();

        return { success: true, message: 'Failed notifications queued for retry' };
    } catch (error: any) {
        console.error('Error retrying notifications:', error);
        return { success: false, message: '', error: error.message || 'Failed to retry notifications' };
    }
}
