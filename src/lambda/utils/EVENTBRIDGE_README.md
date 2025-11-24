# EventBridge Event Publishing Guide

This guide explains how to publish events to the custom EventBridge event bus in the Bayon CoAgent microservices architecture.

## Overview

The EventBridge custom event bus (`bayon-coagent-events-${environment}`) is the central event routing system for the application. It enables asynchronous, event-driven communication between microservices.

## Architecture

```
┌─────────────────┐
│  Lambda Function│
│   (Publisher)   │
└────────┬────────┘
         │
         │ publishEvent()
         ▼
┌─────────────────────────────────────────┐
│   Custom Event Bus                      │
│   bayon-coagent-events-${environment}   │
└────────┬────────────────────────────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
    │ Rule 1 │    │ Rule 2 │    │ Rule 3 │    │ Rule N │
    └───┬────┘    └───┬────┘    └───┬────┘    └───┬────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
    │Lambda 1│    │Lambda 2│    │Lambda 3│    │Lambda N│
    └────────┘    └────────┘    └────────┘    └────────┘
```

## Event Schemas

All events follow a standard AWS EventBridge format with custom detail payloads.

### Standard Event Structure

```typescript
{
  version: "0",
  id: "unique-event-id",
  "detail-type": "Event Type",
  source: "bayon.coagent.service",
  account: "aws-account-id",
  time: "2024-01-01T12:00:00Z",
  region: "us-east-1",
  detail: {
    // Custom event payload
  }
}
```

### Available Event Types

#### 1. User Created Event

**Source:** `bayon.coagent.user`  
**Detail Type:** `User Created`

```typescript
{
  userId: string;
  email: string;
  createdAt: string; // ISO 8601 date-time
  traceId?: string;
}
```

**Usage:**

```typescript
import { publishUserCreatedEvent } from "./utils/eventbridge-client";

await publishUserCreatedEvent({
  userId: "user-123",
  email: "user@example.com",
  createdAt: new Date().toISOString(),
});
```

#### 2. Content Published Event

**Source:** `bayon.coagent.content`  
**Detail Type:** `Content Published`

```typescript
{
  contentId: string;
  userId: string;
  contentType: string; // 'blog_post', 'social_media', 'listing_description', etc.
  platform: string; // 'facebook', 'instagram', 'linkedin', 'twitter', etc.
  publishedAt: string; // ISO 8601 date-time
  traceId?: string;
}
```

**Usage:**

```typescript
import { publishContentPublishedEvent } from "./utils/eventbridge-client";

await publishContentPublishedEvent({
  contentId: "content-456",
  userId: "user-123",
  contentType: "social_media",
  platform: "facebook",
  publishedAt: new Date().toISOString(),
});
```

#### 3. AI Job Completed Event

**Source:** `bayon.coagent.ai`  
**Detail Type:** `AI Job Completed` or `AI Job Failed`

```typescript
{
  jobId: string;
  userId: string;
  jobType: string; // 'blog_post', 'social_media', 'listing_description', 'market_update'
  status: 'completed' | 'failed';
  completedAt: string; // ISO 8601 date-time
  error?: string; // Only present when status is 'failed'
  traceId?: string;
}
```

**Usage:**

```typescript
import { publishAiJobCompletedEvent } from "./utils/eventbridge-client";

// Success case
await publishAiJobCompletedEvent({
  jobId: "job-789",
  userId: "user-123",
  jobType: "blog_post",
  status: "completed",
  completedAt: new Date().toISOString(),
});

// Failure case
await publishAiJobCompletedEvent({
  jobId: "job-789",
  userId: "user-123",
  jobType: "blog_post",
  status: "failed",
  completedAt: new Date().toISOString(),
  error: "Bedrock API timeout",
});
```

#### 4. Integration Sync Completed Event

**Source:** `bayon.coagent.integration`  
**Detail Type:** `Integration Sync Completed` or `Integration Sync Failed`

```typescript
{
  syncId: string;
  userId: string;
  provider: string; // 'mls', 'google', 'facebook', 'instagram', 'linkedin', 'twitter'
  status: 'completed' | 'failed';
  itemsSynced?: number; // Number of items synced (optional)
  completedAt: string; // ISO 8601 date-time
  error?: string; // Only present when status is 'failed'
  traceId?: string;
}
```

