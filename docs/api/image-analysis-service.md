# Image Analysis Service API Reference

The Image Analysis Service provides AI-powered image processing capabilities for real estate properties, including virtual staging, enhancement, and comprehensive property analysis.

## Service Location

```typescript
import {
  executeImageAnalysis,
  analyzePropertyImage,
  generateVirtualStaging,
  enhancePropertyImage,
  convertDayToDusk,
} from "@/services/strands/image-analysis-service";
```

## Core Functions

### `generateVirtualStaging(imageUrl, userId, stagingStyle, options)`

Transforms empty rooms into beautifully furnished spaces with AI-powered virtual staging.

#### Parameters

- **`imageUrl`** (string, required): URL of the empty room image
- **`userId`** (string, required): User ID for saving results
- **`stagingStyle`** (string, optional): Furniture style preference
  - `'modern-contemporary'` (default)
  - `'traditional-classic'`
  - `'luxury-upscale'`
  - `'minimalist-clean'`
  - `'cozy-family'`
  - `'professional-office'`
- **`options`** (object, optional): Additional configuration
  - **`targetAudience`** (string): Who the staging is designed for
    - `'buyers'` (default) - Move-in ready appeal, lifestyle visualization
    - `'sellers'` - Maximize value, broad market appeal
    - `'investors'` - Rental potential, ROI factors, durability
    - `'renters'` - Aspirational lifestyle, flexibility
  - **`roomType`** (string): Specific room type for better furniture selection
  - **`propertyType`** (string): Property context for appropriate styling
  - **`location`** (string): Geographic context for regional preferences

#### Example Usage

```typescript
// Basic virtual staging for buyers
const result = await generateVirtualStaging(
  "https://example.com/empty-living-room.jpg",
  "user-123",
  "modern-contemporary"
);

// Advanced staging for investors
const investorStaging = await generateVirtualStaging(
  "https://example.com/rental-unit.jpg",
  "user-123",
  "minimalist-clean",
  {
    targetAudience: "investors",
    roomType: "living-room",
    propertyType: "rental-unit",
    location: "Austin, TX",
  }
);

// Luxury staging for high-end buyers
const luxuryStaging = await generateVirtualStaging(
  "https://example.com/penthouse-room.jpg",
  "user-123",
  "luxury-upscale",
  {
    targetAudience: "buyers",
    propertyType: "luxury-condo",
  }
);
```

#### Response Format

```typescript
interface VirtualStagingResult {
  success: boolean;
  analysis: string; // Detailed staging report
  propertyInsights: {
    roomType: string;
    style: string;
    condition: string;
    features: string[];
    improvements: string[];
  };
  stagingRecommendations: Array<{
    area: string;
    suggestion: string;
    style: string;
    budget: string;
  }>;
  processedImages: Array<{
    type: string;
    url?: string;
    description: string;
  }>;
  qualityScore: number; // 0-100
  marketAppeal: number; // 0-100
  analysisId?: string;
  timestamp: string;
}
```

### `analyzePropertyImage(imageUrl, userId, options)`

Performs comprehensive property analysis including feature detection, marketing recommendations, and enhancement suggestions.

#### Parameters

- **`imageUrl`** (string, required): Property image URL
- **`userId`** (string, required): User ID
- **`options`** (object, optional):
  - **`targetAudience`** (string): Analysis perspective ('buyers', 'sellers', 'investors', 'renters')
  - **`propertyType`** (string): Property context
  - **`roomType`** (string): Specific room being analyzed
  - **`location`** (string): Geographic context

#### Example Usage

```typescript
const analysis = await analyzePropertyImage(
  "https://example.com/property-photo.jpg",
  "user-123",
  {
    targetAudience: "buyers",
    propertyType: "single-family-home",
    location: "Seattle, WA",
  }
);
```

### `enhancePropertyImage(imageUrl, userId, enhancementType, options)`

Improves image quality with professional-grade enhancements.

#### Parameters

- **`imageUrl`** (string, required): Image to enhance
- **`userId`** (string, required): User ID
- **`enhancementType`** (string, optional): Enhancement approach
  - `'professional-grade'` (default)
  - `'brightness-contrast'`
  - `'color-correction'`
  - `'sharpening'`
  - `'noise-reduction'`
  - `'hdr-effect'`
- **`options`** (object, optional): Additional parameters including `targetAudience`

### `convertDayToDusk(imageUrl, userId, options)`

Transforms daytime exterior photos into warm, inviting evening scenes.

#### Parameters

- **`imageUrl`** (string, required): Daytime exterior image
- **`userId`** (string, required): User ID
- **`options`** (object, optional): Configuration including `targetAudience`

## Target Audience Impact

The `targetAudience` parameter significantly affects the AI's recommendations and styling choices:

### For Buyers

- **Focus**: Emotional connection and lifestyle visualization
- **Staging**: Warm, inviting furniture that feels like home
- **Colors**: Welcoming palettes that encourage imagination
- **Layout**: Comfortable, livable arrangements

### For Sellers

- **Focus**: Maximizing perceived value and broad appeal
- **Staging**: Neutral, universally appealing choices
- **Colors**: Safe, market-friendly palettes
- **Layout**: Space-maximizing arrangements that highlight features

### For Investors

- **Focus**: ROI potential and practical considerations
- **Staging**: Durable, low-maintenance furniture
- **Colors**: Neutral, rental-friendly schemes
- **Layout**: Functional arrangements showing rental potential

### For Renters

- **Focus**: Aspirational lifestyle and flexibility
- **Staging**: Trendy, lifestyle-focused pieces
- **Colors**: Contemporary, Instagram-worthy palettes
- **Layout**: Flexible arrangements showing lifestyle potential

## Error Handling

All functions return a structured response with error information:

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  timestamp: string;
  userId: string;
  source: "image-analysis-agent";
}
```

## Best Practices

1. **Choose the right target audience** for your marketing goals
2. **Provide room type** when known for better furniture selection
3. **Include location** for regional styling preferences
4. **Use appropriate staging style** for the property's price point
5. **Save results** to library for future reference and comparison

## Integration Examples

### In Server Actions

```typescript
// In your server action
export async function stagePropertyAction(formData: FormData) {
  const imageUrl = formData.get("imageUrl") as string;
  const targetAudience = formData.get("targetAudience") as string;
  const userId = await getCurrentUserId();

  const result = await generateVirtualStaging(
    imageUrl,
    userId,
    "modern-contemporary",
    { targetAudience }
  );

  return result;
}
```

### In React Components

```typescript
// In your component
const handleStaging = async (imageUrl: string, audience: string) => {
  const result = await stagePropertyAction(
    new FormData([
      ["imageUrl", imageUrl],
      ["targetAudience", audience],
    ])
  );

  if (result.success) {
    // Handle successful staging
    setStagingResults(result);
  }
};
```

## Performance Notes

- **Processing Time**: 30-60 seconds for virtual staging
- **Image Limits**: Up to 4K resolution supported
- **Concurrent Requests**: Service handles multiple simultaneous requests
- **Caching**: Results are automatically saved to user's library when `saveResults: true`

## Related Documentation

- [Virtual Staging User Guide](../reimagine/virtual-staging.md)
- [Hub Integration Guide](../guides/hub-integration.md)
- [Studio Hub Documentation](../app/studio.md)
