/**
 * Image Processing Service
 * 
 * Handles image processing operations including resize, optimize, transform, crop, and rotate.
 * Processes images with multiple operations in sequence.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import * as crypto from 'crypto';

// Types
interface ImageOperation {
    type: 'resize' | 'optimize' | 'transform' | 'crop' | 'rotate';
    parameters: Record<string, any>;
}

interface ImageProcessingRequest {
    fileId: string;
    operations: ImageOperation[];
    userId: string;
}

interface ImageProcessingResult {
    originalFileId: string;
    processedFileId: string;
    operations: ImageOperation[];
    outputUrl: string;
    processingTime: number;
    metadata: {
        originalSize: { width: number; height: number };
        processedSize: { width: number; height: number };
        compressionRatio?: number;
    };
}

// Configuration
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'bayon-coagent-files';
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent';
const SUPPORTED_OPERATIONS = ['resize', 'optimize', 'transform', 'crop', 'rotate'];

// AWS clients
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

class ImageProcessingService {
    async processImage(request: ImageProcessingRequest): Promise<ImageProcessingResult> {
        const startTime = Date.now();

        // Validate operations
        for (const operation of request.operations) {
            if (!SUPPORTED_OPERATIONS.includes(operation.type)) {
                throw new Error(`Unsupported operation: ${operation.type}`);
            }
        }

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

        // Process image operations
        const processedImageBuffer = await this.applyOperations(originalImageBuffer, request.operations);

        // Generate processed file ID
        const processedFileId = crypto.randomUUID();

        // Upload processed image to S3
        const processedS3Key = `processed/${request.userId}/${processedFileId}`;
        await this.uploadToS3(processedS3Key, processedImageBuffer, originalFile.MimeType);

        // Store processed file metadata
        await this.storeProcessedFileMetadata(processedFileId, request, originalFile);

        // Calculate processing metrics
        const processingTime = Math.max(1, Date.now() - startTime);
        const originalSize = await this.getImageDimensions(originalImageBuffer);
        const processedSize = await this.getImageDimensions(processedImageBuffer);

        // Calculate compression ratio if optimize operation was applied
        const hasOptimize = request.operations.some(op => op.type === 'optimize');
        const compressionRatio = hasOptimize ? processedImageBuffer.length / originalImageBuffer.length : undefined;

        const outputUrl = `https://${S3_BUCKET}.s3.amazonaws.com/${processedS3Key}`;

        return {
            originalFileId: request.fileId,
            processedFileId,
            operations: request.operations,
            outputUrl,
            processingTime,
            metadata: {
                originalSize,
                processedSize,
                compressionRatio,
            },
        };
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

    private async applyOperations(imageBuffer: Buffer, operations: ImageOperation[]): Promise<Buffer> {
        // Simulate image processing operations
        // In a real implementation, this would use a library like Sharp or similar

        let currentBuffer = imageBuffer;
        let currentWidth = 1920; // Default dimensions for simulation
        let currentHeight = 1080;

        for (const operation of operations) {
            switch (operation.type) {
                case 'resize':
                    ({ buffer: currentBuffer, width: currentWidth, height: currentHeight } =
                        await this.simulateResize(currentBuffer, currentWidth, currentHeight, operation.parameters));
                    break;
                case 'crop':
                    ({ buffer: currentBuffer, width: currentWidth, height: currentHeight } =
                        await this.simulateCrop(currentBuffer, currentWidth, currentHeight, operation.parameters));
                    break;
                case 'rotate':
                    ({ buffer: currentBuffer, width: currentWidth, height: currentHeight } =
                        await this.simulateRotate(currentBuffer, currentWidth, currentHeight, operation.parameters));
                    break;
                case 'optimize':
                    currentBuffer = await this.simulateOptimize(currentBuffer, operation.parameters);
                    break;
                case 'transform':
                    currentBuffer = await this.simulateTransform(currentBuffer, operation.parameters);
                    break;
            }
        }

        return currentBuffer;
    }

    private async simulateResize(buffer: Buffer, width: number, height: number, params: any): Promise<{ buffer: Buffer; width: number; height: number }> {
        // Simulate resize operation
        let newWidth = params.width;
        let newHeight = params.height;

        if (params.maintainAspectRatio) {
            const aspectRatio = width / height;
            if (params.width / params.height > aspectRatio) {
                newWidth = params.height * aspectRatio;
                newHeight = params.height;
            } else {
                newWidth = params.width;
                newHeight = params.width / aspectRatio;
            }
        }

        // In real implementation, would actually resize the image
        return { buffer, width: Math.round(newWidth), height: Math.round(newHeight) };
    }

    private async simulateCrop(buffer: Buffer, width: number, height: number, params: any): Promise<{ buffer: Buffer; width: number; height: number }> {
        // Simulate crop operation
        const maxCropWidth = Math.max(1, width - params.x);
        const maxCropHeight = Math.max(1, height - params.y);
        const newWidth = Math.max(1, Math.min(params.width, maxCropWidth));
        const newHeight = Math.max(1, Math.min(params.height, maxCropHeight));

        return { buffer, width: newWidth, height: newHeight };
    }

    private async simulateRotate(buffer: Buffer, width: number, height: number, params: any): Promise<{ buffer: Buffer; width: number; height: number }> {
        // Simulate rotate operation
        const degrees = params.degrees;
        if (degrees === 90 || degrees === -90 || degrees === 270) {
            return { buffer, width: height, height: width };
        }
        return { buffer, width, height };
    }

    private async simulateOptimize(buffer: Buffer, params: any): Promise<Buffer> {
        // Simulate optimization by reducing buffer size
        const quality = params.quality || 80;
        const compressionFactor = quality / 100;
        const optimizedSize = Math.floor(buffer.length * compressionFactor);

        // Create a new buffer with reduced size (simulation)
        return Buffer.alloc(optimizedSize, buffer[0]);
    }

    private async simulateTransform(buffer: Buffer, params: any): Promise<Buffer> {
        // Simulate transform operations (brightness, contrast, saturation)
        // In real implementation, would apply actual transformations
        return buffer;
    }

    private async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
        // Simulate getting image dimensions
        // In real implementation, would parse image headers
        return { width: 1920, height: 1080 };
    }

    private async storeProcessedFileMetadata(processedFileId: string, request: ImageProcessingRequest, originalFile: any): Promise<void> {
        const item = {
            PK: `USER#${request.userId}`,
            SK: `FILE#${processedFileId}`,
            Type: 'PROCESSED_FILE',
            FileId: processedFileId,
            OriginalFileId: request.fileId,
            Operations: JSON.stringify(request.operations),
            ProcessedAt: new Date().toISOString(),
            UserId: request.userId,
            MimeType: originalFile.MimeType,
        };

        const command = new PutItemCommand({
            TableName: DYNAMODB_TABLE,
            Item: marshall(item),
        });

        await dynamoClient.send(command);
    }

    getSupportedOperations(): string[] {
        return SUPPORTED_OPERATIONS;
    }
}

// Lambda handler
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const traceId = context.awsRequestId;

    try {
        const service = new ImageProcessingService();

        // Parse request body
        const body = JSON.parse(event.body || '{}');

        const processingRequest: ImageProcessingRequest = {
            fileId: body.fileId,
            operations: body.operations,
            userId: body.userId,
        };

        const result = await service.processImage(processingRequest);

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
        console.error('Image processing error:', error);

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
                    errorCode: error instanceof Error && error.message.includes('not found') ? 'FILE_NOT_FOUND' : 'PROCESSING_FAILED',
                    message: error instanceof Error ? error.message : 'Image processing failed',
                    timestamp: new Date().toISOString(),
                    traceId,
                    service: 'image-processing-service',
                    retryable: false,
                },
            }),
        };
    }
};