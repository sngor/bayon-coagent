/**
 * Notification Service for Market Intelligence Alerts
 * 
 * Handles email notifications, digest generation, and template management
 * for the Market Intelligence Alerts system.
 */

import {
    sendEmail,
    sendBulkTemplatedEmail,
    createEmailTemplate,
    updateEmailTemplate,
    templateExists,
    upsertEmailTemplate,
} from '@/aws/ses/client';
import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import {
    Alert,
    AlertType,
    AlertSettings,
} from './types';
import {
    NotificationPreferences,
    EmailTemplateData,
    DigestData,
    DigestEmail,
    NotificationJob,
    NotificationSettings,
    NotificationEvent,
    NotificationDelivery,
    NotificationResponse,
    DigestResponse,
    EmailTemplate,
} from './notification-types';
import { alertDataAccess } from './data-access';

/**
 * Notification Service class
 * Handles all notification-related operations
 */
export class NotificationService {
    private repository: DynamoDBRepository;
    private defaultFromEmail: string;

    constructor() {
        this.repository = new DynamoDBRepository();
        this.defaultFromEmail = process.env.SES_FROM_EMAIL || 'noreply@bayoncoagent.com';
    }

    // ==================== Notification Preferences ====================

    /**
     * Gets notification preferences for a user
     */
    async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
        try {
            const result = await this.repository.get<NotificationPreferences>(
                `USER#${userId}`,
                'SETTINGS#NOTIFICATIONS'
            );

            if (result) {
                return result;
            }

            // Return default preferences if none exist
            return {
                userId,
                emailNotifications: true,
                frequency: 'real-time',
                enabledAlertTypes: [
                    'life-event-lead',
                    'competitor-new-listing',
                    'competitor-price-reduction',
                    'competitor-withdrawal',
                    'neighborhood-trend',
                    'price-reduction',
                ],
                updatedAt: new Date().toISOString(),
            };
        } catch (error) {
            // Return default preferences on error
            return {
                userId,
                emailNotifications: true,
                frequency: 'real-time',
                enabledAlertTypes: [
                    'life-event-lead',
                    'competitor-new-listing',
                    'competitor-price-reduction',
                    'competitor-withdrawal',
                    'neighborhood-trend',
                    'price-reduction',
                ],
                updatedAt: new Date().toISOString(),
            };
        }
    }

    /**
     * Updates notification preferences for a user
     */
    async updateNotificationPreferences(
        userId: string,
        preferences: Partial<NotificationPreferences>
    ): Promise<void> {
        const current = await this.getNotificationPreferences(userId);
        const updated: NotificationPreferences = {
            ...current,
            ...preferences,
            userId,
            updatedAt: new Date().toISOString(),
        };

        await this.repository.put({
            PK: `USER#${userId}`,
            SK: 'SETTINGS#NOTIFICATIONS',
            EntityType: 'NotificationPreferences',
            Data: updated,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
        });
    }

    // ==================== Email Templates ====================

    /**
     * Initializes default email templates
     */
    async initializeEmailTemplates(): Promise<void> {
        const templates = this.getDefaultTemplates();

        for (const template of templates) {
            await upsertEmailTemplate(
                template.name,
                template.subject,
                template.htmlBody,
                template.textBody
            );
        }
    }

    /**
     * Gets default email templates
     */
    private getDefaultTemplates(): EmailTemplate[] {
        return [
            {
                name: 'alert-real-time',
                subject: 'New Market Alert: {{alertType}}',
                htmlBody: this.getRealTimeHtmlTemplate(),
                textBody: this.getRealTimeTextTemplate(),
                description: 'Real-time alert notification',
                variables: ['agentName', 'alertType', 'alertData', 'unsubscribeUrl'],
            },
            {
                name: 'alert-daily-digest',
                subject: 'Daily Market Intelligence Digest - {{digestDate}}',
                htmlBody: this.getDailyDigestHtmlTemplate(),
                textBody: this.getDailyDigestTextTemplate(),
                description: 'Daily digest of alerts',
                variables: ['agentName', 'digestDate', 'totalAlerts', 'alertsByType', 'unsubscribeUrl'],
            },
            {
                name: 'alert-weekly-digest',
                subject: 'Weekly Market Intelligence Summary - {{digestDate}}',
                htmlBody: this.getWeeklyDigestHtmlTemplate(),
                textBody: this.getWeeklyDigestTextTemplate(),
                description: 'Weekly digest of alerts',
                variables: ['agentName', 'digestDate', 'totalAlerts', 'alertsByType', 'unsubscribeUrl'],
            },
        ];
    }

    // ==================== Real-time Notifications ====================

    /**
     * Sends a real-time notification for a new alert
     */
    async sendRealTimeNotification(userId: string, alert: Alert): Promise<NotificationResponse> {
        try {
            const preferences = await this.getNotificationPreferences(userId);

            // Check if notifications are enabled
            if (!preferences.emailNotifications) {
                return { success: true }; // Not an error, just disabled
            }

            // Check if this alert type is enabled
            if (!preferences.enabledAlertTypes.includes(alert.type)) {
                return { success: true }; // Not an error, just disabled for this type
            }

            // Check if we're in quiet hours
            if (this.isInQuietHours(preferences)) {
                // Queue for later delivery
                await this.queueNotification(userId, [alert.id], 'real-time');
                return { success: true };
            }

            // Get user profile for template data
            const userProfile = await this.getUserProfile(userId);

            const templateData: EmailTemplateData = {
                agentName: userProfile.name || 'Agent',
                agentEmail: userProfile.email || preferences.emailAddress || '',
                alert,
                unsubscribeUrl: this.generateUnsubscribeUrl(userId),
                preferencesUrl: this.generatePreferencesUrl(userId),
            };

            const subject = this.generateAlertSubject(alert);
            const htmlBody = this.generateAlertHtmlBody(alert, templateData);
            const textBody = this.generateAlertTextBody(alert, templateData);

            const messageId = await sendEmail(
                preferences.emailAddress || userProfile.email || '',
                subject,
                htmlBody,
                this.defaultFromEmail,
                true
            );

            // Log the notification event
            await this.logNotificationEvent(userId, 'email_sent', alert.id, messageId);

            return { success: true, messageId };
        } catch (error) {
            console.error('Failed to send real-time notification:', error);

            // Log the failure
            await this.logNotificationEvent(userId, 'email_failed', alert.id, undefined, {
                error: error instanceof Error ? error.message : 'Unknown error',
            });

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send notification'
            };
        }
    }

    // ==================== Digest Generation ====================

    /**
     * Generates and sends daily digest
     */
    async sendDailyDigest(userId: string): Promise<DigestResponse> {
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 1);

        return this.sendDigest(userId, 'daily', startDate.toISOString(), endDate.toISOString());
    }

    /**
     * Generates and sends weekly digest
     */
    async sendWeeklyDigest(userId: string): Promise<DigestResponse> {
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);

        return this.sendDigest(userId, 'weekly', startDate.toISOString(), endDate.toISOString());
    }

    /**
     * Generates and sends digest for a specific period
     */
    private async sendDigest(
        userId: string,
        period: 'daily' | 'weekly',
        startDate: string,
        endDate: string
    ): Promise<DigestResponse> {
        try {
            const preferences = await this.getNotificationPreferences(userId);

            // Check if notifications are enabled
            if (!preferences.emailNotifications) {
                return { success: true, emailsSent: 0, errors: [] };
            }

            // Get alerts for the period
            const alertsResponse = await alertDataAccess.getAlertsByDateRange(
                userId,
                startDate,
                endDate
            );

            // Filter by enabled alert types
            const alerts = alertsResponse.alerts.filter(alert =>
                preferences.enabledAlertTypes.includes(alert.type)
            );

            if (alerts.length === 0) {
                return { success: true, emailsSent: 0, errors: [] };
            }

            // Generate digest data
            const digestData = this.generateDigestData(userId, period, startDate, endDate, alerts);

            // Get user profile for template data
            const userProfile = await this.getUserProfile(userId);

            const templateData: EmailTemplateData = {
                agentName: userProfile.name || 'Agent',
                agentEmail: userProfile.email || preferences.emailAddress || '',
                alerts,
                digestDate: new Date().toLocaleDateString(),
                totalAlerts: alerts.length,
                highPriorityCount: alerts.filter(a => a.priority === 'high').length,
                alertsByType: digestData.summary.countsByType,
                unsubscribeUrl: this.generateUnsubscribeUrl(userId),
                preferencesUrl: this.generatePreferencesUrl(userId),
            };

            const subject = `${period === 'daily' ? 'Daily' : 'Weekly'} Market Intelligence Digest - ${templateData.digestDate}`;
            const htmlBody = this.generateDigestHtmlBody(digestData, templateData);
            const textBody = this.generateDigestTextBody(digestData, templateData);

            const messageId = await sendEmail(
                preferences.emailAddress || userProfile.email || '',
                subject,
                htmlBody,
                this.defaultFromEmail,
                true
            );

            // Log the notification event
            await this.logNotificationEvent(userId, 'email_sent', undefined, messageId);

            return { success: true, emailsSent: 1, errors: [] };
        } catch (error) {
            console.error(`Failed to send ${period} digest:`, error);

            // Log the failure
            await this.logNotificationEvent(userId, 'email_failed', undefined, undefined, {
                error: error instanceof Error ? error.message : 'Unknown error',
                period,
            });

            return {
                success: false,
                emailsSent: 0,
                errors: [error instanceof Error ? error.message : 'Failed to send digest']
            };
        }
    }

    // ==================== Helper Methods ====================

    /**
     * Checks if current time is within quiet hours
     */
    private isInQuietHours(preferences: NotificationPreferences): boolean {
        if (!preferences.quietHours?.enabled) {
            return false;
        }

        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

        return currentTime >= preferences.quietHours.startTime &&
            currentTime <= preferences.quietHours.endTime;
    }

    /**
     * Queues a notification for later delivery
     */
    private async queueNotification(
        userId: string,
        alertIds: string[],
        type: 'real-time' | 'digest'
    ): Promise<void> {
        const job: NotificationJob = {
            id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            type,
            alertIds,
            scheduledFor: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
            status: 'pending',
            attempts: 0,
            maxAttempts: 3,
            createdAt: new Date().toISOString(),
        };

        await this.repository.put({
            PK: `USER#${userId}`,
            SK: `NOTIFICATION_JOB#${job.id}`,
            EntityType: 'NotificationJob',
            Data: job,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
        });
    }

    /**
     * Gets user profile information
     */
    private async getUserProfile(userId: string): Promise<{ name?: string; email?: string }> {
        try {
            const profile = await this.repository.get(`USER#${userId}`, 'PROFILE');
            return {
                name: profile?.Data?.name,
                email: profile?.Data?.email,
            };
        } catch (error) {
            return {};
        }
    }

    /**
     * Logs a notification event
     */
    private async logNotificationEvent(
        userId: string,
        type: 'email_sent' | 'email_failed' | 'email_bounced' | 'email_complained',
        alertId?: string,
        messageId?: string,
        details?: Record<string, any>
    ): Promise<void> {
        const event: NotificationEvent = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            type,
            alertId,
            messageId,
            email: '', // Will be filled from preferences
            timestamp: new Date().toISOString(),
            details,
        };

        await this.repository.put({
            PK: `USER#${userId}`,
            SK: `NOTIFICATION_EVENT#${event.timestamp}#${event.id}`,
            EntityType: 'NotificationEvent',
            Data: event,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
        });
    }

    /**
     * Generates digest data
     */
    private generateDigestData(
        userId: string,
        period: 'daily' | 'weekly',
        startDate: string,
        endDate: string,
        alerts: Alert[]
    ): DigestData {
        const countsByType: Record<AlertType, number> = {
            'life-event-lead': 0,
            'competitor-new-listing': 0,
            'competitor-price-reduction': 0,
            'competitor-withdrawal': 0,
            'neighborhood-trend': 0,
            'price-reduction': 0,
        };

        const countsByPriority: Record<string, number> = {
            high: 0,
            medium: 0,
            low: 0,
        };

        alerts.forEach(alert => {
            countsByType[alert.type]++;
            countsByPriority[alert.priority]++;
        });

        return {
            userId,
            period,
            startDate,
            endDate,
            alerts,
            summary: {
                totalCount: alerts.length,
                highPriorityCount: countsByPriority.high,
                countsByType,
                countsByPriority,
            },
            generatedAt: new Date().toISOString(),
        };
    }

    /**
     * Generates unsubscribe URL
     */
    private generateUnsubscribeUrl(userId: string): string {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.bayoncoagent.com';
        return `${baseUrl}/settings/notifications/unsubscribe?user=${userId}`;
    }

    /**
     * Generates preferences URL
     */
    private generatePreferencesUrl(userId: string): string {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.bayoncoagent.com';
        return `${baseUrl}/settings/notifications`;
    }

    // ==================== Template Generation Methods ====================

    private generateAlertSubject(alert: Alert): string {
        switch (alert.type) {
            case 'life-event-lead':
                return `New High-Intent Lead: ${alert.data.eventType} in ${alert.data.prospectLocation}`;
            case 'competitor-new-listing':
                return `Competitor New Listing: ${alert.data.propertyAddress}`;
            case 'competitor-price-reduction':
                return `Competitor Price Reduction: ${alert.data.propertyAddress}`;
            case 'competitor-withdrawal':
                return `Competitor Listing Withdrawn: ${alert.data.propertyAddress}`;
            case 'neighborhood-trend':
                return `Market Trend Alert: ${alert.data.neighborhood}`;
            case 'price-reduction':
                return `Price Reduction Alert: ${alert.data.propertyAddress}`;
            default:
                return 'New Market Alert';
        }
    }

    private generateAlertHtmlBody(alert: Alert, templateData: EmailTemplateData): string {
        // This would be a more sophisticated template in production
        return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Market Intelligence Alert</h2>
            <p>Hello ${templateData.agentName},</p>
            <p>You have a new ${alert.type.replace('-', ' ')} alert:</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${this.getAlertHtmlContent(alert)}
            </div>
            
            <p>Priority: <strong>${alert.priority.toUpperCase()}</strong></p>
            <p>Created: ${new Date(alert.createdAt).toLocaleString()}</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #6b7280;">
                <a href="${templateData.preferencesUrl}">Manage notification preferences</a> | 
                <a href="${templateData.unsubscribeUrl}">Unsubscribe</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    }

    private generateAlertTextBody(alert: Alert, templateData: EmailTemplateData): string {
        return `
Market Intelligence Alert

Hello ${templateData.agentName},

You have a new ${alert.type.replace('-', ' ')} alert:

${this.getAlertTextContent(alert)}

Priority: ${alert.priority.toUpperCase()}
Created: ${new Date(alert.createdAt).toLocaleString()}

---
Manage notification preferences: ${templateData.preferencesUrl}
Unsubscribe: ${templateData.unsubscribeUrl}
    `.trim();
    }

    private getAlertHtmlContent(alert: Alert): string {
        switch (alert.type) {
            case 'life-event-lead':
                return `
          <h3>High-Intent Lead Identified</h3>
          <p><strong>Location:</strong> ${alert.data.prospectLocation}</p>
          <p><strong>Event:</strong> ${alert.data.eventType}</p>
          <p><strong>Lead Score:</strong> ${alert.data.leadScore}/100</p>
          <p><strong>Recommended Action:</strong> ${alert.data.recommendedAction}</p>
        `;
            case 'competitor-new-listing':
                return `
          <h3>Competitor New Listing</h3>
          <p><strong>Property:</strong> ${alert.data.propertyAddress}</p>
          <p><strong>Competitor:</strong> ${alert.data.competitorName}</p>
          <p><strong>Listing Price:</strong> $${alert.data.listingPrice?.toLocaleString()}</p>
        `;
            case 'competitor-price-reduction':
                return `
          <h3>Competitor Price Reduction</h3>
          <p><strong>Property:</strong> ${alert.data.propertyAddress}</p>
          <p><strong>Competitor:</strong> ${alert.data.competitorName}</p>
          <p><strong>Original Price:</strong> $${alert.data.originalPrice?.toLocaleString()}</p>
          <p><strong>New Price:</strong> $${alert.data.newPrice?.toLocaleString()}</p>
          <p><strong>Reduction:</strong> ${alert.data.priceReductionPercent}%</p>
        `;
            case 'neighborhood-trend':
                return `
          <h3>Neighborhood Trend Alert</h3>
          <p><strong>Neighborhood:</strong> ${alert.data.neighborhood}</p>
          <p><strong>Trend:</strong> ${alert.data.trendType.replace('-', ' ')}</p>
          <p><strong>Change:</strong> ${alert.data.changePercent}%</p>
        `;
            case 'price-reduction':
                return `
          <h3>Price Reduction</h3>
          <p><strong>Property:</strong> ${alert.data.propertyAddress}</p>
          <p><strong>Original Price:</strong> $${alert.data.originalPrice?.toLocaleString()}</p>
          <p><strong>New Price:</strong> $${alert.data.newPrice?.toLocaleString()}</p>
          <p><strong>Reduction:</strong> ${alert.data.priceReductionPercent}%</p>
        `;
            default:
                return '<p>Alert details not available</p>';
        }
    }

    private getAlertTextContent(alert: Alert): string {
        switch (alert.type) {
            case 'life-event-lead':
                return `
High-Intent Lead Identified
Location: ${alert.data.prospectLocation}
Event: ${alert.data.eventType}
Lead Score: ${alert.data.leadScore}/100
Recommended Action: ${alert.data.recommendedAction}
        `.trim();
            case 'competitor-new-listing':
                return `
Competitor New Listing
Property: ${alert.data.propertyAddress}
Competitor: ${alert.data.competitorName}
Listing Price: $${alert.data.listingPrice?.toLocaleString()}
        `.trim();
            case 'competitor-price-reduction':
                return `
Competitor Price Reduction
Property: ${alert.data.propertyAddress}
Competitor: ${alert.data.competitorName}
Original Price: $${alert.data.originalPrice?.toLocaleString()}
New Price: $${alert.data.newPrice?.toLocaleString()}
Reduction: ${alert.data.priceReductionPercent}%
        `.trim();
            case 'neighborhood-trend':
                return `
Neighborhood Trend Alert
Neighborhood: ${alert.data.neighborhood}
Trend: ${alert.data.trendType.replace('-', ' ')}
Change: ${alert.data.changePercent}%
        `.trim();
            case 'price-reduction':
                return `
Price Reduction
Property: ${alert.data.propertyAddress}
Original Price: $${alert.data.originalPrice?.toLocaleString()}
New Price: $${alert.data.newPrice?.toLocaleString()}
Reduction: ${alert.data.priceReductionPercent}%
        `.trim();
            default:
                return 'Alert details not available';
        }
    }

    private generateDigestHtmlBody(digestData: DigestData, templateData: EmailTemplateData): string {
        const alertsByTypeHtml = Object.entries(digestData.summary.countsByType)
            .filter(([_, count]) => count > 0)
            .map(([type, count]) => `<li>${type.replace('-', ' ')}: ${count}</li>`)
            .join('');

        return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">${digestData.period === 'daily' ? 'Daily' : 'Weekly'} Market Intelligence Digest</h2>
            <p>Hello ${templateData.agentName},</p>
            <p>Here's your ${digestData.period} summary of market intelligence alerts:</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Summary</h3>
              <p><strong>Total Alerts:</strong> ${digestData.summary.totalCount}</p>
              <p><strong>High Priority:</strong> ${digestData.summary.highPriorityCount}</p>
              
              <h4>Alerts by Type:</h4>
              <ul>${alertsByTypeHtml}</ul>
            </div>
            
            <p>Period: ${new Date(digestData.startDate).toLocaleDateString()} - ${new Date(digestData.endDate).toLocaleDateString()}</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #6b7280;">
                <a href="${templateData.preferencesUrl}">Manage notification preferences</a> | 
                <a href="${templateData.unsubscribeUrl}">Unsubscribe</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    }

    private generateDigestTextBody(digestData: DigestData, templateData: EmailTemplateData): string {
        const alertsByTypeText = Object.entries(digestData.summary.countsByType)
            .filter(([_, count]) => count > 0)
            .map(([type, count]) => `- ${type.replace('-', ' ')}: ${count}`)
            .join('\n');

        return `
${digestData.period === 'daily' ? 'Daily' : 'Weekly'} Market Intelligence Digest

Hello ${templateData.agentName},

Here's your ${digestData.period} summary of market intelligence alerts:

Summary:
- Total Alerts: ${digestData.summary.totalCount}
- High Priority: ${digestData.summary.highPriorityCount}

Alerts by Type:
${alertsByTypeText}

Period: ${new Date(digestData.startDate).toLocaleDateString()} - ${new Date(digestData.endDate).toLocaleDateString()}

---
Manage notification preferences: ${templateData.preferencesUrl}
Unsubscribe: ${templateData.unsubscribeUrl}
    `.trim();
    }

    // Template methods for SES templates (simplified versions)
    private getRealTimeHtmlTemplate(): string {
        return `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>Market Intelligence Alert</h2>
          <p>Hello {{agentName}},</p>
          <p>{{alertContent}}</p>
          <p><a href="{{preferencesUrl}}">Manage preferences</a> | <a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
        </body>
      </html>
    `;
    }

    private getRealTimeTextTemplate(): string {
        return `
Market Intelligence Alert

Hello {{agentName}},

{{alertContent}}

Manage preferences: {{preferencesUrl}}
Unsubscribe: {{unsubscribeUrl}}
    `;
    }

    private getDailyDigestHtmlTemplate(): string {
        return `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>Daily Market Intelligence Digest</h2>
          <p>Hello {{agentName}},</p>
          <p>Total alerts: {{totalAlerts}}</p>
          <p><a href="{{preferencesUrl}}">Manage preferences</a> | <a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
        </body>
      </html>
    `;
    }

    private getDailyDigestTextTemplate(): string {
        return `
Daily Market Intelligence Digest

Hello {{agentName}},

Total alerts: {{totalAlerts}}

Manage preferences: {{preferencesUrl}}
Unsubscribe: {{unsubscribeUrl}}
    `;
    }

    private getWeeklyDigestHtmlTemplate(): string {
        return `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>Weekly Market Intelligence Summary</h2>
          <p>Hello {{agentName}},</p>
          <p>Total alerts: {{totalAlerts}}</p>
          <p><a href="{{preferencesUrl}}">Manage preferences</a> | <a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
        </body>
      </html>
    `;
    }

    private getWeeklyDigestTextTemplate(): string {
        return `
Weekly Market Intelligence Summary

Hello {{agentName}},

Total alerts: {{totalAlerts}}

Manage preferences: {{preferencesUrl}}
Unsubscribe: {{unsubscribeUrl}}
    `;
    }
}

// Export a singleton instance
export const notificationService = new NotificationService();

// Export factory function for getting the service instance
export const getNotificationService = () => notificationService;