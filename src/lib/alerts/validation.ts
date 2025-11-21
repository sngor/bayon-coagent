/**
 * Market Intelligence Alerts - Data Validation Utilities
 * 
 * Provides comprehensive validation functions for all alert-related data types.
 * Used by both server-side processing and client-side forms.
 */

import { z } from 'zod';
import type {
    Alert,
    AlertSettings,
    TargetArea,
    LifeEvent,
    Prospect,
    NeighborhoodProfile,
    AlertType,
    AlertPriority,
    AlertStatus
} from './types';
import { createLogger } from '@/aws/logging/logger';

const logger = createLogger({ service: 'alert-validation' });

// ==================== Zod Schemas ====================

// Base schemas
const alertTypeSchema = z.enum([
    'life-event-lead',
    'competitor-new-listing',
    'competitor-price-reduction',
    'competitor-withdrawal',
    'neighborhood-trend',
    'price-reduction'
]);

const alertPrioritySchema = z.enum(['high', 'medium', 'low']);
const alertStatusSchema = z.enum(['unread', 'read', 'dismissed', 'archived']);
const alertFrequencySchema = z.enum(['real-time', 'daily', 'weekly']);

// Target area schemas
const targetAreaSchema = z.object({
    id: z.string().min(1, 'Target area ID is required'),
    type: z.enum(['zip', 'city', 'polygon']),
    value: z.union([
        z.string().min(1, 'Target area value is required'),
        z.object({
            coordinates: z.array(z.object({
                lat: z.number().min(-90).max(90),
                lng: z.number().min(-180).max(180),
            })).min(3, 'Polygon must have at least 3 coordinates'),
        }),
    ]),
    label: z.string().min(1, 'Target area label is required'),
});

// ZIP code validation
const zipCodeSchema = z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format');

// Life event schemas
const lifeEventSchema = z.object({
    id: z.string().min(1),
    personId: z.string().min(1),
    eventType: z.enum(['marriage', 'divorce', 'job-change', 'retirement', 'birth', 'death']),
    eventDate: z.string().datetime('Invalid event date format'),
    location: z.string().min(1),
    confidence: z.number().min(0).max(100),
    source: z.string().min(1),
    metadata: z.record(z.any()).optional(),
});

const prospectSchema = z.object({
    id: z.string().min(1),
    location: z.string().min(1),
    events: z.array(lifeEventSchema).min(1, 'Prospect must have at least one life event'),
    leadScore: z.number().min(0).max(100),
    lastAnalyzed: z.string().datetime(),
});

// Alert data schemas
const lifeEventAlertDataSchema = z.object({
    prospectLocation: z.string().min(1),
    eventType: z.enum(['marriage', 'divorce', 'job-change', 'retirement', 'birth', 'death']),
    eventDate: z.string().datetime(),
    leadScore: z.number().min(0).max(100),
    recommendedAction: z.string().min(1),
    additionalEvents: z.array(z.string()).optional(),
});

const competitorAlertDataSchema = z.object({
    competitorName: z.string().min(1),
    propertyAddress: z.string().min(1),
    listingPrice: z.number().positive().optional(),
    originalPrice: z.number().positive().optional(),
    newPrice: z.number().positive().optional(),
    priceReduction: z.number().positive().optional(),
    priceReductionPercent: z.number().positive().optional(),
    daysOnMarket: z.number().nonnegative().optional(),
});

const neighborhoodTrendAlertDataSchema = z.object({
    neighborhood: z.string().min(1),
    trendType: z.enum(['price-increase', 'inventory-decrease', 'dom-decrease']),
    currentValue: z.number(),
    previousValue: z.number(),
    changePercent: z.number(),
    historicalContext: z.object({
        avg90Day: z.number(),
        avg365Day: z.number(),
    }),
});

