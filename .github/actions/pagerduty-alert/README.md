# PagerDuty Alert Action

A reusable GitHub Action for creating PagerDuty incidents for critical failures and alerts in CI/CD workflows.

## Features

- ✅ Create, acknowledge, or resolve PagerDuty incidents
- ✅ Configurable severity levels (critical, error, warning, info)
- ✅ Automatic deduplication to prevent duplicate incidents
- ✅ Rich incident details with workflow context
- ✅ Links to GitHub Actions workflow runs
- ✅ Custom details support for additional context
- ✅ Validation of inputs before API calls
- ✅ Detailed error reporting

## Prerequisites

1. **PagerDuty Account**: You need an active PagerDuty account
2. **Integration Key**: Create an Events API v2 integration in PagerDuty
3. **GitHub Secret**: Store the integration key as `PAGERDUTY_INTEGRATION_KEY`

### Setting up PagerDuty Integration

1. Log in to your PagerDuty account
2. Go to **Services** → Select your service → **Integrations** tab
3. Click **Add Integration**
4. Select **Events API V2**
5. Give it a name (e.g., "GitHub Actions CI/CD")
6. Copy the **Integration Key** (routing key)
7. Add it to GitHub Secrets as `PAGERDUTY_INTEGRATION_KEY`

## Usage

### Basic Usage

```yaml
- name: Alert on critical failure
  if: failure()
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    severity: critical
    summary: "Production deployment failed"
    environment: production
```

### Complete Example

```yaml
- name: Create PagerDuty incident
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    event-action: trigger
    severity: critical
    summary: "CRITICAL: Rollback Failed - Production"
    component: "CI/CD Pipeline"
    group: "deployment"
    class: "rollback"
    environment: production
    custom-details: |
      {
        "deployment_id": "deploy-123",
        "error_message": "CloudFormation stack rollback failed",
        "affected_services": ["api", "frontend"]
      }
```

## Inputs

| Input             | Description                                                  | Required | Default               |
| ----------------- | ------------------------------------------------------------ | -------- | --------------------- |
| `integration-key` | PagerDuty integration key (routing key)                      | Yes      | -                     |
| `event-action`    | Event action: `trigger`, `acknowledge`, or `resolve`         | No       | `trigger`             |
| `severity`        | Incident severity: `critical`, `error`, `warning`, or `info` | No       | `critical`            |
| `summary`         | Brief summary of the incident                                | Yes      | -                     |
| `source`          | Source of the incident                                       | No       | `GitHub Actions`      |
| `component`       | Component affected                                           | No       | `CI/CD Pipeline`      |
| `group`           | Logical grouping of the incident                             | No       | -                     |
| `class`           | Class/type of the incident                                   | No       | -                     |
| `environment`     | Deployment environment                                       | No       | -                     |
| `workflow-url`    | URL to the workflow run                                      | No       | Auto-generated        |
| `commit-sha`      | Git commit SHA                                               | No       | `${{ github.sha }}`   |
| `triggered-by`    | User who triggered the workflow                              | No       | `${{ github.actor }}` |
| `custom-details`  | Additional custom details as JSON string                     | No       | -                     |
| `dedup-key`       | Deduplication key to prevent duplicate incidents             | No       | Auto-generated        |

## Outputs

| Output         | Description                                               |
| -------------- | --------------------------------------------------------- |
| `incident-key` | PagerDuty incident key (dedup_key)                        |
| `status`       | Status of the PagerDuty API call (`success` or `failure`) |

## Severity Levels

Choose the appropriate severity level for your incident:

- **critical**: System is down or severely impacted, requires immediate attention
- **error**: Significant issue that needs attention but system is still operational
- **warning**: Potential issue that should be investigated
- **info**: Informational alert, no immediate action required

## Event Actions

- **trigger**: Create a new incident (default)
- **acknowledge**: Acknowledge an existing incident
- **resolve**: Resolve an existing incident

## Examples

### Example 1: Deployment Failure

```yaml
- name: Alert on deployment failure
  if: failure()
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    severity: critical
    summary: "Production deployment failed"
    environment: production
    component: "Deployment Pipeline"
    group: "deployment"
    class: "infrastructure"
```

### Example 2: Rollback Failure

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
    custom-details: |
      {
        "target_version": "${{ needs.validate-rollback.outputs.target-version }}",
        "reason": "${{ inputs.reason }}",
        "infrastructure_status": "${{ needs.rollback-infrastructure.result }}",
        "frontend_status": "${{ needs.rollback-frontend.result }}"
      }
```

### Example 3: Security Vulnerability

```yaml
- name: Alert on critical vulnerability
  if: steps.security-scan.outputs.critical-count > 0
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    severity: error
    summary: "Critical security vulnerabilities detected"
    component: "Security Scanner"
    group: "security"
    class: "vulnerability"
    custom-details: |
      {
        "critical_count": "${{ steps.security-scan.outputs.critical-count }}",
        "high_count": "${{ steps.security-scan.outputs.high-count }}",
        "scan_type": "dependency"
      }
