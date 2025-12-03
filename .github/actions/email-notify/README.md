# Email Notification Action

A reusable composite action for sending HTML-formatted deployment and workflow notifications via email.

## Features

- **HTML email templates**: Professional, responsive design
- **Multiple message types**: info, success, error, urgent
- **Priority levels**: Automatic priority headers for urgent messages
- **Rich deployment details**: Environment, URL, commit info
- **Action buttons**: Quick links to workflow and deployment
- **SMTP support**: Works with any SMTP server (Gmail, SendGrid, etc.)

## Usage

### Basic Usage

```yaml
- name: Send success notification
  uses: ./.github/actions/email-notify
  with:
    smtp-server: "smtp.gmail.com"
    smtp-port: "587"
    smtp-username: ${{ secrets.SMTP_USERNAME }}
    smtp-password: ${{ secrets.SMTP_PASSWORD }}
    from-email: "deployments@bayoncoagent.com"
    to-emails: "team@bayoncoagent.com"
    subject: "Deployment Successful - Production"
    message-type: "success"
    title: "Production Deployment Complete"
    message: "Application deployed successfully and all smoke tests passed"
```

### Deployment Notification

```yaml
- name: Send deployment notification
  uses: ./.github/actions/email-notify
  with:
    smtp-server: ${{ secrets.SMTP_SERVER }}
    smtp-port: ${{ secrets.SMTP_PORT }}
    smtp-username: ${{ secrets.SMTP_USERNAME }}
    smtp-password: ${{ secrets.SMTP_PASSWORD }}
    from-email: ${{ secrets.FROM_EMAIL }}
    to-emails: "stakeholders@bayoncoagent.com,devops@bayoncoagent.com"
    subject: "Production Deployment - v${{ github.ref_name }}"
    message-type: "success"
    title: "Production Deployment Successful"
    message: "New version deployed with the following changes..."
    environment: "production"
    deployment-url: "https://app.bayoncoagent.com"
    commit-message: ${{ github.event.head_commit.message }}
```

### Urgent Alert

```yaml
- name: Send urgent alert
  if: failure()
  uses: ./.github/actions/email-notify
  with:
    smtp-server: ${{ secrets.SMTP_SERVER }}
    smtp-port: ${{ secrets.SMTP_PORT }}
    smtp-username: ${{ secrets.SMTP_USERNAME }}
    smtp-password: ${{ secrets.SMTP_PASSWORD }}
    from-email: ${{ secrets.FROM_EMAIL }}
    to-emails: ${{ secrets.ONCALL_EMAILS }}
    subject: "🚨 URGENT: Production Deployment Failed"
    message-type: "urgent"
    title: "Deployment Failed - Rollback Initiated"
    message: "Production deployment failed smoke tests. Automatic rollback in progress. Immediate attention required."
    environment: "production"
```

## Inputs

| Input            | Description                                | Required | Default               |
| ---------------- | ------------------------------------------ | -------- | --------------------- |
| `smtp-server`    | SMTP server address                        | Yes      | `smtp.gmail.com`      |
| `smtp-port`      | SMTP server port                           | Yes      | `587`                 |
| `smtp-username`  | SMTP username                              | Yes      | -                     |
| `smtp-password`  | SMTP password or app password              | Yes      | -                     |
| `from-email`     | Sender email address                       | Yes      | -                     |
| `to-emails`      | Comma-separated recipient emails           | Yes      | -                     |
| `subject`        | Email subject line                         | Yes      | -                     |
| `message-type`   | Type: `info`, `success`, `error`, `urgent` | Yes      | `info`                |
| `title`          | Notification title                         | Yes      | -                     |
| `message`        | Notification message body                  | Yes      | -                     |
| `environment`    | Deployment environment                     | No       | -                     |
| `deployment-url` | URL of deployed application                | No       | -                     |
| `commit-sha`     | Git commit SHA                             | No       | `${{ github.sha }}`   |
| `commit-message` | Git commit message                         | No       | -                     |
| `author`         | Commit author                              | No       | `${{ github.actor }}` |
| `workflow-url`   | URL to workflow run                        | No       | Auto-generated        |
| `include-logs`   | Include workflow logs                      | No       | `false`               |

## Message Types

### Info (Blue)

- General information
- Deployment started
- Process updates
- Priority: Normal

### Success (Green)

- Successful deployments
- Tests passed
- Operations completed
- Priority: Normal

### Error (Red)

- Deployment failures
- Test failures
- Build errors
- Priority: High

### Urgent (Orange)

- Rollbacks
- Critical failures
- Security alerts
- Priority: Urgent (X-Priority: 1)

## Setup

### Option 1: Gmail with App Password (Recommended)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Add GitHub Secrets**:
   ```
   SMTP_SERVER: smtp.gmail.com
   SMTP_PORT: 587
   SMTP_USERNAME: your-email@gmail.com
   SMTP_PASSWORD: your-app-password
   FROM_EMAIL: your-email@gmail.com
   ```

