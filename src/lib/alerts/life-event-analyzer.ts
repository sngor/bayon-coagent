/**
 * Life Event Analyzer - Lead Scoring Engine
 * 
 * Analyzes life events from public records to identify high-intent prospects
 * and calculate lead scores based on event types, timing, and market conditions.
 */

import { LifeEvent, Prospect, LifeEventAlert, MarketData, TargetArea } from './types';
import {
    withErrorHandling,
    withRetry,
    dataQualityValidator,
    ExternalAPIError,
    DataQualityError,
    createUserFriendlyMessage
} from './error-handling';
import { createLogger } from '@/aws/logging/logger';

// ==================== Event Type Weights ====================

/**
 * Base scoring weights for different life event types
 * Higher weights indicate stronger buying/selling intent
 */
const EVENT_TYPE_WEIGHTS: Record<LifeEvent['eventType'], number> = {
    'marriage': 65,        // High intent - new household formation
    'divorce': 70,         // High intent - asset division, relocation
    'job-change': 45,      // Medium intent - potential relocation
    'retirement': 60,      // High intent - downsizing or lifestyle change
    'birth': 55,           // Medium-high intent - space needs change
    'death': 75,           // Highest intent - estate settlement, inheritance
};

/**
 * Timing multipliers based on how recent the event occurred
 * More recent events get higher multipliers
 */
const TIMING_MULTIPLIERS = {
    '0-30': 1.2,    // Within 30 days
    '31-90': 1.0,   // 31-90 days
    '91-180': 0.8,  // 3-6 months
    '181-365': 0.6, // 6-12 months
    '365+': 0.3,    // Over 1 year
};

/**
 * Market condition multipliers
 * Hot markets increase urgency, cold markets decrease it
 */
const MARKET_CONDITION_MULTIPLIERS = {
    'hot': 1.15,     // Low inventory, high demand
    'balanced': 1.0, // Normal market conditions
    'cold': 0.85,    // High inventory, low demand
};

// ==================== Core Analysis Functions ====================

/**
 * Analyzes life events for prospects in target areas and generates alerts
 */
export class LifeEventAnalyzer {
    private logger = createLogger({ service: 'life-event-analyzer' });

    /**
     * Analyzes life events and returns high-intent lead alerts
     */
    async analyzeEvents(targetAreas: TargetArea[]): Promise<LifeEventAlert[]> {
        return withErrorHandling(async () => {
            this.logger.info('Starting life event analysis', {
                targetAreasCount: targetAreas.length,
            });

            const alerts: LifeEventAlert[] = [];

            // Validate target areas
            for (const area of targetAreas) {
                const validation = dataQualityValidator.validateTargetArea(area);
                if (!validation.isValid) {
                    this.logger.warn('Invalid target area detected', undefined, {
                        areaId: area.id,
                        errors: validation.errors,
                    });
                    continue;
                }
            }

            try {
                // Fetch prospects with retry logic for external API calls
                const prospects = await withRetry(
                    () => this.fetchProspectsInTargetAreas(targetAreas),
                    { maxAttempts: 3, baseDelayMs: 2000 },
                    { operation: 'fetch-prospects' }
                );

                this.logger.info('Fetched prospects for analysis', {
                    prospectsCount: prospects.length,
                });

                for (const prospect of prospects) {
                    try {
                        // Validate prospect data
                        if (!this.validateProspect(prospect)) {
                            this.logger.warn('Invalid prospect data detected', undefined, {
                                prospectId: prospect.id,
                            });
                            continue;
                        }

                        const marketConditions = await withRetry(
                            () => this.getMarketConditions(prospect.location),
                            { maxAttempts: 2, baseDelayMs: 1000 },
                            { operation: 'get-market-conditions' }
                        );

                        const leadScore = this.calculateLeadScore(prospect.events, marketConditions);

                        if (this.isHighIntentLead(leadScore)) {
                            const alert = this.createLifeEventAlert(prospect, leadScore);

                            // Validate alert before adding
                            const alertValidation = dataQualityValidator.validateAlert(alert);
                            if (alertValidation.isValid) {
                                alerts.push(alert);
                            } else {
                                this.logger.warn('Invalid alert generated', undefined, {
                                    prospectId: prospect.id,
                                    errors: alertValidation.errors,
                                });
                            }
                        }
                    } catch (error) {
                        this.logger.error('Error processing individual prospect', error as Error, {
                            prospectId: prospect.id,
                            location: prospect.location,
                        });
                        // Continue with other prospects
                    }
                }

                this.logger.info('Life event analysis completed', {
                    alertsGenerated: alerts.length,
                    prospectsProcessed: prospects.length,
                });

                return alerts;
            } catch (error) {
                this.logger.error('Failed to fetch prospects', error as Error);
                throw new ExternalAPIError(
                    'Failed to fetch prospect data from public records API',
                    'public-records',
                    undefined,
                    true,
                    error as Error
                );
            }
        }, { operation: 'analyze-life-events', service: 'life-event-analyzer' });
    }

