# Server Actions DynamoDB Migration

## Summary

This document tracks the migration of server actions from Firebase to DynamoDB in `src/app/actions.ts`.

## Changes Made

### 1. Updated Imports

**Removed:**

```typescript
import {
  setDocumentNonBlocking,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
} from "@/firebase";
```

**Added:**

```typescript
import { getRepository } from "@/aws/dynamodb/repository";
import {
  getAgentProfileKeys,
  getUserProfileKeys,
  getMarketingPlanKeys,
  getReviewAnalysisKeys,
} from "@/aws/dynamodb/keys";
import { v4 as uuidv4 } from "uuid";
```

### 2. Migrated Functions

#### `updateProfilePhotoAction`

**Before:**

```typescript
updateDocumentNonBlocking(`users/${userId}/agentProfiles/main`, { photoURL });
updateDocumentNonBlocking(`users/${userId}`, { photoURL });
```

**After:**

```typescript
const repository = getRepository();

// Update the agent-specific profile document
const agentKeys = getAgentProfileKeys(userId, "main");
await repository.update(agentKeys.PK, agentKeys.SK, { photoURL });

// Also update the root user profile document
const userKeys = getUserProfileKeys(userId);
await repository.update(userKeys.PK, userKeys.SK, { photoURL });
```

**Key Pattern:**

- `USER#${userId}` / `AGENT#main` for agent profile
- `USER#${userId}` / `PROFILE` for user profile

#### `generateMarketingPlanAction`

**Before:**

```typescript
addDocumentNonBlocking(`users/${userId}/marketingPlans`, dataToSave);
```

**After:**

```typescript
const planId = uuidv4();
const dataToSave = {
  id: planId,
  ...result,
  createdAt: new Date().toISOString(),
};

const repository = getRepository();
const keys = getMarketingPlanKeys(userId, planId);
await repository.create(keys.PK, keys.SK, "MarketingPlan", dataToSave);
```

**Key Pattern:**

- `USER#${userId}` / `PLAN#${planId}`
- Uses UUID for unique plan IDs

#### `analyzeMultipleReviewsAction`

**Before:**

```typescript
setDocumentNonBlocking(`users/${userId}/reviewAnalyses/main`, dataToSave, {
  merge: true,
});
```

**After:**

```typescript
const analysisId = "main";
const dataToSave = {
  ...result,
  id: analysisId,
  analyzedAt: new Date().toISOString(),
};

const repository = getRepository();
const keys = getReviewAnalysisKeys(userId, analysisId);

// Check if item exists to decide between create and update
const existing = await repository.get(keys.PK, keys.SK);
if (existing) {
  await repository.update(keys.PK, keys.SK, dataToSave);
} else {
  await repository.create(keys.PK, keys.SK, "ReviewAnalysis", dataToSave);
}
```

**Key Pattern:**

- `USER#${userId}` / `ANALYSIS#${analysisId}`
- Implements merge behavior by checking existence first

## Migration Patterns

### Firebase → DynamoDB Mapping

1. **setDocumentNonBlocking (with merge)**

   - Check if item exists with `repository.get()`
   - If exists: `repository.update()`
   - If not: `repository.create()`

2. **addDocumentNonBlocking**

   - Generate unique ID with `uuidv4()`
   - Use `repository.create()` with proper entity type

3. **updateDocumentNonBlocking**
   - Use `repository.update()` with partial data

### Key Generation

All keys follow the single-table design pattern:

- Partition Key (PK): `USER#${userId}` or `OAUTH#${userId}` or `REVIEW#${agentId}`
- Sort Key (SK): `ENTITY_TYPE#${entityId}` or specific identifier

### Error Handling

All migrated functions use the existing `handleAWSError()` helper to map AWS service errors to user-friendly messages.

## Dependencies Added

- `uuid` - For generating unique IDs
- `@types/uuid` - TypeScript types for uuid

## Testing Recommendations

1. Test profile photo updates with existing and new users
2. Test marketing plan generation and verify data persistence
3. Test review analysis with first-time and repeat analyses
4. Verify error handling for DynamoDB failures
5. Test concurrent operations to ensure data consistency

## Remaining Work

The following functions in `actions.ts` do NOT use Firebase and are already AWS-native:

- All AI generation actions (using Bedrock)
- S3 file operations
- Authentication actions (validation only)

## Notes

- All operations are now async and properly awaited
- Error handling includes AWS-specific error types
- Data structure preservation is maintained through the `Data` field in DynamoDB items
- Timestamps are automatically managed by the repository layer
