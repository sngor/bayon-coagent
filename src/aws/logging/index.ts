/**
 * AWS Logging and Monitoring Module
 * 
 * Centralized logging and monitoring for the Bayon CoAgent application.
 * 
 * Features:
 * - Environment-aware logging (console for local, CloudWatch for production)
 * - Structured logging with correlation IDs
 * - CloudWatch Logs integration
 * - Dashboard configurations
 * - Alarm configurations
 * - Error tracking and context
 * 
 * Usage:
 * ```typescript
 * import { logger, createLogger } from '@/aws/logging';
 * 
 * // Use default logger
 * logger.info('User logged in', { userId: '123' });
 * 
 * // Create a service-specific logger
 * const authLogger = createLogger({ service: 'auth' });
 * authLogger.error('Login failed', error, { userId: '123' });
 * ```
 */

export {
  Logger,
  LogLevel,
  LogContext,
  LogEntry,
  logger,
  createLogger,
  generateCorrelationId,
  withCorrelationId,
} from './logger';

export {
  CloudWatchLogger,
  CloudWatchConfig,
  createCloudWatchLogger,
} from './cloudwatch';

export {
  DashboardConfig,
  DashboardWidget,
  dashboards,
  systemHealthDashboard,
  performanceDashboard,
  costDashboard,
  userActivityDashboard,
  generateDashboardTemplate,
} from './dashboard-config';

export {
  AlarmConfig,
  ComparisonOperator,
  Statistic,
  alarms,
  highErrorRateAlarm,
  highLatencyAlarm,
  dynamoDBThrottlingAlarm,
  bedrockQuotaAlarm,
  s3UploadFailureAlarm,
  authFailureAlarm,
  databaseLatencyAlarm,
  aiGenerationFailureAlarm,
  generateAlarmTemplate,
  generateAllAlarmsTemplate,
} from './alerts';

export {
  getMetricsClient,
  resetMetricsClient,
  trackOperation,
  trackBedrockInvocation,
  trackStorageOperation,
} from './reimagine-metrics';

export type {
  EditType,
  OperationType,
  OperationMetrics,
  BedrockMetrics,
  StorageMetrics,
} from './reimagine-metrics';

export {
  allQueries,
  queryTemplates,
  prepareQuery,
  getQueryByName,
  findLogsByTraceId,
  findLogsByCorrelationId,
  traceRequestAcrossServices,
  findErrorsWithTraceContext,
  analyzeServicePerformance,
  findSlowOperations,
  analyzeErrorPatterns,
  findLogsByUserId,
  analyzeRequestFlow,
  findOrphanedLogs,
  analyzeServiceDependencies,
  findConcurrentOperations,
  calculateEndToEndLatency,
  findFailedTraces,
  analyzeServiceHealth,
} from './cloudwatch-insights-queries';

export type { InsightsQuery } from './cloudwatch-insights-queries';

export {
  InsightsClient,
  getInsightsClient,
  resetInsightsClient,
} from './insights-client';

export type { QueryExecutionOptions, QueryResult } from './insights-client';

export {
  clientPortalLogger,
  clientPortalMetrics,
  clientPortalAlarms,
  logDashboardView,
  logLinkValidation,
  logPropertySearch,
  logValuationRequest,
  logDocumentDownload,
  logContactRequest,
  logDashboardCreation,
  logLinkGeneration,
  logCMAReportCreation,
  logError,
  monitorOperation,
  calculateErrorRate,
  isResponseTimeAcceptable,
} from './client-portal-monitoring';
