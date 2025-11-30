/**
 * Competitor Monitoring System
 * 
 * Tracks listing activity of competing agents in target areas and generates alerts
 * for new listings, price reductions, withdrawals, and expirations.
 */

import { getRepository } from '@/aws/dynamodb/repository';
import {
    Competitor,
    ListingEvent,
    CompetitorAlert,
    TargetArea,
    MLSListingData,
    AlertPriority,
} from './types';
import {
    withErrorHandling,
    retryHandler,
    dataQualityValidator,
    ExternalAPIError,
    DataQualityError,
    createUserFriendlyMessage
} from './error-handling';
import { createLogger } from '@/aws/logging/logger';

export interface CompetitorMonitorOptions {
    maxCompetitors?: number;
    priceReductionThreshold?: number; // percentage
}

export class CompetitorMonitor {
    private repository = getRepository();
    private readonly maxCompetitors: number;
    private readonly priceReductionThreshold: number;
    private logger = createLogger({ service: 'competitor-monitor' });

    constructor(options: CompetitorMonitorOptions = {}) {
        this.maxCompetitors = options.maxCompetitors ?? 20;
        this.priceReductionThreshold = options.priceReductionThreshold ?? 5;
    }

    /**
     * Tracks listing events for all competitors in target areas
     * @param competitors Array of competitors to monitor
     * @param targetAreas Array of target areas to monitor
     * @returns Array of competitor alerts generated
     */
    async trackListingEvents(
        competitors: Competitor[],
        targetAreas: TargetArea[]
    ): Promise<CompetitorAlert[]> {
        return withErrorHandling(async () => {
            this.logger.info('Starting competitor monitoring', {
                competitorsCount: competitors.length,
                targetAreasCount: targetAreas.length,
            });

            // Validate competitor capacity
            if (competitors.length > this.maxCompetitors) {
                throw new Error(`Cannot track more than ${this.maxCompetitors} competitors`);
            }

            // Validate input data
            this.validateCompetitors(competitors);
            this.validateTargetAreas(targetAreas);

            const alerts: CompetitorAlert[] = [];
            let processedCompetitors = 0;
            let failedCompetitors = 0;

            for (const competitor of competitors) {
                if (!competitor.isActive) {
                    this.logger.debug('Skipping inactive competitor', {
                        competitorId: competitor.id,
                        competitorName: competitor.name,
                    });
                    continue;
                }

                try {
                    this.logger.debug('Processing competitor', {
                        competitorId: competitor.id,
                        competitorName: competitor.name,
                    });

                    // Get new listings for this competitor with retry logic
                    const newListings = await retryHandler.withRetry(
                        () => this.detectNewListings(competitor, targetAreas),
                        { maxAttempts: 2, baseDelayMs: 1000 },
                        { operation: 'detect-new-listings' }
                    );

                    for (const listing of newListings) {
                        const alert = await this.createNewListingAlert(competitor, listing);
                        if (this.validateAlert(alert)) {
                            alerts.push(alert);
                        }
                    }

                    // Get price reductions for this competitor
                    const priceReductions = await retryHandler.withRetry(
                        () => this.detectPriceReductions(competitor, targetAreas),
                        { maxAttempts: 2, baseDelayMs: 1000 },
                        { operation: 'detect-price-reductions' }
                    );

                    for (const reduction of priceReductions) {
                        const alert = await this.createPriceReductionAlert(competitor, reduction);
                        if (this.validateAlert(alert)) {
                            alerts.push(alert);
                        }
                    }

                    // Get withdrawals/expirations for this competitor
                    const withdrawals = await retryHandler.withRetry(
                        () => this.detectWithdrawals(competitor, targetAreas),
                        { maxAttempts: 2, baseDelayMs: 1000 },
                        { operation: 'detect-withdrawals' }
                    );

                    for (const withdrawal of withdrawals) {
                        const alert = await this.createWithdrawalAlert(competitor, withdrawal);
                        if (this.validateAlert(alert)) {
                            alerts.push(alert);
                        }
                    }

                    processedCompetitors++;
                    this.logger.debug('Successfully processed competitor', {
                        competitorId: competitor.id,
                        newListings: newListings.length,
                        priceReductions: priceReductions.length,
                        withdrawals: withdrawals.length,
                    });

                } catch (error) {
                    failedCompetitors++;
                    this.logger.error(`Error tracking competitor ${competitor.name}`, error as Error, {
                        competitorId: competitor.id,
                        competitorName: competitor.name,
                    });
                    // Continue with other competitors
                }
            }

            this.logger.info('Competitor monitoring completed', {
                alertsGenerated: alerts.length,
                processedCompetitors,
                failedCompetitors,
                totalCompetitors: competitors.length,
            });

            return alerts;
        }, { operation: 'track-listing-events', service: 'competitor-monitor' })();
    }

