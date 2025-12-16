/**
 * File Upload Service
 * 
 * Handles file uploads with multi-format and size support.
 * Validates file types, sizes, and manages file metadata.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import * as crypto from 'crypto';

// Types
interface FileMetadata {
    filename: string;
    size: number;
    mimeType: string;
    checksum: string;
    uploadedAt: string;
    userId: string;
}

interface FileUploadRequest {
    file: {
        buffer: Buffer;
        originalname: string;
        mimetype: string;
        size: number;
    };
    userId: string;
    metadata?: Record<string, any>;
}

interface FileUploadResult {
    fileId: string;
    url: string;
    metadata: FileMetadata;
    processingStatus: 'pending' | 'completed' | 'failed';
}

// Configuration
const SUPPORTED_MIME_TYPES = new Set([
    // Image formats
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff',
    // Document formats
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv',
    // Video formats
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
    // Audio formats
    'audio/mp3', 'audio/wav', 'audio/ogg'
]);

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'bayon-coagent-files';
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent';

// AWS clients
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

class FileUploadService {
    async uploadFile(request: FileUploadRequest): Promise<FileUploadResult> {
        // Validate file format
        if (!SUPPORTED_MIME_TYPES.has(request.file.mimetype)) {
            throw new Error(`Unsupported file format: ${request.file.mimetype}`);
        }

        // Validate file size
        if (request.file.size > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds limit: ${request.file.size} bytes`);
        }

        // Validate file size matches buffer
        if (request.file.buffer.length !== request.file.size) {
            throw new Error('File size mismatch with buffer length');
        }

        // Generate file ID and calculate checksum
        const fileId = this.generateFileId();
        const checksum = this.calculateChecksum(request.file.buffer);

        // Create file metadata
        const metadata: FileMetadata = {
            filename: request.file.originalname,
            size: request.file.size,
            mimeType: request.file.mimetype,
            checksum,
            uploadedAt: new Date().toISOString(),
            userId: request.userId,
        };

        // Upload to S3
        const s3Key = `files/${request.userId}/${fileId}`;
        await this.uploadToS3(s3Key, request.file.buffer, request.file.mimetype);

        // Store metadata in DynamoDB
        await this.storeMetadata(fileId, metadata, request.metadata);

        // Generate file URL
        const url = `https://${S3_BUCKET}.s3.amazonaws.com/${s3Key}`;

        return {
            fileId,
            url,
            metadata,
            processingStatus: 'completed',
        };
    }

    private async uploadToS3(key: string, buffer: Buffer, contentType: string): Promise<void> {
        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            ServerSideEncryption: 'AES256',
        });

        await s3Client.send(command);
    }

    private async storeMetadata(fileId: string, metadata: FileMetadata, additionalMetadata?: Record<string, any>): Promise<void> {
        const item = {
            PK: `USER#${metadata.userId}`,
            SK: `FILE#${fileId}`,
            Type: 'FILE',
            FileId: fileId,
            Filename: metadata.filename,
            Size: metadata.size,
            MimeType: metadata.mimeType,
            Checksum: metadata.checksum,
            UploadedAt: metadata.uploadedAt,
            UserId: metadata.userId,
            ...additionalMetadata,
        };

        const command = new PutItemCommand({
            TableName: DYNAMODB_TABLE,
            Item: marshall(item),
        });

        await dynamoClient.send(command);
    }

    private generateFileId(): string {
        return crypto.randomUUID();
    }

    private calculateChecksum(buffer: Buffer): string {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    getSupportedFormats(): string[] {
        return Array.from(SUPPORTED_MIME_TYPES);
    }

    getMaxFileSize(): number {
        return MAX_FILE_SIZE;
    }
}

// Lambda handler
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const traceId = context.awsRequestId;

    try {
        const service = new FileUploadService();

        // Parse request body
        const body = JSON.parse(event.body || '{}');

        // Extract file data from base64 encoded body
        const fileBuffer = Buffer.from(body.fileData, 'base64');

        const uploadRequest: FileUploadRequest = {
            file: {
                buffer: fileBuffer,
                originalname: body.filename,
                mimetype: body.mimeType,
                size: fileBuffer.length,
            },
            userId: body.userId,
            metadata: body.metadata,
        };

        const result = await service.uploadFile(uploadRequest);

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
        console.error('File upload error:', error);

        return {
            statusCode: error instanceof Error && error.message.includes('Unsupported') ? 400 : 500,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                success: false,
                error: {
                    errorId: crypto.randomUUID(),
                    errorCode: error instanceof Error && error.message.includes('Unsupported') ? 'UNSUPPORTED_FORMAT' : 'UPLOAD_FAILED',
                    message: error instanceof Error ? error.message : 'File upload failed',
                    timestamp: new Date().toISOString(),
                    traceId,
                    service: 'file-upload-service',
                    retryable: false,
                },
            }),
        };
    }
};