#!/bin/bash

# Bayon CoAgent - Split Infrastructure Deployment Script
# This script deploys the infrastructure using the new split template structure

set -e

# Configuration
ENVIRONMENT=${1:-development}
REGION=${AWS_DEFAULT_REGION:-us-east-1}
STACK_PREFIX="bayon-coagent"
TEMPLATE_BUCKET_PREFIX="bayon-coagent-templates"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|production)$ ]]; then
    log_error "Invalid environment. Must be 'development' or 'production'"
    exit 1
fi

log_info "Deploying Bayon CoAgent infrastructure for environment: $ENVIRONMENT"

# Create S3 bucket for templates if it doesn't exist
TEMPLATE_BUCKET="${TEMPLATE_BUCKET_PREFIX}-${ENVIRONMENT}-$(aws sts get-caller-identity --query Account --output text)"

log_info "Checking if template bucket exists: $TEMPLATE_BUCKET"
if ! aws s3 ls "s3://$TEMPLATE_BUCKET" 2>/dev/null; then
    log_info "Creating template bucket: $TEMPLATE_BUCKET"
    aws s3 mb "s3://$TEMPLATE_BUCKET" --region "$REGION"
    
    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket "$TEMPLATE_BUCKET" \
        --versioning-configuration Status=Enabled
    
    log_success "Template bucket created successfully"
else
    log_info "Template bucket already exists"
fi

# Upload templates to S3
log_info "Uploading CloudFormation templates to S3..."

TEMPLATES_DIR="infrastructure/cloudformation"
TEMPLATE_FILES=(
    "core-infrastructure.yaml"
    "main-template.yaml"
)

for template in "${TEMPLATE_FILES[@]}"; do
    if [[ -f "$TEMPLATES_DIR/$template" ]]; then
        log_info "Uploading $template..."
        aws s3 cp "$TEMPLATES_DIR/$template" "s3://$TEMPLATE_BUCKET/$template" \
            --metadata "environment=$ENVIRONMENT,timestamp=$(date -u +%Y%m%d%H%M%S)"
        log_success "Uploaded $template"
    else
        log_warning "Template file not found: $TEMPLATES_DIR/$template"
    fi
done

# Deploy the main stack
MAIN_STACK_NAME="${STACK_PREFIX}-main-${ENVIRONMENT}"

log_info "Deploying main infrastructure stack: $MAIN_STACK_NAME"

# Check if stack exists
if aws cloudformation describe-stacks --stack-name "$MAIN_STACK_NAME" --region "$REGION" >/dev/null 2>&1; then
    log_info "Stack exists, updating..."
    OPERATION="update-stack"
else
    log_info "Stack does not exist, creating..."
    OPERATION="create-stack"
fi

# Prepare parameters
PARAMETERS=""
if [[ -n "${ALARM_EMAIL:-}" ]]; then
    PARAMETERS="$PARAMETERS ParameterKey=AlarmEmail,ParameterValue=$ALARM_EMAIL"
fi

if [[ -n "${SES_FROM_EMAIL:-}" ]]; then
    PARAMETERS="$PARAMETERS ParameterKey=SESFromEmail,ParameterValue=$SES_FROM_EMAIL"
fi

# Deploy stack
aws cloudformation $OPERATION \
    --stack-name "$MAIN_STACK_NAME" \
    --template-url "https://$TEMPLATE_BUCKET.s3.$REGION.amazonaws.com/main-template.yaml" \
    --parameters \
        ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
        $PARAMETERS \
    --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
    --tags \
        Key=Environment,Value="$ENVIRONMENT" \
        Key=Application,Value=BayonCoAgent \
        Key=ManagedBy,Value=CloudFormation \
        Key=DeployedBy,Value="$(whoami)" \
        Key=DeployedAt,Value="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    --region "$REGION"

# Wait for stack operation to complete
log_info "Waiting for stack operation to complete..."
if [[ "$OPERATION" == "create-stack" ]]; then
    aws cloudformation wait stack-create-complete --stack-name "$MAIN_STACK_NAME" --region "$REGION"
else
    aws cloudformation wait stack-update-complete --stack-name "$MAIN_STACK_NAME" --region "$REGION"
fi

# Check deployment status
STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$MAIN_STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].StackStatus' \
    --output text)

if [[ "$STACK_STATUS" == *"COMPLETE"* ]]; then
    log_success "Infrastructure deployment completed successfully!"
    
    # Display key outputs
    log_info "Retrieving stack outputs..."
    aws cloudformation describe-stacks \
        --stack-name "$MAIN_STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId` || OutputKey==`DynamoDBTableName` || OutputKey==`StorageBucketName`].[OutputKey,OutputValue]' \
        --output table
else
    log_error "Infrastructure deployment failed with status: $STACK_STATUS"
    
    # Show stack events for debugging
    log_info "Recent stack events:"
    aws cloudformation describe-stack-events \
        --stack-name "$MAIN_STACK_NAME" \
        --region "$REGION" \
        --max-items 10 \
        --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED`].[Timestamp,ResourceType,LogicalResourceId,ResourceStatusReason]' \
        --output table
    
    exit 1
fi

# Cleanup old template versions (keep last 5)
log_info "Cleaning up old template versions..."
for template in "${TEMPLATE_FILES[@]}"; do
    aws s3api list-object-versions \
        --bucket "$TEMPLATE_BUCKET" \
        --prefix "$template" \
        --query 'Versions[5:].[Key,VersionId]' \
        --output text | \
    while read key version_id; do
        if [[ -n "$version_id" && "$version_id" != "null" ]]; then
            aws s3api delete-object --bucket "$TEMPLATE_BUCKET" --key "$key" --version-id "$version_id"
        fi
    done
done

log_success "Deployment completed successfully!"
log_info "Stack Name: $MAIN_STACK_NAME"
log_info "Region: $REGION"
log_info "Environment: $ENVIRONMENT"

# Display next steps
echo ""
log_info "Next steps:"
echo "1. Verify the deployment in the AWS Console"
echo "2. Update your application configuration with the new resource identifiers"
echo "3. Test the application functionality"
echo "4. Monitor CloudWatch logs and metrics"