    /**
     * Calculates lead score for a prospect based on their life events
     */
    calculateLeadScore(events: LifeEvent[], marketConditions: MarketData): number {
        if (events.length === 0) return 0;

        // Start with the highest-weighted event as base score
        const primaryEvent = this.getPrimaryEvent(events);
        let baseScore = EVENT_TYPE_WEIGHTS[primaryEvent.eventType];

        // Apply timing multiplier
        const daysSinceEvent = this.getDaysSinceEvent(primaryEvent.eventDate);
        const timingMultiplier = this.getTimingMultiplier(daysSinceEvent);
        baseScore *= timingMultiplier;

        // Apply market condition multiplier
        const marketMultiplier = this.getMarketConditionMultiplier(marketConditions);
        baseScore *= marketMultiplier;

        // Add bonus for multiple events
        const multipleEventBonus = this.calculateMultipleEventBonus(events);
        baseScore += multipleEventBonus;

        // Ensure score is within valid range (0-100)
        return Math.min(100, Math.max(0, Math.round(baseScore)));
    }

    /**
     * Identifies multiple events within 90 days and calculates score adjustment
     */
    identifyMultipleEvents(prospect: Prospect): number {
        const events = prospect.events;
        if (events.length <= 1) return 0;

        // Group events by 90-day windows
        const sortedEvents = events.sort((a, b) =>
            new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
        );

        let additionalEvents = 0;
        const primaryEventDate = new Date(sortedEvents[0].eventDate);

        for (let i = 1; i < sortedEvents.length; i++) {
            const eventDate = new Date(sortedEvents[i].eventDate);
            const daysDifference = Math.abs(eventDate.getTime() - primaryEventDate.getTime()) / (1000 * 60 * 60 * 24);

            if (daysDifference <= 90) {
                additionalEvents++;
            }
        }

        // 15 points per additional event within 90 days
        return additionalEvents * 15;
    }

    /**
     * Determines if a lead score qualifies as high-intent (>70)
     */
    isHighIntentLead(leadScore: number): boolean {
        return leadScore > 70;
    }

    // ==================== Helper Functions ====================

    /**
     * Gets the primary (highest-weighted) event from a list
     */
    private getPrimaryEvent(events: LifeEvent[]): LifeEvent {
        return events.reduce((primary, current) => {
            const primaryWeight = EVENT_TYPE_WEIGHTS[primary.eventType];
            const currentWeight = EVENT_TYPE_WEIGHTS[current.eventType];
            return currentWeight > primaryWeight ? current : primary;
        });
    }

    /**
     * Calculates days since an event occurred
     */
    private getDaysSinceEvent(eventDate: string): number {
        const event = new Date(eventDate);
        const now = new Date();
        return Math.floor((now.getTime() - event.getTime()) / (1000 * 60 * 60 * 24));
    }

    /**
     * Gets timing multiplier based on days since event
     */
    private getTimingMultiplier(daysSince: number): number {
        if (daysSince <= 30) return TIMING_MULTIPLIERS['0-30'];
        if (daysSince <= 90) return TIMING_MULTIPLIERS['31-90'];
        if (daysSince <= 180) return TIMING_MULTIPLIERS['91-180'];
        if (daysSince <= 365) return TIMING_MULTIPLIERS['181-365'];
        return TIMING_MULTIPLIERS['365+'];
    }

    /**
     * Gets market condition multiplier based on market data
     */
    private getMarketConditionMultiplier(marketData: MarketData): number {
        // Simple heuristic: if inventory is low and prices rising, it's a hot market
        const inventoryLevel = marketData.inventoryLevel;

        if (inventoryLevel < 3) return MARKET_CONDITION_MULTIPLIERS.hot;
        if (inventoryLevel > 6) return MARKET_CONDITION_MULTIPLIERS.cold;
        return MARKET_CONDITION_MULTIPLIERS.balanced;
    }

