# Stale Workflow Detection Guide

## Overview

The stale workflow detection utility automatically identifies and marks workflows that have been inactive for more than 30 days. This helps users manage their workflow instances and keeps the dashboard clean.

**Requirements:** 7.4, 7.5

## Key Features

- **Automatic Detection**: Calculates days since last activity
- **Status Update**: Marks workflows inactive >30 days as stale
- **Database Persistence**: Updates workflow status in DynamoDB
- **Flexible Execution**: Can run on dashboard load or as a scheduled job
- **Batch Processing**: Supports processing multiple users at once

## Usage

### 1. Client-Side (Dashboard Load)

The stale detection runs automatically when the dashboard loads:

```typescript
import { detectStaleWorkflows } from "@/app/workflow-actions";

// In your component
useEffect(() => {
  const checkStaleWorkflows = async () => {
    try {
      const result = await detectStaleWorkflows();

      if (result.message === "success" && result.data) {
        const { staleCount, totalActive } = result.data;
        console.log(
          `Marked ${staleCount} of ${totalActive} workflows as stale`
        );
      }
    } catch (error) {
      console.error("Failed to detect stale workflows:", error);
    }
  };

  checkStaleWorkflows();
}, []);
```

### 2. Server-Side (Scheduled Job)

For scheduled jobs or batch processing:

```typescript
import {
  detectAndMarkStaleWorkflows,
  batchDetectStaleWorkflows,
} from "@/lib/workflow-stale-detection";

// Single user
const result = await detectAndMarkStaleWorkflows(userId);
console.log(
  `Marked ${result.staleCount} workflows as stale for user ${userId}`
);

// Multiple users (batch)
const userIds = ["user1", "user2", "user3"];
const results = await batchDetectStaleWorkflows(userIds);
results.forEach((result) => {
  console.log(`User ${result.userId}: ${result.staleCount} stale workflows`);
});
```

### 3. Read-Only Check

To check for stale workflows without marking them:

```typescript
import {
  detectStaleWorkflows,
  getStaleWorkflowStats,
} from "@/lib/workflow-stale-detection";

// Get list of stale workflow IDs
const staleIds = await detectStaleWorkflows(userId);
console.log(`Found ${staleIds.length} stale workflows`);

// Get detailed statistics
const stats = await getStaleWorkflowStats(userId);
console.log(
  `${stats.staleCount} of ${stats.totalActive} workflows are stale (${stats.stalePercentage}%)`
);
console.log(`Average days since active: ${stats.averageDaysSinceActive}`);
```

## API Reference

### `detectAndMarkStaleWorkflows(userId: string)`

Detects and marks stale workflows for a user.

**Parameters:**

- `userId` - User ID to check workflows for

**Returns:** `Promise<StaleDetectionResult>`

```typescript
{
  staleCount: number; // Number of workflows marked as stale
  totalActive: number; // Total number of active workflows checked
  timestamp: string; // ISO timestamp when detection was run
  userId: string; // User ID for which detection was run
}
```

### `detectStaleWorkflows(userId: string)`

