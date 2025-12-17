#!/bin/bash

# Deploy Event-Driven Architecture Enhancements
# This script deploys the event-driven improvements to AWS

set -e

ENVIRONMENT=${1:-development}
REGION=${AWS_REGION:-us-east-1}

echo "🚀 Deploying Event-Driven Architecture Enhancements"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v sam &> /dev/null; then
    print_error "SAM CLI is not installed. Please install it first."
    exit 1
fi

if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Validate AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Please run 'aws configure'."
    exit 1
fi

print_success "Prerequisites check passed"

# Validate SAM template
print_status "Validating SAM template..."
if sam validate --template template.yaml; then
    print_success "SAM template validation passed"
else
    print_error "SAM template validation failed"
    exit 1
fi

# Build the application
print_status "Building SAM application..."
if sam build --template template.yaml; then
    print_success "SAM build completed"
else
    print_error "SAM build failed"
    exit 1
fi

# Deploy the application
print_status "Deploying to AWS..."

STACK_NAME="bayon-coagent-${ENVIRONMENT}"

# Deploy with guided mode for first time, or use existing parameters
if sam list stack-outputs --stack-name "$STACK_NAME" --region "$REGION" &> /dev/null; then
    print_status "Stack exists, updating..."
    sam deploy \
        --template-file .aws-sam/build/template.yaml \
        --stack-name "$STACK_NAME" \
        --parameter-overrides Environment="$ENVIRONMENT" \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --region "$REGION" \
        --no-confirm-changeset \
        --no-fail-on-empty-changeset
else
    print_status "First deployment, using guided mode..."
    sam deploy \
        --template-file .aws-sam/build/template.yaml \
        --stack-name "$STACK_NAME" \
        --parameter-overrides Environment="$ENVIRONMENT" \
        --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
        --region "$REGION" \
        --guided
fi

if [ $? -eq 0 ]; then
    print_success "Deployment completed successfully"
else
    print_error "Deployment failed"
    exit 1
fi

# Get stack outputs
print_status "Retrieving stack outputs..."
OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs' \
    --output json)

if [ $? -eq 0 ]; then
    echo "$OUTPUTS" | jq -r '.[] | "\(.OutputKey): \(.OutputValue)"'
    print_success "Stack outputs retrieved"
else
    print_warning "Could not retrieve stack outputs"
fi

# Test the event-driven architecture
print_status "Testing event-driven architecture..."

# Set environment variables for testing
export EVENT_BUS_NAME=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="ApplicationEventBusName") | .OutputValue')
export DYNAMODB_TABLE_NAME=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="DynamoDBTableName") | .OutputValue')
export WEBSOCKET_API_ENDPOINT=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="WebSocketApiEndpoint") | .OutputValue')

if [ "$EVENT_BUS_NAME" != "null" ] && [ "$DYNAMODB_TABLE_NAME" != "null" ]; then
    print_status "Running event-driven architecture test..."
    
    if npm run test:event-driven 2>/dev/null || tsx scripts/test-event-driven-architecture.ts; then
        print_success "Event-driven architecture test passed"
    else
        print_warning "Event-driven architecture test failed or not available"
        print_status "You can manually test using: tsx scripts/test-event-driven-architecture.ts"
    fi
else
    print_warning "Could not extract required outputs for testing"
fi

# Display deployment summary
echo ""
echo "📋 Deployment Summary"
echo "===================="
echo "Stack Name: $STACK_NAME"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo ""

if [ "$EVENT_BUS_NAME" != "null" ]; then
    echo "Event Bus: $EVENT_BUS_NAME"
fi

if [ "$DYNAMODB_TABLE_NAME" != "null" ]; then
    echo "DynamoDB Table: $DYNAMODB_TABLE_NAME"
fi

if [ "$WEBSOCKET_API_ENDPOINT" != "null" ]; then
    echo "WebSocket API: $WEBSOCKET_API_ENDPOINT"
fi

echo ""
echo "🎯 Event Processors Deployed:"
echo "• Content Event Processor"
echo "• Brand Intelligence Processor"
echo "• Research Event Processor"
echo "• Market Intelligence Processor"
echo "• User Event Processor"
echo "• Real-time Notification Processor"
echo ""

echo "📊 EventBridge Rules Configured:"
echo "• Content Generation Events"
echo "• Brand Intelligence Events"
echo "• Research Events"
echo "• Market Intelligence Events"
echo "• User Events"
echo "• Real-time Notifications"
echo ""

echo "🔗 WebSocket API for Real-time Communications:"
echo "• Connection/Disconnection handling"
echo "• Real-time notification delivery"
echo "• Progress updates for long-running jobs"
echo ""

print_success "Event-driven architecture deployment completed!"

echo ""
echo "🚀 Next Steps:"
echo "1. Test content generation with real-time notifications"
echo "2. Verify EventBridge rules are triggering correctly"
echo "3. Check CloudWatch Logs for event processor execution"
echo "4. Test WebSocket connections for real-time updates"
echo "5. Monitor EventBridge metrics and DLQ for failed events"
echo ""

echo "📚 Useful Commands:"
echo "• View logs: sam logs --stack-name $STACK_NAME --tail"
echo "• Test events: tsx scripts/test-event-driven-architecture.ts"
echo "• Monitor metrics: aws cloudwatch get-metric-statistics --namespace AWS/Events"
echo "• Check DLQ: aws sqs get-queue-attributes --queue-url <DLQ_URL>"