const priceReductionAlertDataSchema = z.object({
    propertyAddress: z.string().min(1),
    originalPrice: z.number().positive(),
    newPrice: z.number().positive(),
    priceReduction: z.number().positive(),
    priceReductionPercent: z.number().positive(),
    daysOnMarket: z.number().nonnegative(),
    propertyDetails: z.object({
        bedrooms: z.number().nonnegative(),
        bathrooms: z.number().nonnegative(),
        squareFeet: z.number().positive(),
        propertyType: z.string().min(1),
    }),
});

// Main alert schema
const alertSchema = z.object({
    id: z.string().min(1),
    userId: z.string().min(1),
    type: alertTypeSchema,
    priority: alertPrioritySchema,
    status: alertStatusSchema,
    createdAt: z.string().datetime(),
    readAt: z.string().datetime().optional(),
    dismissedAt: z.string().datetime().optional(),
    data: z.union([
        lifeEventAlertDataSchema,
        competitorAlertDataSchema,
        neighborhoodTrendAlertDataSchema,
        priceReductionAlertDataSchema,
    ]),
});

// Alert settings schema
const alertSettingsSchema = z.object({
    userId: z.string().min(1),
    enabledAlertTypes: z.array(alertTypeSchema),
    frequency: alertFrequencySchema,
    digestTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)').optional(),
    leadScoreThreshold: z.number().min(50).max(90),
    priceRangeFilters: z.object({
        min: z.number().nonnegative().optional(),
        max: z.number().nonnegative().optional(),
    }).optional(),
    targetAreas: z.array(targetAreaSchema),
    trackedCompetitors: z.array(z.string()),
    updatedAt: z.string().datetime(),
}).refine(
    (data) => {
        if (data.priceRangeFilters?.min && data.priceRangeFilters?.max) {
            return data.priceRangeFilters.min <= data.priceRangeFilters.max;
        }
        return true;
    },
    {
        message: 'Minimum price cannot be greater than maximum price',
        path: ['priceRangeFilters'],
    }
);

// Neighborhood profile schema
const neighborhoodProfileSchema = z.object({
    id: z.string().min(1),
    userId: z.string().min(1),
    location: z.string().min(1),
    generatedAt: z.string().datetime(),
    marketData: z.object({
        medianSalePrice: z.number().nonnegative(),
        avgDaysOnMarket: z.number().nonnegative(),
        salesVolume: z.number().nonnegative(),
        inventoryLevel: z.number().nonnegative(),
        priceHistory: z.array(z.object({
            month: z.string(),
            medianPrice: z.number().nonnegative(),
        })),
    }),
    demographics: z.object({
        population: z.number().nonnegative(),
        medianHouseholdIncome: z.number().nonnegative(),
        ageDistribution: z.object({
            under18: z.number().nonnegative(),
            age18to34: z.number().nonnegative(),
            age35to54: z.number().nonnegative(),
            age55to74: z.number().nonnegative(),
            over75: z.number().nonnegative(),
        }),
        householdComposition: z.object({
            familyHouseholds: z.number().nonnegative(),
            nonFamilyHouseholds: z.number().nonnegative(),
            averageHouseholdSize: z.number().positive(),
        }),
    }),
    schools: z.array(z.object({
        name: z.string().min(1),
        type: z.enum(['public', 'private']),
        grades: z.string().min(1),
        rating: z.number().min(1).max(10),
        distance: z.number().nonnegative(),
    })),
    amenities: z.object({
        restaurants: z.array(z.object({
            name: z.string().min(1),
            category: z.string().min(1),
            distance: z.number().nonnegative(),
        })),
        shopping: z.array(z.object({
            name: z.string().min(1),
            category: z.string().min(1),
            distance: z.number().nonnegative(),
        })),
        parks: z.array(z.object({
            name: z.string().min(1),
            distance: z.number().nonnegative(),
        })),
        healthcare: z.array(z.object({
            name: z.string().min(1),
            type: z.string().min(1),
            distance: z.number().nonnegative(),
        })),
        entertainment: z.array(z.object({
            name: z.string().min(1),
            category: z.string().min(1),
            distance: z.number().nonnegative(),
        })),
    }),
    walkabilityScore: z.number().min(0).max(100),
    aiInsights: z.string().min(1),
    exportUrls: z.object({
        pdf: z.string().url().optional(),
        html: z.string().url().optional(),
    }).optional(),
});

