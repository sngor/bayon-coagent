# Adaptive Routing Integration Guide

This guide explains how to integrate the adaptive routing system with other AgentStrands enhancement components.

## Integration with AgentCore

The adaptive router works seamlessly with AgentCore for strand management:

```typescript
import { getAgentCore } from "@/aws/bedrock/agent-core";
import { getAdaptiveRouter } from "@/aws/bedrock/routing";
import { createWorkerTask } from "@/aws/bedrock/worker-protocol";

// Initialize systems
const agentCore = getAgentCore();
const router = getAdaptiveRouter();

// Create and route a task
async function executeTaskWithRouting(taskConfig: any, userId: string) {
  // Create task
  const task = createWorkerTask(taskConfig);

  // Define routing context
  const context = {
    userId,
    priority: "normal",
    confidenceThreshold: 0.7,
    humanReviewAvailable: true,
  };

  // Get available strands from AgentCore
  const strands = agentCore.getStrandsByType(task.type);

  // Route the task
  const decision = await router.routeTask(task, strands, context);

  // Handle routing decision
  if (decision.action === "execute") {
    // Allocate to selected strand
    const selectedStrand = decision.selectedStrand;
    await agentCore.allocateTask(task);

    // Execute task...
    const result = await executeTask(task, selectedStrand);

    // Check confidence after execution
    const action = await router.handleLowConfidence(task, result, context);

    if (action === "human-review") {
      // Route to human review
      return { status: "pending-review", result };
    }

    // Update decision log with outcome
    await router.updateDecisionOutcome(task.id, {
      success: result.status === "success",
      executionTime: result.metadata.executionTime,
      actualCost: result.metadata.cost || 0,
      confidence: result.metadata.confidence || 0,
    });

    return { status: "completed", result };
  } else if (decision.action === "human-review") {
    // Route directly to human review
    return { status: "pending-review", decision };
  } else if (decision.action === "retry") {
    // Retry with updated context
    const retryContext = { ...context, retryCount: 1 };
    return executeTaskWithRouting(taskConfig, userId);
  }
}
```

## Integration with Performance Tracker

Update load metrics from performance tracking:

```typescript
import { getPerformanceTracker } from "@/aws/bedrock/analytics";
import { getAdaptiveRouter } from "@/aws/bedrock/routing";

const tracker = getPerformanceTracker();
const router = getAdaptiveRouter();

// After task completion, update both systems
async function updateMetricsAfterTask(
  strandId: string,
  taskId: string,
  metrics: PerformanceMetrics
) {
  // Update performance tracker
  await tracker.trackPerformance(strandId, metrics);

  // Update router load metrics
  router.updateLoadMetrics(strandId, {
    strandId,
    currentLoad: calculateCurrentLoad(strandId),
    avgResponseTime: metrics.executionTime,
    successRate: metrics.successRate,
    queueDepth: getQueueDepth(strandId),
  });
}
```

## Integration with Quality Assurance

Route low-confidence results to QA strand:

```typescript
import { getQualityAssuranceStrand } from "@/aws/bedrock/quality-assurance";
import { getAdaptiveRouter } from "@/aws/bedrock/routing";

async function executeWithQA(task: WorkerTask, context: RoutingContext) {
  const router = getAdaptiveRouter();

  // Route task
  const decision = await router.routeTask(task, strands, context);

  // Execute
  const result = await executeTask(task, decision.selectedStrand);

  // Check confidence
  const action = await router.handleLowConfidence(task, result, context);

  if (action === "human-review" || result.metadata.confidence < 0.6) {
    // Run through QA strand first
    const qaStrand = getQualityAssuranceStrand();
    const qaResult = await qaStrand.validateContent(result.output.content, [
      "factual",
      "compliance",
      "brand",
      "seo",
    ]);

    if (!qaResult.passed) {
      // Route to human review with QA feedback
      return {
        status: "pending-review",
        result,
        qaFeedback: qaResult,
      };
    }
  }

  return { status: "completed", result };
}
```

## Integration with Specialization Manager

Use specialized strands in routing:

