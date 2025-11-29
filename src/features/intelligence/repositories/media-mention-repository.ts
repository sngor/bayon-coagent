import type { MediaMention } from '../types/media-types';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    PutCommand,
    QueryCommand,
    GetCommand,
    DeleteCommand,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { getDynamoDBClient } from '@/aws/dynamodb/client';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent-dev';
const GSI_USER_PUBLISHED = 'GSI-User-PublishedAt';

/**
 * Repository for managing media mentions in DynamoDB
 */
export class MediaMentionRepository {
    private client: DynamoDBDocumentClient;

    constructor() {
        this.client = getDynamoDBClient();
    }

    /**
     * Save a media mention
     */
    async save(mention: MediaMention): Promise<void> {
        const item = {
            PK: `USER#${mention.userId}`,
            SK: `MEDIA_MENTION#${mention.id}`,
            ...mention,
            entityType: 'MediaMention',
        };

        await this.client.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: item,
            })
        );
    }

    /**
     * Get media mentions for a user within a time range
     */
    async getByUserAndTimeRange(
        userId: string,
        startTime: number,
        endTime?: number
    ): Promise<MediaMention[]> {
        const params: any = {
            TableName: TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            FilterExpression: 'publishedAt >= :startTime',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':sk': 'MEDIA_MENTION#',
                ':startTime': startTime,
            },
        };

        if (endTime) {
            params.FilterExpression += ' AND publishedAt <= :endTime';
            params.ExpressionAttributeValues[':endTime'] = endTime;
        }

        const result = await this.client.send(new QueryCommand(params));
        return (result.Items || []) as MediaMention[];
    }

    /**
     * Get a single media mention by ID
     */
    async getById(userId: string, mentionId: string): Promise<MediaMention | null> {
        const result = await this.client.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `USER#${userId}`,
                    SK: `MEDIA_MENTION#${mentionId}`,
                },
            })
        );

        return result.Item as MediaMention | null;
    }

    /**
     * Delete a media mention
     */
    async delete(userId: string, mentionId: string): Promise<void> {
        await this.client.send(
            new DeleteCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `USER#${userId}`,
                    SK: `MEDIA_MENTION#${mentionId}`,
                },
            })
        );
    }

    /**
     * Get recent mentions sorted by published date
     */
    async getRecent(userId: string, limit: number = 10): Promise<MediaMention[]> {
        const mentions = await this.getByUserAndTimeRange(
            userId,
            Date.now() - 30 * 24 * 60 * 60 * 1000 // Last 30 days
        );

        return mentions
            .sort((a, b) => b.publishedAt - a.publishedAt)
            .slice(0, limit);
    }

    /**
     * Bulk save mentions
     */
    async saveBatch(mentions: MediaMention[]): Promise<void> {
        // DynamoDB batch write supports up to 25 items
        const batchSize = 25;

        for (let i = 0; i < mentions.length; i += batchSize) {
            const batch = mentions.slice(i, i + batchSize);
            await Promise.all(batch.map(mention => this.save(mention)));
        }
    }

    /**
     * Get mentions by sentiment
     */
    async getBySentiment(
        userId: string,
        sentiment: 'positive' | 'neutral' | 'negative',
        startTime: number,
        endTime?: number
    ): Promise<MediaMention[]> {
        const allMentions = await this.getByUserAndTimeRange(userId, startTime, endTime);
        return allMentions.filter(m => m.sentiment === sentiment);
    }

    /**
     * Get mentions by media type
     */
    async getByMediaType(
        userId: string,
        mediaType: 'broadcast' | 'press' | 'online' | 'social',
        startTime: number,
        endTime?: number
    ): Promise<MediaMention[]> {
        const allMentions = await this.getByUserAndTimeRange(userId, startTime, endTime);
        return allMentions.filter(m => m.mediaType === mediaType);
    }
}

// Export singleton instance
export const mediaMentionRepository = new MediaMentionRepository();
