/**
 * Organization and Team Management Types
 * 
 * Defines types for multi-user organizations, team management, and invitations
 */

export interface Organization {
    id: string;
    name: string;
    description: string;
    website: string;
    ownerId: string; // User who created the organization
    settings: OrganizationSettings;
    createdAt: string;
    updatedAt: string;
}

export interface OrganizationSettings {
    allowMemberInvites: boolean; // Allow non-admin members to invite others
    requireApproval: boolean; // Require admin approval for new members
}

export interface TeamMember {
    userId: string;
    organizationId: string;
    role: TeamRole;
    status: TeamMemberStatus;
    joinedAt: string;
    updatedAt: string;
}

export type TeamRole = 'owner' | 'admin' | 'member';
export type TeamMemberStatus = 'active' | 'suspended';

export interface Invitation {
    id: string;
    organizationId: string;
    email: string;
    role: 'admin' | 'member';
    status: InvitationStatus;
    invitedBy: string; // User ID of admin who sent invitation
    token: string; // Unique token for invitation link
    expiresAt: string;
    createdAt: string;
    acceptedAt?: string;
    rejectedAt?: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

export interface InvitationWithDetails extends Invitation {
    organizationName?: string;
    inviterName?: string;
}

// Helper function to check if invitation is expired
export function isInvitationExpired(invitation: Invitation): boolean {
    return new Date(invitation.expiresAt) < new Date();
}

// Helper function to generate invitation expiration date (7 days from now)
export function getInvitationExpirationDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString();
}

// Helper function to generate unique invitation token
export function generateInvitationToken(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
