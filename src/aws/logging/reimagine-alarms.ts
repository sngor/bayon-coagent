/**
 * CloudWatch Alarms for Reimagine Image Toolkit
 * 
 * This module defines CloudWatch alarms for monitoring the Reimagine Image Toolkit:
 * - High error rates for operations
 * - Slow processing times
 * - Bedrock throttling
 * - Storage issues
 * 
 * Requirements: Task 29 - Error rate alerts
 */

import type { AlarmConfig } from './alerts';

// ============================================================================
// Reimagine-Specific Alarms
// ============================================================================

/**
 * Alarm for high error rate in upload operations
 * Triggers when upload error rate exceeds 10% over 5 minutes
 */
export const reimagineUploadErrorAlarm: AlarmConfig = {
  alarmName: 'Reimagine-HighUploadErrorRate',
  alarmDescription: 'Triggers when Reimagine upload error rate exceeds 10%',
  metricName: 'ErrorRate',
  namespace: 'BayonCoagent/Reimagine',
  dimensions: [{ Name: 'OperationType', Value: 'upload' }],
  statistic: 'Average',
  period: 300, // 5 minutes
  evaluationPeriods: 2,
  threshold: 10, // 10% error rate
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'notBreaching',
};

/**
 * Alarm for high error rate in edit operations
 * Triggers when edit error rate exceeds 15% over 5 minutes
 */
export const reimagineEditErrorAlarm: AlarmConfig = {
  alarmName: 'Reimagine-HighEditErrorRate',
  alarmDescription: 'Triggers when Reimagine edit error rate exceeds 15%',
  metricName: 'ErrorRate',
  namespace: 'BayonCoagent/Reimagine',
  dimensions: [{ Name: 'OperationType', Value: 'edit' }],
  statistic: 'Average',
  period: 300, // 5 minutes
  evaluationPeriods: 2,
  threshold: 15, // 15% error rate
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'notBreaching',
};

/**
 * Alarm for slow processing times
 * Triggers when average processing time exceeds 60 seconds
 */
export const reimagineSlowProcessingAlarm: AlarmConfig = {
  alarmName: 'Reimagine-SlowProcessing',
  alarmDescription: 'Triggers when average edit processing time exceeds 60 seconds',
  metricName: 'OperationDuration',
  namespace: 'BayonCoagent/Reimagine',
  dimensions: [{ Name: 'OperationType', Value: 'edit' }],
  statistic: 'Average',
  period: 300, // 5 minutes
  evaluationPeriods: 2,
  threshold: 60000, // 60 seconds in milliseconds
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'notBreaching',
};

/**
 * Alarm for Bedrock throttling errors
 * Triggers when Bedrock throttling errors occur
 */
export const reimagineBedrockThrottlingAlarm: AlarmConfig = {
  alarmName: 'Reimagine-BedrockThrottling',
  alarmDescription: 'Triggers when Bedrock throttling errors occur in Reimagine',
  metricName: 'BedrockErrorCount',
  namespace: 'BayonCoagent/Reimagine',
  dimensions: [{ Name: 'ErrorType', Value: 'ThrottlingException' }],
  statistic: 'Sum',
  period: 300, // 5 minutes
  evaluationPeriods: 1,
  threshold: 5, // 5 throttling errors
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'notBreaching',
};

/**
 * Alarm for high Bedrock error rate
 * Triggers when Bedrock invocation error rate exceeds 20%
 */
export const reimagineBedrockErrorAlarm: AlarmConfig = {
  alarmName: 'Reimagine-HighBedrockErrorRate',
  alarmDescription: 'Triggers when Bedrock invocation error rate exceeds 20%',
  metricName: 'BedrockInvocationCount',
  namespace: 'BayonCoagent/Reimagine',
  dimensions: [{ Name: 'Status', Value: 'Failure' }],
  statistic: 'Sum',
  period: 300, // 5 minutes
  evaluationPeriods: 2,
  threshold: 10, // 10 failed invocations
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'notBreaching',
};

/**
 * Alarm for S3 storage operation failures
 * Triggers when S3 operations fail repeatedly
 */
