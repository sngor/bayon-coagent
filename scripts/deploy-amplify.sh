#!/bin/bash

# AWS Amplify Deployment Setup Script
# This script helps set up AWS Amplify Hosting for the Bayon CoAgent application

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_info "Checking prerequisites..."

if ! command_exists aws; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

if ! command_exists jq; then
    print_warning "jq is not installed. Some features may not work. Install with: brew install jq"
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
read -p "Enter AWS region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

# Get repository information
echo ""
print_info "Repository Configuration"
read -p "Enter Git repository URL (e.g., https://github.com/user/repo): " REPO_URL
read -p "Enter branch name (default: main): " BRANCH_NAME
BRANCH_NAME=${BRANCH_NAME:-main}

# Get infrastructure outputs
echo ""
print_info "Fetching infrastructure outputs..."

if [ ! -f "infrastructure/.env.$ENVIRONMENT" ]; then
    print_warning "Infrastructure environment file not found. Generating..."
    cd infrastructure
    ./scripts/update-env.sh $ENVIRONMENT
    cd ..
fi

# Source the environment file
source "infrastructure/.env.$ENVIRONMENT"

print_success "Infrastructure outputs loaded"

# Create Amplify app
echo ""
print_info "Creating Amplify app..."

APP_NAME="bayon-coagent-${ENVIRONMENT}"

# Check if app already exists
EXISTING_APP=$(aws amplify list-apps --region $AWS_REGION --query "apps[?name=='$APP_NAME'].appId" --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_APP" ]; then
    print_warning "Amplify app '$APP_NAME' already exists (ID: $EXISTING_APP)"
    read -p "Do you want to update it? (y/n): " UPDATE_APP
    if [ "$UPDATE_APP" != "y" ]; then
        print_info "Skipping app creation"
        APP_ID=$EXISTING_APP
    else
        APP_ID=$EXISTING_APP
        print_info "Will update existing app"
    fi
else
    # Create new app
    print_info "Creating new Amplify app..."
    
    CREATE_OUTPUT=$(aws amplify create-app \
        --name "$APP_NAME" \
        --description "Bayon CoAgent - Real Estate AI Platform ($ENVIRONMENT)" \
        --repository "$REPO_URL" \
        --platform WEB \
        --region $AWS_REGION \
        --output json)
    
    APP_ID=$(echo $CREATE_OUTPUT | jq -r '.app.appId')
    print_success "Amplify app created: $APP_ID"
fi

# Create IAM service role for Amplify
echo ""
print_info "Setting up IAM service role..."

ROLE_NAME="AmplifyBayonCoAgent-${ENVIRONMENT}"

# Check if role exists
if aws iam get-role --role-name $ROLE_NAME >/dev/null 2>&1; then
    print_warning "IAM role '$ROLE_NAME' already exists"
else
    print_info "Creating IAM role..."
    
    # Create trust policy
    cat > /tmp/amplify-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "amplify.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document file:///tmp/amplify-trust-policy.json \
        --description "Service role for Amplify Hosting - Bayon CoAgent $ENVIRONMENT"
    
    # Attach managed policies
    aws iam attach-role-policy \
        --role-name $ROLE_NAME \
        --policy-arn arn:aws:iam::aws:policy/AdministratorAccess-Amplify
    
    # Attach custom application policy (created by CDK)
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    APP_POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/BayonCoAgent-ApplicationPolicy-${ENVIRONMENT}"
    
    if aws iam get-policy --policy-arn $APP_POLICY_ARN >/dev/null 2>&1; then
        aws iam attach-role-policy \
            --role-name $ROLE_NAME \
            --policy-arn $APP_POLICY_ARN
        print_success "Attached application policy"
    else
        print_warning "Application policy not found. Make sure infrastructure is deployed."
    fi
    
    rm /tmp/amplify-trust-policy.json
    print_success "IAM role created: $ROLE_NAME"
fi

# Update app with service role
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)

