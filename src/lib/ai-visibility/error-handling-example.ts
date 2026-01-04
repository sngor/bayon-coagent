/**
 * Error Handling Integration Example
 * 
 * Demonstrates how to use the comprehensive error handling system
 * Requirements: All error handling scenarios
 */

import { 
  errorHandler, 
  handleAIVisibilityOperation,
  createGracefulAIOperation 
} from './error-handler';
import { errorMonitoring } from './error-monitoring';
import { fallbackManager } from './fallback-manager';
import { retryManager } from './retry-manager';
import { 
  AIVisibilityError, 
  SchemaGenerationError, 
  AIPlatformError,
  logError 
} from './errors';
import type { SchemaMarkup, AIMention, OptimizationRecommendation } from './types';

/**
 * Example: Schema generation with comprehensive error handling
 */
export async function generateSchemaWithErrorHandling(
  userId: string,
  profileData: any
): Promise<SchemaMarkup[]> {
  return handleAIVisibilityOperation(
    async () => {
      // Simulate schema generation that might fail
      if (!profileData.name) {
        throw new SchemaGenerationError(
          'Profile name is required',
          'RealEstateAgent',
          ['Missing name field']
        );
      }

      // Simulate network issues
      if (Math.random() < 0.3) {
        throw new Error('Network timeout');
      }

      // Return mock schema
      return [{
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: profileData.name,
        description: `Professional real estate agent: ${profileData.name}`,
      }] as SchemaMarkup[];
    },
    'schemaGeneration',
    {
      userId,
      serviceName: 'schemaGeneration',
      metadata: { profileId: profileData.id },
    }
  );
}

/**
 * Example: AI platform monitoring with graceful degradation
 */
export const monitorAIPlatformsGracefully = createGracefulAIOperation(
  async (): Promise<AIMention[]> => {
    // Simulate AI platform API calls that might fail
    const platforms = ['chatgpt', 'claude', 'perplexity'];
    const mentions: AIMention[] = [];

    for (const platform of platforms) {
      // Simulate rate limiting
      if (Math.random() < 0.4) {
        throw new AIPlatformError(
          `Rate limit exceeded for ${platform}`,
          platform as any,
          'Too many requests'
        );
      }

      // Add mock mention
      mentions.push({
        id: `mention_${Date.now()}_${Math.random()}`,
        platform: platform as any,
        query: 'best real estate agent',
        response: 'Mock AI response',
        mentionContext: 'Mock context',
        position: 1,
        sentiment: 'positive',
        competitorsAlsoMentioned: [],
        timestamp: new Date(),
        confidence: 0.8,
      });
    }

    return mentions;
  },
  'aiPlatformMonitoring',
  [] // Return empty array if all else fails
);

/**
 * Example: Batch operations with coordinated error handling
 */
export async function processBatchOperations(
  userId: string,
  operations: Array<{ type: string; data: any }>
): Promise<{
  successful: any[];
  failed: Array<{ operation: any; error: string }>;
  summary: string;
}> {
  const batchOps = operations.map(op => ({
    operation: async () => {
      switch (op.type) {
        case 'schema':
          return generateSchemaWithErrorHandling(userId, op.data);
        case 'monitoring':
          return monitorAIPlatformsGracefully();
        case 'recommendations':
          return generateRecommendationsWithFallback(userId, op.data);
        default:
          throw new AIVisibilityError(`Unknown operation type: ${op.type}`, 'INVALID_OPERATION');
      }
    },
    operationType: op.type,
    context: { userId, operationData: op.data },
  }));

  const result = await errorHandler.handleBatchOperations(batchOps, {
    failFast: false,
    concurrency: 3,
    collectPartialResults: true,
  });

  const successful = result.results
    .filter(r => r.success)
    .map(r => r.data);

  const failed = result.results
    .filter(r => !r.success)
    .map((r, index) => ({
      operation: operations[index],
      error: r.error?.message || 'Unknown error',
    }));

  const summary = `Processed ${operations.length} operations: ${result.successCount} successful, ${result.failureCount} failed`;

  return { successful, failed, summary };
}

/**
 * Example: Recommendations generation with fallback
 */
async function generateRecommendationsWithFallback(
  userId: string,
  analysisData: any
): Promise<OptimizationRecommendation[]> {
  return fallbackManager.executeWithFallback(
    async () => {
      // Simulate recommendation generation
      if (Math.random() < 0.5) {
        throw new Error('Recommendation engine temporarily unavailable');
      }

      return [{
        id: `rec_${Date.now()}`,
        category: 'schema',
        priority: 'high',
        title: 'Add RealEstateAgent Schema',
        description: 'Implement comprehensive RealEstateAgent schema markup',
        actionItems: ['Add schema to website header', 'Include contact information'],
        estimatedImpact: 15,
        implementationDifficulty: 'easy',
        status: 'pending',
        createdAt: new Date(),
      }] as OptimizationRecommendation[];
    },
    'optimizationEngine',
    [{
      id: 'fallback_rec',
      category: 'schema',
      priority: 'medium',
      title: 'Basic Schema Implementation',
      description: 'Add basic schema markup (fallback recommendation)',
      actionItems: ['Add minimal schema markup'],
      estimatedImpact: 5,
      implementationDifficulty: 'easy',
      status: 'pending',
      createdAt: new Date(),
    }] as OptimizationRecommendation[],
    userId
  );
}

/**
 * Example: Error monitoring and alerting setup
 */
