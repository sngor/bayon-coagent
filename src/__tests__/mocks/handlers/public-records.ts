/**
 * Public Records API Mock Handlers
 * 
 * Mocks public records APIs that provide life event data such as:
 * - Marriage records
 * - Divorce records
 * - Property ownership changes
 * - Employment records
 * - Birth/death records
 */

import { http, HttpResponse } from 'msw';
import { publicRecordsMockData } from '../data/public-records-data';

// Base URL for public records API (example - would be actual API endpoint)
const PUBLIC_RECORDS_BASE_URL = 'https://api.publicrecords.example.com';

export const publicRecordsHandlers = [
    // Get life events for a specific area
    http.get(`${PUBLIC_RECORDS_BASE_URL}/life-events`, ({ request }) => {
        const url = new URL(request.url);
        const location = url.searchParams.get('location');
        const eventTypes = url.searchParams.get('eventTypes')?.split(',') || [];
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');

        if (!location) {
            return HttpResponse.json(
                { error: 'Location parameter is required' },
                { status: 400 }
            );
        }

        // Filter mock data based on parameters
        let filteredEvents = publicRecordsMockData.lifeEvents.filter(event =>
            event.location.toLowerCase().includes(location.toLowerCase())
        );

        if (eventTypes.length > 0) {
            filteredEvents = filteredEvents.filter(event =>
                eventTypes.includes(event.eventType)
            );
        }

        if (startDate) {
            filteredEvents = filteredEvents.filter(event =>
                new Date(event.eventDate) >= new Date(startDate)
            );
        }

        if (endDate) {
            filteredEvents = filteredEvents.filter(event =>
                new Date(event.eventDate) <= new Date(endDate)
            );
        }

        return HttpResponse.json({
            events: filteredEvents,
            total: filteredEvents.length,
            location,
            dateRange: { startDate, endDate }
        });
    }),

    // Get marriage records
    http.get(`${PUBLIC_RECORDS_BASE_URL}/marriage-records`, ({ request }) => {
        const url = new URL(request.url);
        const location = url.searchParams.get('location');

        const marriageEvents = publicRecordsMockData.lifeEvents.filter(event =>
            event.eventType === 'marriage' &&
            event.location.toLowerCase().includes(location?.toLowerCase() || '')
        );

        return HttpResponse.json({
            records: marriageEvents,
            total: marriageEvents.length
        });
    }),

    // Get divorce records
    http.get(`${PUBLIC_RECORDS_BASE_URL}/divorce-records`, ({ request }) => {
        const url = new URL(request.url);
        const location = url.searchParams.get('location');

        const divorceEvents = publicRecordsMockData.lifeEvents.filter(event =>
            event.eventType === 'divorce' &&
            event.location.toLowerCase().includes(location?.toLowerCase() || '')
        );

        return HttpResponse.json({
            records: divorceEvents,
            total: divorceEvents.length
        });
    }),

    // Get property ownership changes
    http.get(`${PUBLIC_RECORDS_BASE_URL}/property-ownership`, ({ request }) => {
        const url = new URL(request.url);
        const location = url.searchParams.get('location');

        return HttpResponse.json({
            records: publicRecordsMockData.propertyOwnershipChanges.filter(record =>
                record.location.toLowerCase().includes(location?.toLowerCase() || '')
            )
        });
    }),

    // Get employment records (job changes)
    http.get(`${PUBLIC_RECORDS_BASE_URL}/employment-records`, ({ request }) => {
        const url = new URL(request.url);
        const location = url.searchParams.get('location');

        const jobChangeEvents = publicRecordsMockData.lifeEvents.filter(event =>
            event.eventType === 'job-change' &&
            event.location.toLowerCase().includes(location?.toLowerCase() || '')
        );

        return HttpResponse.json({
            records: jobChangeEvents,
            total: jobChangeEvents.length
        });
    }),

    // Error simulation endpoint
    http.get(`${PUBLIC_RECORDS_BASE_URL}/error-test`, () => {
        return HttpResponse.json(
            { error: 'Service temporarily unavailable' },
            { status: 503 }
        );
    }),

    // Slow response simulation endpoint
    http.get(`${PUBLIC_RECORDS_BASE_URL}/slow-test`, async () => {
        // Simulate slow API response
        await new Promise(resolve => setTimeout(resolve, 5000));
        return HttpResponse.json({ message: 'Slow response completed' });
    }),
];