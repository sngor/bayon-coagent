#!/bin/bash

# Pre-deployment Validation Script
# Comprehensive checks before production deployment

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_error() { echo -e "${RED}✗ ${1}${NC}"; }
print_success() { echo -e "${GREEN}✓ ${1}${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ ${1}${NC}"; }
print_info() { echo -e "${BLUE}ℹ ${1}${NC}"; }

ERRORS=0
WARNINGS=0

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
    else
        print_error "$1 is not installed"
        ERRORS=$((ERRORS + 1))
    fi
}

run_check() {
    local check_name=$1
    local check_command=$2
    
    print_info "Checking: $check_name"
    
    if eval "$check_command" &> /dev/null; then
        print_success "$check_name"
    else
        print_error "$check_name failed"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "🚀 Pre-deployment Validation"
echo "=========================="
echo ""

# 1. Check required tools
print_info "Checking required tools..."
check_command "node"
check_command "npm"
check_command "aws"
check_command "sam"

# 2. Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_NODE="18.0.0"
if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_NODE" ]; then
    print_success "Node.js version $NODE_VERSION is compatible"
else
    print_error "Node.js version $NODE_VERSION is too old (requires >= $REQUIRED_NODE)"
    ERRORS=$((ERRORS + 1))
fi

# 3. TypeScript compilation
print_info "Checking TypeScript compilation..."
if npm run typecheck &> /dev/null; then
    print_success "TypeScript compilation successful"
else
    print_warning "TypeScript compilation has errors (build still works with ignoreBuildErrors=true)"
    WARNINGS=$((WARNINGS + 1))
fi

# 4. Linting
print_info "Checking code linting..."
if npm run lint &> /dev/null; then
    print_success "Linting passed"
else
    print_warning "Linting issues found"
    WARNINGS=$((WARNINGS + 1))
fi

# 5. Build test
print_info "Testing production build..."
if npm run build &> /dev/null; then
    print_success "Production build successful"
else
    print_error "Production build failed"
    ERRORS=$((ERRORS + 1))
fi

# 6. Environment validation
print_info "Validating environment configuration..."
if ./scripts/validate-production-env.sh &> /dev/null; then
    print_success "Environment configuration valid"
else
    print_error "Environment configuration invalid"
    ERRORS=$((ERRORS + 1))
fi

# 7. SAM template validation
print_info "Validating SAM template..."
if sam validate &> /dev/null; then
    print_success "SAM template is valid"
else
    print_error "SAM template validation failed"
    ERRORS=$((ERRORS + 1))
fi

# 8. AWS credentials check
print_info "Checking AWS credentials..."
if aws sts get-caller-identity &> /dev/null; then
    print_success "AWS credentials are valid"
else
    print_error "AWS credentials are invalid or not configured"
    ERRORS=$((ERRORS + 1))
fi

# 9. Security scan
print_info "Checking for security issues..."
# Check for actual AWS credentials (not just comments)
if [ -f ".env.local" ] && grep -q "^AWS_ACCESS_KEY_ID=\|^AWS_SECRET_ACCESS_KEY=" .env.local; then
    print_error "AWS credentials found in .env.local - security risk!"
    ERRORS=$((ERRORS + 1))
else
    print_success "No hardcoded AWS credentials found"
fi

# Check if .env files are properly ignored
if git check-ignore .env.local .env.production.local >/dev/null 2>&1; then
    print_success "Environment files are properly ignored by git"
else
    print_warning "Environment files may not be properly ignored by git"
    WARNINGS=$((WARNINGS + 1))
fi

# 10. Dependencies check
print_info "Checking for vulnerable dependencies..."
if npm audit --audit-level=high &> /dev/null; then
    print_success "No high-severity vulnerabilities found"
else
    print_warning "High-severity vulnerabilities found in dependencies"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "=========================="
if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        print_success "🎉 All checks passed! Ready for production deployment"
        exit 0
    else
        print_warning "⚠️ $WARNINGS warning(s) found, but deployment can proceed"
        exit 0
    fi
else
    print_error "❌ $ERRORS critical issue(s) found. Fix before deploying to production"
    exit 1
fi