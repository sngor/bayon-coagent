# GitHub Actions Cost Monitoring Guide

## Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Configuration](#configuration)
4. [Understanding the Reports](#understanding-the-reports)
5. [Cost Optimization Strategies](#cost-optimization-strategies)
6. [Alert Management](#alert-management)
7. [Best Practices](#best-practices)

## Overview

The GitHub Actions cost monitoring system helps you:

- **Track Usage**: Monitor GitHub Actions minutes consumed across all workflows
- **Control Costs**: Stay within budget with automated alerts and reporting
- **Identify Waste**: Find inefficient workflows and optimization opportunities
- **Plan Capacity**: Understand usage patterns and forecast future costs

### Key Features

- ✅ Automated daily monitoring
- ✅ Real-time budget tracking
- ✅ Workflow-level cost breakdown
- ✅ Environment-based analysis
- ✅ Automated alerts at 80% threshold
- ✅ Detailed optimization recommendations
- ✅ Historical data retention (90 days)

## How It Works

### Data Collection

The workflow uses the GitHub API to:

1. Retrieve all workflow runs from the specified period (default: 30 days)
2. Calculate duration for each completed run
3. Aggregate minutes by workflow name and environment
4. Apply GitHub Actions pricing ($0.008/minute for Linux runners)

### Cost Calculation

```
Total Cost = Total Minutes × $0.008
Budget Usage = (Total Minutes / Budget Minutes) × 100%
```

**Default Budget**: 10,000 minutes/month ($80/month)

### Alert Logic

```
if Budget Usage > 80%:
    - Send Slack notification
    - Create/update GitHub issue
    - Mention DevOps team
```

## Configuration

### 1. Set Monthly Budget

Edit `.github/workflows/cost-monitoring.yml`:

```yaml
# Line ~70
MONTHLY_BUDGET_MINUTES=10000 # Adjust this value
```

**Recommended Budgets by Team Size:**

| Team Size     | Workflows          | Suggested Budget | Monthly Cost |
| ------------- | ------------------ | ---------------- | ------------ |
| Small (1-5)   | Basic CI/CD        | 5,000 min        | $40          |
| Medium (5-15) | Full pipeline      | 10,000 min       | $80          |
| Large (15+)   | Complex automation | 20,000 min       | $160         |

### 2. Configure Slack Notifications

Add these secrets to your GitHub repository:

```bash
# Required for notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Optional: Mention specific users on alerts
SLACK_DEVOPS_MENTIONS=U01234567,U89012345
```

**To get Slack webhook URL:**

1. Go to your Slack workspace settings
2. Navigate to Apps → Incoming Webhooks
3. Create a new webhook for your channel
4. Copy the webhook URL

### 3. Adjust Alert Threshold

To change when alerts trigger, edit the workflow:

```yaml
# Line ~95
if (( $(echo "$BUDGET_PERCENTAGE > 80" | bc -l) )); then
ALERT_NEEDED="true"
fi
```

Change `80` to your desired threshold (e.g., `70` for earlier warnings).

### 4. Customize Reporting Period

The workflow supports three periods:

- `1d` - Last 24 hours
- `7d` - Last 7 days
- `30d` - Last 30 days (default)

**Manual trigger with custom period:**

```bash
gh workflow run cost-monitoring.yml -f period=7d
```

## Understanding the Reports

### Summary Section

```markdown
| Metric         | Value    |
| -------------- | -------- |
| Total Minutes  | 3,245.50 |
| Estimated Cost | $25.96   |
| Budget Usage   | 32.5%    |
```

**Interpretation:**

- **Total Minutes**: Actual GitHub Actions time consumed
- **Estimated Cost**: Based on $0.008/minute pricing
- **Budget Usage**: Percentage of your monthly budget used

### Top Workflows

```markdown
| Workflow | Minutes  | Cost  | Runs |
| -------- | -------- | ----- | ---- |
| CI       | 1,234.50 | $9.88 | 156  |
```

**What to look for:**

- Workflows with high minutes but few runs → Long-running jobs
- Workflows with many runs → Frequent triggers (may need optimization)
- High-cost workflows → Priority targets for optimization

### Environment Breakdown

```markdown
| Environment | Minutes  | Cost   | Runs |
| ----------- | -------- | ------ | ---- |
| development | 1,456.00 | $11.65 | 78   |
| staging     | 892.50   | $7.14  | 23   |
| production  | 567.00   | $4.54  | 12   |
```

**Typical patterns:**

- Development should have highest run count (frequent commits)
- Production should have lowest run count (controlled releases)
- Staging should be moderate (release candidates)

**Red flags:**

- Production runs > Development runs → May indicate hotfix issues
- Staging costs > Development costs → Inefficient staging tests

## Cost Optimization Strategies

### 1. Implement Aggressive Caching

**Before:**

```yaml
- name: Install dependencies
  run: npm ci
```

**After:**

```yaml
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

- name: Install dependencies
  run: npm ci
```

**Savings**: 30-50% reduction in build times

### 2. Use Conditional Execution

**Skip tests for docs-only changes:**

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    if: |
      !contains(github.event.head_commit.message, '[skip ci]') &&
      !contains(github.event.head_commit.message, '[docs only]')
```

**Savings**: 20-30% reduction in unnecessary runs

### 3. Parallelize Jobs

**Before (Sequential):**

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [...]

  test:
    needs: lint
    runs-on: ubuntu-latest
    steps: [...]
```

**After (Parallel):**

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [...]

  test:
    runs-on: ubuntu-latest
    steps: [...]
```

**Savings**: 40-60% reduction in total workflow time

### 4. Optimize Test Execution

**Run only affected tests:**

```yaml
- name: Run affected tests
  run: |
    CHANGED_FILES=$(git diff --name-only HEAD~1)
    if echo "$CHANGED_FILES" | grep -q "src/"; then
      npm test -- --findRelatedTests $CHANGED_FILES
    else
      echo "No source files changed, skipping tests"
    fi
```

**Savings**: 50-70% reduction in test time

### 5. Use Path Filters

**Only run workflows when relevant files change:**

```yaml
on:
  push:
    paths:
      - "src/**"
      - "package.json"
      - "package-lock.json"
    paths-ignore:
      - "**.md"
      - "docs/**"
```

**Savings**: 15-25% reduction in workflow runs

### 6. Adjust Scheduled Workflows

**Review frequency of scheduled jobs:**

```yaml
# Before: Every hour
schedule:
  - cron: '0 * * * *'

# After: Every 6 hours
schedule:
  - cron: '0 */6 * * *'
```

**Savings**: 75% reduction in scheduled runs

## Alert Management

### When You Receive an Alert

1. **Review the Report**

   - Check which workflows are consuming the most minutes
   - Identify any unusual spikes in usage
   - Look for patterns (time of day, specific branches)

2. **Immediate Actions**

   - Cancel any stuck or unnecessary workflow runs
   - Review recent changes that may have increased usage
   - Check for infinite loops or retry logic issues

3. **Short-term Fixes**

   - Implement caching for high-usage workflows
   - Add conditional execution to skip unnecessary runs
   - Optimize test suites to run faster

4. **Long-term Solutions**
   - Consider self-hosted runners for high-volume workflows
   - Implement more aggressive optimization strategies
   - Review and adjust budget if usage is justified

### Alert Escalation

**Level 1: 80% Budget** (Warning)

- Slack notification sent
- GitHub issue created
- Review and optimize within 48 hours

**Level 2: 90% Budget** (Critical)

- Urgent Slack notification with mentions
- Immediate review required
- Consider temporary workflow restrictions

**Level 3: 100% Budget** (Emergency)

- All stakeholders notified
- Pause non-critical workflows
- Emergency optimization session

## Best Practices

### 1. Regular Monitoring

- Review cost reports weekly
- Track trends over time
- Set up custom dashboards for key metrics

### 2. Proactive Optimization

- Don't wait for alerts to optimize
- Regularly review top workflows
- Implement optimizations incrementally

### 3. Budget Planning

- Review usage quarterly
- Adjust budget based on team growth
- Plan for seasonal variations (releases, sprints)

### 4. Documentation

- Document optimization efforts
- Share learnings with the team
- Update runbooks with new strategies

### 5. Team Awareness

- Share cost reports in team meetings
- Educate developers on cost implications
- Celebrate optimization wins

## Advanced Topics

### Custom Cost Tracking

For more granular tracking, you can:

1. **Tag Workflows**: Add labels to workflow runs
2. **Custom Metrics**: Export data to external analytics
3. **Cost Attribution**: Track costs by team or project

### Integration with Other Tools

- **DataDog**: Export metrics for advanced visualization
- **Grafana**: Create custom dashboards
- **PagerDuty**: Integrate critical alerts

### Self-Hosted Runners

For very high usage, consider self-hosted runners:

**Pros:**

- No per-minute costs
- Full control over environment
- Potentially faster execution

**Cons:**

- Infrastructure management overhead
- Security considerations
- Maintenance requirements

## Troubleshooting

### Issue: Inaccurate Cost Calculations

**Possible Causes:**

- Workflow runs still in progress
- API rate limiting
- Timezone differences

**Solution:**

- Wait for all runs to complete
- Run workflow during off-peak hours
- Verify date calculations in workflow

### Issue: Missing Workflow Data

**Possible Causes:**

- Workflows filtered out by date range
- Insufficient API permissions
- Repository visibility settings

**Solution:**

- Extend date range
- Check `GITHUB_TOKEN` permissions
- Verify repository access

### Issue: Alerts Not Triggering

**Possible Causes:**

- Slack webhook not configured
- Budget threshold not exceeded
- Workflow permissions issue

**Solution:**

- Verify `SLACK_WEBHOOK_URL` secret
- Check budget usage percentage
- Review workflow logs for errors

## Resources

- [GitHub Actions Pricing](https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions)
- [Workflow Optimization](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Caching Dependencies](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [Self-Hosted Runners](https://docs.github.com/en/actions/hosting-your-own-runners/about-self-hosted-runners)

## Support

For questions or issues:

- **Slack**: #devops-support
- **Email**: devops@example.com
- **GitHub Issues**: Tag with `cost-monitoring` label
