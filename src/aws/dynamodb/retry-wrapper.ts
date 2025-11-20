/**
 * DynamoDB Retry Wrapper
 * 
 * Provides retry logic for DynamoDB operations with exponential backoff.
 * Wraps common DynamoDB operations to handle transient failures.
 * 
 * Validates: Requirements 4.5
 */

import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  type GetCommandInput,
  type PutCommandInput,
  type UpdateCommandInput,
  type DeleteCommandInput,
  type QueryCommandInput,
  type ScanCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { getDocumentClient } from './client';
import { retryDynamoDBOperation } from '@/aws/bedrock/retry-utils';
import { createProfileLogger } from '@/aws/bedrock/kiro-logger';

const logger = createProfileLogger();

// ============================================================================
// Retry-wrapped DynamoDB Operations
// ============================================================================

/**
 * Get item with retry logic
 */
export async function getItemWithRetry<T = any>(
  input: GetCommandInput
): Promise<T | null> {
  return retryDynamoDBOperation(
    async () => {
      const client = getDocumentClient();
      const command = new GetCommand(input);
      const response = await client.send(command);
      return (response.Item as T) || null;
    },
    `GetItem ${input.TableName}`,
    logger
  );
}

/**
 * Put item with retry logic
 */
export async function putItemWithRetry(
  input: PutCommandInput
): Promise<void> {
  return retryDynamoDBOperation(
    async () => {
      const client = getDocumentClient();
      const command = new PutCommand(input);
      await client.send(command);
    },
    `PutItem ${input.TableName}`,
    logger
  );
}

/**
 * Update item with retry logic
 */
export async function updateItemWithRetry(
  input: UpdateCommandInput
): Promise<any> {
  return retryDynamoDBOperation(
    async () => {
      const client = getDocumentClient();
      const command = new UpdateCommand(input);
      const response = await client.send(command);
      return response.Attributes;
    },
    `UpdateItem ${input.TableName}`,
    logger
  );
}

/**
 * Delete item with retry logic
 */
export async function deleteItemWithRetry(
  input: DeleteCommandInput
): Promise<void> {
  return retryDynamoDBOperation(
    async () => {
      const client = getDocumentClient();
      const command = new DeleteCommand(input);
      await client.send(command);
    },
    `DeleteItem ${input.TableName}`,
    logger
  );
}

/**
 * Query with retry logic
 */
export async function queryWithRetry<T = any>(
  input: QueryCommandInput
): Promise<T[]> {
  return retryDynamoDBOperation(
    async () => {
      const client = getDocumentClient();
      const command = new QueryCommand(input);
      const response = await client.send(command);
      return (response.Items as T[]) || [];
    },
    `Query ${input.TableName}`,
    logger
  );
}

/**
 * Scan with retry logic
 */
export async function scanWithRetry<T = any>(
  input: ScanCommandInput
): Promise<T[]> {
  return retryDynamoDBOperation(
    async () => {
      const client = getDocumentClient();
      const command = new ScanCommand(input);
      const response = await client.send(command);
      return (response.Items as T[]) || [];
    },
    `Scan ${input.TableName}`,
    logger
  );
}

// ============================================================================
// Batch Operations with Retry
// ============================================================================

/**
 * Batch get items with retry logic
 * Handles pagination automatically
 */
export async function batchGetItemsWithRetry<T = any>(
  tableName: string,
  keys: Record<string, any>[]
): Promise<T[]> {
  return retryDynamoDBOperation(
    async () => {
      const client = getDocumentClient();
      const results: T[] = [];

      // DynamoDB batch get has a limit of 100 items
      const batchSize = 100;
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        
        const command = new GetCommand({
          RequestItems: {
            [tableName]: {
              Keys: batch,
            },
          },
        } as any);

        const response = await client.send(command);
        if (response.Item) {
          results.push(response.Item as T);
        }
      }

      return results;
    },
    `BatchGetItems ${tableName}`,
    logger
  );
}

/**
 * Query all items with pagination and retry logic
 * Automatically handles pagination to retrieve all matching items
 */
