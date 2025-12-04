#!/bin/bash

# Script to configure GitHub branch protection rules
# This script uses the GitHub API to set up branch protection for main and develop branches
# 
# Requirements:
# - GitHub CLI (gh) installed and authenticated
# - Repository admin access
#
# Usage:
#   ./scripts/configure-branch-protection.sh [owner/repo]
#
# Example:
#   ./scripts/configure-branch-protection.sh myorg/myrepo

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get repository from argument or detect from git remote
if [ -n "$1" ]; then
    REPO="$1"
else
    # Try to detect from git remote
    REPO=$(git remote get-url origin | sed -E 's/.*github\.com[:/](.+)\.git/\1/')
    if [ -z "$REPO" ]; then
        echo -e "${RED}Error: Could not detect repository. Please provide it as an argument.${NC}"
        echo "Usage: $0 owner/repo"
        exit 1
    fi
fi

echo -e "${GREEN}Configuring branch protection for repository: $REPO${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub CLI.${NC}"
    echo "Please run: gh auth login"
    exit 1
fi

# Function to configure branch protection
configure_branch_protection() {
    local BRANCH=$1
    local REPO=$2
    
    echo -e "${YELLOW}Configuring protection for branch: $BRANCH${NC}"
    
    # Create the protection rule using GitHub API
    gh api \
        --method PUT \
        -H "Accept: application/vnd.github+json" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "/repos/$REPO/branches/$BRANCH/protection" \
        -f required_status_checks[strict]=true \
        -f required_status_checks[contexts][]=quality \
        -f required_status_checks[contexts][]=test \
        -f required_status_checks[contexts][]=integration-tests \
        -f required_status_checks[contexts][]=build \
        -f enforce_admins=true \
        -f required_pull_request_reviews[dismiss_stale_reviews]=true \
        -f required_pull_request_reviews[require_code_owner_reviews]=false \
        -f required_pull_request_reviews[required_approving_review_count]=1 \
        -f restrictions=null \
        -f required_linear_history=false \
        -f allow_force_pushes=false \
        -f allow_deletions=false \
        -f block_creations=false \
        -f required_conversation_resolution=true \
        -f lock_branch=false \
        -f allow_fork_syncing=true
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Successfully configured protection for $BRANCH${NC}"
    else
        echo -e "${RED}✗ Failed to configure protection for $BRANCH${NC}"
        return 1
    fi
    echo ""
}

# Configure main branch
echo "=== Main Branch Protection ==="
configure_branch_protection "main" "$REPO"

# Configure develop branch
echo "=== Develop Branch Protection ==="
configure_branch_protection "develop" "$REPO"

echo -e "${GREEN}Branch protection configuration complete!${NC}"
echo ""
echo "Summary of protection rules:"
echo "  ✓ Required status checks: quality, test, integration-tests, build"
echo "  ✓ Require branches to be up to date before merging"
echo "  ✓ Require 1 approving review"
echo "  ✓ Dismiss stale reviews when new commits are pushed"
echo "  ✓ Require conversation resolution before merging"
echo "  ✓ Prevent force pushes"
echo "  ✓ Prevent branch deletion"
echo ""
echo "You can view and modify these settings at:"
echo "  https://github.com/$REPO/settings/branches"
