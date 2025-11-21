"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeighborhoodTrendDetector = void 0;
exports.getNeighborhoodTrendDetector = getNeighborhoodTrendDetector;
exports.resetNeighborhoodTrendDetector = resetNeighborhoodTrendDetector;
const data_access_1 = require("./data-access");
class NeighborhoodTrendDetector {
    constructor() {
        this.dataAccess = (0, data_access_1.getAlertDataAccess)();
    }
    async analyzeTrends(neighborhoods) {
        const alerts = [];
        for (const neighborhood of neighborhoods) {
            try {
                const neighborhoodAlerts = await this.analyzeNeighborhoodTrends(neighborhood);
                alerts.push(...neighborhoodAlerts);
            }
            catch (error) {
                console.error(`Error analyzing trends for neighborhood ${neighborhood}:`, error);
            }
        }
        return alerts;
    }
    async analyzeNeighborhoodTrends(neighborhood) {
        const marketData = await this.getMarketData(neighborhood);
        if (marketData.length < 2) {
            return [];
        }
        const currentIndicators = this.calculateTrendIndicators(neighborhood, marketData);
        const historicalData = await this.getHistoricalMarketData(neighborhood);
        const alerts = [];
        if (currentIndicators.priceChange > 10) {
            const historicalContext = this.calculateHistoricalContext(historicalData, 'medianPrice');
            alerts.push(this.createTrendAlert(neighborhood, 'price-increase', currentIndicators.medianPrice, this.getPreviousValue(marketData, 'medianPrice'), currentIndicators.priceChange, historicalContext));
        }
        if (currentIndicators.inventoryChange < -20) {
            const historicalContext = this.calculateHistoricalContext(historicalData, 'inventoryLevel');
            alerts.push(this.createTrendAlert(neighborhood, 'inventory-decrease', currentIndicators.inventoryLevel, this.getPreviousValue(marketData, 'inventoryLevel'), Math.abs(currentIndicators.inventoryChange), historicalContext));
        }
        if (currentIndicators.domChange < -15) {
            const historicalContext = this.calculateHistoricalContext(historicalData, 'avgDaysOnMarket');
            alerts.push(this.createTrendAlert(neighborhood, 'dom-decrease', currentIndicators.avgDaysOnMarket, this.getPreviousValue(marketData, 'avgDaysOnMarket'), Math.abs(currentIndicators.domChange), historicalContext));
        }
        return alerts;
    }
    calculateTrendIndicators(neighborhood, marketData) {
        if (marketData.length < 2) {
            throw new Error('At least 2 data points are required to calculate trend indicators');
        }
        const sortedData = marketData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const current = sortedData[0];
        const previous = sortedData[1];
        const priceChange = this.calculatePercentageChange(previous.medianPrice, current.medianPrice);
        const inventoryChange = this.calculatePercentageChange(previous.inventoryLevel, current.inventoryLevel);
        const domChange = this.calculatePercentageChange(previous.avgDaysOnMarket, current.avgDaysOnMarket);
        return {
            neighborhood,
            period: this.formatPeriod(current.date),
            medianPrice: current.medianPrice,
            priceChange,
            inventoryLevel: current.inventoryLevel,
            inventoryChange,
            avgDaysOnMarket: current.avgDaysOnMarket,
            domChange,
            salesVolume: current.salesVolume,
            calculatedAt: new Date().toISOString()
        };
    }
    compareHistoricalData(current, historical) {
        if (current.priceChange > 10) {
            return this.createTrendAlert(current.neighborhood, 'price-increase', current.medianPrice, historical.medianPrice, current.priceChange, {
                avg90Day: historical.medianPrice,
                avg365Day: historical.medianPrice
            });
        }
        if (current.inventoryChange < -20) {
            return this.createTrendAlert(current.neighborhood, 'inventory-decrease', current.inventoryLevel, historical.inventoryLevel, Math.abs(current.inventoryChange), {
                avg90Day: historical.inventoryLevel,
                avg365Day: historical.inventoryLevel
            });
        }
        if (current.domChange < -15) {
            return this.createTrendAlert(current.neighborhood, 'dom-decrease', current.avgDaysOnMarket, historical.avgDaysOnMarket, Math.abs(current.domChange), {
                avg90Day: historical.avgDaysOnMarket,
                avg365Day: historical.avgDaysOnMarket
            });
        }
        return null;
    }
    async getMarketData(neighborhood) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return [
            {
                neighborhood,
                date: now.toISOString(),
                medianPrice: 450000,
                inventoryLevel: 120,
                avgDaysOnMarket: 25,
                salesVolume: 45
            },
            {
                neighborhood,
                date: thirtyDaysAgo.toISOString(),
                medianPrice: 400000,
                inventoryLevel: 160,
                avgDaysOnMarket: 30,
                salesVolume: 38
            }
        ];
    }
    async getHistoricalMarketData(neighborhood) {
        const now = new Date();
        const data = [];
        for (let i = 0; i < 365; i++) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            data.push({
                neighborhood,
                date: date.toISOString(),
                medianPrice: 420000 + Math.random() * 60000,
                inventoryLevel: 140 + Math.random() * 40,
                avgDaysOnMarket: 28 + Math.random() * 8,
                salesVolume: 35 + Math.random() * 20
            });
        }
        return data;
    }
    calculateHistoricalContext(historicalData, metric) {
        const now = new Date();
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const threeSixtyFiveDaysAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        const ninetyDayData = historicalData.filter(data => {
            const dataDate = new Date(data.date);
            return dataDate >= ninetyDaysAgo && dataDate <= now;
        });
        const threeSixtyFiveDayData = historicalData.filter(data => {
            const dataDate = new Date(data.date);
            return dataDate >= threeSixtyFiveDaysAgo && dataDate <= now;
        });
        const avg90Day = this.calculateAverage(ninetyDayData, metric);
        const avg365Day = this.calculateAverage(threeSixtyFiveDayData, metric);
        return { avg90Day, avg365Day };
    }
    calculateAverage(data, metric) {
        if (data.length === 0)
            return 0;
        const sum = data.reduce((acc, item) => {
            const value = item[metric];
            return acc + (typeof value === 'number' ? value : 0);
        }, 0);
        return sum / data.length;
    }
    getPreviousValue(marketData, metric) {
        if (marketData.length < 2)
            return 0;
        const value = marketData[1][metric];
        return typeof value === 'number' ? value : 0;
    }
    calculatePercentageChange(oldValue, newValue) {
        if (oldValue === 0)
            return 0;
        return ((newValue - oldValue) / oldValue) * 100;
    }
    formatPeriod(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    }
    createTrendAlert(neighborhood, trendType, currentValue, previousValue, changePercent, historicalContext) {
        let priority = 'medium';
        if (changePercent > 25) {
            priority = 'high';
        }
        else if (changePercent < 15) {
            priority = 'low';
        }
        return {
            id: this.generateAlertId(),
            userId: '',
            type: 'neighborhood-trend',
            priority,
            status: 'unread',
            createdAt: new Date().toISOString(),
            data: {
                neighborhood,
                trendType,
                currentValue,
                previousValue,
                changePercent,
                historicalContext
            }
        };
    }
    generateAlertId() {
        return `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.NeighborhoodTrendDetector = NeighborhoodTrendDetector;
let detectorInstance = null;
function getNeighborhoodTrendDetector() {
    if (!detectorInstance) {
        detectorInstance = new NeighborhoodTrendDetector();
    }
    return detectorInstance;
}
function resetNeighborhoodTrendDetector() {
    detectorInstance = null;
}
