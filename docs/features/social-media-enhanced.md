# Social Media Image Generation Feature - Enhanced

## Summary

Enhanced AI-powered image generation for social media posts with **multiple variations**, platform-specific aspect ratios, and individual image regeneration capabilities.

## What's New in This Update

### 1. Multiple Image Variations

- Generate 1-4 image variations in a single request
- Gallery view to browse all generated options
- Click any thumbnail to select and preview full-size
- Compare variations side-by-side

### 2. Individual Image Regeneration

- Regenerate any specific image without affecting others
- Keep the variations you like, regenerate the ones you don't
- Each regeneration uses a different seed for variety
- Maintains the same prompt and settings

### 3. Enhanced User Experience

- Visual selection with checkmark indicator
- Responsive grid layout for thumbnails
- Large preview of selected image
- Clear action buttons (Download, Regenerate, Clear All)

## Key Features

✅ **Multiple Image Variations**

- Generate 1-4 variations in a single request
- Gallery view to compare all options
- Click to select and preview any variation
- Individual regeneration for each image

✅ **Platform-Specific Recommendations**

- Instagram (1:1 square), Twitter (16:9 landscape), Stories (9:16 vertical), Pinterest (2:3 tall), etc.
- Auto-selects recommended aspect ratio when you pick a platform

✅ **6 Visual Styles**

- Professional, Modern, Luxury, Minimalist, Vibrant, Elegant

✅ **Smart Customization**

- Custom prompts for specific details
- Text overlay space option
- Real-time preview with download
- Regenerate individual images without starting over

✅ **Seamless Integration**

- Appears automatically after generating social media posts
- Uses Amazon Titan Image Generator v2 for premium quality
- Guardrails validation for content safety

## How It Works

1. Generate social media posts in Studio → Write → Social Media
2. Image generation form appears below the posts
3. Select platform (Instagram, Facebook, Twitter, LinkedIn, Stories, Pinterest)
4. Choose number of variations (1-4 images)
5. Choose visual style and optionally add custom details
6. Click "Generate Images" - AI creates multiple variations in 10-30 seconds
7. Browse variations in gallery view
8. Click any image to select it
9. Click "Regenerate This" to create a new version of selected image
10. Download your favorite variation

## Technical Implementation

### Schema Changes (`src/ai/schemas/social-media-image-schemas.ts`)

- Added `numberOfImages` field (1-4, default 3)
- Changed output to return array of images with seeds
- Each image includes: `imageUrl`, `prompt`, `seed`

### Flow Updates (`src/aws/bedrock/flows/generate-social-media-image.ts`)

- Generate multiple images in parallel using `Promise.all`
- Each image uses a unique random seed
- Added `regenerateSingleImage` function for individual regeneration
- Returns seed with each image for tracking

### New Server Action (`src/app/actions.ts`)

- `regenerateSocialMediaImageAction` - regenerates a single image
- Takes prompt and aspect ratio as input
- Returns new image with new seed

### UI Enhancements (`src/app/(app)/studio/write/page.tsx`)

- Gallery grid view (2-3 columns responsive)
- Selected image indicator with checkmark
- Large preview of selected image
- Individual regenerate button
- Clear all button to start over
- State management for multiple images and selection

## User Experience Flow

### Initial Generation

```
User fills form → Selects 3 variations → Clicks "Generate Images"
↓
AI generates 3 different images in parallel
↓
Gallery displays all 3 thumbnails
↓
First image auto-selected and shown in preview
```

### Browsing Variations

```
User clicks thumbnail #2
↓
Image #2 becomes selected (checkmark appears)
↓
Large preview updates to show image #2
↓
Download/Regenerate buttons apply to image #2
```

### Regenerating a Variation

```
User has image #2 selected → Clicks "Regenerate This"
↓
AI generates new version with different seed
↓
Image #2 replaced with new version in gallery
↓
Preview updates automatically
↓
Other images (#1, #3) remain unchanged
```

