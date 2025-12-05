/**
 * Admin Alert Processor Lambda
 * 
 * Processes system alerts and sends email notifications to SuperAdmins
 * Triggered by:
 * - CloudWatch alarms
 * - EventBridge rules for threshold violations
 * - Scheduled events for digest emails
 */

import { Handler, EventBridgeEvent, CloudWatchAlarmEvent } from 'aws-lambda';
import { getEmailNotificationService } from '../services/admin/email-notification-service';
import { getAlertPreferencesService } from '../services/admin/alert-preferences-service';
import { getSystemHealthService } from '../services/admin/system-health-service';

interface AlertEvent {
    type: 'cloudwatch_alarm' | 'threshold_violation' | 'digest';
    severity: 'info' | 'warning' | 'critical';
    alertType: 'systemHealth' | 'errorRates' | 'performanceIssues' | 'securityAlerts' | 'billingAlerts';
    message: string;
    metrics?: Record<string, any>;
    timestamp: number;
}

export const handler: Handler = async (event: EventBridgeEvent<string, any> | CloudWatchAlarmEvent) => {
    console.log('Processing alert event:', JSON.stringify(event, null, 2));

    try {
        const emailService = getEmailNotificationService();
        const preferencesService = getAlertPreferencesService();

        // Parse the event
        const alertEvent = parseEvent(event);

        if (!alertEvent) {
            console.log('Event is not an alert event, skipping');
            return { statusCode: 200, body: 'Not an alert event' };
        }

        // Handle digest emails separately
        if (alertEvent.type === 'digest') {
            await processDigestEmails(emailService, preferencesService);
            return { statusCode: 200, body: 'Digest emails sent' };
        }

        // Get SuperAdmins who should receive this alert
        const recipients = await preferencesService.getSuperAdminsForAlert({
            alertType: alertEvent.alertType,
            severity: alertEvent.severity,
        });

        if (recipients.length === 0) {
            console.log('No recipients for this alert');
            return { statusCode: 200, body: 'No recipients' };
        }

        // Send alerts based on preferences
        for (const recipient of recipients) {
            if (recipient.preferences.frequency === 'immediate') {
                // Send immediately
                await emailService.sendSystemHealthAlert({
                    to: recipient.email,
                    severity: alertEvent.severity,
                    message: alertEvent.message,
                    metrics: alertEvent.metrics,
                });
            } else {
                // Queue for batch/digest
                await queueAlertForBatch(recipient.userId, alertEvent);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Alert processed', recipients: recipients.length }),
        };
    } catch (error) {
        console.error('Error processing alert:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to process alert' }),
        };
    }
};

/**
 * Parses incoming event into AlertEvent
 */
function parseEvent(event: any): AlertEvent | null {
    // Check if it's a scheduled digest event
    if (event['detail-type'] === 'Scheduled Event' && event.detail?.type === 'digest') {
        return {
            type: 'digest',
            severity: 'info',
            alertType: 'systemHealth',
            message: 'Daily digest',
            timestamp: Date.now(),
        };
    }

    // Check if it's a CloudWatch alarm
    if (event.AlarmName) {
        return {
            type: 'cloudwatch_alarm',
            severity: event.NewStateValue === 'ALARM' ? 'critical' : 'warning',
            alertType: determineAlertType(event.AlarmName),
            message: `CloudWatch Alarm: ${event.AlarmName} - ${event.NewStateReason}`,
            metrics: {
                alarmName: event.AlarmName,
                state: event.NewStateValue,
                reason: event.NewStateReason,
            },
            timestamp: Date.now(),
        };
    }

    // Check if it's a threshold violation event
    if (event['detail-type'] === 'Threshold Violation') {
        return {
            type: 'threshold_violation',
            severity: event.detail.severity || 'warning',
            alertType: event.detail.alertType || 'systemHealth',
            message: event.detail.message,
            metrics: event.detail.metrics,
            timestamp: Date.now(),
        };
    }

    return null;
}

