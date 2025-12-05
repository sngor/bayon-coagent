# Bundle Analysis Guide

## Overview

This guide explains how to analyze and optimize bundle sizes in the Bayon Coagent application. Bundle size directly impacts page load performance and user experience.

## Performance Budgets

As defined in the design document, we maintain strict performance budgets:

| Metric               | Target | Maximum |
| -------------------- | ------ | ------- |
| Initial Bundle (JS)  | 150KB  | 200KB   |
| Initial Bundle (CSS) | 30KB   | 50KB    |
| Page Bundle (JS)     | 100KB  | 150KB   |
| Shared Chunks        | 50KB   | 100KB   |

## Running Bundle Analysis

### 1. Visual Bundle Analysis

Generate an interactive visualization of your bundle:

```bash
npm run analyze
```

This will:

1. Build the application in production mode
2. Generate bundle analysis reports
3. Open an interactive visualization in your browser

The visualization shows:

- Size of each module
- Which modules are included in which bundles
- Duplicate dependencies
- Largest modules

### 2. Bundle Size Check

Check if bundles are within size limits:

```bash
npm run bundle:check
```

This will:

1. Analyze all JavaScript and CSS bundles
2. Compare sizes against thresholds
3. Report which bundles exceed limits
4. Provide optimization recommendations

Example output:

```
Bundle Size Check

JavaScript Bundles:
✓ PASS Main Bundle: 145.32 KB / 200 KB (72.7%)
✓ PASS Page: dashboard.js: 89.45 KB / 150 KB (59.6%)
✗ FAIL Page: studio.js: 165.78 KB / 150 KB (110.5%)

CSS Bundles:
✓ PASS CSS: app.css: 42.15 KB / 50 KB (84.3%)

Summary:
✗ Some bundles exceed size limits

Recommendations:
1. Use dynamic imports for heavy components
2. Check for duplicate dependencies
3. Remove unused code and dependencies
4. Use code splitting for large pages
5. Run "npm run analyze" to visualize bundle composition
```

### 3. CI/CD Integration

Add bundle size checks to your CI/CD pipeline:

```yaml
# .github/workflows/ci.yml
- name: Check bundle size
  run: |
    npm run build
    npm run bundle:check
```

This ensures bundle sizes don't exceed limits in pull requests.

## Optimization Strategies

### 1. Dynamic Imports

Use dynamic imports for heavy components that aren't needed immediately:

**Before:**

```typescript
import HeavyChart from "@/components/heavy-chart";

export default function Page() {
  return <HeavyChart data={data} />;
}
```

**After:**

```typescript
import dynamic from "next/dynamic";

const HeavyChart = dynamic(() => import("@/components/heavy-chart"), {
  loading: () => <StandardLoadingState variant="skeleton" />,
  ssr: false, // Disable SSR if component uses browser APIs
});

export default function Page() {
  return <HeavyChart data={data} />;
}
```

### 2. Code Splitting by Route

Next.js automatically splits code by route. Ensure each page only imports what it needs:

**Bad:**

```typescript
// Importing everything in a single page
import { Button, Card, Dialog, Tabs, Select, ... } from '@/components/ui';
```

**Good:**

```typescript
// Only import what you need
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
```

### 3. Optimize Package Imports

Use package-specific imports instead of barrel imports:

**Bad:**

```typescript
import { Calendar, Settings, User } from "lucide-react"; // Imports entire library
```

**Good:**

```typescript
// Already optimized in next.config.ts via optimizePackageImports
import { Calendar, Settings, User } from "lucide-react"; // Tree-shaken automatically
```

Our configuration already optimizes these packages:

- `lucide-react`
- `@radix-ui/*`
- `recharts`
- `framer-motion`

### 4. Remove Unused Dependencies

Regularly audit and remove unused dependencies:

```bash
# Find unused dependencies
npx depcheck

# Remove unused dependency
npm uninstall package-name
```

### 5. Use Lighter Alternatives

Replace heavy dependencies with lighter alternatives:

| Heavy               | Lighter Alternative           |
| ------------------- | ----------------------------- |
| `moment`            | `date-fns` (already using)    |
| `lodash`            | Native JavaScript methods     |
| `axios`             | `fetch` API                   |
| Full icon libraries | Tree-shakeable icon libraries |

### 6. Lazy Load Below-the-Fold Content

Use lazy loading for content that's not immediately visible:

