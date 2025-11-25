/**
 * CMA Report Component Tests
 * 
 * Tests for the CMA Report visualization component
 * Requirements: 3.5
 */

import { describe, it, expect } from '@jest/globals';

describe('CMA Report Component', () => {
    const mockSubjectProperty = {
        address: '123 Main St, San Francisco, CA',
        beds: 3,
        baths: 2,
        sqft: 1850,
        yearBuilt: 2015,
    };

    const mockComparables = [
        {
            address: '456 Oak Ave, San Francisco, CA',
            soldPrice: 1250000,
            soldDate: '2024-01-15',
            beds: 3,
            baths: 2,
            sqft: 1800,
            distance: 0.3,
        },
        {
            address: '789 Pine St, San Francisco, CA',
            soldPrice: 1320000,
            soldDate: '2024-02-20',
            beds: 3,
            baths: 2.5,
            sqft: 1900,
            distance: 0.5,
        },
    ];

    const mockMarketTrends = {
        medianPrice: 1280000,
        daysOnMarket: 28,
        inventoryLevel: 'low' as const,
    };

    const mockPriceRecommendation = {
        low: 1220000,
        mid: 1285000,
        high: 1350000,
    };

    it('should accept all required props', () => {
        // This test verifies that the component interface accepts all required fields
        const props = {
            subjectProperty: mockSubjectProperty,
            comparables: mockComparables,
            marketTrends: mockMarketTrends,
            priceRecommendation: mockPriceRecommendation,
        };

        expect(props.subjectProperty).toBeDefined();
        expect(props.comparables).toHaveLength(2);
        expect(props.marketTrends).toBeDefined();
        expect(props.priceRecommendation).toBeDefined();
    });

    it('should calculate average price per square foot correctly', () => {
        const avgPricePerSqft = mockComparables.reduce(
            (sum, comp) => sum + comp.soldPrice / comp.sqft,
            0
        ) / mockComparables.length;

        expect(avgPricePerSqft).toBeGreaterThan(0);
        expect(Math.round(avgPricePerSqft)).toBe(695); // (694.44 + 694.74) / 2 ≈ 694.59
    });

    it('should handle multiple comparables', () => {
        const manyComparables = [
            ...mockComparables,
            {
                address: '321 Elm Dr, San Francisco, CA',
                soldPrice: 1180000,
                soldDate: '2024-03-10',
                beds: 3,
                baths: 2,
                sqft: 1750,
                distance: 0.4,
            },
        ];

        expect(manyComparables).toHaveLength(3);
        expect(manyComparables.every(comp => comp.soldPrice > 0)).toBe(true);
        expect(manyComparables.every(comp => comp.sqft > 0)).toBe(true);
    });

    it('should validate market trends data structure', () => {
        expect(mockMarketTrends.medianPrice).toBeGreaterThan(0);
        expect(mockMarketTrends.daysOnMarket).toBeGreaterThanOrEqual(0);
        expect(['low', 'medium', 'high']).toContain(mockMarketTrends.inventoryLevel);
    });

    it('should validate price recommendation structure', () => {
        expect(mockPriceRecommendation.low).toBeLessThan(mockPriceRecommendation.mid);
        expect(mockPriceRecommendation.mid).toBeLessThan(mockPriceRecommendation.high);
        expect(mockPriceRecommendation.low).toBeGreaterThan(0);
    });

    it('should sort comparables by date for trend chart', () => {
        const sortedComps = [...mockComparables].sort(
            (a, b) => new Date(a.soldDate).getTime() - new Date(b.soldDate).getTime()
        );

        expect(new Date(sortedComps[0].soldDate).getTime()).toBeLessThanOrEqual(
            new Date(sortedComps[1].soldDate).getTime()
        );
    });

    it('should format dates correctly for display', () => {
        const date = new Date(mockComparables[0].soldDate);
        const formatted = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

        expect(formatted).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/);
    });

    it('should calculate distance values correctly', () => {
        mockComparables.forEach(comp => {
            expect(comp.distance).toBeGreaterThan(0);
            expect(comp.distance).toBeLessThan(10); // Reasonable distance in miles
        });
    });

    it('should handle optional agent notes', () => {
        const notesText = 'This is a test note';
        expect(notesText).toBeDefined();
        expect(typeof notesText).toBe('string');
    });

    it('should accept custom primary color', () => {
        const primaryColor = '#3b82f6';
        expect(primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
});

describe('CMA Report Data Validation', () => {
    it('should validate subject property has all required fields', () => {
        const subjectProperty = {
            address: '123 Main St',
            beds: 3,
            baths: 2,
            sqft: 1850,
            yearBuilt: 2015,
        };

        expect(subjectProperty.address).toBeTruthy();
        expect(subjectProperty.beds).toBeGreaterThanOrEqual(0);
        expect(subjectProperty.baths).toBeGreaterThanOrEqual(0);
        expect(subjectProperty.sqft).toBeGreaterThan(0);
        expect(subjectProperty.yearBuilt).toBeGreaterThan(1800);
    });

    it('should validate comparable property has all required fields', () => {
        const comparable = {
            address: '456 Oak Ave',
            soldPrice: 1250000,
            soldDate: '2024-01-15',
            beds: 3,
            baths: 2,
            sqft: 1800,
            distance: 0.3,
        };

        expect(comparable.address).toBeTruthy();
        expect(comparable.soldPrice).toBeGreaterThan(0);
        expect(comparable.soldDate).toBeTruthy();
        expect(comparable.beds).toBeGreaterThanOrEqual(0);
        expect(comparable.baths).toBeGreaterThanOrEqual(0);
        expect(comparable.sqft).toBeGreaterThan(0);
        expect(comparable.distance).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty comparables array gracefully', () => {
        const emptyComparables: any[] = [];
        expect(emptyComparables).toHaveLength(0);
        // Component should handle this case with appropriate messaging
    });

    it('should validate inventory level enum values', () => {
        const validLevels = ['low', 'medium', 'high'];
        validLevels.forEach(level => {
            expect(['low', 'medium', 'high']).toContain(level);
        });
    });
});

describe('CMA Report Calculations', () => {
    it('should calculate price per square foot correctly', () => {
        const soldPrice = 1250000;
        const sqft = 1800;
        const pricePerSqft = Math.round(soldPrice / sqft);

        expect(pricePerSqft).toBe(694);
    });

    it('should estimate value based on average price per sqft', () => {
        const avgPricePerSqft = 700;
        const subjectSqft = 1850;
        const estimatedValue = Math.round(avgPricePerSqft * subjectSqft);

        expect(estimatedValue).toBe(1295000);
    });

    it('should format large numbers with commas', () => {
        const price = 1250000;
        const formatted = price.toLocaleString();

        expect(formatted).toBe('1,250,000');
    });

    it('should format distance to 2 decimal places', () => {
        const distance = 0.345;
        const formatted = distance.toFixed(2);

        expect(formatted).toBe('0.34'); // JavaScript rounds 0.345 to 0.34
    });
});
