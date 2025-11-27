#!/bin/bash

# Verify EventBridge Content Workflow Infrastructure
# This script validates that all EventBridge rules, Lambda functions, DLQs, and alarms
# are properly configured for the content workflow features.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-development}"
REGION="${AWS_REGION:-us-east-1}"

echo "========================================="
echo "EventBridge Content Workflow Verification"
echo "========================================="
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo ""

# Function to check if a resource exists
check_resource() {
    local resource_type=$1
    local resource_name=$2
    local check_command=$3
    
    echo -n "Checking $resource_type: $resource_name... "
    
    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Found${NC}"
        return 0
    else
        echo -e "${RED}✗ Not Found${NC}"
        return 1
    fi
}

# Function to get Lambda function details
get_lambda_details() {
    local function_name=$1
    
    aws lambda get-function \
        --function-name "$function_name" \
        --region "$REGION" \
        --query 'Configuration.[FunctionName,Runtime,Timeout,MemorySize,LastModified]' \
        --output table 2>/dev/null || echo "Function not found"
}

# Function to get EventBridge rule details
get_rule_details() {
    local rule_name=$1
    
    aws events describe-rule \
        --name "$rule_name" \
        --region "$REGION" \
        --query '[Name,ScheduleExpression,State]' \
        --output table 2>/dev/null || echo "Rule not found"
}

# Function to check DLQ messages
check_dlq_messages() {
    local queue_name=$1
    
    local queue_url=$(aws sqs get-queue-url \
        --queue-name "$queue_name" \
        --region "$REGION" \
        --query 'QueueUrl' \
        --output text 2>/dev/null)
    
    if [ -n "$queue_url" ]; then
        local message_count=$(aws sqs get-queue-attributes \
            --queue-url "$queue_url" \
            --attribute-names ApproximateNumberOfMessages \
            --region "$REGION" \
            --query 'Attributes.ApproximateNumberOfMessages' \
            --output text 2>/dev/null)
        
        if [ "$message_count" -gt 0 ]; then
            echo -e "${YELLOW}⚠ $message_count messages in DLQ${NC}"
        else
            echo -e "${GREEN}✓ No messages in DLQ${NC}"
        fi
    else
        echo -e "${RED}✗ Queue not found${NC}"
    fi
}

# Function to check CloudWatch alarm state
check_alarm_state() {
    local alarm_name=$1
    
    local state=$(aws cloudwatch describe-alarms \
        --alarm-names "$alarm_name" \
        --region "$REGION" \
        --query 'MetricAlarms[0].StateValue' \
        --output text 2>/dev/null)
    
    if [ "$state" = "OK" ]; then
        echo -e "${GREEN}✓ OK${NC}"
    elif [ "$state" = "ALARM" ]; then
        echo -e "${RED}✗ ALARM${NC}"
    elif [ "$state" = "INSUFFICIENT_DATA" ]; then
        echo -e "${YELLOW}⚠ INSUFFICIENT_DATA${NC}"
    else
        echo -e "${RED}✗ Not Found${NC}"
    fi
}

echo "========================================="
echo "1. Lambda Functions"
echo "========================================="
echo ""

# Check PublishScheduledContent Lambda
PUBLISH_FUNCTION="bayon-coagent-publish-scheduled-content-${ENVIRONMENT}"
check_resource "Lambda Function" "$PUBLISH_FUNCTION" \
    "aws lambda get-function --function-name $PUBLISH_FUNCTION --region $REGION"

if [ $? -eq 0 ]; then
    echo ""
    get_lambda_details "$PUBLISH_FUNCTION"
    echo ""
fi

# Check SyncSocialAnalytics Lambda
SYNC_FUNCTION="bayon-coagent-sync-social-analytics-${ENVIRONMENT}"
check_resource "Lambda Function" "$SYNC_FUNCTION" \
    "aws lambda get-function --function-name $SYNC_FUNCTION --region $REGION"

if [ $? -eq 0 ]; then
    echo ""
    get_lambda_details "$SYNC_FUNCTION"
    echo ""
fi

# Check CalculateOptimalTimes Lambda
CALCULATE_FUNCTION="bayon-coagent-calculate-optimal-times-${ENVIRONMENT}"
check_resource "Lambda Function" "$CALCULATE_FUNCTION" \
    "aws lambda get-function --function-name $CALCULATE_FUNCTION --region $REGION"

