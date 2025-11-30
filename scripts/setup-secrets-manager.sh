#!/bin/bash

# AWS Secrets Manager Setup Script
# This script helps set up secrets in AWS Secrets Manager for Bayon CoAgent

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# Check prerequisites
print_info "Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    print_warning "jq is not installed. Install with: brew install jq"
    print_warning "Continuing without jq, but some features may not work."
fi

print_success "Prerequisites check passed"

# Get environment
echo ""
print_info "Select environment:"
echo "1) development"
echo "2) production"
read -p "Enter choice (1 or 2): " env_choice

case $env_choice in
    1)
        ENVIRONMENT="development"
        ;;
    2)
        ENVIRONMENT="production"
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

print_info "Environment: $ENVIRONMENT"

# Get AWS region
echo ""
read -p "Enter AWS region (default: us-west-2): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-west-2}

# Verify AWS credentials
print_info "Verifying AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "Invalid AWS credentials or not configured"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
print_success "Authenticated as account: $ACCOUNT_ID"

# Function to create a secret
create_secret() {
    local secret_name=$1
    local secret_description=$2
    local secret_json=$3
    
    print_info "Creating secret: $secret_name"
    
    # Check if secret already exists
    if aws secretsmanager describe-secret --secret-id "$secret_name" --region "$AWS_REGION" &> /dev/null; then
        print_warning "Secret already exists: $secret_name"
        read -p "Do you want to update it? (y/n): " UPDATE_SECRET
        if [ "$UPDATE_SECRET" = "y" ]; then
            aws secretsmanager update-secret \
                --secret-id "$secret_name" \
                --secret-string "$secret_json" \
                --region "$AWS_REGION" \
                > /dev/null
            print_success "Secret updated: $secret_name"
        else
            print_info "Skipping $secret_name"
        fi
    else
        aws secretsmanager create-secret \
            --name "$secret_name" \
            --description "$secret_description" \
            --secret-string "$secret_json" \
            --region "$AWS_REGION" \
            > /dev/null
        print_success "Secret created: $secret_name"
    fi
}

# Google OAuth
echo ""
print_info "=== Google OAuth Configuration ==="
read -p "Enter Google Client ID: " GOOGLE_CLIENT_ID
read -p "Enter Google Client Secret: " GOOGLE_CLIENT_SECRET
read -p "Enter Google Redirect URI (default: https://your-domain.com/api/oauth/google/callback): " GOOGLE_REDIRECT_URI
GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI:-https://your-domain.com/api/oauth/google/callback}

GOOGLE_SECRET=$(cat <<EOF
{
  "client_id": "$GOOGLE_CLIENT_ID",
  "client_secret": "$GOOGLE_CLIENT_SECRET",
  "redirect_uri": "$GOOGLE_REDIRECT_URI"
}
EOF
)

create_secret "bayon-coagent/$ENVIRONMENT/google-oauth" "Google OAuth credentials" "$GOOGLE_SECRET"

# Facebook OAuth
echo ""
print_info "=== Facebook OAuth Configuration ==="
read -p "Do you want to configure Facebook OAuth? (y/n): " SETUP_FACEBOOK
if [ "$SETUP_FACEBOOK" = "y" ]; then
    read -p "Enter Facebook App ID: " FACEBOOK_APP_ID
    read -p "Enter Facebook App Secret: " FACEBOOK_APP_SECRET
    
    FACEBOOK_SECRET=$(cat <<EOF
{
  "app_id": "$FACEBOOK_APP_ID",
  "app_secret": "$FACEBOOK_APP_SECRET"
}
EOF
    )
    
    create_secret "bayon-coagent/$ENVIRONMENT/facebook-oauth" "Facebook OAuth credentials" "$FACEBOOK_SECRET"
fi

# LinkedIn OAuth
echo ""
print_info "=== LinkedIn OAuth Configuration ==="
read -p "Do you want to configure LinkedIn OAuth? (y/n): " SETUP_LINKEDIN
if [ "$SETUP_LINKEDIN" = "y" ]; then
    read -p "Enter LinkedIn Client ID: " LINKEDIN_CLIENT_ID
    read -p "Enter LinkedIn Client Secret: " LINKEDIN_CLIENT_SECRET
    
    LINKEDIN_SECRET=$(cat <<EOF
{
  "client_id": "$LINKEDIN_CLIENT_ID",
  "client_secret": "$LINKEDIN_CLIENT_SECRET"
}
EOF
    )
    
    create_secret "bayon-coagent/$ENVIRONMENT/linkedin-oauth" "LinkedIn OAuth credentials" "$LINKEDIN_SECRET"
