/**
 * Server-Side Authentication Utilities
 * 
 * Utilities for checking authentication and authorization in API routes and server actions.
 * Uses Cognito Groups for role-based access control.
 */

import { cookies } from 'next/headers';
import { getCognitoGroupsClient, UserRole } from './cognito-groups';
import { getCognitoClient } from './cognito-client';

/**
 * Get the current user ID from the session cookie
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    
    // Try to get session from chunked cookies first
    const chunkCountCookie = cookieStore.get('cognito_session_chunks');
    let sessionString: string;
    
    if (chunkCountCookie) {
      // Reconstruct session from chunks
      const chunkCount = parseInt(chunkCountCookie.value);
      const chunks: string[] = [];
      
      for (let i = 0; i < chunkCount; i++) {
        const chunkCookie = cookieStore.get(`cognito_session_${i}`);
        if (!chunkCookie) {
          return null; // Missing chunk
        }
        chunks.push(chunkCookie.value);
      }
      
      sessionString = chunks.join('');
    } else {
      // Try single cookie
      const sessionCookie = cookieStore.get('cognito_session');
      if (!sessionCookie) {
        return null;
      }
      sessionString = sessionCookie.value;
    }

    const session = JSON.parse(sessionString);
    
    if (!session.accessToken) {
      return null;
    }

    // Get user from access token
    const cognitoClient = getCognitoClient();
    const user = await cognitoClient.getCurrentUser(session.accessToken);
    
    return user?.id || null;
  } catch (error) {
    console.error('Failed to get current user ID:', error);
    return null;
  }
}

/**
 * Get the current user's roles from Cognito Groups
 */
export async function getCurrentUserRoles(): Promise<UserRole[]> {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    return ['user'];
  }

  const groupsClient = getCognitoGroupsClient();
  return await groupsClient.getUserRoles(userId);
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    return false;
  }

  if (role === 'user') {
    return true; // Everyone is a user
  }

  const groupsClient = getCognitoGroupsClient();
  return await groupsClient.hasRole(userId, role);
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    return false;
  }

  const groupsClient = getCognitoGroupsClient();
  return await groupsClient.isAdmin(userId);
}

/**
 * Check if the current user is a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    return false;
  }

  const groupsClient = getCognitoGroupsClient();
  return await groupsClient.isSuperAdmin(userId);
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    throw new Error('Authentication required');
  }

  return userId;
}

/**
 * Require specific role - throws error if user doesn't have the role
 */
export async function requireRole(role: UserRole): Promise<string> {
  const userId = await requireAuth();
  
  const hasRequiredRole = await hasRole(role);
  
  if (!hasRequiredRole) {
    throw new Error(`${role} role required`);
  }

  return userId;
}

/**
 * Require admin role - throws error if user is not an admin
 */
export async function requireAdmin(): Promise<string> {
  const userId = await requireAuth();
  
  const isUserAdmin = await isAdmin();
  
  if (!isUserAdmin) {
    throw new Error('Admin role required');
  }

  return userId;
}

/**
 * Require super admin role - throws error if user is not a super admin
 */
export async function requireSuperAdmin(): Promise<string> {
  const userId = await requireAuth();
  
  const isUserSuperAdmin = await isSuperAdmin();
  
  if (!isUserSuperAdmin) {
    throw new Error('Super admin role required');
  }

  return userId;
}

/**
 * Get user with roles for server-side use
 */
export async function getCurrentUserWithRoles() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    return null;
  }

  const groupsClient = getCognitoGroupsClient();
  return await groupsClient.getUserWithGroups(userId);
}

/**
 * Get current user for server-side use
 * Returns user object with id and email
 */
export async function getCurrentUserServer(): Promise<{ id: string; email: string } | null> {
  try {
    const cookieStore = await cookies();
    
    // Try to get session from chunked cookies first
    const chunkCountCookie = cookieStore.get('cognito_session_chunks');
    let sessionString: string;
    
    if (chunkCountCookie) {
      // Reconstruct session from chunks
      const chunkCount = parseInt(chunkCountCookie.value);
      const chunks: string[] = [];
      
      for (let i = 0; i < chunkCount; i++) {
        const chunkCookie = cookieStore.get(`cognito_session_${i}`);
        if (!chunkCookie) {
          return null; // Missing chunk
        }
        chunks.push(chunkCookie.value);
      }
      
      sessionString = chunks.join('');
    } else {
      // Try single cookie
      const sessionCookie = cookieStore.get('cognito_session');
      if (!sessionCookie) {
        return null;
      }
      sessionString = sessionCookie.value;
    }

    const session = JSON.parse(sessionString);
    
    if (!session.accessToken) {
      return null;
    }

    // Get user from access token
    const cognitoClient = getCognitoClient();
    const user = await cognitoClient.getCurrentUser(session.accessToken);
    
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email
    };
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}