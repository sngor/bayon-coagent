/**
 * Alert Microservice
 * 
 * Handles critical system event notifications and alerting for the microservices
 * architecture. Provides multi-channel alert delivery, escalation policies,
 * and alert management with severity-based routing.
 * 
 * **Requirements: 8.5**
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { BaseLambdaHandler, ApiResponse, ServiceConfig } from './base-lambda-template';
import { EventSource } from '../utils/eventbridge-client';
import { DynamoDBClient, PutItemCommand, QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { z } from 'zod';

// Configuration
const SERVICE_CONFIG: ServiceConfig = {
    serviceName: 'alert-service',
    version: '1.0.0',
    description: 'Critical system event notification and alerting service',
    enableTracing: true,
    enableCircuitBreaker: true,
    enableRetry: true,
    healthCheckEnabled: true,
};

// Validation schemas
const AlertSchema = z.object({
    title: z.string().min(1),
    message: z.string().min(1),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    source: z.string(),
    category: z.enum(['system', 'security', 'performance', 'business']),
    metadata: z.record(z.any()).optional(),
    tags: z.array(z.string()).optional(),
    channels: z.array(z.enum(['email', 'sms', 'slack', 'webhook', 'push'])).optional(),
    escalationPolicy: z.string().optional(),
});

const AlertRuleSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    conditions: z.array(z.object({
        field: z.string(),
        operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains']),
        value: z.any(),
    })),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    channels: z.array(z.enum(['email', 'sms', 'slack', 'webhook', 'push'])),
    enabled: z.boolean(),
    throttleMinutes: z.number().min(0).optional(),
});

const EscalationPolicySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    steps: z.array(z.object({
        delayMinutes: z.number().min(0),
        channels: z.array(z.enum(['email', 'sms', 'slack', 'webhook', 'push'])),
        recipients: z.array(z.string()),
    })),
    enabled: z.boolean(),
});

// Types
interface Alert {
    alertId: string;
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: string;
    category: 'system' | 'security' | 'performance' | 'business';
    metadata: Record<string, any>;
    tags: string[];
    channels: string[];
    escalationPolicy?: string;
    status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
    createdAt: string;
    updatedAt: string;
    acknowledgedAt?: string;
    acknowledgedBy?: string;
    resolvedAt?: string;
    resolvedBy?: string;
}

interface AlertRule {
    ruleId: string;
    name: string;
    description?: string;
    conditions: Array<{
        field: string;
        operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
        value: any;
    }>;
    severity: 'low' | 'medium' | 'high' | 'critical';
    channels: string[];
    enabled: boolean;
    throttleMinutes?: number;
    lastTriggered?: string;
    triggerCount: number;
    createdAt: string;
    updatedAt: string;
}

interface EscalationPolicy {
    policyId: string;
    name: string;
    description?: string;
    steps: Array<{
        delayMinutes: number;
        channels: string[];
        recipients: string[];
    }>;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}

interface AlertDeliveryResult {
    alertId: string;
    deliveryAttempts: Array<{
        channel: string;
        recipient: string;
        status: 'success' | 'failure' | 'pending';
        timestamp: string;
        error?: string;
    }>;
    totalAttempts: number;
    successfulDeliveries: number;
    failedDeliveries: number;
}

/**
 * Alert Service Handler
 */
class AlertServiceHandler extends BaseLambdaHandler {
    private dynamoClient: DynamoDBClient;
    private snsClient: SNSClient;
    private sesClient: SESClient;
    private tableName: string;

    constructor() {
        super(SERVICE_CONFIG);
        this.dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
        this.snsClient = new SNSClient({ region: process.env.AWS_REGION });
        this.sesClient = new SESClient({ region: process.env.AWS_REGION });
        this.tableName = process.env.DYNAMODB_TABLE_NAME || 'microservices-table';
    }

