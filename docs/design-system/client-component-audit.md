# Client Component Audit

## Overview

This document identifies all components with 'use client' directives and categorizes them based on whether they can be converted to Server Components.

**Audit Date**: December 4, 2025
**Total Client Components Found**: 100+

## Conversion Categories

### ✅ Can Convert to Server Component

These components don't use client-side interactivity and can be converted:

1. **src/components/hub/hub-breadcrumbs.tsx**

   - Only renders static breadcrumb navigation
   - No hooks, no event handlers
   - Uses Link component (works in Server Components)
   - **Action**: Convert to Server Component

2. **src/components/aeo/aeo-score-card.tsx**

   - Pure presentational component
   - No state, no effects, no event handlers
   - Only displays data passed via props
   - **Action**: Convert to Server Component

3. **src/components/performance/optimized-image.tsx**
   - Uses useState for loading/error states
   - **Partial Conversion**: Extract loading/error logic to client wrapper
   - Core Image component can be server-side
   - **Action**: Create hybrid pattern

### ⚠️ Needs Refactoring (Hybrid Pattern)

These components have both server and client concerns:

1. **src/components/standard/form-field.tsx**

   - Mostly presentational
   - Uses React.cloneElement (client-side)
   - **Action**: Refactor to use composition instead of cloning

2. **src/app/(app)/layout.tsx**
   - Main app layout
   - Contains navigation and sidebar
   - **Action**: Extract interactive parts to separate client components

### ❌ Must Remain Client Component

These components require client-side interactivity:

#### Authentication & State Management

- src/aws/auth/use-user.tsx (hook)
- src/aws/auth/auth-provider.tsx (context provider)
- src/aws/client-provider.tsx (context provider)
- src/contexts/admin-context.tsx (context provider)

#### Data Hooks

- src/aws/dynamodb/hooks/use-query.tsx (hook)
- src/aws/dynamodb/hooks/use-item.tsx (hook)

#### Navigation & Routing

- src/components/hub/hub-tabs.tsx (uses usePathname, useRouter)
- src/components/hub/hub-layout.tsx (uses context)
- src/components/dynamic-navigation.tsx (uses usePathname)

#### Forms & Interactive Components

- src/features/calculators/components/mortgage-calculator.tsx (useState, useEffect)
- src/components/client-portal/client-login-form.tsx (form state)
- src/components/client-portal/setup-password-form.tsx (form state)
- src/components/project-selector.tsx (useState, useEffect)

#### Dashboards & Analytics

- src/components/analytics/roi-dashboard.tsx (interactive charts)
- src/components/analytics/performance-dashboard.tsx (interactive charts)
- src/components/analytics/cost-dashboard.tsx (interactive charts)
- src/components/analytics/analytics-overview.tsx (interactive charts)
- src/components/optimized-analytics-dashboard.tsx (useState, useMemo, useCallback)
- src/components/enhanced-dashboard.tsx (useMemo)

#### Notifications & Alerts

- src/lib/notifications/components/notification-center.tsx (state management)
- src/lib/notifications/components/notification-settings.tsx (useState, useEffect)
- src/components/notifications/notification-provider.tsx (context)
- src/components/notifications/notification-center.tsx (useState)
- src/components/notifications/notification-settings.tsx (useState, useEffect)
- src/components/alerts/notification-settings.tsx (interactive)
- src/components/alerts/digest-management.tsx (interactive)

#### Content & Streaming

- src/components/streaming-content.tsx (useState, useEffect)
- src/components/content-detail-modal.tsx (modal state)
- src/components/sharing-notifications.tsx (notifications)

#### AEO & SEO

- src/components/aeo/aeo-recommendations-list.tsx (useState)
- src/components/aeo/aeo-score-history-chart.tsx (chart)
- src/components/aeo/schema-markup-generator.tsx (form)
- src/components/schema-markup-example.tsx (useState)

#### Specialized Features

- src/components/coaching-mode.tsx (useState, useEffect, useCallback)
- src/components/social-proof-generator.tsx (useState, useEffect)
- src/components/ab-test-results-visualization.tsx (useState)
- src/components/neighborhood-profile/neighborhood-profile-generator.tsx (form)
- src/components/neighborhood-profile/regenerate-button.tsx (button with action)
- src/components/neighborhood-profile/neighborhood-profile-export-client.tsx (export action)

#### Demo & Test Pages

- All demo pages in src/app/(app)/\*-demo/page.tsx (interactive demos)
- src/app/(app)/mobile-test/page.tsx (testing)
- src/app/(app)/tablet-test/page.tsx (testing)

#### Admin & Super Admin

- src/app/(app)/super-admin/\*_/_.tsx (all admin pages are interactive)
- src/app/admin-setup/page.tsx (setup form)

#### Research & Knowledge

- src/app/(app)/research-agent/page.tsx (useActionState, useTransition, useState)
- src/app/(app)/knowledge-base/page.tsx (useMemo, useState)
- src/app/(app)/research-agent/[reportId]/report-client-page.tsx (useRef)
- src/app/(app)/knowledge-base/[reportId]/report-client-page.tsx (useRef)

#### Other Interactive Pages

- src/app/(app)/content-engine/page.tsx (useActionState, useState, useTransition)
- src/app/(app)/dashboard/page.tsx (dashboard with state)
- src/app/login/page.tsx (login form)
- src/app/(app)/support/page.tsx (accordion)

## Conversion Priority

### High Priority (Quick Wins)

1. hub-breadcrumbs.tsx - Simple conversion
2. aeo-score-card.tsx - Pure presentational
3. Other pure presentational components

### Medium Priority (Requires Refactoring)

1. optimized-image.tsx - Hybrid pattern
2. form-field.tsx - Composition refactor
3. Layout components with mixed concerns

### Low Priority (Complex Refactoring)

1. Components deeply integrated with client state
2. Components with complex event handling

## Conversion Guidelines

### Server Component Checklist

A component can be a Server Component if it:

- ✅ Does NOT use useState, useEffect, useContext, or other React hooks
- ✅ Does NOT use browser APIs (window, localStorage, etc.)
- ✅ Does NOT use event handlers (onClick, onChange, etc.)
- ✅ Does NOT use client-only libraries
- ✅ Only renders based on props
- ✅ Can fetch data on the server

### Hybrid Pattern

For components with mixed concerns:

1. Create a Server Component wrapper for static parts
2. Extract interactive parts to separate Client Components
3. Compose them together

Example:

```tsx
// Server Component (wrapper)
export default function PageLayout({ children }) {
  const data = await fetchData(); // Server-side
  return (
    <div>
      <StaticHeader data={data} />
      <InteractiveContent data={data} /> {/* Client Component */}
    </div>
  );
}

// Client Component (interactive part)
("use client");
export function InteractiveContent({ data }) {
  const [selected, setSelected] = useState(null);
  // ... interactive logic
}
```

## Next Steps

1. ✅ Complete audit (this document)
2. ⏳ Convert high-priority components
3. ⏳ Test conversions
4. ⏳ Measure bundle size improvements
5. ⏳ Document patterns for future development

## Expected Impact

### Bundle Size Reduction

- Estimated reduction: 15-25KB (gzipped)
- Components converted: 5-10 high-priority items
- Improved Time to Interactive (TTI)

### Performance Improvements

- Faster initial page load
- Reduced JavaScript execution time
- Better Core Web Vitals scores
- Improved SEO (more content rendered server-side)

## Notes

- Always test functionality after conversion
- Use getDiagnostics tool to check for TypeScript errors
- Verify accessibility attributes still work
- Test with real data, not mocks
- Monitor bundle size with webpack-bundle-analyzer
