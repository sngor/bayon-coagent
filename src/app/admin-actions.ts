'use server';

import { getRepository } from '@/aws/dynamodb/repository';
import { checkAdminStatusAction } from '@/app/actions';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { DynamoDBKey } from '@/aws/dynamodb/types';
import { FeatureToggle } from '@/lib/feature-toggles';
import { revalidatePath } from 'next/cache';
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
import { getProfileKeys } from '@/aws/dynamodb/keys';
import { sendInvitationEmail } from '@/lib/email-service';

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

        // 3. AI Requests (Mock for now as we don't track this yet)
        const totalAiRequests = 0;

        // 4. Feature Count
        const featuresResult = await repository.scan({
            filterExpression: 'begins_with(PK, :pk) AND SK = :sk',
            expressionAttributeValues: {
                ':pk': 'FEATURE#',
                ':sk': 'CONFIG'
            }
        });
        const activeFeatures = featuresResult.items.filter((f: any) => f.status === 'enabled').length;
        const betaFeatures = featuresResult.items.filter((f: any) => f.status === 'beta').length;

        return {
            message: 'success',
            data: {
                totalUsers,
                totalFeedback,
                pendingFeedback,
                totalAiRequests,
                activeFeatures,
                betaFeatures
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

export async function getRecentActivityAction(limit: number = 5): Promise<{
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

        // For now, we'll just show the most recent users as "activity"
        // In a real system, we'd have an ActivityLog table
        const usersResult = await repository.scan({
            limit,
            filterExpression: 'SK = :sk',
            expressionAttributeValues: { ':sk': 'PROFILE' }
        });

        // Sort by createdAt descending (client-side since scan doesn't sort)
        const recentUsers = usersResult.items
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

// ============================================
// Admin Mode Actions (Team & Organization)
// ============================================

export async function getOrganizationSettingsAction(): Promise<{
    message: string;
    data: any;
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', data: null, errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', data: null, errors: {} };

        const repository = getRepository();

        // Get user's organization ID
        const profileKeys = getProfileKeys(currentUser.id);
        const profile = await repository.get<any>(profileKeys.PK, profileKeys.SK);

        if (!profile?.organizationId) {
            return { message: 'No organization found', data: null, errors: {} };
        }

        const orgKeys = getOrganizationKeys(profile.organizationId);
        const organization = await repository.get<Organization>(orgKeys.PK, orgKeys.SK);

        if (!organization) {
            return { message: 'Organization not found', data: null, errors: {} };
        }

        const settings = {
            name: organization.name,
            description: organization.description,
            website: organization.website,
            allowMemberInvites: organization.settings?.allowMemberInvites ?? true,
            requireApproval: organization.settings?.requireApproval ?? false,
        };

        return {
            message: 'success',
            data: settings,
            errors: {},
        };
    } catch (error: any) {
        console.error('Error fetching organization settings:', error);
        return {
            message: 'Failed to fetch settings',
            data: null,
            errors: { system: error.message },
        };
    }
}

export async function updateOrganizationSettingsAction(settings: {
    name: string;
    description: string;
    website: string;
    allowMemberInvites: boolean;
    requireApproval: boolean;
}): Promise<{
    message: string;
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', errors: {} };

        const repository = getRepository();

        // Get user's organization ID
        const profileKeys = getProfileKeys(currentUser.id);
        const profile = await repository.get<any>(profileKeys.PK, profileKeys.SK);

        if (!profile?.organizationId) {
            return { message: 'No organization found', errors: {} };
        }

        const orgKeys = getOrganizationKeys(profile.organizationId);

        // Update organization details
        await repository.update(orgKeys.PK, orgKeys.SK, {
            name: settings.name,
            description: settings.description,
            website: settings.website,
            settings: {
                allowMemberInvites: settings.allowMemberInvites,
                requireApproval: settings.requireApproval
            }
        });

        revalidatePath('/admin/settings');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error updating organization settings:', error);
        return { message: 'Failed to update settings', errors: { system: error.message } };
    }
}

// ============================================
// Organization Management
// ============================================

