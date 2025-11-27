/**
 * DynamoDB Key Generation for Organizations
 * 
 * Defines key patterns for organization-related entities
 */

/**
 * Organization keys
 * PK: ORG#<organizationId>
 * SK: METADATA
 */
export function getOrganizationKeys(organizationId: string) {
    return {
        PK: `ORG#${organizationId}`,
        SK: 'METADATA',
    };
}

/**
 * Team Member keys
 * PK: ORG#<organizationId>
 * SK: MEMBER#<userId>
 * GSI1PK: USER#<userId>
 * GSI1SK: ORG#<organizationId>
 */
export function getTeamMemberKeys(organizationId: string, userId: string) {
    return {
        PK: `ORG#${organizationId}`,
        SK: `MEMBER#${userId}`,
        GSI1PK: `USER#${userId}`,
        GSI1SK: `ORG#${organizationId}`,
    };
}

/**
 * Invitation keys
 * PK: ORG#<organizationId>
 * SK: INVITE#<invitationId>
 * GSI1PK: EMAIL#<email>
 * GSI1SK: INVITE#<invitationId>
 * GSI2PK: TOKEN#<token>
 * GSI2SK: INVITE#<invitationId>
 */
export function getInvitationKeys(organizationId: string, invitationId: string, email?: string, token?: string) {
    const keys: any = {
        PK: `ORG#${organizationId}`,
        SK: `INVITE#${invitationId}`,
    };

    if (email) {
        keys.GSI1PK = `EMAIL#${email.toLowerCase()}`;
        keys.GSI1SK = `INVITE#${invitationId}`;
    }

    if (token) {
        keys.GSI2PK = `TOKEN#${token}`;
        keys.GSI2SK = `INVITE#${invitationId}`;
    }

    return keys;
}

/**
 * Query pattern: Get all members of an organization
 */
export function getOrganizationMembersQueryKeys(organizationId: string) {
    return {
        PK: `ORG#${organizationId}`,
        SKPrefix: 'MEMBER#',
    };
}

/**
 * Query pattern: Get all invitations for an organization
 */
export function getOrganizationInvitationsQueryKeys(organizationId: string) {
    return {
        PK: `ORG#${organizationId}`,
        SKPrefix: 'INVITE#',
    };
}

/**
 * Query pattern: Get invitations by email (GSI1)
 */
export function getInvitationsByEmailQueryKeys(email: string) {
    return {
        GSI1PK: `EMAIL#${email.toLowerCase()}`,
        GSI1SKPrefix: 'INVITE#',
    };
}

/**
 * Query pattern: Get invitation by token (GSI2)
 */
export function getInvitationByTokenQueryKeys(token: string) {
    return {
        GSI2PK: `TOKEN#${token}`,
        GSI2SKPrefix: 'INVITE#',
    };
}

/**
 * Query pattern: Get user's organizations (GSI1)
 */
export function getUserOrganizationsQueryKeys(userId: string) {
    return {
        GSI1PK: `USER#${userId}`,
        GSI1SKPrefix: 'ORG#',
    };
}
