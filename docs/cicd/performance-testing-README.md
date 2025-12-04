# Performance Testing Documentation

## Quick Links

- 🚀 [Quick Start Guide](./performance-testing-quickstart.md) - Get started in 5 minutes
- 📖 [Comprehensive Guide](./performance-testing-guide.md) - Complete documentation
- ✅ [Verification Checklist](./TASK_9_VERIFICATION_CHECKLIST.md) - Test the implementation
- 📊 [Flow Diagrams](./performance-testing-flow-diagram.md) - Visual workflow representation
- 📝 [Completion Summary](./TASK_9_COMPLETION_SUMMARY.md) - Implementation details

## What is Performance Testing?

The performance testing workflow automatically runs Lighthouse audits against deployed environments to ensure:

- ⚡ **Performance**: Fast load times and responsiveness
- ♿ **Accessibility**: Usable by everyone
- ✨ **Best Practices**: Code quality and security
- 🔍 **SEO**: Search engine discoverability

## Quick Start

### View Results

Performance tests run automatically after deployments. Check:

1. **GitHub Actions**: Actions → Performance Testing
2. **Slack**: #devops channel for notifications
3. **Workflow Summary**: Quick pass/fail status

### Run Manually

```bash
# Via GitHub Actions UI
Actions → Performance Testing → Run workflow

# Via GitHub CLI
gh workflow run performance.yml -f environment=staging
```

### Test Locally

```bash
# Install Lighthouse
npm install -g lighthouse

# Run test
lighthouse http://localhost:3000 --view
```

## Performance Thresholds

| Category       | Threshold | Status |
| -------------- | --------- | ------ |
| Performance    | ≥ 90      | 🎯     |
| Accessibility  | ≥ 95      | 🎯     |
| Best Practices | ≥ 90      | 🎯     |
| SEO            | ≥ 95      | 🎯     |

**Workflow fails if any score is below threshold.**

## When Tests Run

### Automatic

- ✅ After staging deployment (rc-\* tags)
- ✅ After production deployment (v\* tags)
- ✅ Every Monday at 6am UTC (scheduled)

### Manual

- ✅ Via GitHub Actions UI
- ✅ Via GitHub CLI
- ✅ Custom environment and URL

## What Gets Tested

### Desktop Configuration

- Full viewport size
- Desktop network conditions
- Chrome desktop user agent

### Mobile Configuration

- Mobile viewport (Moto G4)
- Slower 4G network
- Mobile user agent

### Metrics Captured

**Performance**:

- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Total Blocking Time (TBT)
- Cumulative Layout Shift (CLS)
- Speed Index

**Accessibility**:

- ARIA attributes
- Color contrast
- Form labels
- Image alt text
- Keyboard navigation

**Best Practices**:

- HTTPS usage
- Console errors
- Image aspect ratios
- Deprecated APIs
- Security vulnerabilities

**SEO**:

- Meta descriptions
- Title tags
- Crawlability
- Mobile friendliness
- Structured data

## Workflow Structure

```
Performance Testing
├── Setup (determine environment & URL)
├── Lighthouse Audit (desktop + mobile in parallel)
├── Analyze Results (check thresholds & regressions)
├── Report Results (generate reports & store data)
└── Notify (send Slack notifications)
```

## Artifacts Generated

### Lighthouse Reports (30 days)

- `lighthouse-report-desktop.html` - Visual report
- `lighthouse-report-mobile.html` - Visual report
- `lighthouse-report-desktop.json` - Raw data
- `lighthouse-report-mobile.json` - Raw data

### Performance Data (365 days)

- `performance-report.md` - Summary report
- `performance-data.json` - Historical data

## Notifications

### Success ✅

Sent when all scores meet thresholds:

```
✅ Performance Tests Passed

All Lighthouse scores meet or exceed thresholds.

Environment: staging
URL: https://staging.bayoncoagent.com
Commit: abc123...
```

### Failure ❌

Sent when scores below thresholds:

```
❌ Performance Tests Failed

One or more Lighthouse scores are below thresholds:
- Mobile Performance: 88 < 90
- Desktop Accessibility: 93 < 95

Environment: staging
URL: https://staging.bayoncoagent.com
Commit: abc123...

@devops-team
```

### Regression ⚠️

Sent when scores drop >10%:

```
⚠️ Performance Regression Detected

Performance decreased by more than 10%:
- Desktop Performance: 95 → 82 (-13.7%)

Environment: staging
URL: https://staging.bayoncoagent.com
Commit: abc123...

@devops-team
```

## Common Issues & Fixes

### Low Performance Score

**Causes**: Large bundles, unoptimized images, render-blocking resources

**Fixes**:

```bash
# Optimize images
npm run optimize:images

# Analyze bundle
npm run analyze:bundle

# Check bundle size
npm run check:bundle-size
```

### Low Accessibility Score

**Causes**: Missing alt text, poor contrast, missing labels

**Fixes**:

