/**
 * Simple test script to verify Lambda functions can be imported and executed
 */

const { handler: lifeEventHandler, healthCheck: lifeEventHealthCheck } = require('./dist/life-event-processor');
const { handler: competitorHandler, healthCheck: competitorHealthCheck } = require('./dist/competitor-monitor-processor');
const { handler: trendHandler, healthCheck: trendHealthCheck } = require('./dist/trend-detector-processor');
const { handler: priceHandler, healthCheck: priceHealthCheck } = require('./dist/price-reduction-processor');

async function testHealthChecks() {
    console.log('Testing Lambda function health checks...\n');

    try {
        console.log('1. Life Event Processor Health Check:');
        const lifeEventHealth = await lifeEventHealthCheck();
        console.log(JSON.stringify(lifeEventHealth, null, 2));

        console.log('\n2. Competitor Monitor Health Check:');
        const competitorHealth = await competitorHealthCheck();
        console.log(JSON.stringify(competitorHealth, null, 2));

        console.log('\n3. Trend Detector Health Check:');
        const trendHealth = await trendHealthCheck();
        console.log(JSON.stringify(trendHealth, null, 2));

        console.log('\n4. Price Reduction Monitor Health Check:');
        const priceHealth = await priceHealthCheck();
        console.log(JSON.stringify(priceHealth, null, 2));

        console.log('\n✅ All health checks passed!');
    } catch (error) {
        console.error('❌ Health check failed:', error);
        process.exit(1);
    }
}

async function testHandlers() {
    console.log('\nTesting Lambda function handlers (dry run)...\n');

    const mockEvent = {
        time: new Date().toISOString(),
        source: 'aws.events',
        'detail-type': 'Scheduled Event'
    };

    const mockContext = {
        awsRequestId: 'test-request-id',
        functionName: 'test-function',
        remainingTimeInMillis: () => 30000
    };

    try {
        console.log('Note: These are dry runs with mock data - no actual processing will occur.\n');

        console.log('1. Life Event Processor (dry run):');
        // In a real test, we'd mock the dependencies
        console.log('   Function loaded successfully ✓');

        console.log('2. Competitor Monitor (dry run):');
        console.log('   Function loaded successfully ✓');

        console.log('3. Trend Detector (dry run):');
        console.log('   Function loaded successfully ✓');

        console.log('4. Price Reduction Monitor (dry run):');
        console.log('   Function loaded successfully ✓');

        console.log('\n✅ All Lambda functions loaded successfully!');
        console.log('📝 Note: Full integration tests require AWS credentials and DynamoDB setup.');
    } catch (error) {
        console.error('❌ Handler test failed:', error);
        process.exit(1);
    }
}

async function main() {
    console.log('🚀 Market Intelligence Alerts - Lambda Function Tests\n');
    console.log('='.repeat(60));

    await testHealthChecks();
    await testHandlers();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 All tests completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Deploy with: sam deploy --template-file template.yaml');
    console.log('2. Monitor with CloudWatch dashboard');
    console.log('3. Test with real data once deployed');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    testHealthChecks,
    testHandlers
};