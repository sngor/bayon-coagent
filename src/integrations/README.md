# Integrations Module

This module contains all third-party integration code for the MLS and Social Media Integration feature.

## Structure

```
/src/integrations
├── /mls                    # MLS integration
│   ├── types.ts           # TypeScript interfaces for MLS entities
│   ├── schemas.ts         # Zod validation schemas
│   └── index.ts           # Module exports
├── /social                # Social media integration
│   ├── types.ts           # TypeScript interfaces for social entities
│   ├── schemas.ts         # Zod validation schemas
│   ├── constants.ts       # Platform-specific constants
│   └── index.ts           # Module exports
└── index.ts               # Main module exports
```

## MLS Integration

### Types

- `MLSCredentials`: Authentication credentials for MLS providers
- `MLSConnection`: Stored connection with tokens and metadata
- `Listing`: Core listing data structure
- `ListingDetails`: Extended listing with additional fields
- `Address`: Property address structure
- `Photo`: Listing photo metadata
- `StatusUpdate`: Status change tracking

### Schemas

All types have corresponding Zod schemas for runtime validation:

- `MLSCredentialsSchema`
- `MLSConnectionSchema`
- `ListingSchema`
- `AddressSchema`
- `PhotoSchema`
- `StatusUpdateSchema`

## Social Media Integration

### Types

- `Platform`: Union type for supported platforms (facebook, instagram, linkedin)
- `OAuthConnection`: OAuth connection with tokens and metadata
- `SocialPost`: Post content and metadata
- `PublishResult`: Result of publishing operation
- `FormattedContent`: Platform-formatted content
- `OptimizedImage`: Optimized image metadata
- `PerformanceMetrics`: Engagement metrics
- `StoredSocialPost`: Persisted post record

### Schemas

All types have corresponding Zod schemas for runtime validation:

- `PlatformSchema`
- `OAuthConnectionSchema`
- `SocialPostSchema`
- `PublishResultSchema`
- `FormattedContentSchema`
- `OptimizedImageSchema`
- `PerformanceMetricsSchema`
- `StoredSocialPostSchema`

### Constants

Platform-specific limits and configuration:

#### `PLATFORM_LIMITS`

Character limits, image dimensions, and file size constraints for each platform:

- **Facebook**: 2000 chars, 10 images, 1200x630px, 5MB
- **Instagram**: 2200 chars, 10 images, 1080x1080px or 1080x1350px, 5MB
- **LinkedIn**: 3000 chars, 9 images, 1200x627px, 5MB

#### Other Constants

- `GENERAL_HASHTAG_RANGE`: 5-15 hashtags for most platforms
- `INSTAGRAM_HASHTAG_MAX`: 30 hashtags for Instagram
- `DESCRIPTION_WORD_COUNT`: 150-300 words for AI descriptions
- `MLS_SYNC_INTERVAL_MINUTES`: 15 minutes between syncs
- `IMPORT_RETRY_ATTEMPTS`: 3 retry attempts for failed imports
- `OAUTH_SCOPES`: Required OAuth scopes per platform
- `PLATFORM_API_ENDPOINTS`: API base URLs
- `S3_IMAGE_PATHS`: S3 directory structure for images

## Usage

```typescript
import { MLS, Social } from "@/integrations";

// Use MLS types
const listing: MLS.Listing = { ... };

// Validate with schemas
const result = MLS.ListingSchema.safeParse(data);

// Use social media constants
const fbLimits = Social.PLATFORM_LIMITS.facebook;

// Validate social post
const postResult = Social.SocialPostSchema.safeParse(postData);
```

## Requirements Coverage

This module implements the following requirements:

- **1.1, 1.2**: MLS connection types and credentials
- **2.2**: Listing data structure with all required fields
- **6.1**: OAuth connection types
- **7.2**: Social post structure
- **8.1, 8.2, 8.3**: Platform-specific formatting constants
