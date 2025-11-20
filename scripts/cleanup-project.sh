#!/bin/bash

# Project Cleanup Script
# Removes build artifacts, temporary files, and outdated code

echo "🧹 Starting project cleanup..."

# Remove build artifacts
echo "Removing build artifacts..."
rm -rf .next
rm -f tsconfig.tsbuildinfo
rm -f src/tailwind.config.ts

# Remove OS files
echo "Removing OS files..."
find . -name ".DS_Store" -type f -delete

# Remove empty or placeholder files
echo "Removing empty files..."
rm -f Reimagineq
rm -f DEMO_COMPONENTS_AUDIT.md

# Remove outdated Firebase compatibility shims
echo "Removing Firebase compatibility shims..."
rm -rf src/firebase

# Remove implementation markdown files from components
echo "Removing implementation docs from component directories..."
find src/components/ui/__tests__ -name "*.md" -type f -delete
find src/app -name "*IMPLEMENTATION*.md" -type f -delete
find src/app -name "*TASK_*.md" -type f -delete

# Remove outdated backend schema
echo "Removing outdated backend schema..."
rm -f docs/backend.json

echo "✅ Cleanup complete!"
echo ""
echo "📊 Summary:"
echo "  - Removed build artifacts (.next, *.tsbuildinfo)"
echo "  - Removed OS files (.DS_Store)"
echo "  - Removed Firebase compatibility layer"
echo "  - Removed implementation docs from component directories"
echo "  - Removed outdated backend schema"
echo ""
echo "💡 Next steps:"
echo "  1. Run 'npm run build' to verify everything still works"
echo "  2. Run 'npm test' to ensure tests pass"
echo "  3. Commit the cleaned-up codebase"