```typescript
import { LazyComponent } from "@/components/performance/lazy-component";

export default function Page() {
  return (
    <div>
      <HeroSection /> {/* Above the fold */}
      <LazyComponent
        loader={() => import("@/components/features-section")}
        fallback={<StandardLoadingState variant="skeleton" />}
      />
    </div>
  );
}
```

### 7. Optimize Images

Use Next.js Image component with proper sizing:

```typescript
import { OptimizedImage } from "@/components/performance/optimized-image";

<OptimizedImage
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // For above-the-fold images
/>;
```

### 8. Server Components by Default

Use Server Components unless client-side interactivity is needed:

**Server Component (default):**

```typescript
// No 'use client' directive
export default async function Page() {
  const data = await fetchData(); // Server-side data fetching
  return <div>{data}</div>;
}
```

**Client Component (when needed):**

```typescript
"use client"; // Only when you need useState, useEffect, etc.

export default function InteractiveComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### 9. Minimize Client-Side JavaScript

Extract client-only logic to separate components:

**Before:**

```typescript
"use client"; // Entire component is client-side

export default function Page() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <StaticContent /> {/* Doesn't need client JS */}
      <InteractiveButton onClick={() => setOpen(true)} />
    </div>
  );
}
```

**After:**

```typescript
// Server Component (wrapper)
export default function Page() {
  return (
    <div>
      <StaticContent /> {/* Server-rendered */}
      <InteractiveSection /> {/* Client component */}
    </div>
  );
}

// Client Component (minimal)
("use client");
function InteractiveSection() {
  const [open, setOpen] = useState(false);
  return <InteractiveButton onClick={() => setOpen(true)} />;
}
```

### 10. Analyze Duplicate Dependencies

Use bundle analyzer to find duplicate dependencies:

1. Run `npm run analyze`
2. Look for the same package appearing multiple times
3. Check if different versions are being used
4. Consolidate to a single version

## Common Issues and Solutions

### Issue: Large Initial Bundle

**Symptoms:**

- Initial JS bundle > 200KB
- Slow Time to Interactive (TTI)

**Solutions:**

1. Use dynamic imports for heavy components
2. Move third-party scripts to separate chunks
3. Lazy load below-the-fold content
4. Check for duplicate dependencies

### Issue: Large Page Bundles

**Symptoms:**

- Individual page bundles > 150KB
- Slow page transitions

**Solutions:**

1. Split large pages into smaller components
2. Use dynamic imports for page-specific features
3. Move shared code to common chunks
4. Lazy load modals and dialogs

### Issue: Duplicate Dependencies

**Symptoms:**

- Same package appears multiple times in bundle
- Larger than expected bundle size

**Solutions:**

1. Check `package.json` for version conflicts
2. Use `npm dedupe` to consolidate dependencies
3. Update dependencies to compatible versions
4. Use `resolutions` in package.json if needed

### Issue: Large CSS Bundle

**Symptoms:**

- CSS bundle > 50KB
- Unused CSS in bundle

**Solutions:**

1. Enable CSS purging in Tailwind config
2. Remove unused CSS files
3. Use CSS modules for component-specific styles
4. Avoid importing entire CSS libraries

## Monitoring Bundle Size

### 1. Local Development

Check bundle size during development:

```bash
# After making changes
npm run build
npm run bundle:check
```

### 2. Pull Requests

Add bundle size checks to PR workflow:

```yaml
# .github/workflows/pr.yml
- name: Build and check bundle size
  run: |
    npm run build
    npm run bundle:check
```

### 3. Production Monitoring

Track bundle sizes over time:

1. Run bundle analysis on each deployment
2. Store bundle size metrics
3. Alert on significant increases
4. Review trends monthly

## Best Practices

1. **Set up bundle size checks in CI/CD** - Prevent regressions
2. **Run bundle analysis regularly** - Understand what's in your bundles
3. **Use dynamic imports liberally** - Reduce initial bundle size
4. **Prefer Server Components** - Minimize client-side JavaScript
5. **Optimize package imports** - Use tree-shakeable imports
6. **Remove unused code** - Regular dependency audits
7. **Monitor bundle size trends** - Track changes over time
8. **Document large dependencies** - Justify why they're needed
9. **Review before adding dependencies** - Consider bundle impact
10. **Educate the team** - Share optimization knowledge

## Resources

- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Next.js Performance Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Performance](https://web.dev/performance/)
- [Design System Performance Spec](.kiro/specs/design-system-performance/design.md)

## Questions?

If you have questions about bundle optimization:

1. Check this guide
2. Run `npm run analyze` to visualize your bundle
3. Review the design document
4. Ask in #engineering
