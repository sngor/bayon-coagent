# Changelog Generation - Quick Reference

## Quick Start

```bash
# 1. Make commits using conventional format
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"

# 2. Create and push version tag
git tag v1.2.0
git push origin v1.2.0

# 3. Workflow runs automatically
# - Generates changelog
# - Creates GitHub release
# - Updates CHANGELOG.md
```

## Conventional Commit Format

```
<type>[optional scope][optional !]: <description>

[optional body]

[optional footer(s)]
```

### Common Types

| Type       | Description      | Changelog Section   | Version Bump |
| ---------- | ---------------- | ------------------- | ------------ |
| `feat`     | New feature      | ✨ Features         | Minor        |
| `fix`      | Bug fix          | 🐛 Bug Fixes        | Patch        |
| `feat!`    | Breaking change  | ⚠️ Breaking Changes | Major        |
| `fix!`     | Breaking fix     | ⚠️ Breaking Changes | Major        |
| `docs`     | Documentation    | 📝 Other Changes    | Patch        |
| `style`    | Code style       | 📝 Other Changes    | Patch        |
| `refactor` | Code refactoring | 📝 Other Changes    | Patch        |
| `perf`     | Performance      | 📝 Other Changes    | Patch        |
| `test`     | Tests            | 📝 Other Changes    | Patch        |
| `build`    | Build system     | 📝 Other Changes    | Patch        |
| `ci`       | CI/CD            | 📝 Other Changes    | Patch        |
| `chore`    | Maintenance      | 📝 Other Changes    | Patch        |

## Examples

### Feature Commit

```bash
git commit -m "feat: add user authentication"
git commit -m "feat(auth): implement OAuth login"
```

### Bug Fix Commit

```bash
git commit -m "fix: resolve login redirect issue"
git commit -m "fix(api): handle null response"
```

### Breaking Change Commit

```bash
git commit -m "feat!: redesign API endpoints"
git commit -m "refactor(api)!: change response format"
```

### Documentation Commit

```bash
git commit -m "docs: update README with new features"
git commit -m "docs(api): add endpoint documentation"
```

## Version Bumping

| Current | Breaking | Features | Fixes Only | Next Version |
| ------- | -------- | -------- | ---------- | ------------ |
| v1.2.3  | Yes      | -        | -          | v2.0.0       |
| v1.2.3  | No       | Yes      | -          | v1.3.0       |
| v1.2.3  | No       | No       | Yes        | v1.2.4       |

## Workflow Triggers

### Automatic (Recommended)

```bash
git tag v1.2.0
git push origin v1.2.0
```

### Manual

1. Go to GitHub Actions
2. Select "Changelog Generation"
3. Click "Run workflow"
4. Enter tag name (e.g., `v1.2.0`)

## Output Files

| File             | Description       | Location             |
| ---------------- | ----------------- | -------------------- |
| CHANGELOG.md     | Updated changelog | Repository root      |
| release-notes.md | Release notes     | Workflow artifact    |
| GitHub Release   | Published release | GitHub Releases page |

## Workflow Jobs

1. **generate-changelog**: Get tag and version info
2. **categorize-commits**: Parse and categorize commits
3. **create-release**: Create GitHub release
4. **update-changelog-file**: Update CHANGELOG.md
5. **bump-version**: Calculate next version
6. **notify**: Send notifications

## Common Commands

### View Commits Since Last Tag

```bash
git log $(git describe --tags --abbrev=0)..HEAD --oneline
```

### Check Conventional Format

```bash
git log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"%s" | \
  grep -E "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\(.+\))?:"
```

### Preview Changelog

```bash
git log $(git describe --tags --abbrev=0)..HEAD --pretty=format:"- %s (%h)"
```

### List All Tags

```bash
git tag -l
```

### Delete Tag (if needed)

```bash
# Local
git tag -d v1.2.0

# Remote
git push origin :refs/tags/v1.2.0
```

## Troubleshooting

| Issue                    | Solution                            |
| ------------------------ | ----------------------------------- |
| No changes detected      | Check commits exist between tags    |
| CHANGELOG.md not updated | Verify GitHub token permissions     |
| Release not created      | Check `skip_release` input is false |
| Wrong version bump       | Review commit message format        |

## Best Practices

✅ **DO:**

- Use conventional commit format
- Write descriptive commit messages
- Add scopes for context
- Mark breaking changes with `!`
- Follow semantic versioning

❌ **DON'T:**

- Use vague commit messages
- Mix multiple changes in one commit
- Forget to push tags
- Create tags without commits
- Skip conventional format

## Notification

Slack notifications include:

- Release tag
- Status (success/failure)
- Details and links

Configure with `SLACK_WEBHOOK_URL` secret.

## Related Workflows

- **deploy-production.yml**: Triggered by same tags
- **deploy-staging.yml**: Triggered by rc-\* tags
- **performance.yml**: Runs after deployments

## Quick Links

- [Full Documentation](./changelog-generation-guide.md)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
