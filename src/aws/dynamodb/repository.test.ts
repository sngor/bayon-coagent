/**
 * Tests for DynamoDB Repository
 * 
 * Tests all CRUD operations, error handling, and retry logic.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { DynamoDBRepository, getRepository, resetRepository } from './repository';
import { DynamoDBItem, DynamoDBKey } from './types';
import { DynamoDBError, ThroughputExceededError } from './errors';
import * as client from './client';

// Mock the client module
jest.mock('./client');

const mockSend = jest.fn();
const mockGetDocumentClient = client.getDocumentClient as jest.MockedFunction<typeof client.getDocumentClient>;
const mockGetTableName = client.getTableName as jest.MockedFunction<typeof client.getTableName>;

describe('DynamoDB Repository', () => {
  let repository: DynamoDBRepository;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    resetRepository();

    // Setup default mocks
    mockGetDocumentClient.mockReturnValue({
      send: mockSend,
    } as any);

    mockGetTableName.mockReturnValue('TestTable');

    repository = new DynamoDBRepository();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('get operation', () => {
    it('should retrieve an item successfully', async () => {
      const testData = { id: '123', name: 'Test' };
      const mockItem: DynamoDBItem<typeof testData> = {
        PK: 'USER#123',
        SK: 'PROFILE',
        EntityType: 'UserProfile',
        Data: testData,
        CreatedAt: Date.now(),
        UpdatedAt: Date.now(),
      };

      mockSend.mockResolvedValueOnce({ Item: mockItem });

      const result = await repository.get<typeof testData>('USER#123', 'PROFILE');

      expect(result).toEqual(testData);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should return null when item not found', async () => {
      mockSend.mockResolvedValueOnce({ Item: undefined });

      const result = await repository.get('USER#123', 'PROFILE');

      expect(result).toBeNull();
    });

    it('should wrap errors in DynamoDBError', async () => {
      mockSend.mockRejectedValueOnce(new Error('Network error'));

      await expect(repository.get('USER#123', 'PROFILE')).rejects.toThrow(DynamoDBError);
    });

    it('should retry on retryable errors', async () => {
      const throttleError = {
        name: 'ProvisionedThroughputExceededException',
        message: 'Throughput exceeded',
      };

      mockSend
        .mockRejectedValueOnce(throttleError)
        .mockRejectedValueOnce(throttleError)
        .mockResolvedValueOnce({ Item: { PK: 'USER#123', SK: 'PROFILE', Data: {} } });

      const result = await repository.get('USER#123', 'PROFILE');

      expect(result).toBeDefined();
      expect(mockSend).toHaveBeenCalledTimes(3);
    });
  });

  describe('query operation', () => {
    it('should query items by partition key', async () => {
      const mockItems: DynamoDBItem<any>[] = [
        {
          PK: 'USER#123',
          SK: 'CONTENT#1',
          EntityType: 'SavedContent',
          Data: { id: '1', title: 'Content 1' },
          CreatedAt: Date.now(),
          UpdatedAt: Date.now(),
        },
        {
          PK: 'USER#123',
          SK: 'CONTENT#2',
          EntityType: 'SavedContent',
          Data: { id: '2', title: 'Content 2' },
          CreatedAt: Date.now(),
          UpdatedAt: Date.now(),
        },
      ];

      mockSend.mockResolvedValueOnce({
        Items: mockItems,
        Count: 2,
      });

      const result = await repository.query('USER#123', 'CONTENT#');

      expect(result.items).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(result.items[0]).toEqual({ id: '1', title: 'Content 1' });
    });

    it('should support pagination', async () => {
      const lastKey: DynamoDBKey = { PK: 'USER#123', SK: 'CONTENT#5' };

      mockSend.mockResolvedValueOnce({
        Items: [],
        Count: 0,
        LastEvaluatedKey: lastKey,
      });

      const result = await repository.query('USER#123', 'CONTENT#', {
        limit: 10,
        exclusiveStartKey: lastKey,
      });

      expect(result.lastEvaluatedKey).toEqual(lastKey);
    });

    it('should support filter expressions', async () => {
      mockSend.mockResolvedValueOnce({
        Items: [],
        Count: 0,
      });

      await repository.query('USER#123', 'CONTENT#', {
        filterExpression: '#status = :status',
        expressionAttributeNames: { '#status': 'status' },
        expressionAttributeValues: { ':status': 'published' },
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.input.FilterExpression).toBe('#status = :status');
    });
  });

  describe('put operation', () => {
    it('should put an item successfully', async () => {
      mockSend.mockResolvedValueOnce({});

      const item: DynamoDBItem<any> = {
        PK: 'USER#123',
        SK: 'PROFILE',
        EntityType: 'UserProfile',
        Data: { name: 'Test User' },
        CreatedAt: Date.now(),
        UpdatedAt: Date.now(),
      };

      await repository.put(item);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle put errors', async () => {
      mockSend.mockRejectedValueOnce({
        name: 'ValidationException',
        message: 'Invalid item',
      });

      const item: DynamoDBItem<any> = {
        PK: 'USER#123',
        SK: 'PROFILE',
        EntityType: 'UserProfile',
        Data: {},
        CreatedAt: Date.now(),
        UpdatedAt: Date.now(),
      };

      await expect(repository.put(item)).rejects.toThrow(DynamoDBError);
    });
  });

  describe('create operation', () => {
    it('should create an item with timestamps', async () => {
      mockSend.mockResolvedValueOnce({});

      const data = { name: 'Test User', email: 'test@example.com' };
      const result = await repository.create('USER#123', 'PROFILE', 'UserProfile', data);

      expect(result.PK).toBe('USER#123');
      expect(result.SK).toBe('PROFILE');
      expect(result.EntityType).toBe('UserProfile');
      expect(result.Data).toEqual(data);
      expect(result.CreatedAt).toBeDefined();
      expect(result.UpdatedAt).toBeDefined();
      expect(result.CreatedAt).toBe(result.UpdatedAt);
    });

    it('should support GSI keys', async () => {
      mockSend.mockResolvedValueOnce({});

      const result = await repository.create(
        'REVIEW#agent123',
        'REVIEW#review456',
        'Review',
        { rating: 5 },
        { GSI1PK: 'REVIEW#review456' }
      );

      expect(result.GSI1PK).toBe('REVIEW#review456');
    });
  });

  describe('update operation', () => {
    it('should update an item with partial data', async () => {
      mockSend.mockResolvedValueOnce({});

      await repository.update('USER#123', 'PROFILE', { name: 'Updated Name' });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.input.UpdateExpression).toContain('updatedAt');
    });

    it('should support conditional updates', async () => {
      mockSend.mockResolvedValueOnce({});

      await repository.update(
        'USER#123',
        'PROFILE',
        { name: 'Updated' },
        {
          conditionExpression: 'attribute_exists(PK)',
        }
      );

      expect(mockSend).toHaveBeenCalledTimes(1);
      const call = mockSend.mock.calls[0][0];
      expect(call.input.ConditionExpression).toBe('attribute_exists(PK)');
    });

    it('should handle conditional check failures', async () => {
      mockSend.mockRejectedValueOnce({
        name: 'ConditionalCheckFailedException',
        message: 'Condition failed',
      });

      await expect(
        repository.update('USER#123', 'PROFILE', { name: 'Updated' })
      ).rejects.toThrow(DynamoDBError);
    });
  });

  describe('delete operation', () => {
    it('should delete an item successfully', async () => {
      mockSend.mockResolvedValueOnce({});

      await repository.delete('USER#123', 'PROFILE');

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle delete errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('Delete failed'));

      await expect(repository.delete('USER#123', 'PROFILE')).rejects.toThrow(DynamoDBError);
    });
  });

  describe('batchGet operation', () => {
    it('should batch get multiple items', async () => {
      const keys: DynamoDBKey[] = [
        { PK: 'USER#123', SK: 'CONTENT#1' },
        { PK: 'USER#123', SK: 'CONTENT#2' },
      ];

      const mockItems: DynamoDBItem<any>[] = [
        {
          PK: 'USER#123',
          SK: 'CONTENT#1',
          EntityType: 'SavedContent',
          Data: { id: '1' },
          CreatedAt: Date.now(),
          UpdatedAt: Date.now(),
        },
        {
          PK: 'USER#123',
          SK: 'CONTENT#2',
          EntityType: 'SavedContent',
          Data: { id: '2' },
          CreatedAt: Date.now(),
          UpdatedAt: Date.now(),
        },
      ];

      mockSend.mockResolvedValueOnce({
        Responses: {
          TestTable: mockItems,
        },
      });

      const result = await repository.batchGet(keys);

      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual({ id: '1' });
      expect(result.items[1]).toEqual({ id: '2' });
    });

    it('should handle empty keys array', async () => {
      const result = await repository.batchGet([]);

      expect(result.items).toHaveLength(0);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle unprocessed keys with retry', async () => {
      const keys: DynamoDBKey[] = [
        { PK: 'USER#123', SK: 'CONTENT#1' },
        { PK: 'USER#123', SK: 'CONTENT#2' },
      ];

      const mockItem: DynamoDBItem<any> = {
        PK: 'USER#123',
        SK: 'CONTENT#1',
        EntityType: 'SavedContent',
        Data: { id: '1' },
        CreatedAt: Date.now(),
        UpdatedAt: Date.now(),
      };

      // First call returns one item and one unprocessed key
      mockSend.mockResolvedValueOnce({
        Responses: {
          TestTable: [mockItem],
        },
        UnprocessedKeys: {
          TestTable: {
            Keys: [{ PK: 'USER#123', SK: 'CONTENT#2' }],
          },
        },
      });

      // Second call (retry) returns the unprocessed item
      mockSend.mockResolvedValueOnce({
        Responses: {
          TestTable: [
            {
              PK: 'USER#123',
              SK: 'CONTENT#2',
              EntityType: 'SavedContent',
              Data: { id: '2' },
              CreatedAt: Date.now(),
              UpdatedAt: Date.now(),
            },
          ],
        },
      });

      const result = await repository.batchGet(keys);

      expect(result.items).toHaveLength(2);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should split large batches', async () => {
      // Create 150 keys (should be split into 2 batches of 100 and 50)
      const keys: DynamoDBKey[] = Array.from({ length: 150 }, (_, i) => ({
        PK: 'USER#123',
        SK: `CONTENT#${i}`,
      }));

      mockSend.mockResolvedValue({
        Responses: { TestTable: [] },
      });

      await repository.batchGet(keys);

      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('batchWrite operation', () => {
    it('should batch write multiple items', async () => {
      const items: DynamoDBItem<any>[] = [
        {
          PK: 'USER#123',
          SK: 'CONTENT#1',
          EntityType: 'SavedContent',
          Data: { id: '1' },
          CreatedAt: Date.now(),
          UpdatedAt: Date.now(),
        },
        {
          PK: 'USER#123',
          SK: 'CONTENT#2',
          EntityType: 'SavedContent',
          Data: { id: '2' },
          CreatedAt: Date.now(),
          UpdatedAt: Date.now(),
        },
      ];

      mockSend.mockResolvedValueOnce({});

      await repository.batchWrite(items);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle mixed puts and deletes', async () => {
      const puts: DynamoDBItem<any>[] = [
        {
          PK: 'USER#123',
          SK: 'CONTENT#1',
          EntityType: 'SavedContent',
          Data: { id: '1' },
          CreatedAt: Date.now(),
          UpdatedAt: Date.now(),
        },
      ];

      const deletes: DynamoDBKey[] = [{ PK: 'USER#123', SK: 'CONTENT#2' }];

      mockSend.mockResolvedValueOnce({});

      await repository.batchWrite(puts, deletes);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle empty arrays', async () => {
      await repository.batchWrite([], []);

      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should split large batches', async () => {
      // Create 30 items (should be split into 2 batches of 25 and 5)
      const items: DynamoDBItem<any>[] = Array.from({ length: 30 }, (_, i) => ({
        PK: 'USER#123',
        SK: `CONTENT#${i}`,
        EntityType: 'SavedContent',
        Data: { id: `${i}` },
        CreatedAt: Date.now(),
        UpdatedAt: Date.now(),
      }));

      mockSend.mockResolvedValue({});

      await repository.batchWrite(items);

      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should handle unprocessed items with retry', async () => {
      const items: DynamoDBItem<any>[] = [
        {
          PK: 'USER#123',
          SK: 'CONTENT#1',
          EntityType: 'SavedContent',
          Data: { id: '1' },
          CreatedAt: Date.now(),
          UpdatedAt: Date.now(),
        },
      ];

      // First call has unprocessed items
      mockSend.mockResolvedValueOnce({
        UnprocessedItems: {
          TestTable: [{ PutRequest: { Item: items[0] } }],
        },
      });

      // Second call (retry) succeeds
      mockSend.mockResolvedValueOnce({});

      await repository.batchWrite(items);

      expect(mockSend).toHaveBeenCalledTimes(2);
    });
  });

  describe('getRepository singleton', () => {
    it('should return the same instance', () => {
      const repo1 = getRepository();
      const repo2 = getRepository();

      expect(repo1).toBe(repo2);
    });

    it('should create new instance after reset', () => {
      const repo1 = getRepository();
      resetRepository();
      const repo2 = getRepository();

      expect(repo1).not.toBe(repo2);
    });
  });

  describe('retry configuration', () => {
    it('should accept custom retry options', () => {
      const customRepo = new DynamoDBRepository({
        maxRetries: 5,
        initialDelayMs: 200,
      });

      expect(customRepo).toBeDefined();
    });
  });

  describe('Reimagine operations', () => {
    describe('saveImageMetadata', () => {
      it('should save image metadata successfully', async () => {
        mockSend.mockResolvedValueOnce({});

        const metadata = {
          originalKey: 's3://bucket/user123/image456.jpg',
          fileName: 'property.jpg',
          fileSize: 2048000,
          contentType: 'image/jpeg',
          width: 1920,
          height: 1080,
          uploadedAt: new Date().toISOString(),
          suggestions: [
            {
              editType: 'virtual-staging',
              priority: 'high',
              reason: 'Empty room detected',
              confidence: 0.95,
            },
          ],
        };

        await repository.saveImageMetadata('user123', 'image456', metadata);

        expect(mockSend).toHaveBeenCalledTimes(1);
        const call = mockSend.mock.calls[0][0];
        expect(call.input.Item.PK).toBe('USER#user123');
        expect(call.input.Item.SK).toBe('IMAGE#image456');
        expect(call.input.Item.EntityType).toBe('ImageMetadata');
        expect(call.input.Item.Data.imageId).toBe('image456');
        expect(call.input.Item.Data.userId).toBe('user123');
        expect(call.input.Item.Data.originalKey).toBe(metadata.originalKey);
      });
    });

    describe('getImageMetadata', () => {
      it('should retrieve image metadata successfully', async () => {
        const metadata = {
          imageId: 'image456',
          userId: 'user123',
          originalKey: 's3://bucket/user123/image456.jpg',
          fileName: 'property.jpg',
          fileSize: 2048000,
          contentType: 'image/jpeg',
          width: 1920,
          height: 1080,
          uploadedAt: new Date().toISOString(),
        };

        const mockItem: DynamoDBItem<typeof metadata> = {
          PK: 'USER#user123',
          SK: 'IMAGE#image456',
          EntityType: 'ImageMetadata',
          Data: metadata,
          CreatedAt: Date.now(),
          UpdatedAt: Date.now(),
        };

        mockSend.mockResolvedValueOnce({ Item: mockItem });

        const result = await repository.getImageMetadata('user123', 'image456');

        expect(result).toEqual(metadata);
        expect(mockSend).toHaveBeenCalledTimes(1);
      });

      it('should return null when image metadata not found', async () => {
        mockSend.mockResolvedValueOnce({ Item: undefined });

        const result = await repository.getImageMetadata('user123', 'image456');

        expect(result).toBeNull();
      });
    });

    describe('saveEditRecord', () => {
      it('should save edit record successfully', async () => {
        mockSend.mockResolvedValueOnce({});

        const record = {
          imageId: 'image456',
          editType: 'virtual-staging',
          params: { roomType: 'living-room', style: 'modern' },
          sourceKey: 's3://bucket/user123/image456.jpg',
          resultKey: 's3://bucket/user123/edit789.jpg',
          status: 'completed' as const,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          modelId: 'amazon.titan-image-generator-v1',
          processingTime: 5000,
        };

        await repository.saveEditRecord('user123', 'edit789', record);

        expect(mockSend).toHaveBeenCalledTimes(1);
        const call = mockSend.mock.calls[0][0];
        expect(call.input.Item.PK).toBe('USER#user123');
        expect(call.input.Item.SK).toBe('EDIT#edit789');
        expect(call.input.Item.EntityType).toBe('EditRecord');
        expect(call.input.Item.Data.editId).toBe('edit789');
        expect(call.input.Item.Data.userId).toBe('user123');
        expect(call.input.Item.Data.editType).toBe('virtual-staging');
      });
    });

    describe('getEditHistory', () => {
      it('should retrieve edit history with pagination', async () => {
        const mockItems: DynamoDBItem<any>[] = [
          {
            PK: 'USER#user123',
            SK: 'EDIT#edit3',
            EntityType: 'EditRecord',
            Data: {
              editId: 'edit3',
              userId: 'user123',
              imageId: 'image456',
              editType: 'enhance',
              status: 'completed',
              createdAt: '2024-01-03T00:00:00Z',
            },
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
          },
          {
            PK: 'USER#user123',
            SK: 'EDIT#edit2',
            EntityType: 'EditRecord',
            Data: {
              editId: 'edit2',
              userId: 'user123',
              imageId: 'image456',
              editType: 'day-to-dusk',
              status: 'completed',
              createdAt: '2024-01-02T00:00:00Z',
            },
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
          },
        ];

        mockSend.mockResolvedValueOnce({
          Items: mockItems,
          Count: 2,
        });

        const result = await repository.getEditHistory('user123', 10);

        expect(result.items).toHaveLength(2);
        expect(result.count).toBe(2);
        expect(result.items[0].editId).toBe('edit3');
        expect(mockSend).toHaveBeenCalledTimes(1);
        
        const call = mockSend.mock.calls[0][0];
        expect(call.input.KeyConditionExpression).toContain('PK = :pk');
        expect(call.input.KeyConditionExpression).toContain('begins_with(SK, :skPrefix)');
        expect(call.input.ExpressionAttributeValues[':pk']).toBe('USER#user123');
        expect(call.input.ExpressionAttributeValues[':skPrefix']).toBe('EDIT#');
        expect(call.input.ScanIndexForward).toBe(false); // Most recent first
      });
    });

    describe('deleteEdit', () => {
      it('should delete edit record successfully', async () => {
        mockSend.mockResolvedValueOnce({});

        await repository.deleteEdit('user123', 'edit789');

        expect(mockSend).toHaveBeenCalledTimes(1);
        const call = mockSend.mock.calls[0][0];
        expect(call.input.Key.PK).toBe('USER#user123');
        expect(call.input.Key.SK).toBe('EDIT#edit789');
      });
    });

    describe('updateEditStatus', () => {
      it('should update edit status successfully', async () => {
        mockSend.mockResolvedValueOnce({});

        await repository.updateEditStatus('user123', 'edit789', 'completed', {
          completedAt: new Date().toISOString(),
          processingTime: 5000,
        });

        expect(mockSend).toHaveBeenCalledTimes(1);
        const call = mockSend.mock.calls[0][0];
        expect(call.input.Key.PK).toBe('USER#user123');
        expect(call.input.Key.SK).toBe('EDIT#edit789');
        expect(call.input.UpdateExpression).toContain('SET');
      });
    });
  });
});
