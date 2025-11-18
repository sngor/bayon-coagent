#!/bin/bash

# Initialize LocalStack with required AWS resources for local development

set -e

ENDPOINT="http://localhost:4566"
REGION="us-east-1"

echo "🚀 Initializing LocalStack resources..."

# Wait for LocalStack to be ready
echo "⏳ Waiting for LocalStack to be ready..."
until curl -s "$ENDPOINT/_localstack/health" > /dev/null; do
  echo "Waiting for LocalStack..."
  sleep 2
done
echo "✅ LocalStack is ready!"

# Create DynamoDB Table
echo "📊 Creating DynamoDB table..."
aws dynamodb create-table \
  --table-name BayonCoAgent-local \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL}" \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" \
  --endpoint-url "$ENDPOINT" \
  > /dev/null 2>&1 || echo "⚠️  DynamoDB table already exists"

echo "✅ DynamoDB table created"

# Create S3 Bucket
echo "🪣 Creating S3 bucket..."
aws s3 mb s3://bayon-coagent-local \
  --region "$REGION" \
  --endpoint-url "$ENDPOINT" \
  > /dev/null 2>&1 || echo "⚠️  S3 bucket already exists"

# Configure S3 bucket CORS
echo "🔧 Configuring S3 CORS..."
aws s3api put-bucket-cors \
  --bucket bayon-coagent-local \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedOrigins": ["http://localhost:3000"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
      }
    ]
  }' \
  --region "$REGION" \
  --endpoint-url "$ENDPOINT" \
  > /dev/null 2>&1

echo "✅ S3 bucket created and configured"

# Create Cognito User Pool
echo "👤 Creating Cognito User Pool..."
USER_POOL_OUTPUT=$(aws cognito-idp create-user-pool \
  --pool-name bayon-local-pool \
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=false}" \
  --auto-verified-attributes email \
  --username-attributes email \
  --region "$REGION" \
  --endpoint-url "$ENDPOINT" \
  2>&1) || echo "⚠️  Cognito User Pool might already exist"

if echo "$USER_POOL_OUTPUT" | grep -q "UserPool"; then
  USER_POOL_ID=$(echo "$USER_POOL_OUTPUT" | grep -o '"Id": "[^"]*"' | head -1 | cut -d'"' -f4)
  echo "✅ Cognito User Pool created: $USER_POOL_ID"
  
  # Create User Pool Client
  echo "🔑 Creating Cognito User Pool Client..."
  CLIENT_OUTPUT=$(aws cognito-idp create-user-pool-client \
    --user-pool-id "$USER_POOL_ID" \
    --client-name bayon-local-client \
    --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH \
    --region "$REGION" \
    --endpoint-url "$ENDPOINT" \
    2>&1)
  
  if echo "$CLIENT_OUTPUT" | grep -q "ClientId"; then
    CLIENT_ID=$(echo "$CLIENT_OUTPUT" | grep -o '"ClientId": "[^"]*"' | cut -d'"' -f4)
    echo "✅ Cognito User Pool Client created: $CLIENT_ID"
    
    echo ""
    echo "📝 Update your .env.local with these values:"
    echo "COGNITO_USER_POOL_ID=$USER_POOL_ID"
    echo "COGNITO_CLIENT_ID=$CLIENT_ID"
  fi
fi

echo ""
echo "🎉 LocalStack initialization complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with the Cognito values above (if shown)"
echo "2. Run 'npm run dev' to start the application on http://localhost:3000"
