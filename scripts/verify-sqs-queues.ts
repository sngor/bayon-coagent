#!/usr/bin/env tsx
/**
 * SQS Queue Verification Script
 * 
 * This script verifies that the SQS queues are properly configured
 * and accessible.
 */

import {
    getSQSClient,
    getQueueMessageCount,
    sendAIJobRequest,
    type AIJobMessage,
} from '../src/aws/sqs';
import { getConfig } from '../src/aws/config';

async function verifyQueues() {
    console.log('🔍 Verifying SQS Queue Configuration...\n');

    const config = getConfig();

    // Check configuration
    console.log('📋 Configuration:');
    console.log(`  Environment: ${config.environment}`);
    console.log(`  Region: ${config.region}`);
    console.log(`  Request Queue URL: ${config.sqs.aiJobRequestQueueUrl || 'NOT SET'}`);
    console.log(`  Response Queue URL: ${config.sqs.aiJobResponseQueueUrl || 'NOT SET'}`);
    console.log();

    if (!config.sqs.aiJobRequestQueueUrl || !config.sqs.aiJobResponseQueueUrl) {
        console.error('❌ Queue URLs are not configured!');
        console.error('   Set AI_JOB_REQUEST_QUEUE_URL and AI_JOB_RESPONSE_QUEUE_URL');
        console.error('   Run: npm run sam:deploy:dev to deploy infrastructure');
        process.exit(1);
    }

    try {
        // Test request queue
        console.log('🔍 Checking Request Queue...');
        const requestCounts = await getQueueMessageCount(config.sqs.aiJobRequestQueueUrl);
        console.log(`  ✅ Request Queue accessible`);
        console.log(`     Messages: ${requestCounts.approximate}`);
        console.log(`     In Flight: ${requestCounts.notVisible}`);
        console.log(`     Delayed: ${requestCounts.delayed}`);
        console.log();

        // Test response queue
        console.log('🔍 Checking Response Queue...');
        const responseCounts = await getQueueMessageCount(config.sqs.aiJobResponseQueueUrl);
        console.log(`  ✅ Response Queue accessible`);
        console.log(`     Messages: ${responseCounts.approximate}`);
        console.log(`     In Flight: ${responseCounts.notVisible}`);
        console.log(`     Delayed: ${responseCounts.delayed}`);
        console.log();

        // Test sending a message (optional)
        const shouldTestSend = process.argv.includes('--test-send');
        if (shouldTestSend) {
            console.log('📤 Testing message send...');
            const testMessage: AIJobMessage = {
                jobId: `test-${Date.now()}`,
                userId: 'test-user',
                jobType: 'blog-post',
                input: {
                    topic: 'Test Topic',
                    tone: 'professional',
                },
                timestamp: new Date().toISOString(),
                traceId: `trace-${Date.now()}`,
            };

            const result = await sendAIJobRequest(testMessage);
            console.log(`  ✅ Message sent successfully`);
            console.log(`     Job ID: ${result.jobId}`);
            console.log(`     Message ID: ${result.messageId}`);
            console.log();
            console.log('⚠️  Note: This test message will be processed by Lambda if deployed');
        }

        console.log('✅ All queue verifications passed!');
        console.log();
        console.log('💡 Tips:');
        console.log('   - Use --test-send flag to test message sending');
        console.log('   - Monitor queues in AWS Console: SQS > Queues');
        console.log('   - Check CloudWatch metrics for queue depth and age');
        console.log('   - Monitor DLQs for failed messages');

    } catch (error) {
        console.error('❌ Queue verification failed:');
        console.error(error);
        process.exit(1);
    }
}

// Run verification
verifyQueues().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
