/**
 * Mobile Analytics and Monitoring
 * 
 * Tracks mobile-specific feature usage, errors, performance metrics,
 * and engagement for the mobile agent features.
 * 
 * Features:
 * - Feature usage tracking
 * - Mobile-specific error tracking
 * - Core Web Vitals monitoring
 * - Offline queue size monitoring
 * - Share and content engagement metrics
 */

import { logger, createLogger } from '@/aws/logging';
import type { LogContext } from '@/aws/logging';

// ============================================================================
// Types
// ============================================================================

export type MobileFeature =
    | 'quick-capture'
    | 'quick-actions'
    | 'quick-share'
    | 'voice-notes'
    | 'location-services'
    | 'offline-queue'
    | 'mobile-content'
    | 'lead-response'
    | 'market-data';

export type CaptureType = 'photo' | 'voice' | 'text';
export type ShareMethod = 'qr' | 'sms' | 'email' | 'social';
export type QuickActionType = string;

export interface FeatureUsageEvent {
    feature: MobileFeature;
    action: string;
    userId?: string;
    metadata?: Record<string, any>;
    timestamp: number;
}

export interface MobileErrorEvent {
    feature: MobileFeature;
    errorType: string;
    errorMessage: string;
    errorStack?: string;
    userId?: string;
    deviceInfo?: DeviceInfo;
    timestamp: number;
}

export interface PerformanceMetric {
    metric: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    userId?: string;
    page?: string;
    timestamp: number;
}

export interface OfflineQueueMetric {
    queueSize: number;
    oldestItemAge?: number; // milliseconds
    userId?: string;
    timestamp: number;
}

export interface EngagementMetric {
    type: 'share' | 'content-creation' | 'capture' | 'action';
    method?: ShareMethod;
    captureType?: CaptureType;
    actionType?: QuickActionType;
    userId?: string;
    propertyId?: string;
    success: boolean;
    duration?: number;
    metadata?: Record<string, any>;
    timestamp: number;
}

export interface DeviceInfo {
    userAgent: string;
    platform: string;
    screenWidth: number;
    screenHeight: number;
    devicePixelRatio: number;
    connectionType?: string;
    isOnline: boolean;
    isMobile: boolean;
    isStandalone: boolean; // PWA mode
}

// ============================================================================
// Mobile Analytics Class
// ============================================================================

class MobileAnalytics {
    private logger = createLogger({ service: 'mobile-analytics' });
    private metricsBuffer: any[] = [];
    private flushInterval: NodeJS.Timeout | null = null;
    private readonly BUFFER_SIZE = 50;
    private readonly FLUSH_INTERVAL = 30000; // 30 seconds

    constructor() {
        // Start auto-flush in browser environment
        if (typeof window !== 'undefined') {
            this.startAutoFlush();
            this.setupPerformanceObserver();
            this.setupOfflineQueueMonitoring();
        }
    }

    // ==========================================================================
    // Feature Usage Tracking
    // ==========================================================================

    /**
     * Track feature usage
     */
    trackFeatureUsage(
        feature: MobileFeature,
        action: string,
        metadata?: Record<string, any>
    ): void {
        const event: FeatureUsageEvent = {
            feature,
            action,
            metadata,
            timestamp: Date.now(),
        };

        this.logger.info(`Mobile feature used: ${feature} - ${action}`, {
            feature,
            action,
            ...metadata,
        });

        this.bufferMetric('feature-usage', event);
    }

    /**
     * Track quick capture usage
     */
    trackQuickCapture(captureType: CaptureType, success: boolean, metadata?: Record<string, any>): void {
        this.trackFeatureUsage('quick-capture', `capture-${captureType}`, {
            captureType,
            success,
            ...metadata,
        });
    }

    /**
     * Track quick action execution
     */
    trackQuickAction(actionType: string, success: boolean, duration?: number): void {
        this.trackFeatureUsage('quick-actions', `execute-${actionType}`, {
            actionType,
            success,
            duration,
        });
    }

    /**
     * Track voice note creation
     */
    trackVoiceNote(duration: number, transcribed: boolean, propertyId?: string): void {
        this.trackFeatureUsage('voice-notes', 'create', {
            duration,
            transcribed,
            propertyId,
        });
    }