```typescript
import { getSpecializationManager } from "@/aws/bedrock/specialization";
import { getAdaptiveRouter } from "@/aws/bedrock/routing";

async function routeWithSpecialization(
  task: WorkerTask,
  context: RoutingContext & { agentProfile: any }
) {
  const specializationManager = getSpecializationManager();
  const router = getAdaptiveRouter();

  // Get specialist strand if available
  const specialistDecision = await specializationManager.getSpecialistStrand(
    task,
    {
      userId: context.userId,
      agentProfile: context.agentProfile,
      contentType: task.input.contentType,
    }
  );

  // Include specialized strands in routing
  const allStrands = [
    specialistDecision.selectedStrand,
    ...specialistDecision.alternatives.map((a) => a.strand),
  ];

  // Route with adaptive router
  const routingDecision = await router.routeTask(task, allStrands, context);

  return routingDecision;
}
```

## Integration with Collaboration System

Route collaborative tasks:

```typescript
import { getHandoffManager } from "@/aws/bedrock/collaboration";
import { getAdaptiveRouter } from "@/aws/bedrock/routing";

async function executeCollaborativeTask(
  task: WorkerTask,
  context: RoutingContext
) {
  const router = getAdaptiveRouter();
  const handoffManager = getHandoffManager();

  // Route initial task
  const decision = await router.routeTask(task, strands, context);

  // Execute
  const result = await executeTask(task, decision.selectedStrand);

  // Check if handoff is needed
  const nextStrand = handoffManager.identifyNextStrand(
    task,
    result,
    availableStrands
  );

  if (nextStrand) {
    // Create follow-up task
    const followUpTask = createFollowUpTask(result);

    // Route follow-up task
    const followUpDecision = await router.routeTask(
      followUpTask,
      [nextStrand],
      context
    );

    // Execute handoff
    await handoffManager.executeHandoff(decision.selectedStrand, nextStrand, {
      taskId: task.id,
      intermediateResults: result.output,
      sharedContext: {},
      learnedPatterns: {},
      metadata: {
        handoffReason: "Task requires follow-up",
        confidence: result.metadata.confidence,
        timestamp: new Date().toISOString(),
      },
    });
  }

  return result;
}
```

## Integration with Learning System

Use learned preferences in routing:

```typescript
import { getPreferenceEngine } from "@/aws/bedrock/learning";
import { getAdaptiveRouter } from "@/aws/bedrock/routing";

async function routeWithPreferences(task: WorkerTask, userId: string) {
  const preferenceEngine = getPreferenceEngine();
  const router = getAdaptiveRouter();

  // Get user preferences
  const preferences = await preferenceEngine.getPreferences(userId);

  // Adjust routing context based on preferences
  const context: RoutingContext = {
    userId,
    priority: "normal",
    confidenceThreshold: preferences.qualityThresholds.minConfidence,
    humanReviewAvailable: true,
    metadata: {
      userPreferences: preferences,
    },
  };

  // Route with preferences
  const decision = await router.routeTask(task, strands, context);

  return decision;
}
```

## Integration with Analytics Dashboard

Display routing analytics:

```typescript
import { getAdaptiveRouter } from "@/aws/bedrock/routing";

async function getRoutingDashboardData(userId: string) {
  const router = getAdaptiveRouter();

  // Get analytics for last 30 days
  const endDate = new Date().toISOString();
  const startDate = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const analytics = await router.getAnalytics(startDate, endDate);

  return {
    overview: {
      totalDecisions: analytics.totalDecisions,
      avgConfidence: analytics.avgConfidence,
      humanReviewRate: analytics.humanReviewRate,
    },
    actionDistribution: analytics.byAction,
    accuracy: analytics.routingAccuracy,
    trends: {
      // Calculate trends over time
      confidenceTrend: calculateTrend(analytics),
      accuracyTrend: calculateAccuracyTrend(analytics),
    },
  };
}
```

## Complete Workflow Example

Here's a complete example integrating multiple systems:

