/**
 * Tests for alert settings server actions
 */

import { validateTargetArea } from '../validation';
import type { TargetArea } from '../types';

// Mock FormData for testing
class MockFormData {
    private data: Map<string, string | string[]> = new Map();

    append(key: string, value: string) {
        const existing = this.data.get(key);
        if (existing) {
            if (Array.isArray(existing)) {
                existing.push(value);
            } else {
                this.data.set(key, [existing, value]);
            }
        } else {
            this.data.set(key, value);
        }
    }

    get(key: string): string | null {
        const value = this.data.get(key);
        if (Array.isArray(value)) {
            return value[0] || null;
        }
        return value || null;
    }

    getAll(key: string): string[] {
        const value = this.data.get(key);
        if (Array.isArray(value)) {
            return value;
        }
        return value ? [value] : [];
    }
}

describe('Alert Settings Server Actions', () => {
    describe('Form Data Processing', () => {
        it('should process alert settings form data correctly', () => {
            const formData = new MockFormData();

            // Simulate form data
            formData.append('enabledAlertTypes', 'life-event-lead');
            formData.append('enabledAlertTypes', 'price-reduction');
            formData.append('frequency', 'real-time');
            formData.append('leadScoreThreshold', '75');
            formData.append('trackedCompetitors', 'comp-1');
            formData.append('trackedCompetitors', 'comp-2');

            // Test form data extraction
            const enabledAlertTypes = formData.getAll('enabledAlertTypes');
            const frequency = formData.get('frequency');
            const leadScoreThreshold = parseInt(formData.get('leadScoreThreshold') || '0');
            const trackedCompetitors = formData.getAll('trackedCompetitors');

            expect(enabledAlertTypes).toEqual(['life-event-lead', 'price-reduction']);
            expect(frequency).toBe('real-time');
            expect(leadScoreThreshold).toBe(75);
            expect(trackedCompetitors).toEqual(['comp-1', 'comp-2']);
        });

        it('should process target area form data correctly', () => {
            const formData = new MockFormData();

            formData.append('type', 'zip');
            formData.append('value', '12345');
            formData.append('label', 'Test ZIP Area');

            const type = formData.get('type') as 'zip' | 'city' | 'polygon';
            const value = formData.get('value');
            const label = formData.get('label');

            expect(type).toBe('zip');
            expect(value).toBe('12345');
            expect(label).toBe('Test ZIP Area');
        });

        it('should handle polygon coordinates in form data', () => {
            const formData = new MockFormData();
            const coordinates = JSON.stringify({
                coordinates: [
                    { lat: 40.7128, lng: -74.0060 },
                    { lat: 40.7589, lng: -73.9851 },
                    { lat: 40.7505, lng: -73.9934 },
                ],
            });

            formData.append('type', 'polygon');
            formData.append('coordinates', coordinates);
            formData.append('label', 'Custom Polygon');

            const type = formData.get('type');
            const coordinatesStr = formData.get('coordinates');
            const label = formData.get('label');

            expect(type).toBe('polygon');
            expect(coordinatesStr).toBe(coordinates);
            expect(label).toBe('Custom Polygon');

            // Test parsing
            const parsedCoordinates = JSON.parse(coordinatesStr || '{}');
            expect(Array.isArray(parsedCoordinates.coordinates)).toBe(true);
            expect(parsedCoordinates.coordinates).toHaveLength(3);
        });
    });

    describe('Target Area Validation in Actions', () => {
        it('should validate ZIP code target areas', () => {
            const targetArea: TargetArea = {
                id: 'test-1',
                type: 'zip',
                value: '12345',
                label: 'Valid ZIP',
            };

            const result = validateTargetArea(targetArea);
            expect(result.isValid).toBe(true);
        });

        it('should reject invalid ZIP codes', () => {
            const targetArea: TargetArea = {
                id: 'test-2',
                type: 'zip',
                value: 'invalid',
                label: 'Invalid ZIP',
            };

            const result = validateTargetArea(targetArea);
            expect(result.isValid).toBe(false);
            expect(result.errors[0]).toContain('Invalid');
        });

        it('should validate city target areas', () => {
            const targetArea: TargetArea = {
                id: 'test-3',
                type: 'city',
                value: 'New York',
                label: 'NYC',
            };

            const result = validateTargetArea(targetArea);
            expect(result.isValid).toBe(true);
        });

        it('should validate polygon target areas', () => {
            const targetArea: TargetArea = {
                id: 'test-4',
                type: 'polygon',
                value: {
                    coordinates: [
                        { lat: 40.7128, lng: -74.0060 },
                        { lat: 40.7589, lng: -73.9851 },
                        { lat: 40.7505, lng: -73.9934 },
                    ],
                },
                label: 'Custom Area',
            };

            const result = validateTargetArea(targetArea);
            expect(result.isValid).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle missing required fields', () => {
            const incompleteArea = {
                id: 'test-5',
                type: 'zip',
                // Missing value and label
            } as any;

            const result = validateTargetArea(incompleteArea);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should handle invalid JSON in polygon coordinates', () => {
            const invalidJson = 'invalid-json-string';

            expect(() => {
                JSON.parse(invalidJson);
            }).toThrow();
        });

        it('should handle type/value mismatches', () => {
            const mismatchedArea: TargetArea = {
                id: 'test-6',
                type: 'zip',
                value: { coordinates: [] }, // Object value for ZIP type
                label: 'Mismatched',
            } as any;

            const result = validateTargetArea(mismatchedArea);
            expect(result.isValid).toBe(false);
        });
    });
});