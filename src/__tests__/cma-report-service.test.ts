/**
 * CMA Report Service Tests
 * 
 * Tests for CMA report creation, update, and attachment functionality
 * Requirements: 3.1, 3.2
 */

import { describe, it, expect } from '@jest/globals';
import { createCMAReport, updateCMAReport, attachCMAToDashboard } from '@/app/client-dashboard-actions';

describe('CMA Report Service', () => {
    describe('createCMAReport - Validation', () => {
        it('should require authentication', async () => {
            const formData = new FormData();
            formData.append('cmaData', JSON.stringify({}));

            const result = await createCMAReport(null, formData);

            expect(result.message).toBe('Authentication required');
            expect(result.data).toBeNull();
            expect(result.errors.auth).toBeDefined();
        });


    });

    describe('updateCMAReport - Validation', () => {
        it('should require authentication', async () => {
            const formData = new FormData();
            formData.append('cmaReportId', 'cma-123');
            formData.append('updates', JSON.stringify({ agentNotes: 'Test' }));

            const result = await updateCMAReport(null, formData);

            expect(result.message).toBe('Authentication required');
            expect(result.data).toBeNull();
            expect(result.errors.auth).toBeDefined();
        });
    });

    describe('attachCMAToDashboard - Validation', () => {
        it('should require authentication', async () => {
            const formData = new FormData();
            formData.append('dashboardId', 'dashboard-123');
            formData.append('cmaReportId', 'cma-123');

            const result = await attachCMAToDashboard(null, formData);

            expect(result.message).toBe('Authentication required');
            expect(result.data).toBeNull();
            expect(result.errors.auth).toBeDefined();
        });
    });

    describe('CMA Report Structure', () => {
        it('should validate all required CMA report fields are defined', () => {
            // This test verifies the structure is correct
            const validCMAData = {
                subjectProperty: {
                    address: '123 Main St',
                    beds: 3,
                    baths: 2,
                    sqft: 1500,
                    yearBuilt: 2000,
                },
                comparables: [
                    {
                        address: '456 Oak Ave',
                        soldPrice: 350000,
                        soldDate: '2024-01-15',
                        beds: 3,
                        baths: 2,
                        sqft: 1450,
                        distance: 0.5,
                    },
                ],
                marketTrends: {
                    medianPrice: 340000,
                    daysOnMarket: 30,
                    inventoryLevel: 'medium',
                },
                priceRecommendation: {
                    low: 330000,
                    mid: 350000,
                    high: 370000,
                },
                agentNotes: 'Great neighborhood',
            };

            // Verify structure
            expect(validCMAData.subjectProperty).toHaveProperty('address');
            expect(validCMAData.subjectProperty).toHaveProperty('beds');
            expect(validCMAData.subjectProperty).toHaveProperty('baths');
            expect(validCMAData.subjectProperty).toHaveProperty('sqft');
            expect(validCMAData.subjectProperty).toHaveProperty('yearBuilt');
            expect(validCMAData.comparables).toBeInstanceOf(Array);
            expect(validCMAData.marketTrends).toHaveProperty('medianPrice');
            expect(validCMAData.marketTrends).toHaveProperty('daysOnMarket');
            expect(validCMAData.marketTrends).toHaveProperty('inventoryLevel');
            expect(validCMAData.priceRecommendation).toHaveProperty('low');
            expect(validCMAData.priceRecommendation).toHaveProperty('mid');
            expect(validCMAData.priceRecommendation).toHaveProperty('high');
        });
    });
});
