"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentOptimizerService = void 0;
exports.createContentOptimizer = createContentOptimizer;
const constants_1 = require("./constants");
class ContentOptimizerService {
    async formatForPlatform(listing, platform) {
        const limits = constants_1.PLATFORM_LIMITS[platform];
        const keyInfo = this.buildKeyInformation(listing);
        const description = listing.description || "";
        let fullContent = `${keyInfo}\n\n${description}`;
        if (fullContent.length <= limits.maxCharacters) {
            return {
                text: fullContent.trim(),
                characterCount: fullContent.trim().length,
                truncated: false,
            };
        }
        const truncatedContent = this.intelligentTruncate(keyInfo, description, limits.maxCharacters);
        return {
            text: truncatedContent.trim(),
            characterCount: truncatedContent.trim().length,
            truncated: true,
        };
    }
    async generateHashtags(listing, platform) {
        const hashtags = [];
        const maxHashtags = platform === "instagram"
            ? constants_1.INSTAGRAM_HASHTAG_MAX
            : constants_1.GENERAL_HASHTAG_RANGE.max;
        const locationTags = this.generateLocationHashtags(listing);
        hashtags.push(...locationTags);
        const propertyTypeTags = this.generatePropertyTypeHashtags(listing);
        hashtags.push(...propertyTypeTags);
        const featureTags = this.generateFeatureHashtags(listing);
        hashtags.push(...featureTags);
        const generalTags = this.generateGeneralHashtags();
        hashtags.push(...generalTags);
        const uniqueHashtags = Array.from(new Set(hashtags));
        const minHashtags = constants_1.GENERAL_HASHTAG_RANGE.min;
        if (uniqueHashtags.length < minHashtags) {
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
    async optimizeImages(images, platform) {
        const limits = constants_1.PLATFORM_LIMITS[platform];
        const maxImages = limits.maxImages;
        const imagesToOptimize = images.slice(0, maxImages);
        const optimizedImages = imagesToOptimize.map((url) => {
            const dimensions = limits.imageDimensions[0];
            return {
                originalUrl: url,
                optimizedUrl: url,
                width: dimensions.width,
                height: dimensions.height,
                fileSize: limits.maxFileSize,
            };
        });
        return optimizedImages;
    }
    buildKeyInformation(listing) {
        const parts = [];
        const formattedPrice = this.formatPrice(listing.price);
        parts.push(`💰 ${formattedPrice}`);
        const details = `${listing.bedrooms} bed | ${listing.bathrooms} bath | ${this.formatSquareFeet(listing.squareFeet)}`;
        parts.push(`🏠 ${details}`);
        const address = `${listing.address.city}, ${listing.address.state}`;
        parts.push(`📍 ${address}`);
        parts.push(`🏡 ${listing.propertyType}`);
        if (listing.features && listing.features.length > 0) {
            const topFeatures = listing.features.slice(0, 3).join(" • ");
            parts.push(`✨ ${topFeatures}`);
        }
        return parts.join("\n");
    }
    intelligentTruncate(keyInfo, description, maxCharacters) {
        const keyInfoLength = keyInfo.length;
        const separator = "\n\n";
        const ellipsis = "...";
        const availableSpace = maxCharacters - keyInfoLength - separator.length - ellipsis.length;
        if (availableSpace <= 0) {
            return keyInfo;
        }
        if (description.length <= availableSpace) {
            return `${keyInfo}${separator}${description}`;
        }
        const truncatedDescription = this.truncateAtSentence(description, availableSpace);
        return `${keyInfo}${separator}${truncatedDescription}${ellipsis}`;
    }
    truncateAtSentence(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
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
        const lastSpace = truncated.lastIndexOf(" ");
        if (lastSpace > 0) {
            return text.substring(0, lastSpace).trim();
        }
        return truncated.trim();
    }
    generateLocationHashtags(listing) {
        const tags = [];
        const { city, state } = listing.address;
        if (city) {
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
    generatePropertyTypeHashtags(listing) {
        const tags = [];
        const propertyType = listing.propertyType.toLowerCase();
        const typeTag = this.sanitizeHashtag(propertyType);
        tags.push(`#${typeTag}`);
        tags.push(`#${typeTag}ForSale`);
        if (listing.bedrooms > 0) {
            tags.push(`#${listing.bedrooms}Bedroom`);
            tags.push(`#${listing.bedrooms}Bed`);
        }
        return tags;
    }
    generateFeatureHashtags(listing) {
        const tags = [];
        if (!listing.features || listing.features.length === 0) {
            return tags;
        }
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
    generateGeneralHashtags() {
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
    sanitizeHashtag(text) {
        return text
            .replace(/[^a-zA-Z0-9]/g, "")
            .replace(/\s+/g, "")
            .toLowerCase();
    }
    formatPrice(price) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    }
    formatSquareFeet(sqft) {
        return `${new Intl.NumberFormat("en-US").format(sqft)} sq ft`;
    }
}
exports.ContentOptimizerService = ContentOptimizerService;
function createContentOptimizer() {
    return new ContentOptimizerService();
}
