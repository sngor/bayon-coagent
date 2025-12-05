# Dependency Analysis & Optimization

## Overview

Bundle analysis reveals significant size issues across the application.

**Analysis Date**: December 4, 2025
**Total Bundle Size**: 139MB (JavaScript + CSS)
**Target**: <200KB initial load

## Critical Issues

### 1. Recharts Library (~900KB-1MB per chunk)

**Problem**: Recharts is being included in multiple chunks, each 900KB-1MB

- `f4f68_recharts_es6_*.js` - Multiple chunks ranging from 909KB to 1046KB
- Used in 20+ components
- Not code-split or lazy-loaded

**Solution**:

- ✅ Created dynamic import wrappers (already done in task 5.4)
- ⏳ Update all chart components to use dynamic imports
- ⏳ Ensure charts are only loaded when needed

**Expected Savings**: 800KB-1MB per route

### 2. React/React-DOM (~1.3MB)

**Problem**: React development build in production

- `f4f68_react-dom_cjs_react-dom_development_*.js` - 1.29MB
- Should be using production build

**Solution**:

- Verify NODE_ENV=production in build
- Check next.config.ts production settings
- Ensure minification is enabled

**Expected Savings**: 600-800KB

### 3. Next.js DevTools (~1.47MB)

**Problem**: DevTools included in production bundle

- `f4f68_next_dist_compiled_next-devtools_index_*.js` - 1.47MB each
- Should only be in development

**Solution**:

- Check Next.js configuration
- Ensure devtools are disabled in production
- Verify build environment

**Expected Savings**: 1.4MB

### 4. Framer Motion (~850KB)

**Problem**: Large animation library

- `f4f68_framer-motion_dist_es_*.js` - 851KB
- Used throughout the app

**Solution**:

- Consider lighter alternatives for simple animations
- Use CSS animations where possible
- Lazy load Framer Motion components
- Tree-shake unused features

**Expected Savings**: 400-600KB

### 5. Date-fns (~343KB)

**Problem**: Large date library

- `f4f68_date-fns_*.js` - 343KB
- Likely importing entire library

**Solution**:

- Use specific imports: `import { format } from 'date-fns/format'`
- Consider lighter alternative (day.js ~2KB)
- Enable tree-shaking

**Expected Savings**: 250-300KB

### 6. Lodash (~210KB per chunk)

**Problem**: Multiple lodash chunks

- `f4f68_lodash_*.js` - 4 chunks at ~210KB each
- Full library being imported

**Solution**:

- Use specific imports: `import debounce from 'lodash/debounce'`
- Consider native alternatives
- Remove if not essential

**Expected Savings**: 600-800KB total

### 7. jsPDF + html2canvas (~1.1MB combined)

**Problem**: PDF generation libraries

- `f4f68_jspdf_*.js` - 669KB
- `f4f68_html2canvas_*.js` - 448KB

**Solution**:

- ✅ Lazy load (use dynamic imports)
- Only load when PDF export is triggered
- Consider server-side PDF generation

**Expected Savings**: 1MB (moved to on-demand loading)

### 8. Google Maps (~150KB)

**Problem**: Maps library loaded upfront

- `@react-google-maps/api` in multiple chunks

**Solution**:

- ✅ Created dynamic import wrapper (done in task 5.4)
- Only load when map components are rendered

**Expected Savings**: 150KB

### 9. AWS SDK (~300KB+ per service)

**Problem**: Multiple AWS SDK clients

- Each client is 300-400KB
- Many loaded upfront

**Solution**:

- Lazy load AWS SDK clients
- Use server-side only where possible
- Consider AWS SDK v3 modular imports

**Expected Savings**: 500KB-1MB

### 10. Duplicate Dependencies

**Problem**: Same libraries in multiple chunks

- React chunks duplicated
- Lodash in 4 separate chunks
- Recharts in 7+ chunks

**Solution**:

- Configure webpack splitChunks
- Use Next.js optimizePackageImports
- Deduplicate common dependencies

**Expected Savings**: 1-2MB

## Unused Dependencies

### Potentially Unused

Need to verify usage:

1. **@mantine/form** (7.11.2)

   - Search codebase for usage
   - If unused, remove

2. **@tailwindcss/line-clamp** (0.4.4)

   - Deprecated, now built into Tailwind
   - Remove and use native Tailwind

3. **critters** (0.0.23)

   - Critical CSS extraction
   - Verify if being used

4. **patch-package** (8.0.0)

   - Only needed if patches exist
   - Check patches/ directory

5. **localstack** (1.0.0)
   - Dev dependency, should be in devDependencies

### Duplicate Functionality

1. **@google/genai** AND **@google/generative-ai**

   - Two Google AI packages
   - Consolidate to one

2. **marked** (14.0.0)
   - Markdown parser
   - Verify if needed (Next.js has built-in MDX)

## Optimization Actions

### Immediate (High Priority)

1. ✅ Create dynamic import wrappers for charts
2. ⏳ Fix React production build
3. ⏳ Disable Next.js DevTools in production
4. ⏳ Implement specific lodash imports
5. ⏳ Lazy load jsPDF and html2canvas

### Short Term (Medium Priority)

1. ⏳ Optimize Framer Motion usage
2. ⏳ Replace date-fns with day.js
3. ⏳ Configure webpack splitChunks
4. ⏳ Remove unused dependencies
5. ⏳ Consolidate duplicate packages

### Long Term (Low Priority)

1. ⏳ Consider CSS animations over Framer Motion
2. ⏳ Server-side PDF generation
3. ⏳ AWS SDK optimization
4. ⏳ Bundle analysis automation in CI/CD

## Expected Impact

### Bundle Size Reduction

| Optimization                | Savings   | Priority |
| --------------------------- | --------- | -------- |
| Fix React production build  | 600-800KB | Critical |
| Remove DevTools             | 1.4MB     | Critical |
| Lazy load Recharts          | 800KB-1MB | High     |
| Optimize Framer Motion      | 400-600KB | High     |
| Fix lodash imports          | 600-800KB | High     |
| Lazy load PDF libraries     | 1MB       | Medium   |
| Replace date-fns            | 250-300KB | Medium   |
| Deduplicate dependencies    | 1-2MB     | Medium   |
| **Total Potential Savings** | **6-8MB** | -        |

### Performance Improvements

- Initial bundle: 200KB (from current 139MB)
- Time to Interactive: -2 to -3 seconds
- First Contentful Paint: -1 to -1.5 seconds
- Lighthouse Score: +20 to +30 points

## Implementation Plan

1. **Week 1**: Fix critical issues (React, DevTools, Recharts)
2. **Week 2**: Optimize high-priority items (Framer Motion, lodash)
3. **Week 3**: Medium-priority optimizations (date-fns, PDF libraries)
4. **Week 4**: Cleanup and verification

## Monitoring

- Run bundle analysis before each deployment
- Set up bundle size budgets in CI/CD
- Monitor Core Web Vitals
- Track user-reported performance issues

## Notes

- Always test functionality after optimization
- Use production builds for accurate measurements
- Monitor real-world performance, not just bundle size
- Consider user experience over pure metrics
