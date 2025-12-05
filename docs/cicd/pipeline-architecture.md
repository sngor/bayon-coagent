# CI/CD Pipeline Architecture

## Overview

The Bayon CoAgent CI/CD pipeline is a comprehensive, production-ready deployment system built on GitHub Actions. It provides automated code quality checks, security scanning, multi-environment deployments, performance testing, and production monitoring capabilities.

The pipeline follows a progressive deployment strategy: **develop → staging → production**, with increasing levels of validation and approval gates at each stage.

## Pipeline Philosophy

- **Quality First**: Every code change goes through comprehensive quality checks before deployment
- **Security by Default**: Automated security scanning catches vulnerabilities early
- **Progressive Validation**: More rigorous testing as code moves toward production
- **Fail Fast**: Issues are caught early to minimize wasted resources
- **Automatic Rollback**: Failed deployments automatically revert to last known good state
- **Observable**: Comprehensive notifications and monitoring at every stage

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Code Push / PR                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │  Branch Router  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌──────────────┐    ┌──────────────┐
│ Feature Branch│    │    Develop   │    │ Release Tags │
│   (PR Only)   │    │   (Auto)     │    │  (Approval)  │
└───────┬───────┘    └──────┬───────┘    └──────┬───────┘
        │                   │                    │
        ▼                   ▼                    ▼
┌───────────────┐    ┌──────────────┐    ┌──────────────┐
│ Quality Checks│    │ Deploy Dev   │    │Deploy Staging│
│ Security Scan │    │ + Smoke Tests│    │+ Integration │
│ Build Verify  │    │              │    │+ Performance │
└───────────────┘    └──────────────┘    └──────┬───────┘
                                                 │
                                                 ▼
                                         ┌──────────────┐
                                         │ Deploy Prod  │
                                         │ + Monitoring │
                                         └──────────────┘
