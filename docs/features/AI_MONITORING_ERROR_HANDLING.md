# AI Monitoring Error Handling Implementation

## Overview

Comprehensive error handling has been implemented across all AI monitoring components to ensure robust operation and provide clear, actionable feedback to users.

## Error Handling Features

### 1. Platform Query Retry Logic

**Location**: `src/lib/ai-platform-query.ts`

**Features**:

- Automatic retry with exponential backoff (3 attempts)
- Retry delays: 2s, 4s, 8s
- Smart retry logic that distinguishes between retryable and non-retryable errors
- Timeout protection (15 seconds per request)

**Retryable Errors**:

- Network errors (ECONNRESET, ENOTFOUND)
- Timeout errors
- Server errors (500, 502, 503, 504)

**Non-Retryable Errors**:

- Authentication failures (401, 403)
- Rate limit exceeded (429)
- Client errors (4xx)

**Platform-Specific Error Messages**:

- ChatGPT: Detailed error messages with status codes
- Perplexity: Rate limit and authentication handling
- Claude: API-specific error parsing
- Gemini: Google AI error handling

### 2. Missing Agent Data Fallbacks

**Location**: `src/lib/ai-platform-query.ts`, `src/lib/ai-monitoring-scheduler.ts`

**Fallback Values**:

- Agent name: "Real Estate Agent" (if missing)
- City: "Unknown Location" (if missing)
- Specialties: ["residential real estate"] (if empty)
- Neighborhood: Falls back to city value

**Behavior**:

- Logs warnings when using fallback values
- Continues execution with safe defaults
- Skips comparison queries if competitor name is missing

### 3. No Mentions Found Handling

**Location**: `src/lib/ai-monitoring-scheduler.ts`

**Features**:

- Stores zero score when no mentions are found
- Distinguishes between "no data collected" and "monitoring performed but no mentions"
- Provides empty state with helpful messaging

**Zero Score Structure**:

```typescript
{
  score: 0,
  breakdown: { all components: 0 },
  mentionCount: 0,
  sentimentDistribution: { all: 0 },
  platformBreakdown: { all: 0 },
  trend: 'stable',
  trendPercentage: 0
}
```

### 4. Stale Data Detection

**Location**: `src/app/actions.ts`, `src/lib/ai-monitoring-error-handler.ts`

**Features**:

- Detects data older than 7 days
- Includes `isStale` flag in API responses
- Provides `lastUpdated` timestamp
- Suggests manual refresh when data is stale

**Helper Functions**:

- `isDataStale(lastUpdated, staleDays)`: Checks if data exceeds threshold
- `getTimeSinceUpdate(lastUpdated)`: Human-readable time format

### 5. User-Friendly Error Messages

**Location**: `src/app/actions.ts`, `src/lib/ai-monitoring-error-handler.ts`

**Error Categories**:

1. **Platform Unavailable**: Service temporarily down
2. **Rate Limit Exceeded**: API quota reached
3. **Authentication Failed**: Invalid API credentials
4. **Missing Data**: No monitoring data found
5. **Stale Data**: Data older than expected
6. **Network Error**: Connection issues
7. **Timeout**: Request took too long
8. **Budget Exceeded**: Cost limits reached
9. **Invalid Configuration**: Setup issues
10. **Unknown**: Unexpected errors

**Message Format**:

- Clear description of the problem
- Suggested action for resolution
- Indication of whether error is retryable

### 6. Bedrock Flow Error Handling

**Location**: `src/aws/bedrock/flows/analyze-ai-mention.ts`, `src/aws/bedrock/flows/calculate-visibility-score.ts`

**Features**:

#### Analyze AI Mention Flow

- Provides default values if topics/expertise areas are empty
- Validates sentiment and prominence values
- Returns fallback response if analysis fails completely
- Logs warnings for invalid data

**Fallback Response**:

```typescript
{
  sentiment: 'neutral',
  sentimentReason: 'Unable to analyze sentiment due to processing error',
  topics: ['general real estate'],
  expertiseAreas: ['real estate services'],
  contextSnippet: truncated response,
  prominence: 'medium'
}
```

#### Calculate Visibility Score Flow

- Clamps score to valid range (0-100)
- Validates and clamps breakdown components
- Provides zero score fallback if calculation fails
- Validates trend values

**Component Ranges**:

- Mention Frequency: 0-25
- Sentiment Score: 0-35
- Prominence Score: 0-25
- Platform Diversity: 0-15

### 7. Empty State Messages

**Location**: `src/lib/ai-monitoring-error-handler.ts`

**Contexts**:

1. **No Configuration**: Prompts user to set up monitoring
2. **Configuration Exists, No Data**: Indicates first run is pending
3. **Filtered View, No Results**: Suggests adjusting filters
4. **No Mentions Found**: Encourages building online presence

**Message Structure**:

```typescript
{
  title: string,
  message: string,
  action?: string  // Suggested action button text
}
```

### 8. Configuration Validation

**Location**: `src/lib/ai-monitoring-error-handler.ts`

**Validates**:

- Monitoring is enabled
- At least one platform selected
- At least one query template selected
- Alert threshold is between 0-100

**Returns**:

```typescript
{
  isValid: boolean,
  errors: string[]  // List of validation errors
}
```