    async handle(event: APIGatewayProxyEvent, context: Context): Promise<ApiResponse> {
        const path = event.path;
        const method = event.httpMethod;

        // Route requests
        if (method === 'GET' && path.endsWith('/health')) {
            return this.createHealthCheckResponse();
        }

        if (method === 'POST' && path.endsWith('/alert')) {
            return this.handleCreateAlert(event);
        }

        if (method === 'GET' && path.endsWith('/alerts')) {
            return this.handleListAlerts(event);
        }

        if (method === 'PUT' && path.endsWith('/alert/acknowledge')) {
            return this.handleAcknowledgeAlert(event);
        }

        if (method === 'PUT' && path.endsWith('/alert/resolve')) {
            return this.handleResolveAlert(event);
        }

        if (method === 'POST' && path.endsWith('/alert-rule')) {
            return this.handleCreateAlertRule(event);
        }

        if (method === 'GET' && path.endsWith('/alert-rules')) {
            return this.handleListAlertRules(event);
        }

        if (method === 'POST' && path.endsWith('/escalation-policy')) {
            return this.handleCreateEscalationPolicy(event);
        }

        if (method === 'GET' && path.endsWith('/escalation-policies')) {
            return this.handleListEscalationPolicies(event);
        }

        if (method === 'GET' && path.endsWith('/alert-statistics')) {
            return this.handleGetAlertStatistics(event);
        }

        return this.createErrorResponseData('INVALID_ENDPOINT', 'Endpoint not found', 404);
    }

