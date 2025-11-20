/**
 * Image Optimizer Service
 * Optimizes images for platform-specific requirements
 * 
 * Requirements Coverage:
 * - 10.1: Facebook optimization (1200x630px)
 * - 10.2: Instagram optimization (1080x1080px square, 1080x1350px portrait)
 * - 10.3: LinkedIn optimization (1200x627px)
 * - 10.4: File size compression to under 5MB
 * - 10.5: Error handling for optimization failures
 */

import sharp from "sharp";
import { Platform, OptimizedImage } from "./types";
import { PLATFORM_LIMITS, S3_IMAGE_PATHS } from "./constants";
import { uploadFile, downloadFile } from "@/aws/s3/client";

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
 * ImageOptimizerService
 * Implementation of ImageOptimizer interface
 */
export class ImageOptimizerService implements ImageOptimizer {
    /**
     * Optimize images for a specific platform
     * Requirement 10.1: Facebook dimensions (1200x630)
     * Requirement 10.2: Instagram dimensions (1080x1080 or 1080x1350)
     * Requirement 10.3: LinkedIn dimensions (1200x627)
     * Requirement 10.4: File size under 5MB
     * Requirement 10.5: Error handling for optimization failures
     */
    async optimizeImages(
        images: string[],
        platform: Platform,
        listingId: string,
        userId: string
    ): Promise<OptimizedImage[]> {
        const limits = PLATFORM_LIMITS[platform];
        const maxImages = limits.maxImages;

        // Limit number of images
        const imagesToOptimize = images.slice(0, maxImages);

        // Process images in parallel with concurrency limit
        const optimizedImages: OptimizedImage[] = [];
        const MAX_CONCURRENT = 3;

        for (let i = 0; i < imagesToOptimize.length; i += MAX_CONCURRENT) {
            const batch = imagesToOptimize.slice(i, i + MAX_CONCURRENT);
            const batchResults = await Promise.allSettled(
                batch.map((url, index) =>
                    this.optimizeImage(
                        url,
                        platform,
                        listingId,
                        userId,
                        i + index
                    )
                )
            );

            // Collect successful optimizations and log failures
            for (const result of batchResults) {
                if (result.status === "fulfilled" && result.value) {
                    optimizedImages.push(result.value);
                } else if (result.status === "rejected") {
                    // Requirement 10.5: Error handling for optimization failures
                    console.error(
                        `Image optimization failed: ${result.reason}`
                    );
                    // Continue with other images - don't fail the entire batch
                }
            }
        }

        return optimizedImages;
    }

    /**
     * Optimize a single image for a platform
     */
    private async optimizeImage(
        originalUrl: string,
        platform: Platform,
        listingId: string,
        userId: string,
        imageIndex: number
    ): Promise<OptimizedImage | null> {
        try {
            const limits = PLATFORM_LIMITS[platform];

            // Download the original image from S3
            const imageKey = this.extractS3Key(originalUrl);
            const imageBuffer = await downloadFile(imageKey);

            // Get image metadata
            const metadata = await sharp(imageBuffer).metadata();

            // Select appropriate dimensions for the platform
            const targetDimensions = this.selectDimensions(
                platform,
                metadata.width || 0,
                metadata.height || 0
            );

            // Optimize the image
            const optimizedBuffer = await this.processImage(
                imageBuffer,
                targetDimensions.width,
                targetDimensions.height,
                limits.maxFileSize
            );

            // Generate S3 key for optimized image
            const optimizedKey = this.generateOptimizedKey(
                userId,
                listingId,
                platform,
                imageIndex
            );

            // Upload optimized image to S3
            const optimizedUrl = await uploadFile(
                optimizedKey,
                optimizedBuffer,
                "image/jpeg"
            );

            // Get final file size
            const finalSize = optimizedBuffer.length;

            return {
                originalUrl,
                optimizedUrl,
                width: targetDimensions.width,
                height: targetDimensions.height,
                fileSize: finalSize,
            };
        } catch (error) {
            // Requirement 10.5: Error handling for optimization failures
            console.error(
                `Failed to optimize image ${originalUrl}:`,
                error
            );
            throw error;
        }
    }

