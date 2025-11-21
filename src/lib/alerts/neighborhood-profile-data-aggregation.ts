/**
 * Neighborhood Profile Data Aggregation
 * 
 * Implements data fetching functions for each external API required for
 * neighborhood profile generation, with error handling, fallback logic,
 * data validation, and caching for slow-changing data.
 * 
 * Requirements: 5.1-5.6
 */

import { retryExternalAPICall } from '@/aws/bedrock/retry-utils';
import type {
    NeighborhoodProfile,
    DemographicsData,
    SchoolData,
    AmenityData,
    WalkabilityData
} from './types';

// Simple logger interface for this module
const logger = {
    debug: (message: string, context?: any) => console.debug(`[NeighborhoodProfileDataAggregation] ${message}`, context),
    info: (message: string, context?: any) => console.info(`[NeighborhoodProfileDataAggregation] ${message}`, context),
    warn: (message: string, context?: any) => console.warn(`[NeighborhoodProfileDataAggregation] ${message}`, context),
    error: (message: string, context?: any) => console.error(`[NeighborhoodProfileDataAggregation] ${message}`, context)
};

// ==================== Configuration ====================

interface DataAggregationConfig {
    cacheExpiryMs: number;
    requestTimeoutMs: number;
    maxRetries: number;
}

const DEFAULT_CONFIG: DataAggregationConfig = {
    cacheExpiryMs: 24 * 60 * 60 * 1000, // 24 hours for slow-changing data
    requestTimeoutMs: 10000, // 10 seconds
    maxRetries: 2
};

// ==================== Cache Implementation ====================

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

class DataCache {
    private cache = new Map<string, CacheEntry<any>>();

    set<T>(key: string, data: T, expiryMs: number = DEFAULT_CONFIG.cacheExpiryMs): void {
        const now = Date.now();
        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt: now + expiryMs
        });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

const dataCache = new DataCache();

// ==================== Data Validation ====================

function validateMarketData(data: any): boolean {
    return (
        typeof data === 'object' &&
        typeof data.medianSalePrice === 'number' &&
        data.medianSalePrice >= 0 &&
        typeof data.avgDaysOnMarket === 'number' &&
        data.avgDaysOnMarket >= 0 &&
        typeof data.salesVolume === 'number' &&
        data.salesVolume >= 0 &&
        typeof data.inventoryLevel === 'number' &&
        data.inventoryLevel >= 0 &&
        Array.isArray(data.priceHistory)
    );
}

function validateDemographicsData(data: any): boolean {
    return (
        typeof data === 'object' &&
        typeof data.population === 'number' &&
        data.population >= 0 &&
        typeof data.medianHouseholdIncome === 'number' &&
        data.medianHouseholdIncome >= 0 &&
        typeof data.ageDistribution === 'object' &&
        typeof data.householdComposition === 'object'
    );
}

function validateSchoolData(data: any): boolean {
    return (
        Array.isArray(data) &&
        data.every(school =>
            typeof school === 'object' &&
            typeof school.name === 'string' &&
            ['public', 'private'].includes(school.type) &&
            typeof school.rating === 'number' &&
            school.rating >= 1 &&
            school.rating <= 10 &&
            typeof school.distance === 'number' &&
            school.distance >= 0
        )
    );
}

function validateAmenitiesData(data: any): boolean {
    return (
        typeof data === 'object' &&
        Array.isArray(data.restaurants) &&
        Array.isArray(data.shopping) &&
        Array.isArray(data.parks) &&
        Array.isArray(data.healthcare) &&
        Array.isArray(data.entertainment)
    );
}

function validateWalkabilityData(data: any): boolean {
    return (
        typeof data === 'object' &&
        typeof data.score === 'number' &&
        data.score >= 0 &&
        data.score <= 100
    );
}

// ==================== Market Data API ====================

