# Rollback Job Reference

## Overview

The rollback job automatically reverts failed deployments to the last known good state. It's a critical safety mechanism that ensures the development environment remains stable even when deployments fail.

## When Does Rollback Trigger?

The rollback job runs when:

1. ✅ Infrastructure deployment succeeded
2. ❌ **AND** any of the following failed:
   - Frontend deployment
   - Smoke tests

The rollback job does **NOT** run when:

- Infrastructure validation fails (deployment never started)
- Infrastructure deployment fails (nothing to roll back yet)

## Rollback Process

### Step 1: CloudFormation Stack Rollback

```bash
# 1. Check current stack status
aws cloudformation describe-stacks --stack-name <stack-name>

# 2. If stack is in UPDATE state, cancel the update
aws cloudformation cancel-update-stack --stack-name <stack-name>

# 3. Wait for automatic rollback to complete
aws cloudformation wait stack-rollback-complete --stack-name <stack-name>
```

**What happens:**

- CloudFormation automatically reverts all resource changes
- Resources return to their previous state
- Stack status changes to `UPDATE_ROLLBACK_COMPLETE`

**Time estimate:** 5-15 minutes depending on resources

### Step 2: Amplify Deployment Revert

```bash
# 1. Find the Amplify app
aws amplify list-apps --query "apps[?name=='bayon-coagent-development'].appId"

# 2. Get the previous successful deployment
aws amplify list-jobs --app-id <app-id> --branch-name develop \
  --query 'jobSummaries[?status==`SUCCEED`] | [0].jobId'

# 3. Redeploy the previous version
aws amplify start-job --app-id <app-id> --branch-name develop \
  --job-type RETRY --job-id <previous-job-id>
```

**What happens:**

- Amplify redeploys the last successful build
- Frontend returns to previous working version
- New deployment URL remains the same

**Time estimate:** 3-5 minutes

### Step 3: Notification

```yaml
Slack notification sent with:
- 🚨 Urgent priority
- Deployment details (branch, commit, author)
- Failure reason
- @mentions for DevOps team
```

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Deployment Flow                       │
└─────────────────────────────────────────────────────────┘
                          ↓
              ┌───────────────────────┐
              │  Infrastructure OK?   │
              └───────────────────────┘
                     ↓ YES
              ┌───────────────────────┐
              │    Frontend OK?       │
              └───────────────────────┘
                     ↓ YES
              ┌───────────────────────┐
              │   Smoke Tests OK?     │
              └───────────────────────┘
                     ↓ NO
┌─────────────────────────────────────────────────────────┐
│                    ROLLBACK TRIGGERED                    │
├─────────────────────────────────────────────────────────┤
│  1. Cancel CloudFormation update                        │
│  2. Wait for automatic rollback                         │
│  3. Redeploy previous Amplify build                     │
│  4. Send urgent Slack notification                      │
└─────────────────────────────────────────────────────────┘
```

## Manual Rollback

If automatic rollback fails, you can manually rollback:

### CloudFormation Manual Rollback

```bash
# Option 1: Continue automatic rollback
aws cloudformation continue-update-rollback \
  --stack-name bayon-coagent-development \
  --region us-west-2

# Option 2: Update to previous template
aws cloudformation update-stack \
  --stack-name bayon-coagent-development \
  --template-body file://previous-template.yaml \
  --region us-west-2
```

### Amplify Manual Rollback

```bash
# 1. List recent jobs
aws amplify list-jobs \
  --app-id <app-id> \
  --branch-name develop \
  --max-results 20

# 2. Find a successful job ID
# 3. Redeploy that job
aws amplify start-job \
  --app-id <app-id> \
  --branch-name develop \
  --job-type RETRY \
  --job-id <job-id>
```

## Troubleshooting

### Rollback Fails: "Stack is not in UPDATE state"

**Cause:** Stack is already in a stable state or failed state

**Solution:**

1. Check stack status: `aws cloudformation describe-stacks --stack-name <name>`
2. If in `UPDATE_ROLLBACK_FAILED`, use `continue-update-rollback`
3. If in `UPDATE_COMPLETE`, no rollback needed

### Rollback Fails: "No previous Amplify deployment found"

**Cause:** This is the first deployment or all previous deployments failed

**Solution:**

1. Check Amplify console for deployment history
2. If no successful deployments exist, deploy manually
3. Consider deploying a known-good commit

### Rollback Succeeds but Application Still Broken

**Cause:** Database or S3 state may have changed

**Solution:**

1. Check DynamoDB for data corruption
2. Verify S3 bucket contents
3. May need to restore from backup
4. Consider running data migration scripts

## Monitoring Rollback

### Check Rollback Status

```bash
# CloudFormation status
aws cloudformation describe-stack-events \
  --stack-name bayon-coagent-development \
  --max-items 20

# Amplify status
aws amplify get-job \
  --app-id <app-id> \
  --branch-name develop \
  --job-id <job-id>
```

### Verify Rollback Success

After rollback completes:

1. ✅ Check CloudFormation stack status is `UPDATE_ROLLBACK_COMPLETE`
2. ✅ Check Amplify deployment status is `SUCCEED`
3. ✅ Run smoke tests manually to verify functionality
4. ✅ Check application URL is accessible
5. ✅ Verify Slack notification was sent

## Best Practices

### Before Deployment

- ✅ Ensure previous deployment was successful
- ✅ Test changes locally with LocalStack
- ✅ Review infrastructure changes carefully
- ✅ Have rollback plan ready

### During Rollback

- ✅ Monitor CloudWatch logs for errors
- ✅ Check Slack for rollback notification
- ✅ Verify stack events in AWS console
- ✅ Don't trigger new deployments until rollback completes

### After Rollback

- ✅ Investigate root cause of failure
- ✅ Fix the issue in a new branch
- ✅ Test thoroughly before redeploying
- ✅ Document the incident
- ✅ Update smoke tests if needed

## Related Commands

### Check Deployment History

```bash
# CloudFormation stack history
aws cloudformation describe-stack-events \
  --stack-name bayon-coagent-development \
  --region us-west-2

# Amplify deployment history
aws amplify list-jobs \
  --app-id <app-id> \
  --branch-name develop \
  --region us-west-2
```

### View Rollback Logs

```bash
# GitHub Actions logs
gh run list --workflow=deploy-dev.yml --limit 10
gh run view <run-id> --log

# CloudWatch logs
aws logs tail /aws/cloudformation/bayon-coagent-development \
  --follow \
  --region us-west-2
```

## Emergency Contacts

If rollback fails and manual intervention is needed:

1. **Check Slack**: #devops-alerts channel
2. **Check GitHub**: Workflow run logs
3. **Check AWS Console**: CloudFormation and Amplify
4. **Escalate**: Contact DevOps team lead

## Related Documentation

- [Development Deployment Guide](./development-deployment-guide.md)
- [Smoke Tests Guide](./smoke-tests-guide.md)
- [Task 6.8 Completion Summary](./TASK_6.8_COMPLETION_SUMMARY.md)

---

**Last Updated**: December 3, 2025
