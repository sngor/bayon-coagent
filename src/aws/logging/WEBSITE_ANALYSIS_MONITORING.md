# Website Analysis Monitoring and Logging

This document describes the monitoring and logging implementation for the Website Analysis feature.

## Overview

The Website Analysis feature includes comprehensive monitoring and logging to track:

- Analysis start/completion events
- Error rates and types
- Analysis duration and performance
- Success/failure rates
- Data quality metrics

## Components

### 1. Metrics Client (`website-analysis-metrics.ts`)

The metrics client publishes CloudWatch metrics for monitoring website analysis operations.

#### Metrics Published

| Metric Name          | Type         | Description                               |
| -------------------- | ------------ | ----------------------------------------- |
| `AnalysisStarted`    | Count        | Number of analyses started                |
| `AnalysisCompleted`  | Count        | Number of analyses completed successfully |
| `AnalysisFailed`     | Count        | Number of analyses that failed            |
| `AnalysisDuration`   | Milliseconds | Total time to complete analysis           |
| `CrawlDuration`      | Milliseconds | Time spent crawling website               |
| `ExtractionDuration` | Milliseconds | Time spent extracting data                |
| `AIAnalysisDuration` | Milliseconds | Time spent on AI analysis                 |
| `PagesCrawled`       | Count        | Number of pages crawled                   |
| `SchemaTypesFound`   | Count        | Number of schema types found              |
| `OverallScore`       | None         | Optimization score (0-100)                |
| `ErrorRate`          | Count        | Error count by type                       |

#### Error Types

Errors are categorized for better tracking:

- `ValidationError`: Input validation failures
- `NetworkError`: Network connectivity issues
- `TimeoutError`: Request timeouts
- `SSLError`: SSL certificate errors
- `ParsingError`: HTML/JSON parsing errors
- `AIServiceError`: Bedrock/AI service errors
- `DatabaseError`: DynamoDB errors
- `UnknownError`: Uncategorized errors

#### Usage Example

```typescript
import { websiteAnalysisMetrics } from "@/aws/logging/website-analysis-metrics";

// Track analysis start
await websiteAnalysisMetrics.trackAnalysisStarted(userId, websiteUrl, {
  correlationId,
});

// Track successful completion
await websiteAnalysisMetrics.trackAnalysisCompleted(
  userId,
  websiteUrl,
  duration,
  score,
  pagesCrawled,
  schemaTypesFound,
  { correlationId }
);

// Track failure
await websiteAnalysisMetrics.trackAnalysisFailed(
  userId,
  websiteUrl,
  errorType,
  error,
  duration,
  { correlationId }
);
```

### 2. Structured Logging

The feature uses the centralized logger (`logger.ts`) for structured logging with:

- Correlation IDs for request tracing
- User ID tracking
- Operation timing
- Error context

#### Log Levels

- **DEBUG**: Detailed operation steps (crawl, extraction, AI analysis)
- **INFO**: Major milestones (analysis start, completion)
- **WARN**: Non-fatal issues (partial data extraction)
- **ERROR**: Failures and exceptions

#### Usage Example

```typescript
import { createLogger, generateCorrelationId } from "@/aws/logging/logger";

const correlationId = generateCorrelationId();
const logger = createLogger({
  correlationId,
  service: "website-analysis",
  userId,
  websiteUrl,
});

logger.info("Starting website analysis", {
  operation: "analyzeWebsite",
});

logger.error("Analysis failed", error, {
  operation: "analyzeWebsite",
  duration,
});
```

### 3. CloudWatch Dashboard (`website-analysis-dashboard.ts`)

A pre-configured CloudWatch dashboard provides real-time monitoring:

#### Dashboard Sections

1. **Overview Metrics**

   - Analysis volume (started, completed, failed)
   - Success rate percentage
   - Analysis duration (avg, p50, p90, p99)
   - Average optimization score

2. **Performance Breakdown**

   - Duration by phase (crawl, extraction, AI analysis)
   - Data collected (pages, schema types)
   - Errors by type

3. **Single Value Metrics (24h)**

   - Total analyses
   - Success rate
   - Average duration
   - Average score

