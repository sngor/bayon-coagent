# Production Validation Scripts

This directory contains comprehensive scripts for validating and monitoring the AI Model Optimization feature in production.

## Overview

The AI Model Optimization feature optimizes model selection across all AI features to improve performance, reduce costs, and enhance reliability. These scripts help validate that the optimization is delivering expected results.

## Scripts

### 1. Production Performance Validation

**File**: `validate-production-performance.ts`

Validates that the AI Model Optimization is delivering expected improvements.

**Usage**:

```bash
tsx scripts/validate-production-performance.ts <userId> [beforeDays] [afterDays]
```

**Example**:

```bash
# Validate last 30 days vs previous 60 days
tsx scripts/validate-production-performance.ts user123 60 30
```

**What it validates**:

- ✅ Performance improvements (25-35% latency reduction)
- ✅ Cost savings (40-50% reduction)
- ✅ Error rates (<3%)
- ✅ Success rates (>97%)
- ✅ P99 latency (<5 seconds)
- ✅ Feature-specific improvements

**Output**:

- Detailed validation results by category
- Pass/Fail/Warning status for each metric
- Actionable recommendations
- Exit code 0 for pass, 1 for fail

---

### 2. User Feedback Collection

**File**: `collect-user-feedback.ts`

Analyzes user feedback and satisfaction with AI features.

**Usage**:

```bash
tsx scripts/collect-user-feedback.ts <userId> [days]
```

**Example**:

```bash
# Analyze last 30 days of user feedback
tsx scripts/collect-user-feedback.ts user123 30
```

**What it analyzes**:

- 📊 Regeneration patterns (multiple calls to same feature)
- ✨ Quality indicators (validation failures, parse errors)
- ⚡ Response time satisfaction
- 😊 Overall satisfaction score (0-100)
- 🎯 Feature-specific feedback

**Output**:

- Overall metrics (total generations, regeneration rate)
- Quality indicators
- Feature usage and regeneration rates
- Satisfaction assessment
- Improvement recommendations

---

### 3. Production Monitoring Dashboard

**File**: `production-monitoring-dashboard.ts`

Real-time monitoring dashboard for AI features.

**Usage**:

```bash
tsx scripts/production-monitoring-dashboard.ts <userId> [refreshInterval]
```

**Example**:

```bash
# Start dashboard with 60-second refresh
tsx scripts/production-monitoring-dashboard.ts user123 60
```

**What it monitors**:

- ⚡ Performance (latency, invocations)
- 💰 Cost (hourly, daily, monthly projection)
- 🛡️ Reliability (success rate, error rate, retry rate)
- 📊 Usage (tokens by model and category)
- 🚨 Alerts (critical, warning, info)

**Output**:

- Live dashboard that auto-refreshes
- Color-coded alerts
- Top costly features
- Recent errors
- Press Ctrl+C to exit

---

### 4. Cost Report Generation

**File**: `generate-cost-report.ts`

Generates detailed cost analysis reports.

**Usage**:

```bash
tsx scripts/generate-cost-report.ts <userId> [days]
```

**Example**:

```bash
# Generate cost report for last 30 days
tsx scripts/generate-cost-report.ts user123 30
```

**What it reports**:

- 💰 Total cost and projections
- 📊 Cost by category and model
- 🔥 Top costly features
- 📋 Detailed feature breakdown
- 📅 Daily cost trends

---

### 5. Cost Comparison

**File**: `generate-cost-comparison.ts`

Compares costs between two periods to show optimization impact.

**Usage**:

```bash
tsx scripts/generate-cost-comparison.ts <userId> [beforeDays] [afterDays]
```

**Example**:

```bash
# Compare last 30 days vs previous 60 days
tsx scripts/generate-cost-comparison.ts user123 60 30
```

**What it compares**:

- 💰 Before/after costs
- 📊 Savings by feature
- 📈 Percentage improvements
- 💡 Monthly projections

---

## Quick Start

### 1. Initial Validation

After deploying the AI Model Optimization feature, run an initial validation:

```bash
# Validate performance and cost improvements
tsx scripts/validate-production-performance.ts <userId> 60 30

# Collect baseline user feedback
tsx scripts/collect-user-feedback.ts <userId> 30

# Generate cost comparison
tsx scripts/generate-cost-comparison.ts <userId> 60 30
```

### 2. Daily Monitoring

Set up daily validation:

```bash
#!/bin/bash
# daily-validation.sh

tsx scripts/validate-production-performance.ts user123 60 30 > validation-$(date +%Y%m%d).txt

if [ $? -eq 0 ]; then
    echo "✅ Validation passed"
else
    echo "❌ Validation failed - check report"
    # Send alert
fi
```

### 3. Continuous Monitoring

Start the real-time dashboard:

