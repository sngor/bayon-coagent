# Document Cleanup Lambda - Implementation Guide

## Overview

This guide documents the Document Cleanup Lambda function that permanently deletes soft-deleted documents after 30 days of retention.

## Architecture

### Lambda Function

**Location**: `src/lambda/cleanup-deleted-documents.ts`

**Purpose**: Scans DynamoDB for documents that have been soft-deleted for more than 30 days, deletes the S3 files, and removes the DynamoDB records.

**Configuration** (recommended):

- **Timeout**: 15 minutes (900,000 ms)
- **Memory**: 1024 MB
- **Schedule**: Daily at 2 AM UTC via EventBridge: `cron(0 2 * * ? *)`
- **Environment Variables**:
  - `DYNAMODB_TABLE_NAME`: DynamoDB table name (default: `BayonCoAgent`)
  - `S3_BUCKET_NAME`: S3 bucket for uploads (default: `bayon-coagent-uploads`)
  - `AWS_REGION`: AWS region (default: `us-east-1`)

### Key Features

1. **30-Day Retention**: Only deletes documents where `deletedAt` timestamp is older than 30 days
2. **Custom Retention**: Supports custom retention periods via event detail
3. **Dry Run Mode**: Test mode that logs what would be deleted without actual deletion
4. **Pagination**: Handles large datasets with DynamoDB pagination
5. **Error Handling**: Continues processing if individual documents fail
6. **Timeout Protection**: Stops processing when approaching Lambda timeout (30-second buffer)
7. **Structured Logging**: JSON-formatted logs for CloudWatch Insights

## How It Works

### 1. Document Scanning

The Lambda uses a DynamoDB Scan operation with a filter expression:

```typescript
FilterExpression: 'begins_with(SK, :docPrefix) AND attribute_exists(#data.deletedAt) AND #data.deletedAt < :cutoffTime'
```

This filter:
- Finds all documents (SK starts with `DOCUMENT#`)
- Ensures they have a `deletedAt` field
- Filters to only those deleted before the cutoff time (now - retention days)

### 2. S3 File Deletion

For each document, the Lambda:
1. Extracts the S3 key from the document record
2. Sends a `DeleteObjectCommand` to S3
3. Handles `NoSuchKey` errors gracefully (file already deleted)

### 3. DynamoDB Record Deletion

After S3 deletion, the Lambda:
1. Deletes the DynamoDB record using the document's PK/SK
2. Uses the key format: `PK: AGENT#<agentId>`, `SK: DOCUMENT#<documentId>`

### 4. Results Tracking

The Lambda tracks:
- `totalScanned`: Number of soft-deleted documents found
- `documentsDeleted`: Number successfully deleted
- `s3FilesDeleted`: Number of S3 files removed
- `dynamoRecordsDeleted`: Number of DynamoDB records removed
- `errors`: Array of errors for failed deletions

## Deployment

### 1. Deploy Lambda Function

```bash
# Navigate to lambda directory
cd src/lambda

# Install dependencies
npm install

# Build the Lambda (if using TypeScript compilation)
npm run build

# Package and deploy (example using AWS CLI)
aws lambda create-function \
  --function-name cleanup-deleted-documents \
  --runtime nodejs20.x \
  --handler cleanup-deleted-documents.handler \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --zip-file fileb://cleanup-deleted-documents.zip \
  --timeout 900 \
  --memory-size 1024 \
  --environment Variables="{DYNAMODB_TABLE_NAME=BayonCoAgent,S3_BUCKET_NAME=bayon-coagent-uploads,AWS_REGION=us-east-1}"
```

### 2. Configure IAM Role

The Lambda execution role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Scan",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT:table/BayonCoAgent"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::bayon-coagent-uploads/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

### 3. Create EventBridge Schedule

