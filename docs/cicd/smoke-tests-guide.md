# Smoke Tests Guide

## Overview

Smoke tests are automated tests that verify critical functionality after deployment. They run automatically as part of the CI/CD pipeline and can also be run manually for troubleshooting.

## Available Tests

### 1. Authentication Test (`test-auth.sh`)

Tests authentication endpoints and user flows.

**Usage:**

```bash
./scripts/smoke-tests/test-auth.sh <app-url>
```

**Example:**

```bash
./scripts/smoke-tests/test-auth.sh https://develop.d1234567890.amplifyapp.com
```

**What it tests:**

- Login page accessibility (HTTP 200)
- Signup page accessibility (HTTP 200)
- Password reset page accessibility
- Cognito configuration presence in page

**Exit codes:**

- `0` - All tests passed
- `1` - One or more tests failed

---

### 2. Database Test (`test-database.sh`)

Tests DynamoDB connectivity and basic operations.

**Usage:**

```bash
./scripts/smoke-tests/test-database.sh <environment>
```

**Example:**

```bash
./scripts/smoke-tests/test-database.sh development
```

**What it tests:**

- Table existence (BayonCoAgent-{environment})
- Table status (ACTIVE)
- Billing mode
- Encryption status
- Point-in-time recovery (production only)
- Write operation
- Read operation
- Delete operation
- GSI status

**Prerequisites:**

- AWS CLI configured with credentials
- IAM permissions for DynamoDB operations

**Exit codes:**

- `0` - All tests passed
- `1` - One or more tests failed

---

### 3. Storage Test (`test-storage.sh`)

Tests S3 bucket access and file operations.

**Usage:**

```bash
./scripts/smoke-tests/test-storage.sh <environment>
```

**Example:**

```bash
./scripts/smoke-tests/test-storage.sh development
```

**What it tests:**

- Bucket existence (bayon-coagent-storage-{environment}-{account-id})
- Bucket encryption
- Public access block
- Versioning (production only)
- CORS configuration
- File upload
- File download
- File content verification
- File deletion
- Storage metrics

**Prerequisites:**

- AWS CLI configured with credentials
- IAM permissions for S3 operations

**Exit codes:**

- `0` - All tests passed
- `1` - One or more tests failed

---

### 4. AI Service Test (`test-ai.sh`)

Tests AWS Bedrock AI integration and model invocation.

**Usage:**

```bash
./scripts/smoke-tests/test-ai.sh <aws-region>
```

**Example:**

```bash
./scripts/smoke-tests/test-ai.sh us-west-2
```

**What it tests:**

- Bedrock API access
- Model availability (Claude 3.5 Sonnet)
- Simple model invocation
- Content generation
- Token usage tracking
- CloudWatch metrics

**Prerequisites:**

- AWS CLI configured with credentials
- IAM permissions for Bedrock operations
- Bedrock model access enabled
- `jq` installed (optional, for parsing responses)

**Exit codes:**

- `0` - All tests passed
- `1` - One or more tests failed

---

## Running Tests Manually

### Prerequisites

1. **AWS CLI installed and configured:**

   ```bash
   aws --version
   aws configure
   ```

2. **Proper IAM permissions:**

   - DynamoDB: `dynamodb:DescribeTable`, `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:DeleteItem`
   - S3: `s3:ListBucket`, `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`
   - Bedrock: `bedrock:InvokeModel`, `bedrock:ListFoundationModels`

3. **Scripts are executable:**
   ```bash
   chmod +x scripts/smoke-tests/*.sh
   ```

### Running All Tests

```bash
# Set environment variables
export ENVIRONMENT=development
export AWS_REGION=us-west-2
export APP_URL=https://develop.d1234567890.amplifyapp.com

# Run all tests
./scripts/smoke-tests/test-auth.sh "$APP_URL"
./scripts/smoke-tests/test-database.sh "$ENVIRONMENT"
./scripts/smoke-tests/test-storage.sh "$ENVIRONMENT"
./scripts/smoke-tests/test-ai.sh "$AWS_REGION"
```

### Running Individual Tests

```bash
# Test authentication only
./scripts/smoke-tests/test-auth.sh https://your-app-url.com

# Test database only
./scripts/smoke-tests/test-database.sh development

# Test storage only
./scripts/smoke-tests/test-storage.sh development

# Test AI only
./scripts/smoke-tests/test-ai.sh us-west-2
```

---

## CI/CD Integration

### Automatic Execution

Smoke tests run automatically in the CI/CD pipeline:

1. **Development deployments** - After every merge to `develop` branch
2. **Staging deployments** - After approval and deployment to staging
3. **Production deployments** - After approval and deployment to production

### Workflow Behavior

```yaml
# Smoke tests job runs after frontend deployment
smoke-tests:
  needs: deploy-frontend
  if: ${{ !inputs.skip-tests }}
```

**What happens:**

1. All four smoke tests run in sequence
2. Each test logs output to a file
3. Test results are uploaded as artifacts (30-day retention)
4. A summary table is added to the workflow run
5. If any test fails, the deployment is marked as failed
6. Automatic rollback is triggered on failure

