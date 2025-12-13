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
