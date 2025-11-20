# MLS and Social Media Integration - DynamoDB Schema

This document describes the DynamoDB schema and repository methods for the MLS and Social Media Integration feature.

## Entity Types

The following new entity types have been added:

- `Listing`: Property listings imported from MLS
- `MLSConnection`: MLS provider connections with authentication tokens
- `SocialConnection`: OAuth connections to social media platforms
- `SocialPost`: Published social media posts
- `PerformanceMetrics`: Engagement metrics for listings

## Key Patterns

### Listing

```
PK: USER#<userId>
SK: LISTING#<listingId>
GSI1PK: MLS#<mlsProvider>#<mlsNumber>  (for MLS number lookups)
GSI1SK: STATUS#<status>                 (for status filtering)
```

### MLS Connection

```
PK: USER#<userId>
SK: MLS_CONNECTION#<connectionId>
```

### Social Connection

```
PK: USER#<userId>
SK: SOCIAL#<PLATFORM>  (e.g., SOCIAL#FACEBOOK, SOCIAL#INSTAGRAM, SOCIAL#LINKEDIN)
```

### Social Post

```
PK: USER#<userId>
SK: POST#<postId>
GSI1PK: LISTING#<listingId>  (for listing-based queries)
GSI1SK: POST#<postId>
```

### Performance Metrics

```
PK: USER#<userId>
SK: METRICS#<listingId>#<date>  (date format: YYYY-MM-DD)
```

## Repository Methods

### Listing Operations

#### Create Listing

```typescript
await repository.createListing(userId, listingId, listingData);
```

#### Get Listing

```typescript
const listing = await repository.getListing(userId, listingId);
```

#### Update Listing

```typescript
await repository.updateListing(userId, listingId, { price: 550000 });
```

#### Delete Listing

```typescript
await repository.deleteListing(userId, listingId);
```

#### Query User's Listings

```typescript
const result = await repository.queryListings(userId, {
  limit: 50,
  scanIndexForward: false, // Most recent first
});
```

#### Query by MLS Number (GSI)

```typescript
const result = await repository.queryListingsByMLSNumber("flexmls", "MLS-456");
```

#### Query by Status (GSI)

```typescript
const result = await repository.queryListingsByStatus(
  "flexmls",
  "MLS-456",
  "active"
);
```

### MLS Connection Operations

#### Create MLS Connection

```typescript
await repository.createMLSConnection(userId, connectionId, connectionData);
```

#### Get MLS Connection

```typescript
const connection = await repository.getMLSConnection(userId, connectionId);
```

#### Update MLS Connection

```typescript
await repository.updateMLSConnection(userId, connectionId, {
  accessToken: newToken,
  expiresAt: newExpiry,
});
```

#### Delete MLS Connection

```typescript
await repository.deleteMLSConnection(userId, connectionId);
```

#### Query User's MLS Connections

```typescript
const result = await repository.queryMLSConnections(userId);
```

### Social Connection Operations

#### Create Social Connection

```typescript
await repository.createSocialConnection(userId, "facebook", connectionData);
```

#### Get Social Connection

```typescript
const connection = await repository.getSocialConnection(userId, "facebook");
```

#### Update Social Connection

```typescript
await repository.updateSocialConnection(userId, "facebook", {
  accessToken: newToken,
});
```

#### Delete Social Connection

```typescript
await repository.deleteSocialConnection(userId, "facebook");
```

#### Query User's Social Connections

```typescript
const result = await repository.querySocialConnections(userId);
```

### Social Post Operations

#### Create Social Post

```typescript
await repository.createSocialPost(userId, postId, postData, listingId);
```

#### Get Social Post

```typescript
const post = await repository.getSocialPost(userId, postId);
```

#### Update Social Post

```typescript
await repository.updateSocialPost(userId, postId, {
  status: "unpublished",
});
```

#### Delete Social Post

```typescript
await repository.deleteSocialPost(userId, postId);
```

#### Query User's Social Posts

```typescript
const result = await repository.querySocialPosts(userId);
```

#### Query Posts by Listing (GSI)

```typescript
const result = await repository.querySocialPostsByListing("listing-1");
```

