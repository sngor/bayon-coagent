/**
 * Image Optimizer Service - Example Usage
 * 
 * This file demonstrates how to use the Image Optimizer Service
 * for optimizing listing images for social media platforms.
 */

import { createImageOptimizer } from "./image-optimizer";
import { Listing } from "../mls/types";
import { Platform } from "./types";

/**
 * Example 1: Basic Image Optimization
 * Optimize images for a single platform
 */
export async function basicImageOptimization() {
    const optimizer = createImageOptimizer();

    // Sample image URLs from S3
    const imageUrls = [
        "listings/user123/listing456/original/photo1.jpg",
        "listings/user123/listing456/original/photo2.jpg",
        "listings/user123/listing456/original/photo3.jpg",
    ];

    try {
        // Optimize for Instagram
        const optimizedImages = await optimizer.optimizeImages(
            imageUrls,
            "instagram",
            "listing456",
            "user123"
        );

        console.log("Optimized Images:", optimizedImages);
        // Output:
        // [
        //   {
        //     originalUrl: "listings/user123/listing456/original/photo1.jpg",
        //     optimizedUrl: "listings/user123/listing456/instagram/photo0.jpg",
        //     width: 1080,
        //     height: 1080,
        //     fileSize: 2456789
        //   },
        //   ...
        // ]

        return optimizedImages;
    } catch (error) {
        console.error("Image optimization failed:", error);
        throw error;
    }
}

/**
 * Example 2: Multi-Platform Optimization
 * Optimize the same images for multiple platforms
 */
export async function multiPlatformOptimization(
    listing: Listing,
    userId: string
) {
    const optimizer = createImageOptimizer();
    const platforms: Platform[] = ["facebook", "instagram", "linkedin"];

    const imageUrls = listing.photos.map((photo) => photo.url);

    const results: Record<string, any[]> = {
        facebook: [],
        instagram: [],
        linkedin: [],
    };

    // Optimize for each platform
    for (const platform of platforms) {
        try {
            const optimized = await optimizer.optimizeImages(
                imageUrls,
                platform,
                listing.mlsId,
                userId
            );

            results[platform] = optimized;

            console.log(
                `${platform}: Optimized ${optimized.length} images`
            );
        } catch (error) {
            console.error(
                `Failed to optimize for ${platform}:`,
                error
            );
            // Continue with other platforms
        }
    }

    return results;
}

/**
 * Example 3: Optimization with Error Handling
 * Handle individual image failures gracefully
 */
