# Task 6.6: Smoke Tests Job Implementation

## Overview

Implemented comprehensive smoke tests job in the development deployment workflow to verify critical functionality after deployment.

## Changes Made

### 1. Updated Smoke Test Scripts for CI/CD

Modified all smoke test scripts to work in automated CI/CD environments:

#### `scripts/smoke-tests/test-auth.sh`

- Changed from interactive input to command-line argument for URL
- Made script fail immediately on errors (exit 1 on print_error)
- Accepts URL as first argument: `./test-auth.sh https://app-url.com`
- Tests authentication endpoints (login, signup, password reset)
- Verifies Cognito configuration in page content

#### `scripts/smoke-tests/test-database.sh`

- Changed from interactive input to command-line/environment variable for environment
- Accepts environment as first argument: `./test-database.sh development`
- Falls back to ENVIRONMENT environment variable
- Tests DynamoDB table existence, status, and operations
- Performs read/write/delete operations to verify connectivity

#### `scripts/smoke-tests/test-storage.sh`

- Changed from interactive input to command-line/environment variable for environment
- Accepts environment as first argument: `./test-storage.sh development`
- Tests S3 bucket access, encryption, and operations
- Performs upload/download/delete operations to verify functionality

#### `scripts/smoke-tests/test-ai.sh`

- Changed from interactive input to command-line/environment variable for region
- Accepts AWS region as first argument: `./test-ai.sh us-west-2`
- Tests Bedrock API access and model availability
- Performs model invocation to verify AI functionality

### 2. Enhanced Workflow Smoke Tests Job

Updated `.github/workflows/deploy-dev.yml` with improved smoke tests job:

#### Added AWS Credentials Configuration

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_DEV }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_DEV }}
    aws-region: ${{ env.AWS_REGION }}
```

#### Improved Test Execution

- Each test now captures exit code properly using `set +e`
- Test output is displayed in workflow logs with `cat <test>.log`
- Tests continue on error to run all tests even if one fails
- Proper parameter passing to each script:
  - Auth test: receives deployment URL
  - Database test: receives environment name
  - Storage test: receives environment name
  - AI test: receives AWS region

#### Enhanced Test Results Reporting

- Creates GitHub Step Summary with test results table
- Shows ✅ Passed or ❌ Failed for each test
- Uploads all test logs as artifacts (30-day retention)
- Fails the job if any test fails, triggering rollback

### 3. Test Results Artifacts

All test results are uploaded as artifacts:

- `auth-test.log` - Authentication test results
- `database-test.log` - Database connectivity test results
- `storage-test.log` - S3 storage test results
- `ai-test.log` - Bedrock AI test results
- Retention: 30 days

## Test Coverage

### Authentication Tests (test-auth.sh)

✅ Login page accessibility (HTTP 200)
✅ Signup page accessibility (HTTP 200)
✅ Password reset page accessibility
✅ Cognito configuration presence

### Database Tests (test-database.sh)

✅ Table existence verification
✅ Table status (ACTIVE)
✅ Billing mode check
✅ Encryption status
✅ Point-in-time recovery (production only)
✅ Write operation
✅ Read operation
✅ Delete operation
✅ GSI status

### Storage Tests (test-storage.sh)

✅ Bucket existence verification
✅ Bucket encryption check
✅ Public access block verification
✅ Versioning status (production only)
✅ CORS configuration
✅ File upload operation
✅ File download operation
✅ File content verification
✅ File deletion operation
✅ Storage metrics

### AI Tests (test-ai.sh)

✅ Bedrock API access
✅ Model availability (Claude 3.5 Sonnet)
✅ Simple model invocation
✅ Content generation test
✅ Token usage tracking
✅ CloudWatch metrics check

## Integration with Deployment Workflow

The smoke tests job:

1. Runs after successful frontend deployment
2. Can be skipped with `skip-tests` input for emergency deployments
3. Requires all tests to pass before marking deployment successful
4. Triggers automatic rollback if any test fails
5. Sends notifications based on test results

## Rollback Behavior

If smoke tests fail:

1. Rollback job is triggered automatically
2. CloudFormation stack is rolled back to previous version
3. Amplify deployment is reverted to previous successful build
4. Urgent Slack notification is sent to DevOps team
5. Deployment is marked as failed

## Usage

### Manual Testing

```bash
# Test authentication
./scripts/smoke-tests/test-auth.sh https://your-app-url.com

# Test database
./scripts/smoke-tests/test-database.sh development

# Test storage
./scripts/smoke-tests/test-storage.sh development

# Test AI
./scripts/smoke-tests/test-ai.sh us-west-2
```

### CI/CD Testing

Tests run automatically on every deployment to development environment. To skip tests in emergency:

```bash
# Trigger workflow with skip-tests option
gh workflow run deploy-dev.yml -f skip-tests=true
```

## Requirements Validated

✅ **Requirement 6.5**: Successful deployments run smoke tests
✅ **Requirement 10.1**: Authentication smoke tests verify user flows
✅ **Requirement 10.2**: Database smoke tests verify DynamoDB connectivity
✅ **Requirement 10.3**: Storage smoke tests verify S3 operations
✅ **Requirement 10.4**: AI smoke tests verify Bedrock integration

## Next Steps

1. Monitor smoke test results in first few deployments
2. Adjust test thresholds if needed
3. Add more comprehensive integration tests in staging workflow
4. Consider adding performance benchmarks to smoke tests
5. Implement similar smoke tests for staging and production workflows

## Notes

- All scripts now exit with proper error codes for CI/CD
- Scripts are idempotent and safe to run multiple times
- Test artifacts are retained for 30 days for debugging
- Manual test suggestions are still included in script output for comprehensive testing
