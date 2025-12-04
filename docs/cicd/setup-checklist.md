# CI/CD Setup Checklist

Quick reference checklist for setting up GitHub repository for CI/CD pipeline.

## 📋 Pre-Setup Preparation

Gather the following before starting:

- [ ] AWS Access Key ID and Secret for Development
- [ ] AWS Access Key ID and Secret for Staging
- [ ] AWS Access Key ID and Secret for Production
- [ ] Slack Webhook URL
- [ ] Snyk API Token
- [ ] Codecov Upload Token
- [ ] List of team members who should approve deployments

## 🔐 GitHub Secrets Configuration

Navigate to: **Settings** → **Secrets and variables** → **Actions**

### Required Secrets

- [ ] `AWS_ACCESS_KEY_ID_DEV`
- [ ] `AWS_SECRET_ACCESS_KEY_DEV`
- [ ] `AWS_REGION_DEV` (e.g., us-east-1)
- [ ] `AWS_ACCESS_KEY_ID_STAGING`
- [ ] `AWS_SECRET_ACCESS_KEY_STAGING`
- [ ] `AWS_REGION_STAGING`
- [ ] `AWS_ACCESS_KEY_ID_PROD`
- [ ] `AWS_SECRET_ACCESS_KEY_PROD`
- [ ] `AWS_REGION_PROD`
- [ ] `SLACK_WEBHOOK_URL`
- [ ] `SLACK_CHANNEL_DEVOPS` (e.g., #devops-alerts)
- [ ] `SLACK_CHANNEL_TEAM` (e.g., #team-notifications)
- [ ] `SNYK_TOKEN`
- [ ] `CODECOV_TOKEN`

### Optional Secrets

- [ ] `PAGERDUTY_INTEGRATION_KEY` (for critical alerts)
- [ ] `DATADOG_API_KEY` (for metrics)

## 🌍 GitHub Environments

Navigate to: **Settings** → **Environments**

### Development Environment

- [ ] Create environment named `development`
- [ ] Set deployment branch: `develop`
- [ ] No approval required
- [ ] Add environment variables:
  - `ENVIRONMENT_NAME` = `development`
  - `AMPLIFY_APP_ID` = `<your-dev-amplify-app-id>`
  - `STACK_NAME` = `bayon-coagent-development`

### Staging Environment

- [ ] Create environment named `staging`
- [ ] Set deployment pattern: `rc-*`
- [ ] Require 1 reviewer approval
- [ ] Add reviewers (DevOps team members)
- [ ] Add environment variables:
  - `ENVIRONMENT_NAME` = `staging`
  - `AMPLIFY_APP_ID` = `<your-staging-amplify-app-id>`
  - `STACK_NAME` = `bayon-coagent-staging`

### Production Environment

- [ ] Create environment named `production`
- [ ] Set deployment pattern: `v*`
- [ ] Require 2 reviewer approvals
- [ ] Add reviewers (DevOps leads, product managers)
- [ ] Set wait timer: 5 minutes
- [ ] Add environment variables:
  - `ENVIRONMENT_NAME` = `production`
  - `AMPLIFY_APP_ID` = `<your-production-amplify-app-id>`
  - `STACK_NAME` = `bayon-coagent-production`

## 🛡️ Branch Protection Rules

Navigate to: **Settings** → **Branches**

### Main Branch

- [ ] Create rule for `main` branch
- [ ] Require pull request before merging
- [ ] Require 2 approvals
- [ ] Dismiss stale approvals
- [ ] Require status checks:
  - [ ] `code-quality`
  - [ ] `unit-tests`
  - [ ] `integration-tests`
  - [ ] `build-verification`
  - [ ] `dependency-scan`
  - [ ] `sast-scan`
- [ ] Require conversation resolution
- [ ] Require branches to be up to date
- [ ] Include administrators
- [ ] Restrict deletions

### Develop Branch

- [ ] Create rule for `develop` branch
- [ ] Require pull request before merging
- [ ] Require 1 approval
- [ ] Dismiss stale approvals
- [ ] Require status checks:
  - [ ] `code-quality`
  - [ ] `unit-tests`
  - [ ] `build-verification`
- [ ] Require conversation resolution
- [ ] Require branches to be up to date
- [ ] Include administrators
- [ ] Restrict deletions

## ⚙️ Repository Settings

Navigate to: **Settings** → **Actions** → **General**

- [ ] Allow all actions (or restrict to organization)
- [ ] Set workflow permissions to "Read and write"
- [ ] Allow GitHub Actions to create and approve pull requests
- [ ] Require approval for first-time contributors

Navigate to: **Settings** → **Code security and analysis**

- [ ] Enable Dependency graph
- [ ] Enable Dependabot alerts
- [ ] Enable Dependabot security updates
- [ ] Enable Secret scanning (if available)

## ✅ Verification

### 1. Test Secrets Configuration

- [ ] Run workflow: `.github/workflows/verify-secrets.yml`
- [ ] Verify all required secrets show ✅
- [ ] Fix any ❌ errors

### 2. Test Environments

- [ ] Run workflow: `.github/workflows/test-environments.yml`
- [ ] Verify development environment accessible (no approval)
- [ ] Approve staging environment (1 reviewer)
- [ ] Approve production environment (2 reviewers)
- [ ] Verify all environments show ✅

### 3. Test Slack Integration

- [ ] Run workflow: `.github/workflows/test-slack.yml`
- [ ] Check DevOps channel for test message
- [ ] Check Team channel for test message
- [ ] Verify messages received in both channels

### 4. Test Branch Protection

- [ ] Create test branch from `develop`
- [ ] Make a small change
- [ ] Open PR to `develop`
- [ ] Verify status checks are required
- [ ] Verify approval is required
- [ ] Verify merge button disabled until checks pass
- [ ] Close test PR

## 📝 Documentation

- [ ] Document AWS credential sources
- [ ] Document who has approval permissions
- [ ] Document Slack channel purposes
- [ ] Update team runbooks with new process
- [ ] Share setup guide with team

## 🎯 Next Steps

After completing this checklist:

1. [ ] Mark Task 1 as complete in `.kiro/specs/cicd-pipeline-enhancement/tasks.md`
2. [ ] Proceed to Task 2: Enhance CI workflow
3. [ ] Schedule team training on new CI/CD process

## 📞 Support

If you encounter issues:

- Review the detailed guide: `docs/cicd/github-setup-guide.md`
- Check GitHub Actions documentation
- Contact DevOps team

---

**Estimated Time**: 30-45 minutes

**Last Updated**: December 3, 2024