```

### Example 4: Performance Degradation

```yaml
- name: Alert on performance degradation
  if: steps.lighthouse.outputs.performance_score < 70
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    severity: warning
    summary: "Performance score dropped below threshold"
    environment: staging
    component: "Performance Monitoring"
    group: "performance"
    custom-details: |
      {
        "performance_score": "${{ steps.lighthouse.outputs.performance_score }}",
        "threshold": "70",
        "url": "${{ steps.deploy.outputs.url }}"
      }
```

### Example 5: Acknowledge Incident

```yaml
- name: Acknowledge incident
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    event-action: acknowledge
    dedup-key: ${{ steps.create-incident.outputs.incident-key }}
    summary: "Team is investigating the issue"
```

### Example 6: Resolve Incident

```yaml
- name: Resolve incident
  if: success()
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    event-action: resolve
    dedup-key: ${{ steps.create-incident.outputs.incident-key }}
    summary: "Issue has been resolved"
```

## Conditional Execution

Only create incidents when PagerDuty is configured:

```yaml
- name: Alert on failure
  if: failure() && secrets.PAGERDUTY_INTEGRATION_KEY != ''
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    severity: critical
    summary: "Critical failure occurred"
```

## Deduplication

The action automatically generates a deduplication key based on:

- Workflow name
- Environment
- Run ID

This prevents duplicate incidents for the same failure. You can also provide a custom dedup key:

```yaml
- name: Create incident with custom dedup key
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    summary: "Deployment failed"
    dedup-key: "deploy-prod-${{ github.run_id }}"
```

## Custom Details

Add any additional context as JSON:

```yaml
custom-details: |
  {
    "deployment_id": "deploy-123",
    "error_code": "E500",
    "affected_users": 1500,
    "region": "us-east-1",
    "logs_url": "https://cloudwatch.aws.amazon.com/..."
  }
```

## Integration with Other Actions

### With Slack Notification

```yaml
- name: Notify team via Slack
  if: failure()
  uses: ./.github/actions/slack-notify
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    message-type: urgent
    title: "Deployment Failed"
    message: "Production deployment has failed. PagerDuty incident created."

- name: Escalate to PagerDuty
  if: failure() && secrets.PAGERDUTY_INTEGRATION_KEY != ''
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    severity: critical
    summary: "Production deployment failed"
```

### With Email Notification

```yaml
- name: Send email alert
  if: failure()
  uses: ./.github/actions/email-notify
  with:
    smtp-server: ${{ secrets.SMTP_SERVER }}
    to: devops@company.com
    subject: "Deployment Failed"
    body: "Production deployment has failed. Check PagerDuty for details."

- name: Create PagerDuty incident
  if: failure()
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    severity: critical
    summary: "Production deployment failed"
```

## Troubleshooting

### Issue: "Failed to create PagerDuty incident"

**Possible causes:**

1. Invalid integration key
2. Network connectivity issues
3. PagerDuty service is down
4. Invalid payload format

**Solutions:**

1. Verify the integration key in PagerDuty
2. Check GitHub Actions logs for detailed error messages
3. Verify the integration key is correctly stored in GitHub Secrets
4. Test the integration key using PagerDuty's API documentation

### Issue: Duplicate incidents created

**Solution:** Use a consistent dedup-key across related workflow runs:

```yaml
dedup-key: "deploy-${{ inputs.environment }}-${{ github.sha }}"
```

### Issue: Incidents not showing in PagerDuty

**Possible causes:**

1. Integration is not connected to a service
2. Service is in maintenance mode
3. Routing rules are filtering the incident

**Solutions:**

1. Verify the integration is connected to an active service
2. Check service settings in PagerDuty
3. Review routing rules and escalation policies

## Best Practices

1. **Use appropriate severity levels**: Reserve `critical` for true emergencies
2. **Provide context**: Include relevant details in `custom-details`
3. **Use deduplication**: Prevent alert fatigue with proper dedup keys
4. **Conditional execution**: Only create incidents when PagerDuty is configured
5. **Combine with other notifications**: Use Slack/email for team awareness
6. **Test in staging**: Verify PagerDuty integration before production use
7. **Document escalation**: Ensure team knows how to respond to incidents

## Security Considerations

- Never commit integration keys to the repository
- Store integration keys in GitHub Secrets
- Use environment-specific integration keys
- Rotate integration keys regularly
- Limit access to PagerDuty configuration

## API Reference

This action uses the [PagerDuty Events API v2](https://developer.pagerduty.com/docs/ZG9jOjExMDI5NTgw-events-api-v2-overview).

## Support

For issues with this action:

1. Check the GitHub Actions logs
2. Review the PagerDuty Events API documentation
3. Verify your integration key and service configuration
4. Contact your DevOps team

For PagerDuty-specific issues:

- [PagerDuty Support](https://support.pagerduty.com/)
- [PagerDuty API Documentation](https://developer.pagerduty.com/)
