/**
 * Metadata Service
 * 
 * Manages file information and relationships tracking.
 * Handles file metadata, relationships between files, and search capabilities.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand, UpdateItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import * as crypto from 'crypto';

// Types
interface FileMetadata {
    fileId: string;
    filename: string;
    size: number;
    mimeType: string;
    checksum: string;
    uploadedAt: string;
    userId: string;
    tags?: string[];
    description?: string;
    customMetadata?: Record<string, any>;
}

interface FileRelationship {
    relationshipId: string;
    sourceFileId: string;
    targetFileId: string;
    relationshipType: 'thumbnail' | 'processed' | 'variant' | 'derived' | 'parent' | 'child';
    createdAt: string;
    metadata?: Record<string, any>;
}

interface MetadataSearchRequest {
    userId: string;
    filters?: {
        mimeType?: string;
        tags?: string[];
        dateRange?: {
            start: string;
            end: string;
        };
        sizeRange?: {
            min: number;
            max: number;
        };
    };
    limit?: number;
    lastEvaluatedKey?: string;
}

interface MetadataSearchResult {
    files: FileMetadata[];
    lastEvaluatedKey?: string;
    totalCount: number;
}

// Configuration
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent';

// AWS clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

class MetadataService {
    async storeFileMetadata(metadata: FileMetadata): Promise<void> {
        const item = {
            PK: `USER#${metadata.userId}`,
            SK: `FILE#${metadata.fileId}`,
            Type: 'FILE',
            FileId: metadata.fileId,
            Filename: metadata.filename,
            Size: metadata.size,
            MimeType: metadata.mimeType,
            Checksum: metadata.checksum,
            UploadedAt: metadata.uploadedAt,
            UserId: metadata.userId,
            Tags: metadata.tags || [],
            Description: metadata.description || '',
            CustomMetadata: JSON.stringify(metadata.customMetadata || {}),
            GSI1PK: `MIME#${metadata.mimeType}`,
            GSI1SK: metadata.uploadedAt,
        };

        const command = new PutItemCommand({
            TableName: DYNAMODB_TABLE,
            Item: marshall(item),
        });

        await dynamoClient.send(command);
    }

    async getFileMetadata(fileId: string, userId: string): Promise<FileMetadata | null> {
        const command = new GetItemCommand({
            TableName: DYNAMODB_TABLE,
            Key: marshall({
                PK: `USER#${userId}`,
                SK: `FILE#${fileId}`,
            }),
        });

        const result = await dynamoClient.send(command);
        if (!result.Item) {
            return null;
        }

        const item = unmarshall(result.Item);
        return {
            fileId: item.FileId,
            filename: item.Filename,
            size: item.Size,
            mimeType: item.MimeType,
            checksum: item.Checksum,
            uploadedAt: item.UploadedAt,
            userId: item.UserId,
            tags: item.Tags || [],
            description: item.Description || '',
            customMetadata: item.CustomMetadata ? JSON.parse(item.CustomMetadata) : {},
        };
    }

    async updateFileMetadata(fileId: string, userId: string, updates: Partial<FileMetadata>): Promise<void> {
        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        if (updates.tags !== undefined) {
            updateExpressions.push('#tags = :tags');
            expressionAttributeNames['#tags'] = 'Tags';
            expressionAttributeValues[':tags'] = updates.tags;
        }

        if (updates.description !== undefined) {
            updateExpressions.push('#description = :description');
            expressionAttributeNames['#description'] = 'Description';
            expressionAttributeValues[':description'] = updates.description;
        }

        if (updates.customMetadata !== undefined) {
            updateExpressions.push('#customMetadata = :customMetadata');
            expressionAttributeNames['#customMetadata'] = 'CustomMetadata';
            expressionAttributeValues[':customMetadata'] = JSON.stringify(updates.customMetadata);
        }

        if (updateExpressions.length === 0) {
            return; // No updates to apply
        }

        const command = new UpdateItemCommand({
            TableName: DYNAMODB_TABLE,
            Key: marshall({
                PK: `USER#${userId}`,
                SK: `FILE#${fileId}`,
            }),
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: marshall(expressionAttributeValues),
        });

        await dynamoClient.send(command);
    }

    async deleteFileMetadata(fileId: string, userId: string): Promise<void> {
        // Delete file metadata
        const deleteFileCommand = new DeleteItemCommand({
            TableName: DYNAMODB_TABLE,
            Key: marshall({
                PK: `USER#${userId}`,
                SK: `FILE#${fileId}`,
            }),
        });

        await dynamoClient.send(deleteFileCommand);

        // Delete associated relationships
        await this.deleteFileRelationships(fileId, userId);
    }

    async createFileRelationship(relationship: Omit<FileRelationship, 'relationshipId' | 'createdAt'>): Promise<string> {
        const relationshipId = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        const item = {
            PK: `USER#${relationship.sourceFileId}`, // Use source file as partition key
            SK: `RELATIONSHIP#${relationshipId}`,
            Type: 'FILE_RELATIONSHIP',
            RelationshipId: relationshipId,
            SourceFileId: relationship.sourceFileId,
            TargetFileId: relationship.targetFileId,
            RelationshipType: relationship.relationshipType,
            CreatedAt: createdAt,
            Metadata: JSON.stringify(relationship.metadata || {}),
            GSI1PK: `FILE#${relationship.targetFileId}`, // Allow reverse lookup
            GSI1SK: `RELATIONSHIP#${relationship.relationshipType}#${createdAt}`,
        };

        const command = new PutItemCommand({
            TableName: DYNAMODB_TABLE,
            Item: marshall(item),
        });

        await dynamoClient.send(command);
        return relationshipId;
    }

    async getFileRelationships(fileId: string, relationshipType?: string): Promise<FileRelationship[]> {
        // Query relationships where this file is the source
        const sourceQuery = new QueryCommand({
            TableName: DYNAMODB_TABLE,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: marshall({
                ':pk': `USER#${fileId}`,
                ':sk': 'RELATIONSHIP#',
            }),
        });

        const sourceResult = await dynamoClient.send(sourceQuery);
        const sourceRelationships = sourceResult.Items?.map(item => this.parseRelationship(unmarshall(item))) || [];

        // Query relationships where this file is the target (using GSI)
        const targetQuery = new QueryCommand({
            TableName: DYNAMODB_TABLE,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :pk',
            ExpressionAttributeValues: marshall({
                ':pk': `FILE#${fileId}`,
            }),
        });

        const targetResult = await dynamoClient.send(targetQuery);
        const targetRelationships = targetResult.Items?.map(item => this.parseRelationship(unmarshall(item))) || [];

        const allRelationships = [...sourceRelationships, ...targetRelationships];

        // Filter by relationship type if specified
        if (relationshipType) {
            return allRelationships.filter(rel => rel.relationshipType === relationshipType);
        }

        return allRelationships;
    }

    async searchFiles(request: MetadataSearchRequest): Promise<MetadataSearchResult> {
        const limit = request.limit || 50;
        let queryCommand: QueryCommand;

        if (request.filters?.mimeType) {
            // Search by MIME type using GSI
            queryCommand = new QueryCommand({
                TableName: DYNAMODB_TABLE,
                IndexName: 'GSI1',
                KeyConditionExpression: 'GSI1PK = :mimeType',
                ExpressionAttributeValues: marshall({
                    ':mimeType': `MIME#${request.filters.mimeType}`,
                }),
                Limit: limit,
                ExclusiveStartKey: request.lastEvaluatedKey ? JSON.parse(request.lastEvaluatedKey) : undefined,
            });
        } else {
            // Search all files for user
            queryCommand = new QueryCommand({
                TableName: DYNAMODB_TABLE,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: marshall({
                    ':pk': `USER#${request.userId}`,
                    ':sk': 'FILE#',
                }),
                Limit: limit,
                ExclusiveStartKey: request.lastEvaluatedKey ? JSON.parse(request.lastEvaluatedKey) : undefined,
            });
        }

        const result = await dynamoClient.send(queryCommand);
        let files = result.Items?.map(item => this.parseFileMetadata(unmarshall(item))) || [];

        // Apply additional filters
        if (request.filters) {
            files = this.applyFilters(files, request.filters);
        }

        return {
            files,
            lastEvaluatedKey: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
            totalCount: files.length,
        };
    }

    private async deleteFileRelationships(fileId: string, userId: string): Promise<void> {
        const relationships = await this.getFileRelationships(fileId);

        for (const relationship of relationships) {
            const deleteCommand = new DeleteItemCommand({
                TableName: DYNAMODB_TABLE,
                Key: marshall({
                    PK: `USER#${relationship.sourceFileId}`,
                    SK: `RELATIONSHIP#${relationship.relationshipId}`,
                }),
            });

            await dynamoClient.send(deleteCommand);
        }
    }

    private parseRelationship(item: any): FileRelationship {
        return {
            relationshipId: item.RelationshipId,
            sourceFileId: item.SourceFileId,
            targetFileId: item.TargetFileId,
            relationshipType: item.RelationshipType,
            createdAt: item.CreatedAt,
            metadata: item.Metadata ? JSON.parse(item.Metadata) : {},
        };
    }

    private parseFileMetadata(item: any): FileMetadata {
        return {
            fileId: item.FileId,
            filename: item.Filename,
            size: item.Size,
            mimeType: item.MimeType,
            checksum: item.Checksum,
            uploadedAt: item.UploadedAt,
            userId: item.UserId,
            tags: item.Tags || [],
            description: item.Description || '',
            customMetadata: item.CustomMetadata ? JSON.parse(item.CustomMetadata) : {},
        };
    }

    private applyFilters(files: FileMetadata[], filters: NonNullable<MetadataSearchRequest['filters']>): FileMetadata[] {
        return files.filter(file => {
            // Filter by tags
            if (filters.tags && filters.tags.length > 0) {
                const hasMatchingTag = filters.tags.some(tag => file.tags?.includes(tag));
                if (!hasMatchingTag) return false;
            }

            // Filter by date range
            if (filters.dateRange) {
                const fileDate = new Date(file.uploadedAt);
                const startDate = new Date(filters.dateRange.start);
                const endDate = new Date(filters.dateRange.end);
                if (fileDate < startDate || fileDate > endDate) return false;
            }

            // Filter by size range
            if (filters.sizeRange) {
                if (file.size < filters.sizeRange.min || file.size > filters.sizeRange.max) return false;
            }

            return true;
        });
    }
}

// Lambda handler
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const traceId = context.awsRequestId;

    try {
        const service = new MetadataService();
        const httpMethod = event.httpMethod;
        const pathParameters = event.pathParameters || {};
        const body = event.body ? JSON.parse(event.body) : {};

        let result: any;

        switch (httpMethod) {
            case 'GET':
                if (pathParameters.fileId) {
                    // Get specific file metadata
                    result = await service.getFileMetadata(pathParameters.fileId, body.userId);
                    if (!result) {
                        return {
                            statusCode: 404,
                            headers: { 'Content-Type': 'application/json', 'X-Trace-ID': traceId },
                            body: JSON.stringify({ success: false, error: 'File not found' }),
                        };
                    }
                } else {
                    // Search files
                    result = await service.searchFiles(body);
                }
                break;

            case 'POST':
                if (pathParameters.fileId && pathParameters.action === 'relationships') {
                    // Create file relationship
                    result = { relationshipId: await service.createFileRelationship(body) };
                } else {
                    // Store file metadata
                    await service.storeFileMetadata(body);
                    result = { success: true };
                }
                break;

            case 'PUT':
                // Update file metadata
                await service.updateFileMetadata(pathParameters.fileId!, body.userId, body.updates);
                result = { success: true };
                break;

            case 'DELETE':
                // Delete file metadata
                await service.deleteFileMetadata(pathParameters.fileId!, body.userId);
                result = { success: true };
                break;

            default:
                return {
                    statusCode: 405,
                    headers: { 'Content-Type': 'application/json', 'X-Trace-ID': traceId },
                    body: JSON.stringify({ success: false, error: 'Method not allowed' }),
                };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                success: true,
                data: result,
            }),
        };
    } catch (error) {
        console.error('Metadata service error:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                success: false,
                error: {
                    errorId: crypto.randomUUID(),
                    errorCode: 'METADATA_OPERATION_FAILED',
                    message: error instanceof Error ? error.message : 'Metadata operation failed',
                    timestamp: new Date().toISOString(),
                    traceId,
                    service: 'metadata-service',
                    retryable: false,
                },
            }),
        };
    }
};