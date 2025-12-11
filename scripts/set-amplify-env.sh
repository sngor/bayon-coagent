#!/bin/bash

# Script to set environment variables in AWS Amplify
# Usage: ./scripts/set-amplify-env.sh <app-id>

set -e

APP_ID=$1

if [ -z "$APP_ID" ]; then
    echo "Usage: $0 <amplify-app-id>"
    echo "You can find your app ID in the Amplify Console URL"
    exit 1
fi

echo "Setting environment variables for Amplify app: $APP_ID"

# Use the correct production values from your deployed infrastructure
COGNITO_USER_POOL_ID="us-west-2_MD8s1NfbO"
COGNITO_CLIENT_ID="6t430ieqgniufdbs1kfu87rv3b"
REGION="us-west-2"
DYNAMODB_TABLE_NAME="BayonCoAgent-production"
S3_BUCKET_NAME="bayon-coagent-storage-production-409136660268"
BEDROCK_MODEL_ID="us.anthropic.claude-3-5-sonnet-20241022-v2:0"
BEDROCK_REGION="us-west-2"

echo "Setting critical environment variables..."

# Set environment variables in Amplify (note: cannot use AWS_ prefix)
aws amplify put-backend-environment \
    --app-id "$APP_ID" \
    --environment-name "main" \
    --environment-variables \
        NODE_ENV=production \
        COGNITO_USER_POOL_ID="$COGNITO_USER_POOL_ID" \
        COGNITO_CLIENT_ID="$COGNITO_CLIENT_ID" \
        NEXT_PUBLIC_USER_POOL_ID="$COGNITO_USER_POOL_ID" \
        NEXT_PUBLIC_USER_POOL_CLIENT_ID="$COGNITO_CLIENT_ID" \
        NEXT_PUBLIC_AWS_REGION="$REGION" \
        DYNAMODB_TABLE_NAME="$DYNAMODB_TABLE_NAME" \
        S3_BUCKET_NAME="$S3_BUCKET_NAME" \
        BEDROCK_MODEL_ID="$BEDROCK_MODEL_ID" \
        BEDROCK_REGION="$BEDROCK_REGION"

echo "Environment variables set successfully!"
echo ""
echo "Next steps:"
echo "1. Go to your Amplify Console"
echo "2. Trigger a new build"
echo "3. The login should now work"
echo ""
echo "If you need to set additional environment variables (API keys, etc.),"
echo "you can do so through the Amplify Console under 'Environment variables'"