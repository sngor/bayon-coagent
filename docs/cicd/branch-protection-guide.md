# Branch Protection Configuration Guide

This guide explains how to configure branch protection rules for the CI/CD pipeline.

## Overview

Branch protection rules ensure that code quality standards are met before changes are merged into protected branches. The CI/CD pipeline requires specific status checks to pass before allowing merges.

## Protected Branches

- **main**: Production branch
- **develop**: Development branch

## Required Status Checks

The following GitHub Actions workflow jobs must pass before merging:

1. **quality**: Code quality checks (ESLint, TypeScript, Prettier)
2. **test**: Unit tests with coverage reporting
3. **integration-tests**: Integration tests with LocalStack
4. **build**: Build verification

## Protection Rules

### Main Branch

- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Require 1 approving review
- ✅ Dismiss stale reviews when new commits are pushed
- ✅ Require conversation resolution before merging
- ✅ Prevent force pushes
- ✅ Prevent branch deletion
- ✅ Enforce for administrators

### Develop Branch

Same rules as main branch.

## Automated Configuration

### Using the Script

We provide a script to automatically configure branch protection rules:

```bash
# Make the script executable
chmod +x scripts/configure-branch-protection.sh

# Run the script (auto-detects repository from git remote)
./scripts/configure-branch-protection.sh

# Or specify repository explicitly
./scripts/configure-branch-protection.sh owner/repo
```

### Prerequisites

1. **GitHub CLI**: Install from https://cli.github.com/
2. **Authentication**: Run `gh auth login` to authenticate
3. **Permissions**: You need admin access to the repository

### What the Script Does

The script uses the GitHub API to:

1. Configure required status checks for both main and develop branches
2. Set up pull request review requirements
3. Enable conversation resolution requirement
4. Prevent force pushes and branch deletion
5. Enforce rules for administrators

## Manual Configuration

If you prefer to configure manually:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Branches**
3. Click **Add rule** or edit existing rule
4. Configure the following:

### Branch Name Pattern

- For main: `main`
- For develop: `develop`

### Protection Settings

**Protect matching branches:**

- ☑️ Require a pull request before merging
  - ☑️ Require approvals: 1
  - ☑️ Dismiss stale pull request approvals when new commits are pushed
- ☑️ Require status checks to pass before merging
  - ☑️ Require branches to be up to date before merging
  - Add status checks:
    - `quality`
    - `test`
    - `integration-tests`
    - `build`
- ☑️ Require conversation resolution before merging
- ☑️ Do not allow bypassing the above settings
- ☑️ Restrict who can push to matching branches (optional)

**Rules applied to everyone including administrators:**

- ☑️ Allow force pushes: **Disabled**
- ☑️ Allow deletions: **Disabled**

## Verifying Configuration

After configuration, verify the rules are active:

1. Create a test branch
2. Make a change and open a pull request
3. Verify that:
   - All status checks appear and must pass
   - Merge button is disabled until checks pass
   - At least 1 approval is required

## Troubleshooting

### Status Checks Not Appearing

If required status checks don't appear:

1. Ensure the CI workflow has run at least once on the branch
2. Check that workflow job names match exactly:
   - `quality` (not "Quality Check")
   - `test` (not "Unit Tests")
   - `integration-tests` (not "Integration Tests")
   - `build` (not "Build Verification")
3. Wait a few minutes for GitHub to register the checks

### Script Fails with Authentication Error

```bash
# Re-authenticate with GitHub CLI
gh auth logout
gh auth login
```

### Script Fails with Permission Error

Ensure you have admin access to the repository:

1. Go to repository **Settings** → **Manage access**
2. Verify you have "Admin" role
3. If not, ask a repository owner to grant admin access

### Merge Button Still Enabled Despite Failing Checks

1. Check if "Do not allow bypassing the above settings" is enabled
2. Verify "Require status checks to pass before merging" is checked
3. Ensure you're not an admin with bypass permissions

## Best Practices

1. **Test First**: Test branch protection on a test repository before applying to production
2. **Gradual Rollout**: Start with develop branch, then apply to main after validation
3. **Document Exceptions**: If you need to bypass protection (emergency), document why
4. **Regular Review**: Review and update protection rules quarterly
5. **Monitor Compliance**: Use GitHub Insights to track protection rule effectiveness

## Emergency Bypass

In rare emergencies, admins can bypass protection rules:

1. Temporarily disable "Do not allow bypassing the above settings"
2. Make the emergency change
3. **Immediately** re-enable the protection
4. Document the bypass in an incident report
5. Create a follow-up PR to properly fix the issue

## Related Documentation

- [CI/CD Pipeline Architecture](./README.md)
- [GitHub Actions Workflows](../../.github/workflows/)
- [Deployment Runbook](./deployment-runbook.md)

## References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub API - Branch Protection](https://docs.github.com/en/rest/branches/branch-protection)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
