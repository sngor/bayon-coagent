# Reimagine Image Analysis Flow

## Overview

The `reimagine-analyze` flow uses Claude 3.5 Sonnet's vision capabilities to analyze property images and generate contextual edit suggestions. This flow is a core component of the Reimagine Image Toolkit feature.

## Requirements Validated

- **13.1**: Upload triggers AI analysis
- **13.2**: System invokes AWS Bedrock with vision model
- **13.3**: Display recommendations with explanations
- **13.4**: Suggest virtual staging for empty rooms
- **13.5**: Suggest day-to-dusk for daytime exteriors
- **13.6**: Suggest enhancement for quality issues
- **13.7**: Suggest item removal for distracting objects
- **13.8**: Suggest virtual renovation for dated features

## Usage

```typescript
import { analyzeImage } from "@/aws/bedrock/flows/reimagine-analyze";

const result = await analyzeImage({
  imageData: base64EncodedImage,
  imageFormat: "jpeg", // or 'png', 'webp'
});

console.log("Analysis:", result.analysis);
console.log("Suggestions:", result.suggestions);
```

## Input Schema

```typescript
{
  imageData: string; // Base64 encoded image data
  imageFormat: "jpeg" | "png" | "webp";
}
```

## Output Schema

```typescript
{
  suggestions: EditSuggestion[];  // Array of edit suggestions
  analysis: string;               // Brief description of image
}
```

### EditSuggestion Structure

```typescript
{
  editType: 'virtual-staging' | 'day-to-dusk' | 'enhance' | 'item-removal' | 'virtual-renovation';
  priority: 'high' | 'medium' | 'low';
  reason: string;                    // Explanation for suggestion
  suggestedParams?: Partial<EditParams>;  // Pre-populated parameters
  confidence: number;                // 0-1 confidence score
}
```

## Model Configuration

- **Model**: Claude 3.5 Sonnet V2 (`us.anthropic.claude-3-5-sonnet-20241022-v2:0`)
- **Temperature**: 0.3 (lower for consistent analysis)
- **Max Tokens**: 4096
- **Top P**: 1

## Error Handling

The flow includes robust error handling with fallback suggestions:

- If image analysis fails for any reason, the flow returns a fallback suggestion for image enhancement
- This ensures the upload workflow can proceed even if AI analysis is temporarily unavailable
- Errors are logged but don't block the user experience

## Contextual Suggestions

The flow generates suggestions based on image content:

1. **Empty Rooms** → Virtual Staging
   - Detects empty rooms and suggests appropriate room type and style
2. **Daytime Exteriors** → Day-to-Dusk
   - Identifies daytime exterior photos and suggests lighting transformation
3. **Quality Issues** → Enhancement
   - Detects poor lighting, low contrast, or other quality issues
4. **Distracting Objects** → Item Removal
   - Identifies unwanted objects in the frame
5. **Dated Features** → Virtual Renovation
   - Recognizes outdated fixtures or finishes

## Testing

The flow includes comprehensive tests:

```bash
npm test -- reimagine-analyze.test.ts
```

Tests verify:

- Valid suggestion structure
- Proper error handling with fallbacks
- Correct field types and ranges

## Integration

This flow is called by the upload action after an image is successfully uploaded to S3:

```typescript
// In upload action
const suggestions = await analyzeImage({
  imageData: base64Image,
  imageFormat: "jpeg",
});

// Save suggestions with image metadata
await saveImageMetadata(userId, imageId, {
  ...metadata,
  suggestions,
});
```

## Performance

- Average response time: 3-5 seconds
- Timeout: 60 seconds
- Retry logic: Handled by BedrockClient with exponential backoff

## Future Enhancements

1. **Caching**: Cache suggestions for 5 minutes to avoid re-analysis
2. **Batch Analysis**: Support analyzing multiple images in one request
3. **Custom Prompts**: Allow users to provide additional context
4. **Confidence Thresholds**: Filter suggestions below confidence threshold
5. **Learning**: Track which suggestions users accept to improve recommendations