// ==================== Validation Functions ====================

/**
 * Validates an alert object
 */
export function validateAlert(alert: unknown): { isValid: boolean; errors: string[]; data?: Alert } {
    try {
        const result = alertSchema.safeParse(alert);

        if (result.success) {
            return { isValid: true, errors: [], data: result.data as Alert };
        } else {
            const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
            logger.warn('Alert validation failed', undefined, { errors });
            return { isValid: false, errors };
        }
    } catch (error) {
        logger.error('Alert validation error', error as Error);
        return { isValid: false, errors: ['Validation error occurred'] };
    }
}

/**
 * Validates alert settings
 */
export function validateAlertSettings(settings: unknown): { isValid: boolean; errors: string[]; data?: AlertSettings } {
    try {
        const result = alertSettingsSchema.safeParse(settings);

        if (result.success) {
            return { isValid: true, errors: [], data: result.data as AlertSettings };
        } else {
            const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
            logger.warn('Alert settings validation failed', undefined, { errors });
            return { isValid: false, errors };
        }
    } catch (error) {
        logger.error('Alert settings validation error', error as Error);
        return { isValid: false, errors: ['Validation error occurred'] };
    }
}

/**
 * Validates a target area
 */
export function validateTargetArea(area: unknown): { isValid: boolean; errors: string[]; data?: TargetArea } {
    try {
        const result = targetAreaSchema.safeParse(area);

        if (result.success) {
            // Additional validation for specific types
            const data = result.data;

            if (data.type === 'zip' && typeof data.value === 'string') {
                const zipResult = zipCodeSchema.safeParse(data.value);
                if (!zipResult.success) {
                    return { isValid: false, errors: ['Invalid ZIP code format'] };
                }
            }

            return { isValid: true, errors: [], data: data as TargetArea };
        } else {
            const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
            logger.warn('Target area validation failed', undefined, { errors });
            return { isValid: false, errors };
        }
    } catch (error) {
        logger.error('Target area validation error', error as Error);
        return { isValid: false, errors: ['Validation error occurred'] };
    }
}

/**
 * Validates a life event
 */
export function validateLifeEvent(event: unknown): { isValid: boolean; errors: string[]; data?: LifeEvent } {
    try {
        const result = lifeEventSchema.safeParse(event);

        if (result.success) {
            return { isValid: true, errors: [], data: result.data as LifeEvent };
        } else {
            const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
            logger.warn('Life event validation failed', undefined, { errors });
            return { isValid: false, errors };
        }
    } catch (error) {
        logger.error('Life event validation error', error as Error);
        return { isValid: false, errors: ['Validation error occurred'] };
    }
}

/**
 * Validates a prospect
 */
export function validateProspect(prospect: unknown): { isValid: boolean; errors: string[]; data?: Prospect } {
    try {
        const result = prospectSchema.safeParse(prospect);

        if (result.success) {
            return { isValid: true, errors: [], data: result.data as Prospect };
        } else {
            const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
            logger.warn('Prospect validation failed', undefined, { errors });
            return { isValid: false, errors };
        }
    } catch (error) {
        logger.error('Prospect validation error', error as Error);
        return { isValid: false, errors: ['Validation error occurred'] };
    }
}

/**
 * Validates a neighborhood profile
 */
export function validateNeighborhoodProfile(profile: unknown): { isValid: boolean; errors: string[]; data?: NeighborhoodProfile } {
    try {
        const result = neighborhoodProfileSchema.safeParse(profile);

        if (result.success) {
            return { isValid: true, errors: [], data: result.data as NeighborhoodProfile };
        } else {
            const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
            logger.warn('Neighborhood profile validation failed', undefined, { errors });
            return { isValid: false, errors };
        }
    } catch (error) {
        logger.error('Neighborhood profile validation error', error as Error);
        return { isValid: false, errors: ['Validation error occurred'] };
    }
}

// ==================== Data Sanitization Functions ====================

