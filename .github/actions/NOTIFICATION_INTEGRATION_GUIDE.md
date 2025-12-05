# Notification Integration Guide

This guide shows how to integrate the Slack and Email notification actions into your deployment workflows.

## Available Actions

- **Slack Notification** (`.github/actions/slack-notify`)
- **Email Notification** (`.github/actions/email-notify`)
- **PagerDuty Alert** (`.github/actions/pagerduty-alert`)

## Quick Start

### 1. Configure Secrets

Add these secrets to your GitHub repository:

**For Slack:**

```
SLACK_WEBHOOK_URL: Your Slack incoming webhook URL
SLACK_CHANNEL_DEVOPS: Slack channel ID for DevOps alerts (optional)
SLACK_CHANNEL_TEAM: Slack channel ID for team notifications (optional)
SLACK_ONCALL_USERS: Comma-separated Slack user IDs for urgent alerts (optional)
```

**For Email:**

```
SMTP_SERVER: SMTP server address (e.g., smtp.gmail.com)
SMTP_PORT: SMTP port (usually 587)
SMTP_USERNAME: SMTP username
SMTP_PASSWORD: SMTP password or app password
FROM_EMAIL: Sender email address
ONCALL_EMAILS: Comma-separated emails for urgent alerts
```

**For PagerDuty:**

```
PAGERDUTY_INTEGRATION_KEY: PagerDuty Events API v2 integration key (routing key)
```

### 2. Use in Workflows

## Integration Examples

### Development Deployment Workflow

```yaml
name: Deploy to Development

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Notify deployment start
      - name: Notify deployment start
        uses: ./.github/actions/slack-notify
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          message-type: "info"
          title: "Development Deployment Started"
          message: "Deploying latest changes to development environment..."
          environment: "development"
          commit-message: ${{ github.event.head_commit.message }}

      # ... deployment steps ...

      # Notify success
      - name: Notify deployment success
        if: success()
        uses: ./.github/actions/slack-notify
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          message-type: "success"
          title: "Development Deployment Successful"
          message: "Application deployed and smoke tests passed"
          environment: "development"
          deployment-url: ${{ steps.deploy.outputs.url }}
          commit-message: ${{ github.event.head_commit.message }}

      # Notify failure
      - name: Notify deployment failure
        if: failure()
        uses: ./.github/actions/slack-notify
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          message-type: "error"
          title: "Development Deployment Failed"
          message: "Deployment failed. Check workflow logs for details."
          environment: "development"
```

### Staging Deployment Workflow

```yaml
name: Deploy to Staging

on:
  push:
    tags:
      - "rc-*"

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: ${{ steps.deploy.outputs.url }}

    steps:
      - uses: actions/checkout@v4

      # Notify deployment start
      - name: Notify deployment start
        uses: ./.github/actions/slack-notify
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          message-type: "info"
          title: "Staging Deployment Started"
          message: "Deploying release candidate ${{ github.ref_name }} to staging..."
          environment: "staging"
          commit-message: ${{ github.event.head_commit.message }}

      # ... deployment steps ...

      # Notify success with email to stakeholders
      - name: Notify stakeholders via email
        if: success()
        uses: ./.github/actions/email-notify
        with:
          smtp-server: ${{ secrets.SMTP_SERVER }}
          smtp-port: ${{ secrets.SMTP_PORT }}
          smtp-username: ${{ secrets.SMTP_USERNAME }}
          smtp-password: ${{ secrets.SMTP_PASSWORD }}
          from-email: ${{ secrets.FROM_EMAIL }}
          to-emails: "stakeholders@company.com,qa@company.com"
          subject: "Staging Deployment Ready - ${{ github.ref_name }}"
          message-type: "success"
          title: "Staging Deployment Complete"
          message: |
            Release candidate ${{ github.ref_name }} is now available for testing.

            All integration tests passed successfully.
          environment: "staging"
          deployment-url: ${{ steps.deploy.outputs.url }}
          commit-message: ${{ github.event.head_commit.message }}

      # Also notify Slack
      - name: Notify team via Slack
        if: success()
        uses: ./.github/actions/slack-notify
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          message-type: "success"
          title: "Staging Deployment Successful"
          message: "Release candidate ready for testing"
          environment: "staging"
          deployment-url: ${{ steps.deploy.outputs.url }}
          commit-message: ${{ github.event.head_commit.message }}
```

