# Saga Pattern Implementation

This directory contains saga pattern implementations for distributed transactions across microservices.

## Overview

The saga pattern maintains data consistency across distributed services by coordinating a sequence of local transactions. If any step fails, compensating transactions are executed in reverse order to roll back the changes.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Saga Coordinator                          │
│  - Orchestrates transaction steps                           │
│  - Manages state in DynamoDB                                 │
│  - Executes compensations on failure                         │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Step 1     │    │   Step 2     │    │   Step 3     │
│   Action     │───▶│   Action     │───▶│   Action     │
│              │    │              │    │              │
│ Compensation │◀───│ Compensation │◀───│ Compensation │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Components

### Saga Coordinator (`saga-coordinator.ts`)

Core orchestration engine that:

- Executes saga steps sequentially
- Persists execution state to DynamoDB
- Handles failures and triggers compensations
- Provides execution history and tracing

### AI + Integration Saga (`ai-integration-saga.ts`)

Coordinates AI content generation with external platform publishing:

**Steps:**

1. Generate AI content
2. Save content to database
3. Publish to external platform (optional)

**Use Cases:**

- Generate blog post and publish to website
- Create social media content and post to Facebook/Instagram
- Generate listing description and save to MLS

### Content + Publishing Saga (`content-publishing-saga.ts`)

Coordinates content creation, scheduling, and multi-platform publishing:

**Steps:**

1. Create/update content
2. Schedule content (optional)
3. Publish to multiple platforms
4. Update analytics

**Use Cases:**

- Create content and publish to multiple social media platforms
- Schedule content for future publication
- Track content performance across platforms

## Usage Examples

### AI + Integration Saga

```typescript
import { executeAIIntegrationSaga } from "@/lib/sagas/ai-integration-saga";

// Generate and publish content
const result = await executeAIIntegrationSaga({
  userId: "user123",
  contentType: "social-media",
  prompt: "Write a post about spring market trends",
  platform: "facebook",
  publishImmediately: true,
});

if (result.success) {
  console.log("Content published:", result.data);
} else {
  console.error("Saga failed:", result.error);
  if (result.compensated) {
    console.log("Changes rolled back successfully");
  }
}
```

### Content + Publishing Saga

```typescript
import { executeContentPublishingSaga } from "@/lib/sagas/content-publishing-saga";

// Create and publish to multiple platforms
const result = await executeContentPublishingSaga({
  userId: "user123",
  title: "Spring Market Update",
  body: "The spring market is heating up...",
  contentType: "blog-post",
  platforms: ["facebook", "linkedin", "twitter", "website"],
  tags: ["market-update", "spring-2024"],
});

if (result.success) {
  console.log("Content published to all platforms");
} else {
  console.error("Publishing failed:", result.error);
  console.log("Execution details:", result.execution);
}
```

### Scheduled Publishing

```typescript
import { executeContentPublishingSaga } from "@/lib/sagas/content-publishing-saga";

// Schedule content for future publication
const result = await executeContentPublishingSaga({
  userId: "user123",
  title: "Weekend Open House",
  body: "Join us this weekend...",
  contentType: "social-media",
  platforms: ["facebook", "instagram"],
  scheduledFor: "2024-03-15T10:00:00Z",
  tags: ["open-house", "weekend"],
});
```

## Saga Execution State

Each saga execution is persisted to DynamoDB with the following structure:

```typescript
{
  PK: 'USER#user123',
  SK: 'SAGA#user123-1234567890-abc123',
  sagaId: 'user123-1234567890-abc123',
  userId: 'user123',
  state: 'COMPLETED', // PENDING | RUNNING | COMPLETED | COMPENSATING | FAILED | COMPENSATED
  currentStep: 2,
  steps: [
    {
      name: 'generate-ai-content',
      status: 'completed',
      output: { contentId: 'CONTENT#123', ... },
      startedAt: '2024-03-01T10:00:00Z',
      completedAt: '2024-03-01T10:00:05Z',
    },
    {
      name: 'save-content',
      status: 'completed',
      output: { contentId: 'CONTENT#123', ... },
      startedAt: '2024-03-01T10:00:05Z',
      completedAt: '2024-03-01T10:00:06Z',
    },
  ],
  metadata: { contentType: 'blog-post', ... },
  createdAt: '2024-03-01T10:00:00Z',
  updatedAt: '2024-03-01T10:00:06Z',
  traceId: 'trace-abc123',
}
```

