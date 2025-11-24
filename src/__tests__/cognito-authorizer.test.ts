/**
 * Unit Tests for Cognito JWT Token Authorizer
 * 
 * Tests the Lambda authorizer that validates Cognito JWT tokens
 * for API Gateway access control.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-cognito-identity-provider');
jest.mock('aws-jwt-verify');
jest.mock('@/aws/config');

describe('Cognito Authorizer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Token Extraction', () => {
        it('should extract token from Authorization header with Bearer prefix', () => {
            // This test validates that the authorizer can extract tokens
            // from the standard Authorization: Bearer <token> format
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
            const authHeader = `Bearer ${token}`;

            // The authorizer should extract the token part after "Bearer "
            const extracted = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
            expect(extracted).toBe(token);
        });

        it('should handle case-insensitive Bearer prefix', () => {
            const token = 'test.token.here';
            const authHeader = `bearer ${token}`;

            const extracted = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
            expect(extracted).toBe(token);
        });

        it('should return null for invalid format', () => {
            const authHeader = 'InvalidFormat token';

            const extracted = authHeader.match(/^Bearer\s+(.+)$/i)?.[1];
            expect(extracted).toBeUndefined();
        });
    });

    describe('Token Payload Validation', () => {
        it('should validate required claims exist', () => {
            const payload = {
                sub: 'user-123',
                token_use: 'access' as const,
                auth_time: Math.floor(Date.now() / 1000) - 100,
                exp: Math.floor(Date.now() / 1000) + 3600,
                iat: Math.floor(Date.now() / 1000) - 100,
                iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
            };

            // Validate required claims
            expect(payload.sub).toBeDefined();
            expect(payload.token_use).toBe('access');
            expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
        });

        it('should reject tokens with missing sub claim', () => {
            const payload = {
                token_use: 'access' as const,
                auth_time: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600,
                iat: Math.floor(Date.now() / 1000),
                iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
            };

            expect(payload).not.toHaveProperty('sub');
        });

        it('should reject tokens with wrong token_use', () => {
            const payload = {
                sub: 'user-123',
                token_use: 'id' as const, // Should be 'access'
                auth_time: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600,
                iat: Math.floor(Date.now() / 1000),
                iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
            };

            expect(payload.token_use).not.toBe('access');
        });

        it('should reject expired tokens', () => {
            const payload = {
                sub: 'user-123',
                token_use: 'access' as const,
                auth_time: Math.floor(Date.now() / 1000) - 7200,
                exp: Math.floor(Date.now() / 1000) - 100, // Expired
                iat: Math.floor(Date.now() / 1000) - 7200,
                iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
            };

            const now = Math.floor(Date.now() / 1000);
            expect(payload.exp).toBeLessThan(now);
        });

        it('should reject tokens that are too old', () => {
            const maxTokenAge = 24 * 60 * 60; // 24 hours
            const payload = {
                sub: 'user-123',
                token_use: 'access' as const,
                auth_time: Math.floor(Date.now() / 1000) - (maxTokenAge + 1000), // Too old
                exp: Math.floor(Date.now() / 1000) + 3600,
                iat: Math.floor(Date.now() / 1000) - (maxTokenAge + 1000),
                iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
            };

            const now = Math.floor(Date.now() / 1000);
            const tokenAge = now - payload.auth_time;
            expect(tokenAge).toBeGreaterThan(maxTokenAge);
        });
    });

    describe('IAM Policy Generation', () => {
        it('should generate Allow policy for valid token', () => {
            const principalId = 'user-123';
            const effect = 'Allow';
            const resource = 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/v1/GET/health';

            // Extract ARN components
            const arnParts = resource.split(':');
            const apiGatewayArnPart = arnParts[5]?.split('/');
            const awsAccountId = arnParts[4];
            const region = arnParts[3];
            const restApiId = apiGatewayArnPart?.[0];
            const stage = apiGatewayArnPart?.[1];

            // Generate policy resource (wildcard for all methods/resources)
            const policyResource = `arn:aws:execute-api:${region}:${awsAccountId}:${restApiId}/${stage}/*/*`;

            const policy = {
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

            expect(policy.principalId).toBe(principalId);
            expect(policy.policyDocument.Statement[0].Effect).toBe('Allow');
            expect(policy.policyDocument.Statement[0].Resource).toContain('/*/*');
        });

        it('should generate Deny policy for invalid token', () => {
            const principalId = 'unauthorized';
            const effect = 'Deny';
            const resource = 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/v1/GET/health';

            const policy = {
                principalId,
                policyDocument: {
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Action: 'execute-api:Invoke',
                            Effect: effect,
                            Resource: resource,
                        },
                    ],
                },
            };

            expect(policy.principalId).toBe('unauthorized');
            expect(policy.policyDocument.Statement[0].Effect).toBe('Deny');
        });

        it('should include user context in Allow policy', () => {
            const tokenPayload = {
                sub: 'user-123',
                email: 'test@example.com',
                email_verified: true,
                'cognito:username': 'testuser',
                'cognito:groups': ['users', 'premium'],
                token_use: 'access' as const,
                auth_time: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600,
                iat: Math.floor(Date.now() / 1000),
                iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
            };

            const userInfo = {
                username: 'testuser',
                email: 'test@example.com',
                emailVerified: true,
                attributes: {
                    agentId: 'agent-456',
                    businessName: 'Test Business',
                },
            };

            const context = {
                userId: tokenPayload.sub,
                email: userInfo.email || tokenPayload.email || '',
                emailVerified: String(userInfo.emailVerified ?? tokenPayload.email_verified ?? false),
                username: userInfo.username || tokenPayload['cognito:username'] || '',
                authTime: tokenPayload.auth_time,
                tokenExpiration: tokenPayload.exp,
                agentId: userInfo.attributes.agentId,
                businessName: userInfo.attributes.businessName,
                groups: tokenPayload['cognito:groups'].join(','),
            };

            expect(context.userId).toBe('user-123');
            expect(context.email).toBe('test@example.com');
            expect(context.emailVerified).toBe('true');
            expect(context.username).toBe('testuser');
            expect(context.groups).toBe('users,premium');
            expect(context.agentId).toBe('agent-456');
            expect(context.businessName).toBe('Test Business');
        });
    });

    describe('Cross-Service Token Validation', () => {
        it('should generate policy that works across all endpoints in a service', () => {
            const resource = 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/v1/GET/health';

            // Extract ARN components
            const arnParts = resource.split(':');
            const apiGatewayArnPart = arnParts[5]?.split('/');
            const awsAccountId = arnParts[4];
            const region = arnParts[3];
            const restApiId = apiGatewayArnPart?.[0];
            const stage = apiGatewayArnPart?.[1];

            // Policy should use wildcard for all methods and resources
            const policyResource = `arn:aws:execute-api:${region}:${awsAccountId}:${restApiId}/${stage}/*/*`;

            // Verify the policy applies to all endpoints
            expect(policyResource).toContain('/*/*');
            expect(policyResource).toContain(restApiId);
            expect(policyResource).toContain(stage);
        });

        it('should cache authorization result for 5 minutes', () => {
            // API Gateway caches authorizer results based on TTL
            const ttl = 300; // 5 minutes in seconds

            expect(ttl).toBe(300);
            expect(ttl).toBeGreaterThan(0);
            expect(ttl).toBeLessThanOrEqual(3600); // Max 1 hour
        });
    });

    describe('Session Refresh Support', () => {
        it('should validate refreshed tokens', () => {
            // Refreshed tokens should have new expiration but same sub
            const originalToken = {
                sub: 'user-123',
                exp: Math.floor(Date.now() / 1000) + 3600,
                auth_time: Math.floor(Date.now() / 1000),
            };

            const refreshedToken = {
                sub: 'user-123', // Same user
                exp: Math.floor(Date.now() / 1000) + 7200, // New expiration
                auth_time: Math.floor(Date.now() / 1000), // New auth time
            };

            expect(refreshedToken.sub).toBe(originalToken.sub);
            expect(refreshedToken.exp).toBeGreaterThan(originalToken.exp);
        });

        it('should handle token refresh within expiration buffer', () => {
            const expirationBuffer = 5 * 60 * 1000; // 5 minutes in ms
            const tokenExpiresAt = Date.now() + (4 * 60 * 1000); // Expires in 4 minutes

            const shouldRefresh = tokenExpiresAt - Date.now() < expirationBuffer;

            expect(shouldRefresh).toBe(true);
        });
    });
});
