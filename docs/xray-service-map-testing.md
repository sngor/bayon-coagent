# X-Ray Service Map Visualization Testing Guide

This guide explains how to test and validate the X-Ray service map visualization for the microservices architecture.

## Prerequisites

1. AWS X-Ray daemon running (for local testing) or AWS X-Ray enabled in production
2. Lambda functions deployed with X-Ray tracing enabled
3. API Gateway configured with X-Ray tracing
4. Active traffic flowing through the system

## Enabling X-Ray Tracing

### Lambda Functions

X-Ray tracing is already enabled in all Lambda functions through the `aws-xray-sdk-core` package:

```typescript
import { AWSXRay } from "aws-xray-sdk-core";

// Wrap AWS SDK clients with X-Ray
const dynamoClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({}));
const sqsClient = AWSXRay.captureAWSv3Client(new SQSClient({}));
```

### API Gateway

Enable X-Ray tracing in API Gateway through the AWS Console or SAM template:

```yaml
Resources:
  MyApi:
    Type: AWS::Serverless::Api
    Properties:
      TracingEnabled: true
```

### Next.js API Routes

Use the X-Ray middleware for Next.js API routes:

```typescript
import { withXRayTracing } from "@/aws/xray/middleware";

export const GET = withXRayTracing(async (request: NextRequest) => {
  // Your handler code
});
```

## Testing Service Map Visualization

### 1. Generate Test Traffic

Run the following commands to generate traffic across services:

```bash
# Test AI service
curl -X POST https://your-api.com/api/ai/generate-blog-post \
  -H "Content-Type: application/json" \
  -d '{"topic": "Real Estate Market Trends"}'

# Test integration service
curl -X POST https://your-api.com/api/oauth/google/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "test-code"}'

# Test background service
curl -X POST https://your-api.com/api/analytics/sync \
  -H "Content-Type: application/json"
```

### 2. Access X-Ray Console

1. Open the AWS Console
2. Navigate to X-Ray service
3. Click on "Service map" in the left sidebar
4. Select the time range (last 5 minutes, 1 hour, etc.)

### 3. Verify Service Map

The service map should show:

#### Expected Services

- **bayon-coagent-nextjs**: Next.js application
- **bayon-coagent-ai**: AI processing Lambda functions
- **bayon-coagent-integration**: Integration Lambda functions
- **bayon-coagent-background**: Background processing Lambda functions
- **AWS Services**: DynamoDB, S3, SQS, EventBridge, etc.

#### Expected Connections

```
Client → API Gateway → Next.js
Next.js → AI Service → Bedrock
Next.js → Integration Service → External APIs
Next.js → Background Service → EventBridge
AI Service → DynamoDB
Integration Service → Secrets Manager
Background Service → SQS
```

#### Service Map Metrics

For each service, verify:

- **Response time**: Average, p50, p90, p99
- **Request count**: Total requests
- **Error rate**: Percentage of failed requests
- **Throttle rate**: Percentage of throttled requests

### 4. Trace Analysis

Click on any service node to view:

1. **Traces**: Individual request traces
2. **Analytics**: Performance metrics over time
3. **Alarms**: CloudWatch alarms for the service

#### Analyzing a Trace

1. Click on a service node
2. Click "View traces"
3. Select a trace to see:
   - Timeline of all spans
   - Service call hierarchy
   - Duration of each operation
   - Errors and exceptions
   - Annotations and metadata

### 5. Validate Trace Correlation

For a single request, verify:

1. **Trace ID**: Same across all services
2. **Parent-Child Relationships**: Correct span hierarchy
3. **Timing**: Logical sequence of operations
4. **Metadata**: Correct service names, operations, user IDs

Example trace structure:

```
Root Span: API Gateway
├── Span: Next.js API Route
│   ├── Span: AI Service Lambda
│   │   ├── Span: DynamoDB Query
│   │   └── Span: Bedrock Invoke
│   └── Span: Integration Service Lambda
│       ├── Span: Secrets Manager GetSecret
│       └── Span: External API Call
└── Span: Background Service Lambda
    └── Span: SQS SendMessage
```

## Common Issues and Troubleshooting

### Service Not Appearing in Map

**Possible Causes:**

- X-Ray tracing not enabled
- No traffic to the service
- X-Ray daemon not running (local)
- IAM permissions missing

**Solutions:**

1. Verify X-Ray is enabled in Lambda/API Gateway
2. Generate test traffic
3. Check X-Ray daemon logs
4. Verify IAM role has `xray:PutTraceSegments` permission

### Broken Trace Correlation

**Possible Causes:**

- Trace header not propagated
- Missing X-Ray middleware
- Incorrect trace ID format

**Solutions:**

1. Verify trace headers are included in requests
2. Use `withXRayTracing` middleware
3. Check trace ID format: `1-{timestamp}-{id}`

### Missing Service Dependencies

**Possible Causes:**

- AWS SDK not wrapped with X-Ray
- External calls not traced
- Subsegments not created

**Solutions:**

1. Wrap AWS SDK clients: `AWSXRay.captureAWSv3Client(client)`
2. Use `traceExternalAPICall` for external APIs
3. Create subsegments for operations

## Automated Testing

Run the property-based tests to verify trace correlation:

```bash
# Test distributed tracing
npm test -- src/__tests__/distributed-tracing-properties.test.ts

# Test log correlation
npm test -- src/__tests__/log-correlation-properties.test.ts
```

## CloudWatch Insights Queries

Use pre-defined queries to analyze traces:

```typescript
import { findLogsByTraceId } from "@/aws/logging/cloudwatch-client";

// Find all logs for a trace
const logs = await findLogsByTraceId(
  "/aws/lambda/my-function",
  "1-5f8a1234-abcd1234efgh5678ijkl9012",
  new Date(Date.now() - 3600000) // 1 hour ago
);
```

## Performance Benchmarks

Expected performance metrics:

| Service     | P50    | P90    | P99    | Error Rate |
| ----------- | ------ | ------ | ------ | ---------- |
| Next.js     | <100ms | <200ms | <500ms | <1%        |
| AI Service  | <2s    | <5s    | <10s   | <2%        |
| Integration | <500ms | <1s    | <2s    | <1%        |
| Background  | <200ms | <500ms | <1s    | <0.5%      |

## Monitoring and Alerts

Set up CloudWatch alarms for:

1. **High Error Rate**: >5% errors in 5 minutes
2. **High Latency**: P99 >10s for 5 minutes
3. **Throttling**: >10 throttled requests in 5 minutes
4. **Missing Traces**: No traces for 10 minutes

## Best Practices

1. **Always propagate trace headers** in cross-service calls
2. **Use subsegments** for granular operation tracking
3. **Add annotations** for searchable metadata
4. **Add metadata** for detailed context
5. **Handle errors** and mark spans as failed
6. **Close segments** properly to avoid orphaned spans
7. **Use correlation IDs** for request tracking
8. **Test locally** with X-Ray daemon before deploying

## Resources

- [AWS X-Ray Documentation](https://docs.aws.amazon.com/xray/)
- [X-Ray SDK for Node.js](https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs.html)
- [Service Map Documentation](https://docs.aws.amazon.com/xray/latest/devguide/xray-console-servicemap.html)
- [Trace Analysis](https://docs.aws.amazon.com/xray/latest/devguide/xray-console-traces.html)
