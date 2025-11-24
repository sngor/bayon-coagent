# Pre-Commit Hook Setup

Prevent accidental commits of secrets and API keys with automated pre-commit checks.

## Quick Setup

```bash
# Install Husky (if not already installed)
npm install --save-dev husky

# Initialize Husky
npx husky install

# Make pre-commit hook executable
chmod +x .husky/pre-commit
```

## What Gets Checked

The pre-commit hook runs three checks:

### 1. Security Check (`npm run security:check`)

Scans for:

- Exposed API keys in code
- Real credentials in documentation
- Sensitive files tracked by git
- Missing .gitignore entries

### 2. Linter (`npm run lint`)

Checks code quality and style:

- TypeScript/JavaScript syntax
- Code formatting
- Best practices

### 3. Type Check (`npm run typecheck`)

Validates TypeScript types:

- Type errors
- Missing type definitions
- Type mismatches

## Manual Run

You can run these checks manually anytime:

```bash
# Run all checks
npm run security:check
npm run lint
npm run typecheck

# Or run individually
node scripts/check-secrets.js
```

## Bypassing Checks (Not Recommended)

In rare cases where you need to bypass checks:

```bash
# Skip pre-commit hooks (use with caution!)
git commit --no-verify -m "Your message"
```

**Warning**: Only bypass checks if you're absolutely sure there are no security issues.

## CI/CD Integration

The same checks run automatically in GitHub Actions:

- On every push to `main` or `develop`
- On every pull request
- Weekly security scans

See `.github/workflows/security-scan.yml` for details.

## Troubleshooting

### Hook Not Running

```bash
# Reinstall Husky
rm -rf .husky
npx husky install
chmod +x .husky/pre-commit
```

### False Positives

If the security check flags a false positive:

1. Verify it's actually safe
2. Update the pattern in `scripts/check-secrets.js`
3. Document why it's safe

### Performance Issues

If checks are slow:

```bash
# Run only security check
npm run security:check

# Skip other checks temporarily
git commit --no-verify
```

## Best Practices

1. **Run checks before committing**: Don't wait for the hook
2. **Fix issues immediately**: Don't bypass checks
3. **Keep hooks updated**: Pull latest changes regularly
4. **Review hook output**: Understand what's being checked

## Related Documentation

- [Security Guidelines](../SECURITY.md)
- [GitHub Secrets Setup](./github-secrets-setup.md)
- [Environment Variables](./environment-variables.md)
