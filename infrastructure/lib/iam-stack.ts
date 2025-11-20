import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface IAMStackProps extends cdk.StackProps {
  environment: string;
  userPool: cognito.UserPool;
  dynamoDBTable: dynamodb.Table;
  storageBucket: s3.Bucket;
}

export class IAMStack extends cdk.Stack {
  public readonly applicationRole: iam.Role;
  public readonly bedrockAccessRole: iam.Role;

  constructor(scope: Construct, id: string, props: IAMStackProps) {
    super(scope, id, props);

    const { environment, userPool, dynamoDBTable, storageBucket } = props;

    // Create role for Next.js application (Lambda or ECS)
    this.applicationRole = new iam.Role(this, 'ApplicationRole', {
      roleName: `bayon-coagent-app-${environment}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        new iam.ServicePrincipal('amplify.amazonaws.com')
      ),
      description: 'Role for Bayon CoAgent application',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant Cognito permissions
    this.applicationRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:AdminGetUser',
        'cognito-idp:AdminCreateUser',
        'cognito-idp:AdminUpdateUserAttributes',
        'cognito-idp:AdminDeleteUser',
        'cognito-idp:ListUsers',
      ],
      resources: [userPool.userPoolArn],
    }));

    // Grant DynamoDB permissions
    dynamoDBTable.grantReadWriteData(this.applicationRole);
    dynamoDBTable.grant(this.applicationRole, 'dynamodb:DescribeStream', 'dynamodb:GetRecords', 'dynamodb:GetShardIterator', 'dynamodb:ListStreams');

    // Grant S3 permissions
    storageBucket.grantReadWrite(this.applicationRole);
    this.applicationRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:ListBucket',
      ],
      resources: [
        storageBucket.bucketArn,
        `${storageBucket.bucketArn}/*`,
      ],
    }));

    // Grant CloudWatch Logs permissions
    this.applicationRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams',
      ],
      resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/bayon-coagent/*`],
    }));

    // Create role for Bedrock access
    this.bedrockAccessRole = new iam.Role(this, 'BedrockAccessRole', {
      roleName: `bayon-coagent-bedrock-${environment}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        new iam.ArnPrincipal(this.applicationRole.roleArn)
      ),
      description: 'Role for accessing AWS Bedrock',
    });

    // Grant Bedrock permissions
    this.bedrockAccessRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
        'bedrock:ListFoundationModels',
        'bedrock:GetFoundationModel',
      ],
      resources: [
        `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0`,
        `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-*`,
        `arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-image-generator-v1`,
        `arn:aws:bedrock:${this.region}::foundation-model/amazon.titan-*`,
        `arn:aws:bedrock:${this.region}::foundation-model/stability.stable-diffusion-xl-v1`,
      ],
    }));

    // Allow application role to assume Bedrock role
    this.applicationRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sts:AssumeRole'],
      resources: [this.bedrockAccessRole.roleArn],
    }));

    // Create policy for user-scoped access (for authenticated users via Cognito)
    const userScopedPolicy = new iam.ManagedPolicy(this, 'UserScopedPolicy', {
      managedPolicyName: `bayon-coagent-user-scoped-${environment}`,
      description: 'Policy for user-scoped access to resources',
      statements: [
        // DynamoDB - users can only access their own data
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
            'dynamodb:DeleteItem',
            'dynamodb:Query',
          ],
          resources: [dynamoDBTable.tableArn],
          conditions: {
            'ForAllValues:StringLike': {
              'dynamodb:LeadingKeys': ['USER#${cognito-identity.amazonaws.com:sub}'],
            },
          },
        }),
        // S3 - users can only access their own files
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
          ],
          resources: [`${storageBucket.bucketArn}/users/\${cognito-identity.amazonaws.com:sub}/*`],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:ListBucket'],
          resources: [storageBucket.bucketArn],
          conditions: {
            StringLike: {
              's3:prefix': ['users/${cognito-identity.amazonaws.com:sub}/*'],
            },
          },
        }),
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApplicationRoleArn', {
      value: this.applicationRole.roleArn,
      description: 'Application Role ARN',
      exportName: `${environment}-ApplicationRoleArn`,
    });

    new cdk.CfnOutput(this, 'BedrockAccessRoleArn', {
      value: this.bedrockAccessRole.roleArn,
      description: 'Bedrock Access Role ARN',
      exportName: `${environment}-BedrockAccessRoleArn`,
    });

    new cdk.CfnOutput(this, 'UserScopedPolicyArn', {
      value: userScopedPolicy.managedPolicyArn,
      description: 'User Scoped Policy ARN',
      exportName: `${environment}-UserScopedPolicyArn`,
    });
  }
}
