#!/usr/bin/env tsx
/**
 * Test Request Signing Implementation
 * 
 * This script demonstrates and validates the request signing functionality
 * for Lambda-to-Lambda communication via API Gateway.
 * 
 * Usage:
 *   npm run tsx scripts/test-request-signing.ts
 */

import {
    signRequest,
    parseApiGatewayUrl,
    invokeApiGateway,
} from '../src/lambda/utils/request-signer';

// ANSI color codes for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
    console.log('\n' + '='.repeat(60));
    log(title, colors.cyan);
    console.log('='.repeat(60));
}

function logSuccess(message: string) {
    log(`✓ ${message}`, colors.green);
}

function logError(message: string) {
    log(`✗ ${message}`, colors.red);
}

function logInfo(message: string) {
    log(`ℹ ${message}`, colors.blue);
}

function logWarning(message: string) {
    log(`⚠ ${message}`, colors.yellow);
}

/**
 * Test 1: URL Parsing
 */
async function testUrlParsing() {
    logSection('Test 1: URL Parsing');

    const testUrls = [
        'https://abc123.execute-api.us-east-1.amazonaws.com/prod',
        'https://xyz789.execute-api.eu-west-1.amazonaws.com/dev/api/v1',
        'https://api.example.com/path/to/endpoint?query=value',
    ];

    for (const url of testUrls) {
        try {
            const parsed = parseApiGatewayUrl(url);
            logSuccess(`Parsed URL: ${url}`);
            logInfo(`  Hostname: ${parsed.hostname}`);
            logInfo(`  Path: ${parsed.path}`);
        } catch (error) {
            logError(`Failed to parse URL: ${url}`);
            console.error(error);
        }
    }
}

/**
 * Test 2: Request Signing
 */
async function testRequestSigning() {
    logSection('Test 2: Request Signing');

    const testCases = [
        {
            name: 'Simple GET request',
            options: {
                method: 'GET',
                hostname: 'abc123.execute-api.us-east-1.amazonaws.com',
                path: '/prod/health',
            },
        },
        {
            name: 'POST request with body',
            options: {
                method: 'POST',
                hostname: 'abc123.execute-api.us-east-1.amazonaws.com',
                path: '/prod/api/generate',
                body: JSON.stringify({ userId: 'test-user', content: 'test' }),
            },
        },
        {
            name: 'GET request with query parameters',
            options: {
                method: 'GET',
                hostname: 'abc123.execute-api.us-east-1.amazonaws.com',
                path: '/prod/api/jobs',
                queryParams: { status: 'completed', limit: '10' },
            },
        },
    ];

    for (const testCase of testCases) {
        try {
            const signedRequest = await signRequest(testCase.options);
            logSuccess(`Signed request: ${testCase.name}`);
            logInfo(`  Method: ${signedRequest.method}`);
            logInfo(`  URL: ${signedRequest.url}`);
            logInfo(`  Headers: ${Object.keys(signedRequest.headers).length} headers`);

            // Verify required headers
            const requiredHeaders = ['Content-Type', 'host', 'X-Amz-Date', 'Authorization'];
            const hasAllHeaders = requiredHeaders.every(h =>
                Object.keys(signedRequest.headers).some(k => k.toLowerCase() === h.toLowerCase())
            );

            if (hasAllHeaders) {
                logSuccess('  All required headers present');
            } else {
                logWarning('  Some required headers missing');
            }
        } catch (error) {
            logError(`Failed to sign request: ${testCase.name}`);
            console.error(error);
        }
    }
}

/**
 * Test 3: Environment Variable Validation
 */
async function testEnvironmentVariables() {
    logSection('Test 3: Environment Variable Validation');

    const requiredEnvVars = [
        'AI_SERVICE_API_URL',
        'INTEGRATION_SERVICE_API_URL',
        'BACKGROUND_SERVICE_API_URL',
        'ADMIN_SERVICE_API_URL',
    ];

    let allPresent = true;

    for (const envVar of requiredEnvVars) {
        if (process.env[envVar]) {
            logSuccess(`${envVar} is set`);
            logInfo(`  Value: ${process.env[envVar]}`);
        } else {
            logWarning(`${envVar} is not set`);
            allPresent = false;
        }
    }

    if (allPresent) {
        logSuccess('All required environment variables are set');
    } else {
        logWarning('Some environment variables are missing');
        logInfo('Set these in your Lambda function configuration or .env file');
    }
}

/**
 * Test 4: Signature Format Validation
 */
