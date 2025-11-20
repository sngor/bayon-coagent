/**
 * Integration Schemas Test
 * Verify that all Zod schemas validate correctly
 */

import { describe, it, expect } from "@jest/globals";
import * as MLS from "../mls";
import * as Social from "../social";

describe("MLS Schemas", () => {
    it("should validate valid listing data", () => {
        const validListing = {
            mlsId: "MLS123",
            mlsNumber: "12345",
            address: {
                street: "123 Main St",
                city: "Los Angeles",
                state: "CA",
                zipCode: "90001",
                country: "US",
            },
            price: 500000,
            bedrooms: 3,
            bathrooms: 2.5,
            squareFeet: 2000,
            propertyType: "Single Family",
            status: "active" as const,
            listDate: "2024-01-01",
            description: "Beautiful home",
            photos: [
                { url: "https://example.com/photo1.jpg", order: 0 },
                { url: "https://example.com/photo2.jpg", caption: "Living room", order: 1 },
            ],
            features: ["Pool", "Garage", "Fireplace"],
        };

        const result = MLS.ListingSchema.safeParse(validListing);
        expect(result.success).toBe(true);
    });

    it("should reject invalid listing data", () => {
        const invalidListing = {
            mlsId: "",
            mlsNumber: "12345",
            address: {
                street: "123 Main St",
                city: "",
                state: "CA",
                zipCode: "90001",
            },
            price: -100,
            bedrooms: 3,
            bathrooms: 2,
            squareFeet: 2000,
            propertyType: "Single Family",
            status: "active",
            listDate: "2024-01-01",
            photos: [],
            features: [],
        };

        const result = MLS.ListingSchema.safeParse(invalidListing);
        expect(result.success).toBe(false);
    });

    it("should validate MLS credentials", () => {
        const validCredentials = {
            provider: "flexmls",
            username: "agent@example.com",
            password: "securepassword",
            mlsId: "MLS123",
        };

        const result = MLS.MLSCredentialsSchema.safeParse(validCredentials);
        expect(result.success).toBe(true);
    });
});

describe("Social Media Schemas", () => {
    it("should validate valid social post", () => {
        const validPost = {
            listingId: "listing123",
            content: "Check out this amazing property!",
            images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
            hashtags: ["#realestate", "#dreamhome", "#forsale"],
            platform: "facebook" as const,
        };

        const result = Social.SocialPostSchema.safeParse(validPost);
        expect(result.success).toBe(true);
    });

    it("should validate OAuth connection", () => {
        const validConnection = {
            id: "conn123",
            userId: "user123",
            platform: "instagram" as const,
            accessToken: "token123",
            refreshToken: "refresh123",
            expiresAt: Date.now() + 3600000,
            scope: ["instagram_basic", "instagram_content_publish"],
            platformUserId: "ig123",
            platformUsername: "agent_username",
            metadata: { businessAccountId: "ba123" },
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const result = Social.OAuthConnectionSchema.safeParse(validConnection);
        expect(result.success).toBe(true);
    });

    it("should validate performance metrics", () => {
        const validMetrics = {
            listingId: "listing123",
            date: "2024-01-15",
            views: 100,
            shares: 10,
            inquiries: 5,
            platforms: {
                facebook: {
                    views: 50,
                    shares: 5,
                    inquiries: 2,
                    clicks: 20,
                    engagement: 0.4,
                },
                instagram: {
                    views: 50,
                    shares: 5,
                    inquiries: 3,
                    clicks: 25,
                    engagement: 0.5,
                },
            },
            updatedAt: Date.now(),
        };

        const result = Social.PerformanceMetricsSchema.safeParse(validMetrics);
        expect(result.success).toBe(true);
    });

    it("should reject invalid date format", () => {
        const invalidMetrics = {
            listingId: "listing123",
            date: "01/15/2024", // Wrong format
            views: 100,
            shares: 10,
            inquiries: 5,
            platforms: {},
            updatedAt: Date.now(),
        };

        const result = Social.PerformanceMetricsSchema.safeParse(invalidMetrics);
        expect(result.success).toBe(false);
    });
});

describe("Platform Constants", () => {
    it("should have correct Facebook limits", () => {
        const fbLimits = Social.PLATFORM_LIMITS.facebook;
        expect(fbLimits.maxCharacters).toBe(2000);
        expect(fbLimits.maxImages).toBe(10);
        expect(fbLimits.maxHashtags).toBe(15);
        expect(fbLimits.imageDimensions[0].width).toBe(1200);
        expect(fbLimits.imageDimensions[0].height).toBe(630);
    });

    it("should have correct Instagram limits", () => {
        const igLimits = Social.PLATFORM_LIMITS.instagram;
        expect(igLimits.maxCharacters).toBe(2200);
        expect(igLimits.maxImages).toBe(10);
        expect(igLimits.maxHashtags).toBe(30);
        expect(igLimits.imageDimensions).toHaveLength(2); // Square and portrait
    });

    it("should have correct LinkedIn limits", () => {
        const liLimits = Social.PLATFORM_LIMITS.linkedin;
        expect(liLimits.maxCharacters).toBe(3000);
        expect(liLimits.maxImages).toBe(9);
        expect(liLimits.maxHashtags).toBe(15);
    });

    it("should have OAuth scopes for all platforms", () => {
        expect(Social.OAUTH_SCOPES.facebook).toBeDefined();
        expect(Social.OAUTH_SCOPES.instagram).toBeDefined();
        expect(Social.OAUTH_SCOPES.linkedin).toBeDefined();
    });
});
