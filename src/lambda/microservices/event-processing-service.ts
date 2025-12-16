/**
 * Event Processing Service
 * 
 * Handles asynchronous event processing through message queues without blocking callers.
 * Implements Property 20: Asynchronous event processing
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Types for event processing
interface UserEvent {
    eventId: string;
    eventType: string;
    userId: string;
    timestamp: string;
    data: Record<string, any>;
    source: string;
    correlationId?: string;
}

interface EventProcessingResult {
    eventId: string;
    processed: boolean;
    processedAt: string;
    processingTimeMs: number;
    queuedAt: string;
    errors?: string[];
}

interface EventProcessingRequest {
    event: UserEvent;
    options?: {
        priority?: 'high' | 'normal' | 'low';
        retryCount?: number;
        deadLetterQueue?: boolean;
    };
}

// Mock message queue implementation
class MessageQueue {
    private queue: Array<{ event: UserEvent; queuedAt: string; options?: any }> = [];
    private processing = false;

    async enqueue(event: UserEvent, options?: any): Promise<string> {
        const queuedAt = new Date().toISOString();
        this.queue.push({ event, queuedAt, options });

        // Start processing if not already running
        if (!this.processing) {
            setImmediate(() => this.processQueue());
        }

        return queuedAt;
    }

    private async processQueue(): Promise<void> {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            const item = this.queue.shift();
            if (item) {
                await this.processEvent(item.event, item.queuedAt, item.options);
            }
        }

        this.processing = false;
    }

    private async processEvent(event: UserEvent, queuedAt: string, options?: any): Promise<EventProcessingResult> {
        const startTime = Date.now();

        try {
            // Simulate event processing logic
            await this.simulateEventProcessing(event);

            const endTime = Date.now();
            const processingTimeMs = endTime - startTime;

            return {
                eventId: event.eventId,
                processed: true,
                processedAt: new Date().toISOString(),
                processingTimeMs,
                queuedAt,
            };
        } catch (error) {
            const endTime = Date.now();
            const processingTimeMs = endTime - startTime;

            return {
                eventId: event.eventId,
                processed: false,
                processedAt: new Date().toISOString(),
                processingTimeMs,
                queuedAt,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    }

    private async simulateEventProcessing(event: UserEvent): Promise<void> {
        // Simulate processing time based on event type
        const processingTimes: Record<string, number> = {
            'user_login': 50,
            'content_created': 100,
            'report_generated': 200,
            'search_performed': 75,
            'file_uploaded': 150,
            'integration_connected': 125,
            'notification_sent': 25,
            'error_occurred': 300,
        };

        const delay = processingTimes[event.eventType] || 100;
        await new Promise(resolve => setTimeout(resolve, delay));

        // Simulate occasional processing errors (5% failure rate)
        if (Math.random() < 0.05) {
            throw new Error(`Processing failed for event type: ${event.eventType}`);
        }

        // Simulate event-specific processing logic
        switch (event.eventType) {
            case 'user_login':
                await this.processUserLogin(event);
                break;
            case 'content_created':
                await this.processContentCreated(event);
                break;
            case 'report_generated':
                await this.processReportGenerated(event);
                break;
            case 'search_performed':
                await this.processSearchPerformed(event);
                break;
            case 'file_uploaded':
                await this.processFileUploaded(event);
                break;
            case 'integration_connected':
                await this.processIntegrationConnected(event);
                break;
            case 'notification_sent':
                await this.processNotificationSent(event);
                break;
            case 'error_occurred':
                await this.processErrorOccurred(event);
                break;
            default:
                console.log(`Processing generic event: ${event.eventType}`);
        }
    }

    private async processUserLogin(event: UserEvent): Promise<void> {
        // Update user last login timestamp
        // Track login analytics
        // Check for suspicious login patterns
        console.log(`Processing user login for user: ${event.userId}`);
    }

    private async processContentCreated(event: UserEvent): Promise<void> {
        // Index content for search
        // Generate content analytics
        // Trigger content workflow notifications
        console.log(`Processing content creation: ${event.data.contentType}`);
    }

    private async processReportGenerated(event: UserEvent): Promise<void> {
        // Store report metadata
        // Update usage analytics
        // Send completion notifications
        console.log(`Processing report generation: ${event.data.reportType}`);
    }

    private async processSearchPerformed(event: UserEvent): Promise<void> {
        // Track search analytics
        // Update search suggestions
        // Log search patterns
        console.log(`Processing search: ${event.data.query}`);
    }

    private async processFileUploaded(event: UserEvent): Promise<void> {
        // Scan file for viruses
        // Generate thumbnails if image
        // Update storage analytics
        console.log(`Processing file upload: ${event.data.fileName}`);
    }

    private async processIntegrationConnected(event: UserEvent): Promise<void> {
        // Validate integration credentials
        // Sync initial data
        // Update integration status
        console.log(`Processing integration: ${event.data.integrationType}`);
    }

    private async processNotificationSent(event: UserEvent): Promise<void> {
        // Track delivery status
        // Update notification analytics
        // Handle delivery failures
        console.log(`Processing notification: ${event.data.notificationType}`);
    }

    private async processErrorOccurred(event: UserEvent): Promise<void> {
        // Log error details
        // Trigger alerts if critical
        // Update error analytics
        console.log(`Processing error: ${event.data.errorType}`);
    }

    getQueueLength(): number {
        return this.queue.length;
    }
}

// Global message queue instance
const messageQueue = new MessageQueue();

/**
 * Event Processing Service Lambda Handler
 * 
 * Processes user events asynchronously through message queues
 */
export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    const traceId = context.awsRequestId;

    try {
        // Parse request body
        const requestBody: EventProcessingRequest = JSON.parse(event.body || '{}');

        if (!requestBody.event) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Trace-ID': traceId,
                },
                body: JSON.stringify({
                    error: {
                        errorId: traceId,
                        errorCode: 'VALIDATION_ERROR',
                        message: 'Event is required',
                        timestamp: new Date().toISOString(),
                        traceId,
                        service: 'event-processing-service',
                        retryable: false,
                    },
                }),
            };
        }

        // Validate event structure
        const userEvent = requestBody.event;
        if (!userEvent.eventId || !userEvent.eventType || !userEvent.userId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Trace-ID': traceId,
                },
                body: JSON.stringify({
                    error: {
                        errorId: traceId,
                        errorCode: 'VALIDATION_ERROR',
                        message: 'Event must have eventId, eventType, and userId',
                        timestamp: new Date().toISOString(),
                        traceId,
                        service: 'event-processing-service',
                        retryable: false,
                    },
                }),
            };
        }

        // Enqueue event for asynchronous processing
        const queuedAt = await messageQueue.enqueue(userEvent, requestBody.options);

        // Return immediately (non-blocking)
        return {
            statusCode: 202, // Accepted for processing
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                message: 'Event queued for processing',
                data: {
                    eventId: userEvent.eventId,
                    queuedAt,
                    queueLength: messageQueue.getQueueLength(),
                    estimatedProcessingTime: '50-300ms',
                },
            }),
        };

    } catch (error) {
        console.error('Event processing service error:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                error: {
                    errorId: traceId,
                    errorCode: 'INTERNAL_ERROR',
                    message: 'Failed to process event',
                    timestamp: new Date().toISOString(),
                    traceId,
                    service: 'event-processing-service',
                    retryable: true,
                },
            }),
        };
    }
};

// Export for testing
export { MessageQueue, UserEvent, EventProcessingResult };