if [ $? -eq 0 ]; then
    echo ""
    get_lambda_details "$CALCULATE_FUNCTION"
    echo ""
fi

echo "========================================="
echo "2. EventBridge Rules"
echo "========================================="
echo ""

# List all EventBridge rules for the functions
echo "Listing EventBridge rules..."
aws events list-rules \
    --region "$REGION" \
    --query "Rules[?contains(Name, 'bayon-coagent') && contains(Name, '${ENVIRONMENT}')].[Name,State,ScheduleExpression]" \
    --output table

echo ""

echo "========================================="
echo "3. Dead Letter Queues"
echo "========================================="
echo ""

# Check PublishScheduledContent DLQ
PUBLISH_DLQ="bayon-coagent-publish-scheduled-content-dlq-${ENVIRONMENT}"
echo -n "Checking DLQ: $PUBLISH_DLQ... "
check_dlq_messages "$PUBLISH_DLQ"

# Check SyncSocialAnalytics DLQ
SYNC_DLQ="bayon-coagent-sync-social-analytics-dlq-${ENVIRONMENT}"
echo -n "Checking DLQ: $SYNC_DLQ... "
check_dlq_messages "$SYNC_DLQ"

# Check CalculateOptimalTimes DLQ
CALCULATE_DLQ="bayon-coagent-calculate-optimal-times-dlq-${ENVIRONMENT}"
echo -n "Checking DLQ: $CALCULATE_DLQ... "
check_dlq_messages "$CALCULATE_DLQ"

echo ""

echo "========================================="
echo "4. CloudWatch Alarms"
echo "========================================="
echo ""

# Check Lambda Error Alarms
echo -n "PublishScheduledContent Error Alarm: "
check_alarm_state "${ENVIRONMENT}-publish-scheduled-content-errors"

echo -n "SyncSocialAnalytics Error Alarm: "
check_alarm_state "${ENVIRONMENT}-sync-social-analytics-errors"

echo -n "CalculateOptimalTimes Error Alarm: "
check_alarm_state "${ENVIRONMENT}-calculate-optimal-times-errors"

echo ""

# Check Lambda Duration Alarms
echo -n "PublishScheduledContent Duration Alarm: "
check_alarm_state "${ENVIRONMENT}-publish-scheduled-content-duration"

echo -n "SyncSocialAnalytics Duration Alarm: "
check_alarm_state "${ENVIRONMENT}-sync-social-analytics-duration"

echo -n "CalculateOptimalTimes Duration Alarm: "
check_alarm_state "${ENVIRONMENT}-calculate-optimal-times-duration"

echo ""

# Check Lambda Throttle Alarms
echo -n "PublishScheduledContent Throttle Alarm: "
check_alarm_state "${ENVIRONMENT}-publish-scheduled-content-throttles"

echo -n "SyncSocialAnalytics Throttle Alarm: "
check_alarm_state "${ENVIRONMENT}-sync-social-analytics-throttles"

echo -n "CalculateOptimalTimes Throttle Alarm: "
check_alarm_state "${ENVIRONMENT}-calculate-optimal-times-throttles"

echo ""

# Check DLQ Alarms
echo -n "PublishScheduledContent DLQ Alarm: "
check_alarm_state "${ENVIRONMENT}-publish-scheduled-content-dlq-messages"

echo -n "SyncSocialAnalytics DLQ Alarm: "
check_alarm_state "${ENVIRONMENT}-sync-social-analytics-dlq-messages"

echo -n "CalculateOptimalTimes DLQ Alarm: "
check_alarm_state "${ENVIRONMENT}-calculate-optimal-times-dlq-messages"

echo ""

# Check Business Metrics Alarms
echo -n "Content Workflow Publishing Failure Alarm: "
check_alarm_state "${ENVIRONMENT}-content-workflow-publishing-failures"

echo -n "Content Workflow Analytics Sync Failure Alarm: "
check_alarm_state "${ENVIRONMENT}-content-workflow-analytics-sync-failures"

echo ""

echo "========================================="
echo "5. IAM Role"
echo "========================================="
echo ""

# Check ContentWorkflowLambdaRole
ROLE_NAME="bayon-coagent-content-workflow-lambda-${ENVIRONMENT}"
check_resource "IAM Role" "$ROLE_NAME" \
    "aws iam get-role --role-name $ROLE_NAME"

