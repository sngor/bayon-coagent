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
echo "4. Testing Trial Notifications API..."
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/cron/trial-notifications" \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json")
echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Cron API working!"
else
    echo "❌ Cron API failed (may need proper token)"
fi

echo ""
echo "🎯 Summary:"
echo "- If Subscription API works, core functionality is ready"
echo "- If Debug API works, environment variables are set correctly"
echo "- Admin and Cron APIs may need authentication"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Amplify Console"
echo "2. Redeploy the application"
echo "3. Run this script again to verify"