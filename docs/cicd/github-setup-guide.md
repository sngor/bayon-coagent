# GitHub Repository Configuration Guide

This guide walks through the manual configuration steps required to set up GitHub Secrets, Environments, and repository settings for the CI/CD pipeline.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Secrets Configuration](#github-secrets-configuration)
3. [GitHub Environments Setup](#github-environments-setup)
4. [Branch Protection Rules](#branch-protection-rules)
5. [Verification Steps](#verification-steps)

---

## Prerequisites

Before starting, ensure you have:

- [ ] Admin access to the GitHub repository
- [ ] AWS credentials for development, staging, and production environments
- [ ] Slack workspace with webhook URL configured
- [ ] Snyk account with API token
- [ ] Codecov account with repository token

---

## GitHub Secrets Configuration

Navigate to your repository → **Settings** → **Secrets and variables** → **Actions**

### AWS Credentials

Configure AWS credentials for each environment:

#### Development Environment

1. Click **New repository secret**
2. Add the following secrets:

```
Name: AWS_ACCESS_KEY_ID_DEV
Value: <your-dev-aws-access-key-id>

Name: AWS_SECRET_ACCESS_KEY_DEV
Value: <your-dev-aws-secret-access-key>

Name: AWS_REGION_DEV
Value: us-east-1  (or your preferred region)
```

#### Staging Environment

```
Name: AWS_ACCESS_KEY_ID_STAGING
Value: <your-staging-aws-access-key-id>

Name: AWS_SECRET_ACCESS_KEY_STAGING
Value: <your-staging-aws-secret-access-key>

Name: AWS_REGION_STAGING
Value: us-east-1  (or your preferred region)
```

#### Production Environment

```
Name: AWS_ACCESS_KEY_ID_PROD
Value: <your-prod-aws-access-key-id>

Name: AWS_SECRET_ACCESS_KEY_PROD
Value: <your-prod-aws-secret-access-key>

Name: AWS_REGION_PROD
Value: us-east-1  (or your preferred region)
```

### Notification Services

#### Slack Integration

1. Create a Slack webhook URL:

   - Go to https://api.slack.com/apps
   - Create a new app or select existing
   - Enable Incoming Webhooks
   - Create webhook for your channel
   - Copy the webhook URL

2. Add Slack secrets:

```
Name: SLACK_WEBHOOK_URL
Value: https://hooks.slack.com/services/YOUR/WEBHOOK/URL

Name: SLACK_CHANNEL_DEVOPS
Value: #devops-alerts  (or your channel name)

Name: SLACK_CHANNEL_TEAM
Value: #team-notifications  (or your channel name)
```

### Third-Party Service Tokens

#### Snyk Security Scanning

1. Get your Snyk token:

   - Log in to https://snyk.io
   - Go to Account Settings → General
   - Copy your API token

2. Add Snyk secret:

```
Name: SNYK_TOKEN
Value: <your-snyk-api-token>
```

#### Codecov Coverage Reporting

1. Get your Codecov token:

   - Log in to https://codecov.io
   - Add your repository
   - Copy the upload token

2. Add Codecov secret:

```
Name: CODECOV_TOKEN
Value: <your-codecov-upload-token>
```

### Optional Services

#### PagerDuty (for critical alerts)

```
Name: PAGERDUTY_INTEGRATION_KEY
Value: <your-pagerduty-integration-key>
```

#### DataDog (for metrics and monitoring)

```
Name: DATADOG_API_KEY
Value: <your-datadog-api-key>
```

### Secrets Checklist

After configuration, verify you have these secrets:

- [ ] AWS_ACCESS_KEY_ID_DEV
- [ ] AWS_SECRET_ACCESS_KEY_DEV
- [ ] AWS_REGION_DEV
- [ ] AWS_ACCESS_KEY_ID_STAGING
- [ ] AWS_SECRET_ACCESS_KEY_STAGING
- [ ] AWS_REGION_STAGING
- [ ] AWS_ACCESS_KEY_ID_PROD
- [ ] AWS_SECRET_ACCESS_KEY_PROD
- [ ] AWS_REGION_PROD
- [ ] SLACK_WEBHOOK_URL
- [ ] SLACK_CHANNEL_DEVOPS
- [ ] SLACK_CHANNEL_TEAM
- [ ] SNYK_TOKEN
- [ ] CODECOV_TOKEN
- [ ] PAGERDUTY_INTEGRATION_KEY (optional)
- [ ] DATADOG_API_KEY (optional)

---

## GitHub Environments Setup

Navigate to your repository → **Settings** → **Environments**

### 1. Development Environment

1. Click **New environment**
2. Name: `development`
3. Configure:
   - **Deployment branches**: Selected branches → Add `develop`
   - **Environment secrets**: Add development-specific secrets if needed
   - **Environment variables**: Add any dev-specific variables

**No approval required** - deployments to development are automatic.

### 2. Staging Environment

1. Click **New environment**
2. Name: `staging`
3. Configure:

   **Deployment branches**:

   - Select "Protected branches and tags"
   - Add pattern: `rc-*` (for release candidate tags)

   **Required reviewers**:

   - Enable "Required reviewers"
   - Add at least 1 reviewer (DevOps team member)
   - Reviewers can be:
     - Individual users
     - Teams (e.g., @your-org/devops)

   **Wait timer** (optional):

   - Set to 0 minutes (no wait)
   - Or add a delay if you want time to cancel

   **Environment secrets** (if different from repository secrets):

   - Add staging-specific overrides if needed

   **Environment variables**:

   ```
   Name: ENVIRONMENT_NAME
   Value: staging

   Name: AMPLIFY_APP_ID
   Value: <your-staging-amplify-app-id>

   Name: STACK_NAME
   Value: bayon-coagent-staging
   ```

### 3. Production Environment

1. Click **New environment**
2. Name: `production`
3. Configure:

   **Deployment branches**:

   - Select "Protected branches and tags"
   - Add pattern: `v*` (for version tags like v1.0.0)

   **Required reviewers**:

   - Enable "Required reviewers"
   - Add at least **2 reviewers** (DevOps leads, product managers)
   - Consider adding teams for easier management

   **Wait timer**:

   - Set to 5 minutes
   - This allows last-minute cancellation if needed

   **Environment secrets** (if different from repository secrets):

   - Add production-specific overrides if needed

   **Environment variables**:

   ```
   Name: ENVIRONMENT_NAME
   Value: production

   Name: AMPLIFY_APP_ID
   Value: <your-production-amplify-app-id>

   Name: STACK_NAME
   Value: bayon-coagent-production
   ```

### Environment Configuration Checklist

- [ ] Development environment created
- [ ] Development deployment branch configured (develop)
- [ ] Staging environment created
- [ ] Staging requires 1 reviewer approval
- [ ] Staging deployment pattern configured (rc-\*)
- [ ] Production environment created
- [ ] Production requires 2 reviewer approvals
- [ ] Production deployment pattern configured (v\*)
- [ ] Production wait timer set (5 minutes)
- [ ] Environment variables configured for each environment

---

## Branch Protection Rules

Navigate to your repository → **Settings** → **Branches** → **Add rule**

### Main Branch Protection

1. **Branch name pattern**: `main`
2. Configure the following rules:

   **Protect matching branches**:

   - [x] Require a pull request before merging

     - [x] Require approvals: 2
     - [x] Dismiss stale pull request approvals when new commits are pushed
     - [x] Require review from Code Owners (if you have CODEOWNERS file)

   - [x] Require status checks to pass before merging

     - [x] Require branches to be up to date before merging
     - Add required status checks:
       - `code-quality`
       - `unit-tests`
       - `integration-tests`
       - `build-verification`
       - `dependency-scan`
       - `sast-scan`

   - [x] Require conversation resolution before merging

   - [x] Require signed commits (recommended)

   - [x] Require linear history (optional, prevents merge commits)

   - [x] Include administrators (recommended for consistency)

   **Rules applied to everyone including administrators**:

   - [x] Restrict deletions
   - [x] Require deployments to succeed before merging (if using environments)

3. Click **Create** or **Save changes**

### Develop Branch Protection

1. **Branch name pattern**: `develop`
2. Configure the following rules:

   **Protect matching branches**:

   - [x] Require a pull request before merging

     - [x] Require approvals: 1
     - [x] Dismiss stale pull request approvals when new commits are pushed

   - [x] Require status checks to pass before merging

     - [x] Require branches to be up to date before merging
     - Add required status checks:
       - `code-quality`
       - `unit-tests`
       - `build-verification`

   - [x] Require conversation resolution before merging

   - [x] Include administrators

   **Rules applied to everyone including administrators**:

   - [x] Restrict deletions

3. Click **Create** or **Save changes**

### Branch Protection Checklist

- [ ] Main branch protection rule created
- [ ] Main requires 2 approvals
- [ ] Main requires all status checks to pass
- [ ] Main requires conversation resolution
- [ ] Main restricts deletions
- [ ] Develop branch protection rule created
- [ ] Develop requires 1 approval
- [ ] Develop requires status checks to pass
- [ ] Develop restricts deletions

---

## Additional Repository Settings

### Actions Permissions

Navigate to **Settings** → **Actions** → **General**

1. **Actions permissions**:

   - Select: "Allow all actions and reusable workflows"
   - Or: "Allow [your-org] actions and reusable workflows" (more restrictive)

2. **Workflow permissions**:

   - Select: "Read and write permissions"
   - [x] Allow GitHub Actions to create and approve pull requests

3. **Fork pull request workflows**:
   - Select: "Require approval for first-time contributors"

### Security Settings

Navigate to **Settings** → **Code security and analysis**

1. **Dependency graph**:

   - [x] Enable

2. **Dependabot alerts**:

   - [x] Enable

3. **Dependabot security updates**:

   - [x] Enable

4. **Code scanning**:

   - Configure CodeQL analysis (will be done via workflow)

5. **Secret scanning**:
   - [x] Enable (if available for your plan)

### Repository Settings Checklist

- [ ] Actions permissions configured
- [ ] Workflow permissions set to read/write
- [ ] Dependency graph enabled
- [ ] Dependabot alerts enabled
- [ ] Dependabot security updates enabled
- [ ] Secret scanning enabled

---

## Verification Steps

### 1. Verify Secrets

Run this verification workflow to test secrets are configured correctly:

```yaml
# .github/workflows/verify-secrets.yml
name: Verify Secrets Configuration

on:
  workflow_dispatch:

jobs:
  verify-secrets:
    runs-on: ubuntu-latest
    steps:
      - name: Check AWS Dev Credentials
        run: |
          if [ -z "${{ secrets.AWS_ACCESS_KEY_ID_DEV }}" ]; then
            echo "❌ AWS_ACCESS_KEY_ID_DEV not configured"
            exit 1
          fi
          echo "✅ AWS_ACCESS_KEY_ID_DEV configured"

      - name: Check AWS Staging Credentials
        run: |
          if [ -z "${{ secrets.AWS_ACCESS_KEY_ID_STAGING }}" ]; then
            echo "❌ AWS_ACCESS_KEY_ID_STAGING not configured"
            exit 1
          fi
          echo "✅ AWS_ACCESS_KEY_ID_STAGING configured"

      - name: Check AWS Prod Credentials
        run: |
          if [ -z "${{ secrets.AWS_ACCESS_KEY_ID_PROD }}" ]; then
            echo "❌ AWS_ACCESS_KEY_ID_PROD not configured"
            exit 1
          fi
          echo "✅ AWS_ACCESS_KEY_ID_PROD configured"

      - name: Check Slack Webhook
        run: |
          if [ -z "${{ secrets.SLACK_WEBHOOK_URL }}" ]; then
            echo "❌ SLACK_WEBHOOK_URL not configured"
            exit 1
          fi
          echo "✅ SLACK_WEBHOOK_URL configured"

      - name: Check Snyk Token
        run: |
          if [ -z "${{ secrets.SNYK_TOKEN }}" ]; then
            echo "❌ SNYK_TOKEN not configured"
            exit 1
          fi
          echo "✅ SNYK_TOKEN configured"

      - name: Check Codecov Token
        run: |
          if [ -z "${{ secrets.CODECOV_TOKEN }}" ]; then
            echo "❌ CODECOV_TOKEN not configured"
            exit 1
          fi
          echo "✅ CODECOV_TOKEN configured"

      - name: All Secrets Verified
        run: echo "✅ All required secrets are configured!"
```

### 2. Test Environment Access

Create a test workflow to verify environment configuration:

```yaml
# .github/workflows/test-environments.yml
name: Test Environments

on:
  workflow_dispatch:

jobs:
  test-dev:
    runs-on: ubuntu-latest
    environment: development
    steps:
      - name: Test Development Environment
        run: echo "✅ Development environment accessible"

  test-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Test Staging Environment
        run: echo "✅ Staging environment accessible (requires approval)"

  test-prod:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Test Production Environment
        run: echo "✅ Production environment accessible (requires 2 approvals)"
```

### 3. Test Branch Protection

1. Create a test branch
2. Make a small change
3. Open a pull request to `develop`
4. Verify:
   - [ ] Status checks are required
   - [ ] Approval is required
   - [ ] Merge button is disabled until checks pass

### 4. Test Slack Notifications

Create a simple test workflow:

```yaml
# .github/workflows/test-slack.yml
name: Test Slack Notification

on:
  workflow_dispatch:

jobs:
  test-slack:
    runs-on: ubuntu-latest
    steps:
      - name: Send Test Notification
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{
              "text": "✅ GitHub Actions Slack integration test successful!",
              "channel": "${{ secrets.SLACK_CHANNEL_DEVOPS }}"
            }'
```

### Verification Checklist

- [ ] Secrets verification workflow runs successfully
- [ ] Environment test workflow shows correct approval requirements
- [ ] Branch protection prevents merging without approvals
- [ ] Branch protection prevents merging with failing checks
- [ ] Slack test notification received in correct channel

---

## Troubleshooting

### Secrets Not Available in Workflow

**Problem**: Workflow can't access secrets

**Solutions**:

- Verify secret names match exactly (case-sensitive)
- Check secret is at repository level, not organization level
- Ensure workflow has correct permissions
- For forked repositories, secrets are not available by default

### Environment Approval Not Working

**Problem**: Deployment proceeds without approval

**Solutions**:

- Verify environment name in workflow matches exactly
- Check reviewers are added to environment
- Ensure deployment branch pattern matches
- Verify user has correct permissions

### Branch Protection Not Enforcing

**Problem**: Can merge without required checks

**Solutions**:

- Verify status check names match workflow job names exactly
- Ensure "Require branches to be up to date" is enabled
- Check "Include administrators" if admin is testing
- Verify branch name pattern matches

### AWS Credentials Invalid

**Problem**: AWS operations fail with authentication errors

**Solutions**:

- Verify credentials are for correct AWS account
- Check credentials have necessary IAM permissions
- Ensure credentials are not expired
- Test credentials locally with AWS CLI

---

## Security Best Practices

1. **Rotate Secrets Regularly**:

   - Rotate AWS credentials every 90 days
   - Rotate API tokens when team members leave
   - Use AWS IAM roles instead of access keys when possible

2. **Principle of Least Privilege**:

   - Grant minimum necessary permissions to AWS credentials
   - Use separate AWS accounts for dev/staging/prod
   - Limit who can access production secrets

3. **Audit Access**:

   - Review who has admin access to repository
   - Monitor secret access in GitHub audit log
   - Review environment approvers regularly

4. **Secret Scanning**:

   - Enable GitHub secret scanning
   - Use tools like TruffleHog in CI/CD
   - Never commit secrets to repository

5. **Backup Configuration**:
   - Document all secrets and their sources
   - Keep encrypted backup of configuration
   - Document environment setup in runbooks

---

## Next Steps

After completing this setup:

1. ✅ Mark Task 1 as complete in tasks.md
2. ➡️ Proceed to Task 2: Enhance CI workflow
3. 📝 Update this document if you discover any issues or improvements

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review GitHub Actions documentation: https://docs.github.com/en/actions
3. Check AWS IAM documentation: https://docs.aws.amazon.com/IAM/
4. Contact DevOps team for assistance

---

**Last Updated**: December 3, 2024
**Maintained By**: DevOps Team