export async function createOrganizationAction(data: {
    name: string;
    description: string;
    website: string;
}): Promise<{
    message: string;
    data?: Organization;
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', errors: {} };

        const repository = getRepository();
        const organizationId = `org_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const organization: Organization = {
            id: organizationId,
            name: data.name,
            description: data.description,
            website: data.website,
            ownerId: currentUser.id,
            settings: {
                allowMemberInvites: true,
                requireApproval: false,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const keys = getOrganizationKeys(organizationId);
        await repository.create(keys.PK, keys.SK, 'Organization', organization);

        // Create team member record for owner
        const teamMember: TeamMember = {
            userId: currentUser.id,
            organizationId,
            role: 'owner',
            status: 'active',
            joinedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const memberKeys = getTeamMemberKeys(organizationId, currentUser.id);
        await repository.create(
            memberKeys.PK,
            memberKeys.SK,
            'TeamMember',
            teamMember,
            {
                GSI1PK: memberKeys.GSI1PK,
                GSI1SK: memberKeys.GSI1SK,
            }
        );

        // Update user profile with organizationId
        const profileKeys = getProfileKeys(currentUser.id);
        await repository.update(profileKeys.PK, profileKeys.SK, {
            organizationId,
        });

        revalidatePath('/admin');
        return { message: 'success', data: organization, errors: {} };
    } catch (error: any) {
        console.error('Error creating organization:', error);
        return { message: 'Failed to create organization', errors: { system: error.message } };
    }
}

export async function getOrganizationAction(organizationId: string): Promise<{
    message: string;
    data?: Organization;
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const repository = getRepository();
        const keys = getOrganizationKeys(organizationId);
        const organization = await repository.get<Organization>(keys.PK, keys.SK);

        if (!organization) {
            return { message: 'Organization not found', errors: {} };
        }

        return { message: 'success', data: organization, errors: {} };
    } catch (error: any) {
        console.error('Error fetching organization:', error);
        return { message: 'Failed to fetch organization', errors: { system: error.message } };
    }
}

export async function getOrganizationMembersAction(organizationId?: string): Promise<{
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

        let targetOrgId = organizationId;
        if (!targetOrgId) {
            const profileKeys = getProfileKeys(currentUser.id);
            const profile = await repository.get<any>(profileKeys.PK, profileKeys.SK);
            targetOrgId = profile?.organizationId;
        }

        if (!targetOrgId) {
            return { message: 'No organization found', data: [], errors: {} };
        }

        const queryKeys = getOrganizationMembersQueryKeys(targetOrgId);

        const result = await repository.query<TeamMember>(
            queryKeys.PK,
            queryKeys.SKPrefix
        );

        // Fetch user profiles for each member
        const members = result.items;
        const membersWithDetails = await Promise.all(members.map(async (member) => {
            const profileKeys = getProfileKeys(member.userId);
            const profile = await repository.get<any>(profileKeys.PK, profileKeys.SK);
            return {
                ...member,
                id: member.userId, // Map userId to id for frontend compatibility
                name: profile?.name || 'Unknown',
                email: profile?.email || 'Unknown',
            };
        }));

        return { message: 'success', data: membersWithDetails, errors: {} };
    } catch (error: any) {
        console.error('Error fetching organization members:', error);
        return { message: 'Failed to fetch members', data: [], errors: { system: error.message } };
    }
}

// ============================================
// Invitation Management (Updated)
// ============================================

export async function inviteTeamMemberAction(
    email: string,
    role: 'member' | 'admin'
): Promise<{
    message: string;
    data?: Invitation;
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', errors: {} };

        // Get user's organization
        const profileKeys = getProfileKeys(currentUser.id);
        const profile = await getRepository().get<any>(profileKeys.PK, profileKeys.SK);

        if (!profile?.organizationId) {
            return { message: 'No organization found. Please create an organization first.', errors: {} };
        }

        const organizationId = profile.organizationId;
        const repository = getRepository();

        // Check if user already has pending invitation
        const existingInvites = await repository.query<Invitation>(
            `EMAIL#${email.toLowerCase()}`,
            'INVITE#',
            { filterExpression: '#status = :pending', expressionAttributeNames: { '#status': 'status' }, expressionAttributeValues: { ':pending': 'pending' } }
        );

        if (existingInvites.items.length > 0) {
            return { message: 'User already has a pending invitation', errors: {} };
        }

        // Check if user is already a member
        // TODO: Query by email to find userId, then check team membership

        // Create invitation
        const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const token = generateInvitationToken();

        const invitation: Invitation = {
            id: invitationId,
            organizationId,
            email: email.toLowerCase(),
            role,
            status: 'pending',
            invitedBy: currentUser.id,
            token,
            expiresAt: getInvitationExpirationDate(),
            createdAt: new Date().toISOString(),
        };

        const keys = getInvitationKeys(organizationId, invitationId, email, token);

        // Use put directly since we need GSI2 support
        const now = Date.now();
        await repository.put({
            PK: keys.PK,
            SK: keys.SK,
            EntityType: 'Invitation',
            Data: invitation,
            CreatedAt: now,
            UpdatedAt: now,
            GSI1PK: keys.GSI1PK,
            GSI1SK: keys.GSI1SK,
            GSI2PK: keys.GSI2PK,
            GSI2SK: keys.GSI2SK,
        });

        // Fetch organization details for email
        const orgKeys = getOrganizationKeys(organizationId);
        const organization = await repository.get<Organization>(orgKeys.PK, orgKeys.SK);
        const organizationName = organization?.name || 'Organization';

        // Send invitation email
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const invitationLink = `${appUrl}/login?invite=${token}`;

        await sendInvitationEmail({
            to: email,
            inviterName: profile.name || 'An admin',
            organizationName,
            invitationLink,
            role
        });

        console.log(`Invitation created for ${email} with token ${token}`);

        revalidatePath('/admin/team');
        return { message: 'success', data: invitation, errors: {} };
    } catch (error: any) {
        console.error('Error inviting team member:', error);
        return { message: 'Failed to send invitation', errors: { system: error.message } };
    }
}