Read-only check for stale workflows (doesn't modify data).

**Parameters:**

- `userId` - User ID to check workflows for

**Returns:** `Promise<string[]>` - Array of workflow IDs that are stale

### `getStaleWorkflowStats(userId: string)`

Gets statistics about workflow staleness.

**Parameters:**

- `userId` - User ID to get statistics for

**Returns:** `Promise<StaleWorkflowStats>`

```typescript
{
  totalActive: number; // Total active workflows
  staleCount: number; // Number of stale workflows
  stalePercentage: number; // Percentage of stale workflows
  averageDaysSinceActive: number; // Average days since last activity
}
```

### `batchDetectStaleWorkflows(userIds: string[])`

Batch processes stale workflow detection for multiple users.

**Parameters:**

- `userIds` - Array of user IDs to process

**Returns:** `Promise<StaleDetectionResult[]>` - Array of detection results for each user

### `calculateDaysSinceLastActive(lastActiveAt: string)`

Calculates the number of days since a workflow was last active.

**Parameters:**

- `lastActiveAt` - ISO timestamp of last activity

**Returns:** `number` - Number of days since last active

### `isWorkflowStale(lastActiveAt: string, thresholdDays?: number)`

Checks if a workflow should be marked as stale.

**Parameters:**

- `lastActiveAt` - ISO timestamp of last activity
- `thresholdDays` - Number of days threshold (default: 30)

**Returns:** `boolean` - True if workflow is stale

## Configuration

### Stale Threshold

The default threshold is 30 days. To change it:

```typescript
import { STALE_THRESHOLD_DAYS } from "@/lib/workflow-stale-detection";

// Use custom threshold
const isStale = isWorkflowStale(lastActiveAt, 45); // 45 days instead of 30
```

## Implementation Details

### How It Works

1. **Query Active Workflows**: Fetches all workflows with status `ACTIVE` for the user
2. **Calculate Threshold Date**: Subtracts 30 days from current date
3. **Compare Timestamps**: Checks if `lastActiveAt` is before threshold date
4. **Update Status**: Marks matching workflows as `STALE` in DynamoDB
5. **Return Results**: Returns count of stale workflows and total active

### Database Updates

When a workflow is marked as stale:

- Status changes from `ACTIVE` to `STALE`
- GSI1 keys are updated for efficient querying by status
- `lastActiveAt` timestamp is preserved (not updated)

### Performance Considerations

- **Batch Size**: For large user bases, process in batches to avoid timeouts
- **Caching**: Consider caching detection results for a few hours
- **Async Processing**: Run as background job for better UX
- **Error Handling**: Individual user failures don't stop batch processing

## Error Handling

The utility includes comprehensive error handling:

```typescript
try {
  const result = await detectAndMarkStaleWorkflows(userId);
  // Handle success
} catch (error) {
  // Error is logged automatically
  // Handle gracefully - stale detection is not critical
  console.error("Stale detection failed:", error);
}
```

## Testing

### Manual Testing

1. Create a workflow instance
2. Manually update `lastActiveAt` to 31+ days ago in DynamoDB
3. Run stale detection
4. Verify workflow status changed to `STALE`

### Automated Testing

```typescript
import {
  isWorkflowStale,
  calculateDaysSinceLastActive,
} from "@/lib/workflow-stale-detection";

// Test threshold calculation
const thirtyOneDaysAgo = new Date();
thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
expect(isWorkflowStale(thirtyOneDaysAgo.toISOString())).toBe(true);

// Test days calculation
const days = calculateDaysSinceLastActive(thirtyOneDaysAgo.toISOString());
expect(days).toBe(31);
```

## Best Practices

1. **Run on Dashboard Load**: Automatically detect stale workflows when users visit dashboard
2. **Scheduled Jobs**: Run nightly batch job for all users to keep data fresh
3. **Silent Failures**: Don't block user experience if detection fails
4. **Logging**: Log detection results for monitoring and debugging
5. **User Notifications**: Consider notifying users about stale workflows
6. **Archive Option**: Provide easy way for users to archive stale workflows

## Integration Example

Complete example from `dashboard-workflow-section.tsx`:

```typescript
import { useEffect } from "react";
import { detectStaleWorkflows } from "@/app/workflow-actions";

export function DashboardWorkflowSection({ userId, initialInstances }) {
  // Detect stale workflows on mount
  useEffect(() => {
    const checkStaleWorkflows = async () => {
      try {
        const result = await detectStaleWorkflows();

        if (result.message === "success" && result.data) {
          const { staleCount } = result.data;

          if (staleCount > 0) {
            console.log(`Marked ${staleCount} workflows as stale`);
            // Optionally refresh instances or show notification
          }
        }
      } catch (error) {
        console.error("Failed to detect stale workflows:", error);
      }
    };

    checkStaleWorkflows();
  }, []);

  // ... rest of component
}
```

## Future Enhancements

- **Configurable Threshold**: Allow users to set their own stale threshold
- **Email Notifications**: Notify users about stale workflows
- **Auto-Archive**: Automatically archive workflows stale for 60+ days
- **Analytics**: Track stale workflow patterns and completion rates
- **Bulk Actions**: Allow users to archive/restart multiple stale workflows at once
