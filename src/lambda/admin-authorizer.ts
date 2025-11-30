/**
 * Admin Authorizer Lambda
 * 
 * Custom authorizer for Admin Service API Gateway that validates:
 * 1. JWT token is valid (using Cognito authorizer)
 * 2. User has admin role in Cognito user attributes
 * 
 * Requirements: 8.2 - Admin authentication with elevated privileges
 */

import {
    CognitoIdentityProviderClient,
    GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { getConfig } from '../aws/config';

interface AuthorizerEvent {
    type: string;
    methodArn: string;
    authorizationToken?: string;
    headers?: Record<string, string>;
    requestContext?: {
        accountId: string;
        apiId: string;
        stage: string;
    };
}

interface AuthorizerResponse {
    principalId: string;
    policyDocument: {
        Version: string;
        Statement: Array<{
            Action: string;
            Effect: string;
            Resource: string;
        }>;
    };
    context?: Record<string, string | number | boolean>;
}

interface CognitoTokenPayload {
    sub: string;
    email?: string;
    email_verified?: boolean;
    'cognito:username'?: string;
    'cognito:groups'?: string[];
    token_use: 'access' | 'id';
    auth_time: number;
    exp: number;
    iat: number;
    iss: string;
}

/**
 * Lambda handler for admin authorization
 */
export async function handler(event: AuthorizerEvent): Promise<AuthorizerResponse> {
    console.log('Admin authorizer event:', JSON.stringify(event, null, 2));

    try {
        // Extract token from Authorization header
        const token = extractToken(event);

        if (!token) {
            throw new Error('No authorization token provided');
        }

        // Verify and decode the JWT token
        const payload = await verifyToken(token);

        // Validate token payload
        validateTokenPayload(payload);

        // Get user information from Cognito
        const userInfo = await getUserInfo(token);

        // Check if user has admin role
        const isAdmin = checkAdminRole(userInfo.attributes);

        if (!isAdmin) {
            console.log('User is not an admin:', payload.sub);
            return generatePolicy('unauthorized', 'Deny', event.methodArn);
        }

        // Generate IAM policy
        const policy = generatePolicy(
            payload.sub,
            'Allow',
            event.methodArn,
            payload,
            userInfo
        );

        console.log('Admin authorization successful for user:', payload.sub);
        return policy;
    } catch (error) {
        console.error('Admin authorization failed:', error);

        // Return deny policy for invalid tokens or non-admin users
        return generatePolicy('unauthorized', 'Deny', event.methodArn);
    }
}

/**
 * Extract JWT token from Authorization header
 */
function extractToken(event: AuthorizerEvent): string | null {
    // Check authorizationToken (for TOKEN authorizer type)
    if (event.authorizationToken) {
        const match = event.authorizationToken.match(/^Bearer\s+(.+)$/i);
        return match ? match[1] : null;
    }

    // Check headers (for REQUEST authorizer type)
    if (event.headers) {
        const authHeader =
            event.headers.Authorization ||
            event.headers.authorization ||
            event.headers['X-Authorization'] ||
            event.headers['x-authorization'];

        if (authHeader) {
            const match = authHeader.match(/^Bearer\s+(.+)$/i);
            return match ? match[1] : null;
        }
    }

    return null;
}

/**
 * Verify JWT token using aws-jwt-verify
 */
async function verifyToken(token: string): Promise<CognitoTokenPayload> {
    const config = getConfig();

    // Create JWT verifier for Cognito User Pool
    const verifier = CognitoJwtVerifier.create({
        userPoolId: config.cognito.userPoolId,
        tokenUse: 'access', // Verify access tokens
        clientId: config.cognito.clientId,
    });

    try {
        // Verify token signature, expiration, and issuer
        const payload = await verifier.verify(token);
        return payload as CognitoTokenPayload;
    } catch (error) {
        console.error('Token verification failed:', error);
        throw new Error(`Invalid token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Validate token payload structure and claims
 */
function validateTokenPayload(payload: CognitoTokenPayload): void {
    // Validate required claims
    if (!payload.sub) {
        throw new Error('Token missing required claim: sub');
    }

    if (!payload.token_use || payload.token_use !== 'access') {
        throw new Error('Invalid token_use claim');
    }

    // Validate expiration (additional check beyond jwt-verify)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
        throw new Error('Token has expired');
    }

    // Validate auth_time (token should not be too old)
    const maxTokenAge = 24 * 60 * 60; // 24 hours
    if (now - payload.auth_time > maxTokenAge) {
        throw new Error('Token is too old, please re-authenticate');
    }
}

/**
 * Get user information from Cognito
 */
async function getUserInfo(accessToken: string): Promise<{
    username: string;
    email?: string;
    emailVerified?: boolean;
    attributes: Record<string, string>;
}> {
    const config = getConfig();

    const client = new CognitoIdentityProviderClient({
        region: config.region,
        endpoint: config.cognito.endpoint,
    });

    try {
        const command = new GetUserCommand({
            AccessToken: accessToken,
        });

        const response = await client.send(command);

        const attributes: Record<string, string> = {};
        let email: string | undefined;
        let emailVerified: boolean | undefined;

        if (response.UserAttributes) {
            for (const attr of response.UserAttributes) {
                if (attr.Name && attr.Value) {
                    attributes[attr.Name] = attr.Value;

                    if (attr.Name === 'email') {
                        email = attr.Value;
                    }
                    if (attr.Name === 'email_verified') {
                        emailVerified = attr.Value === 'true';
                    }
                }
            }
        }

        return {
            username: response.Username || '',
            email,
            emailVerified,
            attributes,
        };
    } catch (error) {
        console.error('Failed to get user info:', error);
        throw new Error('Failed to get user information from Cognito');
    }
}

/**
 * Check if user has admin role
 * 
 * Checks for:
 * 1. custom:role attribute set to 'admin'
 * 2. custom:isAdmin attribute set to 'true'
 * 3. cognito:groups containing 'admin' or 'administrators'
 */
function checkAdminRole(attributes: Record<string, string>): boolean {
    // Check custom:role attribute
    if (attributes['custom:role'] === 'admin') {
        return true;
    }

    // Check custom:isAdmin attribute
    if (attributes['custom:isAdmin'] === 'true') {
        return true;
    }

    // Check cognito:groups (comma-separated list)
    const groups = attributes['cognito:groups'];
    if (groups) {
        const groupList = groups.split(',').map(g => g.trim().toLowerCase());
        if (groupList.includes('admin') || groupList.includes('administrators')) {
            return true;
        }
    }

    return false;
}

/**
 * Generate IAM policy for API Gateway
 */
function generatePolicy(
    principalId: string,
    effect: 'Allow' | 'Deny',
    resource: string,
    tokenPayload?: CognitoTokenPayload,
    userInfo?: {
        username: string;
        email?: string;
        emailVerified?: boolean;
        attributes: Record<string, string>;
    }
): AuthorizerResponse {
    // Extract API Gateway ARN components
    const arnParts = resource.split(':');
    const apiGatewayArnPart = arnParts[5]?.split('/');
    const awsAccountId = arnParts[4];
    const region = arnParts[3];
    const restApiId = apiGatewayArnPart?.[0];
    const stage = apiGatewayArnPart?.[1];

    // Generate policy that applies to all methods and resources in this API
    const policyResource = `arn:aws:execute-api:${region}:${awsAccountId}:${restApiId}/${stage}/*/*`;

    const policy: AuthorizerResponse = {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: policyResource,
                },
            ],
        },
    };

    // Add context for downstream Lambda functions
    if (effect === 'Allow' && tokenPayload && userInfo) {
        policy.context = {
            userId: tokenPayload.sub,
            email: userInfo.email || tokenPayload.email || '',
            emailVerified: String(userInfo.emailVerified ?? tokenPayload.email_verified ?? false),
            username: userInfo.username || tokenPayload['cognito:username'] || '',
            authTime: tokenPayload.auth_time,
            tokenExpiration: tokenPayload.exp,
            isAdmin: 'true',
            // Add custom attributes if needed
            ...(userInfo.attributes.agentId && { agentId: userInfo.attributes.agentId }),
            ...(userInfo.attributes.businessName && { businessName: userInfo.attributes.businessName }),
        };

        // Add groups/roles if present
        if (tokenPayload['cognito:groups']) {
            policy.context.groups = tokenPayload['cognito:groups'].join(',');
        }
    }

    return policy;
}
