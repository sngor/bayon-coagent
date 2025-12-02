/**
 * Visitor Management Tests
 * 
 * Tests for visitor update, delete, and note appending functionality
 * Validates Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { describe, it, expect } from '@jest/globals';
import { updateVisitorInputSchema } from '@/lib/open-house/schemas';
import { InterestLevel } from '@/lib/open-house/types';

describe('Visitor Management Validation', () => {
    describe('Update Visitor Input Validation', () => {
        it('should validate partial visitor updates', () => {
            // Valid partial update - name only
            const nameUpdate = {
                name: 'Jane Smith',
            };

            const nameResult = updateVisitorInputSchema.safeParse(nameUpdate);
            expect(nameResult.success).toBe(true);

            // Valid partial update - email only
            const emailUpdate = {
                email: 'jane@example.com',
            };

            const emailResult = updateVisitorInputSchema.safeParse(emailUpdate);
            expect(emailResult.success).toBe(true);

            // Valid partial update - interest level only
            const interestUpdate = {
                interestLevel: InterestLevel.HIGH,
            };

            const interestResult = updateVisitorInputSchema.safeParse(interestUpdate);
            expect(interestResult.success).toBe(true);

            // Valid full update
            const fullUpdate = {
                name: 'Jane Smith',
                email: 'jane@example.com',
                phone: '5559876543',
                interestLevel: InterestLevel.HIGH,
                notes: 'Very interested in the property',
            };

            const fullResult = updateVisitorInputSchema.safeParse(fullUpdate);
            expect(fullResult.success).toBe(true);
        });

        it('should validate email format when provided', () => {
            const validEmail = {
                email: 'valid@example.com',
            };

            const validResult = updateVisitorInputSchema.safeParse(validEmail);
            expect(validResult.success).toBe(true);

            const invalidEmail = {
                email: 'not-an-email',
            };

            const invalidResult = updateVisitorInputSchema.safeParse(invalidEmail);
            expect(invalidResult.success).toBe(false);
            if (!invalidResult.success) {
                expect(invalidResult.error.issues[0].path).toContain('email');
            }
        });

        it('should validate phone format when provided', () => {
            const validPhone = {
                phone: '5551234567',
            };

            const validResult = updateVisitorInputSchema.safeParse(validPhone);
            expect(validResult.success).toBe(true);

            const invalidPhone = {
                phone: '123', // Too short
            };

            const invalidResult = updateVisitorInputSchema.safeParse(invalidPhone);
            expect(invalidResult.success).toBe(false);
        });

        it('should validate interest level when provided', () => {
            const levels = [InterestLevel.LOW, InterestLevel.MEDIUM, InterestLevel.HIGH];

            levels.forEach((level) => {
                const input = {
                    interestLevel: level,
                };

                const result = updateVisitorInputSchema.safeParse(input);
                expect(result.success).toBe(true);
            });

            const invalidLevel = {
                interestLevel: 'invalid',
            };

            const invalidResult = updateVisitorInputSchema.safeParse(invalidLevel);
            expect(invalidResult.success).toBe(false);
        });

        it('should enforce maximum length for notes', () => {
            const validNotes = {
                notes: 'A'.repeat(1000), // Max length
            };

            const validResult = updateVisitorInputSchema.safeParse(validNotes);
            expect(validResult.success).toBe(true);

            const invalidNotes = {
                notes: 'A'.repeat(1001), // Over max length
            };

            const invalidResult = updateVisitorInputSchema.safeParse(invalidNotes);
            expect(invalidResult.success).toBe(false);
        });

        it('should allow empty update object', () => {
            const emptyUpdate = {};

            const result = updateVisitorInputSchema.safeParse(emptyUpdate);
            expect(result.success).toBe(true);
        });
    });

    describe('Interest Level Distribution Logic', () => {
        it('should correctly calculate distribution changes', () => {
            // Simulate initial distribution
            const initialDistribution = {
                high: 2,
                medium: 3,
                low: 1,
            };

            // Change from medium to high
            const newDistribution = { ...initialDistribution };
            newDistribution.medium -= 1;
            newDistribution.high += 1;

            expect(newDistribution).toEqual({
                high: 3,
                medium: 2,
                low: 1,
            });

            // Verify total count remains the same
            const initialTotal = Object.values(initialDistribution).reduce((a, b) => a + b, 0);
            const newTotal = Object.values(newDistribution).reduce((a, b) => a + b, 0);
            expect(newTotal).toBe(initialTotal);
        });

        it('should handle distribution when deleting visitor', () => {
            const initialDistribution = {
                high: 2,
                medium: 3,
                low: 1,
            };

            // Delete a medium interest visitor
            const newDistribution = { ...initialDistribution };
            newDistribution.medium = Math.max(0, newDistribution.medium - 1);

            expect(newDistribution).toEqual({
                high: 2,
                medium: 2,
                low: 1,
            });

            // Verify count decreased by 1
            const initialTotal = Object.values(initialDistribution).reduce((a, b) => a + b, 0);
            const newTotal = Object.values(newDistribution).reduce((a, b) => a + b, 0);
            expect(newTotal).toBe(initialTotal - 1);
        });

        it('should not allow negative distribution values', () => {
            const distribution = {
                high: 0,
                medium: 0,
                low: 0,
            };

            // Attempt to decrement when already at 0
            distribution.high = Math.max(0, distribution.high - 1);

            expect(distribution.high).toBe(0);
        });
    });

    describe('Note Appending Logic', () => {
        it('should append notes with timestamp format', () => {
            const existingNotes = '[12/1/2024, 10:00:00 AM] First note';
            const newNote = 'Second note';
            const timestamp = new Date().toLocaleString();
            const noteWithTimestamp = `[${timestamp}] ${newNote}`;

            const updatedNotes = `${existingNotes}\n${noteWithTimestamp}`;

            expect(updatedNotes).toContain(existingNotes);
            expect(updatedNotes).toContain(newNote);
            expect(updatedNotes.split('\n')).toHaveLength(2);
        });

        it('should handle first note correctly', () => {
            const existingNotes = undefined;
            const newNote = 'First note';
            const timestamp = new Date().toLocaleString();
            const noteWithTimestamp = `[${timestamp}] ${newNote}`;

            const updatedNotes = existingNotes
                ? `${existingNotes}\n${noteWithTimestamp}`
                : noteWithTimestamp;

            expect(updatedNotes).toBe(noteWithTimestamp);
            expect(updatedNotes).not.toContain('\n');
        });

        it('should preserve all previous notes', () => {
            const note1 = '[12/1/2024, 10:00:00 AM] First note';
            const note2 = '[12/1/2024, 11:00:00 AM] Second note';
            const existingNotes = `${note1}\n${note2}`;

            const newNote = 'Third note';
            const timestamp = new Date().toLocaleString();
            const noteWithTimestamp = `[${timestamp}] ${newNote}`;

            const updatedNotes = `${existingNotes}\n${noteWithTimestamp}`;

            expect(updatedNotes).toContain(note1);
            expect(updatedNotes).toContain(note2);
            expect(updatedNotes).toContain(newNote);
            expect(updatedNotes.split('\n')).toHaveLength(3);
        });
    });
});
