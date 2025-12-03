# Fallback Manager Integration Example

## Complete Routing with Fallback Flow

This document demonstrates how the FallbackManager integrates with the AdaptiveRouter to provide a complete, resilient routing system.

## Full Integration Example

```typescript
import { getAdaptiveRouter } from "@/aws/bedrock/routing/adaptive-router";
import { getFallbackManager } from "@/aws/bedrock/routing/fallback-manager";
import { getAgentCore } from "@/aws/bedrock/agent-core";
import type { WorkerTask, WorkerResult } from "@/aws/bedrock/worker-protocol";
import type { RoutingContext } from "@/aws/bedrock/routing/types";

/**
 * Complete task execution with routing and fallback
 */
async function executeTaskWithFallback(
  task: WorkerTask,
  context: RoutingContext
): Promise<WorkerResult> {
  const router = getAdaptiveRouter();
  const fallbackManager = getFallbackManager();
  const agentCore = getAgentCore();

  // Step 1: Get available strands
  const strands = agentCore.getStrandsByType(task.type);

  if (strands.length === 0) {
    throw new Error(`No strands available for task type: ${task.type}`);
  }

  // Step 2: Route the task
  console.log(`[Routing] Routing task ${task.id}...`);
  const decision = await router.routeTask(task, strands, context);

  console.log(`[Routing] Decision: ${decision.action}`);
  console.log(`[Routing] Confidence: ${decision.confidence.toFixed(2)}`);
  console.log(`[Routing] Selected strand: ${decision.selectedStrand.id}`);

  // Step 3: Handle routing decision
  switch (decision.action) {
    case "execute":
      // Execute normally
      return await executeWithFallbackProtection(
        decision.selectedStrand,
        task,
        context
      );

    case "human-review":
      // Route to human review
      console.log(`[Routing] Routing to human review (low confidence)`);
      return await routeToHumanReview(task, context);

    case "retry":
      // Retry with different strand
      console.log(`[Routing] Retrying with alternative strand`);
      const retryContext = {
        ...context,
        retryCount: (context.retryCount || 0) + 1,
      };
      return await executeTaskWithFallback(task, retryContext);

    case "fallback":
      // Execute fallback immediately
      console.log(`[Routing] Executing fallback strategy`);
      const fallbackResult = await fallbackManager.executeFallback(
        decision.selectedStrand,
        task,
        context,
        new Error("Low confidence - fallback required")
      );

      if (fallbackResult.success) {
        return fallbackResult.result!;
      } else {
        throw fallbackResult.error;
      }

    case "abort":
      // Abort task
      throw new Error(
        `Task aborted due to very low confidence: ${decision.confidence}`
      );

    default:
      throw new Error(`Unknown routing action: ${decision.action}`);
  }
}

/**
 * Execute task with automatic fallback on failure
 */
async function executeWithFallbackProtection(
  strand: AgentStrand,
  task: WorkerTask,
  context: RoutingContext
): Promise<WorkerResult> {
  const router = getAdaptiveRouter();
  const fallbackManager = getFallbackManager();

  try {
    // Execute the task
    console.log(
      `[Execution] Executing task ${task.id} with strand ${strand.id}`
    );
    const result = await executeStrandTask(strand, task);

    // Check confidence after execution
    const action = await router.handleLowConfidence(task, result, context);

    if (action === "execute") {
      // Confidence is acceptable, return result
      console.log(`[Execution] Task completed successfully`);
      return result;
    } else if (action === "human-review") {
      // Low confidence, route to human
      console.log(
        `[Execution] Low confidence detected, routing to human review`
      );
      return await routeToHumanReview(task, context, result);
    } else {
      // Need fallback
      console.log(`[Execution] Low confidence detected, executing fallback`);
      const fallbackResult = await fallbackManager.executeFallback(
        strand,
        task,
        context,
        new Error("Low confidence result")
      );

      if (fallbackResult.success) {
        return fallbackResult.result!;
      } else {
        // Fallback failed, return original result with warning
        console.warn(`[Execution] Fallback failed, returning original result`);
        return result;
      }
    }
  } catch (error) {
    // Execution failed, try fallback
    console.error(`[Execution] Task execution failed:`, error);

    const fallbackResult = await fallbackManager.executeFallback(
      strand,
      task,
      context,
      error instanceof Error ? error : new Error(String(error))
    );

    if (fallbackResult.success) {
      console.log(
        `[Fallback] Fallback succeeded after ${fallbackResult.attempts} attempts`
      );
      return fallbackResult.result!;
    } else {
      console.error(`[Fallback] All fallback strategies failed`);
      throw fallbackResult.error;
    }
  }
}

/**
 * Simulate strand task execution
 */
async function executeStrandTask(
  strand: AgentStrand,
  task: WorkerTask
): Promise<WorkerResult> {
  // In production, this would execute the actual strand
  // For this example, we'll simulate execution

  // Simulate some processing time
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simulate random success/failure
  const success = Math.random() > 0.2; // 80% success rate

  if (!success) {
    throw new Error("Simulated execution failure");
  }

  return {
    taskId: task.id,
    success: true,
    output: {
      message: "Task completed successfully",
      data: { result: "Generated content" },
    },
    metadata: {
      confidence: 0.75 + Math.random() * 0.2, // 0.75-0.95
      strandId: strand.id,
      executionTime: 1000,
    },
    completedAt: new Date().toISOString(),
  };
}

/**
 * Route task to human review
 */
async function routeToHumanReview(
  task: WorkerTask,
  context: RoutingContext,
  preliminaryResult?: WorkerResult
): Promise<WorkerResult> {
  console.log(`[HumanReview] Creating human review task for ${task.id}`);

  // In production, this would create a review task in a queue
  return {
    taskId: task.id,
    success: true,
    output: {
      message: "Task routed to human review",
      reviewRequired: true,
      preliminaryResult,
    },
    metadata: {
      confidence: 0,
      routedToHuman: true,
      reviewQueueId: `review_${Date.now()}`,
    },
    completedAt: new Date().toISOString(),
  };
}

/**
 * Example: Execute multiple tasks with routing and fallback
 */
async function batchExecutionExample() {
  const tasks: WorkerTask[] = [
    {
      id: "task_1",
      type: "content-generator",
      description: "Generate blog post",
      input: { topic: "Real estate trends" },
      dependencies: [],
      createdAt: new Date().toISOString(),
      status: "pending",
    },
    {
      id: "task_2",
      type: "data-analyst",
      description: "Analyze market data",
      input: { region: "California" },
      dependencies: [],
      createdAt: new Date().toISOString(),
      status: "pending",
    },
    {
      id: "task_3",
      type: "market-forecaster",
      description: "Forecast trends",
      input: { timeframe: "6 months" },
      dependencies: [],
      createdAt: new Date().toISOString(),
      status: "pending",
    },
  ];

  const context: RoutingContext = {
    userId: "user_123",
    priority: "normal",
    confidenceThreshold: 0.7,
    humanReviewAvailable: true,
    maxRetries: 3,
  };

  console.log(
    `\n=== Executing ${tasks.length} tasks with routing and fallback ===\n`
  );

  const results = await Promise.allSettled(
    tasks.map((task) => executeTaskWithFallback(task, context))
  );

  // Analyze results
  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`\n=== Batch Execution Complete ===`);
  console.log(`Successful: ${successful}/${tasks.length}`);
  console.log(`Failed: ${failed}/${tasks.length}`);

  // Get fallback statistics
  const fallbackManager = getFallbackManager();
  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago

  const stats = await fallbackManager.getStatistics(startDate, endDate);

  console.log(`\n=== Fallback Statistics ===`);
  console.log(`Total fallback attempts: ${stats.totalAttempts}`);
  console.log(`Success rate: ${(stats.successRate * 100).toFixed(1)}%`);
  console.log(
    `Avg attempts per fallback: ${stats.avgAttemptsPerFallback.toFixed(1)}`
  );
}

/**
 * Example: Priority-based routing with fallback
 */
async function priorityRoutingExample() {
  const urgentTask: WorkerTask = {
    id: "urgent_task",
    type: "content-generator",
    description: "Generate urgent social media post",
    input: { topic: "Breaking news", urgency: "high" },
    dependencies: [],
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  const urgentContext: RoutingContext = {
    userId: "user_456",
    priority: "urgent",
    confidenceThreshold: 0.6, // Lower threshold for urgent tasks
    humanReviewAvailable: true,
    maxRetries: 5, // More retries for urgent tasks
  };

  console.log(`\n=== Executing Urgent Task ===\n`);

  try {
    const result = await executeTaskWithFallback(urgentTask, urgentContext);
    console.log(`\n✓ Urgent task completed successfully`);
    console.log(`  Confidence: ${result.metadata.confidence}`);
  } catch (error) {
    console.error(`\n✗ Urgent task failed:`, error);
  }
}

/**
 * Example: Custom fallback strategy
 */
async function customStrategyExample() {
  const fallbackManager = getFallbackManager();

  // Register a custom premium fallback strategy
  fallbackManager.registerStrategy({
    id: "premium_urgent_fallback",
    name: "Premium model for urgent tasks",
    alternativeStrand: {
      id: "premium_strand",
      type: "content-generator",
      state: "active",
      capabilities: {
        qualityScore: 0.95,
        speedScore: 0.9,
        reliabilityScore: 0.98,
        supportedFormats: ["text", "markdown", "html"],
      },
      memory: {
        workingMemory: {},
        shortTermMemory: [],
        longTermMemoryId: undefined,
      },
      metrics: {
        totalTasks: 100,
        successfulTasks: 98,
        failedTasks: 2,
        avgExecutionTime: 3000,
        successRate: 0.98,
        currentLoad: 0.2,
      },
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    },
    retryWithBackoff: {
      initialDelayMs: 500,
      maxDelayMs: 3000,
      multiplier: 2,
    },
  });

  console.log(`\n✓ Custom premium fallback strategy registered`);
}

/**
 * Run all integration examples
 */
async function runIntegrationExamples() {
  console.log("=== Fallback Manager Integration Examples ===\n");

  // Example 1: Batch execution
  await batchExecutionExample();

  // Example 2: Priority routing
  await priorityRoutingExample();

  // Example 3: Custom strategy
  await customStrategyExample();

  console.log("\n=== All Integration Examples Complete ===");
}

// Export examples
export {
  executeTaskWithFallback,
  executeWithFallbackProtection,
  batchExecutionExample,
  priorityRoutingExample,
  customStrategyExample,
  runIntegrationExamples,
};

// Run if executed directly
if (require.main === module) {
  runIntegrationExamples().catch(console.error);
}
```

