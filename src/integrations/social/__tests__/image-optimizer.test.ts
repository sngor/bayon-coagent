/**
 * Image Optimizer Service - Unit Tests
 * 
 * Tests for image optimization functionality
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { ImageOptimizerService } from "../image-optimizer";
import { PLATFORM_LIMITS } from "../constants";

describe("ImageOptimizerService", () => {
    let optimizer: ImageOptimizerService;

    beforeEach(() => {
        optimizer = new ImageOptimizerService();
    });

    describe("Platform dimension selection", () => {
        it("should return correct dimensions for Facebook", () => {
            const limits = PLATFORM_LIMITS.facebook;
            expect(limits.imageDimensions[0].width).toBe(1200);
            expect(limits.imageDimensions[0].height).toBe(630);
        });

        it("should return correct dimensions for Instagram square", () => {
            const limits = PLATFORM_LIMITS.instagram;
            expect(limits.imageDimensions[0].width).toBe(1080);
            expect(limits.imageDimensions[0].height).toBe(1080);
        });

        it("should return correct dimensions for Instagram portrait", () => {
            const limits = PLATFORM_LIMITS.instagram;
            expect(limits.imageDimensions[1].width).toBe(1080);
            expect(limits.imageDimensions[1].height).toBe(1350);
        });

        it("should return correct dimensions for LinkedIn", () => {
            const limits = PLATFORM_LIMITS.linkedin;
            expect(limits.imageDimensions[0].width).toBe(1200);
            expect(limits.imageDimensions[0].height).toBe(627);
        });
    });

    describe("Platform limits", () => {
        it("should enforce correct image limits for Facebook", () => {
            const limits = PLATFORM_LIMITS.facebook;
            expect(limits.maxImages).toBe(10);
            expect(limits.maxFileSize).toBe(5 * 1024 * 1024);
        });

        it("should enforce correct image limits for Instagram", () => {
            const limits = PLATFORM_LIMITS.instagram;
            expect(limits.maxImages).toBe(10);
            expect(limits.maxFileSize).toBe(5 * 1024 * 1024);
        });

        it("should enforce correct image limits for LinkedIn", () => {
            const limits = PLATFORM_LIMITS.linkedin;
            expect(limits.maxImages).toBe(9);
            expect(limits.maxFileSize).toBe(5 * 1024 * 1024);
        });
    });

    describe("S3 key extraction", () => {
        it("should extract key from path-style S3 URL", () => {
            const url =
                "https://s3.us-east-1.amazonaws.com/bucket/listings/user123/listing456/original/photo1.jpg";
            const key = (optimizer as any).extractS3Key(url);
            expect(key).toBe(
                "listings/user123/listing456/original/photo1.jpg"
            );
        });

        it("should extract key from virtual-hosted-style S3 URL", () => {
            const url =
                "https://bucket.s3.us-east-1.amazonaws.com/listings/user123/listing456/original/photo1.jpg";
            const key = (optimizer as any).extractS3Key(url);
            expect(key).toBe(
                "listings/user123/listing456/original/photo1.jpg"
            );
        });

        it("should extract key from LocalStack URL", () => {
            const url =
                "http://localhost:4566/bucket/listings/user123/listing456/original/photo1.jpg";
            const key = (optimizer as any).extractS3Key(url);
            expect(key).toBe(
                "listings/user123/listing456/original/photo1.jpg"
            );
        });

        it("should handle plain key as input", () => {
            const key = "listings/user123/listing456/original/photo1.jpg";
            const result = (optimizer as any).extractS3Key(key);
            expect(result).toBe(key);
        });
    });

    describe("Optimized key generation", () => {
        it("should generate correct key for Facebook", () => {
            const key = (optimizer as any).generateOptimizedKey(
                "user123",
                "listing456",
                "facebook",
                0
            );
            expect(key).toBe(
                "listings/user123/listing456/facebook/photo0.jpg"
            );
        });

        it("should generate correct key for Instagram", () => {
            const key = (optimizer as any).generateOptimizedKey(
                "user123",
                "listing456",
                "instagram",
                2
            );
            expect(key).toBe(
                "listings/user123/listing456/instagram/photo2.jpg"
            );
        });

        it("should generate correct key for LinkedIn", () => {
            const key = (optimizer as any).generateOptimizedKey(
                "user123",
                "listing456",
                "linkedin",
                5
            );
            expect(key).toBe(
                "listings/user123/listing456/linkedin/photo5.jpg"
            );
        });
    });

    describe("Dimension selection logic", () => {
        it("should select square dimensions for square images on Instagram", () => {
            const dimensions = (optimizer as any).selectDimensions(
                "instagram",
                2000,
                2000
            );
            expect(dimensions.width).toBe(1080);
            expect(dimensions.height).toBe(1080);
        });

        it("should select portrait dimensions for portrait images on Instagram", () => {
            const dimensions = (optimizer as any).selectDimensions(
                "instagram",
                1000,
                1500
            );
            expect(dimensions.width).toBe(1080);
            expect(dimensions.height).toBe(1350);
        });

        it("should select square dimensions for landscape images on Instagram", () => {
            const dimensions = (optimizer as any).selectDimensions(
                "instagram",
                2000,
                1000
            );
            expect(dimensions.width).toBe(1080);
            expect(dimensions.height).toBe(1080);
        });

        it("should return single dimension for Facebook", () => {
            const dimensions = (optimizer as any).selectDimensions(
                "facebook",
                2000,
                1500
            );
            expect(dimensions.width).toBe(1200);
            expect(dimensions.height).toBe(630);
        });

        it("should return single dimension for LinkedIn", () => {
            const dimensions = (optimizer as any).selectDimensions(
                "linkedin",
                2000,
                1500
            );
            expect(dimensions.width).toBe(1200);
            expect(dimensions.height).toBe(627);
        });
    });
});