    /**
     * Calculates bonus points for multiple events within 90 days
     */
    private calculateMultipleEventBonus(events: LifeEvent[]): number {
        if (events.length <= 1) return 0;

        const sortedEvents = events.sort((a, b) =>
            new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
        );

        let additionalEvents = 0;
        const primaryEventDate = new Date(sortedEvents[0].eventDate);

        for (let i = 1; i < sortedEvents.length; i++) {
            const eventDate = new Date(sortedEvents[i].eventDate);
            const daysDifference = Math.abs(eventDate.getTime() - primaryEventDate.getTime()) / (1000 * 60 * 60 * 24);

            if (daysDifference <= 90) {
                additionalEvents++;
            }
        }

        return additionalEvents * 15;
    }

    /**
     * Creates a life event alert from prospect data
     */
    private createLifeEventAlert(prospect: Prospect, leadScore: number): LifeEventAlert {
        const primaryEvent = this.getPrimaryEvent(prospect.events);
        const additionalEvents = prospect.events
            .filter(e => e.id !== primaryEvent.id)
            .map(e => e.eventType);

        return {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: '', // Will be set by the calling function
            type: 'life-event-lead',
            priority: leadScore >= 85 ? 'high' : leadScore >= 70 ? 'medium' : 'low',
            status: 'unread',
            createdAt: new Date().toISOString(),
            data: {
                prospectLocation: prospect.location,
                eventType: primaryEvent.eventType,
                eventDate: primaryEvent.eventDate,
                leadScore,
                recommendedAction: this.getRecommendedAction(primaryEvent.eventType, leadScore),
                additionalEvents: additionalEvents.length > 0 ? additionalEvents : undefined,
            },
        };
    }

    /**
     * Gets recommended action based on event type and lead score
     */
    private getRecommendedAction(eventType: LifeEvent['eventType'], leadScore: number): string {
        const actions = {
            'marriage': leadScore >= 85
                ? 'Contact immediately - newlyweds often buy within 6 months'
                : 'Send congratulations card with market update',
            'divorce': leadScore >= 85
                ? 'Reach out sensitively - may need to sell/buy quickly'
                : 'Add to nurture campaign for future opportunities',
            'job-change': leadScore >= 85
                ? 'Contact about relocation needs and timeline'
                : 'Send local market insights and stay in touch',
            'retirement': leadScore >= 85
                ? 'Discuss downsizing options and retirement communities'
                : 'Share retirement-friendly neighborhood guides',
            'birth': leadScore >= 85
                ? 'Contact about growing family space needs'
                : 'Send family-friendly neighborhood information',
            'death': leadScore >= 85
                ? 'Offer estate services and probate assistance'
                : 'Send condolences and offer future assistance',
        };

        return actions[eventType];
    }

    /**
     * Validates prospect data quality
     */
    private validateProspect(prospect: Prospect): boolean {
        try {
            if (!prospect.id || !prospect.location || !prospect.events || prospect.events.length === 0) {
                return false;
            }

            // Validate each life event
            for (const event of prospect.events) {
                if (!this.validateLifeEvent(event)) {
                    return false;
                }
            }

            return true;
        } catch (error) {
            this.logger.warn('Prospect validation error', error as Error, {
                prospectId: prospect.id,
            });
            return false;
        }
    }

    /**
     * Validates life event data
     */
    private validateLifeEvent(event: LifeEvent): boolean {
        const requiredFields = ['id', 'personId', 'eventType', 'eventDate', 'location', 'confidence', 'source'];
        const validEventTypes = ['marriage', 'divorce', 'job-change', 'retirement', 'birth', 'death'];

        for (const field of requiredFields) {
            if (!event[field as keyof LifeEvent]) {
                return false;
            }
        }

        if (!validEventTypes.includes(event.eventType)) {
            return false;
        }

        if (event.confidence < 0 || event.confidence > 100) {
            return false;
        }

        // Validate date format
        if (isNaN(new Date(event.eventDate).getTime())) {
            return false;
        }

        return true;
    }

    /**
     * Simulates fetching prospects from external APIs
     * In real implementation, this would call public records APIs
     */
    private async fetchProspectsInTargetAreas(targetAreas: TargetArea[]): Promise<Prospect[]> {
        this.logger.debug('Fetching prospects from external APIs', {
            targetAreasCount: targetAreas.length,
        });

        try {
            // This is a placeholder - in real implementation would fetch from:
            // - Public records APIs (marriage/divorce records)
            // - Employment databases (job changes)
            // - Property records (ownership changes)
            // - Demographic data providers

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 100));