interface MarketDataResponse {
    medianSalePrice: number;
    avgDaysOnMarket: number;
    salesVolume: number;
    inventoryLevel: number;
    priceHistory: Array<{
        month: string;
        medianPrice: number;
    }>;
}

/**
 * Fetches market data for a specific location
 * Uses MLS data and market statistics APIs
 */
export async function fetchMarketData(location: string): Promise<MarketDataResponse> {
    const cacheKey = `market:${location}`;
    const cached = dataCache.get<MarketDataResponse>(cacheKey);

    if (cached) {
        logger.debug('Using cached market data', { location });
        return cached;
    }

    logger.info('Fetching market data', { location });

    try {
        const data = await retryExternalAPICall(
            async () => {
                // TODO: Replace with actual MLS/market data API call
                // For now, return mock data that matches the expected structure
                const mockData: MarketDataResponse = {
                    medianSalePrice: 450000 + Math.random() * 200000,
                    avgDaysOnMarket: 25 + Math.random() * 30,
                    salesVolume: 50 + Math.random() * 100,
                    inventoryLevel: 100 + Math.random() * 200,
                    priceHistory: Array.from({ length: 12 }, (_, i) => ({
                        month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
                        medianPrice: 400000 + Math.random() * 300000
                    }))
                };

                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 500));
                return mockData;
            },
            `Market Data API: ${location}`,
            logger
        );

        if (!validateMarketData(data)) {
            throw new Error('Invalid market data structure received');
        }

        dataCache.set(cacheKey, data);
        logger.info('Market data fetched successfully', { location });
        return data;

    } catch (error) {
        logger.error('Failed to fetch market data', { location, error });

        // Return fallback data
        const fallbackData: MarketDataResponse = {
            medianSalePrice: 0,
            avgDaysOnMarket: 0,
            salesVolume: 0,
            inventoryLevel: 0,
            priceHistory: []
        };

        return fallbackData;
    }
}

// ==================== Demographics API ====================

interface DemographicsResponse {
    population: number;
    medianHouseholdIncome: number;
    ageDistribution: {
        under18: number;
        age18to34: number;
        age35to54: number;
        age55to74: number;
        over75: number;
    };
    householdComposition: {
        familyHouseholds: number;
        nonFamilyHouseholds: number;
        averageHouseholdSize: number;
    };
}

/**
 * Fetches demographic data for a specific location
 * Uses US Census Bureau API and other demographic data sources
 */
export async function fetchDemographicsData(location: string): Promise<DemographicsResponse> {
    const cacheKey = `demographics:${location}`;
    const cached = dataCache.get<DemographicsResponse>(cacheKey);

    if (cached) {
        logger.debug('Using cached demographics data', { location });
        return cached;
    }

    logger.info('Fetching demographics data', { location });

    try {
        const data = await retryExternalAPICall(
            async () => {
                // TODO: Replace with actual US Census Bureau API call
                // For now, return mock data that matches the expected structure
                const mockData: DemographicsResponse = {
                    population: 10000 + Math.random() * 50000,
                    medianHouseholdIncome: 50000 + Math.random() * 100000,
                    ageDistribution: {
                        under18: 15 + Math.random() * 10,
                        age18to34: 20 + Math.random() * 15,
                        age35to54: 25 + Math.random() * 15,
                        age55to74: 20 + Math.random() * 15,
                        over75: 10 + Math.random() * 10
                    },
                    householdComposition: {
                        familyHouseholds: 60 + Math.random() * 20,
                        nonFamilyHouseholds: 20 + Math.random() * 20,
                        averageHouseholdSize: 2.2 + Math.random() * 0.8
                    }
                };

                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 800));
                return mockData;
            },
            `Demographics API: ${location}`,
            logger
        );

        if (!validateDemographicsData(data)) {
            throw new Error('Invalid demographics data structure received');
        }

        dataCache.set(cacheKey, data);
        logger.info('Demographics data fetched successfully', { location });
        return data;

    } catch (error) {
        logger.error('Failed to fetch demographics data', { location, error });

        // Return fallback data
        const fallbackData: DemographicsResponse = {
            population: 0,
            medianHouseholdIncome: 0,
            ageDistribution: {
                under18: 0,
                age18to34: 0,
                age35to54: 0,
                age55to74: 0,
                over75: 0
            },
            householdComposition: {
                familyHouseholds: 0,
                nonFamilyHouseholds: 0,
                averageHouseholdSize: 0
            }
        };

        return fallbackData;
    }
}

