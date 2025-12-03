# Load Balancer Integration Example

## Complete Integration with Adaptive Router

This example demonstrates how the Load Balancer integrates with the Adaptive Router for complete intelligent task routing.

## Full Integration Example

```typescript
import { getAdaptiveRouter } from "./adaptive-router";
import { getLoadBalancer } from "./load-balancer";
import type { AgentStrand } from "../agent-core";
import type { WorkerTask } from "../worker-protocol";
import type { RoutingContext } from "./types";

/**
 * Complete routing system with load balancing
 */
export async function integratedRoutingExample() {
  // 1. Configure Adaptive Router with load balancing enabled
  const router = getAdaptiveRouter({
    enableLoadBalancing: true,
    confidenceThresholds: {
      autoExecute: 0.7,
      humanReview: 0.5,
      retry: 0.3,
      abort: 0.1,
    },
  });

  // 2. Configure Load Balancer with adaptive strategy
  const loadBalancer = getLoadBalancer({
    strategy: "adaptive",
    enableMonitoring: true,
    enableHealthChecks: true,
    overloadThreshold: 0.8,
  });

  // 3. Create available strands
  const strands: AgentStrand[] = [
    createStrand("strand-1", "content-generator", 0.4, 2000),
    createStrand("strand-2", "content-generator", 0.7, 3000),
    createStrand("strand-3", "content-generator", 0.5, 2500),
  ];

  // 4. Initialize load metrics for all strands
  strands.forEach((strand) => {
    loadBalancer.updateLoadMetrics(strand.id, {
      strandId: strand.id,
      currentLoad: strand.metrics.currentLoad,
      avgResponseTime: strand.metrics.avgExecutionTime,
      successRate: strand.metrics.successRate,
      queueDepth: Math.floor(strand.metrics.currentLoad * 20),
      lastUpdated: new Date().toISOString(),
    });
  });

  // 5. Create a task
  const task: WorkerTask = {
    id: "task-integrated-1",
    type: "content-generator",
    description: "Generate blog post about market trends",
    input: {
      topic: "Real Estate Market Trends 2025",
      length: "long",
      tone: "professional",
    },
    dependencies: [],
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  // 6. Create routing context
  const context: RoutingContext = {
    userId: "user-123",
    priority: "normal",
    humanReviewAvailable: true,
    confidenceThreshold: 0.7,
  };

  // 7. Route task using Adaptive Router
  console.log("=== Routing Task ===\n");
  const decision = await router.routeTask(task, strands, context);

  console.log("Routing Decision:");
  console.log(`  Selected: ${decision.selectedStrand.id}`);
  console.log(`  Confidence: ${decision.confidence.toFixed(2)}`);
  console.log(`  Action: ${decision.action}`);
  console.log(`  Rationale: ${decision.rationale}`);
  console.log(`  Estimated Cost: $${decision.estimatedCost.toFixed(4)}`);
  console.log(`  Estimated Time: ${decision.estimatedTime}ms`);

  // 8. Execute task (simulated)
  console.log("\n=== Executing Task ===\n");
  const startTime = Date.now();

  // Simulate task execution
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const executionTime = Date.now() - startTime;
  const success = Math.random() > 0.1; // 90% success rate

  console.log(`Execution completed in ${executionTime}ms`);
  console.log(`Success: ${success}`);

  // 9. Update load metrics after execution
  const currentMetrics = loadBalancer.getLoadMetrics(
    decision.selectedStrand.id
  );
  if (currentMetrics) {
    // Update with new execution data
    loadBalancer.updateLoadMetrics(decision.selectedStrand.id, {
      ...currentMetrics,
      currentLoad: Math.min(1.0, currentMetrics.currentLoad + 0.1),
      avgResponseTime: (currentMetrics.avgResponseTime + executionTime) / 2,
      successRate: success
        ? Math.min(1.0, currentMetrics.successRate + 0.01)
        : Math.max(0.0, currentMetrics.successRate - 0.05),
      queueDepth: Math.max(0, currentMetrics.queueDepth - 1),
      lastUpdated: new Date().toISOString(),
    });
  }

  // 10. Update routing decision outcome
  await router.updateDecisionOutcome(task.id, {
    success,
    executionTime,
    actualCost: decision.estimatedCost * (0.9 + Math.random() * 0.2),
    confidence: decision.confidence,
  });

  // 11. Check load distribution
  console.log("\n=== Load Distribution ===\n");
  const distribution = loadBalancer.getLoadDistribution();
  console.log(`Balance Score: ${distribution.balanceScore.toFixed(2)}`);
  console.log(`Average Load: ${(distribution.avgLoad * 100).toFixed(0)}%`);
  console.log(`Overloaded Strands: ${distribution.overloadedStrands.length}`);

  // 12. Check health status
  console.log("\n=== Health Status ===\n");
  for (const strand of strands) {
    const health = loadBalancer.getHealthStatus(strand.id);
    if (health) {
      console.log(
        `${strand.id}: ${health.status} (score: ${health.healthScore.toFixed(
          2
        )})`
      );
      if (health.issues.length > 0) {
        console.log(`  Issues: ${health.issues.join(", ")}`);
      }
    }
  }

  // 13. Get routing analytics
  console.log("\n=== Routing Analytics ===\n");
  const analytics = await router.getAnalytics(
    new Date(Date.now() - 3600000).toISOString(),
    new Date().toISOString()
  );
  console.log(`Total Decisions: ${analytics.totalDecisions}`);
  console.log(`Average Confidence: ${analytics.avgConfidence.toFixed(2)}`);
  console.log(
    `Human Review Rate: ${(analytics.humanReviewRate * 100).toFixed(1)}%`
  );
  console.log(`Fallback Rate: ${(analytics.fallbackRate * 100).toFixed(1)}%`);
}

/**
 * High-load scenario with automatic load balancing
 */
export async function highLoadScenario() {
  console.log("\n=== High Load Scenario ===\n");

  const router = getAdaptiveRouter({ enableLoadBalancing: true });
  const loadBalancer = getLoadBalancer({
    strategy: "adaptive",
    overloadThreshold: 0.75,
  });

  // Create strands with varying loads
  const strands: AgentStrand[] = [
    createStrand("high-load", "content-generator", 0.9, 5000),
    createStrand("medium-load", "content-generator", 0.6, 3000),
    createStrand("low-load", "content-generator", 0.3, 2000),
  ];

  // Initialize metrics
  strands.forEach((strand) => {
    loadBalancer.updateLoadMetrics(strand.id, {
      strandId: strand.id,
      currentLoad: strand.metrics.currentLoad,
      avgResponseTime: strand.metrics.avgExecutionTime,
      successRate: 0.95,
      queueDepth: Math.floor(strand.metrics.currentLoad * 50),
      lastUpdated: new Date().toISOString(),
    });
  });

  // Route multiple tasks
  const tasks = Array.from({ length: 5 }, (_, i) => ({
    id: `task-${i}`,
    type: "content-generator",
    description: `Task ${i}`,
    input: {},
    dependencies: [],
    createdAt: new Date().toISOString(),
    status: "pending" as const,
  }));

  console.log("Routing 5 tasks...\n");

  for (const task of tasks) {
    const context: RoutingContext = {
      userId: "user-456",
      priority: "normal",
      humanReviewAvailable: false,
    };

    const decision = await router.routeTask(task, strands, context);
    console.log(
      `${task.id} → ${decision.selectedStrand.id} (load: ${(
        decision.selectedStrand.metrics.currentLoad * 100
      ).toFixed(0)}%)`
    );

    // Update load after routing
    const metrics = loadBalancer.getLoadMetrics(decision.selectedStrand.id);
    if (metrics) {
      loadBalancer.updateLoadMetrics(decision.selectedStrand.id, {
        ...metrics,
        currentLoad: Math.min(1.0, metrics.currentLoad + 0.05),
      });
    }
  }

  // Check final distribution
  console.log("\n=== Final Load Distribution ===\n");
  const distribution = loadBalancer.getLoadDistribution();
  console.log(`Balance Score: ${distribution.balanceScore.toFixed(2)}`);
  console.log(
    `Overloaded: ${distribution.overloadedStrands.join(", ") || "none"}`
  );

  strands.forEach((strand) => {
    const metrics = loadBalancer.getLoadMetrics(strand.id);
    if (metrics) {
      console.log(`${strand.id}: ${(metrics.currentLoad * 100).toFixed(0)}%`);
    }
  });
}

/**
 * Priority-based routing with load balancing
 */
export async function priorityRoutingScenario() {
  console.log("\n=== Priority Routing Scenario ===\n");

  const router = getAdaptiveRouter({ enableLoadBalancing: true });
  const loadBalancer = getLoadBalancer({ strategy: "adaptive" });

  const strands: AgentStrand[] = [
    createStrand("fast-strand", "content-generator", 0.7, 1500),
    createStrand("quality-strand", "content-generator", 0.4, 4000),
  ];

  strands.forEach((strand) => {
    loadBalancer.updateLoadMetrics(strand.id, {
      strandId: strand.id,
      currentLoad: strand.metrics.currentLoad,
      avgResponseTime: strand.metrics.avgExecutionTime,
      successRate: strand.id === "quality-strand" ? 0.98 : 0.92,
      queueDepth: 5,
      lastUpdated: new Date().toISOString(),
    });
  });

  // Normal priority task
  const normalTask: WorkerTask = {
    id: "normal-task",
    type: "content-generator",
    description: "Normal priority content",
    input: {},
    dependencies: [],
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  const normalContext: RoutingContext = {
    userId: "user-789",
    priority: "normal",
    humanReviewAvailable: true,
  };

  const normalDecision = await router.routeTask(
    normalTask,
    strands,
    normalContext
  );
  console.log(`Normal task → ${normalDecision.selectedStrand.id}`);
  console.log(`  Rationale: ${normalDecision.rationale}`);

  // Urgent priority task
  const urgentTask: WorkerTask = {
    id: "urgent-task",
    type: "content-generator",
    description: "Urgent priority content",
    input: {},
    dependencies: [],
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  const urgentContext: RoutingContext = {
    userId: "user-789",
    priority: "urgent",
    humanReviewAvailable: true,
  };

  const urgentDecision = await router.routeTask(
    urgentTask,
    strands,
    urgentContext
  );
  console.log(`\nUrgent task → ${urgentDecision.selectedStrand.id}`);
  console.log(`  Rationale: ${urgentDecision.rationale}`);
  console.log(
    "\nNote: Urgent tasks prioritize speed even if strand is more loaded"
  );
}

/**
 * Helper function to create mock strand
 */
function createStrand(
  id: string,
  type: string,
  load: number,
  avgTime: number
): AgentStrand {
  return {
    id,
    type,
    state: "active",
    capabilities: {
      qualityScore: 0.85,
      speedScore: avgTime < 3000 ? 0.9 : 0.7,
      reliabilityScore: 0.9,
      supportedFormats: ["text", "json"],
      maxConcurrentTasks: 10,
    },
    memory: {
      workingMemory: {},
      shortTermMemory: [],
      longTermMemoryId: undefined,
    },
    metrics: {
      totalTasks: 100,
      successfulTasks: 95,
      failedTasks: 5,
      avgExecutionTime: avgTime,
      totalCost: 10.5,
      currentLoad: load,
      successRate: 0.95,
      lastTaskAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };
}

/**
 * Run all integration examples
 */
export async function runIntegrationExamples() {
  await integratedRoutingExample();
  await highLoadScenario();
  await priorityRoutingScenario();

  console.log("\n=== Integration Examples Completed ===");
}

// Run if executed directly
if (require.main === module) {
  runIntegrationExamples().catch(console.error);
}
```

