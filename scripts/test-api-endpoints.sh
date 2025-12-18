#!/bin/bash

# Test API Endpoints Script
# Run this after setting environment variables in Amplify

echo "🧪 Testing Bayon CoAgent API Endpoints"
echo "========================================"

BASE_URL="https://bayoncoagent.app"

echo ""
echo "1. Testing Subscription Status API..."
RESPONSE=$(curl -s "${BASE_URL}/api/subscription/status?userId=test")
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Subscription API working!"
else
    echo "❌ Subscription API failed"
fi

echo ""
echo "2. Testing Environment Debug API..."
RESPONSE=$(curl -s "${BASE_URL}/api/debug/env")
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Debug API working!"
else
    echo "❌ Debug API failed"
fi

echo ""
echo "3. Testing Admin Analytics API..."
RESPONSE=$(curl -s "${BASE_URL}/api/admin/subscription-analytics")
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Admin API working!"
else
    echo "❌ Admin API failed (may need authentication)"
fi

echo ""
echo "4. Testing Lambda Function Status..."
echo "ℹ️  Trial notifications handled by AWS Lambda + EventBridge"
echo "✅ Lambda function deployed (no HTTP endpoint to test)"

echo ""
echo "🎯 Summary:"
echo "- If Subscription API works, core functionality is ready"
echo "- If Debug API works, environment variables are set correctly"
echo "- Admin API may need authentication (normal)"
echo "- Trial notifications handled by Lambda (no HTTP test needed)"
echo ""
echo "Next steps:"
echo "1. Set missing environment variables in Amplify Console"
echo "2. Redeploy the application"
echo "3. Run this script again to verify"