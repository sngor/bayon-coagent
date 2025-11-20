#!/bin/bash

# Deploy and Configure Script
# This script deploys the AWS infrastructure and updates your .env.local file

set -e

ENVIRONMENT=${1:-development}
ENV_FILE=".env.local"

echo "🚀 Deploying Bayon CoAgent infrastructure for $ENVIRONMENT..."
echo ""

# Deploy the SAM stack
if [ "$ENVIRONMENT" = "production" ]; then
    sam deploy --config-env production --no-confirm-changeset
else
    sam deploy --config-env development --no-confirm-changeset
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Fetching stack outputs..."

# Get stack name based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    STACK_NAME="bayon-coagent-prod"
else
    STACK_NAME="bayon-coagent-dev"
fi

# Fetch outputs from CloudFormation
USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text)

CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
    --output text)

TABLE_NAME=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`DynamoDBTableName`].OutputValue' \
    --output text)

BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`StorageBucketName`].OutputValue' \
    --output text)

REGION=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`Region`].OutputValue' \
    --output text)

echo ""
echo "📋 Stack Outputs:"
echo "  User Pool ID: $USER_POOL_ID"
echo "  Client ID: $CLIENT_ID"
echo "  DynamoDB Table: $TABLE_NAME"
echo "  S3 Bucket: $BUCKET_NAME"
echo "  Region: $REGION"
echo ""

# Update .env.local file
echo "📝 Updating $ENV_FILE..."

# Backup existing file
if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "${ENV_FILE}.backup"
    echo "  Backed up existing file to ${ENV_FILE}.backup"
fi

# Update or add the values
if [ -f "$ENV_FILE" ]; then
    # Update existing values
    sed -i.tmp "s|^COGNITO_USER_POOL_ID=.*|COGNITO_USER_POOL_ID=$USER_POOL_ID|" "$ENV_FILE"
    sed -i.tmp "s|^COGNITO_CLIENT_ID=.*|COGNITO_CLIENT_ID=$CLIENT_ID|" "$ENV_FILE"
    sed -i.tmp "s|^DYNAMODB_TABLE_NAME=.*|DYNAMODB_TABLE_NAME=$TABLE_NAME|" "$ENV_FILE"
    sed -i.tmp "s|^S3_BUCKET_NAME=.*|S3_BUCKET_NAME=$BUCKET_NAME|" "$ENV_FILE"
    sed -i.tmp "s|^AWS_REGION=.*|AWS_REGION=$REGION|" "$ENV_FILE"
    rm "${ENV_FILE}.tmp"
else
    # Create new file
    cat > "$ENV_FILE" << EOF
# Environment Configuration
NODE_ENV=development
USE_LOCAL_AWS=false

# AWS Configuration
AWS_REGION=$REGION

# AWS Cognito Configuration
COGNITO_USER_POOL_ID=$USER_POOL_ID
COGNITO_CLIENT_ID=$CLIENT_ID

# DynamoDB Configuration
DYNAMODB_TABLE_NAME=$TABLE_NAME

# S3 Configuration
S3_BUCKET_NAME=$BUCKET_NAME

# AWS Bedrock Configuration
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=$REGION

# External API Keys
TAVILY_API_KEY=your-tavily-api-key
EOF
fi

echo ""
echo "✅ Configuration updated successfully!"
echo ""
echo "🎉 Next steps:"
echo "  1. Clear your browser's localStorage (or run: npm run clear-auth)"
echo "  2. Restart your dev server: npm run dev"
echo "  3. Sign up for a new account"
echo ""