### Option 2: SendGrid

1. **Create SendGrid Account** and get API key
2. **Add GitHub Secrets**:
   ```
   SMTP_SERVER: smtp.sendgrid.net
   SMTP_PORT: 587
   SMTP_USERNAME: apikey
   SMTP_PASSWORD: your-sendgrid-api-key
   FROM_EMAIL: verified-sender@yourdomain.com
   ```

### Option 3: AWS SES

1. **Verify domain/email** in AWS SES
2. **Create SMTP credentials** in SES console
3. **Add GitHub Secrets**:
   ```
   SMTP_SERVER: email-smtp.us-east-1.amazonaws.com
   SMTP_PORT: 587
   SMTP_USERNAME: your-ses-smtp-username
   SMTP_PASSWORD: your-ses-smtp-password
   FROM_EMAIL: verified@yourdomain.com
   ```

### Option 4: Custom SMTP Server

Configure with your organization's SMTP server details.

## Examples

### Deployment Started

```yaml
- name: Notify deployment start
  uses: ./.github/actions/email-notify
  with:
    smtp-server: ${{ secrets.SMTP_SERVER }}
    smtp-port: ${{ secrets.SMTP_PORT }}
    smtp-username: ${{ secrets.SMTP_USERNAME }}
    smtp-password: ${{ secrets.SMTP_PASSWORD }}
    from-email: ${{ secrets.FROM_EMAIL }}
    to-emails: "team@company.com"
    subject: "Deployment Started - Staging"
    message-type: "info"
    title: "Staging Deployment In Progress"
    message: "Deployment to staging environment has started. Expected completion in 10 minutes."
    environment: "staging"
```

### Deployment Success with Multiple Recipients

```yaml
- name: Notify stakeholders
  uses: ./.github/actions/email-notify
  with:
    smtp-server: ${{ secrets.SMTP_SERVER }}
    smtp-port: ${{ secrets.SMTP_PORT }}
    smtp-username: ${{ secrets.SMTP_USERNAME }}
    smtp-password: ${{ secrets.SMTP_PASSWORD }}
    from-email: ${{ secrets.FROM_EMAIL }}
    to-emails: "stakeholders@company.com,product@company.com,devops@company.com"
    subject: "Production Release - v${{ github.ref_name }}"
    message-type: "success"
    title: "Production Release Successful"
    message: |
      Version ${{ github.ref_name }} has been successfully deployed to production.

      All smoke tests passed and the application is running normally.

      Release notes are available in the GitHub release.
    environment: "production"
    deployment-url: ${{ steps.deploy.outputs.url }}
    commit-message: ${{ github.event.head_commit.message }}
```

### Rollback Notification

```yaml
- name: Notify rollback
  uses: ./.github/actions/email-notify
  with:
    smtp-server: ${{ secrets.SMTP_SERVER }}
    smtp-port: ${{ secrets.SMTP_PORT }}
    smtp-username: ${{ secrets.SMTP_USERNAME }}
    smtp-password: ${{ secrets.SMTP_PASSWORD }}
    from-email: ${{ secrets.FROM_EMAIL }}
    to-emails: ${{ secrets.ONCALL_EMAILS }}
    subject: "🚨 ROLLBACK: Production Deployment Failed"
    message-type: "urgent"
    title: "Automatic Rollback Completed"
    message: |
      Production deployment failed smoke tests and has been automatically rolled back.

      Previous version has been restored and verified.

      Please review the workflow logs and investigate the failure.
    environment: "production"
```

## Email Template

The action generates a professional HTML email with:

- **Color-coded header** based on message type
- **Main message** with clear formatting
- **Deployment details table** with environment, URL, commit info
- **Commit message** in monospace font
- **Action buttons** for quick access to workflow and deployment
- **Footer** with repository and run information

## Troubleshooting

### Email not sending

- Verify SMTP credentials are correct
- Check SMTP server and port
- Ensure "Less secure app access" is enabled (Gmail)
- Use app password instead of account password (Gmail)
- Check firewall/network restrictions

### Authentication errors

- Gmail: Use app password, not account password
- SendGrid: Username must be "apikey"
- AWS SES: Use SMTP credentials, not IAM credentials

### Emails going to spam

- Use verified sender domain
- Configure SPF/DKIM records
- Use reputable SMTP service
- Avoid spam trigger words in subject

### HTML not rendering

- Check email client supports HTML
- Test with different email clients
- Verify HTML is valid

## Security Best Practices

1. **Never commit credentials** - Always use GitHub Secrets
2. **Use app passwords** - Don't use main account passwords
3. **Limit recipient lists** - Only send to necessary recipients
4. **Rotate credentials** - Regularly update SMTP passwords
5. **Use TLS** - Always use port 587 with STARTTLS

## Related Documentation

- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SendGrid SMTP](https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api)
- [AWS SES SMTP](https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html)