- Add alt text to all images
- Ensure 4.5:1 color contrast
- Add labels to form inputs
- Test keyboard navigation

### Low Best Practices Score

**Causes**: Console errors, deprecated APIs, HTTP resources

**Fixes**:

- Fix console errors
- Update deprecated APIs
- Use HTTPS for all resources
- Add security headers

### Low SEO Score

**Causes**: Missing meta tags, non-crawlable content

**Fixes**:

- Add meta descriptions
- Add title tags
- Ensure mobile-friendly
- Add structured data

## Documentation Structure

```
docs/cicd/
├── performance-testing-README.md              # This file (overview)
├── performance-testing-quickstart.md          # Quick reference
├── performance-testing-guide.md               # Comprehensive guide
├── performance-testing-flow-diagram.md        # Visual diagrams
├── TASK_9_COMPLETION_SUMMARY.md               # Implementation details
└── TASK_9_VERIFICATION_CHECKLIST.md           # Testing checklist
```

## Getting Help

### Documentation

1. Start with [Quick Start Guide](./performance-testing-quickstart.md)
2. Review [Comprehensive Guide](./performance-testing-guide.md) for details
3. Check [Flow Diagrams](./performance-testing-flow-diagram.md) for visual reference

### Troubleshooting

1. Check workflow logs in GitHub Actions
2. Download and review Lighthouse reports
3. Review [Verification Checklist](./TASK_9_VERIFICATION_CHECKLIST.md)
4. Ask in #devops Slack channel

### Support

- **Slack**: #devops channel
- **GitHub**: Create an issue
- **Documentation**: Review guides above

## Related Workflows

- [Deploy to Staging](./staging-deployment-guide.md)
- [Deploy to Production](./PRODUCTION_DEPLOYMENT_GUIDE.md) (coming soon)
- [CI Workflow](./CI_GUIDE.md) (coming soon)

## Best Practices

### Before Deployment

1. ✅ Run Lighthouse locally
2. ✅ Ensure scores meet thresholds
3. ✅ Fix issues before creating PR
4. ✅ Document intentional changes

### After Deployment

1. ✅ Monitor test results
2. ✅ Review detailed reports
3. ✅ Track trends over time
4. ✅ Set up alerts for regressions

### Continuous Improvement

1. ✅ Set performance budgets
2. ✅ Monitor Core Web Vitals
3. ✅ Optimize critical path
4. ✅ Test on real devices
5. ✅ Implement progressive enhancement

## Key Commands

```bash
# Trigger workflow
gh workflow run performance.yml -f environment=staging

# Check status
gh run list --workflow=performance.yml

# View logs
gh run view <run-id> --log

# Download artifacts
gh run download <run-id>

# Local testing
lighthouse http://localhost:3000 --view

# Desktop test
lighthouse http://localhost:3000 --preset=desktop --view

# Mobile test
lighthouse http://localhost:3000 --preset=mobile --view
```

## Workflow File

**Location**: `.github/workflows/performance.yml`

**Key Features**:

- 3 trigger types (deployment, manual, scheduled)
- Parallel execution (desktop + mobile)
- Strict threshold enforcement
- Historical data storage
- Slack notifications

## Requirements Validated

✅ **Requirement 9.1**: Lighthouse audits on deployments  
✅ **Requirement 9.2**: Threshold checking  
✅ **Requirement 9.3**: Failure handling  
✅ **Requirement 9.4**: Historical data storage  
✅ **Requirement 9.5**: Regression detection

## Design Properties Validated

✅ **Property 30**: Staging deployments run audits  
✅ **Property 31**: Scores checked against thresholds  
✅ **Property 32**: Below-threshold fails deployment  
✅ **Property 33**: Data stored for trends  
✅ **Property 34**: Degradation triggers alerts

## Resources

### Lighthouse

- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Lighthouse Scoring Guide](https://web.dev/performance-scoring/)
- [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse)

### Web Performance

- [Web Vitals](https://web.dev/vitals/)
- [Performance Best Practices](https://web.dev/fast/)
- [Core Web Vitals](https://web.dev/vitals/)

### Accessibility

- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project](https://www.a11yproject.com/)
- [Accessibility Testing](https://web.dev/accessibility/)

### SEO

- [SEO Best Practices](https://developers.google.com/search/docs)
- [Structured Data](https://developers.google.com/search/docs/guides/intro-structured-data)
- [Mobile-First Indexing](https://developers.google.com/search/mobile-sites/)

## Version History

- **v1.0.0** (2024-01-15): Initial implementation
  - Lighthouse audits for desktop and mobile
  - Threshold enforcement
  - Historical data storage
  - Slack notifications
  - Comprehensive documentation

## Contributing

To improve the performance testing workflow:

1. Review current implementation
2. Identify improvements
3. Test changes locally
4. Create PR with documentation updates
5. Update this README

## License

This documentation is part of the Bayon CoAgent project.

---

**Last Updated**: 2024-01-15  
**Maintained By**: DevOps Team  
**Status**: ✅ Active
