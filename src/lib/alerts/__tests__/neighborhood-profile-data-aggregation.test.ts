/**
 * Simple Tests for Neighborhood Profile Data Aggregation
 * 
 * Tests the basic functionality of data fetching functions.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
    fetchMarketData,
    fetchDemographicsData,
    fetchSchoolsData,
    fetchAmenitiesData,
    fetchWalkabilityData,
    aggregateNeighborhoodData,
    clearCache,
    getCacheStats
} from '../neighborhood-profile-data-aggregation';

describe('Neighborhood Profile Data Aggregation - Simple Tests', () => {
    beforeEach(() => {
        clearCache();
    });

    describe('fetchMarketData', () => {
        it('should return valid market data structure', async () => {
            const result = await fetchMarketData('Test Location');

            expect(typeof result.medianSalePrice).toBe('number');
            expect(typeof result.avgDaysOnMarket).toBe('number');
            expect(typeof result.salesVolume).toBe('number');
            expect(typeof result.inventoryLevel).toBe('number');
            expect(Array.isArray(result.priceHistory)).toBe(true);
            expect(result.medianSalePrice).toBeGreaterThanOrEqual(0);
            expect(result.avgDaysOnMarket).toBeGreaterThanOrEqual(0);
        });

        it('should use cached data on subsequent calls', async () => {
            const result1 = await fetchMarketData('Cache Test Location');
            const result2 = await fetchMarketData('Cache Test Location');

            expect(result1).toEqual(result2);
        });
    });

    describe('fetchDemographicsData', () => {
        it('should return valid demographics data structure', async () => {
            const result = await fetchDemographicsData('Test Location');

            expect(typeof result.population).toBe('number');
            expect(typeof result.medianHouseholdIncome).toBe('number');
            expect(typeof result.ageDistribution).toBe('object');
            expect(typeof result.householdComposition).toBe('object');
            expect(result.population).toBeGreaterThanOrEqual(0);
            expect(result.medianHouseholdIncome).toBeGreaterThanOrEqual(0);
        });
    });

    describe('fetchSchoolsData', () => {
        it('should return valid schools data structure', async () => {
            const result = await fetchSchoolsData('Test Location');

            expect(Array.isArray(result)).toBe(true);

            if (result.length > 0) {
                const school = result[0];
                expect(typeof school.name).toBe('string');
                expect(['public', 'private']).toContain(school.type);
                expect(typeof school.rating).toBe('number');
                expect(school.rating).toBeGreaterThanOrEqual(1);
                expect(school.rating).toBeLessThanOrEqual(10);
                expect(typeof school.distance).toBe('number');
                expect(school.distance).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('fetchAmenitiesData', () => {
        it('should return valid amenities data structure', async () => {
            const result = await fetchAmenitiesData('Test Location');

            expect(typeof result).toBe('object');
            expect(Array.isArray(result.restaurants)).toBe(true);
            expect(Array.isArray(result.shopping)).toBe(true);
            expect(Array.isArray(result.parks)).toBe(true);
            expect(Array.isArray(result.healthcare)).toBe(true);
            expect(Array.isArray(result.entertainment)).toBe(true);
        });

        it('should filter amenities to within 1 mile', async () => {
            const result = await fetchAmenitiesData('Test Location');

            // Check that all amenities are within 1 mile
            const allAmenities = [
                ...result.restaurants,
                ...result.shopping,
                ...result.parks,
                ...result.healthcare,
                ...result.entertainment
            ];

            allAmenities.forEach(amenity => {
                expect(amenity.distance).toBeLessThanOrEqual(1.0);
            });
        });
    });

    describe('fetchWalkabilityData', () => {
        it('should return valid walkability data structure', async () => {
            const result = await fetchWalkabilityData('Test Location');

            expect(typeof result.score).toBe('number');
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
            expect(typeof result.description).toBe('string');
            expect(typeof result.factors).toBe('object');
        });
    });

    describe('aggregateNeighborhoodData', () => {
        it('should aggregate all data sources successfully', async () => {
            const result = await aggregateNeighborhoodData('Test Location');

            // Verify all sections are present
            expect(result.marketData).toBeDefined();
            expect(result.demographics).toBeDefined();
            expect(result.schools).toBeDefined();
            expect(result.amenities).toBeDefined();
            expect(result.walkability).toBeDefined();

            // Verify market data structure
            expect(typeof result.marketData.medianSalePrice).toBe('number');
            expect(Array.isArray(result.marketData.priceHistory)).toBe(true);

            // Verify demographics structure
            expect(typeof result.demographics.population).toBe('number');

            // Verify schools structure
            expect(Array.isArray(result.schools)).toBe(true);

            // Verify amenities structure
            expect(Array.isArray(result.amenities.restaurants)).toBe(true);

            // Verify walkability structure
            expect(typeof result.walkability.score).toBe('number');
            expect(result.walkability.score).toBeGreaterThanOrEqual(0);
            expect(result.walkability.score).toBeLessThanOrEqual(100);
        });
    });

    describe('Cache Management', () => {
        it('should clear cache successfully', () => {
            clearCache();
            const stats = getCacheStats();
            expect(stats.size).toBe(0);
        });

        it('should provide cache statistics', () => {
            const stats = getCacheStats();
            expect(typeof stats.size).toBe('number');
            expect(Array.isArray(stats.entries)).toBe(true);
        });
    });
});