    /**
     * Select appropriate dimensions based on platform and original image aspect ratio
     */
    private selectDimensions(
        platform: Platform,
        originalWidth: number,
        originalHeight: number
    ): { width: number; height: number } {
        const limits = PLATFORM_LIMITS[platform];
        const dimensions = limits.imageDimensions;

        // For platforms with multiple dimension options (Instagram)
        if (dimensions.length > 1) {
            const originalAspectRatio = originalWidth / originalHeight;

            // Instagram: Choose square (1:1) or portrait (4:5) based on original
            if (platform === "instagram") {
                // If image is more portrait-oriented (taller), use portrait dimensions
                if (originalAspectRatio < 1) {
                    return dimensions[1]; // Portrait 1080x1350
                }
                // Otherwise use square
                return dimensions[0]; // Square 1080x1080
            }
        }

        // For platforms with single dimension option (Facebook, LinkedIn)
        return dimensions[0];
    }

    /**
     * Process image with sharp: resize, compress, and ensure file size is under limit
     * Requirement 10.4: File size compression to under 5MB
     */
    private async processImage(
        buffer: Buffer,
        targetWidth: number,
        targetHeight: number,
        maxFileSize: number
    ): Promise<Buffer> {
        // Start with high quality
        let quality = 90;
        let optimizedBuffer: Buffer;

        // Resize and compress
        optimizedBuffer = await sharp(buffer)
            .resize(targetWidth, targetHeight, {
                fit: "cover",
                position: "center",
            })
            .jpeg({ quality, mozjpeg: true })
            .toBuffer();

        // If file size exceeds limit, reduce quality iteratively
        while (optimizedBuffer.length > maxFileSize && quality > 60) {
            quality -= 5;
            optimizedBuffer = await sharp(buffer)
                .resize(targetWidth, targetHeight, {
                    fit: "cover",
                    position: "center",
                })
                .jpeg({ quality, mozjpeg: true })
                .toBuffer();
        }

        // If still too large after reducing quality, throw error
        if (optimizedBuffer.length > maxFileSize) {
            throw new Error(
                `Unable to compress image below ${maxFileSize} bytes. Final size: ${optimizedBuffer.length} bytes`
            );
        }

        return optimizedBuffer;
    }

    /**
     * Extract S3 key from S3 URL
     */
    private extractS3Key(url: string): string {
        // Handle both path-style and virtual-hosted-style URLs
        // Path-style: https://s3.region.amazonaws.com/bucket/key
        // Virtual-hosted: https://bucket.s3.region.amazonaws.com/key
        // LocalStack: http://localhost:4566/bucket/key

        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;

            // Remove leading slash
            const parts = pathname.split("/").filter((p) => p);

            // For path-style URLs (s3.region.amazonaws.com or localhost)
            // First part is bucket name, rest is key
            if (
                urlObj.hostname.startsWith("s3.") ||
                urlObj.hostname.includes("localhost")
            ) {
                return parts.slice(1).join("/");
            }

            // For virtual-hosted style (bucket.s3.region.amazonaws.com)
            // Entire path is the key (no bucket in path)
            return parts.join("/");
        } catch (error) {
            // If URL parsing fails, assume it's already a key
            return url;
        }
    }

    /**
     * Generate S3 key for optimized image
     * Follows structure: listings/<userId>/<listingId>/<platform>/photo<index>.jpg
     */
    private generateOptimizedKey(
        userId: string,
        listingId: string,
        platform: Platform,
        imageIndex: number
    ): string {
        const platformPath = S3_IMAGE_PATHS[platform];
        return `listings/${userId}/${listingId}/${platformPath}/photo${imageIndex}.jpg`;
    }
}

/**
 * Factory function to create image optimizer
 */
export function createImageOptimizer(): ImageOptimizer {
    return new ImageOptimizerService();
}
