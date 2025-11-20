/**
 * Content Optimizer Service
 * Formats listing content for platform-specific requirements
 * 
 * Requirements Coverage:
 * - 7.2: Format content according to platform specifications
 * - 8.1: Facebook formatting (2000 chars, 10 images)
 * - 8.2: Instagram formatting (2200 chars, 10 images, square/portrait)
 * - 8.3: LinkedIn formatting (3000 chars, 9 images)
 * - 8.4: Preserve key listing information
 * - 8.5: Intelligent truncation maintaining readability
 */

import { Listing } from "../mls/types";
import {
    Platform,
    FormattedContent,
    OptimizedImage,
} from "./types";
import {
    PLATFORM_LIMITS,
    GENERAL_HASHTAG_RANGE,
    INSTAGRAM_HASHTAG_MAX,
    HASHTAG_CATEGORIES,
} from "./constants";

/**
 * ContentOptimizer Interface
 * Defines the contract for content optimization
 */
export interface ContentOptimizer {
    formatForPlatform(
        listing: Listing,
        platform: Platform
    ): Promise<FormattedContent>;
    generateHashtags(listing: Listing, platform: Platform): Promise<string[]>;
    optimizeImages(
        images: string[],
        platform: Platform
    ): Promise<OptimizedImage[]>;
}

/**
 * ContentOptimizerService
 * Implementation of ContentOptimizer interface
 */
export class ContentOptimizerService implements ContentOptimizer {
    /**
     * Format listing content for a specific platform
     * Requirement 7.2: Format content according to platform specifications
     * Requirement 8.1-8.3: Platform-specific character limits
     * Requirement 8.4: Preserve key information
     * Requirement 8.5: Intelligent truncation
     */
    async formatForPlatform(
        listing: Listing,
        platform: Platform
    ): Promise<FormattedContent> {
        const limits = PLATFORM_LIMITS[platform];

        // Build the content with key information first
        const keyInfo = this.buildKeyInformation(listing);
        const description = listing.description || "";

        // Combine key info and description
        let fullContent = `${keyInfo}\n\n${description}`;

        // Check if truncation is needed
        if (fullContent.length <= limits.maxCharacters) {
            return {
                text: fullContent.trim(),
                characterCount: fullContent.trim().length,
                truncated: false,
            };
        }

        // Truncate intelligently while preserving key information
        const truncatedContent = this.intelligentTruncate(
            keyInfo,
            description,
            limits.maxCharacters
        );

        return {
            text: truncatedContent.trim(),
            characterCount: truncatedContent.trim().length,
            truncated: true,
        };
    }

    /**
     * Generate relevant hashtags for a listing
     * Requirement 9.1: Analyze listing attributes
     * Requirement 9.2: Generate 5-15 hashtags for general platforms
     * Requirement 9.3: Generate up to 30 hashtags for Instagram
     * Requirement 9.4: Include location, property type, and feature tags
     */
    async generateHashtags(
        listing: Listing,
        platform: Platform
    ): Promise<string[]> {
        const hashtags: string[] = [];

        // Determine hashtag limit based on platform
        const maxHashtags = platform === "instagram"
            ? INSTAGRAM_HASHTAG_MAX
            : GENERAL_HASHTAG_RANGE.max;

        // 1. Location-based hashtags
        const locationTags = this.generateLocationHashtags(listing);
        hashtags.push(...locationTags);

        // 2. Property type hashtags
        const propertyTypeTags = this.generatePropertyTypeHashtags(listing);
        hashtags.push(...propertyTypeTags);

        // 3. Feature-specific hashtags
        const featureTags = this.generateFeatureHashtags(listing);
        hashtags.push(...featureTags);

        // 4. General real estate hashtags
        const generalTags = this.generateGeneralHashtags();
        hashtags.push(...generalTags);

        // Remove duplicates and limit to max
        const uniqueHashtags = Array.from(new Set(hashtags));

        // Ensure minimum hashtags
        const minHashtags = GENERAL_HASHTAG_RANGE.min;
        if (uniqueHashtags.length < minHashtags) {
            // Add more general tags if needed
            const additionalTags = [
                "#property",
                "#realestateinvesting",
                "#homebuyers",
                "#househunting",
                "#realestateagent",
            ];
            uniqueHashtags.push(...additionalTags.slice(0, minHashtags - uniqueHashtags.length));
        }

        return uniqueHashtags.slice(0, maxHashtags);
    }