## Error Handling

### Automatic Compensation

When a step fails, the saga coordinator automatically:

1. Marks the failed step
2. Executes compensation for all completed steps in reverse order
3. Updates saga state to COMPENSATED or FAILED
4. Returns detailed error information

### Compensation Guarantees

- **Best Effort**: Compensations are attempted but may fail
- **Idempotent**: Compensations can be safely retried
- **Logged**: All compensation attempts are logged for debugging

### Handling Compensation Failures

If a compensation fails:

1. The error is logged
2. The saga state is marked as FAILED
3. Manual intervention may be required
4. Saga execution history is preserved for debugging

## Best Practices

### 1. Design Idempotent Steps

Each step should be idempotent to handle retries:

```typescript
const step: SagaStep = {
  name: "my-step",
  async action(input, context) {
    // Check if already executed
    const existing = await checkExisting(input.id);
    if (existing) {
      return existing; // Return existing result
    }

    // Execute action
    return await performAction(input);
  },
  async compensation(output, context) {
    // Safe to call multiple times
    await deleteIfExists(output.id);
  },
};
```

### 2. Keep Steps Small

Break complex operations into smaller steps:

- Easier to understand and maintain
- Better error isolation
- More granular compensation

### 3. Include Trace IDs

Always pass trace IDs for distributed tracing:

```typescript
const result = await executeSaga(input, request.headers["x-trace-id"]);
```

### 4. Handle Partial Failures

Design compensations to handle partial state:

```typescript
async compensation(output, context) {
  // Check what was actually created
  const records = await findRecords(output.id);

  // Delete only what exists
  for (const record of records) {
    await deleteRecord(record.id);
  }
}
```

### 5. Monitor Saga Executions

Query saga execution history for monitoring:

```typescript
// Get all failed sagas for a user
const failedSagas = await queryDynamoDB({
  PK: "USER#user123",
  SK: { beginsWith: "SAGA#" },
  FilterExpression: "state = :failed",
  ExpressionAttributeValues: { ":failed": "FAILED" },
});
```

## Testing

### Unit Tests

Test individual steps and compensations:

```typescript
describe("AI Integration Saga", () => {
  it("should generate and save content", async () => {
    const result = await executeAIIntegrationSaga({
      userId: "test-user",
      contentType: "blog-post",
      prompt: "Test prompt",
    });

    expect(result.success).toBe(true);
    expect(result.data.contentId).toBeDefined();
  });

  it("should compensate on failure", async () => {
    // Mock failure in step 2
    mockStep2ToFail();

    const result = await executeAIIntegrationSaga({
      userId: "test-user",
      contentType: "blog-post",
      prompt: "Test prompt",
    });

    expect(result.success).toBe(false);
    expect(result.compensated).toBe(true);

    // Verify content was deleted
    const content = await getContent(
      result.execution.steps[0].output.contentId
    );
    expect(content).toBeNull();
  });
});
```

### Integration Tests

Test complete workflows:

```typescript
describe("Content Publishing Saga Integration", () => {
  it("should publish to multiple platforms", async () => {
    const result = await executeContentPublishingSaga({
      userId: "test-user",
      title: "Test Post",
      body: "Test content",
      contentType: "social-media",
      platforms: ["facebook", "twitter"],
    });

    expect(result.success).toBe(true);
    expect(result.data.publications).toHaveLength(2);
    expect(result.data.publications.every((p) => p.success)).toBe(true);
  });
});
```

## Troubleshooting

### Saga Stuck in RUNNING State

If a saga is stuck:

1. Check CloudWatch logs for errors
2. Verify Lambda timeouts
3. Check DynamoDB for execution state
4. Manually update state if needed

### Compensation Failed

If compensation fails:

1. Check compensation logs
2. Verify resources still exist
3. Manually clean up if needed
4. Update saga state to COMPENSATED

### Performance Issues

If sagas are slow:

1. Check step execution times in DynamoDB
2. Optimize slow steps
3. Consider parallel execution for independent steps
4. Add caching where appropriate

## Future Enhancements

- [ ] Parallel step execution for independent steps
- [ ] Saga timeout handling
- [ ] Automatic retry for transient failures
- [ ] Saga execution dashboard
- [ ] Compensation replay mechanism
- [ ] Saga versioning for schema evolution