/**
 * Determines alert type from alarm name
 */
function determineAlertType(alarmName: string): AlertEvent['alertType'] {
    const name = alarmName.toLowerCase();

    if (name.includes('error') || name.includes('5xx')) {
        return 'errorRates';
    }
    if (name.includes('latency') || name.includes('response') || name.includes('performance')) {
        return 'performanceIssues';
    }
    if (name.includes('security') || name.includes('unauthorized')) {
        return 'securityAlerts';
    }
    if (name.includes('billing') || name.includes('cost')) {
        return 'billingAlerts';
    }

    return 'systemHealth';
}

/**
 * Queues an alert for batch processing
 */
async function queueAlertForBatch(userId: string, alert: AlertEvent): Promise<void> {
    const { getRepository } = await import('../aws/dynamodb/repository');
    const repository = getRepository();

    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await repository.create({
        PK: `USER#${userId}`,
        SK: `QUEUED_ALERT#${alertId}`,
        EntityType: 'QueuedAlert',
        Data: alert,
        TTL: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days TTL
    });
}

/**
 * Processes digest emails for all SuperAdmins
 */
async function processDigestEmails(
    emailService: any,
    preferencesService: any
): Promise<void> {
    const { getRepository } = await import('../aws/dynamodb/repository');
    const repository = getRepository();
    const healthService = getSystemHealthService();

    // Get all SuperAdmins with digest preferences
    const superAdmins = await preferencesService['getAllSuperAdmins']();

    for (const admin of superAdmins) {
        const preferences = await preferencesService.getPreferences(admin.userId);

        if (preferences.frequency !== 'daily') {
            continue;
        }

        // Get queued alerts for this admin
        const queuedAlerts = await repository.query(
            `USER#${admin.userId}`,
            'QUEUED_ALERT#'
        );

        if (queuedAlerts.length === 0) {
            continue;
        }

        // Get system health metrics
        const healthMetrics = await healthService.getSystemHealth();

        // Build digest email
        const digestContent = buildDigestEmail(queuedAlerts, healthMetrics);

        // Send digest
        await emailService.sendSystemHealthAlert({
            to: admin.email,
            severity: 'info',
            message: digestContent,
        });

        // Delete queued alerts
        for (const alert of queuedAlerts) {
            await repository.delete(alert.PK, alert.SK);
        }
    }
}

/**
 * Builds digest email content
 */
function buildDigestEmail(queuedAlerts: any[], healthMetrics: any): string {
    const alertsByType = queuedAlerts.reduce((acc, alert) => {
        const type = alert.Data.alertType;
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(alert.Data);
        return acc;
    }, {} as Record<string, any[]>);

    let content = `<h2>Daily System Digest</h2>`;
    content += `<p>Here's your daily summary of system alerts and health metrics.</p>`;

    // Add alerts by type
    for (const [type, alerts] of Object.entries(alertsByType)) {
        content += `<h3>${formatAlertType(type)}</h3>`;
        content += `<ul>`;
        for (const alert of alerts) {
            content += `<li>${alert.message}</li>`;
        }
        content += `</ul>`;
    }

    // Add system health summary
    content += `<h3>System Health Summary</h3>`;
    content += `<ul>`;
    content += `<li>API Error Rate: ${healthMetrics.apiMetrics.errorRate.toFixed(2)}%</li>`;
    content += `<li>Average Response Time: ${healthMetrics.apiMetrics.averageResponseTime}ms</li>`;
    content += `<li>Active Alerts: ${healthMetrics.alerts.length}</li>`;
    content += `</ul>`;

    return content;
}

/**
 * Formats alert type for display
 */
function formatAlertType(type: string): string {
    const typeMap: Record<string, string> = {
        systemHealth: 'System Health',
        errorRates: 'Error Rates',
        performanceIssues: 'Performance Issues',
        securityAlerts: 'Security Alerts',
        billingAlerts: 'Billing Alerts',
    };
    return typeMap[type] || type;
}
