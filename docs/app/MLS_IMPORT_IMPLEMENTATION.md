# MLS Listing Import Implementation

## Overview

This document describes the implementation of the MLS listing import functionality with retry logic and photo storage.

## Requirements Coverage

- **Requirement 2.1**: Automatic listing import within 15 minutes
- **Requirement 2.3**: Store imported listings in DynamoDB with MLS linkage
- **Requirement 2.4**: Retry logic with exponential backoff (3 attempts)

## Architecture

### Server Actions (`src/app/mls-actions.ts`)

The main entry point for MLS import operations. Provides the following functions:

#### `importMLSListings(connectionId: string)`

Triggers the import of all active listings from an MLS connection.

**Flow:**

1. Authenticate the current user
2. Retrieve the MLS connection from DynamoDB
3. Verify the connection token is not expired
4. Create an MLS connector for the provider
5. Fetch all active listings from the MLS
6. Import each listing with retry logic
7. Return detailed statistics about the import

**Response:**

```typescript
{
  success: boolean;
  message: string;
  data: {
    totalListings: number;
    successfulImports: number;
    failedImports: number;
    errors: Array<{
      mlsNumber: string;
      error: string;
      attempts: number;
    }>;
  }
}
```

#### `getImportedListings()`

Retrieves all imported listings for the current user.

#### `getListing(listingId: string)`

Gets a single listing by ID.

#### `deleteListing(listingId: string)`

Deletes a listing from the database.

## Retry Logic

### Exponential Backoff

The implementation uses exponential backoff with jitter for retry delays:

```typescript
function calculateBackoffDelay(attempt: number): number {
  const baseDelay = 1000; // 1 second
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000; // Random 0-1000ms
  return exponentialDelay + jitter;
}
```

**Delay Schedule:**

- Attempt 0: 1-2 seconds
- Attempt 1: 2-3 seconds
- Attempt 2: 4-5 seconds

### Retry Attempts

- **Listing Import**: 3 attempts maximum
- **Photo Download**: 2 attempts maximum

### Error Handling

All errors are logged with:

- MLS number
- Error message
- Number of attempts made

Failed imports are tracked and returned in the response for user visibility.

## Photo Storage

### S3 Storage Structure

Photos are stored in S3 with the following key pattern:

```
listings/<userId>/<listingId>/original/photo<index>.<extension>
```

Example:

```
listings/user123/flexmls-MLS12345-1234567890/original/photo0.jpg
listings/user123/flexmls-MLS12345-1234567890/original/photo1.jpg
```

### Photo Download Process

1. Fetch photo from MLS URL
2. Convert to Buffer
3. Extract file extension from URL
4. Generate S3 key
5. Upload to S3 with metadata
6. Store S3 URL in listing record

### Metadata

Each photo is stored with metadata:

- `listingId`: The listing this photo belongs to
- `photoIndex`: The order of the photo
- `originalUrl`: The original MLS URL

## DynamoDB Storage

### Listing Entity

Listings are stored with the following structure:

```typescript
{
  PK: "USER#<userId>",
  SK: "LISTING#<listingId>",
  GSI1PK: "MLS#<mlsProvider>#<mlsNumber>",
  GSI1SK: "STATUS#<status>",
  EntityType: "Listing",
  Data: {
    listingId: string;
    mlsId: string;
    mlsNumber: string;
    mlsProvider: string;
    address: Address;
    price: number;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    propertyType: string;
    status: "active" | "pending" | "sold" | "expired";
    listDate: string;
    description?: string;
    photos: Photo[];
    features: string[];
    syncedAt: number;
  },
  CreatedAt: number;
  UpdatedAt: number;
}
```

### Unique Listing ID

Each listing gets a unique ID combining:

- MLS provider
- MLS number
- Timestamp

Format: `<provider>-<mlsNumber>-<timestamp>`

Example: `flexmls-MLS12345-1234567890`

## Error Logging

All errors are logged to the console (and CloudWatch in production):

1. **Authentication Errors**: MLS connection issues
2. **Network Errors**: API communication failures
3. **Photo Download Errors**: Individual photo failures
4. **Import Errors**: Listing import failures with retry count

## Testing

Unit tests are provided in `src/app/__tests__/mls-actions.test.ts`:

- Exponential backoff calculation
- Import result statistics
- S3 key generation
- Listing ID generation
- Max attempts configuration
- Response format consistency

Run tests:

```bash
npm test -- src/app/__tests__/mls-actions.test.ts
```

## Usage Example

```typescript
import { importMLSListings } from "@/app/mls-actions";

// Trigger import
const result = await importMLSListings("connection-id-123");

if (result.success) {
  console.log(`Imported ${result.data.successfulImports} listings`);

  if (result.data.failedImports > 0) {
    console.log("Failed imports:", result.data.errors);
  }
} else {
  console.error("Import failed:", result.error);
}
```

## Future Enhancements

1. **Scheduled Imports**: Automatic import every 15 minutes using cron jobs
2. **Batch Processing**: Process listings in batches to avoid memory issues
3. **Progress Tracking**: Real-time progress updates via WebSocket
4. **Selective Import**: Allow users to select specific listings to import
5. **Photo Optimization**: Automatically optimize photos during import
6. **Duplicate Detection**: Prevent duplicate imports of the same listing

## Dependencies

- `@aws-sdk/client-s3`: S3 file storage
- `@aws-sdk/lib-dynamodb`: DynamoDB operations
- `@/integrations/mls/connector`: MLS API integration
- `@/aws/auth/cognito-client`: User authentication
- `@/aws/dynamodb/repository`: Database operations

## Related Files

- `src/app/mls-actions.ts`: Server actions implementation
- `src/app/__tests__/mls-actions.test.ts`: Unit tests
- `src/integrations/mls/connector.ts`: MLS connector
- `src/aws/dynamodb/repository.ts`: Database repository
- `src/aws/s3/client.ts`: S3 client
