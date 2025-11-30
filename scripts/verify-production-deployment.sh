#!/bin/bash

# Post-Deployment Verification Script
# Tests production deployment health and functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# Get URL
if [ -z "$1" ]; then
    read -p "Enter production URL (e.g., https://your-domain.com): " PROD_URL
else
    PROD_URL=$1
fi

# Remove trailing slash
PROD_URL=${PROD_URL%/}

print_info "Testing production deployment at: $PROD_URL"
echo ""

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name=$1
    local test_command=$2
    
    print_info "Testing: $test_name"
    
    if eval "$test_command"; then
        print_success "$test_name - PASSED"
        ((TESTS_PASSED++))
        return 0
    else
        print_error "$test_name - FAILED"
        ((TESTS_FAILED++))
        return 1
    fi
    echo ""
}

# Test 1: Application accessibility
test_accessibility() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL")
    [ "$response" = "200" ] || [ "$response" = "301" ] || [ "$response" = "302" ]
}

# Test 2: SSL Certificate
test_ssl() {
    curl -s --head "$PROD_URL" | grep -q "HTTP/2 200" || curl -s --head "$PROD_URL" | grep -q "HTTP/1.1 200"
}

# Test 3: Security Headers
test_security_headers() {
    local headers=$(curl -s -I "$PROD_URL")
    echo "$headers" | grep -q "Strict-Transport-Security" && \
    echo "$headers" | grep -q "X-Content-Type-Options"
}

# Test 4: API Health Endpoint (if exists)
test_api_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/api/health")
    [ "$response" = "200" ] || [ "$response" = "404" ]  # 404 is OK if endpoint doesn't exist
}

# Test 5: Page Load Performance
test_performance() {
    local load_time=$(curl -o /dev/null -s -w '%{time_total}\n' "$PROD_URL")
    local time_int=$(echo "$load_time" | awk '{print int($1)}')
    [ "$time_int" -lt 5 ]  # Should load in less than 5 seconds
}

# Test 6: Content Type
test_content_type() {
    curl -s -I "$PROD_URL" | grep -q "content-type.*html"
}

# Run all tests
echo "==========================================
"
echo "   Production Deployment Verification"
echo "=========================================="
echo ""

run_test "Application Accessibility" "test_accessibility"
run_test "SSL/HTTPS Configuration" "test_ssl"
run_test "Security Headers" "test_security_headers"
run_test "API Health (optional)" "test_api_health"
run_test "Page Load Performance" "test_performance"
run_test "Content Type" "test_content_type"

# AWS Infrastructure Tests (if AWS CLI is available)
if command -v aws &> /dev/null; then
    echo ""
    print_info "=== AWS Infrastructure Tests ==="
    echo ""
    
    # Get environment
    read -p "Enter environment (development/production): " ENVIRONMENT
    ENVIRONMENT=${ENVIRONMENT:-production}
    
    # Test DynamoDB
    print_info "Testing DynamoDB table..."
    TABLE_NAME="BayonCoAgent-${ENVIRONMENT}"
    if aws dynamodb describe-table --table-name "$TABLE_NAME" &> /dev/null; then
        print_success "DynamoDB table exists: $TABLE_NAME"
        ((TESTS_PASSED++))
    else
        print_error "DynamoDB table not found: $TABLE_NAME"
        ((TESTS_FAILED++))
    fi
    
    # Test S3 Bucket
    print_info "Testing S3 bucket..."
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "UNKNOWN")
    BUCKET_NAME="bayon-coagent-storage-${ENVIRONMENT}-${ACCOUNT_ID}"
    if aws s3 ls "s3://${BUCKET_NAME}" &> /dev/null; then
        print_success "S3 bucket exists: $BUCKET_NAME"
        ((TESTS_PASSED++))
    else
        print_warning "S3 bucket not found: $BUCKET_NAME (might use different naming)"
        ((TESTS_FAILED++))
    fi
    
    # Test Cognito User Pool
    print_info "Testing Cognito user pool..."
    STACK_NAME="bayon-coagent-${ENVIRONMENT}"
    USER_POOL_ID=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`CognitoUserPoolId`].OutputValue' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$USER_POOL_ID" ]; then
        if aws cognito-idp describe-user-pool --user-pool-id "$USER_POOL_ID" &> /dev/null; then
            print_success "Cognito user pool exists: $USER_POOL_ID"
            ((TESTS_PASSED++))
        else
            print_error "Cognito user pool not accessible: $USER_POOL_ID"
            ((TESTS_FAILED++))
        fi
    else
        print_warning "Could not retrieve Cognito user pool ID from stack"
        ((TESTS_FAILED++))
    fi
    
    # Test CloudWatch Logs
    print_info "Testing CloudWatch log streams..."
    if aws logs describe-log-groups --log-group-name-prefix "/aws/amplify" &> /dev/null; then
        print_success "CloudWatch logs are being generated"
        ((TESTS_PASSED++))
    else
        print_warning "No CloudWatch log groups found (may be normal if just deployed)"
    fi
fi

# Summary
echo ""
echo "=========================================="
echo "   Verification Summary"
echo "=========================================="
echo ""
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    print_success "All tests passed! ✨"
    echo ""
    print_info "Next steps:"
    echo "1. Run smoke tests: ./scripts/smoke-tests/test-auth.sh"
    echo "2. Test user authentication workflow manually"
    echo "3. Verify monitoring dashboards in CloudWatch"
    echo "4. Check CloudWatch alarms are configured"
    exit 0
else
    print_warning "Some tests failed. Please review the results above."
    echo ""
    print_info "Troubleshooting:"
    echo "1. Check Amplify deployment logs"
    echo "2. Verify CloudFormation stack status"
    echo "3. Review DNS and SSL configuration"
    echo "4. Check application logs in CloudWatch"
    exit 1
fi