### Performance Metrics Operations

#### Save Performance Metrics

```typescript
await repository.savePerformanceMetrics(
  userId,
  listingId,
  "2024-01-15",
  metricsData
);
```

#### Get Performance Metrics

```typescript
const metrics = await repository.getPerformanceMetrics(
  userId,
  listingId,
  "2024-01-15"
);
```

#### Update Performance Metrics

```typescript
await repository.updatePerformanceMetrics(userId, listingId, "2024-01-15", {
  views: 150,
});
```

#### Query Metrics for a Listing

```typescript
const result = await repository.queryPerformanceMetrics(userId, listingId, {
  limit: 30, // Last 30 days
  scanIndexForward: false, // Most recent first
});
```

## Access Patterns

### 1. Get all listings for a user

- Query: `PK = USER#<userId>` AND `SK begins_with LISTING#`

### 2. Find listing by MLS number

- Query GSI1: `GSI1PK = MLS#<provider>#<mlsNumber>`

### 3. Find active listings by MLS number

- Query GSI1: `GSI1PK = MLS#<provider>#<mlsNumber>` AND `GSI1SK = STATUS#active`

### 4. Get all posts for a listing

- Query GSI1: `GSI1PK = LISTING#<listingId>`

### 5. Get metrics for a listing over time

- Query: `PK = USER#<userId>` AND `SK begins_with METRICS#<listingId>#`

### 6. Get social connections for a user

- Query: `PK = USER#<userId>` AND `SK begins_with SOCIAL#`

## GSI Configuration

The implementation assumes a GSI named `GSI1` with the following structure:

```
GSI1:
  Partition Key: GSI1PK
  Sort Key: GSI1SK
```

This GSI enables:

- Listing lookups by MLS number
- Listing filtering by status
- Post lookups by listing ID

## Example Usage

```typescript
import { getRepository } from "@/aws/dynamodb/repository";

const repository = getRepository();

// Import a listing from MLS
const listing = await repository.createListing(userId, listingId, {
  mlsId: "mls-123",
  mlsNumber: "MLS-456",
  mlsProvider: "flexmls",
  status: "active",
  price: 500000,
  bedrooms: 3,
  bathrooms: 2,
  squareFeet: 2000,
  propertyType: "Single Family",
  address: {
    street: "123 Main St",
    city: "San Francisco",
    state: "CA",
    zipCode: "94102",
    country: "US",
  },
  photos: [],
  features: ["Pool", "Garage"],
  listDate: "2024-01-15",
});

// Create a social media post for the listing
await repository.createSocialPost(
  userId,
  postId,
  {
    postId,
    listingId,
    platform: "facebook",
    platformPostId: "fb-post-123",
    platformPostUrl: "https://facebook.com/posts/123",
    content: "Beautiful 3BR home in SF!",
    images: ["https://s3.../photo1.jpg"],
    hashtags: ["#RealEstate", "#SanFrancisco"],
    status: "published",
    publishedAt: Date.now(),
    createdAt: Date.now(),
  },
  listingId
);

// Record performance metrics
await repository.savePerformanceMetrics(userId, listingId, "2024-01-15", {
  listingId,
  date: "2024-01-15",
  views: 100,
  shares: 5,
  inquiries: 2,
  platforms: {
    facebook: {
      views: 60,
      shares: 3,
      inquiries: 1,
      clicks: 45,
      engagement: 0.75,
    },
    instagram: {
      views: 40,
      shares: 2,
      inquiries: 1,
      clicks: 30,
      engagement: 0.75,
    },
  },
  updatedAt: Date.now(),
});

// Query all posts for a listing
const posts = await repository.querySocialPostsByListing(listingId);

// Find listing by MLS number
const listings = await repository.queryListingsByMLSNumber(
  "flexmls",
  "MLS-456"
);
```

## Notes

- All tokens (MLS and OAuth) should be encrypted before storage
- The repository handles automatic timestamps (CreatedAt, UpdatedAt)
- GSI queries may have eventual consistency
- Batch operations are available for bulk imports
- All methods include retry logic for transient failures
