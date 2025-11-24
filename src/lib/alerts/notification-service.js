"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationService = exports.notificationService = exports.NotificationService = void 0;
const client_1 = require("@/aws/ses/client");
const repository_1 = require("@/aws/dynamodb/repository");
const data_access_1 = require("./data-access");
class NotificationService {
    constructor() {
        this.repository = new repository_1.DynamoDBRepository();
        this.defaultFromEmail = process.env.SES_FROM_EMAIL || 'noreply@bayoncoagent.com';
    }
    async getNotificationPreferences(userId) {
        try {
            const result = await this.repository.get(`USER#${userId}`, 'SETTINGS#NOTIFICATIONS');
            if (result) {
                return result;
            }
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
        catch (error) {
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
    async updateNotificationPreferences(userId, preferences) {
        const current = await this.getNotificationPreferences(userId);
        const updated = {
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
    async initializeEmailTemplates() {
        const templates = this.getDefaultTemplates();
        for (const template of templates) {
            await (0, client_1.upsertEmailTemplate)(template.name, template.subject, template.htmlBody, template.textBody);
        }
    }
    getDefaultTemplates() {
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
    async sendRealTimeNotification(userId, alert) {
        try {
            const preferences = await this.getNotificationPreferences(userId);
            if (!preferences.emailNotifications) {
                return { success: true };
            }
            if (!preferences.enabledAlertTypes.includes(alert.type)) {
                return { success: true };
            }
            if (this.isInQuietHours(preferences)) {
                await this.queueNotification(userId, [alert.id], 'real-time');
                return { success: true };
            }
            const userProfile = await this.getUserProfile(userId);
            const templateData = {
                agentName: userProfile.name || 'Agent',
                agentEmail: userProfile.email || preferences.emailAddress || '',
                alert,
                unsubscribeUrl: this.generateUnsubscribeUrl(userId),
                preferencesUrl: this.generatePreferencesUrl(userId),
            };
            const subject = this.generateAlertSubject(alert);
            const htmlBody = this.generateAlertHtmlBody(alert, templateData);
            const textBody = this.generateAlertTextBody(alert, templateData);
            const messageId = await (0, client_1.sendEmail)(preferences.emailAddress || userProfile.email || '', subject, htmlBody, this.defaultFromEmail, true);
            await this.logNotificationEvent(userId, 'email_sent', alert.id, messageId);
            return { success: true, messageId };
        }
        catch (error) {
            console.error('Failed to send real-time notification:', error);
            await this.logNotificationEvent(userId, 'email_failed', alert.id, undefined, {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send notification'
            };
        }
    }
    async sendDailyDigest(userId) {
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 1);
        return this.sendDigest(userId, 'daily', startDate.toISOString(), endDate.toISOString());
    }
    async sendWeeklyDigest(userId) {
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
        return this.sendDigest(userId, 'weekly', startDate.toISOString(), endDate.toISOString());
    }
    async sendDigest(userId, period, startDate, endDate) {
        try {
            const preferences = await this.getNotificationPreferences(userId);
            if (!preferences.emailNotifications) {
                return { success: true, emailsSent: 0, errors: [] };
            }
            const alertsResponse = await data_access_1.alertDataAccess.getAlertsByDateRange(userId, startDate, endDate);
            const alerts = alertsResponse.alerts.filter(alert => preferences.enabledAlertTypes.includes(alert.type));
            if (alerts.length === 0) {
                return { success: true, emailsSent: 0, errors: [] };
            }
            const digestData = this.generateDigestData(userId, period, startDate, endDate, alerts);
            const userProfile = await this.getUserProfile(userId);
            const templateData = {
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
            const messageId = await (0, client_1.sendEmail)(preferences.emailAddress || userProfile.email || '', subject, htmlBody, this.defaultFromEmail, true);
            await this.logNotificationEvent(userId, 'email_sent', undefined, messageId);
            return { success: true, emailsSent: 1, errors: [] };
        }
        catch (error) {
            console.error(`Failed to send ${period} digest:`, error);
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
    isInQuietHours(preferences) {
        if (!preferences.quietHours?.enabled) {
            return false;
        }
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        return currentTime >= preferences.quietHours.startTime &&
            currentTime <= preferences.quietHours.endTime;
    }
    async queueNotification(userId, alertIds, type) {
        const job = {
            id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            type,
            alertIds,
            scheduledFor: new Date(Date.now() + 60000).toISOString(),
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
    async getUserProfile(userId) {
        try {
            const profile = await this.repository.get(`USER#${userId}`, 'PROFILE');
            return {
                name: profile?.Data?.name,
                email: profile?.Data?.email,
            };
        }
        catch (error) {
            return {};
        }
    }
    async logNotificationEvent(userId, type, alertId, messageId, details) {
        const event = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            type,
            alertId,
            messageId,
            email: '',
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
    generateDigestData(userId, period, startDate, endDate, alerts) {
        const countsByType = {
            'life-event-lead': 0,
            'competitor-new-listing': 0,
            'competitor-price-reduction': 0,
            'competitor-withdrawal': 0,
            'neighborhood-trend': 0,
            'price-reduction': 0,
        };
        const countsByPriority = {
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
    generateUnsubscribeUrl(userId) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.bayoncoagent.com';
        return `${baseUrl}/settings/notifications/unsubscribe?user=${userId}`;
    }
    generatePreferencesUrl(userId) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.bayoncoagent.com';
        return `${baseUrl}/settings/notifications`;
    }
    generateAlertSubject(alert) {
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
    generateAlertHtmlBody(alert, templateData) {
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
    generateAlertTextBody(alert, templateData) {
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
    getAlertHtmlContent(alert) {
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
    getAlertTextContent(alert) {
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
    generateDigestHtmlBody(digestData, templateData) {
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
    generateDigestTextBody(digestData, templateData) {
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
    getRealTimeHtmlTemplate() {
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
    getRealTimeTextTemplate() {
        return `
Market Intelligence Alert

Hello {{agentName}},

{{alertContent}}

Manage preferences: {{preferencesUrl}}
Unsubscribe: {{unsubscribeUrl}}
    `;
    }
    getDailyDigestHtmlTemplate() {
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
    getDailyDigestTextTemplate() {
        return `
Daily Market Intelligence Digest

Hello {{agentName}},

Total alerts: {{totalAlerts}}

Manage preferences: {{preferencesUrl}}
Unsubscribe: {{unsubscribeUrl}}
    `;
    }
    getWeeklyDigestHtmlTemplate() {
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
    getWeeklyDigestTextTemplate() {
        return `
Weekly Market Intelligence Summary

Hello {{agentName}},

Total alerts: {{totalAlerts}}

Manage preferences: {{preferencesUrl}}
Unsubscribe: {{unsubscribeUrl}}
    `;
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
const getNotificationService = () => exports.notificationService;
exports.getNotificationService = getNotificationService;
