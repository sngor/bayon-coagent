# CI/CD Pipeline Documentation

This directory contains documentation for the Bayon CoAgent CI/CD pipeline enhancement.

## 📚 Documentation Index

### Setup Guides

- **[GitHub Setup Guide](github-setup-guide.md)** - Comprehensive guide for configuring GitHub repository, secrets, environments, and branch protection rules
- **[Setup Checklist](setup-checklist.md)** - Quick reference checklist for CI/CD setup

### Workflow Documentation

- **[Security Workflow Guide](security-workflow-guide.md)** - Comprehensive guide for the enhanced security scanning workflow
- **[Infrastructure Validation Guide](infrastructure-validation-guide.md)** - Guide for SAM template validation workflow
- **[Development Deployment Guide](development-deployment-guide.md)** - Comprehensive guide for development environment deployment
- **[Development Deployment Quick Start](development-deployment-quickstart.md)** - Quick start guide for development deployment

### Task Completion Summaries

- **[Task 1 Completion Summary](TASK_1_COMPLETION_SUMMARY.md)** - GitHub repository configuration
- **[Task 2 Completion Summary](TASK_2_COMPLETION_SUMMARY.md)** - Enhanced CI workflow
- **[Task 4 Completion Summary](TASK_4_COMPLETION_SUMMARY.md)** - Enhanced security workflow
- **[Task 5 Completion Summary](TASK_5_COMPLETION_SUMMARY.md)** - Infrastructure validation workflow
- **[Task 6 Completion Summary](TASK_6_COMPLETION_SUMMARY.md)** - Development deployment workflow

Coming soon:

- Staging Deployment Guide
- Production Deployment Guide
- Rollback Runbook
- Performance Testing Guide

## 🚀 Quick Start

### 1. Initial Setup (Task 1) ✅

Follow these steps to configure your GitHub repository:

1. Review the [Setup Checklist](setup-checklist.md)
2. Follow the detailed [GitHub Setup Guide](github-setup-guide.md)
3. Run the verification script:
   ```bash
   ./scripts/verify-cicd-setup.sh
   ```
4. Test your configuration:
   - Run `.github/workflows/verify-secrets.yml`
   - Run `.github/workflows/test-environments.yml`
   - Run `.github/workflows/test-slack.yml`

### 2. Enhanced CI Workflow (Task 2) ✅

The CI workflow has been enhanced with:

- Matrix strategy for Node.js versions (18, 20, 22)
- Improved caching and parallel execution
- Coverage tracking with Codecov
- Integration tests with LocalStack
- Branch protection configuration

### 3. Enhanced Security Workflow (Task 4) ✅

The security workflow now includes comprehensive scanning:

- **Dependency Scanning**: npm audit + Snyk with strict thresholds
- **Secrets Scanning**: TruffleHog + pattern matching for exposed credentials
- **SAST**: CodeQL analysis for JavaScript/TypeScript
- **License Compliance**: Automatic detection of problematic licenses

See the [Security Workflow Guide](security-workflow-guide.md) for details.

### 4. Verify Setup

After configuration, verify everything is working:

```bash
# Check secrets are configured
gh workflow run verify-secrets.yml

# Test environment access and approvals
gh workflow run test-environments.yml

# Test Slack notifications
gh workflow run test-slack.yml

# Test security workflow
git push  # Triggers security-scan.yml
```

### 5. Development Deployment (Task 6) ✅

The development deployment workflow provides automated deployment to the development environment:

- **Automatic Trigger**: Deploys on push to `develop` branch
- **Infrastructure Deployment**: Uses SAM to deploy AWS resources
- **Frontend Deployment**: Deploys Next.js app to AWS Amplify
- **Smoke Tests**: Runs 4 comprehensive smoke tests (auth, database, storage, AI)
- **Automatic Rollback**: Rolls back on any failure
- **Slack Notifications**: Sends notifications for all deployment events

See the [Development Deployment Guide](development-deployment-guide.md) for details or the [Quick Start Guide](development-deployment-quickstart.md) to get started quickly.

### 6. Next Steps

Completed tasks:

- ✅ Task 1: GitHub repository configuration and secrets
- ✅ Task 2: Enhanced CI workflow
- ✅ Task 3: Checkpoint - Verify CI workflow
- ✅ Task 4: Enhanced security workflow
- ✅ Task 5: Infrastructure validation workflow
- ✅ Task 6: Development deployment workflow

Next tasks:

- Task 7: Checkpoint - Verify development deployment
- Task 8: Create staging deployment workflow
- Task 9: Create performance testing workflow
- Task 10: Create production deployment workflow
- Review the implementation plan in `.kiro/specs/cicd-pipeline-enhancement/tasks.md`

## 📋 Required Secrets

### AWS Credentials (Required)

