/**
 * Content Optimizer Usage Examples
 * Demonstrates how to use the ContentOptimizerService
 */

import { createContentOptimizer } from "./content-optimizer";
import { Listing } from "../mls/types";
import { Platform } from "./types";

// Sample listing data
const sampleListing: Listing = {
    mlsId: "test-123",
    mlsNumber: "MLS-123456",
    address: {
        street: "123 Ocean View Drive",
        city: "Santa Monica",
        state: "CA",
        zipCode: "90401",
        country: "US",
    },
    price: 2500000,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 3200,
    propertyType: "Single Family",
    status: "active",
    listDate: "2024-01-15",
    description: `Stunning coastal contemporary home with breathtaking ocean views. This architectural masterpiece features an open floor plan with floor-to-ceiling windows, gourmet chef's kitchen with top-of-the-line appliances, and luxurious master suite with spa-like bathroom. The outdoor living space is perfect for entertaining with a heated infinity pool, built-in BBQ, and multiple seating areas. Located in one of Santa Monica's most desirable neighborhoods, just minutes from the beach, shopping, and dining.`,
    photos: [
        { url: "https://example.com/photos/exterior.jpg", order: 0 },
        { url: "https://example.com/photos/living-room.jpg", order: 1 },
        { url: "https://example.com/photos/kitchen.jpg", order: 2 },
        { url: "https://example.com/photos/master-bedroom.jpg", order: 3 },
        { url: "https://example.com/photos/pool.jpg", order: 4 },
    ],
    features: [
        "Ocean Views",
        "Infinity Pool",
        "Gourmet Kitchen",
        "Smart Home Technology",
        "Hardwood Floors",
        "Wine Cellar",
    ],
};

/**
 * Example 1: Format content for a single platform
 */
async function formatForSinglePlatform() {
    console.log("=== Example 1: Format for Facebook ===\n");

    const optimizer = createContentOptimizer();
    const formatted = await optimizer.formatForPlatform(sampleListing, "facebook");

    console.log("Formatted Content:");
    console.log(formatted.text);
    console.log(`\nCharacter Count: ${formatted.characterCount}/2000`);
    console.log(`Truncated: ${formatted.truncated}`);
}

/**
 * Example 2: Generate hashtags for different platforms
 */
async function generateHashtagsExample() {
    console.log("\n=== Example 2: Generate Hashtags ===\n");

    const optimizer = createContentOptimizer();

    // Facebook hashtags (5-15)
    const facebookHashtags = await optimizer.generateHashtags(sampleListing, "facebook");
    console.log("Facebook Hashtags:");
    console.log(facebookHashtags.join(" "));
    console.log(`Count: ${facebookHashtags.length}`);

    // Instagram hashtags (up to 30)
    const instagramHashtags = await optimizer.generateHashtags(sampleListing, "instagram");
    console.log("\nInstagram Hashtags:");
    console.log(instagramHashtags.join(" "));
    console.log(`Count: ${instagramHashtags.length}`);
}

/**
 * Example 3: Multi-platform content preparation
 */
async function multiPlatformExample() {
    console.log("\n=== Example 3: Multi-Platform Publishing ===\n");

    const optimizer = createContentOptimizer();
    const platforms: Platform[] = ["facebook", "instagram", "linkedin"];

    for (const platform of platforms) {
        console.log(`\n--- ${platform.toUpperCase()} ---`);

        // Format content
        const content = await optimizer.formatForPlatform(sampleListing, platform);
        console.log(`Content length: ${content.characterCount} characters`);
        console.log(`Truncated: ${content.truncated}`);

        // Generate hashtags
        const hashtags = await optimizer.generateHashtags(sampleListing, platform);
        console.log(`Hashtags: ${hashtags.length}`);

        // Get image optimization info
        const images = sampleListing.photos.map(p => p.url);
        const optimized = await optimizer.optimizeImages(images, platform);
        console.log(`Images: ${optimized.length}`);
        console.log(`Dimensions: ${optimized[0]?.width}x${optimized[0]?.height}`);
    }
}

/**
 * Example 4: Complete social post preparation
 */
async function completeSocialPostExample() {
    console.log("\n=== Example 4: Complete Social Post ===\n");

    const optimizer = createContentOptimizer();
    const platform: Platform = "instagram";

    // Prepare all content
    const content = await optimizer.formatForPlatform(sampleListing, platform);
    const hashtags = await optimizer.generateHashtags(sampleListing, platform);
    const images = await optimizer.optimizeImages(
        sampleListing.photos.map(p => p.url),
        platform
    );

    // Combine into final post
    const finalPost = {
        platform,
        listingId: sampleListing.mlsId,
        content: content.text,
        hashtags,
        images: images.map(img => img.optimizedUrl),
    };

    console.log("Final Instagram Post:");
    console.log(JSON.stringify(finalPost, null, 2));
}

/**
 * Example 5: Handle long descriptions with truncation
 */
async function truncationExample() {
    console.log("\n=== Example 5: Truncation Handling ===\n");

    const optimizer = createContentOptimizer();

    // Create a listing with a very long description
    const longListing: Listing = {
        ...sampleListing,
        description: `This is an exceptionally detailed property description. `.repeat(100),
    };

    // Format for Facebook (2000 char limit)
    const formatted = await optimizer.formatForPlatform(longListing, "facebook");

    console.log("Original description length:", longListing.description?.length);
    console.log("Formatted content length:", formatted.characterCount);
    console.log("Truncated:", formatted.truncated);
    console.log("\nFormatted content preview:");
    console.log(formatted.text.substring(0, 300) + "...");
}

/**
 * Example 6: Different property types
 */
async function propertyTypeExample() {
    console.log("\n=== Example 6: Different Property Types ===\n");

    const optimizer = createContentOptimizer();

    const propertyTypes = [
        { type: "Condo", bedrooms: 2, bathrooms: 2, price: 650000 },
        { type: "Townhouse", bedrooms: 3, bathrooms: 2.5, price: 850000 },
        { type: "Land", bedrooms: 0, bathrooms: 0, price: 500000 },
    ];

    for (const prop of propertyTypes) {
        const listing: Listing = {
            ...sampleListing,
            propertyType: prop.type,
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms,
            price: prop.price,
        };

        const hashtags = await optimizer.generateHashtags(listing, "facebook");
        console.log(`\n${prop.type}:`);
        console.log(hashtags.slice(0, 10).join(" "));
    }
}

/**
 * Run all examples
 */
async function runAllExamples() {
    try {
        await formatForSinglePlatform();
        await generateHashtagsExample();
        await multiPlatformExample();
        await completeSocialPostExample();
        await truncationExample();
        await propertyTypeExample();

        console.log("\n=== All examples completed successfully! ===");
    } catch (error) {
        console.error("Error running examples:", error);
    }
}

// Export for use in other files
export {
    formatForSinglePlatform,
    generateHashtagsExample,
    multiPlatformExample,
    completeSocialPostExample,
    truncationExample,
    propertyTypeExample,
    runAllExamples,
};

// Run examples if this file is executed directly
if (require.main === module) {
    runAllExamples();
}
