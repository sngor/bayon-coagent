# Health Check Endpoints - Quick Reference

## Endpoints

| Service       | Endpoint      | API Gateway             | Lambda Function                    |
| ------------- | ------------- | ----------------------- | ---------------------------------- |
| AI Processing | `GET /health` | AI Service API          | `health-check-ai-service`          |
| Integration   | `GET /health` | Integration Service API | `health-check-integration-service` |
| Background    | `GET /health` | Background Service API  | `health-check-background-service`  |
| Admin         | `GET /health` | Admin Service API       | `health-check-admin-service`       |

## Response Format

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

## Status Codes

- **200**: Service is healthy
- **503**: Service is degraded or unhealthy

## Status Values

- **healthy**: All dependencies operational
- **degraded**: Some dependencies failing, reduced functionality
- **unhealthy**: Critical dependencies failing, cannot operate

## Dependencies by Service

### AI Service

- ✓ DynamoDB (table accessibility)
- ✓ SQS (queue availability)
- ✓ Bedrock (model availability)

### Integration Service

- ✓ DynamoDB (table accessibility)
- ✓ Secrets Manager (secret access)
- ✓ S3 (bucket availability)

### Background Service

- ✓ DynamoDB (table accessibility)
- ✓ EventBridge (event bus availability)
- ✓ CloudWatch (metrics availability)

### Admin Service

- ✓ DynamoDB (table accessibility)
- ✓ Cognito (user pool availability)
- ✓ CloudWatch (metrics availability)

## Authentication

All endpoints require **AWS IAM** authentication with Signature V4.

## Quick Commands

### Verify Configuration

```bash
tsx scripts/verify-health-checks.ts
```

### Test Implementation

```bash
tsx scripts/test-health-check-implementation.ts
```

### Get API URLs

```bash
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-development \
  --query 'Stacks[0].Outputs[?contains(OutputKey, `ApiUrl`)].{Service:OutputKey,URL:OutputValue}' \
  --output table
```

### Test Endpoint (AWS CLI)

```bash
aws apigateway test-invoke-method \
  --rest-api-id <API_ID> \
  --resource-id <RESOURCE_ID> \
  --http-method GET \
  --path-with-query-string "/health"
```

## Troubleshooting

### 503 Response

1. Check CloudWatch Logs: `/aws/lambda/bayon-coagent-health-check-*`
2. Verify dependencies are accessible
3. Check IAM permissions
4. Verify environment variables

### 403 Response

1. Verify IAM authentication
2. Check request signature
3. Verify Lambda invoke permissions
4. Check API Gateway authorization

### Timeout

1. Check Lambda timeout (30s)
2. Verify network connectivity
3. Check for slow dependency checks
4. Review Lambda cold starts

## Monitoring

### CloudWatch Metrics

- `AWS/ApiGateway` → `Count` (total requests)
- `AWS/ApiGateway` → `5XXError` (failures)
- `AWS/Lambda` → `Duration` (execution time)
- `AWS/Lambda` → `Errors` (Lambda errors)

### X-Ray Traces

- View service map in X-Ray console
- Analyze latency and errors
- Correlate with other operations

### CloudWatch Logs

- `/aws/lambda/bayon-coagent-health-check-ai-service-*`
- `/aws/lambda/bayon-coagent-health-check-integration-service-*`
- `/aws/lambda/bayon-coagent-health-check-background-service-*`
- `/aws/lambda/bayon-coagent-health-check-admin-service-*`

## Related Documentation

- [Full Health Check Guide](./HEALTH_CHECK_GUIDE.md)
- [Deployment Checklist](../../../.kiro/specs/microservices-architecture/HEALTH_CHECK_DEPLOYMENT_CHECKLIST.md)
- [Task Summary](../../../.kiro/specs/microservices-architecture/TASK_5.3_SUMMARY.md)
