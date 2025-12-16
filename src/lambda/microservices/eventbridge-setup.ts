/**
 * EventBridge Setup for Inter-Service Communication
 * 
 * Configures EventBridge custom event bus and rules for microservices communication
 * with proper event routing, filtering, and dead letter queue handling.
 */

import { EventBridgeClient, CreateEventBusCommand, PutRuleCommand, PutTargetsCommand, DescribeEventBusCommand } from '@aws-sdk/client-eventbridge';
import { SQSClient, CreateQueueCommand, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { LambdaClient, AddPermissionCommand } from '@aws-sdk/client-lambda';
import * as AWSXRay from 'aws-xray-sdk-core';

// Initialize AWS clients with X-Ray tracing
let eventBridgeClient: EventBridgeClient;
let sqsClient: SQSClient;
let lambdaClient: LambdaClient;

try {
    eventBridgeClient = AWSXRay.captureAWSv3Client(new EventBridgeClient({
        region: process.env.AWS_REGION || 'us-east-1',
    }));
    sqsClient = AWSXRay.captureAWSv3Client(new SQSClient({
        region: process.env.AWS_REGION || 'us-east-1',
    }));
    lambdaClient = AWSXRay.captureAWSv3Client(new LambdaClient({
        region: process.env.AWS_REGION || 'us-east-1',
    }));
} catch (error) {
    eventBridgeClient = new EventBridgeClient({
        region: process.env.AWS_REGION || 'us-east-1',
    });
    sqsClient = new SQSClient({
        region: process.env.AWS_REGION || 'us-east-1',
    });
    lambdaClient = new LambdaClient({
        region: process.env.AWS_REGION || 'us-east-1',
    });
}

// Event bus configuration
export interface EventBusConfig {
    name: string;
    description: string;
    tags?: Record<string, string>;
}

// Event rule configuration
export interface EventRuleConfig {
    name: string;
    description: string;
    eventPattern: any;
    targets: EventTarget[];
    state?: 'ENABLED' | 'DISABLED';
}

// Event target configuration
export interface EventTarget {
    id: string;
    arn: string;
    type: 'lambda' | 'sqs' | 'sns' | 'kinesis';
    inputTransformer?: InputTransformer;
    deadLetterConfig?: DeadLetterConfig;
    retryPolicy?: RetryPolicy;
}

// Input transformer configuration
export interface InputTransformer {
    inputPathsMap?: Record<string, string>;
    inputTemplate: string;
}

// Dead letter queue configuration
export interface DeadLetterConfig {
    arn: string;
}

// Retry policy configuration
export interface RetryPolicy {
    maximumRetryAttempts: number;
    maximumEventAge: number;
}

/**
 * EventBridge Setup Manager
 */
export class EventBridgeSetup {
    private eventBusName: string;
    private environment: string;

    constructor(environment: string = process.env.NODE_ENV || 'development') {
        this.environment = environment;
        this.eventBusName = `bayon-coagent-events-${environment}`;
    }

    /**
     * Initialize EventBridge infrastructure
     */
    public async initialize(): Promise<void> {
        console.log('Initializing EventBridge infrastructure...');

        try {
            // Create custom event bus
            await this.createEventBus();

            // Create dead letter queues
            await this.createDeadLetterQueues();

            // Create event rules and targets
            await this.createEventRules();

            console.log('EventBridge infrastructure initialized successfully');
        } catch (error) {
            console.error('Failed to initialize EventBridge infrastructure:', error);
            throw error;
        }
    }

    /**
     * Create custom event bus
     */
    private async createEventBus(): Promise<void> {
        try {
            // Check if event bus already exists
            try {
                await eventBridgeClient.send(new DescribeEventBusCommand({
                    Name: this.eventBusName,
                }));
                console.log(`Event bus ${this.eventBusName} already exists`);
                return;
            } catch (error) {
                // Event bus doesn't exist, create it
            }

            const config: EventBusConfig = {
                name: this.eventBusName,
                description: `Bayon CoAgent microservices event bus for ${this.environment}`,
                tags: {
                    Environment: this.environment,
                    Application: 'BayonCoAgent',
                    Component: 'EventBridge',
                },
            };

            await eventBridgeClient.send(new CreateEventBusCommand({
                Name: config.name,
                Tags: Object.entries(config.tags || {}).map(([key, value]) => ({
                    Key: key,
                    Value: value,
                })),
            }));

            console.log(`Created event bus: ${config.name}`);
        } catch (error) {
            console.error('Failed to create event bus:', error);
            throw error;
        }
    }

    /**
     * Create dead letter queues for failed events
     */
    private async createDeadLetterQueues(): Promise<void> {
        const dlqName = `bayon-coagent-eventbridge-dlq-${this.environment}`;

        try {
            await sqsClient.send(new CreateQueueCommand({
                QueueName: dlqName,
                Attributes: {
                    MessageRetentionPeriod: '1209600', // 14 days
                    VisibilityTimeoutSeconds: '300', // 5 minutes
                },
                tags: {
                    Environment: this.environment,
                    Application: 'BayonCoAgent',
                    Component: 'EventBridge-DLQ',
                },
            }));

            console.log(`Created dead letter queue: ${dlqName}`);
        } catch (error) {
            if (error instanceof Error && error.name === 'QueueAlreadyExists') {
                console.log(`Dead letter queue ${dlqName} already exists`);
            } else {
                console.error('Failed to create dead letter queue:', error);
                throw error;
            }
        }
    }

    /**
     * Create event rules and targets
     */
    private async createEventRules(): Promise<void> {
        const rules = this.getEventRules();

        for (const rule of rules) {
            try {
                await this.createEventRule(rule);
            } catch (error) {
                console.error(`Failed to create rule ${rule.name}:`, error);
                // Continue with other rules
            }
        }
    }

    /**
     * Create a single event rule
     */
    private async createEventRule(config: EventRuleConfig): Promise<void> {
        // Create the rule
        await eventBridgeClient.send(new PutRuleCommand({
            Name: config.name,
            Description: config.description,
            EventPattern: JSON.stringify(config.eventPattern),
            State: config.state || 'ENABLED',
            EventBusName: this.eventBusName,
        }));

        // Add targets to the rule
        if (config.targets.length > 0) {
            await eventBridgeClient.send(new PutTargetsCommand({
                Rule: config.name,
                EventBusName: this.eventBusName,
                Targets: config.targets.map(target => ({
                    Id: target.id,
                    Arn: target.arn,
                    InputTransformer: target.inputTransformer,
                    DeadLetterConfig: target.deadLetterConfig,
                    RetryPolicy: target.retryPolicy,
                })),
            }));

            // Add Lambda permissions for EventBridge to invoke functions
            for (const target of config.targets) {
                if (target.type === 'lambda') {
                    await this.addLambdaPermission(target.arn, config.name);
                }
            }
        }

        console.log(`Created event rule: ${config.name}`);
    }

    /**
     * Add permission for EventBridge to invoke Lambda function
     */
    private async addLambdaPermission(lambdaArn: string, ruleName: string): Promise<void> {
        try {
            const functionName = lambdaArn.split(':').pop();
            const statementId = `EventBridge-${ruleName}-${Date.now()}`;

            await lambdaClient.send(new AddPermissionCommand({
                FunctionName: functionName,
                StatementId: statementId,
                Action: 'lambda:InvokeFunction',
                Principal: 'events.amazonaws.com',
                SourceArn: `arn:aws:events:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:rule/${this.eventBusName}/${ruleName}`,
            }));
        } catch (error) {
            if (error instanceof Error && error.name === 'ResourceConflictException') {
                // Permission already exists
                console.log(`Lambda permission already exists for ${lambdaArn}`);
            } else {
                console.error('Failed to add Lambda permission:', error);
            }
        }
    }

    /**
     * Get event rules configuration
     */
    private getEventRules(): EventRuleConfig[] {
        const accountId = process.env.AWS_ACCOUNT_ID || '123456789012';
        const region = process.env.AWS_REGION || 'us-east-1';

        return [
            // Content Generation Events
            {
                name: 'ContentGenerationRule',
                description: 'Route content generation events to processing services',
                eventPattern: {
                    source: ['bayon.coagent.content'],
                    'detail-type': ['Content Generation Requested', 'Content Generation Completed'],
                },
                targets: [
                    {
                        id: 'ContentProcessorTarget',
                        arn: `arn:aws:lambda:${region}:${accountId}:function:bayon-coagent-content-processor-${this.environment}`,
                        type: 'lambda',
                        retryPolicy: {
                            maximumRetryAttempts: 3,
                            maximumEventAge: 3600,
                        },
                    },
                ],
            },

            // AI Service Events
            {
                name: 'AiServiceRule',
                description: 'Route AI service events to notification and analytics services',
                eventPattern: {
                    source: ['bayon.coagent.ai'],
                    'detail-type': ['AI Job Completed', 'AI Job Failed'],
                },
                targets: [
                    {
                        id: 'NotificationTarget',
                        arn: `arn:aws:lambda:${region}:${accountId}:function:bayon-coagent-notification-processor-${this.environment}`,
                        type: 'lambda',
                        retryPolicy: {
                            maximumRetryAttempts: 2,
                            maximumEventAge: 1800,
                        },
                    },
                    {
                        id: 'AnalyticsTarget',
                        arn: `arn:aws:lambda:${region}:${accountId}:function:bayon-coagent-analytics-processor-${this.environment}`,
                        type: 'lambda',
                        retryPolicy: {
                            maximumRetryAttempts: 2,
                            maximumEventAge: 3600,
                        },
                    },
                ],
            },

            // Integration Events
            {
                name: 'IntegrationRule',
                description: 'Route integration events to sync and processing services',
                eventPattern: {
                    source: ['bayon.coagent.integration'],
                    'detail-type': ['Integration Sync Completed', 'Integration Sync Failed'],
                },
                targets: [
                    {
                        id: 'SyncProcessorTarget',
                        arn: `arn:aws:lambda:${region}:${accountId}:function:bayon-coagent-sync-processor-${this.environment}`,
                        type: 'lambda',
                        retryPolicy: {
                            maximumRetryAttempts: 3,
                            maximumEventAge: 7200,
                        },
                    },
                ],
            },

            // User Events
            {
                name: 'UserEventsRule',
                description: 'Route user events to onboarding and analytics services',
                eventPattern: {
                    source: ['bayon.coagent.user'],
                    'detail-type': ['User Created', 'User Updated', 'User Deleted'],
                },
                targets: [
                    {
                        id: 'OnboardingTarget',
                        arn: `arn:aws:lambda:${region}:${accountId}:function:bayon-coagent-onboarding-processor-${this.environment}`,
                        type: 'lambda',
                        retryPolicy: {
                            maximumRetryAttempts: 2,
                            maximumEventAge: 1800,
                        },
                    },
                    {
                        id: 'UserAnalyticsTarget',
                        arn: `arn:aws:lambda:${region}:${accountId}:function:bayon-coagent-user-analytics-${this.environment}`,
                        type: 'lambda',
                        retryPolicy: {
                            maximumRetryAttempts: 2,
                            maximumEventAge: 3600,
                        },
                    },
                ],
            },

            // Notification Events
            {
                name: 'NotificationRule',
                description: 'Route notification events to delivery services',
                eventPattern: {
                    source: ['bayon.coagent.notification'],
                    'detail-type': ['Notification Requested', 'Notification Delivered', 'Notification Failed'],
                },
                targets: [
                    {
                        id: 'NotificationDeliveryTarget',
                        arn: `arn:aws:lambda:${region}:${accountId}:function:bayon-coagent-notification-delivery-${this.environment}`,
                        type: 'lambda',
                        retryPolicy: {
                            maximumRetryAttempts: 3,
                            maximumEventAge: 1800,
                        },
                    },
                ],
            },

            // Service Health Events
            {
                name: 'ServiceHealthRule',
                description: 'Route service health events to monitoring services',
                eventPattern: {
                    source: ['bayon.coagent.health'],
                    'detail-type': ['Service Health Check', 'Service Status Changed'],
                },
                targets: [
                    {
                        id: 'HealthMonitorTarget',
                        arn: `arn:aws:lambda:${region}:${accountId}:function:bayon-coagent-health-monitor-${this.environment}`,
                        type: 'lambda',
                        retryPolicy: {
                            maximumRetryAttempts: 2,
                            maximumEventAge: 900,
                        },
                    },
                ],
            },

            // Error and Alert Events
            {
                name: 'ErrorAlertRule',
                description: 'Route error and alert events to alerting services',
                eventPattern: {
                    source: ['bayon.coagent.error'],
                    'detail-type': ['Service Error', 'Critical Alert'],
                },
                targets: [
                    {
                        id: 'AlertingTarget',
                        arn: `arn:aws:lambda:${region}:${accountId}:function:bayon-coagent-alerting-service-${this.environment}`,
                        type: 'lambda',
                        retryPolicy: {
                            maximumRetryAttempts: 2,
                            maximumEventAge: 600,
                        },
                    },
                ],
            },

            // Workflow Events
            {
                name: 'WorkflowRule',
                description: 'Route workflow events to orchestration services',
                eventPattern: {
                    source: ['bayon.coagent.workflow'],
                    'detail-type': ['Workflow Started', 'Workflow Completed', 'Workflow Failed'],
                },
                targets: [
                    {
                        id: 'WorkflowOrchestratorTarget',
                        arn: `arn:aws:lambda:${region}:${accountId}:function:bayon-coagent-workflow-orchestrator-${this.environment}`,
                        type: 'lambda',
                        retryPolicy: {
                            maximumRetryAttempts: 3,
                            maximumEventAge: 3600,
                        },
                    },
                ],
            },
        ];
    }

    /**
     * Get event bus name
     */
    public getEventBusName(): string {
        return this.eventBusName;
    }

    /**
     * Validate EventBridge setup
     */
    public async validateSetup(): Promise<boolean> {
        try {
            // Check if event bus exists
            await eventBridgeClient.send(new DescribeEventBusCommand({
                Name: this.eventBusName,
            }));

            console.log('EventBridge setup validation passed');
            return true;
        } catch (error) {
            console.error('EventBridge setup validation failed:', error);
            return false;
        }
    }

    /**
     * Clean up EventBridge resources (for testing)
     */
    public async cleanup(): Promise<void> {
        console.log('Cleaning up EventBridge resources...');
        // Implementation would delete rules, targets, and event bus
        // This is typically used in testing environments
    }
}

/**
 * Event Bus Manager for runtime operations
 */
export class EventBusManager {
    private eventBusName: string;

    constructor(environment: string = process.env.NODE_ENV || 'development') {
        this.eventBusName = `bayon-coagent-events-${environment}`;
    }

    /**
     * Get event bus ARN
     */
    public getEventBusArn(): string {
        const region = process.env.AWS_REGION || 'us-east-1';
        const accountId = process.env.AWS_ACCOUNT_ID || '123456789012';
        return `arn:aws:events:${region}:${accountId}:event-bus/${this.eventBusName}`;
    }

    /**
     * Get event bus name
     */
    public getEventBusName(): string {
        return this.eventBusName;
    }

    /**
     * Create event pattern for filtering
     */
    public createEventPattern(source: string[], detailTypes: string[], additionalFilters?: any): any {
        return {
            source,
            'detail-type': detailTypes,
            ...additionalFilters,
        };
    }

    /**
     * Get standard event sources
     */
    public getEventSources() {
        return {
            CONTENT: 'bayon.coagent.content',
            AI: 'bayon.coagent.ai',
            INTEGRATION: 'bayon.coagent.integration',
            USER: 'bayon.coagent.user',
            NOTIFICATION: 'bayon.coagent.notification',
            HEALTH: 'bayon.coagent.health',
            ERROR: 'bayon.coagent.error',
            WORKFLOW: 'bayon.coagent.workflow',
        };
    }

    /**
     * Get standard detail types
     */
    public getDetailTypes() {
        return {
            // Content events
            CONTENT_GENERATION_REQUESTED: 'Content Generation Requested',
            CONTENT_GENERATION_COMPLETED: 'Content Generation Completed',
            CONTENT_PUBLISHED: 'Content Published',

            // AI events
            AI_JOB_STARTED: 'AI Job Started',
            AI_JOB_COMPLETED: 'AI Job Completed',
            AI_JOB_FAILED: 'AI Job Failed',

            // Integration events
            INTEGRATION_SYNC_STARTED: 'Integration Sync Started',
            INTEGRATION_SYNC_COMPLETED: 'Integration Sync Completed',
            INTEGRATION_SYNC_FAILED: 'Integration Sync Failed',

            // User events
            USER_CREATED: 'User Created',
            USER_UPDATED: 'User Updated',
            USER_DELETED: 'User Deleted',

            // Notification events
            NOTIFICATION_REQUESTED: 'Notification Requested',
            NOTIFICATION_DELIVERED: 'Notification Delivered',
            NOTIFICATION_FAILED: 'Notification Failed',

            // Health events
            SERVICE_HEALTH_CHECK: 'Service Health Check',
            SERVICE_STATUS_CHANGED: 'Service Status Changed',

            // Error events
            SERVICE_ERROR: 'Service Error',
            CRITICAL_ALERT: 'Critical Alert',

            // Workflow events
            WORKFLOW_STARTED: 'Workflow Started',
            WORKFLOW_COMPLETED: 'Workflow Completed',
            WORKFLOW_FAILED: 'Workflow Failed',
        };
    }
}

// Export singleton instances
export const eventBridgeSetup = new EventBridgeSetup();
export const eventBusManager = new EventBusManager();