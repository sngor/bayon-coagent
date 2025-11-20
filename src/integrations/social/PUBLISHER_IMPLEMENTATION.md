# Social Media Publisher Implementation Summary

## Overview

Implemented the Social Media Publisher Service that handles publishing listing content to Facebook, Instagram, and LinkedIn. The service manages platform-specific API calls, comprehensive error handling, and stores post metadata in DynamoDB for tracking and analytics.

## Implementation Status

✅ **COMPLETE** - All task requirements implemented

## Files Created

1. **`src/integrations/social/publisher.ts`** (580 lines)

   - Main publisher service implementation
   - Platform-specific publishing methods
   - Error handling and retry logic
   - Post metadata storage

2. **`src/integrations/social/publisher.README.md`**

   - Comprehensive documentation
   - Usage examples
   - Platform-specific details
   - Error handling guide

3. **`src/integrations/social/publisher-example.ts`** (350 lines)
   - Example usage patterns
   - Multi-platform publishing
   - Retry logic examples
   - Server action integration

## Requirements Coverage

### ✅ Requirement 7.3: Multi-Platform Post Creation

- Implemented `publishToFacebook()` method
- Implemented `publishToInstagram()` method
- Implemented `publishToLinkedIn()` method
- Each method handles platform-specific API requirements

### ✅ Requirement 7.4: Post Tracking

- Store post metadata in DynamoDB after successful publish
- Record post ID, URL, and timestamp
- Use `getSocialPostKeys()` for proper key generation
- Support GSI queries by listing ID

### ✅ Requirement 7.5: Error Handling

- Comprehensive try-catch blocks in all methods
- Store failed posts with error messages
- Return detailed error information in `PublishResult`
- Log errors to console for debugging

## Key Features

### 1. Facebook Publishing

- **Single Image**: Posts via `/photos` endpoint
- **Multiple Images**: Posts first image (album support can be added)
- **Text-Only**: Posts via `/feed` endpoint
- **Page Selection**: Uses selected page from connection metadata
- **Page Access Token**: Automatically retrieves page token

### 2. Instagram Publishing

- **Two-Step Process**: Create container → Publish
- **Image Required**: At least one image must be provided
- **Business Account**: Uses Instagram business account from metadata
- **Single Image**: Current implementation (carousel support can be added)

### 3. LinkedIn Publishing

- **UGC Posts API**: Uses v2 API with proper headers
- **Image Support**: Multiple images supported
- **Text-Only**: Supported
- **User URN**: Constructs from platform user ID

### 4. Post Unpublishing

- Delete posts from all platforms
- Used when listing status changes to sold
- Handles platform-specific delete endpoints

### 5. Metadata Storage

- Store successful posts with full details
- Store failed posts with error messages
- Support querying by user and listing
- Track post status (published, failed, unpublished)

## Data Structures

### SocialPost (Input)

```typescript
{
  listingId: string;
  content: string;
  images: string[];      // S3 URLs
  hashtags: string[];
  platform: Platform;
}
```

### PublishResult (Output)

```typescript
{
  success: boolean;
  postId?: string;       // Platform's post ID
  postUrl?: string;      // Public URL
  error?: string;        // Error message if failed
}
```

### StoredSocialPost (DynamoDB)

```typescript
{
  postId: string;              // Internal UUID
  listingId: string;
  platform: Platform;
  platformPostId: string;      // Platform's ID
  platformPostUrl: string;
  content: string;
  images: string[];
  hashtags: string[];
  status: 'published' | 'failed' | 'unpublished';
  publishedAt: number;
  error?: string;
  createdAt: number;
}
```

## DynamoDB Schema

### Keys

- **PK**: `USER#{userId}`
- **SK**: `POST#{postId}`
- **GSI1PK**: `LISTING#{listingId}` (for querying posts by listing)
- **GSI1SK**: `POST#{postId}`

### Entity Type

- `EntityType: 'SocialPost'`

## Platform-Specific Details

### Facebook Graph API v18.0

