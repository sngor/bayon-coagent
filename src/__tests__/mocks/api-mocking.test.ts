/**
 * Tests for API Mocking Infrastructure
 * 
 * Verifies that MSW is properly set up and all external API mocks
 * are working correctly for the Market Intelligence Alerts feature.
 */

import { describe, it, expect } from '@jest/globals';

describe('API Mocking Infrastructure', () => {
    describe('Public Records API Mocking', () => {
        it('should mock life events API successfully', async () => {
            const response = await fetch('https://api.publicrecords.example.com/life-events?location=Austin&eventTypes=marriage');
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('events');
            expect(data).toHaveProperty('total');
            expect(data).toHaveProperty('location');
            expect(Array.isArray(data.events)).toBe(true);
        });

        it('should return filtered marriage records', async () => {
            const response = await fetch('https://api.publicrecords.example.com/marriage-records?location=Austin');
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('records');
            expect(Array.isArray(data.records)).toBe(true);

            // All records should be marriage events
            data.records.forEach((record: any) => {
                expect(record.eventType).toBe('marriage');
            });
        });

        it('should handle API errors gracefully', async () => {
            const response = await fetch('https://api.publicrecords.example.com/error-test');
            expect(response.status).toBe(503);

            const data = await response.json();
            expect(data).toHaveProperty('error');
        });
    });

    describe('MLS API Mocking', () => {
        it('should mock MLS listings API successfully', async () => {
            const response = await fetch('https://api.mls.example.com/listings?location=Austin');
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('listings');
            expect(data).toHaveProperty('total');
            expect(Array.isArray(data.listings)).toBe(true);
        });

        it('should return price history for listings', async () => {
            const response = await fetch('https://api.mls.example.com/listings/MLS001/price-history');
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('mlsNumber', 'MLS001');
            expect(data).toHaveProperty('priceHistory');
            expect(Array.isArray(data.priceHistory)).toBe(true);
        });

        it('should return market statistics', async () => {
            const response = await fetch('https://api.mls.example.com/market-stats?location=Austin&period=30');
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('statistics');
            expect(data.statistics).toHaveProperty('medianSalePrice');
            expect(data.statistics).toHaveProperty('avgDaysOnMarket');
            expect(data.statistics).toHaveProperty('salesVolume');
            expect(data.statistics).toHaveProperty('inventoryLevel');
        });

        it('should return recent listing changes', async () => {
            const response = await fetch('https://api.mls.example.com/recent-changes?location=Austin&hours=24');
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('changes');
            expect(Array.isArray(data.changes)).toBe(true);
        });
    });

    describe('Demographics API Mocking', () => {
        it('should mock US Census API successfully', async () => {
            const response = await fetch('https://api.census.gov/data/2021/acs/acs5?get=B01003_001E,B19013_001E&for=zip%20code%20tabulation%20area:78701');
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);
        });

        it('should mock alternative demographics API', async () => {
            const response = await fetch('https://api.demographics.example.com/v1/location/78701');
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('population');
            expect(data).toHaveProperty('medianHouseholdIncome');
            expect(data).toHaveProperty('ageDistribution');
            expect(data).toHaveProperty('householdComposition');
        });

        it('should handle batch demographics lookup', async () => {
            const response = await fetch('https://api.demographics.example.com/v1/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locations: ['78701', '75201', '77001']
                })
            });
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('results');
            expect(Array.isArray(data.results)).toBe(true);
            expect(data.results).toHaveLength(3);
        });
    });

    describe('Schools API Mocking', () => {
        it('should mock GreatSchools API successfully', async () => {
            const response = await fetch('https://api.greatschools.org/v1/schools/nearby?lat=30.2672&lon=-97.7431&radius=5');
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('schools');
            expect(Array.isArray(data.schools)).toBe(true);
            expect(data).toHaveProperty('total');
            expect(data).toHaveProperty('searchRadius', 5);
        });

        it('should return schools by ZIP code', async () => {
            const response = await fetch('https://api.greatschools.org/v1/schools/zip/78701');
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('schools');
            expect(data).toHaveProperty('zipCode', '78701');
            expect(Array.isArray(data.schools)).toBe(true);
        });

        it('should return school details by ID', async () => {
            const response = await fetch('https://api.greatschools.org/v1/schools/school-001');
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('school');
            expect(data.school).toHaveProperty('id', 'school-001');
            expect(data.school).toHaveProperty('name');
            expect(data.school).toHaveProperty('rating');
        });

        it('should return ratings summary for an area', async () => {
            const response = await fetch('https://api.greatschools.org/v1/ratings/summary?location=78701');
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('summary');
            expect(data.summary).toHaveProperty('totalSchools');
            expect(data.summary).toHaveProperty('averageRating');
            expect(data.summary).toHaveProperty('topRatedSchools');
        });
    });

    describe('Google Places API Mocking', () => {
        it('should mock nearby search successfully', async () => {
            const response = await fetch('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=30.2672,-97.7431&radius=1609&key=test-key');
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('results');
            expect(data).toHaveProperty('status', 'OK');
            expect(Array.isArray(data.results)).toBe(true);
        });

        it('should mock text search successfully', async () => {
            const response = await fetch('https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurant&key=test-key');
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('results');
            expect(data).toHaveProperty('status', 'OK');
            expect(Array.isArray(data.results)).toBe(true);
        });

        it('should mock place details successfully', async () => {
            const response = await fetch('https://maps.googleapis.com/maps/api/place/details/json?place_id=place-001&key=test-key');
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('result');
            expect(data).toHaveProperty('status', 'OK');
            expect(data.result).toHaveProperty('place_id', 'place-001');
        });

        it('should handle missing API key', async () => {
            const response = await fetch('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=30.2672,-97.7431');
            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data).toHaveProperty('status', 'REQUEST_DENIED');
            expect(data).toHaveProperty('error_message');
        });
    });

    describe('Walk Score API Mocking', () => {
        it('should mock Walk Score API successfully', async () => {
            const response = await fetch('https://api.walkscore.com/score?address=Austin%20TX&wsapikey=test-key');
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('status', 1);
            expect(data).toHaveProperty('walkscore');
            expect(data).toHaveProperty('description');
            expect(data.walkscore).toBeGreaterThanOrEqual(0);
            expect(data.walkscore).toBeLessThanOrEqual(100);
        });

        it('should return transit and bike scores when requested', async () => {
            const response = await fetch('https://api.walkscore.com/score?lat=30.2672&lon=-97.7431&transit=1&bike=1&wsapikey=test-key');
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('walkscore');
            expect(data).toHaveProperty('transit');
            expect(data).toHaveProperty('bike');
            expect(data.transit).toHaveProperty('score');
            expect(data.bike).toHaveProperty('score');
        });

        it('should handle batch requests', async () => {
            const response = await fetch('https://api.walkscore.com/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locations: [
                        { address: 'Austin, TX' },
                        { lat: 32.7767, lon: -96.7970 }
                    ],
                    wsapikey: 'test-key'
                })
            });
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('results');
            expect(Array.isArray(data.results)).toBe(true);
            expect(data.results).toHaveLength(2);
        });

        it('should mock alternative walkability API', async () => {
            const response = await fetch('https://api.walkability.example.com/v1/score?location=Austin,TX&includeFactors=true');
            expect(response.ok).toBe(true);

            const data = await response.json();
            expect(data).toHaveProperty('walkabilityScore');
            expect(data).toHaveProperty('transitScore');
            expect(data).toHaveProperty('bikeScore');
            expect(data).toHaveProperty('factors');
        });

        it('should handle missing API key', async () => {
            const response = await fetch('https://api.walkscore.com/score?address=Austin%20TX');
            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data).toHaveProperty('error');
        });
    });

    describe('Error Handling', () => {
        it('should handle service unavailable errors', async () => {
            const apis = [
                'https://api.publicrecords.example.com/error-test',
                'https://api.mls.example.com/error-test',
                'https://api.demographics.example.com/error-test',
                'https://api.greatschools.org/v1/error-test',
                'https://maps.googleapis.com/maps/api/place/error-test',
                'https://api.walkscore.com/error-test'
            ];

            for (const apiUrl of apis) {
                const response = await fetch(apiUrl);
                expect(response.status).toBe(503);

                const data = await response.json();
                expect(data).toHaveProperty('error');
            }
        });
    });

    describe('Data Quality', () => {
        it('should return consistent data structures', async () => {
            // Test that all APIs return data in expected formats
            const tests = [
                {
                    url: 'https://api.publicrecords.example.com/life-events?location=Austin',
                    expectedFields: ['events', 'total', 'location']
                },
                {
                    url: 'https://api.mls.example.com/listings?location=Austin',
                    expectedFields: ['listings', 'total']
                },
                {
                    url: 'https://api.demographics.example.com/v1/location/78701',
                    expectedFields: ['population', 'medianHouseholdIncome', 'ageDistribution']
                },
                {
                    url: 'https://api.greatschools.org/v1/schools/nearby?lat=30.2672&lon=-97.7431&radius=5',
                    expectedFields: ['schools', 'total', 'searchRadius']
                },
                {
                    url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=30.2672,-97.7431&key=test-key',
                    expectedFields: ['results', 'status']
                },
                {
                    url: 'https://api.walkscore.com/score?address=Austin%20TX&wsapikey=test-key',
                    expectedFields: ['walkscore', 'description', 'status']
                }
            ];

            for (const test of tests) {
                const response = await fetch(test.url);
                expect(response.ok).toBe(true);

                const data = await response.json();
                test.expectedFields.forEach(field => {
                    expect(data).toHaveProperty(field);
                });
            }
        });

        it('should return valid data ranges', async () => {
            // Test Walk Score ranges
            const walkScoreResponse = await fetch('https://api.walkscore.com/score?address=Austin%20TX&wsapikey=test-key');
            const walkScoreData = await walkScoreResponse.json();
            expect(walkScoreData.walkscore).toBeGreaterThanOrEqual(0);
            expect(walkScoreData.walkscore).toBeLessThanOrEqual(100);

            // Test school ratings
            const schoolResponse = await fetch('https://api.greatschools.org/v1/schools/school-001');
            const schoolData = await schoolResponse.json();
            expect(schoolData.school.rating).toBeGreaterThanOrEqual(1);
            expect(schoolData.school.rating).toBeLessThanOrEqual(10);

            // Test demographics data
            const demoResponse = await fetch('https://api.demographics.example.com/v1/location/78701');
            const demoData = await demoResponse.json();
            expect(demoData.population).toBeGreaterThan(0);
            expect(demoData.medianHouseholdIncome).toBeGreaterThan(0);
        });
    });
});