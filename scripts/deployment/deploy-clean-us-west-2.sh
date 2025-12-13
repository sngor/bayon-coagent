#!/bin/bash

# Clean deployment of Bayon CoAgent Infrastructure to us-west-2
# This script creates new resources with unique names to avoid conflicts

set -e

echo "🚀 Clean deployment of Bayon CoAgent to us-west-2..."

# Set AWS region
export AWS_DEFAULT_REGION=us-west-2

# Generate unique suffix for resources
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
STACK_NAME="bayon-coagent-production-${TIMESTAMP}"

echo "📝 Using stack name: $STACK_NAME"

# Check if we have AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS credentials verified"

# Build the SAM application
echo "🔨 Building SAM application..."
sam build

# Validate the template
echo "✅ Validating SAM template..."
sam validate

# Deploy with guided mode to create new resources
echo "🚀 Deploying new infrastructure stack..."

sam deploy \
    --stack-name "$STACK_NAME" \
    --region us-west-2 \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --parameter-overrides Environment=production AlarmEmail=ops@bayoncoagent.app \
    --confirm-changeset \
    --resolve-s3

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    
    # Get stack outputs
    echo "📋 Getting stack outputs..."
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region us-west-2 \
        --query 'Stacks[0].Outputs' \
        --output table
    
    echo ""
    echo "🔧 Extracting resource IDs for .env.production..."
    
    # Extract key resource IDs
    USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region us-west-2 --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text)
    CLIENT_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region us-west-2 --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' --output text)
    TABLE_NAME=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region us-west-2 --query 'Stacks[0].Outputs[?OutputKey==`DynamoDBTableName`].OutputValue' --output text)
    BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region us-west-2 --query 'Stacks[0].Outputs[?OutputKey==`StorageBucketName`].OutputValue' --output text)
    
    echo ""
    echo "📝 Update your .env.production with these values:"
    echo "COGNITO_USER_POOL_ID=$USER_POOL_ID"
    echo "COGNITO_CLIENT_ID=$CLIENT_ID"
    echo "DYNAMODB_TABLE_NAME=$TABLE_NAME"
    echo "S3_BUCKET_NAME=$BUCKET_NAME"
    echo ""
    echo "✅ Clean deployment complete!"
    
else
    echo "❌ Deployment failed"
    exit 1
fi