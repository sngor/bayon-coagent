#!/bin/bash

# Stripe EventBridge Verification Script
# Checks your existing Stripe EventBridge setup

echo "🔍 Verifying Stripe EventBridge Setup"
echo "======================================"
echo ""

# Check for Stripe event buses
echo "1. Checking for Stripe Event Buses..."
STRIPE_BUSES=$(aws events list-event-buses --query "EventBuses[?contains(Name, 'stripe') || contains(Name, 'Stripe')].{Name:Name,Arn:Arn}" --output json 2>/dev/null)

if [ -z "$STRIPE_BUSES" ] || [ "$STRIPE_BUSES" = "[]" ]; then
    echo "   ❌ No Stripe event buses found"
    echo ""
    echo "   To connect Stripe to EventBridge:"
    echo "   1. Go to: https://dashboard.stripe.com/webhooks"
    echo "   2. Click 'Add destination' → 'Amazon EventBridge'"
    echo "   3. Select your AWS region"
    echo "   4. In AWS Console, go to EventBridge → Partner event sources"
    echo "   5. Associate the Stripe event source with an event bus"
else
    echo "   ✅ Found Stripe event bus(es):"
    echo "$STRIPE_BUSES" | jq -r '.[] | "      - \(.Name)"'
    STRIPE_BUS_NAME=$(echo "$STRIPE_BUSES" | jq -r '.[0].Name')
    echo ""
fi

# Check for existing Stripe rules
echo "2. Checking for Stripe EventBridge Rules..."
if [ ! -z "$STRIPE_BUS_NAME" ]; then
    STRIPE_RULES=$(aws events list-rules --event-bus-name "$STRIPE_BUS_NAME" --query "Rules[?contains(Name, 'stripe') || contains(Name, 'Stripe')].{Name:Name,State:State}" --output json 2>/dev/null)
    
    if [ -z "$STRIPE_RULES" ] || [ "$STRIPE_RULES" = "[]" ]; then
        echo "   ⚠️  No Stripe rules found on event bus: $STRIPE_BUS_NAME"
        echo "   You'll need to deploy the Lambda handler and create rules"
    else
        echo "   ✅ Found Stripe rule(s):"
        echo "$STRIPE_RULES" | jq -r '.[] | "      - \(.Name) (\(.State))"'
    fi
else
    echo "   ⚠️  Skipping (no event bus found)"
fi
echo ""

# Check for Lambda handler
echo "3. Checking for Stripe Lambda Handler..."
LAMBDA_EXISTS=$(aws lambda get-function --function-name bayon-stripe-subscription-handler-development 2>/dev/null)

if [ -z "$LAMBDA_EXISTS" ]; then
    echo "   ❌ Lambda handler not deployed yet"
    echo "   Run: cd infrastructure && npm run cdk deploy BayonCoAgent-development-Stripe"
else
    echo "   ✅ Lambda handler exists: bayon-stripe-subscription-handler-development"
    
    # Check environment variables
    ENV_VARS=$(aws lambda get-function-configuration --function-name bayon-stripe-subscription-handler-development --query 'Environment.Variables' --output json 2>/dev/null)
    
    if echo "$ENV_VARS" | jq -e '.STRIPE_SECRET_KEY' > /dev/null 2>&1; then
        echo "   ✅ STRIPE_SECRET_KEY is set"
    else
        echo "   ⚠️  STRIPE_SECRET_KEY not set"
        echo "   Set it with: aws lambda update-function-configuration --function-name bayon-stripe-subscription-handler-development --environment 'Variables={DYNAMODB_TABLE_NAME=BayonCoAgent-development,STRIPE_SECRET_KEY=sk_test_...,NODE_ENV=development}'"
    fi
fi
echo ""

# Check CloudWatch Logs
echo "4. Checking CloudWatch Logs..."
LOG_GROUP="/aws/lambda/bayon-stripe-subscription-handler-development"
LOG_EXISTS=$(aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --query "logGroups[?logGroupName=='$LOG_GROUP'].logGroupName" --output text 2>/dev/null)

if [ -z "$LOG_EXISTS" ]; then
    echo "   ⚠️  No CloudWatch logs yet (Lambda hasn't been invoked)"
else
    echo "   ✅ CloudWatch log group exists: $LOG_GROUP"
    
    # Get recent log streams
    RECENT_LOGS=$(aws logs describe-log-streams --log-group-name "$LOG_GROUP" --order-by LastEventTime --descending --max-items 1 --query 'logStreams[0].lastEventTimestamp' --output text 2>/dev/null)
    
    if [ ! -z "$RECENT_LOGS" ] && [ "$RECENT_LOGS" != "None" ]; then
        LAST_EVENT=$(date -r $((RECENT_LOGS / 1000)) 2>/dev/null || date -d @$((RECENT_LOGS / 1000)) 2>/dev/null)
        echo "   ✅ Last event: $LAST_EVENT"
    else
        echo "   ⚠️  No events logged yet"
    fi
fi
echo ""

# Summary
echo "📋 Summary"
echo "=========="
echo ""

if [ ! -z "$STRIPE_BUS_NAME" ]; then
    echo "✅ Stripe EventBridge is connected"
    echo "   Event Bus: $STRIPE_BUS_NAME"
    echo ""
    
    if [ -z "$LAMBDA_EXISTS" ]; then
        echo "📝 Next Steps:"
        echo "   1. Deploy the Lambda handler:"
        echo "      cd infrastructure"
        echo "      npm run cdk deploy BayonCoAgent-development-Stripe"
        echo ""
        echo "   2. Set STRIPE_SECRET_KEY environment variable"
        echo ""
        echo "   3. Test with: stripe trigger customer.subscription.created"
    else
        echo "✅ Lambda handler is deployed"
        echo ""
        echo "📝 Test the integration:"
        echo "   stripe trigger customer.subscription.created"
        echo ""
        echo "📝 Monitor logs:"
        echo "   aws logs tail $LOG_GROUP --follow"
    fi
else
    echo "❌ Stripe EventBridge is NOT connected"
    echo ""
    echo "📝 Setup Steps:"
    echo "   1. Go to: https://dashboard.stripe.com/webhooks"
    echo "   2. Click 'Add destination' → 'Amazon EventBridge'"
    echo "   3. Select your AWS region (us-east-1)"
    echo "   4. Copy the Partner Event Source name"
    echo "   5. Go to: https://console.aws.amazon.com/events"
    echo "   6. Navigate to 'Partner event sources'"
    echo "   7. Find the Stripe event source and click 'Associate with event bus'"
    echo "   8. Run this script again to verify"
fi

echo ""
