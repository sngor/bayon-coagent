/**
 * Walk Score API Mock Handlers
 * 
 * Mocks Walk Score API that provides:
 * - Walkability scores
 * - Transit scores
 * - Bike scores
 * - Neighborhood walkability analysis
 */

import { http, HttpResponse } from 'msw';
import { walkScoreMockData } from '../data/walk-score-data';

// Base URL for Walk Score API
const WALKSCORE_BASE_URL = 'https://api.walkscore.com';

export const walkScoreHandlers = [
    // Get Walk Score for a location
    http.get(`${WALKSCORE_BASE_URL}/score`, ({ request }) => {
        const url = new URL(request.url);
        const format = url.searchParams.get('format') || 'json';
        const address = url.searchParams.get('address');
        const lat = parseFloat(url.searchParams.get('lat') || '0');
        const lon = parseFloat(url.searchParams.get('lon') || '0');
        const transit = url.searchParams.get('transit') === '1';
        const bike = url.searchParams.get('bike') === '1';
        const wsapikey = url.searchParams.get('wsapikey');

        if (!wsapikey) {
            return HttpResponse.json(
                { error: 'API key is required' },
                { status: 400 }
            );
        }

        if (!address && (!lat || !lon)) {
            return HttpResponse.json(
                { error: 'Either address or lat/lon coordinates are required' },
                { status: 400 }
            );
        }

        // Find matching location data
        let locationData;

        if (address) {
            locationData = walkScoreMockData.locations.find(loc =>
                loc.address.toLowerCase().includes(address.toLowerCase()) ||
                loc.city.toLowerCase().includes(address.toLowerCase()) ||
                loc.zipCode === address
            );
        } else {
            // Find closest location by coordinates
            locationData = walkScoreMockData.locations.reduce((closest, current) => {
                const currentDistance = Math.sqrt(
                    Math.pow(current.lat - lat, 2) + Math.pow(current.lon - lon, 2)
                );
                const closestDistance = Math.sqrt(
                    Math.pow(closest.lat - lat, 2) + Math.pow(closest.lon - lon, 2)
                );
                return currentDistance < closestDistance ? current : closest;
            });
        }

        if (!locationData) {
            // Find a default location for generic queries like "Austin TX"
            locationData = walkScoreMockData.locations.find(loc =>
                loc.city.toLowerCase() === 'austin'
            ) || walkScoreMockData.locations[0];
        }

        const response: any = {
            status: 1,
            walkscore: locationData.walkScore,
            description: locationData.description,
            updated: locationData.updated,
            logo_url: "https://cdn.walk.sc/images/api-logo.png",
            more_info_icon: "https://cdn.walk.sc/images/api-more-info.gif",
            more_info_link: "https://www.walkscore.com/methodology.shtml",
            ws_link: `https://www.walkscore.com/${locationData.city.toLowerCase().replace(/\s+/g, '-')}-${locationData.state.toLowerCase()}`,
            snapped_lat: locationData.lat,
            snapped_lon: locationData.lon
        };

        // Add transit score if requested
        if (transit) {
            response.transit = {
                score: locationData.transitScore,
                description: getTransitDescription(locationData.transitScore),
                summary: `Transit score of ${locationData.transitScore}`
            };
        }

        // Add bike score if requested
        if (bike) {
            response.bike = {
                score: locationData.bikeScore,
                description: getBikeDescription(locationData.bikeScore)
            };
        }

        return HttpResponse.json(response);
    }),

    // Batch Walk Score lookup
    http.post(`${WALKSCORE_BASE_URL}/batch`, async ({ request }) => {
        const body = await request.json() as {
            locations: Array<{
                address?: string;
                lat?: number;
                lon?: number;
            }>;
            wsapikey: string;
        };

        if (!body.wsapikey) {
            return HttpResponse.json(
                { error: 'API key is required' },
                { status: 400 }
            );
        }

        const results = body.locations.map((location, index) => {
            let locationData;

            if (location.address) {
                locationData = walkScoreMockData.locations.find(loc =>
                    loc.address.toLowerCase().includes(location.address!.toLowerCase()) ||
                    loc.city.toLowerCase().includes(location.address!.toLowerCase())
                );
            } else if (location.lat && location.lon) {
                locationData = walkScoreMockData.locations.reduce((closest, current) => {
                    const currentDistance = Math.sqrt(
                        Math.pow(current.lat - location.lat!, 2) + Math.pow(current.lon - location.lon!, 2)
                    );
                    const closestDistance = Math.sqrt(
                        Math.pow(closest.lat - location.lat!, 2) + Math.pow(closest.lon - location.lon!, 2)
                    );
                    return currentDistance < closestDistance ? current : closest;
                });
            }

            if (!locationData) {
                return {
                    index,
                    status: 40,
                    walkscore: 0,
                    description: "Location not found"
                };
            }

            return {
                index,
                status: 1,
                walkscore: locationData.walkScore,
                description: locationData.description,
                updated: locationData.updated,
                snapped_lat: locationData.lat,
                snapped_lon: locationData.lon
            };
        });

        return HttpResponse.json({
            results,
            total: results.length
        });
    }),

    // Alternative walkability API
    http.get('https://api.walkability.example.com/v1/score', ({ request }) => {
        const url = new URL(request.url);
        const location = url.searchParams.get('location'); // address or lat,lng
        const includeFactors = url.searchParams.get('includeFactors') === 'true';

        let locationData;

        if (location?.includes(',')) {
            // Coordinates provided
            const [lat, lng] = location.split(',').map(parseFloat);
            locationData = walkScoreMockData.locations.reduce((closest, current) => {
                const currentDistance = Math.sqrt(
                    Math.pow(current.lat - lat, 2) + Math.pow(current.lon - lng, 2)
                );
                const closestDistance = Math.sqrt(
                    Math.pow(closest.lat - lat, 2) + Math.pow(closest.lon - lng, 2)
                );
                return currentDistance < closestDistance ? current : closest;
            });
        } else {
            // Address provided
            locationData = walkScoreMockData.locations.find(loc =>
                loc.address.toLowerCase().includes(location?.toLowerCase() || '') ||
                loc.city.toLowerCase().includes(location?.toLowerCase() || '')
            );
        }

        if (!locationData) {
            return HttpResponse.json(
                { error: 'Location not found' },
                { status: 404 }
            );
        }

        const response: any = {
            location: locationData.address,
            walkabilityScore: locationData.walkScore,
            description: locationData.description,
            transitScore: locationData.transitScore,
            bikeScore: locationData.bikeScore
        };

        if (includeFactors) {
            response.factors = {
                walkability: locationData.walkScore,
                transitAccess: locationData.transitScore,
                bikeInfrastructure: locationData.bikeScore,
                pedestrianSafety: Math.max(0, locationData.walkScore - 10 + Math.random() * 20),
                amenityDensity: Math.max(0, locationData.walkScore - 5 + Math.random() * 15),
                streetConnectivity: Math.max(0, locationData.walkScore - 8 + Math.random() * 16)
            };
        }

        return HttpResponse.json(response);
    }),

    // Error simulation
    http.get(`${WALKSCORE_BASE_URL}/error-test`, () => {
        return HttpResponse.json(
            { error: 'Walk Score API temporarily unavailable' },
            { status: 503 }
        );
    }),
];

// Helper functions
function getTransitDescription(score: number): string {
    if (score >= 90) return "Excellent Transit";
    if (score >= 70) return "Excellent Transit";
    if (score >= 50) return "Good Transit";
    if (score >= 25) return "Some Transit";
    return "Minimal Transit";
}

function getBikeDescription(score: number): string {
    if (score >= 90) return "Biker's Paradise";
    if (score >= 70) return "Very Bikeable";
    if (score >= 50) return "Bikeable";
    if (score >= 25) return "Somewhat Bikeable";
    return "Not Bikeable";
}