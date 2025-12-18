#!/bin/bash

# Setup Cron Notifications via EventBridge
# This script configures automated trial expiry notifications

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔔 Setting up Trial Notification Cron Job${NC}"
echo "=============================================="

# Configuration
AWS_REGION="us-west-2"
RULE_NAME="daily-trial-notifications"
API_URL="https://bayoncoagent.app/api/cron/trial-notifications"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "AWS Region: $AWS_REGION"
echo "Rule Name: $RULE_NAME"
echo "API URL: $API_URL"
echo ""

# Check if rule exists
echo -e "${BLUE}🔍 Checking EventBridge rule...${NC}"
if aws events describe-rule --name "$RULE_NAME" --region "$AWS_REGION" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Rule '$RULE_NAME' exists${NC}"
else
    echo -e "${YELLOW}⚠️  Rule '$RULE_NAME' not found, creating...${NC}"
    aws events put-rule \
        --name "$RULE_NAME" \
        --schedule-expression "cron(0 12 * * ? *)" \
        --description "Daily trial expiry notifications at 12 PM UTC" \
        --region "$AWS_REGION"
    echo -e "${GREEN}✅ Rule created${NC}"
fi

echo ""
echo -e "${YELLOW}📝 Cron Job Options:${NC}"
echo ""
echo -e "${BLUE}Option 1: External Cron Service (Recommended)${NC}"
echo "Use a service like cron-job.org or EasyCron:"
echo "• URL: $API_URL"
echo "• Method: POST"
echo "• Schedule: Daily at 12:00 PM UTC (0 12 * * *)"
echo "• Headers: Authorization: Bearer YOUR_CRON_SECRET_TOKEN"
echo ""

echo -e "${BLUE}Option 2: Vercel Cron Jobs${NC}"
echo "Add to vercel.json:"
echo '{'
echo '  "crons": ['
echo '    {'
echo '      "path": "/api/cron/trial-notifications",'
echo '      "schedule": "0 12 * * *"'
echo '    }'
echo '  ]'
echo '}'
echo ""

echo -e "${BLUE}Option 3: GitHub Actions (Free)${NC}"
echo "Create .github/workflows/cron-notifications.yml:"
echo 'name: Trial Notifications'
echo 'on:'
echo '  schedule:'
echo '    - cron: "0 12 * * *"'
echo 'jobs:'
echo '  notify:'
echo '    runs-on: ubuntu-latest'
echo '    steps:'
echo '      - name: Send notifications'
echo '        run: |'
echo '          curl -X POST "${{ secrets.APP_URL }}/api/cron/trial-notifications" \'
echo '            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_TOKEN }}"'
echo ""

echo -e "${GREEN}🎯 Recommended Setup:${NC}"
echo "1. Go to https://cron-job.org"
echo "2. Create free account"
echo "3. Add new cron job:"
echo "   - URL: $API_URL"
echo "   - Schedule: 0 12 * * * (daily at 12 PM UTC)"
echo "   - Method: POST"
echo "   - Headers: Authorization: Bearer YOUR_CRON_SECRET_TOKEN"
echo ""

echo -e "${YELLOW}⚠️  Important:${NC}"
echo "• Set CRON_SECRET_TOKEN in your environment variables"
echo "• Use a secure random token (32+ characters)"
echo "• Test the endpoint manually first"
echo ""

echo -e "${BLUE}🧪 Test the endpoint:${NC}"
echo "curl -X POST '$API_URL' \\"
echo "  -H 'Authorization: Bearer YOUR_CRON_SECRET_TOKEN' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

echo -e "${GREEN}✅ Setup guide complete!${NC}"