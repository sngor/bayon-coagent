/**
 * Thumbnail Service
 * 
 * Generates thumbnails with multiple sizes and formats for images.
 * Supports various thumbnail sizes and output formats.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import * as crypto from 'crypto';

// Types
interface ThumbnailRequest {
    fileId: string;
    sizes: ThumbnailSize[];
    formats?: string[];
    userId: string;
}

interface ThumbnailSize {
    width: number;
    height: number;
    name: string; // e.g., 'small', 'medium', 'large'
}

interface ThumbnailResult {
    originalFileId: string;
    thumbnails: GeneratedThumbnail[];
    processingTime: number;
}

interface GeneratedThumbnail {
    thumbnailId: string;
    size: ThumbnailSize;
    format: string;
    url: string;
    fileSize: number;
}

// Configuration
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'bayon-coagent-files';
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent';

const DEFAULT_THUMBNAIL_SIZES: ThumbnailSize[] = [
    { width: 150, height: 150, name: 'small' },
    { width: 300, height: 300, name: 'medium' },
    { width: 600, height: 600, name: 'large' },
];

const SUPPORTED_OUTPUT_FORMATS = ['jpeg', 'png', 'webp'];

// AWS clients
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

class ThumbnailService {
    async generateThumbnails(request: ThumbnailRequest): Promise<ThumbnailResult> {
        const startTime = Date.now();

        // Get original file metadata
        const originalFile = await this.getFileMetadata(request.fileId, request.userId);
        if (!originalFile) {
            throw new Error(`File not found: ${request.fileId}`);
        }

        // Validate file is an image
        if (!originalFile.MimeType.startsWith('image/')) {
            throw new Error(`File is not an image: ${originalFile.MimeType}`);
        }

        // Download original image from S3
        const originalImageBuffer = await this.downloadFromS3(`files/${request.userId}/${request.fileId}`);

        // Use provided sizes or defaults
        const sizes = request.sizes.length > 0 ? request.sizes : DEFAULT_THUMBNAIL_SIZES;

        // Use provided formats or default to original format
        const formats = request.formats && request.formats.length > 0
            ? request.formats.filter(f => SUPPORTED_OUTPUT_FORMATS.includes(f))
            : [this.getFormatFromMimeType(originalFile.MimeType)];

        // Generate thumbnails for each size and format combination
        const thumbnails: GeneratedThumbnail[] = [];

        for (const size of sizes) {
            for (const format of formats) {
                const thumbnail = await this.generateSingleThumbnail(
                    originalImageBuffer,
                    size,
                    format,
                    request.fileId,
                    request.userId
                );
                thumbnails.push(thumbnail);
            }
        }

        const processingTime = Math.max(1, Date.now() - startTime);

        return {
            originalFileId: request.fileId,
            thumbnails,
            processingTime,
        };
    }

    private async generateSingleThumbnail(
        originalBuffer: Buffer,
        size: ThumbnailSize,
        format: string,
        originalFileId: string,
        userId: string
    ): Promise<GeneratedThumbnail> {
        // Generate thumbnail ID
        const thumbnailId = crypto.randomUUID();

        // Simulate thumbnail generation
        const thumbnailBuffer = await this.createThumbnailBuffer(originalBuffer, size, format);

        // Upload thumbnail to S3
        const s3Key = `thumbnails/${userId}/${originalFileId}/${size.name}_${size.width}x${size.height}.${format}`;
        const mimeType = `image/${format}`;
        await this.uploadToS3(s3Key, thumbnailBuffer, mimeType);

        // Store thumbnail metadata
        await this.storeThumbnailMetadata(thumbnailId, originalFileId, size, format, s3Key, thumbnailBuffer.length, userId);

        const url = `https://${S3_BUCKET}.s3.amazonaws.com/${s3Key}`;

        return {
            thumbnailId,
            size,
            format,
            url,
            fileSize: thumbnailBuffer.length,
        };
    }

    private async createThumbnailBuffer(originalBuffer: Buffer, size: ThumbnailSize, format: string): Promise<Buffer> {
        // Simulate thumbnail creation
        // In a real implementation, this would use a library like Sharp to resize the image

        // Calculate compression based on size reduction
        const originalSize = 1920 * 1080; // Assume original dimensions
        const thumbnailSize = size.width * size.height;
        const compressionRatio = Math.min(1, thumbnailSize / originalSize);

        // Simulate smaller file size for thumbnail
        const thumbnailBufferSize = Math.floor(originalBuffer.length * compressionRatio * 0.7); // Additional compression

        return Buffer.alloc(Math.max(1024, thumbnailBufferSize), originalBuffer[0]); // Minimum 1KB
    }

    private async getFileMetadata(fileId: string, userId: string): Promise<any> {
        const command = new GetItemCommand({
            TableName: DYNAMODB_TABLE,
            Key: marshall({
                PK: `USER#${userId}`,
                SK: `FILE#${fileId}`,
            }),
        });

        const result = await dynamoClient.send(command);
        return result.Item ? unmarshall(result.Item) : null;
    }

    private async downloadFromS3(key: string): Promise<Buffer> {
        const command = new GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
        });

        const result = await s3Client.send(command);
        const chunks: Uint8Array[] = [];

        if (result.Body) {
            const stream = result.Body as any;
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
        }

        return Buffer.concat(chunks);
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

    private async storeThumbnailMetadata(
        thumbnailId: string,
        originalFileId: string,
        size: ThumbnailSize,
        format: string,
        s3Key: string,
        fileSize: number,
        userId: string
    ): Promise<void> {
        const item = {
            PK: `USER#${userId}`,
            SK: `THUMBNAIL#${thumbnailId}`,
            Type: 'THUMBNAIL',
            ThumbnailId: thumbnailId,
            OriginalFileId: originalFileId,
            Width: size.width,
            Height: size.height,
            SizeName: size.name,
            Format: format,
            S3Key: s3Key,
            FileSize: fileSize,
            CreatedAt: new Date().toISOString(),
            UserId: userId,
        };

        const command = new PutItemCommand({
            TableName: DYNAMODB_TABLE,
            Item: marshall(item),
        });

        await dynamoClient.send(command);
    }

    private getFormatFromMimeType(mimeType: string): string {
        const formatMap: Record<string, string> = {
            'image/jpeg': 'jpeg',
            'image/jpg': 'jpeg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'png', // Convert GIF to PNG for thumbnails
            'image/bmp': 'jpeg',
            'image/tiff': 'jpeg',
        };

        return formatMap[mimeType] || 'jpeg';
    }

    getDefaultSizes(): ThumbnailSize[] {
        return DEFAULT_THUMBNAIL_SIZES;
    }

    getSupportedFormats(): string[] {
        return SUPPORTED_OUTPUT_FORMATS;
    }
}

// Lambda handler
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const traceId = context.awsRequestId;

    try {
        const service = new ThumbnailService();

        // Parse request body
        const body = JSON.parse(event.body || '{}');

        const thumbnailRequest: ThumbnailRequest = {
            fileId: body.fileId,
            sizes: body.sizes || [],
            formats: body.formats,
            userId: body.userId,
        };

        const result = await service.generateThumbnails(thumbnailRequest);

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
        console.error('Thumbnail generation error:', error);

        return {
            statusCode: error instanceof Error && error.message.includes('not found') ? 404 : 500,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                success: false,
                error: {
                    errorId: crypto.randomUUID(),
                    errorCode: error instanceof Error && error.message.includes('not found') ? 'FILE_NOT_FOUND' : 'THUMBNAIL_GENERATION_FAILED',
                    message: error instanceof Error ? error.message : 'Thumbnail generation failed',
                    timestamp: new Date().toISOString(),
                    traceId,
                    service: 'thumbnail-service',
                    retryable: false,
                },
            }),
        };
    }
};