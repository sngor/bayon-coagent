import { describe, it, expect } from '@jest/globals';
import {
    GenerateSocialMediaImageInputSchema,
    getRecommendedAspectRatio,
    getDimensionsFromAspectRatio,
    SocialMediaAspectRatio,
} from '@/ai/schemas/social-media-image-schemas';

describe('Social Media Image Generation Schemas', () => {
    describe('GenerateSocialMediaImageInputSchema', () => {
        it('should validate correct input', () => {
            const validInput = {
                topic: 'Luxury home in Miami',
                platform: 'instagram',
                aspectRatio: '1:1',
                style: 'luxury' as const,
                includeText: false,
                numberOfImages: 3,
            };

            const result = GenerateSocialMediaImageInputSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });

        it('should reject invalid style', () => {
            const invalidInput = {
                topic: 'Test topic',
                aspectRatio: '1:1',
                style: 'invalid-style',
                numberOfImages: 3,
            };

            const result = GenerateSocialMediaImageInputSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it('should use default style and numberOfImages when not provided', () => {
            const input = {
                topic: 'Test topic',
                aspectRatio: '1:1',
            };

            const result = GenerateSocialMediaImageInputSchema.safeParse(input);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.style).toBe('professional');
                expect(result.data.numberOfImages).toBe(3);
            }
        });

        it('should reject numberOfImages outside valid range', () => {
            const invalidInput = {
                topic: 'Test topic',
                aspectRatio: '1:1',
                numberOfImages: 5,
            };

            const result = GenerateSocialMediaImageInputSchema.safeParse(invalidInput);
            expect(result.success).toBe(false);
        });

        it('should accept numberOfImages within valid range', () => {
            const validInput = {
                topic: 'Test topic',
                aspectRatio: '1:1',
                numberOfImages: 2,
            };

            const result = GenerateSocialMediaImageInputSchema.safeParse(validInput);
            expect(result.success).toBe(true);
        });
    });

    describe('getRecommendedAspectRatio', () => {
        it('should return correct aspect ratio for Instagram', () => {
            expect(getRecommendedAspectRatio('instagram')).toBe(SocialMediaAspectRatio.SQUARE);
        });

        it('should return correct aspect ratio for Twitter', () => {
            expect(getRecommendedAspectRatio('twitter')).toBe(SocialMediaAspectRatio.LANDSCAPE);
        });

        it('should return correct aspect ratio for LinkedIn', () => {
            expect(getRecommendedAspectRatio('linkedin')).toBe(SocialMediaAspectRatio.LANDSCAPE);
        });

        it('should return square as default for unknown platform', () => {
            expect(getRecommendedAspectRatio('unknown')).toBe(SocialMediaAspectRatio.SQUARE);
        });

        it('should return square when no platform provided', () => {
            expect(getRecommendedAspectRatio()).toBe(SocialMediaAspectRatio.SQUARE);
        });
    });

    describe('getDimensionsFromAspectRatio', () => {
        it('should return correct dimensions for square (1:1)', () => {
            const dimensions = getDimensionsFromAspectRatio('1:1');
            expect(dimensions).toEqual({ width: 1024, height: 1024 });
        });

        it('should return correct dimensions for landscape (16:9)', () => {
            const dimensions = getDimensionsFromAspectRatio('16:9');
            expect(dimensions).toEqual({ width: 1280, height: 720 });
        });

        it('should return correct dimensions for story (9:16)', () => {
            const dimensions = getDimensionsFromAspectRatio('9:16');
            expect(dimensions).toEqual({ width: 720, height: 1280 });
        });

        it('should return correct dimensions for portrait (4:5)', () => {
            const dimensions = getDimensionsFromAspectRatio('4:5');
            expect(dimensions).toEqual({ width: 1024, height: 1280 });
        });

        it('should return correct dimensions for Pinterest (2:3)', () => {
            const dimensions = getDimensionsFromAspectRatio('2:3');
            expect(dimensions).toEqual({ width: 1000, height: 1500 });
        });

        it('should return square dimensions for unknown aspect ratio', () => {
            const dimensions = getDimensionsFromAspectRatio('unknown');
            expect(dimensions).toEqual({ width: 1024, height: 1024 });
        });
    });
});
