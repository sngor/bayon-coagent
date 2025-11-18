#!/usr/bin/env tsx

/**
 * Import Data to DynamoDB
 * 
 * Imports transformed data into DynamoDB
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { migrationConfig, validateConfig, logConfig } from './config';
import { readJsonFile, ProgressTracker, ErrorLogger, processBatch, retryWithBackoff } from './utils';
import * as path from 'path';
import * as fs from 'fs';

interface DynamoDBItem {
  PK: string;
  SK: string;
  EntityType: string;
  Data: any;
  CreatedAt: number;
  UpdatedAt: number;
  GSI1PK?: string;
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
  
  const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    },
  });
  
  console.log('✓ DynamoDB client initialized');
  return docClient;
}

/**
 * Check if item already exists in DynamoDB
 */
async function itemExists(
  docClient: DynamoDBDocumentClient,
  pk: string,
  sk: string
): Promise<boolean> {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: migrationConfig.aws.dynamodb.tableName,
      Key: { PK: pk, SK: sk },
    }));
    
    return !!result.Item;
  } catch (error) {
    return false;
  }
}

/**
 * Import a batch of items to DynamoDB
 */
async function importBatch(
  docClient: DynamoDBDocumentClient,
  items: DynamoDBItem[],
  errorLogger: ErrorLogger,
  skipExisting: boolean = true
): Promise<number> {
  const tableName = migrationConfig.aws.dynamodb.tableName;
  let successCount = 0;
  
  // Filter out existing items if skipExisting is true
  const itemsToImport: DynamoDBItem[] = [];
  
  if (skipExisting) {
    for (const item of items) {
      const exists = await itemExists(docClient, item.PK, item.SK);
      if (!exists) {
        itemsToImport.push(item);
      }
    }
  } else {
    itemsToImport.push(...items);
  }
  
  if (itemsToImport.length === 0) {
    return 0;
  }
  
  // DynamoDB BatchWrite can handle up to 25 items
  const batchSize = 25;
  
  for (let i = 0; i < itemsToImport.length; i += batchSize) {
    const batch = itemsToImport.slice(i, i + batchSize);
    
    try {
      await retryWithBackoff(async () => {
        const command = new BatchWriteCommand({
          RequestItems: {
            [tableName]: batch.map(item => ({
              PutRequest: {
                Item: item,
              },
            })),
          },
        });
        
        const result = await docClient.send(command);
        
        // Handle unprocessed items
        if (result.UnprocessedItems && result.UnprocessedItems[tableName]) {
          const unprocessed = result.UnprocessedItems[tableName];
          throw new Error(`${unprocessed.length} items were not processed`);
        }
        
        successCount += batch.length;
      });
    } catch (error) {
      errorLogger.log('import-batch', error as Error, { batch: batch.map(i => ({ PK: i.PK, SK: i.SK })) });
    }
  }
  
  return successCount;
}

/**
 * Main import function
 */
async function importData(): Promise<void> {
  console.log('\n=== Importing Data to DynamoDB ===\n');
  
  validateConfig();
  logConfig();
  
  if (migrationConfig.options.dryRun) {
    console.log('⚠️  DRY RUN MODE - No data will be imported\n');
    return;
  }
  
  const transformDir = migrationConfig.paths.transformDir;
  const errorLogger = new ErrorLogger(migrationConfig.paths.errorLog);
  
  // Check if transformed data exists
  const allItemsPath = path.join(transformDir, 'all_items.json');
  if (!fs.existsSync(allItemsPath)) {
    throw new Error('Transformed data not found. Run transform script first.');
  }
  
  const docClient = initializeDynamoDB();
  const allItems: DynamoDBItem[] = readJsonFile(allItemsPath);
  
  console.log(`Found ${allItems.length} items to import\n`);
  
  const progress = new ProgressTracker(allItems.length, 'Importing to DynamoDB');
  let totalImported = 0;
  
  // Process in batches
  const batchSize = migrationConfig.options.batchSize;
  
  for (let i = 0; i < allItems.length; i += batchSize) {
    const batch = allItems.slice(i, i + batchSize);
    const imported = await importBatch(docClient, batch, errorLogger, true);
    totalImported += imported;
    
    for (let j = 0; j < batch.length; j++) {
      progress.increment(true);
    }
  }
  
  progress.finish();
  
  console.log('\n=== Import Complete ===');
  console.log(`Total Items Imported: ${totalImported}/${allItems.length}`);
  console.log(`Skipped (already exist): ${allItems.length - totalImported}`);
  
  if (errorLogger.getErrors().length > 0) {
    console.log(`\n⚠️  ${errorLogger.getErrors().length} errors occurred during import`);
    console.log(`See ${migrationConfig.paths.errorLog} for details`);
  }
}

// Run if called directly
if (require.main === module) {
  importData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { importData };
