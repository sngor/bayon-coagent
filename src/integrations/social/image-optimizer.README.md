# Image Optimizer Service

## Overview

The Image Optimizer Service provides platform-specific image optimization for social media publishing. It automatically resizes, compresses, and stores optimized images according to each platform's requirements.

## Features

- **Platform-Specific Optimization**: Automatically adjusts images to meet Facebook, Instagram, and LinkedIn specifications
- **Smart Dimension Selection**: Chooses optimal dimensions based on original image aspect ratio
- **File Size Compression**: Ensures all images are under 5MB while maintaining quality
- **Batch Processing**: Processes multiple images concurrently with configurable limits
- **Error Handling**: Gracefully handles optimization failures without breaking the entire batch
- **S3 Integration**: Automatically downloads originals and uploads optimized versions

## Platform Specifications

### Facebook

- **Dimensions**: 1200x630px (1.91:1 aspect ratio)
- **Max Images**: 10
- **Max File Size**: 5MB

### Instagram

- **Dimensions**:
  - Square: 1080x1080px (1:1 aspect ratio)
  - Portrait: 1080x1350px (4:5 aspect ratio)
- **Max Images**: 10
- **Max File Size**: 5MB
- **Smart Selection**: Automatically chooses square or portrait based on original image

### LinkedIn

- **Dimensions**: 1200x627px (1.91:1 aspect ratio)
- **Max Images**: 9
- **Max File Size**: 5MB

## Usage

### Basic Usage

```typescript
import { createImageOptimizer } from "@/integrations/social/image-optimizer";

const optimizer = createImageOptimizer();

// Optimize images for a platform
const optimizedImages = await optimizer.optimizeImages(
  [
    "s3://bucket/listings/user123/listing456/original/photo1.jpg",
    "s3://bucket/listings/user123/listing456/original/photo2.jpg",
  ],
  "instagram",
  "listing456",
  "user123"
);

console.log(optimizedImages);
// [
//   {
//     originalUrl: "s3://...",
//     optimizedUrl: "s3://bucket/listings/user123/listing456/instagram/photo0.jpg",
//     width: 1080,
//     height: 1080,
//     fileSize: 2456789
//   },
//   ...
// ]
```

### Integration with Content Optimizer

```typescript
import { createContentOptimizer } from "@/integrations/social/content-optimizer";
import { createImageOptimizer } from "@/integrations/social/image-optimizer";

const contentOptimizer = createContentOptimizer();
const imageOptimizer = createImageOptimizer();

// Format content
const formattedContent = await contentOptimizer.formatForPlatform(
  listing,
  "facebook"
);

// Optimize images
const optimizedImages = await imageOptimizer.optimizeImages(
  listing.photos.map((p) => p.url),
  "facebook",
  listing.mlsId,
  userId
);

// Use in social post
const post = {
  listingId: listing.mlsId,
  content: formattedContent.text,
  images: optimizedImages.map((img) => img.optimizedUrl),
  hashtags: await contentOptimizer.generateHashtags(listing, "facebook"),
  platform: "facebook",
};
```

## S3 Storage Structure

Optimized images are stored in S3 with the following structure:

```
/listings/<userId>/<listingId>/
  ├── original/
  │   ├── photo1.jpg
  │   ├── photo2.jpg
  │   └── ...
  ├── facebook/
  │   ├── photo0.jpg
  │   ├── photo1.jpg
  │   └── ...
  ├── instagram/
  │   ├── photo0.jpg
  │   ├── photo1.jpg
  │   └── ...
  └── linkedin/
      ├── photo0.jpg
      ├── photo1.jpg
      └── ...
```

## Image Processing Details

### Resize Strategy

Images are resized using Sharp's `cover` fit mode with center positioning:

- Maintains aspect ratio
- Crops to exact dimensions
- Centers the crop area

### Compression Strategy

1. Start with 90% JPEG quality
2. If file size exceeds limit, reduce quality by 5% increments
3. Minimum quality: 60%
4. Uses mozjpeg for better compression
5. Throws error if unable to compress below 5MB at minimum quality

### Concurrent Processing

- Processes images in batches of 3 concurrent operations
- Prevents overwhelming the system with too many simultaneous operations
- Continues processing even if individual images fail

## Error Handling

The service implements comprehensive error handling:

### Individual Image Failures

```typescript
// Failed images are logged but don't stop the batch
const optimizedImages = await optimizer.optimizeImages(
  images,
  platform,
  listingId,
  userId
);

// Returns only successfully optimized images
// Failed images are excluded from the result
```

### Common Error Scenarios

1. **Image Download Failure**: Original image not found in S3
2. **Invalid Image Format**: Image cannot be processed by Sharp
3. **Compression Failure**: Unable to compress below 5MB
4. **Upload Failure**: Cannot upload optimized image to S3

All errors are logged with context for debugging.

## Performance Considerations

### Optimization Time

- Small images (< 1MB): ~100-200ms per image
- Medium images (1-3MB): ~300-500ms per image
- Large images (3-10MB): ~500-1000ms per image

### Batch Processing

- 10 images: ~2-5 seconds
- 20 images: ~4-10 seconds
- Scales linearly with concurrent processing

### Memory Usage

- Sharp is memory-efficient
- Processes images in streams when possible
- Releases memory after each image

## Testing

### Unit Tests

```typescript
import { ImageOptimizerService } from "./image-optimizer";

describe("ImageOptimizerService", () => {
  it("should optimize images for Facebook", async () => {
    const optimizer = new ImageOptimizerService();
    const result = await optimizer.optimizeImages(
      [testImageUrl],
      "facebook",
      "test-listing",
      "test-user"
    );

    expect(result[0].width).toBe(1200);
    expect(result[0].height).toBe(630);
    expect(result[0].fileSize).toBeLessThan(5 * 1024 * 1024);
  });
});
```

## Requirements Coverage

- ✅ **10.1**: Facebook optimization (1200x630px)
- ✅ **10.2**: Instagram optimization (1080x1080px square, 1080x1350px portrait)
- ✅ **10.3**: LinkedIn optimization (1200x627px)
- ✅ **10.4**: File size compression to under 5MB
- ✅ **10.5**: Error handling for optimization failures

## Dependencies

- **sharp**: High-performance image processing
- **@aws-sdk/client-s3**: S3 file operations
- **Platform constants**: Dimension and size specifications

## Future Enhancements

- [ ] Support for additional image formats (PNG, WebP)
- [ ] Watermark support
- [ ] Image quality analysis
- [ ] Automatic color correction
- [ ] Face detection for smart cropping
- [ ] Batch optimization progress tracking
- [ ] Caching of optimized images
- [ ] CDN integration for faster delivery
