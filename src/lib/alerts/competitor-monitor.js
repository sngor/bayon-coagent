"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.competitorMonitor = exports.CompetitorMonitor = void 0;
exports.createCompetitorMonitor = createCompetitorMonitor;
const repository_1 = require("@/aws/dynamodb/repository");
const error_handling_1 = require("./error-handling");
const logger_1 = require("@/aws/logging/logger");
class CompetitorMonitor {
    constructor(options = {}) {
        this.repository = (0, repository_1.getRepository)();
        this.logger = (0, logger_1.createLogger)({ service: 'competitor-monitor' });
        this.maxCompetitors = options.maxCompetitors ?? 20;
        this.priceReductionThreshold = options.priceReductionThreshold ?? 5;
    }
    async trackListingEvents(competitors, targetAreas) {
        return (0, error_handling_1.withErrorHandling)(async () => {
            this.logger.info('Starting competitor monitoring', {
                competitorsCount: competitors.length,
                targetAreasCount: targetAreas.length,
            });
            if (competitors.length > this.maxCompetitors) {
                throw new Error(`Cannot track more than ${this.maxCompetitors} competitors`);
            }
            this.validateCompetitors(competitors);
            this.validateTargetAreas(targetAreas);
            const alerts = [];
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
                    const newListings = await (0, error_handling_1.withRetry)(() => this.detectNewListings(competitor, targetAreas), { maxAttempts: 2, baseDelayMs: 1000 }, { operation: 'detect-new-listings' });
                    for (const listing of newListings) {
                        const alert = await this.createNewListingAlert(competitor, listing);
                        if (this.validateAlert(alert)) {
                            alerts.push(alert);
                        }
                    }
                    const priceReductions = await (0, error_handling_1.withRetry)(() => this.detectPriceReductions(competitor, targetAreas), { maxAttempts: 2, baseDelayMs: 1000 }, { operation: 'detect-price-reductions' });
                    for (const reduction of priceReductions) {
                        const alert = await this.createPriceReductionAlert(competitor, reduction);
                        if (this.validateAlert(alert)) {
                            alerts.push(alert);
                        }
                    }
                    const withdrawals = await (0, error_handling_1.withRetry)(() => this.detectWithdrawals(competitor, targetAreas), { maxAttempts: 2, baseDelayMs: 1000 }, { operation: 'detect-withdrawals' });
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
                }
                catch (error) {
                    failedCompetitors++;
                    this.logger.error(`Error tracking competitor ${competitor.name}`, error, {
                        competitorId: competitor.id,
                        competitorName: competitor.name,
                    });
                }
            }
            this.logger.info('Competitor monitoring completed', {
                alertsGenerated: alerts.length,
                processedCompetitors,
                failedCompetitors,
                totalCompetitors: competitors.length,
            });
            return alerts;
        }, { operation: 'track-listing-events', service: 'competitor-monitor' });
    }
    async detectNewListings(competitor, targetAreas) {
        const events = [];
        try {
            const mlsData = await this.fetchMLSDataForCompetitor(competitor, targetAreas);
            for (const listing of mlsData) {
                const listingDate = new Date(listing.listDate);
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                if (listingDate > yesterday && listing.status === 'Active') {
                    const event = {
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
        }
        catch (error) {
            console.error(`Error detecting new listings for ${competitor.name}:`, error);
        }
        return events;
    }
    async detectPriceReductions(competitor, targetAreas) {
        const events = [];
        try {
            const mlsData = await this.fetchMLSDataForCompetitor(competitor, targetAreas);
            for (const listing of mlsData) {
                const priceHistory = await this.getPriceHistory(listing.mlsNumber);
                if (priceHistory.length > 0) {
                    const previousPrice = priceHistory[priceHistory.length - 1].price;
                    const currentPrice = listing.price;
                    const reductionPercent = ((previousPrice - currentPrice) / previousPrice) * 100;
                    if (reductionPercent > this.priceReductionThreshold) {
                        const event = {
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
        }
        catch (error) {
            console.error(`Error detecting price reductions for ${competitor.name}:`, error);
        }
        return events;
    }
    async detectWithdrawals(competitor, targetAreas) {
        const events = [];
        try {
            const mlsData = await this.fetchMLSDataForCompetitor(competitor, targetAreas);
            for (const listing of mlsData) {
                if (listing.status === 'Withdrawn' || listing.status === 'Expired') {
                    const statusChangeDate = await this.getStatusChangeDate(listing.mlsNumber, listing.status);
                    if (statusChangeDate) {
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        if (new Date(statusChangeDate) > yesterday) {
                            const event = {
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
        }
        catch (error) {
            console.error(`Error detecting withdrawals for ${competitor.name}:`, error);
        }
        return events;
    }
    async createNewListingAlert(competitor, event) {
        const alert = {
            id: `alert-${event.id}`,
            userId: '',
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
    async createPriceReductionAlert(competitor, event) {
        const priceReduction = (event.originalPrice - event.newPrice);
        const priceReductionPercent = (priceReduction / event.originalPrice) * 100;
        const alert = {
            id: `alert-${event.id}`,
            userId: '',
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
    async createWithdrawalAlert(competitor, event) {
        const alert = {
            id: `alert-${event.id}`,
            userId: '',
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
    calculateAlertPriority(event) {
        if (event.eventType === 'price-reduction' && event.originalPrice && event.newPrice) {
            const reductionPercent = ((event.originalPrice - event.newPrice) / event.originalPrice) * 100;
            if (reductionPercent > 15) {
                return 'high';
            }
        }
        if (event.eventType === 'withdrawal' && event.daysOnMarket && event.daysOnMarket < 30) {
            return 'high';
        }
        if (event.eventType === 'new-listing' && event.listingPrice) {
            if (event.listingPrice > 500000) {
                return 'medium';
            }
        }
        return 'low';
    }
    validateCompetitorCapacity(currentCount) {
        return currentCount <= this.maxCompetitors;
    }
    getMaxCompetitors() {
        return this.maxCompetitors;
    }
    validateCompetitors(competitors) {
        for (const competitor of competitors) {
            if (!competitor.id || !competitor.name) {
                throw new error_handling_1.DataQualityError('Invalid competitor data', 'competitor', ['Competitor must have id and name']);
            }
        }
    }
    validateTargetAreas(targetAreas) {
        for (const area of targetAreas) {
            const validation = error_handling_1.dataQualityValidator.validateTargetArea(area);
            if (!validation.isValid) {
                throw new error_handling_1.DataQualityError('Invalid target area data', 'target-area', validation.errors);
            }
        }
    }
    validateAlert(alert) {
        const validation = error_handling_1.dataQualityValidator.validateAlert(alert);
        if (!validation.isValid) {
            this.logger.warn('Invalid alert generated', undefined, {
                alertId: alert.id,
                errors: validation.errors,
            });
            return false;
        }
        return true;
    }
    async fetchMLSDataForCompetitor(competitor, targetAreas) {
        this.logger.debug('Fetching MLS data for competitor', {
            competitorId: competitor.id,
            competitorName: competitor.name,
            targetAreasCount: targetAreas.length,
        });
        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            const listings = [];
            this.logger.debug('Successfully fetched MLS data', {
                competitorId: competitor.id,
                listingsCount: listings.length,
            });
            return listings;
        }
        catch (error) {
            this.logger.error('Failed to fetch MLS data', error, {
                competitorId: competitor.id,
                competitorName: competitor.name,
            });
            throw new error_handling_1.ExternalAPIError('MLS API is temporarily unavailable', 'mls-api', undefined, true, error);
        }
    }
    async getPriceHistory(mlsNumber) {
        return [];
    }
    async getStatusChangeDate(mlsNumber, status) {
        return null;
    }
}
exports.CompetitorMonitor = CompetitorMonitor;
function createCompetitorMonitor(options) {
    return new CompetitorMonitor(options);
}
exports.competitorMonitor = createCompetitorMonitor();
