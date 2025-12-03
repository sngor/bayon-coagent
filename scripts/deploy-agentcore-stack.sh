#!/bin/bash
# Deploy AgentCore CloudFormation Stack
# Usage: ./scripts/deploy-agentcore-stack.sh [development|production]

set -e

ENVIRONMENT=${1:-development}
REGION="us-west-2"
STACK_NAME="bayon-coagent-agentcore-${ENVIRONMENT}"
CORE_STACK_NAME="bayon-coagent-${ENVIRONMENT}"

echo "🚀 Deploying AgentCore Stack"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "Stack Name: $STACK_NAME"
echo ""

# Validate template
echo "✅ Validating CloudFormation template..."
aws cloudformation validate-template \
    --template-body file://template-agentcore.yaml \
    --region $REGION > /dev/null

echo "✅ Template is valid"
echo ""

# Deploy stack
echo "🚀 Deploying stack..."
aws cloudformation deploy \
    --template-file template-agentcore.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        Environment=$ENVIRONMENT \
        CoreStackName=$CORE_STACK_NAME \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION \
    --tags \
        Environment=$ENVIRONMENT \
        Application=BayonCoAgent \
        Component=AgentCore

echo ""
echo "✅ Stack deployed successfully!"
echo ""

# Get outputs
echo "📋 Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs' \
    --output table

echo ""
echo "📝 Next steps:"
echo "1. Run: ./scripts/deploy-agentcore.sh $ENVIRONMENT"
echo "2. Copy agent ID and alias ID to .env.local"
echo "3. Test: npm run test:agentcore"
