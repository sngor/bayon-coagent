# Performance Optimization Guide

This document outlines the performance optimizations implemented to ensure fast page load times and optimal user experience.

## Performance Target

**Goal:** Initial content displays within 2 seconds (First Contentful Paint < 2000ms)

## Implemented Optimizations

### 1. Code Splitting for Routes

Next.js App Router automatically implements code splitting at the route level. Each page is bundled separately, ensuring users only download the JavaScript needed for the current page.

**Benefits:**

- Reduced initial bundle size
- Faster page loads
- Better caching strategy

**Implementation:**

- Automatic with Next.js App Router
- Each route in `src/app/(app)/` is a separate chunk
- Shared components are automatically optimized

### 2. Progressive Image Loading

Implemented optimized image components with progressive loading and placeholders.

**Components:**

- `OptimizedImage` - Main image component with shimmer effect
- `OptimizedAvatar` - Optimized avatar images
- `OptimizedCardImage` - Optimized card images

**Features:**

- Automatic blur placeholders
- Shimmer loading effect
- Lazy loading by default
- Modern image formats (AVIF, WebP)
- Responsive image sizes
- Error handling with fallbacks

**Usage:**

```tsx
import { OptimizedImage } from "@/components/ui/optimized-image";

<OptimizedImage
  src="/path/to/image.jpg"
  alt="Description"
  width={400}
  height={300}
  showShimmer={true}
  aspectRatio="4/3"
/>;
```

### 3. Bundle Size Optimization

**Next.js Configuration:**

- Enabled SWC minification
- Optimized package imports for heavy libraries
- Removed console logs in production
- Enabled compression
- Optimized fonts

**Optimized Packages:**

- `lucide-react` - Tree-shakeable icon imports
- `@radix-ui/react-icons` - Optimized imports
- `recharts` - Dynamic loading for charts
- `framer-motion` - Optimized imports

**Dynamic Imports:**
Created utility for lazy-loading heavy components:

```tsx
import { LazyComponents } from '@/lib/dynamic-imports';

// Use lazy-loaded components
<LazyComponents.Charts />
<LazyComponents.Calendar />
```

### 4. Performance Monitoring

**Development Monitoring:**

- Automatic performance metrics logging
- First Contentful Paint (FCP) tracking
- Largest Contentful Paint (LCP) tracking
- Time to Interactive (TTI) tracking
- Component render time tracking

**Usage:**
Performance metrics are automatically logged in development mode. Check the browser console after page load.

**Manual Monitoring:**

```tsx
import { measureComponentRender } from "@/lib/performance";

function MyComponent() {
  const endMeasure = measureComponentRender("MyComponent");

  // Component logic

  useEffect(() => {
    endMeasure();
  }, []);
}
```

### 5. Font Optimization

**Implemented:**

- Preconnect to Google Fonts
- `display=swap` for non-blocking font loading
- Font subsetting (automatic with Next.js)

**Configuration:**

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link
  rel="preconnect"
  href="https://fonts.gstatic.com"
  crossorigin="anonymous"
/>
<link href="..." rel="stylesheet" />
```

### 6. Image Configuration

**Next.js Image Optimization:**

- Modern formats (AVIF, WebP)
- Responsive device sizes
- Proper image sizing to minimize layout shift
- Minimum cache TTL of 60 seconds

**Configuration in `next.config.ts`:**

```typescript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60,
}
```

## Bundle Analysis

### Running Bundle Analysis

```bash
npm run build:analyze
```

This will:

1. Build the production bundle
2. Analyze bundle sizes
3. Identify large bundles (> 500KB)
4. Provide optimization recommendations
5. Check for heavy packages

### Interpreting Results

**Good:**

- Page bundles < 500KB
- FCP < 2000ms
- No heavy packages in critical paths

**Needs Optimization:**

- Page bundles > 500KB
- FCP > 2000ms
- Heavy packages loaded on initial render

## Performance Checklist

### Before Deployment

- [ ] Run `npm run build:analyze`
- [ ] Check bundle sizes are reasonable
- [ ] Test FCP in production mode
- [ ] Verify images are optimized
- [ ] Check for unused dependencies
- [ ] Test on slow 3G connection
- [ ] Verify lazy loading works
- [ ] Check Core Web Vitals

### Monitoring in Production

1. **First Contentful Paint (FCP):** < 2 seconds
2. **Largest Contentful Paint (LCP):** < 2.5 seconds
3. **Time to Interactive (TTI):** < 3.5 seconds
4. **Cumulative Layout Shift (CLS):** < 0.1
5. **First Input Delay (FID):** < 100ms

## Best Practices

### 1. Component Loading

**Do:**

```tsx
// Lazy load heavy components
const HeavyChart = dynamic(() => import("./HeavyChart"), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

**Don't:**

```tsx
// Import everything at once
import { HeavyChart } from "./HeavyChart";
```

### 2. Image Usage

**Do:**

```tsx
<OptimizedImage
  src="/image.jpg"
  alt="Description"
  width={400}
  height={300}
  loading="lazy"
/>
```

**Don't:**

```tsx
<img src="/image.jpg" alt="Description" />
```

### 3. Package Imports

**Do:**

```tsx
// Import only what you need
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
```

**Don't:**

```tsx
// Import entire libraries
import * as Icons from "lucide-react";
import _ from "lodash";
```

### 4. Data Fetching

**Do:**

```tsx
// Use React Server Components for data fetching
async function Page() {
  const data = await fetchData();
  return <Component data={data} />;
}
```

**Don't:**

```tsx
// Fetch on client unnecessarily
"use client";
function Page() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetchData().then(setData);
  }, []);
}
```

## Troubleshooting

### Slow Page Load

1. Check bundle size: `npm run build:analyze`
2. Look for large dependencies
3. Verify images are optimized
4. Check network waterfall in DevTools
5. Ensure code splitting is working

### Large Bundle Size

1. Use dynamic imports for heavy components
2. Optimize package imports
3. Remove unused dependencies
4. Check for duplicate packages
5. Use tree-shakeable libraries

### Poor FCP Score

1. Reduce JavaScript bundle size
2. Optimize critical rendering path
3. Defer non-critical JavaScript
4. Optimize fonts and images
5. Use server-side rendering

## Tools

### Browser DevTools

- **Performance Tab:** Record page load and analyze
- **Network Tab:** Check resource sizes and timing
- **Lighthouse:** Run performance audit
- **Coverage Tab:** Find unused JavaScript

### External Tools

- [WebPageTest](https://www.webpagetest.org/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

## Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)

## Maintenance

### Regular Tasks

- **Weekly:** Check bundle sizes after major changes
- **Monthly:** Run full performance audit
- **Quarterly:** Review and update dependencies
- **Annually:** Evaluate new optimization techniques

### Monitoring

Set up performance monitoring in production:

- Track Core Web Vitals
- Monitor bundle sizes
- Alert on performance regressions
- Track user experience metrics
