---
description: Codebase Reorganization Plan
---

# Codebase Reorganization Plan

## Overview
This plan reorganizes the codebase to improve maintainability, discoverability, and follow Next.js best practices with a feature-based architecture.

## Current Issues

1. **Monolithic actions.ts** (6,674 lines) - Contains all server actions
2. **26+ separate action files** in `/src/app` - Should be colocated with features
3. **Duplicate .js/.ts files** in services directory
4. **AI code scattered** across `/src/ai` and `/src/aws/bedrock`
5. **Mixed concerns** in `/src/lib` directory
6. **Demo pages** cluttering main app routes
7. **No clear feature boundaries**

## Proposed Structure

### 1. Feature-Based Organization

```
src/
├── features/                    # Feature modules (NEW)
│   ├── content-engine/
│   │   ├── actions/
│   │   │   ├── blog-post-actions.ts
│   │   │   ├── social-post-actions.ts
│   │   │   └── video-script-actions.ts
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── index.ts
│   ├── client-dashboards/
│   │   ├── actions/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   ├── intelligence/           # Market analysis, research, etc.
│   │   ├── actions/
│   │   ├── components/
│   │   └── index.ts
│   ├── brand/                  # NAP audit, competitor analysis
│   │   ├── actions/
│   │   ├── components/
│   │   └── index.ts
│   ├── integrations/          # MLS, Social OAuth, etc.
│   │   ├── actions/
│   │   ├── components/
│   │   └── index.ts
│   └── admin/
│       ├── actions/
│       ├── components/
│       └── index.ts
│
├── ai/                         # AI/ML related code
│   ├── flows/                 # Bedrock flows
│   ├── schemas/               # Zod schemas
│   ├── prompts/               # Prompt templates (NEW)
│   └── guardrails/            # AI safety
│
├── lib/                       # Shared utilities
│   ├── utils/                 # Pure utility functions
│   ├── hooks/                 # Shared custom hooks
│   ├── types/                 # Shared TypeScript types
│   ├── constants/             # App constants
│   └── validation/            # Shared validation schemas
│
├── services/                  # Business logic services
│   ├── analytics/
│   ├── notifications/
│   ├── publishing/
│   └── monitoring/
│
├── components/                # Shared UI components only
│   ├── ui/                   # shadcn/ui components
│   ├── layouts/
│   └── shared/
│
├── app/                       # Next.js App Router
│   ├── (app)/                # Main app routes
│   ├── (legal)/              # Legal pages
│   ├── api/                  # API routes
│   └── actions.ts            # ONLY core auth/session actions
```

## Migration Steps

### Phase 1: Create Feature Modules (Week 1)

1. **Create feature directories**
   ```bash
   mkdir -p src/features/{content-engine,client-dashboards,intelligence,brand,integrations,admin}/{actions,components,hooks,types}
   ```

2. **Move content-engine related code**
   - `content-workflow-actions.ts` → `features/content-engine/actions/`
   - `content-workflow-oauth-actions.ts` → `features/content-engine/actions/`
   - Split into smaller files by concern

3. **Move client-dashboards code**
   - `client-dashboard-actions.ts` → `features/client-dashboards/actions/`
   - `client-nudge-actions.ts` → `features/client-dashboards/actions/`
   - Related components from `/components/client-dashboard/`

4. **Move intelligence features**
   - Research agent, property valuation, market analysis
   - From `actions.ts` to `features/intelligence/actions/`

5. **Move brand features**
   - NAP audit, competitor analysis
   - From `actions.ts` to `features/brand/actions/`

### Phase 2: Consolidate AI Code (Week 2)

1. **Organize AI flows**
   ```
   ai/
   ├── flows/
   │   ├── content-generation/
   │   ├── market-analysis/
   │   ├── research/
   │   └── vision/
   ```

2. **Move schemas next to flows**
   - Keep related schemas with their flows

3. **Extract prompts**
   - Create `ai/prompts/` directory
   - Extract hardcoded prompts from flows

### Phase 3: Clean Up Services (Week 2)

1. **Remove duplicate .js files**
   - Keep only .ts versions
   - Update any imports

2. **Organize by domain**
   ```
   services/
   ├── analytics/
   │   ├── analytics-service.ts
   │   └── external-analytics-sync.ts
   ├── publishing/
   │   ├── publishing-service.ts
   │   ├── publishing-error-handler.ts
   │   └── scheduling-service.ts
   ```

### Phase 4: Refactor Lib Directory (Week 3)

1. **Separate concerns**
   ```
   lib/
   ├── utils/              # Pure functions
   ├── hooks/              # Shared React hooks
   ├── types/              # TypeScript types
   ├── constants/          # Configuration constants
   └── validation/         # Shared Zod schemas
   ```

2. **Move feature-specific code to feature modules**

### Phase 5: Clean Up Components (Week 3)

1. **Move feature components to feature modules**
   - Client dashboard components → `features/client-dashboards/components/`
   - Bayon assistant → `features/assistant/components/`

2. **Keep only truly shared components** in `/components`
   - UI primitives
   - Layout components
   - Shared widgets

### Phase 6: Organize Demo Pages (Week 4)

1. **Create dedicated demos directory**
   ```
   app/
   ├── (app)/
   └── (demos)/           # Group all demo pages
       ├── animations/
       ├── mobile/
       └── performance/
   ```

2. **Or remove demos** if not needed in production

### Phase 7: Split Monolithic Files (Week 4)

1. **Break down actions.ts**
   - Keep only core auth/session actions
   - Move everything else to feature modules

2. **Organize by concern**
   - Each feature has its own action files
   - Max 300-500 lines per file

## Benefits

✅ **Better Organization** - Related code lives together
✅ **Easier Navigation** - Find code by feature, not by type
✅ **Improved Maintainability** - Smaller, focused files
✅ **Clearer Boundaries** - Features are self-contained
✅ **Easier Testing** - Test features in isolation
✅ **Better Performance** - Tree-shaking and code splitting
✅ **Onboarding** - New developers can understand features quickly

## Migration Checklist

- [ ] Phase 1: Create feature modules
- [ ] Phase 2: Consolidate AI code
- [ ] Phase 3: Clean up services
- [ ] Phase 4: Refactor lib directory
- [ ] Phase 5: Clean up components
- [ ] Phase 6: Organize demo pages
- [ ] Phase 7: Split monolithic files
- [ ] Update all imports across codebase
- [ ] Run tests to verify nothing broke
- [ ] Update documentation

## Risks & Mitigation

**Risk**: Breaking imports across the codebase
**Mitigation**: 
- Use TypeScript to catch import errors
- Update incrementally, one module at a time
- Run tests after each migration step

**Risk**: Merge conflicts if team is actively developing
**Mitigation**:
- Coordinate with team
- Do migration during quiet period
- Use feature branches

## Success Metrics

- [ ] No file over 500 lines
- [ ] All features self-contained in feature modules
- [ ] No duplicate .js/.ts files
- [ ] All tests passing
- [ ] Build succeeds
- [ ] Bundle size maintained or reduced
