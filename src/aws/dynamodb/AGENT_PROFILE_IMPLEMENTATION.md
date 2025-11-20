# Agent Profile Repository Implementation

## Overview

The Agent Profile Repository provides CRUD operations for managing agent profiles in the Kiro AI Assistant. It implements caching and performance monitoring to meet the requirement of sub-500ms retrieval times.

## Features

### 1. CRUD Operations

- **createProfile**: Creates a new agent profile with validation
- **getProfile**: Retrieves an agent profile by user ID
- **updateProfile**: Updates an existing agent profile
- **deleteProfile**: Deletes an agent profile

### 2. Validation

All profile data is validated before storage:

- **Required Fields**: agentName, primaryMarket, specialization, preferredTone, corePrinciple
- **Field Constraints**:
  - agentName: 1-100 characters
  - primaryMarket: 1-200 characters
  - specialization: Must be one of: luxury, first-time-buyers, investment, commercial, general
  - preferredTone: Must be one of: warm-consultative, direct-data-driven, professional, casual
  - corePrinciple: 10-500 characters

### 3. Caching Layer

- **TTL**: 5 minutes
- **Automatic Cache Management**: Cache is automatically populated on reads and invalidated on writes
- **Cache Hit Tracking**: Performance metrics track cache hit rates

### 4. Performance Monitoring

The repository tracks performance metrics for all operations:

- **Operation Duration**: Time taken for each operation
- **Cache Hit Rate**: Percentage of reads served from cache
- **Statistics**: Average, min, max, and p95 durations
- **Alerting**: Logs warnings when retrieval exceeds 500ms

## Usage

### Basic Usage

```typescript
import { getAgentProfileRepository } from "@/aws/dynamodb";

const repository = getAgentProfileRepository();

// Create a profile
const profile = await repository.createProfile("user123", {
  agentName: "Jane Smith",
  primaryMarket: "Austin, TX",
  specialization: "luxury",
  preferredTone: "warm-consultative",
  corePrinciple: "Maximize client ROI with data-first strategies",
});

// Get a profile
const retrieved = await repository.getProfile("user123");

// Update a profile
await repository.updateProfile("user123", {
  agentName: "Jane Doe",
});

// Delete a profile
await repository.deleteProfile("user123");
```

### Performance Monitoring

```typescript
// Get performance metrics
const metrics = repository.getPerformanceMetrics("get");
console.log(`Total get operations: ${metrics.length}`);

// Get performance statistics
const stats = repository.getPerformanceStats("get");
if (stats) {
  console.log(`Average duration: ${stats.avgDuration}ms`);
  console.log(`P95 duration: ${stats.p95Duration}ms`);
  console.log(`Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(2)}%`);
}
```

### Cache Management

```typescript
// Clear cache for all users
repository.clearCache();

// Clear performance metrics
repository.clearPerformanceMetrics();
```

## Data Model

### DynamoDB Keys

- **PK**: `USER#<userId>`
- **SK**: `PROFILE#AGENT`
- **EntityType**: `AgentProfile`

### Profile Structure

```typescript
interface AgentProfile {
  userId: string;
  agentName: string;
  primaryMarket: string;
  specialization:
    | "luxury"
    | "first-time-buyers"
    | "investment"
    | "commercial"
    | "general";
  preferredTone:
    | "warm-consultative"
    | "direct-data-driven"
    | "professional"
    | "casual";
  corePrinciple: string;
  createdAt: string;
  updatedAt: string;
}
```

## Error Handling

The repository throws errors in the following cases:

- **Validation Errors**: When profile data doesn't meet validation requirements
- **Duplicate Profile**: When attempting to create a profile that already exists
- **Profile Not Found**: When attempting to update a non-existent profile
- **DynamoDB Errors**: When DynamoDB operations fail (wrapped in DynamoDBError)

## Performance Requirements

- **Retrieval Time**: < 500ms (p95) - Requirement 8.5
- **Cache TTL**: 5 minutes
- **Monitoring**: All operations are tracked with performance metrics

## Testing

The repository includes comprehensive unit tests covering:

- CRUD operations
- Validation logic
- Cache behavior
- Performance monitoring
- Error handling

Run tests with:

```bash
npm test -- agent-profile-repository.test.ts
```

## Implementation Notes

1. **Singleton Pattern**: Use `getAgentProfileRepository()` to get the singleton instance
2. **Cache Invalidation**: Cache is automatically invalidated on updates and deletes
3. **Performance Logging**: Warnings are logged when retrieval exceeds 500ms
4. **Metrics Retention**: Last 1000 metrics are retained for analysis

## Related Files

- `src/aws/dynamodb/agent-profile-repository.ts` - Main implementation
- `src/aws/dynamodb/agent-profile-repository.test.ts` - Unit tests
- `src/aws/dynamodb/keys.ts` - Key generation (getAgentProfileKeysV2)
- `src/aws/dynamodb/types.ts` - Type definitions (AgentProfile entity type)
