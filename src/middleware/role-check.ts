/**
 * Role Check Middleware
 * 
 * Middleware for checking user roles using Cognito Groups.
 * This is much more efficient than checking DynamoDB on every request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserRole, CognitoGroupsClient } from '@/aws/auth/cognito-groups';

/**
 * Check if user has required role from JWT token (client-side)
 */
export function checkRoleFromToken(request: NextRequest, requiredRole: UserRole): boolean {
  try {
    // Get the session from cookies
    const sessionCookie = request.cookies.get('cognito_session');
    
    if (!sessionCookie) {
      return false;
    }

    const session = JSON.parse(sessionCookie.value);
    
    if (!session.idToken) {
      return false;
    }

    // Extract roles from JWT token
    return CognitoGroupsClient.tokenHasRole(session.idToken, requiredRole);
  } catch (error) {
    console.error('Failed to check role from token:', error);
    return false;
  }
}

/**
 * Middleware to protect admin routes
 */
export function adminMiddleware(request: NextRequest) {
  const isAdmin = checkRoleFromToken(request, 'admin');
  const isSuperAdmin = checkRoleFromToken(request, 'superadmin');
  
  if (!isAdmin && !isSuperAdmin) {
    // Redirect to login or unauthorized page
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Middleware to protect super admin routes
 */
export function superAdminMiddleware(request: NextRequest) {
  const isSuperAdmin = checkRoleFromToken(request, 'superadmin');
  
  if (!isSuperAdmin) {
    // Redirect to login or unauthorized page
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Generic role check middleware
 */
export function roleMiddleware(requiredRole: UserRole) {
  return (request: NextRequest) => {
    const hasRole = checkRoleFromToken(request, requiredRole);
    
    if (!hasRole) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  };
}