| Secret Name                     | Description                | Example     |
| ------------------------------- | -------------------------- | ----------- |
| `AWS_ACCESS_KEY_ID_DEV`         | Development AWS access key | `AKIA...`   |
| `AWS_SECRET_ACCESS_KEY_DEV`     | Development AWS secret key | `wJalr...`  |
| `AWS_REGION_DEV`                | Development AWS region     | `us-east-1` |
| `AWS_ACCESS_KEY_ID_STAGING`     | Staging AWS access key     | `AKIA...`   |
| `AWS_SECRET_ACCESS_KEY_STAGING` | Staging AWS secret key     | `wJalr...`  |
| `AWS_REGION_STAGING`            | Staging AWS region         | `us-east-1` |
| `AWS_ACCESS_KEY_ID_PROD`        | Production AWS access key  | `AKIA...`   |
| `AWS_SECRET_ACCESS_KEY_PROD`    | Production AWS secret key  | `wJalr...`  |
| `AWS_REGION_PROD`               | Production AWS region      | `us-east-1` |

### Notification Services (Required)

| Secret Name            | Description                | Example                       |
| ---------------------- | -------------------------- | ----------------------------- |
| `SLACK_WEBHOOK_URL`    | Slack incoming webhook URL | `https://hooks.slack.com/...` |
| `SLACK_CHANNEL_DEVOPS` | DevOps alerts channel      | `#devops-alerts`              |
| `SLACK_CHANNEL_TEAM`   | Team notifications channel | `#team-notifications`         |

### Third-Party Services (Required)

| Secret Name     | Description          | How to Get                          |
| --------------- | -------------------- | ----------------------------------- |
| `SNYK_TOKEN`    | Snyk API token       | https://snyk.io → Account Settings  |
| `CODECOV_TOKEN` | Codecov upload token | https://codecov.io → Add Repository |

### Optional Services

| Secret Name                 | Description               | Purpose                |
| --------------------------- | ------------------------- | ---------------------- |
| `PAGERDUTY_INTEGRATION_KEY` | PagerDuty integration key | Critical alerts        |
| `DATADOG_API_KEY`           | DataDog API key           | Metrics and monitoring |

## 🌍 GitHub Environments

### Development

- **Name**: `development`
- **Approval**: None required
- **Deployment Branch**: `develop`
- **Purpose**: Automatic deployment for testing latest changes

### Staging

- **Name**: `staging`
- **Approval**: 1 reviewer required
- **Deployment Pattern**: `rc-*` tags
- **Purpose**: Pre-production testing with approval gate

### Production

- **Name**: `production`
- **Approval**: 2 reviewers required
- **Deployment Pattern**: `v*` tags
- **Wait Timer**: 5 minutes
- **Purpose**: Production deployment with multi-approval

## 🛡️ Branch Protection

### Main Branch

- Requires 2 approvals
- Requires all status checks to pass
- Requires conversation resolution
- Prevents force pushes and deletions

### Develop Branch

- Requires 1 approval
- Requires status checks to pass
- Requires conversation resolution
- Prevents force pushes and deletions

## 🔧 Verification Workflows

### verify-secrets.yml

Tests that all required secrets are configured correctly.

**Usage**:

```bash
gh workflow run verify-secrets.yml
```

**Checks**:

- AWS credentials for all environments
- Slack webhook and channels
- Third-party service tokens

### test-environments.yml

Tests that GitHub environments are configured with correct approval requirements.

**Usage**:

```bash
gh workflow run test-environments.yml
```

**Tests**:

- Development environment (no approval)
- Staging environment (1 approval)
- Production environment (2 approvals)

### test-slack.yml

Tests Slack notification integration.

**Usage**:

```bash
gh workflow run test-slack.yml
```

**Sends**:

- Test message to DevOps channel
- Test message to Team channel

## 📞 Support

### Common Issues

1. **Secrets not available in workflow**

   - Verify secret names match exactly (case-sensitive)
   - Check secret is at repository level
   - Ensure workflow has correct permissions

2. **Environment approval not working**

   - Verify environment name matches exactly
   - Check reviewers are added
   - Ensure deployment branch pattern is correct

3. **Branch protection not enforcing**
   - Verify status check names match job names
   - Enable "Require branches to be up to date"
   - Check "Include administrators" if admin is testing

### Getting Help

- Review the [GitHub Setup Guide](github-setup-guide.md) troubleshooting section
- Check GitHub Actions documentation: https://docs.github.com/en/actions
- Contact DevOps team

## 📝 Related Documentation

- [CI/CD Pipeline Design](.kiro/specs/cicd-pipeline-enhancement/design.md)
- [Requirements Document](.kiro/specs/cicd-pipeline-enhancement/requirements.md)
- [Implementation Tasks](.kiro/specs/cicd-pipeline-enhancement/tasks.md)

## 🔄 Maintenance

This documentation should be updated when:

- New secrets are added
- Environment configuration changes
- Branch protection rules are modified
- New workflows are added

**Last Updated**: December 3, 2024
**Maintained By**: DevOps Team