export async function queryAllWithRetry<T = any>(
  input: QueryCommandInput
): Promise<T[]> {
  return retryDynamoDBOperation(
    async () => {
      const client = getDocumentClient();
      const results: T[] = [];
      let lastEvaluatedKey: Record<string, any> | undefined;

      do {
        const command = new QueryCommand({
          ...input,
          ExclusiveStartKey: lastEvaluatedKey,
        });

        const response = await client.send(command);
        
        if (response.Items) {
          results.push(...(response.Items as T[]));
        }

        lastEvaluatedKey = response.LastEvaluatedKey;
      } while (lastEvaluatedKey);

      return results;
    },
    `QueryAll ${input.TableName}`,
    logger
  );
}

/**
 * Scan all items with pagination and retry logic
 * Automatically handles pagination to retrieve all items
 * WARNING: Use sparingly as scans are expensive
 */
export async function scanAllWithRetry<T = any>(
  input: ScanCommandInput
): Promise<T[]> {
  return retryDynamoDBOperation(
    async () => {
      const client = getDocumentClient();
      const results: T[] = [];
      let lastEvaluatedKey: Record<string, any> | undefined;

      do {
        const command = new ScanCommand({
          ...input,
          ExclusiveStartKey: lastEvaluatedKey,
        });

        const response = await client.send(command);
        
        if (response.Items) {
          results.push(...(response.Items as T[]));
        }

        lastEvaluatedKey = response.LastEvaluatedKey;
      } while (lastEvaluatedKey);

      return results;
    },
    `ScanAll ${input.TableName}`,
    logger
  );
}

// ============================================================================
// Transactional Operations with Retry
// ============================================================================

/**
 * Execute a transactional write with retry logic
 */
export async function transactWriteWithRetry(
  transactItems: any[]
): Promise<void> {
  return retryDynamoDBOperation(
    async () => {
      const client = getDocumentClient();
      const command = {
        TransactItems: transactItems,
      } as any;

      await client.send(command);
    },
    'TransactWrite',
    logger
  );
}

// ============================================================================
// Conditional Operations with Retry
// ============================================================================

/**
 * Put item with condition and retry logic
 * Useful for optimistic locking
 */
export async function conditionalPutWithRetry(
  input: PutCommandInput,
  conditionExpression: string,
  expressionAttributeValues?: Record<string, any>
): Promise<void> {
  return retryDynamoDBOperation(
    async () => {
      const client = getDocumentClient();
      const command = new PutCommand({
        ...input,
        ConditionExpression: conditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
      });

      await client.send(command);
    },
    `ConditionalPut ${input.TableName}`,
    logger
  );
}

/**
 * Update item with condition and retry logic
 */
export async function conditionalUpdateWithRetry(
  input: UpdateCommandInput,
  conditionExpression: string
): Promise<any> {
  return retryDynamoDBOperation(
    async () => {
      const client = getDocumentClient();
      const command = new UpdateCommand({
        ...input,
        ConditionExpression: conditionExpression,
      });

      const response = await client.send(command);
      return response.Attributes;
    },
    `ConditionalUpdate ${input.TableName}`,
    logger
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if an item exists with retry logic
 */
export async function itemExistsWithRetry(
  tableName: string,
  key: Record<string, any>
): Promise<boolean> {
  return retryDynamoDBOperation(
    async () => {
      const client = getDocumentClient();
      const command = new GetCommand({
        TableName: tableName,
        Key: key,
        ProjectionExpression: 'PK', // Only fetch the key to minimize data transfer
      });

      const response = await client.send(command);
      return !!response.Item;
    },
    `ItemExists ${tableName}`,
    logger
  );
}

/**
 * Count items matching a query with retry logic
 */
export async function countItemsWithRetry(
  input: QueryCommandInput
): Promise<number> {
  return retryDynamoDBOperation(
    async () => {
      const client = getDocumentClient();
      const command = new QueryCommand({
        ...input,
        Select: 'COUNT',
      });

      const response = await client.send(command);
      return response.Count || 0;
    },
    `CountItems ${input.TableName}`,
    logger
  );
}
