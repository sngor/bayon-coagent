'use server';

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// AWS Clients
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-west-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-west-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Configuration
const S3_BUCKET = process.env.KNOWLEDGE_BASE_BUCKET || 'bayon-knowledge-base';
const DYNAMODB_TABLE = process.env.KNOWLEDGE_BASE_TABLE || 'KnowledgeBaseDocuments';

// Types
export interface Document {
    userId: string;
    documentId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    s3Key?: string;
    url?: string;
    uploadDate: string;
    status: 'pending' | 'processing' | 'indexed' | 'failed';
    title?: string;
    tags?: string[];
    extractedText?: string;
    chunkCount?: number;
    embeddingModel?: string;
    lastAccessed?: string;
    accessCount?: number;
    errorMessage?: string;
    scope?: 'personal' | 'team';
    teamId?: string;
}

import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { checkAdminStatusAction } from '@/app/actions';
import { getRepository } from '@/aws/dynamodb/repository';
import { processDocument } from '@/aws/bedrock/document-processor';

async function verifyTeamAdmin(userId: string, teamId: string): Promise<boolean> {
    const adminStatus = await checkAdminStatusAction(userId);
    if (adminStatus.role === 'super_admin') return true;

    // Check if user is admin of the specific team
    const repository = getRepository();
    const teamConfig = await repository.get<any>(`TEAM#${teamId}`, 'CONFIG');
    return teamConfig?.adminId === userId;
}

/**
 * Process document asynchronously (extract text and generate embeddings)
 */
async function processDocumentAsync(
    userId: string,
    documentId: string,
    s3Key: string,
    fileType: string
): Promise<void> {
    try {
        await processDocument(userId, documentId, s3Key, fileType);
    } catch (error) {
        console.error('Document processing error:', error);
    }
}

/**
 * Upload a document to S3 and create DynamoDB record
 */
