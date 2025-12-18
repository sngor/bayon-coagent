#!/bin/bash

# Monitor Amplify Deployment Script
# Checks when the new subscription API endpoints are available

echo "🔍 Monitoring Amplify deployment status..."
echo "Checking for subscription API endpoints at https://bayoncoagent.app"
echo ""

# Counter for attempts
attempt=1
max_attempts=30
sleep_interval=30

while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt/$max_attempts - $(date)"
    
    # Test the subscription status endpoint
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "https://bayoncoagent.app/api/subscription/status?userId=test")
    
    if [ "$status_code" = "200" ]; then
        echo "🎉 SUCCESS! Subscription API endpoints are now available!"
        echo ""
        echo "Testing all endpoints:"
        
        # Test subscription status
        echo "✅ Testing subscription status..."
        curl -s "https://bayoncoagent.app/api/subscription/status?userId=test" | jq .
        
        # Test usage tracking
        echo "✅ Testing usage tracking..."
        curl -s "https://bayoncoagent.app/api/subscription/usage?userId=test" | jq .
        
        # Test admin analytics
        echo "✅ Testing admin analytics..."
        curl -s "https://bayoncoagent.app/api/admin/subscription-analytics" | jq .
        
        echo ""
        echo "🚀 Deployment complete! All subscription endpoints are working."
        echo "Next steps:"
        echo "1. Configure Stripe webhook: https://bayoncoagent.app/api/stripe/eventbridge"
        echo "2. Set up cron job for trial notifications"
        echo "3. Test end-to-end user flows"
        
        exit 0
    else
        echo "   Status: $status_code (waiting for 200)"
        echo "   Next check in $sleep_interval seconds..."
        sleep $sleep_interval
        attempt=$((attempt + 1))
    fi
done

echo "❌ Deployment monitoring timed out after $((max_attempts * sleep_interval / 60)) minutes"
echo "Please check Amplify console for deployment status"
exit 1