# Virtual Staging Flow

## Overview

The Virtual Staging flow uses Amazon Titan Image Generator to add furniture and decor to empty room images. This helps real estate agents showcase properties by allowing potential buyers to visualize how spaces can be furnished.

## Requirements

- **Requirements**: 2.2, 2.3, 10.1
- **Model**: Amazon Titan Image Generator (`amazon.titan-image-generator-v1`)
- **Task Type**: IMAGE_VARIATION (conditioning on input image)

## Input

```typescript
{
  imageData: string; // Base64 encoded source image
  imageFormat: "jpeg" | "png" | "webp";
  params: {
    roomType: "living-room" |
      "bedroom" |
      "kitchen" |
      "dining-room" |
      "office" |
      "bathroom";
    style: "modern" |
      "traditional" |
      "minimalist" |
      "luxury" |
      "rustic" |
      "contemporary";
  }
}
```

## Output

```typescript
{
  stagedImageData: string; // Base64 encoded staged image
  imageFormat: string; // 'png' (Titan returns PNG)
}
```

## How It Works

1. **Input Validation**: Validates the source image and staging parameters
2. **Prompt Construction**: Builds a detailed prompt based on room type and style
3. **Image Generation**: Uses Titan's IMAGE_VARIATION task to:
   - Preserve the room's structure, walls, and architectural features
   - Add appropriate furniture based on room type
   - Apply the selected style aesthetic
   - Maintain realistic lighting and perspective
4. **Response Processing**: Extracts and returns the staged image

## Room Types

- **living-room**: Comfortable seating, coffee table, entertainment area
- **bedroom**: Bed, nightstands, bedroom furniture
- **kitchen**: Appliances, countertops, dining area
- **dining-room**: Dining table, chairs, appropriate decor
- **office**: Desk, chair, shelving, work equipment
- **bathroom**: Fixtures and appropriate decor

## Furniture Styles

- **modern**: Clean lines, minimalist aesthetic, contemporary furniture
- **traditional**: Classic furniture, warm tones, timeless design
- **minimalist**: Simple, uncluttered, neutral colors, essential furniture only
- **luxury**: High-end furniture, elegant details, premium materials
- **rustic**: Natural materials, warm wood tones, cozy atmosphere
- **contemporary**: Current trends, stylish, comfortable and functional

## Configuration

The flow uses the following Titan Image Generator settings:

- **Similarity Strength**: 0.7 (balances structure preservation with furniture addition)
- **Quality**: Premium
- **Resolution**: 1024x1024
- **CFG Scale**: 8.0 (prompt adherence)
- **Number of Images**: 1

## Error Handling

The flow handles common errors:

- **AccessDeniedException**: Model access not enabled
- **ThrottlingException**: Service busy, retry suggested
- **ValidationException**: Invalid image format or parameters
- **Empty Response**: No images generated

## Usage Example

```typescript
import { virtualStaging } from "@/aws/bedrock/flows";

const result = await virtualStaging({
  imageData: base64EncodedImage,
  imageFormat: "jpeg",
  params: {
    roomType: "living-room",
    style: "modern",
  },
});

// result.stagedImageData contains the base64 encoded staged image
// result.imageFormat is 'png'
```

## Best Practices

1. **Image Quality**: Use high-resolution source images for best results
2. **Empty Rooms**: Works best with completely empty rooms
3. **Good Lighting**: Well-lit rooms produce better staging results
4. **Clear Architecture**: Rooms with visible walls and structure work best
5. **Appropriate Room Type**: Select the correct room type for accurate furniture placement

## Limitations

- Requires AWS Bedrock access to Amazon Titan Image Generator
- Processing time: ~10-30 seconds per image
- Output resolution: 1024x1024 (may differ from input)
- Works best with interior room photos
- May not perfectly match all architectural styles

## Related Flows

- **reimagine-analyze**: Analyzes images and suggests virtual staging when appropriate
- **reimagine-enhance**: Improves image quality before or after staging
- **reimagine-day-to-dusk**: Can be combined with staging for exterior shots

## Testing

The flow can be tested with:

- Various room types and styles
- Different image resolutions
- Edge cases (very small/large rooms, unusual layouts)
- Error scenarios (invalid formats, missing model access)
