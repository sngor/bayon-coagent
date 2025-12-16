#!/bin/bash

# Production Monitoring Setup Script
# Creates CloudWatch dashboards and alarms for Lambda functions

set -e

echo "📊 Setting up Production Monitoring for Lambda Functions"
echo "======================================================="

ENVIRONMENT=${1:-development}
REGION="us-west-2"

echo "📍 Environment: $ENVIRONMENT"
echo "🌍 Region: $REGION"

# Create CloudWatch Dashboard
echo "📈 Creating CloudWatch Dashboard..."

cat > dashboard-config.json << EOF
{
  "widgets": [
    {
      "type": "metric",
      "x": 0,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/Lambda", "Duration", "FunctionName", "bayon-coagent-ai-content-generation-$ENVIRONMENT" ],
          [ ".", ".", ".", "bayon-coagent-ai-research-$ENVIRONMENT" ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "$REGION",
        "title": "Lambda Function Duration",
        "period": 300,
        "stat": "Average"
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/Lambda", "Invocations", "FunctionName", "bayon-coagent-ai-content-generation-$ENVIRONMENT" ],
          [ ".", ".", ".", "bayon-coagent-ai-research-$ENVIRONMENT" ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "$REGION",
        "title": "Lambda Function Invocations",
        "period": 300,
        "stat": "Sum"
      }
    },
    {
      "type": "metric",
      "x": 0,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/Lambda", "Errors", "FunctionName", "bayon-coagent-ai-content-generation-$ENVIRONMENT" ],
          [ ".", ".", ".", "bayon-coagent-ai-research-$ENVIRONMENT" ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "$REGION",
        "title": "Lambda Function Errors",
        "period": 300,
        "stat": "Sum"
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/ApiGateway", "Count", "ApiName", "bayon-coagent-api-$ENVIRONMENT" ],
          [ ".", "4XXError", ".", "." ],
          [ ".", "5XXError", ".", "." ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "$REGION",
        "title": "API Gateway Requests & Errors",
        "period": 300,
        "stat": "Sum"
      }
    },
    {
      "type": "metric",
      "x": 0,
      "y": 12,
      "width": 24,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/ApiGateway", "Latency", "ApiName", "bayon-coagent-api-$ENVIRONMENT" ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "$REGION",
        "title": "API Gateway Latency",
        "period": 300,
        "stat": "Average"
      }
    }
  ]
}
EOF

# Create the dashboard
aws cloudwatch put-dashboard \
    --region $REGION \
    --dashboard-name "BayonCoAgent-Production-$ENVIRONMENT" \
    --dashboard-body file://dashboard-config.json

echo "✅ CloudWatch Dashboard created: BayonCoAgent-Production-$ENVIRONMENT"

# Create CloudWatch Alarms
echo "🚨 Creating CloudWatch Alarms..."

# High Error Rate Alarm for Content Generation
aws cloudwatch put-metric-alarm \
    --region $REGION \
    --alarm-name "BayonCoAgent-ContentGeneration-HighErrorRate-$ENVIRONMENT" \
    --alarm-description "High error rate for AI Content Generation Lambda" \
    --metric-name Errors \
    --namespace AWS/Lambda \
    --statistic Sum \
    --period 300 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions "arn:aws:sns:$REGION:409136660268:bayon-coagent-alerts" \
    --dimensions Name=FunctionName,Value=bayon-coagent-ai-content-generation-$ENVIRONMENT

# High Error Rate Alarm for Research
aws cloudwatch put-metric-alarm \
    --region $REGION \
    --alarm-name "BayonCoAgent-Research-HighErrorRate-$ENVIRONMENT" \
    --alarm-description "High error rate for AI Research Lambda" \
    --metric-name Errors \
    --namespace AWS/Lambda \
    --statistic Sum \
    --period 300 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions "arn:aws:sns:$REGION:409136660268:bayon-coagent-alerts" \
    --dimensions Name=FunctionName,Value=bayon-coagent-ai-research-$ENVIRONMENT

# High Duration Alarm for Content Generation
aws cloudwatch put-metric-alarm \
    --region $REGION \
    --alarm-name "BayonCoAgent-ContentGeneration-HighDuration-$ENVIRONMENT" \
    --alarm-description "High duration for AI Content Generation Lambda" \
    --metric-name Duration \
    --namespace AWS/Lambda \
    --statistic Average \
    --period 300 \
    --threshold 30000 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 3 \
    --alarm-actions "arn:aws:sns:$REGION:409136660268:bayon-coagent-alerts" \
    --dimensions Name=FunctionName,Value=bayon-coagent-ai-content-generation-$ENVIRONMENT

echo "✅ CloudWatch Alarms created"

# Clean up
rm -f dashboard-config.json

echo ""
echo "🎉 Production Monitoring Setup Complete!"
echo ""
echo "📊 Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=BayonCoAgent-Production-$ENVIRONMENT"
echo ""
echo "🔍 Key Metrics to Monitor:"
echo "  • Lambda Duration: Should be < 30 seconds"
echo "  • Error Rate: Should be < 1%"
echo "  • API Gateway Latency: Should be < 5 seconds"
echo "  • Invocation Count: Track usage patterns"
echo ""
echo "🚨 Alarms will trigger if:"
echo "  • Error rate > 5 errors in 10 minutes"
echo "  • Duration > 30 seconds for 15 minutes"
echo ""
echo "📈 Next Steps:"
echo "  1. Monitor dashboard for first 24 hours"
echo "  2. Adjust alarm thresholds based on usage"
echo "  3. Set up SNS notifications for alerts"
echo "  4. Consider Lambda warming for cold starts"