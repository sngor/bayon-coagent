# Cost Monitoring Quick Reference

## Overview

The cost monitoring workflow tracks GitHub Actions usage and costs, helping you stay within budget and identify optimization opportunities.

## Workflow File

`.github/workflows/cost-monitoring.yml`

## Triggers

### Automatic

- **Daily at 2am UTC** - Scheduled monitoring run

### Manual

```bash
# Trigger via GitHub CLI
gh workflow run cost-monitoring.yml

# With custom period
gh workflow run cost-monitoring.yml -f period=7d -f send_report=true
```

## What It Does

### 1. Track Usage (track-usage job)

- Retrieves all workflow runs from the last 30 days (configurable)
- Calculates total minutes consumed
- Estimates costs based on GitHub Actions pricing ($0.008/minute)
- Compares usage against monthly budget (10,000 minutes default)
- Breaks down usage by workflow and environment

### 2. Send Alerts (alert-on-threshold job)

- Triggers when usage exceeds 80% of budget
- Sends Slack notification to DevOps team
- Creates or updates GitHub issue with cost alert
- Provides actionable recommendations

### 3. Generate Report (generate-report job)

- Creates detailed markdown cost report
- Shows top workflows by usage
- Breaks down costs by environment
- Suggests optimization opportunities
- Uploads report as artifact
- Sends summary to Slack

## Key Metrics

| Metric                    | Description                                 |
| ------------------------- | ------------------------------------------- |
| **Total Minutes**         | Total GitHub Actions minutes consumed       |
| **Estimated Cost**        | Calculated cost based on usage ($0.008/min) |
| **Budget Usage**          | Percentage of monthly budget consumed       |
| **Top Workflows**         | Workflows consuming the most minutes        |
| **Environment Breakdown** | Usage split by dev/staging/production       |

## Budget Configuration

The default budget is **10,000 minutes/month** ($80/month).

To adjust the budget, edit `.github/workflows/cost-monitoring.yml`:

```yaml
# In the "Calculate usage and costs" step
MONTHLY_BUDGET_MINUTES=10000 # Change this value
```

## Alert Thresholds

- **< 50%** - ✅ Healthy (no alerts)
- **50-80%** - ⚠️ Warning (monitoring)
- **> 80%** - 🚨 Critical (alerts sent)

## Required Secrets

| Secret                  | Description                         | Required |
| ----------------------- | ----------------------------------- | -------- |
| `SLACK_WEBHOOK_URL`     | Slack webhook for notifications     | Optional |
| `SLACK_DEVOPS_MENTIONS` | Slack user IDs to mention in alerts | Optional |

## Viewing Reports

### Via GitHub Actions UI

1. Go to **Actions** tab
2. Select **Cost Monitoring** workflow
3. Click on the latest run
4. Download **cost-report** artifact

### Via GitHub CLI

```bash
# List recent runs
gh run list --workflow=cost-monitoring.yml

# View specific run
gh run view <run-id>

# Download report artifact
gh run download <run-id> -n cost-report-<run-id>
```

## Example Report

```markdown
# GitHub Actions Cost Report

**Generated:** 2024-12-03 02:00:00 UTC
**Period:** Last 30 days
**Status:** ✅ Healthy

## Summary

| Metric         | Value    |
| -------------- | -------- |
| Total Minutes  | 3,245.50 |
| Estimated Cost | $25.96   |
| Budget Usage   | 32.5%    |

## Top Workflows by Usage

| Workflow           | Minutes  | Cost  | Runs |
| ------------------ | -------- | ----- | ---- |
| CI                 | 1,234.50 | $9.88 | 156  |
| Deploy Development | 876.25   | $7.01 | 45   |
| Security Scan      | 543.75   | $4.35 | 89   |

## Usage by Environment

| Environment | Minutes  | Cost   | Runs |
| ----------- | -------- | ------ | ---- |
| development | 1,456.00 | $11.65 | 78   |
| staging     | 892.50   | $7.14  | 23   |
| production  | 567.00   | $4.54  | 12   |
```

## Optimization Tips

### High Usage Workflows

If certain workflows consume excessive minutes:

- Implement more aggressive caching
- Use conditional job execution
- Optimize test suites
- Consider self-hosted runners

### Frequent Runs

If workflows run too often:

- Review trigger conditions
- Adjust scheduled workflow frequency
- Use path filters to skip unnecessary runs

### Long-Running Jobs

If jobs take too long:

- Parallelize test execution
- Optimize build processes
- Cache dependencies effectively
- Split large jobs into smaller ones

## Troubleshooting

### No Data Showing

- Ensure workflows have run in the selected period
- Check that `GITHUB_TOKEN` has proper permissions
- Verify the repository has workflow runs

### Alerts Not Sending

- Confirm `SLACK_WEBHOOK_URL` is configured
- Check Slack webhook is valid and active
- Verify budget threshold is exceeded (>80%)

### Report Not Generated

- Check workflow completed successfully
- Verify artifact upload succeeded
- Ensure sufficient storage quota

## Related Documentation

- [GitHub Actions Billing](https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions)
- [Workflow Optimization Guide](./workflow-optimization-guide.md)
- [Slack Notifications](./slack-notifications-guide.md)

## Quick Commands

```bash
# View current month's usage
gh workflow run cost-monitoring.yml -f period=30d

# Check last week's usage
gh workflow run cost-monitoring.yml -f period=7d

# Generate report without Slack notification
gh workflow run cost-monitoring.yml -f send_report=false

# View latest cost report
gh run list --workflow=cost-monitoring.yml --limit 1
```

## Support

For issues or questions:

1. Check workflow run logs in GitHub Actions
2. Review this documentation
3. Contact DevOps team via Slack
4. Create an issue in the repository
