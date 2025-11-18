#!/bin/bash

# Destroy script for Bayon CoAgent AWS Infrastructure
# Usage: ./destroy.sh [environment]

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

echo -e "${RED}========================================${NC}"
echo -e "${RED}Bayon CoAgent Infrastructure Destruction${NC}"
echo -e "${RED}========================================${NC}"
echo ""
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "AWS Profile: ${YELLOW}${PROFILE}${NC}"
echo -e "AWS Region:  ${YELLOW}${REGION}${NC}"
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
echo -e "${YELLOW}Destroying stacks...${NC}"

# Destroy all stacks
cdk destroy --all \
    --context environment=$ENVIRONMENT \
    --profile $PROFILE \
    --force

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Infrastructure Destroyed${NC}"
echo -e "${GREEN}========================================${NC}"
