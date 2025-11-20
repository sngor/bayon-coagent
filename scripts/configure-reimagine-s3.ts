#!/usr/bin/env tsx

/**
 * Configure S3 for Reimagine Image Toolkit
 * 
 * This script configures the S3 bucket with the necessary CORS and lifecycle
 * rules for the Reimagine Image Toolkit.
 */

import {
  S3Client,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
  PutBucketLifecycleConfigurationCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import { getConfig } from '../src/aws/config';

async function configureS3() {
  console.log('🔧 Configuring S3 for Reimagine Image Toolkit...\n');

  const config = getConfig();
  const client = new S3Client({
    region: config.region,
    endpoint: config.s3.endpoint,
  });

  const bucketName = config.s3.bucketName;

  try {
    // Configure CORS
    console.log('📝 Configuring CORS rules...');
    
    const corsRules = {
      CORSRules: [
        {
          AllowedOrigins: [
            'http://localhost:3000',
            'https://yourdomain.com', // Update with your production domain
          ],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedHeaders: ['*'],
          ExposedHeaders: [
            'ETag',
            'x-amz-server-side-encryption',
            'x-amz-request-id',
            'x-amz-id-2',
            'Content-Type',
            'Content-Length',
          ],
          MaxAgeSeconds: 3000,
        },
      ],
    };

    await client.send(
      new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: corsRules,
      })
    );

    console.log('✅ CORS rules configured successfully\n');

    // Verify CORS configuration
    const corsResponse = await client.send(
      new GetBucketCorsCommand({
        Bucket: bucketName,
      })
    );

    console.log('📋 Current CORS Configuration:');
    console.log(JSON.stringify(corsResponse.CORSRules, null, 2));
    console.log('');

    // Configure Lifecycle Rules
    console.log('📝 Configuring lifecycle rules...');

    const lifecycleRules = {
      Rules: [
        {
          Id: 'DeleteOldVersions',
          Status: 'Enabled',
          NoncurrentVersionExpiration: {
            NoncurrentDays: 90,
          },
        },
        {
          Id: 'ArchiveOldReimagineEdits',
          Status: 'Enabled',
          Prefix: 'reimagine/edits/',
          Transitions: [
            {
              Days: 90,
              StorageClass: 'STANDARD_IA',
            },
            {
              Days: 180,
              StorageClass: 'GLACIER',
            },
          ],
        },
        {
          Id: 'DeleteReimaginePreviewEdits',
          Status: 'Enabled',
          Prefix: 'reimagine/preview/',
          Expiration: {
            Days: 7,
          },
        },
      ],
    };

    await client.send(
      new PutBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
        LifecycleConfiguration: lifecycleRules,
      })
    );

    console.log('✅ Lifecycle rules configured successfully\n');

    // Verify lifecycle configuration
    const lifecycleResponse = await client.send(
      new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      })
    );

    console.log('📋 Current Lifecycle Configuration:');
    console.log(JSON.stringify(lifecycleResponse.Rules, null, 2));
    console.log('');

    // Summary
    console.log('─'.repeat(60));
    console.log('✅ S3 Configuration Complete!');
    console.log('\n📊 Summary:');
    console.log(`   Bucket: ${bucketName}`);
    console.log(`   Region: ${config.region}`);
    console.log(`   CORS Rules: ${corsRules.CORSRules.length}`);
    console.log(`   Lifecycle Rules: ${lifecycleRules.Rules.length}`);
    console.log('\n📝 Next Steps:');
    console.log('1. Update CORS AllowedOrigins with your production domain');
    console.log('2. Test image upload from your application');
    console.log('3. Verify presigned URLs work correctly');

  } catch (error) {
    console.error('❌ Error configuring S3:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('NoSuchBucket')) {
        console.log('\n📝 Bucket Not Found:');
        console.log(`The bucket "${bucketName}" does not exist.`);
        console.log('Create the bucket first or update S3_BUCKET_NAME in your environment.');
      } else if (error.message.includes('AccessDenied')) {
        console.log('\n📝 Access Denied:');
        console.log('Your AWS credentials do not have permission to configure this bucket.');
        console.log('Required permissions: s3:PutBucketCors, s3:PutBucketLifecycleConfiguration');
      }
    }
    
    process.exit(1);
  }
}

// Run configuration
configureS3();
