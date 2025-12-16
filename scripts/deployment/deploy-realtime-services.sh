#!/bin/bash

# Deploy Real-Time Communication & Collaboration Services
# This script deploys the WebSocket API, Lambda functions, and DynamoDB tables

set -e

# Configuration
ENVIRONMENT=${1:-development}
REGION=${2:-us-east-1}
STACK_NAME="bayon-coagent-realtime-${ENVIRONMENT}"

echo "🚀 Deploying Real-Time Services for ${ENVIRONMENT} environment..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    echo "❌ SAM CLI not found. Please install SAM CLI first."
    echo "   https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
    exit 1
fi

# Build Lambda functions
echo "📦 Building Lambda functions..."
cd src/lambda/realtime

# Install dependencies if package.json exists
if [ -f "package.json" ]; then
    echo "📦 Installing Lambda dependencies..."
    npm install
fi

# Compile TypeScript
echo "🔨 Compiling TypeScript..."
npx tsc

cd ../../..

# Validate SAM template
echo "✅ Validating SAM template..."
sam validate --template realtime-services-stack.yaml

# Build SAM application
echo "🏗️ Building SAM application..."
sam build --template realtime-services-stack.yaml

# Deploy with SAM
echo "🚀 Deploying to AWS..."
sam deploy \
    --template-file realtime-services-stack.yaml \
    --stack-name "${STACK_NAME}" \
    --parameter-overrides \
        Environment="${ENVIRONMENT}" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "${REGION}" \
    --no-fail-on-empty-changeset \
    --resolve-s3

# Get stack outputs
echo "📋 Getting stack outputs..."
WEBSOCKET_API_ID=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebSocketApiId`].OutputValue' \
    --output text)

WEBSOCKET_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebSocketApiEndpoint`].OutputValue' \
    --output text)

echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Stack Information:"
echo "   Stack Name: ${STACK_NAME}"
echo "   Region: ${REGION}"
echo "   Environment: ${ENVIRONMENT}"
echo ""
echo "🔗 WebSocket API:"
echo "   API ID: ${WEBSOCKET_API_ID}"
echo "   Endpoint: ${WEBSOCKET_ENDPOINT}"
echo ""
echo "📝 Next Steps:"
echo "1. Update your frontend environment variables:"
echo "   NEXT_PUBLIC_WEBSOCKET_ENDPOINT=${WEBSOCKET_ENDPOINT}"
echo ""
echo "2. Test the WebSocket connection:"
echo "   wscat -c \"${WEBSOCKET_ENDPOINT}?userId=test&token=test\""
echo ""
echo "3. Monitor the deployment:"
echo "   aws logs tail /aws/lambda/bayon-coagent-websocket-connect-${ENVIRONMENT} --follow"

# Create environment file for frontend
ENV_FILE=".env.realtime.${ENVIRONMENT}"
cat > "${ENV_FILE}" << EOF
# Real-Time Services Configuration
# Generated on $(date)

NEXT_PUBLIC_WEBSOCKET_ENDPOINT=${WEBSOCKET_ENDPOINT}
NEXT_PUBLIC_WEBSOCKET_API_ID=${WEBSOCKET_API_ID}
NEXT_PUBLIC_REALTIME_ENVIRONMENT=${ENVIRONMENT}
EOF

echo ""
echo "📄 Environment file created: ${ENV_FILE}"
echo "   Copy these variables to your .env.local file"

# Test WebSocket endpoint
echo ""
echo "🧪 Testing WebSocket endpoint..."
if command -v wscat &> /dev/null; then
    echo "   You can test the connection with:"
    echo "   wscat -c \"${WEBSOCKET_ENDPOINT}?userId=test-user&token=test-token\""
else
    echo "   Install wscat to test the connection:"
    echo "   npm install -g wscat"
    echo "   wscat -c \"${WEBSOCKET_ENDPOINT}?userId=test-user&token=test-token\""
fi

echo ""
echo "🎉 Real-Time Services deployment completed!"