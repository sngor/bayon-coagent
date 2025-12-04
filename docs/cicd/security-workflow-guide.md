# Security Workflow Guide

## Overview

The enhanced security workflow provides comprehensive security scanning for the Bayon CoAgent application. It runs automatically on pushes, pull requests, and weekly schedules.

## Workflow File

`.github/workflows/security-scan.yml`

## Jobs

### 1. Dependency Scan

**Purpose**: Scan npm dependencies for known vulnerabilities

**Tools**:

- npm audit (built-in)
- Snyk (requires `SNYK_TOKEN` secret)

**Failure Conditions**:

- High or critical severity vulnerabilities detected

**Outputs**:

- npm audit JSON results
- Snyk scan results
- GitHub issue for tracking
- PR comment with vulnerability summary

### 2. Secrets Scan

**Purpose**: Detect exposed credentials in code and git history

**Tools**:

- TruffleHog OSS
- Custom pattern matching

**Scans For**:

- AWS access keys (AKIA pattern)
- API keys and tokens
- Passwords
- Private keys
- Bearer tokens

**Failure Conditions**:

- Any secrets detected in code or history

**Outputs**:

- Urgent GitHub issue with critical label
- PR comment blocking merge
- Detailed remediation instructions

### 3. SAST Scan (CodeQL)

**Purpose**: Static application security testing for code vulnerabilities

**Languages**:

- JavaScript
- TypeScript

**Query Suites**:

- security-extended
- security-and-quality

**Failure Conditions**:

- Security vulnerabilities found by CodeQL

**Outputs**:

- SARIF reports uploaded to GitHub Security tab
- Detailed findings in Security tab
- Artifact retention for 30 days

### 4. License Compliance

**Purpose**: Ensure dependency licenses are compatible

**Tool**: license-checker

**Checks For**:

- GPL licenses
- AGPL licenses
- Other copyleft licenses

**Failure Conditions**:

- GPL or AGPL licenses detected

**Outputs**:

- License report (JSON and summary)
- GitHub issue for legal review
- PR comment with license conflicts

## Triggers

The workflow runs on:

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: "0 9 * * 1" # Weekly on Mondays at 9am UTC
  workflow_dispatch: # Manual trigger
```

## Required Secrets

### SNYK_TOKEN

**Purpose**: Authenticate with Snyk for dependency scanning

**Setup**:

1. Sign up at https://snyk.io
2. Get your API token from Account Settings
3. Add to GitHub Secrets as `SNYK_TOKEN`

**Scope**: Repository or organization level

## Permissions

The workflow requires these permissions:

```yaml
permissions:
  actions: read # Read workflow artifacts
  contents: read # Read repository code
  security-events: write # Upload SARIF to Security tab
  issues: write # Create issues for findings
  pull-requests: write # Comment on PRs
