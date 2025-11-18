# Performance Optimization Quick Reference

## Quick Commands

```bash
# Analyze bundle size
npm run build:analyze

# Build for production
npm run build

# Start production server
npm start

# Development with performance monitoring
npm run dev
```

## Performance Target

✅ **First Contentful Paint < 2 seconds**

## Key Files

- `next.config.ts` - Next.js performance configuration
- `src/lib/performance.ts` - Performance monitoring utilities
- `src/components/ui/optimized-image.tsx` - Optimized image component
- `src/lib/dynamic-imports.ts` - Code splitting utilities
- `scripts/analyze-bundle.js` - Bundle analyzer

## Quick Optimizations

### 1. Optimize Images

```tsx
import { OptimizedImage } from "@/components/ui/optimized-image";

<OptimizedImage src="/image.jpg" alt="Description" width={400} height={300} />;
```

### 2. Lazy Load Components

```tsx
import { createDynamicComponent } from "@/lib/dynamic-imports";

const HeavyComponent = createDynamicComponent(() => import("./HeavyComponent"));
```

### 3. Optimize Package Imports

```tsx
// ✅ Good
import { Button } from "@/components/ui/button";

// ❌ Bad
import * as Components from "@/components/ui";
```

### 4. Monitor Performance

```tsx
import { measureComponentRender } from "@/lib/performance";

const endMeasure = measureComponentRender("ComponentName");
// ... component logic
endMeasure();
```

## Performance Checklist

- [ ] Images use OptimizedImage component
- [ ] Heavy components are lazy-loaded
- [ ] Package imports are optimized
- [ ] Bundle size < 500KB per page
- [ ] FCP < 2 seconds
- [ ] No console logs in production

## Common Issues

### Issue: Large Bundle Size

**Solution:** Use dynamic imports and optimize package imports

### Issue: Slow Image Loading

**Solution:** Use OptimizedImage with proper sizing

### Issue: Poor FCP Score

**Solution:** Reduce initial JavaScript, optimize critical path

## Monitoring

Check browser console in development for automatic performance metrics:

- Page Load Time
- First Contentful Paint
- Largest Contentful Paint
- Time to Interactive

## Resources

- Full guide: `PERFORMANCE_OPTIMIZATION.md`
- Next.js docs: https://nextjs.org/docs/app/building-your-application/optimizing
- Web Vitals: https://web.dev/vitals/
