/**
 * Schools API Mock Handlers
 * 
 * Mocks school rating APIs that provide:
 * - GreatSchools API data
 * - School ratings and information
 * - Public and private school data
 * - Distance calculations
 */

import { http, HttpResponse } from 'msw';
import { schoolsMockData } from '../data/schools-data';

// Base URL for GreatSchools API
const GREATSCHOOLS_BASE_URL = 'https://api.greatschools.org/v1';

export const schoolsHandlers = [
    // Get schools near a location
    http.get(`${GREATSCHOOLS_BASE_URL}/schools/nearby`, ({ request }) => {
        const url = new URL(request.url);
        const lat = parseFloat(url.searchParams.get('lat') || '0');
        const lon = parseFloat(url.searchParams.get('lon') || '0');
        const radius = parseFloat(url.searchParams.get('radius') || '5'); // miles
        const schoolType = url.searchParams.get('schoolType'); // 'public', 'private', or null for both
        const limit = parseInt(url.searchParams.get('limit') || '20');

        // Find schools within radius (simplified distance calculation)
        let nearbySchools = schoolsMockData.schools.filter(school => {
            const distance = Math.sqrt(
                Math.pow(school.latitude - lat, 2) + Math.pow(school.longitude - lon, 2)
            ) * 69; // Rough miles conversion
            return distance <= radius;
        });

        // Filter by school type if specified
        if (schoolType) {
            nearbySchools = nearbySchools.filter(school =>
                school.type.toLowerCase() === schoolType.toLowerCase()
            );
        }

        // Sort by distance and apply limit
        nearbySchools = nearbySchools
            .map(school => ({
                ...school,
                distance: Math.sqrt(
                    Math.pow(school.latitude - lat, 2) + Math.pow(school.longitude - lon, 2)
                ) * 69
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, limit);

        return HttpResponse.json({
            schools: nearbySchools.map(school => ({
                id: school.id,
                name: school.name,
                type: school.type,
                grades: school.grades,
                rating: school.rating,
                distance: Math.round(school.distance * 10) / 10, // Round to 1 decimal
                address: school.address,
                city: school.city,
                state: school.state,
                zipCode: school.zipCode,
                phone: school.phone,
                website: school.website,
                enrollment: school.enrollment,
                studentTeacherRatio: school.studentTeacherRatio
            })),
            total: nearbySchools.length,
            searchRadius: radius,
            location: { lat, lon }
        });
    }),

    // Get schools by ZIP code
    http.get(`${GREATSCHOOLS_BASE_URL}/schools/zip/:zipCode`, ({ params, request }) => {
        const { zipCode } = params;
        const url = new URL(request.url);
        const schoolType = url.searchParams.get('schoolType');

        let schoolsInZip = schoolsMockData.schools.filter(school =>
            school.zipCode === zipCode
        );

        if (schoolType) {
            schoolsInZip = schoolsInZip.filter(school =>
                school.type.toLowerCase() === schoolType.toLowerCase()
            );
        }

        return HttpResponse.json({
            schools: schoolsInZip,
            total: schoolsInZip.length,
            zipCode
        });
    }),

    // Get school details by ID
    http.get(`${GREATSCHOOLS_BASE_URL}/schools/:schoolId`, ({ params }) => {
        const { schoolId } = params;
        const school = schoolsMockData.schools.find(s => s.id === schoolId);

        if (!school) {
            return HttpResponse.json(
                { error: 'School not found' },
                { status: 404 }
            );
        }

        return HttpResponse.json({
            school: {
                ...school,
                testScores: schoolsMockData.testScores.filter(score =>
                    score.schoolId === schoolId
                ),
                demographics: schoolsMockData.demographics.find(demo =>
                    demo.schoolId === schoolId
                )
            }
        });
    }),

    // Get school ratings summary for an area
    http.get(`${GREATSCHOOLS_BASE_URL}/ratings/summary`, ({ request }) => {
        const url = new URL(request.url);
        const location = url.searchParams.get('location'); // ZIP code or city
        const radius = parseFloat(url.searchParams.get('radius') || '3');

        let relevantSchools = schoolsMockData.schools;

        if (location) {
            relevantSchools = relevantSchools.filter(school =>
                school.zipCode === location ||
                school.city.toLowerCase().includes(location.toLowerCase())
            );
        }

        // Calculate summary statistics
        const publicSchools = relevantSchools.filter(s => s.type === 'public');
        const privateSchools = relevantSchools.filter(s => s.type === 'private');

        const avgPublicRating = publicSchools.length > 0
            ? publicSchools.reduce((sum, s) => sum + s.rating, 0) / publicSchools.length
            : 0;

        const avgPrivateRating = privateSchools.length > 0
            ? privateSchools.reduce((sum, s) => sum + s.rating, 0) / privateSchools.length
            : 0;

        const overallRating = relevantSchools.length > 0
            ? relevantSchools.reduce((sum, s) => sum + s.rating, 0) / relevantSchools.length
            : 0;

        return HttpResponse.json({
            location,
            summary: {
                totalSchools: relevantSchools.length,
                publicSchools: publicSchools.length,
                privateSchools: privateSchools.length,
                averageRating: Math.round(overallRating * 10) / 10,
                averagePublicRating: Math.round(avgPublicRating * 10) / 10,
                averagePrivateRating: Math.round(avgPrivateRating * 10) / 10,
                topRatedSchools: relevantSchools
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 5)
                    .map(school => ({
                        name: school.name,
                        type: school.type,
                        rating: school.rating,
                        grades: school.grades
                    }))
            }
        });
    }),

    // Alternative school data API
    http.get('https://api.schooldata.example.com/v1/schools', ({ request }) => {
        const url = new URL(request.url);
        const zipCode = url.searchParams.get('zipCode');
        const city = url.searchParams.get('city');
        const state = url.searchParams.get('state');

        let filteredSchools = schoolsMockData.schools;

        if (zipCode) {
            filteredSchools = filteredSchools.filter(school => school.zipCode === zipCode);
        }

        if (city) {
            filteredSchools = filteredSchools.filter(school =>
                school.city.toLowerCase().includes(city.toLowerCase())
            );
        }

        if (state) {
            filteredSchools = filteredSchools.filter(school =>
                school.state.toLowerCase() === state.toLowerCase()
            );
        }

        return HttpResponse.json({
            schools: filteredSchools.map(school => ({
                id: school.id,
                name: school.name,
                type: school.type,
                grades: school.grades,
                rating: school.rating,
                address: school.address,
                city: school.city,
                state: school.state,
                zipCode: school.zipCode,
                enrollment: school.enrollment,
                studentTeacherRatio: school.studentTeacherRatio
            })),
            total: filteredSchools.length
        });
    }),

    // Error simulation
    http.get(`${GREATSCHOOLS_BASE_URL}/error-test`, () => {
        return HttpResponse.json(
            { error: 'GreatSchools API temporarily unavailable' },
            { status: 503 }
        );
    }),
];