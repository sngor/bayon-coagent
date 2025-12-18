#!/usr/bin/env node

/**
 * Script to make a user a Super Admin
 * Usage: node scripts/make-superadmin.js <email>
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Configuration
const REGION = 'us-west-2';
const TABLE_NAME = 'BayonCoAgent-v2-production';

async function makeUserSuperAdmin(email) {
    if (!email) {
        console.error('❌ Error: Email is required');
        console.log('Usage: node scripts/make-superadmin.js <email>');
        process.exit(1);
    }

    console.log(`🔍 Looking for user with email: ${email}`);

    // Initialize DynamoDB client
    const client = new DynamoDBClient({ region: REGION });
    const docClient = DynamoDBDocumentClient.from(client);

    try {
        // First, we need to find the user by email
        // In your system, we need to scan for the user since email is not the primary key
        const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
        
        const scanParams = {
            TableName: TABLE_NAME,
            FilterExpression: 'SK = :sk AND contains(#data, :email)',
            ExpressionAttributeNames: {
                '#data': 'Data'
            },
            ExpressionAttributeValues: {
                ':sk': 'PROFILE',
                ':email': email
            }
        };

        console.log('🔍 Scanning for user profile...');
        const scanResult = await docClient.send(new ScanCommand(scanParams));

        if (!scanResult.Items || scanResult.Items.length === 0) {
            console.error(`❌ No user found with email: ${email}`);
            console.log('💡 Make sure the user has signed up and completed their profile');
            process.exit(1);
        }

        if (scanResult.Items.length > 1) {
            console.error(`❌ Multiple users found with email: ${email}`);
            process.exit(1);
        }

        const userProfile = scanResult.Items[0];
        const userId = userProfile.PK.replace('USER#', '');

        console.log(`✅ Found user: ${userId}`);
        console.log(`📧 Email: ${userProfile.Data.email}`);
        console.log(`👤 Name: ${userProfile.Data.givenName} ${userProfile.Data.familyName}`);
        console.log(`🔒 Current role: ${userProfile.Data.role || 'user'}`);

        // Update the user's role to superadmin
        const updatedProfile = {
            ...userProfile,
            Data: {
                ...userProfile.Data,
                role: 'superadmin',
                updatedAt: new Date().toISOString(),
                roleUpdatedBy: 'system-script',
                roleUpdatedAt: new Date().toISOString()
            }
        };

        const putParams = {
            TableName: TABLE_NAME,
            Item: updatedProfile
        };

        console.log('🔄 Updating user role to superadmin...');
        await docClient.send(new PutCommand(putParams));

        console.log('🎉 SUCCESS! User has been made a Super Admin');
        console.log('📋 Updated profile:');
        console.log(`   - User ID: ${userId}`);
        console.log(`   - Email: ${updatedProfile.Data.email}`);
        console.log(`   - Role: ${updatedProfile.Data.role}`);
        console.log(`   - Updated: ${updatedProfile.Data.updatedAt}`);
        console.log('');
        console.log('🚀 The user can now access:');
        console.log('   - Super Admin dashboard: /super-admin');
        console.log('   - All admin features');
        console.log('   - User role management');
        console.log('   - System configuration');

    } catch (error) {
        console.error('❌ Error updating user role:', error.message);
        process.exit(1);
    }
}

// Get email from command line arguments
const email = process.argv[2];
makeUserSuperAdmin(email);