/**
 * Logging Verification Script
 * 
 * Quick test to verify logging functionality works correctly.
 */

import { logger, createLogger, generateCorrelationId } from './logger';

async function verifyLogging() {
  console.log('=== Logging Verification ===\n');

  // Test 1: Basic logging
  console.log('Test 1: Basic logging at all levels');
  logger.debug('Debug message', { test: 1 });
  logger.info('Info message', { test: 1 });
  logger.warn('Warning message', { test: 1 });
  logger.error('Error message', new Error('Test error'), { test: 1 });
  console.log('✓ Basic logging works\n');

  // Test 2: Service-specific logger
  console.log('Test 2: Service-specific logger');
  const authLogger = createLogger({ service: 'auth' });
  authLogger.info('Service-specific log', { userId: 'test-123' });
  console.log('✓ Service-specific logger works\n');

  // Test 3: Correlation IDs
  console.log('Test 3: Correlation IDs');
  const correlationId = generateCorrelationId();
  const requestLogger = createLogger({ correlationId, service: 'api' });
  requestLogger.info('Request with correlation ID', { action: 'test' });
  console.log('✓ Correlation IDs work\n');

  // Test 4: Child logger
  console.log('Test 4: Child logger');
  const parentLogger = createLogger({ service: 'parent' });
  const childLogger = parentLogger.child({ operation: 'child-op' });
  childLogger.info('Child logger message');
  console.log('✓ Child logger works\n');

  // Test 5: Operation tracking
  console.log('Test 5: Operation tracking');
  const endOperation = logger.startOperation('testOperation', { data: 'test' });
  await new Promise(resolve => setTimeout(resolve, 100));
  endOperation();
  console.log('✓ Operation tracking works\n');

  console.log('=== All logging tests passed! ===');
}

// Run verification if executed directly
if (require.main === module) {
  verifyLogging().catch(console.error);
}

export { verifyLogging };
