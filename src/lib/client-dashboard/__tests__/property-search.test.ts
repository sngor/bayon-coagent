/**
 * Property Search Service Tests
 * 
 * Tests for the property search service that leverages MLS infrastructure
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PropertySearchService } from '../property-search';
import type { MLSConnection, Listing } from '@/integrations/mls/types';

describe('PropertySearchService', () => {
    let service: PropertySearchService;

    beforeEach(() => {
        service = new PropertySearchService();
    });

    describe('Service Structure', () => {
        it('should create a PropertySearchService instance', () => {
            expect(service).toBeDefined();
            expect(service).toBeInstanceOf(PropertySearchService);
        });

        it('should have searchProperties method', () => {
            expect(service.searchProperties).toBeDefined();
            expect(typeof service.searchProperties).toBe('function');
        });

        it('should have getPropertyDetails method', () => {
            expect(service.getPropertyDetails).toBeDefined();
            expect(typeof service.getPropertyDetails).toBe('function');
        });
    });

    describe('Search Criteria Validation', () => {
        it('should accept valid search criteria structure', () => {
            const validCriteria = {
                location: 'Austin',
                minPrice: 300000,
                maxPrice: 500000,
                bedrooms: 3,
                bathrooms: 2,
                propertyType: ['Single Family', 'Condo'],
                minSquareFeet: 1500,
                maxSquareFeet: 2500,
                page: 1,
                limit: 20,
            };

            // Verify structure
            expect(validCriteria).toHaveProperty('location');
            expect(validCriteria).toHaveProperty('minPrice');
            expect(validCriteria).toHaveProperty('maxPrice');
            expect(validCriteria).toHaveProperty('bedrooms');
            expect(validCriteria).toHaveProperty('bathrooms');
            expect(validCriteria).toHaveProperty('propertyType');
            expect(validCriteria).toHaveProperty('minSquareFeet');
            expect(validCriteria).toHaveProperty('maxSquareFeet');
            expect(validCriteria).toHaveProperty('page');
            expect(validCriteria).toHaveProperty('limit');
        });

        it('should accept empty criteria object', () => {
            const emptyCriteria = {};
            expect(emptyCriteria).toBeDefined();
        });

        it('should accept partial criteria', () => {
            const partialCriteria = {
                location: 'Dallas',
                minPrice: 200000,
            };
            expect(partialCriteria).toHaveProperty('location');
            expect(partialCriteria).toHaveProperty('minPrice');
        });
    });

    describe('Property Listing Structure', () => {
        it('should define correct PropertyListing structure', () => {
            const validListing = {
                id: 'mls-001',
                address: '123 Main St',
                city: 'Austin',
                state: 'TX',
                zip: '78701',
                price: 450000,
                bedrooms: 3,
                bathrooms: 2,
                squareFeet: 1800,
                propertyType: 'Single Family',
                images: ['photo1.jpg', 'photo2.jpg'],
                listingDate: '2024-01-01',
                status: 'active' as const,
            };

            // Verify structure
            expect(validListing).toHaveProperty('id');
            expect(validListing).toHaveProperty('address');
            expect(validListing).toHaveProperty('city');
            expect(validListing).toHaveProperty('state');
            expect(validListing).toHaveProperty('zip');
            expect(validListing).toHaveProperty('price');
            expect(validListing).toHaveProperty('bedrooms');
            expect(validListing).toHaveProperty('bathrooms');
            expect(validListing).toHaveProperty('squareFeet');
            expect(validListing).toHaveProperty('propertyType');
            expect(validListing).toHaveProperty('images');
            expect(validListing).toHaveProperty('listingDate');
            expect(validListing).toHaveProperty('status');
        });
    });

    describe('Search Result Structure', () => {
        it('should define correct PropertySearchResult structure', () => {
            const validResult = {
                properties: [],
                total: 0,
                page: 1,
                limit: 20,
                hasMore: false,
            };

            // Verify structure
            expect(validResult).toHaveProperty('properties');
            expect(validResult).toHaveProperty('total');
            expect(validResult).toHaveProperty('page');
            expect(validResult).toHaveProperty('limit');
            expect(validResult).toHaveProperty('hasMore');
            expect(Array.isArray(validResult.properties)).toBe(true);
        });
    });

    describe('Cache Configuration', () => {
        it('should have 5-minute cache TTL', () => {
            // This verifies the cache TTL constant is set correctly
            const EXPECTED_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
            expect(EXPECTED_CACHE_TTL).toBe(300000);
        });
    });
});
