# Deployment Runbook

## Overview

This runbook provides step-by-step procedures for deploying Bayon CoAgent to development, staging, and production environments. It includes pre-deployment checklists, deployment steps, verification procedures, and troubleshooting guidance.

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Development Deployment](#development-deployment)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Emergency Deployment](#emergency-deployment)
- [Verification Procedures](#verification-procedures)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

Before deploying to any environment, ensure the following:

### Code Quality

- [ ] All tests pass locally
- [ ] Code coverage meets 70% threshold
- [ ] No ESLint errors or warnings
- [ ] No TypeScript type errors
- [ ] Code formatted with Prettier
- [ ] All PR reviews approved and merged

### Security

- [ ] No high/critical security vulnerabilities
- [ ] No exposed secrets or credentials
- [ ] Dependencies are up to date
- [ ] Security scan passed in CI

### Infrastructure

- [ ] SAM template validated
- [ ] CloudFormation changes reviewed
- [ ] Resource quotas checked
- [ ] Infrastructure change preview reviewed

### Documentation

- [ ] CHANGELOG.md updated
- [ ] Release notes prepared
- [ ] Breaking changes documented
- [ ] Migration guide created (if needed)

### Communication

- [ ] Stakeholders notified of deployment
- [ ] Maintenance window scheduled (if needed)
- [ ] Rollback plan confirmed
- [ ] On-call engineer identified

---

## Development Deployment

### Purpose

Automatically deploy the latest changes from the `develop` branch to the development environment for testing and validation.

### Trigger

- **Automatic**: Push to `develop` branch
- **Manual**: GitHub Actions workflow dispatch

### Approval Requirements

- **None** - Deployment is fully automated

### Deployment Process

#### Step 1: Merge to Develop Branch

```bash
# Ensure you're on the develop branch
git checkout develop

# Pull latest changes
git pull origin develop

# Merge your feature branch
git merge feature/your-feature-name

# Push to trigger deployment
git push origin develop
```

#### Step 2: Monitor Workflow

1. Go to GitHub Actions: `https://github.com/YOUR_ORG/bayon-coagent/actions`
2. Find the "Deploy Dev" workflow run
3. Monitor job progress:
   - ✅ Validate Infrastructure
   - ✅ Deploy Infrastructure
   - ✅ Deploy Frontend
   - ✅ Smoke Tests
   - ✅ Notify

#### Step 3: Review Deployment Notification

Check the #devops Slack channel for deployment notification:

```
🚀 Development Deployment Started
Branch: develop
Commit: abc1234 - "Add new feature"
Author: @developer
Workflow: https://github.com/.../actions/runs/123456
```

#### Step 4: Verify Deployment

Once deployment completes, verify the deployment:

```
✅ Development Deployment Successful
Environment: development
URL: https://dev.bayon-coagent.com
Duration: 8m 32s
Smoke Tests: All Passed ✅
```

#### Step 5: Manual Verification

1. Visit the development URL
2. Test the deployed changes
3. Verify authentication works
4. Check CloudWatch logs for errors

### Troubleshooting Development Deployment

#### Infrastructure Deployment Fails

**Symptoms**: SAM deployment fails with CloudFormation errors

**Resolution**:

1. Check CloudFormation stack events in AWS Console
2. Review SAM template for syntax errors
3. Verify AWS credentials are valid
4. Check resource quotas and limits

```bash
# View CloudFormation stack events
aws cloudformation describe-stack-events \
  --stack-name bayon-coagent-development \
  --region us-east-1
```

#### Frontend Deployment Fails

**Symptoms**: Amplify build fails

**Resolution**:

1. Check Amplify build logs in AWS Console
2. Verify environment variables are set correctly
3. Check for build errors in Next.js
4. Verify dependencies are installed correctly

```bash
# View Amplify app details
aws amplify get-app \
  --app-id YOUR_APP_ID \
  --region us-east-1
```

#### Smoke Tests Fail

**Symptoms**: Deployment succeeds but smoke tests fail

**Resolution**:

1. Check smoke test logs in GitHub Actions
2. Verify AWS services are accessible
3. Check Cognito user pool configuration
4. Verify DynamoDB tables exist
5. Check S3 bucket permissions

**Automatic Rollback**: If smoke tests fail, the system automatically rolls back to the previous version.

---

## Staging Deployment

### Purpose

Deploy a release candidate to the staging environment for comprehensive testing before production.

### Trigger

- **Tag**: Push a tag matching `rc-*` pattern (e.g., `rc-1.2.0`)
- **Manual**: GitHub Actions workflow dispatch

### Approval Requirements

- **1 Reviewer** from DevOps team
- **Timeout**: 24 hours

### Deployment Process

#### Step 1: Create Release Candidate Tag

```bash
# Ensure you're on the develop branch
git checkout develop

# Pull latest changes
git pull origin develop

# Create release candidate tag
git tag -a rc-1.2.0 -m "Release candidate 1.2.0"

# Push tag to trigger deployment
git push origin rc-1.2.0
```

#### Step 2: Monitor Pre-Deployment Checks

1. Go to GitHub Actions
2. Find the "Deploy Staging" workflow run
3. Monitor pre-deployment checks:
   - ✅ Code Quality Checks
   - ✅ Security Scans
   - ✅ All Tests Pass
   - ✅ Infrastructure Validation

#### Step 3: Review Deployment Checklist

The workflow will pause at the approval gate. Review the deployment checklist:

**Deployment Checklist**:

- [ ] All quality checks passed
- [ ] All security scans passed
- [ ] All tests passed
- [ ] Release notes reviewed
- [ ] Breaking changes documented
- [ ] Database migrations tested
- [ ] Rollback plan confirmed

#### Step 4: Approve Deployment

**Who Can Approve**: Designated DevOps team members

**Approval Process**:

1. Go to the workflow run in GitHub Actions
2. Click "Review deployments"
3. Select "staging" environment
4. Review the deployment checklist
5. Click "Approve and deploy" or "Reject"

**Approval Notification**:

```
⏳ Staging Deployment Awaiting Approval
Tag: rc-1.2.0
Commit: abc1234 - "Release candidate 1.2.0"
Checklist: All checks passed ✅
Approve: https://github.com/.../actions/runs/123456
Timeout: 24 hours
```

#### Step 5: Monitor Deployment

After approval, monitor the deployment:

- ✅ Deploy Infrastructure
- ✅ Deploy Frontend
- ✅ Integration Tests
- ✅ Performance Tests
- ✅ Mark Release Ready

#### Step 6: Review Test Results

Check integration test results:

```
✅ Integration Tests Passed
- Authentication Flow: ✅
- Content Creation: ✅
- AI Integration: ✅
- OAuth Integration: ✅
- Payment Processing: ✅
```

Check performance test results:

```
✅ Performance Tests Passed
- Performance: 92/100 ✅
- Accessibility: 96/100 ✅
- Best Practices: 91/100 ✅
- SEO: 97/100 ✅
```

#### Step 7: Verify Deployment

```
✅ Staging Deployment Successful
Environment: staging
URL: https://staging.bayon-coagent.com
Duration: 15m 42s
Tests: All Passed ✅
Release: Ready for Production ✅
```

#### Step 8: Manual Testing

1. Visit the staging URL
2. Perform comprehensive testing:
   - User authentication flows
   - Content creation features
   - AI integrations
   - Payment processing
   - OAuth integrations
3. Verify all features work as expected
4. Check for any regressions

### Troubleshooting Staging Deployment

#### Approval Timeout

**Symptoms**: Deployment cancelled after 24 hours

**Resolution**:

1. Create a new release candidate tag
2. Ensure approvers are notified
3. Review deployment checklist again
4. Approve within timeout period

#### Integration Tests Fail

**Symptoms**: Integration tests fail after deployment

**Resolution**:

1. Review test logs in GitHub Actions
2. Check for environment-specific issues
3. Verify OAuth credentials are correct
4. Check third-party API integrations
5. Fix issues and create new release candidate

#### Performance Tests Fail

**Symptoms**: Lighthouse scores below thresholds

**Resolution**:

1. Review Lighthouse report
2. Identify performance bottlenecks
3. Optimize bundle size
4. Optimize images and assets
5. Fix issues and create new release candidate

---

## Production Deployment

### Purpose

Deploy a tested and approved release to the production environment.

### Trigger

- **Tag**: Push a tag matching `v*` pattern (e.g., `v1.2.0`)
- **Manual**: GitHub Actions workflow dispatch (emergency only)

### Approval Requirements

- **2 Reviewers** from DevOps leads + Product managers
- **Timeout**: 48 hours
- **Wait Timer**: 5 minutes (allows last-minute cancellation)

### Deployment Process

#### Step 1: Verify Staging Success

Before creating a production tag, ensure:

- [ ] Staging deployment succeeded
- [ ] All staging tests passed
- [ ] Performance metrics meet thresholds
- [ ] Manual testing completed
- [ ] No critical issues found

#### Step 2: Create Production Tag

```bash
# Ensure you're on the main branch
git checkout main

# Merge staging changes
git merge develop

# Create production tag
git tag -a v1.2.0 -m "Release 1.2.0"

# Push tag to trigger deployment
git push origin v1.2.0
```

#### Step 3: Monitor Pre-Deployment Validation

1. Go to GitHub Actions
2. Find the "Deploy Production" workflow run
3. Monitor pre-deployment validation:
   - ✅ Verify Staging Success
   - ✅ Check Test Results
   - ✅ Verify Performance Metrics
   - ✅ Generate Deployment Plan

#### Step 4: Review Deployment Plan

The workflow will pause at the multi-approval gate. Review the deployment plan:

**Deployment Plan**:

- **Version**: v1.2.0
- **Staging Deployment**: ✅ Successful
- **All Tests**: ✅ Passed
- **Performance**: ✅ Meets Thresholds
- **Security**: ✅ No Critical Vulnerabilities

**Risk Assessment**:

- Database schema changes: No
- Breaking API changes: No
- Third-party dependency updates: Yes (minor versions)
- Infrastructure changes: Yes (added CloudWatch alarms)
- Expected downtime: None

**Rollback Plan**:

- Automatic rollback on smoke test failure
- Automatic rollback on CloudWatch alarm
- Manual rollback available via workflow dispatch
- Backup created before deployment

#### Step 5: Approve Deployment

**Who Can Approve**: 2 of the following:

- DevOps Lead
- Engineering Manager
- Product Manager
- CTO

**Approval Process**:

1. Go to the workflow run in GitHub Actions
2. Click "Review deployments"
3. Select "production" environment
4. Review the deployment plan and risk assessment
5. Click "Approve and deploy" or "Reject"
6. Wait for second approval

**Approval Notifications**:

```
⏳ Production Deployment Awaiting Approval (1/2)
Tag: v1.2.0
Commit: abc1234 - "Release 1.2.0"
Deployment Plan: Reviewed ✅
Approved by: @devops-lead
Waiting for: 1 more approval
Approve: https://github.com/.../actions/runs/123456
Timeout: 48 hours
```

#### Step 6: Wait Timer

After both approvals, there's a 5-minute wait timer:

```
⏳ Production Deployment Starting in 5 minutes
Tag: v1.2.0
Approved by: @devops-lead, @product-manager
Cancel: https://github.com/.../actions/runs/123456
```

This allows for last-minute cancellation if needed.

#### Step 7: Monitor Deployment

After the wait timer, monitor the deployment:

- ✅ Create Backup
- ✅ Deploy Infrastructure
- ✅ Deploy Frontend (gradual traffic shifting)
- ✅ Smoke Tests
- ✅ Monitor Deployment (15 minutes)
- ✅ Notify Stakeholders

#### Step 8: Monitor Traffic Shifting

The frontend deployment uses gradual traffic shifting:

```
🔄 Traffic Shifting in Progress
- 10% traffic to new version: ✅
- Monitoring metrics for 5 minutes...
- 50% traffic to new version: ✅
- Monitoring metrics for 5 minutes...
- 100% traffic to new version: ✅
```

#### Step 9: Monitor CloudWatch Metrics

The system monitors CloudWatch metrics for 15 minutes:

```
📊 Monitoring Production Metrics
- Error Rate: 0.02% ✅ (threshold: 1%)
- Latency P95: 245ms ✅ (threshold: 500ms)
- Request Rate: 1,250/min ✅
- CPU Utilization: 45% ✅
```

#### Step 10: Verify Deployment

```
✅ Production Deployment Successful
Environment: production
URL: https://bayon-coagent.com
Duration: 22m 15s
Smoke Tests: All Passed ✅
Metrics: All Normal ✅
Stakeholders: Notified ✅
```

#### Step 11: Post-Deployment Verification

1. Visit the production URL
2. Test critical user flows:
   - User sign-up and sign-in
   - Content creation
   - AI features
   - Payment processing
3. Monitor CloudWatch dashboards
4. Check error logs
5. Monitor user feedback channels

### Troubleshooting Production Deployment

#### Approval Timeout

**Symptoms**: Deployment cancelled after 48 hours

**Resolution**:

1. Create a new production tag
2. Ensure all approvers are notified
3. Schedule approval meeting if needed
4. Approve within timeout period

#### Smoke Tests Fail

**Symptoms**: Smoke tests fail after deployment

**Resolution**:

- **Automatic Rollback**: System automatically rolls back
- **Notification**: Urgent notification sent to team
- **Investigation**: Review smoke test logs
- **Fix**: Address issues and create new release

#### CloudWatch Alarms Trigger

**Symptoms**: Error rates or latency exceed thresholds

**Resolution**:

- **Automatic Rollback**: System automatically rolls back
- **Notification**: Urgent notification sent to team
- **Investigation**: Review CloudWatch logs and metrics
- **Fix**: Address performance issues and create new release

#### Traffic Shifting Issues

**Symptoms**: Errors increase during traffic shifting

**Resolution**:

1. System pauses traffic shifting
2. Monitors metrics for stability
3. If metrics don't improve, triggers rollback
4. Investigate issues in new version
5. Fix and create new release

---

## Emergency Deployment

### Purpose

Deploy critical fixes to production outside of normal release cycle.

### When to Use

- Critical security vulnerability
- Production outage
- Data loss prevention
- Critical bug affecting all users

### Approval Requirements

- **2 Reviewers** (same as normal production)
- **Expedited Review**: Approvers notified via PagerDuty
- **Timeout**: 4 hours (reduced from 48 hours)

### Emergency Deployment Process

#### Step 1: Create Hotfix Branch

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# Make your fix
# ... edit files ...

# Commit and push
git add .
git commit -m "fix: critical security vulnerability"
git push origin hotfix/critical-fix
```

#### Step 2: Create Emergency PR

1. Create PR from hotfix branch to main
2. Label PR with `emergency` label
3. Request reviews from DevOps leads
4. Ensure CI passes

#### Step 3: Merge and Tag

```bash
# Merge PR
git checkout main
git pull origin main

# Create emergency tag
git tag -a v1.2.1 -m "Emergency fix: critical security vulnerability"
git push origin v1.2.1
```

#### Step 4: Notify Approvers

Send urgent notification via PagerDuty:

```
🚨 EMERGENCY PRODUCTION DEPLOYMENT
Tag: v1.2.1
Reason: Critical security vulnerability
Impact: All users affected
Approve: https://github.com/.../actions/runs/123456
Timeout: 4 hours
```

#### Step 5: Expedited Approval

Approvers should:

1. Review the fix immediately
2. Verify the fix addresses the issue
3. Approve deployment
4. Monitor deployment closely

#### Step 6: Monitor Deployment

Monitor deployment more closely than normal:

- Watch CloudWatch metrics in real-time
- Monitor error logs
- Check user reports
- Be ready to rollback if needed

#### Step 7: Post-Deployment

1. Verify fix is working
2. Monitor for 30 minutes minimum
3. Update stakeholders
4. Create post-mortem document
5. Schedule retrospective

---

## Verification Procedures

### Post-Deployment Verification Checklist

After any deployment, verify the following:

#### Application Health

- [ ] Application loads successfully
- [ ] No JavaScript errors in console
- [ ] All pages render correctly
- [ ] API endpoints respond correctly

#### Authentication

- [ ] User sign-up works
- [ ] User sign-in works
- [ ] Session management works
- [ ] Password reset works

#### Core Features

- [ ] Content creation works
- [ ] AI features work
- [ ] File uploads work
- [ ] Search works

#### Integrations

- [ ] OAuth integrations work
- [ ] Payment processing works
- [ ] Email notifications work
- [ ] Third-party APIs work

#### Performance

- [ ] Page load times acceptable
- [ ] API response times acceptable
- [ ] No memory leaks
- [ ] No performance regressions

#### Monitoring

- [ ] CloudWatch logs flowing
- [ ] Metrics being collected
- [ ] Alarms configured correctly
- [ ] Dashboards showing data

### Automated Verification

The smoke tests automatically verify:

```bash
# Authentication smoke test
./scripts/smoke-tests/test-auth.sh

# Database smoke test
./scripts/smoke-tests/test-database.sh

# Storage smoke test
./scripts/smoke-tests/test-storage.sh

# AI service smoke test
./scripts/smoke-tests/test-ai.sh
```

### Manual Verification

For critical deployments, perform manual verification:

1. **User Journey Testing**:

   - Sign up as new user
   - Complete onboarding
   - Create content
   - Use AI features
   - Make a payment

2. **Integration Testing**:

   - Connect Google Business Profile
   - Import reviews
   - Generate social media posts
   - Schedule posts

3. **Performance Testing**:
   - Run Lighthouse audit
   - Check bundle size
   - Monitor API response times
   - Check database query performance

---

## Troubleshooting

### Common Deployment Issues

#### Issue: CloudFormation Stack Update Failed

**Symptoms**:

- Deployment fails during infrastructure deployment
- CloudFormation shows UPDATE_ROLLBACK_COMPLETE

**Diagnosis**:

```bash
# Check stack events
aws cloudformation describe-stack-events \
  --stack-name bayon-coagent-production \
  --region us-east-1 \
  --max-items 20
```

**Resolution**:

1. Review stack events for specific error
2. Check resource limits and quotas
3. Verify IAM permissions
4. Fix SAM template if needed
5. Retry deployment

#### Issue: Amplify Build Failed

**Symptoms**:

- Frontend deployment fails
- Amplify shows build error

**Diagnosis**:

```bash
# Get Amplify job details
aws amplify get-job \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --job-id JOB_ID \
  --region us-east-1
```

**Resolution**:

1. Review Amplify build logs
2. Check for build errors
3. Verify environment variables
4. Check dependencies
5. Retry deployment

#### Issue: Smoke Tests Timeout

**Symptoms**:

- Smoke tests hang and timeout
- No clear error message

**Diagnosis**:

```bash
# Check application logs
aws logs tail /aws/lambda/bayon-coagent-production \
  --follow \
  --region us-east-1
```

**Resolution**:

1. Check if services are accessible
2. Verify network connectivity
3. Check security group rules
4. Verify IAM permissions
5. Increase timeout if needed

#### Issue: High Error Rate After Deployment

**Symptoms**:

- CloudWatch alarms trigger
- Error rate exceeds threshold

**Diagnosis**:

1. Check CloudWatch logs for errors
2. Review error patterns
3. Check recent code changes
4. Verify configuration changes

**Resolution**:

1. If critical, trigger manual rollback
2. If minor, investigate and fix
3. Monitor metrics closely
4. Create hotfix if needed

### Getting Help

**For Deployment Issues**:

1. Check this runbook
2. Review GitHub Actions logs
3. Check AWS Console for details
4. Contact #devops Slack channel

**For Critical Production Issues**:

1. Page on-call engineer via PagerDuty
2. Trigger manual rollback if needed
3. Create incident ticket
4. Notify stakeholders

---

## Rollback Procedures

For detailed rollback procedures, see the [Rollback Runbook](./rollback-runbook.md).

### Quick Rollback

If you need to rollback immediately:

```bash
# Trigger manual rollback via GitHub Actions
gh workflow run rollback.yml \
  -f environment=production \
  -f target_version=v1.1.0
```

---

## Related Documentation

- [Pipeline Architecture](./pipeline-architecture.md) - Overall CI/CD architecture
- [Rollback Runbook](./rollback-runbook.md) - Detailed rollback procedures
- [GitHub Setup Guide](./github-setup-guide.md) - Initial setup instructions
- [Cost Monitoring Guide](./cost-monitoring-guide.md) - Cost tracking
- [Performance Testing Guide](./performance-testing-guide.md) - Performance testing

---

## Changelog

| Date       | Version | Changes                    |
| ---------- | ------- | -------------------------- |
| 2024-12-04 | 1.0.0   | Initial deployment runbook |

---

## Appendix

### Deployment Commands Reference

```bash
# Create release candidate tag
git tag -a rc-1.2.0 -m "Release candidate 1.2.0"
git push origin rc-1.2.0

# Create production tag
git tag -a v1.2.0 -m "Release 1.2.0"
git push origin v1.2.0

# Trigger manual deployment
gh workflow run deploy-production.yml

# View workflow runs
gh run list --workflow=deploy-production.yml

# View workflow run details
gh run view RUN_ID

# Cancel workflow run
gh run cancel RUN_ID

# Trigger manual rollback
gh workflow run rollback.yml \
  -f environment=production \
  -f target_version=v1.1.0
```

### AWS CLI Commands Reference

```bash
# View CloudFormation stack
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-production \
  --region us-east-1

# View stack events
aws cloudformation describe-stack-events \
  --stack-name bayon-coagent-production \
  --region us-east-1

# View Amplify app
aws amplify get-app \
  --app-id YOUR_APP_ID \
  --region us-east-1

# View Amplify job
aws amplify get-job \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --job-id JOB_ID \
  --region us-east-1

# View CloudWatch logs
aws logs tail /aws/lambda/bayon-coagent-production \
  --follow \
  --region us-east-1

# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=bayon-coagent-production \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T01:00:00Z \
  --period 300 \
  --statistics Sum \
  --region us-east-1
```

### Smoke Test Commands

```bash
# Run all smoke tests
./scripts/smoke-tests/test-auth.sh
./scripts/smoke-tests/test-database.sh
./scripts/smoke-tests/test-storage.sh
./scripts/smoke-tests/test-ai.sh

# Run smoke tests against specific environment
ENVIRONMENT=production ./scripts/smoke-tests/test-auth.sh
```

### Useful GitHub CLI Commands

```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# List workflows
gh workflow list

# View workflow runs
gh run list --workflow=deploy-production.yml --limit 10

# View run details
gh run view RUN_ID --log

# Watch run in real-time
gh run watch RUN_ID

# Cancel run
gh run cancel RUN_ID

# Trigger workflow
gh workflow run deploy-production.yml

# View workflow file
gh workflow view deploy-production.yml
```
