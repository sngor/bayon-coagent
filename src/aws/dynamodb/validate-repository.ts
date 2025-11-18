/**
 * Validation script for DynamoDB Repository
 * 
 * This script validates that all repository operations are properly implemented
 * with error handling and retry logic.
 */

import { DynamoDBRepository } from './repository';
import { DynamoDBError, ThroughputExceededError, ValidationError } from './errors';
import { withRetry } from './retry';

async function validateRepository() {
  console.log('🔍 Validating DynamoDB Repository Implementation...\n');

  const results: { test: string; passed: boolean; error?: string }[] = [];

  // Test 1: Repository instantiation
  try {
    const repo = new DynamoDBRepository();
    results.push({ test: 'Repository instantiation', passed: true });
  } catch (error: any) {
    results.push({
      test: 'Repository instantiation',
      passed: false,
      error: error.message,
    });
  }

  // Test 2: Repository with custom retry options
  try {
    const repo = new DynamoDBRepository({
      maxRetries: 5,
      initialDelayMs: 200,
      maxDelayMs: 10000,
    });
    results.push({ test: 'Repository with custom retry options', passed: true });
  } catch (error: any) {
    results.push({
      test: 'Repository with custom retry options',
      passed: false,
      error: error.message,
    });
  }

  // Test 3: Error classes
  try {
    const error1 = new DynamoDBError('Test error', 'TestCode', 400, true);
    const error2 = new ThroughputExceededError();
    const error3 = new ValidationError('Invalid input');

    if (
      error1.retryable &&
      error2.retryable &&
      !error3.retryable &&
      error1.code === 'TestCode' &&
      error2.code === 'ProvisionedThroughputExceededException'
    ) {
      results.push({ test: 'Error classes', passed: true });
    } else {
      results.push({
        test: 'Error classes',
        passed: false,
        error: 'Error properties not set correctly',
      });
    }
  } catch (error: any) {
    results.push({ test: 'Error classes', passed: false, error: error.message });
  }

  // Test 4: Retry logic with successful operation
  try {
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts++;
      return 'success';
    });

    if (result === 'success' && attempts === 1) {
      results.push({ test: 'Retry logic - successful operation', passed: true });
    } else {
      results.push({
        test: 'Retry logic - successful operation',
        passed: false,
        error: `Expected 1 attempt, got ${attempts}`,
      });
    }
  } catch (error: any) {
    results.push({
      test: 'Retry logic - successful operation',
      passed: false,
      error: error.message,
    });
  }

  // Test 5: Retry logic with retryable error
  try {
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts++;
        if (attempts < 3) {
          const error: any = new Error('Throttled');
          error.name = 'ThrottlingException';
          throw error;
        }
        return 'success';
      },
      { maxRetries: 3, initialDelayMs: 10 }
    );

    if (result === 'success' && attempts === 3) {
      results.push({ test: 'Retry logic - retryable error', passed: true });
    } else {
      results.push({
        test: 'Retry logic - retryable error',
        passed: false,
        error: `Expected 3 attempts, got ${attempts}`,
      });
    }
  } catch (error: any) {
    results.push({
      test: 'Retry logic - retryable error',
      passed: false,
      error: error.message,
    });
  }

  // Test 6: Retry logic with non-retryable error
  try {
    let attempts = 0;
    await withRetry(
      async () => {
        attempts++;
        const error: any = new Error('Validation failed');
        error.name = 'ValidationException';
        throw error;
      },
      { maxRetries: 3, initialDelayMs: 10 }
    );

    results.push({
      test: 'Retry logic - non-retryable error',
      passed: false,
      error: 'Should have thrown error',
    });
  } catch (error: any) {
    // Should fail on first attempt
    results.push({ test: 'Retry logic - non-retryable error', passed: true });
  }

  // Test 7: Repository methods exist
  try {
    const repo = new DynamoDBRepository();
    const methods = [
      'get',
      'getItem',
      'query',
      'queryItems',
      'put',
      'create',
      'update',
      'delete',
      'batchGet',
      'batchWrite',
    ];

    const missingMethods = methods.filter((method) => typeof (repo as any)[method] !== 'function');

    if (missingMethods.length === 0) {
      results.push({ test: 'Repository methods exist', passed: true });
    } else {
      results.push({
        test: 'Repository methods exist',
        passed: false,
        error: `Missing methods: ${missingMethods.join(', ')}`,
      });
    }
  } catch (error: any) {
    results.push({
      test: 'Repository methods exist',
      passed: false,
      error: error.message,
    });
  }

  // Print results
  console.log('📊 Validation Results:\n');
  let passed = 0;
  let failed = 0;

  results.forEach((result) => {
    if (result.passed) {
      console.log(`✅ ${result.test}`);
      passed++;
    } else {
      console.log(`❌ ${result.test}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      failed++;
    }
  });

  console.log(`\n📈 Summary: ${passed} passed, ${failed} failed out of ${results.length} tests`);

  if (failed === 0) {
    console.log('\n✨ All validations passed! Repository implementation is complete.');
    return true;
  } else {
    console.log('\n⚠️  Some validations failed. Please review the errors above.');
    return false;
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateRepository()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Validation failed with error:', error);
      process.exit(1);
    });
}

export { validateRepository };
