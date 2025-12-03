# Mobile Agent Features - DynamoDB Repository Methods

This document describes the DynamoDB repository methods for mobile-specific entities.

## Overview

All mobile entities follow the single-table design pattern with the following key structure:

- **PK**: `USER#<userId>`
- **SK**: `<ENTITY_TYPE>#<entityId>`

## Entities

### 1. MobileCapture

Stores captured content from mobile devices (photos, voice, text).

**Key Pattern:**

- PK: `USER#<userId>`
- SK: `CAPTURE#<captureId>`

**Methods:**

```typescript
// Create
await repository.createMobileCapture(userId, captureId, captureData);

// Get
const capture = await repository.getMobileCapture(userId, captureId);

// Update
await repository.updateMobileCapture(userId, captureId, { processed: true });

// Delete
await repository.deleteMobileCapture(userId, captureId);

// Query all captures for a user (most recent first)
const result = await repository.queryMobileCaptures(userId, { limit: 20 });
```

**Data Structure:**

```typescript
interface MobileCapture {
  id: string;
  userId: string;
  type: "photo" | "voice" | "text";
  content: string; // S3 URL or text
  transcription?: string;
  analysis?: PropertyPhotoAnalysis;
  location?: LocationCoordinates;
  timestamp: number;
  processed: boolean;
  generatedContentId?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2. QuickAction

Stores user-configured quick action shortcuts.

**Key Pattern:**

- PK: `USER#<userId>`
- SK: `QUICKACTION#<actionId>`

**Methods:**

```typescript
// Create
await repository.createQuickAction(userId, actionId, actionData);

// Get
const action = await repository.getQuickAction(userId, actionId);

// Update (e.g., increment usage count)
await repository.updateQuickAction(userId, actionId, {
  usageCount: action.usageCount + 1,
  lastUsed: Date.now(),
});

// Delete
await repository.deleteQuickAction(userId, actionId);

// Query all actions for a user
const result = await repository.queryQuickActions(userId);
```

**Data Structure:**

```typescript
interface QuickAction {
  id: string;
  userId: string;
  actionType: string;
  label: string;
  icon: string;
  route?: string;
  config: Record<string, any>;
  usageCount: number;
  lastUsed: number;
  isPinned: boolean;
  createdAt: string;
}
```

### 3. PropertyShare

Tracks property sharing via QR codes, SMS, email, or social media.

**Key Pattern:**

- PK: `USER#<userId>`
- SK: `SHARE#<shareId>`

**Methods:**

```typescript
// Create
await repository.createPropertyShare(userId, shareId, shareData);

// Get
const share = await repository.getPropertyShare(userId, shareId);

// Update (e.g., track engagement)
await repository.updatePropertyShare(userId, shareId, {
  views: share.views + 1,
  lastViewed: Date.now(),
});

// Delete
await repository.deletePropertyShare(userId, shareId);

// Query all shares for a user (most recent first)
const result = await repository.queryPropertyShares(userId, { limit: 50 });
```

**Data Structure:**

```typescript
interface PropertyShare {
  id: string;
  userId: string;
  propertyId: string;
  method: "qr" | "sms" | "email" | "social";
  recipient?: string;
  trackingUrl: string;
  qrCodeUrl?: string;
  views: number;
  clicks: number;
  lastViewed?: number;
  createdAt: string;
  expiresAt: string;
}
```

### 4. VoiceNote

Stores voice recordings with transcriptions attached to properties.

**Key Pattern:**

- PK: `USER#<userId>`
- SK: `VOICENOTE#<noteId>`

**Methods:**

```typescript
// Create
await repository.createVoiceNote(userId, noteId, noteData);

// Get
const note = await repository.getVoiceNote(userId, noteId);

// Update
await repository.updateVoiceNote(userId, noteId, {
  transcription: "updated text",
});

// Delete
await repository.deleteVoiceNote(userId, noteId);

// Query all notes for a user (most recent first)
const result = await repository.queryVoiceNotes(userId, { limit: 20 });

// Query notes for a specific property
const propertyNotes = await repository.queryVoiceNotesByProperty(
  userId,
  propertyId,
  { limit: 10 }
);
```

**Data Structure:**

```typescript
interface VoiceNote {
  id: string;
  userId: string;
  propertyId?: string;
  audioUrl: string; // S3 URL
  transcription: string;
  duration: number; // seconds
  location?: LocationCoordinates;
  timestamp: number;
  createdAt: string;
}
```

