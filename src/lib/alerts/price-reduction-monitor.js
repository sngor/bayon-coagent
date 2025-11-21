"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceReductionMonitor = exports.PriceReductionMonitor = void 0;
exports.createPriceReductionMonitor = createPriceReductionMonitor;
const repository_1 = require("@/aws/dynamodb/repository");
class PriceReductionMonitor {
    constructor(options = {}) {
        this.repository = (0, repository_1.getRepository)();
        this.checkIntervalHours = options.checkIntervalHours ?? 4;
    }
    async monitorPriceReductions(targetAreas, settings) {
        const alerts = [];
        for (const area of targetAreas) {
            try {
                const events = await this.detectPriceReductions(area);
                const filteredEvents = this.applyPriceRangeFilter(events, settings.priceRangeFilters);
                for (const event of filteredEvents) {
                    const alert = await this.createPriceReductionAlert(event);
                    alerts.push(alert);
                }
            }
            catch (error) {
                console.error(`Error monitoring price reductions in area ${area.label}:`, error);
            }
        }
        return alerts;
    }
    async detectPriceReductions(targetArea) {
        const events = [];
        try {
            const currentListings = await this.fetchCurrentListings(targetArea);
            for (const listing of currentListings) {
                const priceHistory = await this.getPriceHistory(listing.mlsNumber);
                if (priceHistory.length > 0) {
                    const recentReductions = await this.findRecentPriceReductions(listing, priceHistory);
                    events.push(...recentReductions);
                }
            }
        }
        catch (error) {
            console.error(`Error detecting price reductions in ${targetArea.label}:`, error);
        }
        return events;
    }
    async findRecentPriceReductions(listing, priceHistory) {
        const events = [];
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sortedHistory = priceHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        for (let i = 0; i < sortedHistory.length - 1; i++) {
            const currentEntry = sortedHistory[i];
            const previousEntry = sortedHistory[i + 1];
            const changeDate = new Date(currentEntry.date);
            if (changeDate < yesterday) {
                break;
            }
            if (currentEntry.price < previousEntry.price) {
                const priceReduction = previousEntry.price - currentEntry.price;
                const priceReductionPercent = (priceReduction / previousEntry.price) * 100;
                const event = {
                    id: `${listing.mlsNumber}-reduction-${changeDate.getTime()}`,
                    propertyAddress: listing.address,
                    mlsNumber: listing.mlsNumber,
                    originalPrice: previousEntry.price,
                    newPrice: currentEntry.price,
                    priceReduction,
                    priceReductionPercent: Math.round(priceReductionPercent * 100) / 100,
                    daysOnMarket: listing.daysOnMarket,
                    eventDate: currentEntry.date,
                    propertyDetails: {
                        bedrooms: listing.bedrooms,
                        bathrooms: listing.bathrooms,
                        squareFeet: listing.squareFeet,
                        propertyType: listing.propertyType,
                    },
                };
                events.push(event);
            }
        }
        return events;
    }
    applyPriceRangeFilter(events, priceRangeFilters) {
        if (!priceRangeFilters) {
            return events;
        }
        return events.filter(event => {
            const price = event.newPrice;
            if (priceRangeFilters.min && price < priceRangeFilters.min) {
                return false;
            }
            if (priceRangeFilters.max && price > priceRangeFilters.max) {
                return false;
            }
            return true;
        });
    }
    async createPriceReductionAlert(event) {
        const alert = {
            id: `alert-${event.id}`,
            userId: '',
            type: 'price-reduction',
            priority: this.calculateAlertPriority(event),
            status: 'unread',
            createdAt: new Date().toISOString(),
            data: {
                propertyAddress: event.propertyAddress,
                originalPrice: event.originalPrice,
                newPrice: event.newPrice,
                priceReduction: event.priceReduction,
                priceReductionPercent: event.priceReductionPercent,
                daysOnMarket: event.daysOnMarket,
                propertyDetails: event.propertyDetails,
            },
        };
        return alert;
    }
    calculateAlertPriority(event) {
        if (event.priceReductionPercent >= 15) {
            return 'high';
        }
        if (event.priceReduction >= 50000) {
            return 'high';
        }
        if (event.priceReductionPercent >= 8 || event.daysOnMarket <= 30) {
            return 'medium';
        }
        return 'low';
    }
    validateMultipleReductionAlerts(events) {
        const uniqueIds = new Set(events.map(event => event.id));
        return uniqueIds.size === events.length;
    }
    getCheckIntervalHours() {
        return this.checkIntervalHours;
    }
    async fetchCurrentListings(targetArea) {
        return [];
    }
    async getPriceHistory(mlsNumber) {
        return [];
    }
    async storePriceSnapshot(listing) {
    }
}
exports.PriceReductionMonitor = PriceReductionMonitor;
function createPriceReductionMonitor(options) {
    return new PriceReductionMonitor(options);
}
exports.priceReductionMonitor = createPriceReductionMonitor();
