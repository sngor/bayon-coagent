#!/bin/bash

# CI/CD Setup Verification Script
# This script helps verify that GitHub repository is properly configured for CI/CD

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 CI/CD Setup Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "   Install from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub CLI${NC}"
    echo "   Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"
echo ""

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Repository: $REPO"
echo ""

# Function to check secret
check_secret() {
    local secret_name=$1
    local required=$2
    
    # Note: GitHub CLI doesn't allow reading secret values, only listing names
    if gh secret list | grep -q "^$secret_name"; then
        echo -e "${GREEN}✅${NC} $secret_name"
        ((PASSED++))
        return 0
    else
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌${NC} $secret_name (REQUIRED)"
            ((FAILED++))
        else
            echo -e "${YELLOW}⚠️${NC}  $secret_name (optional)"
            ((WARNINGS++))
        fi
        return 1
    fi
}

# Function to check environment
check_environment() {
    local env_name=$1
    
    if gh api "repos/$REPO/environments/$env_name" &> /dev/null; then
        echo -e "${GREEN}✅${NC} $env_name environment exists"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC} $env_name environment not found"
        ((FAILED++))
        return 1
    fi
}

# Check GitHub Secrets
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Checking GitHub Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "AWS Development Credentials:"
check_secret "AWS_ACCESS_KEY_ID_DEV" true
check_secret "AWS_SECRET_ACCESS_KEY_DEV" true
check_secret "AWS_REGION_DEV" false
echo ""

echo "AWS Staging Credentials:"
check_secret "AWS_ACCESS_KEY_ID_STAGING" true
check_secret "AWS_SECRET_ACCESS_KEY_STAGING" true
check_secret "AWS_REGION_STAGING" false
echo ""

echo "AWS Production Credentials:"
check_secret "AWS_ACCESS_KEY_ID_PROD" true
check_secret "AWS_SECRET_ACCESS_KEY_PROD" true
check_secret "AWS_REGION_PROD" false
echo ""

echo "Notification Services:"
check_secret "SLACK_WEBHOOK_URL" true
check_secret "SLACK_CHANNEL_DEVOPS" false
check_secret "SLACK_CHANNEL_TEAM" false
echo ""

echo "Third-Party Services:"
check_secret "SNYK_TOKEN" true
check_secret "CODECOV_TOKEN" true
echo ""

echo "Optional Services:"
check_secret "PAGERDUTY_INTEGRATION_KEY" false
check_secret "DATADOG_API_KEY" false
echo ""

# Check GitHub Environments
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌍 Checking GitHub Environments"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

check_environment "development"
check_environment "staging"
check_environment "production"
echo ""

# Check Branch Protection
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛡️  Checking Branch Protection Rules"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check main branch protection
if gh api "repos/$REPO/branches/main/protection" &> /dev/null; then
    echo -e "${GREEN}✅${NC} main branch protection enabled"
    ((PASSED++))
    
    # Check required reviews
    REQUIRED_REVIEWS=$(gh api "repos/$REPO/branches/main/protection" -q '.required_pull_request_reviews.required_approving_review_count' 2>/dev/null || echo "0")
    if [ "$REQUIRED_REVIEWS" -ge 2 ]; then
        echo -e "${GREEN}✅${NC} main requires $REQUIRED_REVIEWS approvals"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️${NC}  main requires only $REQUIRED_REVIEWS approval(s) (recommended: 2)"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}❌${NC} main branch protection not enabled"
    ((FAILED++))
fi
echo ""

# Check develop branch protection
if gh api "repos/$REPO/branches/develop/protection" &> /dev/null; then
    echo -e "${GREEN}✅${NC} develop branch protection enabled"
    ((PASSED++))
    
    # Check required reviews
    REQUIRED_REVIEWS=$(gh api "repos/$REPO/branches/develop/protection" -q '.required_pull_request_reviews.required_approving_review_count' 2>/dev/null || echo "0")
    if [ "$REQUIRED_REVIEWS" -ge 1 ]; then
        echo -e "${GREEN}✅${NC} develop requires $REQUIRED_REVIEWS approval(s)"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️${NC}  develop requires only $REQUIRED_REVIEWS approval(s) (recommended: 1)"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}❌${NC} develop branch protection not enabled"
    ((FAILED++))
fi
echo ""

# Check Workflow Files
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 Checking Workflow Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

WORKFLOW_DIR=".github/workflows"

check_workflow() {
    local workflow=$1
    if [ -f "$WORKFLOW_DIR/$workflow" ]; then
        echo -e "${GREEN}✅${NC} $workflow"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️${NC}  $workflow (not yet created)"
        ((WARNINGS++))
    fi
}

check_workflow "verify-secrets.yml"
check_workflow "test-environments.yml"
check_workflow "test-slack.yml"
check_workflow "ci.yml"
check_workflow "security-scan.yml"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Passed:${NC}   $PASSED"
echo -e "${YELLOW}⚠️  Warnings:${NC} $WARNINGS"
echo -e "${RED}❌ Failed:${NC}   $FAILED"
echo ""

# Recommendations
if [ $FAILED -gt 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 Next Steps"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. Review the detailed setup guide:"
    echo "   docs/cicd/github-setup-guide.md"
    echo ""
    echo "2. Configure missing secrets in GitHub:"
    echo "   https://github.com/$REPO/settings/secrets/actions"
    echo ""
    echo "3. Create missing environments:"
    echo "   https://github.com/$REPO/settings/environments"
    echo ""
    echo "4. Set up branch protection rules:"
    echo "   https://github.com/$REPO/settings/branches"
    echo ""
    exit 1
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🎉 Setup Complete!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Your repository is properly configured for CI/CD!"
    echo ""
    echo "Next steps:"
    echo "1. Run verification workflows to test the setup"
    echo "2. Proceed to Task 2: Enhance CI workflow"
    echo ""
    exit 0
fi
