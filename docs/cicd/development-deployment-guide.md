# Development Deployment Workflow Guide

## Overview

The development deployment workflow (`deploy-dev.yml`) provides automated deployment to the development environment whenever code is merged to the `develop` branch. This workflow ensures that the latest changes are immediately available for testing while maintaining quality through automated smoke tests.

## Workflow Triggers

### Automatic Trigger

- **Push to `develop` branch**: Automatically deploys when code is merged to the develop branch

### Manual Trigger

- **Workflow Dispatch**: Can be manually triggered from the GitHub Actions UI
  - Option to skip smoke tests for emergency deployments

## Workflow Jobs

### 1. Validate Infrastructure

**Purpose**: Validate SAM templates and infrastructure changes before deployment

**Steps**:

- Validates SAM template syntax
- Runs cfn-lint for CloudFormation best practices
- Generates infrastructure change preview
- Uploads changeset preview as artifact

**Outputs**: Changeset preview artifact

### 2. Deploy Infrastructure

**Purpose**: Deploy AWS infrastructure using SAM

**Steps**:

- Deploys SAM stack to development environment
- Waits for stack to reach stable state
- Captures CloudFormation stack outputs
- Uploads stack outputs as artifact

**Outputs**:

- Stack outputs (Cognito, DynamoDB, S3 details)
- Stack outputs artifact

**Key Resources Deployed**:

- Cognito User Pool and Client
- DynamoDB Table
- S3 Bucket
- IAM Roles and Policies
- CloudWatch Log Groups

### 3. Deploy Frontend

**Purpose**: Deploy Next.js application to AWS Amplify

**Steps**:

- Downloads stack outputs from previous job
- Extracts environment variables from stack outputs
- Finds Amplify app by name
- Updates Amplify environment variables
- Triggers Amplify deployment
- Monitors deployment progress
- Captures deployment URL

**Outputs**: Deployment URL

**Environment Variables Set**:

- `NODE_ENV`: development
- `AWS_REGION`: us-west-2
- `COGNITO_USER_POOL_ID`: From stack outputs
- `COGNITO_CLIENT_ID`: From stack outputs
- `DYNAMODB_TABLE_NAME`: From stack outputs
- `S3_BUCKET_NAME`: From stack outputs
- `BEDROCK_MODEL_ID`: anthropic.claude-3-5-sonnet-20241022-v2:0
- `BEDROCK_REGION`: us-west-2

### 4. Smoke Tests

**Purpose**: Verify critical functionality after deployment

**Steps**:

- Runs authentication smoke test
- Runs database connectivity smoke test
- Runs S3 storage smoke test
- Runs AI service integration smoke test
- Uploads test results as artifacts
- Fails if any test fails (triggers rollback)

**Tests Executed**:

1. **Authentication Test** (`test-auth.sh`)

   - Login page accessibility
   - Signup page accessibility
   - Password reset page
   - Cognito configuration

2. **Database Test** (`test-database.sh`)

   - DynamoDB connectivity
   - Read operations
   - Write operations
   - Query operations

3. **Storage Test** (`test-storage.sh`)

   - S3 connectivity
   - File upload
   - File download
   - Presigned URLs

4. **AI Service Test** (`test-ai.sh`)
   - Bedrock connectivity
   - Model invocation
   - Streaming responses
   - Error handling

**Outputs**: Test result artifacts

### 5. Rollback

**Purpose**: Automatically rollback failed deployments

**Triggers**: Runs if any previous job fails

**Steps**:

- Rolls back CloudFormation stack to previous version
- Reverts Amplify deployment to previous successful build
- Sends urgent notification to DevOps team

**Notifications**: Urgent Slack notification with rollback details

### 6. Notify

**Purpose**: Send deployment status notifications

**Notifications Sent**:

1. **Deployment Started**: Info notification when infrastructure deployment begins
2. **Deployment Success**: Success notification when all tests pass
3. **Deployment Failure**: Error notification when deployment fails

**Notification Details Include**:

- Environment (development)
- Branch name
- Commit SHA and message
- Author
- Deployment URL (on success)
- Failed stage (on failure)
- Workflow run link

## Prerequisites

### GitHub Secrets Required

The following secrets must be configured in your GitHub repository:

1. **AWS Credentials**:

   - `AWS_ACCESS_KEY_ID_DEV`: Development environment AWS access key
   - `AWS_SECRET_ACCESS_KEY_DEV`: Development environment AWS secret key

2. **Notification Services**:
   - `SLACK_WEBHOOK_URL`: Slack webhook URL for notifications
   - `SLACK_DEVOPS_USERS`: Comma-separated Slack user IDs for urgent notifications

