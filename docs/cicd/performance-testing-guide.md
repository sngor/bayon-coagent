# Performance Testing Guide

## Overview

The performance testing workflow runs Lighthouse audits against deployed environments to ensure performance, accessibility, best practices, and SEO standards are maintained. This guide explains how to use and interpret the performance testing workflow.

## Workflow Triggers

The performance testing workflow can be triggered in three ways:

### 1. Automatic Trigger (After Deployments)

The workflow automatically runs after successful deployments to staging or production:

```yaml
workflow_run:
  workflows: ["Deploy to Staging", "Deploy to Production"]
  types:
    - completed
```

### 2. Manual Trigger

You can manually trigger performance tests from the GitHub Actions UI:

1. Go to **Actions** → **Performance Testing**
2. Click **Run workflow**
3. Select:
   - **Environment**: staging or production
   - **URL** (optional): Custom URL to test (defaults to environment URL)

### 3. Scheduled Runs

The workflow runs automatically every Monday at 6am UTC:

```yaml
schedule:
  - cron: "0 6 * * 1"
```

## What Gets Tested

### Lighthouse Audits

The workflow runs Lighthouse audits for both desktop and mobile configurations:

**Desktop Configuration:**

- Simulates desktop browser
- Full viewport size
- Desktop network conditions

**Mobile Configuration:**

- Simulates mobile device (Moto G4)
- Mobile viewport size
- Mobile network conditions (slower 4G)

### Metrics Captured

For each configuration, Lighthouse measures:

1. **Performance** (Target: ≥ 90)

   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Total Blocking Time (TBT)
   - Cumulative Layout Shift (CLS)
   - Speed Index

2. **Accessibility** (Target: ≥ 95)

   - ARIA attributes
   - Color contrast
   - Form labels
   - Image alt text
   - Keyboard navigation

3. **Best Practices** (Target: ≥ 90)

   - HTTPS usage
   - Console errors
   - Image aspect ratios
   - Deprecated APIs
   - Security vulnerabilities

4. **SEO** (Target: ≥ 95)
   - Meta descriptions
   - Title tags
   - Crawlability
   - Mobile friendliness
   - Structured data

## Performance Thresholds

The workflow enforces the following minimum scores:

| Category       | Threshold | Rationale                                   |
| -------------- | --------- | ------------------------------------------- |
| Performance    | ≥ 90      | Ensures fast load times and responsiveness  |
| Accessibility  | ≥ 95      | Ensures inclusive user experience           |
| Best Practices | ≥ 90      | Ensures code quality and security           |
| SEO            | ≥ 95      | Ensures discoverability and search rankings |

**If any score falls below its threshold, the workflow fails.**

## Workflow Jobs

### 1. Setup

Determines the environment and URL to test based on the trigger:

- **workflow_run**: Extracts environment from the triggering workflow name
- **workflow_dispatch**: Uses the provided inputs
- **schedule**: Defaults to staging environment

### 2. Lighthouse Audit

Runs Lighthouse audits in parallel for desktop and mobile:

```bash
lighthouse <url> \
  --preset=<desktop|mobile> \
  --output=html \
  --output=json \
  --chrome-flags="--headless --no-sandbox"
```

**Outputs:**

- HTML reports for visual inspection
- JSON reports for programmatic analysis
- Score artifacts for threshold checking

### 3. Analyze Results

Compares scores against thresholds and checks for regressions:

**Threshold Checking:**

- Compares each score against its threshold
- Fails if any score is below threshold
- Reports all failures in workflow summary

**Regression Detection:**

- Compares current scores against historical baseline
- Identifies scores that decreased by >10%
- Alerts team if regressions detected

### 4. Report Results

Generates comprehensive performance reports:

**Performance Report (Markdown):**

- Summary of all scores
- Pass/fail status for each metric
- Links to detailed Lighthouse reports
- Timestamp and commit information

**Performance Data (JSON):**

- Structured data for trend analysis
- Stored for 365 days
- Used for historical comparisons

**Trend Charts:**

- Visual representation of score trends over time
- Identifies patterns and anomalies
- Helps track performance improvements

### 5. Notify

Sends notifications based on test results:

**Success Notification:**

- Sent when all scores meet thresholds
- Includes summary of scores
- Posted to team Slack channel

**Failure Notification:**

- Sent when scores fall below thresholds
- Lists all failing metrics
- Mentions DevOps team for immediate attention

**Regression Notification:**

- Sent when performance degrades >10%
- Highlights regressed metrics
- Mentions DevOps team for investigation

## Interpreting Results

### Workflow Summary

The workflow summary shows a quick overview of results:

```markdown
## Lighthouse Scores (desktop)

| Category       | Score | Status |
| -------------- | ----- | ------ |
| Performance    | 92    | ✅     |
| Accessibility  | 96    | ✅     |
| Best Practices | 91    | ✅     |
| SEO            | 97    | ✅     |

## Lighthouse Scores (mobile)

| Category       | Score | Status |
| -------------- | ----- | ------ |
| Performance    | 88    | ❌     |
| Accessibility  | 95    | ✅     |
| Best Practices | 90    | ✅     |
| SEO            | 96    | ✅     |
```

