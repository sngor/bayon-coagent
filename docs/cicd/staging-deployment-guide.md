# Staging Deployment Guide

## Overview

The staging deployment workflow provides a controlled, approval-gated deployment process for release candidates. It includes comprehensive pre-deployment checks, integration testing, and automatic release marking for production readiness.

## Workflow File

`.github/workflows/deploy-staging.yml`

## Triggers

### Automatic Trigger

The workflow automatically triggers when you push a tag matching the `rc-*` pattern:

```bash
# Create a release candidate tag
git tag rc-1.2.0
git push origin rc-1.2.0
```

### Manual Trigger

You can also trigger the workflow manually from the GitHub Actions UI:

1. Go to Actions → Deploy to Staging
2. Click "Run workflow"
3. Select the branch
4. Optionally skip integration tests (emergency deployments only)

## Workflow Stages

### 1. Pre-Deployment Checks

**Purpose**: Validate code quality, tests, and security before deployment

**What it does**:

- Runs ESLint for code quality
- Runs TypeScript type checking
- Runs unit tests with coverage
- Runs security scans (npm audit)
- Generates a deployment checklist

**Duration**: ~5-10 minutes

**Failure handling**: If any check fails, the workflow continues but the checklist will show failures. Reviewers can see the status before approving.

### 2. Approval Gate

**Purpose**: Require manual review before deploying to staging

**What it does**:

- Displays the deployment checklist from pre-deployment checks
- Waits for manual approval from designated reviewers
- Times out after 24 hours if not approved

**Who can approve**:

- Configured in GitHub Environment settings for "staging"
- Typically: DevOps team members, tech leads

**How to approve**:

1. Go to the workflow run in GitHub Actions
2. Review the deployment checklist
3. Click "Review deployments"
4. Select "staging" environment
5. Click "Approve and deploy"

**Timeout**: 24 hours

### 3. Infrastructure Validation

**Purpose**: Validate SAM templates before deployment

**What it does**:

- Validates SAM template syntax
- Runs cfn-lint for CloudFormation best practices
- Generates infrastructure change preview
- Uploads changeset preview as artifact

**Duration**: ~2-3 minutes

### 4. Infrastructure Deployment

**Purpose**: Deploy AWS infrastructure using SAM

**What it does**:

- Deploys SAM stack to staging environment
- Uses staging configuration from samconfig.toml
- Waits for stack to reach stable state
- Captures and stores stack outputs

**Duration**: ~10-15 minutes

**Resources deployed**:

- Cognito User Pool
- DynamoDB Table
- S3 Bucket
- Lambda Functions
- API Gateway
- CloudWatch Log Groups

### 5. Frontend Deployment

**Purpose**: Deploy Next.js application to Amplify

**What it does**:

- Extracts environment variables from stack outputs
- Updates Amplify app configuration
- Triggers Amplify deployment
- Monitors deployment progress
- Captures deployment URL

**Duration**: ~5-10 minutes

**Branch**: `staging`

### 6. Integration Tests

**Purpose**: Run comprehensive end-to-end tests

**What it does**:

- Tests authentication flows (sign-up, sign-in, password reset)
- Tests content creation flows (blog posts, social media, listings)
- Tests OAuth integrations (Google Business Profile)
- Tests AI service integrations (Bedrock)
- Generates test report

**Duration**: ~10-15 minutes

**Can be skipped**: Yes, via manual workflow dispatch (emergency deployments only)

### 7. Mark Release Ready

**Purpose**: Mark the release as ready for production

**What it does**:

- Generates release notes from commits
- Updates or creates GitHub release
- Marks release as pre-release
- Notifies stakeholders via Slack

**Duration**: ~1-2 minutes

### 8. Notifications

**Purpose**: Keep team informed of deployment status

**What it does**:

- Sends Slack notification on deployment success
- Sends Slack notification on deployment failure
- Includes deployment URL, tag, and commit details

## Total Duration

**Typical deployment**: 35-50 minutes

- Pre-deployment checks: 5-10 min
- Approval wait: Variable (up to 24 hours)
- Infrastructure validation: 2-3 min
- Infrastructure deployment: 10-15 min
- Frontend deployment: 5-10 min
- Integration tests: 10-15 min
- Release marking: 1-2 min

## Environment Configuration

### GitHub Environment

The workflow uses a GitHub Environment named "staging" with the following configuration:

**Protection rules**:

- Required reviewers: 1
- Reviewers: DevOps team members
- Deployment branches: Tags matching `rc-*`

**Secrets**:

- `AWS_ACCESS_KEY_ID_STAGING`: AWS access key for staging
- `AWS_SECRET_ACCESS_KEY_STAGING`: AWS secret key for staging

**Variables**:

- `AWS_REGION`: us-west-2
- `ENVIRONMENT`: staging
- `STACK_NAME`: bayon-coagent-staging

### AWS Resources

**CloudFormation Stack**: `bayon-coagent-staging`

**Amplify App**: `bayon-coagent-staging`

- Branch: `staging`
- Domain: `staging.bayoncoagent.com`

## Deployment Checklist

Before approving a staging deployment, verify:

- [ ] All pre-deployment checks passed
- [ ] No high/critical security vulnerabilities
- [ ] Code coverage meets threshold (70%)
- [ ] All unit tests passed
- [ ] Release notes are accurate
- [ ] Breaking changes are documented
- [ ] Database migrations are tested
- [ ] Environment variables are configured

## Troubleshooting

### Pre-Deployment Checks Failed

**Problem**: ESLint, TypeScript, or tests failed

