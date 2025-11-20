# Reimagine DynamoDB Implementation

## Overview

This document describes the DynamoDB extensions implemented for the Reimagine Image Toolkit feature.

## Changes Made

### 1. Key Patterns (`keys.ts`)

Added two new key generation functions following the single-table design pattern:

#### `getImageMetadataKeys(userId: string, imageId: string)`

- **Pattern**: `PK: USER#<userId>`, `SK: IMAGE#<imageId>`
- **Purpose**: Store metadata for uploaded images including file info, dimensions, and AI suggestions
- **Example**: `{ PK: 'USER#user123', SK: 'IMAGE#img456' }`

#### `getEditRecordKeys(userId: string, editId: string)`

- **Pattern**: `PK: USER#<userId>`, `SK: EDIT#<editId>`
- **Purpose**: Store edit operation records including type, parameters, status, and results
- **Example**: `{ PK: 'USER#user123', SK: 'EDIT#edit789' }`

### 2. Entity Types (`types.ts`)

Added two new entity types to the `EntityType` union:

- `ImageMetadata` - For uploaded image metadata
- `EditRecord` - For edit operation records

### 3. Repository Functions (`repository.ts`)

Added six new methods to the `DynamoDBRepository` class:

#### `saveImageMetadata(userId, imageId, metadata)`

Saves uploaded image metadata including:

- Original S3 key
- File name, size, and content type
- Image dimensions (width, height)
- Upload timestamp
- AI-generated edit suggestions

**Requirements**: 1.5

#### `getImageMetadata(userId, imageId)`

Retrieves image metadata by user ID and image ID.

**Requirements**: 1.5

#### `saveEditRecord(userId, editId, record)`

Saves an edit operation record including:

- Image ID and edit type
- Edit parameters
- Source and result S3 keys
- Status (pending, processing, completed, failed, preview)
- Timestamps and processing metrics
- Optional parent edit ID for chained edits

**Requirements**: 7.1

#### `getEditHistory(userId, limit?, exclusiveStartKey?)`

Queries a user's edit history with pagination support:

- Returns most recent edits first (descending order)
- Default limit of 50 items
- Supports pagination via `exclusiveStartKey`

**Requirements**: 7.2

#### `deleteEdit(userId, editId)`

Deletes an edit record from DynamoDB.

**Requirements**: 7.5

#### `updateEditStatus(userId, editId, status, additionalUpdates?)`

Updates an edit record's status and optional fields:

- Status transitions (pending → processing → completed/failed)
- Completion timestamp
- Error messages
- Processing time metrics

**Requirements**: 7.1

### 4. Module Exports (`index.ts`)

Added exports for the new key generation functions:

- `getImageMetadataKeys`
- `getEditRecordKeys`

## Data Models

### ImageMetadata Structure

```typescript
{
  PK: "USER#<userId>",
  SK: "IMAGE#<imageId>",
  EntityType: "ImageMetadata",
  Data: {
    imageId: string,
    userId: string,
    originalKey: string,      // S3 key
    fileName: string,
    fileSize: number,
    contentType: string,
    width: number,
    height: number,
    uploadedAt: string,       // ISO timestamp
    suggestions?: EditSuggestion[]
  },
  CreatedAt: number,
  UpdatedAt: number
}
```

### EditRecord Structure

```typescript
{
  PK: "USER#<userId>",
  SK: "EDIT#<editId>",
  EntityType: "EditRecord",
  Data: {
    editId: string,
    userId: string,
    imageId: string,
    editType: EditType,
    params: EditParams,
    sourceKey: string,        // S3 key
    resultKey: string,        // S3 key
    status: "pending" | "processing" | "completed" | "failed" | "preview",
    createdAt: string,        // ISO timestamp
    completedAt?: string,
    error?: string,
    modelId?: string,         // Bedrock model ID
    processingTime?: number,  // milliseconds
    parentEditId?: string     // For chained edits
  },
  CreatedAt: number,
  UpdatedAt: number
}
```

## Query Patterns

### Get Image Metadata

```typescript
const metadata = await repository.getImageMetadata("user123", "image456");
```

### Get Edit History (Most Recent First)

```typescript
const result = await repository.getEditHistory("user123", 50);
// Returns: { items: EditRecord[], lastEvaluatedKey?, count: number }
```

### Save and Update Edit

```typescript
// Save new edit
await repository.saveEditRecord("user123", "edit789", {
  imageId: "image456",
  editType: "virtual-staging",
  params: { roomType: "living-room", style: "modern" },
  sourceKey: "s3://bucket/original.jpg",
  resultKey: "s3://bucket/result.jpg",
  status: "processing",
  createdAt: new Date().toISOString(),
});

// Update status when complete
await repository.updateEditStatus("user123", "edit789", "completed", {
  completedAt: new Date().toISOString(),
  processingTime: 5000,
});
```

## Testing

Created comprehensive tests in:

- `reimagine-repository.test.ts` - Key generation tests (4 tests, all passing)
- `repository.test.ts` - Repository method tests (7 new test cases)

All tests verify:

- Correct key pattern generation
- Proper data structure creation
- Query parameter handling
- Error handling

## Requirements Coverage

This implementation satisfies the following requirements from the design document:

- **1.5**: Store image metadata in DynamoDB with user identifier and timestamp
- **7.1**: Save edit operations and record in edit history
- **7.2**: Display edit history with timestamps and operation types
- **7.5**: Delete edit records from DynamoDB

## Next Steps

The following tasks depend on this implementation:

- Task 3: Create Bedrock flows (will use these functions to store results)
- Task 9: Implement upload server actions (will use `saveImageMetadata`)
- Task 10: Implement edit processing actions (will use `saveEditRecord`, `updateEditStatus`)
- Task 11: Implement history and management actions (will use `getEditHistory`, `deleteEdit`)