### AWS Resources Required

1. **Amplify App**: Must be created before first deployment

   - App name: `bayon-coagent-development`
   - Branch: `develop`
   - Region: `us-west-2`

2. **IAM Permissions**: AWS credentials must have permissions for:
   - CloudFormation (create/update/delete stacks)
   - SAM CLI operations
   - Amplify (deploy, update environment variables)
   - S3 (for SAM artifacts)
   - All services defined in SAM template

### Local Setup

Before the workflow can run successfully:

1. **Create Amplify App**:

   ```bash
   npm run deploy:amplify
   ```

   Follow the prompts to create the development Amplify app.

2. **Configure GitHub Secrets**:

   - Go to repository Settings → Secrets and variables → Actions
   - Add all required secrets listed above

3. **Test SAM Template Locally**:
   ```bash
   npm run sam:validate
   npm run sam:deploy:dev
   ```

## Usage

### Automatic Deployment

Simply merge code to the `develop` branch:

```bash
git checkout develop
git merge feature/my-feature
git push origin develop
```

The workflow will automatically:

1. Validate infrastructure
2. Deploy infrastructure
3. Deploy frontend
4. Run smoke tests
5. Send notifications

### Manual Deployment

1. Go to GitHub Actions tab
2. Select "Deploy to Development" workflow
3. Click "Run workflow"
4. Select branch (usually `develop`)
5. Optionally check "Skip smoke tests" for emergency deployments
6. Click "Run workflow"

### Emergency Deployment (Skip Tests)

For urgent hotfixes that need to bypass smoke tests:

1. Trigger manual workflow
2. Check "Skip smoke tests" option
3. Monitor deployment closely
4. Run smoke tests manually after deployment

**⚠️ Warning**: Only use this for critical emergencies. Skipping tests can lead to broken deployments.

## Monitoring Deployments

### GitHub Actions UI

1. Go to repository → Actions tab
2. Click on the running workflow
3. View real-time logs for each job
4. Check job summaries for test results

### Slack Notifications

All deployment events are sent to your configured Slack channel:

- 🚀 Deployment started
- ✅ Deployment successful (with URL)
- ❌ Deployment failed (with error details)
- 🚨 Rollback triggered (urgent notification)

### AWS Console

**CloudFormation**:

- View stack status: https://console.aws.amazon.com/cloudformation
- Stack name: `bayon-coagent-development`
- Check stack events for deployment progress

**Amplify**:

- View deployment status: https://console.aws.amazon.com/amplify
- App name: `bayon-coagent-development`
- Branch: `develop`

### Artifacts

The workflow uploads several artifacts that can be downloaded:

1. **Changeset Preview** (7 days retention)

   - Infrastructure changes that will be applied
   - Useful for reviewing changes before deployment

2. **Stack Outputs** (30 days retention)

   - CloudFormation stack outputs
   - Contains resource IDs and ARNs
   - Used by frontend deployment

3. **Smoke Test Results** (30 days retention)
   - Detailed logs from each smoke test
   - Useful for debugging test failures

## Troubleshooting

### Deployment Fails at Validation

**Symptoms**: Workflow fails at "Validate Infrastructure" job

**Common Causes**:

- Invalid SAM template syntax
- CloudFormation best practice violations
- Missing required parameters

**Solutions**:

1. Run validation locally:
   ```bash
   npm run sam:validate
   ```
2. Fix template errors
3. Run cfn-lint locally:
   ```bash
   pip install cfn-lint
   cfn-lint template.yaml
   ```

### Infrastructure Deployment Fails

**Symptoms**: Workflow fails at "Deploy Infrastructure" job

**Common Causes**:

- AWS credential issues
- Resource quota limits
- Conflicting resource names
- Missing IAM permissions

**Solutions**:

1. Check AWS credentials are valid
2. Verify IAM permissions
3. Check CloudFormation stack events in AWS Console
4. Review stack outputs for error messages
5. Check AWS service quotas

### Frontend Deployment Fails

**Symptoms**: Workflow fails at "Deploy Frontend" job

**Common Causes**:

- Amplify app not found
- Build errors in Next.js application
- Missing environment variables
- Amplify service role issues

**Solutions**:

1. Verify Amplify app exists:
   ```bash
   aws amplify list-apps --region us-west-2
   ```
2. Check Amplify build logs in AWS Console
3. Verify environment variables are set correctly
4. Test build locally:
   ```bash
   npm run build
   ```

### Smoke Tests Fail

