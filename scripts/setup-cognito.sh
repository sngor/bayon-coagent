#!/bin/bash

# AWS Cognito Setup Script
# This script helps you create a Cognito User Pool for authentication

set -e

echo "🔐 AWS Cognito Setup Script"
echo "============================"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI is configured"
echo ""

# Get region
read -p "Enter AWS region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

echo ""
echo "Creating Cognito User Pool..."

# Create User Pool
USER_POOL_OUTPUT=$(aws cognito-idp create-user-pool \
    --pool-name "BayonCoAgent-UserPool" \
    --policies "PasswordPolicy={MinimumLength=6,RequireUppercase=false,RequireLowercase=false,RequireNumbers=false,RequireSymbols=false}" \
    --auto-verified-attributes email \
    --username-attributes email \
    --region $AWS_REGION \
    --output json)

USER_POOL_ID=$(echo $USER_POOL_OUTPUT | jq -r '.UserPool.Id')

echo "✅ User Pool created: $USER_POOL_ID"
echo ""

# Create User Pool Client
echo "Creating User Pool Client..."

CLIENT_OUTPUT=$(aws cognito-idp create-user-pool-client \
    --user-pool-id $USER_POOL_ID \
    --client-name "BayonCoAgent-Client" \
    --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
    --region $AWS_REGION \
    --output json)

CLIENT_ID=$(echo $CLIENT_OUTPUT | jq -r '.UserPoolClient.ClientId')

echo "✅ Client created: $CLIENT_ID"
echo ""

# Display results
echo "================================================"
echo "✅ Cognito Setup Complete!"
echo "================================================"
echo ""
echo "Add these to your .env.local file:"
echo ""
echo "USE_LOCAL_AWS=false"
echo "AWS_REGION=$AWS_REGION"
echo "COGNITO_USER_POOL_ID=$USER_POOL_ID"
echo "COGNITO_CLIENT_ID=$CLIENT_ID"
echo ""
echo "================================================"