            // For now, return empty array
            // In production, this would make actual API calls with proper error handling
            const prospects: Prospect[] = [];

            this.logger.debug('Successfully fetched prospects', {
                prospectsCount: prospects.length,
            });

            return prospects;
        } catch (error) {
            this.logger.error('Failed to fetch prospects from external API', error as Error);
            throw new ExternalAPIError(
                'Public records API is temporarily unavailable',
                'public-records',
                undefined,
                true,
                error as Error
            );
        }
    }

    /**
     * Gets market conditions for a specific location
     */
    private async getMarketConditions(location: string): Promise<MarketData> {
        this.logger.debug('Fetching market conditions', { location });

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 50));

            // Placeholder - would fetch from MLS or market data APIs
            const marketData: MarketData = {
                neighborhood: location,
                date: new Date().toISOString(),
                medianPrice: 450000,
                inventoryLevel: 4.2,
                avgDaysOnMarket: 28,
                salesVolume: 125,
            };

            // Validate market data
            if (marketData.medianPrice < 0 || marketData.inventoryLevel < 0 || marketData.avgDaysOnMarket < 0) {
                throw new DataQualityError(
                    'Invalid market data received',
                    'market-data',
                    ['Negative values detected in market data']
                );
            }

            this.logger.debug('Successfully fetched market conditions', {
                location,
                medianPrice: marketData.medianPrice,
                inventoryLevel: marketData.inventoryLevel,
            });

            return marketData;
        } catch (error) {
            if (error instanceof DataQualityError) {
                throw error;
            }

            this.logger.error('Failed to fetch market conditions', error as Error, { location });
            throw new ExternalAPIError(
                'Market data API is temporarily unavailable',
                'mls-api',
                undefined,
                true,
                error as Error
            );
        }
    }
}

// ==================== Utility Functions ====================

/**
 * Creates a new instance of the life event analyzer
 */
export function createLifeEventAnalyzer(): LifeEventAnalyzer {
    return new LifeEventAnalyzer();
}

/**
 * Validates life event data structure
 */
export function validateLifeEvent(event: any): event is LifeEvent {
    return (
        typeof event === 'object' &&
        typeof event.id === 'string' &&
        typeof event.personId === 'string' &&
        typeof event.eventType === 'string' &&
        ['marriage', 'divorce', 'job-change', 'retirement', 'birth', 'death'].includes(event.eventType) &&
        typeof event.eventDate === 'string' &&
        typeof event.location === 'string' &&
        typeof event.confidence === 'number' &&
        event.confidence >= 0 && event.confidence <= 100 &&
        typeof event.source === 'string'
    );
}

/**
 * Validates prospect data structure
 */
export function validateProspect(prospect: any): prospect is Prospect {
    return (
        typeof prospect === 'object' &&
        typeof prospect.id === 'string' &&
        typeof prospect.location === 'string' &&
        Array.isArray(prospect.events) &&
        prospect.events.every(validateLifeEvent) &&
        typeof prospect.leadScore === 'number' &&
        prospect.leadScore >= 0 && prospect.leadScore <= 100 &&
        typeof prospect.lastAnalyzed === 'string'
    );
}

/**
 * Gets event type display name
 */
export function getEventTypeDisplayName(eventType: LifeEvent['eventType']): string {
    const displayNames = {
        'marriage': 'Marriage',
        'divorce': 'Divorce',
        'job-change': 'Job Change',
        'retirement': 'Retirement',
        'birth': 'Birth',
        'death': 'Death',
    };

    return displayNames[eventType];
}

/**
 * Gets event type description for UI
 */
export function getEventTypeDescription(eventType: LifeEvent['eventType']): string {
    const descriptions = {
        'marriage': 'New household formation often leads to home purchases',
        'divorce': 'Asset division and relocation create buying/selling opportunities',
        'job-change': 'Career changes may require relocation or lifestyle adjustments',
        'retirement': 'Retirement often triggers downsizing or lifestyle moves',
        'birth': 'Growing families typically need larger living spaces',
        'death': 'Estate settlements and inheritance create real estate opportunities',
    };

    return descriptions[eventType];
}