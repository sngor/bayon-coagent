#!/bin/bash

# Create script directories
mkdir -p scripts/deployment
mkdir -p scripts/migration
mkdir -p scripts/development
mkdir -p scripts/maintenance

# Move deployment scripts
mv deploy-*.sh scripts/deployment/
mv cleanup-*-regions.sh scripts/deployment/
mv verify-*-setup.sh scripts/deployment/
mv update-env-*.sh scripts/deployment/

# Move migration scripts
mv migration-to-*.md scripts/migration/

# Move development scripts
mv diagnose-*.js scripts/development/ 2>/dev/null || true

# Move maintenance scripts
mv cleanup-root-docs.sh scripts/maintenance/
mv organize-test-files.sh scripts/maintenance/
mv organize-scripts.sh scripts/maintenance/

# Move configuration files to appropriate locations
mkdir -p config
mv cors-config.json config/
mv cloudwatch-dashboard.json config/
mv lighthouserc.js config/

echo "✅ Scripts organized"
echo "🚀 Deployment: scripts/deployment/"
echo "🔄 Migration: scripts/migration/"
echo "🛠️  Development: scripts/development/"
echo "🧹 Maintenance: scripts/maintenance/"
echo "⚙️  Config: config/"