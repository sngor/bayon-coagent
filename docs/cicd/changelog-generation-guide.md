# Changelog Generation Guide

## Overview

The changelog generation workflow automatically creates release notes and updates the CHANGELOG.md file based on conventional commit messages.

## Workflow Triggers

### Automatic Trigger

The workflow automatically runs when you push a version tag:

```bash
git tag v1.2.0
git push origin v1.2.0
```

### Manual Trigger

You can also manually trigger the workflow from GitHub Actions:

1. Go to Actions → Changelog Generation
2. Click "Run workflow"
3. Enter the tag name (e.g., `v1.2.0`)
4. Optionally skip GitHub release creation

## Conventional Commit Format

The workflow parses commits using the [Conventional Commits](https://www.conventionalcommits.org/) format:

### Commit Types

- **feat**: New features → Appears in "✨ Features" section
- **fix**: Bug fixes → Appears in "🐛 Bug Fixes" section
- **Breaking changes**: Commits with `!` → Appears in "⚠️ Breaking Changes" section
- **Other types**: docs, style, refactor, perf, test, build, ci, chore → Appears in "📝 Other Changes"

### Examples

```bash
# Feature commit
git commit -m "feat: add user authentication"
git commit -m "feat(auth): implement OAuth login"

# Bug fix commit
git commit -m "fix: resolve login redirect issue"
git commit -m "fix(api): handle null response"

# Breaking change commit
git commit -m "feat!: redesign API endpoints"
git commit -m "feat(api)!: change response format"

# Other commits
git commit -m "docs: update README"
git commit -m "refactor: simplify auth logic"
git commit -m "chore: update dependencies"
```

## Workflow Jobs

### 1. Generate Changelog

- Fetches repository history
- Identifies tag and version information
- Determines commit range since last tag

### 2. Categorize Commits

- Parses all commits in the range
- Categorizes by type (features, fixes, breaking, other)
- Extracts commit messages and hashes
- Outputs categorized lists for other jobs

### 3. Create GitHub Release

- Generates formatted release notes
- Creates GitHub release with changelog
- Uploads release notes as artifact
- Skipped if no changes detected

### 4. Update CHANGELOG.md

- Updates CHANGELOG.md with new release entry
- Maintains Keep a Changelog format
- Commits and pushes changes to main branch
- Creates CHANGELOG.md if it doesn't exist

### 5. Bump Version

- Analyzes commits to determine version bump type:
  - **Major**: Breaking changes detected
  - **Minor**: New features added
  - **Patch**: Only bug fixes and improvements
- Calculates next version number
- Displays suggested next version

### 6. Notify

- Sends Slack notification on completion
- Includes release status and details
- Only runs if changes were detected

## Version Bump Logic

The workflow automatically determines the appropriate version bump:

| Commit Type            | Version Bump | Example       |
| ---------------------- | ------------ | ------------- |
| Breaking changes (`!`) | Major        | 1.2.3 → 2.0.0 |
| Features (`feat:`)     | Minor        | 1.2.3 → 1.3.0 |
| Fixes only (`fix:`)    | Patch        | 1.2.3 → 1.2.4 |
| Other only             | Patch        | 1.2.3 → 1.2.4 |

## CHANGELOG.md Format

The workflow maintains a CHANGELOG.md file in Keep a Changelog format:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2024-12-03

### ⚠️ Breaking Changes

- feat(api)!: change response format (abc1234)

### ✨ Features

- add user authentication (def5678)
- implement OAuth login (ghi9012)

### 🐛 Bug Fixes

- resolve login redirect issue (jkl3456)
- handle null response (mno7890)

### 📝 Other Changes

- [docs] update README (pqr1234)
- [refactor] simplify auth logic (stu5678)
```

## GitHub Release Format

The workflow creates GitHub releases with formatted release notes:

```markdown
# Release v1.2.0

**Release Date:** 2024-12-03

## ⚠️ Breaking Changes

- feat(api)!: change response format (abc1234)

## ✨ Features

- add user authentication (def5678)
- implement OAuth login (ghi9012)

## 🐛 Bug Fixes

- resolve login redirect issue (jkl3456)
- handle null response (mno7890)

## 📝 Other Changes

- [docs] update README (pqr1234)
- [refactor] simplify auth logic (stu5678)
```

## Best Practices

### 1. Use Conventional Commits

Always use conventional commit format for better changelog generation:

```bash
# Good
git commit -m "feat: add user profile page"
git commit -m "fix: resolve memory leak in cache"

# Bad
git commit -m "added stuff"
git commit -m "bug fix"
```

### 2. Write Descriptive Messages

Commit messages appear in the changelog, so make them clear:

```bash
# Good
git commit -m "feat: add email verification for new users"
git commit -m "fix: prevent duplicate form submissions"

# Bad
git commit -m "feat: add feature"
git commit -m "fix: fix bug"
```

### 3. Use Scopes for Context

Add scopes to group related changes:

```bash
git commit -m "feat(auth): add password reset flow"
git commit -m "feat(auth): implement 2FA"
git commit -m "fix(api): handle rate limiting"
```

### 4. Mark Breaking Changes

Use `!` to indicate breaking changes:

```bash
git commit -m "feat!: remove deprecated API endpoints"
git commit -m "refactor(api)!: change authentication method"
```

### 5. Tag Releases Properly

Follow semantic versioning for tags:

```bash
# Major release (breaking changes)
git tag v2.0.0

# Minor release (new features)
git tag v1.3.0

# Patch release (bug fixes)
git tag v1.2.1
```

## Troubleshooting

### No Changes Detected

If the workflow reports no changes:

1. Check that commits exist between tags
2. Verify tag was created correctly
3. Ensure commits are in the correct range

### CHANGELOG.md Not Updated

If CHANGELOG.md isn't updated:

1. Check workflow logs for errors
2. Verify GitHub token has write permissions
3. Ensure main/master branch is not protected without bot access

### GitHub Release Not Created

If GitHub release isn't created:

1. Check that `skip_release` input is false
2. Verify GITHUB_TOKEN has release permissions
3. Check for existing release with same tag

### Version Bump Incorrect

If version bump doesn't match expectations:

1. Review commit messages for conventional format
2. Check for breaking change markers (`!`)
3. Verify feature vs fix commit types

## Configuration

### Required Secrets

- `GITHUB_TOKEN`: Automatically provided by GitHub Actions
- `SLACK_WEBHOOK_URL`: (Optional) For Slack notifications

### Required Permissions

The workflow needs these permissions:

```yaml
permissions:
  contents: write # To update CHANGELOG.md
  pull-requests: read # To read PR information
```

## Examples

### Creating a Feature Release

```bash
# Make feature commits
git commit -m "feat: add dark mode support"
git commit -m "feat: add user preferences page"
git commit -m "fix: resolve theme switching bug"

# Create and push tag
git tag v1.3.0
git push origin v1.3.0

# Workflow automatically:
# 1. Generates changelog with features and fixes
# 2. Creates GitHub release v1.3.0
# 3. Updates CHANGELOG.md
# 4. Suggests next version (v1.4.0 for next minor)
```

### Creating a Patch Release

```bash
# Make bug fix commits
git commit -m "fix: resolve login timeout issue"
git commit -m "fix: handle edge case in validation"

# Create and push tag
git tag v1.2.1
git push origin v1.2.1

# Workflow automatically:
# 1. Generates changelog with fixes only
# 2. Creates GitHub release v1.2.1
# 3. Updates CHANGELOG.md
# 4. Suggests next version (v1.2.2 for next patch)
```

### Creating a Breaking Change Release

```bash
# Make breaking change commits
git commit -m "feat!: redesign authentication API"
git commit -m "refactor!: change database schema"
git commit -m "feat: add new endpoints"

# Create and push tag
git tag v2.0.0
git push origin v2.0.0

# Workflow automatically:
# 1. Generates changelog with breaking changes section
# 2. Creates GitHub release v2.0.0
# 3. Updates CHANGELOG.md
# 4. Suggests next version (v3.0.0 for next major)
```

## Integration with Other Workflows

The changelog workflow integrates with other CI/CD workflows:

### Production Deployment

```yaml
# In deploy-production.yml
on:
  push:
    tags:
      - "v*"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # Deployment steps...

  changelog:
    needs: deploy
    uses: ./.github/workflows/changelog.yml
```

### Release Process

1. Merge features to main branch
2. Create release tag: `git tag v1.2.0`
3. Push tag: `git push origin v1.2.0`
4. Changelog workflow runs automatically
5. Production deployment workflow runs
6. Stakeholders receive notifications

## Validation

To validate your commits before creating a release:

```bash
# View commits since last tag
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# Check conventional commit format
git log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"%s" | grep -E "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\(.+\))?:"

# Preview what would be in changelog
git log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"- %s (%h)"
```

## Related Documentation

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [CI/CD Pipeline Overview](./README.md)