### Detailed Reports

Download the HTML reports from workflow artifacts for detailed analysis:

1. Go to the workflow run
2. Scroll to **Artifacts** section
3. Download:
   - `lighthouse-report-desktop`
   - `lighthouse-report-mobile`
4. Open the HTML files in a browser

The detailed reports include:

- Specific recommendations for improvements
- Screenshots of the page
- Detailed metrics and timings
- Opportunities for optimization
- Diagnostics and warnings

### Performance Data

Download the JSON data for programmatic analysis:

```json
{
  "environment": "staging",
  "url": "https://staging.bayoncoagent.com",
  "timestamp": "2024-01-15T06:00:00Z",
  "commit": "abc123...",
  "workflow_run_id": "12345",
  "passed": true,
  "has_regressions": false,
  "scores": {
    "desktop": {
      "device": "desktop",
      "performance": 92,
      "accessibility": 96,
      "bestPractices": 91,
      "seo": 97
    },
    "mobile": {
      "device": "mobile",
      "performance": 88,
      "accessibility": 95,
      "bestPractices": 90,
      "seo": 96
    }
  }
}
```

## Common Issues and Solutions

### Performance Score Below Threshold

**Common Causes:**

- Large JavaScript bundles
- Unoptimized images
- Render-blocking resources
- Slow server response times

**Solutions:**

1. Review Lighthouse recommendations
2. Optimize bundle size (code splitting, tree shaking)
3. Compress and optimize images (WebP, AVIF)
4. Implement lazy loading
5. Use CDN for static assets
6. Enable caching

### Accessibility Score Below Threshold

**Common Causes:**

- Missing alt text on images
- Poor color contrast
- Missing form labels
- Keyboard navigation issues

**Solutions:**

1. Add descriptive alt text to all images
2. Ensure sufficient color contrast (WCAG AA)
3. Add labels to all form inputs
4. Test keyboard navigation
5. Use semantic HTML

### Best Practices Score Below Threshold

**Common Causes:**

- Console errors
- Deprecated APIs
- Insecure resources (HTTP)
- Missing security headers

**Solutions:**

1. Fix console errors and warnings
2. Update deprecated API usage
3. Ensure all resources use HTTPS
4. Add security headers (CSP, HSTS)
5. Remove unused code

### SEO Score Below Threshold

**Common Causes:**

- Missing meta descriptions
- Missing title tags
- Non-crawlable content
- Missing structured data

**Solutions:**

1. Add unique meta descriptions to all pages
2. Add descriptive title tags
3. Ensure content is crawlable (no JavaScript-only content)
4. Add structured data (JSON-LD)
5. Optimize for mobile

## Manual Testing

To run Lighthouse locally before pushing changes:

### Using Chrome DevTools

1. Open Chrome DevTools (F12)
2. Go to **Lighthouse** tab
3. Select categories to test
4. Choose device (mobile/desktop)
5. Click **Generate report**

### Using Lighthouse CLI

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://staging.bayoncoagent.com \
  --preset=desktop \
  --output=html \
  --output-path=./lighthouse-report.html

# Open report
open lighthouse-report.html
```

### Using Lighthouse CI

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run audit
lhci autorun --config=lighthouserc.json
```

## Best Practices

### Before Deployment

1. Run Lighthouse locally on your changes
2. Ensure all scores meet thresholds
3. Fix any issues before creating PR
4. Document any intentional score decreases

### After Deployment

1. Monitor performance test results
2. Review detailed reports for opportunities
3. Track trends over time
4. Set up alerts for regressions

### Continuous Improvement

1. Set performance budgets
2. Monitor Core Web Vitals
3. Optimize critical rendering path
4. Implement progressive enhancement
5. Test on real devices

## Troubleshooting

### Workflow Fails to Start

**Possible Causes:**

- Triggering workflow didn't complete successfully
- GitHub Actions quota exceeded
- Workflow file syntax error

**Solutions:**

1. Check triggering workflow status
2. Verify GitHub Actions quota
3. Validate workflow YAML syntax

### Lighthouse Audit Fails

**Possible Causes:**

- URL not accessible
- Timeout during audit
- Chrome headless issues

**Solutions:**

1. Verify URL is accessible
2. Check deployment status
3. Increase timeout if needed
4. Review Chrome flags

### Inconsistent Scores

**Possible Causes:**

- Network variability
- Server load
- Cache state
- Third-party resources

**Solutions:**

1. Run multiple audits
2. Use median scores
3. Test during off-peak hours
4. Minimize third-party dependencies

## Related Documentation

- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Web Vitals](https://web.dev/vitals/)
- [Performance Best Practices](https://web.dev/fast/)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [SEO Best Practices](https://developers.google.com/search/docs)

## Support

For questions or issues with performance testing:

1. Check this guide and related documentation
2. Review Lighthouse reports for specific recommendations
3. Contact DevOps team in #devops Slack channel
4. Create an issue in the repository
