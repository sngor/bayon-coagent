# DynamoDB Data Layer

This module provides a complete data access layer for DynamoDB using a single-table design pattern.

## Architecture

### Single-Table Design

All entities are stored in a single DynamoDB table with the following structure:

- **Primary Key**: `PK` (Partition Key) + `SK` (Sort Key)
- **GSI1**: `GSI1PK` + `GSI1SK` (for alternate access patterns)
- **Attributes**: `EntityType`, `Data`, `CreatedAt`, `UpdatedAt`

### Key Patterns

Each entity type has a specific key pattern:

| Entity                 | PK Pattern         | SK Pattern                  | GSI1PK              |
| ---------------------- | ------------------ | --------------------------- | ------------------- |
| UserProfile            | `USER#<userId>`    | `PROFILE`                   | -                   |
| RealEstateAgentProfile | `USER#<userId>`    | `AGENT#<agentProfileId>`    | -                   |
| Review                 | `REVIEW#<agentId>` | `REVIEW#<reviewId>`         | `REVIEW#<reviewId>` |
| BrandAudit             | `USER#<userId>`    | `AUDIT#<auditId>`           | -                   |
| Competitor             | `USER#<userId>`    | `COMPETITOR#<competitorId>` | -                   |
| ResearchReport         | `USER#<userId>`    | `REPORT#<reportId>`         | -                   |
| Project                | `USER#<userId>`    | `PROJECT#<projectId>`       | -                   |
| SavedContent           | `USER#<userId>`    | `CONTENT#<contentId>`       | -                   |
| TrainingProgress       | `USER#<userId>`    | `TRAINING#<moduleId>`       | -                   |
| MarketingPlan          | `USER#<userId>`    | `PLAN#<planId>`             | -                   |
| ReviewAnalysis         | `USER#<userId>`    | `ANALYSIS#<analysisId>`     | -                   |
| OAuthToken             | `OAUTH#<userId>`   | `<provider>`                | -                   |

## Usage

### Basic CRUD Operations

```typescript
import { getRepository, getUserProfileKeys } from "@/aws/dynamodb";

const repository = getRepository();

// Create a user profile
const keys = getUserProfileKeys("user123");
await repository.create(keys.PK, keys.SK, "UserProfile", {
  id: "user123",
  email: "user@example.com",
  displayName: "John Doe",
});

// Get a user profile
const profile = await repository.get(keys.PK, keys.SK);

// Update a user profile
await repository.update(keys.PK, keys.SK, {
  displayName: "Jane Doe",
});

// Delete a user profile
await repository.delete(keys.PK, keys.SK);
```

### Querying Collections

```typescript
import { getRepository } from "@/aws/dynamodb";

const repository = getRepository();

// Get all saved content for a user
const result = await repository.query("USER#user123", "CONTENT#");

console.log(result.items); // Array of SavedContent items
console.log(result.count); // Number of items returned
console.log(result.lastEvaluatedKey); // For pagination
```

### Batch Operations

```typescript
import {
  getRepository,
  getUserProfileKeys,
  getProjectKeys,
} from "@/aws/dynamodb";

const repository = getRepository();

// Batch get multiple items
const keys = [
  getUserProfileKeys("user123"),
  getProjectKeys("user123", "project1"),
];

const result = await repository.batchGet(keys);
console.log(result.items);

// Batch write (put and delete)
const itemsToPut = [
  {
    PK: "USER#user123",
    SK: "PROJECT#project1",
    EntityType: "Project" as const,
    Data: {
      id: "project1",
      name: "My Project",
      createdAt: new Date().toISOString(),
    },
    CreatedAt: Date.now(),
    UpdatedAt: Date.now(),
  },
];

const keysToDelete = [{ PK: "USER#user123", SK: "PROJECT#project2" }];

await repository.batchWrite(itemsToPut, keysToDelete);
```

## Key Generation Functions

The `keys.ts` module provides helper functions to generate keys for each entity type:

```typescript
import {
  getUserProfileKeys,
  getAgentProfileKeys,
  getReviewKeys,
  getBrandAuditKeys,
  getCompetitorKeys,
  getResearchReportKeys,
  getProjectKeys,
  getSavedContentKeys,
  getTrainingProgressKeys,
  getMarketingPlanKeys,
  getReviewAnalysisKeys,
  getOAuthTokenKeys,
} from "@/aws/dynamodb";

// Each function returns { PK, SK } and optionally GSI keys
const keys = getUserProfileKeys("user123");
// { PK: 'USER#user123', SK: 'PROFILE' }

const reviewKeys = getReviewKeys("agent123", "review456");
// { PK: 'REVIEW#agent123', SK: 'REVIEW#review456', GSI1PK: 'REVIEW#review456' }
```

## Type Safety

All operations are fully typed using TypeScript:

```typescript
interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

// Type-safe get operation
const profile = await repository.get<UserProfile>(keys.PK, keys.SK);
// profile is UserProfile | null

// Type-safe query operation
const result = await repository.query<SavedContent>("USER#user123", "CONTENT#");
// result.items is SavedContent[]
```

## Environment Configuration

The DynamoDB client automatically configures itself based on the environment:

- **Local Development**: Uses LocalStack endpoint (`http://localhost:4566`)
- **Production**: Uses AWS DynamoDB service

Configuration is managed through environment variables:

```bash
# .env.local
USE_LOCAL_AWS=true
DYNAMODB_TABLE_NAME=BayonCoAgent-local
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

## Testing

The module provides reset functions for testing:

```typescript
import { resetClients, resetRepository } from "@/aws/dynamodb";

// Reset clients and repository between tests
afterEach(() => {
  resetClients();
  resetRepository();
});
```

## Migration from Firestore

When migrating from Firestore, use the key generation functions to map Firestore paths to DynamoDB keys:

| Firestore Path                                   | DynamoDB Keys                                 |
| ------------------------------------------------ | --------------------------------------------- |
| `/users/{userId}`                                | `getUserProfileKeys(userId)`                  |
| `/users/{userId}/agentProfiles/{agentProfileId}` | `getAgentProfileKeys(userId, agentProfileId)` |
| `/users/{userId}/savedContent/{contentId}`       | `getSavedContentKeys(userId, contentId)`      |
| `/reviews/{reviewId}`                            | `getReviewKeys(agentId, reviewId)`            |

## Performance Considerations

- **Single-Table Design**: Reduces the number of queries needed for related data
- **Batch Operations**: Use `batchGet` and `batchWrite` for multiple items
- **Pagination**: Use `lastEvaluatedKey` for efficient pagination
- **GSI**: Reviews use GSI1 for direct lookup by review ID

## Error Handling

All repository methods throw errors that should be caught and handled:

```typescript
try {
  const profile = await repository.get(keys.PK, keys.SK);
} catch (error) {
  console.error("Failed to get profile:", error);
  // Handle error appropriately
}
```
