/**
 * Stripe EventBridge Integration Stack
 * 
 * Sets up EventBridge to receive Stripe events and route them to Lambda.
 */

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

interface StripeEventBridgeStackProps extends cdk.StackProps {
    environment: 'development' | 'production';
    dynamoDBTableName: string;
}

export class StripeEventBridgeStack extends cdk.Stack {
    public readonly stripeEventBus: events.EventBus;
    public readonly stripeHandlerFunction: lambda.Function;

    constructor(scope: Construct, id: string, props: StripeEventBridgeStackProps) {
        super(scope, id, props);

        const { environment, dynamoDBTableName } = props;

        // Use existing Stripe Partner Event Bus
        // Event bus is created automatically when you connect Stripe to EventBridge
        const stripeEventBusName = process.env.STRIPE_EVENT_BUS_NAME ||
            'aws.partner/stripe.com/ed_test_61ThQU3sr9KLkWPGq16ThPlt3iSQLw25fKzPmC3uK2lk';

        this.stripeEventBus = events.EventBus.fromEventBusName(
            this,
            'StripeEventBus',
            stripeEventBusName
        );

        // Lambda function to process Stripe events
        this.stripeHandlerFunction = new NodejsFunction(this, 'StripeSubscriptionHandler', {
            functionName: `bayon-stripe-subscription-handler-${environment}`,
            entry: path.join(__dirname, '../../src/lambda/stripe-subscription-handler.ts'),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: {
                DYNAMODB_TABLE_NAME: dynamoDBTableName,
                STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
                NODE_ENV: environment,
            },
            bundling: {
                externalModules: ['aws-sdk'],
                minify: true,
                sourceMap: true,
            },
        });

        // Grant DynamoDB permissions
        this.stripeHandlerFunction.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:Query',
                ],
                resources: [
                    `arn:aws:dynamodb:${this.region}:${this.account}:table/${dynamoDBTableName}`,
                    `arn:aws:dynamodb:${this.region}:${this.account}:table/${dynamoDBTableName}/index/*`,
                ],
            })
        );

        // CloudWatch Logs
        new logs.LogGroup(this, 'StripeHandlerLogGroup', {
            logGroupName: `/aws/lambda/${this.stripeHandlerFunction.functionName}`,
            retention: logs.RetentionDays.ONE_MONTH,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // EventBridge Rule to route Stripe events to Lambda
        const stripeEventRule = new events.Rule(this, 'StripeEventRule', {
            eventBus: this.stripeEventBus,
            ruleName: `bayon-stripe-subscription-events-${environment}`,
            description: 'Routes Stripe subscription events to Lambda handler',
            eventPattern: {
                source: ['aws.partner/stripe.com'],
                detailType: ['Stripe Event'],
                detail: {
                    type: [
                        'customer.subscription.created',
                        'customer.subscription.updated',
                        'customer.subscription.deleted',
                        'invoice.payment_succeeded',
                        'invoice.payment_failed',
                    ],
                },
            },
        });

        // Add Lambda as target
        stripeEventRule.addTarget(
            new targets.LambdaFunction(this.stripeHandlerFunction, {
                retryAttempts: 3,
                maxEventAge: cdk.Duration.hours(2),
            })
        );

        // Dead Letter Queue for failed events
        const dlqQueue = new cdk.aws_sqs.Queue(this, 'StripeEventDLQ', {
            queueName: `bayon-stripe-events-dlq-${environment}`,
            retentionPeriod: cdk.Duration.days(14),
        });

        stripeEventRule.addTarget(
            new targets.SqsQueue(dlqQueue, {
                retryAttempts: 0,
            })
        );

        // CloudWatch Alarm for DLQ
        const dlqAlarm = new cdk.aws_cloudwatch.Alarm(this, 'StripeEventDLQAlarm', {
            alarmName: `bayon-stripe-events-dlq-alarm-${environment}`,
            metric: dlqQueue.metricApproximateNumberOfMessagesVisible(),
            threshold: 1,
            evaluationPeriods: 1,
            comparisonOperator: cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
        });

        // Outputs
        new cdk.CfnOutput(this, 'EventBusName', {
            value: this.stripeEventBus.eventBusName,
            description: 'Stripe EventBridge Event Bus Name',
            exportName: `bayon-stripe-eventbus-${environment}`,
        });

        new cdk.CfnOutput(this, 'EventBusArn', {
            value: this.stripeEventBus.eventBusArn,
            description: 'Stripe EventBridge Event Bus ARN',
            exportName: `bayon-stripe-eventbus-arn-${environment}`,
        });

        new cdk.CfnOutput(this, 'HandlerFunctionName', {
            value: this.stripeHandlerFunction.functionName,
            description: 'Stripe Subscription Handler Lambda Function Name',
        });

        new cdk.CfnOutput(this, 'DLQUrl', {
            value: dlqQueue.queueUrl,
            description: 'Dead Letter Queue URL for failed Stripe events',
        });
    }
}
