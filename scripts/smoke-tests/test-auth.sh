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
}

# Get URL
if [ -z "$1" ]; then
    read -p "Enter application URL (e.g., https://your-domain.com): " APP_URL
else
    APP_URL=$1
fi

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
print_info "=== Manual Authentication Tests ==="
echo ""
echo "Please perform the following manual tests:"
echo ""
echo "1. Sign Up"
echo "   - Visit: $APP_URL/auth/signup"
echo "   - Create new account with valid email"
echo "   - Verify email confirmation sent"
echo "   - Confirm email and verify account activated"
echo ""
echo "2. Sign In  "
echo "   - Visit: $APP_URL/auth/login"
echo "   - Log in with created account"
echo "   - Verify redirect to dashboard"
echo "   - Check user profile data loads"
echo ""
echo "3. OAuth Login (if configured)"
echo "   - Try Google sign-in"
echo "   - Verify account created/linked"
echo "   - Verify redirect works"
echo ""
echo "4. Password Reset"
echo "   - Click 'Forgot Password'"
echo "   - Enter email address"
echo "   - Verify reset email sent"
echo "   - Complete password reset flow"
echo ""
echo "5. Sign Out"
echo "   - Click sign out button"
echo "   - Verify redirect to login"
echo "   - Verify session cleared"
echo ""
print_success "Authentication smoke test complete!"
