/**
 * Analytics and user behavior tracking for AI features
 */
import React from 'react';

interface AnalyticsEvent {
    event: string;
    properties: Record<string, any>;
    timestamp: number;
    userId?: string;
    sessionId: string;
}

interface AIUsageMetrics {
    totalGenerations: number;
    successfulGenerations: number;
    averageGenerationTime: number;
    mostUsedFeatures: Array<{ feature: string; count: number }>;
    errorRate: number;
    userSatisfactionScore?: number;
}

class AnalyticsTracker {
    private events: AnalyticsEvent[] = [];
    private sessionId: string;

    constructor() {
        this.sessionId = this.generateSessionId();
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    track(event: string, properties: Record<string, any> = {}, userId?: string): void {
        const analyticsEvent: AnalyticsEvent = {
            event,
            properties: {
                ...properties,
                url: typeof window !== 'undefined' ? window.location.pathname : '',
                userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            },
            timestamp: Date.now(),
            userId,
            sessionId: this.sessionId
        };

        this.events.push(analyticsEvent);

        // In production, send to analytics service
        if (process.env.NODE_ENV === 'production') {
            this.sendToAnalyticsService(analyticsEvent);
        } else {
            console.log('Analytics Event:', analyticsEvent);
        }
    }

    private async sendToAnalyticsService(event: AnalyticsEvent): Promise<void> {
        try {
            // Replace with your analytics service (Google Analytics, Mixpanel, etc.)
            await fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            });
        } catch (error) {
            console.error('Failed to send analytics event:', error);
        }
    }

    getAIUsageMetrics(): AIUsageMetrics {
        const aiEvents = this.events.filter(e => e.event.startsWith('ai_'));

        const generations = aiEvents.filter(e => e.event === 'ai_generation_completed');
        const successful = generations.filter(e => e.properties.success === true);

        const generationTimes = successful
            .map(e => e.properties.duration)
            .filter(d => typeof d === 'number');

        const featureCounts = aiEvents.reduce((acc, event) => {
            const feature = event.properties.feature || 'unknown';
            acc[feature] = (acc[feature] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const mostUsedFeatures = Object.entries(featureCounts)
            .map(([feature, count]) => ({ feature, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            totalGenerations: generations.length,
            successfulGenerations: successful.length,
            averageGenerationTime: generationTimes.length > 0
                ? generationTimes.reduce((sum, time) => sum + time, 0) / generationTimes.length
                : 0,
            mostUsedFeatures,
            errorRate: generations.length > 0
                ? ((generations.length - successful.length) / generations.length) * 100
                : 0
        };
    }

    getEvents(eventType?: string): AnalyticsEvent[] {
        if (eventType) {
            return this.events.filter(e => e.event === eventType);
        }
        return [...this.events];
    }

    clear(): void {
        this.events = [];
    }
}

// Global analytics instance
export const analytics = new AnalyticsTracker();

// Predefined event tracking functions
export const trackAIGeneration = {
    started: (feature: string, inputLength: number, userId?: string) => {
        analytics.track('ai_generation_started', {
            feature,
            inputLength,
            timestamp: Date.now()
        }, userId);
    },

    completed: (feature: string, duration: number, success: boolean, outputLength?: number, userId?: string) => {
        analytics.track('ai_generation_completed', {
            feature,
            duration,
            success,
            outputLength,
            timestamp: Date.now()
        }, userId);
    },

    failed: (feature: string, error: string, duration: number, userId?: string) => {
        analytics.track('ai_generation_failed', {
            feature,
            error,
            duration,
            timestamp: Date.now()
        }, userId);
    }
};

export const trackUserInteraction = {
    featureUsed: (feature: string, action: string, userId?: string) => {
        analytics.track('feature_used', {
            feature,
            action,
            timestamp: Date.now()
        }, userId);
    },

    contentSaved: (contentType: string, contentLength: number, userId?: string) => {
        analytics.track('content_saved', {
            contentType,
            contentLength,
            timestamp: Date.now()
        }, userId);
    },

    feedbackGiven: (feature: string, rating: number, feedback?: string, userId?: string) => {
        analytics.track('feedback_given', {
            feature,
            rating,
            feedback,
            timestamp: Date.now()
        }, userId);
    }
};

// React hook for analytics
export function useAnalytics() {
    const trackEvent = (event: string, properties?: Record<string, any>, userId?: string) => {
        analytics.track(event, properties, userId);
    };

    const getMetrics = () => analytics.getAIUsageMetrics();

    return {
        trackEvent,
        trackAIGeneration,
        trackUserInteraction,
        getMetrics
    };
}

// HOC for tracking component usage
export function withAnalytics<P extends object>(
    Component: React.ComponentType<P>,
    componentName: string
) {
    return function AnalyticsWrappedComponent(props: P) {
        React.useEffect(() => {
            analytics.track('component_mounted', { componentName });
        }, []);

        return <Component {...props} />;
    };
}