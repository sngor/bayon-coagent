"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.competitorMonitor = exports.CompetitorMonitor = void 0;
exports.createCompetitorMonitor = createCompetitorMonitor;
const repository_1 = require("@/aws/dynamodb/repository");
class CompetitorMonitor {
    constructor(options = {}) {
        this.repository = (0, repository_1.getRepository)();
        this.maxCompetitors = options.maxCompetitors ?? 20;
        this.priceReductionThreshold = options.priceReductionThreshold ?? 5;
    }
    async trackListingEvents(competitors, targetAreas) {
        if (competitors.length > this.maxCompetitors) {
            throw new Error(`Cannot track more than ${this.maxCompetitors} competitors`);
        }
        const alerts = [];
        for (const competitor of competitors) {
            if (!competitor.isActive) {
                continue;
            }
            try {
                const newListings = await this.detectNewListings(competitor, targetAreas);
                for (const listing of newListings) {
                    const alert = await this.createNewListingAlert(competitor, listing);
                    alerts.push(alert);
                }
                const priceReductions = await this.detectPriceReductions(competitor, targetAreas);
                for (const reduction of priceReductions) {
                    const alert = await this.createPriceReductionAlert(competitor, reduction);
                    alerts.push(alert);
                }
                const withdrawals = await this.detectWithdrawals(competitor, targetAreas);
                for (const withdrawal of withdrawals) {
                    const alert = await this.createWithdrawalAlert(competitor, withdrawal);
                    alerts.push(alert);
                }
            }
            catch (error) {
                console.error(`Error tracking competitor ${competitor.name}:`, error);
            }
        }
        return alerts;
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
    async fetchMLSDataForCompetitor(competitor, targetAreas) {
        return [];
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
