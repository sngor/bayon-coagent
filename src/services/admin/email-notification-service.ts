/**
 * Email Notification Service
 * 
 * Handles all admin-related email notifications including:
 * - Support ticket notifications
 * - System health alerts
 * - Announcement delivery
 * - Feedback responses
 * - Maintenance notifications
 * 
 * Features:
 * - Email templates for all notification types
 * - Async delivery with retry logic
 * - Email tracking and logging
 * - Batch sending to avoid spam
 */

import { sendEmail, sendBulkTemplatedEmail, upsertEmailTemplate } from '@/aws/ses/client';
import { getConfig } from '@/aws/config';
import { getRepository } from '@/aws/dynamodb/repository';
import { generateAdminKeys } from '@/aws/dynamodb/keys';

export interface EmailNotification {
    notificationId: string;
    type: 'support_ticket' | 'system_alert' | 'announcement' | 'feedback_response' | 'maintenance';
    to: string | string[];
    subject: string;
    body: string;
    templateData?: Record<string, any>;
    status: 'pending' | 'sent' | 'failed';
    attempts: number;
    lastAttempt?: number;
    sentAt?: number;
    error?: string;
    createdAt: number;
}

export interface EmailTemplate {
    templateId: string;
    name: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    variables: string[];
    createdAt: number;
    updatedAt: number;
}

export class EmailNotificationService {
    private repository = getRepository();
    private config = getConfig();
    private maxRetries = 3;
    private retryDelay = 5000; // 5 seconds

    /**
     * Initializes email templates in SES
     */
    async initializeTemplates(): Promise<void> {
        const templates = this.getDefaultTemplates();

        for (const template of templates) {
            try {
                await upsertEmailTemplate(
                    template.templateId,
                    template.subject,
                    template.htmlBody,
                    template.textBody
                );
                console.log(`Email template ${template.templateId} initialized`);
            } catch (error) {
                console.error(`Failed to initialize template ${template.templateId}:`, error);
            }
        }
    }

    /**
     * Sends a support ticket notification
     */
    async sendSupportTicketNotification(params: {
        to: string;
        ticketId: string;
        subject: string;
        userName: string;
        message: string;
        isResponse?: boolean;
    }): Promise<void> {
        const { to, ticketId, subject, userName, message, isResponse = false } = params;

        const emailSubject = isResponse
            ? `Response to your support ticket: ${subject}`
            : `New support ticket: ${subject}`;

        const htmlBody = this.renderSupportTicketEmail({
            ticketId,
            subject,
            userName,
            message,
            isResponse,
        });

        await this.queueEmail({
            type: 'support_ticket',
            to,
            subject: emailSubject,
            body: htmlBody,
        });
    }

    /**
     * Sends a system health alert
     */
    async sendSystemHealthAlert(params: {
        to: string | string[];
        severity: 'info' | 'warning' | 'critical';
        message: string;
        metrics?: Record<string, any>;
    }): Promise<void> {
        const { to, severity, message, metrics } = params;

        const subject = `[${severity.toUpperCase()}] System Health Alert`;
        const htmlBody = this.renderSystemHealthAlertEmail({
            severity,
            message,
            metrics,
        });

        await this.queueEmail({
            type: 'system_alert',
            to,
            subject,
            body: htmlBody,
        });
    }

    /**
     * Sends an announcement
     */
    async sendAnnouncement(params: {
        to: string | string[];
        title: string;
        content: string;
        ctaText?: string;
        ctaUrl?: string;
    }): Promise<void> {
        const { to, title, content, ctaText, ctaUrl } = params;

        const subject = title;
        const htmlBody = this.renderAnnouncementEmail({
            title,
            content,
            ctaText,
            ctaUrl,
        });

        await this.queueEmail({
            type: 'announcement',
            to,
            subject,
            body: htmlBody,
        });
    }

    /**
     * Sends a feedback response notification
     */
    async sendFeedbackResponse(params: {
        to: string;
        userName: string;
        feedbackText: string;
        responseText: string;
        adminName: string;
    }): Promise<void> {
        const { to, userName, feedbackText, responseText, adminName } = params;

        const subject = 'Response to your feedback';
        const htmlBody = this.renderFeedbackResponseEmail({
            userName,
            feedbackText,
            responseText,
            adminName,
        });

        await this.queueEmail({
            type: 'feedback_response',
            to,
            subject,
            body: htmlBody,
        });
    }