### Production Deployment Workflow

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - "v*"

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://app.bayoncoagent.com

    steps:
      - uses: actions/checkout@v4

      # Notify deployment start
      - name: Notify deployment start
        uses: ./.github/actions/slack-notify
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          message-type: "info"
          title: "Production Deployment Started"
          message: "Deploying version ${{ github.ref_name }} to production..."
          environment: "production"
          commit-message: ${{ github.event.head_commit.message }}

      # ... deployment steps ...

      # Notify success to stakeholders via email
      - name: Email stakeholders
        if: success()
        uses: ./.github/actions/email-notify
        with:
          smtp-server: ${{ secrets.SMTP_SERVER }}
          smtp-port: ${{ secrets.SMTP_PORT }}
          smtp-username: ${{ secrets.SMTP_USERNAME }}
          smtp-password: ${{ secrets.SMTP_PASSWORD }}
          from-email: ${{ secrets.FROM_EMAIL }}
          to-emails: "stakeholders@company.com,product@company.com,devops@company.com"
          subject: "Production Release - ${{ github.ref_name }}"
          message-type: "success"
          title: "Production Deployment Successful"
          message: |
            Version ${{ github.ref_name }} has been successfully deployed to production.

            All smoke tests passed and the application is running normally.

            Release notes: ${{ github.server_url }}/${{ github.repository }}/releases/tag/${{ github.ref_name }}
          environment: "production"
          deployment-url: "https://app.bayoncoagent.com"
          commit-message: ${{ github.event.head_commit.message }}

      # Notify team via Slack
      - name: Notify team
        if: success()
        uses: ./.github/actions/slack-notify
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          message-type: "success"
          title: "Production Deployment Successful"
          message: "Version ${{ github.ref_name }} is now live!"
          environment: "production"
          deployment-url: "https://app.bayoncoagent.com"
          commit-message: ${{ github.event.head_commit.message }}

      # Notify failure with urgent alert
      - name: Urgent failure alert
        if: failure()
        uses: ./.github/actions/slack-notify
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          message-type: "urgent"
          title: "Production Deployment Failed"
          message: "URGENT: Production deployment failed. Rollback may be required."
          environment: "production"
          mention-users: ${{ secrets.SLACK_ONCALL_USERS }}
```

### Rollback Workflow

```yaml
name: Rollback Deployment

on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Environment to rollback"
        required: true
        type: choice
        options:
          - development
          - staging
          - production

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Notify rollback start
      - name: Notify rollback start
        uses: ./.github/actions/slack-notify
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          message-type: "urgent"
          title: "Rollback Initiated"
          message: "Rolling back ${{ inputs.environment }} to previous version..."
          environment: ${{ inputs.environment }}
          mention-users: ${{ secrets.SLACK_ONCALL_USERS }}

      # ... rollback steps ...

      # Notify rollback success
      - name: Notify rollback success
        if: success()
        uses: ./.github/actions/slack-notify
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          message-type: "success"
          title: "Rollback Successful"
          message: "Successfully rolled back to previous version. Application verified."
          environment: ${{ inputs.environment }}

      # Send email for production rollbacks
      - name: Email stakeholders about rollback
        if: success() && inputs.environment == 'production'
        uses: ./.github/actions/email-notify
        with:
          smtp-server: ${{ secrets.SMTP_SERVER }}
          smtp-port: ${{ secrets.SMTP_PORT }}
          smtp-username: ${{ secrets.SMTP_USERNAME }}
          smtp-password: ${{ secrets.SMTP_PASSWORD }}
          from-email: ${{ secrets.FROM_EMAIL }}
          to-emails: ${{ secrets.ONCALL_EMAILS }}
          subject: "🚨 Production Rollback Completed"
          message-type: "urgent"
          title: "Production Rollback Successful"
          message: |
            Production has been rolled back to the previous version.

            The application has been verified and is running normally.

            Please investigate the cause of the rollback.
          environment: "production"

      # Notify rollback failure
      - name: Notify rollback failure
        if: failure()
        uses: ./.github/actions/slack-notify
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          message-type: "urgent"
          title: "Rollback Failed"
          message: "CRITICAL: Rollback failed. Manual intervention required immediately."
          environment: ${{ inputs.environment }}
          mention-users: ${{ secrets.SLACK_ONCALL_USERS }}

      # Escalate to PagerDuty for critical failures
      - name: Escalate to PagerDuty
        if: failure() && secrets.PAGERDUTY_INTEGRATION_KEY != ''
        uses: ./.github/actions/pagerduty-alert
        with:
          integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
          severity: critical
          summary: "CRITICAL: Rollback Failed - ${{ inputs.environment }}"
          environment: ${{ inputs.environment }}
          component: "Rollback System"
          group: "rollback"
          class: "deployment"
          custom-details: |
            {
              "triggered_by": "${{ github.actor }}",
              "reason": "Rollback workflow failed"
            }
```

### Performance Testing Workflow

```yaml
name: Performance Testing

