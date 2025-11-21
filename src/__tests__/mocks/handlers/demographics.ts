/**
 * Demographics API Mock Handlers
 * 
 * Mocks demographics APIs that provide:
 * - US Census Bureau data
 * - Population statistics
 * - Income data
 * - Age distribution
 * - Household composition
 */

import { http, HttpResponse } from 'msw';
import { demographicsMockData } from '../data/demographics-data';

// Base URL for US Census Bureau API
const CENSUS_BASE_URL = 'https://api.census.gov/data';

export const demographicsHandlers = [
    // Get demographics data for a location
    http.get(`${CENSUS_BASE_URL}/2021/acs/acs5`, ({ request }) => {
        const url = new URL(request.url);
        const get = url.searchParams.get('get'); // Variables to retrieve
        const forParam = url.searchParams.get('for'); // Geographic level
        const inParam = url.searchParams.get('in'); // Geographic hierarchy

        // Parse location from parameters
        let location = '';
        if (forParam?.includes('zip code tabulation area')) {
            const zipMatch = forParam.match(/zip code tabulation area:(\d+)/);
            location = zipMatch ? zipMatch[1] : '';
        } else if (forParam?.includes('place')) {
            const placeMatch = forParam.match(/place:(\d+)/);
            location = placeMatch ? placeMatch[1] : '';
        }

        // Find matching demographic data
        const demographicData = demographicsMockData.areas.find(area =>
            area.zipCode === location ||
            area.city.toLowerCase().includes(location.toLowerCase()) ||
            area.id === location
        );

        if (!demographicData) {
            return HttpResponse.json([
                ["NAME", "B01003_001E", "B19013_001E", "B25001_001E", "state", "place"],
                ["Location not found", "-666666666", "-666666666", "-666666666", "00", "00000"]
            ]);
        }

        // Format response in Census API format
        const response = [
            ["NAME", "B01003_001E", "B19013_001E", "B25001_001E", "B08301_001E", "state", "place"],
            [
                demographicData.name,
                demographicData.population.toString(),
                demographicData.medianHouseholdIncome.toString(),
                demographicData.housingUnits.toString(),
                demographicData.totalWorkers.toString(),
                demographicData.stateCode,
                demographicData.placeCode
            ]
        ];

        return HttpResponse.json(response);
    }),

    // Get detailed age distribution
    http.get(`${CENSUS_BASE_URL}/2021/acs/acs5/profile`, ({ request }) => {
        const url = new URL(request.url);
        const forParam = url.searchParams.get('for');

        let location = '';
        if (forParam?.includes('zip code tabulation area')) {
            const zipMatch = forParam.match(/zip code tabulation area:(\d+)/);
            location = zipMatch ? zipMatch[1] : '';
        }

        const demographicData = demographicsMockData.areas.find(area =>
            area.zipCode === location || area.city.toLowerCase().includes(location.toLowerCase())
        );

        if (!demographicData) {
            return HttpResponse.json([
                ["NAME", "DP05_0001E", "DP05_0009E", "DP05_0010E", "DP05_0011E", "DP05_0012E", "DP05_0013E"],
                ["Location not found", "0", "0", "0", "0", "0", "0"]
            ]);
        }

        const response = [
            ["NAME", "DP05_0001E", "DP05_0009E", "DP05_0010E", "DP05_0011E", "DP05_0012E", "DP05_0013E"],
            [
                demographicData.name,
                demographicData.population.toString(),
                Math.round(demographicData.population * demographicData.ageDistribution.under18 / 100).toString(),
                Math.round(demographicData.population * demographicData.ageDistribution.age18to34 / 100).toString(),
                Math.round(demographicData.population * demographicData.ageDistribution.age35to54 / 100).toString(),
                Math.round(demographicData.population * demographicData.ageDistribution.age55to74 / 100).toString(),
                Math.round(demographicData.population * demographicData.ageDistribution.over75 / 100).toString()
            ]
        ];

        return HttpResponse.json(response);
    }),

    // Alternative demographics API (for different data providers)
    http.get('https://api.demographics.example.com/v1/location/:location', ({ params }) => {
        const { location } = params;

        const demographicData = demographicsMockData.areas.find(area =>
            area.zipCode === location ||
            area.city.toLowerCase().includes(location.toLowerCase()) ||
            area.id === location
        );

        if (!demographicData) {
            return HttpResponse.json(
                { error: 'Location not found' },
                { status: 404 }
            );
        }

        return HttpResponse.json({
            location: demographicData.name,
            population: demographicData.population,
            medianHouseholdIncome: demographicData.medianHouseholdIncome,
            ageDistribution: demographicData.ageDistribution,
            householdComposition: demographicData.householdComposition,
            education: demographicData.education,
            employment: demographicData.employment,
            housing: {
                totalUnits: demographicData.housingUnits,
                ownerOccupied: demographicData.ownerOccupiedPercent,
                renterOccupied: 100 - demographicData.ownerOccupiedPercent,
                medianHomeValue: demographicData.medianHomeValue
            }
        });
    }),

    // Batch demographics lookup
    http.post('https://api.demographics.example.com/v1/batch', async ({ request }) => {
        const body = await request.json() as { locations: string[] };

        const results = body.locations.map(location => {
            const demographicData = demographicsMockData.areas.find(area =>
                area.zipCode === location ||
                area.city.toLowerCase().includes(location.toLowerCase()) ||
                area.id === location
            );

            if (!demographicData) {
                return {
                    location,
                    error: 'Location not found'
                };
            }

            return {
                location: demographicData.name,
                population: demographicData.population,
                medianHouseholdIncome: demographicData.medianHouseholdIncome,
                ageDistribution: demographicData.ageDistribution,
                householdComposition: demographicData.householdComposition
            };
        });

        return HttpResponse.json({
            results,
            total: results.length
        });
    }),

    // Error simulation
    http.get('https://api.demographics.example.com/error-test', () => {
        return HttpResponse.json(
            { error: 'Demographics service temporarily unavailable' },
            { status: 503 }
        );
    }),
];