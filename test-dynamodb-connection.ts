/**
 * Test DynamoDB Connection
 * 
 * Run this to verify DynamoDB is accessible and working
 * 
 * Usage:
 *   npx tsx test-dynamodb-connection.ts
 */

import { getRepository } from './src/aws/dynamodb/repository';

async function testDynamoDBConnection() {
    console.log('🔍 Testing DynamoDB Connection...\n');

    try {
        const repository = getRepository();

        // Test 1: Write a test item
        console.log('Test 1: Writing test item...');
        const testData = {
            PK: 'TEST#connection',
            SK: 'TEST#' + Date.now(),
            EntityType: 'UserProfile' as any,
            Data: {
                testData: 'Hello from test',
                timestamp: new Date().toISOString(),
            },
            CreatedAt: Date.now(),
            UpdatedAt: Date.now()
        };

        await repository.put(testData);
        console.log('✅ Write successful\n');

        // Test 2: Read the test item back
        console.log('Test 2: Reading test item...');
        console.log('   Reading with PK:', testData.PK, 'SK:', testData.SK);
        const result = await repository.get(testData.PK, testData.SK);

        if (result) {
            console.log('✅ Read successful');
            console.log('   Data:', result);
            console.log('');
        } else {
            console.log('❌ Read failed - item not found\n');
            return false;
        }

        // Test 3: Test session creation pattern
        console.log('Test 3: Testing session creation pattern...');
        const sessionId = 'test-session-' + Date.now();
        const userId = 'test-user';

        const sessionData = {
            PK: `USER#${userId}`,
            SK: `STAGING_SESSION#${sessionId}`,
            EntityType: 'UserProfile' as any,
            Data: {
                sessionId,
                userId,
                roomType: 'living-room',
                style: 'modern',
                angles: [],
            },
            CreatedAt: Date.now(),
            UpdatedAt: Date.now()
        };

        await repository.put(sessionData);
        console.log('✅ Session write successful\n');

        // Test 4: Read session back
        console.log('Test 4: Reading session back...');
        const session = await repository.get<any>(
            `USER#${userId}`,
            `STAGING_SESSION#${sessionId}`
        );

        if (session) {
            console.log('✅ Session read successful');
            console.log('   Session ID:', session.sessionId);
            console.log('   Room Type:', session.roomType);
            console.log('   Style:', session.style);
            console.log('');
        } else {
            console.log('❌ Session read failed - not found\n');
            return false;
        }

        // Test 5: Clean up
        console.log('Test 5: Cleaning up test data...');
        await repository.delete(testData.PK, testData.SK);
        await repository.delete(sessionData.PK, sessionData.SK);
        console.log('✅ Cleanup successful\n');

        console.log('🎉 All tests passed! DynamoDB is working correctly.\n');
        return true;

    } catch (error) {
        console.error('❌ Test failed with error:');
        console.error(error);
        console.log('');

        if (error instanceof Error) {
            if (error.message.includes('ECONNREFUSED')) {
                console.log('💡 Tip: LocalStack might not be running. Try:');
                console.log('   npm run localstack:start');
            } else if (error.message.includes('ResourceNotFoundException')) {
                console.log('💡 Tip: DynamoDB table might not exist. Try:');
                console.log('   npm run localstack:init');
            } else if (error.message.includes('credentials')) {
                console.log('💡 Tip: AWS credentials might be missing. Check:');
                console.log('   - .env.local file');
                console.log('   - AWS_REGION environment variable');
            }
        }

        return false;
    }
}

// Run the test
testDynamoDBConnection()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
