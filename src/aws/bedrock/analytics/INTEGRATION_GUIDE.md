# Performance Tracker Integration Guide

This guide shows how to integrate the Performance Tracker with existing AgentStrands components.

## Integration with AgentCore

### 1. Track Strand Execution

Wrap strand execution to automatically track performance:

```typescript
import { createPerformanceTracker } from "@/aws/bedrock/analytics";
import { AgentStrand } from "@/aws/bedrock/agent-strands";

const tracker = createPerformanceTracker();

async function executeStrandWithTracking(
  strand: AgentStrand,
  task: WorkerTask
): Promise<WorkerResult> {
  const startTime = Date.now();
  const startTokens = getCurrentTokenCount();

  try {
    // Execute the strand
    const result = await strand.execute(task);

    // Calculate metrics
    const executionTime = Date.now() - startTime;
    const tokenUsage = getCurrentTokenCount() - startTokens;
    const cost = calculateCost(tokenUsage, strand.model);

    // Track performance
    await tracker.trackPerformance(strand.id, task.userId, task.id, task.type, {
      executionTime,
      tokenUsage,
      cost,
      successRate: result.success ? 1.0 : 0.0,
      userSatisfaction: result.userRating || 0,
      qualityScore: result.qualityScore || 0,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    // Track failure
    const executionTime = Date.now() - startTime;
    await tracker.trackPerformance(strand.id, task.userId, task.id, task.type, {
      executionTime,
      tokenUsage: 0,
      cost: 0,
      successRate: 0.0,
      userSatisfaction: 0,
      qualityScore: 0,
      timestamp: new Date().toISOString(),
    });

    throw error;
  }
}
```

### 2. Monitor Strand Health

Create a health check endpoint:

```typescript
import { createPerformanceTracker } from "@/aws/bedrock/analytics";

export async function checkStrandHealth(strandId: string) {
  const tracker = createPerformanceTracker();

  // Get recent performance
  const snapshot = await tracker.getSnapshot(strandId);

  if (!snapshot) {
    return { status: "unknown", message: "No performance data available" };
  }

  // Check for anomalies
  const anomalies = await tracker.detectAnomalies(strandId, "1h");

  if (anomalies.some((a) => a.severity === "critical")) {
    return {
      status: "critical",
      message: "Critical performance issues detected",
      anomalies,
    };
  }

  if (anomalies.some((a) => a.severity === "high")) {
    return {
      status: "degraded",
      message: "Performance degradation detected",
      anomalies,
    };
  }

  return {
    status: "healthy",
    message: "Strand is performing normally",
    metrics: snapshot.metrics,
  };
}
```

## Integration with Quality Assurance

Track quality metrics from QA strand:

```typescript
import { createPerformanceTracker } from "@/aws/bedrock/analytics";
import { QualityAssuranceStrand } from "@/aws/bedrock/quality-assurance";

async function executeWithQualityTracking(
  qaStrand: QualityAssuranceStrand,
  content: string
) {
  const tracker = createPerformanceTracker();
  const startTime = Date.now();

  // Run quality validation
  const result = await qaStrand.validateContent(content, [
    "factual",
    "compliance",
    "brand",
    "seo",
  ]);

  const executionTime = Date.now() - startTime;

  // Track QA performance
  await tracker.trackPerformance(
    qaStrand.id,
    "system",
    `qa-${Date.now()}`,
    "quality-assurance",
    {
      executionTime,
      tokenUsage: result.tokenUsage || 0,
      cost: result.cost || 0,
      successRate: result.passed ? 1.0 : 0.0,
      userSatisfaction: 0, // Not applicable for QA
      qualityScore: result.overallScore,
      timestamp: new Date().toISOString(),
    }
  );

  return result;
}
```

## Integration with Collaboration Layer

Track handoff performance:

