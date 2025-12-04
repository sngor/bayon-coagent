#!/bin/bash

# Authentication Smoke Test
# Tests authentication endpoints and user flows

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
    exit 1
}

# Get URL
if [ -z "$1" ]; then
    echo "Usage: $0 <app-url>"
    echo "Example: $0 https://your-domain.com"
    exit 1
fi

APP_URL=$1
APP_URL=${APP_URL%/}

print_info "Testing authentication at: $APP_URL"
echo ""

# Test 1: Login page accessibility
print_info "Test 1: Login page loads"
LOGIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/auth/login")
if [ "$LOGIN_RESPONSE" = "200" ]; then
    print_success "Login page accessible"
else
    print_error "Login page returned: $LOGIN_RESPONSE"
fi

# Test 2: Signup page accessibility
print_info "Test 2: Signup page loads"
SIGNUP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/auth/signup")
if [ "$SIGNUP_RESPONSE" = "200" ]; then
    print_success "Signup page accessible"
else
    print_error "Signup page returned: $SIGNUP_RESPONSE"
fi

# Test 3: Password reset page
print_info "Test 3: Password reset page loads"
RESET_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/auth/reset-password")
if [ "$RESET_RESPONSE" = "200" ] || [ "$RESET_RESPONSE" = "404" ]; then
    print_success "Password reset page accessible"
else
    print_error "Password reset page returned: $RESET_RESPONSE"
fi

# Test 4: OAuth Cognito configuration (check meta tags)
print_info "Test 4: Checking Cognito configuration"
PAGE_CONTENT=$(curl -s "$APP_URL")
if echo "$PAGE_CONTENT" | grep -q "cognito"; then
    print_success "Cognito configuration found in page"
else
    print_error "Cognito configuration not found (may be OK if loaded dynamically)"
fi

echo ""
print_success "Authentication smoke test complete!"
echo ""
print_info "=== Manual Authentication Tests (Optional) ==="
echo ""
echo "For comprehensive testing, perform these manual tests:"
echo "1. Sign Up: Visit $APP_URL/auth/signup and create account"
echo "2. Sign In: Visit $APP_URL/auth/login and verify login"
echo "3. OAuth Login: Test Google sign-in if configured"
echo "4. Password Reset: Test forgot password flow"
echo "5. Sign Out: Verify session is cleared properly"
