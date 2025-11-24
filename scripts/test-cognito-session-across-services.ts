/**
 * Test Script: Cognito Session Across Services
 * 
 * This script tests that Cognito JWT tokens work correctly across all
 * API Gateway service boundaries. It verifies:
 * 1. JWT tokens are valid and can be verified
 * 2. Tokens work with all API Gateways (AI, Integration, Background, Admin)
 * 3. Session refresh works across service boundaries
 * 4. Lambda authorizer validates tokens correctly
 */

import { getCognitoClient } from '../src/aws/auth/cognito-client';
import { getServiceEndpoints } from '../src/aws/api-gateway/config';
import { SignatureV4 } from '@smithy/signature-v4';
import { HttpRequest } from '@smithy/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';
import { getConfig, getAWSCredentials } from '../src/aws/config';

interface TestResult {
    service: string;
    endpoint: string;
    success: boolean;
    statusCode?: number;
    error?: string;
    responseTime?: number;
}

/**
 * Test JWT token with a specific service endpoint
 */
async function testServiceEndpoint(
    serviceName: string,
    endpoint: string,
    accessToken: string
): Promise<TestResult> {
    const startTime = Date.now();

    try {
        console.log(`\nTesting ${serviceName} service...`);
        console.log(`Endpoint: ${endpoint}/health`);

        // Make request with JWT token in Authorization header
        const response = await fetch(`${endpoint}/health`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        const responseTime = Date.now() - startTime;
        const success = response.ok;

        if (success) {
            const data = await response.json();
            console.log(`✓ ${serviceName} service: SUCCESS (${response.status})`);
            console.log(`  Response time: ${responseTime}ms`);
            console.log(`  Health status:`, data);
        } else {
            const errorText = await response.text();
            console.log(`✗ ${serviceName} service: FAILED (${response.status})`);
            console.log(`  Error:`, errorText);
        }

        return {
            service: serviceName,
            endpoint,
            success,
            statusCode: response.status,
            responseTime,
        };
    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.log(`✗ ${serviceName} service: ERROR`);
        console.log(`  Error:`, error instanceof Error ? error.message : String(error));

        return {
            service: serviceName,
            endpoint,
            success: false,
            error: error instanceof Error ? error.message : String(error),
            responseTime,
        };
    }
}

/**
 * Test session refresh across services
 */
async function testSessionRefresh(
    refreshToken: string
): Promise<{ success: boolean; newAccessToken?: string; error?: string }> {
    try {
        console.log('\n=== Testing Session Refresh ===');

        const cognitoClient = getCognitoClient();
        const newSession = await cognitoClient.refreshSession(refreshToken);

        console.log('✓ Session refresh: SUCCESS');
        console.log(`  New access token expires at: ${new Date(newSession.expiresAt).toISOString()}`);

        return {
            success: true,
            newAccessToken: newSession.accessToken,
        };
    } catch (error) {
        console.log('✗ Session refresh: FAILED');
        console.log(`  Error:`, error instanceof Error ? error.message : String(error));

        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Test Lambda authorizer directly
 */
async function testLambdaAuthorizer(
    accessToken: string
): Promise<{ success: boolean; error?: string }> {
    try {
        console.log('\n=== Testing Lambda Authorizer ===');

        // Import the authorizer handler
        const { handler } = await import('../src/lambda/cognito-authorizer');

        // Create a mock authorizer event
        const event = {
            type: 'TOKEN',
            methodArn: 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/v1/GET/health',
            authorizationToken: `Bearer ${accessToken}`,
        };

        // Invoke the authorizer
        const result = await handler(event);

        if (result.policyDocument.Statement[0].Effect === 'Allow') {
            console.log('✓ Lambda authorizer: SUCCESS');
            console.log(`  Principal ID: ${result.principalId}`);
            console.log(`  Context:`, result.context);
            return { success: true };
        } else {
            console.log('✗ Lambda authorizer: DENIED');
            return { success: false, error: 'Authorization denied' };
        }
    } catch (error) {
        console.log('✗ Lambda authorizer: ERROR');
        console.log(`  Error:`, error instanceof Error ? error.message : String(error));

        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Main test function
 */
async function main() {
    console.log('='.repeat(60));
    console.log('Cognito Session Across Services Test');
    console.log('='.repeat(60));

    // Get test credentials from environment or prompt
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    console.log(`\nTest user: ${testEmail}`);

    try {
        // Step 1: Sign in to get JWT tokens
        console.log('\n=== Step 1: Sign In ===');
        const cognitoClient = getCognitoClient();
        const session = await cognitoClient.signIn(testEmail, testPassword);

        console.log('✓ Sign in successful');
        console.log(`  Access token expires at: ${new Date(session.expiresAt).toISOString()}`);

        // Step 2: Test Lambda authorizer
        const authorizerResult = await testLambdaAuthorizer(session.accessToken);

        // Step 3: Get service endpoints
        const endpoints = getServiceEndpoints();
        console.log('\n=== Step 2: Service Endpoints ===');
        console.log('AI Service:', endpoints.ai);
        console.log('Integration Service:', endpoints.integration);
        console.log('Background Service:', endpoints.background);
        console.log('Admin Service:', endpoints.admin);

        // Step 4: Test each service endpoint
        console.log('\n=== Step 3: Testing Service Endpoints ===');
        const results: TestResult[] = [];

        // Test AI Service
        results.push(
            await testServiceEndpoint('AI', endpoints.ai, session.accessToken)
        );

        // Test Integration Service
        results.push(
            await testServiceEndpoint('Integration', endpoints.integration, session.accessToken)
        );

        // Test Background Service
        results.push(
            await testServiceEndpoint('Background', endpoints.background, session.accessToken)
        );

        // Test Admin Service
        results.push(
            await testServiceEndpoint('Admin', endpoints.admin, session.accessToken)
        );

        // Step 5: Test session refresh
        const refreshResult = await testSessionRefresh(session.refreshToken);

        // Step 6: Test refreshed token with one service
        if (refreshResult.success && refreshResult.newAccessToken) {
            console.log('\n=== Step 4: Testing Refreshed Token ===');
            const refreshedTokenResult = await testServiceEndpoint(
                'AI (with refreshed token)',
                endpoints.ai,
                refreshResult.newAccessToken
            );
            results.push(refreshedTokenResult);
        }

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('Test Summary');
        console.log('='.repeat(60));

        const successCount = results.filter((r) => r.success).length;
        const totalCount = results.length;

        console.log(`\nTotal tests: ${totalCount}`);
        console.log(`Passed: ${successCount}`);
        console.log(`Failed: ${totalCount - successCount}`);

        console.log('\nDetailed Results:');
        results.forEach((result) => {
            const status = result.success ? '✓' : '✗';
            const statusText = result.success ? 'PASS' : 'FAIL';
            console.log(`  ${status} ${result.service}: ${statusText}`);
            if (result.statusCode) {
                console.log(`    Status Code: ${result.statusCode}`);
            }
            if (result.responseTime) {
                console.log(`    Response Time: ${result.responseTime}ms`);
            }
            if (result.error) {
                console.log(`    Error: ${result.error}`);
            }
        });

        // Overall result
        console.log('\n' + '='.repeat(60));
        if (successCount === totalCount && authorizerResult.success && refreshResult.success) {
            console.log('✓ ALL TESTS PASSED');
            console.log('JWT tokens work correctly across all services!');
            process.exit(0);
        } else {
            console.log('✗ SOME TESTS FAILED');
            console.log('Please review the errors above.');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n✗ Test failed with error:');
        console.error(error);
        process.exit(1);
    }
}

// Run the tests
main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