    /**
     * Sends a maintenance notification
     */
    async sendMaintenanceNotification(params: {
        to: string | string[];
        type: 'scheduled' | 'started' | 'completed' | 'cancelled';
        startTime?: Date;
        endTime?: Date;
        message?: string;
    }): Promise<void> {
        const { to, type, startTime, endTime, message } = params;

        const subject = this.getMaintenanceSubject(type);
        const htmlBody = this.renderMaintenanceEmail({
            type,
            startTime,
            endTime,
            message,
        });

        await this.queueEmail({
            type: 'maintenance',
            to,
            subject,
            body: htmlBody,
        });
    }

    /**
     * Sends bulk emails with retry logic
     */
    async sendBulkEmails(params: {
        recipients: Array<{ email: string; data?: Record<string, any> }>;
        subject: string;
        body: string;
    }): Promise<{ sent: number; failed: number }> {
        const { recipients, subject, body } = params;
        let sent = 0;
        let failed = 0;

        // Send in batches of 50 to avoid rate limits
        const batchSize = 50;
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);

            for (const recipient of batch) {
                try {
                    await this.queueEmail({
                        type: 'announcement',
                        to: recipient.email,
                        subject,
                        body,
                        templateData: recipient.data,
                    });
                    sent++;
                } catch (error) {
                    console.error(`Failed to queue email for ${recipient.email}:`, error);
                    failed++;
                }
            }

            // Add delay between batches
            if (i + batchSize < recipients.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return { sent, failed };
    }

    /**
     * Queues an email for delivery
     */
    private async queueEmail(params: {
        type: EmailNotification['type'];
        to: string | string[];
        subject: string;
        body: string;
        templateData?: Record<string, any>;
    }): Promise<string> {
        const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const notification: EmailNotification = {
            notificationId,
            type: params.type,
            to: params.to,
            subject: params.subject,
            body: params.body,
            templateData: params.templateData,
            status: 'pending',
            attempts: 0,
            createdAt: Date.now(),
        };

        // Store in DynamoDB
        const keys = generateAdminKeys.emailNotification(notificationId);
        await this.repository.create({
            ...keys,
            EntityType: 'EmailNotification',
            Data: notification,
        });

        // Attempt to send immediately
        await this.processNotification(notificationId);

        return notificationId;
    }

    /**
     * Processes a queued notification
     */
    private async processNotification(notificationId: string): Promise<void> {
        const keys = generateAdminKeys.emailNotification(notificationId);
        const item = await this.repository.get(keys.PK, keys.SK);

        if (!item) {
            console.error(`Notification ${notificationId} not found`);
            return;
        }

        const notification = item.Data as EmailNotification;

        // Check if already sent or max retries exceeded
        if (notification.status === 'sent' || notification.attempts >= this.maxRetries) {
            return;
        }

        try {
            // Send email
            const from = this.config.ses.fromEmail;
            await sendEmail(
                notification.to,
                notification.subject,
                notification.body,
                from,
                true
            );

            // Update status to sent
            await this.repository.update(keys.PK, keys.SK, {
                'Data.status': 'sent',
                'Data.sentAt': Date.now(),
                'Data.attempts': notification.attempts + 1,
            });

            console.log(`Email notification ${notificationId} sent successfully`);
        } catch (error: any) {
            console.error(`Failed to send email notification ${notificationId}:`, error);

            // Update with error and increment attempts
            await this.repository.update(keys.PK, keys.SK, {
                'Data.status': notification.attempts + 1 >= this.maxRetries ? 'failed' : 'pending',
                'Data.attempts': notification.attempts + 1,
                'Data.lastAttempt': Date.now(),
                'Data.error': error.message,
            });

            // Retry if not exceeded max attempts
            if (notification.attempts + 1 < this.maxRetries) {
                setTimeout(() => {
                    this.processNotification(notificationId);
                }, this.retryDelay * (notification.attempts + 1)); // Exponential backoff
            }
        }
    }

