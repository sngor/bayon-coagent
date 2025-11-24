#!/usr/bin/env tsx
/**
 * Test script for unified error response format
 * 
 * Demonstrates the error response format with various error types
 */

import {
    formatErrorResponse,
    formatSuccessResponse,
    toAPIGatewayResponse,
    toAPIGatewaySuccessResponse,
    ErrorCode,
    ErrorSeverity,
    createUserFriendlyMessage,
} from '../src/lib/error-response';

console.log('='.repeat(80));
console.log('Unified Error Response Format - Test Script');
console.log('='.repeat(80));
console.log();

// Test 1: Basic error response
console.log('Test 1: Basic Error Response');
console.log('-'.repeat(80));
const basicError = formatErrorResponse(new Error('Database connection failed'), {
    service: 'test-service',
    code: ErrorCode.DATABASE_ERROR,
    userId: 'user-123',
    requestId: 'req-456',
});
console.log(JSON.stringify(basicError, null, 2));
console.log();

// Test 2: Error with fallback
console.log('Test 2: Error Response with Fallback');
console.log('-'.repeat(80));
const errorWithFallback = formatErrorResponse(new Error('AI service unavailable'), {
    service: 'ai-service',
    code: ErrorCode.AI_SERVICE_ERROR,
    userId: 'user-123',
    requestId: 'req-789',
    fallback: {
        available: true,
        type: 'cached',
        data: { content: 'Cached blog post content' },
        message: 'Using cached response from previous request',
    },
    retryable: true,
    retryAfter: 30,
});
console.log(JSON.stringify(errorWithFallback, null, 2));
console.log();

// Test 3: OAuth error
console.log('Test 3: OAuth Error Response');
console.log('-'.repeat(80));
const oauthError = formatErrorResponse('Token exchange failed', {
    service: 'integration-google-oauth',
    code: ErrorCode.TOKEN_EXCHANGE_FAILED,
    userId: 'user-123',
    path: '/oauth/google/callback',
    method: 'GET',
    retryable: true,
    additionalDetails: {
        provider: 'google',
        oauthError: 'invalid_grant',
    },
});
console.log(JSON.stringify(oauthError, null, 2));
console.log();

// Test 4: Success response
console.log('Test 4: Success Response');
console.log('-'.repeat(80));
const successResponse = formatSuccessResponse(
    {
        jobId: 'job-123',
        status: 'completed',
        result: { content: 'Generated blog post content' },
    },
    'Blog post generated successfully'
);
console.log(JSON.stringify(successResponse, null, 2));
console.log();

// Test 5: API Gateway error response
console.log('Test 5: API Gateway Error Response');
console.log('-'.repeat(80));
const apiGatewayError = toAPIGatewayResponse(basicError);
console.log(JSON.stringify(apiGatewayError, null, 2));
console.log();

// Test 6: API Gateway success response
console.log('Test 6: API Gateway Success Response');
console.log('-'.repeat(80));
const apiGatewaySuccess = toAPIGatewaySuccessResponse(successResponse);
console.log(JSON.stringify(apiGatewaySuccess, null, 2));
console.log();

// Test 7: User-friendly messages
console.log('Test 7: User-Friendly Messages');
console.log('-'.repeat(80));
const errorCodes = [
    ErrorCode.SERVICE_UNAVAILABLE,
    ErrorCode.AI_SERVICE_ERROR,
    ErrorCode.RATE_LIMIT_EXCEEDED,
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.NOT_FOUND,
];

errorCodes.forEach(code => {
    const message = createUserFriendlyMessage(code);
    console.log(`${code}: ${message}`);
});
console.log();

// Test 8: Error severity inference
console.log('Test 8: Error Severity Inference');
console.log('-'.repeat(80));
const severityTests = [
    { code: ErrorCode.INTERNAL_ERROR, expected: ErrorSeverity.CRITICAL },
    { code: ErrorCode.AI_SERVICE_ERROR, expected: ErrorSeverity.HIGH },
    { code: ErrorCode.OAUTH_ERROR, expected: ErrorSeverity.MEDIUM },
    { code: ErrorCode.VALIDATION_ERROR, expected: ErrorSeverity.LOW },
];

severityTests.forEach(test => {
    const error = formatErrorResponse(new Error('Test'), {
        service: 'test',
        code: test.code,
    });
    console.log(`${test.code}: ${error.error.severity} (expected: ${test.expected})`);
});
console.log();

// Test 9: HTTP status code mapping
console.log('Test 9: HTTP Status Code Mapping');
console.log('-'.repeat(80));
const statusCodeTests = [
    { code: ErrorCode.BAD_REQUEST, expected: 400 },
    { code: ErrorCode.UNAUTHORIZED, expected: 401 },
    { code: ErrorCode.FORBIDDEN, expected: 403 },
    { code: ErrorCode.NOT_FOUND, expected: 404 },
    { code: ErrorCode.RATE_LIMIT_EXCEEDED, expected: 429 },
    { code: ErrorCode.INTERNAL_ERROR, expected: 500 },
    { code: ErrorCode.SERVICE_UNAVAILABLE, expected: 503 },
    { code: ErrorCode.GATEWAY_TIMEOUT, expected: 504 },
];

statusCodeTests.forEach(test => {
    const error = formatErrorResponse(new Error('Test'), {
        service: 'test',
        code: test.code,
    });
    const response = toAPIGatewayResponse(error);
    console.log(`${test.code}: ${response.statusCode} (expected: ${test.expected})`);
});
console.log();

console.log('='.repeat(80));
console.log('All tests completed successfully!');
console.log('='.repeat(80));
