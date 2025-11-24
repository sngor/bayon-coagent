#!/bin/bash

# Deploy API Gateway for Microservices Architecture
# This script deploys the enhanced API Gateway configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
REGION="us-east-1"
STACK_NAME=""
CUSTOM_DOMAIN=""
CERTIFICATE_ARN=""
HOSTED_ZONE_ID=""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENVIRONMENT    Environment (development|production) [default: development]"
    echo "  -r, --region REGION             AWS region [default: us-east-1]"
    echo "  -s, --stack-name STACK_NAME     CloudFormation stack name [default: bayon-coagent-ENVIRONMENT]"
    echo "  -d, --domain DOMAIN             Custom domain name (optional)"
    echo "  -c, --certificate-arn ARN       SSL certificate ARN (required if domain specified)"
    echo "  -z, --hosted-zone-id ID         Route53 hosted zone ID (optional)"
    echo "  -h, --help                      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --environment production --region us-west-2"
    echo "  $0 --environment production --domain api.example.com --certificate-arn arn:aws:acm:..."
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -s|--stack-name)
            STACK_NAME="$2"
            shift 2
            ;;
        -d|--domain)
            CUSTOM_DOMAIN="$2"
            shift 2
            ;;
        -c|--certificate-arn)
            CERTIFICATE_ARN="$2"
            shift 2
            ;;
        -z|--hosted-zone-id)
            HOSTED_ZONE_ID="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Environment must be 'development' or 'production'"
    exit 1
fi

# Set default stack name if not provided
if [[ -z "$STACK_NAME" ]]; then
    STACK_NAME="bayon-coagent-${ENVIRONMENT}"
fi

# Validate custom domain configuration
if [[ -n "$CUSTOM_DOMAIN" && -z "$CERTIFICATE_ARN" ]]; then
    print_error "Certificate ARN is required when custom domain is specified"
    exit 1
fi

print_status "Starting API Gateway deployment..."
print_status "Environment: $ENVIRONMENT"
print_status "Region: $REGION"
print_status "Stack Name: $STACK_NAME"

if [[ -n "$CUSTOM_DOMAIN" ]]; then
    print_status "Custom Domain: $CUSTOM_DOMAIN"
    print_status "Certificate ARN: $CERTIFICATE_ARN"
    if [[ -n "$HOSTED_ZONE_ID" ]]; then
        print_status "Hosted Zone ID: $HOSTED_ZONE_ID"
    fi
fi

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    print_error "SAM CLI is not installed. Please install it first."
    exit 1
fi

# Build the SAM application
print_status "Building SAM application..."
sam build --region "$REGION"

if [[ $? -ne 0 ]]; then
    print_error "SAM build failed"
    exit 1
fi

print_success "SAM build completed"

# Prepare deployment parameters
DEPLOY_PARAMS="Environment=$ENVIRONMENT"

if [[ -n "$CUSTOM_DOMAIN" ]]; then
    DEPLOY_PARAMS="$DEPLOY_PARAMS CustomDomainName=$CUSTOM_DOMAIN"
fi

if [[ -n "$CERTIFICATE_ARN" ]]; then
    DEPLOY_PARAMS="$DEPLOY_PARAMS CertificateArn=$CERTIFICATE_ARN"
fi

if [[ -n "$HOSTED_ZONE_ID" ]]; then
    DEPLOY_PARAMS="$DEPLOY_PARAMS HostedZoneId=$HOSTED_ZONE_ID"
fi

# Deploy the SAM application
print_status "Deploying SAM application..."
print_status "Parameters: $DEPLOY_PARAMS"

sam deploy \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides $DEPLOY_PARAMS \
    --no-fail-on-empty-changeset \
    --resolve-s3

if [[ $? -ne 0 ]]; then
    print_error "SAM deployment failed"
    exit 1
fi

print_success "SAM deployment completed"

# Get stack outputs
print_status "Retrieving stack outputs..."

OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs' \
    --output json)

if [[ $? -ne 0 ]]; then
    print_error "Failed to retrieve stack outputs"
    exit 1
fi

# Extract API Gateway URLs
MAIN_API_URL=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="MainRestApiUrl") | .OutputValue')
AI_API_URL=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="AiServiceApiUrl") | .OutputValue')
INTEGRATION_API_URL=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="IntegrationServiceApiUrl") | .OutputValue')
BACKGROUND_API_URL=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="BackgroundServiceApiUrl") | .OutputValue')
ADMIN_API_URL=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="AdminServiceApiUrl") | .OutputValue')

# Display deployment results
print_success "API Gateway deployment completed successfully!"
echo ""
echo "API Gateway Endpoints:"
echo "  Main API:        $MAIN_API_URL"
echo "  AI Service:      $AI_API_URL"
echo "  Integration:     $INTEGRATION_API_URL"
echo "  Background:      $BACKGROUND_API_URL"
echo "  Admin Service:   $ADMIN_API_URL"
echo ""

# Create environment file for local development
ENV_FILE=".env.api-gateway"
print_status "Creating environment file: $ENV_FILE"

cat > "$ENV_FILE" << EOF
# API Gateway Configuration
# Generated by deploy-api-gateway.sh on $(date)

MAIN_API_URL=$MAIN_API_URL
AI_SERVICE_API_URL=$AI_API_URL
INTEGRATION_SERVICE_API_URL=$INTEGRATION_API_URL
BACKGROUND_SERVICE_API_URL=$BACKGROUND_API_URL
ADMIN_SERVICE_API_URL=$ADMIN_API_URL

# API Gateway IDs (for direct AWS SDK usage)
MAIN_REST_API_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="MainRestApiId") | .OutputValue')
AI_SERVICE_API_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="AiServiceApiId") | .OutputValue')
INTEGRATION_SERVICE_API_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="IntegrationServiceApiId") | .OutputValue')
BACKGROUND_SERVICE_API_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="BackgroundServiceApiId") | .OutputValue')
ADMIN_SERVICE_API_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="AdminServiceApiId") | .OutputValue')

# AWS Configuration
AWS_REGION=$REGION
ENVIRONMENT=$ENVIRONMENT
EOF

print_success "Environment file created: $ENV_FILE"

# Test API Gateway endpoints
print_status "Testing API Gateway endpoints..."

test_endpoint() {
    local name=$1
    local url=$2
    
    if [[ "$url" != "null" && -n "$url" ]]; then
        print_status "Testing $name endpoint: $url"
        
        # Test with a simple health check or OPTIONS request
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$url" --max-time 10)
        
        if [[ "$HTTP_STATUS" -eq 200 || "$HTTP_STATUS" -eq 404 ]]; then
            print_success "$name endpoint is accessible (HTTP $HTTP_STATUS)"
        else
            print_warning "$name endpoint returned HTTP $HTTP_STATUS"
        fi
    else
        print_warning "$name endpoint URL not found in outputs"
    fi
}

test_endpoint "Main API" "$MAIN_API_URL"
test_endpoint "AI Service" "$AI_API_URL"
test_endpoint "Integration Service" "$INTEGRATION_API_URL"
test_endpoint "Background Service" "$BACKGROUND_API_URL"
test_endpoint "Admin Service" "$ADMIN_API_URL"

echo ""
print_success "API Gateway deployment and testing completed!"
print_status "Next steps:"
echo "  1. Update your application configuration to use the new API Gateway endpoints"
echo "  2. Deploy Lambda functions for each service boundary"
echo "  3. Configure API Gateway integrations with Lambda functions"
echo "  4. Set up monitoring and alerting for the API Gateway endpoints"
echo ""
print_status "Environment file created: $ENV_FILE"
print_status "You can source this file to set environment variables:"
echo "  source $ENV_FILE"