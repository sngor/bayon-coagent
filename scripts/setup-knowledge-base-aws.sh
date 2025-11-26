#!/bin/bash

# Knowledge Base AWS Setup Script
# This script creates the necessary AWS resources for the Knowledge Base feature

set -e  # Exit on error

# Configuration
REGION="us-west-2"
BUCKET_NAME="bayon-knowledge-base"
TABLE_NAME="KnowledgeBaseDocuments"

echo "🚀 Setting up AWS infrastructure for Knowledge Base..."
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run:"
    echo "   aws configure"
    exit 1
fi

echo "✅ AWS CLI configured"
echo ""

# ============================================
# 1. Create S3 Bucket
# ============================================
echo "📦 Creating S3 bucket: $BUCKET_NAME"

if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
    aws s3api create-bucket \
        --bucket "$BUCKET_NAME" \
        --region "$REGION" \
        --create-bucket-configuration LocationConstraint="$REGION"
    
    echo "✅ S3 bucket created"
else
    echo "ℹ️  S3 bucket already exists"
fi

# Enable versioning
echo "   Enabling versioning..."
aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled

# Block public access
echo "   Blocking public access..."
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable encryption
echo "   Enabling encryption..."
aws s3api put-bucket-encryption \
    --bucket "$BUCKET_NAME" \
    --server-side-encryption-configuration \
        '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}'

# Set up CORS
echo "   Configuring CORS..."
cat > /tmp/cors.json << EOF
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["http://localhost:3000", "http://localhost:3001"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
    --bucket "$BUCKET_NAME" \
    --cors-configuration file:///tmp/cors.json

rm /tmp/cors.json

echo "✅ S3 bucket configured"
echo ""

# ============================================
# 2. Create DynamoDB Table
# ============================================
echo "🗄️  Creating DynamoDB table: $TABLE_NAME"

if aws dynamodb describe-table --table-name "$TABLE_NAME" --region "$REGION" 2>&1 | grep -q 'ResourceNotFoundException'; then
    aws dynamodb create-table \
        --table-name "$TABLE_NAME" \
        --attribute-definitions \
            AttributeName=userId,AttributeType=S \
            AttributeName=documentId,AttributeType=S \
            AttributeName=status,AttributeType=S \
        --key-schema \
            AttributeName=userId,KeyType=HASH \
            AttributeName=documentId,KeyType=RANGE \
        --global-secondary-indexes \
            "[{
                \"IndexName\": \"StatusIndex\",
                \"KeySchema\": [
                    {\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},
                    {\"AttributeName\":\"status\",\"KeyType\":\"RANGE\"}
                ],
                \"Projection\":{\"ProjectionType\":\"ALL\"}
            }]" \
        --billing-mode PAY_PER_REQUEST \
        --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
        --region "$REGION"
    
    echo "✅ DynamoDB table created"
    
    # Wait for table to be active
    echo "   Waiting for table to be active..."
    aws dynamodb wait table-exists --table-name "$TABLE_NAME" --region "$REGION"
    echo "   Table is active"
else
    echo "ℹ️  DynamoDB table already exists"
fi

echo "✅ DynamoDB table configured"
echo ""

# ============================================
# 3. Get AWS Account Info
# ============================================
echo "📋 Getting AWS account information..."

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
USER_ARN=$(aws sts get-caller-identity --query Arn --output text)

echo "   Account ID: $ACCOUNT_ID"
echo "   User/Role: $USER_ARN"
echo ""

# ============================================
# 4. Create IAM Policy (Optional)
# ============================================
echo "🔐 IAM Policy for Knowledge Base"
echo ""
echo "If you need to create an IAM user/role for this application,"
echo "use the following policy:"
echo ""

cat << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::$BUCKET_NAME",
        "arn:aws:s3:::$BUCKET_NAME/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/$TABLE_NAME",
        "arn:aws:dynamodb:$REGION:$ACCOUNT_ID:table/$TABLE_NAME/index/*"
      ]
    }
  ]
}
EOF

echo ""
echo ""

# ============================================
# 5. Test Setup
# ============================================
echo "🧪 Testing setup..."

# Test S3
echo "   Testing S3 upload..."
echo "test" > /tmp/test.txt
aws s3 cp /tmp/test.txt "s3://$BUCKET_NAME/test/test.txt" --region "$REGION"
aws s3 rm "s3://$BUCKET_NAME/test/test.txt" --region "$REGION"
rm /tmp/test.txt
echo "   ✅ S3 working"

# Test DynamoDB
echo "   Testing DynamoDB write..."
aws dynamodb put-item \
    --table-name "$TABLE_NAME" \
    --item '{
        "userId": {"S": "test-user"},
        "documentId": {"S": "test-doc-123"},
        "fileName": {"S": "test.pdf"},
        "status": {"S": "pending"}
    }' \
    --region "$REGION"

aws dynamodb delete-item \
    --table-name "$TABLE_NAME" \
    --key '{
        "userId": {"S": "test-user"},
        "documentId": {"S": "test-doc-123"}
    }' \
    --region "$REGION"

echo "   ✅ DynamoDB working"
echo ""

# ============================================
# 6. Environment Variables
# ============================================
echo "📝 Environment Variables"
echo ""
echo "Add these to your .env.local file:"
echo ""
echo "# AWS Configuration"
echo "AWS_REGION=$REGION"
echo "AWS_ACCESS_KEY_ID=<your-access-key-id>"
echo "AWS_SECRET_ACCESS_KEY=<your-secret-access-key>"
echo ""
echo "# Knowledge Base"
echo "KNOWLEDGE_BASE_BUCKET=$BUCKET_NAME"
echo "KNOWLEDGE_BASE_TABLE=$TABLE_NAME"
echo ""

# ============================================
# Summary
# ============================================
echo "✅ Setup complete!"
echo ""
echo "Resources created:"
echo "  • S3 Bucket: $BUCKET_NAME"
echo "  • DynamoDB Table: $TABLE_NAME"
echo ""
echo "Next steps:"
echo "  1. Add AWS credentials to .env.local"
echo "  2. Restart your development server"
echo "  3. Test document upload in the UI"
echo ""