## Key Integration Points

### 1. Router Configuration

```typescript
const router = getAdaptiveRouter({
  enableLoadBalancing: true, // Enable load balancing
  confidenceThresholds: {
    autoExecute: 0.7,
    humanReview: 0.5,
    retry: 0.3,
    abort: 0.1,
  },
});
```

### 2. Load Balancer Configuration

```typescript
const loadBalancer = getLoadBalancer({
  strategy: "adaptive",
  enableMonitoring: true,
  enableHealthChecks: true,
  overloadThreshold: 0.8,
});
```

### 3. Metrics Update Flow

```typescript
// Before routing
loadBalancer.updateLoadMetrics(strand.id, initialMetrics);

// Route task
const decision = await router.routeTask(task, strands, context);

// Execute task
const result = await executeTask(decision.selectedStrand, task);

// Update metrics after execution
loadBalancer.updateLoadMetrics(strand.id, updatedMetrics);

// Update routing outcome
await router.updateDecisionOutcome(task.id, outcome);
```

### 4. Monitoring and Analytics

```typescript
// Check load distribution
const distribution = loadBalancer.getLoadDistribution();

// Check health status
const health = loadBalancer.getHealthStatus(strandId);

// Get routing analytics
const analytics = await router.getAnalytics(startDate, endDate);
```

## Benefits of Integration

1. **Intelligent Routing**: Combines confidence-based routing with load balancing
2. **Real-Time Adaptation**: Continuously adjusts based on current conditions
3. **Health Awareness**: Automatically filters unhealthy strands
4. **Priority Handling**: Respects task priorities while balancing load
5. **Comprehensive Monitoring**: Tracks both routing decisions and load distribution

## Running the Examples

```bash
# Run integration examples
npx tsx src/aws/bedrock/routing/LOAD_BALANCER_INTEGRATION_EXAMPLE.md
```

Note: This is a markdown file with code examples. Extract the TypeScript code to run it.