## Error Handling Utilities

### Error Categorization

```typescript
categorizeError(error: unknown): {
  type: AIMonitoringErrorType;
  message: string;
  isRetryable: boolean;
  suggestedAction?: string;
}
```

Analyzes error and returns:

- Error type classification
- User-friendly message
- Whether error is retryable
- Suggested action for resolution

### Error Logging

```typescript
formatErrorForLogging(error: unknown, context?: Record<string, any>): string
```

Formats errors for logging with:

- Error type and message
- Stack trace (if available)
- Additional context
- Structured format for log analysis

## Testing

**Test File**: `src/lib/__tests__/ai-monitoring-error-handler.test.ts`

**Coverage**:

- 32 test cases
- All error categories
- Edge cases (null values, invalid data)
- Time calculations
- Empty state messages
- Configuration validation

**Test Results**: ✅ All tests passing

## Usage Examples

### In Server Actions

```typescript
export async function getAIVisibilityData(userId: string) {
  try {
    // ... fetch data

    // Check for stale data
    const isStale = latestScore
      ? Date.now() - new Date(latestScore.calculatedAt).getTime() >
        7 * 24 * 60 * 60 * 1000
      : true;

    // Provide helpful message
    let message = "success";
    if (!latestScore && !config) {
      message =
        "No monitoring data found. Set up monitoring to start tracking.";
    } else if (isStale) {
      message = "Data is older than 7 days. Consider running a manual refresh.";
    }

    return { message, data: { isStale, lastUpdated }, errors: {} };
  } catch (error) {
    const errorInfo = categorizeError(error);
    return {
      message: errorInfo.message,
      data: null,
      errors: { system: error.message },
    };
  }
}
```

### In Components

```typescript
function AIVisibilityDashboard({ data }) {
  if (!data.score) {
    const emptyState = getEmptyStateMessage({
      hasConfig: !!data.config,
      hasScore: false,
      hasMentions: data.recentMentions.length > 0,
      isFiltered: false,
    });

    return (
      <EmptyState
        title={emptyState.title}
        message={emptyState.message}
        action={emptyState.action}
      />
    );
  }

  if (data.isStale) {
    return (
      <StaleDataBanner
        lastUpdated={getTimeSinceUpdate(data.lastUpdated)}
        onRefresh={handleRefresh}
      />
    );
  }

  // ... render dashboard
}
```

### In Monitoring Scheduler

```typescript
async function executeMonitoring(userId: string) {
  try {
    // Get profile with fallbacks
    const agentData = {
      name: profile?.name || "Real Estate Agent",
      city: profile?.city || "Unknown Location",
      specialties:
        profile?.specialties?.length > 0
          ? profile.specialties
          : ["residential real estate"],
    };

    // Log warning if using fallbacks
    if (!profile?.name || !profile?.city) {
      console.warn(`Using fallback values for user ${userId}`);
    }

    // ... continue monitoring
  } catch (error) {
    const errorInfo = categorizeError(error);
    console.error(formatErrorForLogging(error, { userId }));

    if (errorInfo.isRetryable) {
      // Schedule retry
    } else {
      // Alert admin
    }
  }
}
```

## Best Practices

1. **Always provide fallback values** for missing data
2. **Log warnings** when using fallbacks or encountering issues
3. **Distinguish between retryable and non-retryable errors**
4. **Provide clear, actionable error messages** to users
5. **Include context** in error logs for debugging
6. **Validate data** before processing
7. **Handle empty states gracefully** with helpful messaging
8. **Check for stale data** and inform users
9. **Use exponential backoff** for retries
10. **Set reasonable timeouts** to prevent hanging requests

## Error Monitoring

All errors are logged with:

- Error type and category
- User context (userId, platform, etc.)
- Stack traces for debugging
- Timestamps for tracking

Errors can be monitored in CloudWatch Logs with structured logging format.

## Future Enhancements

1. **Error Analytics Dashboard**: Track error rates by type and platform
2. **Automatic Error Recovery**: Self-healing for common issues
3. **User Notification System**: Alert users of persistent errors
4. **Error Rate Limiting**: Prevent cascading failures
5. **Circuit Breaker Pattern**: Temporarily disable failing platforms
6. **Detailed Error Reporting**: Admin dashboard for error analysis

## Related Files

- `src/lib/ai-platform-query.ts` - Platform query with retry logic
- `src/lib/ai-monitoring-scheduler.ts` - Scheduler with error handling
- `src/lib/ai-monitoring-error-handler.ts` - Error handling utilities
- `src/app/actions.ts` - Server actions with user-friendly errors
- `src/aws/bedrock/flows/analyze-ai-mention.ts` - Flow error handling
- `src/aws/bedrock/flows/calculate-visibility-score.ts` - Score calculation errors
- `src/lib/__tests__/ai-monitoring-error-handler.test.ts` - Error handler tests

## Requirements Validation

This implementation addresses all error handling requirements from task 20:

✅ Handle AI platform unavailability with retry logic
✅ Handle rate limit exceeded scenarios
✅ Handle missing agent data with fallback values
✅ Handle no mentions found with empty state
✅ Handle stale data with last update timestamp
✅ Add comprehensive error messages for user-facing errors

All error scenarios are covered with appropriate handling, logging, and user feedback.
