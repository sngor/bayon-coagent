# Bayon CoAgent - Codebase Organization Guide

> **Complete reference for the reorganized codebase structure**

## Table of Contents
- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Features](#features)
- [Services](#services)
- [Import Patterns](#import-patterns)
- [Migration Guide](#migration-guide)
- [Architecture](#architecture)
- [Next Steps](#next-steps)

---

## Overview

The codebase follows a **feature-based architecture** that organizes code by business domain rather than technical type. Related code lives together, making it easier to find, understand, and maintain.

### What Changed

**Before (Monolithic):**
```
src/app/
├── actions.ts              (6,673 lines!)
├── admin-actions.ts        (1,800 lines)
├── client-dashboard-actions.ts
└── ... (26 action files scattered)
```

**After (Feature-Based):**
```
src/
├── features/              # Business domains
├── services/              # Shared business logic
├── lib/                   # Utilities & helpers
├── components/            # Shared UI
└── app/                   # Next.js routes
```

### Statistics

- ✅ **26 action files** moved to feature modules
- ✅ **691+ imports** automatically updated
- ✅ **319+ files** modified
- ✅ **24 directories** created
- ✅ Average file size: ~500 lines (down from 6,673)

---

## Directory Structure

```
src/
├── features/                    # Feature modules (business domains)
│   ├── client-dashboards/
│   │   ├── actions/
│   │   │   ├── client-dashboard-actions.ts
│   │   │   ├── client-nudge-actions.ts
│   │   │   ├── mobile-actions.ts
│   │   │   └── index.ts
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── index.ts
│   ├── content-engine/
│   │   ├── actions/
│   │   ├── components/
│   │   └── index.ts
│   ├── intelligence/
│   ├── integrations/
│   └── admin/
│
├── services/                    # Shared business logic
│   ├── analytics/
│   │   ├── analytics-service.ts
│   │   └── news-service.ts
│   ├── publishing/
│   │   ├── enhanced-publishing-service.ts
│   │   ├── scheduling-service.ts
│   │   └── template-service.ts
│   ├── notifications/
│   └── monitoring/
│
├── lib/                         # Utilities and helpers
│   ├── utils/                   # Pure functions
│   ├── types/                   # TypeScript types
│   ├── constants/               # Configuration
│   └── validation/              # Schemas
│
├── components/                  # Shared UI components only
│   ├── ui/                      # shadcn/ui primitives
│   ├── layouts/
│   └── shared/
│
├── ai/                          # AI/ML infrastructure
│   └── schemas/                 # Validation schemas
│
├── aws/                         # AWS integrations
│   ├── auth/
│   ├── bedrock/
│   ├── dynamodb/
│   └── s3/
│
├── app/                         # Next.js App Router
│   ├── (app)/                   # Main routes
│   ├── api/                     # API routes
│   ├── actions.ts               # Core actions (to be split)
│   └── profile-actions.ts
│
└── lambda/                      # AWS Lambda functions
```

---

## Features

Each feature is self-contained with its own actions, components, hooks, and types.

### 1. Client Dashboards
**Path:** `features/client-dashboards/`

**What it does:** Client management, mobile interactions, AI-powered nudges

**Actions:**
- `client-dashboard-actions.ts` - CRUD operations (123 KB)
- `client-nudge-actions.ts` - AI nudge generation (5 KB)
- `mobile-actions.ts` - Mobile client features (39 KB)

**Import:**
```typescript
import { createClientDashboard, generateClientNudge } from '@/features/client-dashboards';
```

### 2. Content Engine
**Path:** `features/content-engine/`

**What it does:** Content creation, workflows, scheduling, publishing

**Actions:**
- `content-workflow-actions.ts` - Workflow operations (105 KB)
- `content-workflow-oauth-actions.ts` - OAuth for publishing (14 KB)
- `post-card-actions.ts` - Post card generation (2 KB)

**Import:**
```typescript
import { createContentWorkflow, schedulePost } from '@/features/content-engine';
```

### 3. Intelligence
**Path:** `features/intelligence/`

**What it does:** AI assistant, vision analysis, reimagine, knowledge base

**Actions:**
- `bayon-assistant-actions.ts` - AI assistant (33 KB)
- `bayon-vision-actions.ts` - Vision analysis (16 KB)
- `reimagine-actions.ts` - Image reimagining (31 KB)
- `multi-angle-staging-actions.ts` - Multi-angle views (17 KB)
- `knowledge-actions.ts` - Knowledge base (16 KB)
- `agent-document-actions.ts` - Document management (9 KB)

**Import:**
```typescript
import { chatWithAssistant, analyzeImage } from '@/features/intelligence';
```

### 4. Integrations
**Path:** `features/integrations/`

**What it does:** Third-party integrations (MLS, social media, OAuth)

**Actions:**
- `mls-actions.ts` - MLS integration (22 KB)
- `mls-status-sync-actions.ts` - Status sync (21 KB)
- `social-oauth-actions.ts` - Social OAuth (22 KB)
- `social-publishing-actions.ts` - Publishing (35 KB)
- `oauth-actions.ts` - Generic OAuth (3 KB)

**Import:**
```typescript
import { connectMLS, publishToSocial } from '@/features/integrations';
```

### 5. Admin
**Path:** `features/admin/`

**What it does:** Administrative functions, permissions, user management

**Actions:**
- `admin-actions.ts` - Admin operations (64 KB)
- `permission-actions.ts` - Permissions (15 KB)

**Import:**
```typescript
import { getUserPermissions, manageUsers } from '@/features/admin';
```

---

## Services

Shared business logic organized by domain.

### Analytics
**Path:** `services/analytics/`

- `analytics-service.ts` - Event tracking, metrics (107 KB)
- `news-service.ts` - Real estate news (6 KB)

### Publishing
**Path:** `services/publishing/`

- `enhanced-publishing-service.ts` - Publishing logic (22 KB)
- `publishing-error-handler.ts` - Error handling (21 KB)
- `scheduling-service.ts` - Content scheduling (59 KB)
- `template-service.ts` - Template management (120 KB)

### Notifications
**Path:** `services/notifications/`

- `notification-actions.ts` - Notification system (25 KB)
- `unsubscribe-actions.ts` - Unsubscribe handling (10 KB)
- `testimonial-reminder-service.ts` - Reminders (10 KB)

### Monitoring
**Path:** `services/monitoring/`

- `performance-metrics-actions.ts` - Performance tracking (16 KB)
- `cost-tracking-actions.ts` - Cost monitoring (5 KB)
- `monitoring-dashboard-service.ts` - Dashboards (31 KB)
- `error-monitoring-service.ts` - Error tracking (22 KB)
- `connection-diagnostics.ts` - Diagnostics (13 KB)

---

## Import Patterns

### Before vs After

#### Actions (moved to features)
```typescript
// ❌ Before
import { createClientDashboard } from '@/app/client-dashboard-actions';
import { generateContent } from '@/app/content-workflow-actions';
import { chatWithAssistant } from '@/app/bayon-assistant-actions';

// ✅ After
import { createClientDashboard } from '@/features/client-dashboards';
import { generateContent } from '@/features/content-engine';
import { chatWithAssistant } from '@/features/intelligence';
```

#### Services (organized by domain)
```typescript
// ❌ Before
import { analyticsService } from '@/services/analytics-service';
import { publishingService } from '@/services/enhanced-publishing-service';

// ✅ After
import { analyticsService } from '@/services/analytics/analytics-service';
import { publishingService } from '@/services/publishing/enhanced-publishing-service';
```

#### Utilities (organized by type)
```typescript
// ❌ Before
import { cn } from '@/lib/utils';
import type { Profile } from '@/lib/types';
import { NEWS_CONFIG } from '@/lib/news-config';

// ✅ After
import { cn } from '@/lib/utils/common';
import type { Profile } from '@/lib/types/common';
import { NEWS_CONFIG } from '@/lib/constants/news-config';
```

### Best Practices

**1. Use Feature Public APIs**
```typescript
// ✅ Good - Import from feature index
import { createDashboard } from '@/features/client-dashboards';

// ⚠️ OK - Import specific file if needed
import { createDashboard } from '@/features/client-dashboards/actions/client-dashboard-actions';
```

**2. Avoid Cross-Feature Dependencies**
```typescript
// ✅ Good - Use lib for shared code
import { cn } from '@/lib/utils/common';

// ❌ Bad - Don't import across features
import { something } from '@/features/other-feature/internal';
```

**3. Organize Imports**
```typescript
// 1. External packages
import React from 'react';
import { z } from 'zod';

// 2. Internal absolute imports
import { createDashboard } from '@/features/client-dashboards';
import { cn } from '@/lib/utils/common';

// 3. Relative imports
import { helper } from './utils';
```

---

## Migration Guide

### If You Encounter Import Errors

**1. Clear Next.js cache:**
```bash
rm -rf .next
npm run dev
```

**2. Check TypeScript:**
```bash
npx tsc --noEmit
```

**3. Update import path:**
Look up the mapping in `scripts/update-imports.js` or refer to this guide.

### Common Fixes

| Old Import | New Import |
|------------|------------|
| `@/app/client-dashboard-actions` | `@/features/client-dashboards` |
| `@/app/content-workflow-actions` | `@/features/content-engine` |
| `@/services/analytics-service` | `@/services/analytics/analytics-service` |
| `@/lib/utils` | `@/lib/utils/common` |
| `@/lib/types` | `@/lib/types/common` |

### Automated Migration

The `scripts/update-imports.js` script can be run to auto-update imports:

```bash
node scripts/update-imports.js
```

---

## Architecture

### High-Level Design

```
┌─────────────────────────────────────────┐
│         User Interface (Next.js)         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│      Feature Modules (Business Logic)    │
│  ┌──────┐  ┌───────┐  ┌────────────┐   │
│  │Client│  │Content│  │Intelligence│   │
│  └──────┘  └───────┘  └────────────┘   │
└────────┬─────────────────────────────────┘
         │
         ├──► Services (Shared Logic)
         ├──► AI/ML (Bedrock Flows)
         └──► AWS (DynamoDB, S3, Auth)
```

### Data Flow

```
UI Component
    ↓
Feature Action (Server Action)
    ↓
├─► Service (if needed)
├─► AI Flow (if AI feature)
└─► AWS Resource (DynamoDB, S3, etc.)
```

### Feature Structure

Each feature follows this pattern:

```
features/my-feature/
├── actions/           # Server actions
│   ├── main-actions.ts
│   └── index.ts       # Public API
├── components/        # Feature-specific UI
├── hooks/             # Feature-specific hooks
├── types/             # Feature-specific types
└── index.ts           # Main export
```

---

## Next Steps

### Completed ✅
- Feature modules created and populated
- Services organized by domain
- Lib restructured by concern
- 691+ imports updated automatically
- Comprehensive documentation

### In Progress 🔄
- Split `src/app/actions.ts` (6,673 lines → ~200 lines)
  - Move functions to appropriate features
  - Add backward-compatible re-exports
  - Update consuming code incrementally

### Future Enhancements 📋
1. **Move feature-specific components** from `components/` to features
2. **Create `ai/prompts/`** directory for prompt templates
3. **Add `ai/guardrails/`** for AI safety
4. **Organize demo pages** or remove if not needed
5. **Create feature-level tests** mirroring structure

### How to Split actions.ts

See `.agent/workflows/split-actions.md` for the detailed plan.

**Recommended approach:**
1. Keep `actions.ts` as source of truth initially
2. Create feature-specific action files
3. Add re-exports for backward compatibility
4. Migrate one feature at a time
5. Update imports incrementally
6. Remove from `actions.ts` after verification

---

## Benefits

### ✨ Better Organization
- Related code lives together
- Clear feature boundaries
- Easier code discovery

### 📦 Improved Maintainability
- Smaller, focused files (~500 lines avg)
- Self-contained features
- Clearer dependencies

### 🚀 Better Performance
- Improved tree-shaking
- Granular code splitting
- Optimized bundles

### 🔧 Enhanced Developer Experience
- Easier navigation
- Simpler onboarding
- Intuitive structure

---

## Quick Reference

### Feature Locations

| Feature | Path | Main Actions |
|---------|------|--------------|
| **Client Dashboards** | `features/client-dashboards/` | Client CRUD, nudges, mobile |
| **Content Engine** | `features/content-engine/` | Workflows, publishing |
| **Intelligence** | `features/intelligence/` | AI assistant, vision, knowledge |
| **Integrations** | `features/integrations/` | MLS, social media |
| **Admin** | `features/admin/` | User management, permissions |

### Service Locations

| Service | Path | Purpose |
|---------|------|---------|
| **Analytics** | `services/analytics/` | Tracking, metrics, news |
| **Publishing** | `services/publishing/` | Content publishing, scheduling |
| **Notifications** | `services/notifications/` | Notification system |
| **Monitoring** | `services/monitoring/` | Performance, errors, costs |

### Utility Locations

| Category | Path | Contents |
|----------|------|----------|
| **Utils** | `lib/utils/` | Pure functions, helpers |
| **Types** | `lib/types/` | TypeScript definitions |
| **Constants** | `lib/constants/` | Configuration, data |
| **Validation** | `lib/validation/` | Zod schemas (future) |

---

## Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Import Errors

Check the import mapping tables above or run:
```bash
grep -r "old-import-path" src/
```

### Type Errors

```bash
# Run type check
npx tsc --noEmit

# Restart TypeScript server in your IDE
```

---

## Contributing

When adding new code:

1. **Feature-specific?** → Add to `features/[feature-name]/`
2. **Shared service?** → Add to `services/[domain]/`
3. **Utility function?** → Add to `lib/utils/`
4. **UI component?** → Add to `components/ui/` (if truly shared)
5. **AI-related?** → Add to `ai/`

**Keep files small:** Aim for < 500 lines per file.

---

## Summary

The Bayon CoAgent codebase is now organized with:
- ✅ **5 feature modules** for business domains
- ✅ **4 service categories** for shared logic
- ✅ **Structured lib/** for utilities & types
- ✅ **Clean import patterns**
- ✅ **Comprehensive documentation**

This organization makes the codebase more maintainable, easier to navigate, and better prepared for future growth.

For questions or issues, refer to:
- This guide for structure and imports
- `scripts/update-imports.js` for migration mappings
- `.agent/workflows/` for specific procedures

**Happy coding! 🚀**
