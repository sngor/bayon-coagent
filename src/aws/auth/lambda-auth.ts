/**
 * Lambda Authentication Utilities
 * Handles user authentication in Lambda functions
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

interface AuthenticatedUser {
    userId: string;
    email: string;
    role?: string;
    agentId?: string;
    businessName?: string;
}

// Create JWT verifier for Cognito tokens
const jwtVerifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID!,
    tokenUse: 'access',
    clientId: process.env.COGNITO_CLIENT_ID!,
});

/**
 * Extract and verify user from API Gateway event
 */
export async function getCurrentUserFromEvent(
    event: APIGatewayProxyEvent
): Promise<AuthenticatedUser | null> {
    try {
        // Check for Authorization header
        const authHeader = event.headers.Authorization || event.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.warn('No valid Authorization header found');
            return null;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify the JWT token
        const payload = await jwtVerifier.verify(token);

        return {
            userId: payload.sub,
            email: payload.email || '',
            role: payload['custom:role'],
            agentId: payload['custom:agentId'],
            businessName: payload['custom:businessName'],
        };
    } catch (error) {
        console.error('Authentication error:', error);
        return null;
    }
}

/**
 * Extract user ID from IAM context (for API Gateway with IAM auth)
 */
export function getUserIdFromIAMContext(event: APIGatewayProxyEvent): string | null {
    try {
        // For IAM authentication, user ID is in the request context
        const principalId = event.requestContext.authorizer?.principalId;

        if (principalId && principalId.startsWith('USER#')) {
            return principalId.substring(5); // Remove 'USER#' prefix
        }

        return principalId || null;
    } catch (error) {
        console.error('IAM context extraction error:', error);
        return null;
    }
}

/**
 * Middleware to require authentication
 */
export function requireAuth<T extends APIGatewayProxyEvent>(
    handler: (event: T, user: AuthenticatedUser) => Promise<any>
) {
    return async (event: T) => {
        const user = await getCurrentUserFromEvent(event);

        if (!user) {
            return {
                statusCode: 401,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: 'Unauthorized',
                    message: 'Valid authentication token required',
                }),
            };
        }

        return handler(event, user);
    };
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: AuthenticatedUser): boolean {
    return user.role === 'admin' || user.role === 'super_admin';
}

/**
 * Require admin role middleware
 */
export function requireAdmin<T extends APIGatewayProxyEvent>(
    handler: (event: T, user: AuthenticatedUser) => Promise<any>
) {
    return requireAuth(async (event: T, user: AuthenticatedUser) => {
        if (!isAdmin(user)) {
            return {
                statusCode: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    error: 'Forbidden',
                    message: 'Admin role required',
                }),
            };
        }

        return handler(event, user);
    });
}