```typescript
import { createPerformanceTracker } from "@/aws/bedrock/analytics";
import { HandoffManager } from "@/aws/bedrock/collaboration";

async function trackHandoffPerformance(
  handoffManager: HandoffManager,
  fromStrand: AgentStrand,
  toStrand: AgentStrand,
  context: HandoffContext
) {
  const tracker = createPerformanceTracker();
  const startTime = Date.now();

  // Execute handoff
  await handoffManager.executeHandoff(fromStrand, toStrand, context);

  const executionTime = Date.now() - startTime;

  // Track handoff as a special task type
  await tracker.trackPerformance(
    "handoff-manager",
    context.userId || "system",
    context.taskId,
    "handoff",
    {
      executionTime,
      tokenUsage: 0, // Handoffs don't use tokens
      cost: 0,
      successRate: 1.0,
      userSatisfaction: 0,
      qualityScore: 100, // Successful handoff
      timestamp: new Date().toISOString(),
    }
  );
}
```

## Integration with Learning System

Track preference engine performance:

```typescript
import { createPerformanceTracker } from "@/aws/bedrock/analytics";
import { PreferenceEngine } from "@/aws/bedrock/learning";

async function trackPreferenceLearning(
  preferenceEngine: PreferenceEngine,
  userId: string,
  feedbackRecords: FeedbackRecord[]
) {
  const tracker = createPerformanceTracker();
  const startTime = Date.now();

  // Learn preferences
  const preferences = await preferenceEngine.learnPreferences(
    userId,
    feedbackRecords
  );

  const executionTime = Date.now() - startTime;

  // Track learning performance
  await tracker.trackPerformance(
    "preference-engine",
    userId,
    `learn-${Date.now()}`,
    "preference-learning",
    {
      executionTime,
      tokenUsage: 0,
      cost: 0,
      successRate: 1.0,
      userSatisfaction: 0,
      qualityScore: 100,
      timestamp: new Date().toISOString(),
    }
  );

  return preferences;
}
```

## Dashboard Integration

Create a performance dashboard:

```typescript
import { createPerformanceTracker } from "@/aws/bedrock/analytics";

export async function getPerformanceDashboardData(userId?: string) {
  const tracker = createPerformanceTracker();

  // Get last 24 hours of data
  const filters = {
    userId,
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  };

  // Get analytics
  const analytics = await tracker.getAnalytics(filters);

  // Get anomalies for all strands
  const strandIds = Object.keys(analytics.byStrand);
  const anomaliesPromises = strandIds.map((id) =>
    tracker.detectAnomalies(id, "24h")
  );
  const anomaliesArrays = await Promise.all(anomaliesPromises);
  const allAnomalies = anomaliesArrays.flat();

  return {
    summary: {
      totalTasks: analytics.totalTasks,
      successRate: analytics.successRate,
      avgQuality: analytics.avgQualityScore,
      totalCost: analytics.totalCost,
    },
    strands: Object.entries(analytics.byStrand).map(([id, metrics]) => ({
      id,
      metrics,
      health: getHealthStatus(metrics),
    })),
    anomalies: allAnomalies.filter(
      (a) => a.severity === "high" || a.severity === "critical"
    ),
    timeSeries: analytics.timeSeries,
  };
}

function getHealthStatus(metrics: PerformanceMetrics): string {
  if (metrics.successRate < 0.9) return "critical";
  if (metrics.qualityScore < 70) return "warning";
  if (metrics.executionTime > 5000) return "warning";
  return "healthy";
}
```

## API Route Integration

Create API routes for performance data:

