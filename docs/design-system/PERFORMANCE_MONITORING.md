# Performance Monitoring System

This document describes the performance monitoring system implemented for the Bayon Coagent application.

## Overview

The performance monitoring system tracks three key areas:

1. **Core Web Vitals** - Real-time user experience metrics
2. **Bundle Size** - JavaScript and CSS bundle sizes over time
3. **Lighthouse Scores** - Automated performance audits

## Core Web Vitals Tracking

### Metrics Tracked

- **LCP (Largest Contentful Paint)**: Loading performance (target: ≤ 2.5s)
- **FID (First Input Delay)**: Interactivity (target: ≤ 100ms)
- **CLS (Cumulative Layout Shift)**: Visual stability (target: ≤ 0.1)
- **FCP (First Contentful Paint)**: Perceived load speed (target: ≤ 1.8s)
- **TTFB (Time to First Byte)**: Server response time (target: ≤ 800ms)
- **INP (Interaction to Next Paint)**: Responsiveness (target: ≤ 200ms)

### Implementation

Web Vitals are tracked using the `web-vitals` library and automatically sent to the analytics endpoint:

```typescript
import { initWebVitals } from "@/lib/web-vitals";

// Initialize in your app
initWebVitals();
```

Metrics are:

- Logged to console in development
- Sent to `/api/analytics/web-vitals` in production
- Displayed in the performance dashboard

### Viewing Metrics

Visit `/dashboard/performance` to see real-time Core Web Vitals for the current page.

## Bundle Size Monitoring

### Thresholds

- Initial JS: ≤ 200 KB (gzipped)
- Initial CSS: ≤ 50 KB (gzipped)
- Page JS: ≤ 150 KB per page

### Commands

```bash
# Check bundle sizes against thresholds
npm run bundle:check

# Track bundle sizes over time
npm run bundle:track

# Analyze bundle composition
npm run analyze
```

### CI/CD Integration

Bundle size is automatically checked on every pull request via the `bundle-size.yml` workflow:

- Builds the application
- Checks sizes against thresholds
- Generates bundle analysis
- Comments on PR with results
- Fails if thresholds are exceeded

### Viewing Trends

Visit `/dashboard/performance` to see bundle size trends over time.

## Lighthouse CI

### Configuration

Lighthouse CI is configured in `lighthouserc.js` with:

- Performance budgets
- Accessibility requirements
- Best practices checks
- SEO requirements

### Running Locally

```bash
# Run Lighthouse on local development server
npm run lighthouse

# Run Lighthouse on production URL
npm run lighthouse:prod

# Run Lighthouse CI (requires server running)
npm run lighthouse:ci
```

### CI/CD Integration

Lighthouse audits run automatically via the `performance.yml` workflow:

- Triggered on staging/production deployments
- Runs on both desktop and mobile
- Checks scores against thresholds
- Uploads reports as artifacts
- Sends notifications on failures

### Thresholds

- Performance: ≥ 90
- Accessibility: ≥ 95
- Best Practices: ≥ 90
- SEO: ≥ 95

### Viewing Scores

Visit `/dashboard/performance` to see the latest Lighthouse scores.

## Performance Dashboard

The performance dashboard (`/dashboard/performance`) provides a unified view of all performance metrics:

### Features

- Real-time Core Web Vitals
- Bundle size trends (last 20 builds)
- Latest Lighthouse scores (desktop and mobile)
- Visual indicators for good/needs improvement/poor ratings
- Historical trend charts

### Access

The dashboard is available to all authenticated users at:

```
/dashboard/performance
```

## Monitoring in Production

### CloudWatch Integration

In production, metrics are sent to CloudWatch for:

- Long-term storage
- Alerting on performance degradation
- Trend analysis
- Custom dashboards

### Alerts

Set up CloudWatch alarms for:

- LCP > 2.5s
- FID > 100ms
- CLS > 0.1
- Bundle size increases > 10%
- Lighthouse score drops > 10 points

## Best Practices

### For Developers

1. **Check bundle size** before committing large changes
2. **Run Lighthouse** locally to catch issues early
3. **Monitor Web Vitals** during development
4. **Use dynamic imports** for heavy components
5. **Optimize images** with Next.js Image component

### For CI/CD

1. **Fail builds** that exceed bundle size thresholds
2. **Block PRs** with poor Lighthouse scores
3. **Track trends** over time
4. **Alert on regressions** > 10%

### For Production

1. **Monitor Core Web Vitals** continuously
2. **Set up alerts** for performance degradation
3. **Review trends** weekly
4. **Investigate spikes** immediately

## Troubleshooting

### Bundle Size Too Large

1. Run `npm run analyze` to see what's in the bundle
2. Look for duplicate dependencies
3. Use dynamic imports for heavy components
4. Remove unused dependencies
5. Check for large third-party libraries

### Poor Lighthouse Scores

1. Check the detailed Lighthouse report
2. Focus on the "Opportunities" section
3. Implement suggested optimizations
4. Re-run Lighthouse to verify improvements

### High Core Web Vitals

1. Check which metric is high (LCP, FID, CLS)
2. Use Chrome DevTools Performance tab
3. Identify bottlenecks
4. Optimize accordingly:
   - LCP: Optimize images, reduce server response time
   - FID: Reduce JavaScript execution time
   - CLS: Reserve space for dynamic content

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Bundle Analysis](https://nextjs.org/docs/advanced-features/analyzing-bundles)
