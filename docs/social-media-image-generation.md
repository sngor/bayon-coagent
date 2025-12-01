# Social Media Image Generation

## Overview

The Social Media Image Generation feature allows users to create professional, AI-generated images to accompany their social media posts. Images are generated using Amazon Titan Image Generator v2 with platform-specific aspect ratios.

## Features

### Multiple Image Variations

Generate 1-4 image variations in a single request, giving you options to choose from:

- **Gallery View**: See all variations at once in a grid layout
- **Quick Selection**: Click any thumbnail to preview it full-size
- **Individual Regeneration**: Regenerate any specific image without affecting others
- **Comparison**: Easily compare different variations side-by-side

### Platform-Specific Aspect Ratios

The system automatically recommends aspect ratios based on the selected platform:

- **Instagram Post**: 1:1 (Square)
- **Facebook Post**: 1:1 (Square)
- **X (Twitter)**: 16:9 (Landscape)
- **LinkedIn**: 16:9 (Landscape)
- **Instagram/Facebook Stories**: 9:16 (Vertical)
- **Pinterest**: 2:3 (Tall)

### Available Aspect Ratios

- **1:1 (Square)**: 1024x1024 - Instagram, Facebook posts
- **4:5 (Portrait)**: 1024x1280 - Instagram portrait posts
- **9:16 (Story)**: 720x1280 - Instagram/Facebook Stories, TikTok
- **16:9 (Landscape)**: 1280x720 - YouTube thumbnails, LinkedIn
- **2:1 (Wide)**: 1200x600 - Twitter/X headers
- **2:3 (Tall)**: 1000x1500 - Pinterest pins

### Visual Styles

Users can choose from six visual styles:

1. **Professional**: Clean, corporate, business-appropriate
2. **Modern**: Contemporary, sleek, minimalist
3. **Luxury**: High-end, elegant, sophisticated
4. **Minimalist**: Simple, clean lines, uncluttered
5. **Vibrant**: Colorful, energetic, bold
6. **Elegant**: Refined, graceful, tasteful

### Custom Prompts

Users can provide additional instructions to customize the generated image:

- Specific architectural elements
- Lighting preferences (sunset, golden hour, etc.)
- Background elements (palm trees, cityscape, etc.)
- Color schemes

### Text Overlay Option

Users can request that the AI leave space for text overlay, ensuring the main subject doesn't occupy areas where text will be placed.

## User Flow

1. **Generate Social Media Posts**: User creates social media content in Studio → Write → Social Media
2. **Select Platform**: Choose the target platform (Instagram, Facebook, Twitter, etc.)
3. **Choose Aspect Ratio**: System auto-selects recommended ratio, user can override
4. **Select Visual Style**: Choose from 6 professional styles
5. **Choose Number of Variations**: Select 1-4 image variations to generate
6. **Add Custom Details** (Optional): Provide specific instructions
7. **Generate Images**: AI creates multiple variations using Amazon Titan
8. **Review Options**: Browse through generated variations in a gallery view
9. **Select Favorite**: Click on any image to select it as the main preview
10. **Regenerate**: Click "Regenerate This" to create a new variation of the selected image
11. **Download**: Save the selected image for use with social media posts

## Technical Implementation

### Architecture

```
User Input → Server Action → Bedrock Flow → Amazon Titan Image Generator v2 → Base64 Image → UI Display
```

### Files

- **Schema**: `src/ai/schemas/social-media-image-schemas.ts`
- **Flow**: `src/aws/bedrock/flows/generate-social-media-image.ts`
- **Action**: `src/app/actions.ts` (generateSocialMediaImageAction)
- **UI**: `src/app/(app)/studio/write/page.tsx`

### AWS Services

- **Amazon Titan Image Generator v2**: Text-to-image generation
- **AWS Bedrock**: AI model orchestration
- **Guardrails**: Content validation and PII detection

## Image Quality

- **Resolution**: Premium quality (varies by aspect ratio)
- **Format**: PNG with base64 encoding
- **CFG Scale**: 8.0 (balanced creativity and adherence)
- **Seed**: Randomized for variety

## Best Practices

### For Users

1. **Be Specific**: Provide detailed custom prompts for better results
2. **Match Platform**: Use recommended aspect ratios for each platform
3. **Test Styles**: Try different visual styles to find what works best
4. **Iterate**: Generate multiple versions to find the perfect image

### For Developers

1. **Error Handling**: All errors are caught and user-friendly messages displayed
2. **Guardrails**: Input is validated for inappropriate content and PII
3. **Performance**: Images are generated asynchronously with loading states
4. **Caching**: Consider implementing image caching for repeated generations

## Future Enhancements

- [ ] Image editing capabilities (crop, adjust, filters)
- [ ] Template library for common real estate scenarios
- [ ] Batch generation for multiple platforms
- [ ] Integration with social media scheduling
- [ ] Brand consistency checks (logo, colors, fonts)
- [ ] A/B testing for image performance
- [ ] Image analytics and engagement tracking

## Limitations

- Generation time: 10-30 seconds depending on complexity
- No direct image-to-image editing (use Reimagine feature for that)
- Text overlay must be added separately (not generated by AI)
- Limited to real estate marketing context (enforced by guardrails)

## Related Features

- **Studio → Write → Social Media**: Generate post content
- **Studio → Reimagine**: Edit existing property photos
- **Library → Media**: Store and organize generated images
