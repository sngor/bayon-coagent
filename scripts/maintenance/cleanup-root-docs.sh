#!/bin/bash

# Create docs/archive directory for old documentation
mkdir -p docs/archive

# Move completed project documentation to archive
mv EXECUTIVE_SUMMARY.md docs/archive/
mv FINAL_RECOMMENDATION.md docs/archive/
mv WHATS_NEXT.md docs/archive/
mv *_SUMMARY.md docs/archive/
mv *_COMPLETE.md docs/archive/
mv MIGRATION_*.md docs/archive/
mv CONSOLIDATION_*.md docs/archive/
mv CLEANUP_*.md docs/archive/
mv INTEGRATION_GUIDE.md docs/archive/
mv NEXT_ACTIONS.md docs/archive/
mv QUICK_DEPLOY.md docs/archive/
mv SIDEBAR_REORGANIZATION.md docs/archive/
mv MLS_GRID_*.md docs/archive/

# Keep only essential root files
# README.md - main project readme
# CHANGELOG.md - version history
# Any active deployment/migration files

echo "✅ Root documentation cleaned up"
echo "📁 Archived files moved to docs/archive/"
echo "🧹 Root directory is now cleaner"