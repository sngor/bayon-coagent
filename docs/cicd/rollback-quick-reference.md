# Rollback Workflow Quick Reference

## Overview

The rollback workflow provides emergency rollback capability for failed deployments across all environments (development, staging, production).

## When to Use

Use the rollback workflow when:

- A deployment causes critical issues in production
- Smoke tests fail after deployment
- Application becomes unstable or unavailable
- Security vulnerability discovered in current version
- Need to quickly revert to last known good state

## How to Trigger

### Via GitHub Actions UI

1. Go to **Actions** tab in GitHub
2. Select **Rollback Deployment** workflow
3. Click **Run workflow**
4. Fill in required inputs:
   - **Environment:** development, staging, or production
   - **Target version:** (optional) Specific version tag, or leave empty for automatic previous version
   - **Reason:** Clear description of why rollback is needed
5. Click **Run workflow**

### Via GitHub CLI

```bash
# Rollback to previous version
gh workflow run rollback.yml \
  -f environment=production \
  -f reason="Critical bug in payment processing"

# Rollback to specific version
gh workflow run rollback.yml \
  -f environment=production \
  -f target-version="v1.2.3" \
  -f reason="Reverting to stable release"
```

### Automatic Trigger

The rollback workflow is automatically triggered when:

- Deployment smoke tests fail
- CloudWatch alarms trigger during deployment

## Approval Requirements

### Development

- ✅ No approval required
- Automatic rollback on failure

### Staging

- ✅ No approval required
- Automatic rollback on failure

### Production

- ⚠️ **Manual approval required**
- Requires approval from designated reviewers
- 48-hour timeout for approval

## What Happens During Rollback

### 1. Validation (1-2 minutes)

- Verifies target version exists
- Checks stack is in safe state
- Determines rollback feasibility

### 2. Approval (Production Only)

- Waits for manual approval
- Displays rollback details
- Timeout after 48 hours

### 3. Infrastructure Rollback (5-10 minutes)

- Reverts CloudFormation stack
- Restores previous infrastructure state
- Monitors rollback progress

### 4. Frontend Rollback (3-5 minutes)

- Redeploys previous Amplify build
- Monitors deployment progress
- Verifies deployment success

### 5. Verification (2-3 minutes)

- Runs smoke tests
- Verifies critical functionality
- Monitors CloudWatch metrics

### 6. Notifications

- Sends Slack notification
- Sends email to DevOps team
- Creates incident report
- Escalates if rollback fails

**Total Time:** ~15-20 minutes (excluding approval wait)

## Notifications

### Successful Rollback

- ✅ Slack notification to team channel
- ✅ Email to DevOps team
- ✅ Incident report uploaded
- ℹ️ Summary of what was rolled back

### Failed Rollback

- 🚨 **URGENT** Slack notification with @mentions
- 🚨 High-priority email
- 🚨 PagerDuty incident created
- 🚨 GitHub issue created
- ⚠️ Requires immediate attention

### Verification Failed

- ⚠️ Warning Slack notification
- ⚠️ Email to DevOps team
- ⚠️ GitHub issue created
- ℹ️ Investigation required

## Incident Reports

Every rollback creates an incident report containing:

- Rollback details (environment, version, reason)
- Status of each step
- Timeline of events
- Actions taken
- Next steps checklist

**Location:** Workflow artifacts (90-day retention)

## Monitoring Rollback Progress

### Via GitHub Actions UI

1. Go to **Actions** tab
2. Click on the running workflow
3. Monitor each job's progress
4. View logs for detailed information

### Via GitHub CLI

```bash
# List recent workflow runs
gh run list --workflow=rollback.yml

# View specific run
gh run view <run-id>

# Watch run in real-time
gh run watch <run-id>
```

## Common Scenarios

### Scenario 1: Production Deployment Failed

```bash
gh workflow run rollback.yml \
  -f environment=production \
  -f reason="Deployment failed smoke tests - reverting to stable version"
```

### Scenario 2: Critical Bug Discovered

```bash
gh workflow run rollback.yml \
  -f environment=production \
  -f target-version="v2.1.0" \
  -f reason="Critical bug in user authentication - rolling back to v2.1.0"
```

### Scenario 3: Performance Degradation

```bash
gh workflow run rollback.yml \
  -f environment=production \
  -f reason="Severe performance degradation - API response times >5s"
```

## Troubleshooting

### Rollback Fails to Start

- Check GitHub secrets are configured
- Verify AWS credentials are valid
- Ensure target version exists

### Infrastructure Rollback Fails

- Check CloudFormation console for errors
- Verify stack is not in failed state
- May require manual intervention

### Frontend Rollback Fails

- Check Amplify console for errors
- Verify previous build exists
- Check Amplify service status

### Verification Fails

- Review smoke test logs
- Check application manually
- May indicate deeper issues

## Emergency Contacts

If rollback fails or requires escalation:

1. **On-call DevOps Engineer** - Via PagerDuty
2. **DevOps Team Lead** - Check Slack for contact
3. **Platform Team** - #devops-alerts channel

## Post-Rollback Actions

After successful rollback:

1. ✅ Verify application is functioning
2. ✅ Review incident report
3. ✅ Investigate root cause
4. ✅ Document lessons learned
5. ✅ Plan for re-deployment
6. ✅ Update team on status

After failed rollback:

1. 🚨 Escalate immediately
2. 🚨 Review all logs
3. 🚨 Consider manual intervention
4. 🚨 Engage senior DevOps team
5. 🚨 Document all actions taken

## Best Practices

1. **Always provide clear reason** - Helps with post-mortem analysis
2. **Monitor after rollback** - Watch metrics for 15-30 minutes
3. **Communicate with team** - Keep stakeholders informed
4. **Document everything** - Update incident report with findings
5. **Learn from incidents** - Review and improve processes

## Related Documentation

- [Rollback Runbook](./rollback-runbook.md) - Detailed procedures
- [Deployment Guide](./deployment-guide.md) - Deployment procedures
- [Incident Response](./incident-response.md) - Incident handling

---

**Last Updated:** 2025-12-03
**Maintained By:** DevOps Team
