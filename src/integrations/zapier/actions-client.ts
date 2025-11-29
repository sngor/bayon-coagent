/**
 * Zapier Actions Client
 * 
 * Sends data to Zapier as actions (for use in Zap action steps).
 * Allows the application to push data to Zapier workflows.
 */

import { integrationRepository } from '../integration-repository';
import { ZapierActionType } from './types';
import { ZAPIER_ENDPOINTS, RATE_LIMITS } from './constants';

/**
 * Rate limiter for Zapier actions
 */
class ActionRateLimiter {
    private requestTimestamps: number[] = [];

    canMakeRequest(): boolean {
        const now = Date.now();
        const oneMinuteAgo = now - 60 * 1000;

        // Remove timestamps older than 1 minute
        this.requestTimestamps = this.requestTimestamps.filter(
            timestamp => timestamp > oneMinuteAgo
        );

        return this.requestTimestamps.length < RATE_LIMITS.actionsPerMinute;
    }

    recordRequest(): void {
        this.requestTimestamps.push(Date.now());
    }

    getWaitTime(): number {
        if (this.canMakeRequest()) {
            return 0;
        }

        const oldestTimestamp = this.requestTimestamps[0];
        const oneMinuteAgo = Date.now() - 60 * 1000;
        return Math.max(0, oldestTimestamp - oneMinuteAgo);
    }
}

const rateLimiter = new ActionRateLimiter();

/**
 * Zapier Actions Client
 */
export class ZapierActionsClient {
    /**
     * Send action data to Zapier
     */
    async sendAction(
        userId: string,
        actionType: ZapierActionType,
        data: Record<string, any>
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // Check rate limits
            if (!rateLimiter.canMakeRequest()) {
                const waitTime = rateLimiter.getWaitTime();
                return {
                    success: false,
                    error: `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`
                };
            }

            // Get user's Zapier connection
            const connection = await integrationRepository.getByProvider(userId, 'zapier');

            if (!connection) {
                return {
                    success: false,
                    error: 'Zapier not connected'
                };
            }

            // Prepare action payload
            const payload = {
                action: actionType,
                timestamp: Date.now(),
                userId,
                data
            };

            // Send to Zapier API
            const response = await fetch(`${ZAPIER_ENDPOINTS.api}/actions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${connection.credentials.accessToken}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    success: false,
                    error: `Action failed: ${errorText}`
                };
            }

            // Record request for rate limiting
            rateLimiter.recordRequest();

            return { success: true };
        } catch (error) {
            console.error('Failed to send Zapier action:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Action failed'
            };
        }
    }

    /**
     * Send notification action
     */
    async sendNotification(
        userId: string,
        title: string,
        message: string,
        metadata?: Record<string, any>
    ): Promise<{ success: boolean; error?: string }> {
        return this.sendAction(userId, 'send.notification', {
            title,
            message,
            ...metadata
        });
    }

    /**
     * Create task action
     */
    async createTask(
        userId: string,
        taskTitle: string,
        taskDescription: string,
        dueDate?: Date,
        metadata?: Record<string, any>
    ): Promise<{ success: boolean; error?: string }> {
        return this.sendAction(userId, 'create.task', {
            title: taskTitle,
            description: taskDescription,
            dueDate: dueDate?.toISOString(),
            ...metadata
        });
    }

    /**
     * Update CRM action
     */
    async updateCRM(
        userId: string,
        contactId: string,
        updates: Record<string, any>
    ): Promise<{ success: boolean; error?: string }> {
        return this.sendAction(userId, 'update.crm', {
            contactId,
            updates
        });
    }

    /**
     * Post to social media action
     */
    async postToSocial(
        userId: string,
        platform: string,
        content: string,
        mediaUrl?: string
    ): Promise<{ success: boolean; error?: string }> {
        return this.sendAction(userId, 'post.social', {
            platform,
            content,
            mediaUrl
        });
    }

    /**
     * Send email action
     */
    async sendEmail(
        userId: string,
        to: string,
        subject: string,
        body: string,
        metadata?: Record<string, any>
    ): Promise<{ success: boolean; error?: string }> {
        return this.sendAction(userId, 'send.email', {
            to,
            subject,
            body,
            ...metadata
        });
    }

    /**
     * Log activity action
     */
    async logActivity(
        userId: string,
        activityType: string,
        description: string,
        metadata?: Record<string, any>
    ): Promise<{ success: boolean; error?: string }> {
        return this.sendAction(userId, 'log.activity', {
            activityType,
            description,
            ...metadata
        });
    }

    /**
     * Get rate limit status
     */
    getRateLimitStatus(): {
        canMakeRequest: boolean;
        waitTime: number;
        remaining: number;
    } {
        return {
            canMakeRequest: rateLimiter.canMakeRequest(),
            waitTime: rateLimiter.getWaitTime(),
            remaining: Math.max(
                0,
                RATE_LIMITS.actionsPerMinute - rateLimiter['requestTimestamps'].length
            )
        };
    }
}

// Export singleton instance
export const actionsClient = new ZapierActionsClient();
