# Staging Deployment Quick Start

## Quick Deploy

```bash
# 1. Create release candidate tag
git tag rc-1.2.0
git push origin rc-1.2.0

# 2. Go to GitHub Actions and approve deployment

# 3. Monitor deployment progress

# 4. Verify at https://staging.bayoncoagent.com
```

## Workflow Stages

1. **Pre-Deployment Checks** (5-10 min)

   - ESLint, TypeScript, Tests, Security

2. **Approval Gate** (manual)

   - Review checklist
   - Approve deployment

3. **Infrastructure** (10-15 min)

   - Deploy SAM stack

4. **Frontend** (5-10 min)

   - Deploy to Amplify

5. **Integration Tests** (10-15 min)

   - Test all critical flows

6. **Mark Release Ready** (1-2 min)
   - Update GitHub release

**Total**: 35-50 minutes (+ approval time)

## Approval Process

1. Go to GitHub Actions
2. Find "Deploy to Staging" workflow
3. Click "Review deployments"
4. Review the checklist:
   - ✅ All checks passed?
   - ✅ No security issues?
   - ✅ Tests passed?
5. Click "Approve and deploy"

## Verification

After deployment:

```bash
# Check staging URL
curl https://staging.bayoncoagent.com

# View logs
aws logs tail /aws/lambda/bayon-coagent-staging-function --follow
```

## Promote to Production

If staging is successful:

```bash
git tag v1.2.0
git push origin v1.2.0
```

## Rollback

If issues found:

```bash
# Deploy previous version
git push origin rc-1.1.0 --force
```

Or use manual rollback:

1. CloudFormation → Roll back stack
2. Amplify → Redeploy previous version

## Common Issues

### Pre-checks failed

- Fix issues in code
- Create new tag
- Push again

### Approval timeout (24h)

- Create new tag
- Push again

### Deployment failed

- Check CloudFormation/Amplify logs
- Fix issues
- Create new tag

### Tests failed

- Review test report
- Fix failing tests
- Create new tag

## Environment

- **URL**: https://staging.bayoncoagent.com
- **Stack**: bayon-coagent-staging
- **Region**: us-west-2
- **Branch**: staging

## Required Secrets

- `AWS_ACCESS_KEY_ID_STAGING`
- `AWS_SECRET_ACCESS_KEY_STAGING`
- `SLACK_WEBHOOK_URL`

## Monitoring

- **CloudWatch**: Monitor Lambda and API Gateway
- **Amplify Console**: View build logs
- **GitHub Actions**: View workflow logs

## Support

- Slack: #devops-alerts
- Docs: [Full Staging Guide](./staging-deployment-guide.md)
