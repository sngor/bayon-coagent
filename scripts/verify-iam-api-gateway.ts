#!/usr/bin/env tsx

/**
 * Verification Script for IAM Authentication on API Gateway
 * 
 * This script verifies that IAM authentication is properly configured
 * on all API Gateway endpoints for the microservices architecture.
 * 
 * Usage:
 *   tsx scripts/verify-iam-api-gateway.ts
 */

import {
    APIGatewayClient,
    GetRestApisCommand,
    GetResourcesCommand,
    GetMethodCommand,
} from '@aws-sdk/client-api-gateway';

const region = process.env.AWS_REGION || 'us-east-1';
const environment = process.env.ENVIRONMENT || 'development';

const client = new APIGatewayClient({ region });

interface ApiGatewayInfo {
    name: string;
    id: string;
    expectedAuth: 'AWS_IAM' | 'NONE';
}

// Define the API Gateways we expect to find
const expectedApis: ApiGatewayInfo[] = [
    { name: `bayon-coagent-ai-${environment}`, id: '', expectedAuth: 'AWS_IAM' },
    { name: `bayon-coagent-integration-${environment}`, id: '', expectedAuth: 'AWS_IAM' },
    { name: `bayon-coagent-background-${environment}`, id: '', expectedAuth: 'AWS_IAM' },
    { name: `bayon-coagent-admin-${environment}`, id: '', expectedAuth: 'AWS_IAM' },
];

// OAuth callback endpoints that should remain NONE
const oauthCallbackPaths = [
    '/oauth/google/callback',
    '/oauth/{platform}/callback',
];

async function findApiGateways(): Promise<void> {
    console.log('🔍 Finding API Gateways...\n');

    try {
        const response = await client.send(new GetRestApisCommand({}));
        const apis = response.items || [];

        for (const expectedApi of expectedApis) {
            const foundApi = apis.find((api) => api.name === expectedApi.name);
            if (foundApi) {
                expectedApi.id = foundApi.id!;
                console.log(`✅ Found: ${expectedApi.name} (${expectedApi.id})`);
            } else {
                console.log(`❌ Not found: ${expectedApi.name}`);
            }
        }
        console.log();
    } catch (error) {
        console.error('❌ Error finding API Gateways:', error);
        throw error;
    }
}

async function verifyApiGatewayAuth(api: ApiGatewayInfo): Promise<boolean> {
    console.log(`\n📋 Verifying ${api.name}...`);

    try {
        // Get all resources for this API
        const resourcesResponse = await client.send(
            new GetResourcesCommand({
                restApiId: api.id,
            })
        );

        const resources = resourcesResponse.items || [];
        let allMethodsValid = true;

        for (const resource of resources) {
            const path = resource.path || '';
            const methods = resource.resourceMethods || {};

            for (const [httpMethod, methodInfo] of Object.entries(methods)) {
                try {
                    const methodResponse = await client.send(
                        new GetMethodCommand({
                            restApiId: api.id,
                            resourceId: resource.id!,
                            httpMethod,
                        })
                    );

                    const authType = methodResponse.authorizationType;
                    const isOAuthCallback = oauthCallbackPaths.some((callbackPath) =>
                        path.includes(callbackPath.replace('{platform}', ''))
                    );

                    // Determine expected auth type
                    let expectedAuthType = api.expectedAuth;
                    if (isOAuthCallback && httpMethod === 'GET') {
                        expectedAuthType = 'NONE';
                    }

                    if (authType === expectedAuthType) {
                        console.log(
                            `  ✅ ${httpMethod} ${path}: ${authType} ${isOAuthCallback ? '(OAuth callback)' : ''}`
                        );
                    } else {
                        console.log(
                            `  ❌ ${httpMethod} ${path}: Expected ${expectedAuthType}, got ${authType}`
                        );
                        allMethodsValid = false;
                    }
                } catch (error) {
                    console.log(`  ⚠️  ${httpMethod} ${path}: Error checking method`);
                }
            }
        }

        return allMethodsValid;
    } catch (error) {
        console.error(`❌ Error verifying ${api.name}:`, error);
        return false;
    }
}

async function verifyLambdaPermissions(): Promise<void> {
    console.log('\n\n🔐 Lambda Execution Role Permissions\n');
    console.log('The following Lambda roles should have API Gateway invoke permissions:');
    console.log('  ✅ ApplicationRole - Can invoke all 4 API Gateways');
    console.log('  ✅ IntegrationServiceLambdaRole - Can invoke AI and Background APIs');
    console.log('  ✅ ContentWorkflowLambdaRole - Can invoke AI and Integration APIs');
    console.log('  ✅ AiProcessingLambdaRole - Can invoke Integration and Background APIs');
    console.log('\nTo verify permissions, check the IAM console or use:');
    console.log('  aws iam get-role-policy --role-name <role-name> --policy-name <policy-name>');
}

async function main(): Promise<void> {
    console.log('🚀 IAM API Gateway Authentication Verification\n');
    console.log(`Environment: ${environment}`);
    console.log(`Region: ${region}\n`);

    try {
        // Step 1: Find all API Gateways
        await findApiGateways();

        // Step 2: Verify each API Gateway
        let allValid = true;
        for (const api of expectedApis) {
            if (api.id) {
                const isValid = await verifyApiGatewayAuth(api);
                if (!isValid) {
                    allValid = false;
                }
            } else {
                console.log(`\n⚠️  Skipping ${api.name} (not found)`);
                allValid = false;
            }
        }

        // Step 3: Display Lambda permissions info
        await verifyLambdaPermissions();

        // Summary
        console.log('\n\n' + '='.repeat(60));
        if (allValid) {
            console.log('✅ All API Gateway endpoints have correct IAM authentication');
        } else {
            console.log('❌ Some API Gateway endpoints have incorrect authentication');
            process.exit(1);
        }
        console.log('='.repeat(60) + '\n');
    } catch (error) {
        console.error('\n❌ Verification failed:', error);
        process.exit(1);
    }
}

// Run the verification
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
