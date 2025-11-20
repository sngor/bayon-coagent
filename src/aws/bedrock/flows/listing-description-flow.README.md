# Listing Description Flow

AI-powered listing description generator for MLS integration using Claude 3.5 Sonnet with vision capabilities.

## Overview

This flow generates compelling real estate listing descriptions optimized for marketing. It supports two modes:

1. **Photo-based generation**: Analyzes property photos using vision AI to create descriptions highlighting visual features
2. **Data-based generation**: Creates descriptions from structured listing data when photos are unavailable

## Requirements Coverage

- **3.1**: Analyze photos using AI vision capabilities
- **3.2**: Generate descriptions with identified features, room types, and aesthetic qualities
- **3.3**: Create content between 150-300 words optimized for real estate marketing
- **3.4**: Generate descriptions from structured data when photos are unavailable
- **3.5**: Store generated descriptions with listing records (handled by calling code)

## Usage

### Generate from Photos

```typescript
import { generateFromPhotos } from "@/aws/bedrock/flows/listing-description-flow";

const result = await generateFromPhotos({
  photos: [
    {
      url: "https://example.com/photo1.jpg",
      data: "base64EncodedImageData",
      format: "jpeg",
      order: 0,
    },
    // ... more photos
  ],
  listingData: {
    address: {
      street: "123 Main St",
      city: "San Francisco",
      state: "CA",
      zipCode: "94102",
    },
    price: 1500000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 2000,
    propertyType: "Single Family",
    features: ["Pool", "Garage", "Updated Kitchen"],
  },
});

console.log(result.description); // Generated description
console.log(result.wordCount); // Word count (150-300)
```

### Generate from Data Only

```typescript
import { generateFromData } from "@/aws/bedrock/flows/listing-description-flow";

const result = await generateFromData({
  mlsNumber: "MLS123456",
  address: {
    street: "123 Main St",
    city: "San Francisco",
    state: "CA",
    zipCode: "94102",
  },
  price: 1500000,
  bedrooms: 3,
  bathrooms: 2,
  squareFeet: 2000,
  propertyType: "Single Family",
  features: ["Pool", "Garage", "Updated Kitchen"],
});

console.log(result.description); // Generated description
console.log(result.wordCount); // Word count (150-300)
```

## Input Schemas

### GenerateFromPhotosInput

```typescript
{
  photos: PhotoData[];           // At least 1 photo required
  listingData: {                 // All fields optional
    address?: Address;
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    propertyType?: string;
    features?: string[];
  };
}
```

### PhotoData

```typescript
{
  url: string;                   // Photo URL
  data: string;                  // Base64 encoded image data
  format: 'jpeg' | 'png' | 'webp';
  caption?: string;              // Optional caption
  order: number;                 // Display order
}
```

### GenerateFromDataInput

```typescript
{
  mlsNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  propertyType: string;
  features: string[];
  description?: string;          // Optional existing description
}
```

## Output Schema

```typescript
{
  description: string; // Generated description (150-300 words)
  wordCount: number; // Actual word count
}
```

## Features

### Photo Analysis (Vision Mode)

- Analyzes up to 5 photos per request (for token efficiency)
- Identifies room types, finishes, and amenities
- Describes aesthetic qualities (lighting, style, ambiance)
- Emphasizes lifestyle benefits visible in photos
- Uses Claude 3.5 Sonnet v2 with vision capabilities

### Data-Only Mode

- Creates compelling descriptions from structured data
- Highlights key features and specifications
- Emphasizes property strengths and unique selling points
- Creates narrative about lifestyle and benefits
- Uses Claude 3.5 Sonnet v2 for text generation

### Word Count Validation

- Target: 150-300 words (Requirement 3.3)
- Automatic validation after generation
- Logs warnings if outside target range
- Future enhancement: Automatic regeneration with adjusted prompts

## Model Configuration

- **Model**: Claude 3.5 Sonnet v2 (`us.anthropic.claude-3-5-sonnet-20241022-v2:0`)
- **Temperature**: 0.7 (creative but controlled)
- **Max Tokens**: 2048
- **Top P**: 1.0

## Error Handling

The flow includes comprehensive error handling:

- Input validation using Zod schemas
- JSON parsing with fallback extraction from markdown
- Graceful error messages for debugging
- Detailed error logging

## Integration with MLS Actions

The flow is designed to be called from MLS server actions:

```typescript
// In mls-actions.ts
import {
  generateFromPhotos,
  generateFromData,
} from "@/aws/bedrock/flows/listing-description-flow";

// After importing listing with photos
const photoData = await downloadAndEncodePhotos(listing.photos);
const description = await generateFromPhotos({
  photos: photoData,
  listingData: listing,
});

// Store description with listing
await updateListing(listing.id, {
  aiDescription: description.description,
});
```

## Testing

Unit tests cover:

- Schema validation for all input/output types
- Word count calculation logic
- Boundary conditions (min/max word counts)
- Error cases (empty photos, invalid data)

Run tests:

```bash
npm test -- listing-description-flow.test.ts
```

## Performance Considerations

- **Photo Limit**: Analyzes up to 5 photos to manage token usage
- **Timeout**: 30-second timeout for Bedrock requests (configurable)
- **Caching**: Calling code should cache generated descriptions
- **Retry**: Single attempt per request (retry logic in calling code)

## Future Enhancements

1. **Automatic Regeneration**: If word count is outside range, regenerate with adjusted prompt
2. **Style Customization**: Allow agents to specify tone/style preferences
3. **Multi-language Support**: Generate descriptions in multiple languages
4. **A/B Testing**: Generate multiple variations for testing
5. **Batch Processing**: Process multiple listings in parallel

## Related Files

- `src/ai/schemas/listing-description-schemas.ts` - Zod schemas
- `src/integrations/mls/types.ts` - MLS type definitions
- `src/app/mls-actions.ts` - Server actions that call this flow
- `src/aws/bedrock/flows/__tests__/listing-description-flow.test.ts` - Unit tests
