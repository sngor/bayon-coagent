#!/bin/bash

# Deployment script that includes Lambda function building
# This script builds Lambda functions and deploys the SAM template

set -e

ENVIRONMENT=${1:-development}
REGION=${2:-us-east-1}

echo "Deploying Bayon CoAgent with Lambda functions to $ENVIRONMENT environment in $REGION..."

# Build Lambda functions first
echo "Building Lambda functions..."
./scripts/build-lambda.sh

# Deploy using SAM
echo "Deploying SAM template..."
sam deploy \
    --template-file template.yaml \
    --stack-name bayon-coagent-$ENVIRONMENT \
    --parameter-overrides Environment=$ENVIRONMENT \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --region $REGION \
    --no-fail-on-empty-changeset \
    --resolve-s3

echo "Deployment completed successfully!"
echo "Stack: bayon-coagent-$ENVIRONMENT"
echo "Region: $REGION"

# Display stack outputs
echo "Getting stack outputs..."
aws cloudformation describe-stacks \
    --stack-name bayon-coagent-$ENVIRONMENT \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DashboardURL`].OutputValue' \
    --output text