### Skipping Tests (Emergency Only)

For emergency deployments, you can skip smoke tests:

```bash
# Via GitHub CLI
gh workflow run deploy-dev.yml -f skip-tests=true

# Via GitHub UI
# Go to Actions → Deploy to Development → Run workflow
# Check "Skip smoke tests" option
```

⚠️ **Warning:** Only skip tests in true emergencies. Skipping tests bypasses critical safety checks.

---

## Interpreting Results

### Success Output

```
ℹ Testing authentication at: https://app-url.com

ℹ Test 1: Login page loads
✓ Login page accessible

ℹ Test 2: Signup page loads
✓ Signup page accessible

ℹ Test 3: Password reset page loads
✓ Password reset page accessible

ℹ Test 4: Checking Cognito configuration
✓ Cognito configuration found in page

✓ Authentication smoke test complete!
```

### Failure Output

```
ℹ Testing authentication at: https://app-url.com

ℹ Test 1: Login page loads
✗ Login page returned: 404
```

The script exits immediately with code 1 on first failure.

### GitHub Actions Summary

After tests run, a summary table appears in the workflow:

| Test           | Status    |
| -------------- | --------- |
| Authentication | ✅ Passed |
| Database       | ✅ Passed |
| Storage        | ✅ Passed |
| AI Service     | ❌ Failed |

---

## Troubleshooting

### Common Issues

#### 1. AWS CLI Not Found

```
✗ AWS CLI not installed
```

**Solution:** Install AWS CLI

```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

#### 2. Permission Denied

```
bash: ./scripts/smoke-tests/test-auth.sh: Permission denied
```

**Solution:** Make scripts executable

```bash
chmod +x scripts/smoke-tests/*.sh
```

#### 3. AWS Credentials Not Configured

```
Unable to locate credentials
```

**Solution:** Configure AWS credentials

```bash
aws configure
# Or set environment variables
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_REGION=us-west-2
```

#### 4. Table/Bucket Not Found

```
✗ Table not found: BayonCoAgent-development
```

**Solution:** Verify infrastructure is deployed

```bash
# Check CloudFormation stack
aws cloudformation describe-stacks --stack-name bayon-coagent-development

# Check DynamoDB tables
aws dynamodb list-tables

# Check S3 buckets
aws s3 ls
```

#### 5. Bedrock Model Access Denied

```
✗ Cannot access Bedrock API
```

**Solution:** Enable Bedrock model access

1. Go to AWS Console → Bedrock
2. Navigate to Model access
3. Request access to Claude 3.5 Sonnet
4. Wait for approval (usually instant)

---

## Test Artifacts

### Location

Test results are uploaded as GitHub Actions artifacts:

- Artifact name: `smoke-test-results`
- Retention: 30 days
- Files:
  - `auth-test.log`
  - `database-test.log`
  - `storage-test.log`
  - `ai-test.log`

### Downloading Artifacts

```bash
# Via GitHub CLI
gh run download <run-id> -n smoke-test-results

# Via GitHub UI
# Go to Actions → Select workflow run → Artifacts section → Download
```

---

## Best Practices

1. **Always run smoke tests after deployment** - Don't skip unless absolutely necessary
2. **Monitor test results** - Review failed tests immediately
3. **Keep tests fast** - Smoke tests should complete in < 5 minutes
4. **Test critical paths only** - Comprehensive testing belongs in integration tests
5. **Update tests with new features** - Add smoke tests for new critical functionality
6. **Review test logs** - Even passing tests may have warnings worth investigating

---

## Adding New Smoke Tests

To add a new smoke test:

1. **Create test script:**

   ```bash
   touch scripts/smoke-tests/test-new-feature.sh
   chmod +x scripts/smoke-tests/test-new-feature.sh
   ```

2. **Follow the template:**

   ```bash
   #!/bin/bash
   set -e

   # Colors
   RED='\033[0;31m'
   GREEN='\033[0;32m'
   BLUE='\033[0;34m'
   NC='\033[0m'

   print_info() { echo -e "${BLUE}ℹ ${1}${NC}"; }
   print_success() { echo -e "${GREEN}✓ ${1}${NC}"; }
   print_error() { echo -e "${RED}✗ ${1}${NC}"; exit 1; }

   # Your tests here
   print_info "Test 1: Description"
   # Test logic
   print_success "Test passed"
   ```

3. **Add to workflow:**

   ```yaml
   - name: Run new feature smoke test
     id: test-new-feature
     run: |
       set +e
       ./scripts/smoke-tests/test-new-feature.sh > new-feature-test.log 2>&1
       TEST_RESULT=$?
       cat new-feature-test.log
       echo "result=$TEST_RESULT" >> $GITHUB_OUTPUT
       exit 0
     continue-on-error: true
   ```

4. **Update artifacts and summary:**
   - Add log file to artifacts upload
   - Add row to test results table

---

## Related Documentation

- [Development Deployment Guide](./development-deployment-guide.md)
- [Deployment Flow Diagram](./deployment-flow-diagram.md)
- [CI/CD Pipeline Architecture](./README.md)
- [Rollback Procedures](./rollback-runbook.md)
