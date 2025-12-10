# Social Media Image Generation Feature

## Summary

Added AI-powered image generation for social media posts with platform-specific aspect ratios and customization options.

## What Was Added

### 1. Schema Definition (`src/ai/schemas/social-media-image-schemas.ts`)

- Defined aspect ratios for different social media platforms
- Platform-specific recommendations (Instagram: 1:1, Twitter: 16:9, Stories: 9:16, etc.)
- Input/output schemas with Zod validation
- Helper functions for aspect ratio recommendations and dimension calculations

### 2. Bedrock Flow (`src/aws/bedrock/flows/generate-social-media-image.ts`)

- Integration with Amazon Titan Image Generator v2
- Intelligent prompt building based on topic, style, and aspect ratio
- Guardrails validation for content safety and PII detection
- Support for 6 visual styles: professional, modern, luxury, minimalist, vibrant, elegant

### 3. Server Action (`src/app/actions.ts`)

- `generateSocialMediaImageAction` - handles form submission and validation
- Proper error handling with user-friendly messages
- Type-safe integration with Bedrock flow

### 4. UI Component (`src/app/(app)/studio/write/page.tsx`)

- Image generation form in Social Media tab
- Platform selector with auto-recommended aspect ratios
- Aspect ratio selector with platform badges
- Visual style selector
- Custom prompt input for detailed instructions
- Text overlay option checkbox
- Real-time image preview with download capability
- Loading states and error handling

### 5. Documentation (`docs/social-media-image-generation.md`)

- Comprehensive feature documentation
- User guide and best practices
- Technical implementation details
- Future enhancement ideas

### 6. Tests (`src/__tests__/social-media-image-generation.test.ts`)

- Schema validation tests
- Aspect ratio recommendation tests
- Dimension calculation tests
- All 14 tests passing ✓

## Features

### Platform-Specific Aspect Ratios

- **Instagram Post**: 1:1 (1024x1024)
- **Facebook Post**: 1:1 (1024x1024)
- **X (Twitter)**: 16:9 (1280x720)
- **LinkedIn**: 16:9 (1280x720)
- **Instagram/Facebook Stories**: 9:16 (720x1280)
- **Pinterest**: 2:3 (1000x1500)

### Visual Styles

1. Professional - Clean, corporate, business-appropriate
2. Modern - Contemporary, sleek, minimalist
3. Luxury - High-end, elegant, sophisticated
4. Minimalist - Simple, clean lines, uncluttered
5. Vibrant - Colorful, energetic, bold
6. Elegant - Refined, graceful, tasteful

### Customization Options

- Custom prompt for specific details
- Text overlay space option
- Platform-based recommendations
- Manual aspect ratio override

## User Flow

1. User generates social media posts in Studio → Write → Social Media
2. After posts are generated, image generation form appears
3. User selects target platform (auto-selects recommended aspect ratio)
4. User can override aspect ratio if needed
5. User selects visual style
6. User optionally adds custom prompt for specific details
7. User clicks "Generate Image"
8. AI generates image using Amazon Titan Image Generator v2
9. Image displays with download and regenerate options

## Technical Details

### AWS Services Used

- **Amazon Titan Image Generator v2**: Premium quality text-to-image generation
- **AWS Bedrock**: AI model orchestration
- **Guardrails**: Content validation and PII detection

### Image Quality Settings

- Resolution: Varies by aspect ratio (optimized for each platform)
- Format: PNG with base64 encoding
- Quality: Premium
- CFG Scale: 8.0 (balanced creativity and adherence)
- Seed: Randomized for variety

### Error Handling

- Input validation with Zod schemas
- Guardrails for inappropriate content
- User-friendly error messages
- Loading states during generation
- Toast notifications for success/failure

## Files Modified/Created

### Created

- `src/ai/schemas/social-media-image-schemas.ts` - Schema definitions
- `src/aws/bedrock/flows/generate-social-media-image.ts` - Bedrock flow
- `docs/social-media-image-generation.md` - Documentation
- `src/__tests__/social-media-image-generation.test.ts` - Tests
- `SOCIAL_MEDIA_IMAGE_FEATURE.md` - This summary

### Modified

- `src/app/actions.ts` - Added imports and `generateSocialMediaImageAction`
- `src/app/(app)/studio/write/page.tsx` - Added UI components and state management

## Testing

All tests passing:

```
✓ Schema validation (3 tests)
✓ Aspect ratio recommendations (5 tests)
✓ Dimension calculations (6 tests)
Total: 14 tests passed
```

## Next Steps

To use this feature:

1. Navigate to Studio → Write → Social Media
2. Generate social media posts
3. Scroll down to "Generate Social Media Image" section
4. Select platform and customize options
5. Click "Generate Image"
6. Download the generated image

## Future Enhancements

- Image editing capabilities (crop, adjust, filters)
- Template library for common real estate scenarios
- Batch generation for multiple platforms at once
- Integration with social media scheduling
- Brand consistency checks (logo, colors, fonts)
- A/B testing for image performance
- Image analytics and engagement tracking

## Notes

- Generation time: 10-30 seconds depending on complexity
- Images are optimized for real estate marketing
- All content is validated through AWS Guardrails
- Images are generated fresh each time (no caching yet)