aws amplify update-app \
    --app-id $APP_ID \
    --iam-service-role-arn $ROLE_ARN \
    --region $AWS_REGION \
    >/dev/null

print_success "Service role attached to Amplify app"

# Create branch
echo ""
print_info "Setting up branch: $BRANCH_NAME"

# Check if branch exists
EXISTING_BRANCH=$(aws amplify list-branches --app-id $APP_ID --region $AWS_REGION --query "branches[?branchName=='$BRANCH_NAME'].branchName" --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_BRANCH" ]; then
    print_warning "Branch '$BRANCH_NAME' already exists"
else
    print_info "Creating branch..."
    
    aws amplify create-branch \
        --app-id $APP_ID \
        --branch-name $BRANCH_NAME \
        --enable-auto-build \
        --region $AWS_REGION \
        >/dev/null
    
    print_success "Branch created: $BRANCH_NAME"
fi

# Set environment variables
echo ""
print_info "Configuring environment variables..."

# Prepare environment variables JSON
cat > /tmp/amplify-env-vars.json <<EOF
{
  "NODE_ENV": "$ENVIRONMENT",
  "AWS_REGION": "$AWS_REGION",
  "COGNITO_USER_POOL_ID": "$COGNITO_USER_POOL_ID",
  "COGNITO_CLIENT_ID": "$COGNITO_CLIENT_ID",
  "DYNAMODB_TABLE_NAME": "$DYNAMODB_TABLE_NAME",
  "S3_BUCKET_NAME": "$S3_BUCKET_NAME",
  "BEDROCK_MODEL_ID": "anthropic.claude-3-5-sonnet-20241022-v2:0",
  "BEDROCK_REGION": "$AWS_REGION"
}
EOF

# Update environment variables
aws amplify update-app \
    --app-id $APP_ID \
    --environment-variables file:///tmp/amplify-env-vars.json \
    --region $AWS_REGION \
    >/dev/null

rm /tmp/amplify-env-vars.json

print_success "Environment variables configured"

print_warning "Note: You still need to manually add sensitive variables in Amplify Console:"
echo "  - GOOGLE_CLIENT_ID"
echo "  - GOOGLE_CLIENT_SECRET"
echo "  - GOOGLE_REDIRECT_URI"
echo "  - BRIDGE_API_KEY"
echo "  - NEWS_API_KEY"

# Start deployment
echo ""
read -p "Do you want to start a deployment now? (y/n): " START_DEPLOY

if [ "$START_DEPLOY" = "y" ]; then
    print_info "Starting deployment..."
    
    JOB_OUTPUT=$(aws amplify start-job \
        --app-id $APP_ID \
        --branch-name $BRANCH_NAME \
        --job-type RELEASE \
        --region $AWS_REGION \
        --output json)
    
    JOB_ID=$(echo $JOB_OUTPUT | jq -r '.jobSummary.jobId')
    
    print_success "Deployment started: Job ID $JOB_ID"
    print_info "Monitor deployment at: https://console.aws.amazon.com/amplify/home?region=$AWS_REGION#/$APP_ID/$BRANCH_NAME/$JOB_ID"
else
    print_info "Skipping deployment. You can deploy later from the Amplify Console."
fi

# Summary
echo ""
print_success "=== Amplify Setup Complete ==="
echo ""
echo "App ID: $APP_ID"
echo "App Name: $APP_NAME"
echo "Branch: $BRANCH_NAME"
echo "Region: $AWS_REGION"
echo ""
echo "Next steps:"
echo "1. Add sensitive environment variables in Amplify Console"
echo "2. Configure custom domain (optional)"
echo "3. Set up branch protection and deployment settings"
echo "4. Monitor the deployment in Amplify Console"
echo ""
echo "Amplify Console: https://console.aws.amazon.com/amplify/home?region=$AWS_REGION#/$APP_ID"
echo ""
print_success "Done!"