```

## Workflow Files

All workflow files are located in `.github/workflows/`. Here's what each workflow does:

### Core Quality Workflows

#### `ci.yml` - Continuous Integration

**Purpose**: Validate code quality, run tests, and verify builds on every push and PR

**Triggers**:

- Push to any branch
- Pull request opened/updated
- Manual workflow dispatch

**Jobs**:

1. **code-quality**: ESLint, TypeScript type checking, Prettier formatting
2. **unit-tests**: Jest test suite with coverage reporting (70% threshold)
3. **integration-tests**: LocalStack-based AWS service integration tests
4. **build-verification**: Next.js production build with bundle size checks

**Key Features**:

- Matrix strategy for Node.js versions (18, 20, 22)
- Parallel job execution for speed
- Dependency caching (node_modules, .next/cache)
- Conditional execution (skip tests for docs-only changes)
- Inline PR comments for violations
- Codecov integration for coverage tracking

**Status Badge**: ![CI](https://github.com/YOUR_ORG/bayon-coagent/workflows/CI/badge.svg)

---

#### `security.yml` - Security Scanning

**Purpose**: Identify security vulnerabilities in code and dependencies

**Triggers**:

- Push to main/develop branches
- Pull request to main/develop
- Weekly scheduled scan (Monday 9am UTC)
- Manual workflow dispatch

**Jobs**:

1. **dependency-scan**: npm audit + Snyk for vulnerability detection
2. **secrets-scan**: TruffleHog/GitGuardian for exposed credentials
3. **sast-scan**: CodeQL for static code analysis
4. **license-compliance**: License scanning for GPL/AGPL conflicts

**Key Features**:

- Fails on high/critical severity vulnerabilities
- Creates GitHub Security Advisories
- Immediate build failure on secret detection
- SARIF report upload to GitHub Security tab

**Status Badge**: ![Security](https://github.com/YOUR_ORG/bayon-coagent/workflows/Security/badge.svg)

---

#### `validate-infrastructure.yml` - Infrastructure Validation

**Purpose**: Validate SAM templates and CloudFormation best practices

**Triggers**:

- Push to main/develop branches (when infrastructure files change)
- Pull request to main/develop (when infrastructure files change)
- Manual workflow dispatch

**Jobs**:

1. **validate-sam**: SAM template syntax validation
2. **lint-cloudformation**: cfn-lint for best practices
3. **preview-changes**: Generate infrastructure change preview

**Key Features**:

- Prevents deployment of invalid infrastructure
- Shows what will change before deployment
- Validates against AWS best practices

---

### Deployment Workflows

#### `deploy-dev.yml` - Development Deployment

**Purpose**: Automatically deploy to development environment on merge to develop branch

**Triggers**:

- Push to `develop` branch
- Manual workflow dispatch

**Jobs**:

1. **validate-infrastructure**: SAM template validation
2. **deploy-infrastructure**: Deploy SAM stack to development
3. **deploy-frontend**: Deploy to Amplify development app
4. **smoke-tests**: Run authentication, database, S3, AI tests
5. **notify**: Send Slack notification with deployment status

**Rollback**: Automatic rollback if smoke tests fail

**Environment**: `development` (no approval required)

**Status Badge**: ![Dev Deployment](https://github.com/YOUR_ORG/bayon-coagent/workflows/Deploy%20Dev/badge.svg)

---

#### `deploy-staging.yml` - Staging Deployment

**Purpose**: Deploy to staging environment with approval gate for pre-production testing

**Triggers**:

- Tag push matching `rc-*` pattern (e.g., `rc-1.2.0`)
- Manual workflow dispatch

**Jobs**:

1. **pre-deployment-checks**: Run all quality and security checks
2. **approval-gate**: Require manual approval (24-hour timeout)
3. **deploy-infrastructure**: Deploy SAM stack to staging
4. **deploy-frontend**: Deploy to Amplify staging app
5. **integration-tests**: Comprehensive end-to-end tests
6. **performance-tests**: Lighthouse audits
7. **mark-release-ready**: Update GitHub release status

**Approval**: 1 designated reviewer required

**Environment**: `staging`

**Status Badge**: ![Staging Deployment](https://github.com/YOUR_ORG/bayon-coagent/workflows/Deploy%20Staging/badge.svg)

---

#### `deploy-production.yml` - Production Deployment

**Purpose**: Deploy to production with multi-approval gate and comprehensive validation

**Triggers**:

- Tag push matching `v*` pattern (e.g., `v1.2.0`)
- Manual workflow dispatch (emergency deployments)

**Jobs**:

1. **pre-deployment-validation**: Verify staging success and metrics
2. **multi-approval-gate**: Require 2 approvals (48-hour timeout)
3. **create-backup**: Capture current state (CloudFormation, DynamoDB)
4. **deploy-infrastructure**: Deploy SAM stack to production
5. **deploy-frontend**: Deploy to Amplify with gradual traffic shifting
6. **smoke-tests**: Critical path smoke tests
7. **monitor-deployment**: Monitor CloudWatch metrics for 15 minutes
8. **notify-stakeholders**: Send success notification and release notes

**Approval**: 2 designated reviewers required

**Environment**: `production`

**Rollback**: Automatic rollback if smoke tests fail or metrics degrade

**Status Badge**: ![Production Deployment](https://github.com/YOUR_ORG/bayon-coagent/workflows/Deploy%20Production/badge.svg)

---

### Supporting Workflows

#### `performance.yml` - Performance Testing

**Purpose**: Run Lighthouse audits to ensure performance standards

**Triggers**:

- Deployment to staging or production
- Manual workflow dispatch
- Weekly scheduled runs

**Jobs**:

1. **lighthouse-audit**: Run Lighthouse CLI (desktop + mobile)
2. **analyze-results**: Compare against thresholds and baseline
3. **report-results**: Upload reports and post PR comments

**Thresholds**:

- Performance: ≥ 90
- Accessibility: ≥ 95
- Best Practices: ≥ 90
- SEO: ≥ 95

---

#### `preview.yml` - Preview Environments

**Purpose**: Create temporary preview environments for pull requests

**Triggers**:

- Pull request opened/synchronized
- Pull request closed (cleanup)

**Jobs**:

1. **create-preview**: Deploy minimal infrastructure + frontend
2. **comment-preview-url**: Post preview URL on PR
3. **cleanup-preview**: Delete resources on PR close

**Resource Management**:

- Auto-cleanup after 7 days of inactivity
- Limit of 5 concurrent preview environments

---

#### `dependency-update.yml` - Dependency Updates

**Purpose**: Automatically update dependencies and create PRs

**Triggers**:

- Scheduled weekly (Monday 6am UTC)
- Manual workflow dispatch

**Jobs**:

1. **check-updates**: Find available updates (security, major, minor, patch)
2. **create-update-prs**: Create separate PRs for each category
3. **test-updates**: Run full test suite
4. **auto-merge**: Auto-merge security and patch updates if tests pass

---

#### `drift-detection.yml` - Infrastructure Drift Detection

**Purpose**: Detect manual changes to AWS infrastructure

**Triggers**:

- Scheduled daily (2am UTC)
- Manual workflow dispatch

**Jobs**:

1. **detect-drift**: Run CloudFormation drift detection
2. **analyze-drift**: Categorize by severity
3. **report-drift**: Create GitHub issue and notify DevOps team

---

#### `rollback.yml` - Emergency Rollback

**Purpose**: Provide emergency rollback capability

**Triggers**:

- Manual workflow dispatch
- Automatic trigger from failed deployment

**Jobs**:

1. **validate-rollback**: Verify target version exists
2. **rollback-infrastructure**: Revert CloudFormation stack
3. **rollback-frontend**: Revert Amplify deployment
4. **verify-rollback**: Run smoke tests
5. **notify-rollback**: Send urgent notification

---

#### `changelog.yml` - Changelog Generation

**Purpose**: Generate changelogs and create GitHub releases

**Triggers**:

- Release tag creation
- Manual workflow dispatch

**Jobs**:

1. **generate-changelog**: Parse conventional commits
2. **create-release**: Create GitHub release with changelog
3. **update-changelog-file**: Update CHANGELOG.md
4. **bump-version**: Update package.json version

---

#### `cost-monitoring.yml` - Cost Monitoring

**Purpose**: Track GitHub Actions usage and costs

**Triggers**:

- Scheduled daily
- Manual workflow dispatch

**Jobs**:

1. **track-usage**: Track GitHub Actions minutes
2. **alert-costs**: Alert when costs exceed 80% of budget
3. **generate-report**: Generate cost breakdown by workflow

---

## Trigger Conditions Summary

| Workflow                    | Push            | PR              | Tag      | Schedule  | Manual |
| --------------------------- | --------------- | --------------- | -------- | --------- | ------ |
| ci.yml                      | ✅ All branches | ✅              | ❌       | ❌        | ✅     |
| security.yml                | ✅ main/develop | ✅ main/develop | ❌       | ✅ Weekly | ✅     |
| validate-infrastructure.yml | ✅ main/develop | ✅ main/develop | ❌       | ❌        | ✅     |
| deploy-dev.yml              | ✅ develop      | ❌              | ❌       | ❌        | ✅     |
| deploy-staging.yml          | ❌              | ❌              | ✅ rc-\* | ❌        | ✅     |
| deploy-production.yml       | ❌              | ❌              | ✅ v\*   | ❌        | ✅     |
| performance.yml             | ❌              | ❌              | ❌       | ✅ Weekly | ✅     |
| preview.yml                 | ❌              | ✅              | ❌       | ❌        | ❌     |
| dependency-update.yml       | ❌              | ❌              | ❌       | ✅ Weekly | ✅     |
| drift-detection.yml         | ❌              | ❌              | ❌       | ✅ Daily  | ✅     |
| rollback.yml                | ❌              | ❌              | ❌       | ❌        | ✅     |
| changelog.yml               | ❌              | ❌              | ✅ All   | ❌        | ✅     |
| cost-monitoring.yml         | ❌              | ❌              | ❌       | ✅ Daily  | ✅     |

## Approval Processes

### Staging Deployment Approval

**Who Can Approve**: Designated reviewers (DevOps team members)

**Requirements**:

- 1 reviewer approval required
- 24-hour timeout
- Deployment checklist must be reviewed

**Approval Process**:

1. Release candidate tag (rc-\*) is pushed
2. Pre-deployment checks run automatically
3. Workflow pauses at approval gate
4. Designated reviewer reviews deployment checklist
5. Reviewer approves or rejects deployment
6. If approved, deployment proceeds
7. If timeout expires, deployment is cancelled

**Deployment Checklist**:

- [ ] All quality checks passed
- [ ] All security scans passed
- [ ] All tests passed
- [ ] Release notes reviewed
- [ ] Breaking changes documented
- [ ] Database migrations tested
- [ ] Rollback plan confirmed

---

### Production Deployment Approval

**Who Can Approve**: Designated reviewers (DevOps leads + Product managers)

**Requirements**:

- 2 reviewer approvals required
- 48-hour timeout
- Deployment plan and risk assessment must be reviewed

**Approval Process**:

1. Production tag (v\*) is pushed
2. Pre-deployment validation runs automatically
3. Workflow pauses at multi-approval gate
4. Designated reviewers review deployment plan
5. At least 2 reviewers must approve
6. If approved, deployment proceeds with backup creation
7. If timeout expires, deployment is cancelled

**Deployment Plan Review**:

- [ ] Staging deployment succeeded
- [ ] All staging tests passed
- [ ] Performance metrics meet thresholds
- [ ] No critical security vulnerabilities
- [ ] Backup plan confirmed
- [ ] Rollback plan confirmed
- [ ] Stakeholder communication prepared
- [ ] Maintenance window scheduled (if needed)

**Risk Assessment**:

- Database schema changes: Yes/No
- Breaking API changes: Yes/No
- Third-party dependency updates: Yes/No
- Infrastructure changes: Yes/No
- Expected downtime: None/Minimal/Scheduled

---

## Rollback Procedures

### Automatic Rollback Triggers

The system automatically triggers rollback in these scenarios:

1. **Smoke Test Failures**: Any smoke test fails after deployment
2. **CloudWatch Alarm Triggers**: Error rates or latency exceed thresholds
3. **Deployment Timeout**: Deployment takes longer than expected
4. **Health Check Failures**: Application health checks fail

### Automatic Rollback Process

When automatic rollback is triggered:

1. **Halt Deployment**: Stop any in-progress deployment activities
2. **Revert Infrastructure**: Rollback CloudFormation stack to previous version
3. **Revert Frontend**: Rollback Amplify deployment to previous build
4. **Verify Rollback**: Run smoke tests against rolled-back version
5. **Monitor Metrics**: Watch CloudWatch metrics for stability
6. **Notify Team**: Send urgent notification with failure details
7. **Create Incident**: Generate incident report for post-mortem

### Manual Rollback

For manual rollback, see the [Rollback Runbook](./rollback-runbook.md).

---

## Environment Configuration

### GitHub Environments

Three environments are configured in GitHub repository settings:

#### Development Environment

- **Name**: `development`
- **Approval**: None required
- **Deployment Branch**: `develop`
- **Secrets**: Development AWS credentials
- **Purpose**: Rapid iteration and testing

#### Staging Environment

- **Name**: `staging`
- **Approval**: 1 reviewer required
- **Deployment Branch**: Tags matching `rc-*`
- **Secrets**: Staging AWS credentials
- **Purpose**: Pre-production testing and validation

#### Production Environment

- **Name**: `production`
- **Approval**: 2 reviewers required
- **Deployment Branch**: Tags matching `v*`
- **Secrets**: Production AWS credentials
- **Wait Timer**: 5 minutes (allows last-minute cancellation)
- **Purpose**: Live production environment

### Required GitHub Secrets

#### AWS Credentials

- `AWS_ACCESS_KEY_ID_DEV`
- `AWS_SECRET_ACCESS_KEY_DEV`
- `AWS_ACCESS_KEY_ID_STAGING`
- `AWS_SECRET_ACCESS_KEY_STAGING`
- `AWS_ACCESS_KEY_ID_PROD`
- `AWS_SECRET_ACCESS_KEY_PROD`

#### Notification Services

- `SLACK_WEBHOOK_URL`
- `SLACK_CHANNEL_DEVOPS`
- `SLACK_CHANNEL_TEAM`

#### Third-Party Services

- `SNYK_TOKEN`
- `CODECOV_TOKEN`
- `GITHUB_TOKEN` (automatically provided)

#### Optional Services

- `PAGERDUTY_INTEGRATION_KEY`
- `DATADOG_API_KEY`

---

## Workflow Optimization

### Caching Strategy

**What We Cache**:

- `node_modules` (keyed by package-lock.json hash)
- `.next/cache` (keyed by source file hashes)
- Test results (keyed by test file hashes)

**Cache Invalidation**:

- Dependency changes invalidate node_modules cache
- Source changes invalidate build cache
- Test file changes invalidate test result cache

**Benefits**:

- 50-70% faster builds with warm cache
- Reduced GitHub Actions minutes consumption
- Faster feedback on PRs

### Parallel Execution

**Jobs Running in Parallel**:

- Quality checks (lint, type check, format)
- Unit tests and integration tests
- Multiple environment builds
- Test suite splitting across runners

**Benefits**:

- 40-60% faster overall pipeline execution
- Better resource utilization
- Faster feedback to developers

### Conditional Execution

**Skip Conditions**:

- Skip tests for documentation-only changes
- Skip builds for non-code changes
- Run security scans only on main/develop
- Run performance tests only on staging/production

**Benefits**:

- Reduced unnecessary work
- Lower GitHub Actions costs
- Faster PR feedback for docs changes

---

## Monitoring and Metrics

### Key Metrics Tracked

1. **Build Metrics**:

   - Build success rate
   - Average build time
   - Build time trends

2. **Test Metrics**:

   - Test success rate
   - Code coverage percentage
   - Test execution time

3. **Deployment Metrics**:

   - Deployment frequency
   - Deployment success rate
   - Mean time to recovery (MTTR)

4. **Security Metrics**:

   - Vulnerabilities detected
   - Vulnerabilities resolved
   - Time to patch

5. **Performance Metrics**:

   - Lighthouse scores (performance, accessibility, SEO)
   - Bundle size trends
   - Performance regression detection

6. **Cost Metrics**:
   - GitHub Actions minutes consumed
   - Cost per workflow
   - Cost per environment

### Dashboards

- **GitHub Actions Dashboard**: Workflow status and trends
- **Deployment Dashboard**: Environment status and deployment history
- **Security Dashboard**: Vulnerability trends and remediation status
- **Performance Dashboard**: Lighthouse score trends

### Alerts

- Repeated build failures (3+ in a row)
- Deployment failures
- High/critical security vulnerabilities
- Performance degradation (>10% drop)
- Cost overruns (>80% of budget)

---

## Best Practices

### For Developers

1. **Write Conventional Commits**: Use conventional commit format for automatic changelog generation
2. **Keep PRs Small**: Smaller PRs get faster feedback and easier reviews
3. **Fix Quality Issues Early**: Don't wait for CI to catch linting errors
4. **Monitor Build Times**: If your PR significantly increases build time, investigate
5. **Review Security Findings**: Don't ignore security scan results

### For DevOps

1. **Monitor Pipeline Health**: Regularly review pipeline metrics and trends
2. **Keep Workflows Updated**: Update actions and dependencies regularly
3. **Optimize Caching**: Review cache hit rates and adjust strategies
4. **Review Costs**: Monitor GitHub Actions usage and optimize expensive workflows
5. **Test Rollback Procedures**: Regularly test rollback to ensure it works

### For Security

1. **Review Security Scans**: Regularly review security scan results
2. **Rotate Secrets**: Rotate AWS credentials and API tokens regularly
3. **Monitor Secret Detection**: Review secret detection alerts promptly
4. **Update Dependencies**: Keep dependencies updated for security patches
5. **Audit Access**: Regularly audit who has approval rights

---

## Troubleshooting

### Common Issues

**Build Failures**:

- Check build logs in GitHub Actions
- Verify dependencies are correctly specified
- Check for TypeScript errors
- Review ESLint violations

**Test Failures**:

- Review test output and stack traces
- Check if tests are flaky (run multiple times)
- Verify test environment setup
- Check for race conditions

**Deployment Failures**:

- Check CloudFormation stack events
- Review Amplify build logs
- Verify AWS credentials are valid
- Check resource quotas

**Rollback Failures**:

- Check CloudFormation rollback status
- Verify previous version exists
- Check for resource dependencies
- Contact on-call engineer if critical

For detailed troubleshooting steps, see the [Deployment Runbook](./deployment-runbook.md).

---

## Related Documentation

- [Deployment Runbook](./deployment-runbook.md) - Step-by-step deployment procedures
- [Rollback Runbook](./rollback-runbook.md) - Emergency rollback procedures
- [GitHub Setup Guide](./github-setup-guide.md) - Initial GitHub configuration
- [Cost Monitoring Guide](./cost-monitoring-guide.md) - Cost tracking and optimization
- [Performance Testing Guide](./performance-testing-guide.md) - Lighthouse testing procedures

---

## Changelog

| Date       | Version | Changes                                     |
| ---------- | ------- | ------------------------------------------- |
| 2024-12-04 | 1.0.0   | Initial pipeline architecture documentation |

---

## Support

For questions or issues with the CI/CD pipeline:

1. Check this documentation and related runbooks
2. Review GitHub Actions logs for specific errors
3. Contact DevOps team in #devops Slack channel
4. For critical production issues, page on-call engineer via PagerDuty