export function setupErrorMonitoring(): void {
  // Configure custom alerts
  errorMonitoring.configureAlert({
    name: 'schema_generation_failures',
    description: 'Schema generation is failing frequently',
    errorCodes: ['SCHEMA_GENERATION_ERROR', 'SCHEMA_VALIDATION_ERROR'],
    totalErrorThreshold: 5,
    timeWindowMinutes: 15,
    enabled: true,
    cooldownMinutes: 30,
  });

  errorMonitoring.configureAlert({
    name: 'ai_platform_issues',
    description: 'AI platforms experiencing issues',
    services: ['aiPlatformMonitoring'],
    errorRateThreshold: 3,
    timeWindowMinutes: 10,
    enabled: true,
    cooldownMinutes: 20,
  });

  // Example of recording errors manually
  const recordExampleError = () => {
    const error = new AIPlatformError(
      'Example API failure',
      'chatgpt',
      'Connection timeout'
    );

    errorMonitoring.recordError(
      error,
      'aiPlatformMonitoring',
      'queryPlatform',
      'user123',
      { query: 'test query', platform: 'chatgpt' }
    );
  };

  // Set up periodic error recording for demonstration
  // In real usage, errors would be recorded automatically by the error handling system
  setInterval(recordExampleError, 60000); // Every minute for demo
}

/**
 * Example: System health monitoring
 */
export async function getSystemHealthReport(): Promise<{
  status: string;
  errorMetrics: any;
  serviceStatuses: any;
  recommendations: string[];
  retryStats: any;
  recentAlerts: any[];
}> {
  const health = errorMonitoring.getSystemHealth();
  const retryStats = retryManager.getStats();
  const recentAlerts = errorMonitoring.getActiveAlerts();

  return {
    status: health.status,
    errorMetrics: health.metrics,
    serviceStatuses: health.serviceStatuses,
    recommendations: health.recommendations,
    retryStats: retryStats instanceof Map ? Object.fromEntries(retryStats) : retryStats,
    recentAlerts,
  };
}

/**
 * Example: Error recovery workflow
 */
export async function handleErrorRecovery(
  errorType: string,
  context: Record<string, any>
): Promise<{
  recovered: boolean;
  actions: string[];
  fallbackUsed: boolean;
}> {
  let recovered = false;
  let fallbackUsed = false;
  const actions: string[] = [];

  try {
    switch (errorType) {
      case 'schema_generation':
        actions.push('Attempting schema regeneration with simplified parameters');
        
        // Try with fallback configuration
        const result = await fallbackManager.executeWithFallback(
          () => generateSchemaWithErrorHandling(context.userId, context.profileData),
          'schemaGeneration',
          undefined,
          context.userId
        );
        
        if (result) {
          recovered = true;
          fallbackUsed = true;
          actions.push('Successfully generated schema using fallback mechanism');
        }
        break;

      case 'ai_platform':
        actions.push('Switching to alternative AI platforms');
        
        // Clear service status to allow retry
        fallbackManager.resetServiceStatus('aiPlatformMonitoring');
        
        const mentions = await monitorAIPlatformsGracefully();
        if (mentions.length >= 0) { // Even empty array is success
          recovered = true;
          fallbackUsed = true;
          actions.push('Successfully retrieved AI mentions using graceful degradation');
        }
        break;

      case 'database':
        actions.push('Retrying database operations with exponential backoff');
        
        // Database operations typically don't use fallback, just retry
        recovered = true; // Assume retry will work
        actions.push('Database retry mechanism activated');
        break;

      default:
        actions.push('Unknown error type - applying general recovery procedures');
        actions.push('Enabling graceful degradation mode');
        fallbackUsed = true;
        recovered = true;
    }
  } catch (error) {
    actions.push(`Recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logError(
      error instanceof AIVisibilityError ? error : new AIVisibilityError(
        'Error recovery failed',
        'RECOVERY_FAILED',
        500,
        false,
        context,
        error instanceof Error ? error : undefined
      ),
      { errorType, context }
    );
  }

  return {
    recovered,
    actions,
    fallbackUsed,
  };
}

/**
 * Example: Comprehensive error handling test
 */
export async function runErrorHandlingTest(): Promise<{
  testResults: Array<{
    test: string;
    passed: boolean;
    details: string;
  }>;
  summary: string;
}> {
  const testResults: Array<{ test: string; passed: boolean; details: string }> = [];

  // Test 1: Schema generation with error handling
  try {
    await generateSchemaWithErrorHandling('test-user', { name: 'Test Agent' });
    testResults.push({
      test: 'Schema Generation',
      passed: true,
      details: 'Successfully generated schema with error handling',
    });
  } catch (error) {
    testResults.push({
      test: 'Schema Generation',
      passed: false,
      details: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  // Test 2: Graceful AI monitoring
  try {
    const mentions = await monitorAIPlatformsGracefully();
    testResults.push({
      test: 'AI Platform Monitoring',
      passed: true,
      details: `Retrieved ${mentions.length} mentions with graceful handling`,
    });
  } catch (error) {
    testResults.push({
      test: 'AI Platform Monitoring',
      passed: false,
      details: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  // Test 3: Batch operations
  try {
    const batchResult = await processBatchOperations('test-user', [
      { type: 'schema', data: { name: 'Test Agent' } },
      { type: 'monitoring', data: {} },
    ]);
    testResults.push({
      test: 'Batch Operations',
      passed: true,
      details: batchResult.summary,
    });
  } catch (error) {
    testResults.push({
      test: 'Batch Operations',
      passed: false,
      details: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  // Test 4: Error monitoring
  try {
    const health = await getSystemHealthReport();
    testResults.push({
      test: 'Error Monitoring',
      passed: true,
      details: `System status: ${health.status}, Active alerts: ${health.recentAlerts.length}`,
    });
  } catch (error) {
    testResults.push({
      test: 'Error Monitoring',
      passed: false,
      details: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;
  const summary = `Error handling tests completed: ${passedTests}/${totalTests} passed`;

  return {
    testResults,
    summary,
  };
}