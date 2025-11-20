# Content Optimizer Service

The Content Optimizer Service formats listing content for platform-specific requirements, generates relevant hashtags, and provides image optimization metadata for social media publishing.

## Features

### 1. Platform-Specific Content Formatting

Formats listing content according to each platform's character limits and best practices:

- **Facebook**: Up to 2,000 characters
- **Instagram**: Up to 2,200 characters
- **LinkedIn**: Up to 3,000 characters

#### Key Information Preservation

The service always preserves critical listing information:

- 💰 Price (formatted with currency)
- 🏠 Property details (bedrooms, bathrooms, square footage)
- 📍 Location (city, state)
- 🏡 Property type
- ✨ Top features (up to 3)

#### Intelligent Truncation

When content exceeds platform limits, the service:

1. Always preserves key information
2. Truncates at sentence boundaries when possible
3. Falls back to word boundaries if needed
4. Adds ellipsis (...) to indicate truncation

### 2. Hashtag Generation

Generates relevant, diverse hashtags based on listing attributes:

#### Hashtag Quantity

- **General platforms** (Facebook, LinkedIn): 5-15 hashtags
- **Instagram**: Up to 30 hashtags

#### Hashtag Categories

1. **Location-based**: City and state tags

   - `#losangeles`, `#losangelesrealestate`, `#losangeleshomes`
   - `#ca`, `#carealestate`

2. **Property type**: Based on property characteristics

   - `#singlefamily`, `#singlefamilyforsale`
   - `#3bedroom`, `#3bed`

3. **Feature-specific**: Extracted from listing features

   - `#pool`, `#garage`, `#fireplace`, `#hardwood`

4. **General real estate**: Industry-standard tags
   - `#realestate`, `#realtor`, `#forsale`, `#dreamhome`

### 3. Image Optimization Metadata

Provides platform-specific image dimension requirements:

- **Facebook**: 1200x630px (1.91:1 aspect ratio)
- **Instagram**: 1080x1080px (square) or 1080x1350px (portrait)
- **LinkedIn**: 1200x627px (1.91:1 aspect ratio)

All platforms: Maximum 5MB file size per image

## Usage

### Basic Example

```typescript
import { createContentOptimizer } from "@/integrations/social";
import { Listing } from "@/integrations/mls/types";

const optimizer = createContentOptimizer();

// Format content for a platform
const listing: Listing = {
  // ... listing data
};

const formatted = await optimizer.formatForPlatform(listing, "facebook");
console.log(formatted.text);
console.log(`Characters: ${formatted.characterCount}`);
console.log(`Truncated: ${formatted.truncated}`);

// Generate hashtags
const hashtags = await optimizer.generateHashtags(listing, "instagram");
console.log(hashtags); // Array of hashtag strings

// Get image optimization metadata
const images = listing.photos.map((p) => p.url);
const optimized = await optimizer.optimizeImages(images, "facebook");
console.log(optimized); // Array of OptimizedImage objects
```

### Multi-Platform Publishing

```typescript
const platforms: Platform[] = ["facebook", "instagram", "linkedin"];

for (const platform of platforms) {
  const content = await optimizer.formatForPlatform(listing, platform);
  const hashtags = await optimizer.generateHashtags(listing, platform);
  const images = await optimizer.optimizeImages(
    listing.photos.map((p) => p.url),
    platform
  );

  // Publish to platform...
}
```

## API Reference

### `formatForPlatform(listing: Listing, platform: Platform): Promise<FormattedContent>`

Formats listing content for a specific platform.

**Parameters:**

- `listing`: The listing to format
- `platform`: Target platform ("facebook" | "instagram" | "linkedin")

**Returns:**

```typescript
{
  text: string; // Formatted content
  characterCount: number; // Length of formatted text
  truncated: boolean; // Whether content was truncated
}
```

### `generateHashtags(listing: Listing, platform: Platform): Promise<string[]>`

Generates relevant hashtags for a listing.

**Parameters:**

- `listing`: The listing to generate hashtags for
- `platform`: Target platform (affects quantity)

**Returns:** Array of hashtag strings (including # prefix)

### `optimizeImages(images: string[], platform: Platform): Promise<OptimizedImage[]>`

Provides image optimization metadata for a platform.

**Parameters:**

- `images`: Array of image URLs
- `platform`: Target platform

**Returns:**

```typescript
{
  originalUrl: string; // Original image URL
  optimizedUrl: string; // Optimized image URL (placeholder)
  width: number; // Target width in pixels
  height: number; // Target height in pixels
  fileSize: number; // Maximum file size in bytes
}
[];
```

## Requirements Coverage

This implementation satisfies the following requirements:

- **7.2**: Format content according to platform specifications ✓
- **8.1**: Facebook formatting (2000 chars, 10 images) ✓
- **8.2**: Instagram formatting (2200 chars, 10 images, square/portrait) ✓
- **8.3**: LinkedIn formatting (3000 chars, 9 images) ✓
- **8.4**: Preserve key listing information ✓
- **8.5**: Intelligent truncation maintaining readability ✓
- **9.1**: Analyze listing attributes for hashtags ✓
- **9.2**: Generate 5-15 hashtags for general platforms ✓
- **9.3**: Generate up to 30 hashtags for Instagram ✓
- **9.4**: Include location, property type, and feature tags ✓

## Testing

The service includes comprehensive unit tests covering:

- Platform-specific character limits
- Key information preservation
- Intelligent truncation at sentence boundaries
- Hashtag generation and diversity
- Image optimization metadata
- Edge cases (high prices, zero bedrooms, special characters)

Run tests:

```bash
npm test -- src/integrations/social/__tests__/content-optimizer.test.ts
```

## Implementation Notes

### Content Formatting Strategy

1. **Key Information First**: Critical details are always included at the top
2. **Description Second**: Full description follows key information
3. **Smart Truncation**: When needed, truncates description while preserving key info
4. **Sentence Boundaries**: Prefers to truncate at sentence endings for readability

### Hashtag Generation Strategy

1. **Diversity**: Ensures hashtags span multiple categories
2. **Relevance**: Extracts keywords from listing attributes
3. **Sanitization**: Removes spaces and special characters
4. **Deduplication**: Ensures no duplicate hashtags
5. **Quantity Control**: Respects platform-specific limits

### Image Optimization

Currently returns metadata only. Actual image processing would be handled by a separate image service that:

- Resizes images to target dimensions
- Maintains aspect ratios
- Compresses to target file size
- Stores optimized versions in S3

## Future Enhancements

- [ ] A/B testing for different content formats
- [ ] Emoji optimization based on platform
- [ ] Trending hashtag integration
- [ ] Multi-language support
- [ ] Custom template support
- [ ] Performance analytics integration
