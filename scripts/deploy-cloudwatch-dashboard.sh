#!/bin/bash

# Deploy CloudWatch Dashboard for Bayon CoAgent
# This script creates a CloudWatch dashboard to monitor content generation performance

set -e

DASHBOARD_NAME="BayonCoAgent-ContentGeneration"
REGION="us-west-2"

echo "🚀 Deploying CloudWatch Dashboard: $DASHBOARD_NAME"
echo "📍 Region: $REGION"
echo ""

# Check if dashboard exists
if aws cloudwatch get-dashboard --dashboard-name "$DASHBOARD_NAME" --region "$REGION" &>/dev/null; then
    echo "📊 Dashboard already exists, updating..."
    ACTION="update"
else
    echo "📊 Creating new dashboard..."
    ACTION="create"
fi

# Deploy dashboard
aws cloudwatch put-dashboard \
    --dashboard-name "$DASHBOARD_NAME" \
    --dashboard-body file://cloudwatch-dashboard.json \
    --region "$REGION"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dashboard deployed successfully!"
    echo ""
    echo "🔗 View dashboard:"
    echo "https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=$DASHBOARD_NAME"
    echo ""
    echo "📊 Dashboard includes:"
    echo "  • Bedrock API invocations"
    echo "  • Response time (avg & p99)"
    echo "  • Error rates"
    echo "  • Token usage"
    echo "  • DynamoDB capacity"
    echo "  • Recent errors"
else
    echo ""
    echo "❌ Dashboard deployment failed"
    exit 1
fi