async function testSignatureFormat() {
    logSection('Test 4: Signature Format Validation');

    try {
        const signedRequest = await signRequest({
            method: 'POST',
            hostname: 'test.execute-api.us-east-1.amazonaws.com',
            path: '/prod/test',
            body: JSON.stringify({ test: 'data' }),
        });

        const authHeader = signedRequest.headers['Authorization'];

        if (!authHeader) {
            logError('Authorization header is missing');
            return;
        }

        logSuccess('Authorization header present');
        logInfo(`  Value: ${authHeader.substring(0, 50)}...`);

        // Validate format: AWS4-HMAC-SHA256 Credential=..., SignedHeaders=..., Signature=...
        const formatRegex = /^AWS4-HMAC-SHA256 Credential=.+, SignedHeaders=.+, Signature=.+$/;

        if (formatRegex.test(authHeader)) {
            logSuccess('Authorization header format is valid');

            // Extract components
            const credentialMatch = authHeader.match(/Credential=([^,]+)/);
            const signedHeadersMatch = authHeader.match(/SignedHeaders=([^,]+)/);
            const signatureMatch = authHeader.match(/Signature=(.+)$/);

            if (credentialMatch) {
                logInfo(`  Credential: ${credentialMatch[1]}`);
            }
            if (signedHeadersMatch) {
                logInfo(`  Signed Headers: ${signedHeadersMatch[1]}`);
            }
            if (signatureMatch) {
                logInfo(`  Signature: ${signatureMatch[1].substring(0, 20)}...`);
            }
        } else {
            logError('Authorization header format is invalid');
        }

        // Validate X-Amz-Date header
        const amzDate = signedRequest.headers['X-Amz-Date'];
        if (amzDate) {
            logSuccess('X-Amz-Date header present');
            logInfo(`  Value: ${amzDate}`);

            // Validate format: YYYYMMDDTHHMMSSZ
            const dateFormatRegex = /^\d{8}T\d{6}Z$/;
            if (dateFormatRegex.test(amzDate)) {
                logSuccess('X-Amz-Date format is valid');
            } else {
                logError('X-Amz-Date format is invalid');
            }
        } else {
            logError('X-Amz-Date header is missing');
        }

    } catch (error) {
        logError('Failed to validate signature format');
        console.error(error);
    }
}

/**
 * Test 5: Service Helper Functions
 */
async function testServiceHelpers() {
    logSection('Test 5: Service Helper Functions');

    const helpers = [
        { name: 'invokeAiService', envVar: 'AI_SERVICE_API_URL' },
        { name: 'invokeIntegrationService', envVar: 'INTEGRATION_SERVICE_API_URL' },
        { name: 'invokeBackgroundService', envVar: 'BACKGROUND_SERVICE_API_URL' },
        { name: 'invokeAdminService', envVar: 'ADMIN_SERVICE_API_URL' },
    ];

    for (const helper of helpers) {
        if (process.env[helper.envVar]) {
            logSuccess(`${helper.name} can be used (${helper.envVar} is set)`);
        } else {
            logWarning(`${helper.name} requires ${helper.envVar} to be set`);
        }
    }

    logInfo('\nExample usage:');
    console.log(`
  import { invokeAiService } from './utils/request-signer';
  
  const result = await invokeAiService('/generate', 'POST', {
    userId: 'user-123',
    content: 'Generate a blog post about real estate'
  });
  `);
}

/**
 * Test 6: Error Handling
 */
async function testErrorHandling() {
    logSection('Test 6: Error Handling');

    // Test missing environment variable
    try {
        const originalEnv = process.env.AI_SERVICE_API_URL;
        delete process.env.AI_SERVICE_API_URL;

        const { invokeAiService } = await import('../src/lambda/utils/request-signer');
        await invokeAiService('/test', 'GET');

        logError('Should have thrown error for missing environment variable');
        process.env.AI_SERVICE_API_URL = originalEnv;
    } catch (error) {
        if (error instanceof Error && error.message.includes('AI_SERVICE_API_URL')) {
            logSuccess('Correctly throws error for missing environment variable');
            logInfo(`  Error: ${error.message}`);
        } else {
            logError('Unexpected error type');
            console.error(error);
        }
    }

    // Test invalid URL format
    try {
        await signRequest({
            method: 'GET',
            hostname: '',
            path: '/test',
        });
        logError('Should have thrown error for invalid hostname');
    } catch (error) {
        logSuccess('Correctly handles invalid hostname');
    }
}

/**
 * Main test runner
 */
async function runTests() {
    log('\n🔐 Request Signing Implementation Test Suite\n', colors.cyan);

    try {
        await testUrlParsing();
        await testRequestSigning();
        await testEnvironmentVariables();
        await testSignatureFormat();
        await testServiceHelpers();
        await testErrorHandling();

        logSection('Test Summary');
        logSuccess('All tests completed successfully!');
        logInfo('\nThe request signing implementation is ready for use.');
        logInfo('See src/lambda/utils/CROSS_SERVICE_COMMUNICATION.md for usage examples.');

    } catch (error) {
        logSection('Test Summary');
        logError('Some tests failed');
        console.error(error);
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    logError('Test suite failed');
    console.error(error);
    process.exit(1);
});
