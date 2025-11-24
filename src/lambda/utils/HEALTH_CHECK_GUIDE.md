# Health Check Endpoints Guide

## Overview

All microservices expose a `/health` endpoint that provides real-time health status information. These endpoints are secured with AWS IAM authentication and return standardized health check responses.

## Available Endpoints

### 1. AI Processing Service

- **Endpoint**: `GET /health`
- **API Gateway**: AI Service API
- **Lambda**: `health-check-ai-service.handler`
- **Checks**:
  - DynamoDB table accessibility
  - SQS queue (AI job request queue) accessibility
  - Bedrock service availability
- **Metrics**:
  - Queue depth (number of pending AI jobs)
  - Lambda uptime (seconds)
  - Memory usage (MB)

### 2. External Integration Service

- **Endpoint**: `GET /health`
- **API Gateway**: Integration Service API
- **Lambda**: `health-check-integration-service.handler`
- **Checks**:
  - DynamoDB table accessibility
  - Secrets Manager accessibility
  - S3 bucket accessibility
- **Metrics**:
  - Lambda uptime (seconds)
  - Memory usage (MB)

### 3. Background Processing Service

- **Endpoint**: `GET /health`
- **API Gateway**: Background Service API
- **Lambda**: `health-check-background-service.handler`
- **Checks**:
  - DynamoDB table accessibility
  - EventBridge event bus accessibility
  - CloudWatch metrics accessibility
- **Metrics**:
  - Lambda uptime (seconds)
  - Memory usage (MB)

### 4. Admin Service

- **Endpoint**: `GET /health`
- **API Gateway**: Admin Service API
- **Lambda**: `health-check-admin-service.handler`
- **Checks**:
  - DynamoDB table accessibility
  - Cognito user pool accessibility
  - CloudWatch metrics accessibility
- **Metrics**:
  - Lambda uptime (seconds)
  - Memory usage (MB)

## Response Format

All health check endpoints return a standardized JSON response:

```json
{
  "service": "ai-service",
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "dependencies": {
    "dynamodb": "healthy",
    "sqs": "healthy",
    "bedrock": "healthy"
  },
  "metrics": {
    "queueDepth": 5,
    "uptime": 3600,
    "memoryUsed": 128.5,
    "memoryTotal": 256.0
  }
}
```

### Response Fields

- **service**: Service identifier (e.g., "ai-service", "integration-service")
- **status**: Overall health status
  - `"healthy"`: All dependencies are working, service is fully operational
  - `"degraded"`: Some dependencies are failing, service has reduced functionality
  - `"unhealthy"`: Critical dependencies are failing, service cannot operate
- **timestamp**: ISO 8601 timestamp of the health check
- **version**: Service version number
- **dependencies**: Health status of each dependency (optional)
- **metrics**: Runtime metrics (optional)

### HTTP Status Codes

- **200 OK**: Service is healthy
- **503 Service Unavailable**: Service is degraded or unhealthy

## Authentication

All health check endpoints require AWS IAM authentication using Signature V4.

### Using AWS CLI

```bash
# Get the API Gateway URL from CloudFormation outputs
API_URL=$(aws cloudformation describe-stacks \
  --stack-name bayon-coagent-development \
  --query 'Stacks[0].Outputs[?OutputKey==`AiServiceApiUrl`].OutputValue' \
  --output text)

# Call the health endpoint
aws apigatewayv2 invoke \
  --api-id <api-id> \
  --stage v1 \
  --path /health \
  response.json

cat response.json
```

### Using AWS SDK (Node.js)

```typescript
import { SignatureV4 } from "@smithy/signature-v4";
import { HttpRequest } from "@smithy/protocol-http";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { Sha256 } from "@aws-crypto/sha256-js";

async function checkHealth(url: string) {
  const urlObj = new URL(url);

  const request = new HttpRequest({
    method: "GET",
    protocol: urlObj.protocol,
    hostname: urlObj.hostname,
    path: urlObj.pathname,
    headers: {
      host: urlObj.hostname,
      "Content-Type": "application/json",
    },
  });

  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region: "us-east-1",
    service: "execute-api",
    sha256: Sha256,
  });

  const signedRequest = await signer.sign(request);

  const response = await fetch(url, {
    method: "GET",
    headers: signedRequest.headers as Record<string, string>,
  });

  return await response.json();
}

// Usage
const healthData = await checkHealth(
  "https://abc123.execute-api.us-east-1.amazonaws.com/v1/health"
);
console.log(healthData);
```