### 5. LocationCheckIn

Records location-based check-ins at properties or appointments.

**Key Pattern:**

- PK: `USER#<userId>`
- SK: `CHECKIN#<checkInId>`

**Methods:**

```typescript
// Create
await repository.createLocationCheckIn(userId, checkInId, checkInData);

// Get
const checkIn = await repository.getLocationCheckIn(userId, checkInId);

// Update
await repository.updateLocationCheckIn(userId, checkInId, {
  notes: "Meeting went well",
});

// Delete
await repository.deleteLocationCheckIn(userId, checkInId);

// Query all check-ins for a user (most recent first)
const result = await repository.queryLocationCheckIns(userId, { limit: 50 });

// Query check-ins for a specific property
const propertyCheckIns = await repository.queryLocationCheckInsByProperty(
  userId,
  propertyId
);

// Query check-ins for a specific appointment
const appointmentCheckIns = await repository.queryLocationCheckInsByAppointment(
  userId,
  appointmentId
);
```

**Data Structure:**

```typescript
interface LocationCheckIn {
  id: string;
  userId: string;
  propertyId?: string;
  appointmentId?: string;
  location: LocationCoordinates;
  address?: string;
  notes?: string;
  timestamp: number;
  createdAt: string;
}
```

## Query Options

All query methods support the following options:

```typescript
interface QueryOptions {
  limit?: number; // Max items to return
  exclusiveStartKey?: DynamoDBKey; // For pagination
  scanIndexForward?: boolean; // true = ascending, false = descending
  filterExpression?: string; // Additional filtering
  expressionAttributeValues?: Record<string, any>;
  expressionAttributeNames?: Record<string, string>;
}
```

## Pagination Example

```typescript
let lastKey: DynamoDBKey | undefined;
const allCaptures: MobileCapture[] = [];

do {
  const result = await repository.queryMobileCaptures(userId, {
    limit: 100,
    exclusiveStartKey: lastKey,
  });

  allCaptures.push(...result.items);
  lastKey = result.lastEvaluatedKey;
} while (lastKey);
```

## Error Handling

All repository methods throw `DynamoDBError` on failure:

```typescript
import { DynamoDBError } from "@/aws/dynamodb/errors";

try {
  const capture = await repository.getMobileCapture(userId, captureId);
} catch (error) {
  if (error instanceof DynamoDBError) {
    console.error("DynamoDB operation failed:", error.message);
    console.error("Error code:", error.code);
  }
}
```

## Best Practices

1. **Use Specific Queries**: Use the specialized query methods (e.g., `queryVoiceNotesByProperty`) instead of filtering in application code.

2. **Pagination**: Always implement pagination for queries that might return many items.

3. **Timestamps**: Store timestamps as Unix milliseconds for consistency and easy sorting.

4. **S3 URLs**: Store full S3 URLs in the database for easy retrieval.

5. **Atomic Updates**: Use the update methods for atomic field updates rather than get-modify-put patterns.

6. **Batch Operations**: For bulk operations, consider using `batchGet` and `batchWrite` methods from the base repository.

## Integration with Existing Code

The mobile repository methods integrate seamlessly with existing repository patterns:

```typescript
import { repository } from "@/aws/dynamodb/repository";

// In a server action
export async function capturePhoto(userId: string, photoData: any) {
  const captureId = crypto.randomUUID();

  await repository.createMobileCapture(userId, captureId, {
    id: captureId,
    userId,
    type: "photo",
    content: photoData.s3Url,
    location: photoData.location,
    timestamp: Date.now(),
    processed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return { captureId };
}
```

## Testing

Example test for mobile capture:

```typescript
import { repository } from "@/aws/dynamodb/repository";

describe("Mobile Capture Repository", () => {
  const userId = "test-user-123";
  const captureId = "test-capture-456";

  it("should create and retrieve a mobile capture", async () => {
    const captureData = {
      id: captureId,
      userId,
      type: "photo" as const,
      content: "https://s3.amazonaws.com/bucket/photo.jpg",
      timestamp: Date.now(),
      processed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await repository.createMobileCapture(userId, captureId, captureData);
    const retrieved = await repository.getMobileCapture(userId, captureId);

    expect(retrieved).toEqual(captureData);
  });
});
```