    /**
     * Gets pending notifications for retry
     */
    async getPendingNotifications(): Promise<EmailNotification[]> {
        const keys = generateAdminKeys.emailNotificationList();
        const items = await this.repository.query(keys.PK, keys.SK);

        return items
            .map(item => item.Data as EmailNotification)
            .filter(n => n.status === 'pending' && n.attempts < this.maxRetries);
    }

    /**
     * Retries failed notifications
     */
    async retryFailedNotifications(): Promise<void> {
        const pending = await this.getPendingNotifications();

        for (const notification of pending) {
            await this.processNotification(notification.notificationId);
        }
    }

    /**
     * Gets notification history
     */
    async getNotificationHistory(options?: {
        type?: EmailNotification['type'];
        status?: EmailNotification['status'];
        limit?: number;
    }): Promise<EmailNotification[]> {
        const keys = generateAdminKeys.emailNotificationList();
        const items = await this.repository.query(keys.PK, keys.SK, {
            limit: options?.limit || 100,
        });

        let notifications = items.map(item => item.Data as EmailNotification);

        if (options?.type) {
            notifications = notifications.filter(n => n.type === options.type);
        }

        if (options?.status) {
            notifications = notifications.filter(n => n.status === options.status);
        }

        return notifications.sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * Email template renderers
     */
    private renderSupportTicketEmail(params: {
        ticketId: string;
        subject: string;
        userName: string;
        message: string;
        isResponse: boolean;
    }): string {
        const { ticketId, subject, userName, message, isResponse } = params;

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0070f3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .ticket-info { background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .message { background-color: white; padding: 20px; border-left: 4px solid #0070f3; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        .button { display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Bayon Coagent Support</h1>
        </div>
        <div class="content">
            <h2>${isResponse ? 'Response to Your Support Ticket' : 'New Support Ticket'}</h2>
            <div class="ticket-info">
                <p><strong>Ticket ID:</strong> ${ticketId}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>${isResponse ? 'From' : 'User'}:</strong> ${userName}</p>
            </div>
            <div class="message">
                <p>${message.replace(/\n/g, '<br>')}</p>
            </div>
            ${isResponse ? `
            <div style="text-align: center;">
                <a href="${this.config.amplify?.appUrl || 'https://app.bayoncoagent.com'}/support?ticket=${ticketId}" class="button">View Ticket</a>
            </div>
            ` : ''}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Bayon Coagent. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
    }

    private renderSystemHealthAlertEmail(params: {
        severity: 'info' | 'warning' | 'critical';
        message: string;
        metrics?: Record<string, any>;
    }): string {
        const { severity, message, metrics } = params;

        const severityColors = {
            info: '#0070f3',
            warning: '#f5a623',
            critical: '#e74c3c',
        };

        const color = severityColors[severity];

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert { background-color: white; padding: 20px; border-left: 4px solid ${color}; margin: 20px 0; }
        .metrics { background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .metric-item { padding: 10px 0; border-bottom: 1px solid #eee; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        .button { display: inline-block; background-color: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ System Health Alert</h1>
            <p style="margin: 0; font-size: 18px;">${severity.toUpperCase()}</p>
        </div>
        <div class="content">
            <div class="alert">
                <p>${message}</p>
            </div>
            ${metrics ? `
            <div class="metrics">
                <h3>Metrics</h3>
                ${Object.entries(metrics).map(([key, value]) => `
                <div class="metric-item">
                    <strong>${key}:</strong> ${value}
                </div>
                `).join('')}
            </div>
            ` : ''}
            <div style="text-align: center;">
                <a href="${this.config.amplify?.appUrl || 'https://app.bayoncoagent.com'}/admin/system/health" class="button">View System Health</a>
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Bayon Coagent. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
    }

    private renderAnnouncementEmail(params: {
        title: string;
        content: string;
        ctaText?: string;
        ctaUrl?: string;
    }): string {
        const { title, content, ctaText, ctaUrl } = params;

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0070f3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .announcement { background-color: white; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        .button { display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📢 Announcement</h1>
        </div>
        <div class="content">
            <h2>${title}</h2>
            <div class="announcement">
                ${content}
            </div>
            ${ctaText && ctaUrl ? `
            <div style="text-align: center;">
                <a href="${ctaUrl}" class="button">${ctaText}</a>
            </div>
            ` : ''}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Bayon Coagent. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
    }

    private renderFeedbackResponseEmail(params: {
        userName: string;
        feedbackText: string;
        responseText: string;
        adminName: string;
    }): string {
        const { userName, feedbackText, responseText, adminName } = params;

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0070f3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .feedback { background-color: #e8e8e8; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .response { background-color: white; padding: 20px; border-left: 4px solid #0070f3; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Response to Your Feedback</h1>
        </div>
        <div class="content">
            <p>Hi ${userName},</p>
            <p>Thank you for your feedback. We've reviewed it and wanted to respond:</p>
            <div class="feedback">
                <p><strong>Your Feedback:</strong></p>
                <p>${feedbackText.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="response">
                <p><strong>Our Response:</strong></p>
                <p>${responseText.replace(/\n/g, '<br>')}</p>
                <p style="margin-top: 20px;"><em>- ${adminName}</em></p>
            </div>
            <p>We appreciate you taking the time to share your thoughts with us!</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Bayon Coagent. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
    }

    private renderMaintenanceEmail(params: {
        type: 'scheduled' | 'started' | 'completed' | 'cancelled';
        startTime?: Date;
        endTime?: Date;
        message?: string;
    }): string {
        const { type, startTime, endTime, message } = params;

        const typeMessages = {
            scheduled: 'Scheduled Maintenance Window',
            started: 'Maintenance in Progress',
            completed: 'Maintenance Completed',
            cancelled: 'Maintenance Cancelled',
        };

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f5a623; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .info { background-color: white; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 ${typeMessages[type]}</h1>
        </div>
        <div class="content">
            <div class="info">
                ${type === 'scheduled' && startTime && endTime ? `
                <p><strong>Start Time:</strong> ${startTime.toLocaleString()}</p>
                <p><strong>End Time:</strong> ${endTime.toLocaleString()}</p>
                <p><strong>Duration:</strong> ${Math.round((endTime.getTime() - startTime.getTime()) / 60000)} minutes</p>
                ` : ''}
                ${message ? `<p>${message}</p>` : ''}
                ${type === 'scheduled' ? `
                <p>During this time, the platform may be temporarily unavailable. We apologize for any inconvenience.</p>
                ` : ''}
                ${type === 'completed' ? `
                <p>The platform is now fully operational. Thank you for your patience!</p>
                ` : ''}
                ${type === 'cancelled' ? `
                <p>The scheduled maintenance has been cancelled. The platform will remain fully operational.</p>
                ` : ''}
            </div>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Bayon Coagent. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
    }

    private getMaintenanceSubject(type: 'scheduled' | 'started' | 'completed' | 'cancelled'): string {
        const subjects = {
            scheduled: 'Scheduled Maintenance Notification',
            started: 'Maintenance in Progress',
            completed: 'Maintenance Completed - Platform Operational',
            cancelled: 'Scheduled Maintenance Cancelled',
        };
        return subjects[type];
    }

    /**
     * Gets default email templates
     */
    private getDefaultTemplates(): EmailTemplate[] {
        return [
            {
                templateId: 'support-ticket-notification',
                name: 'Support Ticket Notification',
                subject: 'Support Ticket Update',
                htmlBody: this.renderSupportTicketEmail({
                    ticketId: '{{ticketId}}',
                    subject: '{{subject}}',
                    userName: '{{userName}}',
                    message: '{{message}}',
                    isResponse: false,
                }),
                variables: ['ticketId', 'subject', 'userName', 'message'],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
            {
                templateId: 'system-health-alert',
                name: 'System Health Alert',
                subject: 'System Health Alert',
                htmlBody: this.renderSystemHealthAlertEmail({
                    severity: 'warning',
                    message: '{{message}}',
                }),
                variables: ['severity', 'message', 'metrics'],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
            {
                templateId: 'announcement',
                name: 'Announcement',
                subject: '{{title}}',
                htmlBody: this.renderAnnouncementEmail({
                    title: '{{title}}',
                    content: '{{content}}',
                }),
                variables: ['title', 'content', 'ctaText', 'ctaUrl'],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
        ];
    }
}

// Export singleton instance
let emailNotificationService: EmailNotificationService | null = null;

export function getEmailNotificationService(): EmailNotificationService {
    if (!emailNotificationService) {
        emailNotificationService = new EmailNotificationService();
    }
    return emailNotificationService;
}