## Verification Script

Use the provided verification script to check all health endpoints:

```bash
npx tsx scripts/verify-health-checks.ts
```

This script will:

1. Verify all Lambda function files exist
2. Verify all API Gateway resources are configured
3. Verify all deployment dependencies are correct
4. Display a comprehensive status report

## Monitoring Integration

### CloudWatch Alarms

You can create CloudWatch alarms based on health check failures:

```yaml
HealthCheckAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: ai-service-unhealthy
    MetricName: 5XXError
    Namespace: AWS/ApiGateway
    Statistic: Sum
    Period: 60
    EvaluationPeriods: 2
    Threshold: 5
    ComparisonOperator: GreaterThanThreshold
    Dimensions:
      - Name: ApiName
        Value: bayon-coagent-ai-development
      - Name: Resource
        Value: /health
      - Name: Method
        Value: GET
```

### CloudWatch Dashboards

Include health check metrics in your service dashboards:

```typescript
// Example CloudWatch dashboard widget
{
  "type": "metric",
  "properties": {
    "metrics": [
      ["AWS/ApiGateway", "Count", { "stat": "Sum", "label": "Health Checks" }],
      [".", "5XXError", { "stat": "Sum", "label": "Failed Health Checks" }]
    ],
    "period": 300,
    "stat": "Average",
    "region": "us-east-1",
    "title": "Service Health Checks"
  }
}
```

### X-Ray Tracing

All health check requests are traced with AWS X-Ray. You can:

- View the service map to see health check patterns
- Analyze latency and errors
- Correlate health checks with other service operations

## Best Practices

### 1. Regular Health Checks

Set up automated health checks to run periodically:

```bash
# Cron job example (every 5 minutes)
*/5 * * * * /usr/local/bin/check-service-health.sh
```

### 2. Dependency Checks

Each health check verifies its service-specific dependencies:

- Only check dependencies that are critical for service operation
- Use lightweight checks (e.g., DescribeTable instead of full table scan)
- Implement timeouts to prevent hanging health checks

### 3. Graceful Degradation

Services should return `"degraded"` status when:

- Non-critical dependencies are unavailable
- Service can still handle some requests
- Fallback mechanisms are in place

Services should return `"unhealthy"` status when:

- Critical dependencies are unavailable
- Service cannot process any requests
- Data integrity is at risk

### 4. Metrics Collection

Include relevant metrics in health check responses:

- Queue depths for async processing services
- Cache hit rates for caching services
- Connection pool sizes for database services
- Memory and CPU usage for resource monitoring

### 5. Security

- Always use IAM authentication for health checks
- Don't expose sensitive information in health check responses
- Log health check failures for security monitoring
- Rate limit health check endpoints to prevent abuse

## Troubleshooting

### Health Check Returns 503

1. Check CloudWatch Logs for the Lambda function
2. Verify all dependencies are accessible
3. Check IAM permissions for the Lambda role
4. Verify environment variables are set correctly

### Health Check Times Out

1. Increase Lambda timeout (currently 30 seconds)
2. Check for slow dependency checks
3. Verify network connectivity to dependencies
4. Check for Lambda cold starts

### Health Check Returns 403

1. Verify IAM authentication is configured correctly
2. Check that the request is properly signed
3. Verify the Lambda has permission to be invoked by API Gateway
4. Check API Gateway authorization settings

## Related Documentation

- [Distributed Tracing Guide](./DISTRIBUTED_TRACING_GUIDE.md)
- [Request Signing Guide](./REQUEST_SIGNING_GUIDE.md)
- [EventBridge Integration](./EVENTBRIDGE_README.md)
- [Cross-Service Communication](./CROSS_SERVICE_COMMUNICATION.md)
