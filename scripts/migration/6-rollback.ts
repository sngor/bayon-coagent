#!/usr/bin/env tsx

/**
 * Rollback Migration
 * 
 * Deletes all migrated data from DynamoDB and S3
 * USE WITH CAUTION!
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { migrationConfig, validateConfig, logConfig } from './config';
import { ProgressTracker, ErrorLogger } from './utils';
import * as readline from 'readline';

/**
 * Prompt user for confirmation
 */
function promptConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve) => {
    rl.question(`${message} (type 'yes' to confirm): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Initialize DynamoDB client
 */
function initializeDynamoDB(): DynamoDBDocumentClient {
  const client = new DynamoDBClient({
    region: migrationConfig.aws.region,
    endpoint: migrationConfig.aws.dynamodb.endpoint,
    credentials: migrationConfig.aws.accessKeyId ? {
      accessKeyId: migrationConfig.aws.accessKeyId,
      secretAccessKey: migrationConfig.aws.secretAccessKey!,
    } : undefined,
  });
  
  return DynamoDBDocumentClient.from(client);
}

/**
 * Initialize S3 client
 */
function initializeS3(): S3Client {
  return new S3Client({
    region: migrationConfig.aws.region,
    endpoint: migrationConfig.aws.s3.endpoint,
    forcePathStyle: !!migrationConfig.aws.s3.endpoint,
    credentials: migrationConfig.aws.accessKeyId ? {
      accessKeyId: migrationConfig.aws.accessKeyId,
      secretAccessKey: migrationConfig.aws.secretAccessKey!,
    } : undefined,
  });
}

/**
 * Delete all items from DynamoDB
 */
async function deleteDynamoDBItems(
  docClient: DynamoDBDocumentClient,
  errorLogger: ErrorLogger
): Promise<number> {
  console.log('\nScanning DynamoDB table...');
  
  const tableName = migrationConfig.aws.dynamodb.tableName;
  const items: Array<{ PK: string; SK: string }> = [];
  let lastEvaluatedKey: any = undefined;
  
  // Scan all items
  do {
    const result = await docClient.send(new ScanCommand({
      TableName: tableName,
      ProjectionExpression: 'PK, SK',
      ExclusiveStartKey: lastEvaluatedKey,
    }));
    
    if (result.Items) {
      items.push(...result.Items as Array<{ PK: string; SK: string }>);
    }
    
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);
  
  console.log(`Found ${items.length} items to delete`);
  
  if (items.length === 0) {
    return 0;
  }
  
  const progress = new ProgressTracker(items.length, 'Deleting DynamoDB items');
  let deletedCount = 0;
  
  // Delete in batches of 25 (DynamoDB limit)
  const batchSize = 25;
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    try {
      await docClient.send(new BatchWriteCommand({
        RequestItems: {
          [tableName]: batch.map(item => ({
            DeleteRequest: {
              Key: { PK: item.PK, SK: item.SK },
            },
          })),
        },
      }));
      
      deletedCount += batch.length;
      
      for (let j = 0; j < batch.length; j++) {
        progress.increment(true);
      }
    } catch (error) {
      errorLogger.log('delete-dynamodb-batch', error as Error, { batch });
      
      for (let j = 0; j < batch.length; j++) {
        progress.increment(false);
      }
    }
  }
  
  progress.finish();
  return deletedCount;
}

/**
 * Delete all files from S3
 */
async function deleteS3Files(
  s3Client: S3Client,
  errorLogger: ErrorLogger
): Promise<number> {
  console.log('\nListing S3 objects...');
  
  const bucketName = migrationConfig.aws.s3.bucketName;
  const keys: string[] = [];
  let continuationToken: string | undefined;
  
  // List all objects
  do {
    const result = await s3Client.send(new ListObjectsV2Command({
      Bucket: bucketName,
      ContinuationToken: continuationToken,
    }));
    
    if (result.Contents) {
      keys.push(...result.Contents.map(obj => obj.Key!));
    }
    
    continuationToken = result.NextContinuationToken;
  } while (continuationToken);
  
  console.log(`Found ${keys.length} files to delete`);
  
  if (keys.length === 0) {
    return 0;
  }
  
  const progress = new ProgressTracker(keys.length, 'Deleting S3 files');
  let deletedCount = 0;
  
  // Delete in batches of 1000 (S3 limit)
  const batchSize = 1000;
  
  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize);
    
    try {
      await s3Client.send(new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: batch.map(key => ({ Key: key })),
        },
      }));
      
      deletedCount += batch.length;
      
      for (let j = 0; j < batch.length; j++) {
        progress.increment(true);
      }
    } catch (error) {
      errorLogger.log('delete-s3-batch', error as Error, { batch });
      
      for (let j = 0; j < batch.length; j++) {
        progress.increment(false);
      }
    }
  }
  
  progress.finish();
  return deletedCount;
}

/**
 * Main rollback function
 */
async function rollbackMigration(): Promise<void> {
  console.log('\n=== ROLLBACK MIGRATION ===\n');
  console.log('⚠️  WARNING: This will DELETE ALL data from DynamoDB and S3!');
  console.log('⚠️  This action CANNOT be undone!\n');
  
  validateConfig();
  logConfig();
  
  // Require explicit confirmation
  const confirmed = await promptConfirmation(
    'Are you absolutely sure you want to rollback the migration?'
  );
  
  if (!confirmed) {
    console.log('\nRollback cancelled');
    return;
  }
  
  // Double confirmation
  const doubleConfirmed = await promptConfirmation(
    'This is your last chance. Type "yes" again to proceed with deletion'
  );
  
  if (!doubleConfirmed) {
    console.log('\nRollback cancelled');
    return;
  }
  
  const docClient = initializeDynamoDB();
  const s3Client = initializeS3();
  const errorLogger = new ErrorLogger(migrationConfig.paths.errorLog);
  
  // Delete DynamoDB items
  console.log('\n--- Rolling back DynamoDB ---');
  const dynamoDeleted = await deleteDynamoDBItems(docClient, errorLogger);
  
  // Delete S3 files
  console.log('\n--- Rolling back S3 ---');
  const s3Deleted = await deleteS3Files(s3Client, errorLogger);
  
  console.log('\n=== Rollback Complete ===');
  console.log(`DynamoDB items deleted: ${dynamoDeleted}`);
  console.log(`S3 files deleted: ${s3Deleted}`);
  
  if (errorLogger.getErrors().length > 0) {
    console.log(`\n⚠️  ${errorLogger.getErrors().length} errors occurred during rollback`);
    console.log(`See ${migrationConfig.paths.errorLog} for details`);
  }
}

// Run if called directly
if (require.main === module) {
  rollbackMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { rollbackMigration };
