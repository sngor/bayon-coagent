/**
 * Content Moderation Service
 * 
 * Handles content moderation for the admin platform.
 * Provides tools for reviewing, approving, flagging, and hiding user-generated content.
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import {
    getContentModerationKeys,
    getAdminAuditLogKeys,
} from '@/aws/dynamodb';
import { sendEmail } from '@/aws/ses/client';
import { v4 as uuidv4 } from 'uuid';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getDocumentClient } from '@/aws/dynamodb/client';

export interface ModerationItem {
    contentId: string;
    userId: string;
    userName: string;
    userEmail: string;
    contentType: 'blog_post' | 'social_media' | 'description' | 'image';
    title: string;
    content: string;
    createdAt: number;
    status: 'pending' | 'approved' | 'flagged' | 'hidden';
    moderatedBy?: string;
    moderatedAt?: number;
    moderationNote?: string;
}

export interface GetContentOptions {
    status?: 'pending' | 'approved' | 'flagged' | 'hidden';
    contentType?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    lastKey?: string;
}

export class ContentModerationService {
    private repository: DynamoDBRepository;
    private readonly fromEmail: string;

    constructor() {
        this.repository = new DynamoDBRepository();
        this.fromEmail = process.env.SES_FROM_EMAIL || 'noreply@bayoncoagent.com';
    }

    /**
     * Gets content items for moderation with filtering
     */
    async getContentForModeration(options?: GetContentOptions): Promise<{
        items: ModerationItem[];
        lastKey?: string;
    }> {
        const {
            status = 'pending',
            contentType,
            userId,
            startDate,
            endDate,
            limit = 50,
            lastKey,
        } = options || {};

        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagent';
        const client = getDocumentClient();

        // Query by status using GSI1
        const queryParams: any = {
            TableName: tableName,
            IndexName: 'GSI1',
            KeyConditionExpression: 'GSI1PK = :gsi1pk',
            ExpressionAttributeValues: {
                ':gsi1pk': `MODERATION#${status}`,
            },
            Limit: limit,
            ScanIndexForward: false, // Sort by creation date descending (newest first)
        };

        // Add date range filtering if provided
        if (startDate && endDate) {
            queryParams.KeyConditionExpression += ' AND GSI1SK BETWEEN :startDate AND :endDate';
            queryParams.ExpressionAttributeValues[':startDate'] = startDate.getTime().toString();
            queryParams.ExpressionAttributeValues[':endDate'] = endDate.getTime().toString();
        } else if (startDate) {
            queryParams.KeyConditionExpression += ' AND GSI1SK >= :startDate';
            queryParams.ExpressionAttributeValues[':startDate'] = startDate.getTime().toString();
        } else if (endDate) {
            queryParams.KeyConditionExpression += ' AND GSI1SK <= :endDate';
            queryParams.ExpressionAttributeValues[':endDate'] = endDate.getTime().toString();
        }

        // Add pagination
        if (lastKey) {
            queryParams.ExclusiveStartKey = JSON.parse(lastKey);
        }

        // Add filter expressions for additional filtering
        const filterExpressions: string[] = [];
        if (contentType) {
            filterExpressions.push('#data.#contentType = :contentType');
            queryParams.ExpressionAttributeNames = {
                ...queryParams.ExpressionAttributeNames,
                '#data': 'Data',
                '#contentType': 'contentType',
            };
            queryParams.ExpressionAttributeValues[':contentType'] = contentType;
        }

        if (userId) {
            filterExpressions.push('#data.#userId = :userId');
            queryParams.ExpressionAttributeNames = {
                ...queryParams.ExpressionAttributeNames,
                '#data': 'Data',
                '#userId': 'userId',
            };
            queryParams.ExpressionAttributeValues[':userId'] = userId;
        }

        if (filterExpressions.length > 0) {
            queryParams.FilterExpression = filterExpressions.join(' AND ');
        }

        const command = new QueryCommand(queryParams);
        const response = await client.send(command);

        const items: ModerationItem[] = (response.Items || []).map((item: any) => item.Data);

        return {
            items,
            lastKey: response.LastEvaluatedKey
                ? JSON.stringify(response.LastEvaluatedKey)
                : undefined,
        };
    }

    /**
     * Approves content
     */
    async approveContent(contentId: string, adminId: string): Promise<void> {
        // Get the content item first
        const content = await this.getContentById(contentId);
        if (!content) {
            throw new Error('Content not found');
        }

        // Update content status
        const keys = getContentModerationKeys(
            content.userId,
            contentId,
            'approved',
            content.createdAt
        );

        await this.repository.update(
            keys.PK,
            keys.SK,
            'ContentModeration',
            {
                status: 'approved',
                moderatedBy: adminId,
                moderatedAt: Date.now(),
            }
        );

        // Create audit log
        await this.createAuditLog(
            adminId,
            'content_approve',
            contentId,
            { userId: content.userId, contentType: content.contentType },
            { status: content.status },
            { status: 'approved' }
        );
    }

    /**
     * Flags content for review
     */
    async flagContent(
        contentId: string,
        adminId: string,
        reason: string
    ): Promise<void> {
        // Get the content item first
        const content = await this.getContentById(contentId);
        if (!content) {
            throw new Error('Content not found');
        }

        // Update content status
        const keys = getContentModerationKeys(
            content.userId,
            contentId,
            'flagged',
            content.createdAt
        );

        await this.repository.update(
            keys.PK,
            keys.SK,
            'ContentModeration',
            {
                status: 'flagged',
                moderatedBy: adminId,
                moderatedAt: Date.now(),
                moderationNote: reason,
            }
        );

        // Send email notification to content creator
        await this.sendFlaggedNotification(content, reason);

        // Create audit log
        await this.createAuditLog(
            adminId,
            'content_flag',
            contentId,
            { userId: content.userId, contentType: content.contentType, reason },
            { status: content.status },
            { status: 'flagged', moderationNote: reason }
        );
    }

    /**
     * Hides content from user's library
     */
    async hideContent(
        contentId: string,
        adminId: string,
        reason: string
    ): Promise<void> {
        // Get the content item first
        const content = await this.getContentById(contentId);
        if (!content) {
            throw new Error('Content not found');
        }

        // Update content status (preserves data)
        const keys = getContentModerationKeys(
            content.userId,
            contentId,
            'hidden',
            content.createdAt
        );

        await this.repository.update(
            keys.PK,
            keys.SK,
            'ContentModeration',
            {
                status: 'hidden',
                moderatedBy: adminId,
                moderatedAt: Date.now(),
                moderationNote: reason,
            }
        );

        // Send email notification to content creator
        await this.sendHiddenNotification(content, reason);

        // Create audit log
        await this.createAuditLog(
            adminId,
            'content_hide',
            contentId,
            { userId: content.userId, contentType: content.contentType, reason },
            { status: content.status },
            { status: 'hidden', moderationNote: reason }
        );
    }

    /**
     * Gets a content item by ID
     * Helper method to retrieve content across all users
     */
    private async getContentById(contentId: string): Promise<ModerationItem | null> {
        // Since we don't know the userId, we need to query by contentId
        // This is a limitation of the current key structure
        // For now, we'll scan the table (not ideal for production)
        const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagent';
        const client = getDocumentClient();

        // Query GSI1 for all statuses to find the content
        const statuses = ['pending', 'approved', 'flagged', 'hidden'];

        for (const status of statuses) {
            const queryParams = {
                TableName: tableName,
                IndexName: 'GSI1',
                KeyConditionExpression: 'GSI1PK = :gsi1pk',
                ExpressionAttributeValues: {
                    ':gsi1pk': `MODERATION#${status}`,
                },
                FilterExpression: '#data.#contentId = :contentId',
                ExpressionAttributeNames: {
                    '#data': 'Data',
                    '#contentId': 'contentId',
                },
                ExpressionAttributeValues: {
                    ':gsi1pk': `MODERATION#${status}`,
                    ':contentId': contentId,
                },
                Limit: 1,
            };

            const command = new QueryCommand(queryParams);
            const response = await client.send(command);

            if (response.Items && response.Items.length > 0) {
                return response.Items[0].Data as ModerationItem;
            }
        }

        return null;
    }

    /**
     * Sends email notification when content is flagged
     */
    private async sendFlaggedNotification(
        content: ModerationItem,
        reason: string
    ): Promise<void> {
        const subject = 'Your content has been flagged for review';
        const body = `
            <html>
                <body>
                    <h2>Content Flagged for Review</h2>
                    <p>Hello ${content.userName},</p>
                    <p>Your content "${content.title}" has been flagged for review by our moderation team.</p>
                    <p><strong>Reason:</strong> ${reason}</p>
                    <p>Please review our content guidelines and make any necessary adjustments.</p>
                    <p>If you have any questions, please contact our support team.</p>
                    <br>
                    <p>Best regards,<br>The Bayon Coagent Team</p>
                </body>
            </html>
        `;

        try {
            await sendEmail(content.userEmail, subject, body, this.fromEmail, true);
        } catch (error) {
            console.error('Failed to send flagged notification email:', error);
            // Don't throw - email failure shouldn't block the moderation action
        }
    }

    /**
     * Sends email notification when content is hidden
     */
    private async sendHiddenNotification(
        content: ModerationItem,
        reason: string
    ): Promise<void> {
        const subject = 'Your content has been hidden';
        const body = `
            <html>
                <body>
                    <h2>Content Hidden</h2>
                    <p>Hello ${content.userName},</p>
                    <p>Your content "${content.title}" has been hidden from your library.</p>
                    <p><strong>Reason:</strong> ${reason}</p>
                    <p>This content is no longer visible in your library, but the data has been preserved.</p>
                    <p>If you believe this was done in error, please contact our support team.</p>
                    <br>
                    <p>Best regards,<br>The Bayon Coagent Team</p>
                </body>
            </html>
        `;

        try {
            await sendEmail(content.userEmail, subject, body, this.fromEmail, true);
        } catch (error) {
            console.error('Failed to send hidden notification email:', error);
            // Don't throw - email failure shouldn't block the moderation action
        }
    }

    /**
     * Creates an audit log entry for moderation actions
     */
    private async createAuditLog(
        adminId: string,
        actionType: string,
        resourceId: string,
        metadata: Record<string, any>,
        beforeValue: Record<string, any>,
        afterValue: Record<string, any>
    ): Promise<void> {
        const auditId = uuidv4();
        const timestamp = Date.now();
        const date = new Date(timestamp).toISOString().split('T')[0];

        const keys = getAdminAuditLogKeys(date, auditId, timestamp, adminId, actionType);

        await this.repository.create(
            keys.PK,
            keys.SK,
            'AdminAuditLog',
            {
                auditId,
                adminId,
                actionType,
                resourceType: 'content',
                resourceId,
                timestamp,
                metadata,
                beforeValue,
                afterValue,
            }
        );
    }
}

// Export singleton instance
export const contentModerationService = new ContentModerationService();