// ==================== Schools API ====================

interface SchoolResponse {
    name: string;
    type: "public" | "private";
    grades: string;
    rating: number; // 1-10
    distance: number; // miles
}

/**
 * Fetches school data for a specific location
 * Uses GreatSchools API or similar education data sources
 */
export async function fetchSchoolsData(location: string): Promise<SchoolResponse[]> {
    const cacheKey = `schools:${location}`;
    const cached = dataCache.get<SchoolResponse[]>(cacheKey);

    if (cached) {
        logger.debug('Using cached schools data', { location });
        return cached;
    }

    logger.info('Fetching schools data', { location });

    try {
        const data = await retryExternalAPICall(
            async () => {
                // TODO: Replace with actual GreatSchools API call
                // For now, return mock data that matches the expected structure
                const mockData: SchoolResponse[] = [
                    {
                        name: "Lincoln Elementary School",
                        type: "public",
                        grades: "K-5",
                        rating: Math.floor(Math.random() * 4) + 6, // 6-10
                        distance: Math.random() * 2
                    },
                    {
                        name: "Washington Middle School",
                        type: "public",
                        grades: "6-8",
                        rating: Math.floor(Math.random() * 4) + 6,
                        distance: Math.random() * 3
                    },
                    {
                        name: "Roosevelt High School",
                        type: "public",
                        grades: "9-12",
                        rating: Math.floor(Math.random() * 4) + 6,
                        distance: Math.random() * 5
                    },
                    {
                        name: "St. Mary's Academy",
                        type: "private",
                        grades: "K-12",
                        rating: Math.floor(Math.random() * 3) + 7, // 7-10
                        distance: Math.random() * 4
                    }
                ];

                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 600));
                return mockData;
            },
            `Schools API: ${location}`,
            logger
        );

        if (!validateSchoolData(data)) {
            throw new Error('Invalid schools data structure received');
        }

        dataCache.set(cacheKey, data);
        logger.info('Schools data fetched successfully', { location, count: data.length });
        return data;

    } catch (error) {
        logger.error('Failed to fetch schools data', { location, error });

        // Return empty array as fallback
        return [];
    }
}

// ==================== Amenities API ====================

interface AmenitiesResponse {
    restaurants: Array<{ name: string; category: string; distance: number }>;
    shopping: Array<{ name: string; category: string; distance: number }>;
    parks: Array<{ name: string; distance: number }>;
    healthcare: Array<{ name: string; type: string; distance: number }>;
    entertainment: Array<{ name: string; category: string; distance: number }>;
}

/**
 * Fetches amenities data for a specific location
 * Uses Google Places API to find nearby businesses and services
 */
