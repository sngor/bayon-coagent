/**
 * Event Publisher Utility
 * 
 * Centralized service for publishing events to EventBridge
 */

import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { getConfig } from '@/aws/config';

export interface EventDetail {
    source: string;
    detailType: string;
    detail: any;
    resources?: string[];
}

export class EventPublisher {
    private eventBridge: EventBridgeClient;
    private eventBusName: string;

    constructor() {
        const config = getConfig();
        this.eventBridge = new EventBridgeClient({ region: config.region });
        this.eventBusName = process.env.EVENT_BUS_NAME || `bayon-coagent-events-${config.environment}`;
    }

    /**
     * Publish a single event
     */
    async publishEvent(eventDetail: EventDetail): Promise<void> {
        const event = {
            Source: eventDetail.source,
            DetailType: eventDetail.detailType,
            Detail: JSON.stringify(eventDetail.detail),
            EventBusName: this.eventBusName,
            Resources: eventDetail.resources || []
        };

        await this.eventBridge.send(new PutEventsCommand({
            Entries: [event]
        }));

        console.log('Event published:', {
            source: eventDetail.source,
            detailType: eventDetail.detailType,
            eventBusName: this.eventBusName
        });
    }

    /**
     * Publish multiple events in batch
     */
    async publishEvents(eventDetails: EventDetail[]): Promise<void> {
        const events = eventDetails.map(eventDetail => ({
            Source: eventDetail.source,
            DetailType: eventDetail.detailType,
            Detail: JSON.stringify(eventDetail.detail),
            EventBusName: this.eventBusName,
            Resources: eventDetail.resources || []
        }));

        // EventBridge supports up to 10 events per batch
        const batches = this.chunkArray(events, 10);

        for (const batch of batches) {
            await this.eventBridge.send(new PutEventsCommand({
                Entries: batch
            }));
        }

        console.log(`Published ${eventDetails.length} events in ${batches.length} batches`);
    }

    /**
     * Studio/Content Events
     */
    async publishContentGenerated(data: {
        userId: string;
        contentId: string;
        contentType: string;
        title: string;
        content: string;
        metadata: any;
    }): Promise<void> {
        await this.publishEvent({
            source: 'bayon.coagent.studio',
            detailType: 'Content Generated',
            detail: {
                ...data,
                timestamp: new Date().toISOString()
            }
        });
    }

    async publishContentPublished(data: {
        userId: string;
        contentId: string;
        contentType: string;
        publishedTo: string[];
        scheduledFor?: string;
    }): Promise<void> {
        await this.publishEvent({
            source: 'bayon.coagent.studio',
            detailType: 'Content Published',
            detail: {
                ...data,
                timestamp: new Date().toISOString()
            }
        });
    }

    async publishJobProgress(data: {
        userId: string;
        jobId: string;
        jobType: string;
        progress: number;
        status: string;
        message: string;
        estimatedTimeRemaining?: number;
    }): Promise<void> {
        await this.publishEvent({
            source: 'bayon.coagent.studio',
            detailType: 'Job Progress Update',
            detail: {
                ...data,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Brand Intelligence Events
     */
    async publishProfileUpdated(data: {
        userId: string;
        profileData: any;
        changes: string[];
    }): Promise<void> {
        await this.publishEvent({
            source: 'bayon.coagent.brand',
            detailType: 'Profile Updated',
            detail: {
                ...data,
                timestamp: new Date().toISOString()
            }
        });
    }

    async publishCompetitorDiscovered(data: {
        userId: string;
        competitorId: string;
        competitorData: any;
        discoveryMethod: string;
    }): Promise<void> {
        await this.publishEvent({
            source: 'bayon.coagent.brand',
            detailType: 'Competitor Discovered',
            detail: {
                ...data,
                timestamp: new Date().toISOString()
            }
        });
    }

    async publishRankingChanged(data: {
        userId: string;
        keyword: string;
        oldRank: number;
        newRank: number;
        searchEngine: string;
    }): Promise<void> {
        await this.publishEvent({
            source: 'bayon.coagent.brand',
            detailType: 'Ranking Changed',
            detail: {
                ...data,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Research Events
     */
    async publishResearchCompleted(data: {
        userId: string;
        queryId: string;
        query: string;
        results: any;
        sources: string[];
    }): Promise<void> {
        await this.publishEvent({
            source: 'bayon.coagent.research',
            detailType: 'Research Query Completed',
            detail: {
                ...data,
                timestamp: new Date().toISOString()
            }
        });
    }

    async publishReportGenerated(data: {
        userId: string;
        reportId: string;
        reportType: string;
        reportData: any;
    }): Promise<void> {
        await this.publishEvent({
            source: 'bayon.coagent.research',
            detailType: 'Report Generated',
            detail: {
                ...data,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Market Intelligence Events
     */
    async publishTrendDetected(data: {
        userId?: string;
        trendType: string;
        trendData: any;
        confidence: number;
        affectedUsers?: string[];
    }): Promise<void> {
        await this.publishEvent({
            source: 'bayon.coagent.market',
            detailType: 'Trend Detected',
            detail: {
                ...data,
                timestamp: new Date().toISOString()
            }
        });
    }

    async publishAlertTriggered(data: {
        userId: string;
        alertType: string;
        alertData: any;
        severity: 'low' | 'medium' | 'high' | 'critical';
    }): Promise<void> {
        await this.publishEvent({
            source: 'bayon.coagent.market',
            detailType: 'Alert Triggered',
            detail: {
                ...data,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * User Events
     */
    async publishUserRegistered(data: {
        userId: string;
        email: string;
        registrationMethod: string;
        referralSource?: string;
    }): Promise<void> {
        await this.publishEvent({
            source: 'bayon.coagent.user',
            detailType: 'User Registered',
            detail: {
                ...data,
                timestamp: new Date().toISOString()
            }
        });
    }

    async publishSubscriptionChanged(data: {
        userId: string;
        oldPlan: string;
        newPlan: string;
        changeReason: string;
    }): Promise<void> {
        await this.publishEvent({
            source: 'bayon.coagent.user',
            detailType: 'Subscription Changed',
            detail: {
                ...data,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Real-time Notifications
     */
    async publishRealtimeNotification(data: {
        userId: string;
        type: string;
        message: string;
        data?: any;
    }): Promise<void> {
        await this.publishEvent({
            source: 'bayon.coagent.notification',
            detailType: 'Real-time Notification',
            detail: {
                ...data,
                timestamp: new Date().toISOString()
            }
        });
    }

    /**
     * Utility function to chunk arrays
     */
    private chunkArray<T>(array: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
}

// Singleton instance
let eventPublisher: EventPublisher | null = null;

export function getEventPublisher(): EventPublisher {
    if (!eventPublisher) {
        eventPublisher = new EventPublisher();
    }
    return eventPublisher;
}

// Convenience functions for common events
export const publishContentGenerated = (data: Parameters<EventPublisher['publishContentGenerated']>[0]) =>
    getEventPublisher().publishContentGenerated(data);

export const publishJobProgress = (data: Parameters<EventPublisher['publishJobProgress']>[0]) =>
    getEventPublisher().publishJobProgress(data);

export const publishRealtimeNotification = (data: Parameters<EventPublisher['publishRealtimeNotification']>[0]) =>
    getEventPublisher().publishRealtimeNotification(data);