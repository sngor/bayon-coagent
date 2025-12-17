#!/bin/bash

# Production Environment Validation Script
# Validates that all required environment variables are set for production

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_error() { echo -e "${RED}✗ ${1}${NC}"; }
print_success() { echo -e "${GREEN}✓ ${1}${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ ${1}${NC}"; }

ERRORS=0

check_env_var() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -z "$var_value" ]; then
        print_error "$var_name is not set"
        ERRORS=$((ERRORS + 1))
    elif [[ "$var_value" == *"your-"* ]] || [[ "$var_value" == *"REPLACE_WITH"* ]] || [[ "$var_value" == *"PRODUCTION_"*"_NEEDED" ]]; then
        print_warning "$var_name needs production value: $var_value"
        # Don't increment ERRORS for placeholder values - treat as warnings
    else
        print_success "$var_name is set"
    fi
}

echo "🔍 Validating Production Environment Variables..."
echo ""

# Load production environment
if [ -f ".env.production" ]; then
    source .env.production
else
    print_error ".env.production file not found"
    exit 1
fi

# Critical AWS Configuration
check_env_var "AWS_REGION"
check_env_var "COGNITO_USER_POOL_ID"
check_env_var "COGNITO_CLIENT_ID"
check_env_var "DYNAMODB_TABLE_NAME"
check_env_var "S3_BUCKET_NAME"
check_env_var "BEDROCK_MODEL_ID"

# API Keys
check_env_var "GOOGLE_AI_API_KEY"
check_env_var "BRIDGE_API_KEY"
check_env_var "TAVILY_API_KEY"

# OAuth Configuration
check_env_var "GOOGLE_CLIENT_ID"
check_env_var "GOOGLE_CLIENT_SECRET"
check_env_var "NEXT_PUBLIC_APP_URL"

# Validate URL format
if [[ ! "$NEXT_PUBLIC_APP_URL" =~ ^https:// ]]; then
    print_error "NEXT_PUBLIC_APP_URL must use HTTPS in production"
    ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
    print_success "All environment variables are properly configured!"
    exit 0
else
    print_error "$ERRORS environment variable(s) need attention"
    echo ""
    echo "Please update .env.production with real production values"
    exit 1
fi