```typescript
import { getAgentCore } from "@/aws/bedrock/agent-core";
import { getAdaptiveRouter } from "@/aws/bedrock/routing";
import { getSpecializationManager } from "@/aws/bedrock/specialization";
import { getPreferenceEngine } from "@/aws/bedrock/learning";
import { getQualityAssuranceStrand } from "@/aws/bedrock/quality-assurance";
import { getPerformanceTracker } from "@/aws/bedrock/analytics";

async function executeEnhancedTask(
  taskConfig: any,
  userId: string,
  agentProfile: any
) {
  // Initialize all systems
  const agentCore = getAgentCore();
  const router = getAdaptiveRouter();
  const specializationManager = getSpecializationManager();
  const preferenceEngine = getPreferenceEngine();
  const qaStrand = getQualityAssuranceStrand();
  const tracker = getPerformanceTracker();

  // 1. Get user preferences
  const preferences = await preferenceEngine.getPreferences(userId);

  // 2. Create task
  const task = createWorkerTask(taskConfig);

  // 3. Get specialized strands
  const specialistDecision = await specializationManager.getSpecialistStrand(
    task,
    { userId, agentProfile, contentType: task.input.contentType }
  );

  // 4. Define routing context
  const context: RoutingContext = {
    userId,
    priority: task.input.urgent ? "urgent" : "normal",
    confidenceThreshold: preferences.qualityThresholds.minConfidence,
    humanReviewAvailable: true,
  };

  // 5. Route task
  const routingDecision = await router.routeTask(
    task,
    [specialistDecision.selectedStrand],
    context
  );

  // 6. Execute based on routing decision
  if (routingDecision.action === "execute") {
    const startTime = Date.now();

    // Execute task
    const result = await executeTask(task, routingDecision.selectedStrand);

    const executionTime = Date.now() - startTime;

    // 7. Check confidence
    const action = await router.handleLowConfidence(task, result, context);

    if (action === "human-review") {
      // 8. Run through QA
      const qaResult = await qaStrand.validateContent(result.output.content, [
        "factual",
        "compliance",
        "brand",
        "seo",
      ]);

      if (!qaResult.passed) {
        return {
          status: "pending-review",
          result,
          qaFeedback: qaResult,
        };
      }
    }

    // 9. Update metrics
    await tracker.trackPerformance(routingDecision.selectedStrand.id, {
      executionTime,
      tokenUsage: result.metadata.tokenUsage || 0,
      cost: result.metadata.cost || 0,
      successRate: result.status === "success" ? 1 : 0,
      userSatisfaction: 0, // Will be updated with feedback
      qualityScore: result.metadata.confidence * 100,
      timestamp: new Date().toISOString(),
    });

    // 10. Update routing decision outcome
    await router.updateDecisionOutcome(task.id, {
      success: result.status === "success",
      executionTime,
      actualCost: result.metadata.cost || 0,
      confidence: result.metadata.confidence || 0,
    });

    // 11. Update load metrics
    router.updateLoadMetrics(routingDecision.selectedStrand.id, {
      strandId: routingDecision.selectedStrand.id,
      currentLoad: calculateCurrentLoad(routingDecision.selectedStrand.id),
      avgResponseTime: executionTime,
      successRate: result.status === "success" ? 1 : 0,
      queueDepth: 0,
    });

    return { status: "completed", result };
  } else {
    // Handle other routing actions
    return { status: "pending", action: routingDecision.action };
  }
}
```

## Best Practices

1. **Always Update Metrics**: Keep load metrics and performance data current
2. **Handle All Actions**: Implement handlers for all routing actions
3. **Log Outcomes**: Always update decision logs with actual outcomes
4. **Use Preferences**: Integrate user preferences for personalized routing
5. **Enable QA**: Route low-confidence results through quality assurance
6. **Monitor Analytics**: Regularly review routing analytics for optimization
7. **Adjust Thresholds**: Fine-tune confidence thresholds based on analytics

## Testing Integration

```typescript
import { resetAgentCore } from "@/aws/bedrock/agent-core";
import { resetAdaptiveRouter } from "@/aws/bedrock/routing";

describe("Adaptive Routing Integration", () => {
  beforeEach(() => {
    resetAgentCore();
    resetAdaptiveRouter();
  });

  it("should route task through complete workflow", async () => {
    // Test complete integration
    const result = await executeEnhancedTask(
      { type: "content-generator", description: "Test task" },
      "test_user",
      { id: "agent_123" }
    );

    expect(result.status).toBe("completed");
  });
});
```

## Troubleshooting

### Issue: Low confidence scores

**Solution**: Check strand performance metrics and adjust confidence calculation weights

### Issue: Too many human reviews

**Solution**: Lower the humanReview threshold or improve strand quality

### Issue: High fallback rate

**Solution**: Review fallback strategies and improve primary strand reliability

### Issue: Inaccurate cost/time estimates

**Solution**: Update estimation logic based on actual outcomes from analytics

## Next Steps

1. Implement priority queue system (Task 41)
2. Add fallback manager (Task 39)
3. Integrate with load balancer (Task 40)
4. Build routing analytics dashboard
5. Add machine learning for confidence prediction
