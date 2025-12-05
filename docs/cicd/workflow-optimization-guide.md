# CI/CD Workflow Optimization Guide

## Table of Contents

1. [Overview](#overview)
2. [Caching Strategy](#caching-strategy)
3. [Parallel Execution](#parallel-execution)
4. [Job Cancellation](#job-cancellation)
5. [Conditional Execution](#conditional-execution)
6. [Build Time Measurement](#build-time-measurement)
7. [Performance Monitoring](#performance-monitoring)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Configuration](#advanced-configuration)

## Overview

The CI/CD pipeline includes five major optimization features designed to improve performance, reduce costs, and enhance developer experience:

1. **Caching Strategy:** Reuse dependencies and build artifacts
2. **Parallel Execution:** Run independent jobs simultaneously
3. **Job Cancellation:** Stop outdated or failed runs
4. **Conditional Execution:** Skip unnecessary jobs
5. **Build Time Measurement:** Track and analyze performance

### Benefits

- **Performance:** 40-60% faster pipeline execution
- **Cost:** 30-40% reduction in GitHub Actions minutes
- **Experience:** Faster feedback, clearer reporting
- **Reliability:** Better resource utilization

## Caching Strategy

### Overview

Caching stores frequently used data to avoid redundant work. The pipeline caches:

- Node modules (dependencies)
- Next.js build artifacts
- Jest test cache
- Coverage reports

### How It Works

```yaml
- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: node_modules
    key: node-modules-${{ runner.os }}-${{ matrix.node-version }}-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      node-modules-${{ runner.os }}-${{ matrix.node-version }}-
```

**Cache Key Components:**

- `runner.os`: Operating system (ubuntu, macos, windows)
- `matrix.node-version`: Node.js version (18, 20, 22)
- `hashFiles('package-lock.json')`: Hash of lock file

**Cache Invalidation:**

- Automatic when package-lock.json changes
- Automatic when source files change (for build cache)
- Fallback to partial matches via restore-keys

### Configuration

**Cache Paths:**

```yaml
node_modules              # Dependencies
.next/cache              # Next.js build cache
.jest-cache              # Jest cache
coverage                 # Coverage reports
```

**Cache Retention:**

- GitHub Actions: 7 days (default)
- Unused caches: Automatically deleted
- Size limit: 10GB per repository

### Best Practices

1. **Always commit package-lock.json:** Required for cache key
2. **Use specific cache keys:** Include all relevant variables
3. **Provide restore-keys:** Enable partial cache hits
4. **Monitor cache hit rates:** Aim for > 80%
5. **Keep cache size reasonable:** Large caches slow down restore

### Monitoring

Check cache effectiveness in job logs:

```
Cache restored from key: node-modules-Linux-20-abc123...
Cache hit: true
```

Or:

```
Cache not found for key: node-modules-Linux-20-xyz789...
Falling back to restore-keys...
Cache restored from key: node-modules-Linux-20-
Cache hit: false (partial)
```

## Parallel Execution

### Overview

Parallel execution runs independent jobs simultaneously to reduce overall pipeline time.

### Parallel Operations

#### 1. Quality Checks

ESLint, TypeScript, and Prettier run in parallel:

```bash
npm run lint &
LINT_PID=$!

npm run typecheck &
TYPECHECK_PID=$!

npx prettier --check "src/**/*.{ts,tsx}" &
FORMAT_PID=$!

# Wait for all and capture exit codes
wait $LINT_PID
LINT_EXIT=$?
# ... etc
```

**Benefit:** 40-60% faster than sequential execution

#### 2. Test Sharding

Tests split across multiple runners:

```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
    shard: [1, 2]
```

This creates 6 parallel test jobs (3 Node versions × 2 shards).

**Benefit:** ~50% faster test execution

#### 3. Matrix Builds

Builds run in parallel across Node versions:

```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
```

**Benefit:** Validates compatibility without sequential overhead

#### 4. Independent Jobs

Jobs with no dependencies run in parallel:

```yaml
jobs:
  quality:
    needs: changes
  test:
    needs: changes
  integration-tests:
    needs: changes
```

All three jobs start simultaneously after `changes` completes.

### Test Sharding Details

**How it works:**

Jest's `--shard` flag splits tests across runners:

```bash
npm run test:coverage -- --shard=1/2  # First half
npm run test:coverage -- --shard=2/2  # Second half
```

**Aggregation:**

The `aggregate-test-results` job merges coverage from all shards:

```bash
find coverage-shards -name "lcov.info" -exec cat {} \; > coverage-merged/lcov.info
```

**Considerations:**

- Tests must be independent (no shared state)
- Shards should be balanced (similar execution time)
- More shards = more overhead (diminishing returns)

### Configuration

**Adjusting shard count:**

```yaml
matrix:
  shard: [1, 2, 3, 4] # 4 shards instead of 2
```

Then update the shard command:

```bash
npm run test:coverage -- --shard=${{ matrix.shard }}/4
```

**Adjusting Node versions:**

```yaml
matrix:
  node-version: [20] # Test only Node 20 for faster feedback
```

## Job Cancellation

### Overview

Job cancellation stops outdated or failed runs to save resources.

### Cancellation Triggers

#### 1. New Commits (Concurrency)

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

**Behavior:**

- New commit pushed → Cancel in-progress run
- Applies per branch (different branches don't cancel each other)
- Immediate cancellation (no grace period)

**Example:**

```
Commit A pushed → Run 1 starts
Commit B pushed → Run 1 cancelled, Run 2 starts
Commit C pushed → Run 2 cancelled, Run 3 starts
```

#### 2. Test Failures

```yaml
- name: Check if tests failed
  if: needs.test.result != 'success'
  run: exit 1
```

**Behavior:**

- Test shard fails → Aggregation detects failure
- Aggregation fails → Remaining jobs cancelled
- Saves resources by not running builds on failed tests

### Benefits

- **Cost savings:** Don't waste minutes on outdated code
- **Faster feedback:** Focus on latest commit
- **Resource efficiency:** Free up runners for other jobs

### Considerations

- **Matrix jobs:** Use `fail-fast: false` to see all failures
- **Debugging:** Cancelled runs don't show full logs
- **Timing:** Very fast commits may cancel before jobs start

## Conditional Execution

### Overview

Conditional execution skips unnecessary jobs based on changed files.

### Change Detection

The `changes` job categorizes changes:

```yaml
filters: |
  code:
    - 'src/**/*.{ts,tsx,js,jsx}'
  docs:
    - 'docs/**'
    - '*.md'
  dependencies:
    - 'package.json'
    - 'package-lock.json'
  config:
    - 'tsconfig.json'
    - 'next.config.ts'
  workflows:
    - '.github/workflows/**'
```

### Conditional Logic

Jobs use conditions to determine if they should run:

```yaml
quality:
  if: |
    needs.changes.outputs.code == 'true' || 
    needs.changes.outputs.config == 'true' || 
    needs.changes.outputs.workflows == 'true' || 
    github.event_name == 'workflow_dispatch'
```

### Execution Matrix

| Change Type  | Quality | Tests | Integration | Build |
| ------------ | ------- | ----- | ----------- | ----- |
| Code only    | ✅      | ✅    | ✅          | ✅    |
| Docs only    | ❌      | ❌    | ❌          | ❌    |
| Dependencies | ❌      | ✅    | ✅          | ✅    |
| Config only  | ✅      | ❌    | ❌          | ✅    |
| Workflows    | ✅      | ❌    | ❌          | ❌    |
| Mixed        | ✅      | ✅    | ✅          | ✅    |

### Benefits

- **Docs PRs:** 80-90% faster (skip all code checks)
- **Config changes:** Skip tests, run quality and build
- **Dependency updates:** Skip quality, run tests and build

### Bypassing Conditions

Use `workflow_dispatch` to force full pipeline:

```bash
gh workflow run ci.yml
```

Or push to main/develop (always runs full pipeline).

## Build Time Measurement

### Overview

Build time measurement tracks performance and identifies regressions.

### Metrics Collected

```json
{
  "node_version": "20",
  "build_time_seconds": 95,
  "timestamp": "2024-12-03T10:30:00Z",
  "commit_sha": "abc123...",
  "branch": "feature/optimization",
  "workflow_run_id": "12345"
}
```

### Performance Thresholds

| Threshold  | Time     | Status |
| ---------- | -------- | ------ |
| Excellent  | < 90s    | 🚀     |
| Good       | 90-120s  | ✅     |
| Acceptable | 120-180s | ⚠️     |
| Slow       | > 180s   | 🐌     |

### Reporting

Build performance report shows:

- Build time per Node version
- Performance status (Excellent/Good/Acceptable/Slow)
- Optimization impact summary
- Trend analysis (after multiple runs)

### Storage

Metrics stored as artifacts for 90 days:

```yaml
- name: Upload build metrics
  uses: actions/upload-artifact@v4
  with:
    name: build-metrics-node-20
    path: build-metrics/
    retention-days: 90
```

### Analysis

Download metrics and analyze trends:

```bash
# Download all metrics
gh run download <run-id> -n build-metrics-node-20

# Analyze with jq
cat build-time-node-20.json | jq '.build_time_seconds'

# Compare over time
for file in metrics/*.json; do
  echo "$(jq -r '.timestamp') - $(jq -r '.build_time_seconds')s" $file
done
```

## Performance Monitoring

### Key Metrics

1. **Cache Hit Rate:** % of runs with cache hit
2. **Build Time:** Average build time per Node version
3. **Test Time:** Average test time with sharding
4. **Pipeline Time:** Total time from start to finish
5. **GitHub Actions Minutes:** Total minutes consumed

### Monitoring Dashboard

Create a dashboard to track:

- Build time trends (line chart)
- Cache hit rates (percentage)
- Job execution times (bar chart)
- Cost trends (line chart)

### Alerts

Set up alerts for:

- Build time > 180s (3 minutes)
- Cache hit rate < 60%
- Test time > 240s (4 minutes)
- Cost increase > 20% week-over-week

### Weekly Review

Review metrics weekly:

1. Check build time trends
2. Analyze cache effectiveness
3. Review test shard balance
4. Identify optimization opportunities
5. Update thresholds if needed

## Troubleshooting

### Cache Issues

**Problem:** Cache not restoring

**Solutions:**

1. Verify package-lock.json is committed
2. Check cache key matches
3. Review cache size (< 10GB limit)
4. Check GitHub Actions cache storage

**Problem:** Cache hit but still slow

**Solutions:**

1. Check what's being cached
2. Verify cache is being used (check logs)
3. Consider caching more artifacts
4. Review cache compression overhead

### Parallel Execution Issues

**Problem:** Tests failing in shards

**Solutions:**

1. Check for test interdependencies
2. Verify test isolation
3. Review shard-specific logs
4. Adjust shard count

**Problem:** Unbalanced shards

**Solutions:**

1. Analyze test execution times
2. Reorganize test files
3. Adjust shard count
4. Use Jest's `--maxWorkers` flag

### Conditional Execution Issues

**Problem:** Jobs not skipping

**Solutions:**

1. Check change detection output
2. Verify file path patterns
3. Review conditional expressions
4. Check for workflow_dispatch trigger

**Problem:** Jobs skipping when they shouldn't

**Solutions:**

1. Review change detection filters
2. Add missing file patterns
3. Check conditional logic
4. Test with different change types

## Advanced Configuration

### Custom Cache Keys

Add more specificity to cache keys:

```yaml
key: node-modules-${{ runner.os }}-${{ matrix.node-version }}-${{ hashFiles('package-lock.json') }}-${{ hashFiles('src/**/*.ts') }}
```

### Dynamic Shard Count

Adjust shards based on test count:

```yaml
strategy:
  matrix:
    shard: ${{ fromJSON(env.SHARD_COUNT) }}
```

### Conditional Sharding

Only shard for large test suites:

```yaml
- name: Determine shard count
  run: |
    TEST_COUNT=$(find src -name "*.test.ts" | wc -l)
    if [ $TEST_COUNT -gt 100 ]; then
      echo "SHARD_COUNT=2" >> $GITHUB_ENV
    else
      echo "SHARD_COUNT=1" >> $GITHUB_ENV
    fi
```

### Custom Performance Thresholds

Adjust thresholds per environment:

```yaml
- name: Check build time
  run: |
    THRESHOLD=120
    if [ "${{ github.ref }}" == "refs/heads/main" ]; then
      THRESHOLD=90
    fi
    if [ $BUILD_TIME -gt $THRESHOLD ]; then
      echo "Build time exceeded threshold"
      exit 1
    fi
```

## Best Practices

### For Developers

1. **Commit frequently:** Smaller commits = faster feedback
2. **Separate concerns:** Docs PRs separate from code PRs
3. **Update dependencies carefully:** Invalidates cache
4. **Monitor build times:** Report regressions
5. **Write isolated tests:** Enable effective sharding

### For Maintainers

1. **Review metrics weekly:** Track performance trends
2. **Adjust cache strategies:** Based on hit rates
3. **Fine-tune test sharding:** Balance shard sizes
4. **Update thresholds:** As codebase grows
5. **Document changes:** Keep team informed
6. **Monitor costs:** Track GitHub Actions minutes
7. **Optimize workflows:** Continuous improvement

## Related Documentation

- [Workflow Optimization Quick Reference](./workflow-optimization-quick-reference.md)
- [CI/CD Pipeline Architecture](./pipeline-architecture.md)
- [Performance Testing Guide](./performance-testing-guide.md)
- [Cost Monitoring Guide](./cost-monitoring-guide.md)

## Support

For issues or questions:

1. Check workflow logs
2. Review this guide
3. Check GitHub Actions documentation
4. Contact DevOps team