```bash
# Create a rule that triggers daily at 2 AM UTC
aws events put-rule \
  --name cleanup-deleted-documents-daily \
  --schedule-expression "cron(0 2 * * ? *)" \
  --state ENABLED

# Add Lambda as target
aws events put-targets \
  --rule cleanup-deleted-documents-daily \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:YOUR_ACCOUNT:function:cleanup-deleted-documents"

# Grant EventBridge permission to invoke Lambda
aws lambda add-permission \
  --function-name cleanup-deleted-documents \
  --statement-id EventBridgeInvoke \
  --action 'lambda:InvokeFunction' \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:us-east-1:YOUR_ACCOUNT:rule/cleanup-deleted-documents-daily
```

## Testing

### Run Unit Tests

```bash
npm test -- cleanup-deleted-documents.test.ts
```

**Test Coverage**:
- ✓ 30-day filter logic
- ✓ Custom retention periods
- ✓ Data validation
- ✓ S3 key and DynamoDB key formats
- ✓ Error handling (NoSuchKey, etc.)
- ✓ Timeout buffer logic
- ✓ Result counting
- ✓ Dry run mode
- ✓ Scan filter expressions

### Manual Testing with Dry Run

To test without actually deleting files:

```bash
# Invoke Lambda with dry run event
aws lambda invoke \
  --function-name cleanup-deleted-documents \
  --payload '{"detail": {"dryRun": true}}' \
  response.json

# View the results
cat response.json
```

### Test with Custom Retention

```bash
# Test with 7-day retention instead of 30
aws lambda invoke \
  --function-name cleanup-deleted-documents \
  --payload '{"detail": {"dryRun": true, "retentionDays": 7}}' \
  response.json
```

## Monitoring

### CloudWatch Logs

The Lambda emits structured JSON logs that can be queried with CloudWatch Insights:

```sql
# Count successful cleanups in last 7 days
fields @timestamp, @message
| filter @message like /Document cleanup completed/
| stats count() by bin(5m)

# Find errors
fields @timestamp, @message
| filter level = "ERROR"
| sort @timestamp desc

# Check deletion counts
fields @timestamp, totalScanned, documentsDeleted, s3FilesDeleted, dynamoRecordsDeleted
| filter @message like /Document cleanup completed/
| sort @timestamp desc
| limit 20
```

### CloudWatch Alarms

Recommended alarms:

1. **Lambda Errors**:
   - Metric: `Errors`
   - Threshold: > 0
   - Period: 1 day

2. **Lambda Duration**:
   - Metric: `Duration`
   - Threshold: > 800,000 ms (approaching 15-minute timeout)
   - Period: 1 day

3. **Failed Deletions**:
   - Custom metric from logs
   - Filter: `failed > 0`

## Troubleshooting

### Lambda Times Out

**Symptom**: Lambda stops processing mid-execution

**Solutions**:
1. Increase timeout to 15 minutes (maximum)
2. Run cleanup more frequently (e.g., twice daily)
3. Reduce batch size by adjusting scan limits

### S3 Deletion Failures

**Symptom**: `s3FilesDeleted < dynamoRecordsDeleted`

**Common Causes**:
1. Files already manually deleted
2. S3 bucket permissions issue
3. Objects in versioned bucket

**Solution**: Check CloudWatch logs for S3-specific errors

### DynamoDB Scan is Slow

**Symptom**: Long execution times, timeout warnings

**Solutions**:
1. Add a GSI for `deletedAt` field (recommended)
2. Implement parallel scans
3. Reduce scan page size

### No Documents Found

**Symptom**: `totalScanned: 0` every execution

**Possible Causes**:
1. No documents have been deleted
2. All deleted documents are < 30 days old
3. Filter expression incorrect

**Solution**: Check DynamoDB for documents with `deletedAt` field

## Best Practices

1. **Always test with dry run first** before deploying to production
2. **Monitor CloudWatch Logs** for the first few executions
3. **Set up CloudWatch Alarms** for errors and timeouts
4. **Review deletion counts** regularly to ensure expected behavior
5. **Keep retention period at 30 days** unless you have a specific business need

## Future Enhancements

Potential improvements:

1. **Add a GSI** on `deletedAt` for faster queries
2. **Implement parallel scans** for better performance with large datasets
3. **Add email notifications** for cleanup summaries
4. **Create CloudWatch Dashboard** with cleanup metrics
5. **Add support for specific agent filtering** for targeted cleanups
