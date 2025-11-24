# Fallback Mechanisms Usage Examples

This document provides comprehensive examples of using the fallback mechanisms for handling service failures gracefully.

## Overview

The fallback mechanisms provide three main strategies:

1. **Cached AI Responses** - Use previously successful AI responses when the AI service fails
2. **Skip Failed Integrations** - Continue operation by skipping non-critical integrations
3. **Queue for Later** - Queue failed operations for background processing

## Example 1: AI Service with Cache Fallback

```typescript
import {
  executeWithFallback,
  aiResponseCache,
} from "@/lib/fallback-mechanisms";
import { getBedrockClient } from "@/aws/bedrock/client";

async function generateBlogPost(prompt: string, userId: string) {
  return executeWithFallback(
    async () => {
      const client = getBedrockClient();
      const result = await client.invoke(prompt, outputSchema);
      return result;
    },
    {
      operationName: "generate_blog_post",
      userId,
      cacheKey: {
        prompt,
        modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
      },
      defaultValue: {
        title: "Blog Post",
        content:
          "Content generation temporarily unavailable. Please try again.",
      },
    }
  );
}
```

## Example 2: Integration Service with Skip Fallback

```typescript
import {
  executeWithFallback,
  integrationFailureManager,
} from "@/lib/fallback-mechanisms";

async function syncToSocialMedia(contentId: string, userId: string) {
  // Check if we should skip this service based on recent failures
  if (integrationFailureManager.shouldSkipService("facebook", 3)) {
    return {
      success: true,
      message:
        "Facebook integration temporarily disabled due to repeated failures",
      skipped: true,
    };
  }

  return executeWithFallback(
    async () => {
      // Attempt to post to Facebook
      const result = await postToFacebook(contentId);
      return result;
    },
    {
      operationName: "facebook_sync",
      userId,
      allowSkip: true, // Allow skipping on failure
    }
  );
}
```

## Example 3: Background Job Queue

```typescript
import {
  executeWithFallback,
  backgroundJobQueue,
} from "@/lib/fallback-mechanisms";

async function processAnalytics(contentId: string, userId: string) {
  return executeWithFallback(
    async () => {
      // Attempt to process analytics immediately
      const result = await syncAnalyticsData(contentId);
      return result;
    },
    {
      operationName: "process_analytics",
      userId,
      queueOnFailure: {
        type: "analytics",
        payload: { contentId },
        priority: "low", // Analytics can be processed later
      },
    }
  );
}

// Process queued jobs
async function processQueuedJobs() {
  const job = backgroundJobQueue.dequeue();

  if (!job) {
    return; // No jobs to process
  }

  try {
    // Process the job based on type
    switch (job.type) {
      case "analytics":
        await syncAnalyticsData(job.payload.contentId);
        break;
      case "ai":
        await processAIJob(job.payload);
        break;
      case "integration":
        await processIntegrationJob(job.payload);
        break;
    }

    backgroundJobQueue.complete(job.id);
  } catch (error) {
    backgroundJobQueue.fail(job.id, error.message);
  }
}
```

## Example 4: Comprehensive Fallback Strategy

```typescript
import {
  executeWithFallback,
  aiResponseCache,
  backgroundJobQueue,
  integrationFailureManager,
} from "@/lib/fallback-mechanisms";

async function generateAndPublishContent(
  prompt: string,
  userId: string,
  publishChannels: string[]
) {
  // Step 1: Generate content with cache fallback
  const contentResult = await executeWithFallback(
    async () => {
      const client = getBedrockClient();
      return await client.invoke(prompt, outputSchema);
    },
    {
      operationName: "generate_content",
      userId,
      cacheKey: { prompt, modelId: "claude-3-5-sonnet" },
    }
  );

  if (!contentResult.success) {
    return {
      success: false,
      error: "Failed to generate content",
    };
  }

  // Step 2: Publish to channels with skip fallback
  const publishResults = await Promise.all(
    publishChannels.map((channel) =>
      executeWithFallback(
        async () => {
          return await publishToChannel(channel, contentResult.data);
        },
        {
          operationName: `publish_${channel}`,
          userId,
          allowSkip: true, // Skip failed channels
          queueOnFailure: {
            type: "integration",
            payload: { channel, content: contentResult.data },
            priority: "medium",
          },
        }
      )
    )
  );

  return {
    success: true,
    content: contentResult.data,
    published: publishResults.filter((r) => r.success).length,
    queued: publishResults.filter((r) => r.metadata?.fallbackType === "queue")
      .length,
    skipped: publishResults.filter((r) => r.metadata?.fallbackType === "skip")
      .length,
  };
}
```

