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
  ScanCommand,
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
   * Scans the table (use with caution)
   * @param options Scan options
   * @returns Scan result
   */
  async scan<T>(options: QueryOptions = {}): Promise<QueryResult<T>> {
    try {
      return await withRetry(async () => {
        const client = getDocumentClient();

        const command = new ScanCommand({
          TableName: this.tableName,
          FilterExpression: options.filterExpression,
          ExpressionAttributeNames: options.expressionAttributeNames,
          ExpressionAttributeValues: options.expressionAttributeValues,
          Limit: options.limit,
          ExclusiveStartKey: options.exclusiveStartKey,
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

  // ==================== MLS & Social Integration Methods ====================

  /**
   * Creates a new listing
   * @param userId User ID
   * @param listingId Listing ID
   * @param listingData Listing data
   * @returns The created DynamoDB item
   * @throws DynamoDBError if the operation fails
   */
  async createListing<T>(
    userId: string,
    listingId: string,
    listingData: T & { mlsProvider?: string; mlsNumber?: string; status?: string }
  ): Promise<DynamoDBItem<T>> {
    const { getListingKeys } = await import('./keys');
    const keys = getListingKeys(
      userId,
      listingId,
      listingData.mlsProvider,
      listingData.mlsNumber,
      listingData.status
    );

    return this.create(keys.PK, keys.SK, 'Listing', listingData, {
      GSI1PK: keys.GSI1PK,
      GSI1SK: keys.GSI1SK,
    });
  }

  /**
   * Gets a listing by ID
   * @param userId User ID
   * @param listingId Listing ID
   * @returns Listing data or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getListing<T>(userId: string, listingId: string): Promise<T | null> {
    const { getListingKeys } = await import('./keys');
    const keys = getListingKeys(userId, listingId);
    return this.get<T>(keys.PK, keys.SK);
  }

  /**
   * Updates a listing
   * @param userId User ID
   * @param listingId Listing ID
   * @param updates Partial listing data to update
   * @throws DynamoDBError if the operation fails
   */
  async updateListing<T>(
    userId: string,
    listingId: string,
    updates: Partial<T>
  ): Promise<void> {
    const { getListingKeys } = await import('./keys');
    const keys = getListingKeys(userId, listingId);
    await this.update(keys.PK, keys.SK, updates);
  }

  /**
   * Deletes a listing
   * @param userId User ID
   * @param listingId Listing ID
   * @throws DynamoDBError if the operation fails
   */
  async deleteListing(userId: string, listingId: string): Promise<void> {
    const { getListingKeys } = await import('./keys');
    const keys = getListingKeys(userId, listingId);
    await this.delete(keys.PK, keys.SK);
  }

  /**
   * Queries all listings for a user
   * @param userId User ID
   * @param options Query options
   * @returns Query result with listings
   * @throws DynamoDBError if the operation fails
   */
  async queryListings<T>(
    userId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'LISTING#';
    return this.query<T>(pk, skPrefix, options);
  }

  /**
   * Queries listings by MLS number using GSI
   * @param mlsProvider MLS provider
   * @param mlsNumber MLS number
   * @param options Query options
   * @returns Query result with listings
   * @throws DynamoDBError if the operation fails
   */
  async queryListingsByMLSNumber<T>(
    mlsProvider: string,
    mlsNumber: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    try {
      return await withRetry(async () => {
        const client = getDocumentClient();

        const command = new QueryCommand({
          TableName: this.tableName,
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :gsi1pk',
          ExpressionAttributeValues: {
            ':gsi1pk': `MLS#${mlsProvider}#${mlsNumber}`,
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
   * Queries listings by status using GSI
   * @param mlsProvider MLS provider
   * @param mlsNumber MLS number
   * @param status Listing status
   * @param options Query options
   * @returns Query result with listings
   * @throws DynamoDBError if the operation fails
   */
  async queryListingsByStatus<T>(
    mlsProvider: string,
    mlsNumber: string,
    status: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    try {
      return await withRetry(async () => {
        const client = getDocumentClient();

        const command = new QueryCommand({
          TableName: this.tableName,
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk',
          ExpressionAttributeValues: {
            ':gsi1pk': `MLS#${mlsProvider}#${mlsNumber}`,
            ':gsi1sk': `STATUS#${status}`,
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
   * Creates an MLS connection
   * @param userId User ID
   * @param connectionId Connection ID
   * @param connectionData MLS connection data
   * @returns The created DynamoDB item
   * @throws DynamoDBError if the operation fails
   */
  async createMLSConnection<T>(
    userId: string,
    connectionId: string,
    connectionData: T
  ): Promise<DynamoDBItem<T>> {
    const { getMLSConnectionKeys } = await import('./keys');
    const keys = getMLSConnectionKeys(userId, connectionId);
    return this.create(keys.PK, keys.SK, 'MLSConnection', connectionData);
  }

  /**
   * Gets an MLS connection by ID
   * @param userId User ID
   * @param connectionId Connection ID
   * @returns MLS connection data or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getMLSConnection<T>(
    userId: string,
    connectionId: string
  ): Promise<T | null> {
    const { getMLSConnectionKeys } = await import('./keys');
    const keys = getMLSConnectionKeys(userId, connectionId);
    return this.get<T>(keys.PK, keys.SK);
  }

  /**
   * Updates an MLS connection
   * @param userId User ID
   * @param connectionId Connection ID
   * @param updates Partial connection data to update
   * @throws DynamoDBError if the operation fails
   */
  async updateMLSConnection<T>(
    userId: string,
    connectionId: string,
    updates: Partial<T>
  ): Promise<void> {
    const { getMLSConnectionKeys } = await import('./keys');
    const keys = getMLSConnectionKeys(userId, connectionId);
    await this.update(keys.PK, keys.SK, updates);
  }

  /**
   * Deletes an MLS connection
   * @param userId User ID
   * @param connectionId Connection ID
   * @throws DynamoDBError if the operation fails
   */
  async deleteMLSConnection(userId: string, connectionId: string): Promise<void> {
    const { getMLSConnectionKeys } = await import('./keys');
    const keys = getMLSConnectionKeys(userId, connectionId);
    await this.delete(keys.PK, keys.SK);
  }

  /**
   * Queries all MLS connections for a user
   * @param userId User ID
   * @param options Query options
   * @returns Query result with MLS connections
   * @throws DynamoDBError if the operation fails
   */
  async queryMLSConnections<T>(
    userId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'MLS_CONNECTION#';
    return this.query<T>(pk, skPrefix, options);
  }

  /**
   * Creates a social media connection
   * @param userId User ID
   * @param platform Platform name
   * @param connectionData Social connection data
   * @returns The created DynamoDB item
   * @throws DynamoDBError if the operation fails
   */
  async createSocialConnection<T>(
    userId: string,
    platform: string,
    connectionData: T
  ): Promise<DynamoDBItem<T>> {
    const { getSocialConnectionKeys } = await import('./keys');
    const keys = getSocialConnectionKeys(userId, platform);
    return this.create(keys.PK, keys.SK, 'SocialConnection', connectionData);
  }

  /**
   * Gets a social media connection by platform
   * @param userId User ID
   * @param platform Platform name
   * @returns Social connection data or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getSocialConnection<T>(
    userId: string,
    platform: string
  ): Promise<T | null> {
    const { getSocialConnectionKeys } = await import('./keys');
    const keys = getSocialConnectionKeys(userId, platform);
    return this.get<T>(keys.PK, keys.SK);
  }

  /**
   * Updates a social media connection
   * @param userId User ID
   * @param platform Platform name
   * @param updates Partial connection data to update
   * @throws DynamoDBError if the operation fails
   */
  async updateSocialConnection<T>(
    userId: string,
    platform: string,
    updates: Partial<T>
  ): Promise<void> {
    const { getSocialConnectionKeys } = await import('./keys');
    const keys = getSocialConnectionKeys(userId, platform);
    await this.update(keys.PK, keys.SK, updates);
  }

  /**
   * Deletes a social media connection
   * @param userId User ID
   * @param platform Platform name
   * @throws DynamoDBError if the operation fails
   */
  async deleteSocialConnection(userId: string, platform: string): Promise<void> {
    const { getSocialConnectionKeys } = await import('./keys');
    const keys = getSocialConnectionKeys(userId, platform);
    await this.delete(keys.PK, keys.SK);
  }

  /**
   * Queries all social media connections for a user
   * @param userId User ID
   * @param options Query options
   * @returns Query result with social connections
   * @throws DynamoDBError if the operation fails
   */
  async querySocialConnections<T>(
    userId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'SOCIAL#';
    return this.query<T>(pk, skPrefix, options);
  }

  /**
   * Creates a social media post
   * @param userId User ID
   * @param postId Post ID
   * @param postData Social post data
   * @param listingId Optional listing ID for GSI
   * @returns The created DynamoDB item
   * @throws DynamoDBError if the operation fails
   */
  async createSocialPost<T>(
    userId: string,
    postId: string,
    postData: T,
    listingId?: string
  ): Promise<DynamoDBItem<T>> {
    const { getSocialPostKeys } = await import('./keys');
    const keys = getSocialPostKeys(userId, postId, listingId);
    return this.create(keys.PK, keys.SK, 'SocialPost', postData, {
      GSI1PK: keys.GSI1PK,
      GSI1SK: keys.GSI1SK,
    });
  }

  /**
   * Gets a social media post by ID
   * @param userId User ID
   * @param postId Post ID
   * @returns Social post data or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getSocialPost<T>(userId: string, postId: string): Promise<T | null> {
    const { getSocialPostKeys } = await import('./keys');
    const keys = getSocialPostKeys(userId, postId);
    return this.get<T>(keys.PK, keys.SK);
  }

  /**
   * Updates a social media post
   * @param userId User ID
   * @param postId Post ID
   * @param updates Partial post data to update
   * @throws DynamoDBError if the operation fails
   */
  async updateSocialPost<T>(
    userId: string,
    postId: string,
    updates: Partial<T>
  ): Promise<void> {
    const { getSocialPostKeys } = await import('./keys');
    const keys = getSocialPostKeys(userId, postId);
    await this.update(keys.PK, keys.SK, updates);
  }

  /**
   * Deletes a social media post
   * @param userId User ID
   * @param postId Post ID
   * @throws DynamoDBError if the operation fails
   */
  async deleteSocialPost(userId: string, postId: string): Promise<void> {
    const { getSocialPostKeys } = await import('./keys');
    const keys = getSocialPostKeys(userId, postId);
    await this.delete(keys.PK, keys.SK);
  }

  /**
   * Queries all social media posts for a user
   * @param userId User ID
   * @param options Query options
   * @returns Query result with social posts
   * @throws DynamoDBError if the operation fails
   */
  async querySocialPosts<T>(
    userId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'POST#';
    return this.query<T>(pk, skPrefix, options);
  }

  /**
   * Queries social media posts by listing ID using GSI
   * @param listingId Listing ID
   * @param options Query options
   * @returns Query result with social posts
   * @throws DynamoDBError if the operation fails
   */
  async querySocialPostsByListing<T>(
    listingId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    try {
      return await withRetry(async () => {
        const client = getDocumentClient();

        const command = new QueryCommand({
          TableName: this.tableName,
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :gsi1pk',
          ExpressionAttributeValues: {
            ':gsi1pk': `LISTING#${listingId}`,
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
   * Creates or updates performance metrics
   * @param userId User ID
   * @param listingId Listing ID
   * @param date Date in YYYY-MM-DD format
   * @param metricsData Performance metrics data
   * @returns The created DynamoDB item
   * @throws DynamoDBError if the operation fails
   */
  async savePerformanceMetrics<T>(
    userId: string,
    listingId: string,
    date: string,
    metricsData: T
  ): Promise<DynamoDBItem<T>> {
    const { getPerformanceMetricsKeys } = await import('./keys');
    const keys = getPerformanceMetricsKeys(userId, listingId, date);
    return this.create(keys.PK, keys.SK, 'PerformanceMetrics', metricsData);
  }

  /**
   * Gets performance metrics for a specific date
   * @param userId User ID
   * @param listingId Listing ID
   * @param date Date in YYYY-MM-DD format
   * @returns Performance metrics data or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getPerformanceMetrics<T>(
    userId: string,
    listingId: string,
    date: string
  ): Promise<T | null> {
    const { getPerformanceMetricsKeys } = await import('./keys');
    const keys = getPerformanceMetricsKeys(userId, listingId, date);
    return this.get<T>(keys.PK, keys.SK);
  }

  /**
   * Updates performance metrics
   * @param userId User ID
   * @param listingId Listing ID
   * @param date Date in YYYY-MM-DD format
   * @param updates Partial metrics data to update
   * @throws DynamoDBError if the operation fails
   */
  async updatePerformanceMetrics<T>(
    userId: string,
    listingId: string,
    date: string,
    updates: Partial<T>
  ): Promise<void> {
    const { getPerformanceMetricsKeys } = await import('./keys');
    const keys = getPerformanceMetricsKeys(userId, listingId, date);
    await this.update(keys.PK, keys.SK, updates);
  }

  /**
   * Queries performance metrics for a listing across dates
   * @param userId User ID
   * @param listingId Listing ID
   * @param options Query options
   * @returns Query result with performance metrics
   * @throws DynamoDBError if the operation fails
   */
  async queryPerformanceMetrics<T>(
    userId: string,
    listingId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const pk = `USER#${userId}`;
    const skPrefix = `METRICS#${listingId}#`;
    return this.query<T>(pk, skPrefix, options);
  }

  // ==================== Market Intelligence Alerts Methods ====================

  /**
   * Creates a new alert
   * @param userId User ID
   * @param alertId Alert ID
   * @param alertData Alert data
   * @returns The created DynamoDB item
   * @throws DynamoDBError if the operation fails
   */
  async createAlert<T>(
    userId: string,
    alertId: string,
    alertData: T & { type: string; createdAt: string }
  ): Promise<DynamoDBItem<T>> {
    const { getAlertKeys } = await import('./keys');
    const timestamp = new Date(alertData.createdAt).getTime().toString();
    const keys = getAlertKeys(userId, alertId, timestamp, alertData.type);

    return this.create(keys.PK, keys.SK, 'Alert', alertData, {
      GSI1PK: keys.GSI1PK,
      GSI1SK: keys.GSI1SK,
    });
  }

  /**
   * Gets an alert by ID and timestamp
   * @param userId User ID
   * @param alertId Alert ID
   * @param timestamp Alert timestamp
   * @returns Alert data or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getAlert<T>(
    userId: string,
    alertId: string,
    timestamp: string
  ): Promise<T | null> {
    const { getAlertKeys } = await import('./keys');
    const keys = getAlertKeys(userId, alertId, timestamp);
    return this.get<T>(keys.PK, keys.SK);
  }

  /**
   * Updates an alert
   * @param userId User ID
   * @param alertId Alert ID
   * @param timestamp Alert timestamp
   * @param updates Partial alert data to update
   * @throws DynamoDBError if the operation fails
   */
  async updateAlert<T>(
    userId: string,
    alertId: string,
    timestamp: string,
    updates: Partial<T>
  ): Promise<void> {
    const { getAlertKeys } = await import('./keys');
    const keys = getAlertKeys(userId, alertId, timestamp);
    await this.update(keys.PK, keys.SK, updates);
  }

  /**
   * Deletes an alert
   * @param userId User ID
   * @param alertId Alert ID
   * @param timestamp Alert timestamp
   * @throws DynamoDBError if the operation fails
   */
  async deleteAlert(
    userId: string,
    alertId: string,
    timestamp: string
  ): Promise<void> {
    const { getAlertKeys } = await import('./keys');
    const keys = getAlertKeys(userId, alertId, timestamp);
    await this.delete(keys.PK, keys.SK);
  }

  /**
   * Queries all alerts for a user
   * @param userId User ID
   * @param options Query options
   * @returns Query result with alerts
   * @throws DynamoDBError if the operation fails
   */
  async queryAlerts<T>(
    userId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'ALERT#';
    return this.query<T>(pk, skPrefix, {
      ...options,
      scanIndexForward: false, // Most recent first
    });
  }

  /**
   * Queries alerts by type using GSI
   * @param userId User ID
   * @param alertType Alert type
   * @param options Query options
   * @returns Query result with alerts
   * @throws DynamoDBError if the operation fails
   */
  async queryAlertsByType<T>(
    userId: string,
    alertType: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    try {
      return await withRetry(async () => {
        const client = getDocumentClient();

        const command = new QueryCommand({
          TableName: this.tableName,
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :gsi1pk',
          ExpressionAttributeValues: {
            ':gsi1pk': `ALERT#${userId}#${alertType}`,
            ...options.expressionAttributeValues,
          },
          ExpressionAttributeNames: options.expressionAttributeNames,
          FilterExpression: options.filterExpression,
          Limit: options.limit,
          ExclusiveStartKey: options.exclusiveStartKey,
          ScanIndexForward: options.scanIndexForward ?? false, // Most recent first
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
   * Creates or updates alert settings
   * @param userId User ID
   * @param settingsData Alert settings data
   * @returns The created DynamoDB item
   * @throws DynamoDBError if the operation fails
   */
  async saveAlertSettings<T>(
    userId: string,
    settingsData: T
  ): Promise<DynamoDBItem<T>> {
    const { getAlertSettingsKeys } = await import('./keys');
    const keys = getAlertSettingsKeys(userId);
    return this.create(keys.PK, keys.SK, 'AlertSettings', settingsData);
  }

  /**
   * Gets alert settings for a user
   * @param userId User ID
   * @returns Alert settings data or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getAlertSettings<T>(userId: string): Promise<T | null> {
    const { getAlertSettingsKeys } = await import('./keys');
    const keys = getAlertSettingsKeys(userId);
    return this.get<T>(keys.PK, keys.SK);
  }

  /**
   * Updates alert settings
   * @param userId User ID
   * @param updates Partial settings data to update
   * @throws DynamoDBError if the operation fails
   */
  async updateAlertSettings<T>(
    userId: string,
    updates: Partial<T>
  ): Promise<void> {
    const { getAlertSettingsKeys } = await import('./keys');
    const keys = getAlertSettingsKeys(userId);
    await this.update(keys.PK, keys.SK, updates);
  }

  /**
   * Creates a neighborhood profile
   * @param userId User ID
   * @param profileId Profile ID
   * @param profileData Neighborhood profile data
   * @returns The created DynamoDB item
   * @throws DynamoDBError if the operation fails
   */
  async createNeighborhoodProfile<T>(
    userId: string,
    profileId: string,
    profileData: T
  ): Promise<DynamoDBItem<T>> {
    const { getNeighborhoodProfileKeys } = await import('./keys');
    const keys = getNeighborhoodProfileKeys(userId, profileId);
    return this.create(keys.PK, keys.SK, 'NeighborhoodProfile', profileData);
  }

  /**
   * Gets a neighborhood profile by ID
   * @param userId User ID
   * @param profileId Profile ID
   * @returns Neighborhood profile data or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getNeighborhoodProfile<T>(
    userId: string,
    profileId: string
  ): Promise<T | null> {
    const { getNeighborhoodProfileKeys } = await import('./keys');
    const keys = getNeighborhoodProfileKeys(userId, profileId);
    return this.get<T>(keys.PK, keys.SK);
  }

  /**
   * Updates a neighborhood profile
   * @param userId User ID
   * @param profileId Profile ID
   * @param updates Partial profile data to update
   * @throws DynamoDBError if the operation fails
   */
  async updateNeighborhoodProfile<T>(
    userId: string,
    profileId: string,
    updates: Partial<T>
  ): Promise<void> {
    const { getNeighborhoodProfileKeys } = await import('./keys');
    const keys = getNeighborhoodProfileKeys(userId, profileId);
    await this.update(keys.PK, keys.SK, updates);
  }

  /**
   * Deletes a neighborhood profile
   * @param userId User ID
   * @param profileId Profile ID
   * @throws DynamoDBError if the operation fails
   */
  async deleteNeighborhoodProfile(
    userId: string,
    profileId: string
  ): Promise<void> {
    const { getNeighborhoodProfileKeys } = await import('./keys');
    const keys = getNeighborhoodProfileKeys(userId, profileId);
    await this.delete(keys.PK, keys.SK);
  }

  /**
   * Queries all neighborhood profiles for a user
   * @param userId User ID
   * @param options Query options
   * @returns Query result with neighborhood profiles
   * @throws DynamoDBError if the operation fails
   */
  async queryNeighborhoodProfiles<T>(
    userId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'NEIGHBORHOOD#';
    return this.query<T>(pk, skPrefix, options);
  }

  /**
   * Creates a life event record
   * @param userId User ID
   * @param eventId Event ID
   * @param eventData Life event data
   * @returns The created DynamoDB item
   * @throws DynamoDBError if the operation fails
   */
  async createLifeEvent<T>(
    userId: string,
    eventId: string,
    eventData: T
  ): Promise<DynamoDBItem<T>> {
    const { getLifeEventKeys } = await import('./keys');
    const keys = getLifeEventKeys(userId, eventId);
    return this.create(keys.PK, keys.SK, 'LifeEvent', eventData);
  }

  /**
   * Gets a life event by ID
   * @param userId User ID
   * @param eventId Event ID
   * @returns Life event data or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getLifeEvent<T>(userId: string, eventId: string): Promise<T | null> {
    const { getLifeEventKeys } = await import('./keys');
    const keys = getLifeEventKeys(userId, eventId);
    return this.get<T>(keys.PK, keys.SK);
  }

  /**
   * Queries all life events for a user
   * @param userId User ID
   * @param options Query options
   * @returns Query result with life events
   * @throws DynamoDBError if the operation fails
   */
  async queryLifeEvents<T>(
    userId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'LIFE_EVENT#';
    return this.query<T>(pk, skPrefix, options);
  }

  /**
   * Creates a prospect record
   * @param userId User ID
   * @param prospectId Prospect ID
   * @param prospectData Prospect data
   * @returns The created DynamoDB item
   * @throws DynamoDBError if the operation fails
   */
  async createProspect<T>(
    userId: string,
    prospectId: string,
    prospectData: T
  ): Promise<DynamoDBItem<T>> {
    const { getProspectKeys } = await import('./keys');
    const keys = getProspectKeys(userId, prospectId);
    return this.create(keys.PK, keys.SK, 'Prospect', prospectData);
  }

  /**
   * Gets a prospect by ID
   * @param userId User ID
   * @param prospectId Prospect ID
   * @returns Prospect data or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getProspect<T>(userId: string, prospectId: string): Promise<T | null> {
    const { getProspectKeys } = await import('./keys');
    const keys = getProspectKeys(userId, prospectId);
    return this.get<T>(keys.PK, keys.SK);
  }

  /**
   * Updates a prospect
   * @param userId User ID
   * @param prospectId Prospect ID
   * @param updates Partial prospect data to update
   * @throws DynamoDBError if the operation fails
   */
  async updateProspect<T>(
    userId: string,
    prospectId: string,
    updates: Partial<T>
  ): Promise<void> {
    const { getProspectKeys } = await import('./keys');
    const keys = getProspectKeys(userId, prospectId);
    await this.update(keys.PK, keys.SK, updates);
  }

  /**
   * Queries all prospects for a user
   * @param userId User ID
   * @param options Query options
   * @returns Query result with prospects
   * @throws DynamoDBError if the operation fails
   */
  async queryProspects<T>(
    userId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'PROSPECT#';
    return this.query<T>(pk, skPrefix, options);
  }

  /**
   * Creates a tracked competitor record
   * @param userId User ID
   * @param competitorId Competitor ID
   * @param competitorData Competitor data
   * @returns The created DynamoDB item
   * @throws DynamoDBError if the operation fails
   */
  async createTrackedCompetitor<T>(
    userId: string,
    competitorId: string,
    competitorData: T
  ): Promise<DynamoDBItem<T>> {
    const { getTrackedCompetitorKeys } = await import('./keys');
    const keys = getTrackedCompetitorKeys(userId, competitorId);
    return this.create(keys.PK, keys.SK, 'TrackedCompetitor', competitorData);
  }

  /**
   * Gets a tracked competitor by ID
   * @param userId User ID
   * @param competitorId Competitor ID
   * @returns Competitor data or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getTrackedCompetitor<T>(
    userId: string,
    competitorId: string
  ): Promise<T | null> {
    const { getTrackedCompetitorKeys } = await import('./keys');
    const keys = getTrackedCompetitorKeys(userId, competitorId);
    return this.get<T>(keys.PK, keys.SK);
  }

  /**
   * Updates a tracked competitor
   * @param userId User ID
   * @param competitorId Competitor ID
   * @param updates Partial competitor data to update
   * @throws DynamoDBError if the operation fails
   */
  async updateTrackedCompetitor<T>(
    userId: string,
    competitorId: string,
    updates: Partial<T>
  ): Promise<void> {
    const { getTrackedCompetitorKeys } = await import('./keys');
    const keys = getTrackedCompetitorKeys(userId, competitorId);
    await this.update(keys.PK, keys.SK, updates);
  }

  /**
   * Deletes a tracked competitor
   * @param userId User ID
   * @param competitorId Competitor ID
   * @throws DynamoDBError if the operation fails
   */
  async deleteTrackedCompetitor(
    userId: string,
    competitorId: string
  ): Promise<void> {
    const { getTrackedCompetitorKeys } = await import('./keys');
    const keys = getTrackedCompetitorKeys(userId, competitorId);
    await this.delete(keys.PK, keys.SK);
  }

  /**
   * Queries all tracked competitors for a user
   * @param userId User ID
   * @param options Query options
   * @returns Query result with tracked competitors
   * @throws DynamoDBError if the operation fails
   */
  async queryTrackedCompetitors<T>(
    userId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'TRACKED_COMPETITOR#';
    return this.query<T>(pk, skPrefix, options);
  }

  /**
   * Creates a listing event record
   * @param userId User ID
   * @param eventId Event ID
   * @param eventData Listing event data
   * @returns The created DynamoDB item
   * @throws DynamoDBError if the operation fails
   */
  async createListingEvent<T>(
    userId: string,
    eventId: string,
    eventData: T
  ): Promise<DynamoDBItem<T>> {
    const { getListingEventKeys } = await import('./keys');
    const keys = getListingEventKeys(userId, eventId);
    return this.create(keys.PK, keys.SK, 'ListingEvent', eventData);
  }

  /**
   * Gets a listing event by ID
   * @param userId User ID
   * @param eventId Event ID
   * @returns Listing event data or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getListingEvent<T>(userId: string, eventId: string): Promise<T | null> {
    const { getListingEventKeys } = await import('./keys');
    const keys = getListingEventKeys(userId, eventId);
    return this.get<T>(keys.PK, keys.SK);
  }

  /**
   * Queries all listing events for a user
   * @param userId User ID
   * @param options Query options
   * @returns Query result with listing events
   * @throws DynamoDBError if the operation fails
   */
  async queryListingEvents<T>(
    userId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'LISTING_EVENT#';
    return this.query<T>(pk, skPrefix, options);
  }

  /**
   * Creates or updates trend indicators
   * @param userId User ID
   * @param neighborhood Neighborhood name
   * @param period Period (YYYY-MM format)
   * @param trendData Trend indicators data
   * @returns The created DynamoDB item
   * @throws DynamoDBError if the operation fails
   */
  async saveTrendIndicators<T>(
    userId: string,
    neighborhood: string,
    period: string,
    trendData: T
  ): Promise<DynamoDBItem<T>> {
    const { getTrendIndicatorsKeys } = await import('./keys');
    const keys = getTrendIndicatorsKeys(userId, neighborhood, period);
    return this.create(keys.PK, keys.SK, 'TrendIndicators', trendData);
  }

  /**
   * Gets trend indicators for a specific neighborhood and period
   * @param userId User ID
   * @param neighborhood Neighborhood name
   * @param period Period (YYYY-MM format)
   * @returns Trend indicators data or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getTrendIndicators<T>(
    userId: string,
    neighborhood: string,
    period: string
  ): Promise<T | null> {
    const { getTrendIndicatorsKeys } = await import('./keys');
    const keys = getTrendIndicatorsKeys(userId, neighborhood, period);
    return this.get<T>(keys.PK, keys.SK);
  }

  /**
   * Queries trend indicators for a neighborhood across periods
   * @param userId User ID
   * @param neighborhood Neighborhood name
   * @param options Query options
   * @returns Query result with trend indicators
   * @throws DynamoDBError if the operation fails
   */
  async queryTrendIndicators<T>(
    userId: string,
    neighborhood: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const pk = `USER#${userId}`;
    const skPrefix = `TREND#${neighborhood}#`;
    return this.query<T>(pk, skPrefix, options);
  }

  /**
   * Creates a target area
   * @param userId User ID
   * @param areaId Area ID
   * @param areaData Target area data
   * @returns The created DynamoDB item
   * @throws DynamoDBError if the operation fails
   */
  async createTargetArea<T>(
    userId: string,
    areaId: string,
    areaData: T
  ): Promise<DynamoDBItem<T>> {
    const { getTargetAreaKeys } = await import('./keys');
    const keys = getTargetAreaKeys(userId, areaId);
    return this.create(keys.PK, keys.SK, 'TargetArea', areaData);
  }

  /**
   * Gets a target area by ID
   * @param userId User ID
   * @param areaId Area ID
   * @returns Target area data or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getTargetArea<T>(userId: string, areaId: string): Promise<T | null> {
    const { getTargetAreaKeys } = await import('./keys');
    const keys = getTargetAreaKeys(userId, areaId);
    return this.get<T>(keys.PK, keys.SK);
  }

  /**
   * Updates a target area
   * @param userId User ID
   * @param areaId Area ID
   * @param updates Partial area data to update
   * @throws DynamoDBError if the operation fails
   */
  async updateTargetArea<T>(
    userId: string,
    areaId: string,
    updates: Partial<T>
  ): Promise<void> {
    const { getTargetAreaKeys } = await import('./keys');
    const keys = getTargetAreaKeys(userId, areaId);
    await this.update(keys.PK, keys.SK, updates);
  }

  /**
   * Deletes a target area
   * @param userId User ID
   * @param areaId Area ID
   * @throws DynamoDBError if the operation fails
   */
  async deleteTargetArea(userId: string, areaId: string): Promise<void> {
    const { getTargetAreaKeys } = await import('./keys');
    const keys = getTargetAreaKeys(userId, areaId);
    await this.delete(keys.PK, keys.SK);
  }

  /**
   * Queries all target areas for a user
   * @param userId User ID
   * @param options Query options
   * @returns Query result with target areas
   * @throws DynamoDBError if the operation fails
   */
  async queryTargetAreas<T>(
    userId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'TARGET_AREA#';
    return this.query<T>(pk, skPrefix, options);
  }

  // ==================== Price History Operations ====================

  /**
   * Creates or updates price history for a listing
   * @param userId User ID
   * @param mlsNumber MLS number
   * @param priceHistoryData Price history data
   * @returns The created DynamoDB item
   * @throws DynamoDBError if the operation fails
   */
  async createPriceHistory<T>(
    userId: string,
    mlsNumber: string,
    priceHistoryData: T
  ): Promise<DynamoDBItem<T>> {
    const { getPriceHistoryKeys } = await import('./keys');
    const keys = getPriceHistoryKeys(userId, mlsNumber);
    return this.create(keys.PK, keys.SK, 'PriceHistory', priceHistoryData);
  }

  /**
   * Gets price history for a listing
   * @param userId User ID
   * @param mlsNumber MLS number
   * @returns Price history data or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getPriceHistory<T>(userId: string, mlsNumber: string): Promise<T | null> {
    const { getPriceHistoryKeys } = await import('./keys');
    const keys = getPriceHistoryKeys(userId, mlsNumber);
    return this.get<T>(keys.PK, keys.SK);
  }

  /**
   * Updates price history for a listing
   * @param userId User ID
   * @param mlsNumber MLS number
   * @param updates Partial price history data to update
   * @throws DynamoDBError if the operation fails
   */
  async updatePriceHistory<T>(
    userId: string,
    mlsNumber: string,
    updates: Partial<T>
  ): Promise<void> {
    const { getPriceHistoryKeys } = await import('./keys');
    const keys = getPriceHistoryKeys(userId, mlsNumber);
    await this.update(keys.PK, keys.SK, updates);
  }

  /**
   * Deletes price history for a listing
   * @param userId User ID
   * @param mlsNumber MLS number
   * @throws DynamoDBError if the operation fails
   */
  async deletePriceHistory(userId: string, mlsNumber: string): Promise<void> {
    const { getPriceHistoryKeys } = await import('./keys');
    const keys = getPriceHistoryKeys(userId, mlsNumber);
    await this.delete(keys.PK, keys.SK);
  }

  /**
   * Queries all price histories for a user
   * @param userId User ID
   * @param options Query options
   * @returns Query result with price histories
   * @throws DynamoDBError if the operation fails
   */
  async queryPriceHistories<T>(
    userId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'PRICE_HISTORY#';
    return this.query<T>(pk, skPrefix, options);
  }

  // ==================== Listing Snapshot Operations ====================

  /**
   * Creates or updates a listing snapshot
   * @param userId User ID
   * @param mlsNumber MLS number
   * @param listingData Listing snapshot data
   * @returns The created DynamoDB item
   * @throws DynamoDBError if the operation fails
   */
  async createListingSnapshot<T>(
    userId: string,
    mlsNumber: string,
    listingData: T
  ): Promise<DynamoDBItem<T>> {
    const { getListingSnapshotKeys } = await import('./keys');
    const keys = getListingSnapshotKeys(userId, mlsNumber);
    return this.create(keys.PK, keys.SK, 'ListingSnapshot', listingData);
  }

  /**
   * Gets a listing snapshot
   * @param userId User ID
   * @param mlsNumber MLS number
   * @returns Listing snapshot data or null if not found
   * @throws DynamoDBError if the operation fails
   */
  async getListingSnapshot<T>(userId: string, mlsNumber: string): Promise<T | null> {
    const { getListingSnapshotKeys } = await import('./keys');
    const keys = getListingSnapshotKeys(userId, mlsNumber);
    return this.get<T>(keys.PK, keys.SK);
  }

  /**
   * Updates a listing snapshot
   * @param userId User ID
   * @param mlsNumber MLS number
   * @param updates Partial listing data to update
   * @throws DynamoDBError if the operation fails
   */
  async updateListingSnapshot<T>(
    userId: string,
    mlsNumber: string,
    updates: Partial<T>
  ): Promise<void> {
    const { getListingSnapshotKeys } = await import('./keys');
    const keys = getListingSnapshotKeys(userId, mlsNumber);
    await this.update(keys.PK, keys.SK, updates);
  }

  /**
   * Deletes a listing snapshot
   * @param userId User ID
   * @param mlsNumber MLS number
   * @throws DynamoDBError if the operation fails
   */
  async deleteListingSnapshot(userId: string, mlsNumber: string): Promise<void> {
    const { getListingSnapshotKeys } = await import('./keys');
    const keys = getListingSnapshotKeys(userId, mlsNumber);
    await this.delete(keys.PK, keys.SK);
  }

  /**
   * Queries all listing snapshots for a user
   * @param userId User ID
   * @param options Query options
   * @returns Query result with listing snapshots
   * @throws DynamoDBError if the operation fails
   */
  async queryListingSnapshots<T>(
    userId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'LISTING_SNAPSHOT#';
    return this.query<T>(pk, skPrefix, options);
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
