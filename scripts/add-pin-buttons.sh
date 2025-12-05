#!/bin/bash

# Script to add pin buttons to pages that are missing them
# This ensures all main pages have consistent pin functionality

echo "=== Adding Pin Buttons to Pages ==="
echo ""

# List of pages that need pin buttons added
PAGES=(
    "src/app/(app)/dashboard/page.tsx"
    "src/app/(app)/intelligence/alerts/page.tsx"
    "src/app/(app)/intelligence/opportunities/page.tsx"
    "src/app/(app)/intelligence/analytics/page.tsx"
    "src/app/(app)/intelligence/knowledge/page.tsx"
    "src/app/(app)/tools/document-scanner/page.tsx"
    "src/app/(app)/learning/ai-plan/page.tsx"
    "src/app/(app)/settings/page.tsx"
    "src/app/(app)/studio/open-house/page.tsx"
)

echo "Pages to update:"
for page in "${PAGES[@]}"; do
    if [ -f "$page" ]; then
        echo "  ✓ $page"
    else
        echo "  ✗ $page (not found)"
    fi
done

echo ""
echo "=== Manual Review Required ==="
echo "Each page needs to be reviewed individually to determine the best placement for the pin button."
echo "Use the patterns documented in docs/PIN_BUTTON_STANDARDIZATION.md"
echo ""
