# Development Deployment - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Configure GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions

Add these secrets:

```
AWS_ACCESS_KEY_ID_DEV          = <your-dev-aws-access-key>
AWS_SECRET_ACCESS_KEY_DEV      = <your-dev-aws-secret-key>
SLACK_WEBHOOK_URL              = <your-slack-webhook-url>
SLACK_DEVOPS_USERS             = <comma-separated-slack-user-ids>
```

### Step 2: Create Amplify App

```bash
npm run deploy:amplify
```

Follow the prompts:

- Select environment: **development**
- Enter AWS region: **us-west-2**
- Enter repository URL: **your-github-repo-url**
- Enter branch name: **develop**

### Step 3: Test Deployment

```bash
# Create a test commit
git checkout develop
echo "# Test" >> README.md
git add README.md
git commit -m "test: trigger deployment"
git push origin develop
```

### Step 4: Monitor Deployment

1. Go to GitHub Actions tab
2. Watch "Deploy to Development" workflow
3. Check Slack for notifications
4. Visit deployment URL when complete

## 📋 Daily Usage

### Automatic Deployment

Just merge to develop:

```bash
git checkout develop
git merge feature/my-feature
git push origin develop
```

### Manual Deployment

1. GitHub Actions → "Deploy to Development"
2. Click "Run workflow"
3. Select branch: **develop**
4. Click "Run workflow"

## 🔍 Monitoring

### GitHub Actions

- Real-time logs
- Test results
- Artifacts

### Slack

- 🚀 Deployment started
- ✅ Deployment success
- ❌ Deployment failed
- 🚨 Rollback triggered

### AWS Console

- CloudFormation: Stack status
- Amplify: Build progress

## ⚡ Typical Timeline

- Validation: 2-3 min
- Infrastructure: 5-10 min
- Frontend: 10-15 min
- Smoke Tests: 3-5 min
- **Total: 20-33 min**

## 🆘 Quick Troubleshooting

### Deployment Fails?

1. Check workflow logs in GitHub Actions
2. Review error message in Slack
3. Download artifacts for details
4. Check AWS Console for stack events

### Rollback Triggered?

1. Check which smoke test failed
2. Download test artifacts
3. Fix the issue
4. Push fix to develop

### Need Emergency Deploy?

1. Manual workflow trigger
2. Check "Skip smoke tests"
3. Monitor closely
4. Run tests manually after

## 📚 Full Documentation

For detailed information, see:

- [Development Deployment Guide](./development-deployment-guide.md)
- [CI/CD Pipeline Overview](./README.md)
- [Troubleshooting Guide](./development-deployment-guide.md#troubleshooting)

## ✅ Success Checklist

- [ ] GitHub secrets configured
- [ ] Amplify app created
- [ ] First deployment successful
- [ ] Slack notifications working
- [ ] Smoke tests passing
- [ ] Team notified of new workflow

## 🎯 Next Steps

1. Test the workflow with a real feature
2. Monitor first few deployments closely
3. Document any issues encountered
4. Set up staging deployment (Task 7)
5. Configure production deployment (Task 10)
