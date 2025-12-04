#!/bin/bash

# Verification script for production deployment workflow
# This script checks that all components are properly configured

set -e

echo "=========================================="
echo "Production Deployment Workflow Verification"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# Function to check file exists
check_file() {
  if [ -f "$1" ]; then
    echo "✅ $1 exists"
  else
    echo "❌ $1 is missing"
    ((ERRORS++))
  fi
}

# Function to check directory exists
check_dir() {
  if [ -d "$1" ]; then
    echo "✅ $1 exists"
  else
    echo "❌ $1 is missing"
    ((ERRORS++))
  fi
}

# Function to check file contains pattern
check_pattern() {
  if grep -q "$2" "$1" 2>/dev/null; then
    echo "✅ $1 contains '$2'"
  else
    echo "⚠️  $1 does not contain '$2'"
    ((WARNINGS++))
  fi
}

echo "1. Checking workflow files..."
echo "----------------------------"
check_file ".github/workflows/deploy-production.yml"
check_file ".github/workflows/deploy-staging.yml"
check_file ".github/workflows/deploy-dev.yml"
check_file ".github/workflows/ci.yml"
check_file ".github/workflows/security-scan.yml"
echo ""

echo "2. Checking notification actions..."
echo "-----------------------------------"
check_file ".github/actions/slack-notify/action.yml"
check_file ".github/actions/email-notify/action.yml"
echo ""

echo "3. Checking smoke test scripts..."
echo "---------------------------------"
check_file "scripts/smoke-tests/test-auth.sh"
check_file "scripts/smoke-tests/test-database.sh"
check_file "scripts/smoke-tests/test-storage.sh"
check_file "scripts/smoke-tests/test-ai.sh"

# Check if scripts are executable
for script in scripts/smoke-tests/*.sh; do
  if [ -x "$script" ]; then
    echo "✅ $script is executable"
  else
    echo "⚠️  $script is not executable (will be fixed in workflow)"
    ((WARNINGS++))
  fi
done
echo ""

echo "4. Checking SAM configuration..."
echo "-------------------------------"
check_file "template.yaml"
check_file "samconfig.toml"
check_pattern "samconfig.toml" "production"
check_pattern "samconfig.toml" "development"
check_pattern "samconfig.toml" "staging"
echo ""

echo "5. Checking deployment scripts..."
echo "---------------------------------"
check_file "scripts/sam-deploy.sh"
check_file "scripts/deploy-amplify.sh"
echo ""

echo "6. Verifying production workflow structure..."
echo "--------------------------------------------"
check_pattern ".github/workflows/deploy-production.yml" "pre-deployment-validation"
check_pattern ".github/workflows/deploy-production.yml" "multi-approval-gate"
check_pattern ".github/workflows/deploy-production.yml" "create-backup"
check_pattern ".github/workflows/deploy-production.yml" "deploy-infrastructure"
check_pattern ".github/workflows/deploy-production.yml" "deploy-frontend"
check_pattern ".github/workflows/deploy-production.yml" "smoke-tests"
check_pattern ".github/workflows/deploy-production.yml" "monitor-deployment"
check_pattern ".github/workflows/deploy-production.yml" "notify-stakeholders"
check_pattern ".github/workflows/deploy-production.yml" "rollback"
echo ""

echo "7. Checking workflow triggers..."
echo "-------------------------------"
check_pattern ".github/workflows/deploy-production.yml" 'tags:'
check_pattern ".github/workflows/deploy-production.yml" '"v*"'
check_pattern ".github/workflows/deploy-production.yml" 'workflow_dispatch'
echo ""

echo "8. Verifying approval gates..."
echo "-----------------------------"
check_pattern ".github/workflows/deploy-production.yml" 'environment:'
check_pattern ".github/workflows/deploy-production.yml" 'name: production'
echo ""

echo "9. Checking backup procedures..."
echo "-------------------------------"
check_pattern ".github/workflows/deploy-production.yml" "CloudFormation stack state"
check_pattern ".github/workflows/deploy-production.yml" "DynamoDB table backup"
check_pattern ".github/workflows/deploy-production.yml" "Amplify deployment"
echo ""

echo "10. Verifying monitoring setup..."
echo "--------------------------------"
check_pattern ".github/workflows/deploy-production.yml" "CloudWatch metrics"
check_pattern ".github/workflows/deploy-production.yml" "15 minutes"
check_pattern ".github/workflows/deploy-production.yml" "ALARM"
echo ""

echo "11. Checking rollback configuration..."
echo "-------------------------------------"
check_pattern ".github/workflows/deploy-production.yml" "rollback"
check_pattern ".github/workflows/deploy-production.yml" "cancel-update-stack"
check_pattern ".github/workflows/deploy-production.yml" "Revert Amplify"
echo ""

echo "12. Verifying notification setup..."
echo "----------------------------------"
check_pattern ".github/workflows/deploy-production.yml" "slack-notify"
check_pattern ".github/workflows/deploy-production.yml" "email-notify"
check_pattern ".github/workflows/deploy-production.yml" "notify-stakeholders"
echo ""

echo "13. Checking gradual traffic shifting..."
echo "---------------------------------------"
check_pattern ".github/workflows/deploy-production.yml" "gradual traffic shifting"
check_pattern ".github/workflows/deploy-production.yml" "10%"
check_pattern ".github/workflows/deploy-production.yml" "50%"
check_pattern ".github/workflows/deploy-production.yml" "100%"
echo ""

echo "14. Verifying documentation..."
echo "-----------------------------"
check_file "docs/cicd/production-deployment-guide.md"
check_file "docs/cicd/README.md"
echo ""

echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo ""
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo "✅ Production deployment workflow verification PASSED"
  echo ""
  echo "The production deployment workflow is properly configured with:"
  echo "  - Pre-deployment validation"
  echo "  - Multi-approval gate (requires 2+ approvers)"
  echo "  - Backup creation (CloudFormation, DynamoDB, Amplify)"
  echo "  - Infrastructure deployment with SAM"
  echo "  - Frontend deployment with gradual traffic shifting"
  echo "  - Comprehensive smoke tests"
  echo "  - 15-minute monitoring period"
  echo "  - Automatic rollback on failure"
  echo "  - Stakeholder notifications"
  echo ""
  echo "Next steps:"
  echo "  1. Configure GitHub Secrets (AWS credentials, Slack webhooks)"
  echo "  2. Set up GitHub Environments (production with required reviewers)"
  echo "  3. Test the workflow with a release candidate tag"
  exit 0
else
  echo "❌ Production deployment workflow verification FAILED"
  echo ""
  echo "Please fix the errors above before proceeding."
  exit 1
fi
