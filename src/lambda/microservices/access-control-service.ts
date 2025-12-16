/**
 * Access Control Service
 * 
 * Manages permissions and presigned URL management for file access.
 * Handles user permissions, file access control, and secure URL generation.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand, UpdateItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import * as crypto from 'crypto';

// Types
interface AccessControlRequest {
    fileId: string;
    userId: string;
    action: 'read' | 'write' | 'delete' | 'share';
    permissions?: string[];
}

interface AccessControlResult {
    allowed: boolean;
    presignedUrl?: string;
    expiresAt?: string;
    permissions: string[];
    reason?: string;
}

interface FilePermission {
    fileId: string;
    userId: string;
    permissions: string[];
    grantedBy: string;
    grantedAt: string;
    expiresAt?: string;
}

interface ShareRequest {
    fileId: string;
    ownerId: string;
    targetUserId: string;
    permissions: string[];
    expiresAt?: string;
}

// Configuration
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'bayon-coagent-files';
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE_NAME || 'bayon-coagent';
const DEFAULT_PRESIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

// AWS clients
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });

class AccessControlService {
    async checkAccess(request: AccessControlRequest): Promise<AccessControlResult> {
        // Get user permissions for the file
        const permissions = await this.getUserPermissions(request.fileId, request.userId);

        // Check if user is the file owner (has all permissions by default)
        const isOwner = await this.isFileOwner(request.fileId, request.userId);
        if (isOwner) {
            permissions.push('read', 'write', 'delete', 'share', 'admin');
        }

        // Remove duplicates
        const uniquePermissions = Array.from(new Set(permissions));

        // Check if action is allowed
        const allowed = uniquePermissions.includes(request.action) || uniquePermissions.includes('admin');

        let presignedUrl: string | undefined;
        let expiresAt: string | undefined;

        // Generate presigned URL for read/write operations if allowed
        if (allowed && (request.action === 'read' || request.action === 'write')) {
            const urlResult = await this.generatePresignedUrl(request.fileId, request.userId, request.action);
            presignedUrl = urlResult.url;
            expiresAt = urlResult.expiresAt;
        }

        return {
            allowed,
            presignedUrl,
            expiresAt,
            permissions: uniquePermissions,
            reason: allowed ? undefined : `User lacks ${request.action} permission`,
        };
    }

    async grantPermissions(shareRequest: ShareRequest): Promise<void> {
        // Verify the granter has permission to share
        const granterAccess = await this.checkAccess({
            fileId: shareRequest.fileId,
            userId: shareRequest.ownerId,
            action: 'share',
        });

        if (!granterAccess.allowed) {
            throw new Error('User does not have permission to share this file');
        }

        // Store the permission grant
        const item = {
            PK: `FILE#${shareRequest.fileId}`,
            SK: `PERMISSION#${shareRequest.targetUserId}`,
            Type: 'FILE_PERMISSION',
            FileId: shareRequest.fileId,
            UserId: shareRequest.targetUserId,
            Permissions: shareRequest.permissions,
            GrantedBy: shareRequest.ownerId,
            GrantedAt: new Date().toISOString(),
            ExpiresAt: shareRequest.expiresAt,
            GSI1PK: `USER#${shareRequest.targetUserId}`,
            GSI1SK: `PERMISSION#${shareRequest.fileId}`,
        };

        const command = new PutItemCommand({
            TableName: DYNAMODB_TABLE,
            Item: marshall(item),
        });

        await dynamoClient.send(command);
    }

    async revokePermissions(fileId: string, ownerId: string, targetUserId: string): Promise<void> {
        // Verify the revoker has permission to revoke
        const revokerAccess = await this.checkAccess({
            fileId,
            userId: ownerId,
            action: 'share',
        });

        if (!revokerAccess.allowed) {
            throw new Error('User does not have permission to revoke access to this file');
        }

        const command = new DeleteItemCommand({
            TableName: DYNAMODB_TABLE,
            Key: marshall({
                PK: `FILE#${fileId}`,
                SK: `PERMISSION#${targetUserId}`,
            }),
        });

        await dynamoClient.send(command);
    }

    async getUserFilePermissions(userId: string): Promise<FilePermission[]> {
        const command = new QueryCommand({
            TableName: DYNAMODB_TABLE,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
            ExpressionAttributeValues: marshall({
                ':pk': `USER#${userId}`,
                ':sk': 'PERMISSION#',
            }),
        });

        const result = await dynamoClient.send(command);
        return result.Items?.map(item => this.parseFilePermission(unmarshall(item))) || [];
    }

    private async getUserPermissions(fileId: string, userId: string): Promise<string[]> {
        const command = new GetItemCommand({
            TableName: DYNAMODB_TABLE,
            Key: marshall({
                PK: `FILE#${fileId}`,
                SK: `PERMISSION#${userId}`,
            }),
        });

        const result = await dynamoClient.send(command);
        if (!result.Item) {
            return [];
        }

        const item = unmarshall(result.Item);

        // Check if permission has expired
        if (item.ExpiresAt && new Date(item.ExpiresAt) < new Date()) {
            // Permission has expired, remove it
            await this.revokePermissions(fileId, item.GrantedBy, userId);
            return [];
        }

        return item.Permissions || [];
    }

    private async isFileOwner(fileId: string, userId: string): Promise<boolean> {
        const command = new GetItemCommand({
            TableName: DYNAMODB_TABLE,
            Key: marshall({
                PK: `USER#${userId}`,
                SK: `FILE#${fileId}`,
            }),
        });

        const result = await dynamoClient.send(command);
        return !!result.Item;
    }

    private async generatePresignedUrl(fileId: string, userId: string, action: 'read' | 'write'): Promise<{ url: string; expiresAt: string }> {
        const s3Key = `files/${userId}/${fileId}`;
        const expiresIn = DEFAULT_PRESIGNED_URL_EXPIRY;
        const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

        let command: GetObjectCommand | PutObjectCommand;

        if (action === 'read') {
            command = new GetObjectCommand({
                Bucket: S3_BUCKET,
                Key: s3Key,
            });
        } else {
            command = new PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: s3Key,
            });
        }

        const url = await getSignedUrl(s3Client as any, command, { expiresIn });

        return { url, expiresAt };
    }

    private parseFilePermission(item: any): FilePermission {
        return {
            fileId: item.FileId,
            userId: item.UserId,
            permissions: item.Permissions || [],
            grantedBy: item.GrantedBy,
            grantedAt: item.GrantedAt,
            expiresAt: item.ExpiresAt,
        };
    }

    async validatePresignedUrl(url: string): Promise<boolean> {
        try {
            // Extract expiration from URL parameters
            const urlObj = new URL(url);
            const expires = urlObj.searchParams.get('X-Amz-Expires');
            const date = urlObj.searchParams.get('X-Amz-Date');

            if (!expires || !date) {
                return false;
            }

            // Parse the date and calculate expiration
            const signedDate = new Date(
                date.substring(0, 4) + '-' +
                date.substring(4, 6) + '-' +
                date.substring(6, 8) + 'T' +
                date.substring(9, 11) + ':' +
                date.substring(11, 13) + ':' +
                date.substring(13, 15) + 'Z'
            );

            const expirationDate = new Date(signedDate.getTime() + parseInt(expires) * 1000);

            return expirationDate > new Date();
        } catch (error) {
            return false;
        }
    }
}

// Lambda handler
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const traceId = context.awsRequestId;

    try {
        const service = new AccessControlService();
        const httpMethod = event.httpMethod;
        const pathParameters = event.pathParameters || {};
        const body = event.body ? JSON.parse(event.body) : {};

        let result: any;

        switch (httpMethod) {
            case 'POST':
                if (pathParameters.action === 'check-access') {
                    // Check access permissions
                    result = await service.checkAccess(body);
                } else if (pathParameters.action === 'grant-permissions') {
                    // Grant permissions to another user
                    await service.grantPermissions(body);
                    result = { success: true };
                } else if (pathParameters.action === 'validate-url') {
                    // Validate presigned URL
                    result = { valid: await service.validatePresignedUrl(body.url) };
                } else {
                    return {
                        statusCode: 400,
                        headers: { 'Content-Type': 'application/json', 'X-Trace-ID': traceId },
                        body: JSON.stringify({ success: false, error: 'Invalid action' }),
                    };
                }
                break;

            case 'GET':
                if (pathParameters.userId) {
                    // Get user's file permissions
                    result = await service.getUserFilePermissions(pathParameters.userId);
                } else {
                    return {
                        statusCode: 400,
                        headers: { 'Content-Type': 'application/json', 'X-Trace-ID': traceId },
                        body: JSON.stringify({ success: false, error: 'User ID required' }),
                    };
                }
                break;

            case 'DELETE':
                if (pathParameters.fileId && pathParameters.targetUserId) {
                    // Revoke permissions
                    await service.revokePermissions(pathParameters.fileId, body.ownerId, pathParameters.targetUserId);
                    result = { success: true };
                } else {
                    return {
                        statusCode: 400,
                        headers: { 'Content-Type': 'application/json', 'X-Trace-ID': traceId },
                        body: JSON.stringify({ success: false, error: 'File ID and target user ID required' }),
                    };
                }
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
        console.error('Access control service error:', error);

        return {
            statusCode: error instanceof Error && error.message.includes('permission') ? 403 : 500,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                success: false,
                error: {
                    errorId: crypto.randomUUID(),
                    errorCode: error instanceof Error && error.message.includes('permission') ? 'ACCESS_DENIED' : 'ACCESS_CONTROL_FAILED',
                    message: error instanceof Error ? error.message : 'Access control operation failed',
                    timestamp: new Date().toISOString(),
                    traceId,
                    service: 'access-control-service',
                    retryable: false,
                },
            }),
        };
    }
};