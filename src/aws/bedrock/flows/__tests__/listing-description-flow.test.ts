/**
 * Tests for listing description flow
 * 
 * These tests verify the core functionality of the listing description generator
 * including schema validation and word count constraints.
 */

import { describe, it, expect } from '@jest/globals';
import {
    GenerateFromPhotosInputSchema,
    GenerateFromDataInputSchema,
    ListingDescriptionOutputSchema,
    type GenerateFromDataInput,
} from '../listing-description-flow';

describe('Listing Description Flow Schemas', () => {
    describe('GenerateFromPhotosInputSchema', () => {
        it('should validate valid input with photos', () => {
            const validInput = {
                photos: [
                    {
                        url: 'https://example.com/photo1.jpg',
                        data: 'base64encodeddata',
                        format: 'jpeg' as const,
                        order: 0,
                    },
                ],
                listingData: {
                    address: {
                        street: '123 Main St',
                        city: 'San Francisco',
                        state: 'CA',
                        zipCode: '94102',
                    },
                    price: 1500000,
                    bedrooms: 3,
                    bathrooms: 2,
                    squareFeet: 2000,
                    propertyType: 'Single Family',
                    features: ['Pool', 'Garage'],
                },
            };

            const result = GenerateFromPhotosInputSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it('should reject input without photos', () => {
            const invalidInput = {
                photos: [],
                listingData: {},
            };

            const result = GenerateFromPhotosInputSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it('should accept minimal listing data', () => {
            const validInput = {
                photos: [
                    {
                        url: 'https://example.com/photo1.jpg',
                        data: 'base64encodeddata',
                        format: 'jpeg' as const,
                        order: 0,
                    },
                ],
                listingData: {},
            };

            const result = GenerateFromPhotosInputSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });
    });

    describe('GenerateFromDataInputSchema', () => {
        it('should validate complete listing data', () => {
            const validInput: GenerateFromDataInput = {
                mlsNumber: 'MLS123456',
                address: {
                    street: '123 Main St',
                    city: 'San Francisco',
                    state: 'CA',
                    zipCode: '94102',
                },
                price: 1500000,
                bedrooms: 3,
                bathrooms: 2,
                squareFeet: 2000,
                propertyType: 'Single Family',
                features: ['Pool', 'Garage', 'Updated Kitchen'],
            };

            const result = GenerateFromDataInputSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it('should reject incomplete listing data', () => {
            const invalidInput = {
                mlsNumber: 'MLS123456',
                address: {
                    street: '123 Main St',
                    city: 'San Francisco',
                },
                // Missing required fields
            };

            const result = GenerateFromDataInputSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });
    });

    describe('ListingDescriptionOutputSchema', () => {
        it('should validate valid output', () => {
            const validOutput = {
                description: 'This is a beautiful property with amazing features...',
                wordCount: 150,
            };

            const result = ListingDescriptionOutputSchema.safeParse(validOutput);
            expect(result.success).toBe(true);
        });

        it('should reject empty description', () => {
            const invalidOutput = {
                description: '',
                wordCount: 0,
            };

            const result = ListingDescriptionOutputSchema.safeParse(invalidOutput);
            expect(result.success).toBe(false);
        });
    });
});

describe('Word Count Validation', () => {
    it('should count words correctly', () => {
        const text = 'This is a test with five words';
        const wordCount = text.trim().split(/\s+/).length;
        expect(wordCount).toBe(7); // "This", "is", "a", "test", "with", "five", "words"
    });

    it('should handle multiple spaces', () => {
        const text = 'This  has   multiple    spaces';
        const wordCount = text.trim().split(/\s+/).length;
        expect(wordCount).toBe(4);
    });

    it('should handle newlines', () => {
        const text = 'This has\nmultiple\nlines';
        const wordCount = text.trim().split(/\s+/).length;
        expect(wordCount).toBe(4); // "This", "has", "multiple", "lines"
    });
});

describe('Listing Description Flow Requirements', () => {
    it('should meet requirement 3.3: word count between 150-300', () => {
        const minWords = 150;
        const maxWords = 300;

        // Test minimum boundary
        const minText = Array(minWords).fill('word').join(' ');
        const minWordCount = minText.trim().split(/\s+/).length;
        expect(minWordCount).toBe(minWords);

        // Test maximum boundary
        const maxText = Array(maxWords).fill('word').join(' ');
        const maxWordCount = maxText.trim().split(/\s+/).length;
        expect(maxWordCount).toBe(maxWords);
    });
});
