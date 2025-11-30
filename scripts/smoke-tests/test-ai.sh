#!/bin/bash

# Bedrock AI Smoke Test
# Tests AWS Bedrock AI integration and model invocation

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not installed"
    exit 1
fi

# Get region
read -p "Enter AWS region (default: us-west-2): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-west-2}

MODEL_ID="us.anthropic.claude-3-5-sonnet-20241022-v2:0"

print_info "Testing Bedrock AI in region: $AWS_REGION"
print_info "Model ID: $MODEL_ID"
echo ""

# Test 1: Check Bedrock access
print_info "Test 1: Verify Bedrock API access"
if aws bedrock list-foundation-models --region "$AWS_REGION" &> /dev/null; then
    print_success "Bedrock API accessible"
else
    print_error "Cannot access Bedrock API"
    print_info "Ensure you have Bedrock permissions and model access enabled"
    exit 1
fi

# Test 2: Check if model is available
print_info "Test 2: Verify model availability"
MODEL_CHECK=$(aws bedrock list-foundation-models \
    --region "$AWS_REGION" \
    --by-provider anthropic \
    --query "modelSummaries[?contains(modelId, 'claude-3-5-sonnet')].modelId" \
    --output text 2>/dev/null || echo "")

if echo "$MODEL_CHECK" | grep -q "claude-3-5-sonnet"; then
    print_success "Claude 3.5 Sonnet model available"
else
    print_warning "Claude 3.5 Sonnet model not found in available models"
    print_info "You may need to request model access in the Bedrock console"
fi

# Test 3: Test model invocation
print_info "Test 3: Testing model invocation"

# Create test payload
PAYLOAD=$(cat <<EOF
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": 100,
  "messages": [
    {
      "role": "user",
      "content": "Say 'Hello from Bedrock!'"
    }
  ]
}
EOF
)

# Save payload to temp file
PAYLOAD_FILE="/tmp/bedrock-test-payload-$(date +%s).json"
echo "$PAYLOAD" > "$PAYLOAD_FILE"

# Invoke model
RESPONSE_FILE="/tmp/bedrock-test-response-$(date +%s).json"

if aws bedrock-runtime invoke-model \
    --model-id "$MODEL_ID" \
    --body "file://$PAYLOAD_FILE" \
    --region "$AWS_REGION" \
    "$RESPONSE_FILE" &> /dev/null; then
    
    print_success "Model invocation successful"
    
    # Parse response (if jq is available)
    if command -v jq &> /dev/null; then
        RESPONSE_TEXT=$(cat "$RESPONSE_FILE" | jq -r '.content[0].text' 2>/dev/null || echo "")
        if [ -n "$RESPONSE_TEXT" ]; then
            print_info "Model response: $RESPONSE_TEXT"
        fi
    fi
else
    print_error "Model invocation failed"
    print_info "Check IAM permissions for bedrock:InvokeModel"
fi

# Cleanup
rm -f "$PAYLOAD_FILE" "$RESPONSE_FILE"

# Test 4: Test with longer prompt (content generation)
print_info "Test 4: Testing content generation"

CONTENT_PAYLOAD=$(cat <<EOF
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": 200,
  "temperature": 0.7,
  "messages": [
    {
      "role": "user",
      "content": "Write a short professional bio for a real estate agent in 2 sentences."
    }
  ]
}
EOF
)

CONTENT_PAYLOAD_FILE="/tmp/bedrock-content-test-$(date +%s).json"
echo "$CONTENT_PAYLOAD" > "$CONTENT_PAYLOAD_FILE"

CONTENT_RESPONSE_FILE="/tmp/bedrock-content-response-$(date +%s).json"

if aws bedrock-runtime invoke-model \
    --model-id "$MODEL_ID" \
    --body "file://$CONTENT_PAYLOAD_FILE" \
    --region "$AWS_REGION" \
    "$CONTENT_RESPONSE_FILE" & > /dev/null; then
    
    print_success "Content generation successful"
    
    if command -v jq &> /dev/null; then
        CONTENT_TEXT=$(cat "$CONTENT_RESPONSE_FILE" | jq -r '.content[0].text' 2>/dev/null || echo "")
        if [ -n "$CONTENT_TEXT" ]; then
            print_info "Generated content:"
            echo "$CONTENT_TEXT"
        fi
        
        # Get usage stats
        INPUT_TOKENS=$(cat "$CONTENT_RESPONSE_FILE" | jq -r '.usage.input_tokens' 2>/dev/null || echo "0")
        OUTPUT_TOKENS=$(cat "$CONTENT_RESPONSE_FILE" | jq -r '.usage.output_tokens' 2>/dev/null || echo "0")
        print_info "Token usage: Input=$INPUT_TOKENS, Output=$OUTPUT_TOKENS"
    fi
else
    print_error "Content generation failed"
fi

# Cleanup
rm -f "$CONTENT_PAYLOAD_FILE" "$CONTENT_RESPONSE_FILE"

# Test 5: Check CloudWatch metrics
print_info "Test 5: Checking Bedrock CloudWatch metrics"
METRIC_DATA=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/Bedrock \
    --metric-name Invocations \
    --dimensions Name=ModelId,Value="$MODEL_ID" \
    --start-time "$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)" \
    --end-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
    --period 3600 \
    --statistics Sum \
    --region "$AWS_REGION" \
    --query 'Datapoints[0].Sum' \
    --output text 2>/dev/null || echo "0")

if [ "$METRIC_DATA" != "None" ] && [ "$METRIC_DATA" != "0" ]; then
    print_success "CloudWatch metrics available: $METRIC_DATA invocations in last hour"
else
    print_info "No metrics yet (may take a few minutes to appear)"
fi

echo ""
print_success "Bedrock AI smoke test complete!"
echo ""
print_info "Manual tests to perform:"
echo "1. Generate marketing content via the application UI"
echo "2. Test different content types (blog post, social media, email)"
echo "3. Verify AI response quality and relevance"
echo "4. Test error handling (invalid inputs)"
echo "5. Monitor CloudWatch for Bedrock metrics"
echo "6. Check for throttling in CloudWatch alarms"