**Usage:**

```typescript
import { publishIntegrationSyncCompletedEvent } from "./utils/eventbridge-client";

// Success case
await publishIntegrationSyncCompletedEvent({
  syncId: "sync-101",
  userId: "user-123",
  provider: "mls",
  status: "completed",
  itemsSynced: 150,
  completedAt: new Date().toISOString(),
});

// Failure case
await publishIntegrationSyncCompletedEvent({
  syncId: "sync-101",
  userId: "user-123",
  provider: "mls",
  status: "failed",
  completedAt: new Date().toISOString(),
  error: "MLS API rate limit exceeded",
});
```

## Publishing Events

### Basic Event Publishing

Use the `publishEvent()` function for custom events:

```typescript
import {
  publishEvent,
  EventSource,
  EventDetailType,
} from "./utils/eventbridge-client";

await publishEvent(
  EventSource.USER,
  EventDetailType.USER_CREATED,
  {
    userId: "user-123",
    email: "user@example.com",
    createdAt: new Date().toISOString(),
  },
  traceId // Optional X-Ray trace ID
);
```

### Batch Event Publishing

For publishing multiple events at once:

```typescript
import { publishEventsBatch } from "./utils/eventbridge-client";

await publishEventsBatch([
  {
    source: EventSource.CONTENT,
    detailType: EventDetailType.CONTENT_PUBLISHED,
    detail: {
      /* ... */
    },
  },
  {
    source: EventSource.AI,
    detailType: EventDetailType.AI_JOB_COMPLETED,
    detail: {
      /* ... */
    },
  },
]);
```

### Trace ID Correlation

Always include the X-Ray trace ID when publishing events to maintain distributed tracing:

```typescript
import * as AWSXRay from "aws-xray-sdk-core";

const segment = AWSXRay.getSegment();
const traceId = segment?.trace_id;

await publishContentPublishedEvent(
  {
    contentId: "content-456",
    userId: "user-123",
    contentType: "blog_post",
    platform: "wordpress",
    publishedAt: new Date().toISOString(),
  },
  traceId
);
```

## Event Routing Rules

The following EventBridge rules are configured to route events to Lambda functions:

| Rule Name                 | Event Source              | Detail Type                      | Target Lambda                      |
| ------------------------- | ------------------------- | -------------------------------- | ---------------------------------- |
| LifeEventProcessorRule    | bayon.coagent.user        | User Created                     | LifeEventProcessorFunction         |
| CompetitorMonitorRule     | bayon.coagent.content     | Content Published                | CompetitorMonitorProcessorFunction |
| TrendDetectorRule         | bayon.coagent.integration | Integration Sync Completed (MLS) | TrendDetectorProcessorFunction     |
| PriceReductionMonitorRule | bayon.coagent.integration | Integration Sync Completed (MLS) | PriceReductionProcessorFunction    |
| NotificationProcessorRule | All sources               | All detail types                 | NotificationProcessorFunction      |
| ContentPublishingRule     | bayon.coagent.ai          | AI Job Completed                 | PublishScheduledContentFunction    |
| AnalyticsSyncRule         | bayon.coagent.content     | Content Published                | SyncSocialAnalyticsFunction        |

## Error Handling

### Dead Letter Queue

Failed event deliveries are sent to the EventBridge DLQ:

- **Queue Name:** `bayon-coagent-eventbridge-dlq-${environment}`
- **Retention:** 14 days
- **Purpose:** Capture failed events for investigation and replay

### Retry Policy

All EventBridge rules are configured with:

- **Max Retry Attempts:** 2-3 (depending on the rule)
- **Max Event Age:** 3600 seconds (1 hour)

### Event Publishing Failures

The `publishEvent()` function is designed to fail gracefully:

- Errors are logged but not thrown
- Event publishing failures don't break the main Lambda execution
- Failed events can be investigated via CloudWatch Logs

```typescript
try {
  await publishEvent(/* ... */);
} catch (error) {
  // Error is logged but not thrown
  // Main Lambda execution continues
}
```

## Event Archive and Replay

### Event Archive

All events are automatically archived for replay capability:

