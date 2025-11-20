# Error Handling and Retry Logic Implementation

## Overview

This document describes the comprehensive error handling and retry logic implementation for the Reimagine Image Toolkit, fulfilling Requirements 2.4 and 8.4.

## Implementation Summary

### 1. Error Handler Module (`reimagine-error-handler.ts`)

Created a centralized error handling module that provides:

#### Error Classification

- **ThrottlingError**: Bedrock API throttling (429, ThrottlingException)
- **TimeoutError**: Operation timeouts (408, TimeoutError)
- **ContentFilterError**: Safety policy violations
- **ValidationError**: Invalid input parameters (400, ValidationException)
- **StorageError**: S3 operation failures
- **DatabaseError**: DynamoDB operation failures
- **NetworkError**: Network connectivity issues
- **ReimagineError**: Base error class with user-friendly messages

#### Retry Logic

- **Exponential backoff**: Configurable delay between retries
- **Operation-specific configs**: Different retry strategies for upload, analysis, edit, storage, and database operations
- **Timeout handling**: Per-operation timeout limits (30s for uploads, 90s for edits)
- **Retryable error detection**: Automatically retries throttling, timeout, network, and service unavailable errors

#### Error Response Formatting

- User-friendly error messages
- Error codes for programmatic handling
- Recovery suggestions for each error type
- CloudWatch logging integration

### 2. Retry Configurations

```typescript
OPERATION_RETRY_CONFIGS = {
  upload: {
    maxRetries: 3,
    initialDelayMs: 500,
    timeoutMs: 30000, // 30 seconds
  },
  analysis: {
    maxRetries: 2,
    initialDelayMs: 1000,
    timeoutMs: 30000, // 30 seconds
  },
  edit: {
    maxRetries: 3,
    initialDelayMs: 2000,
    timeoutMs: 90000, // 90 seconds (edits take longer)
  },
  storage: {
    maxRetries: 3,
    initialDelayMs: 500,
    timeoutMs: 20000, // 20 seconds
  },
  database: {
    maxRetries: 3,
    initialDelayMs: 500,
    timeoutMs: 10000, // 10 seconds
  },
};
```

### 3. Server Actions Updates

Updated all server actions in `reimagine-actions.ts`:

#### uploadImageAction

- Retry logic for S3 uploads (3 retries)
- Retry logic for AI analysis (2 retries)
- Retry logic for DynamoDB metadata save (3 retries)
- CloudWatch error logging
- Formatted error responses with recovery suggestions

#### processEditAction

- Retry logic for Bedrock edit operations (3 retries, 90s timeout)
- Retry logic for S3 result storage (3 retries)
- Retry logic for DynamoDB edit record save (3 retries)
- CloudWatch error logging
- Formatted error responses with recovery suggestions

#### Other Actions

- getEditHistoryAction: Error logging and formatted responses
- deleteEditAction: Error logging and formatted responses
- acceptEditAction: Error logging and formatted responses
- getOriginalImageAction: Error logging and formatted responses
- reAnalyzeImageAction: Error logging and formatted responses

### 4. Bedrock Flow Updates

Updated all Bedrock flows to use centralized error handling:

#### reimagine-analyze.ts

- CloudWatch error logging
- Classified error responses
- Fallback suggestions on analysis failure

#### reimagine-staging.ts

- CloudWatch error logging with room type and style context
- Classified error responses with user-friendly messages

#### reimagine-day-to-dusk.ts

- CloudWatch error logging with intensity context
- Classified error responses

#### reimagine-enhance.ts

- CloudWatch error logging with adjustment parameters
- Classified error responses

#### reimagine-remove.ts

- CloudWatch error logging with object count and descriptions
- Classified error responses

#### reimagine-renovate.ts

- CloudWatch error logging with description length and style
- Classified error responses

## Error Messages and Recovery Suggestions

### Throttling Errors

