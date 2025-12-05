# Admin Platform Management - Testing Guide

This directory contains comprehensive tests for the admin platform management system.

## Test Types

### 1. Unit Tests

Individual service tests that verify specific functions work correctly:

- `analytics-service.test.ts` - Analytics tracking and metrics
- `user-activity-service.test.ts` - User activity tracking
- `content-moderation-service.test.ts` - Content moderation
- `audit-log-service.test.ts` - Audit logging
- `announcement-service.test.ts` - Announcements
- `cache-service.test.ts` - Caching functionality
- `infrastructure.test.ts` - Infrastructure setup

### 2. Integration Tests

End-to-end tests that verify complete workflows:

- `integration.test.ts` - All admin flows working together

### 3. Load & Performance Tests

Tests that verify the system can handle production-scale data:

- `load-performance.test.ts` - Load testing and performance validation

### 4. Manual QA Checklist

Comprehensive manual testing checklist:

- `manual-qa-checklist.md` - Step-by-step testing guide

## Running Tests

### Run All Tests

```bash
npm test -- src/services/admin/__tests__
```

### Run Specific Test Suite

```bash
# Unit tests only
npm test -- src/services/admin/__tests__/analytics-service.test.ts

# Integration tests
npm test -- src/services/admin/__tests__/integration.test.ts

# Load tests
npm test -- src/services/admin/__tests__/load-performance.test.ts
```

### Run Tests in Watch Mode

```bash
npm test -- --watch src/services/admin/__tests__
```

### Run Tests with Coverage

```bash
npm test -- --coverage src/services/admin/__tests__
```

## Test Environment Setup

### Prerequisites

1. **LocalStack** must be running:

   ```bash
   npm run localstack:start
   ```

2. **Initialize infrastructure**:

   ```bash
   npm run localstack:init
   ```

3. **Verify setup**:
   ```bash
   npm run verify:setup
   ```

### Environment Variables

Ensure `.env.local` has:

```env
USE_LOCAL_AWS=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
DYNAMODB_ENDPOINT=http://localhost:4566
S3_ENDPOINT=http://localhost:4566
```

## Performance Targets

The system must meet these performance targets:

| Endpoint                | Target      | Description             |
| ----------------------- | ----------- | ----------------------- |
| Analytics Dashboard     | < 2 seconds | Load platform metrics   |
| User Activity Page      | < 1 second  | Load user activity list |
| Support Ticket List     | < 1 second  | Load support tickets    |
| System Health Dashboard | < 500ms     | Load health metrics     |
| Feature Flag Update     | < 500ms     | Update feature flag     |

## Test Data

### Unit Tests

- Use minimal test data
- Mock external services
- Focus on logic verification

### Integration Tests

- Use realistic test data
- Test actual AWS services (LocalStack)
- Verify end-to-end flows

### Load Tests

- Generate large datasets:
  - 1,000 users
  - 10,000 analytics events
  - 500 support tickets
- Test with production-scale data
- Verify performance targets

## Manual QA Testing

Follow the comprehensive checklist in `manual-qa-checklist.md`:

1. **Access Control** - Verify role-based permissions
2. **Feature Functionality** - Test all admin features
3. **Error Handling** - Verify error scenarios
4. **Mobile Responsiveness** - Test on mobile devices
5. **Performance** - Verify page load times
6. **Security** - Test authentication and authorization
7. **Browser Compatibility** - Test on all browsers
8. **Accessibility** - Verify keyboard navigation and screen readers

## Test Results

### Expected Coverage

- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: All critical flows covered
- **Load Tests**: All performance targets met
- **Manual QA**: All checklist items passed

### Reporting Issues

When tests fail:

1. Check LocalStack is running
2. Verify environment variables
3. Check test data setup
4. Review error logs
5. Report issues with:
   - Test name
   - Error message
   - Steps to reproduce
   - Expected vs actual behavior

## Continuous Integration

Tests run automatically on:

- Every pull request
- Every commit to main branch
- Nightly builds

### CI Pipeline

1. Setup LocalStack
2. Initialize infrastructure
3. Run unit tests
4. Run integration tests
5. Run load tests (nightly only)
6. Generate coverage report
7. Report results

## Troubleshooting

### Common Issues

**Tests timeout**

- Increase Jest timeout: `jest.setTimeout(30000)`
- Check LocalStack is running
- Verify network connectivity

**DynamoDB errors**

- Ensure tables are created
- Check table names match
- Verify GSI configuration

**Cache issues**

- Clear cache between tests
- Use unique cache keys
- Verify TTL settings

**Performance tests fail**

- Check system resources
- Verify no other processes running
- Run tests individually
- Increase performance targets if needed

### Debug Mode

Run tests with debug output:

```bash
DEBUG=* npm test -- src/services/admin/__tests__
```

## Best Practices

### Writing Tests

1. **Arrange-Act-Assert** pattern
2. **Descriptive test names**
3. **One assertion per test** (when possible)
4. **Clean up test data**
5. **Use beforeEach/afterEach** for setup/teardown
6. **Mock external dependencies**
7. **Test edge cases**

### Test Organization

1. **Group related tests** with describe blocks
2. **Use meaningful descriptions**
3. **Keep tests independent**
4. **Avoid test interdependencies**
5. **Use test fixtures** for common data

### Performance Testing

1. **Seed realistic data**
2. **Measure actual times**
3. **Compare against targets**
4. **Test concurrent operations**
5. **Verify cache effectiveness**
6. **Clean up after tests**

## Contributing

When adding new features:

1. Write unit tests first (TDD)
2. Add integration tests for workflows
3. Update manual QA checklist
4. Add load tests if needed
5. Update this README
6. Ensure all tests pass
7. Verify coverage meets targets

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [LocalStack Documentation](https://docs.localstack.cloud/)
- [AWS SDK Testing](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/testing.html)
