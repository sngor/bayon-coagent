#!/bin/bash

# AWS Services Configuration Script for Subscription System
# This script configures AWS SES, EventBridge, and CloudWatch for the subscription system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
DOMAIN="bayoncoagent.app"
AWS_REGION="us-west-2"
APP_URL="https://bayoncoagent.app"

echo -e "${BLUE}🚀 Configuring AWS Services for Subscription System${NC}"
echo "=================================================="

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Function to check if command succeeded
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

echo -e "\n${YELLOW}📧 Configuring AWS SES (Simple Email Service)${NC}"
echo "=============================================="

# Verify domain identity in SES
echo "Verifying domain identity: $DOMAIN"
aws ses verify-domain-identity --domain "$DOMAIN" --region "$AWS_REGION" > /dev/null 2>&1
check_result "Domain identity verification initiated"

# Verify email address for testing
echo "Verifying noreply email address"
aws ses verify-email-identity --email-address "noreply@$DOMAIN" --region "$AWS_REGION" > /dev/null 2>&1
check_result "Email identity verification initiated"

# Create sending authorization policy
echo "Creating SES sending policy"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
SES_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": "arn:aws:iam::'$ACCOUNT_ID':root"},
      "Action": ["ses:SendEmail", "ses:SendRawEmail"],
      "Resource": "*"
    }
  ]
}'

aws ses put-identity-policy \
    --identity "$DOMAIN" \
    --policy-name "SubscriptionEmailPolicy" \
    --policy "$SES_POLICY" \
    --region "$AWS_REGION" > /dev/null 2>&1
check_result "SES sending policy created"

echo -e "\n${YELLOW}🔄 Configuring AWS EventBridge${NC}"
echo "================================="

# Create EventBridge rule for Stripe events
echo "Creating EventBridge rule for Stripe subscription events"
EVENT_PATTERN='{
  "source": ["stripe"],
  "detail-type": ["Stripe Event"],
  "detail": {
    "type": [
      "customer.subscription.created",
      "customer.subscription.updated", 
      "customer.subscription.deleted",
      "invoice.payment_succeeded",
      "invoice.payment_failed",
      "customer.subscription.trial_will_end"
    ]
  }
}'

aws events put-rule \
    --name "stripe-subscription-events" \
    --event-pattern "$EVENT_PATTERN" \
    --description "Stripe subscription events for Bayon CoAgent" \
    --region "$AWS_REGION" > /dev/null 2>&1
check_result "EventBridge rule created"

# Add HTTP target for the rule
echo "Adding API endpoint as EventBridge target"
aws events put-targets \
    --rule "stripe-subscription-events" \
    --targets "Id=1,Arn=$APP_URL/api/stripe/eventbridge,HttpParameters={}" \
    --region "$AWS_REGION" > /dev/null 2>&1
check_result "EventBridge target configured"

# Create scheduled rule for trial notifications
echo "Creating scheduled rule for trial notifications"
aws events put-rule \
    --name "daily-trial-notifications" \
    --schedule-expression "cron(0 12 * * ? *)" \
    --description "Daily trial expiry notifications at 12 PM UTC" \
    --region "$AWS_REGION" > /dev/null 2>&1
check_result "Scheduled rule created"

echo -e "\n${YELLOW}📊 Configuring CloudWatch Monitoring${NC}"
echo "===================================="

# Create CloudWatch log group for subscription API
echo "Creating CloudWatch log group"
aws logs create-log-group \
    --log-group-name "/aws/lambda/subscription-api" \
    --region "$AWS_REGION" > /dev/null 2>&1 || true
check_result "CloudWatch log group created"

# Create CloudWatch alarm for API errors
echo "Creating CloudWatch alarm for API errors"
aws cloudwatch put-metric-alarm \
    --alarm-name "subscription-api-errors" \
    --alarm-description "Alert when subscription API has errors" \
    --metric-name "5XXError" \
    --namespace "AWS/ApiGateway" \
    --statistic "Sum" \
    --period 300 \
    --threshold 5 \
    --comparison-operator "GreaterThanThreshold" \
    --evaluation-periods 2 \
    --region "$AWS_REGION" > /dev/null 2>&1
check_result "CloudWatch alarm created"

echo -e "\n${YELLOW}🔐 Setting up IAM Permissions${NC}"
echo "============================="

# Create IAM policy for subscription service
echo "Creating IAM policy for subscription service"
SUBSCRIPTION_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:'$AWS_REGION':'$ACCOUNT_ID':table/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "events:PutEvents"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:'$AWS_REGION':'$ACCOUNT_ID':*"
    }
  ]
}'

aws iam create-policy \
    --policy-name "BayonCoAgentSubscriptionPolicy" \
    --policy-document "$SUBSCRIPTION_POLICY" \
    --description "Policy for Bayon CoAgent subscription service" > /dev/null 2>&1 || true
check_result "IAM policy created"

echo -e "\n${GREEN}🎉 AWS Services Configuration Complete!${NC}"
echo "======================================"

echo -e "\n${BLUE}📋 Next Steps:${NC}"
echo "1. Verify domain ownership in AWS SES console"
echo "2. Move SES out of sandbox mode for production email sending"
echo "3. Configure Stripe webhook to send events to EventBridge"
echo "4. Set environment variables in your deployment platform"
echo "5. Test the API endpoints using the test scripts"

echo -e "\n${BLUE}🔍 Verification Commands:${NC}"
echo "aws ses get-identity-verification-attributes --identities $DOMAIN --region $AWS_REGION"
echo "aws events list-rules --region $AWS_REGION"
echo "aws logs describe-log-groups --region $AWS_REGION"

echo -e "\n${YELLOW}⚠️  Important Notes:${NC}"
echo "- SES domain verification may take up to 72 hours"
echo "- Check your DNS settings for SES verification records"
echo "- EventBridge targets may need additional permissions for HTTPS endpoints"
echo "- Test email sending in SES sandbox mode first"

echo -e "\n${GREEN}✅ Configuration script completed successfully!${NC}"