    /**
     * Detects new listings for a competitor in target areas
     * @param competitor Competitor to monitor
     * @param targetAreas Target areas to check
     * @returns Array of new listing events
     */
    async detectNewListings(
        competitor: Competitor,
        targetAreas: TargetArea[]
    ): Promise<ListingEvent[]> {
        const events: ListingEvent[] = [];

        try {
            // In a real implementation, this would query MLS APIs
            // For now, we'll simulate the detection logic
            const mlsData = await this.fetchMLSDataForCompetitor(competitor, targetAreas);

            for (const listing of mlsData) {
                // Check if this is a new listing (within last 24 hours)
                const listingDate = new Date(listing.listDate);
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                if (listingDate > yesterday && listing.status === 'Active') {
                    const event: ListingEvent = {
                        id: `${competitor.id}-${listing.mlsNumber}-new`,
                        competitorId: competitor.id,
                        propertyAddress: listing.address,
                        eventType: 'new-listing',
                        eventDate: listing.listDate,
                        listingPrice: listing.price,
                        mlsNumber: listing.mlsNumber,
                    };
                    events.push(event);
                }
            }
        } catch (error) {
            console.error(`Error detecting new listings for ${competitor.name}:`, error);
        }

        return events;
    }

    /**
     * Detects price reductions for a competitor
     * @param competitor Competitor to monitor
     * @param targetAreas Target areas to check
     * @returns Array of price reduction events
     */
    async detectPriceReductions(
        competitor: Competitor,
        targetAreas: TargetArea[]
    ): Promise<ListingEvent[]> {
        const events: ListingEvent[] = [];

        try {
            // In a real implementation, this would compare current prices with historical data
            const mlsData = await this.fetchMLSDataForCompetitor(competitor, targetAreas);

            for (const listing of mlsData) {
                // Simulate price reduction detection
                // In reality, this would compare with stored historical prices
                const priceHistory = await this.getPriceHistory(listing.mlsNumber);

                if (priceHistory.length > 0) {
                    const previousPrice = priceHistory[priceHistory.length - 1].price;
                    const currentPrice = listing.price;
                    const reductionPercent = ((previousPrice - currentPrice) / previousPrice) * 100;

                    if (reductionPercent > this.priceReductionThreshold) {
                        const event: ListingEvent = {
                            id: `${competitor.id}-${listing.mlsNumber}-reduction`,
                            competitorId: competitor.id,
                            propertyAddress: listing.address,
                            eventType: 'price-reduction',
                            eventDate: new Date().toISOString(),
                            listingPrice: currentPrice,
                            originalPrice: previousPrice,
                            newPrice: currentPrice,
                            daysOnMarket: listing.daysOnMarket,
                            mlsNumber: listing.mlsNumber,
                        };
                        events.push(event);
                    }
                }
            }
        } catch (error) {
            console.error(`Error detecting price reductions for ${competitor.name}:`, error);
        }

        return events;
    }

