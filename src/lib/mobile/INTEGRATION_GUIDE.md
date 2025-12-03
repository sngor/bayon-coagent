# Mobile Repository Methods - Integration Guide

## Overview

The mobile repository methods have been defined in `src/aws/dynamodb/mobile-repository-methods.ts`. These methods need to be integrated into the main `DynamoDBRepository` class.

## Integration Steps

### Step 1: Locate the Integration Point

Open `src/aws/dynamodb/repository.ts` and find the end of the `DynamoDBRepository` class. Look for the `queryOfflineSyncOperations` method (around line 3219-3227). The class ends with a closing brace `}` after this method.

### Step 2: Add the Mobile Methods

Copy all the methods from `src/aws/dynamodb/mobile-repository-methods.ts` and paste them **before** the closing brace of the `DynamoDBRepository` class.

The structure should look like this:

```typescript
export class DynamoDBRepository {
  // ... existing methods ...

  async queryOfflineSyncOperations<T>(
    userId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<T>> {
    const pk = `USER#${userId}`;
    const skPrefix = "OFFLINE_SYNC#";
    return this.query<T>(pk, skPrefix, options);
  }

  // ==================== Mobile Agent Features Methods ====================
  // PASTE MOBILE METHODS HERE (from mobile-repository-methods.ts)

  async createMobileCapture<T>(
    userId: string,
    captureId: string,
    captureData: T
  ): Promise<DynamoDBItem<T>> {
    // ... method implementation ...
  }

  // ... rest of mobile methods ...
} // <-- Class closing brace

// Export a singleton instance
let repositoryInstance: DynamoDBRepository | null = null;
// ... rest of file ...
```

### Step 3: Verify the Integration

After adding the methods, verify that:

1. All methods are properly indented (2 spaces for class methods)
2. The closing brace of the class comes after all mobile methods
3. No syntax errors are present

Run TypeScript check:

```bash
npx tsc --noEmit src/aws/dynamodb/repository.ts
```

### Step 4: Test the Methods

Create a simple test to verify the methods work:

```typescript
import { repository } from "@/aws/dynamodb/repository";

// Test mobile capture
const captureId = crypto.randomUUID();
await repository.createMobileCapture("user-123", captureId, {
  id: captureId,
  userId: "user-123",
  type: "photo",
  content: "s3://bucket/photo.jpg",
  timestamp: Date.now(),
  processed: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const capture = await repository.getMobileCapture("user-123", captureId);
console.log("Capture retrieved:", capture);
```

## Alternative: Use the Separate File

If you prefer not to modify the main repository file, you can:

1. Keep the methods in `mobile-repository-methods.ts`
2. Create a wrapper class that extends `DynamoDBRepository`
3. Import and use the extended class in mobile-specific code

Example:

```typescript
// src/aws/dynamodb/mobile-repository.ts
import { DynamoDBRepository } from "./repository";
import type { DynamoDBItem, QueryOptions, QueryResult } from "./types";

export class MobileDynamoDBRepository extends DynamoDBRepository {
  // Copy all methods from mobile-repository-methods.ts here
  async createMobileCapture<T>(
    userId: string,
    captureId: string,
    captureData: T
  ): Promise<DynamoDBItem<T>> {
    const { getMobileCaptureKeys } = await import("./keys");
    const keys = getMobileCaptureKeys(userId, captureId);
    return this.create(keys.PK, keys.SK, "MobileCapture", captureData);
  }

  // ... rest of methods ...
}

export const mobileRepository = new MobileDynamoDBRepository();
```

Then use it in your mobile code:

```typescript
import { mobileRepository } from "@/aws/dynamodb/mobile-repository";

await mobileRepository.createMobileCapture(userId, captureId, data);
```

## Verification Checklist

- [ ] Methods added to `DynamoDBRepository` class (or extended class created)
- [ ] TypeScript compilation successful
- [ ] No linting errors
- [ ] Test query executes successfully
- [ ] All 5 entity types have CRUD methods
- [ ] Specialized query methods work (by property, by appointment)

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors after integration:

1. Check that all methods are inside the class definition
2. Verify proper indentation
3. Ensure no duplicate method names
4. Check that imports at the top of the file are correct

### Runtime Errors

If methods fail at runtime:

1. Verify DynamoDB table exists
2. Check AWS credentials are configured
3. Ensure key generation functions exist in `keys.ts`
4. Verify entity types are added to the `EntityType` union in `types.ts`

## Next Steps

After successful integration:

1. Write unit tests for the mobile methods
2. Create server actions that use these methods
3. Build UI components that call the server actions
4. Test end-to-end mobile workflows

## Support

For issues or questions:

- Check `REPOSITORY_README.md` for usage examples
- Review `types.ts` for type definitions
- See `example-usage.ts` for code samples
