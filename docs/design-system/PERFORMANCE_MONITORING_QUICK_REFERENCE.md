# Performance Monitoring - Quick Reference

## Commands

```bash
# Bundle Size
npm run bundle:check      # Check sizes against thresholds
npm run bundle:track      # Track sizes over time
npm run analyze           # Visualize bundle composition

# Lighthouse
npm run lighthouse        # Run on localhost:3000
npm run lighthouse:prod   # Run on production URL
npm run lighthouse:ci     # Run Lighthouse CI

# Build
npm run build            # Production build
npm run build:analyze    # Build with bundle analysis
```

## Dashboard

**URL:** `/dashboard/performance`

**Features:**

- Real-time Core Web Vitals
- Bundle size trends (last 20 builds)
- Latest Lighthouse scores

## Thresholds

### Core Web Vitals

- LCP: ≤ 2.5s (good), ≤ 4s (needs improvement)
- FID: ≤ 100ms (good), ≤ 300ms (needs improvement)
- CLS: ≤ 0.1 (good), ≤ 0.25 (needs improvement)
- FCP: ≤ 1.8s (good), ≤ 3s (needs improvement)
- TTFB: ≤ 800ms (good), ≤ 1.8s (needs improvement)
- INP: ≤ 200ms (good), ≤ 500ms (needs improvement)

### Bundle Size

- Initial JS: ≤ 200KB
- Initial CSS: ≤ 50KB
- Page JS: ≤ 150KB

### Lighthouse Scores

- Performance: ≥ 90
- Accessibility: ≥ 95
- Best Practices: ≥ 90
- SEO: ≥ 95

## CI/CD

### Workflows

- `bundle-size.yml` - Runs on PRs, checks bundle sizes
- `performance.yml` - Runs on deployments, Lighthouse audits

### Artifacts

- Bundle analysis reports
- Lighthouse HTML reports
- Performance data JSON

## Troubleshooting

### Bundle Too Large

1. Run `npm run analyze`
2. Check for duplicate dependencies
3. Use dynamic imports
4. Remove unused code

### Poor Lighthouse Score

1. Check detailed report
2. Focus on "Opportunities"
3. Implement suggestions
4. Re-run audit

### High Web Vitals

- **LCP:** Optimize images, reduce server time
- **FID:** Reduce JavaScript execution
- **CLS:** Reserve space for dynamic content

## Files

### Configuration

- `lighthouserc.js` - Lighthouse CI config
- `.bundle-size-history.json` - Bundle size history (gitignored)

### Components

- `src/lib/web-vitals.ts` - Web Vitals utility
- `src/components/performance-dashboard.tsx` - Core Web Vitals
- `src/components/bundle-size-trends.tsx` - Bundle trends
- `src/components/lighthouse-scores.tsx` - Lighthouse results

### API

- `/api/analytics/web-vitals` - Receive metrics
- `/api/analytics/bundle-size` - Bundle size data
- `/api/analytics/lighthouse` - Lighthouse data

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