- **Archive Name:** `bayon-coagent-event-archive-${environment}`
- **Retention:** 90 days (production), 30 days (development)
- **Event Pattern:** All events with source prefix "bayon.coagent"

### Replaying Events

To replay events from the archive:

```bash
# Create a replay
aws events start-replay \
  --replay-name my-replay \
  --event-source-arn arn:aws:events:us-east-1:123456789012:event-bus/bayon-coagent-events-development \
  --event-start-time 2024-01-01T00:00:00Z \
  --event-end-time 2024-01-02T00:00:00Z \
  --destination '{"Arn":"arn:aws:events:us-east-1:123456789012:event-bus/bayon-coagent-events-development","FilterArns":[]}'

# Check replay status
aws events describe-replay --replay-name my-replay
```

## Monitoring and Debugging

### CloudWatch Logs

Event publishing is logged to CloudWatch:

- **Log Group:** `/aws/lambda/bayon-coagent-*-${environment}`
- **Log Format:** Structured JSON with trace IDs

### CloudWatch Metrics

Monitor EventBridge metrics:

- `Invocations` - Number of times a rule is triggered
- `FailedInvocations` - Number of failed rule invocations
- `TriggeredRules` - Number of rules triggered by events
- `ThrottledRules` - Number of throttled rule invocations

### X-Ray Tracing

All events include X-Ray trace IDs for distributed tracing:

1. View the X-Ray service map to see event flow
2. Trace individual requests across services
3. Identify bottlenecks and errors

## Best Practices

### 1. Always Include Trace IDs

```typescript
const traceId = AWSXRay.getSegment()?.trace_id;
await publishEvent(source, detailType, detail, traceId);
```

### 2. Use Typed Event Details

```typescript
interface MyEventDetail extends BaseEventDetail {
  customField: string;
}

const detail: MyEventDetail = {
  customField: "value",
  traceId,
};
```

### 3. Handle Publishing Failures Gracefully

```typescript
// Don't throw on event publishing failures
await publishEvent(/* ... */); // Logs error but doesn't throw
```

### 4. Use Batch Publishing for Multiple Events

```typescript
// More efficient than multiple single publishes
await publishEventsBatch([event1, event2, event3]);
```

### 5. Keep Event Payloads Small

- Limit event detail size to < 256 KB
- Store large data in S3 and include S3 key in event
- Use references instead of embedding full objects

### 6. Version Your Event Schemas

```typescript
{
  version: "1.0.0",
  detail: {
    // Event payload
  }
}
```

## Testing

### Local Testing

Use LocalStack for local EventBridge testing:

```bash
# Start LocalStack
npm run localstack:start

# Initialize EventBridge resources
npm run localstack:init

# Test event publishing
tsx scripts/test-eventbridge-publishing.ts
```

### Integration Testing

Test event publishing in Lambda functions:

```typescript
import { publishEvent } from "./utils/eventbridge-client";

describe("Event Publishing", () => {
  it("should publish user created event", async () => {
    await publishEvent(EventSource.USER, EventDetailType.USER_CREATED, {
      userId: "test-user",
      email: "test@example.com",
      createdAt: new Date().toISOString(),
    });

    // Verify event was published (check CloudWatch Logs or mock)
  });
});
```

## Verification

Verify the EventBridge setup:

```bash
# Verify EventBridge configuration
npm run verify:eventbridge

# Verify production EventBridge
npm run verify:eventbridge:prod
```

## Troubleshooting

### Events Not Being Delivered

1. Check EventBridge rule is enabled
2. Verify event pattern matches published events
3. Check Lambda function permissions
4. Review CloudWatch Logs for errors
5. Check EventBridge DLQ for failed events

### High Event Latency

1. Check Lambda function cold starts
2. Review Lambda concurrency limits
3. Check EventBridge throttling metrics
4. Optimize Lambda function performance

### Missing Events

1. Check event archive for historical events
2. Review CloudWatch Logs for publishing errors
3. Verify event pattern in rules
4. Check DLQ for failed deliveries

## Additional Resources

- [AWS EventBridge Documentation](https://docs.aws.amazon.com/eventbridge/)
- [EventBridge Event Patterns](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html)
- [EventBridge Schema Registry](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-schema.html)
- [X-Ray Distributed Tracing](https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html)
