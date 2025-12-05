/**
 * Announcement Service
 * 
 * Handles creation, scheduling, delivery, and tracking of platform announcements.
 * Supports targeting by role, user segments, and delivery via email and in-app notifications.
 */

import { getRepository } from '@/aws/dynamodb/repository';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { EventBridgeClient, PutRuleCommand, PutTargetsCommand, DeleteRuleCommand, RemoveTargetsCommand } from '@aws-sdk/client-eventbridge';
import { auditLogService } from './audit-log-service';

// ============================================
// Types and Interfaces
// ============================================

export interface Announcement {
    announcementId: string;
    title: string;
    content: string;
    richContent?: string; // HTML formatted content
    targetAudience: 'all' | 'role' | 'custom';
    targetValue?: string[]; // Role names or user IDs
    deliveryMethod: 'email' | 'in_app' | 'both';
    scheduledFor?: string; // ISO timestamp
    status: 'draft' | 'scheduled' | 'sent' | 'failed';
    createdBy: string;
    createdAt: string;
    sentAt?: string;
    tracking: {
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        failed: number;
    };
    metadata?: {
        eventBridgeRuleName?: string;
        targetArn?: string;
    };
}

export interface AnnouncementDeliveryResult {
    announcementId: string;
    sent: number;
    delivered: number;
    failed: number;
    errors: Array<{
        userId: string;
        error: string;
    }>;
}

export interface AnnouncementStats {
    announcementId: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
    openRate: number;
    clickRate: number;
}

// ============================================
// Announcement Service Class
// ============================================

export class AnnouncementService {
    private repository = getRepository();
    private eventBridgeClient: EventBridgeClient;

    constructor() {
        this.eventBridgeClient = new EventBridgeClient({
            region: process.env.AWS_REGION || 'us-east-1',
        });
    }