fi

# Stripe
echo ""
print_info "=== Stripe Configuration ==="
read -p "Do you want to configure Stripe? (y/n): " SETUP_STRIPE
if [ "$SETUP_STRIPE" = "y" ]; then
    read -p "Enter Stripe Publishable Key: " STRIPE_PUBLISHABLE_KEY
    read -p "Enter Stripe Secret Key: " STRIPE_SECRET_KEY
    read -p "Enter Stripe Webhook Secret: " STRIPE_WEBHOOK_SECRET
    
    STRIPE_SECRET=$(cat <<EOF
{
  "publishable_key": "$STRIPE_PUBLISHABLE_KEY",
  "secret_key": "$STRIPE_SECRET_KEY",
  "webhook_secret": "$STRIPE_WEBHOOK_SECRET"
}
EOF
    )
    
    create_secret "bayon-coagent/$ENVIRONMENT/stripe" "Stripe API credentials" "$STRIPE_SECRET"
fi

# External APIs
echo ""
print_info "=== External API Keys ==="
read -p "Do you want to configure external API keys? (y/n): " SETUP_APIS
if [ "$SETUP_APIS" = "y" ]; then
    read -p "Enter Bridge API Key (or press Enter to skip): " BRIDGE_API_KEY
    read -p "Enter News API Key (or press Enter to skip): " NEWS_API_KEY
    read -p "Enter Tavily API Key (or press Enter to skip): " TAVILY_API_KEY
    read -p "Enter Google AI API Key (or press Enter to skip): " GOOGLE_AI_API_KEY
    
    API_KEYS_SECRET=$(cat <<EOF
{
  "bridge_api_key": "${BRIDGE_API_KEY:-}",
  "news_api_key": "${NEWS_API_KEY:-}",
  "tavily_api_key": "${TAVILY_API_KEY:-}",
  "google_ai_api_key": "${GOOGLE_AI_API_KEY:-}"
}
EOF
    )
    
    create_secret "bayon-coagent/$ENVIRONMENT/api-keys" "External API keys" "$API_KEYS_SECRET"
fi

# MLS Providers
echo ""
print_info "=== MLS Provider Configuration ==="
read -p "Do you want to configure MLS providers? (y/n): " SETUP_MLS
if [ "$SETUP_MLS" = "y" ]; then
    echo ""
    print_info "FlexMLS Configuration"
    read -p "Enter FlexMLS Client ID (or press Enter to skip): " FLEXMLS_CLIENT_ID
    if [ -n "$FLEXMLS_CLIENT_ID" ]; then
        read -p "Enter FlexMLS Client Secret: " FLEXMLS_CLIENT_SECRET
        
        FLEXMLS_SECRET=$(cat <<EOF
{
  "client_id": "$FLEXMLS_CLIENT_ID",
  "client_secret": "$FLEXMLS_CLIENT_SECRET",
  "api_url": "https://api.flexmls.com/v1"
}
EOF
        )
        
        create_secret "bayon-coagent/$ENVIRONMENT/flexmls" "FlexMLS API credentials" "$FLEXMLS_SECRET"
    fi
fi

# Summary
echo ""
print_success "=== Secrets Setup Complete ==="
echo ""
echo "Secrets created in region: $AWS_REGION"
echo "Environment: $ENVIRONMENT"
echo ""
echo "To view secrets:"
echo "  aws secretsmanager list-secrets --region $AWS_REGION --query 'SecretList[?starts_with(Name, \`bayon-coagent/$ENVIRONMENT\`)].Name'"
echo ""
echo "To retrieve a secret:"
echo "  aws secretsmanager get-secret-value --secret-id bayon-coagent/$ENVIRONMENT/google-oauth --region $AWS_REGION"
echo ""
print_info "Next steps:"
echo "1. Verify IAM permissions for application to read secrets"
echo "2. Update application code to retrieve secrets from Secrets Manager"
echo "3. Test secrets retrieval in development/staging"
echo ""
print_success "Done!"
