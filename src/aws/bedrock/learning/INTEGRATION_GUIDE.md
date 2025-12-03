# Preference Engine Integration Guide

This guide shows how to integrate the Preference Learning Engine with existing AgentStrands components.

## Quick Start

```typescript
import { getPreferenceEngine } from "@/aws/bedrock/learning";

const engine = getPreferenceEngine();
```

## Integration Patterns

### 1. Content Generation Integration

Apply preferences before generating content:

```typescript
// In content-generator-worker.ts or similar
import { getPreferenceEngine } from "@/aws/bedrock/learning";

async function generateContent(userId: string, task: ContentTask) {
  // Get user preferences
  const engine = getPreferenceEngine();
  const preferences = await engine.getPreferences(userId);

  // Apply preferences to task
  const enhancedTask = await engine.applyPreferences(task, preferences);

  // Generate content with preferences
  const result = await bedrockClient.invoke({
    prompt: buildPrompt(enhancedTask),
    // Use preference-based parameters
    temperature: enhancedTask.formality ? 0.3 : 0.7,
    // ... other parameters
  });

  return result;
}
```

### 2. Feedback Collection Integration

Update preferences when feedback is received:

```typescript
// In feedback collection system (Task 4)
import { getPreferenceEngine } from "@/aws/bedrock/learning";

async function handleFeedback(feedback: FeedbackRecord) {
  // Store feedback
  await feedbackCollector.recordFeedback(feedback);

  // Update preferences
  const engine = getPreferenceEngine();
  await engine.updatePreferences(feedback.userId, feedback);
}
```

### 3. AgentStrand Integration

Strands can access preferences during initialization:

```typescript
// In agent-strands.ts
import { getPreferenceEngine } from "@/aws/bedrock/learning";

class ContentGeneratorStrand implements AgentStrand {
  private preferences?: UserPreferences;

  async initialize(userId: string) {
    const engine = getPreferenceEngine();
    this.preferences = await engine.getPreferences(userId);
  }

  async execute(task: WorkerTask): Promise<WorkerResult> {
    // Use preferences in execution
    if (this.preferences) {
      const enhancedTask = await getPreferenceEngine().applyPreferences(
        task,
        this.preferences
      );
      // ... execute with enhanced task
    }
  }
}
```

### 4. Enhanced Orchestrator Integration

Apply preferences at the orchestration level:

```typescript
// In enhanced-orchestrator.ts
import { getPreferenceEngine } from "@/aws/bedrock/learning";

async function orchestrateWorkflow(userId: string, workflow: Workflow) {
  const engine = getPreferenceEngine();
  const preferences = await engine.getPreferences(userId);

  // Apply preferences to all tasks in workflow
  const enhancedTasks = await Promise.all(
    workflow.tasks.map((task) => engine.applyPreferences(task, preferences))
  );

  // Execute workflow with enhanced tasks
  return executeWorkflow(enhancedTasks);
}
```

### 5. Server Actions Integration

Apply preferences in server actions:

```typescript
// In app/actions.ts
import { getPreferenceEngine } from "@/aws/bedrock/learning";

export async function generateBlogPost(userId: string, input: BlogPostInput) {
  // Get preferences
  const engine = getPreferenceEngine();
  const preferences = await engine.getPreferences(userId);

  // Apply to input
  const enhancedInput = await engine.applyPreferences(input, preferences);

  // Generate with preferences
  const result = await generateBlogPostFlow(enhancedInput);

  return result;
}
```

## Configuration Examples

### Default Configuration

```typescript
import { getPreferenceEngine } from "@/aws/bedrock/learning";

// Uses default configuration
const engine = getPreferenceEngine();
```

### Custom Configuration

```typescript
import { PreferenceEngine } from "@/aws/bedrock/learning";

const engine = new PreferenceEngine({
  minSamplesForLearning: 10, // Require more samples
  recencyWeight: 0.9, // Heavily weight recent feedback
  confidenceThreshold: 0.8, // Higher confidence required
  autoUpdate: true, // Enable auto-updates
});
```

### Environment-Based Configuration

```typescript
import { PreferenceEngine } from "@/aws/bedrock/learning";

const engine = new PreferenceEngine({
  minSamplesForLearning: process.env.NODE_ENV === "production" ? 10 : 3,
  recencyWeight: 0.7,
  confidenceThreshold: 0.6,
  autoUpdate: process.env.AUTO_UPDATE_PREFERENCES === "true",
});
```

## Common Patterns

### Pattern 1: Preference-Aware Content Generation

