#!/bin/bash

# Create environment templates directory
mkdir -p config/env-templates

# Move specialized environment files to templates
mv .env.crm.example config/env-templates/
mv .env.knowledge-base.example config/env-templates/
mv .env.migration.example config/env-templates/

# Keep main environment files in root
# .env.example - main development template
# .env.production.example - production template

# Create environment documentation
cat > config/env-templates/README.md << 'EOF'
# Environment Templates

This directory contains specialized environment templates for specific features or deployment scenarios.

## Files

- `env.crm.example` - CRM integration variables (Follow Up Boss, HubSpot, etc.)
- `env.knowledge-base.example` - Knowledge base and vector database configuration
- `env.migration.example` - Firebase to AWS migration settings

## Usage

Copy the relevant template to your main `.env.local` or `.env.production` file and customize the values.

### For CRM Integration
```bash
cat config/env-templates/env.crm.example >> .env.local
```

### For Knowledge Base Features
```bash
cat config/env-templates/env.knowledge-base.example >> .env.local
```

### For Data Migration
```bash
cp config/env-templates/env.migration.example .env.migration
# Edit .env.migration with your values
```

## Main Environment Files

- `.env.example` - Complete development template (in project root)
- `.env.production.example` - Production template (in project root)
EOF

echo "✅ Environment files consolidated"
echo "📁 Specialized templates: config/env-templates/"
echo "📄 Main templates remain in root"
echo "📖 Documentation: config/env-templates/README.md"