```

## Artifacts

All jobs upload artifacts for audit trails:

| Artifact                | Job                | Retention | Contents               |
| ----------------------- | ------------------ | --------- | ---------------------- |
| npm-audit-results       | dependency-scan    | 30 days   | npm audit JSON         |
| snyk-results            | dependency-scan    | 30 days   | Snyk scan JSON         |
| codeql-sarif-javascript | sast-scan          | 30 days   | CodeQL SARIF           |
| codeql-sarif-typescript | sast-scan          | 30 days   | CodeQL SARIF           |
| license-report          | license-compliance | 30 days   | License JSON + summary |

## Notifications

### GitHub Issues

Created automatically for:

- High/critical vulnerabilities (label: `security`, `dependencies`)
- Exposed secrets (label: `security`, `critical`, `secrets`)
- License violations (label: `legal`, `dependencies`, `license-compliance`)

### PR Comments

Posted automatically on:

- Security vulnerabilities detected
- Secrets found in PR
- License compliance issues

### Security Tab

CodeQL results are automatically uploaded to the GitHub Security tab for:

- Centralized security findings
- Historical tracking
- Integration with Dependabot

## Handling Failures

### Dependency Vulnerabilities

1. Review the GitHub issue created by the workflow
2. Check npm audit output in workflow logs
3. Update vulnerable packages: `npm update`
4. For breaking changes, review package changelogs
5. Run tests to verify updates
6. Commit and push the fixes

### Secrets Detected

**CRITICAL - Immediate Action Required:**

1. **Rotate credentials immediately**

   - Change all exposed passwords/keys
   - Revoke exposed API tokens
   - Generate new AWS access keys

2. **Remove from git history**

   ```bash
   # Using git-filter-repo (recommended)
   git filter-repo --path-glob '*secret-file*' --invert-paths

   # Or using BFG Repo-Cleaner
   bfg --delete-files secret-file
   ```

3. **Force push cleaned history**

   ```bash
   git push --force-with-lease
   ```

4. **Update all systems**
   - Deploy new credentials to production
   - Update CI/CD secrets
   - Notify security team

### CodeQL Findings

1. Review findings in GitHub Security tab
2. Click on each alert for detailed information
3. Review the code path and vulnerability details
4. Apply recommended fixes
5. Mark as resolved once fixed

### License Violations

1. Review the flagged packages
2. Check if the license is actually problematic for your use case
3. Options:
   - Find alternative packages with compatible licenses
   - Consult with legal team for approval
   - Remove the dependency if not critical
4. Update dependencies and re-run the workflow

## Testing the Workflow

### Test Dependency Scanning

```bash
# Add a package with known vulnerabilities (for testing only)
npm install lodash@4.17.15
git add package.json package-lock.json
git commit -m "test: add vulnerable package"
git push
```

Expected: Workflow fails, issue created, PR blocked

### Test Secrets Scanning

```bash
# Create a test file with a fake secret
echo 'const apiKey = "AKIAIOSFODNN7EXAMPLE";' > test-secret.js
git add test-secret.js
git commit -m "test: add test secret"
git push
```

Expected: Workflow fails immediately, urgent issue created

### Test License Compliance

```bash
# Check current licenses
npx license-checker --summary
```

Expected: No GPL/AGPL licenses in current dependencies

## Maintenance

### Weekly Tasks

- Review security scan results from scheduled runs
- Update dependencies with security patches
- Review and close resolved security issues

### Monthly Tasks

- Review CodeQL findings in Security tab
- Update security query suites if available
- Review license compliance reports

### Quarterly Tasks

- Review and update secret scanning patterns
- Audit GitHub Security settings
- Review and update branch protection rules

## Troubleshooting

### Snyk Token Invalid

**Error**: `Invalid Snyk token`

**Solution**:

1. Verify `SNYK_TOKEN` is set in GitHub Secrets
2. Check token hasn't expired
3. Generate new token from Snyk dashboard
4. Update GitHub Secret

### TruffleHog False Positives

**Error**: TruffleHog detects test data as secrets

**Solution**:

1. Use `--only-verified` flag (already configured)
2. Add patterns to `.trufflehogignore` file
3. Use test data that doesn't match secret patterns

### CodeQL Build Failures

**Error**: CodeQL autobuild fails

**Solution**:

1. Check Node.js version compatibility
2. Ensure dependencies install correctly
3. Review CodeQL logs for specific errors
4. May need custom build steps

### License Checker Errors

**Error**: `license-checker` fails to parse package

**Solution**:

1. Update license-checker: `npm install -g license-checker@latest`
2. Check for malformed package.json in dependencies
3. Review specific package causing issues

## Best Practices

1. **Never commit secrets** - Use environment variables and GitHub Secrets
2. **Review security findings promptly** - Don't let issues accumulate
3. **Keep dependencies updated** - Regular updates reduce vulnerabilities
4. **Test security fixes** - Ensure fixes don't break functionality
5. **Document exceptions** - If a finding is a false positive, document why
6. **Rotate credentials regularly** - Don't wait for a breach
7. **Monitor Security tab** - Check regularly for new findings
8. **Use branch protection** - Require security checks to pass before merge

## Resources

- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Snyk Documentation](https://docs.snyk.io/)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [TruffleHog Documentation](https://github.com/trufflesecurity/trufflehog)
- [npm audit Documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)

## Support

For issues with the security workflow:

1. Check workflow logs in GitHub Actions
2. Review this guide for troubleshooting steps
3. Check GitHub Security tab for detailed findings
4. Contact DevOps team for assistance
