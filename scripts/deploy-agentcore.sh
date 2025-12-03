#!/bin/bash
# Deploy AgentCore Research Agent
# Usage: ./scripts/deploy-agentcore.sh [development|production]

set -e

ENVIRONMENT=${1:-development}
REGION="us-west-2"
ACCOUNT_ID="409136660268"
BUCKET_NAME="bayon-agentcore-code-${ENVIRONMENT}-${ACCOUNT_ID}"

echo "🚀 Deploying Research Agent to AgentCore Runtime"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo ""

# Step 1: Create S3 bucket if it doesn't exist
echo "📦 Step 1: Checking S3 bucket..."
if aws s3 ls "s3://${BUCKET_NAME}" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "Creating bucket: ${BUCKET_NAME}"
    aws s3 mb "s3://${BUCKET_NAME}" --region $REGION
    
    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket "${BUCKET_NAME}" \
        --versioning-configuration Status=Enabled \
        --region $REGION
    
    echo "✅ Bucket created and versioning enabled"
else
    echo "✅ Bucket already exists"
fi

echo ""

# Step 2: Package agent
echo "📦 Step 2: Packaging agent..."
cd agents/research-agent

# Remove old package
rm -f agent.zip

# Create package with agent code
zip -q agent.zip main.py knowledge_retriever.py

# Add Python dependencies
if [ -d ".venv/lib/python3.13/site-packages" ]; then
    cd .venv/lib/python3.13/site-packages
    zip -qr ../../../../agent.zip . -x "*.pyc" -x "*__pycache__*" -x "*.dist-info/*"
    cd ../../../../
    echo "✅ Agent packaged with dependencies"
else
    echo "⚠️  Warning: .venv not found. Run 'uv sync' first."
    exit 1
fi

# Check package size
PACKAGE_SIZE=$(du -h agent.zip | cut -f1)
echo "Package size: $PACKAGE_SIZE"

echo ""

# Step 3: Upload to S3
echo "☁️  Step 3: Uploading to S3..."
aws s3 cp agent.zip "s3://${BUCKET_NAME}/research-agent/agent.zip" \
    --region $REGION \
    --metadata "environment=${ENVIRONMENT},version=$(date +%Y%m%d-%H%M%S)"

echo "✅ Uploaded to s3://${BUCKET_NAME}/research-agent/agent.zip"

echo ""

# Step 4: Deploy using AgentCore CLI (if available)
echo "🚀 Step 4: Deploying to AgentCore Runtime..."

if command -v agentcore &> /dev/null; then
    echo "Using AgentCore CLI..."
    
    agentcore deploy \
        --name "research-agent-${ENVIRONMENT}" \
        --region $REGION \
        --code-location "s3://${BUCKET_NAME}/research-agent/agent.zip" \
        --runtime-role-arn "arn:aws:iam::${ACCOUNT_ID}:role/bayon-agentcore-execution-${ENVIRONMENT}" \
        --enable-observability \
        --environment $ENVIRONMENT
    
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Copy the Agent ID and Alias ID from above"
    echo "2. Add to .env.local:"
    echo "   RESEARCH_AGENT_ID=agent-xxxxx"
    echo "   RESEARCH_AGENT_ALIAS_ID=TSTALIASID"
    echo "3. Test the agent: npm run test:agentcore"
    
else
    echo "⚠️  AgentCore CLI not found. Manual deployment required."
    echo ""
    echo "📝 Manual deployment steps:"
    echo "1. Go to AWS Bedrock console"
    echo "2. Navigate to AgentCore → Runtimes"
    echo "3. Create new runtime:"
    echo "   - Name: research-agent-${ENVIRONMENT}"
    echo "   - Code location: s3://${BUCKET_NAME}/research-agent/agent.zip"
    echo "   - Execution role: arn:aws:iam::${ACCOUNT_ID}:role/bayon-agentcore-execution-${ENVIRONMENT}"
    echo "   - Enable observability: Yes"
    echo "4. Copy Agent ID and Alias ID to .env.local"
fi

echo ""
echo "🔍 View logs:"
echo "aws logs tail /aws/bedrock-agentcore/runtimes/agent-xxxxx --follow --region $REGION"

echo ""
echo "📊 View observability:"
echo "https://console.aws.amazon.com/cloudwatch/home?region=${REGION}#gen-ai-observability"

cd ../..