    /**
     * Handle alert creation and delivery
     */
    private async handleCreateAlert(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const alertData = this.validateRequestBody(event, (data) =>
                AlertSchema.parse(data)
            );

            const alert = await this.executeWithCircuitBreaker('create-alert', async () => {
                return this.createAlert(alertData);
            });

            // Deliver alert through specified channels
            const deliveryResult = await this.executeWithCircuitBreaker('deliver-alert', async () => {
                return this.deliverAlert(alert);
            });

            // Publish alert created event
            await this.publishServiceEvent(EventSource.ALERT, 'AlertCreated', {
                alertId: alert.alertId,
                severity: alert.severity,
                source: alert.source,
                category: alert.category,
            });

            return this.createSuccessResponse({
                alert,
                delivery: deliveryResult,
            }, 201);
        } catch (error) {
            this.logger.error('Alert creation failed', { error });
            return this.createErrorResponseData(
                'ALERT_CREATION_FAILED',
                error instanceof Error ? error.message : 'Alert creation failed',
                400
            );
        }
    }

    /**
     * Handle alert listing
     */
    private async handleListAlerts(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const queryParams = event.queryStringParameters || {};
            const alerts = await this.listAlerts(queryParams);
            return this.createSuccessResponse(alerts);
        } catch (error) {
            this.logger.error('Alert listing failed', { error });
            return this.createErrorResponseData(
                'ALERT_LISTING_FAILED',
                error instanceof Error ? error.message : 'Alert listing failed',
                500
            );
        }
    }

    /**
     * Handle alert acknowledgment
     */
    private async handleAcknowledgeAlert(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const { alertId } = this.validateRequestBody(event, (data) =>
                z.object({ alertId: z.string().uuid() }).parse(data)
            );

            const userId = this.extractUserId(event);
            const alert = await this.acknowledgeAlert(alertId, userId);

            // Publish alert acknowledged event
            await this.publishServiceEvent(EventSource.ALERT, 'AlertAcknowledged', {
                alertId: alert.alertId,
                acknowledgedBy: userId,
            });

            return this.createSuccessResponse(alert);
        } catch (error) {
            this.logger.error('Alert acknowledgment failed', { error });
            return this.createErrorResponseData(
                'ALERT_ACKNOWLEDGMENT_FAILED',
                error instanceof Error ? error.message : 'Alert acknowledgment failed',
                400
            );
        }
    }

    /**
     * Handle alert resolution
     */
    private async handleResolveAlert(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const { alertId, resolution } = this.validateRequestBody(event, (data) =>
                z.object({
                    alertId: z.string().uuid(),
                    resolution: z.string().optional(),
                }).parse(data)
            );

            const userId = this.extractUserId(event);
            const alert = await this.resolveAlert(alertId, userId, resolution);

            // Publish alert resolved event
            await this.publishServiceEvent(EventSource.ALERT, 'AlertResolved', {
                alertId: alert.alertId,
                resolvedBy: userId,
            });

            return this.createSuccessResponse(alert);
        } catch (error) {
            this.logger.error('Alert resolution failed', { error });
            return this.createErrorResponseData(
                'ALERT_RESOLUTION_FAILED',
                error instanceof Error ? error.message : 'Alert resolution failed',
                400
            );
        }
    }

    /**
     * Handle alert rule creation
     */
    private async handleCreateAlertRule(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const ruleData = this.validateRequestBody(event, (data) =>
                AlertRuleSchema.parse(data)
            );

            const rule = await this.createAlertRule(ruleData);
            return this.createSuccessResponse(rule, 201);
        } catch (error) {
            this.logger.error('Alert rule creation failed', { error });
            return this.createErrorResponseData(
                'ALERT_RULE_CREATION_FAILED',
                error instanceof Error ? error.message : 'Alert rule creation failed',
                400
            );
        }
    }

    /**
     * Handle alert rule listing
     */
    private async handleListAlertRules(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const rules = await this.listAlertRules();
            return this.createSuccessResponse(rules);
        } catch (error) {
            this.logger.error('Alert rule listing failed', { error });
            return this.createErrorResponseData(
                'ALERT_RULE_LISTING_FAILED',
                error instanceof Error ? error.message : 'Alert rule listing failed',
                500
            );
        }
    }

    /**
     * Handle escalation policy creation
     */
    private async handleCreateEscalationPolicy(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const policyData = this.validateRequestBody(event, (data) =>
                EscalationPolicySchema.parse(data)
            );

            const policy = await this.createEscalationPolicy(policyData);
            return this.createSuccessResponse(policy, 201);
        } catch (error) {
            this.logger.error('Escalation policy creation failed', { error });
            return this.createErrorResponseData(
                'ESCALATION_POLICY_CREATION_FAILED',
                error instanceof Error ? error.message : 'Escalation policy creation failed',
                400
            );
        }
    }

    /**
     * Handle escalation policy listing
     */
    private async handleListEscalationPolicies(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const policies = await this.listEscalationPolicies();
            return this.createSuccessResponse(policies);
        } catch (error) {
            this.logger.error('Escalation policy listing failed', { error });
            return this.createErrorResponseData(
                'ESCALATION_POLICY_LISTING_FAILED',
                error instanceof Error ? error.message : 'Escalation policy listing failed',
                500
            );
        }
    }

    /**
     * Handle alert statistics retrieval
     */
    private async handleGetAlertStatistics(event: APIGatewayProxyEvent): Promise<ApiResponse> {
        try {
            const timeRange = event.queryStringParameters?.timeRange || '24h';
            const statistics = await this.getAlertStatistics(timeRange);
            return this.createSuccessResponse(statistics);
        } catch (error) {
            this.logger.error('Alert statistics retrieval failed', { error });
            return this.createErrorResponseData(
                'ALERT_STATISTICS_FAILED',
                error instanceof Error ? error.message : 'Alert statistics retrieval failed',
                500
            );
        }
    }

    /**
     * Create new alert
     */
    private async createAlert(alertData: any): Promise<Alert> {
        const now = new Date().toISOString();

        const alert: Alert = {
            alertId: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: alertData.title,
            message: alertData.message,
            severity: alertData.severity,
            source: alertData.source,
            category: alertData.category,
            metadata: alertData.metadata || {},
            tags: alertData.tags || [],
            channels: alertData.channels || this.getDefaultChannels(alertData.severity),
            escalationPolicy: alertData.escalationPolicy,
            status: 'active',
            createdAt: now,
            updatedAt: now,
        };

        // Store alert
        await this.storeAlert(alert);

        // Check alert rules for automatic processing
        await this.processAlertRules(alert);

        return alert;
    }

    /**
     * Deliver alert through specified channels
     */
    private async deliverAlert(alert: Alert): Promise<AlertDeliveryResult> {
        const deliveryAttempts: AlertDeliveryResult['deliveryAttempts'] = [];

        // Get recipients for each channel
        const recipients = await this.getAlertRecipients(alert);

        // Deliver through each channel
        for (const channel of alert.channels) {
            const channelRecipients = recipients[channel] || [];

            for (const recipient of channelRecipients) {
                try {
                    await this.deliverToChannel(alert, channel, recipient);
                    deliveryAttempts.push({
                        channel,
                        recipient,
                        status: 'success',
                        timestamp: new Date().toISOString(),
                    });
                } catch (error) {
                    deliveryAttempts.push({
                        channel,
                        recipient,
                        status: 'failure',
                        timestamp: new Date().toISOString(),
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }
        }

        const result: AlertDeliveryResult = {
            alertId: alert.alertId,
            deliveryAttempts,
            totalAttempts: deliveryAttempts.length,
            successfulDeliveries: deliveryAttempts.filter(a => a.status === 'success').length,
            failedDeliveries: deliveryAttempts.filter(a => a.status === 'failure').length,
        };

        // Store delivery result
        await this.storeDeliveryResult(result);

        // Start escalation if configured and delivery failed
        if (alert.escalationPolicy && result.failedDeliveries > 0) {
            await this.startEscalation(alert);
        }

        return result;
    }

    /**
     * Deliver alert to specific channel
     */
    private async deliverToChannel(alert: Alert, channel: string, recipient: string): Promise<void> {
        switch (channel) {
            case 'email':
                await this.deliverEmail(alert, recipient);
                break;
            case 'sms':
                await this.deliverSMS(alert, recipient);
                break;
            case 'slack':
                await this.deliverSlack(alert, recipient);
                break;
            case 'webhook':
                await this.deliverWebhook(alert, recipient);
                break;
            case 'push':
                await this.deliverPush(alert, recipient);
                break;
            default:
                throw new Error(`Unsupported channel: ${channel}`);
        }
    }

    /**
     * Deliver alert via email
     */
    private async deliverEmail(alert: Alert, recipient: string): Promise<void> {
        const subject = `[${alert.severity.toUpperCase()}] ${alert.title}`;
        const body = `
Alert Details:
- Severity: ${alert.severity}
- Source: ${alert.source}
- Category: ${alert.category}
- Time: ${alert.createdAt}

Message:
${alert.message}

Alert ID: ${alert.alertId}
        `;

        await this.sesClient.send(new SendEmailCommand({
            Source: process.env.ALERT_FROM_EMAIL || 'alerts@example.com',
            Destination: {
                ToAddresses: [recipient],
            },
            Message: {
                Subject: { Data: subject },
                Body: { Text: { Data: body } },
            },
        }));
    }

    /**
     * Deliver alert via SMS
     */
    private async deliverSMS(alert: Alert, recipient: string): Promise<void> {
        const message = `[${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message}`;

        await this.snsClient.send(new PublishCommand({
            PhoneNumber: recipient,
            Message: message,
        }));
    }

    /**
     * Deliver alert via Slack
     */
    private async deliverSlack(alert: Alert, recipient: string): Promise<void> {
        // Mock Slack delivery - in production, this would use Slack API
        this.logger.info('Slack alert delivered', { alert: alert.alertId, recipient });
    }

    /**
     * Deliver alert via webhook
     */
    private async deliverWebhook(alert: Alert, recipient: string): Promise<void> {
        // Mock webhook delivery - in production, this would make HTTP POST request
        this.logger.info('Webhook alert delivered', { alert: alert.alertId, recipient });
    }

    /**
     * Deliver alert via push notification
     */
    private async deliverPush(alert: Alert, recipient: string): Promise<void> {
        // Mock push delivery - in production, this would use push notification service
        this.logger.info('Push alert delivered', { alert: alert.alertId, recipient });
    }

    /**
     * Get default channels based on severity
     */
    private getDefaultChannels(severity: string): string[] {
        switch (severity) {
            case 'critical':
                return ['email', 'sms', 'slack'];
            case 'high':
                return ['email', 'slack'];
            case 'medium':
                return ['email'];
            case 'low':
                return ['email'];
            default:
                return ['email'];
        }
    }

    /**
     * Get alert recipients for each channel
     */
    private async getAlertRecipients(alert: Alert): Promise<Record<string, string[]>> {
        // Mock recipients - in production, this would query user preferences and on-call schedules
        return {
            email: ['admin@example.com', 'ops@example.com'],
            sms: ['+1234567890'],
            slack: ['#alerts', '#ops'],
            webhook: ['https://webhook.example.com/alerts'],
            push: ['device-token-123'],
        };
    }

    /**
     * Acknowledge alert
     */
    private async acknowledgeAlert(alertId: string, userId: string): Promise<Alert> {
        const alert = await this.getAlert(alertId);
        if (!alert) {
            throw new Error('Alert not found');
        }

        if (alert.status !== 'active') {
            throw new Error('Alert is not active');
        }

        const now = new Date().toISOString();
        alert.status = 'acknowledged';
        alert.acknowledgedAt = now;
        alert.acknowledgedBy = userId;
        alert.updatedAt = now;

        await this.storeAlert(alert);
        return alert;
    }

    /**
     * Resolve alert
     */
    private async resolveAlert(alertId: string, userId: string, resolution?: string): Promise<Alert> {
        const alert = await this.getAlert(alertId);
        if (!alert) {
            throw new Error('Alert not found');
        }

        if (alert.status === 'resolved') {
            throw new Error('Alert is already resolved');
        }

        const now = new Date().toISOString();
        alert.status = 'resolved';
        alert.resolvedAt = now;
        alert.resolvedBy = userId;
        alert.updatedAt = now;

        if (resolution) {
            alert.metadata.resolution = resolution;
        }

        await this.storeAlert(alert);
        return alert;
    }

    /**
     * Create alert rule
     */
    private async createAlertRule(ruleData: any): Promise<AlertRule> {
        const now = new Date().toISOString();

        const rule: AlertRule = {
            ruleId: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: ruleData.name,
            description: ruleData.description,
            conditions: ruleData.conditions,
            severity: ruleData.severity,
            channels: ruleData.channels,
            enabled: ruleData.enabled,
            throttleMinutes: ruleData.throttleMinutes,
            triggerCount: 0,
            createdAt: now,
            updatedAt: now,
        };

        await this.storeAlertRule(rule);
        return rule;
    }

    /**
     * Create escalation policy
     */
    private async createEscalationPolicy(policyData: any): Promise<EscalationPolicy> {
        const now = new Date().toISOString();

        const policy: EscalationPolicy = {
            policyId: `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: policyData.name,
            description: policyData.description,
            steps: policyData.steps,
            enabled: policyData.enabled,
            createdAt: now,
            updatedAt: now,
        };

        await this.storeEscalationPolicy(policy);
        return policy;
    }

    // Mock implementations for database operations
    private async storeAlert(alert: Alert): Promise<void> {
        this.logger.info('Alert stored', { alertId: alert.alertId });
    }

    private async getAlert(alertId: string): Promise<Alert | null> {
        // Mock implementation
        return null;
    }

    private async listAlerts(queryParams: any): Promise<Alert[]> {
        // Mock implementation
        return [];
    }

    private async storeAlertRule(rule: AlertRule): Promise<void> {
        this.logger.info('Alert rule stored', { ruleId: rule.ruleId });
    }

    private async listAlertRules(): Promise<AlertRule[]> {
        // Mock implementation
        return [];
    }

    private async storeEscalationPolicy(policy: EscalationPolicy): Promise<void> {
        this.logger.info('Escalation policy stored', { policyId: policy.policyId });
    }

    private async listEscalationPolicies(): Promise<EscalationPolicy[]> {
        // Mock implementation
        return [];
    }

    private async storeDeliveryResult(result: AlertDeliveryResult): Promise<void> {
        this.logger.info('Delivery result stored', { alertId: result.alertId });
    }

    private async processAlertRules(alert: Alert): Promise<void> {
        this.logger.info('Processing alert rules', { alertId: alert.alertId });
    }

    private async startEscalation(alert: Alert): Promise<void> {
        this.logger.info('Starting escalation', { alertId: alert.alertId });
    }

    private async getAlertStatistics(timeRange: string): Promise<any> {
        // Mock statistics
        return {
            timeRange,
            totalAlerts: Math.floor(Math.random() * 1000),
            alertsBySeverity: {
                critical: Math.floor(Math.random() * 50),
                high: Math.floor(Math.random() * 100),
                medium: Math.floor(Math.random() * 200),
                low: Math.floor(Math.random() * 300),
            },
            alertsByStatus: {
                active: Math.floor(Math.random() * 100),
                acknowledged: Math.floor(Math.random() * 200),
                resolved: Math.floor(Math.random() * 700),
            },
            averageResolutionTime: Math.random() * 60 + 15, // 15-75 minutes
            deliverySuccessRate: Math.random() * 10 + 90, // 90-100%
        };
    }
}

// Export the handler
export const handler = new AlertServiceHandler().lambdaHandler.bind(new AlertServiceHandler());