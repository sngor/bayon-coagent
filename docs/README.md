# Documentation Index

Welcome to the Bayon CoAgent documentation!

## 🎯 Quick Start

**New to the codebase?** Start here:
1. Read [`CODEBASE_ORGANIZATION.md`](./CODEBASE_ORGANIZATION.md) - Complete guide to the codebase structure
2. Check the project [`README.md`](../README.md) - Project overview and setup
3. Review [`.agent/workflows/`](../.agent/workflows/) - Common procedures and workflows

## 📚 Main Documentation

### Structure & Organization
- **[CODEBASE_ORGANIZATION.md](./CODEBASE_ORGANIZATION.md)** - ⭐ **START HERE**
  - Complete guide to the feature-based architecture
  - Directory structure and organization
  - Import patterns and migration guide
  - Feature and service reference
  - Troubleshooting and best practices

### AI & Models
- **[AI_MODEL_README.md](./AI_MODEL_README.md)** - AI model overview
- **[AI_MODEL_MIGRATION_GUIDE.md](./AI_MODEL_MIGRATION_GUIDE.md)** - Genkit to Bedrock migration
- **[AI_MODEL_DECISION_TREE.md](./AI_MODEL_DECISION_TREE.md)** - Model selection guide
- **[AI_MODEL_EVALUATION_SUMMARY.md](./AI_MODEL_EVALUATION_SUMMARY.md)** - Model comparisons
- **[AI_MODEL_OPTIMIZATION_RECOMMENDATIONS.md](./AI_MODEL_OPTIMIZATION_RECOMMENDATIONS.md)** - Optimization tips

### Features
- **[CLIENT_GIFTING_SYSTEM.md](./CLIENT_GIFTING_SYSTEM.md)** - Client gifting feature
- **[COACHING_MODE.md](./COACHING_MODE.md)** - AI coaching mode
- **[VOICE_ROLEPLAY_FEATURE.md](./VOICE_ROLEPLAY_FEATURE.md)** - Voice roleplay
- **[features/](./features/)** - Individual feature docs

### Infrastructure & Deployment
- **[deployment/](./deployment/)** - Deployment guides
- **[api-gateway-microservices.md](./api-gateway-microservices.md)** - API Gateway setup
- **[api-versioning-strategy.md](./api-versioning-strategy.md)** - API versioning
- **[aws-local-development.md](./aws-local-development.md)** - Local AWS setup
- **[secrets-management.md](./secrets-management.md)** - Secrets management
- **[sqs-queue-implementation.md](./sqs-queue-implementation.md)** - SQS queues

### UI & Components
- **[design-system/](./design-system/)** - Design system documentation
- **[component-library.md](./component-library.md)** - Component reference
- **[animation-implementation-guide.md](./animation-implementation-guide.md)** - Animations
- **[micro-animations.md](./micro-animations.md)** - Micro-interactions
- **[container-styling-guide.md](./container-styling-guide.md)** - Container patterns

### Best Practices
- **[best-practices.md](./best-practices.md)** - General best practices
- **[standardization-guide.md](./standardization-guide.md)** - Code standards
- **[refactoring-checklist.md](./refactoring-checklist.md)** - Refactoring guide
- **[feature-toggles.md](./feature-toggles.md)** - Feature flags

### Security
- **[SECURITY.md](./SECURITY.md)** - Security overview
- **[client-portal-security.md](./client-portal-security.md)** - Client portal security
- **[client-portal-authentication.md](./client-portal-authentication.md)** - Authentication

### Testing
- **[mobile-testing-checklist.md](./mobile-testing-checklist.md)** - Mobile testing
- **[mobile-test-report.md](./mobile-test-report.md)** - Test results
- **[xray-service-map-testing.md](./xray-service-map-testing.md)** - X-Ray tracing

### Other
- **[guides/](./guides/)** - How-to guides
- **[quick-reference/](./quick-reference/)** - Quick reference sheets
- **[archive/](./archive/)** - Archived docs

## 🔧 Workflows

Common procedures and workflows are in [`.agent/workflows/`](../.agent/workflows/):

- **`split-actions.md`** - Plan for splitting the monolithic actions.ts
- **`reorganize-codebase.md`** - Codebase reorganization plan
- And more...

## 🗺️ Navigation Tips

### By Role

**Developer (New to Codebase):**
1. CODEBASE_ORGANIZATION.md
2. best-practices.md
3. quick-reference.md

**Designer:**
1. design-system/
2. component-library.md
3. animation-implementation-guide.md

**DevOps:**
1. deployment/
2. aws-local-development.md
3. secrets-management.md

**QA/Tester:**
1. mobile-testing-checklist.md
2. device-testing.md

### By Task

**Want to understand the codebase structure?**
→ CODEBASE_ORGANIZATION.md

**Need to add a new feature?**
→ CODEBASE_ORGANIZATION.md (Features section)
→ best-practices.md

**Working with AI models?**
→ AI_MODEL_README.md
→ AI_MODEL_DECISION_TREE.md

**Deploying to AWS?**
→ deployment/
→ aws-local-development.md

**Building UI components?**
→ component-library.md
→ design-system/

**Need to test?**
→ mobile-testing-checklist.md

## 📝 Contributing to Docs

When adding documentation:
1. Use clear, descriptive filenames
2. Add an entry to this README
3. Include a table of contents for long docs
4. Use markdown formatting consistently
5. Add code examples where helpful

## 🔍 Finding Information

**Can't find what you need?**
1. Check this README's table of contents
2. Search the docs folder: `grep -r "your topic" docs/`
3. Check `.agent/workflows/` for procedures
4. Review the main project README

## 📊 Documentation Statistics

- **Total docs:** 50+files
- **Guides:** 20+ guides
- **Features:** 25+ feature docs
- **Main reference:** CODEBASE_ORGANIZATION.md

---

**Last updated:** November 28, 2025  
**Most important doc:** [`CODEBASE_ORGANIZATION.md`](./CODEBASE_ORGANIZATION.md)
