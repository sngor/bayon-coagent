/**
 * Content Optimizer Unit Tests
 * Tests for platform-specific content formatting, hashtag generation, and image optimization
 */

import { ContentOptimizerService } from "../content-optimizer";
import { Listing } from "../../mls/types";
import { Platform } from "../types";

describe("ContentOptimizerService", () => {
    let optimizer: ContentOptimizerService;

    beforeEach(() => {
        optimizer = new ContentOptimizerService();
    });

    // Helper function to create a sample listing
    const createSampleListing = (overrides?: Partial<Listing>): Listing => ({
        mlsId: "test-123",
        mlsNumber: "MLS-123456",
        address: {
            street: "123 Main St",
            city: "Los Angeles",
            state: "CA",
            zipCode: "90001",
            country: "US",
        },
        price: 750000,
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 2000,
        propertyType: "Single Family",
        status: "active",
        listDate: "2024-01-01",
        description: "Beautiful home in a great neighborhood. This stunning property features modern updates throughout, including a gourmet kitchen with stainless steel appliances, hardwood floors, and a spacious master suite. The backyard is perfect for entertaining with a large patio and mature landscaping.",
        photos: [
            { url: "https://example.com/photo1.jpg", order: 0 },
            { url: "https://example.com/photo2.jpg", order: 1 },
        ],
        features: ["Pool", "Garage", "Fireplace", "Hardwood Floors"],
        ...overrides,
    });

    describe("formatForPlatform", () => {
        it("should format content for Facebook within character limit", async () => {
            const listing = createSampleListing();
            const result = await optimizer.formatForPlatform(listing, "facebook");

            expect(result.characterCount).toBeLessThanOrEqual(2000);
            expect(result.text).toContain("$750,000");
            expect(result.text).toContain("3 bed");
            expect(result.text).toContain("2 bath");
            expect(result.text).toContain("Los Angeles, CA");
        });

        it("should format content for Instagram within character limit", async () => {
            const listing = createSampleListing();
            const result = await optimizer.formatForPlatform(listing, "instagram");

            expect(result.characterCount).toBeLessThanOrEqual(2200);
            expect(result.text).toContain("$750,000");
            expect(result.text).toContain("Los Angeles, CA");
        });

        it("should format content for LinkedIn within character limit", async () => {
            const listing = createSampleListing();
            const result = await optimizer.formatForPlatform(listing, "linkedin");

            expect(result.characterCount).toBeLessThanOrEqual(3000);
            expect(result.text).toContain("$750,000");
            expect(result.text).toContain("Los Angeles, CA");
        });

        it("should preserve key information (price, address, features)", async () => {
            const listing = createSampleListing();
            const result = await optimizer.formatForPlatform(listing, "facebook");

            // Check for price
            expect(result.text).toContain("$750,000");

            // Check for address
            expect(result.text).toContain("Los Angeles");
            expect(result.text).toContain("CA");

            // Check for property details
            expect(result.text).toContain("3 bed");
            expect(result.text).toContain("2 bath");
            expect(result.text).toContain("2,000 sq ft");

            // Check for features
            expect(result.text).toContain("Pool");
        });

        it("should not truncate short content", async () => {
            const listing = createSampleListing({
                description: "Short description.",
            });
            const result = await optimizer.formatForPlatform(listing, "facebook");

            expect(result.truncated).toBe(false);
            expect(result.text).toContain("Short description.");
        });

        it("should truncate long content intelligently", async () => {
            const longDescription = "This is a sentence. ".repeat(200); // Very long description
            const listing = createSampleListing({
                description: longDescription,
            });
            const result = await optimizer.formatForPlatform(listing, "facebook");

            expect(result.truncated).toBe(true);
            expect(result.characterCount).toBeLessThanOrEqual(2000);
            // Should still contain key information
            expect(result.text).toContain("$750,000");
            expect(result.text).toContain("Los Angeles, CA");
        });

        it("should truncate at sentence boundaries when possible", async () => {
            const listing = createSampleListing({
                description: "First sentence. Second sentence. Third sentence. " + "Word ".repeat(500),
            });
            const result = await optimizer.formatForPlatform(listing, "facebook");

            if (result.truncated) {
                // Should end with a period or ellipsis
                expect(result.text).toMatch(/[.!?]\.\.\.?$/);
            }
        });

        it("should handle listings without description", async () => {
            const listing = createSampleListing({
                description: undefined,
            });
            const result = await optimizer.formatForPlatform(listing, "facebook");

            expect(result.text).toContain("$750,000");
            expect(result.text).toContain("Los Angeles, CA");
            expect(result.truncated).toBe(false);
        });

        it("should handle listings without features", async () => {
            const listing = createSampleListing({
                features: [],
            });
            const result = await optimizer.formatForPlatform(listing, "facebook");

            expect(result.text).toContain("$750,000");
            expect(result.text).toContain("Los Angeles, CA");
        });
    });

    describe("generateHashtags", () => {
        it("should generate 5-15 hashtags for Facebook", async () => {
            const listing = createSampleListing();
            const hashtags = await optimizer.generateHashtags(listing, "facebook");

            expect(hashtags.length).toBeGreaterThanOrEqual(5);
            expect(hashtags.length).toBeLessThanOrEqual(15);
        });

        it("should generate 5-15 hashtags for LinkedIn", async () => {
            const listing = createSampleListing();
            const hashtags = await optimizer.generateHashtags(listing, "linkedin");

            expect(hashtags.length).toBeGreaterThanOrEqual(5);
            expect(hashtags.length).toBeLessThanOrEqual(15);
        });

        it("should generate up to 30 hashtags for Instagram", async () => {
            const listing = createSampleListing();
            const hashtags = await optimizer.generateHashtags(listing, "instagram");

            expect(hashtags.length).toBeGreaterThanOrEqual(5);
            expect(hashtags.length).toBeLessThanOrEqual(30);
        });

        it("should include location-based hashtags", async () => {
            const listing = createSampleListing();
            const hashtags = await optimizer.generateHashtags(listing, "facebook");

            const locationTags = hashtags.filter(
                (tag) => tag.includes("losangeles") || tag.includes("ca")
            );
            expect(locationTags.length).toBeGreaterThan(0);
        });

        it("should include property-type hashtags", async () => {
            const listing = createSampleListing();
            const hashtags = await optimizer.generateHashtags(listing, "facebook");

            const propertyTypeTags = hashtags.filter(
                (tag) => tag.includes("singlefamily") || tag.includes("3bed")
            );
            expect(propertyTypeTags.length).toBeGreaterThan(0);
        });

        it("should include feature-specific hashtags", async () => {
            const listing = createSampleListing({
                features: ["Pool", "Garage", "Fireplace"],
            });
            const hashtags = await optimizer.generateHashtags(listing, "facebook");

            const featureTags = hashtags.filter(
                (tag) => tag.includes("pool") || tag.includes("garage") || tag.includes("fireplace")
            );
            expect(featureTags.length).toBeGreaterThan(0);
        });

        it("should include general real estate hashtags", async () => {
            const listing = createSampleListing();
            const hashtags = await optimizer.generateHashtags(listing, "facebook");

            const generalTags = hashtags.filter(
                (tag) => tag === "#realestate" || tag === "#realtor" || tag === "#forsale"
            );
            expect(generalTags.length).toBeGreaterThan(0);
        });

        it("should not include duplicate hashtags", async () => {
            const listing = createSampleListing();
            const hashtags = await optimizer.generateHashtags(listing, "facebook");

            const uniqueHashtags = new Set(hashtags);
            expect(uniqueHashtags.size).toBe(hashtags.length);
        });

        it("should sanitize hashtags (remove spaces and special characters)", async () => {
            const listing = createSampleListing({
                address: {
                    street: "123 Main St",
                    city: "Los Angeles",
                    state: "CA",
                    zipCode: "90001",
                    country: "US",
                },
            });
            const hashtags = await optimizer.generateHashtags(listing, "facebook");

            // All hashtags should start with # and contain no spaces
            hashtags.forEach((tag) => {
                expect(tag).toMatch(/^#[a-z0-9]+$/i);
            });
        });

        it("should generate diverse hashtag categories", async () => {
            const listing = createSampleListing();
            const hashtags = await optimizer.generateHashtags(listing, "instagram");

            // Should have location, property type, features, and general tags
            const hasLocation = hashtags.some((tag) => tag.includes("losangeles"));
            const hasPropertyType = hashtags.some((tag) => tag.includes("bed") || tag.includes("bedroom") || tag.includes("singlefamily"));
            const hasFeature = hashtags.some((tag) => tag.includes("pool"));
            const hasGeneral = hashtags.some((tag) => tag === "#realestate");

            expect(hasLocation).toBe(true);
            expect(hasPropertyType).toBe(true);
            expect(hasFeature).toBe(true);
            expect(hasGeneral).toBe(true);
        });
    });

    describe("optimizeImages", () => {
        it("should limit images to platform maximum for Facebook", async () => {
            const images = Array.from({ length: 15 }, (_, i) => `https://example.com/photo${i}.jpg`);
            const result = await optimizer.optimizeImages(images, "facebook");

            expect(result.length).toBeLessThanOrEqual(10);
        });

        it("should limit images to platform maximum for Instagram", async () => {
            const images = Array.from({ length: 15 }, (_, i) => `https://example.com/photo${i}.jpg`);
            const result = await optimizer.optimizeImages(images, "instagram");

            expect(result.length).toBeLessThanOrEqual(10);
        });

        it("should limit images to platform maximum for LinkedIn", async () => {
            const images = Array.from({ length: 15 }, (_, i) => `https://example.com/photo${i}.jpg`);
            const result = await optimizer.optimizeImages(images, "linkedin");

            expect(result.length).toBeLessThanOrEqual(9);
        });

        it("should return correct dimensions for Facebook", async () => {
            const images = ["https://example.com/photo1.jpg"];
            const result = await optimizer.optimizeImages(images, "facebook");

            expect(result[0].width).toBe(1200);
            expect(result[0].height).toBe(630);
        });

        it("should return correct dimensions for Instagram", async () => {
            const images = ["https://example.com/photo1.jpg"];
            const result = await optimizer.optimizeImages(images, "instagram");

            // Instagram can be square (1080x1080) or portrait (1080x1350)
            expect(result[0].width).toBe(1080);
            expect([1080, 1350]).toContain(result[0].height);
        });

        it("should return correct dimensions for LinkedIn", async () => {
            const images = ["https://example.com/photo1.jpg"];
            const result = await optimizer.optimizeImages(images, "linkedin");

            expect(result[0].width).toBe(1200);
            expect(result[0].height).toBe(627);
        });

        it("should include file size constraint", async () => {
            const images = ["https://example.com/photo1.jpg"];
            const result = await optimizer.optimizeImages(images, "facebook");

            expect(result[0].fileSize).toBeLessThanOrEqual(5 * 1024 * 1024); // 5MB
        });

        it("should handle empty image array", async () => {
            const images: string[] = [];
            const result = await optimizer.optimizeImages(images, "facebook");

            expect(result).toEqual([]);
        });

        it("should preserve original URLs", async () => {
            const images = ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"];
            const result = await optimizer.optimizeImages(images, "facebook");

            expect(result[0].originalUrl).toBe(images[0]);
            expect(result[1].originalUrl).toBe(images[1]);
        });
    });

    describe("Edge Cases", () => {
        it("should handle very high prices", async () => {
            const listing = createSampleListing({
                price: 15000000, // $15M
            });
            const result = await optimizer.formatForPlatform(listing, "facebook");

            expect(result.text).toContain("$15,000,000");
        });

        it("should handle zero bedrooms (studio)", async () => {
            const listing = createSampleListing({
                bedrooms: 0,
            });
            const result = await optimizer.formatForPlatform(listing, "facebook");

            expect(result.text).toContain("0 bed");
        });

        it("should handle large square footage", async () => {
            const listing = createSampleListing({
                squareFeet: 10000,
            });
            const result = await optimizer.formatForPlatform(listing, "facebook");

            expect(result.text).toContain("10,000 sq ft");
        });

        it("should handle listings with many features", async () => {
            const listing = createSampleListing({
                features: Array.from({ length: 20 }, (_, i) => `Feature ${i + 1}`),
            });
            const result = await optimizer.formatForPlatform(listing, "facebook");

            // Should only show top 3 features in key info
            expect(result.text).toContain("Feature 1");
            expect(result.text).toContain("Feature 2");
            expect(result.text).toContain("Feature 3");
        });

        it("should handle special characters in city names", async () => {
            const listing = createSampleListing({
                address: {
                    street: "123 Main St",
                    city: "St. Louis",
                    state: "MO",
                    zipCode: "63101",
                    country: "US",
                },
            });
            const hashtags = await optimizer.generateHashtags(listing, "facebook");

            // Should sanitize special characters
            const cityTags = hashtags.filter((tag) => tag.includes("stlouis"));
            expect(cityTags.length).toBeGreaterThan(0);
        });
    });
});
