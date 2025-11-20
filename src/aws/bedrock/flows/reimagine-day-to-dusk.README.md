# Day-to-Dusk Transformation Flow

## Overview

The day-to-dusk flow transforms daytime exterior property photos into attractive golden hour/dusk images. This creates warm, inviting evening ambiance that helps properties stand out in real estate listings.

## Model

**Amazon Titan Image Generator** (`amazon.titan-image-generator-v1`)

- Specialized in lighting transformations and atmosphere changes
- Excellent at preserving architectural details while changing lighting
- Supports fine-grained control over transformation intensity
- Maintains original image resolution and aspect ratio
- More readily available in AWS Bedrock than Stability AI SDXL

## Features

### Intensity Levels

1. **Subtle** (65% similarity to original)

   - Gentle golden hour lighting
   - Warm tones without dramatic changes
   - Best for properties that already have good lighting
   - CFG Scale: 7.0

2. **Moderate** (50% similarity to original)

   - Balanced dusk lighting
   - Enhanced warm glow and deeper sky colors
   - Recommended for most real estate photos
   - CFG Scale: 8.0

3. **Dramatic** (35% similarity to original)
   - Rich golden tones and deep blue sky
   - Enhanced interior lighting through windows
   - Cinematic style for luxury properties
   - CFG Scale: 9.0

### Transformation Details

The flow performs the following transformations:

1. **Sky Conversion**: Transforms daytime blue sky to warm golden hour colors (orange, pink, deep blue gradient)
2. **Overall Lighting**: Adds warm golden lighting to the entire scene
3. **Interior Lights**: Enhances visibility of interior lights through windows
4. **Preservation**: Maintains original composition, architecture, and structural details
5. **Resolution**: Preserves exact image resolution and aspect ratio

## Usage

```typescript
import { dayToDusk } from "@/aws/bedrock/flows/reimagine-day-to-dusk";

// Transform with moderate intensity (recommended)
const result = await dayToDusk({
  imageData: base64EncodedImage,
  imageFormat: "jpeg",
  params: {
    intensity: "moderate",
  },
});

// Result contains base64 encoded PNG image
const duskImage = result.duskImageData;
```

## Input Schema

```typescript
{
  imageData: string; // Base64 encoded source image
  imageFormat: "jpeg" | "png" | "webp";
  params: {
    intensity: "subtle" | "moderate" | "dramatic";
  }
}
```

## Output Schema

```typescript
{
  duskImageData: string; // Base64 encoded result image (PNG)
  imageFormat: string; // Always 'png'
}
```

## Best Practices

### When to Use

- Exterior property photos taken during daytime
- Properties with visible sky in the frame
- Photos that would benefit from warm, inviting lighting
- Listings that need to stand out with attractive evening shots

### When NOT to Use

- Interior photos (use enhancement instead)
- Photos already taken at dusk/sunset
- Images with no visible sky
- Photos where daytime lighting is a key selling point

### Tips for Best Results

1. **Start with Moderate**: The moderate intensity works well for most photos
2. **Good Source Images**: Best results with clear daytime photos showing sky
3. **Interior Lights**: Photos with visible interior lights through windows get enhanced glow
4. **Architecture**: Works best with exterior shots showing building facades
5. **Composition**: Ensure the original photo has good composition as it will be preserved

## Technical Details

### Model Configuration

- **Task Type**: IMAGE_VARIATION for image-to-image transformation
- **Quality**: Premium quality setting
- **Similarity Strength**: Varies by intensity (0.35 - 0.65, higher = more similar to original)
- **CFG Scale**: Varies by intensity (7.0 - 9.0)
- **Negative Prompt**: Prevents unwanted artifacts and structural changes
- **Resolution**: 1024x1024 optimal

### Error Handling

The flow handles common errors:

- **AccessDeniedException**: Model access not enabled
- **ThrottlingException**: Service busy, retry recommended
- **ValidationException**: Invalid image format or parameters
- **ServiceQuotaExceededException**: Quota exceeded

All errors include user-friendly messages with actionable guidance.

## Requirements Validation

This flow validates the following requirements:

- **3.2**: Invokes AWS Bedrock with image-to-image model for lighting adjustments
- **3.3**: Displays transformed image with warm evening lighting and sky gradients
- **10.2**: Uses model optimized for lighting and atmosphere transformation

## Performance

- **Processing Time**: Typically 10-20 seconds depending on image size
- **Quality**: Premium quality with 50 diffusion steps
- **Resolution**: Maintains original resolution (up to 1024x1024 optimal)
- **Format**: Returns PNG for best quality preservation

## Integration

This flow is designed to be called from server actions:

```typescript
// In reimagine-actions.ts
import { dayToDusk } from "@/aws/bedrock/flows/reimagine-day-to-dusk";

export async function processEditAction(
  imageId: string,
  editType: EditType,
  params: EditParams
) {
  if (editType === "day-to-dusk") {
    // Get source image from S3
    const imageData = await getImageFromS3(imageId);

    // Transform to dusk
    const result = await dayToDusk({
      imageData,
      imageFormat: "jpeg",
      params: params as DayToDuskParams,
    });

    // Save result to S3
    await saveResultToS3(result.duskImageData);
  }
}
```

## Future Enhancements

Potential improvements for future versions:

1. **Time of Day Selection**: Allow specific times (golden hour, blue hour, twilight)
2. **Weather Effects**: Add sunset clouds, fog, or atmospheric effects
3. **Seasonal Variations**: Summer vs winter evening lighting
4. **Custom Color Grading**: User-defined color palettes for sky
5. **Batch Processing**: Process multiple images with consistent settings
6. **Before/After Comparison**: Built-in comparison view generation