- **Message**: "The AI service is currently busy. Please try again in a moment."
- **Suggestions**:
  - Wait a few seconds and try again
  - If the issue persists, try again later

### Timeout Errors

- **Message**: "The request took too long to process. Please try again."
- **Suggestions**:
  - Try again with a smaller image
  - Check your internet connection
  - Try a different edit operation

### Content Filter Errors

- **Message**: "The AI was unable to process this request due to safety filters. Please try a different image."
- **Suggestions**:
  - Try uploading a different image
  - Ensure the image is appropriate for real estate marketing
  - Avoid images with sensitive or inappropriate content

### Validation Errors

- **Message**: "Invalid [field]: [reason]"
- **Suggestions**:
  - Check your input and try again
  - Ensure all required fields are filled correctly

### Storage Errors

- **Message**: "File storage service is temporarily unavailable. Please try again."
- **Suggestions**:
  - Try again in a few moments
  - Check your internet connection
  - If the issue persists, contact support

### Database Errors

- **Message**: "Database service is temporarily unavailable. Please try again."
- **Suggestions**:
  - Try again in a few moments
  - If the issue persists, contact support

### Network Errors

- **Message**: "Network connection error. Please check your internet connection and try again."
- **Suggestions**:
  - Check your internet connection
  - Try again in a few moments
  - If using VPN, try disconnecting

## CloudWatch Logging

All errors are logged to CloudWatch with structured context:

```typescript
{
  timestamp: "2024-01-01T12:00:00.000Z",
  level: "ERROR",
  message: "Operation failed",
  context: {
    service: "reimagine",
    operation: "upload-image",
    userId: "user-123",
    imageId: "img-456",
    errorCode: "THROTTLING",
    userMessage: "The AI service is currently busy...",
    recoverySuggestions: ["Wait a few seconds...", "..."]
  },
  error: {
    name: "ThrottlingError",
    message: "Bedrock API throttling",
    stack: "...",
    code: "ThrottlingException"
  },
  environment: "production"
}
```

## Testing Recommendations

### Unit Tests

1. Test error classification for each error type
2. Test retry logic with mock failures
3. Test timeout handling
4. Test error response formatting

### Integration Tests

1. Test upload with simulated throttling
2. Test edit operations with simulated timeouts
3. Test storage failures and recovery
4. Test database failures and recovery

### Manual Testing

1. Test with large images to trigger timeouts
2. Test with rapid requests to trigger throttling
3. Test with invalid parameters to trigger validation errors
4. Monitor CloudWatch logs for proper error logging

## Requirements Fulfilled

### Requirement 2.4

✅ "WHEN virtual staging fails due to model limitations THEN the system SHALL notify the user with a descriptive error message and suggested alternatives"

- Implemented comprehensive error classification
- User-friendly error messages for all failure scenarios
- Recovery suggestions for each error type
- Applied to all edit operations (staging, day-to-dusk, enhance, remove, renovate)

### Requirement 8.4

✅ "WHEN an edit operation fails THEN the system SHALL notify the user with a clear error message and suggested next steps"

- Clear error messages for all failure scenarios
- Specific recovery suggestions based on error type
- CloudWatch logging for monitoring and debugging
- Retry logic to handle transient failures automatically

## Benefits

1. **Improved User Experience**: Clear, actionable error messages help users understand and resolve issues
2. **Increased Reliability**: Automatic retry logic handles transient failures without user intervention
3. **Better Monitoring**: CloudWatch logging provides visibility into errors for debugging and optimization
4. **Maintainability**: Centralized error handling makes it easy to update error messages and retry logic
5. **Consistency**: All operations use the same error handling patterns

## Future Enhancements

1. **Error Analytics**: Track error rates and types to identify patterns
2. **Adaptive Retry**: Adjust retry delays based on error patterns
3. **Circuit Breaker**: Temporarily disable operations that are consistently failing
4. **User Notifications**: Proactive notifications for service degradation
5. **Error Recovery UI**: Dedicated UI for error recovery with guided steps