## Example 5: Manual Cache Management

```typescript
import { aiResponseCache } from "@/lib/fallback-mechanisms";

// Manually cache a response
aiResponseCache.set(
  "Generate a blog post about real estate",
  { title: "Real Estate Guide", content: "..." },
  "claude-3-5-sonnet",
  7 * 24 * 60 * 60 * 1000 // 7 days TTL
);

// Retrieve cached response
const cached = aiResponseCache.get(
  "Generate a blog post about real estate",
  "claude-3-5-sonnet"
);

if (cached) {
  console.log("Using cached response from", cached.timestamp);
}

// Get cache statistics
const stats = aiResponseCache.getStats();
console.log(`Cache has ${stats.size} entries`);

// Clear specific cache
aiResponseCache.delete(
  "Generate a blog post about real estate",
  "claude-3-5-sonnet"
);

// Clear all cache
aiResponseCache.clear();
```

## Example 6: Queue Management

```typescript
import { backgroundJobQueue } from "@/lib/fallback-mechanisms";

// Get queue statistics
const stats = backgroundJobQueue.getStats();
console.log(`Queue: ${stats.pending} pending, ${stats.failed} failed`);

// Get all pending jobs
const pendingJobs = backgroundJobQueue.getByStatus("pending");

// Get jobs for specific user
const userJobs = backgroundJobQueue.getByUser("user123");

// Clear completed jobs
backgroundJobQueue.clearCompleted();
```

## Example 7: Integration Failure Tracking

```typescript
import { integrationFailureManager } from "@/lib/fallback-mechanisms";

// Check if service should be skipped
if (integrationFailureManager.shouldSkipService("instagram", 3)) {
  console.log("Instagram has failed 3+ times in last 5 minutes, skipping");
}

// Get failure statistics
const stats = integrationFailureManager.getStats();
Object.entries(stats).forEach(([service, data]) => {
  console.log(
    `${service}: ${data.count} failures, last at ${data.lastFailure}`
  );
});

// Clear failures for a service (after fixing the issue)
integrationFailureManager.clearFailures("instagram");
```

## Example 8: User-Friendly Error Messages

```typescript
import { getUserFriendlyMessage } from "@/lib/fallback-mechanisms";

try {
  await someOperation();
} catch (error) {
  const message = getUserFriendlyMessage(error, "cache");
  // "We encountered an issue, but don't worry! We're showing you a previous result while we work on this."

  showToast(message);
}
```

## Best Practices

1. **Always cache successful AI responses** - They're expensive and can be reused
2. **Use appropriate priorities** - Critical operations should be 'high', analytics can be 'low'
3. **Set reasonable TTLs** - AI responses can be cached for days, but user data should be shorter
4. **Monitor queue size** - Process queued jobs regularly to prevent buildup
5. **Clear old failures** - Reset failure tracking after fixing issues
6. **Provide user feedback** - Always show users what's happening with fallbacks

## Integration with Error Handling Framework

The fallback mechanisms work seamlessly with the error handling framework:

```typescript
import { executeService } from "@/lib/error-handling-framework";
import { executeWithFallback } from "@/lib/fallback-mechanisms";

// Combine both for comprehensive error handling
async function robustOperation(userId: string) {
  return executeService(
    async () => {
      return executeWithFallback(
        async () => {
          // Your operation here
          return await someRiskyOperation();
        },
        {
          operationName: "risky_operation",
          userId,
          cacheKey: { prompt: "key", modelId: "model" },
          queueOnFailure: {
            type: "ai",
            payload: {},
            priority: "medium",
          },
        }
      );
    },
    {
      operation: "robust_operation",
      userId,
      timestamp: new Date(),
    },
    {
      maxRetries: 3,
    }
  );
}
```
