#!/bin/bash

# SAM Deployment script for Bayon CoAgent
# Usage: ./sam-deploy.sh [environment] [alarm-email]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-development}
ALARM_EMAIL=${2:-}
PROFILE=${AWS_PROFILE:-default}
REGION=${AWS_REGION:-us-east-1}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Bayon CoAgent SAM Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Environment:  ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "AWS Profile:  ${YELLOW}${PROFILE}${NC}"
echo -e "AWS Region:   ${YELLOW}${REGION}${NC}"
if [ -n "$ALARM_EMAIL" ]; then
    echo -e "Alarm Email:  ${YELLOW}${ALARM_EMAIL}${NC}"
fi
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    echo -e "${RED}Error: AWS SAM CLI is not installed${NC}"
    echo "Install it with: pip install aws-sam-cli"
    echo "Or: brew install aws-sam-cli"
    exit 1
fi

# Verify AWS credentials
echo -e "${YELLOW}Verifying AWS credentials...${NC}"
if ! aws sts get-caller-identity --profile $PROFILE &> /dev/null; then
    echo -e "${RED}Error: Invalid AWS credentials${NC}"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --profile $PROFILE --query Account --output text)
echo -e "${GREEN}✓ Authenticated as account: ${ACCOUNT_ID}${NC}"
echo ""

# Validate SAM template
echo -e "${YELLOW}Validating SAM template...${NC}"
if ! sam validate --profile $PROFILE; then
    echo -e "${RED}Error: SAM template validation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Template is valid${NC}"
echo ""

# Build parameters
PARAMS="Environment=${ENVIRONMENT}"
if [ -n "$ALARM_EMAIL" ]; then
    PARAMS="${PARAMS} AlarmEmail=${ALARM_EMAIL}"
fi

# Deploy with SAM
echo -e "${YELLOW}Deploying infrastructure...${NC}"
sam deploy \
    --config-env $ENVIRONMENT \
    --parameter-overrides $PARAMS \
    --profile $PROFILE \
    --region $REGION \
    --no-fail-on-empty-changeset

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Get stack outputs
echo -e "${YELLOW}Retrieving stack outputs...${NC}"
STACK_NAME="bayon-coagent-${ENVIRONMENT}"
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --profile $PROFILE \
    --region $REGION \
    --query 'Stacks[0].Outputs' \
    --output table

# Save outputs to file
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --profile $PROFILE \
    --region $REGION \
    --query 'Stacks[0].Outputs' \
    --output json > sam-outputs.json

echo ""
echo -e "Stack outputs saved to: ${YELLOW}sam-outputs.json${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. Run: ${YELLOW}./scripts/update-env-from-sam.sh ${ENVIRONMENT}${NC}"
echo -e "2. Update your .env file with the output values"
echo -e "3. Test the deployment"
echo ""
