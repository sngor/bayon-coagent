#!/bin/bash

# API Gateway Migration Deployment Script
# This script deploys the new Lambda functions and API Gateway setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
REGION=${AWS_REGION:-us-west-2}

echo -e "${GREEN}🚀 Starting API Gateway Migration Deployment${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Region: ${YELLOW}$REGION${NC}"

# Check prerequisites
echo -e "\n${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v sam &> /dev/null; then
    echo -e "${RED}❌ SAM CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure'.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Build and deploy
echo -e "\n${YELLOW}🔨 Building Lambda functions...${NC}"
npm run build

echo -e "\n${YELLOW}📦 Deploying infrastructure...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    sam deploy --config-env production --region $REGION
else
    sam deploy --config-env development --region $REGION
fi

# Get API Gateway URLs
echo -e "\n${YELLOW}🔍 Retrieving API Gateway URLs...${NC}"

STACK_NAME="bayon-coagent-$ENVIRONMENT"

AI_API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`AiServiceApiUrl`].OutputValue' \
    --output text 2>/dev/null || echo "")

INTEGRATION_API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`IntegrationServiceApiUrl`].OutputValue' \
    --output text 2>/dev/null || echo "")

BACKGROUND_API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`BackgroundServiceApiUrl`].OutputValue' \
    --output text 2>/dev/null || echo "")

ADMIN_API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`AdminServiceApiUrl`].OutputValue' \
    --output text 2>/dev/null || echo "")

# Create environment file
echo -e "\n${YELLOW}📝 Creating environment configuration...${NC}"

ENV_FILE=".env.$ENVIRONMENT.api-gateway"

cat > $ENV_FILE << EOF
# API Gateway URLs for $ENVIRONMENT environment
# Generated on $(date)

NEXT_PUBLIC_AI_SERVICE_API_URL=$AI_API_URL
NEXT_PUBLIC_INTEGRATION_SERVICE_API_URL=$INTEGRATION_API_URL
NEXT_PUBLIC_BACKGROUND_SERVICE_API_URL=$BACKGROUND_API_URL
NEXT_PUBLIC_ADMIN_SERVICE_API_URL=$ADMIN_API_URL
EOF

echo -e "${GREEN}✅ Environment file created: $ENV_FILE${NC}"

# Display URLs
echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "\n${YELLOW}📋 API Gateway URLs:${NC}"
echo -e "AI Service:         ${GREEN}$AI_API_URL${NC}"
echo -e "Integration Service: ${GREEN}$INTEGRATION_API_URL${NC}"
echo -e "Background Service:  ${GREEN}$BACKGROUND_API_URL${NC}"
echo -e "Admin Service:       ${GREEN}$ADMIN_API_URL${NC}"

# Test endpoints
echo -e "\n${YELLOW}🧪 Testing health endpoints...${NC}"

test_endpoint() {
    local name=$1
    local url=$2
    
    if [ -n "$url" ]; then
        echo -n "Testing $name... "
        if curl -s -f "$url/health" > /dev/null; then
            echo -e "${GREEN}✅ OK${NC}"
        else
            echo -e "${RED}❌ Failed${NC}"
        fi
    else
        echo -e "$name: ${YELLOW}⚠️  URL not found${NC}"
    fi
}

test_endpoint "AI Service" "$AI_API_URL"
test_endpoint "Integration Service" "$INTEGRATION_API_URL"
test_endpoint "Background Service" "$BACKGROUND_API_URL"
test_endpoint "Admin Service" "$ADMIN_API_URL"

# Next steps
echo -e "\n${YELLOW}📋 Next Steps:${NC}"
echo -e "1. Copy the API URLs to your .env.local file:"
echo -e "   ${GREEN}cp $ENV_FILE .env.local${NC}"
echo -e ""
echo -e "2. Update your components to use the new API client:"
echo -e "   ${GREEN}See MIGRATION_TO_API_GATEWAY.md for detailed instructions${NC}"
echo -e ""
echo -e "3. Test the migration with a few components first"
echo -e ""
echo -e "4. Monitor CloudWatch logs for any issues"

echo -e "\n${GREEN}🎯 Migration deployment complete!${NC}"