```typescript
async function generateWithPreferences(
  userId: string,
  contentType: string,
  input: any
) {
  const engine = getPreferenceEngine();
  const preferences = await engine.getPreferences(userId);

  // Apply preferences
  const enhanced = await engine.applyPreferences(input, preferences);

  // Generate
  const content = await generateContent(enhanced);

  // Return with metadata
  return {
    content,
    appliedPreferences: {
      tone: enhanced.tone,
      formality: enhanced.formality,
      length: enhanced.targetLength,
    },
  };
}
```

### Pattern 2: Feedback Loop

```typescript
async function contentGenerationWithFeedback(userId: string, input: any) {
  // Generate with preferences
  const result = await generateWithPreferences(userId, "blog-post", input);

  // Collect feedback
  const feedback = await collectUserFeedback(result);

  // Update preferences
  const engine = getPreferenceEngine();
  await engine.updatePreferences(userId, feedback);

  return result;
}
```

### Pattern 3: Batch Learning

```typescript
async function batchLearnPreferences(userId: string) {
  const engine = getPreferenceEngine();

  // Get all feedback for user
  const feedbackRecords = await getFeedbackForUser(userId);

  // Learn preferences
  const preferences = await engine.learnPreferences(userId, feedbackRecords);

  console.log("Learned preferences:", preferences);

  return preferences;
}
```

### Pattern 4: Preference-Based Routing

```typescript
async function routeTaskWithPreferences(userId: string, task: WorkerTask) {
  const engine = getPreferenceEngine();
  const preferences = await engine.getPreferences(userId);

  // Route based on preferences
  if (preferences.formatPreferences["detailed-report"] > 0.8) {
    return routeToDetailedReportStrand(task);
  } else if (preferences.contentStyle.length === "concise") {
    return routeToConciseContentStrand(task);
  }

  return routeToDefaultStrand(task);
}
```

## Testing Integration

### Unit Test Example

```typescript
import { PreferenceEngine } from "@/aws/bedrock/learning";
import type { FeedbackRecord } from "@/aws/bedrock/learning";

describe("PreferenceEngine Integration", () => {
  it("should apply preferences to content generation task", async () => {
    const engine = new PreferenceEngine();
    const userId = "test-user";

    // Create feedback
    const feedback: FeedbackRecord[] = [
      {
        id: "fb-1",
        userId,
        taskId: "task-1",
        strandId: "content-generator",
        feedbackType: "rating",
        rating: 5,
        timestamp: new Date().toISOString(),
        metadata: {
          tone: "professional",
          formality: 0.8,
        },
      },
    ];

    // Learn preferences
    const preferences = await engine.learnPreferences(userId, feedback);

    // Apply to task
    const task = { type: "blog-post", topic: "market-analysis" };
    const enhanced = await engine.applyPreferences(task, preferences);

    // Verify
    expect((enhanced as any).tone).toBe("professional");
    expect((enhanced as any).formality).toBeCloseTo(0.8);
  });
});
```

## Migration Guide

### Existing Code Without Preferences

```typescript
// Before
async function generateContent(input: ContentInput) {
  return await bedrockClient.invoke({
    prompt: buildPrompt(input),
  });
}
```

### Updated Code With Preferences

```typescript
// After
import { getPreferenceEngine } from "@/aws/bedrock/learning";

async function generateContent(userId: string, input: ContentInput) {
  const engine = getPreferenceEngine();
  const preferences = await engine.getPreferences(userId);
  const enhanced = await engine.applyPreferences(input, preferences);

  return await bedrockClient.invoke({
    prompt: buildPrompt(enhanced),
  });
}
```

## Best Practices

1. **Cache Preferences**: Cache preferences for the duration of a request
2. **Graceful Degradation**: Handle missing preferences gracefully
3. **Async Updates**: Update preferences asynchronously to avoid blocking
4. **Confidence Thresholds**: Respect confidence thresholds for updates
5. **User Control**: Allow users to view and override learned preferences

## Troubleshooting

### Issue: Preferences Not Applying

```typescript
// Check if preferences exist
const preferences = await engine.getPreferences(userId);
console.log("Preferences:", preferences);

// Check if task is being enhanced
const enhanced = await engine.applyPreferences(task, preferences);
console.log("Enhanced task:", enhanced);
```

### Issue: Insufficient Feedback

```typescript
// Check minimum samples
const engine = new PreferenceEngine({
  minSamplesForLearning: 3, // Lower threshold for testing
});
```

### Issue: Preferences Not Updating

```typescript
// Check auto-update setting
const engine = new PreferenceEngine({
  autoUpdate: true, // Ensure auto-update is enabled
});

// Manually trigger update
await engine.updatePreferences(userId, feedback);
```

## Next Steps

1. Implement feedback collection system (Task 4)
2. Add property-based tests (Tasks 6.1, 6.2)
3. Integrate with content generation flows
4. Add UI for viewing learned preferences
5. Implement preference export/import
