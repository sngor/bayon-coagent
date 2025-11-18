import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface DynamoDBStackProps extends cdk.StackProps {
  environment: string;
  enablePointInTimeRecovery?: boolean;
}

export class DynamoDBStack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDBStackProps) {
    super(scope, id, props);

    const { environment, enablePointInTimeRecovery = false } = props;

    // Create single DynamoDB table with single-table design
    this.table = new dynamodb.Table(this, 'BayonCoAgentTable', {
      tableName: `BayonCoAgent-${environment}`,
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: enablePointInTimeRecovery,
      removalPolicy: environment === 'production'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      timeToLiveAttribute: 'TTL',
    });

    // Add Global Secondary Index for alternate access patterns
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'GSI1PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI1SK',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Add GSI for entity type queries
    this.table.addGlobalSecondaryIndex({
      indexName: 'EntityTypeIndex',
      partitionKey: {
        name: 'EntityType',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'CreatedAt',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Add GSI for user-based queries
    this.table.addGlobalSecondaryIndex({
      indexName: 'UserIndex',
      partitionKey: {
        name: 'UserId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'UpdatedAt',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Enable auto-scaling for GSIs if using provisioned billing
    // (Not needed for PAY_PER_REQUEST, but included for reference)

    // Outputs
    new cdk.CfnOutput(this, 'TableName', {
      value: this.table.tableName,
      description: 'DynamoDB Table Name',
      exportName: `${environment}-DynamoDBTableName`,
    });

    new cdk.CfnOutput(this, 'TableArn', {
      value: this.table.tableArn,
      description: 'DynamoDB Table ARN',
      exportName: `${environment}-DynamoDBTableArn`,
    });

    new cdk.CfnOutput(this, 'TableStreamArn', {
      value: this.table.tableStreamArn || '',
      description: 'DynamoDB Table Stream ARN',
      exportName: `${environment}-DynamoDBTableStreamArn`,
    });
  }
}
