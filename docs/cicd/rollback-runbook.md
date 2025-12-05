# Rollback Runbook

## Overview

This runbook provides comprehensive procedures for rolling back deployments in Bayon CoAgent. It covers automatic rollback triggers, manual rollback procedures, verification steps, and escalation procedures for failed rollbacks.

**Critical**: Rollback is a safety mechanism to quickly restore service when deployments fail. Always verify the rollback succeeded and investigate the root cause.

## Table of Contents

- [When to Rollback](#when-to-rollback)
- [Automatic Rollback](#automatic-rollback)
- [Manual Rollback](#manual-rollback)
- [Verification After Rollback](#verification-after-rollback)
- [Escalation Procedures](#escalation-procedures)
- [Post-Rollback Actions](#post-rollback-actions)
- [Examples and Commands](#examples-and-commands)

---

## When to Rollback

### Automatic Rollback Triggers

The system automatically triggers rollback in these scenarios:

1. **Smoke Test Failures**

   - Authentication tests fail
   - Database connectivity tests fail
   - S3 storage tests fail
   - AI service integration tests fail

2. **CloudWatch Alarm Triggers**

   - Error rate exceeds 1%
   - P95 latency exceeds 500ms
   - 5xx errors exceed threshold
   - CPU utilization exceeds 90%

3. **Deployment Timeout**

   - Infrastructure deployment takes longer than 30 minutes
   - Frontend deployment takes longer than 20 minutes
   - Health checks don't pass within 10 minutes

4. **Health Check Failures**
   - Application health endpoint returns errors
   - Critical endpoints return 5xx errors
   - Database connections fail

### Manual Rollback Scenarios

Consider manual rollback in these situations:

1. **Critical Bugs Discovered**

   - Data corruption or loss
   - Security vulnerability introduced
   - Critical feature completely broken
   - Payment processing failures

2. **Performance Degradation**

   - Significant increase in response times
   - Memory leaks causing crashes
   - Database query performance issues
   - Third-party API failures

3. **User-Reported Issues**

   - Multiple users reporting same critical issue
   - Unable to access core features
   - Data inconsistencies
   - Authentication failures

4. **Business Impact**
   - Revenue-impacting issues
   - Compliance violations
   - SLA breaches
   - Reputation damage

### When NOT to Rollback

Don't rollback for:

- Minor UI issues that don't affect functionality
- Non-critical bugs with workarounds
- Issues affecting only a small subset of users
- Issues that can be fixed with a hotfix faster than rollback

---

## Automatic Rollback

### How Automatic Rollback Works

When a deployment fails, the system automatically:

1. **Detects Failure**: Monitors smoke tests, CloudWatch alarms, and health checks
2. **Halts Deployment**: Stops any in-progress deployment activities
3. **Initiates Rollback**: Triggers the rollback workflow
4. **Reverts Infrastructure**: Rolls back CloudFormation stack to previous version
5. **Reverts Frontend**: Rolls back Amplify deployment to previous build
6. **Verifies Rollback**: Runs smoke tests against rolled-back version
7. **Monitors Metrics**: Watches CloudWatch metrics for stability
8. **Notifies Team**: Sends urgent notification with failure details
9. **Creates Incident**: Generates incident report for post-mortem

### Automatic Rollback Timeline

```
T+0:00  Deployment completes
T+0:01  Smoke tests start
T+0:03  Smoke test fails (e.g., authentication test)
T+0:03  Automatic rollback triggered
T+0:04  Deployment halted
T+0:05  CloudFormation rollback initiated
T+0:10  CloudFormation rollback complete
T+0:11  Amplify rollback initiated
T+0:15  Amplify rollback complete
T+0:16  Verification smoke tests start
T+0:18  Verification smoke tests pass
T+0:19  Metrics monitoring (5 minutes)
T+0:24  Rollback complete, team notified
```

### Monitoring Automatic Rollback

When automatic rollback is triggered, you'll receive notifications:

**Slack Notification**:

```
🚨 AUTOMATIC ROLLBACK IN PROGRESS
Environment: production
Reason: Smoke test failure (authentication)
Previous Version: v1.1.0
Failed Version: v1.2.0
Status: https://github.com/.../actions/runs/123456
```

**Monitoring the Rollback**:

1. Go to GitHub Actions
2. Find the rollback workflow run
3. Monitor progress:
   - ✅ Halt Deployment
   - ✅ Rollback Infrastructure
   - ✅ Rollback Frontend
   - ✅ Verify Rollback
   - ✅ Monitor Metrics
   - ✅ Notify Team

### Automatic Rollback Success

```
✅ AUTOMATIC ROLLBACK SUCCESSFUL
Environment: production
Rolled back to: v1.1.0
Duration: 21 minutes
Verification: All smoke tests passed ✅
Metrics: All normal ✅
Action Required: Investigate failure and create hotfix
```

### Automatic Rollback Failure

If automatic rollback fails, see [Escalation Procedures](#escalation-procedures).

---

## Manual Rollback

### When to Use Manual Rollback

Use manual rollback when:

- Critical issue discovered after deployment
- Automatic rollback didn't trigger but should have
- Need to rollback to a specific older version
- Emergency situation requiring immediate action

### Manual Rollback Prerequisites

Before initiating manual rollback:

1. **Identify Target Version**

   - Determine which version to rollback to
   - Verify that version is stable
   - Check that version is available

2. **Assess Impact**

   - Understand what will be lost
   - Check for database migrations
   - Verify data compatibility
   - Identify affected users

3. **Notify Stakeholders**

   - Alert team in #devops Slack channel
   - Notify on-call engineer
   - Update status page if needed
   - Prepare user communication

4. **Prepare for Verification**
   - Have smoke tests ready
   - Prepare manual test plan
   - Identify key metrics to monitor
   - Have rollback verification checklist ready

### Manual Rollback Procedure

#### Step 1: Trigger Rollback Workflow

**Via GitHub Actions UI**:

1. Go to GitHub Actions: `https://github.com/YOUR_ORG/bayon-coagent/actions`
2. Click on "Rollback" workflow
3. Click "Run workflow"
4. Select environment (development, staging, production)
5. Enter target version (e.g., v1.1.0) or leave blank for previous
6. Click "Run workflow"

**Via GitHub CLI**:

```bash
# Rollback to previous version
gh workflow run rollback.yml \
  -f environment=production

# Rollback to specific version
gh workflow run rollback.yml \
  -f environment=production \
  -f target_version=v1.1.0
```

**Via API**:

```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/YOUR_ORG/bayon-coagent/actions/workflows/rollback.yml/dispatches \
  -d '{"ref":"main","inputs":{"environment":"production","target_version":"v1.1.0"}}'
```

#### Step 2: Approve Rollback (Production Only)

For production rollbacks, approval is required:

**Approval Process**:

1. Workflow pauses at approval gate
2. Designated approver reviews rollback request
3. Approver verifies:
   - Target version is correct
   - Rollback is necessary
   - Impact is understood
4. Approver clicks "Approve and deploy"

**Approval Notification**:

```
⏳ Production Rollback Awaiting Approval
Environment: production
Current Version: v1.2.0
Target Version: v1.1.0
Reason: Critical authentication bug
Approve: https://github.com/.../actions/runs/123456
Timeout: 1 hour
```

#### Step 3: Monitor Rollback Progress

Monitor the rollback workflow:

1. **Validate Rollback**

   - Verify target version exists
   - Check rollback is safe to perform
   - Validate no blocking issues

2. **Rollback Infrastructure**

   - Revert CloudFormation stack
   - Monitor stack events
   - Wait for stable state

3. **Rollback Frontend**

   - Revert Amplify deployment
   - Monitor build progress
   - Wait for deployment complete

4. **Verify Rollback**

   - Run smoke tests
   - Check critical functionality
   - Monitor metrics

5. **Notify Team**
   - Send rollback completion notification
   - Include rollback details
   - Provide next steps

#### Step 4: Monitor Rollback Completion

```
✅ MANUAL ROLLBACK SUCCESSFUL
Environment: production
Rolled back from: v1.2.0
Rolled back to: v1.1.0
Duration: 18 minutes
Verification: All smoke tests passed ✅
Metrics: All normal ✅
```

### Manual Rollback Timeline

```
T+0:00  Manual rollback triggered
T+0:01  Approval requested (production only)
T+0:05  Approval granted
T+0:06  Rollback validation complete
T+0:07  CloudFormation rollback initiated
T+0:12  CloudFormation rollback complete
T+0:13  Amplify rollback initiated
T+0:17  Amplify rollback complete
T+0:18  Verification smoke tests start
T+0:20  Verification smoke tests pass
T+0:21  Metrics monitoring (5 minutes)
T+0:26  Rollback complete, team notified
```

---

## Verification After Rollback

### Automated Verification

The rollback workflow automatically runs smoke tests:

```bash
# Authentication smoke test
✅ User sign-up works
✅ User sign-in works
✅ Session management works
✅ Token validation works

# Database smoke test
✅ DynamoDB connectivity works
✅ Read operations work
✅ Write operations work
✅ Query operations work

# Storage smoke test
✅ S3 connectivity works
✅ File upload works
✅ File download works
✅ Presigned URLs work

# AI service smoke test
✅ Bedrock connectivity works
✅ Model invocation works
✅ Streaming responses work
✅ Error handling works
```

### Manual Verification Checklist

After rollback, manually verify:

#### Application Health

- [ ] Application loads successfully
- [ ] No JavaScript errors in console
- [ ] All pages render correctly
- [ ] API endpoints respond correctly

#### Critical User Flows

- [ ] User can sign up
- [ ] User can sign in
- [ ] User can create content
- [ ] User can use AI features
- [ ] User can upload files

#### Data Integrity

- [ ] No data loss
- [ ] Data is consistent
- [ ] Database queries work
- [ ] File storage accessible

#### Integrations

- [ ] OAuth integrations work
- [ ] Payment processing works
- [ ] Email notifications work
- [ ] Third-party APIs work

#### Performance

- [ ] Response times normal
- [ ] No memory leaks
- [ ] Database performance normal
- [ ] No error spikes

#### Monitoring

- [ ] CloudWatch logs flowing
- [ ] Metrics being collected
- [ ] Alarms not triggering
- [ ] Dashboards showing normal data

### Metrics to Monitor

Monitor these metrics for 30 minutes after rollback:

**Application Metrics**:

- Error rate (should be < 0.1%)
- P95 latency (should be < 300ms)
- Request rate (should be normal)
- Success rate (should be > 99.9%)

**Infrastructure Metrics**:

- CPU utilization (should be < 70%)
- Memory utilization (should be < 80%)
- Database connections (should be stable)
- Lambda concurrency (should be normal)

**Business Metrics**:

- User sign-ups (should be normal)
- Content creation (should be normal)
- AI usage (should be normal)
- Payment processing (should be normal)

### Verification Commands

```bash
# Check application health
curl https://bayon-coagent.com/api/health

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=bayon-coagent-production \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Check CloudWatch logs
aws logs tail /aws/lambda/bayon-coagent-production \
  --follow \
  --region us-east-1

# Run smoke tests manually
./scripts/smoke-tests/test-auth.sh
./scripts/smoke-tests/test-database.sh
./scripts/smoke-tests/test-storage.sh
./scripts/smoke-tests/test-ai.sh
```

---

## Escalation Procedures

### When to Escalate

Escalate immediately if:

- Rollback fails to complete
- Rolled-back version also has issues
- Unable to restore service
- Data loss or corruption detected
- Multiple rollback attempts fail

### Escalation Levels

#### Level 1: DevOps Team

**When**: Rollback fails or issues persist
**Action**: Alert #devops Slack channel
**Response Time**: 15 minutes

```
🚨 ROLLBACK ISSUE - LEVEL 1
Environment: production
Issue: Rollback completed but errors persist
Current Version: v1.1.0 (rolled back)
Error Rate: 2.5% (threshold: 1%)
Action: DevOps team investigating
```

#### Level 2: On-Call Engineer

**When**: Level 1 can't resolve in 15 minutes
**Action**: Page on-call engineer via PagerDuty
**Response Time**: 5 minutes

```
🚨 ROLLBACK ISSUE - LEVEL 2
Environment: production
Issue: Unable to restore service after rollback
Current Version: v1.1.0 (rolled back)
Status: Service degraded
Action: On-call engineer paged
Incident: INC-12345
```

#### Level 3: Engineering Leadership

**When**: Level 2 can't resolve in 30 minutes
**Action**: Escalate to Engineering Manager/CTO
**Response Time**: Immediate

```
🚨 ROLLBACK ISSUE - LEVEL 3
Environment: production
Issue: Service outage, rollback failed
Duration: 45 minutes
Impact: All users affected
Action: Engineering leadership engaged
Incident: INC-12345
War Room: https://zoom.us/j/123456789
```

### Failed Rollback Procedures

If rollback fails:

#### Step 1: Assess the Situation

```bash
# Check CloudFormation stack status
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-production \
  --region us-east-1

# Check stack events for errors
aws cloudformation describe-stack-events \
  --stack-name bayon-coagent-production \
  --region us-east-1 \
  --max-items 50

# Check Amplify deployment status
aws amplify get-app \
  --app-id YOUR_APP_ID \
  --region us-east-1
```

#### Step 2: Identify the Blocker

Common rollback failure causes:

- Resource dependencies preventing deletion
- IAM permission issues
- Resource limits exceeded
- Manual changes to infrastructure
- Database migration incompatibility

#### Step 3: Attempt Manual Intervention

**For CloudFormation Issues**:

```bash
# Continue rollback if stuck
aws cloudformation continue-update-rollback \
  --stack-name bayon-coagent-production \
  --region us-east-1

# Skip resources if needed (use with caution)
aws cloudformation continue-update-rollback \
  --stack-name bayon-coagent-production \
  --resources-to-skip ResourceLogicalId \
  --region us-east-1
```

**For Amplify Issues**:

```bash
# Manually trigger previous build
aws amplify start-job \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --job-type RELEASE \
  --region us-east-1
```

#### Step 4: Emergency Procedures

If rollback cannot be completed:

1. **Enable Maintenance Mode**

   - Display maintenance page to users
   - Prevent new requests from reaching broken version

2. **Manual Infrastructure Rollback**

   - Manually revert CloudFormation changes
   - Restore from backups if needed
   - Rebuild infrastructure from scratch if necessary

3. **Database Rollback**

   - Restore DynamoDB tables from backup
   - Verify data integrity
   - Test database connectivity

4. **Frontend Rollback**

   - Manually deploy previous Amplify build
   - Or deploy from local build
   - Verify deployment successful

5. **Verify Service Restoration**
   - Run comprehensive smoke tests
   - Monitor metrics closely
   - Gradually restore traffic

### Emergency Contact Information

**DevOps Team**:

- Slack: #devops
- Email: devops@bayon-coagent.com

**On-Call Engineer**:

- PagerDuty: https://bayon-coagent.pagerduty.com
- Phone: +1-XXX-XXX-XXXX

**Engineering Leadership**:

- Engineering Manager: manager@bayon-coagent.com
- CTO: cto@bayon-coagent.com

---

## Post-Rollback Actions

### Immediate Actions (Within 1 Hour)

1. **Verify Service Stability**

   - Monitor metrics for 30 minutes
   - Ensure no recurring issues
   - Verify user reports are resolved

2. **Update Status Page**

   - Mark incident as resolved
   - Provide brief explanation
   - Apologize for disruption

3. **Notify Stakeholders**

   - Send all-clear notification
   - Provide incident summary
   - Outline next steps

4. **Create Incident Report**
   - Document what happened
   - Record timeline of events
   - Note who was involved
   - Capture all relevant logs and metrics

### Short-Term Actions (Within 24 Hours)

1. **Root Cause Analysis**

   - Investigate what caused the failure
   - Review code changes
   - Check configuration changes
   - Identify contributing factors

2. **Create Hotfix Plan**

   - Determine fix approach
   - Estimate fix timeline
   - Identify testing requirements
   - Plan hotfix deployment

3. **Update Documentation**

   - Document lessons learned
   - Update runbooks if needed
   - Add to troubleshooting guide
   - Share knowledge with team

4. **Communicate with Users**
   - Send incident report to affected users
   - Explain what happened
   - Outline preventive measures
   - Provide timeline for fix

### Long-Term Actions (Within 1 Week)

1. **Post-Mortem Meeting**

   - Schedule blameless post-mortem
   - Review incident timeline
   - Discuss root causes
   - Identify improvements

2. **Implement Preventive Measures**

   - Add additional tests
   - Improve monitoring
   - Enhance deployment process
   - Update approval requirements

3. **Deploy Hotfix**

   - Fix the original issue
   - Test thoroughly
   - Deploy with extra caution
   - Monitor closely

4. **Update Processes**
   - Improve deployment checklist
   - Enhance rollback procedures
   - Update escalation process
   - Train team on lessons learned

### Post-Rollback Checklist

- [ ] Service stability verified (30+ minutes)
- [ ] Status page updated
- [ ] Stakeholders notified
- [ ] Incident report created
- [ ] Root cause identified
- [ ] Hotfix plan created
- [ ] Documentation updated
- [ ] Users communicated with
- [ ] Post-mortem scheduled
- [ ] Preventive measures identified
- [ ] Hotfix deployed
- [ ] Processes updated

---

## Examples and Commands

### Example 1: Automatic Rollback Due to Smoke Test Failure

**Scenario**: Production deployment fails authentication smoke test

**Timeline**:

```
15:00:00 - Deployment to production completes
15:00:30 - Smoke tests start
15:01:15 - Authentication test fails
15:01:16 - Automatic rollback triggered
15:01:20 - Deployment halted
15:01:25 - CloudFormation rollback initiated
15:06:30 - CloudFormation rollback complete
15:06:35 - Amplify rollback initiated
15:10:45 - Amplify rollback complete
15:10:50 - Verification tests start
15:12:30 - Verification tests pass
15:12:35 - Metrics monitoring begins
15:17:35 - Rollback complete
15:17:40 - Team notified
```

**Notification**:

```
✅ AUTOMATIC ROLLBACK SUCCESSFUL
Environment: production
Reason: Smoke test failure (authentication)
Rolled back from: v1.2.0
Rolled back to: v1.1.0
Duration: 16 minutes 40 seconds
Verification: All tests passed ✅
Metrics: All normal ✅
Action Required: Investigate authentication issue in v1.2.0
```

**Next Steps**:

1. Investigate authentication issue
2. Fix the bug
3. Create hotfix v1.2.1
4. Deploy to staging for testing
5. Deploy to production after verification

### Example 2: Manual Rollback Due to Performance Issue

**Scenario**: Performance degradation discovered 2 hours after deployment

**Discovery**:

```
17:30 - Users report slow page loads
17:35 - CloudWatch shows P95 latency at 2000ms (normal: 250ms)
17:40 - Decision made to rollback
```

**Rollback Process**:

```bash
# Trigger manual rollback
gh workflow run rollback.yml \
  -f environment=production \
  -f target_version=v1.1.0

# Monitor rollback
gh run watch --interval 10

# Verify after rollback
curl https://bayon-coagent.com/api/health
./scripts/smoke-tests/test-auth.sh
```

**Verification**:

```
17:45 - Rollback initiated
17:50 - Approval granted
18:05 - Rollback complete
18:10 - Latency back to normal (P95: 245ms)
18:15 - All smoke tests pass
18:20 - Service confirmed stable
```

**Post-Rollback**:

1. Root cause: Inefficient database query in v1.2.0
2. Fix: Optimize query with proper indexes
3. Test: Verify performance in staging
4. Deploy: Hotfix v1.2.1 with optimized query

### Example 3: Failed Rollback Requiring Escalation

**Scenario**: Rollback fails due to CloudFormation stack stuck

**Initial Rollback**:

```
19:00 - Manual rollback triggered
19:05 - CloudFormation rollback initiated
19:20 - CloudFormation stuck in UPDATE_ROLLBACK_IN_PROGRESS
19:30 - Rollback timeout
```

**Escalation**:

```
19:31 - Level 1: DevOps team alerted
19:35 - Investigation: Resource dependency issue
19:40 - Attempted continue-update-rollback
19:45 - Still stuck
19:46 - Level 2: On-call engineer paged
19:50 - Engineer attempts manual intervention
20:00 - Unable to resolve
20:01 - Level 3: Engineering leadership engaged
```

**Resolution**:

```bash
# Manual intervention by engineering leadership
# 1. Identify stuck resource
aws cloudformation describe-stack-resources \
  --stack-name bayon-coagent-production

# 2. Skip problematic resource
aws cloudformation continue-update-rollback \
  --stack-name bayon-coagent-production \
  --resources-to-skip ProblematicResourceLogicalId

# 3. Wait for rollback to complete
aws cloudformation wait stack-rollback-complete \
  --stack-name bayon-coagent-production

# 4. Manually fix skipped resource
# ... manual AWS console operations ...

# 5. Verify service
./scripts/smoke-tests/test-auth.sh
```

**Timeline**:

```
20:15 - CloudFormation rollback complete (with skipped resource)
20:20 - Manual fix of skipped resource
20:30 - Amplify rollback complete
20:35 - Service verified stable
20:40 - Incident resolved
```

**Post-Incident**:

1. Post-mortem scheduled
2. CloudFormation template updated to prevent dependency issue
3. Rollback procedures updated
4. Team trained on manual intervention

### Useful Commands Reference

```bash
# Trigger manual rollback
gh workflow run rollback.yml \
  -f environment=production \
  -f target_version=v1.1.0

# Monitor rollback progress
gh run list --workflow=rollback.yml --limit 5
gh run watch RUN_ID

# Check CloudFormation stack status
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-production \
  --query 'Stacks[0].StackStatus'

# Check stack events
aws cloudformation describe-stack-events \
  --stack-name bayon-coagent-production \
  --max-items 20

# Continue stuck rollback
aws cloudformation continue-update-rollback \
  --stack-name bayon-coagent-production

# Check Amplify deployment
aws amplify list-jobs \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --max-results 5

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=bayon-coagent-production \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# Run smoke tests
./scripts/smoke-tests/test-auth.sh
./scripts/smoke-tests/test-database.sh
./scripts/smoke-tests/test-storage.sh
./scripts/smoke-tests/test-ai.sh

# Check application health
curl https://bayon-coagent.com/api/health

# View CloudWatch logs
aws logs tail /aws/lambda/bayon-coagent-production --follow
```

---

## Related Documentation

- [Pipeline Architecture](./pipeline-architecture.md) - Overall CI/CD architecture
- [Deployment Runbook](./deployment-runbook.md) - Deployment procedures
- [GitHub Setup Guide](./github-setup-guide.md) - Initial setup
- [Cost Monitoring Guide](./cost-monitoring-guide.md) - Cost tracking

---

## Changelog

| Date       | Version | Changes                  |
| ---------- | ------- | ------------------------ |
| 2024-12-04 | 1.0.0   | Initial rollback runbook |

---

## Quick Reference Card

### Automatic Rollback Triggers

- ❌ Smoke test failures
- 🚨 CloudWatch alarm triggers
- ⏱️ Deployment timeouts
- 💔 Health check failures

### Manual Rollback Command

```bash
gh workflow run rollback.yml -f environment=production
```

### Verification After Rollback

```bash
./scripts/smoke-tests/test-auth.sh
curl https://bayon-coagent.com/api/health
```

### Escalation

1. **Level 1**: #devops Slack (15 min)
2. **Level 2**: PagerDuty on-call (5 min)
3. **Level 3**: Engineering leadership (immediate)

### Emergency Contacts

- DevOps: #devops Slack
- On-Call: PagerDuty
- Leadership: manager@bayon-coagent.com
