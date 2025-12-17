#!/bin/bash

# Update Amplify Environment Variables with New Cognito User Pool
# Run this script to update your Amplify app with the new Cognito credentials

set -e

echo "🔄 Updating Amplify Environment Variables with New Cognito User Pool"
echo "=================================================="

# New Cognito User Pool credentials
NEW_USER_POOL_ID="us-west-2_wqsUAbADO"
NEW_CLIENT_ID="33grpfrfup7q9jkmumv77ffdce"
REGION="us-west-2"

echo "📋 New Cognito Credentials:"
echo "  User Pool ID: $NEW_USER_POOL_ID"
echo "  Client ID: $NEW_CLIENT_ID"
echo "  Region: $REGION"
echo ""

echo "🚀 Environment Variables to Update in Amplify Console:"
echo "=================================================="
echo "COGNITO_USER_POOL_ID=$NEW_USER_POOL_ID"
echo "COGNITO_CLIENT_ID=$NEW_CLIENT_ID"
echo "NEXT_PUBLIC_AWS_REGION=$REGION"
echo "NEXT_PUBLIC_USER_POOL_ID=$NEW_USER_POOL_ID"
echo "NEXT_PUBLIC_USER_POOL_CLIENT_ID=$NEW_CLIENT_ID"
echo ""

echo "📝 Manual Steps Required:"
echo "1. Go to AWS Amplify Console"
echo "2. Select your app: bayoncoagent"
echo "3. Go to 'Environment variables' in the left sidebar"
echo "4. Update the following variables with the values above:"
echo "   - COGNITO_USER_POOL_ID"
echo "   - COGNITO_CLIENT_ID"
echo "   - NEXT_PUBLIC_USER_POOL_ID"
echo "   - NEXT_PUBLIC_USER_POOL_CLIENT_ID"
echo "   - NEXT_PUBLIC_AWS_REGION"
echo "5. Save changes"
echo "6. Trigger a new deployment"
echo ""

echo "✅ After updating, commit and push your code changes to trigger a new build"
echo "✅ The new Cognito User Pool will be used for authentication"
echo ""

echo "🔍 To verify the fix:"
echo "1. Open browser developer tools"
echo "2. Go to Console tab"
echo "3. Look for 'FINAL COGNITO CONFIG v5.0' log"
echo "4. Verify it shows region: 'us-west-2' and populated clientId/userPoolId"