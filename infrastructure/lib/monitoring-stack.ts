import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  environment: string;
  userPool: cognito.UserPool;
  dynamoDBTable: dynamodb.Table;
  storageBucket: s3.Bucket;
  alarmEmail?: string;
}

export class MonitoringStack extends cdk.Stack {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const { environment, userPool, dynamoDBTable, storageBucket, alarmEmail } = props;

    // Create SNS topic for alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `bayon-coagent-alarms-${environment}`,
      displayName: `Bayon CoAgent Alarms (${environment})`,
    });

    // Subscribe email to alarm topic if provided
    if (alarmEmail) {
      this.alarmTopic.addSubscription(
        new subscriptions.EmailSubscription(alarmEmail)
      );
    }

    // Create CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `BayonCoAgent-${environment}`,
    });

    // === Cognito Metrics ===
    const cognitoSignInSuccessMetric = new cloudwatch.Metric({
      namespace: 'AWS/Cognito',
      metricName: 'SignInSuccesses',
      dimensionsMap: {
        UserPool: userPool.userPoolId,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const cognitoSignInFailureMetric = new cloudwatch.Metric({
      namespace: 'AWS/Cognito',
      metricName: 'SignInThrottles',
      dimensionsMap: {
        UserPool: userPool.userPoolId,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // Alarm for high authentication failures
    const authFailureAlarm = new cloudwatch.Alarm(this, 'AuthFailureAlarm', {
      alarmName: `${environment}-high-auth-failures`,
      metric: cognitoSignInFailureMetric,
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when authentication failures exceed threshold',
    });
    authFailureAlarm.addAlarmAction(new actions.SnsAction(this.alarmTopic));

    // === DynamoDB Metrics ===
    const dynamoReadThrottleMetric = dynamoDBTable.metricUserErrors({
      period: cdk.Duration.minutes(5),
      statistic: 'Sum',
    });

    const dynamoWriteThrottleMetric = dynamoDBTable.metricSystemErrorsForOperations({
      operations: [dynamodb.Operation.PUT_ITEM, dynamodb.Operation.UPDATE_ITEM],
      period: cdk.Duration.minutes(5),
      statistic: 'Sum',
    });

    // Alarm for DynamoDB throttling
    const dynamoThrottleAlarm = new cloudwatch.Alarm(this, 'DynamoThrottleAlarm', {
      alarmName: `${environment}-dynamodb-throttling`,
      metric: dynamoReadThrottleMetric,
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when DynamoDB requests are being throttled',
    });
    dynamoThrottleAlarm.addAlarmAction(new actions.SnsAction(this.alarmTopic));

    // === S3 Metrics ===
    const s3RequestMetric = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: 'AllRequests',
      dimensionsMap: {
        BucketName: storageBucket.bucketName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const s34xxErrorMetric = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: '4xxErrors',
      dimensionsMap: {
        BucketName: storageBucket.bucketName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const s35xxErrorMetric = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: '5xxErrors',
      dimensionsMap: {
        BucketName: storageBucket.bucketName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // Alarm for S3 errors
    const s3ErrorAlarm = new cloudwatch.Alarm(this, 'S3ErrorAlarm', {
      alarmName: `${environment}-s3-errors`,
      metric: s35xxErrorMetric,
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when S3 5xx errors exceed threshold',
    });
    s3ErrorAlarm.addAlarmAction(new actions.SnsAction(this.alarmTopic));

    // === Bedrock Metrics ===
    const bedrockInvocationMetric = new cloudwatch.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'Invocations',
      dimensionsMap: {
        ModelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const bedrockTitanInvocationMetric = new cloudwatch.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'Invocations',
      dimensionsMap: {
        ModelId: 'amazon.titan-image-generator-v1',
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const bedrockSDXLInvocationMetric = new cloudwatch.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'Invocations',
      dimensionsMap: {
        ModelId: 'stability.stable-diffusion-xl-v1',
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const bedrockThrottleMetric = new cloudwatch.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'ModelInvocationThrottles',
      dimensionsMap: {
        ModelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const bedrockLatencyMetric = new cloudwatch.Metric({
      namespace: 'AWS/Bedrock',
      metricName: 'InvocationLatency',
      dimensionsMap: {
        ModelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // Alarm for Bedrock throttling
    const bedrockThrottleAlarm = new cloudwatch.Alarm(this, 'BedrockThrottleAlarm', {
      alarmName: `${environment}-bedrock-throttling`,
      metric: bedrockThrottleMetric,
      threshold: 3,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when Bedrock requests are being throttled',
    });
    bedrockThrottleAlarm.addAlarmAction(new actions.SnsAction(this.alarmTopic));

    // Alarm for high Bedrock latency
    const bedrockLatencyAlarm = new cloudwatch.Alarm(this, 'BedrockLatencyAlarm', {
      alarmName: `${environment}-bedrock-high-latency`,
      metric: bedrockLatencyMetric,
      threshold: 30000, // 30 seconds
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when Bedrock latency is consistently high',
    });
    bedrockLatencyAlarm.addAlarmAction(new actions.SnsAction(this.alarmTopic));

    // === Build Dashboard ===
    
    // Authentication Section
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Authentication - Sign In Activity',
        left: [cognitoSignInSuccessMetric, cognitoSignInFailureMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Auth Failures (Last Hour)',
        metrics: [cognitoSignInFailureMetric],
        width: 6,
        height: 6,
      }),
      new cloudwatch.AlarmStatusWidget({
        title: 'Authentication Alarms',
        alarms: [authFailureAlarm],
        width: 6,
        height: 6,
      })
    );

    // DynamoDB Section
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'DynamoDB - Read/Write Activity',
        left: [
          dynamoDBTable.metricConsumedReadCapacityUnits(),
          dynamoDBTable.metricConsumedWriteCapacityUnits(),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB - Errors',
        left: [dynamoReadThrottleMetric, dynamoWriteThrottleMetric],
        width: 12,
        height: 6,
      })
    );

    // S3 Section
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'S3 - Request Activity',
        left: [s3RequestMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'S3 - Errors',
        left: [s34xxErrorMetric, s35xxErrorMetric],
        width: 12,
        height: 6,
      })
    );

    // === Reimagine Metrics ===
    const reimagineUploadMetric = new cloudwatch.Metric({
      namespace: 'BayonCoAgent/Reimagine',
      metricName: 'ImageUploads',
      dimensionsMap: {
        Environment: environment,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const reimagineEditMetric = new cloudwatch.Metric({
      namespace: 'BayonCoAgent/Reimagine',
      metricName: 'EditOperations',
      dimensionsMap: {
        Environment: environment,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    const reimagineProcessingTimeMetric = new cloudwatch.Metric({
      namespace: 'BayonCoAgent/Reimagine',
      metricName: 'EditProcessingTime',
      dimensionsMap: {
        Environment: environment,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // Bedrock Section
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Bedrock - Invocations by Model',
        left: [bedrockInvocationMetric, bedrockTitanInvocationMetric, bedrockSDXLInvocationMetric],
        width: 8,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Bedrock - Throttles',
        left: [bedrockThrottleMetric],
        width: 8,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Bedrock - Latency',
        left: [bedrockLatencyMetric],
        width: 8,
        height: 6,
      })
    );

    // Reimagine Section
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Reimagine - Upload Activity',
        left: [reimagineUploadMetric],
        width: 8,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Reimagine - Edit Operations',
        left: [reimagineEditMetric],
        width: 8,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Reimagine - Processing Time',
        left: [reimagineProcessingTimeMetric],
        width: 8,
        height: 6,
      })
    );

    // Alarm Summary
    this.dashboard.addWidgets(
      new cloudwatch.AlarmStatusWidget({
        title: 'All Alarms',
        alarms: [
          authFailureAlarm,
          dynamoThrottleAlarm,
          s3ErrorAlarm,
          bedrockThrottleAlarm,
          bedrockLatencyAlarm,
        ],
        width: 24,
        height: 6,
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `${environment}-DashboardURL`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
      description: 'SNS Topic ARN for Alarms',
      exportName: `${environment}-AlarmTopicArn`,
    });
  }
}