    /**
     * Track location service usage
     */
    trackLocationService(action: 'check-in' | 'navigation' | 'reminder', metadata?: Record<string, any>): void {
        this.trackFeatureUsage('location-services', action, metadata);
    }

    // ==========================================================================
    // Error Tracking
    // ==========================================================================

    /**
     * Track mobile-specific errors
     */
    trackError(
        feature: MobileFeature,
        error: Error,
        context?: Record<string, any>
    ): void {
        const deviceInfo = this.getDeviceInfo();

        const errorEvent: MobileErrorEvent = {
            feature,
            errorType: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
            deviceInfo,
            timestamp: Date.now(),
        };

        this.logger.error(`Mobile error in ${feature}`, error, {
            feature,
            deviceInfo,
            ...context,
        });

        this.bufferMetric('mobile-error', errorEvent);
    }

    /**
     * Track permission denied errors
     */
    trackPermissionError(permission: 'camera' | 'microphone' | 'location', feature: MobileFeature): void {
        this.trackError(
            feature,
            new Error(`Permission denied: ${permission}`),
            { permission }
        );
    }

    /**
     * Track offline errors
     */
    trackOfflineError(feature: MobileFeature, operation: string): void {
        this.trackError(
            feature,
            new Error(`Operation failed while offline: ${operation}`),
            { operation, offline: true }
        );
    }

    /**
     * Track AI service errors
     */
    trackAIError(feature: MobileFeature, service: string, error: Error): void {
        this.trackError(feature, error, { service, errorCategory: 'ai-service' });
    }

    // ==========================================================================
    // Performance Monitoring
    // ==========================================================================

    /**
     * Setup Web Vitals performance observer
     */
    private setupPerformanceObserver(): void {
        if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
            return;
        }