4. **Recent Analyses Log**
   - Last 100 analyses with details

#### Creating the Dashboard

```typescript
import { createWebsiteAnalysisDashboard } from "@/aws/logging/website-analysis-dashboard";

// Create or update the dashboard
await createWebsiteAnalysisDashboard("us-east-1");
```

Or use the AWS CLI:

```bash
# Deploy the dashboard
aws cloudwatch put-dashboard \
  --dashboard-name BayonCoagent-WebsiteAnalysis \
  --dashboard-body file://dashboard-config.json
```

## Monitoring Best Practices

### 1. Set Up Alarms

Create CloudWatch alarms for critical metrics:

```typescript
// High error rate alarm
{
  AlarmName: 'WebsiteAnalysis-HighErrorRate',
  MetricName: 'ErrorRate',
  Namespace: 'BayonCoagent/WebsiteAnalysis',
  Statistic: 'Sum',
  Period: 300,
  EvaluationPeriods: 2,
  Threshold: 10,
  ComparisonOperator: 'GreaterThanThreshold',
}

// Slow analysis alarm
{
  AlarmName: 'WebsiteAnalysis-SlowAnalysis',
  MetricName: 'AnalysisDuration',
  Namespace: 'BayonCoagent/WebsiteAnalysis',
  Statistic: 'Average',
  Period: 300,
  EvaluationPeriods: 2,
  Threshold: 60000, // 60 seconds
  ComparisonOperator: 'GreaterThanThreshold',
}
```

### 2. Query Logs with CloudWatch Insights

Find analyses by user:

```
fields @timestamp, context.websiteUrl, context.duration, context.score
| filter context.userId = "USER_ID"
| filter context.operation = "analyzeWebsite"
| sort @timestamp desc
```

Find errors by type:

```
fields @timestamp, context.errorType, @message
| filter context.operation = "analyzeWebsite"
| filter level = "ERROR"
| stats count() by context.errorType
```

Find slow analyses:

```
fields @timestamp, context.websiteUrl, context.duration
| filter context.operation = "analyzeWebsite"
| filter context.duration > 30000
| sort context.duration desc
```

### 3. Track Correlation IDs

Use correlation IDs to trace requests across services:

```
fields @timestamp, @message, context.correlationId
| filter context.correlationId = "CORRELATION_ID"
| sort @timestamp asc
```

## Performance Monitoring

### Key Metrics to Watch

1. **Success Rate**: Should be > 95%
2. **Average Duration**: Should be < 30 seconds
3. **P99 Duration**: Should be < 60 seconds
4. **Error Rate**: Should be < 5%

### Performance Optimization

If metrics show degradation:

1. **High Duration**

   - Check crawl duration (network issues?)
   - Check AI analysis duration (throttling?)
   - Review extraction complexity

2. **High Error Rate**

   - Check error types distribution
   - Review recent code changes
   - Check external service status

3. **Low Success Rate**
   - Review validation logic
   - Check profile data completeness
   - Verify website accessibility

## Local Development

In local development:

- Metrics are logged to console (not sent to CloudWatch)
- Logs use colored console output
- All log levels are enabled (DEBUG and above)

## Production

In production:

- Metrics are sent to CloudWatch
- Logs are structured JSON
- Log level is INFO and above
- X-Ray tracing is enabled

## Troubleshooting

### No Metrics Appearing

1. Check AWS credentials are configured
2. Verify IAM permissions for CloudWatch
3. Check environment is set to 'production'
4. Review CloudWatch client configuration

### Missing Logs

1. Check log group exists: `/aws/lambda/website-analysis`
2. Verify Lambda has CloudWatch Logs permissions
3. Check log retention settings
4. Review logger configuration

### Dashboard Not Updating

1. Verify metrics are being published
2. Check dashboard region matches metrics region
3. Refresh dashboard (may take 1-2 minutes)
4. Check metric namespace is correct

## Related Documentation

- [Logger Documentation](./logger.ts)
- [CloudWatch Client](./cloudwatch-client.ts)
- [Trace Correlation Guide](./TRACE_CORRELATION_GUIDE.md)
- [Website Analysis Design](../../.kiro/specs/website-analysis/design.md)