export async function optimizationWithErrorHandling(
    imageUrls: string[],
    platform: Platform,
    listingId: string,
    userId: string
) {
    const optimizer = createImageOptimizer();

    try {
        const optimizedImages = await optimizer.optimizeImages(
            imageUrls,
            platform,
            listingId,
            userId
        );

        // Check if all images were optimized
        if (optimizedImages.length < imageUrls.length) {
            console.warn(
                `Only ${optimizedImages.length} of ${imageUrls.length} images were optimized`
            );
        }

        // Verify file sizes
        const oversizedImages = optimizedImages.filter(
            (img) => img.fileSize > 5 * 1024 * 1024
        );

        if (oversizedImages.length > 0) {
            console.error(
                `${oversizedImages.length} images exceed 5MB limit`
            );
        }

        return {
            success: true,
            optimizedCount: optimizedImages.length,
            failedCount: imageUrls.length - optimizedImages.length,
            images: optimizedImages,
        };
    } catch (error) {
        console.error("Batch optimization failed:", error);
        return {
            success: false,
            optimizedCount: 0,
            failedCount: imageUrls.length,
            images: [],
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Example 4: Integration with Publishing Workflow
 * Complete workflow from listing to optimized images
 */
export async function publishingWorkflow(
    listing: Listing,
    userId: string,
    selectedPlatforms: Platform[]
) {
    const optimizer = createImageOptimizer();

    // Extract image URLs from listing
    const imageUrls = listing.photos.map((photo) => photo.url);

    if (imageUrls.length === 0) {
        throw new Error("No images available for optimization");
    }

    // Optimize for each selected platform
    const optimizationResults: Record<
        Platform,
        { success: boolean; images: any[] }
    > = {} as any;

    for (const platform of selectedPlatforms) {
        try {
            const optimized = await optimizer.optimizeImages(
                imageUrls,
                platform,
                listing.mlsId,
                userId
            );

            optimizationResults[platform] = {
                success: true,
                images: optimized,
            };

            console.log(
                `✓ ${platform}: ${optimized.length} images ready`
            );
        } catch (error) {
            console.error(`✗ ${platform}: Optimization failed`);
            optimizationResults[platform] = {
                success: false,
                images: [],
            };
        }
    }

    // Return results for publishing
    return {
        listingId: listing.mlsId,
        platforms: optimizationResults,
        totalImages: imageUrls.length,
    };
}

/**
 * Example 5: Batch Processing Multiple Listings
 * Optimize images for multiple listings at once
 */
export async function batchOptimizeListings(
    listings: Listing[],
    userId: string,
    platform: Platform
) {
    const optimizer = createImageOptimizer();
    const results = [];

    for (const listing of listings) {
        try {
            const imageUrls = listing.photos.map((photo) => photo.url);

            if (imageUrls.length === 0) {
                console.log(
                    `Skipping ${listing.mlsNumber}: No images`
                );
                continue;
            }

            const optimized = await optimizer.optimizeImages(
                imageUrls,
                platform,
                listing.mlsId,
                userId
            );

            results.push({
                listingId: listing.mlsId,
                mlsNumber: listing.mlsNumber,
                success: true,
                imageCount: optimized.length,
                images: optimized,
            });

            console.log(
                `✓ ${listing.mlsNumber}: ${optimized.length} images`
            );
        } catch (error) {
            console.error(
                `✗ ${listing.mlsNumber}: Failed`,
                error
            );
            results.push({
                listingId: listing.mlsId,
                mlsNumber: listing.mlsNumber,
                success: false,
                imageCount: 0,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error",
            });
        }
    }

    return {
        total: listings.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
    };
}

/**
 * Example 6: Verify Optimization Results
 * Check that optimized images meet platform requirements
 */
export async function verifyOptimization(
    imageUrls: string[],
    platform: Platform,
    listingId: string,
    userId: string
) {
    const optimizer = createImageOptimizer();

    const optimized = await optimizer.optimizeImages(
        imageUrls,
        platform,
        listingId,
        userId
    );

    // Platform-specific dimension checks
    const dimensionChecks: Record<string, any> = {
        facebook: { width: 1200, height: 630 },
        instagram: [
            { width: 1080, height: 1080 },
            { width: 1080, height: 1350 },
        ],
        linkedin: { width: 1200, height: 627 },
    };

    const maxFileSize = 5 * 1024 * 1024; // 5MB

    const validationResults = optimized.map((img) => {
        const checks = {
            dimensionsCorrect: false,
            fileSizeOk: img.fileSize <= maxFileSize,
            urlValid: img.optimizedUrl.length > 0,
        };

        // Check dimensions
        if (platform === "instagram") {
            const instagramDims = dimensionChecks.instagram as any[];
            checks.dimensionsCorrect = instagramDims.some(
                (dim) =>
                    img.width === dim.width && img.height === dim.height
            );
        } else {
            const dims = dimensionChecks[platform] as any;
            checks.dimensionsCorrect =
                img.width === dims.width && img.height === dims.height;
        }

        return {
            originalUrl: img.originalUrl,
            optimizedUrl: img.optimizedUrl,
            valid:
                checks.dimensionsCorrect &&
                checks.fileSizeOk &&
                checks.urlValid,
            checks,
        };
    });

    const allValid = validationResults.every((r) => r.valid);

    return {
        platform,
        allValid,
        totalImages: optimized.length,
        validImages: validationResults.filter((r) => r.valid).length,
        results: validationResults,
    };
}
