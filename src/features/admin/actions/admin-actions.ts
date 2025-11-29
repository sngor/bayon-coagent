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
    TeamMember,
    Invitation,
    generateInvitationToken,
    getInvitationExpirationDate,
    isInvitationExpired
} from '@/lib/organization-types';
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
import { getProfileKeys, getAnnouncementKeys } from '@/aws/dynamodb/keys';
import { sendInvitationEmail } from '@/lib/email-service';

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
        if (credentials.accessKeyId && credentials.secretAccessKey) {
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
        if (credentials.accessKeyId && credentials.secretAccessKey) {
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
            if (credentials.accessKeyId && credentials.secretAccessKey) {
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
        if (credentials.accessKeyId && credentials.secretAccessKey) {
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
// Announcement Actions
// ============================================

export async function createAnnouncementAction(
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high',
    teamId?: string
): Promise<{
    message: string;
    data?: any;
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', errors: {} };

        const repository = getRepository();
        const announcementId = Math.random().toString(36).substring(2, 15);
        const timestamp = new Date().toISOString();

        let targetTeamId = teamId;

        if (adminStatus.role === 'admin') {
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

            if (teamId) {
                if (!adminTeamIds.includes(teamId)) {
                    return { message: 'Unauthorized: You can only post to your teams', errors: {} };
                }
            } else {
                if (adminTeamIds.length > 0) {
                    targetTeamId = adminTeamIds[0]; // Default to first team
                } else {
                    return { message: 'No team found for this admin', errors: {} };
                }
            }
        } else if (adminStatus.role === 'super_admin') {
            if (!targetTeamId) {
                targetTeamId = 'GLOBAL';
            }
        }

        if (!targetTeamId) {
            return { message: 'Target team is required', errors: {} };
        }

        const keys = getAnnouncementKeys(targetTeamId, announcementId, timestamp);

        // Get sender profile for name
        const profileKeys = getProfileKeys(currentUser.id);
        const profile = await repository.get<any>(profileKeys.PK, profileKeys.SK);
        const senderName = profile?.name || currentUser.email || 'Admin';

        const announcement = {
            id: announcementId,
            title,
            message,
            priority,
            senderId: currentUser.id,
            senderName,
            teamId: targetTeamId,
            createdAt: timestamp,
            type: 'Announcement' as const
        };

        await repository.create(keys.PK, keys.SK, 'Announcement', announcement);

        return { message: 'success', data: announcement, errors: {} };
    } catch (error: any) {
        console.error('Error creating announcement:', error);
        return { message: 'Failed to create announcement', errors: { system: error.message } };
    }
}

export async function getAnnouncementsAction(
    limit: number = 10,
    teamId?: string
): Promise<{
    message: string;
    data: any[];
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', data: [], errors: {} };

        const repository = getRepository();

        // For now, let's just fetch announcements for a specific team or GLOBAL
        const targetTeamId = teamId || 'GLOBAL';

        // Query by PK = TEAM#<teamId> and SK begins_with ANNOUNCEMENT#
        const result = await repository.query(
            `TEAM#${targetTeamId}`,
            'ANNOUNCEMENT#',
            {
                limit,
                scanIndexForward: false, // Newest first
            }
        );

        return { message: 'success', data: result.items, errors: {} };
    } catch (error: any) {
        console.error('Error fetching announcements:', error);
        return { message: 'Failed to fetch announcements', data: [], errors: { system: error.message } };
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
        if (credentials.accessKeyId && credentials.secretAccessKey) {
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