**Solution**:

1. Review the check results in the workflow artifacts
2. Fix the issues in your code
3. Create a new release candidate tag
4. Push the new tag to trigger a new deployment

### Approval Timeout

**Problem**: Deployment not approved within 24 hours

**Solution**:

1. The workflow will automatically cancel
2. Create a new release candidate tag
3. Push the new tag to trigger a new deployment

### Infrastructure Deployment Failed

**Problem**: SAM deployment failed

**Solution**:

1. Check the CloudFormation console for error details
2. Review the changeset preview artifact
3. Fix the infrastructure code
4. Create a new release candidate tag

### Frontend Deployment Failed

**Problem**: Amplify deployment failed

**Solution**:

1. Check the Amplify console for build logs
2. Verify environment variables are correct
3. Check for build errors in the logs
4. Fix the issues and create a new tag

### Integration Tests Failed

**Problem**: One or more integration tests failed

**Solution**:

1. Review the test report artifact
2. Check the staging environment for issues
3. Fix the failing tests or code
4. Create a new release candidate tag

### Amplify App Not Found

**Problem**: Workflow can't find the Amplify app

**Solution**:

1. Verify the Amplify app exists: `bayon-coagent-staging`
2. Verify the staging branch exists in Amplify
3. Run the Amplify setup script if needed
4. Check AWS credentials have Amplify permissions

## Release Process

### 1. Prepare Release Candidate

```bash
# Ensure you're on the develop branch
git checkout develop
git pull origin develop

# Create release candidate tag
git tag rc-1.2.0
git push origin rc-1.2.0
```

### 2. Monitor Deployment

1. Go to GitHub Actions
2. Find the "Deploy to Staging" workflow run
3. Monitor pre-deployment checks
4. Review the deployment checklist

### 3. Approve Deployment

1. Click "Review deployments" in the workflow run
2. Review the checklist
3. Approve the deployment
4. Monitor the deployment progress

### 4. Verify Deployment

1. Visit the staging URL: https://staging.bayoncoagent.com
2. Test critical user flows
3. Verify new features work as expected
4. Check for any errors in CloudWatch logs

### 5. Promote to Production

If staging deployment is successful:

```bash
# Create production tag
git tag v1.2.0
git push origin v1.2.0
```

This will trigger the production deployment workflow.

## Rollback

If issues are discovered after deployment:

### Option 1: Deploy Previous Version

```bash
# Find the previous successful tag
git tag -l "rc-*"

# Deploy the previous version
git push origin rc-1.1.0 --force
```

### Option 2: Manual Rollback

1. Go to CloudFormation console
2. Find the `bayon-coagent-staging` stack
3. Click "Stack actions" → "Roll back"
4. Go to Amplify console
5. Find the previous successful deployment
6. Click "Redeploy this version"

## Monitoring

### CloudWatch Logs

Monitor logs during and after deployment:

```bash
# View Lambda function logs
aws logs tail /aws/lambda/bayon-coagent-staging-function --follow

# View API Gateway logs
aws logs tail /aws/apigateway/bayon-coagent-staging --follow
```

### CloudWatch Metrics

Key metrics to monitor:

- Lambda invocation count and errors
- API Gateway 4xx and 5xx errors
- DynamoDB read/write capacity
- S3 request count

### Amplify Console

Monitor frontend deployment:

1. Go to Amplify console
2. Select `bayon-coagent-staging` app
3. Click on the staging branch
4. View build logs and deployment status

## Best Practices

### Tagging Convention

Use semantic versioning for release candidate tags:

- `rc-1.0.0`: Major release candidate
- `rc-1.1.0`: Minor release candidate
- `rc-1.0.1`: Patch release candidate

### Pre-Deployment Testing

Before creating a release candidate:

1. Run all tests locally: `npm test`
2. Run linting: `npm run lint`
3. Run type checking: `npm run typecheck`
4. Test in development environment first

### Approval Process

Reviewers should verify:

1. All pre-deployment checks passed
2. No security vulnerabilities
3. Release notes are accurate
4. Breaking changes are documented
5. Database migrations are safe

### Integration Testing

After deployment to staging:

1. Test all critical user flows manually
2. Verify OAuth integrations work
3. Test AI features
4. Check for console errors
5. Verify mobile responsiveness

### Communication

- Notify team before creating release candidate
- Share staging URL for testing
- Document any known issues
- Get feedback before promoting to production

## Security Considerations

### Secrets Management

- Never commit secrets to the repository
- Use GitHub Secrets for sensitive values
- Rotate AWS credentials regularly
- Use least-privilege IAM policies

### Access Control

- Limit who can approve staging deployments
- Require code review before merging to develop
- Use branch protection rules
- Enable two-factor authentication

### Compliance

- All deployments are logged and auditable
- Stack outputs are stored as artifacts
- Test reports are retained for 30 days
- Deployment history is tracked in GitHub

## Support

### Getting Help

- Check workflow logs in GitHub Actions
- Review CloudFormation events in AWS console
- Check Amplify build logs
- Contact DevOps team via Slack

### Escalation

For critical issues:

1. Notify DevOps team immediately
2. Consider rolling back
3. Create incident report
4. Schedule post-mortem

## Related Documentation

- [Development Deployment Guide](./development-deployment-guide.md)
- [Production Deployment Guide](./production-deployment-guide.md)
- [Rollback Procedures](./rollback-job-reference.md)
- [Smoke Tests Guide](./smoke-tests-guide.md)
- [Infrastructure Validation Guide](./infrastructure-validation-guide.md)
