# PagerDuty Integration Quick Reference

Quick reference for using the PagerDuty alert action in CI/CD workflows.

## Setup (One-Time)

1. Get integration key from PagerDuty (Services → Integrations → Events API V2)
2. Add to GitHub Secrets: `PAGERDUTY_INTEGRATION_KEY`

## Basic Usage

```yaml
- name: Alert on failure
  if: failure()
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    severity: critical
    summary: "Brief description of the incident"
    environment: production
```

## Severity Levels

| Severity   | When to Use                                 |
| ---------- | ------------------------------------------- |
| `critical` | System down, requires immediate attention   |
| `error`    | Significant issue, system still operational |
| `warning`  | Potential issue, should be investigated     |
| `info`     | Informational, no immediate action needed   |

## Common Patterns

### Deployment Failure

```yaml
- name: Alert deployment failure
  if: failure()
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    severity: critical
    summary: "Production deployment failed"
    environment: production
    component: "Deployment Pipeline"
```

### Rollback Failure

```yaml
- name: Escalate rollback failure
  if: failure()
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    severity: critical
    summary: "CRITICAL: Rollback Failed - ${{ inputs.environment }}"
    environment: ${{ inputs.environment }}
    component: "Rollback System"
    group: "rollback"
```

### Security Vulnerability

```yaml
- name: Alert critical vulnerability
  if: steps.scan.outputs.critical-count > 0
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    severity: error
    summary: "Critical vulnerabilities detected"
    component: "Security Scanner"
    custom-details: |
      {
        "critical_count": "${{ steps.scan.outputs.critical-count }}"
      }
```

### Performance Degradation

```yaml
- name: Alert performance issue
  if: steps.lighthouse.outputs.score < 70
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    severity: warning
    summary: "Performance score below threshold"
    environment: staging
    custom-details: |
      {
        "score": "${{ steps.lighthouse.outputs.score }}",
        "threshold": "70"
      }
```

## Multi-Channel Escalation

Combine with Slack and email for comprehensive alerting:

```yaml
# 1. Notify team via Slack
- name: Slack alert
  if: failure()
  uses: ./.github/actions/slack-notify
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    message-type: urgent
    title: "Critical Failure"
    message: "PagerDuty incident created"

# 2. Send email
- name: Email alert
  if: failure()
  uses: ./.github/actions/email-notify
  with:
    smtp-server: ${{ secrets.SMTP_SERVER }}
    to-emails: ${{ secrets.ONCALL_EMAILS }}
    subject: "🚨 Critical Failure"

# 3. Create PagerDuty incident
- name: PagerDuty escalation
  if: failure() && secrets.PAGERDUTY_INTEGRATION_KEY != ''
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    severity: critical
    summary: "Critical failure occurred"
```

## Conditional Execution

Only create incidents when PagerDuty is configured:

```yaml
if: failure() && secrets.PAGERDUTY_INTEGRATION_KEY != ''
```

## Event Actions

### Trigger (Create Incident)

```yaml
event-action: trigger # default
```

### Acknowledge Incident

```yaml
event-action: acknowledge
dedup-key: ${{ steps.create.outputs.incident-key }}
```

### Resolve Incident

```yaml
event-action: resolve
dedup-key: ${{ steps.create.outputs.incident-key }}
```

## Custom Details

Add context with JSON:

```yaml
custom-details: |
  {
    "deployment_id": "${{ github.run_id }}",
    "error_code": "E500",
    "affected_users": 1500,
    "logs_url": "https://cloudwatch.aws.amazon.com/..."
  }
```

## Deduplication

Automatic dedup key:

```
{workflow-name}-{environment}-{run-id}
```

Custom dedup key:

```yaml
dedup-key: "deploy-prod-${{ github.sha }}"
```

## Outputs

Use outputs for workflow chaining:

```yaml
- name: Create incident
  id: pagerduty
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    summary: "Incident created"

- name: Use incident key
  run: |
    echo "Incident: ${{ steps.pagerduty.outputs.incident-key }}"
    echo "Status: ${{ steps.pagerduty.outputs.status }}"
```

## Best Practices

1. ✅ Use `critical` only for true emergencies
2. ✅ Include relevant context in `custom-details`
3. ✅ Use consistent dedup keys to prevent duplicates
4. ✅ Always check if PagerDuty is configured
5. ✅ Combine with Slack/email for team awareness
6. ✅ Test in staging before production use

## Troubleshooting

### Incident not created

- Check integration key is correct
- Verify integration is enabled in PagerDuty
- Check workflow logs for error messages

### Duplicate incidents

- Use consistent dedup-key
- Check dedup key format

### Wrong severity

- Verify severity input value
- Must be: critical, error, warning, or info

## Quick Test

```yaml
name: Test PagerDuty

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/pagerduty-alert
        with:
          integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
          severity: info
          summary: "Test incident"
          environment: development
```

## Documentation

- Full README: `.github/actions/pagerduty-alert/README.md`
- Integration Guide: `.github/actions/NOTIFICATION_INTEGRATION_GUIDE.md`
- PagerDuty API: https://developer.pagerduty.com/docs/ZG9jOjExMDI5NTgw-events-api-v2-overview

## Support

- Check GitHub Actions logs for detailed errors
- Review PagerDuty service configuration
- Verify integration key and service connection
- Contact DevOps team for assistance
