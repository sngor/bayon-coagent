# AWS SQS Queue Configuration

This module provides SQS queue functionality for AI job processing in the Bayon Coagent microservices architecture.

## Queue Architecture

### AI Job Request Queue

- **Purpose**: Receives AI job submissions from the Next.js application
- **Queue Name**: `bayon-coagent-ai-job-request-{environment}`
- **Visibility Timeout**: 900 seconds (15 minutes) - matches Lambda timeout
- **Message Retention**: 14 days
- **Dead Letter Queue**: `bayon-coagent-ai-job-request-dlq-{environment}`
- **Max Receive Count**: 3 attempts before moving to DLQ

### AI Job Response Queue

- **Purpose**: Receives AI job results from Lambda processors
- **Queue Name**: `bayon-coagent-ai-job-response-{environment}`
- **Visibility Timeout**: 300 seconds (5 minutes)
- **Message Retention**: 14 days
- **Dead Letter Queue**: `bayon-coagent-ai-job-response-dlq-{environment}`
- **Max Receive Count**: 3 attempts before moving to DLQ

## Message Formats

### AI Job Request Message

```typescript
{
  jobId: string;           // Unique job identifier
  userId: string;          // User who submitted the job
  jobType: 'blog-post' | 'social-media' | 'listing-description' | 'market-update';
  input: Record<string, any>;  // Job-specific input data
  timestamp: string;       // ISO 8601 timestamp
  traceId?: string;        // X-Ray trace ID for distributed tracing
}
```

### AI Job Result Message

```typescript
{
  jobId: string;           // Matches the request job ID
  userId: string;          // User who submitted the job
  jobType: string;         // Type of job that was processed
  status: 'completed' | 'failed';
  result?: Record<string, any>;  // Job result data (if successful)
  error?: string;          // Error message (if failed)
  timestamp: string;       // ISO 8601 timestamp
  processingTime?: number; // Processing duration in milliseconds
  traceId?: string;        // X-Ray trace ID for distributed tracing
}
```

## Usage

### Sending an AI Job Request

```typescript
import { sendAIJobRequest } from "@/aws/sqs";

const result = await sendAIJobRequest({
  jobId: "job-123",
  userId: "user-456",
  jobType: "blog-post",
  input: {
    topic: "Real Estate Market Trends",
    tone: "professional",
  },
  timestamp: new Date().toISOString(),
  traceId: "trace-789",
});

console.log("Job submitted:", result.jobId);
```

### Sending an AI Job Result

```typescript
import { sendAIJobResult } from "@/aws/sqs";

await sendAIJobResult({
  jobId: "job-123",
  userId: "user-456",
  jobType: "blog-post",
  status: "completed",
  result: {
    content: "Generated blog post content...",
    wordCount: 500,
  },
  timestamp: new Date().toISOString(),
  processingTime: 5000,
  traceId: "trace-789",
});
```

### Checking Queue Status

```typescript
import { getQueueMessageCount, getConfig } from "@/aws/sqs";

const config = getConfig();
const counts = await getQueueMessageCount(config.sqs.aiJobRequestQueueUrl!);

console.log("Messages in queue:", counts.approximate);
console.log("Messages being processed:", counts.notVisible);
console.log("Delayed messages:", counts.delayed);
```

## Configuration

The SQS queues are configured via environment variables:

- `AI_JOB_REQUEST_QUEUE_URL`: URL of the AI job request queue
- `AI_JOB_RESPONSE_QUEUE_URL`: URL of the AI job response queue

These are automatically set by the SAM/CloudFormation deployment.

## Infrastructure

The queues are defined in `template.yaml` and include:

1. **Request Queue**: Receives job submissions
2. **Response Queue**: Receives job results
3. **Dead Letter Queues**: Captures failed messages for both queues
4. **API Gateway Integration**: Direct integration with AI Service API Gateway
5. **Lambda Event Sources**: Lambda functions triggered by queue messages

## Monitoring

Queue metrics are available in CloudWatch:

- `ApproximateNumberOfMessages`: Messages available for retrieval
- `ApproximateNumberOfMessagesNotVisible`: Messages in flight (being processed)
- `ApproximateNumberOfMessagesDelayed`: Messages delayed
- `ApproximateAgeOfOldestMessage`: Age of oldest message in queue

## Error Handling

Messages that fail processing 3 times are automatically moved to the Dead Letter Queue (DLQ). Monitor the DLQ for:

- Failed AI processing jobs
- Invalid message formats
- Timeout issues
- Service unavailability

## Best Practices

1. **Always include traceId**: Enables distributed tracing across services
2. **Set appropriate timeouts**: Ensure visibility timeout > Lambda timeout
3. **Monitor DLQs**: Set up CloudWatch alarms for DLQ message count
4. **Use message attributes**: Enables filtering and routing
5. **Implement idempotency**: Handle duplicate messages gracefully
