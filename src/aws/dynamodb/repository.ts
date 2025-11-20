/**
 * DynamoDB Repository
 * 
 * Provides CRUD operations for DynamoDB using the single-table design pattern.
 * All operations use the DynamoDB Document Client for simplified JSON handling.
 * Includes error handling and automatic retry logic for transient failures.
 */

import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  BatchGetCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { getDocumentClient, getTableName } from './client';
import {
  DynamoDBItem,
  DynamoDBKey,
  EntityType,
  QueryOptions,
  QueryResult,
  BatchResult,
  UpdateOptions,
} from './types';
import { wrapDynamoDBError } from './errors';
import { withRetry, withBatchRetry, RetryOptions } from './retry';

/**
 * DynamoDB Repository class
 * Provides type-safe CRUD operations for DynamoDB with error handling and retry logic
 */
export class DynamoDBRepository {
  private readonly tableName: string;
  private readonly retryOptions: RetryOptions;

  constructor(retryOptions: RetryOptions = {}) {
    this.tableName = getTableName();
    this.retryOptions = retryOptions;
  }

  /**
   * Gets a single item by its primary key
   * @param pk Partition key
   * @param sk Sort key
   * @returns The item data or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async get<T>(pk: string, sk: string): Promise<T | null> {
    try {
      return await withRetry(async () => {
        const client = getDocumentClient();

        const command = new GetCommand({
          TableName: this.tableName,
          Key: { PK: pk, SK: sk },
        });

        const response = await client.send(command);

        if (!response.Item) {
          return null;
        }

        const item = response.Item as DynamoDBItem<T>;
        return item.Data;
      }, this.retryOptions);
    } catch (error: any) {
      const wrappedError = wrapDynamoDBError(error);
      // If credentials are missing in browser, return null instead of throwing
      if (typeof window !== 'undefined' && wrappedError.message.includes('Credential is missing')) {
        console.warn('DynamoDB operation skipped: credentials not configured for browser');
        return null;
      }
      throw wrappedError;
    }
  }

  /**
   * Gets a single item with full metadata
   * @param pk Partition key
   * @param sk Sort key
   * @returns The full DynamoDB item or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getItem<T>(pk: string, sk: string): Promise<DynamoDBItem<T> | null> {
    try {
      return await withRetry(async () => {
        const client = getDocumentClient();

        const command = new GetCommand({
          TableName: this.tableName,
          Key: { PK: pk, SK: sk },
        });

        const response = await client.send(command);

        if (!response.Item) {
          return null;
        }

        return response.Item as DynamoDBItem<T>;
      }, this.retryOptions);
    } catch (error: any) {
      throw wrapDynamoDBError(error);
    }
  }

  /**
   * Queries items by partition key with optional sort key prefix
   * @param pk Partition key
   * @param skPrefix Optional sort key prefix for filtering
   * @param options Query options (limit, pagination, etc.)
   * @returns Query result with items and pagination info
   * @throws DynamoDBError if the operation fails
   */
  async query<T>(
    pk: string,
    skPrefix?: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    try {
      return await withRetry(async () => {
        const client = getDocumentClient();

        let keyConditionExpression = 'PK = :pk';
        const expressionAttributeValues: Record<string, any> = {
          ':pk': pk,
        };

        if (skPrefix) {
          keyConditionExpression += ' AND begins_with(SK, :skPrefix)';
          expressionAttributeValues[':skPrefix'] = skPrefix;
        }

        const command = new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: keyConditionExpression,
          ExpressionAttributeValues: {
            ...expressionAttributeValues,
            ...options.expressionAttributeValues,
          },
          ExpressionAttributeNames: options.expressionAttributeNames,
          FilterExpression: options.filterExpression,
          Limit: options.limit,
          ExclusiveStartKey: options.exclusiveStartKey,
          ScanIndexForward: options.scanIndexForward ?? true,
        });

        const response = await client.send(command);

        const items = (response.Items || []) as DynamoDBItem<T>[];
        const data = items.map((item) => item.Data);

        return {
          items: data,
          lastEvaluatedKey: response.LastEvaluatedKey as DynamoDBKey | undefined,
          count: response.Count || 0,
        };
      }, this.retryOptions);
    } catch (error: any) {
      throw wrapDynamoDBError(error);
    }
  }

  /**
   * Queries items with full metadata
   * @param pk Partition key
   * @param skPrefix Optional sort key prefix for filtering
   * @param options Query options
   * @returns Query result with full DynamoDB items
   * @throws DynamoDBError if the operation fails
   */
  async queryItems<T>(
    pk: string,
    skPrefix?: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<DynamoDBItem<T>>> {
    try {
      return await withRetry(async () => {
        const client = getDocumentClient();

        let keyConditionExpression = 'PK = :pk';
        const expressionAttributeValues: Record<string, any> = {
          ':pk': pk,
        };

        if (skPrefix) {
          keyConditionExpression += ' AND begins_with(SK, :skPrefix)';
          expressionAttributeValues[':skPrefix'] = skPrefix;
        }

        const command = new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: keyConditionExpression,
          ExpressionAttributeValues: {
            ...expressionAttributeValues,
            ...options.expressionAttributeValues,
          },
          ExpressionAttributeNames: options.expressionAttributeNames,
          FilterExpression: options.filterExpression,
          Limit: options.limit,
          ExclusiveStartKey: options.exclusiveStartKey,
          ScanIndexForward: options.scanIndexForward ?? true,
        });

        const response = await client.send(command);

        return {
          items: (response.Items || []) as DynamoDBItem<T>[],
          lastEvaluatedKey: response.LastEvaluatedKey as DynamoDBKey | undefined,
          count: response.Count || 0,
        };
      }, this.retryOptions);
    } catch (error: any) {
      throw wrapDynamoDBError(error);
    }
  }

  /**
   * Puts (creates or replaces) an item in the table
   * @param item The DynamoDB item to put
   * @throws DynamoDBError if the operation fails
   */
  async put<T>(item: DynamoDBItem<T>): Promise<void> {
    try {
      await withRetry(async () => {
        const client = getDocumentClient();

        const command = new PutCommand({
          TableName: this.tableName,
          Item: item,
        });

        await client.send(command);
      }, this.retryOptions);
    } catch (error: any) {
      throw wrapDynamoDBError(error);
    }
  }

  /**
   * Creates a new item with automatic timestamps
   * @param pk Partition key
   * @param sk Sort key
   * @param entityType Entity type
   * @param data The data to store
   * @param gsi Optional GSI keys
   * @returns The created DynamoDB item
   * @throws DynamoDBError if the operation fails
   */
  async create<T>(
    pk: string,
    sk: string,
    entityType: EntityType,
    data: T,
    gsi?: { GSI1PK?: string; GSI1SK?: string }
  ): Promise<DynamoDBItem<T>> {
    const now = Date.now();
    const item: DynamoDBItem<T> = {
      PK: pk,
      SK: sk,
      EntityType: entityType,
      Data: data,
      CreatedAt: now,
      UpdatedAt: now,
      ...gsi,
    };

    await this.put(item);
    return item;
  }

  /**
   * Updates an existing item with partial data
   * @param pk Partition key
   * @param sk Sort key
   * @param updates Partial data to update
   * @param options Update options (conditions, etc.)
   * @throws DynamoDBError if the operation fails
   */
  async update<T>(
    pk: string,
    sk: string,
    updates: Partial<T>,
    options: UpdateOptions = {}
  ): Promise<void> {
    try {
      await withRetry(async () => {
        const client = getDocumentClient();

        // Build update expression
        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {
          ...options.expressionAttributeNames,
        };
        const expressionAttributeValues: Record<string, any> = {
          ...options.expressionAttributeValues,
          ':updatedAt': Date.now(),
        };

        // Add UpdatedAt
        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'UpdatedAt';

        // Add each field from updates to the Data object
        Object.entries(updates).forEach(([key, value], index) => {
          const attrName = `#data_${index}`;
          const attrValue = `:data_${index}`;
          updateExpressions.push(`#data.${attrName} = ${attrValue}`);
          expressionAttributeNames['#data'] = 'Data';
          expressionAttributeNames[attrName] = key;
          expressionAttributeValues[attrValue] = value;
        });

        const command = new UpdateCommand({
          TableName: this.tableName,
          Key: { PK: pk, SK: sk },
          UpdateExpression: `SET ${updateExpressions.join(', ')}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ConditionExpression: options.conditionExpression,
        });

        await client.send(command);
      }, this.retryOptions);
    } catch (error: any) {
      throw wrapDynamoDBError(error);
    }
  }

  /**
   * Deletes an item from the table
   * @param pk Partition key
   * @param sk Sort key
   * @throws DynamoDBError if the operation fails
   */
  async delete(pk: string, sk: string): Promise<void> {
    try {
      await withRetry(async () => {
        const client = getDocumentClient();

        const command = new DeleteCommand({
          TableName: this.tableName,
          Key: { PK: pk, SK: sk },
        });

        await client.send(command);
      }, this.retryOptions);
    } catch (error: any) {
      throw wrapDynamoDBError(error);
    }
  }

  /**
   * Batch gets multiple items
   * @param keys Array of keys to retrieve
   * @returns Batch result with items
   * @throws DynamoDBError if the operation fails
   */
  async batchGet<T>(keys: DynamoDBKey[]): Promise<BatchResult<T>> {
    try {
      if (keys.length === 0) {
        return { items: [] };
      }

      // DynamoDB limits batch get to 100 items
      const batchSize = 100;
      const batches: DynamoDBKey[][] = [];

      for (let i = 0; i < keys.length; i += batchSize) {
        batches.push(keys.slice(i, i + batchSize));
      }

      const allItems: T[] = [];
      const allUnprocessedKeys: DynamoDBKey[] = [];

      for (const batch of batches) {
        const result = await withBatchRetry<DynamoDBKey, BatchResult<T>>(
          async (keysToGet) => {
            const client = getDocumentClient();
            
            const command = new BatchGetCommand({
              RequestItems: {
                [this.tableName]: {
                  Keys: keysToGet,
                },
              },
            });

            const response = await client.send(command);

            const items: T[] = [];
            if (response.Responses?.[this.tableName]) {
              const dynamoItems = response.Responses[this.tableName] as DynamoDBItem<T>[];
              items.push(...dynamoItems.map((item) => item.Data));
            }

            const unprocessedKeys: DynamoDBKey[] = [];
            if (response.UnprocessedKeys?.[this.tableName]?.Keys) {
              unprocessedKeys.push(
                ...(response.UnprocessedKeys[this.tableName].Keys as DynamoDBKey[])
              );
            }

            return {
              items,
              unprocessedKeys: unprocessedKeys.length > 0 ? unprocessedKeys : undefined,
            };
          },
          (result) => result.unprocessedKeys,
          batch,
          this.retryOptions,
          // Merge function to accumulate items across retries
          (accumulated, newResult) => ({
            items: [...accumulated.items, ...newResult.items],
            unprocessedKeys: newResult.unprocessedKeys,
          })
        );

        allItems.push(...result.items);
        if (result.unprocessedKeys) {
          allUnprocessedKeys.push(...result.unprocessedKeys);
        }
      }

      return {
        items: allItems,
        unprocessedKeys: allUnprocessedKeys.length > 0 ? allUnprocessedKeys : undefined,
      };
    } catch (error: any) {
      throw wrapDynamoDBError(error);
    }
  }

  /**
   * Batch writes (puts or deletes) multiple items
   * @param puts Items to put
   * @param deletes Keys to delete
   * @throws DynamoDBError if the operation fails
   */
  async batchWrite<T>(
    puts: DynamoDBItem<T>[] = [],
    deletes: DynamoDBKey[] = []
  ): Promise<void> {
    try {
      if (puts.length === 0 && deletes.length === 0) {
        return;
      }

      // DynamoDB limits batch write to 25 items
      const batchSize = 25;
      const allRequests = [
        ...puts.map((item) => ({ PutRequest: { Item: item } })),
        ...deletes.map((key) => ({ DeleteRequest: { Key: key } })),
      ];

      type WriteRequest = { PutRequest?: { Item: any }; DeleteRequest?: { Key: any } };

      for (let i = 0; i < allRequests.length; i += batchSize) {
        const batch = allRequests.slice(i, i + batchSize);

        await withBatchRetry<WriteRequest, { unprocessedItems?: WriteRequest[] }>(
          async (requests) => {
            const client = getDocumentClient();
            
            const command = new BatchWriteCommand({
              RequestItems: {
                [this.tableName]: requests,
              },
            });

            const response = await client.send(command);

            const unprocessedItems: WriteRequest[] = [];
            if (response.UnprocessedItems?.[this.tableName]) {
              unprocessedItems.push(...response.UnprocessedItems[this.tableName]);
            }

            return {
              unprocessedItems: unprocessedItems.length > 0 ? unprocessedItems : undefined,
            };
          },
          (result) => result.unprocessedItems,
          batch,
          this.retryOptions
        );
      }
    } catch (error: any) {
      throw wrapDynamoDBError(error);
    }
  }

  /**
   * Saves image metadata for Reimagine toolkit
   * @param userId User ID
   * @param imageId Image ID
   * @param metadata Image metadata
   * @throws DynamoDBError if the operation fails
   */
  async saveImageMetadata(
    userId: string,
    imageId: string,
    metadata: {
      originalKey: string;
      fileName: string;
      fileSize: number;
      contentType: string;
      width: number;
      height: number;
      uploadedAt: string;
      suggestions?: any[];
    }
  ): Promise<void> {
    const { getImageMetadataKeys } = await import('./keys');
    const keys = getImageMetadataKeys(userId, imageId);

    const item = {
      ...keys,
      EntityType: 'ImageMetadata' as const,
      Data: {
        imageId,
        userId,
        ...metadata,
      },
      CreatedAt: Date.now(),
      UpdatedAt: Date.now(),
    };

    await this.put(item);
  }

  /**
   * Gets image metadata by ID
   * @param userId User ID
   * @param imageId Image ID
   * @returns Image metadata or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getImageMetadata(
    userId: string,
    imageId: string
  ): Promise<any | null> {
    const { getImageMetadataKeys } = await import('./keys');
    const keys = getImageMetadataKeys(userId, imageId);
    return this.get(keys.PK, keys.SK);
  }

  /**
   * Updates image suggestions for Reimagine toolkit
   * @param userId User ID
   * @param imageId Image ID
   * @param suggestions New suggestions array
   * @throws DynamoDBError if the operation fails
   */
  async updateImageSuggestions(
    userId: string,
    imageId: string,
    suggestions: any[]
  ): Promise<void> {
    const { getImageMetadataKeys } = await import('./keys');
    const keys = getImageMetadataKeys(userId, imageId);
    await this.update(keys.PK, keys.SK, { suggestions });
  }

  /**
   * Saves an edit record for Reimagine toolkit
   * @param userId User ID
   * @param editId Edit ID
   * @param record Edit record data
   * @throws DynamoDBError if the operation fails
   */
  async saveEditRecord(
    userId: string,
    editId: string,
    record: {
      imageId: string;
      editType: string;
      params: any;
      sourceKey: string;
      resultKey: string;
      status: 'pending' | 'processing' | 'completed' | 'failed' | 'preview';
      createdAt: string;
      completedAt?: string;
      error?: string;
      modelId?: string;
      processingTime?: number;
      parentEditId?: string;
    }
  ): Promise<void> {
    const { getEditRecordKeys } = await import('./keys');
    const keys = getEditRecordKeys(userId, editId);

    const item = {
      ...keys,
      EntityType: 'EditRecord' as const,
      Data: {
        editId,
        userId,
        ...record,
      },
      CreatedAt: Date.now(),
      UpdatedAt: Date.now(),
    };

    await this.put(item);
  }

  /**
   * Gets edit history for a user with pagination
   * @param userId User ID
   * @param limit Maximum number of items to return (default: 50)
   * @param exclusiveStartKey Pagination token
   * @returns Query result with edit records
   * @throws DynamoDBError if the operation fails
   */
  async getEditHistory(
    userId: string,
    limit: number = 50,
    exclusiveStartKey?: DynamoDBKey
  ): Promise<QueryResult<any>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'EDIT#';

    return this.query(pk, skPrefix, {
      limit,
      exclusiveStartKey,
      scanIndexForward: false, // Most recent first
    });
  }

  /**
   * Deletes an edit record
   * @param userId User ID
   * @param editId Edit ID
   * @throws DynamoDBError if the operation fails
   */
  async deleteEdit(userId: string, editId: string): Promise<void> {
    const { getEditRecordKeys } = await import('./keys');
    const keys = getEditRecordKeys(userId, editId);
    await this.delete(keys.PK, keys.SK);
  }

  /**
   * Updates an edit record status
   * @param userId User ID
   * @param editId Edit ID
   * @param status New status
   * @param additionalUpdates Additional fields to update
   * @throws DynamoDBError if the operation fails
   */
  async updateEditStatus(
    userId: string,
    editId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'preview',
    additionalUpdates?: {
      completedAt?: string;
      error?: string;
      processingTime?: number;
    }
  ): Promise<void> {
    const { getEditRecordKeys } = await import('./keys');
    const keys = getEditRecordKeys(userId, editId);

    const updates: any = { status, ...additionalUpdates };
    await this.update(keys.PK, keys.SK, updates);
  }
}

// Export a singleton instance
let repositoryInstance: DynamoDBRepository | null = null;

/**
 * Gets the singleton repository instance
 */
export function getRepository(): DynamoDBRepository {
  if (!repositoryInstance) {
    repositoryInstance = new DynamoDBRepository();
  }
  return repositoryInstance;
}

/**
 * Resets the repository singleton
 * Useful for testing
 */
export function resetRepository(): void {
  repositoryInstance = null;
}
