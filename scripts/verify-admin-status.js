#!/usr/bin/env node

/**
 * Script to verify admin status in DynamoDB
 * Usage: node scripts/verify-admin-status.js <user-id>
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function verifyAdminStatus(userId) {
    try {
        console.log(`🔍 Checking admin status for user: ${userId}`);

        // Initialize AWS clients
        const dynamoConfig = {
            region: process.env.AWS_REGION || 'us-east-1',
        };

        // Use LocalStack if configured
        if (process.env.USE_LOCAL_AWS === 'true') {
            dynamoConfig.endpoint = process.env.DYNAMODB_ENDPOINT || 'http://localhost:4566';
            dynamoConfig.credentials = {
                accessKeyId: 'test',
                secretAccessKey: 'test',
            };
        }

        const dynamoClient = new DynamoDBClient(dynamoConfig);
        const docClient = DynamoDBDocumentClient.from(dynamoClient);
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagentTable';

        // Check main profile
        console.log('\n📋 Checking main profile...');
        const profileCommand = new GetCommand({
            TableName: tableName,
            Key: {
                PK: `USER#${userId}`,
                SK: 'PROFILE',
            },
        });

        const profileResult = await docClient.send(profileCommand);

        if (profileResult.Item) {
            console.log('✅ Profile found:');
            console.log(JSON.stringify(profileResult.Item, null, 2));
        } else {
            console.log('❌ No profile found');
        }

        // Check agent profile
        console.log('\n👤 Checking agent profile...');
        const agentCommand = new GetCommand({
            TableName: tableName,
            Key: {
                PK: `USER#${userId}`,
                SK: 'AGENT#main',
            },
        });

        const agentResult = await docClient.send(agentCommand);

        if (agentResult.Item) {
            console.log('✅ Agent profile found:');
            console.log(JSON.stringify(agentResult.Item, null, 2));
        } else {
            console.log('❌ No agent profile found');
        }

        // Query all items for this user
        console.log('\n📊 All items for this user:');
        const queryCommand = new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
            },
        });

        const queryResult = await docClient.send(queryCommand);

        if (queryResult.Items && queryResult.Items.length > 0) {
            console.log(`Found ${queryResult.Items.length} items:`);
            queryResult.Items.forEach((item, index) => {
                console.log(`\n${index + 1}. ${item.SK}:`);
                if (item.Data && item.Data.role) {
                    console.log(`   Role: ${item.Data.role}`);
                }
                console.log(`   EntityType: ${item.EntityType}`);
            });
        } else {
            console.log('❌ No items found for this user');
        }

    } catch (error) {
        console.error('❌ Error verifying admin status:', error.message);
        process.exit(1);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const userId = args[0];

if (!userId) {
    console.error('Usage: node scripts/verify-admin-status.js <user-id>');
    console.error('Example: node scripts/verify-admin-status.js 24589458-5041-7041-a202-29ac2fd374b5');
    process.exit(1);
}

verifyAdminStatus(userId);