export const reimagineStorageErrorAlarm: AlarmConfig = {
  alarmName: 'Reimagine-StorageErrors',
  alarmDescription: 'Triggers when S3 storage operations fail repeatedly',
  metricName: 'StorageOperationCount',
  namespace: 'BayonCoagent/Reimagine',
  dimensions: [{ Name: 'Status', Value: 'Failure' }],
  statistic: 'Sum',
  period: 300, // 5 minutes
  evaluationPeriods: 2,
  threshold: 5, // 5 failed operations
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'notBreaching',
};

/**
 * Alarm for excessive storage usage
 * Triggers when storage usage grows too quickly (potential issue)
 */
export const reimagineStorageGrowthAlarm: AlarmConfig = {
  alarmName: 'Reimagine-ExcessiveStorageGrowth',
  alarmDescription: 'Triggers when storage usage grows excessively',
  metricName: 'StorageUsage',
  namespace: 'BayonCoagent/Reimagine',
  dimensions: [{ Name: 'Operation', Value: 'upload' }],
  statistic: 'Sum',
  period: 3600, // 1 hour
  evaluationPeriods: 1,
  threshold: 1073741824, // 1 GB per hour
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'notBreaching',
};

/**
 * Alarm for analysis failures
 * Triggers when image analysis fails repeatedly
 */
export const reimagineAnalysisErrorAlarm: AlarmConfig = {
  alarmName: 'Reimagine-AnalysisErrors',
  alarmDescription: 'Triggers when image analysis fails repeatedly',
  metricName: 'OperationCount',
  namespace: 'BayonCoagent/Reimagine',
  dimensions: [
    { Name: 'OperationType', Value: 'analysis' },
    { Name: 'Status', Value: 'Failure' },
  ],
  statistic: 'Sum',
  period: 300, // 5 minutes
  evaluationPeriods: 2,
  threshold: 5, // 5 failed analyses
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'notBreaching',
};

/**
 * Alarm for virtual staging failures
 * Triggers when virtual staging operations fail frequently
 */
export const reimagineStagingErrorAlarm: AlarmConfig = {
  alarmName: 'Reimagine-StagingErrors',
  alarmDescription: 'Triggers when virtual staging operations fail frequently',
  metricName: 'OperationCount',
  namespace: 'BayonCoagent/Reimagine',
  dimensions: [
    { Name: 'OperationType', Value: 'edit' },
    { Name: 'EditType', Value: 'virtual-staging' },
    { Name: 'Status', Value: 'Failure' },
  ],
  statistic: 'Sum',
  period: 300, // 5 minutes
  evaluationPeriods: 2,
  threshold: 3, // 3 failed staging operations
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'notBreaching',
};

/**
 * All Reimagine alarms
 */
export const reimagineAlarms: AlarmConfig[] = [
  reimagineUploadErrorAlarm,
  reimagineEditErrorAlarm,
  reimagineSlowProcessingAlarm,
  reimagineBedrockThrottlingAlarm,
  reimagineBedrockErrorAlarm,
  reimagineStorageErrorAlarm,
  reimagineStorageGrowthAlarm,
  reimagineAnalysisErrorAlarm,
  reimagineStagingErrorAlarm,
];

/**
 * Generates CloudFormation template for Reimagine alarms
 */
export function generateReimagineAlarmsTemplate(
  snsTopicArn?: string
): string {
  const alarmsYaml = reimagineAlarms
    .map((alarm) => {
      const dimensionsYaml = alarm.dimensions
        .map(
          (dim) => `        - Name: ${dim.Name}
          Value: ${dim.Value}`
        )
        .join('\n');

      return `  ${alarm.alarmName.replace(/-/g, '')}:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: ${alarm.alarmName}
      AlarmDescription: ${alarm.alarmDescription}
      MetricName: ${alarm.metricName}
      Namespace: ${alarm.namespace}
      Statistic: ${alarm.statistic}
      Period: ${alarm.period}
      EvaluationPeriods: ${alarm.evaluationPeriods}
      Threshold: ${alarm.threshold}
      ComparisonOperator: ${alarm.comparisonOperator}
      TreatMissingData: ${alarm.treatMissingData}
      Dimensions:
${dimensionsYaml}${
        snsTopicArn
          ? `
      AlarmActions:
        - ${snsTopicArn}`
          : ''
      }`;
    })
    .join('\n\n');

  return `# CloudWatch Alarms for Reimagine Image Toolkit
# Generated automatically - do not edit manually

Resources:
${alarmsYaml}
`;
}
