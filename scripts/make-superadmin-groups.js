#!/usr/bin/env node

/**
 * Make User Super Admin Script (Using Cognito Groups)
 * 
 * This script adds users to Cognito Groups for role management.
 * Much better than storing roles in DynamoDB.
 */

const { 
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminListGroupsForUserCommand,
  CreateGroupCommand,
  GetGroupCommand,
  AdminGetUserCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

// Configuration
const USER_POOL_ID = 'us-west-2_wqsUAbADO';
const AWS_REGION = 'us-west-2';

const client = new CognitoIdentityProviderClient({
  region: AWS_REGION,
});

/**
 * Create Cognito groups if they don't exist
 */
async function initializeGroups() {
  const groups = [
    {
      GroupName: 'admin',
      Description: 'Administrator users with access to admin panel',
      Precedence: 10,
    },
    {
      GroupName: 'superadmin',
      Description: 'Super administrator users with full system access',
      Precedence: 5,
    },
  ];

  console.log('🔧 Initializing Cognito Groups...');

  for (const group of groups) {
    try {
      // Check if group exists
      await client.send(new GetGroupCommand({
        UserPoolId: USER_POOL_ID,
        GroupName: group.GroupName,
      }));
      console.log(`✅ Group '${group.GroupName}' already exists`);
    } catch (error) {
      // Group doesn't exist, create it
      try {
        await client.send(new CreateGroupCommand({
          UserPoolId: USER_POOL_ID,
          ...group,
        }));
        console.log(`✅ Created group: '${group.GroupName}'`);
      } catch (createError) {
        console.error(`❌ Failed to create group '${group.GroupName}':`, createError.message);
      }
    }
  }
}

/**
 * Get user's current groups
 */
async function getUserGroups(userId) {
  try {
    const response = await client.send(new AdminListGroupsForUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId,
    }));

    return response.Groups?.map(group => group.GroupName) || [];
  } catch (error) {
    console.error(`❌ Failed to get groups for user ${userId}:`, error.message);
    return [];
  }
}

/**
 * Add user to a group
 */
async function addUserToGroup(userId, groupName) {
  try {
    await client.send(new AdminAddUserToGroupCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId,
      GroupName: groupName,
    }));
    console.log(`✅ Added user '${userId}' to group '${groupName}'`);
  } catch (error) {
    console.error(`❌ Failed to add user '${userId}' to group '${groupName}':`, error.message);
    throw error;
  }
}

/**
 * Get user details
 */
async function getUserDetails(userId) {
  try {
    const response = await client.send(new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId,
    }));

    const email = response.UserAttributes?.find(attr => attr.Name === 'email')?.Value || 'Unknown';
    const name = response.UserAttributes?.find(attr => attr.Name === 'given_name')?.Value || 
                 response.UserAttributes?.find(attr => attr.Name === 'name')?.Value || 'Unknown';

    return { email, name, status: response.UserStatus };
  } catch (error) {
    console.error(`❌ Failed to get user details for ${userId}:`, error.message);
    return null;
  }
}

/**
 * Make user super admin
 */
async function makeSuperAdmin(userId) {
  console.log(`\n🔧 Making user '${userId}' a super admin...`);

  // Get user details
  const userDetails = await getUserDetails(userId);
  if (!userDetails) {
    console.error(`❌ User '${userId}' not found`);
    return false;
  }

  console.log(`👤 User: ${userDetails.name} (${userDetails.email}) - Status: ${userDetails.status}`);

  // Get current groups
  const currentGroups = await getUserGroups(userId);
  console.log(`📋 Current groups: ${currentGroups.length > 0 ? currentGroups.join(', ') : 'None'}`);

  // Add to admin group (if not already)
  if (!currentGroups.includes('admin')) {
    await addUserToGroup(userId, 'admin');
  } else {
    console.log(`ℹ️  User already in 'admin' group`);
  }

  // Add to superadmin group (if not already)
  if (!currentGroups.includes('superadmin')) {
    await addUserToGroup(userId, 'superadmin');
  } else {
    console.log(`ℹ️  User already in 'superadmin' group`);
  }

  // Verify final groups
  const finalGroups = await getUserGroups(userId);
  console.log(`✅ Final groups: ${finalGroups.join(', ')}`);

  return true;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Cognito Groups Super Admin Setup');
  console.log('===================================');
  console.log(`User Pool ID: ${USER_POOL_ID}`);
  console.log(`AWS Region: ${AWS_REGION}\n`);

  try {
    // Initialize groups first
    await initializeGroups();

    // Get user ID from command line arguments
    const userId = process.argv[2];

    if (!userId) {
      console.log('\n📋 Usage Examples:');
      console.log('node scripts/make-superadmin-groups.js user@example.com');
      console.log('node scripts/make-superadmin-groups.js user-id-123');
      console.log('\n💡 You can use either email address or Cognito user ID');
      return;
    }

    console.log(`\n🎯 Target user: ${userId}`);

    // Make user super admin
    const success = await makeSuperAdmin(userId);

    if (success) {
      console.log('\n🎉 SUCCESS! User is now a super admin.');
      console.log('\n📝 What this means:');
      console.log('• User has access to /super-admin routes');
      console.log('• User has access to /admin routes');
      console.log('• Roles are stored in Cognito Groups (not DynamoDB)');
      console.log('• Roles are included in JWT tokens automatically');
      console.log('• No database queries needed for role checks');
      
      console.log('\n🔧 Next Steps:');
      console.log('1. Update your app to use Cognito Groups for role checking');
      console.log('2. User needs to sign out and sign in again to get new token with groups');
      console.log('3. Test admin and super-admin access');
    } else {
      console.log('\n❌ Failed to make user super admin');
    }

  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);