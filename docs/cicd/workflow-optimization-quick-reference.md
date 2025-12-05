# CI/CD Workflow Optimization - Quick Reference

## Overview

The CI/CD pipeline includes comprehensive optimization features that improve performance, reduce costs, and enhance developer experience.

## Optimization Features

### 1. Caching Strategy

**What it does:** Caches dependencies and build artifacts to speed up subsequent runs.

**Cached items:**

- `node_modules` - Dependencies (keyed by package-lock.json)
- `.next/cache` - Next.js build cache
- `.jest-cache` - Jest test cache
- `coverage` - Test coverage reports

**Cache invalidation:**

- Automatic when package-lock.json changes
- Automatic when source files change (for build cache)
- Manual via workflow_dispatch

**Expected improvement:** 30-50% faster builds on cache hit

### 2. Parallel Execution

**What it does:** Runs independent jobs and checks simultaneously.

**Parallel operations:**

- Quality checks (ESLint, TypeScript, Prettier) run in parallel
- Tests split across 2 shards × 3 Node versions = 6 parallel jobs
- Builds run in parallel across 3 Node versions
- Quality, test, and integration jobs run in parallel

**Expected improvement:** 40-60% faster quality checks, 50% faster tests

### 3. Job Cancellation

**What it does:** Cancels outdated runs and stops on failure.

**Cancellation triggers:**

- New commit pushed (cancels in-progress run)
- Test failure detected (cancels remaining jobs)

**Benefits:**

- Saves GitHub Actions minutes
- Faster feedback on latest code
- Reduced resource waste

### 4. Conditional Execution

**What it does:** Skips unnecessary jobs based on changed files.

**Conditions:**

- **Docs-only changes:** Skip quality, tests, builds
- **Config-only changes:** Skip tests, builds
- **Code changes:** Run all jobs

**Expected improvement:** 80-90% faster for docs-only changes

### 5. Build Time Measurement

**What it does:** Tracks and reports build performance.

**Metrics tracked:**

- Build time per Node version
- Build time trends over time
- Performance thresholds

**Performance thresholds:**

- 🚀 Excellent: < 90 seconds
- ✅ Good: 90-120 seconds
- ⚠️ Acceptable: 120-180 seconds
- 🐌 Slow: > 180 seconds

## How to Use

### Viewing Optimization Results

1. Go to Actions tab in GitHub
2. Click on a workflow run
3. View "Summary" for optimization report
4. Check individual job logs for details

### Forcing Full Pipeline Run

Use workflow_dispatch to bypass conditional execution:

```bash
# Via GitHub UI
Actions → CI → Run workflow → Run workflow

# Via GitHub CLI
gh workflow run ci.yml
```

### Clearing Cache

Cache is automatically invalidated on dependency changes. To manually clear:

1. Update package-lock.json (e.g., `npm install`)
2. Push changes
3. New cache will be created

### Monitoring Performance

Build metrics are stored as artifacts for 90 days:

1. Go to workflow run
2. Scroll to "Artifacts" section
3. Download "build-metrics-node-20"
4. View JSON file for detailed metrics

## Troubleshooting

### Cache Not Working

**Symptoms:** Build times not improving

**Solutions:**

1. Check cache hit/miss in job logs
2. Verify package-lock.json is committed
3. Check cache key matches
4. Ensure cache size is under 10GB limit

### Tests Failing in Shards

**Symptoms:** Tests pass locally but fail in CI

**Solutions:**

1. Check for test interdependencies
2. Verify test isolation
3. Check for race conditions
4. Review shard-specific logs

### Jobs Not Skipping

**Symptoms:** All jobs run even for docs changes

**Solutions:**

1. Check change detection output
2. Verify file paths in filters
3. Ensure conditional expressions are correct
4. Check for workflow_dispatch trigger

### Build Time Increasing

**Symptoms:** Build times getting slower

**Solutions:**

1. Review build metrics trends
2. Check for new dependencies
3. Verify cache is working
4. Consider increasing cache scope
5. Review bundle size

## Best Practices

### For Developers

1. **Commit frequently:** Smaller commits = faster feedback
2. **Separate docs changes:** Docs-only PRs complete faster
3. **Update dependencies carefully:** Invalidates cache
4. **Monitor build times:** Report regressions

### For Maintainers

1. **Review metrics weekly:** Track performance trends
2. **Adjust cache strategies:** Based on hit rates
3. **Fine-tune test sharding:** Balance shard sizes
4. **Update thresholds:** As codebase grows
5. **Document changes:** Keep team informed

## Performance Targets

### Current Baseline

- **Full pipeline:** ~5-8 minutes (with cache)
- **Docs-only:** ~1-2 minutes
- **Quality checks:** ~2-3 minutes
- **Tests:** ~3-4 minutes (with sharding)
- **Build:** ~2-3 minutes (with cache)

### Optimization Goals

- **Cache hit rate:** > 80%
- **Test shard balance:** ±10% time difference
- **Parallel efficiency:** > 70%
- **Cost reduction:** 30-40% vs baseline

## Related Documentation

- [CI/CD Pipeline Architecture](./pipeline-architecture.md)
- [Deployment Guide](./deployment-guide.md)
- [Performance Testing Guide](./performance-testing-guide.md)
- [Cost Monitoring Guide](./cost-monitoring-guide.md)

## Support

For issues or questions:

1. Check workflow logs
2. Review this guide
3. Check GitHub Actions documentation
4. Contact DevOps team

## Changelog

- **2024-12-03:** Initial implementation of all optimization features
  - Caching strategy
  - Parallel execution
  - Job cancellation
  - Conditional execution
  - Build time measurement
