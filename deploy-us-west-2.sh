#!/bin/bash

# Deploy Bayon CoAgent Infrastructure to us-west-2
# This script ensures a clean deployment in the us-west-2 region

set -e

echo "🚀 Deploying Bayon CoAgent to us-west-2..."

# Set AWS region
export AWS_DEFAULT_REGION=us-west-2

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

# Check for existing resources that might conflict
echo "🔍 Checking for existing resources..."

# Check for existing Cognito User Pool
EXISTING_USER_POOL=$(aws cognito-idp list-user-pools --max-results 60 --region us-west-2 --query "UserPools[?Name=='bayon-coagent-production'].Id" --output text 2>/dev/null || echo "")

if [ ! -z "$EXISTING_USER_POOL" ]; then
    echo "⚠️  Found existing Cognito User Pool: $EXISTING_USER_POOL"
    echo "   This will be reused in the deployment."
fi

# Check for existing DynamoDB table
EXISTING_TABLE=$(aws dynamodb describe-table --table-name BayonCoAgent-production --region us-west-2 --query "Table.TableName" --output text 2>/dev/null || echo "")

if [ ! -z "$EXISTING_TABLE" ] && [ "$EXISTING_TABLE" != "None" ]; then
    echo "⚠️  Found existing DynamoDB table: $EXISTING_TABLE"
    echo "   This will be reused in the deployment."
fi

# Check for existing S3 bucket
EXISTING_BUCKET=$(aws s3api head-bucket --bucket bayon-coagent-storage-production-409136660268 --region us-west-2 2>/dev/null && echo "exists" || echo "")

if [ "$EXISTING_BUCKET" = "exists" ]; then
    echo "⚠️  Found existing S3 bucket: bayon-coagent-storage-production-409136660268"
    echo "   This will be reused in the deployment."
fi

# Deploy with guided mode first time, then use config
echo "🚀 Deploying infrastructure..."

# Try to deploy with existing configuration
if sam deploy --config-env default --region us-west-2; then
    echo "✅ Deployment successful!"
else
    echo "❌ Deployment failed with existing config. Trying guided deployment..."
    
    # If that fails, try guided deployment
    sam deploy --guided --region us-west-2 \
        --stack-name bayon-coagent-production \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --parameter-overrides Environment=production AlarmEmail=ops@bayoncoagent.app \
        --confirm-changeset
fi

# Get stack outputs
echo "📋 Getting stack outputs..."
aws cloudformation describe-stacks \
    --stack-name bayon-coagent-production \
    --region us-west-2 \
    --query 'Stacks[0].Outputs' \
    --output table

echo "✅ Deployment complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Update your .env.production file with the new resource IDs"
echo "2. Deploy your Next.js application to Amplify"
echo "3. Test all AI features in the Studio hub"
echo ""
echo "📝 Resource IDs to update in .env.production:"
echo "   - COGNITO_USER_POOL_ID"
echo "   - COGNITO_CLIENT_ID" 
echo "   - DYNAMODB_TABLE_NAME"
echo "   - S3_BUCKET_NAME"