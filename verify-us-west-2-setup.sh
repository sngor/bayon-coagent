#!/bin/bash

# Verify us-west-2 setup for Bayon CoAgent
# This script tests that all AWS resources are properly configured

set -e

echo "🔍 Verifying us-west-2 setup for Bayon CoAgent..."

# Set region
REGION="us-west-2"

# Check AWS credentials
echo "1️⃣ Checking AWS credentials..."
if aws sts get-caller-identity --region "$REGION" > /dev/null 2>&1; then
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    echo "   ✅ AWS credentials valid (Account: $ACCOUNT_ID)"
else
    echo "   ❌ AWS credentials not configured"
    exit 1
fi

# Check Cognito User Pool
echo "2️⃣ Checking Cognito User Pool..."
USER_POOL_ID="us-west-2_ALOcJxQDd"
if aws cognito-idp describe-user-pool --user-pool-id "$USER_POOL_ID" --region "$REGION" > /dev/null 2>&1; then
    echo "   ✅ Cognito User Pool accessible: $USER_POOL_ID"
else
    echo "   ❌ Cognito User Pool not accessible: $USER_POOL_ID"
fi

# Check Cognito User Pool Client
echo "3️⃣ Checking Cognito User Pool Client..."
CLIENT_ID="1vnmp9v58opg04o480fokp0sct"
if aws cognito-idp describe-user-pool-client --user-pool-id "$USER_POOL_ID" --client-id "$CLIENT_ID" --region "$REGION" > /dev/null 2>&1; then
    echo "   ✅ Cognito Client accessible: $CLIENT_ID"
else
    echo "   ❌ Cognito Client not accessible: $CLIENT_ID"
fi

# Check DynamoDB Table
echo "4️⃣ Checking DynamoDB Table..."
TABLE_NAME="BayonCoAgent-v2-production"
if aws dynamodb describe-table --table-name "$TABLE_NAME" --region "$REGION" > /dev/null 2>&1; then
    echo "   ✅ DynamoDB table accessible: $TABLE_NAME"
    
    # Check table status
    STATUS=$(aws dynamodb describe-table --table-name "$TABLE_NAME" --region "$REGION" --query 'Table.TableStatus' --output text)
    echo "   📊 Table status: $STATUS"
else
    echo "   ❌ DynamoDB table not accessible: $TABLE_NAME"
fi

# Check S3 Bucket
echo "5️⃣ Checking S3 Bucket..."
BUCKET_NAME="bayon-coagent-storage-production-v2-409136660268"
if aws s3api head-bucket --bucket "$BUCKET_NAME" --region "$REGION" 2>/dev/null; then
    echo "   ✅ S3 bucket accessible: $BUCKET_NAME"
    
    # Check bucket region
    BUCKET_REGION=$(aws s3api get-bucket-location --bucket "$BUCKET_NAME" --query 'LocationConstraint' --output text)
    if [ "$BUCKET_REGION" = "None" ]; then
        BUCKET_REGION="us-east-1"  # Default region shows as None
    fi
    echo "   📍 Bucket region: $BUCKET_REGION"
else
    echo "   ❌ S3 bucket not accessible: $BUCKET_NAME"
fi

# Check Bedrock model availability
echo "6️⃣ Checking Bedrock model availability..."
MODEL_ID="us.anthropic.claude-3-5-sonnet-20241022-v2:0"
if aws bedrock list-foundation-models --region "$REGION" --query "modelSummaries[?modelId=='$MODEL_ID']" --output text > /dev/null 2>&1; then
    echo "   ✅ Bedrock model available: $MODEL_ID"
else
    echo "   ⚠️  Bedrock model check failed (may need permissions): $MODEL_ID"
fi

# Check environment configuration
echo "7️⃣ Checking environment configuration..."
if [ -f ".env.production" ]; then
    echo "   ✅ .env.production file exists"
    
    # Check key environment variables
    if grep -q "AWS_REGION=us-west-2" .env.production; then
        echo "   ✅ AWS_REGION set to us-west-2"
    else
        echo "   ⚠️  AWS_REGION not set to us-west-2"
    fi
    
    if grep -q "COGNITO_USER_POOL_ID=$USER_POOL_ID" .env.production; then
        echo "   ✅ COGNITO_USER_POOL_ID correctly configured"
    else
        echo "   ⚠️  COGNITO_USER_POOL_ID not correctly configured"
    fi
    
    if grep -q "DYNAMODB_TABLE_NAME=$TABLE_NAME" .env.production; then
        echo "   ✅ DYNAMODB_TABLE_NAME correctly configured"
    else
        echo "   ⚠️  DYNAMODB_TABLE_NAME not correctly configured"
    fi
    
    if grep -q "S3_BUCKET_NAME=$BUCKET_NAME" .env.production; then
        echo "   ✅ S3_BUCKET_NAME correctly configured"
    else
        echo "   ⚠️  S3_BUCKET_NAME not correctly configured"
    fi
else
    echo "   ❌ .env.production file not found"
fi

# Check application status
echo "8️⃣ Checking application status..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "   ✅ Application running on http://localhost:3001"
else
    echo "   ⚠️  Application not running on http://localhost:3001"
    echo "      Run 'npm run dev' to start the development server"
fi

echo ""
echo "🎯 Verification Summary:"
echo "   Region: $REGION"
echo "   Account: $ACCOUNT_ID"
echo "   Cognito: $USER_POOL_ID"
echo "   DynamoDB: $TABLE_NAME"
echo "   S3: $BUCKET_NAME"
echo "   Bedrock: $MODEL_ID"

echo ""
echo "✅ us-west-2 setup verification complete!"
echo ""
echo "🚀 Next steps:"
echo "   1. Test Studio AI features at http://localhost:3001/studio"
echo "   2. Update API keys in .env.production if needed"
echo "   3. Run cleanup script to remove old us-east-1 resources"
echo "   4. Deploy to production when ready"