export async function fetchAmenitiesData(location: string): Promise<AmenitiesResponse> {
    const cacheKey = `amenities:${location}`;
    const cached = dataCache.get<AmenitiesResponse>(cacheKey);

    if (cached) {
        logger.debug('Using cached amenities data', { location });
        return cached;
    }

    logger.info('Fetching amenities data', { location });

    try {
        const data = await retryExternalAPICall(
            async () => {
                // TODO: Replace with actual Google Places API calls
                // For now, return mock data that matches the expected structure
                const mockData: AmenitiesResponse = {
                    restaurants: [
                        { name: "The Local Bistro", category: "American", distance: 0.3 },
                        { name: "Sakura Sushi", category: "Japanese", distance: 0.5 },
                        { name: "Mama's Pizza", category: "Italian", distance: 0.7 },
                        { name: "Coffee Corner", category: "Cafe", distance: 0.2 }
                    ],
                    shopping: [
                        { name: "Main Street Market", category: "Grocery", distance: 0.4 },
                        { name: "Fashion Plaza", category: "Clothing", distance: 0.8 },
                        { name: "Home Depot", category: "Hardware", distance: 1.2 }
                    ],
                    parks: [
                        { name: "Central Park", distance: 0.6 },
                        { name: "Riverside Trail", distance: 0.9 },
                        { name: "Community Garden", distance: 0.3 }
                    ],
                    healthcare: [
                        { name: "Family Medical Center", type: "Primary Care", distance: 0.5 },
                        { name: "Urgent Care Plus", type: "Urgent Care", distance: 0.8 },
                        { name: "City Hospital", type: "Hospital", distance: 1.5 }
                    ],
                    entertainment: [
                        { name: "Regal Cinema", category: "Movie Theater", distance: 0.7 },
                        { name: "The Comedy Club", category: "Entertainment", distance: 0.9 },
                        { name: "Fitness First", category: "Gym", distance: 0.4 }
                    ]
                };

                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                return mockData;
            },
            `Amenities API: ${location}`,
            logger
        );

        if (!validateAmenitiesData(data)) {
            throw new Error('Invalid amenities data structure received');
        }

        // Filter amenities to within 1 mile as per requirements
        const filteredData: AmenitiesResponse = {
            restaurants: data.restaurants.filter(item => item.distance <= 1.0),
            shopping: data.shopping.filter(item => item.distance <= 1.0),
            parks: data.parks.filter(item => item.distance <= 1.0),
            healthcare: data.healthcare.filter(item => item.distance <= 1.0),
            entertainment: data.entertainment.filter(item => item.distance <= 1.0)
        };

        dataCache.set(cacheKey, filteredData);
        logger.info('Amenities data fetched successfully', { location });
        return filteredData;

    } catch (error) {
        logger.error('Failed to fetch amenities data', { location, error });

        // Return empty amenities as fallback
        const fallbackData: AmenitiesResponse = {
            restaurants: [],
            shopping: [],
            parks: [],
            healthcare: [],
            entertainment: []
        };

        return fallbackData;
    }
}

// ==================== Walkability API ====================

interface WalkabilityResponse {
    score: number; // 0-100
    description: string;
    factors: {
        walkability: number;
        transitScore: number;
        bikeScore: number;
    };
}

/**
 * Fetches walkability data for a specific location
 * Uses Walk Score API to calculate pedestrian-friendliness
 */
export async function fetchWalkabilityData(location: string): Promise<WalkabilityResponse> {
    const cacheKey = `walkability:${location}`;
    const cached = dataCache.get<WalkabilityResponse>(cacheKey);

    if (cached) {
        logger.debug('Using cached walkability data', { location });
        return cached;
    }

    logger.info('Fetching walkability data', { location });

    try {
        const data = await retryExternalAPICall(
            async () => {
                // TODO: Replace with actual Walk Score API call
                // For now, return mock data that matches the expected structure
                const score = Math.floor(Math.random() * 100);
                let description = "Car-Dependent";

                if (score >= 90) description = "Walker's Paradise";
                else if (score >= 70) description = "Very Walkable";
                else if (score >= 50) description = "Somewhat Walkable";
                else if (score >= 25) description = "Car-Dependent";
                else description = "Car-Dependent";

                const mockData: WalkabilityResponse = {
                    score,
                    description,
                    factors: {
                        walkability: score,
                        transitScore: Math.max(0, score - 20 + Math.random() * 40),
                        bikeScore: Math.max(0, score - 10 + Math.random() * 30)
                    }
                };

                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 400));
                return mockData;
            },
            `Walkability API: ${location}`,
            logger
        );

        if (!validateWalkabilityData(data)) {
            throw new Error('Invalid walkability data structure received');
        }

        dataCache.set(cacheKey, data);
        logger.info('Walkability data fetched successfully', { location, score: data.score });
        return data;

    } catch (error) {
        logger.error('Failed to fetch walkability data', { location, error });

        // Return fallback data
        const fallbackData: WalkabilityResponse = {
            score: 0,
            description: "Data unavailable",
            factors: {
                walkability: 0,
                transitScore: 0,
                bikeScore: 0
            }
        };

        return fallbackData;
    }
}

