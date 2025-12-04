# Production Deployment Workflow Guide

## Overview

The production deployment workflow (`deploy-production.yml`) provides a comprehensive, secure, and automated deployment process for the Bayon CoAgent application to the production environment. This workflow implements multiple safety gates, comprehensive testing, and automatic rollback capabilities to ensure reliable production deployments.

## Workflow Triggers

### Automatic Trigger

- **Tag Pattern**: `v*` (e.g., `v1.0.0`, `v2.1.3`)
- Automatically triggers when a production version tag is pushed

### Manual Trigger

- Available via GitHub Actions UI (workflow_dispatch)
- Emergency deployment options:
  - `skip-monitoring`: Skip 15-minute post-deployment monitoring (emergency only)
  - `force-deploy`: Skip pre-deployment validation (emergency only)

## Deployment Flow

```
1. Pre-Deployment Validation
   ├─ Verify staging deployment succeeded
   ├─ Check all staging tests passed
   ├─ Verify performance metrics meet thresholds
   └─ Generate deployment plan

2. Multi-Approval Gate (2+ approvers required)
   └─ Display deployment plan and risk assessment

3. Create Production Backup
   ├─ Capture CloudFormation stack state
   ├─ Export DynamoDB table backup
   ├─ Tag current Amplify deployment
   └─ Store backup metadata

4. Validate Infrastructure
   ├─ Validate SAM template
   ├─ Run cfn-lint
   └─ Generate change preview

5. Deploy Infrastructure
   ├─ Check CloudWatch alarms (pre-deployment)
   ├─ Deploy SAM stack
   ├─ Monitor deployment progress
   └─ Check CloudWatch alarms (post-deployment)

6. Deploy Frontend
   ├─ Update Amplify environment variables
   ├─ Trigger Amplify deployment
   ├─ Monitor deployment progress
   └─ Enable gradual traffic shifting (10% → 50% → 100%)

7. Run Production Smoke Tests
   ├─ Authentication flow test
   ├─ Content creation test
   ├─ AI service integration test
   └─ Payment processing test

8. Monitor Deployment (15 minutes)
   ├─ Watch CloudWatch metrics
   ├─ Monitor error rates
   ├─ Monitor latency
   └─ Check for alarm triggers

9. Notify Stakeholders
   ├─ Generate release notes
   ├─ Update GitHub release
   ├─ Send team notification (Slack)
   ├─ Send stakeholder summary (Email)
   ├─ Update status page
   └─ Post to company Slack channel

10. Automatic Rollback (on failure)
    ├─ Rollback CloudFormation stack
    ├─ Revert Amplify deployment
    ├─ Verify rollback
    └─ Send urgent notifications
```

## Prerequisites

### GitHub Secrets Configuration

The following secrets must be configured in GitHub repository settings:

**AWS Credentials (Production)**:

- `AWS_ACCESS_KEY_ID_PROD`: Production AWS access key
- `AWS_SECRET_ACCESS_KEY_PROD`: Production AWS secret key

**Notification Services**:

- `SLACK_WEBHOOK_URL`: Slack webhook for deployment notifications
- `SLACK_COMPANY_WEBHOOK_URL`: Company-wide Slack webhook
- `SLACK_ONCALL_USERS`: Slack user IDs for on-call engineers (comma-separated)
- `STAKEHOLDER_EMAIL_LIST`: Email addresses for stakeholder notifications (comma-separated)

### GitHub Environment Configuration

Create a `production` environment in GitHub repository settings:

**Protection Rules**:

- Require 2 reviewer approvals
- Designated reviewers: DevOps leads and product managers
- Wait timer: 5 minutes (allows for last-minute cancellation)
- Deployment branch: Tags matching `v*`

**Environment Secrets**:

- Use production AWS credentials
- Configure production-specific variables

**Environment URL**:

- `https://app.bayoncoagent.com`

## Deployment Process

### Step 1: Prepare for Production Deployment

1. Ensure staging deployment succeeded:

   ```bash
   # Check staging release exists
   gh release view rc-1.0.0
   ```

2. Verify all staging tests passed:

   ```bash
   # Check latest staging workflow run
   gh run list --workflow=deploy-staging.yml --limit 1
   ```

3. Review performance metrics from staging

### Step 2: Create Production Tag

