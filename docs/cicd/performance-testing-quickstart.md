# Performance Testing Quick Start

## Overview

Quick reference for running and interpreting performance tests in the CI/CD pipeline.

## Running Performance Tests

### Automatic (Recommended)

Performance tests run automatically after deployments:

- ✅ After staging deployment (rc-\* tags)
- ✅ After production deployment (v\* tags)
- ✅ Every Monday at 6am UTC (scheduled)

**No action required** - tests run automatically.

### Manual

To run performance tests manually:

1. Go to **Actions** → **Performance Testing**
2. Click **Run workflow**
3. Select environment: `staging` or `production`
4. (Optional) Enter custom URL to test
5. Click **Run workflow**

## Quick Results Check

### Workflow Summary

Check the workflow summary for quick pass/fail status:

```
✅ All Performance Thresholds Met
```

or

```
❌ Performance Thresholds Not Met
- Mobile Performance: 88 < 90
```

### Slack Notifications

Check the #devops Slack channel for notifications:

- ✅ **Success**: All scores meet thresholds
- ❌ **Failure**: One or more scores below thresholds
- ⚠️ **Regression**: Scores decreased by >10%

## Understanding Scores

### Thresholds

| Metric         | Threshold | What It Measures              |
| -------------- | --------- | ----------------------------- |
| Performance    | ≥ 90      | Load speed and responsiveness |
| Accessibility  | ≥ 95      | Usability for all users       |
| Best Practices | ≥ 90      | Code quality and security     |
| SEO            | ≥ 95      | Search engine discoverability |

### Score Interpretation

- **90-100**: Excellent ✅
- **50-89**: Needs improvement ⚠️
- **0-49**: Poor ❌

## Viewing Detailed Reports

1. Go to the workflow run
2. Scroll to **Artifacts** section
3. Download:
   - `lighthouse-report-desktop.html`
   - `lighthouse-report-mobile.html`
4. Open in browser for detailed analysis

## Common Fixes

### Low Performance Score

```bash
# Optimize images
npm run optimize:images

# Analyze bundle size
npm run analyze:bundle

# Check for large dependencies
npm run check:bundle-size
```

**Quick wins:**

- Compress images (WebP/AVIF)
- Enable code splitting
- Lazy load components
- Use CDN for assets

### Low Accessibility Score

**Quick wins:**

- Add alt text to images
- Ensure color contrast (4.5:1 minimum)
- Add labels to form inputs
- Test keyboard navigation

### Low Best Practices Score

**Quick wins:**

- Fix console errors
- Update deprecated APIs
- Ensure HTTPS for all resources
- Add security headers

### Low SEO Score

**Quick wins:**

- Add meta descriptions
- Add title tags
- Ensure mobile-friendly
- Add structured data

## Testing Locally

### Quick Test

```bash
# Install Lighthouse
npm install -g lighthouse

# Run test
lighthouse http://localhost:3000 --view
```

### Full Test (Desktop + Mobile)

```bash
# Desktop
lighthouse http://localhost:3000 \
  --preset=desktop \
  --output=html \
  --view

# Mobile
lighthouse http://localhost:3000 \
  --preset=mobile \
  --output=html \
  --view
```

## Workflow Files

- **Workflow**: `.github/workflows/performance.yml`
- **Documentation**: `docs/cicd/performance-testing-guide.md`
- **Quick Start**: `docs/cicd/performance-testing-quickstart.md` (this file)

## Troubleshooting

### Tests Failing After Deployment

1. Check workflow logs for specific failures
2. Download and review Lighthouse reports
3. Compare scores against thresholds
4. Fix issues and redeploy

### Inconsistent Scores

1. Run tests multiple times
2. Check during off-peak hours
3. Verify network conditions
4. Review third-party dependencies

### Need Help?

1. Review [Performance Testing Guide](./performance-testing-guide.md)
2. Check Lighthouse reports for recommendations
3. Ask in #devops Slack channel
4. Create an issue in the repository

## Next Steps

After reviewing performance test results:

1. ✅ **All tests passed**: Deploy to next environment
2. ⚠️ **Some scores low**: Review recommendations and fix
3. ❌ **Tests failed**: Fix critical issues before proceeding
4. 📊 **Track trends**: Monitor scores over time

## Related Commands

```bash
# Run local development server
npm run dev

# Build production bundle
npm run build

# Analyze bundle size
npm run analyze:bundle

# Run all tests
npm test

# Type check
npm run typecheck

# Lint code
npm run lint
```

## Performance Budgets

Set performance budgets in `lighthouserc.json`:

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.95 }]
      }
    }
  }
}
```

## Monitoring

Track performance over time:

1. View workflow artifacts for historical data
2. Check `performance-data.json` for trends
3. Monitor Core Web Vitals in production
4. Set up alerts for regressions

## Resources

- [Lighthouse Docs](https://developers.google.com/web/tools/lighthouse)
- [Web Vitals](https://web.dev/vitals/)
- [Performance Guide](https://web.dev/fast/)
- [Accessibility Guide](https://www.w3.org/WAI/WCAG21/quickref/)
