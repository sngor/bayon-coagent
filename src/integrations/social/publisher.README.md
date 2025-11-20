# Social Media Publisher Service

## Overview

The Social Media Publisher Service handles publishing listing content to Facebook, Instagram, and LinkedIn. It manages platform-specific API calls, error handling, rate limiting, and stores post metadata in DynamoDB for tracking.

## Features

- **Multi-Platform Publishing**: Publish to Facebook, Instagram, and LinkedIn with a single interface
- **Error Handling**: Comprehensive error handling with retry support
- **Post Tracking**: Store post metadata (ID, URL, timestamp) in DynamoDB
- **Post Unpublishing**: Remove posts when listing status changes
- **Platform-Specific Logic**: Handle unique requirements for each platform

## Requirements Coverage

- **Requirement 7.3**: Create posts for all selected platforms
- **Requirement 7.4**: Record post ID and timestamp for tracking
- **Requirement 7.5**: Log errors, notify user, and allow retry

## Usage

### Basic Publishing

```typescript
import { createSocialPublisher } from "@/integrations/social/publisher";
import { getOAuthConnectionManager } from "@/integrations/oauth/connection-manager";

const publisher = createSocialPublisher();
const connectionManager = getOAuthConnectionManager();

// Get OAuth connection
const connection = await connectionManager.getConnection(userId, "facebook");

if (!connection) {
  throw new Error("Not connected to Facebook");
}

// Prepare post
const post: SocialPost = {
  listingId: "listing-123",
  content: "Beautiful 3-bedroom home in downtown...",
  images: [
    "https://s3.amazonaws.com/bucket/listing-123/photo1.jpg",
    "https://s3.amazonaws.com/bucket/listing-123/photo2.jpg",
  ],
  hashtags: ["#realestate", "#dreamhome", "#forsale"],
  platform: "facebook",
};

// Publish to Facebook
const result = await publisher.publishToFacebook(post, connection);

if (result.success) {
  console.log("Published successfully:", result.postId, result.postUrl);
} else {
  console.error("Publish failed:", result.error);
}
```

### Publishing to Multiple Platforms

```typescript
const platforms: Platform[] = ["facebook", "instagram", "linkedin"];
const results: PublishResult[] = [];

for (const platform of platforms) {
  const connection = await connectionManager.getConnection(userId, platform);

  if (!connection) {
    console.warn(`Not connected to ${platform}`);
    continue;
  }

  let result: PublishResult;

  switch (platform) {
    case "facebook":
      result = await publisher.publishToFacebook(post, connection);
      break;
    case "instagram":
      result = await publisher.publishToInstagram(post, connection);
      break;
    case "linkedin":
      result = await publisher.publishToLinkedIn(post, connection);
      break;
  }

  results.push(result);
}
```

### Unpublishing Posts

```typescript
// When listing status changes to sold, unpublish all posts
const posts = await getPostsForListing(listingId);

for (const post of posts) {
  if (post.status === "published") {
    const connection = await connectionManager.getConnection(
      userId,
      post.platform
    );

    if (connection) {
      await publisher.unpublishPost(
        post.platform,
        post.platformPostId,
        connection
      );
    }
  }
}
```

## Platform-Specific Details

### Facebook

- **API**: Facebook Graph API v18.0
- **Requirements**:
  - Page access token (obtained from user access token)
  - Selected Facebook page ID
- **Image Support**: Single or multiple images
- **Text-Only**: Supported via feed endpoint
- **Post URL Format**: `https://facebook.com/{postId}`

**Metadata Required**:

```typescript
connection.metadata = {
  pages: [{ id: "page-id", name: "Page Name" }],
  selectedPageId: "page-id", // Optional, uses first page if not set
};
```

### Instagram

- **API**: Instagram Graph API (via Facebook Graph API)
- **Requirements**:
  - Instagram Business Account
  - At least one image (required)
- **Publishing Process**: Two-step (create container, then publish)
- **Image Support**: Single image per post
- **Post URL Format**: `https://instagram.com/p/{postId}`

**Metadata Required**:

```typescript
connection.metadata = {
  businessAccounts: [
    {
      instagram_business_account: { id: "account-id" },
    },
  ],
  selectedInstagramAccountId: "account-id", // Optional
};
```

### LinkedIn