```bash
# Start dashboard in background
nohup tsx scripts/production-monitoring-dashboard.ts user123 60 > dashboard.log 2>&1 &

# View logs
tail -f dashboard.log
```

---

## Expected Results

### Performance Improvements

Based on `EXPECTED_IMPROVEMENTS.md`:

| Feature Category    | Expected Improvement |
| ------------------- | -------------------- |
| Simple Features     | 60-75% faster        |
| Short-Form Content  | 40-50% faster        |
| Long-Form Content   | 20-33% faster        |
| Analytical Features | 0-10% faster         |
| Overall             | 25-35% faster        |

### Cost Savings

| Metric                  | Expected Savings |
| ----------------------- | ---------------- |
| Overall                 | 40-50% reduction |
| Haiku Features          | ~91.7% reduction |
| Monthly (current scale) | $190/month       |
| Annual (current scale)  | $2,280/year      |

### Reliability Targets

| Metric             | Target          |
| ------------------ | --------------- |
| Error Rate         | <3%             |
| Success Rate       | >97%            |
| P99 Latency        | <5 seconds      |
| Feature Error Rate | <5% per feature |

---

## Troubleshooting

### No Data Found

If scripts report "No execution logs found":

1. Verify the userId is correct
2. Check that AI features have been used in the specified period
3. Verify execution logging is enabled
4. Check DynamoDB for execution logs

### Validation Failures

If validation fails:

1. Review the specific metrics that failed
2. Check the recommendations in the output
3. Review error logs for patterns
4. Verify model configuration is correct
5. Check for network or API issues

### Dashboard Not Updating

If the dashboard stops updating:

1. Check network connectivity
2. Verify AWS credentials are valid
3. Check DynamoDB access permissions
4. Review dashboard.log for errors

---

## Automation

### Cron Jobs

Set up automated validation:

```bash
# Add to crontab
# Daily validation at 2 AM
0 2 * * * /path/to/daily-validation.sh

# Weekly feedback collection on Mondays at 9 AM
0 9 * * 1 tsx /path/to/scripts/collect-user-feedback.ts user123 7 > /path/to/feedback-$(date +\%Y\%m\%d).txt
```

### CI/CD Integration

Add validation to deployment pipeline:

```yaml
# .github/workflows/validate-production.yml
name: Validate Production

on:
  schedule:
    - cron: "0 2 * * *" # Daily at 2 AM

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: tsx scripts/validate-production-performance.ts ${{ secrets.USER_ID }} 60 30
      - name: Send notification
        if: failure()
        run: |
          # Send alert to Slack/email
```

---

## Integration with CloudWatch

These scripts complement CloudWatch monitoring:

### CloudWatch Logs

- Scripts query execution logs from DynamoDB
- Logs are also sent to CloudWatch Logs
- Use CloudWatch Insights for ad-hoc queries

### CloudWatch Metrics

- Scripts calculate metrics from logs
- Can be extended to publish to CloudWatch Metrics
- Use CloudWatch Dashboards for visualization

### CloudWatch Alarms

- Scripts generate alerts based on thresholds
- Can trigger CloudWatch Alarms
- Use SNS for notifications

---

## Best Practices

### Validation Frequency

- **Initial**: Run validation immediately after deployment
- **Daily**: Automated validation to catch regressions
- **Weekly**: Detailed feedback analysis
- **Monthly**: Comprehensive cost and performance review

### Monitoring Strategy

- **Real-Time**: Use dashboard for live monitoring
- **Alerts**: Set up automated alerts for critical issues
- **Reports**: Generate weekly/monthly reports for stakeholders
- **Trends**: Track metrics over time to identify patterns

### Data Retention

- Keep validation reports for at least 90 days
- Archive cost reports for annual analysis
- Retain feedback data for trend analysis
- Store dashboard logs for troubleshooting

---

## Support

For issues or questions:

1. Check `TASK_20_COMPLETION.md` for detailed documentation
2. Review `EXPECTED_IMPROVEMENTS.md` for expected results
3. Check `MONITORING_SETUP.md` for CloudWatch configuration
4. Review `DEPLOYMENT_GUIDE.md` for deployment procedures

---

## Related Documentation

- `.kiro/specs/ai-model-optimization/TASK_20_COMPLETION.md` - Task completion summary
- `.kiro/specs/ai-model-optimization/EXPECTED_IMPROVEMENTS.md` - Expected improvements
- `.kiro/specs/ai-model-optimization/MONITORING_SETUP.md` - CloudWatch setup
- `.kiro/specs/ai-model-optimization/DEPLOYMENT_GUIDE.md` - Deployment guide
- `.kiro/specs/ai-model-optimization/ROLLBACK_PLAN.md` - Rollback procedures

---

**Last Updated**: November 27, 2024  
**Version**: 1.0
