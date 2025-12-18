#!/bin/bash

# Subscription API Testing Script
# Tests all subscription-related API endpoints to ensure they're working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-http://localhost:3000}"
TEST_USER_ID="${2:-test-user-$(date +%s)}"
CRON_TOKEN="${CRON_SECRET_TOKEN:-test-token}"

echo -e "${BLUE}🧪 Testing Subscription API Endpoints${NC}"
echo "====================================="
echo "Base URL: $BASE_URL"
echo "Test User ID: $TEST_USER_ID"
echo ""

# Function to make HTTP requests and check responses
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=${4:-200}
    local description=$5
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "  $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    # Extract status code (last line) and body (everything else)
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "  ${GREEN}✅ Status: $status_code${NC}"
        
        # Try to parse JSON and show key fields
        if echo "$body" | jq . > /dev/null 2>&1; then
            success=$(echo "$body" | jq -r '.success // "N/A"')
            message=$(echo "$body" | jq -r '.message // .error // "N/A"')
            echo -e "  ${GREEN}✅ Success: $success${NC}"
            if [ "$message" != "N/A" ]; then
                echo -e "  ${BLUE}📝 Message: $message${NC}"
            fi
        else
            echo -e "  ${BLUE}📝 Response: ${body:0:100}...${NC}"
        fi
    else
        echo -e "  ${RED}❌ Status: $status_code (expected $expected_status)${NC}"
        echo -e "  ${RED}📝 Response: $body${NC}"
        return 1
    fi
    
    echo ""
}

# Function to test with error handling
run_test() {
    if ! "$@"; then
        echo -e "${RED}❌ Test failed: $*${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
}

# Initialize counters
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BLUE}🔍 1. Testing Subscription Status API${NC}"
echo "=================================="

run_test test_endpoint "GET" "/api/subscription/status?userId=$TEST_USER_ID" "" 200 "Get subscription status for new user"

echo -e "${BLUE}📊 2. Testing Usage Tracking API${NC}"
echo "=============================="

run_test test_endpoint "GET" "/api/subscription/usage?userId=$TEST_USER_ID" "" 200 "Get initial usage statistics"

run_test test_endpoint "POST" "/api/subscription/usage" \
    '{"userId":"'$TEST_USER_ID'","feature":"aiContentGeneration"}' \
    200 "Increment AI content generation usage"

run_test test_endpoint "POST" "/api/subscription/usage" \
    '{"userId":"'$TEST_USER_ID'","feature":"imageEnhancements"}' \
    200 "Increment image enhancement usage"

run_test test_endpoint "GET" "/api/subscription/usage?userId=$TEST_USER_ID" "" 200 "Get updated usage statistics"

echo -e "${BLUE}🔧 3. Testing Development Endpoints${NC}"
echo "================================"

if [ "$BASE_URL" = "http://localhost:3000" ]; then
    run_test test_endpoint "GET" "/api/test-subscription?userId=$TEST_USER_ID&action=status" "" 200 "Test subscription service - status"
    
    run_test test_endpoint "GET" "/api/test-subscription?userId=$TEST_USER_ID&action=usage" "" 200 "Test subscription service - usage"
    
    run_test test_endpoint "GET" "/api/test-subscription?userId=$TEST_USER_ID&action=can-use&feature=aiContentGeneration" "" 200 "Test subscription service - can use feature"
    
    run_test test_endpoint "GET" "/api/test-subscription?userId=$TEST_USER_ID&action=increment&feature=researchReports" "" 200 "Test subscription service - increment usage"
    
    run_test test_endpoint "POST" "/api/test-subscription" \
        '{"userId":"'$TEST_USER_ID'","action":"create-trial"}' \
        200 "Test subscription service - create trial"
else
    echo -e "${YELLOW}⚠️  Skipping development endpoints (not localhost)${NC}"
fi

echo -e "${BLUE}📧 4. Testing Cron Job Endpoint${NC}"
echo "============================="

run_test test_endpoint "POST" "/api/cron/trial-notifications" \
    '{}' \
    401 "Trial notifications without auth (should fail)"

if [ -n "$CRON_TOKEN" ] && [ "$CRON_TOKEN" != "test-token" ]; then
    # Test with proper authorization header
    echo -e "${YELLOW}Testing with authorization header${NC}"
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: Bearer $CRON_TOKEN" \
        -H "Content-Type: application/json" \
        "$BASE_URL/api/cron/trial-notifications")
    
    status_code=$(echo "$response" | tail -n1)
    if [ "$status_code" = "200" ]; then
        echo -e "  ${GREEN}✅ Cron job endpoint accessible with auth${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "  ${RED}❌ Cron job endpoint failed with auth: $status_code${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  Skipping authenticated cron test (no CRON_SECRET_TOKEN)${NC}"
fi

echo -e "${BLUE}📈 5. Testing Admin Analytics${NC}"
echo "=========================="

run_test test_endpoint "GET" "/api/admin/subscription-analytics" "" 200 "Get subscription analytics"

echo -e "${BLUE}🔄 6. Testing Error Handling${NC}"
echo "=========================="

run_test test_endpoint "GET" "/api/subscription/status" "" 400 "Missing userId parameter"

run_test test_endpoint "POST" "/api/subscription/usage" \
    '{"userId":"'$TEST_USER_ID'"}' \
    400 "Missing feature parameter"

run_test test_endpoint "POST" "/api/subscription/usage" \
    '{"userId":"'$TEST_USER_ID'","feature":"invalidFeature"}' \
    400 "Invalid feature name"

echo -e "${BLUE}💳 7. Testing Stripe Integration Endpoints${NC}"
echo "========================================"

# Test EventBridge endpoint (should accept POST)
run_test test_endpoint "POST" "/api/stripe/eventbridge" \
    '{"type":"test","data":{"object":{}}}' \
    200 "Stripe EventBridge handler"

# Test other Stripe endpoints
run_test test_endpoint "GET" "/api/stripe/validate-coupon?couponId=TEST10" "" 200 "Validate coupon endpoint"

echo -e "\n${BLUE}📊 Test Results Summary${NC}"
echo "======================"
echo -e "Total Tests: $((PASSED_TESTS + FAILED_TESTS))"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Subscription API is working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please check the API implementation.${NC}"
    exit 1
fi