```bash
# Create and push production tag
git tag v1.0.0
git push origin v1.0.0
```

This automatically triggers the production deployment workflow.

### Step 3: Monitor Pre-Deployment Validation

The workflow will:

- Verify staging deployment succeeded
- Check all staging tests passed
- Verify performance metrics meet thresholds
- Generate deployment plan

### Step 4: Review and Approve Deployment

1. Navigate to GitHub Actions → Deploy to Production workflow
2. Review the deployment plan displayed in the job summary
3. At least 2 designated approvers must approve the deployment
4. Approval timeout: 48 hours

**Deployment Plan Includes**:

- Release information (version, commit, author)
- Pre-deployment check results
- Deployment steps
- Rollback plan
- Risk assessment

### Step 5: Monitor Deployment Progress

Once approved, the workflow will:

1. **Create Backup** (~2 minutes)

   - CloudFormation stack snapshot
   - DynamoDB table backup
   - Amplify deployment tag

2. **Deploy Infrastructure** (~5-10 minutes)

   - SAM stack deployment
   - CloudWatch alarm monitoring

3. **Deploy Frontend** (~10-15 minutes)

   - Amplify deployment
   - Gradual traffic shifting

4. **Run Smoke Tests** (~3-5 minutes)

   - Authentication, content, AI, payments

5. **Monitor Metrics** (15 minutes)
   - CloudWatch alarms
   - Error rates
   - Latency

### Step 6: Verify Deployment Success

Check the workflow summary for:

- ✅ All jobs completed successfully
- ✅ All smoke tests passed
- ✅ Monitoring period completed without issues
- ✅ Stakeholder notifications sent

## Rollback Procedures

### Automatic Rollback

The workflow automatically triggers rollback if:

- Smoke tests fail
- CloudWatch alarms trigger during deployment
- Monitoring detects metric degradation

**Rollback Process**:

1. Revert CloudFormation stack to previous version
2. Revert Amplify deployment to previous build
3. Verify rollback with smoke tests
4. Send urgent notifications to on-call team

### Manual Rollback

If you need to manually rollback a deployment:

```bash
# Trigger rollback workflow
gh workflow run rollback.yml \
  --field environment=production \
  --field target-version=v1.0.0
```

Or use the GitHub Actions UI:

1. Navigate to Actions → Rollback workflow
2. Click "Run workflow"
3. Select production environment
4. Specify target version (optional)
5. Confirm rollback

## Monitoring and Alerts

### CloudWatch Metrics Monitored

- **Error Rate**: Must be < 1%
- **Average Latency**: Must be < 1000ms
- **CloudWatch Alarms**: Must be 0 triggered
- **Traffic Patterns**: Must be normal

### Monitoring Duration

- **Post-Deployment**: 15 minutes of continuous monitoring
- **Check Interval**: Every 60 seconds
- **Auto-Rollback**: Triggered if metrics degrade

### Notification Channels

**Slack Notifications**:

- Deployment started
- Deployment succeeded
- Deployment failed
- Rollback triggered

**Email Notifications**:

- Stakeholder summary (on success)
- Incident report (on failure)

**Status Page**:

- Automatically updated with deployment status

## Gradual Traffic Shifting

The frontend deployment uses gradual traffic shifting to minimize risk:

1. **Phase 1**: 10% of traffic to new version

   - Monitor for 5 minutes
   - Check for errors or issues

2. **Phase 2**: 50% of traffic to new version

   - Monitor for 5 minutes
   - Verify metrics remain healthy

3. **Phase 3**: 100% of traffic to new version
   - Full deployment complete
   - Continue monitoring

If issues are detected during any phase, automatic rollback is triggered.

## Troubleshooting

### Deployment Fails at Pre-Deployment Validation

**Issue**: Staging deployment not found or tests failed

**Solution**:

1. Verify staging deployment succeeded: `gh release view rc-X.Y.Z`
2. Check staging workflow run: `gh run list --workflow=deploy-staging.yml`
3. Fix staging issues before attempting production deployment

### Deployment Fails at Approval Gate

**Issue**: Approval timeout or insufficient approvers

**Solution**:

1. Check approval timeout (48 hours)
2. Ensure at least 2 designated approvers are available
3. Contact approvers via Slack if needed
4. Re-trigger workflow if timeout occurred

