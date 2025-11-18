import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

export interface S3StackProps extends cdk.StackProps {
  environment: string;
}

export class S3Stack extends cdk.Stack {
  public readonly storageBucket: s3.Bucket;
  public readonly distribution?: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id, props);

    const { environment } = props;
    const isProd = environment === 'production';

    // Create main storage bucket
    this.storageBucket = new s3.Bucket(this, 'StorageBucket', {
      bucketName: `bayon-coagent-storage-${environment}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: isProd,
      removalPolicy: isProd 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
        {
          id: 'TransitionToIA',
          enabled: isProd,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: isProd
            ? ['https://yourdomain.com']
            : ['http://localhost:3000'],
          allowedHeaders: ['*'],
          exposedHeaders: [
            'ETag',
            'x-amz-server-side-encryption',
            'x-amz-request-id',
            'x-amz-id-2',
          ],
          maxAge: 3000,
        },
      ],
    });

    // Create CloudFront distribution for production
    if (isProd) {
      this.distribution = new cloudfront.Distribution(this, 'StorageDistribution', {
        defaultBehavior: {
          origin: new origins.S3Origin(this.storageBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        },
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        enabled: true,
        comment: `Bayon CoAgent Storage Distribution (${environment})`,
      });

      new cdk.CfnOutput(this, 'DistributionDomainName', {
        value: this.distribution.distributionDomainName,
        description: 'CloudFront Distribution Domain Name',
        exportName: `${environment}-DistributionDomainName`,
      });

      new cdk.CfnOutput(this, 'DistributionId', {
        value: this.distribution.distributionId,
        description: 'CloudFront Distribution ID',
        exportName: `${environment}-DistributionId`,
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'StorageBucketName', {
      value: this.storageBucket.bucketName,
      description: 'S3 Storage Bucket Name',
      exportName: `${environment}-StorageBucketName`,
    });

    new cdk.CfnOutput(this, 'StorageBucketArn', {
      value: this.storageBucket.bucketArn,
      description: 'S3 Storage Bucket ARN',
      exportName: `${environment}-StorageBucketArn`,
    });
  }
}
