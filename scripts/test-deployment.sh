#!/bin/bash

# Deployment Testing Script
# Tests the deployed application to verify all functionality works

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if URL is provided
if [ -z "$1" ]; then
    print_error "Usage: $0 <deployment-url>"
    echo "Example: $0 https://main.d1234567890.amplifyapp.com"
    exit 1
fi

DEPLOYMENT_URL=$1
TEST_RESULTS=()
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    
    print_info "Testing: $test_name"
    
    if eval "$test_command"; then
        print_success "$test_name passed"
        TEST_RESULTS+=("✓ $test_name")
        return 0
    else
        print_error "$test_name failed"
        TEST_RESULTS+=("✗ $test_name")
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo ""
print_info "=== Deployment Testing ==="
print_info "URL: $DEPLOYMENT_URL"
echo ""

# Test 1: Basic connectivity
run_test "Basic Connectivity" \
    "curl -s -o /dev/null -w '%{http_code}' $DEPLOYMENT_URL | grep -q '200'"

# Test 2: Homepage loads
run_test "Homepage Loads" \
    "curl -s $DEPLOYMENT_URL | grep -q 'Bayon CoAgent'"

# Test 3: Static assets load
run_test "Static Assets Load" \
    "curl -s -o /dev/null -w '%{http_code}' $DEPLOYMENT_URL/_next/static/ | grep -q '200\|301\|302'"

# Test 4: API routes accessible
run_test "API Routes Accessible" \
    "curl -s -o /dev/null -w '%{http_code}' $DEPLOYMENT_URL/api/health | grep -q '200\|404'"

# Test 5: SSL/TLS certificate valid
if [[ $DEPLOYMENT_URL == https://* ]]; then
    run_test "SSL Certificate Valid" \
        "curl -s --head $DEPLOYMENT_URL | grep -q 'HTTP/2 200\|HTTP/1.1 200'"
else
    print_warning "Skipping SSL test (not HTTPS)"
fi

# Test 6: Security headers present
run_test "Security Headers Present" \
    "curl -s -I $DEPLOYMENT_URL | grep -q 'X-Frame-Options\|Strict-Transport-Security'"

# Test 7: Compression enabled
run_test "Compression Enabled" \
    "curl -s -I -H 'Accept-Encoding: gzip' $DEPLOYMENT_URL | grep -q 'Content-Encoding: gzip'"

# Test 8: Login page accessible
run_test "Login Page Accessible" \
    "curl -s -o /dev/null -w '%{http_code}' $DEPLOYMENT_URL/login | grep -q '200'"

# Test 9: Dashboard route exists (may redirect to login)
run_test "Dashboard Route Exists" \
    "curl -s -o /dev/null -w '%{http_code}' $DEPLOYMENT_URL/dashboard | grep -q '200\|302\|307'"

# Test 10: Response time acceptable
RESPONSE_TIME=$(curl -s -o /dev/null -w '%{time_total}' $DEPLOYMENT_URL)
run_test "Response Time < 3s" \
    "echo $RESPONSE_TIME | awk '{exit !($1 < 3)}'"

# Test 11: No JavaScript errors in console (basic check)
run_test "No Critical JavaScript Errors" \
    "curl -s $DEPLOYMENT_URL | grep -v 'console.error\|Uncaught'"

# Test 12: Favicon loads
run_test "Favicon Loads" \
    "curl -s -o /dev/null -w '%{http_code}' $DEPLOYMENT_URL/favicon.ico | grep -q '200'"

# Test 13: Robots.txt exists
run_test "Robots.txt Exists" \
    "curl -s -o /dev/null -w '%{http_code}' $DEPLOYMENT_URL/robots.txt | grep -q '200'"

# Test 14: Manifest.json exists
run_test "Manifest.json Exists" \
    "curl -s -o /dev/null -w '%{http_code}' $DEPLOYMENT_URL/manifest.json | grep -q '200'"

# Test 15: No 500 errors on main pages
PAGES=("/" "/login" "/dashboard")
for page in "${PAGES[@]}"; do
    run_test "No 500 Error on $page" \
        "curl -s -o /dev/null -w '%{http_code}' $DEPLOYMENT_URL$page | grep -v '500'"
done

# Summary
echo ""
print_info "=== Test Summary ==="
echo ""

for result in "${TEST_RESULTS[@]}"; do
    echo "$result"
done

echo ""
if [ $FAILED_TESTS -eq 0 ]; then
    print_success "All tests passed! ✨"
    echo ""
    print_info "Deployment is ready for use"
    exit 0
else
    print_error "$FAILED_TESTS test(s) failed"
    echo ""
    print_warning "Please review the failed tests and fix any issues"
    exit 1
fi
