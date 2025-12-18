/**
 * Cognito Groups Management API
 * 
 * API endpoints for managing Cognito Groups and user roles.
 * This replaces the DynamoDB-based role management.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getCognitoGroupsClient, 
  initializeCognitoGroups,
  makeUserAdmin,
  makeUserSuperAdmin,
  UserRole 
} from '@/aws/auth/cognito-groups';
import { requireSuperAdmin } from '@/aws/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    // Require super admin access
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');

    const groupsClient = getCognitoGroupsClient();

    switch (action) {
      case 'user-roles':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }

        const userWithRoles = await groupsClient.getUserWithGroups(userId);
        return NextResponse.json({
          success: true,
          user: userWithRoles,
        });

      case 'admin-users':
        const adminUsers = await groupsClient.getAdminUsers();
        return NextResponse.json({
          success: true,
          adminUsers,
        });

      case 'initialize':
        await initializeCognitoGroups();
        return NextResponse.json({
          success: true,
          message: 'Cognito Groups initialized successfully',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Cognito Groups API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require super admin access
    await requireSuperAdmin();

    const { action, userId, role } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const groupsClient = getCognitoGroupsClient();

    switch (action) {
      case 'make-admin':
        await makeUserAdmin(userId);
        return NextResponse.json({
          success: true,
          message: `User ${userId} is now an admin`,
        });

      case 'make-superadmin':
        await makeUserSuperAdmin(userId);
        return NextResponse.json({
          success: true,
          message: `User ${userId} is now a super admin`,
        });

      case 'remove-admin':
        await groupsClient.removeAdmin(userId);
        return NextResponse.json({
          success: true,
          message: `Admin role removed from user ${userId}`,
        });

      case 'remove-superadmin':
        await groupsClient.removeSuperAdmin(userId);
        return NextResponse.json({
          success: true,
          message: `Super admin role removed from user ${userId}`,
        });

      case 'add-to-group':
        if (!role) {
          return NextResponse.json(
            { error: 'Role is required' },
            { status: 400 }
          );
        }
        
        await groupsClient.addUserToGroup(userId, role);
        return NextResponse.json({
          success: true,
          message: `User ${userId} added to group ${role}`,
        });

      case 'remove-from-group':
        if (!role) {
          return NextResponse.json(
            { error: 'Role is required' },
            { status: 400 }
          );
        }
        
        await groupsClient.removeUserFromGroup(userId, role);
        return NextResponse.json({
          success: true,
          message: `User ${userId} removed from group ${role}`,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Cognito Groups API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}