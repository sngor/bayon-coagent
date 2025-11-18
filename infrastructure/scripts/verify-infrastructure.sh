#!/bin/bash

# Verification script for infrastructure setup
# Usage: ./verify-infrastructure.sh [environment]

set -e

ENVIRONMENT=${1:-development}
PROFILE=${AWS_PROFILE:-default}
REGION=${AWS_REGION:-us-east-1}

echo "========================================="
echo "Infrastructure Verification"
echo "========================================="
echo ""
echo "Environment: $ENVIRONMENT"
echo "AWS Profile: $PROFILE"
echo "AWS Region:  $REGION"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed"
    exit 1
fi
echo "✅ AWS CLI is installed"

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "❌ AWS CDK is not installed"
    exit 1
fi
echo "✅ AWS CDK is installed"

# Check AWS credentials
if ! aws sts get-caller-identity --profile $PROFILE &> /dev/null; then
    echo "❌ Invalid AWS credentials"
    exit 1
fi
echo "✅ AWS credentials are valid"

# Check if stacks exist
STACKS=(
    "BayonCoAgent-${ENVIRONMENT}-Cognito"
    "BayonCoAgent-${ENVIRONMENT}-DynamoDB"
    "BayonCoAgent-${ENVIRONMENT}-S3"
    "BayonCoAgent-${ENVIRONMENT}-IAM"
    "BayonCoAgent-${ENVIRONMENT}-Monitoring"
)

echo ""
echo "Checking deployed stacks..."
for stack in "${STACKS[@]}"; do
    if aws cloudformation describe-stacks --stack-name $stack --profile $PROFILE --region $REGION &> /dev/null; then
        STATUS=$(aws cloudformation describe-stacks --stack-name $stack --profile $PROFILE --region $REGION --query 'Stacks[0].StackStatus' --output text)
        if [ "$STATUS" == "CREATE_COMPLETE" ] || [ "$STATUS" == "UPDATE_COMPLETE" ]; then
            echo "✅ $stack: $STATUS"
        else
            echo "⚠️  $stack: $STATUS"
        fi
    else
        echo "❌ $stack: NOT DEPLOYED"
    fi
done

echo ""
echo "========================================="
echo "Verification Complete"
echo "========================================="