/**
 * Sanitizes external API data
 */
export function sanitizeExternalData(data: any, dataType: string): any {
    try {
        logger.debug('Sanitizing external data', { dataType });

        if (!data || typeof data !== 'object') {
            return null;
        }

        // Remove null/undefined values and sanitize based on type
        const sanitized = removeNullValues(data);

        switch (dataType) {
            case 'mls-listing':
                return sanitizeMLSData(sanitized);
            case 'demographics':
                return sanitizeDemographicsData(sanitized);
            case 'school-ratings':
                return sanitizeSchoolData(sanitized);
            case 'walkability':
                return sanitizeWalkabilityData(sanitized);
            case 'amenities':
                return sanitizeAmenitiesData(sanitized);
            default:
                return sanitized;
        }
    } catch (error) {
        logger.error('Data sanitization failed', error as Error, { dataType });
        return null;
    }
}

/**
 * Removes null and undefined values from objects
 */
function removeNullValues(obj: any): any {
    if (obj === null || obj === undefined) {
        return null;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => removeNullValues(item)).filter(item => item !== null);
    }

    if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
            const cleanedValue = removeNullValues(value);
            if (cleanedValue !== null) {
                cleaned[key] = cleanedValue;
            }
        }
        return cleaned;
    }

    return obj;
}

/**
 * Sanitizes MLS listing data
 */
function sanitizeMLSData(data: any): any {
    return {
        ...data,
        price: sanitizeNumber(data.price, 0),
        bedrooms: sanitizeNumber(data.bedrooms, 0),
        bathrooms: sanitizeNumber(data.bathrooms, 0),
        squareFeet: sanitizeNumber(data.squareFeet, 0),
        daysOnMarket: sanitizeNumber(data.daysOnMarket, 0),
        address: sanitizeString(data.address),
        propertyType: sanitizeString(data.propertyType),
        mlsNumber: sanitizeString(data.mlsNumber),
        status: sanitizeString(data.status),
        listDate: data.listDate ? new Date(data.listDate).toISOString() : undefined,
    };
}

/**
 * Sanitizes demographics data
 */
function sanitizeDemographicsData(data: any): any {
    return {
        ...data,
        population: sanitizeNumber(data.population, 0),
        medianHouseholdIncome: sanitizeNumber(data.medianHouseholdIncome, 0),
        ageDistribution: data.ageDistribution ? {
            under18: sanitizeNumber(data.ageDistribution.under18, 0),
            age18to34: sanitizeNumber(data.ageDistribution.age18to34, 0),
            age35to54: sanitizeNumber(data.ageDistribution.age35to54, 0),
            age55to74: sanitizeNumber(data.ageDistribution.age55to74, 0),
            over75: sanitizeNumber(data.ageDistribution.over75, 0),
        } : undefined,
        householdComposition: data.householdComposition ? {
            familyHouseholds: sanitizeNumber(data.householdComposition.familyHouseholds, 0),
            nonFamilyHouseholds: sanitizeNumber(data.householdComposition.nonFamilyHouseholds, 0),
            averageHouseholdSize: sanitizeNumber(data.householdComposition.averageHouseholdSize, 1),
        } : undefined,
    };
}

/**
 * Sanitizes school data
 */
function sanitizeSchoolData(data: any): any {
    if (Array.isArray(data)) {
        return data.map(school => ({
            ...school,
            rating: sanitizeNumber(school.rating, 1, 10),
            distance: sanitizeNumber(school.distance, 0),
            name: sanitizeString(school.name),
            type: sanitizeString(school.type),
            grades: sanitizeString(school.grades),
        }));
    }
    return data;
}

/**
 * Sanitizes walkability data
 */
function sanitizeWalkabilityData(data: any): any {
    return {
        ...data,
        score: sanitizeNumber(data.score, 0, 100),
        description: sanitizeString(data.description),
        factors: Array.isArray(data.factors) ? data.factors.map(sanitizeString) : [],
    };
}

/**
 * Sanitizes amenities data
 */
