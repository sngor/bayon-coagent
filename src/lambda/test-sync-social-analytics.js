/**
 * Test script for sync-social-analytics Lambda function
 * 
 * This script tests the Lambda function with mock data to verify
 * the core functionality works as expected.
 */

const { handler, healthCheck } = require('./dist/sync-social-analytics');

// Mock event for testing
const mockEvent = {
    source: 'aws.events',
    'detail-type': 'Scheduled Event',
    detail: {
        dryRun: true,
        maxUsers: 5,
        platforms: ['facebook', 'instagram'],
        forceSync: false
    }
};

// Mock context for testing
const mockContext = {
    getRemainingTimeInMillis: () => 900000, // 15 minutes
    functionName: 'sync-social-analytics-test',
    functionVersion: '1.0.0',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:sync-social-analytics-test',
    memoryLimitInMB: '2048',
    awsRequestId: 'test-request-id-12345',
    logGroupName: '/aws/lambda/sync-social-analytics-test',
    logStreamName: '2024/01/01/[$LATEST]test-stream'
};

async function testLambdaFunction() {
    console.log('Testing sync-social-analytics Lambda function...\n');

    try {
        // Test health check first
        console.log('1. Testing health check...');
        const healthResult = await healthCheck();
        console.log('Health check result:', JSON.stringify(healthResult, null, 2));
        console.log('✅ Health check completed\n');

        // Test main handler with dry run
        console.log('2. Testing main handler (dry run)...');
        const result = await handler(mockEvent, mockContext);
        console.log('Handler result:', JSON.stringify(result, null, 2));
        console.log('✅ Handler test completed\n');

        // Test with different configurations
        console.log('3. Testing with force sync...');
        const forceSyncEvent = {
            ...mockEvent,
            detail: {
                ...mockEvent.detail,
                forceSync: true
            }
        };

        const forceSyncResult = await handler(forceSyncEvent, mockContext);
        console.log('Force sync result:', JSON.stringify(forceSyncResult, null, 2));
        console.log('✅ Force sync test completed\n');

        console.log('🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testLambdaFunction();
}

module.exports = {
    testLambdaFunction,
    mockEvent,
    mockContext
};