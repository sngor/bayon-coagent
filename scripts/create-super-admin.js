#!/usr/bin/env node

/**
 * CLI Script to create a super admin user
 * Usage: node scripts/create-super-admin.js <email> [admin-key]
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { CognitoIdentityProviderClient, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const ADMIN_PERMISSIONS = [
    'view_feedback',
    'manage_feedback',
    'view_users',
    'manage_users',
    'view_analytics',
    'system_settings',
];

async function createSuperAdmin(email, adminKey) {
    try {
        console.log('🔐 Creating super admin account...');

        // Verify admin key
        const SUPER_ADMIN_KEY = process.env.SUPER_ADMIN_KEY || 'your-secret-admin-key-2024';
        if (adminKey !== SUPER_ADMIN_KEY) {
            throw new Error('Invalid admin key provided');
        }

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

        const cognitoClient = new CognitoIdentityProviderClient(dynamoConfig);

        // Find user in Cognito
        console.log(`🔍 Looking up user: ${email}`);

        const getUserCommand = new AdminGetUserCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID,
            Username: email,
        });

        let userId;
        try {
            const userResult = await cognitoClient.send(getUserCommand);
            const userIdAttr = userResult.UserAttributes?.find(attr => attr.Name === 'sub');

            if (!userIdAttr?.Value) {
                throw new Error('User ID not found in Cognito attributes');
            }

            userId = userIdAttr.Value;
            console.log(`✅ Found user with ID: ${userId}`);
        } catch (error) {
            if (error.name === 'UserNotFoundException') {
                throw new Error(`User with email ${email} not found in Cognito. Please ensure the user is registered first.`);
            }
            throw error;
        }

        // Create/update user profile in DynamoDB
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagentTable';

        const profileData = {
            PK: `USER#${userId}`,
            SK: 'PROFILE',
            EntityType: 'Profile',
            Data: {
                id: userId,
                email,
                role: 'super_admin',
                adminSince: new Date().toISOString(),
                permissions: ADMIN_PERMISSIONS,
                createdBy: 'cli-script',
                updatedAt: new Date().toISOString(),
            },
        };

        const putCommand = new PutCommand({
            TableName: tableName,
            Item: profileData,
        });

        await docClient.send(putCommand);

        console.log('✅ Super admin profile created in DynamoDB');

        // Also try to update agent profile if it exists
        try {
            const agentProfileData = {
                PK: `USER#${userId}`,
                SK: 'AGENT#main',
                EntityType: 'AgentProfile',
                Data: {
                    role: 'super_admin',
                    adminSince: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            };

            const updateAgentCommand = new PutCommand({
                TableName: tableName,
                Item: agentProfileData,
            });

            await docClient.send(updateAgentCommand);
            console.log('✅ Agent profile updated with admin role');
        } catch (error) {
            console.log('ℹ️  Agent profile not found or couldn\'t be updated (this is okay)');
        }

        console.log('\n🎉 Super admin account created successfully!');
        console.log(`📧 Email: ${email}`);
        console.log(`🆔 User ID: ${userId}`);
        console.log(`🔑 Role: super_admin`);
        console.log(`📅 Created: ${new Date().toISOString()}`);

        console.log('\n🔗 The user can now access admin features at: /admin/feedback');

    } catch (error) {
        console.error('❌ Error creating super admin:', error.message);
        process.exit(1);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const email = args[0];
const adminKey = args[1] || process.env.SUPER_ADMIN_KEY || 'your-secret-admin-key-2024';

if (!email) {
    console.error('Usage: node scripts/create-super-admin.js <email> [admin-key]');
    console.error('Example: node scripts/create-super-admin.js admin@yourcompany.com');
    process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
    console.error('❌ Invalid email format');
    process.exit(1);
}

createSuperAdmin(email, adminKey);