- **Endpoint**: `https://graph.facebook.com/v18.0`
- **Authentication**: Page access token
- **Rate Limit**: ~200 calls/hour per user
- **Image Upload**: Via URL or multipart form data

### Instagram Graph API

- **Endpoint**: `https://graph.facebook.com/v18.0` (same as Facebook)
- **Authentication**: User access token
- **Rate Limit**: ~200 calls/hour per user
- **Two-Step Process**: Create container → Publish

### LinkedIn API v2

- **Endpoint**: `https://api.linkedin.com/v2`
- **Authentication**: Bearer token
- **Rate Limit**: ~100 calls/day per user
- **Headers**: Requires `X-Restli-Protocol-Version: 2.0.0`

## Error Handling

### Common Errors

1. **Missing Configuration**

   - No Facebook page selected
   - No Instagram business account
   - Missing OAuth connection

2. **API Errors**

   - Rate limiting
   - Invalid tokens
   - Network timeouts

3. **Content Errors**
   - Instagram requires images
   - Content too long (handled by ContentOptimizer)
   - Invalid image URLs

### Error Storage

All errors are:

- Logged to console
- Stored in DynamoDB with post record
- Returned in `PublishResult.error`
- Available for retry logic

## Integration Points

### Dependencies

- **OAuth Connection Manager**: Get platform connections
- **Content Optimizer**: Format content for platforms
- **Image Optimizer**: Optimize images (separate service)
- **DynamoDB Repository**: Store post metadata

### Used By

- Server actions for publishing
- Status sync service (for unpublishing)
- Publishing queue (future)
- Retry service (future)

## Testing Strategy

### Unit Tests (To Be Implemented)

- Mock platform APIs
- Test error handling
- Test metadata storage
- Test unpublishing

### Integration Tests (To Be Implemented)

- Use test accounts
- Test real API calls
- Test OAuth flow
- Clean up test posts

## Future Enhancements

1. **Batch Publishing**

   - Publish to multiple platforms concurrently
   - Use Promise.allSettled for parallel execution

2. **Scheduled Publishing**

   - Queue posts for future publication
   - Implement cron job for scheduled posts

3. **Multi-Image Support**

   - Facebook albums
   - Instagram carousels
   - LinkedIn multi-image posts

4. **Video Support**

   - Upload and publish videos
   - Platform-specific video requirements

5. **Analytics Integration**

   - Track post performance
   - Fetch engagement metrics
   - Store in PerformanceMetrics

6. **Retry Queue**

   - Automatic retry for failed posts
   - Exponential backoff
   - Max retry limits

7. **Draft Management**
   - Save drafts before publishing
   - Edit and republish
   - Version history

## Usage Example

```typescript
import { createSocialPublisher } from "@/integrations/social/publisher";
import { getOAuthConnectionManager } from "@/integrations/oauth/connection-manager";

const publisher = createSocialPublisher();
const connectionManager = getOAuthConnectionManager();

// Get connection
const connection = await connectionManager.getConnection(userId, "facebook");

// Prepare post
const post: SocialPost = {
  listingId: "listing-123",
  content: "Beautiful 3-bedroom home...",
  images: ["https://s3.../photo1.jpg"],
  hashtags: ["#realestate", "#dreamhome"],
  platform: "facebook",
};

// Publish
const result = await publisher.publishToFacebook(post, connection);

if (result.success) {
  console.log("Published:", result.postUrl);
} else {
  console.error("Failed:", result.error);
}
```

## Notes

- All API calls have 15-second timeout
- Tokens are managed by OAuth Connection Manager
- Post metadata is stored for all attempts (success and failure)
- Platform-specific metadata (page IDs, account IDs) stored in connection
- Supports both image and text-only posts (except Instagram)

## Related Tasks

- ✅ Task 7: Build OAuth connection manager
- ✅ Task 8: Implement OAuth callback routes
- ✅ Task 9: Build content optimizer service
- ✅ Task 11: Build image optimizer service
- ⏳ Task 14: Create publishing workflow and UI
- ⏳ Task 15: Implement performance metrics tracking
- ⏳ Task 16: Build status sync mechanism

## Completion Date

November 20, 2024