export async function getPendingInvitationsAction(): Promise<{
    message: string;
    data: Invitation[];
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', data: [], errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', data: [], errors: {} };

        // Get user's organization
        const profileKeys = getProfileKeys(currentUser.id);
        const profile = await getRepository().get<any>(profileKeys.PK, profileKeys.SK);

        if (!profile?.organizationId) {
            return { message: 'success', data: [], errors: {} };
        }

        const repository = getRepository();
        const queryKeys = getOrganizationInvitationsQueryKeys(profile.organizationId);

        const result = await repository.query<Invitation>(
            queryKeys.PK,
            queryKeys.SKPrefix
        );

        // Filter for pending invitations only
        const pendingInvitations = result.items.filter(inv => inv.status === 'pending' && !isInvitationExpired(inv));

        return { message: 'success', data: pendingInvitations, errors: {} };
    } catch (error: any) {
        console.error('Error fetching pending invitations:', error);
        return { message: 'Failed to fetch invitations', data: [], errors: { system: error.message } };
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

        // Get user's organization
        const profileKeys = getProfileKeys(currentUser.id);
        const profile = await getRepository().get<any>(profileKeys.PK, profileKeys.SK);

        if (!profile?.organizationId) {
            return { message: 'No organization found', errors: {} };
        }

        const repository = getRepository();
        const keys = getInvitationKeys(profile.organizationId, invitationId);

        // Update invitation status to cancelled
        await repository.update(keys.PK, keys.SK, { status: 'cancelled' as any });

        revalidatePath('/admin/team');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error cancelling invitation:', error);
        return { message: 'Failed to cancel invitation', errors: { system: error.message } };
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

        const repository = getRepository();

        // Get user's organization
        const profileKeys = getProfileKeys(currentUser.id);
        const profile = await repository.get<any>(profileKeys.PK, profileKeys.SK);

        if (!profile?.organizationId) {
            return { message: 'No organization found', errors: {} };
        }

        const memberKeys = getTeamMemberKeys(profile.organizationId, memberId);

        // Verify member exists
        const member = await repository.get<TeamMember>(memberKeys.PK, memberKeys.SK);
        if (!member) {
            return { message: 'Member not found', errors: {} };
        }

        if (member.userId === currentUser.id) {
            return { message: 'Cannot remove yourself.', errors: {} };
        }

        if (member.role === 'owner') {
            return { message: 'Cannot remove the organization owner.', errors: {} };
        }

        // Remove member record
        await repository.delete(memberKeys.PK, memberKeys.SK);

        // Update user profile to remove organizationId
        const targetProfileKeys = getProfileKeys(memberId);
        await repository.update(targetProfileKeys.PK, targetProfileKeys.SK, {
            organizationId: null as any
        });

        revalidatePath('/admin/team');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error removing team member:', error);
        return { message: 'Failed to remove team member', errors: { system: error.message } };
    }
}

export async function updateTeamMemberRoleAction(memberId: string, role: 'member' | 'admin'): Promise<{
    message: string;
    errors: any;
}> {
    try {
        const currentUser = await getCurrentUserServer();
        if (!currentUser) return { message: 'Not authenticated', errors: {} };

        const adminStatus = await checkAdminStatusAction(currentUser.id);
        if (!adminStatus.isAdmin) return { message: 'Unauthorized', errors: {} };

        const repository = getRepository();

        // Get user's organization
        const profileKeys = getProfileKeys(currentUser.id);
        const profile = await repository.get<any>(profileKeys.PK, profileKeys.SK);

        if (!profile?.organizationId) {
            return { message: 'No organization found', errors: {} };
        }

        const memberKeys = getTeamMemberKeys(profile.organizationId, memberId);

        // Verify member exists
        const member = await repository.get<TeamMember>(memberKeys.PK, memberKeys.SK);
        if (!member) {
            return { message: 'Member not found', errors: {} };
        }

        if (member.role === 'owner') {
            return { message: 'Cannot change role of the organization owner.', errors: {} };
        }

        // Update role
        await repository.update(memberKeys.PK, memberKeys.SK, { role });

        revalidatePath('/admin/team');
        return { message: 'success', errors: {} };
    } catch (error: any) {
        console.error('Error updating team member role:', error);
        return { message: 'Failed to update role', errors: { system: error.message } };
    }
}

export const getTeamMembersAction = getOrganizationMembersAction;
