# Admin Platform Testing - Quick Start Guide

## Prerequisites

1. **Start LocalStack**:

   ```bash
   npm run localstack:start
   ```

2. **Initialize Infrastructure**:

   ```bash
   npm run localstack:init
   ```

3. **Verify Setup**:
   ```bash
   npm run verify:setup
   ```

## Running Tests

### All Admin Tests

```bash
npm test -- src/services/admin/__tests__
```

### Specific Test Suites

**Unit Tests** (Individual services):

```bash
npm test -- src/services/admin/__tests__/analytics-service.test.ts
npm test -- src/services/admin/__tests__/user-activity-service.test.ts
npm test -- src/services/admin/__tests__/content-moderation-service.test.ts
npm test -- src/services/admin/__tests__/audit-log-service.test.ts
```

**Integration Tests** (End-to-end flows):

```bash
npm test -- src/services/admin/__tests__/integration.test.ts
```

**Load Tests** (Performance validation):

```bash
npm test -- src/services/admin/__tests__/load-performance.test.ts
```

### Test Options

**Watch Mode** (auto-rerun on changes):

```bash
npm test -- --watch src/services/admin/__tests__
```

**Coverage Report**:

```bash
npm test -- --coverage src/services/admin/__tests__
```

**Verbose Output**:

```bash
npm test -- --verbose src/services/admin/__tests__
```

**Single Test**:

```bash
npm test -- -t "should track events and aggregate metrics correctly"
```

## Manual QA Testing

Follow the comprehensive checklist:

```bash
cat src/services/admin/__tests__/manual-qa-checklist.md
```

### Key Areas to Test Manually:

1. **Access Control** - Verify role-based permissions
2. **Analytics Dashboard** - Check metrics display
3. **User Activity** - Test activity tracking
4. **Content Moderation** - Verify moderation workflow
5. **Support Tickets** - Test ticket management
6. **System Health** - Check monitoring
7. **Configuration** - Test feature flags
8. **Mobile** - Test on mobile devices
9. **Browsers** - Test on Chrome, Firefox, Safari, Edge

## Performance Targets

Verify these targets are met:

| Endpoint            | Target      |
| ------------------- | ----------- |
| Analytics Dashboard | < 2 seconds |
| User Activity Page  | < 1 second  |
| Support Ticket List | < 1 second  |
| System Health       | < 500ms     |
| Feature Flag Update | < 500ms     |

## Test Data

### Unit Tests

- Minimal test data
- Mocked services
- Fast execution

### Integration Tests

- Realistic test data
- Actual AWS services (LocalStack)
- Complete workflows

### Load Tests

- 1,000 users
- 10,000 analytics events
- 500 support tickets
- Production-scale data

## Troubleshooting

### Tests Timeout

```bash
# Increase timeout in test file
jest.setTimeout(30000);
```

### LocalStack Not Running

```bash
# Check status
docker ps | grep localstack

# Restart if needed
npm run localstack:stop
npm run localstack:start
```

### DynamoDB Errors

```bash
# Reinitialize tables
npm run localstack:init
```

### Cache Issues

```bash
# Clear Jest cache
npm test -- --clearCache
```

## CI/CD Integration

Tests run automatically on:

- Every pull request
- Every commit to main
- Nightly builds (includes load tests)

## Quick Checklist

Before deploying:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Load tests meet performance targets
- [ ] Manual QA checklist completed
- [ ] Code coverage > 80%
- [ ] No security vulnerabilities
- [ ] Documentation updated

## Resources

- **Full Testing Guide**: `src/services/admin/__tests__/README.md`
- **Manual QA Checklist**: `src/services/admin/__tests__/manual-qa-checklist.md`
- **Testing Summary**: `docs/admin/TESTING_SUMMARY.md`
- **Admin User Guide**: `docs/admin/ADMIN_USER_GUIDE.md`
- **API Documentation**: `docs/admin/API_DOCUMENTATION.md`

## Getting Help

If tests fail:

1. Check error message
2. Verify LocalStack is running
3. Check environment variables
4. Review test logs
5. Consult troubleshooting section
6. Ask for help with specific error details

---

**Quick Commands**:

```bash
# Full test suite
npm test -- src/services/admin/__tests__

# Watch mode
npm test -- --watch src/services/admin/__tests__

# Coverage
npm test -- --coverage src/services/admin/__tests__

# Single test file
npm test -- src/services/admin/__tests__/integration.test.ts
```
