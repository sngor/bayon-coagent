#!/bin/bash

# SAM Destroy script for Bayon CoAgent
# Usage: ./sam-destroy.sh [environment]

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
STACK_NAME="bayon-coagent-${ENVIRONMENT}"

echo -e "${RED}========================================${NC}"
echo -e "${RED}Bayon CoAgent Infrastructure Destruction${NC}"
echo -e "${RED}========================================${NC}"
echo ""
echo -e "Environment:  ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Stack Name:   ${YELLOW}${STACK_NAME}${NC}"
echo -e "AWS Profile:  ${YELLOW}${PROFILE}${NC}"
echo -e "AWS Region:   ${YELLOW}${REGION}${NC}"
echo ""

# Warning for production
if [ "$ENVIRONMENT" == "production" ]; then
    echo -e "${RED}WARNING: You are about to destroy PRODUCTION infrastructure!${NC}"
    echo -e "${RED}This action is IRREVERSIBLE and will delete all data!${NC}"
    echo ""
    read -p "Type 'DELETE PRODUCTION' to confirm: " CONFIRM
    if [ "$CONFIRM" != "DELETE PRODUCTION" ]; then
        echo -e "${YELLOW}Destruction cancelled${NC}"
        exit 0
    fi
else
    read -p "Are you sure you want to destroy the infrastructure? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo -e "${YELLOW}Destruction cancelled${NC}"
        exit 0
    fi
fi

echo ""
echo -e "${YELLOW}Emptying S3 bucket before deletion...${NC}"

# Get bucket name from stack outputs
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --profile $PROFILE \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`StorageBucketName`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [ -n "$BUCKET_NAME" ]; then
    echo -e "Emptying bucket: ${YELLOW}${BUCKET_NAME}${NC}"
    aws s3 rm s3://${BUCKET_NAME} --recursive --profile $PROFILE || true
    
    # Delete all versions if versioning is enabled
    aws s3api delete-objects \
        --bucket ${BUCKET_NAME} \
        --delete "$(aws s3api list-object-versions \
            --bucket ${BUCKET_NAME} \
            --profile $PROFILE \
            --output=json \
            --query='{Objects: Versions[].{Key:Key,VersionId:VersionId}}')" \
        --profile $PROFILE 2>/dev/null || true
    
    echo -e "${GREEN}✓ Bucket emptied${NC}"
else
    echo -e "${YELLOW}⚠ Could not find bucket name${NC}"
fi

echo ""
echo -e "${YELLOW}Deleting CloudFormation stack...${NC}"

sam delete \
    --stack-name $STACK_NAME \
    --profile $PROFILE \
    --region $REGION \
    --no-prompts

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Infrastructure Destroyed${NC}"
echo -e "${GREEN}========================================${NC}"
