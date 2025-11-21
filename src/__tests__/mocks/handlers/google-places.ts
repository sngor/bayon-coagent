/**
 * Google Places API Mock Handlers
 * 
 * Mocks Google Places API that provides:
 * - Nearby places search
 * - Place details
 * - Business information
 * - Amenities categorization
 */

import { http, HttpResponse } from 'msw';
import { googlePlacesMockData } from '../data/google-places-data';

// Base URL for Google Places API
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

export const googlePlacesHandlers = [
    // Nearby search
    http.get(`${GOOGLE_PLACES_BASE_URL}/nearbysearch/json`, ({ request }) => {
        const url = new URL(request.url);
        const location = url.searchParams.get('location'); // lat,lng
        const radius = parseInt(url.searchParams.get('radius') || '1609'); // meters (default 1 mile)
        const type = url.searchParams.get('type'); // place type
        const keyword = url.searchParams.get('keyword');
        const key = url.searchParams.get('key');

        if (!key) {
            return HttpResponse.json(
                { error_message: 'API key is required', status: 'REQUEST_DENIED' },
                { status: 400 }
            );
        }

        if (!location) {
            return HttpResponse.json(
                { error_message: 'Location parameter is required', status: 'INVALID_REQUEST' },
                { status: 400 }
            );
        }

        const [lat, lng] = location.split(',').map(parseFloat);
        const radiusInMiles = radius / 1609.34; // Convert meters to miles

        // Filter places by distance
        let nearbyPlaces = googlePlacesMockData.places.filter(place => {
            const distance = Math.sqrt(
                Math.pow(place.geometry.location.lat - lat, 2) +
                Math.pow(place.geometry.location.lng - lng, 2)
            ) * 69; // Rough miles conversion
            return distance <= radiusInMiles;
        });

        // Filter by type if specified
        if (type) {
            nearbyPlaces = nearbyPlaces.filter(place =>
                place.types.includes(type)
            );
        }

        // Filter by keyword if specified
        if (keyword) {
            nearbyPlaces = nearbyPlaces.filter(place =>
                place.name.toLowerCase().includes(keyword.toLowerCase()) ||
                place.types.some(t => t.includes(keyword.toLowerCase()))
            );
        }

        // Add distance to results and sort by distance
        const results = nearbyPlaces
            .map(place => ({
                ...place,
                distance: Math.sqrt(
                    Math.pow(place.geometry.location.lat - lat, 2) +
                    Math.pow(place.geometry.location.lng - lng, 2)
                ) * 69
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 20) // Google Places API typically returns up to 20 results
            .map(({ distance, ...place }) => place); // Remove distance from final result

        return HttpResponse.json({
            results,
            status: 'OK',
            html_attributions: []
        });
    }),

    // Text search
    http.get(`${GOOGLE_PLACES_BASE_URL}/textsearch/json`, ({ request }) => {
        const url = new URL(request.url);
        const query = url.searchParams.get('query');
        const location = url.searchParams.get('location');
        const radius = parseInt(url.searchParams.get('radius') || '50000'); // meters
        const key = url.searchParams.get('key');

        if (!key) {
            return HttpResponse.json(
                { error_message: 'API key is required', status: 'REQUEST_DENIED' },
                { status: 400 }
            );
        }

        if (!query) {
            return HttpResponse.json(
                { error_message: 'Query parameter is required', status: 'INVALID_REQUEST' },
                { status: 400 }
            );
        }

        let filteredPlaces = googlePlacesMockData.places.filter(place =>
            place.name.toLowerCase().includes(query.toLowerCase()) ||
            place.types.some(type => type.includes(query.toLowerCase()))
        );

        // Filter by location if specified
        if (location) {
            const [lat, lng] = location.split(',').map(parseFloat);
            const radiusInMiles = radius / 1609.34;

            filteredPlaces = filteredPlaces.filter(place => {
                const distance = Math.sqrt(
                    Math.pow(place.geometry.location.lat - lat, 2) +
                    Math.pow(place.geometry.location.lng - lng, 2)
                ) * 69;
                return distance <= radiusInMiles;
            });
        }

        return HttpResponse.json({
            results: filteredPlaces.slice(0, 20),
            status: 'OK',
            html_attributions: []
        });
    }),

    // Place details
    http.get(`${GOOGLE_PLACES_BASE_URL}/details/json`, ({ request }) => {
        const url = new URL(request.url);
        const placeId = url.searchParams.get('place_id');
        const fields = url.searchParams.get('fields');
        const key = url.searchParams.get('key');

        if (!key) {
            return HttpResponse.json(
                { error_message: 'API key is required', status: 'REQUEST_DENIED' },
                { status: 400 }
            );
        }

        if (!placeId) {
            return HttpResponse.json(
                { error_message: 'Place ID is required', status: 'INVALID_REQUEST' },
                { status: 400 }
            );
        }

        const place = googlePlacesMockData.places.find(p => p.place_id === placeId);

        if (!place) {
            return HttpResponse.json(
                { error_message: 'Place not found', status: 'NOT_FOUND' },
                { status: 404 }
            );
        }

        // Get detailed information for the place
        const placeDetails = googlePlacesMockData.placeDetails.find(pd =>
            pd.place_id === placeId
        );

        const result = {
            ...place,
            ...placeDetails,
            // Add additional details
            opening_hours: placeDetails?.opening_hours || {
                open_now: Math.random() > 0.3, // 70% chance of being open
                weekday_text: [
                    "Monday: 9:00 AM – 6:00 PM",
                    "Tuesday: 9:00 AM – 6:00 PM",
                    "Wednesday: 9:00 AM – 6:00 PM",
                    "Thursday: 9:00 AM – 6:00 PM",
                    "Friday: 9:00 AM – 6:00 PM",
                    "Saturday: 10:00 AM – 4:00 PM",
                    "Sunday: Closed"
                ]
            },
            reviews: placeDetails?.reviews || []
        };

        return HttpResponse.json({
            result,
            status: 'OK',
            html_attributions: []
        });
    }),

    // Find place from text (for geocoding)
    http.get(`${GOOGLE_PLACES_BASE_URL}/findplacefromtext/json`, ({ request }) => {
        const url = new URL(request.url);
        const input = url.searchParams.get('input');
        const inputtype = url.searchParams.get('inputtype'); // 'textquery' or 'phonenumber'
        const fields = url.searchParams.get('fields');
        const key = url.searchParams.get('key');

        if (!key) {
            return HttpResponse.json(
                { error_message: 'API key is required', status: 'REQUEST_DENIED' },
                { status: 400 }
            );
        }

        if (!input) {
            return HttpResponse.json(
                { error_message: 'Input parameter is required', status: 'INVALID_REQUEST' },
                { status: 400 }
            );
        }

        const matchingPlaces = googlePlacesMockData.places.filter(place =>
            place.name.toLowerCase().includes(input.toLowerCase()) ||
            place.formatted_address?.toLowerCase().includes(input.toLowerCase())
        );

        return HttpResponse.json({
            candidates: matchingPlaces.slice(0, 5), // Return top 5 matches
            status: 'OK'
        });
    }),

    // Autocomplete
    http.get(`${GOOGLE_PLACES_BASE_URL}/autocomplete/json`, ({ request }) => {
        const url = new URL(request.url);
        const input = url.searchParams.get('input');
        const types = url.searchParams.get('types');
        const location = url.searchParams.get('location');
        const radius = url.searchParams.get('radius');
        const key = url.searchParams.get('key');

        if (!key) {
            return HttpResponse.json(
                { error_message: 'API key is required', status: 'REQUEST_DENIED' },
                { status: 400 }
            );
        }

        if (!input || input.length < 2) {
            return HttpResponse.json({
                predictions: [],
                status: 'OK'
            });
        }

        const predictions = googlePlacesMockData.places
            .filter(place =>
                place.name.toLowerCase().includes(input.toLowerCase())
            )
            .slice(0, 5)
            .map(place => ({
                description: place.name,
                place_id: place.place_id,
                reference: place.place_id,
                structured_formatting: {
                    main_text: place.name,
                    secondary_text: place.vicinity || place.formatted_address
                },
                types: place.types
            }));

        return HttpResponse.json({
            predictions,
            status: 'OK'
        });
    }),

    // Error simulation
    http.get(`${GOOGLE_PLACES_BASE_URL}/error-test`, () => {
        return HttpResponse.json(
            { error: 'Service temporarily unavailable' },
            { status: 503 }
        );
    }),
];