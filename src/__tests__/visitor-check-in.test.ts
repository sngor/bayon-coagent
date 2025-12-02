/**
 * Visitor Check-in Tests
 * 
 * Tests for enhanced visitor check-in functionality
 * Validates Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { describe, it, expect } from '@jest/globals';
import { checkInVisitorInputSchema } from '@/lib/open-house/schemas';
import { CheckInSource, InterestLevel } from '@/lib/open-house/types';

describe('Visitor Check-in Validation', () => {
    describe('Email Validation', () => {
        it('should validate email format', () => {

            // Valid email
            const validInput = {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '5551234567',
                interestLevel: InterestLevel.MEDIUM,
                source: CheckInSource.MANUAL,
            };

            const validResult = checkInVisitorInputSchema.safeParse(validInput);
            expect(validResult.success).toBe(true);

            // Invalid email
            const invalidInput = {
                ...validInput,
                email: 'not-an-email',
            };

            const invalidResult = checkInVisitorInputSchema.safeParse(invalidInput);
            expect(invalidResult.success).toBe(false);
            if (!invalidResult.success) {
                expect(invalidResult.error.issues[0].path).toContain('email');
            }
        });

        it('should require email field', () => {
            const input = {
                name: 'John Doe',
                phone: '5551234567',
                interestLevel: InterestLevel.MEDIUM,
                source: CheckInSource.MANUAL,
            };

            const result = checkInVisitorInputSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
    });

    describe('Phone Validation', () => {
        it('should require minimum 10 digits for phone', () => {
            const validInput = {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '5551234567',
                interestLevel: InterestLevel.MEDIUM,
                source: CheckInSource.MANUAL,
            };

            const validResult = checkInVisitorInputSchema.safeParse(validInput);
            expect(validResult.success).toBe(true);

            // Too short
            const invalidInput = {
                ...validInput,
                phone: '123',
            };

            const invalidResult = checkInVisitorInputSchema.safeParse(invalidInput);
            expect(invalidResult.success).toBe(false);
        });
    });

    describe('Interest Level Validation', () => {
        it('should accept valid interest levels', () => {
            const levels = [InterestLevel.LOW, InterestLevel.MEDIUM, InterestLevel.HIGH];

            levels.forEach((level) => {
                const input = {
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '5551234567',
                    interestLevel: level,
                    source: CheckInSource.MANUAL,
                };

                const result = checkInVisitorInputSchema.safeParse(input);
                expect(result.success).toBe(true);
            });
        });

        it('should reject invalid interest levels', () => {
            const input = {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '5551234567',
                interestLevel: 'invalid',
                source: CheckInSource.MANUAL,
            };

            const result = checkInVisitorInputSchema.safeParse(input);
            expect(result.success).toBe(false);
        });
    });

    describe('Source Tracking', () => {
        it('should accept manual and QR sources', () => {
            const sources = [CheckInSource.MANUAL, CheckInSource.QR];

            sources.forEach((source) => {
                const input = {
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '5551234567',
                    interestLevel: InterestLevel.MEDIUM,
                    source,
                };

                const result = checkInVisitorInputSchema.safeParse(input);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('Required Fields', () => {
        it('should require name, email, phone, interestLevel, and source', () => {
            const input = {};

            const result = checkInVisitorInputSchema.safeParse(input);
            expect(result.success).toBe(false);

            if (!result.success) {
                const errorPaths = result.error.issues.map(issue => issue.path[0]);
                expect(errorPaths).toContain('name');
                expect(errorPaths).toContain('email');
                expect(errorPaths).toContain('phone');
                expect(errorPaths).toContain('interestLevel');
                expect(errorPaths).toContain('source');
            }
        });

        it('should allow optional notes field', () => {
            const inputWithoutNotes = {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '5551234567',
                interestLevel: InterestLevel.MEDIUM,
                source: CheckInSource.MANUAL,
            };

            const resultWithoutNotes = checkInVisitorInputSchema.safeParse(inputWithoutNotes);
            expect(resultWithoutNotes.success).toBe(true);

            const inputWithNotes = {
                ...inputWithoutNotes,
                notes: 'Interested in the backyard',
            };

            const resultWithNotes = checkInVisitorInputSchema.safeParse(inputWithNotes);
            expect(resultWithNotes.success).toBe(true);
        });
    });
});
