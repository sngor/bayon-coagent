/**
 * Integration Service - File Storage Lambda Handler
 * Handles S3 file operations, presigned URLs, and file management
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getCurrentUserFromEvent } from '@/aws/auth/lambda-auth';
import { wrapLambdaHandler } from '@/aws/lambda/wrapper';
import { uploadFile, getPresignedUrl, getPresignedUploadUrl, deleteFile } from '@/aws/s3/client';

interface FileStorageRequest {
    action: 'upload' | 'get-url' | 'get-upload-url' | 'delete';
    key?: string;
    contentType?: string;
    expiresIn?: number;
}

export const handler = wrapLambdaHandler(async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const user = await getCurrentUserFromEvent(event);
    if (!user) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Unauthorized' }),
        };
    }

    const method = event.httpMethod;

    try {
        if (method === 'POST') {
            // Handle file upload
            if (!event.body) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Request body is required' }),
                };
            }

            // Parse multipart form data (simplified - in production use a proper parser)
            const contentType = event.headers['content-type'] || event.headers['Content-Type'];

            if (!contentType?.includes('multipart/form-data')) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Content-Type must be multipart/form-data' }),
                };
            }

            // For now, return a presigned upload URL instead of handling the upload directly
            // This is more efficient and scalable
            const timestamp = Date.now();
            const key = `users/${user.userId}/uploads/${timestamp}`;

            const uploadUrl = await getPresignedUploadUrl(key, 'application/octet-stream');

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    success: true,
                    uploadUrl,
                    key,
                }),
            };
        }

        if (method === 'GET') {
            // Handle presigned URL generation
            const { key, expiresIn } = event.queryStringParameters || {};

            if (!key) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Key parameter is required' }),
                };
            }

            // Verify user has access to this key (basic security check)
            if (!key.startsWith(`users/${user.userId}/`)) {
                return {
                    statusCode: 403,
                    body: JSON.stringify({ error: 'Access denied to this file' }),
                };
            }

            const url = await getPresignedUrl(key, expiresIn ? parseInt(expiresIn) : 3600);

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    success: true,
                    url,
                }),
            };
        }

        if (method === 'DELETE') {
            // Handle file deletion
            const { key } = event.queryStringParameters || {};

            if (!key) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Key parameter is required' }),
                };
            }

            // Verify user has access to this key
            if (!key.startsWith(`users/${user.userId}/`)) {
                return {
                    statusCode: 403,
                    body: JSON.stringify({ error: 'Access denied to this file' }),
                };
            }

            await deleteFile(key);

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    success: true,
                    message: 'File deleted successfully',
                }),
            };
        }

        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    } catch (error: any) {
        console.error('File storage error:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'File storage operation failed',
                message: error.message,
            }),
        };
    }
});