## Technical Details

### Parallel Generation

- Uses `Promise.all` to generate multiple images simultaneously
- Faster than sequential generation
- Each image gets unique random seed

### Seed Tracking

- Each image stores its generation seed
- Allows for reproducibility if needed
- Different seeds ensure variety between variations

### State Management

- `socialMediaImages`: Array of all generated images
- `selectedImageIndex`: Currently selected image (0-based)
- `imagePrompt`: Stored prompt for regeneration
- `selectedAspectRatio`: Stored for regeneration

### Error Handling

- Individual image failures don't affect others
- User-friendly error messages
- Loading states during generation/regeneration
- Toast notifications for success/failure

## Files Modified/Created

### Modified

- `src/ai/schemas/social-media-image-schemas.ts` - Added numberOfImages, updated output schema
- `src/aws/bedrock/flows/generate-social-media-image.ts` - Parallel generation, regeneration function
- `src/app/actions.ts` - Added regenerateSocialMediaImageAction
- `src/app/(app)/studio/write/page.tsx` - Gallery UI, selection, regeneration
- `src/__tests__/social-media-image-generation.test.ts` - Updated tests for new schema
- `docs/social-media-image-generation.md` - Updated documentation

### Created

- `SOCIAL_MEDIA_IMAGE_FEATURE_ENHANCED.md` - This enhancement summary

## Testing

All tests passing (16 tests):

```
✓ Schema validation with numberOfImages
✓ Default numberOfImages value (3)
✓ Reject numberOfImages outside range (1-4)
✓ Accept numberOfImages within range
✓ All existing tests still passing
```

## Performance

- **Initial Generation**: 10-30 seconds for 3 images (parallel)
- **Regeneration**: 10-30 seconds for 1 image
- **Gallery Loading**: Instant (images already loaded)
- **Selection**: Instant (client-side state change)

## Best Practices

### For Users

1. **Start with 3 variations** - Good balance of options and speed
2. **Review all variations** - Click through each before deciding
3. **Regenerate selectively** - Only regenerate images you don't like
4. **Use custom prompts** - More specific = better results
5. **Try different styles** - Each style can produce very different results

### For Developers

1. **Parallel generation** - Always use Promise.all for multiple images
2. **Seed tracking** - Store seeds for debugging and reproducibility
3. **Error isolation** - One failed image shouldn't break the batch
4. **State management** - Keep selection state separate from image data
5. **Loading states** - Show clear feedback during generation

## Future Enhancements

- [ ] Batch download (download all variations at once)
- [ ] Favorite/star specific variations
- [ ] Save variations to library with metadata
- [ ] A/B testing integration
- [ ] Image editing before download
- [ ] Share variations with team for feedback
- [ ] Analytics on which variations perform best
- [ ] Smart recommendations based on past selections

## Comparison: Before vs After

### Before

- Single image generation
- No options to choose from
- Had to regenerate everything to get different result
- No way to compare variations

### After

- 1-4 image variations per request
- Gallery view to browse options
- Regenerate individual images
- Easy comparison and selection
- Better user experience and flexibility

## Usage Example

```typescript
// Generate 3 variations
const result = await generateSocialMediaImage({
  topic: "Luxury beachfront property in Miami",
  platform: "instagram",
  aspectRatio: "1:1",
  style: "luxury",
  numberOfImages: 3,
  includeText: false,
});

// Result contains array of 3 images
result.images.forEach((img, index) => {
  console.log(`Image ${index + 1}:`, img.imageUrl);
  console.log(`Seed: ${img.seed}`);
});

// Regenerate a specific image
const newImage = await regenerateSingleImage(
  result.images[1].prompt,
  result.aspectRatio
);
```

## Notes

- Maximum 4 variations to balance quality and performance
- Each variation uses different seed for variety
- Regeneration maintains same prompt and settings
- All images validated through AWS Guardrails
- Images are base64 encoded PNG format