```typescript
// app/api/analytics/performance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createPerformanceTracker } from "@/aws/bedrock/analytics";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const strandId = searchParams.get("strandId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const tracker = createPerformanceTracker();

  const analytics = await tracker.getAnalytics({
    strandId: strandId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  return NextResponse.json(analytics);
}

// app/api/analytics/anomalies/route.ts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const strandId = searchParams.get("strandId");
  const timeframe = searchParams.get("timeframe") || "7d";

  if (!strandId) {
    return NextResponse.json(
      { error: "strandId is required" },
      { status: 400 }
    );
  }

  const tracker = createPerformanceTracker();
  const anomalies = await tracker.detectAnomalies(strandId, timeframe);

  return NextResponse.json(anomalies);
}

// app/api/analytics/reports/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { reportType, filters } = body;

  const tracker = createPerformanceTracker();
  const report = await tracker.generateReport(reportType, filters);

  return NextResponse.json(report);
}
```

## Scheduled Monitoring

Set up scheduled performance checks:

```typescript
import { createPerformanceTracker } from "@/aws/bedrock/analytics";

// Run every hour
export async function scheduledPerformanceCheck() {
  const tracker = createPerformanceTracker();

  // Get all active strands
  const activeStrands = await getActiveStrands();

  for (const strand of activeStrands) {
    // Check for anomalies
    const anomalies = await tracker.detectAnomalies(strand.id, "1h");

    // Alert on critical issues
    const criticalAnomalies = anomalies.filter(
      (a) => a.severity === "critical"
    );

    if (criticalAnomalies.length > 0) {
      await sendAlert({
        type: "critical-performance",
        strandId: strand.id,
        anomalies: criticalAnomalies,
      });
    }
  }

  // Generate daily report
  const report = await tracker.generateReport("daily-summary", {
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  });

  // Send report to admins
  await sendDailyReport(report);
}
```

## Testing Integration

Test performance tracking in your tests:

```typescript
import { createPerformanceTracker } from "@/aws/bedrock/analytics";

describe("Strand Performance", () => {
  it("should track performance metrics", async () => {
    const tracker = createPerformanceTracker({
      tableName: "test-table",
    });

    await tracker.trackPerformance(
      "test-strand",
      "test-user",
      "test-task",
      "test-type",
      {
        executionTime: 1000,
        tokenUsage: 500,
        cost: 0.01,
        successRate: 1.0,
        userSatisfaction: 5.0,
        qualityScore: 90,
        timestamp: new Date().toISOString(),
      }
    );

    const analytics = await tracker.getAnalytics({
      strandId: "test-strand",
    });

    expect(analytics.totalTasks).toBe(1);
    expect(analytics.avgQualityScore).toBe(90);
  });
});
```

## Environment Configuration

Configure for different environments:

```typescript
// config/analytics.ts
export function getAnalyticsConfig() {
  const env = process.env.NODE_ENV;

  return (
    {
      development: {
        tableName: "bayon-coagent-dev",
        enableAnomalyDetection: true,
        retentionDays: 30,
      },
      staging: {
        tableName: "bayon-coagent-staging",
        enableAnomalyDetection: true,
        retentionDays: 60,
      },
      production: {
        tableName: "bayon-coagent-prod",
        enableAnomalyDetection: true,
        retentionDays: 90,
        anomalyThresholds: {
          latencyMultiplier: 1.5, // More sensitive in prod
          errorRateThreshold: 0.05,
          costMultiplier: 1.3,
          qualityDropThreshold: 15,
        },
      },
    }[env] || {}
  );
}
```

## Best Practices

1. **Always Track**: Track performance for every strand execution
2. **Handle Errors**: Track failures as well as successes
3. **Use Filters**: Use appropriate filters for efficient queries
4. **Monitor Regularly**: Set up scheduled monitoring
5. **Act on Anomalies**: Respond to detected anomalies promptly
6. **Review Reports**: Generate and review regular reports
7. **Optimize Costs**: Use analytics to identify cost optimization opportunities

## Next Steps

1. Implement Cost Monitor (Task 34) for detailed cost tracking
2. Create Analytics Dashboards (Task 36) for visualization
3. Set up alerting for critical anomalies
4. Integrate with existing monitoring tools
5. Add custom metrics as needed