    /**
     * Creates a new announcement
     */
    async createAnnouncement(
        title: string,
        content: string,
        richContent: string | undefined,
        targetAudience: 'all' | 'role' | 'custom',
        targetValue: string[] | undefined,
        deliveryMethod: 'email' | 'in_app' | 'both',
        createdBy: string,
        scheduledFor?: string
    ): Promise<Announcement> {
        const announcementId = `ann_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = new Date().toISOString();

        const announcement: Announcement = {
            announcementId,
            title,
            content,
            richContent,
            targetAudience,
            targetValue,
            deliveryMethod,
            scheduledFor,
            status: scheduledFor ? 'scheduled' : 'draft',
            createdBy,
            createdAt: now,
            tracking: {
                sent: 0,
                delivered: 0,
                opened: 0,
                clicked: 0,
                failed: 0,
            },
        };

        // Store in DynamoDB
        const keys = this.getAnnouncementKeys(announcementId);
        await this.repository.create(keys.PK, keys.SK, 'Announcement', announcement);

        // If scheduled, create EventBridge rule
        if (scheduledFor) {
            await this.scheduleAnnouncement(announcement);
        }

        // Create audit log
        await auditLogService.logAction(
            createdBy,
            'announcement_created',
            'announcement',
            announcementId,
            undefined,
            announcement
        );

        return announcement;
    }

    /**
     * Gets all announcements with optional filtering
     */
    async getAnnouncements(options?: {
        status?: 'draft' | 'scheduled' | 'sent' | 'failed';
        limit?: number;
        lastKey?: string;
    }): Promise<{
        announcements: Announcement[];
        lastKey?: string;
    }> {
        const result = await this.repository.query(
            'ANNOUNCEMENT#ALL',
            'ANNOUNCEMENT#',
            {
                limit: options?.limit || 50,
                exclusiveStartKey: options?.lastKey ? JSON.parse(options.lastKey) : undefined,
                scanIndexForward: false, // Newest first
            }
        );

        let announcements = result.items as Announcement[];

        // Filter by status if provided
        if (options?.status) {
            announcements = announcements.filter(a => a.status === options.status);
        }

        return {
            announcements,
            lastKey: result.lastKey ? JSON.stringify(result.lastKey) : undefined,
        };
    }

    /**
     * Gets a specific announcement by ID
     */
    async getAnnouncement(announcementId: string): Promise<Announcement | null> {
        const keys = this.getAnnouncementKeys(announcementId);
        const announcement = await this.repository.get<Announcement>(keys.PK, keys.SK);
        return announcement || null;
    }

    /**
     * Updates an announcement
     */
    async updateAnnouncement(
        announcementId: string,
        updates: Partial<Announcement>,
        updatedBy: string
    ): Promise<Announcement> {
        const keys = this.getAnnouncementKeys(announcementId);
        const existing = await this.repository.get<Announcement>(keys.PK, keys.SK);

        if (!existing) {
            throw new Error('Announcement not found');
        }

        const updated = {
            ...existing,
            ...updates,
            announcementId, // Ensure ID doesn't change
            createdBy: existing.createdBy, // Ensure creator doesn't change
            createdAt: existing.createdAt, // Ensure creation date doesn't change
        };

        await this.repository.update(keys.PK, keys.SK, updated);

        // Create audit log
        await auditLogService.logAction(
            updatedBy,
            'announcement_updated',
            'announcement',
            announcementId,
            existing,
            updated
        );

        return updated;
    }

    /**
     * Schedules an announcement for future delivery using EventBridge
     */
    private async scheduleAnnouncement(announcement: Announcement): Promise<void> {
        if (!announcement.scheduledFor) {
            throw new Error('Scheduled time is required');
        }

        const ruleName = `announcement-${announcement.announcementId}`;
        const scheduleDate = new Date(announcement.scheduledFor);

        // Create cron expression for EventBridge
        // Format: cron(minutes hours day month ? year)
        const cronExpression = `cron(${scheduleDate.getUTCMinutes()} ${scheduleDate.getUTCHours()} ${scheduleDate.getUTCDate()} ${scheduleDate.getUTCMonth() + 1} ? ${scheduleDate.getUTCFullYear()})`;

        try {
            // Create EventBridge rule
            await this.eventBridgeClient.send(new PutRuleCommand({
                Name: ruleName,
                ScheduleExpression: cronExpression,
                State: 'ENABLED',
                Description: `Scheduled announcement: ${announcement.title}`,
            }));

            // Add target (Lambda function that will send the announcement)
            const targetArn = process.env.ANNOUNCEMENT_DELIVERY_LAMBDA_ARN ||
                `arn:aws:lambda:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:function:announcement-delivery`;

            await this.eventBridgeClient.send(new PutTargetsCommand({
                Rule: ruleName,
                Targets: [{
                    Id: '1',
                    Arn: targetArn,
                    Input: JSON.stringify({
                        announcementId: announcement.announcementId,
                    }),
                }],
            }));

            // Update announcement with EventBridge metadata
            announcement.metadata = {
                eventBridgeRuleName: ruleName,
                targetArn,
            };

            const keys = this.getAnnouncementKeys(announcement.announcementId);
            await this.repository.update(keys.PK, keys.SK, announcement);

        } catch (error) {
            console.error('Error scheduling announcement:', error);
            throw new Error('Failed to schedule announcement');
        }
    }

    /**
     * Cancels a scheduled announcement
     */
    async cancelScheduledAnnouncement(
        announcementId: string,
        cancelledBy: string
    ): Promise<void> {
        const announcement = await this.getAnnouncement(announcementId);

        if (!announcement) {
            throw new Error('Announcement not found');
        }

        if (announcement.status !== 'scheduled') {
            throw new Error('Only scheduled announcements can be cancelled');
        }

        // Remove EventBridge rule
        if (announcement.metadata?.eventBridgeRuleName) {
            try {
                await this.eventBridgeClient.send(new RemoveTargetsCommand({
                    Rule: announcement.metadata.eventBridgeRuleName,
                    Ids: ['1'],
                }));

                await this.eventBridgeClient.send(new DeleteRuleCommand({
                    Name: announcement.metadata.eventBridgeRuleName,
                }));
            } catch (error) {
                console.error('Error removing EventBridge rule:', error);
            }
        }

        // Update announcement status
        await this.updateAnnouncement(
            announcementId,
            { status: 'draft', scheduledFor: undefined },
            cancelledBy
        );

        // Create audit log
        await auditLogService.logAction(
            cancelledBy,
            'announcement_cancelled',
            'announcement',
            announcementId,
            announcement,
            { ...announcement, status: 'draft' }
        );
    }

    /**
     * Sends an announcement immediately
     */
    async sendAnnouncement(
        announcementId: string,
        sentBy: string
    ): Promise<AnnouncementDeliveryResult> {
        const announcement = await this.getAnnouncement(announcementId);

        if (!announcement) {
            throw new Error('Announcement not found');
        }

        // Get target users
        const targetUsers = await this.getTargetUsers(announcement);

        const result: AnnouncementDeliveryResult = {
            announcementId,
            sent: 0,
            delivered: 0,
            failed: 0,
            errors: [],
        };

        // Send to each user based on delivery method
        for (const userId of targetUsers) {
            try {
                if (announcement.deliveryMethod === 'email' || announcement.deliveryMethod === 'both') {
                    await this.sendEmailNotification(userId, announcement);
                }

                if (announcement.deliveryMethod === 'in_app' || announcement.deliveryMethod === 'both') {
                    await this.sendInAppNotification(userId, announcement);
                }

                result.sent++;
                result.delivered++;
            } catch (error: any) {
                result.failed++;
                result.errors.push({
                    userId,
                    error: error.message,
                });
            }
        }

        // Update announcement tracking
        const updatedTracking = {
            ...announcement.tracking,
            sent: result.sent,
            delivered: result.delivered,
            failed: result.failed,
        };

        await this.updateAnnouncement(
            announcementId,
            {
                status: 'sent',
                sentAt: new Date().toISOString(),
                tracking: updatedTracking,
            },
            sentBy
        );

        return result;
    }

    /**
     * Gets target users based on announcement targeting
     */
    private async getTargetUsers(announcement: Announcement): Promise<string[]> {
        if (announcement.targetAudience === 'all') {
            // Get all users
            const result = await this.repository.scan({
                filterExpression: 'EntityType = :type',
                expressionAttributeValues: {
                    ':type': 'User',
                },
            });
            return result.items.map((user: any) => user.id);
        }

        if (announcement.targetAudience === 'role' && announcement.targetValue) {
            // Get users by role
            const users: string[] = [];
            for (const role of announcement.targetValue) {
                const result = await this.repository.scan({
                    filterExpression: 'EntityType = :type AND #role = :roleValue',
                    expressionAttributeNames: {
                        '#role': 'role',
                    },
                    expressionAttributeValues: {
                        ':type': 'User',
                        ':roleValue': role,
                    },
                });
                users.push(...result.items.map((user: any) => user.id));
            }
            return [...new Set(users)]; // Remove duplicates
        }

        if (announcement.targetAudience === 'custom' && announcement.targetValue) {
            // Use provided user IDs
            return announcement.targetValue;
        }

        return [];
    }

    /**
     * Sends email notification for announcement
     */
    private async sendEmailNotification(
        userId: string,
        announcement: Announcement
    ): Promise<void> {
        // Get user email
        const userKeys = { PK: `USER#${userId}`, SK: 'PROFILE' };
        const user = await this.repository.get<any>(userKeys.PK, userKeys.SK);

        if (!user?.email) {
            throw new Error('User email not found');
        }

        // TODO: Integrate with SES email service
        // For now, we'll log the email that would be sent
        console.log('Sending email announcement:', {
            to: user.email,
            subject: announcement.title,
            content: announcement.richContent || announcement.content,
        });

        // In production, this would call SES:
        // await sesClient.send(new SendEmailCommand({
        //   Source: 'noreply@bayoncoagent.com',
        //   Destination: { ToAddresses: [user.email] },
        //   Message: {
        //     Subject: { Data: announcement.title },
        //     Body: { Html: { Data: announcement.richContent || announcement.content } },
        //   },
        // }));
    }

