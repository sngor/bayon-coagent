# Slack Notification Action

A reusable composite action for sending rich deployment and workflow notifications to Slack.

## Features

- **Multiple message types**: info, success, error, urgent
- **Rich formatting**: Color-coded messages with emojis
- **Deployment details**: Environment, URL, commit info
- **User mentions**: Tag specific users for urgent notifications
- **Action buttons**: Quick links to workflow and deployment

## Usage

### Basic Usage

```yaml
- name: Send success notification
  uses: ./.github/actions/slack-notify
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    message-type: "success"
    title: "Deployment Successful"
    message: "Application deployed successfully to production"
```

### Deployment Notification

```yaml
- name: Notify deployment
  uses: ./.github/actions/slack-notify
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    message-type: "success"
    title: "Production Deployment Complete"
    message: "New version deployed and smoke tests passed"
    environment: "production"
    deployment-url: "https://app.bayoncoagent.com"
    commit-message: ${{ github.event.head_commit.message }}
```

### Urgent Notification with Mentions

```yaml
- name: Send urgent alert
  uses: ./.github/actions/slack-notify
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    message-type: "urgent"
    title: "Deployment Failed - Rollback Initiated"
    message: "Production deployment failed smoke tests. Automatic rollback in progress."
    environment: "production"
    mention-users: "U123456,U789012" # Slack user IDs
```

## Inputs

| Input            | Description                                           | Required | Default               |
| ---------------- | ----------------------------------------------------- | -------- | --------------------- |
| `webhook-url`    | Slack webhook URL                                     | Yes      | -                     |
| `message-type`   | Type of message: `info`, `success`, `error`, `urgent` | Yes      | `info`                |
| `title`          | Notification title                                    | Yes      | -                     |
| `message`        | Notification message body                             | Yes      | -                     |
| `environment`    | Deployment environment                                | No       | -                     |
| `deployment-url` | URL of deployed application                           | No       | -                     |
| `commit-sha`     | Git commit SHA                                        | No       | `${{ github.sha }}`   |
| `commit-message` | Git commit message                                    | No       | -                     |
| `author`         | Commit author                                         | No       | `${{ github.actor }}` |
| `mention-users`  | Comma-separated Slack user IDs to mention             | No       | -                     |
| `workflow-url`   | URL to workflow run                                   | No       | Auto-generated        |

## Message Types

### Info (Blue)

- General information
- Deployment started
- Process updates

### Success (Green)

- Successful deployments
- Tests passed
- Operations completed

### Error (Red)

- Deployment failures
- Test failures
- Build errors

### Urgent (Orange)

- Rollbacks
- Critical failures
- Security alerts

## Setup

### 1. Create Slack Webhook

1. Go to your Slack workspace settings
2. Navigate to "Incoming Webhooks"
3. Create a new webhook for your channel
4. Copy the webhook URL

### 2. Add GitHub Secret

1. Go to your repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Add a new secret named `SLACK_WEBHOOK_URL`
4. Paste your webhook URL

### 3. Use in Workflows

Reference the action in your workflow files as shown in the usage examples above.

## Examples

### Deployment Started

```yaml
- name: Notify deployment start
  uses: ./.github/actions/slack-notify
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    message-type: "info"
    title: "Deployment Started"
    message: "Deploying to staging environment..."
    environment: "staging"
```

### Deployment Success

```yaml
- name: Notify deployment success
  uses: ./.github/actions/slack-notify
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    message-type: "success"
    title: "Deployment Successful"
    message: "Application deployed and all smoke tests passed"
    environment: "production"
    deployment-url: ${{ steps.deploy.outputs.url }}
    commit-message: ${{ github.event.head_commit.message }}
```

### Deployment Failure

```yaml
- name: Notify deployment failure
  if: failure()
  uses: ./.github/actions/slack-notify
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    message-type: "error"
    title: "Deployment Failed"
    message: "Deployment to production failed. Check workflow logs for details."
    environment: "production"
```

### Rollback Alert

```yaml
- name: Notify rollback
  uses: ./.github/actions/slack-notify
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    message-type: "urgent"
    title: "Automatic Rollback Initiated"
    message: "Smoke tests failed. Rolling back to previous version."
    environment: "production"
    mention-users: ${{ secrets.SLACK_ONCALL_USERS }}
```

## Troubleshooting

### Notification not appearing

- Verify webhook URL is correct
- Check Slack channel permissions
- Ensure webhook is not disabled

### Formatting issues

- Escape special characters in messages
- Use proper JSON formatting
- Check Slack Block Kit documentation

### User mentions not working

- Use Slack user IDs, not usernames
- Format: `U123456,U789012` (comma-separated)
- Find user IDs in Slack profile settings

## Related Documentation

- [Slack Block Kit](https://api.slack.com/block-kit)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [GitHub Actions Composite Actions](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action)
