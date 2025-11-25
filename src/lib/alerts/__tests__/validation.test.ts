/**
 * Tests for alert settings validation functions
 */

import {
    validateZipCode,
    validateCityName,
    validatePolygon,
    validateTargetArea,
    validateAlertSettings
} from '../validation';
import type { TargetArea, AlertSettings } from '../types';

describe('Alert Settings Validation', () => {
    describe('validateZipCode', () => {
        it('should validate correct ZIP codes', () => {
            expect(validateZipCode('12345')).toBe(true);
            expect(validateZipCode('12345-6789')).toBe(true);
        });

        it('should reject invalid ZIP codes', () => {
            expect(validateZipCode('1234')).toBe(false);
            expect(validateZipCode('123456')).toBe(false);
            expect(validateZipCode('12345-678')).toBe(false);
            expect(validateZipCode('abcde')).toBe(false);
        });
    });

    describe('validateCityName', () => {
        it('should validate correct city names', () => {
            expect(validateCityName('Seattle')).toBe(true);
            expect(validateCityName('San Francisco')).toBe(true);
            expect(validateCityName("O'Fallon")).toBe(true);
            expect(validateCityName('Winston-Salem')).toBe(true);
        });

        it('should reject invalid city names', () => {
            expect(validateCityName('A')).toBe(false); // Too short
            expect(validateCityName('City123')).toBe(false); // Contains numbers
            expect(validateCityName('')).toBe(false); // Empty
        });
    });

    describe('validatePolygon', () => {
        it('should validate correct polygons', () => {
            const validPolygon = [
                { lat: 40.7128, lng: -74.0060 },
                { lat: 40.7589, lng: -73.9851 },
                { lat: 40.7505, lng: -73.9934 },
            ];
            expect(validatePolygon(validPolygon)).toBe(true);
        });

        it('should reject invalid polygons', () => {
            // Too few points
            expect(validatePolygon([
                { lat: 40.7128, lng: -74.0060 },
                { lat: 40.7589, lng: -73.9851 },
            ])).toBe(false);

            // Invalid coordinates
            expect(validatePolygon([
                { lat: 91, lng: -74.0060 }, // Invalid latitude
                { lat: 40.7589, lng: -73.9851 },
                { lat: 40.7505, lng: -73.9934 },
            ])).toBe(false);
        });
    });

    describe('validateTargetArea', () => {
        it('should validate ZIP code target areas', () => {
            const zipArea: TargetArea = {
                id: '1',
                type: 'zip',
                value: '12345',
                label: 'Test ZIP',
            };
            const result = validateTargetArea(zipArea);
            expect(result.isValid).toBe(true);
        });

        it('should validate city target areas', () => {
            const cityArea: TargetArea = {
                id: '2',
                type: 'city',
                value: 'Seattle',
                label: 'Test City',
            };
            const result = validateTargetArea(cityArea);
            expect(result.isValid).toBe(true);
        });

        it('should validate polygon target areas', () => {
            const polygonArea: TargetArea = {
                id: '3',
                type: 'polygon',
                value: {
                    coordinates: [
                        { lat: 40.7128, lng: -74.0060 },
                        { lat: 40.7589, lng: -73.9851 },
                        { lat: 40.7505, lng: -73.9934 },
                    ],
                },
                label: 'Test Polygon',
            };
            const result = validateTargetArea(polygonArea);
            expect(result.isValid).toBe(true);
        });

        it('should reject invalid target areas', () => {
            const invalidArea: TargetArea = {
                id: '4',
                type: 'zip',
                value: 'invalid-zip',
                label: 'Invalid ZIP',
            };
            const result = validateTargetArea(invalidArea);
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('Invalid ZIP code format');
        });
    });

    describe('validateAlertSettings', () => {
        it('should validate correct alert settings', () => {
            const validSettings: AlertSettings = {
                userId: 'user123',
                enabledAlertTypes: ['life-event-lead', 'price-reduction'],
                frequency: 'real-time',
                leadScoreThreshold: 70,
                targetAreas: [],
                trackedCompetitors: [],
                updatedAt: new Date().toISOString(),
            };
            const result = validateAlertSettings(validSettings);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid alert settings', () => {
            const invalidSettings = {
                // Missing userId
                enabledAlertTypes: 'not-an-array', // Should be array
                frequency: 'invalid-frequency',
                leadScoreThreshold: 100, // Out of range
                targetAreas: 'not-an-array',
                trackedCompetitors: 'not-an-array',
            };
            const result = validateAlertSettings(invalidSettings);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });
});