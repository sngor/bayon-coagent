/**
 * Cognito JWT Token Authorizer for API Gateway
 * 
 * This Lambda authorizer validates Cognito JWT tokens and generates
 * IAM policies for API Gateway access control. It ensures that JWT tokens
 * work consistently across all API Gateway service boundaries.
 * 
 * Features:
 * - JWT token validation (signature, expiration, issuer)
 * - Token refresh support
 * - Cross-service authentication
 * - IAM policy generation
 */

import {
    CognitoIdentityProviderClient,
    GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createVerifier } from 'aws-jwt-verify';
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
 * Lambda handler for Cognito JWT token authorization
 */
export async function handler(event: AuthorizerEvent): Promise<AuthorizerResponse> {
    console.log('Authorizer event:', JSON.stringify(event, null, 2));

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

        // Generate IAM policy
        const policy = generatePolicy(
            payload.sub,
            'Allow',
            event.methodArn,
            payload,
            userInfo
        );

        console.log('Authorization successful for user:', payload.sub);
        return policy;
    } catch (error) {
        console.error('Authorization failed:', error);

        // Return deny policy for invalid tokens
        // Note: We use a generic principal ID for deny policies
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
    const verifier = createVerifier({
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
        // Don't fail authorization if we can't get user info
        // The token is still valid
        return {
            username: '',
            attributes: {},
        };
    }
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
    // This allows the token to work across all endpoints in the service
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

/**
 * Validate session across service boundaries
 * 
 * This function can be called by Lambda functions to validate that
 * the session is still valid and hasn't been revoked.
 */
export async function validateSession(
    userId: string,
    accessToken: string
): Promise<boolean> {
    try {
        // Verify token is still valid
        await verifyToken(accessToken);

        // Verify user still exists and is active
        const userInfo = await getUserInfo(accessToken);

        if (!userInfo.username) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('Session validation failed:', error);
        return false;
    }
}