**Symptoms**: Workflow fails at "Smoke Tests" job, triggers rollback

**Common Causes**:

- Application not fully deployed
- Service connectivity issues
- Configuration errors
- Timeout issues

**Solutions**:

1. Download smoke test artifacts from workflow
2. Review test logs for specific failures
3. Test endpoints manually:
   ```bash
   curl https://develop.your-amplify-domain.com
   ```
4. Check AWS service health
5. Verify security groups and network configuration

### Rollback Fails

**Symptoms**: Rollback job fails after deployment failure

**Common Causes**:

- Stack in invalid state
- No previous version to rollback to
- Amplify job history empty

**Solutions**:

1. Check CloudFormation stack status in AWS Console
2. Manually rollback stack if needed:
   ```bash
   aws cloudformation cancel-update-stack --stack-name bayon-coagent-development
   ```
3. Check Amplify deployment history
4. Contact DevOps team for manual intervention

### Notifications Not Received

**Symptoms**: No Slack notifications received

**Common Causes**:

- Invalid Slack webhook URL
- Webhook URL not configured
- Slack workspace permissions

**Solutions**:

1. Verify `SLACK_WEBHOOK_URL` secret is set
2. Test webhook URL manually:
   ```bash
   curl -X POST -H 'Content-Type: application/json' \
     -d '{"text":"Test message"}' \
     YOUR_WEBHOOK_URL
   ```
3. Check Slack app permissions
4. Verify webhook is not disabled

## Best Practices

### Before Merging to Develop

1. **Test Locally**: Always test changes locally first

   ```bash
   npm run dev
   npm run test
   npm run build
   ```

2. **Run Quality Checks**: Ensure code passes quality checks

   ```bash
   npm run lint
   npm run typecheck
   ```

3. **Review Infrastructure Changes**: If SAM template changed, review carefully

   ```bash
   npm run sam:validate
   ```

4. **Update Tests**: Add/update tests for new features

### During Deployment

1. **Monitor Progress**: Watch the workflow in GitHub Actions
2. **Check Slack**: Monitor Slack channel for notifications
3. **Be Available**: Stay available to respond to failures
4. **Review Logs**: Check logs if anything looks suspicious

### After Deployment

1. **Verify Deployment**: Visit the deployment URL and test manually
2. **Check Metrics**: Review CloudWatch metrics for errors
3. **Test Features**: Test new features in development environment
4. **Document Issues**: Document any issues encountered

### Emergency Procedures

If deployment fails and rollback doesn't work:

1. **Stop Further Deployments**: Prevent additional merges to develop
2. **Assess Damage**: Check what's broken
3. **Manual Rollback**: Use AWS Console to manually rollback
4. **Notify Team**: Alert team via Slack
5. **Create Incident**: Document the incident
6. **Fix Forward**: If rollback not possible, fix forward with hotfix

## Performance Optimization

### Deployment Speed

Typical deployment times:

- Validation: 2-3 minutes
- Infrastructure: 5-10 minutes
- Frontend: 10-15 minutes
- Smoke Tests: 3-5 minutes
- **Total**: 20-33 minutes

### Caching

The workflow uses caching for:

- npm dependencies (via setup-node)
- SAM build artifacts (via SAM CLI)
- Amplify build cache (via Amplify service)

### Parallel Execution

Jobs run in sequence due to dependencies:

```
validate → deploy-infrastructure → deploy-frontend → smoke-tests
                                                    ↓
                                                 rollback (if failure)
                                                    ↓
                                                  notify
```

## Security Considerations

### Secrets Management

- Never commit secrets to repository
- Use GitHub Secrets for all sensitive values
- Rotate AWS credentials regularly
- Use least-privilege IAM policies

### Access Control

- Limit who can trigger manual deployments
- Require branch protection on develop
- Enable required status checks
- Require pull request reviews

### Audit Trail

- All deployments logged in GitHub Actions
- CloudFormation tracks all infrastructure changes
- Amplify tracks all frontend deployments
- Slack notifications provide audit trail

## Related Documentation

- [CI/CD Pipeline Overview](./README.md)
- [Infrastructure Validation Guide](./infrastructure-validation-guide.md)
- [Security Workflow Guide](./security-workflow-guide.md)
- [Deployment Runbook](./deployment-runbook.md)
- [Rollback Runbook](./rollback-runbook.md)

## Support

For issues or questions:

1. Check this documentation
2. Review workflow logs in GitHub Actions
3. Check Slack notifications for error details
4. Contact DevOps team
5. Create GitHub issue with details