    /**
     * Sends in-app notification for announcement
     */
    private async sendInAppNotification(
        userId: string,
        announcement: Announcement
    ): Promise<void> {
        const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = new Date().toISOString();

        const notification = {
            notificationId,
            userId,
            type: 'announcement',
            title: announcement.title,
            content: announcement.content,
            read: false,
            createdAt: now,
            metadata: {
                announcementId: announcement.announcementId,
            },
        };

        // Store notification
        const keys = {
            PK: `USER#${userId}`,
            SK: `NOTIFICATION#${now}#${notificationId}`,
        };

        await this.repository.create(keys.PK, keys.SK, 'Notification', notification);
    }

    /**
     * Tracks announcement open
     */
    async trackOpen(announcementId: string, userId: string): Promise<void> {
        const announcement = await this.getAnnouncement(announcementId);

        if (!announcement) {
            return;
        }

        // Update tracking
        const updatedTracking = {
            ...announcement.tracking,
            opened: announcement.tracking.opened + 1,
        };

        await this.updateAnnouncement(
            announcementId,
            { tracking: updatedTracking },
            'system'
        );

        // Store individual tracking event
        const trackingKeys = {
            PK: `ANNOUNCEMENT#${announcementId}`,
            SK: `TRACKING#OPEN#${Date.now()}#${userId}`,
        };

        await this.repository.create(trackingKeys.PK, trackingKeys.SK, 'AnnouncementTracking', {
            announcementId,
            userId,
            event: 'open',
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Tracks announcement click
     */
    async trackClick(announcementId: string, userId: string, linkUrl?: string): Promise<void> {
        const announcement = await this.getAnnouncement(announcementId);

        if (!announcement) {
            return;
        }

        // Update tracking
        const updatedTracking = {
            ...announcement.tracking,
            clicked: announcement.tracking.clicked + 1,
        };

        await this.updateAnnouncement(
            announcementId,
            { tracking: updatedTracking },
            'system'
        );

        // Store individual tracking event
        const trackingKeys = {
            PK: `ANNOUNCEMENT#${announcementId}`,
            SK: `TRACKING#CLICK#${Date.now()}#${userId}`,
        };

        await this.repository.create(trackingKeys.PK, trackingKeys.SK, 'AnnouncementTracking', {
            announcementId,
            userId,
            event: 'click',
            linkUrl,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Gets announcement statistics
     */
    async getAnnouncementStats(announcementId: string): Promise<AnnouncementStats> {
        const announcement = await this.getAnnouncement(announcementId);

        if (!announcement) {
            throw new Error('Announcement not found');
        }

        const { sent, delivered, opened, clicked, failed } = announcement.tracking;

        return {
            announcementId,
            sent,
            delivered,
            opened,
            clicked,
            failed,
            openRate: sent > 0 ? (opened / sent) * 100 : 0,
            clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
        };
    }

    /**
     * Deletes an announcement
     */
    async deleteAnnouncement(announcementId: string, deletedBy: string): Promise<void> {
        const announcement = await this.getAnnouncement(announcementId);

        if (!announcement) {
            throw new Error('Announcement not found');
        }

        // Cancel if scheduled
        if (announcement.status === 'scheduled') {
            await this.cancelScheduledAnnouncement(announcementId, deletedBy);
        }

        // Delete from DynamoDB
        const keys = this.getAnnouncementKeys(announcementId);
        await this.repository.delete(keys.PK, keys.SK);

        // Create audit log
        await auditLogService.logAction(
            deletedBy,
            'announcement_deleted',
            'announcement',
            announcementId,
            announcement,
            undefined
        );
    }

    /**
     * Gets DynamoDB keys for an announcement
     */
    private getAnnouncementKeys(announcementId: string) {
        return {
            PK: 'ANNOUNCEMENT#ALL',
            SK: `ANNOUNCEMENT#${announcementId}`,
        };
    }
}

// Export singleton instance
export const announcementService = new AnnouncementService();
