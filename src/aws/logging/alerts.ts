/**
 * CloudWatch Alarms Configuration
 * 
 * Defines alarm configurations for monitoring critical metrics and alerting on issues.
 */

export type ComparisonOperator =
  | 'GreaterThanThreshold'
  | 'GreaterThanOrEqualToThreshold'
  | 'LessThanThreshold'
  | 'LessThanOrEqualToThreshold';

export type Statistic = 'Average' | 'Sum' | 'Minimum' | 'Maximum' | 'SampleCount';

export interface AlarmConfig {
  name: string;
  description: string;
  namespace: string;
  metricName: string;
  statistic: Statistic;
  period: number; // in seconds
  evaluationPeriods: number;
  threshold: number;
  comparisonOperator: ComparisonOperator;
  treatMissingData?: 'breaching' | 'notBreaching' | 'ignore' | 'missing';
  dimensions?: Record<string, string>;
}

/**
 * High Error Rate Alarm
 * Triggers when error rate exceeds threshold
 */
export const highErrorRateAlarm: AlarmConfig = {
  name: 'BayonCoAgent-HighErrorRate',
  description: 'Alert when error rate exceeds 5% over 5 minutes',
  namespace: 'BayonCoAgent',
  metricName: 'ErrorRate',
  statistic: 'Average',
  period: 300, // 5 minutes
  evaluationPeriods: 1,
  threshold: 5, // 5%
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'notBreaching',
};

/**
 * High API Latency Alarm
 * Triggers when API response time is too slow
 */
export const highLatencyAlarm: AlarmConfig = {
  name: 'BayonCoAgent-HighLatency',
  description: 'Alert when p95 API latency exceeds 1000ms',
  namespace: 'BayonCoAgent',
  metricName: 'APILatency',
  statistic: 'Average',
  period: 300,
  evaluationPeriods: 2,
  threshold: 1000, // 1 second
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'notBreaching',
};

/**
 * DynamoDB Throttling Alarm
 * Triggers when DynamoDB requests are being throttled
 */
export const dynamoDBThrottlingAlarm: AlarmConfig = {
  name: 'BayonCoAgent-DynamoDBThrottling',
  description: 'Alert when DynamoDB throttling occurs',
  namespace: 'AWS/DynamoDB',
  metricName: 'UserErrors',
  statistic: 'Sum',
  period: 300,
  evaluationPeriods: 1,
  threshold: 10,
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'notBreaching',
};

/**
 * Bedrock Quota Limit Alarm
 * Triggers when approaching Bedrock quota limits
 */
export const bedrockQuotaAlarm: AlarmConfig = {
  name: 'BayonCoAgent-BedrockQuota',
  description: 'Alert when Bedrock invocations approach quota limit',
  namespace: 'AWS/Bedrock',
  metricName: 'Invocations',
  statistic: 'Sum',
  period: 3600, // 1 hour
  evaluationPeriods: 1,
  threshold: 10000, // Adjust based on your quota
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'notBreaching',
};

/**
 * S3 Upload Failure Alarm
 * Triggers when S3 uploads are failing
 */
export const s3UploadFailureAlarm: AlarmConfig = {
  name: 'BayonCoAgent-S3UploadFailures',
  description: 'Alert when S3 upload failures exceed threshold',
  namespace: 'AWS/S3',
  metricName: '5xxErrors',
  statistic: 'Sum',
  period: 300,
  evaluationPeriods: 1,
  threshold: 5,
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'notBreaching',
};

/**
 * Authentication Failure Alarm
 * Triggers when authentication failures spike
 */
export const authFailureAlarm: AlarmConfig = {
  name: 'BayonCoAgent-AuthFailures',
  description: 'Alert when authentication failures spike',
  namespace: 'AWS/Cognito',
  metricName: 'SignInThrottles',
  statistic: 'Sum',
  period: 300,
  evaluationPeriods: 1,
  threshold: 20,
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'notBreaching',
};

/**
 * Database Query Latency Alarm
 * Triggers when database queries are slow
 */
export const databaseLatencyAlarm: AlarmConfig = {
  name: 'BayonCoAgent-DatabaseLatency',
  description: 'Alert when database query latency exceeds 100ms (p95)',
  namespace: 'AWS/DynamoDB',
  metricName: 'SuccessfulRequestLatency',
  statistic: 'Average',
  period: 300,
  evaluationPeriods: 2,
  threshold: 100,
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'notBreaching',
};

/**
 * AI Generation Failure Alarm
 * Triggers when AI generation requests are failing
 */
export const aiGenerationFailureAlarm: AlarmConfig = {
  name: 'BayonCoAgent-AIGenerationFailures',
  description: 'Alert when AI generation failures exceed threshold',
  namespace: 'AWS/Bedrock',
  metricName: 'InvocationServerErrors',
  statistic: 'Sum',
  period: 300,
  evaluationPeriods: 1,
  threshold: 5,
  comparisonOperator: 'GreaterThanThreshold',
  treatMissingData: 'notBreaching',
};

/**
 * Export all alarm configurations
 */
export const alarms = {
  highErrorRate: highErrorRateAlarm,
  highLatency: highLatencyAlarm,
  dynamoDBThrottling: dynamoDBThrottlingAlarm,
  bedrockQuota: bedrockQuotaAlarm,
  s3UploadFailure: s3UploadFailureAlarm,
  authFailure: authFailureAlarm,
  databaseLatency: databaseLatencyAlarm,
  aiGenerationFailure: aiGenerationFailureAlarm,
};

/**
 * Generate CloudFormation template for an alarm
 */
export function generateAlarmTemplate(config: AlarmConfig, snsTopicArn: string): any {
  return {
    Type: 'AWS::CloudWatch::Alarm',
    Properties: {
      AlarmName: config.name,
      AlarmDescription: config.description,
      MetricName: config.metricName,
      Namespace: config.namespace,
      Statistic: config.statistic,
      Period: config.period,
      EvaluationPeriods: config.evaluationPeriods,
      Threshold: config.threshold,
      ComparisonOperator: config.comparisonOperator,
      TreatMissingData: config.treatMissingData || 'notBreaching',
      AlarmActions: [snsTopicArn],
      Dimensions: config.dimensions
        ? Object.entries(config.dimensions).map(([name, value]) => ({
            Name: name,
            Value: value,
          }))
        : undefined,
    },
  };
}

/**
 * Generate all alarms as CloudFormation template
 */
export function generateAllAlarmsTemplate(snsTopicArn: string): any {
  const resources: Record<string, any> = {};

  Object.entries(alarms).forEach(([key, config]) => {
    const resourceName = key.charAt(0).toUpperCase() + key.slice(1) + 'Alarm';
    resources[resourceName] = generateAlarmTemplate(config, snsTopicArn);
  });

  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'CloudWatch Alarms for Bayon CoAgent',
    Parameters: {
      SNSTopicArn: {
        Type: 'String',
        Description: 'ARN of SNS topic for alarm notifications',
      },
    },
    Resources: resources,
  };
}