        try {
            // Observe Largest Contentful Paint (LCP)
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1] as any;
                this.trackPerformanceMetric('LCP', lastEntry.renderTime || lastEntry.loadTime);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // Observe First Input Delay (FID) / Interaction to Next Paint (INP)
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry: any) => {
                    this.trackPerformanceMetric('FID', entry.processingStart - entry.startTime);
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });

            // Observe Cumulative Layout Shift (CLS)
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry: any) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                this.trackPerformanceMetric('CLS', clsValue);
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });

            // Track First Contentful Paint (FCP)
            const fcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry: any) => {
                    if (entry.name === 'first-contentful-paint') {
                        this.trackPerformanceMetric('FCP', entry.startTime);
                    }
                });
            });
            fcpObserver.observe({ entryTypes: ['paint'] });

            // Track Navigation Timing (TTFB)
            if (window.performance && window.performance.timing) {
                const timing = window.performance.timing;
                const ttfb = timing.responseStart - timing.requestStart;
                this.trackPerformanceMetric('TTFB', ttfb);
            }
        } catch (error) {
            this.logger.warn('Failed to setup performance observer', { error });
        }
    }

    /**
     * Track a performance metric
     */
    trackPerformanceMetric(
        metric: PerformanceMetric['metric'],
        value: number,
        page?: string
    ): void {
        const rating = this.getRating(metric, value);

        const perfMetric: PerformanceMetric = {
            metric,
            value,
            rating,
            page: page || (typeof window !== 'undefined' ? window.location.pathname : undefined),
            timestamp: Date.now(),
        };

        this.logger.info(`Performance metric: ${metric}`, {
            metric,
            value,
            rating,
            page: perfMetric.page,
        });

        this.bufferMetric('performance', perfMetric);
    }

    /**
     * Get performance rating based on Web Vitals thresholds
     */
    private getRating(metric: PerformanceMetric['metric'], value: number): 'good' | 'needs-improvement' | 'poor' {
        const thresholds: Record<PerformanceMetric['metric'], { good: number; poor: number }> = {
            FCP: { good: 1800, poor: 3000 },
            LCP: { good: 2500, poor: 4000 },
            FID: { good: 100, poor: 300 },
            CLS: { good: 0.1, poor: 0.25 },
            TTFB: { good: 800, poor: 1800 },
            INP: { good: 200, poor: 500 },
        };

        const threshold = thresholds[metric];
        if (value <= threshold.good) return 'good';
        if (value <= threshold.poor) return 'needs-improvement';
        return 'poor';
    }

    /**
     * Track custom performance timing
     */
    trackCustomTiming(name: string, duration: number, metadata?: Record<string, any>): void {
        this.logger.info(`Custom timing: ${name}`, {
            name,
            duration,
            ...metadata,
        });

        this.bufferMetric('custom-timing', {
            name,
            duration,
            metadata,
            timestamp: Date.now(),
        });
    }

    // ==========================================================================
    // Offline Queue Monitoring
    // ==========================================================================

    /**
     * Setup offline queue monitoring
     */
    private setupOfflineQueueMonitoring(): void {
        if (typeof window === 'undefined') return;

        // Monitor queue size every minute
        setInterval(() => {
            this.checkOfflineQueueSize();
        }, 60000);

        // Initial check
        this.checkOfflineQueueSize();
    }

    /**
     * Check and report offline queue size
     */
    private async checkOfflineQueueSize(): Promise<void> {
        try {
            // Get queue size from IndexedDB
            const db = await this.openOfflineDB();
            const transaction = db.transaction(['offline-queue'], 'readonly');
            const store = transaction.objectStore('offline-queue');
            const countRequest = store.count();

            countRequest.onsuccess = () => {
                const queueSize = countRequest.result;

                if (queueSize > 0) {
                    // Get oldest item age
                    const getAllRequest = store.getAll();
                    getAllRequest.onsuccess = () => {
                        const items = getAllRequest.result;
                        const oldestItem = items.reduce((oldest: any, item: any) => {
                            return !oldest || item.timestamp < oldest.timestamp ? item : oldest;
                        }, null);

                        const oldestItemAge = oldestItem ? Date.now() - oldestItem.timestamp : undefined;

                        this.trackOfflineQueueSize(queueSize, oldestItemAge);
                    };
                } else {
                    this.trackOfflineQueueSize(0);
                }
            };
        } catch (error) {
            this.logger.warn('Failed to check offline queue size', { error });
        }
    }

    /**
     * Open offline queue database
     */
    private openOfflineDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('bayon-offline', 1);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Track offline queue size
     */
    trackOfflineQueueSize(queueSize: number, oldestItemAge?: number): void {
        const metric: OfflineQueueMetric = {
            queueSize,
            oldestItemAge,
            timestamp: Date.now(),
        };

        this.logger.info('Offline queue size', {
            queueSize,
            oldestItemAge,
        });

        this.bufferMetric('offline-queue', metric);

        // Alert if queue is getting large
        if (queueSize > 100) {
            this.logger.warn('Offline queue size exceeds threshold', {
                queueSize,
                threshold: 100,
            });
        }
    }

    // ==========================================================================
    // Engagement Metrics
    // ==========================================================================

    /**
     * Track share engagement
     */
    trackShareEngagement(
        method: ShareMethod,
        success: boolean,
        propertyId?: string,
        metadata?: Record<string, any>
    ): void {
        const metric: EngagementMetric = {
            type: 'share',
            method,
            success,
            propertyId,
            metadata,
            timestamp: Date.now(),
        };

        this.logger.info('Share engagement', {
            method,
            success,
            propertyId,
            ...metadata,
        });

        this.bufferMetric('engagement', metric);
    }

    /**
     * Track content creation engagement
     */
    trackContentCreation(
        captureType: CaptureType,
        success: boolean,
        duration?: number,
        metadata?: Record<string, any>
    ): void {
        const metric: EngagementMetric = {
            type: 'content-creation',
            captureType,
            success,
            duration,
            metadata,
            timestamp: Date.now(),
        };

        this.logger.info('Content creation', {
            captureType,
            success,
            duration,
            ...metadata,
        });

        this.bufferMetric('engagement', metric);
    }

    /**
     * Track capture engagement
     */
    trackCaptureEngagement(
        captureType: CaptureType,
        success: boolean,
        duration?: number
    ): void {
        const metric: EngagementMetric = {
            type: 'capture',
            captureType,
            success,
            duration,
            timestamp: Date.now(),
        };

        this.logger.info('Capture engagement', {
            captureType,
            success,
            duration,
        });

        this.bufferMetric('engagement', metric);
    }

    /**
     * Track action engagement
     */
    trackActionEngagement(
        actionType: QuickActionType,
        success: boolean,
        duration?: number
    ): void {
        const metric: EngagementMetric = {
            type: 'action',
            actionType,
            success,
            duration,
            timestamp: Date.now(),
        };

        this.logger.info('Action engagement', {
            actionType,
            success,
            duration,
        });

        this.bufferMetric('engagement', metric);
    }

    // ==========================================================================
    // Device Information
    // ==========================================================================

    /**
     * Get device information
     */
    private getDeviceInfo(): DeviceInfo | undefined {
        if (typeof window === 'undefined') return undefined;

        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            devicePixelRatio: window.devicePixelRatio,
            connectionType: (navigator as any).connection?.effectiveType,
            isOnline: navigator.onLine,
            isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
            isStandalone: window.matchMedia('(display-mode: standalone)').matches,
        };
    }

    // ==========================================================================
    // Buffering and Flushing
    // ==========================================================================

    /**
     * Buffer a metric for batch sending
     */
    private bufferMetric(type: string, data: any): void {
        this.metricsBuffer.push({ type, data, timestamp: Date.now() });

        // Flush if buffer is full
        if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
            this.flush();
        }
    }

    /**
     * Start auto-flush interval
     */
    private startAutoFlush(): void {
        this.flushInterval = setInterval(() => {
            this.flush();
        }, this.FLUSH_INTERVAL);
    }

    /**
     * Flush buffered metrics
     */
    flush(): void {
        if (this.metricsBuffer.length === 0) return;

        const metricsToSend = [...this.metricsBuffer];
        this.metricsBuffer = [];

        // In production, send to analytics endpoint
        // For now, just log the batch
        const uniqueTypes = Array.from(new Set(metricsToSend.map(m => m.type)));
        this.logger.info('Flushing mobile analytics', {
            count: metricsToSend.length,
            types: uniqueTypes,
        });

        // TODO: Send to analytics endpoint or CloudWatch
        // This could be implemented as a server action or API endpoint
    }

    /**
     * Stop auto-flush and flush remaining metrics
     */
    stop(): void {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
        this.flush();
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let analyticsInstance: MobileAnalytics | null = null;

/**
 * Get the mobile analytics instance
 */
export function getMobileAnalytics(): MobileAnalytics {
    if (!analyticsInstance) {
        analyticsInstance = new MobileAnalytics();
    }
    return analyticsInstance;
}

/**
 * Reset the analytics instance (for testing)
 */
export function resetMobileAnalytics(): void {
    if (analyticsInstance) {
        analyticsInstance.stop();
        analyticsInstance = null;
    }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Track feature usage
 */
export function trackFeatureUsage(
    feature: MobileFeature,
    action: string,
    metadata?: Record<string, any>
): void {
    getMobileAnalytics().trackFeatureUsage(feature, action, metadata);
}

/**
 * Track mobile error
 */
export function trackMobileError(
    feature: MobileFeature,
    error: Error,
    context?: Record<string, any>
): void {
    getMobileAnalytics().trackError(feature, error, context);
}

/**
 * Track performance metric
 */
export function trackPerformance(
    metric: PerformanceMetric['metric'],
    value: number,
    page?: string
): void {
    getMobileAnalytics().trackPerformanceMetric(metric, value, page);
}

/**
 * Track engagement
 */
export function trackEngagement(
    type: EngagementMetric['type'],
    success: boolean,
    metadata?: Record<string, any>
): void {
    const analytics = getMobileAnalytics();

    if (type === 'share' && metadata?.method) {
        analytics.trackShareEngagement(
            metadata.method as ShareMethod,
            success,
            metadata.propertyId,
            metadata
        );
    } else if (type === 'content-creation' && metadata?.captureType) {
        analytics.trackContentCreation(
            metadata.captureType as CaptureType,
            success,
            metadata.duration,
            metadata
        );
    } else if (type === 'capture' && metadata?.captureType) {
        analytics.trackCaptureEngagement(
            metadata.captureType as CaptureType,
            success,
            metadata.duration
        );
    } else if (type === 'action' && metadata?.actionType) {
        analytics.trackActionEngagement(
            metadata.actionType as QuickActionType,
            success,
            metadata.duration
        );
    }
}
