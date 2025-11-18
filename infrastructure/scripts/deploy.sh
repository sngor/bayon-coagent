#!/bin/bash

# Deployment script for Bayon CoAgent AWS Infrastructure
# Usage: ./deploy.sh [environment] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-development}
PROFILE=${AWS_PROFILE:-default}
REGION=${AWS_REGION:-us-east-1}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Bayon CoAgent Infrastructure Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "AWS Profile: ${YELLOW}${PROFILE}${NC}"
echo -e "AWS Region:  ${YELLOW}${REGION}${NC}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo -e "${RED}Error: AWS CDK is not installed${NC}"
    echo "Install it with: npm install -g aws-cdk"
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

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Build TypeScript
echo -e "${YELLOW}Building TypeScript...${NC}"
npm run build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Bootstrap CDK (if needed)
echo -e "${YELLOW}Checking CDK bootstrap status...${NC}"
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --profile $PROFILE --region $REGION &> /dev/null; then
    echo -e "${YELLOW}Bootstrapping CDK...${NC}"
    cdk bootstrap aws://${ACCOUNT_ID}/${REGION} --profile $PROFILE
    echo -e "${GREEN}✓ CDK bootstrapped${NC}"
else
    echo -e "${GREEN}✓ CDK already bootstrapped${NC}"
fi
echo ""

# Synthesize CloudFormation templates
echo -e "${YELLOW}Synthesizing CloudFormation templates...${NC}"
cdk synth --context environment=$ENVIRONMENT --profile $PROFILE
echo -e "${GREEN}✓ Templates synthesized${NC}"
echo ""

# Show diff
echo -e "${YELLOW}Showing changes to be deployed...${NC}"
cdk diff --context environment=$ENVIRONMENT --profile $PROFILE
echo ""

# Confirm deployment
read -p "Do you want to proceed with deployment? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

# Deploy stacks
echo -e "${YELLOW}Deploying stacks...${NC}"
cdk deploy --all \
    --context environment=$ENVIRONMENT \
    --profile $PROFILE \
    --require-approval never \
    --outputs-file outputs.json

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Stack outputs have been saved to: ${YELLOW}outputs.json${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. Update your .env file with the output values"
echo -e "2. Configure your application to use the new resources"
echo -e "3. Test the deployment"
echo ""