function sanitizeAmenitiesData(data: any): any {
    const sanitizeAmenityArray = (amenities: any[]) => {
        if (!Array.isArray(amenities)) return [];
        return amenities.map(amenity => ({
            name: sanitizeString(amenity.name),
            category: sanitizeString(amenity.category || amenity.type),
            distance: sanitizeNumber(amenity.distance, 0),
        }));
    };

    return {
        restaurants: sanitizeAmenityArray(data.restaurants || []),
        shopping: sanitizeAmenityArray(data.shopping || []),
        parks: data.parks ? data.parks.map((park: any) => ({
            name: sanitizeString(park.name),
            distance: sanitizeNumber(park.distance, 0),
        })) : [],
        healthcare: sanitizeAmenityArray(data.healthcare || []),
        entertainment: sanitizeAmenityArray(data.entertainment || []),
    };
}

/**
 * Sanitizes and validates numeric values
 */
function sanitizeNumber(value: any, min?: number, max?: number): number {
    const num = Number(value);
    if (isNaN(num)) {
        return min || 0;
    }

    let sanitized = num;
    if (min !== undefined && sanitized < min) sanitized = min;
    if (max !== undefined && sanitized > max) sanitized = max;

    return sanitized;
}

/**
 * Sanitizes string values
 */
function sanitizeString(value: any): string {
    if (typeof value !== 'string') {
        return String(value || '');
    }
    return value.trim();
}

// ==================== Business Logic Validation ====================

/**
 * Validates that a price reduction is actually a reduction
 */
export function validatePriceReduction(originalPrice: number, newPrice: number): { isValid: boolean; error?: string } {
    if (originalPrice <= 0 || newPrice <= 0) {
        return { isValid: false, error: 'Prices must be positive numbers' };
    }

    if (newPrice >= originalPrice) {
        return { isValid: false, error: 'New price must be less than original price' };
    }

    return { isValid: true };
}

/**
 * Validates lead score calculation
 */
export function validateLeadScore(score: number): { isValid: boolean; error?: string } {
    if (score < 0 || score > 100) {
        return { isValid: false, error: 'Lead score must be between 0 and 100' };
    }

    return { isValid: true };
}

/**
 * Validates trend change percentage
 */
export function validateTrendChange(changePercent: number, trendType: string): { isValid: boolean; error?: string } {
    const thresholds = {
        'price-increase': 10,
        'inventory-decrease': 20,
        'dom-decrease': 15,
    };

    const threshold = thresholds[trendType as keyof typeof thresholds];
    if (!threshold) {
        return { isValid: false, error: 'Invalid trend type' };
    }

    if (Math.abs(changePercent) < threshold) {
        return { isValid: false, error: `Change percentage must exceed ${threshold}% for ${trendType}` };
    }

    return { isValid: true };
}

// ==================== Individual Validation Functions ====================

/**
 * Validates a ZIP code format
 */
export function validateZipCode(zipCode: string): boolean {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zipCode);
}

/**
 * Validates a city name
 */
export function validateCityName(cityName: string): boolean {
    if (!cityName || cityName.trim().length === 0) {
        return false;
    }

    // City names should be 2-50 characters, letters, spaces, hyphens, apostrophes
    const cityRegex = /^[a-zA-Z\s\-']{2,50}$/;
    return cityRegex.test(cityName.trim());
}

/**
 * Validates a polygon coordinates array
 */
export function validatePolygon(coordinates: Array<{ lat: number; lng: number }>): boolean {
    if (!Array.isArray(coordinates) || coordinates.length < 3) {
        return false;
    }

    return coordinates.every(coord =>
        typeof coord.lat === 'number' &&
        typeof coord.lng === 'number' &&
        coord.lat >= -90 && coord.lat <= 90 &&
        coord.lng >= -180 && coord.lng <= 180
    );
}

// ==================== Export Schemas for External Use ====================

export {
    alertSchema,
    alertSettingsSchema,
    targetAreaSchema,
    lifeEventSchema,
    prospectSchema,
    neighborhoodProfileSchema,
    zipCodeSchema,
};