    /**
     * Optimize images for platform-specific dimensions
     * Note: This method is deprecated in favor of using ImageOptimizerService directly
     * It's kept for backward compatibility but delegates to the image optimizer
     * 
     * Requirement 10.1: Facebook dimensions (1200x630)
     * Requirement 10.2: Instagram dimensions (1080x1080 or 1080x1350)
     * Requirement 10.3: LinkedIn dimensions (1200x627)
     * Requirement 10.4: File size under 5MB
     * 
     * @deprecated Use ImageOptimizerService.optimizeImages() directly for full functionality
     */
    async optimizeImages(
        images: string[],
        platform: Platform
    ): Promise<OptimizedImage[]> {
        // This is a placeholder implementation
        // For actual image optimization, use ImageOptimizerService directly
        // which requires userId and listingId parameters

        const limits = PLATFORM_LIMITS[platform];
        const maxImages = limits.maxImages;

        // Limit number of images
        const imagesToOptimize = images.slice(0, maxImages);

        // Return metadata only - actual optimization requires ImageOptimizerService
        const optimizedImages: OptimizedImage[] = imagesToOptimize.map((url) => {
            const dimensions = limits.imageDimensions[0]; // Use first dimension option

            return {
                originalUrl: url,
                optimizedUrl: url, // Would be S3 URL of optimized image
                width: dimensions.width,
                height: dimensions.height,
                fileSize: limits.maxFileSize, // Placeholder
            };
        });

        return optimizedImages;
    }

    /**
     * Private helper methods
     */

    /**
     * Build key information string with price, address, and features
     * Requirement 8.4: Preserve key listing information
     */
    private buildKeyInformation(listing: Listing): string {
        const parts: string[] = [];

        // Price
        const formattedPrice = this.formatPrice(listing.price);
        parts.push(`💰 ${formattedPrice}`);

        // Property details
        const details = `${listing.bedrooms} bed | ${listing.bathrooms} bath | ${this.formatSquareFeet(listing.squareFeet)}`;
        parts.push(`🏠 ${details}`);

        // Address
        const address = `${listing.address.city}, ${listing.address.state}`;
        parts.push(`📍 ${address}`);

        // Property type
        parts.push(`🏡 ${listing.propertyType}`);

        // Top features (limit to 3)
        if (listing.features && listing.features.length > 0) {
            const topFeatures = listing.features.slice(0, 3).join(" • ");
            parts.push(`✨ ${topFeatures}`);
        }

        return parts.join("\n");
    }

    /**
     * Intelligently truncate content while preserving key information
     * Requirement 8.5: Intelligent truncation maintaining readability
     */
    private intelligentTruncate(
        keyInfo: string,
        description: string,
        maxCharacters: number
    ): string {
        // Always preserve key information
        const keyInfoLength = keyInfo.length;

        // Calculate available space for description
        const separator = "\n\n";
        const ellipsis = "...";
        const availableSpace = maxCharacters - keyInfoLength - separator.length - ellipsis.length;

        if (availableSpace <= 0) {
            // If key info alone exceeds limit, return just key info
            return keyInfo;
        }

        if (description.length <= availableSpace) {
            return `${keyInfo}${separator}${description}`;
        }

        // Truncate description at sentence boundary
        const truncatedDescription = this.truncateAtSentence(description, availableSpace);

        return `${keyInfo}${separator}${truncatedDescription}${ellipsis}`;
    }