## Key Integration Points

### 1. Routing Decision → Fallback

```typescript
if (decision.action === "fallback") {
  const fallbackResult = await fallbackManager.executeFallback(
    decision.selectedStrand,
    task,
    context,
    error
  );
}
```

### 2. Execution Failure → Fallback

```typescript
try {
  const result = await executeStrandTask(strand, task);
} catch (error) {
  const fallbackResult = await fallbackManager.executeFallback(
    strand,
    task,
    context,
    error
  );
}
```

### 3. Low Confidence → Fallback

```typescript
const action = await router.handleLowConfidence(task, result, context);

if (action === "fallback") {
  const fallbackResult = await fallbackManager.executeFallback(
    strand,
    task,
    context,
    new Error("Low confidence")
  );
}
```

## Benefits of Integration

1. **Resilience**: Automatic recovery from failures
2. **Flexibility**: Multiple fallback strategies
3. **Intelligence**: Learning from outcomes
4. **Visibility**: Comprehensive tracking
5. **Performance**: Optimized retry logic

## Flow Diagram

```
Task Submission
    ↓
Adaptive Router
    ↓
┌─────────────────────┐
│ Routing Decision    │
├─────────────────────┤
│ • execute           │ → Execute Task → Success ✓
│ • human-review      │ → Human Queue
│ • retry             │ → Retry with Different Strand
│ • fallback          │ → Fallback Manager
│ • abort             │ → Abort Task
└─────────────────────┘
                        ↓
                Fallback Manager
                        ↓
        ┌───────────────────────────┐
        │ Strategy Selection        │
        ├───────────────────────────┤
        │ 1. Retry with backoff     │
        │ 2. Alternative strand     │
        │ 3. Task simplification    │
        │ 4. Human review           │
        │ 5. Model fallback         │
        └───────────────────────────┘
                        ↓
                Execute Strategies
                        ↓
        ┌───────────────────────────┐
        │ Success? → Return Result  │
        │ Failure? → Next Strategy  │
        │ Exhausted? → Error        │
        └───────────────────────────┘
```

## Production Considerations

1. **Monitoring**: Track fallback rates and success rates
2. **Alerting**: Alert on high fallback rates or failures
3. **Optimization**: Tune strategy selection based on data
4. **Cost**: Monitor costs of fallback executions
5. **Performance**: Optimize backoff delays for your use case