export async function uploadDocumentAction(
    userId: string,
    file: File,
    options?: { scope?: 'personal' | 'team', teamId?: string }
): Promise<{ success: boolean; documentId?: string; error?: string }> {
    try {
        const scope = options?.scope || 'personal';
        const teamId = options?.teamId;

        // Verify team permissions if uploading to team
        if (scope === 'team') {
            if (!teamId) return { success: false, error: 'Team ID required for team documents' };
            const currentUser = await getCurrentUserServer();
            if (!currentUser || currentUser.id !== userId) {
                return { success: false, error: 'Unauthorized' };
            }
            const isAdmin = await verifyTeamAdmin(userId, teamId);
            if (!isAdmin) {
                return { success: false, error: 'Only team admins can upload team documents' };
            }
        }

        // Determine partition key (userId or TEAM#teamId)
        const partitionKey = scope === 'team' ? `TEAM#${teamId}` : userId;

        // Generate unique document ID
        const documentId = uuidv4();
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
        const s3Key = `${scope === 'team' ? `teams/${teamId}` : userId}/${documentId}/original.${fileExtension}`;

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to S3
        const uploadCommand = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: s3Key,
            Body: buffer,
            ContentType: file.type,
            Metadata: {
                userId,
                documentId,
                originalFileName: file.name,
                scope,
                teamId: teamId || '',
            },
        });

        await s3Client.send(uploadCommand);

        // Create DynamoDB record
        const document: Document = {
            userId: partitionKey, // Use partition key as userId for storage
            documentId,
            scope,
            teamId,
            fileName: file.name,
            fileType: fileExtension,
            fileSize: file.size,
            s3Key,
            uploadDate: new Date().toISOString(),
            status: 'pending',
            accessCount: 0,
        };

        const putCommand = new PutCommand({
            TableName: DYNAMODB_TABLE,
            Item: document,
        });

        await docClient.send(putCommand);

        // Trigger document processing asynchronously
        // In production, this should be done via Lambda triggered by S3 event
        processDocumentAsync(partitionKey, documentId, s3Key, fileExtension).catch(error => {
            console.error('Background document processing error:', error);
        });

        return {
            success: true,
            documentId,
        };
    } catch (error) {
        console.error('Upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}

/**
 * Add a link resource
 */
export async function addLinkResourceAction(
    userId: string,
    url: string,
    title: string,
    options?: { scope?: 'personal' | 'team', teamId?: string }
): Promise<{ success: boolean; documentId?: string; error?: string }> {
    try {
        const scope = options?.scope || 'personal';
        const teamId = options?.teamId;

        // Verify team permissions if uploading to team
        if (scope === 'team') {
            if (!teamId) return { success: false, error: 'Team ID required for team documents' };
            const currentUser = await getCurrentUserServer();
            if (!currentUser || currentUser.id !== userId) {
                return { success: false, error: 'Unauthorized' };
            }
            const isAdmin = await verifyTeamAdmin(userId, teamId);
            if (!isAdmin) {
                return { success: false, error: 'Only team admins can add team resources' };
            }
        }

        // Determine partition key (userId or TEAM#teamId)
        const partitionKey = scope === 'team' ? `TEAM#${teamId}` : userId;

        // Generate unique document ID
        const documentId = uuidv4();

        // Create DynamoDB record
        const document: Document = {
            userId: partitionKey,
            documentId,
            scope,
            teamId,
            fileName: title, // Use title as fileName for consistency in display
            title: title,
            fileType: 'link',
            fileSize: 0,
            url: url,
            uploadDate: new Date().toISOString(),
            status: 'indexed', // Links are instantly available
            accessCount: 0,
        };

        const putCommand = new PutCommand({
            TableName: DYNAMODB_TABLE,
            Item: document,
        });

        await docClient.send(putCommand);

        return {
            success: true,
            documentId,
        };
    } catch (error) {
        console.error('Add link error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to add link',
        };
    }
}

/**
 * Get all documents for a user
 */
export async function getDocumentsAction(
    userId: string,
    filters?: {
        status?: string;
        search?: string;
        limit?: number;
        lastKey?: Record<string, any>;
        scope?: 'personal' | 'team';
        teamId?: string;
    }
): Promise<{
    documents: Document[];
    lastKey?: Record<string, any>;
    error?: string;
}> {
    try {
        const scope = filters?.scope || 'personal';
        const partitionKey = scope === 'team' && filters?.teamId ? `TEAM#${filters.teamId}` : userId;

        const queryParams: any = {
            TableName: DYNAMODB_TABLE,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': partitionKey,
            },
            ScanIndexForward: false, // Sort by newest first
        };

        // Add status filter if provided
        if (filters?.status) {
            queryParams.IndexName = 'StatusIndex';
            queryParams.KeyConditionExpression += ' AND #status = :status';
            queryParams.ExpressionAttributeNames = { '#status': 'status' };
            queryParams.ExpressionAttributeValues[':status'] = filters.status;
        }

        // Add pagination
        if (filters?.limit) {
            queryParams.Limit = filters.limit;
        }
        if (filters?.lastKey) {
            queryParams.ExclusiveStartKey = filters.lastKey;
        }

        const command = new QueryCommand(queryParams);
        const result = await docClient.send(command);

        let documents = (result.Items || []) as Document[];

        // Apply search filter (client-side for now)
        if (filters?.search) {
            const searchLower = filters.search.toLowerCase();
            documents = documents.filter(
                (doc) =>
                    doc.fileName.toLowerCase().includes(searchLower) ||
                    doc.title?.toLowerCase().includes(searchLower) ||
                    doc.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
            );
        }

        return {
            documents,
            lastKey: result.LastEvaluatedKey,
        };
    } catch (error) {
        console.error('Get documents error:', error);
        return {
            documents: [],
            error: error instanceof Error ? error.message : 'Failed to fetch documents',
        };
    }
}

/**
 * Get a single document by ID
 */
export async function getDocumentDetailsAction(
    userId: string,
    documentId: string
): Promise<{ document?: Document; error?: string }> {
    try {
        const command = new GetCommand({
            TableName: DYNAMODB_TABLE,
            Key: {
                userId,
                documentId,
            },
        });

        const result = await docClient.send(command);

        if (!result.Item) {
            return { error: 'Document not found' };
        }

        return { document: result.Item as Document };
    } catch (error) {
        console.error('Get document error:', error);
        return {
            error: error instanceof Error ? error.message : 'Failed to fetch document',
        };
    }
}

/**
 * Update document metadata (title, tags)
 */
export async function updateDocumentMetadataAction(
    userId: string,
    documentId: string,
    metadata: {
        title?: string;
        tags?: string[];
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const updateExpressions: string[] = [];
        const expressionAttributeNames: Record<string, string> = {};
        const expressionAttributeValues: Record<string, any> = {};

        if (metadata.title !== undefined) {
            updateExpressions.push('#title = :title');
            expressionAttributeNames['#title'] = 'title';
            expressionAttributeValues[':title'] = metadata.title;
        }

        if (metadata.tags !== undefined) {
            updateExpressions.push('#tags = :tags');
            expressionAttributeNames['#tags'] = 'tags';
            expressionAttributeValues[':tags'] = metadata.tags;
        }

        if (updateExpressions.length === 0) {
            return { success: true };
        }

        const command = new UpdateCommand({
            TableName: DYNAMODB_TABLE,
            Key: {
                userId,
                documentId,
            },
            UpdateExpression: 'SET ' + updateExpressions.join(', '),
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
        });

        await docClient.send(command);

        return { success: true };
    } catch (error) {
        console.error('Update metadata error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Update failed',
        };
    }
}

/**
 * Soft delete a document
 */
export async function deleteDocumentAction(
    userId: string,
    documentId: string,
    options?: { scope?: 'personal' | 'team', teamId?: string }
): Promise<{ success: boolean; error?: string }> {
    try {
        const scope = options?.scope || 'personal';
        const teamId = options?.teamId;
        const partitionKey = scope === 'team' && teamId ? `TEAM#${teamId}` : userId;

        // Verify team permissions if deleting team doc
        if (scope === 'team') {
            if (!teamId) return { success: false, error: 'Team ID required' };
            const currentUser = await getCurrentUserServer();
            if (!currentUser || currentUser.id !== userId) {
                return { success: false, error: 'Unauthorized' };
            }
            const isAdmin = await verifyTeamAdmin(userId, teamId);
            if (!isAdmin) {
                return { success: false, error: 'Only team admins can delete team documents' };
            }
        }

        // Get document to find S3 key
        const { document } = await getDocumentDetailsAction(partitionKey, documentId);
        if (!document) {
            return { success: false, error: 'Document not found' };
        }

        // Soft delete in DynamoDB (add deletedAt timestamp)
        const command = new UpdateCommand({
            TableName: DYNAMODB_TABLE,
            Key: {
                userId: partitionKey,
                documentId,
            },
            UpdateExpression: 'SET deletedAt = :deletedAt, #status = :status',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':deletedAt': new Date().toISOString(),
                ':status': 'deleted',
            },
        });

        await docClient.send(command);

        // TODO: Delete from vector database
        // await deleteFromVectorDB(documentId);

        // TODO: Schedule S3 deletion (30 days)
        // await scheduleS3Deletion(document.s3Key);

        return { success: true };
    } catch (error) {
        console.error('Delete document error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Delete failed',
        };
    }
}

