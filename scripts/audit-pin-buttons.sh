#!/bin/bash

# Script to audit pin button usage across all pages
# This helps identify pages that need standardization

echo "=== Pin Button Audit ==="
echo ""

echo "Pages with FavoritesButton:"
echo "---"
grep -r "FavoritesButton" src/app/\(app\) --include="page.tsx" | cut -d: -f1 | sort | uniq
echo ""

echo "Pages with getPageConfig:"
echo "---"
grep -r "getPageConfig" src/app/\(app\) --include="page.tsx" | cut -d: -f1 | sort | uniq
echo ""

echo "Pages using HubLayoutWithFavorites:"
echo "---"
grep -r "HubLayoutWithFavorites" src/app/\(app\) --include="page.tsx" | cut -d: -f1 | sort | uniq
echo ""

echo "All page.tsx files:"
echo "---"
find src/app/\(app\) -name "page.tsx" -type f | grep -v "demo\|test" | sort
echo ""

echo "=== Audit Complete ==="