// ==================== Aggregate Data Function ====================

export interface AggregatedNeighborhoodData {
    marketData: MarketDataResponse;
    demographics: DemographicsResponse;
    schools: SchoolResponse[];
    amenities: AmenitiesResponse;
    walkability: WalkabilityResponse;
}

/**
 * Aggregates all neighborhood data from multiple APIs
 * Implements parallel fetching with error handling for each API
 */
export async function aggregateNeighborhoodData(location: string): Promise<AggregatedNeighborhoodData> {
    logger.info('Starting neighborhood data aggregation', { location });

    const startTime = Date.now();

    try {
        // Fetch all data in parallel for better performance
        const [marketData, demographics, schools, amenities, walkability] = await Promise.allSettled([
            fetchMarketData(location),
            fetchDemographicsData(location),
            fetchSchoolsData(location),
            fetchAmenitiesData(location),
            fetchWalkabilityData(location)
        ]);

        const result: AggregatedNeighborhoodData = {
            marketData: marketData.status === 'fulfilled' ? marketData.value : {
                medianSalePrice: 0,
                avgDaysOnMarket: 0,
                salesVolume: 0,
                inventoryLevel: 0,
                priceHistory: []
            },
            demographics: demographics.status === 'fulfilled' ? demographics.value : {
                population: 0,
                medianHouseholdIncome: 0,
                ageDistribution: {
                    under18: 0,
                    age18to34: 0,
                    age35to54: 0,
                    age55to74: 0,
                    over75: 0
                },
                householdComposition: {
                    familyHouseholds: 0,
                    nonFamilyHouseholds: 0,
                    averageHouseholdSize: 0
                }
            },
            schools: schools.status === 'fulfilled' ? schools.value : [],
            amenities: amenities.status === 'fulfilled' ? amenities.value : {
                restaurants: [],
                shopping: [],
                parks: [],
                healthcare: [],
                entertainment: []
            },
            walkability: walkability.status === 'fulfilled' ? walkability.value : {
                score: 0,
                description: "Data unavailable",
                factors: {
                    walkability: 0,
                    transitScore: 0,
                    bikeScore: 0
                }
            }
        };

        const duration = Date.now() - startTime;
        logger.info('Neighborhood data aggregation completed', {
            location,
            duration,
            successfulAPIs: [marketData, demographics, schools, amenities, walkability]
                .filter(result => result.status === 'fulfilled').length
        });

        return result;

    } catch (error) {
        logger.error('Failed to aggregate neighborhood data', { location, error });
        throw new Error(`Failed to aggregate neighborhood data for ${location}: ${error}`);
    }
}

// ==================== Cache Management ====================

/**
 * Clears all cached data
 */
export function clearCache(): void {
    dataCache.clear();
    logger.info('Data cache cleared');
}

/**
 * Gets cache statistics
 */
export function getCacheStats(): { size: number; entries: string[] } {
    const entries: string[] = [];
    // Note: Map doesn't expose keys directly in a simple way, so we'll just return size
    return {
        size: dataCache.size(),
        entries
    };
}

/**
 * Preloads data for a location (useful for warming cache)
 */
export async function preloadLocationData(location: string): Promise<void> {
    logger.info('Preloading location data', { location });

    try {
        await aggregateNeighborhoodData(location);
        logger.info('Location data preloaded successfully', { location });
    } catch (error) {
        logger.warn('Failed to preload location data', { location, error });
    }
}