/**
 * Get a signed URL for downloading a document
 */
export async function getDocumentDownloadUrlAction(
    userId: string,
    documentId: string
): Promise<{ url?: string; error?: string }> {
    try {
        // Get document to find S3 key
        const { document } = await getDocumentDetailsAction(userId, documentId);
        if (!document) {
            return { error: 'Document not found' };
        }

        // Generate signed URL (expires in 1 hour)
        const command = new GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: document.s3Key,
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        return { url };
    } catch (error) {
        console.error('Get download URL error:', error);
        return {
            error: error instanceof Error ? error.message : 'Failed to generate download URL',
        };
    }
}

/**
 * Increment access count when AI uses a document
 */
export async function incrementAccessCountAction(
    userId: string,
    documentId: string
): Promise<{ success: boolean }> {
    try {
        const command = new UpdateCommand({
            TableName: DYNAMODB_TABLE,
            Key: {
                userId,
                documentId,
            },
            UpdateExpression: 'SET accessCount = if_not_exists(accessCount, :zero) + :inc, lastAccessed = :now',
            ExpressionAttributeValues: {
                ':zero': 0,
                ':inc': 1,
                ':now': new Date().toISOString(),
            },
        });

        await docClient.send(command);

        return { success: true };
    } catch (error) {
        console.error('Increment access count error:', error);
        return { success: false };
    }
}