### Deployment Fails at Infrastructure Deployment

**Issue**: CloudFormation stack update failed

**Solution**:

1. Check CloudFormation console for error details
2. Review changeset preview artifact
3. Fix template issues and create new tag
4. Automatic rollback will restore previous state

### Deployment Fails at Smoke Tests

**Issue**: One or more smoke tests failed

**Solution**:

1. Review smoke test logs in workflow artifacts
2. Automatic rollback will restore previous state
3. Fix issues in staging environment first
4. Re-deploy to staging and verify
5. Create new production tag

### Monitoring Detects Issues

**Issue**: CloudWatch alarms triggered or metrics degraded

**Solution**:

1. Automatic rollback will be triggered
2. Review monitoring report artifact
3. Investigate root cause in logs
4. Fix issues and re-deploy

## Best Practices

### Before Deployment

1. ✅ Ensure staging deployment succeeded
2. ✅ Verify all tests passed in staging
3. ✅ Review performance metrics
4. ✅ Communicate deployment window to team
5. ✅ Ensure on-call engineers are available
6. ✅ Review recent production metrics

### During Deployment

1. ✅ Monitor workflow progress in real-time
2. ✅ Watch Slack notifications
3. ✅ Keep CloudWatch console open
4. ✅ Be ready to investigate issues
5. ✅ Don't make other infrastructure changes

### After Deployment

1. ✅ Verify all smoke tests passed
2. ✅ Review monitoring report
3. ✅ Check production metrics dashboard
4. ✅ Monitor error rates for 1 hour
5. ✅ Communicate success to stakeholders
6. ✅ Update release notes if needed

## Emergency Procedures

### Emergency Deployment (Skip Validation)

**Use only in critical situations**:

```bash
gh workflow run deploy-production.yml \
  --field force-deploy=true \
  --field skip-monitoring=true
```

**Warning**: This bypasses safety checks. Use only for:

- Critical security patches
- Production outage fixes
- Emergency hotfixes

### Emergency Rollback

If automatic rollback fails:

1. **Manual CloudFormation Rollback**:

   ```bash
   aws cloudformation cancel-update-stack \
     --stack-name bayon-coagent-production \
     --region us-west-2
   ```

2. **Manual Amplify Rollback**:

   ```bash
   # Get previous successful job
   aws amplify list-jobs \
     --app-id <APP_ID> \
     --branch-name main \
     --max-results 10

   # Redeploy previous job
   aws amplify start-job \
     --app-id <APP_ID> \
     --branch-name main \
     --job-type RETRY \
     --job-id <PREVIOUS_JOB_ID>
   ```

3. **Notify Team**:
   - Post in #devops Slack channel
   - Alert on-call engineers
   - Create incident report

## Metrics and Reporting

### Deployment Metrics

Track the following metrics for each deployment:

- **Deployment Duration**: Total time from start to completion
- **Approval Time**: Time from trigger to approval
- **Infrastructure Deployment Time**: SAM stack deployment duration
- **Frontend Deployment Time**: Amplify deployment duration
- **Smoke Test Duration**: Time to run all smoke tests
- **Monitoring Duration**: 15 minutes (fixed)

### Success Criteria

A successful production deployment must meet:

- ✅ All pre-deployment validations passed
- ✅ Multi-approval obtained
- ✅ Backup created successfully
- ✅ Infrastructure deployed without errors
- ✅ Frontend deployed without errors
- ✅ All smoke tests passed (100%)
- ✅ No CloudWatch alarms triggered
- ✅ Error rate < 1%
- ✅ Average latency < 1000ms
- ✅ 15-minute monitoring completed
- ✅ Stakeholder notifications sent

## Related Documentation

- [CI/CD Pipeline Architecture](./pipeline-architecture.md)
- [Deployment Runbook](./deployment-runbook.md)
- [Rollback Runbook](./rollback-runbook.md)
- [Staging Deployment Guide](./staging-deployment-guide.md)
- [Development Deployment Guide](./development-deployment-guide.md)
- [Smoke Tests Guide](./smoke-tests-guide.md)

## Support

For issues or questions:

- **Slack**: #devops channel
- **On-Call**: Page via PagerDuty
- **Email**: devops@bayoncoagent.com
