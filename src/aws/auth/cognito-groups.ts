/**
 * AWS Cognito Groups Management
 * 
 * This module handles Cognito Groups for role-based access control.
 * Uses Cognito Groups instead of DynamoDB for better performance and security.
 */

import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand,
  CreateGroupCommand,
  GetGroupCommand,
  ListUsersInGroupCommand,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { getAWSConfig } from '@/aws/config';

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface CognitoGroup {
  GroupName: string;
  Description?: string;
  RoleArn?: string;
  Precedence?: number;
}

export interface UserWithGroups {
  userId: string;
  email: string;
  groups: string[];
  roles: UserRole[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

/**
 * Cognito Groups Management Client
 */
export class CognitoGroupsClient {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;

  constructor() {
    this.client = new CognitoIdentityProviderClient(getAWSConfig());
    this.userPoolId = process.env.COGNITO_USER_POOL_ID || 'us-west-2_wqsUAbADO';
  }

  /**
   * Create Cognito groups if they don't exist
   */
  async initializeGroups(): Promise<void> {
    const groups = [
      {
        GroupName: 'admin',
        Description: 'Administrator users with access to admin panel',
        Precedence: 10,
      },
      {
        GroupName: 'superadmin',
        Description: 'Super administrator users with full system access',
        Precedence: 5,
      },
    ];

    for (const group of groups) {
      try {
        // Check if group exists
        await this.client.send(new GetGroupCommand({
          UserPoolId: this.userPoolId,
          GroupName: group.GroupName,
        }));
        console.log(`Group ${group.GroupName} already exists`);
      } catch (error) {
        // Group doesn't exist, create it
        try {
          await this.client.send(new CreateGroupCommand({
            UserPoolId: this.userPoolId,
            ...group,
          }));
          console.log(`Created group: ${group.GroupName}`);
        } catch (createError) {
          console.error(`Failed to create group ${group.GroupName}:`, createError);
        }
      }
    }
  }

  /**
   * Add user to a group
   */
  async addUserToGroup(userId: string, groupName: string): Promise<void> {
    try {
      await this.client.send(new AdminAddUserToGroupCommand({
        UserPoolId: this.userPoolId,
        Username: userId,
        GroupName: groupName,
      }));
      console.log(`Added user ${userId} to group ${groupName}`);
    } catch (error) {
      console.error(`Failed to add user ${userId} to group ${groupName}:`, error);
      throw new Error(`Failed to add user to group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove user from a group
   */
  async removeUserFromGroup(userId: string, groupName: string): Promise<void> {
    try {
      await this.client.send(new AdminRemoveUserFromGroupCommand({
        UserPoolId: this.userPoolId,
        Username: userId,
        GroupName: groupName,
      }));
      console.log(`Removed user ${userId} from group ${groupName}`);
    } catch (error) {
      console.error(`Failed to remove user ${userId} from group ${groupName}:`, error);
      throw new Error(`Failed to remove user from group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all groups for a user
   */
  async getUserGroups(userId: string): Promise<string[]> {
    try {
      const response = await this.client.send(new AdminListGroupsForUserCommand({
        UserPoolId: this.userPoolId,
        Username: userId,
      }));

      return response.Groups?.map(group => group.GroupName || '') || [];
    } catch (error) {
      console.error(`Failed to get groups for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get user roles based on groups
   */
  async getUserRoles(userId: string): Promise<UserRole[]> {
    const groups = await this.getUserGroups(userId);
    const roles: UserRole[] = ['user']; // Everyone is a user

    if (groups.includes('admin')) {
      roles.push('admin');
    }
    if (groups.includes('superadmin')) {
      roles.push('superadmin');
    }

    return roles;
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(userId: string, role: UserRole): Promise<boolean> {
    if (role === 'user') {
      return true; // Everyone is a user
    }

    const groups = await this.getUserGroups(userId);
    return groups.includes(role);
  }

  /**
   * Check if user is admin (has admin or superadmin role)
   */
  async isAdmin(userId: string): Promise<boolean> {
    const groups = await this.getUserGroups(userId);
    return groups.includes('admin') || groups.includes('superadmin');
  }

  /**
   * Check if user is super admin
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    const groups = await this.getUserGroups(userId);
    return groups.includes('superadmin');
  }

  /**
   * Get user with groups and roles
   */
  async getUserWithGroups(userId: string): Promise<UserWithGroups | null> {
    try {
      // Get user details
      const userResponse = await this.client.send(new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: userId,
      }));

      const email = userResponse.UserAttributes?.find(attr => attr.Name === 'email')?.Value || '';
      const groups = await this.getUserGroups(userId);
      const roles = await this.getUserRoles(userId);

      return {
        userId,
        email,
        groups,
        roles,
        isAdmin: groups.includes('admin') || groups.includes('superadmin'),
        isSuperAdmin: groups.includes('superadmin'),
      };
    } catch (error) {
      console.error(`Failed to get user with groups ${userId}:`, error);
      return null;
    }
  }

  /**
   * Make user an admin
   */
  async makeAdmin(userId: string): Promise<void> {
    await this.addUserToGroup(userId, 'admin');
  }

  /**
   * Make user a super admin
   */
  async makeSuperAdmin(userId: string): Promise<void> {
    // Super admins should also be admins
    await this.addUserToGroup(userId, 'admin');
    await this.addUserToGroup(userId, 'superadmin');
  }

  /**
   * Remove admin role from user
   */
  async removeAdmin(userId: string): Promise<void> {
    await this.removeUserFromGroup(userId, 'admin');
  }

  /**
   * Remove super admin role from user
   */
  async removeSuperAdmin(userId: string): Promise<void> {
    await this.removeUserFromGroup(userId, 'superadmin');
  }

  /**
   * Get all users in a group
   */
  async getUsersInGroup(groupName: string): Promise<Array<{ userId: string; email: string }>> {
    try {
      const response = await this.client.send(new ListUsersInGroupCommand({
        UserPoolId: this.userPoolId,
        GroupName: groupName,
      }));

      return response.Users?.map(user => ({
        userId: user.Username || '',
        email: user.Attributes?.find(attr => attr.Name === 'email')?.Value || '',
      })) || [];
    } catch (error) {
      console.error(`Failed to get users in group ${groupName}:`, error);
      return [];
    }
  }

  /**
   * Get all admin users
   */
  async getAdminUsers(): Promise<Array<{ userId: string; email: string; isSuperAdmin: boolean }>> {
    const adminUsers = await this.getUsersInGroup('admin');
    const superAdminUsers = await this.getUsersInGroup('superadmin');
    
    const superAdminIds = new Set(superAdminUsers.map(u => u.userId));

    return adminUsers.map(user => ({
      ...user,
      isSuperAdmin: superAdminIds.has(user.userId),
    }));
  }

  /**
   * Extract roles from JWT token (client-side)
   */
  static extractRolesFromToken(idToken: string): UserRole[] {
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      const groups = payload['cognito:groups'] || [];
      
      const roles: UserRole[] = ['user']; // Everyone is a user
      
      if (groups.includes('admin')) {
        roles.push('admin');
      }
      if (groups.includes('superadmin')) {
        roles.push('superadmin');
      }

      return roles;
    } catch (error) {
      console.error('Failed to extract roles from token:', error);
      return ['user'];
    }
  }

  /**
   * Check if token has specific role (client-side)
   */
  static tokenHasRole(idToken: string, role: UserRole): boolean {
    const roles = CognitoGroupsClient.extractRolesFromToken(idToken);
    return roles.includes(role);
  }
}

// Export singleton instance
let cognitoGroupsClient: CognitoGroupsClient | null = null;

export function getCognitoGroupsClient(): CognitoGroupsClient {
  if (!cognitoGroupsClient) {
    cognitoGroupsClient = new CognitoGroupsClient();
  }
  return cognitoGroupsClient;
}

/**
 * Utility functions for easy access
 */

export async function initializeCognitoGroups(): Promise<void> {
  const client = getCognitoGroupsClient();
  await client.initializeGroups();
}

export async function makeUserAdmin(userId: string): Promise<void> {
  const client = getCognitoGroupsClient();
  await client.makeAdmin(userId);
}

export async function makeUserSuperAdmin(userId: string): Promise<void> {
  const client = getCognitoGroupsClient();
  await client.makeSuperAdmin(userId);
}

export async function checkUserRole(userId: string, role: UserRole): Promise<boolean> {
  const client = getCognitoGroupsClient();
  return await client.hasRole(userId, role);
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const client = getCognitoGroupsClient();
  return await client.isAdmin(userId);
}

export async function isUserSuperAdmin(userId: string): Promise<boolean> {
  const client = getCognitoGroupsClient();
  return await client.isSuperAdmin(userId);
}

export async function getUserWithRoles(userId: string): Promise<UserWithGroups | null> {
  const client = getCognitoGroupsClient();
  return await client.getUserWithGroups(userId);
}