#!/bin/bash

# Update environment configuration for us-west-2 using existing resources
# This script updates your .env.production to use the existing us-west-2 resources

set -e

echo "🔧 Updating environment configuration for us-west-2..."

# Set AWS region
export AWS_DEFAULT_REGION=us-west-2

# Check if we have AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS credentials verified"

# Get existing resource information
echo "🔍 Discovering existing resources in us-west-2..."

# Get Cognito User Pool info
USER_POOL_ID="us-west-2_ALOcJxQDd"
echo "✅ Found Cognito User Pool: $USER_POOL_ID"

# Get User Pool Client ID
CLIENT_ID=$(aws cognito-idp list-user-pool-clients --user-pool-id "$USER_POOL_ID" --region us-west-2 --query 'UserPoolClients[0].ClientId' --output text)
echo "✅ Found User Pool Client: $CLIENT_ID"

# Use existing DynamoDB table
TABLE_NAME="BayonCoAgent-v2-production"
echo "✅ Using DynamoDB table: $TABLE_NAME"

# Use existing S3 bucket
BUCKET_NAME="bayon-coagent-storage-production-v2-409136660268"
echo "✅ Using S3 bucket: $BUCKET_NAME"

# Backup existing .env.production
if [ -f ".env.production" ]; then
    cp .env.production .env.production.backup.$(date +%Y%m%d-%H%M%S)
    echo "📋 Backed up existing .env.production"
fi

# Update .env.production
echo "📝 Updating .env.production with us-west-2 resources..."

cat > .env.production << EOF
# Environment Configuration
NODE_ENV=production

# AWS Configuration - us-west-2
AWS_REGION=us-west-2

# AWS Cognito Configuration - us-west-2
COGNITO_USER_POOL_ID=$USER_POOL_ID
COGNITO_CLIENT_ID=$CLIENT_ID

# DynamoDB Configuration - us-west-2
DYNAMODB_TABLE_NAME=$TABLE_NAME

# S3 Configuration - us-west-2
S3_BUCKET_NAME=$BUCKET_NAME

# AWS Bedrock Configuration - us-west-2
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-west-2

# Google AI API (for image generation)
GOOGLE_AI_API_KEY=your-google-ai-api-key

# External API Keys
BRIDGE_API_KEY=your-bridge-api-key
NEWS_API_KEY=0c0dadd0c8f8418cabbb24dc3baccd0a
TAVILY_API_KEY=your-tavily-api-key

# OAuth Configuration (update with your production values)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/oauth/google/callback

# Social Media OAuth Configuration
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# App URL for OAuth callbacks
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# MLS Provider Configuration
FLEXMLS_API_URL=https://api.flexmls.com/v1
FLEXMLS_CLIENT_ID=your-flexmls-client-id
FLEXMLS_CLIENT_SECRET=your-flexmls-client-secret

CRMLS_API_URL=https://api.crmls.org/RESO/OData
CRMLS_CLIENT_ID=your-crmls-client-id
CRMLS_CLIENT_SECRET=your-crmls-client-secret

BRIGHT_API_URL=https://api.brightmls.com/RESO/OData
BRIGHT_CLIENT_ID=your-bright-client-id
BRIGHT_CLIENT_SECRET=your-bright-client-secret

MLSGRID_API_URL=https://api.mlsgrid.com/v2
MLSGRID_CLIENT_ID=your-mlsgrid-client-id
MLSGRID_CLIENT_SECRET=your-mlsgrid-client-secret
EOF

echo "✅ Updated .env.production with us-west-2 configuration"

# Verify resources are accessible
echo "🔍 Verifying resource accessibility..."

# Test Cognito
if aws cognito-idp describe-user-pool --user-pool-id "$USER_POOL_ID" --region us-west-2 > /dev/null 2>&1; then
    echo "✅ Cognito User Pool accessible"
else
    echo "❌ Cognito User Pool not accessible"
fi

# Test DynamoDB
if aws dynamodb describe-table --table-name "$TABLE_NAME" --region us-west-2 > /dev/null 2>&1; then
    echo "✅ DynamoDB table accessible"
else
    echo "❌ DynamoDB table not accessible"
fi

# Test S3
if aws s3api head-bucket --bucket "$BUCKET_NAME" --region us-west-2 > /dev/null 2>&1; then
    echo "✅ S3 bucket accessible"
else
    echo "❌ S3 bucket not accessible"
fi

echo ""
echo "🎉 Configuration updated successfully!"
echo ""
echo "📋 Summary of us-west-2 resources:"
echo "   Region: us-west-2"
echo "   Cognito User Pool: $USER_POOL_ID"
echo "   Cognito Client: $CLIENT_ID"
echo "   DynamoDB Table: $TABLE_NAME"
echo "   S3 Bucket: $BUCKET_NAME"
echo ""
echo "🔧 Next steps:"
echo "1. Update API keys in .env.production (Google AI, Tavily, etc.)"
echo "2. Update OAuth credentials for production domain"
echo "3. Test the application with: npm run dev"
echo "4. Deploy to production when ready"
echo ""
echo "⚠️  Note: Make sure to update placeholder API keys with real values!"