    /**
     * Truncate text at the last complete sentence within the character limit
     */
    private truncateAtSentence(text: string, maxLength: number): string {
        if (text.length <= maxLength) {
            return text;
        }

        // Find the last sentence boundary (., !, ?) within the limit
        const truncated = text.substring(0, maxLength);
        const sentenceEndings = /[.!?]\s/g;
        let lastSentenceEnd = -1;
        let match;

        while ((match = sentenceEndings.exec(truncated)) !== null) {
            lastSentenceEnd = match.index + 1;
        }

        if (lastSentenceEnd > 0) {
            return text.substring(0, lastSentenceEnd).trim();
        }

        // If no sentence boundary found, truncate at last space
        const lastSpace = truncated.lastIndexOf(" ");
        if (lastSpace > 0) {
            return text.substring(0, lastSpace).trim();
        }

        // Fallback: hard truncate
        return truncated.trim();
    }

    /**
     * Generate location-based hashtags
     */
    private generateLocationHashtags(listing: Listing): string[] {
        const tags: string[] = [];
        const { city, state } = listing.address;

        if (city) {
            // City name (remove spaces and special characters)
            const cityTag = this.sanitizeHashtag(city);
            tags.push(`#${cityTag}`);
            tags.push(`#${cityTag}RealEstate`);
            tags.push(`#${cityTag}Homes`);
        }

        if (state) {
            const stateTag = this.sanitizeHashtag(state);
            tags.push(`#${stateTag}`);
            tags.push(`#${stateTag}RealEstate`);
        }

        return tags;
    }

    /**
     * Generate property type hashtags
     */
    private generatePropertyTypeHashtags(listing: Listing): string[] {
        const tags: string[] = [];
        const propertyType = listing.propertyType.toLowerCase();

        // Property type specific
        const typeTag = this.sanitizeHashtag(propertyType);
        tags.push(`#${typeTag}`);
        tags.push(`#${typeTag}ForSale`);

        // Bedroom count
        if (listing.bedrooms > 0) {
            tags.push(`#${listing.bedrooms}Bedroom`);
            tags.push(`#${listing.bedrooms}Bed`);
        }

        return tags;
    }

    /**
     * Generate feature-specific hashtags
     */
    private generateFeatureHashtags(listing: Listing): string[] {
        const tags: string[] = [];

        if (!listing.features || listing.features.length === 0) {
            return tags;
        }

        // Extract keywords from features
        const featureKeywords = [
            "pool",
            "garage",
            "fireplace",
            "hardwood",
            "updated",
            "renovated",
            "modern",
            "luxury",
            "waterfront",
            "view",
        ];

        for (const feature of listing.features) {
            const featureLower = feature.toLowerCase();
            for (const keyword of featureKeywords) {
                if (featureLower.includes(keyword)) {
                    const tag = this.sanitizeHashtag(keyword);
                    tags.push(`#${tag}`);
                }
            }
        }

        return tags;
    }

    /**
     * Generate general real estate hashtags
     */
    private generateGeneralHashtags(): string[] {
        return [
            "#realestate",
            "#realtor",
            "#forsale",
            "#dreamhome",
            "#homeforsale",
            "#realtorlife",
            "#luxuryhomes",
            "#househunting",
            "#newhome",
            "#realestateinvestor",
        ];
    }

    /**
     * Sanitize text for use in hashtags
     */
    private sanitizeHashtag(text: string): string {
        return text
            .replace(/[^a-zA-Z0-9]/g, "")
            .replace(/\s+/g, "")
            .toLowerCase();
    }

    /**
     * Format price with currency symbol and commas
     */
    private formatPrice(price: number): string {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    }

    /**
     * Format square feet with commas
     */
    private formatSquareFeet(sqft: number): string {
        return `${new Intl.NumberFormat("en-US").format(sqft)} sq ft`;
    }
}

/**
 * Factory function to create content optimizer
 */
export function createContentOptimizer(): ContentOptimizer {
    return new ContentOptimizerService();
}
