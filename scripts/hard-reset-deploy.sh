#!/bin/bash

# Hard reset script for Bayon CoAgent deployment
# Usage: ./scripts/hard-reset-deploy.sh [environment]

set -e

ENVIRONMENT=${1:-development}
REGION="us-west-2"
STACK_NAME="bayon-coagent-dev"

if [ "$ENVIRONMENT" == "production" ]; then
    STACK_NAME="bayon-coagent-prod"
fi

echo "========================================"
echo "Bayon CoAgent - Hard Reset Deployment"
echo "========================================"
echo "Environment: $ENVIRONMENT"
echo "Region:      $REGION"
echo "Stack Name:  $STACK_NAME"
echo ""

# 1. Delete the existing stack
echo "1. Deleting existing stack (if any)..."
echo "   This is necessary to clear any failed states from previous attempts."
aws cloudformation delete-stack --stack-name $STACK_NAME --region $REGION

echo "   Waiting for stack deletion to complete..."
aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME --region $REGION
echo "   Stack deleted successfully."
echo ""

# 2. Deploy fresh
echo "2. Starting fresh deployment..."
./scripts/sam-deploy.sh $ENVIRONMENT

echo ""
echo "3. Updating environment variables..."
./scripts/update-env-from-sam.sh $ENVIRONMENT

echo ""
echo "========================================"
echo "Hard Reset Complete!"
echo "========================================"
