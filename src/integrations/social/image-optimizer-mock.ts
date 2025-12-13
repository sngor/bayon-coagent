/**
 * Mock Image Optimizer Service
 * Temporary replacement for Sharp-based image optimizer
 * Returns original images without optimization
 */

import { Platform, OptimizedImage } from "./types";

/**
 * ImageOptimizer Interface
 * Defines the contract for image optimization
 */
export interface ImageOptimizer {
    optimizeImages(
        images: string[],
        platform: Platform,
        listingId: string,
        userId: string
    ): Promise<OptimizedImage[]>;
}

/**
 * Mock ImageOptimizerService
 * Returns original images without optimization
 */
export class ImageOptimizerService implements ImageOptimizer {
    /**
     * Mock optimize images - returns original images
     */
    async optimizeImages(
        images: string[],
        platform: Platform,
        listingId: string,
        userId: string
    ): Promise<OptimizedImage[]> {
        console.warn("Using mock image optimizer - images will not be optimized");

        // Return original images as "optimized"
        return images.map((url, index) => ({
            originalUrl: url,
            optimizedUrl: url,
            width: 1200,
            height: 630,
            fileSize: 0,
        }));
    }
}

/**
 * Factory function to create mock image optimizer
 */
export function createImageOptimizer(): ImageOptimizer {
    return new ImageOptimizerService();
}