if [ $? -eq 0 ]; then
    echo ""
    echo "Role Policies:"
    aws iam list-role-policies \
        --role-name "$ROLE_NAME" \
        --query 'PolicyNames' \
        --output table
    echo ""
fi

echo "========================================="
echo "6. Recent Lambda Invocations"
echo "========================================="
echo ""

# Get recent invocations for each function
echo "PublishScheduledContent - Last 24 hours:"
aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Invocations \
    --dimensions Name=FunctionName,Value="$PUBLISH_FUNCTION" \
    --start-time "$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S)" \
    --end-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
    --period 3600 \
    --statistics Sum \
    --region "$REGION" \
    --query 'Datapoints[*].[Timestamp,Sum]' \
    --output table 2>/dev/null || echo "No data available"

echo ""

echo "SyncSocialAnalytics - Last 7 days:"
aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Invocations \
    --dimensions Name=FunctionName,Value="$SYNC_FUNCTION" \
    --start-time "$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S)" \
    --end-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
    --period 86400 \
    --statistics Sum \
    --region "$REGION" \
    --query 'Datapoints[*].[Timestamp,Sum]' \
    --output table 2>/dev/null || echo "No data available"

echo ""

echo "CalculateOptimalTimes - Last 30 days:"
aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Invocations \
    --dimensions Name=FunctionName,Value="$CALCULATE_FUNCTION" \
    --start-time "$(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%S)" \
    --end-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
    --period 604800 \
    --statistics Sum \
    --region "$REGION" \
    --query 'Datapoints[*].[Timestamp,Sum]' \
    --output table 2>/dev/null || echo "No data available"

echo ""

echo "========================================="
echo "7. Test Lambda Functions (Dry Run)"
echo "========================================="
echo ""

echo "Testing PublishScheduledContent Lambda (dry run)..."
aws lambda invoke \
    --function-name "$PUBLISH_FUNCTION" \
    --payload '{"source":"aws.events","detail-type":"Scheduled Event","detail":{"maxItems":10,"dryRun":true}}' \
    --region "$REGION" \
    /tmp/publish-response.json > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ PublishScheduledContent test successful${NC}"
    cat /tmp/publish-response.json | jq '.' 2>/dev/null || cat /tmp/publish-response.json
else
    echo -e "${RED}✗ PublishScheduledContent test failed${NC}"
fi

echo ""

echo "Testing SyncSocialAnalytics Lambda (dry run)..."
aws lambda invoke \
    --function-name "$SYNC_FUNCTION" \
    --payload '{"source":"aws.events","detail-type":"Scheduled Event","detail":{"maxUsers":5,"dryRun":true}}' \
    --region "$REGION" \
    /tmp/sync-response.json > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SyncSocialAnalytics test successful${NC}"
    cat /tmp/sync-response.json | jq '.' 2>/dev/null || cat /tmp/sync-response.json
else
    echo -e "${RED}✗ SyncSocialAnalytics test failed${NC}"
fi

echo ""

echo "Testing CalculateOptimalTimes Lambda (dry run)..."
aws lambda invoke \
    --function-name "$CALCULATE_FUNCTION" \
    --payload '{"source":"aws.events","detail-type":"Scheduled Event","detail":{"maxUsers":5,"dryRun":true}}' \
    --region "$REGION" \
    /tmp/calculate-response.json > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ CalculateOptimalTimes test successful${NC}"
    cat /tmp/calculate-response.json | jq '.' 2>/dev/null || cat /tmp/calculate-response.json
else
    echo -e "${RED}✗ CalculateOptimalTimes test failed${NC}"
fi

echo ""

echo "========================================="
echo "Verification Complete"
echo "========================================="
echo ""
echo "Summary:"
echo "- Lambda Functions: 3"
echo "- EventBridge Rules: 3"
echo "- Dead Letter Queues: 3"
echo "- CloudWatch Alarms: 14"
echo "- IAM Roles: 1"
echo ""
echo "For detailed logs, run:"
echo "  aws logs tail /aws/lambda/$PUBLISH_FUNCTION --follow"
echo "  aws logs tail /aws/lambda/$SYNC_FUNCTION --follow"
echo "  aws logs tail /aws/lambda/$CALCULATE_FUNCTION --follow"
echo ""