- **API**: LinkedIn UGC Posts API v2
- **Requirements**:
  - User URN (urn:li:person:{userId})
  - Bearer token authentication
- **Image Support**: Multiple images supported
- **Text-Only**: Supported
- **Post URL Format**: `https://www.linkedin.com/feed/update/{postId}`

## Error Handling

The publisher implements comprehensive error handling:

1. **API Errors**: Caught and returned in `PublishResult.error`
2. **Network Timeouts**: 15-second timeout per API call
3. **Missing Configuration**: Clear error messages for missing page IDs, accounts, etc.
4. **Failed Posts**: Stored in DynamoDB with error details for retry

### Common Errors

| Error                                        | Cause                             | Solution                           |
| -------------------------------------------- | --------------------------------- | ---------------------------------- |
| "No Facebook page selected"                  | No page in metadata               | Select a page in settings          |
| "No Instagram business account found"        | Not connected to business account | Connect Instagram business account |
| "Instagram posts require at least one image" | No images provided                | Add at least one image             |
| "Token refresh failed"                       | Expired refresh token             | Reconnect OAuth                    |

## Post Metadata Storage

All posts (successful and failed) are stored in DynamoDB:

```typescript
interface StoredSocialPost {
  postId: string; // Internal UUID
  listingId: string; // Associated listing
  platform: Platform; // facebook | instagram | linkedin
  platformPostId: string; // Platform's post ID
  platformPostUrl: string; // Public URL to post
  content: string; // Post text
  images: string[]; // Image URLs
  hashtags: string[]; // Hashtags used
  status: "published" | "failed" | "unpublished";
  publishedAt: number; // Timestamp
  error?: string; // Error message if failed
  createdAt: number; // Creation timestamp
}
```

**DynamoDB Keys**:

- PK: `USER#{userId}`
- SK: `POST#{postId}`
- GSI1PK: `LISTING#{listingId}` (for querying posts by listing)
- GSI1SK: `POST#{postId}`

## Rate Limiting

The publisher respects platform rate limits:

- **Facebook**: ~200 calls per hour per user
- **Instagram**: ~200 calls per hour per user
- **LinkedIn**: ~100 calls per day per user

Implement exponential backoff for rate limit errors:

```typescript
async function publishWithRetry(
  publisher: SocialPublisher,
  post: SocialPost,
  connection: OAuthConnection,
  maxRetries = 3
): Promise<PublishResult> {
  let lastError: string = "";

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await publisher.publishToFacebook(post, connection);

    if (result.success) {
      return result;
    }

    lastError = result.error || "Unknown error";

    // Check if rate limited
    if (lastError.includes("rate limit")) {
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    // Non-rate-limit error, don't retry
    break;
  }

  return { success: false, error: lastError };
}
```

## Testing

### Unit Tests

Test individual platform methods with mocked API responses:

```typescript
describe("SocialPublisherService", () => {
  it("should publish to Facebook successfully", async () => {
    // Mock Facebook API
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "post-123" }),
    });

    const publisher = createSocialPublisher();
    const result = await publisher.publishToFacebook(post, connection);

    expect(result.success).toBe(true);
    expect(result.postId).toBe("post-123");
  });
});
```

### Integration Tests

Test with real API credentials in a test environment:

```typescript
// Use test accounts and pages
const testConnection = await getOAuthConnectionManager().getConnection(
  testUserId,
  "facebook"
);

const result = await publisher.publishToFacebook(testPost, testConnection);
expect(result.success).toBe(true);

// Clean up: delete test post
await publisher.unpublishPost("facebook", result.postId!, testConnection);
```

## Future Enhancements

1. **Batch Publishing**: Publish to multiple platforms concurrently
2. **Scheduled Publishing**: Queue posts for future publication
3. **Multi-Image Support**: Proper album creation for Facebook
4. **Video Support**: Handle video content
5. **Analytics Integration**: Track post performance metrics
6. **Retry Queue**: Automatic retry for failed posts
7. **Draft Management**: Save drafts before publishing

## Related Services

- **Content Optimizer**: Formats content for platform-specific requirements
- **Image Optimizer**: Optimizes images for platform dimensions
- **OAuth Connection Manager**: Manages social media authentication
- **Performance Metrics**: Tracks post engagement and performance
