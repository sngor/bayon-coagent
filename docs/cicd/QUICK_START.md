# CI/CD Setup Quick Start

**Time Required**: 30-45 minutes  
**Task**: Set up GitHub repository configuration and secrets

---

## 🚀 3-Step Setup

### Step 1: Gather Your Credentials (5 minutes)

Before you start, collect these items:

- [ ] AWS Access Key ID and Secret for **Development**
- [ ] AWS Access Key ID and Secret for **Staging**
- [ ] AWS Access Key ID and Secret for **Production**
- [ ] Slack Webhook URL (from https://api.slack.com/apps)
- [ ] Snyk API Token (from https://snyk.io → Account Settings)
- [ ] Codecov Token (from https://codecov.io → Add Repository)

### Step 2: Configure GitHub (25-35 minutes)

#### A. Add Secrets (10 minutes)

Go to: **Your Repository** → **Settings** → **Secrets and variables** → **Actions**

Click **New repository secret** and add each of these:

**AWS Development** (3 secrets):

```
AWS_ACCESS_KEY_ID_DEV
AWS_SECRET_ACCESS_KEY_DEV
AWS_REGION_DEV (e.g., us-east-1)
```

**AWS Staging** (3 secrets):

```
AWS_ACCESS_KEY_ID_STAGING
AWS_SECRET_ACCESS_KEY_STAGING
AWS_REGION_STAGING
```

**AWS Production** (3 secrets):

```
AWS_ACCESS_KEY_ID_PROD
AWS_SECRET_ACCESS_KEY_PROD
AWS_REGION_PROD
```

**Notifications** (3 secrets):

```
SLACK_WEBHOOK_URL
SLACK_CHANNEL_DEVOPS (e.g., #devops-alerts)
SLACK_CHANNEL_TEAM (e.g., #team-notifications)
```

**Services** (2 secrets):

```
SNYK_TOKEN
CODECOV_TOKEN
```

#### B. Create Environments (10 minutes)

Go to: **Your Repository** → **Settings** → **Environments**

**Create 3 environments:**

1. **development**

   - Click "New environment"
   - Name: `development`
   - Deployment branches: Select "Selected branches" → Add `develop`
   - No approval required
   - Click "Configure environment"

2. **staging**

   - Click "New environment"
   - Name: `staging`
   - Deployment branches: Select "Protected branches and tags"
   - Enable "Required reviewers" → Add 1 team member
   - Click "Configure environment"

3. **production**
   - Click "New environment"
   - Name: `production`
   - Deployment branches: Select "Protected branches and tags"
   - Enable "Required reviewers" → Add 2 team members
   - Set "Wait timer" to 5 minutes
   - Click "Configure environment"

#### C. Set Branch Protection (5-10 minutes)

Go to: **Your Repository** → **Settings** → **Branches** → **Add rule**

**For `main` branch:**

1. Branch name pattern: `main`
2. Check these boxes:
   - ✅ Require a pull request before merging
   - ✅ Require approvals: **2**
   - ✅ Require status checks to pass before merging
   - ✅ Require conversation resolution before merging
   - ✅ Include administrators
   - ✅ Restrict deletions
3. Click "Create"

**For `develop` branch:**

1. Branch name pattern: `develop`
2. Check these boxes:
   - ✅ Require a pull request before merging
   - ✅ Require approvals: **1**
   - ✅ Require status checks to pass before merging
   - ✅ Require conversation resolution before merging
   - ✅ Include administrators
   - ✅ Restrict deletions
3. Click "Create"

### Step 3: Verify Setup (5-10 minutes)

#### Option A: Use the Verification Script

```bash
./scripts/verify-cicd-setup.sh
```

This will check:

- ✅ All secrets configured
- ✅ All environments created
- ✅ Branch protection enabled

#### Option B: Run GitHub Actions Workflows

```bash
# Test secrets
gh workflow run verify-secrets.yml

# Test environments (requires approvals)
gh workflow run test-environments.yml

# Test Slack notifications
gh workflow run test-slack.yml
```

Or manually trigger from GitHub UI:

- Go to **Actions** tab
- Select workflow from left sidebar
- Click "Run workflow"

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] 11 secrets configured in GitHub
- [ ] 3 environments created (development, staging, production)
- [ ] Branch protection on `main` (2 approvals)
- [ ] Branch protection on `develop` (1 approval)
- [ ] `verify-secrets.yml` workflow passes
- [ ] `test-environments.yml` workflow passes (with approvals)
- [ ] `test-slack.yml` workflow sends messages to Slack

---

## 🎉 You're Done!

If all checks pass, you've successfully completed Task 1!

**Next Steps:**

1. Mark Task 1 as complete in `.kiro/specs/cicd-pipeline-enhancement/tasks.md`
2. Proceed to Task 2: Enhance CI workflow

---

## 📚 Need More Details?

- **Full Guide**: [github-setup-guide.md](github-setup-guide.md)
- **Detailed Checklist**: [setup-checklist.md](setup-checklist.md)
- **Visual Diagrams**: [setup-flow-diagram.md](setup-flow-diagram.md)
- **Troubleshooting**: See [github-setup-guide.md](github-setup-guide.md#troubleshooting)

---

## ❓ Common Questions

**Q: Can I use the same AWS credentials for all environments?**  
A: Not recommended. Use separate credentials with different permissions for security.

**Q: What if I don't have a Slack workspace?**  
A: You can skip Slack setup for now, but you'll need to modify workflows later to remove Slack notifications.

**Q: Can I test without setting up production?**  
A: Yes! Set up development and staging first. Add production when ready.

**Q: What if the verification script fails?**  
A: Check the error messages. Most common issues:

- Secret names don't match exactly (case-sensitive)
- Environments not created
- GitHub CLI not authenticated

**Q: How do I get AWS credentials?**  
A: Contact your AWS administrator or create IAM users with appropriate permissions.

---

## 🆘 Need Help?

1. Check the [Troubleshooting section](github-setup-guide.md#troubleshooting)
2. Review [GitHub Actions docs](https://docs.github.com/en/actions)
3. Contact your DevOps team

---

**Estimated Time**: 30-45 minutes  
**Difficulty**: Easy (mostly clicking through GitHub UI)  
**Prerequisites**: Admin access to GitHub repository, AWS credentials
