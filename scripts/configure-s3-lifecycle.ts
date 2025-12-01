#!/usr/bin/env tsx

/**
 * Configure S3 Lifecycle Rules for Reimagine Image Toolkit
 * 
 * This script configures S3 lifecycle rules to:
 * - Archive old edits to Glacier after 90 days
 * - Delete preview edits (not accepted) after 7 days
 * - Optimize storage costs for the Reimagine feature
 * 
 * Requirements: Performance considerations
 * 
 * Usage:
 *   tsx scripts/configure-s3-lifecycle.ts
 */

import {
  S3Client,
  PutBucketLifecycleConfigurationCommand,
  GetBucketLifecycleConfigurationCommand,
  type LifecycleRule,
} from '@aws-sdk/client-s3';
import { getConfig, getAWSCredentials } from '../src/aws/config';

async function configureLifecycleRules() {
  console.log('🔧 Configuring S3 Lifecycle Rules for Reimagine...\n');

  const config = getConfig();
  const credentials = getAWSCredentials();

  // Create S3 client
  const s3Client = new S3Client({
    region: config.region,
    endpoint: config.s3.endpoint,
    credentials: credentials.accessKeyId && credentials.secretAccessKey
      ? {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      }
      : undefined,
    forcePathStyle: config.environment === 'local',
  });

  // Define lifecycle rules
  const lifecycleRules: LifecycleRule[] = [
    {
      ID: 'reimagine-archive-old-edits',
      Status: 'Enabled' as const,
      Filter: {
        Prefix: 'users/',
        Tag: {
          Key: 'feature',
          Value: 'reimagine',
        },
      },
      Transitions: [
        {
          Days: 90,
          StorageClass: 'GLACIER',
        },
      ],
    },
    {
      ID: 'reimagine-delete-preview-edits',
      Status: 'Enabled' as const,
      Filter: {
        And: {
          Prefix: 'users/',
          Tags: [
            {
              Key: 'feature',
              Value: 'reimagine',
            },
            {
              Key: 'status',
              Value: 'preview',
            },
          ],
        },
      },
      Expiration: {
        Days: 7,
      },
    },
    {
      ID: 'reimagine-cleanup-incomplete-uploads',
      Status: 'Enabled' as const,
      Filter: {
        Prefix: 'users/',
      },
      AbortIncompleteMultipartUpload: {
        DaysAfterInitiation: 1,
      },
    },
  ];

  try {
    // Check if lifecycle configuration already exists
    try {
      const getCommand = new GetBucketLifecycleConfigurationCommand({
        Bucket: config.s3.bucketName,
      });
      const existingConfig = await s3Client.send(getCommand);

      if (existingConfig.Rules && existingConfig.Rules.length > 0) {
        console.log('⚠️  Existing lifecycle rules found:');
        existingConfig.Rules.forEach((rule) => {
          console.log(`   - ${rule.ID}: ${rule.Status}`);
        });
        console.log('\n📝 Merging with new Reimagine rules...\n');

        // Merge existing rules with new ones (avoid duplicates)
        const existingIds = new Set(existingConfig.Rules.map((r) => r.ID));
        const newRules = lifecycleRules.filter((r) => !existingIds.has(r.ID));
        lifecycleRules.push(...(existingConfig.Rules as LifecycleRule[]));
        lifecycleRules.push(...newRules);
      }
    } catch (error: any) {
      if (error.name === 'NoSuchLifecycleConfiguration') {
        console.log('ℹ️  No existing lifecycle configuration found.\n');
      } else {
        throw error;
      }
    }

    // Apply lifecycle configuration
    const putCommand = new PutBucketLifecycleConfigurationCommand({
      Bucket: config.s3.bucketName,
      LifecycleConfiguration: {
        Rules: lifecycleRules,
      },
    });

    await s3Client.send(putCommand);

    console.log('✅ S3 Lifecycle Rules configured successfully!\n');
    console.log('📋 Applied Rules:');
    lifecycleRules.forEach((rule) => {
      console.log(`\n   ${rule.ID}:`);
      console.log(`   - Status: ${rule.Status}`);
      if (rule.Transitions) {
        rule.Transitions.forEach((t) => {
          console.log(`   - Transition to ${t.StorageClass} after ${t.Days} days`);
        });
      }
      if (rule.Expiration) {
        console.log(`   - Expiration after ${rule.Expiration.Days} days`);
      }
      if (rule.AbortIncompleteMultipartUpload) {
        console.log(
          `   - Abort incomplete uploads after ${rule.AbortIncompleteMultipartUpload.DaysAfterInitiation} day(s)`
        );
      }
    });

    console.log('\n💡 Benefits:');
    console.log('   - Old edits (90+ days) will be archived to Glacier for cost savings');
    console.log('   - Preview edits (not accepted) will be deleted after 7 days');
    console.log('   - Incomplete multipart uploads will be cleaned up after 1 day');
    console.log('   - Reduced storage costs while maintaining access to recent edits\n');

    console.log('⚠️  Note: In LocalStack, lifecycle rules are simulated and may not execute automatically.');
    console.log('   In production AWS, these rules will be enforced by S3 automatically.\n');
  } catch (error) {
    console.error('❌ Error configuring lifecycle rules:', error);

    if (config.environment === 'local') {
      console.log('\n💡 LocalStack may have limited lifecycle support.');
      console.log('   This is expected in local development.');
      console.log('   The configuration will work correctly in production AWS.\n');
    }

    process.exit(1);
  }
}

// Run the configuration
configureLifecycleRules()
  .then(() => {
    console.log('✨ Configuration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
