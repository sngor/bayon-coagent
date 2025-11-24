"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifeEventAnalyzer = void 0;
exports.createLifeEventAnalyzer = createLifeEventAnalyzer;
exports.validateLifeEvent = validateLifeEvent;
exports.validateProspect = validateProspect;
exports.getEventTypeDisplayName = getEventTypeDisplayName;
exports.getEventTypeDescription = getEventTypeDescription;
const error_handling_1 = require("./error-handling");
const logger_1 = require("@/aws/logging/logger");
const EVENT_TYPE_WEIGHTS = {
    'marriage': 65,
    'divorce': 70,
    'job-change': 45,
    'retirement': 60,
    'birth': 55,
    'death': 75,
};
const TIMING_MULTIPLIERS = {
    '0-30': 1.2,
    '31-90': 1.0,
    '91-180': 0.8,
    '181-365': 0.6,
    '365+': 0.3,
};
const MARKET_CONDITION_MULTIPLIERS = {
    'hot': 1.15,
    'balanced': 1.0,
    'cold': 0.85,
};
class LifeEventAnalyzer {
    constructor() {
        this.logger = (0, logger_1.createLogger)({ service: 'life-event-analyzer' });
    }
    async analyzeEvents(targetAreas) {
        return (0, error_handling_1.withErrorHandling)(async () => {
            this.logger.info('Starting life event analysis', {
                targetAreasCount: targetAreas.length,
            });
            const alerts = [];
            for (const area of targetAreas) {
                const validation = error_handling_1.dataQualityValidator.validateTargetArea(area);
                if (!validation.isValid) {
                    this.logger.warn('Invalid target area detected', undefined, {
                        areaId: area.id,
                        errors: validation.errors,
                    });
                    continue;
                }
            }
            try {
                const prospects = await (0, error_handling_1.withRetry)(() => this.fetchProspectsInTargetAreas(targetAreas), { maxAttempts: 3, baseDelayMs: 2000 }, { operation: 'fetch-prospects' });
                this.logger.info('Fetched prospects for analysis', {
                    prospectsCount: prospects.length,
                });
                for (const prospect of prospects) {
                    try {
                        if (!this.validateProspect(prospect)) {
                            this.logger.warn('Invalid prospect data detected', undefined, {
                                prospectId: prospect.id,
                            });
                            continue;
                        }
                        const marketConditions = await (0, error_handling_1.withRetry)(() => this.getMarketConditions(prospect.location), { maxAttempts: 2, baseDelayMs: 1000 }, { operation: 'get-market-conditions' });
                        const leadScore = this.calculateLeadScore(prospect.events, marketConditions);
                        if (this.isHighIntentLead(leadScore)) {
                            const alert = this.createLifeEventAlert(prospect, leadScore);
                            const alertValidation = error_handling_1.dataQualityValidator.validateAlert(alert);
                            if (alertValidation.isValid) {
                                alerts.push(alert);
                            }
                            else {
                                this.logger.warn('Invalid alert generated', undefined, {
                                    prospectId: prospect.id,
                                    errors: alertValidation.errors,
                                });
                            }
                        }
                    }
                    catch (error) {
                        this.logger.error('Error processing individual prospect', error, {
                            prospectId: prospect.id,
                            location: prospect.location,
                        });
                    }
                }
                this.logger.info('Life event analysis completed', {
                    alertsGenerated: alerts.length,
                    prospectsProcessed: prospects.length,
                });
                return alerts;
            }
            catch (error) {
                this.logger.error('Failed to fetch prospects', error);
                throw new error_handling_1.ExternalAPIError('Failed to fetch prospect data from public records API', 'public-records', undefined, true, error);
            }
        }, { operation: 'analyze-life-events', service: 'life-event-analyzer' });
    }
    calculateLeadScore(events, marketConditions) {
        if (events.length === 0)
            return 0;
        const primaryEvent = this.getPrimaryEvent(events);
        let baseScore = EVENT_TYPE_WEIGHTS[primaryEvent.eventType];
        const daysSinceEvent = this.getDaysSinceEvent(primaryEvent.eventDate);
        const timingMultiplier = this.getTimingMultiplier(daysSinceEvent);
        baseScore *= timingMultiplier;
        const marketMultiplier = this.getMarketConditionMultiplier(marketConditions);
        baseScore *= marketMultiplier;
        const multipleEventBonus = this.calculateMultipleEventBonus(events);
        baseScore += multipleEventBonus;
        return Math.min(100, Math.max(0, Math.round(baseScore)));
    }
    identifyMultipleEvents(prospect) {
        const events = prospect.events;
        if (events.length <= 1)
            return 0;
        const sortedEvents = events.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
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
    isHighIntentLead(leadScore) {
        return leadScore > 70;
    }
    getPrimaryEvent(events) {
        return events.reduce((primary, current) => {
            const primaryWeight = EVENT_TYPE_WEIGHTS[primary.eventType];
            const currentWeight = EVENT_TYPE_WEIGHTS[current.eventType];
            return currentWeight > primaryWeight ? current : primary;
        });
    }
    getDaysSinceEvent(eventDate) {
        const event = new Date(eventDate);
        const now = new Date();
        return Math.floor((now.getTime() - event.getTime()) / (1000 * 60 * 60 * 24));
    }
    getTimingMultiplier(daysSince) {
        if (daysSince <= 30)
            return TIMING_MULTIPLIERS['0-30'];
        if (daysSince <= 90)
            return TIMING_MULTIPLIERS['31-90'];
        if (daysSince <= 180)
            return TIMING_MULTIPLIERS['91-180'];
        if (daysSince <= 365)
            return TIMING_MULTIPLIERS['181-365'];
        return TIMING_MULTIPLIERS['365+'];
    }
    getMarketConditionMultiplier(marketData) {
        const inventoryLevel = marketData.inventoryLevel;
        if (inventoryLevel < 3)
            return MARKET_CONDITION_MULTIPLIERS.hot;
        if (inventoryLevel > 6)
            return MARKET_CONDITION_MULTIPLIERS.cold;
        return MARKET_CONDITION_MULTIPLIERS.balanced;
    }
    calculateMultipleEventBonus(events) {
        if (events.length <= 1)
            return 0;
        const sortedEvents = events.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
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
    createLifeEventAlert(prospect, leadScore) {
        const primaryEvent = this.getPrimaryEvent(prospect.events);
        const additionalEvents = prospect.events
            .filter(e => e.id !== primaryEvent.id)
            .map(e => e.eventType);
        return {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: '',
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
    getRecommendedAction(eventType, leadScore) {
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
    validateProspect(prospect) {
        try {
            if (!prospect.id || !prospect.location || !prospect.events || prospect.events.length === 0) {
                return false;
            }
            for (const event of prospect.events) {
                if (!this.validateLifeEvent(event)) {
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            this.logger.warn('Prospect validation error', error, {
                prospectId: prospect.id,
            });
            return false;
        }
    }
    validateLifeEvent(event) {
        const requiredFields = ['id', 'personId', 'eventType', 'eventDate', 'location', 'confidence', 'source'];
        const validEventTypes = ['marriage', 'divorce', 'job-change', 'retirement', 'birth', 'death'];
        for (const field of requiredFields) {
            if (!event[field]) {
                return false;
            }
        }
        if (!validEventTypes.includes(event.eventType)) {
            return false;
        }
        if (event.confidence < 0 || event.confidence > 100) {
            return false;
        }
        if (isNaN(new Date(event.eventDate).getTime())) {
            return false;
        }
        return true;
    }
    async fetchProspectsInTargetAreas(targetAreas) {
        this.logger.debug('Fetching prospects from external APIs', {
            targetAreasCount: targetAreas.length,
        });
        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            const prospects = [];
            this.logger.debug('Successfully fetched prospects', {
                prospectsCount: prospects.length,
            });
            return prospects;
        }
        catch (error) {
            this.logger.error('Failed to fetch prospects from external API', error);
            throw new error_handling_1.ExternalAPIError('Public records API is temporarily unavailable', 'public-records', undefined, true, error);
        }
    }
    async getMarketConditions(location) {
        this.logger.debug('Fetching market conditions', { location });
        try {
            await new Promise(resolve => setTimeout(resolve, 50));
            const marketData = {
                neighborhood: location,
                date: new Date().toISOString(),
                medianPrice: 450000,
                inventoryLevel: 4.2,
                avgDaysOnMarket: 28,
                salesVolume: 125,
            };
            if (marketData.medianPrice < 0 || marketData.inventoryLevel < 0 || marketData.avgDaysOnMarket < 0) {
                throw new error_handling_1.DataQualityError('Invalid market data received', 'market-data', ['Negative values detected in market data']);
            }
            this.logger.debug('Successfully fetched market conditions', {
                location,
                medianPrice: marketData.medianPrice,
                inventoryLevel: marketData.inventoryLevel,
            });
            return marketData;
        }
        catch (error) {
            if (error instanceof error_handling_1.DataQualityError) {
                throw error;
            }
            this.logger.error('Failed to fetch market conditions', error, { location });
            throw new error_handling_1.ExternalAPIError('Market data API is temporarily unavailable', 'mls-api', undefined, true, error);
        }
    }
}
exports.LifeEventAnalyzer = LifeEventAnalyzer;
function createLifeEventAnalyzer() {
    return new LifeEventAnalyzer();
}
function validateLifeEvent(event) {
    return (typeof event === 'object' &&
        typeof event.id === 'string' &&
        typeof event.personId === 'string' &&
        typeof event.eventType === 'string' &&
        ['marriage', 'divorce', 'job-change', 'retirement', 'birth', 'death'].includes(event.eventType) &&
        typeof event.eventDate === 'string' &&
        typeof event.location === 'string' &&
        typeof event.confidence === 'number' &&
        event.confidence >= 0 && event.confidence <= 100 &&
        typeof event.source === 'string');
}
function validateProspect(prospect) {
    return (typeof prospect === 'object' &&
        typeof prospect.id === 'string' &&
        typeof prospect.location === 'string' &&
        Array.isArray(prospect.events) &&
        prospect.events.every(validateLifeEvent) &&
        typeof prospect.leadScore === 'number' &&
        prospect.leadScore >= 0 && prospect.leadScore <= 100 &&
        typeof prospect.lastAnalyzed === 'string');
}
function getEventTypeDisplayName(eventType) {
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
function getEventTypeDescription(eventType) {
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