on:
  workflow_run:
    workflows: ["Deploy to Staging", "Deploy to Production"]
    types: [completed]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # ... Lighthouse tests ...

      # Notify if performance degrades
      - name: Alert performance degradation
        if: steps.lighthouse.outputs.performance_score < 90
        uses: ./.github/actions/slack-notify
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          message-type: "error"
          title: "Performance Degradation Detected"
          message: |
            Lighthouse performance score dropped to ${{ steps.lighthouse.outputs.performance_score }}

            Threshold: 90
            Current: ${{ steps.lighthouse.outputs.performance_score }}
          environment: ${{ github.event.workflow_run.environment }}
```

## Best Practices

### 1. Use Appropriate Message Types

- **info**: Deployment started, process updates
- **success**: Successful deployments, tests passed
- **error**: Deployment failures, test failures
- **urgent**: Rollbacks, critical failures (use sparingly)

### 2. Notification Strategy

**Development:**

- Slack only
- Notify on failures
- Optional success notifications

**Staging:**

- Slack for team
- Email for stakeholders
- Notify on success and failure

**Production:**

- Slack for team
- Email for stakeholders
- Always notify on success
- Urgent alerts on failure

### 3. Avoid Notification Fatigue

- Don't notify on every development push
- Use conditional notifications (`if: failure()`)
- Group related notifications
- Use appropriate channels/recipients

### 4. Include Relevant Information

Always include:

- Environment
- Commit information
- Links to workflow and deployment
- Clear action items for failures

### 5. Test Notifications

Test your notification setup:

```yaml
name: Test Notifications

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Test Slack
        uses: ./.github/actions/slack-notify
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          message-type: "info"
          title: "Test Notification"
          message: "This is a test notification from GitHub Actions"

      - name: Test Email
        uses: ./.github/actions/email-notify
        with:
          smtp-server: ${{ secrets.SMTP_SERVER }}
          smtp-port: ${{ secrets.SMTP_PORT }}
          smtp-username: ${{ secrets.SMTP_USERNAME }}
          smtp-password: ${{ secrets.SMTP_PASSWORD }}
          from-email: ${{ secrets.FROM_EMAIL }}
          to-emails: "test@company.com"
          subject: "Test Email Notification"
          message-type: "info"
          title: "Test Notification"
          message: "This is a test email from GitHub Actions"
```

## Troubleshooting

### Slack notifications not appearing

1. Verify webhook URL is correct
2. Check webhook is not disabled in Slack
3. Test webhook with curl:
   ```bash
   curl -X POST -H 'Content-Type: application/json' \
     -d '{"text":"Test message"}' \
     YOUR_WEBHOOK_URL
   ```

### Email notifications not sending

1. Verify SMTP credentials
2. Check SMTP server and port
3. For Gmail: Use app password, not account password
4. Check firewall/network restrictions

### Notifications going to wrong channel/recipients

1. Verify secret values in GitHub
2. Check workflow input parameters
3. Ensure comma-separated format for multiple recipients

## Next Steps

1. Configure GitHub Secrets
2. Test notifications with test workflow
3. Integrate into deployment workflows
4. Monitor notification delivery
5. Adjust notification strategy based on team feedback

### Critical Failure Escalation

For critical failures that require immediate attention, use PagerDuty in addition to Slack and email:

```yaml
- name: Notify via Slack
  if: failure()
  uses: ./.github/actions/slack-notify
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    message-type: "urgent"
    title: "Production Deployment Failed"
    message: "Critical failure - PagerDuty incident created"
    environment: production

- name: Send email alert
  if: failure()
  uses: ./.github/actions/email-notify
  with:
    smtp-server: ${{ secrets.SMTP_SERVER }}
    to-emails: ${{ secrets.ONCALL_EMAILS }}
    subject: "🚨 Production Deployment Failed"
    message-type: "urgent"
    title: "Critical Failure"
    message: "Production deployment failed. Check PagerDuty for incident details."

- name: Create PagerDuty incident
  if: failure() && secrets.PAGERDUTY_INTEGRATION_KEY != ''
  uses: ./.github/actions/pagerduty-alert
  with:
    integration-key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
    severity: critical
    summary: "Production deployment failed"
    environment: production
    component: "Deployment Pipeline"
    custom-details: |
      {
        "deployment_id": "${{ github.run_id }}",
        "commit_sha": "${{ github.sha }}",
        "error": "Deployment workflow failed"
      }
```

## Related Documentation

- [Slack Notification Action](./slack-notify/README.md)
- [Email Notification Action](./email-notify/README.md)
- [PagerDuty Alert Action](./pagerduty-alert/README.md)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