    /**
     * Detects withdrawals and expirations for a competitor
     * @param competitor Competitor to monitor
     * @param targetAreas Target areas to check
     * @returns Array of withdrawal/expiration events
     */
    async detectWithdrawals(
        competitor: Competitor,
        targetAreas: TargetArea[]
    ): Promise<ListingEvent[]> {
        const events: ListingEvent[] = [];

        try {
            // In a real implementation, this would track status changes
            const mlsData = await this.fetchMLSDataForCompetitor(competitor, targetAreas);

            for (const listing of mlsData) {
                // Check for withdrawn or expired listings
                if (listing.status === 'Withdrawn' || listing.status === 'Expired') {
                    // Check if this status change happened recently (within 24 hours)
                    const statusChangeDate = await this.getStatusChangeDate(listing.mlsNumber, listing.status);

                    if (statusChangeDate) {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);

                        if (new Date(statusChangeDate) > yesterday) {
                            const event: ListingEvent = {
                                id: `${competitor.id}-${listing.mlsNumber}-${listing.status.toLowerCase()}`,
                                competitorId: competitor.id,
                                propertyAddress: listing.address,
                                eventType: listing.status === 'Withdrawn' ? 'withdrawal' : 'expiration',
                                eventDate: statusChangeDate,
                                daysOnMarket: listing.daysOnMarket,
                                mlsNumber: listing.mlsNumber,
                            };
                            events.push(event);
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error detecting withdrawals for ${competitor.name}:`, error);
        }

        return events;
    }

    /**
     * Creates a new listing alert
     * @param competitor Competitor information
     * @param event Listing event
     * @returns Competitor alert
     */
    private async createNewListingAlert(
        competitor: Competitor,
        event: ListingEvent
    ): Promise<CompetitorAlert> {
        const alert: CompetitorAlert = {
            id: `alert-${event.id}`,
            userId: '', // Will be set by the calling function
            type: 'competitor-new-listing',
            priority: this.calculateAlertPriority(event),
            status: 'unread',
            createdAt: new Date().toISOString(),
            data: {
                competitorName: competitor.name,
                propertyAddress: event.propertyAddress,
                listingPrice: event.listingPrice,
            },
        };

        return alert;
    }

    /**
     * Creates a price reduction alert
     * @param competitor Competitor information
     * @param event Listing event
     * @returns Competitor alert
     */
    private async createPriceReductionAlert(
        competitor: Competitor,
        event: ListingEvent
    ): Promise<CompetitorAlert> {
        const priceReduction = (event.originalPrice! - event.newPrice!);
        const priceReductionPercent = (priceReduction / event.originalPrice!) * 100;

        const alert: CompetitorAlert = {
            id: `alert-${event.id}`,
            userId: '', // Will be set by the calling function
            type: 'competitor-price-reduction',
            priority: this.calculateAlertPriority(event),
            status: 'unread',
            createdAt: new Date().toISOString(),
            data: {
                competitorName: competitor.name,
                propertyAddress: event.propertyAddress,
                originalPrice: event.originalPrice,
                newPrice: event.newPrice,
                priceReduction,
                priceReductionPercent: Math.round(priceReductionPercent * 100) / 100,
                daysOnMarket: event.daysOnMarket,
            },
        };

        return alert;
    }

    /**
     * Creates a withdrawal/expiration alert
     * @param competitor Competitor information
     * @param event Listing event
     * @returns Competitor alert
     */
    private async createWithdrawalAlert(
        competitor: Competitor,
        event: ListingEvent
    ): Promise<CompetitorAlert> {
        const alert: CompetitorAlert = {
            id: `alert-${event.id}`,
            userId: '', // Will be set by the calling function
            type: 'competitor-withdrawal',
            priority: this.calculateAlertPriority(event),
            status: 'unread',
            createdAt: new Date().toISOString(),
            data: {
                competitorName: competitor.name,
                propertyAddress: event.propertyAddress,
                daysOnMarket: event.daysOnMarket,
            },
        };

        return alert;
    }

    /**
     * Calculates alert priority based on event characteristics
     * @param event Listing event
     * @returns Alert priority
     */
    private calculateAlertPriority(event: ListingEvent): AlertPriority {
        // High priority for significant price reductions or quick withdrawals
        if (event.eventType === 'price-reduction' && event.originalPrice && event.newPrice) {
            const reductionPercent = ((event.originalPrice - event.newPrice) / event.originalPrice) * 100;
            if (reductionPercent > 15) {
                return 'high';
            }
        }

        if (event.eventType === 'withdrawal' && event.daysOnMarket && event.daysOnMarket < 30) {
            return 'high';
        }

        // Medium priority for new listings in competitive price ranges
        if (event.eventType === 'new-listing' && event.listingPrice) {
            if (event.listingPrice > 500000) {
                return 'medium';
            }
        }

        return 'low';
    }

    /**
     * Validates competitor capacity
     * @param currentCount Current number of tracked competitors
     * @returns True if within capacity limits
     */
    validateCompetitorCapacity(currentCount: number): boolean {
        return currentCount <= this.maxCompetitors;
    }

    /**
     * Gets the maximum number of competitors that can be tracked
     * @returns Maximum competitor count
     */
    getMaxCompetitors(): number {
        return this.maxCompetitors;
    }

    // ==================== Mock/Simulation Methods ====================
    // These would be replaced with real MLS API calls in production

    /**
     * Validates competitors array
     */
    private validateCompetitors(competitors: Competitor[]): void {
        for (const competitor of competitors) {
            if (!competitor.id || !competitor.name) {
                throw new DataQualityError(
                    'Invalid competitor data',
                    'competitor',
                    ['Competitor must have id and name']
                );
            }
        }
    }

    /**
     * Validates target areas array
     */
    private validateTargetAreas(targetAreas: TargetArea[]): void {
        for (const area of targetAreas) {
            const validation = dataQualityValidator.validateTargetArea(area);
            if (!validation.isValid) {
                throw new DataQualityError(
                    'Invalid target area data',
                    'target-area',
                    validation.errors
                );
            }
        }
    }

    /**
     * Validates generated alert
     */
    private validateAlert(alert: CompetitorAlert): boolean {
        const validation = dataQualityValidator.validateAlert(alert);
        if (!validation.isValid) {
            this.logger.warn('Invalid alert generated', {
                alertId: alert.id,
                errors: validation.errors,
            });
            return false;
        }
        return true;
    }

    /**
     * Fetches MLS data for a competitor (mock implementation)
     * @param competitor Competitor to fetch data for
     * @param targetAreas Target areas to search
     * @returns Array of MLS listing data
     */
    private async fetchMLSDataForCompetitor(
        competitor: Competitor,
        targetAreas: TargetArea[]
    ): Promise<MLSListingData[]> {
        this.logger.debug('Fetching MLS data for competitor', {
            competitorId: competitor.id,
            competitorName: competitor.name,
            targetAreasCount: targetAreas.length,
        });

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 100));

            // Mock implementation - in reality this would call MLS APIs
            // For now, return empty array to avoid errors
            const listings: MLSListingData[] = [];

            // In production, this would:
            // 1. Query MLS API for competitor's listings
            // 2. Filter by target areas
            // 3. Validate and sanitize data
            // 4. Handle rate limiting and errors

            this.logger.debug('Successfully fetched MLS data', {
                competitorId: competitor.id,
                listingsCount: listings.length,
            });

            return listings;
        } catch (error) {
            this.logger.error('Failed to fetch MLS data', error as Error, {
                competitorId: competitor.id,
                competitorName: competitor.name,
            });

            throw new ExternalAPIError(
                'MLS API is temporarily unavailable',
                'mls-api',
                undefined,
                true,
                error as Error
            );
        }
    }

    /**
     * Gets price history for a listing (mock implementation)
     * @param mlsNumber MLS number
     * @returns Array of price history records
     */
    private async getPriceHistory(mlsNumber: string): Promise<Array<{ date: string; price: number }>> {
        // Mock implementation - in reality this would query stored price history
        return [];
    }

    /**
     * Gets the date when a listing status changed (mock implementation)
     * @param mlsNumber MLS number
     * @param status New status
     * @returns Status change date or null
     */
    private async getStatusChangeDate(mlsNumber: string, status: string): Promise<string | null> {
        // Mock implementation - in reality this would track status changes
        return null;
    }
}

/**
 * Creates a new competitor monitor instance
 * @param options Configuration options
 * @returns CompetitorMonitor instance
 */
export function createCompetitorMonitor(options?: CompetitorMonitorOptions): CompetitorMonitor {
    return new CompetitorMonitor(options);
}

/**
 * Default competitor monitor instance
 */
export const competitorMonitor = createCompetitorMonitor();