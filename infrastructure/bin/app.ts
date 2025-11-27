#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CognitoStack } from '../lib/cognito-stack';
import { DynamoDBStack } from '../lib/dynamodb-stack';
import { S3Stack } from '../lib/s3-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { IAMStack } from '../lib/iam-stack';
import { StripeEventBridgeStack } from '../lib/stripe-eventbridge-stack';

const app = new cdk.App();

// Get environment from context or default to development
const environment = app.node.tryGetContext('environment') || 'development';
const isProd = environment === 'production';

// Define environment-specific configuration
const envConfig = {
  development: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
  },
  production: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
  },
};

const env = envConfig[environment as keyof typeof envConfig] || envConfig.development;

// Stack naming convention
const stackPrefix = `BayonCoAgent-${environment}`;

// Tags to apply to all resources
const tags = {
  Environment: environment,
  Application: 'BayonCoAgent',
  ManagedBy: 'CDK',
};

// Create Cognito Stack
const cognitoStack = new CognitoStack(app, `${stackPrefix}-Cognito`, {
  env,
  description: `Cognito User Pool and Identity Pool for Bayon CoAgent (${environment})`,
  stackName: `${stackPrefix}-Cognito`,
  tags,
  environment,
});

// Create DynamoDB Stack
const dynamoDBStack = new DynamoDBStack(app, `${stackPrefix}-DynamoDB`, {
  env,
  description: `DynamoDB table for Bayon CoAgent (${environment})`,
  stackName: `${stackPrefix}-DynamoDB`,
  tags,
  environment,
  enablePointInTimeRecovery: isProd,
});

// Create S3 Stack
const s3Stack = new S3Stack(app, `${stackPrefix}-S3`, {
  env,
  description: `S3 buckets for Bayon CoAgent (${environment})`,
  stackName: `${stackPrefix}-S3`,
  tags,
  environment,
});

// Create IAM Stack (depends on other stacks)
const iamStack = new IAMStack(app, `${stackPrefix}-IAM`, {
  env,
  description: `IAM roles and policies for Bayon CoAgent (${environment})`,
  stackName: `${stackPrefix}-IAM`,
  tags,
  environment,
  userPool: cognitoStack.userPool,
  dynamoDBTable: dynamoDBStack.table,
  storageBucket: s3Stack.storageBucket,
});

// Create Monitoring Stack (depends on other stacks)
const monitoringStack = new MonitoringStack(app, `${stackPrefix}-Monitoring`, {
  env,
  description: `CloudWatch monitoring and alarms for Bayon CoAgent (${environment})`,
  stackName: `${stackPrefix}-Monitoring`,
  tags,
  environment,
  userPool: cognitoStack.userPool,
  dynamoDBTable: dynamoDBStack.table,
  storageBucket: s3Stack.storageBucket,
});

// Create Stripe EventBridge Stack
const stripeStack = new StripeEventBridgeStack(app, `${stackPrefix}-Stripe`, {
  env,
  description: `Stripe EventBridge integration for Bayon CoAgent (${environment})`,
  stackName: `${stackPrefix}-Stripe`,
  tags,
  environment,
  dynamoDBTableName: dynamoDBStack.table.tableName,
});

// Add dependencies
iamStack.addDependency(cognitoStack);
iamStack.addDependency(dynamoDBStack);
iamStack.addDependency(s3Stack);
monitoringStack.addDependency(cognitoStack);
monitoringStack.addDependency(dynamoDBStack);
monitoringStack.addDependency(s3Stack);
stripeStack.addDependency(dynamoDBStack);

app.synth();
