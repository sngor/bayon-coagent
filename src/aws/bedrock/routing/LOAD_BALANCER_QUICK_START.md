# Load Balancer Quick Start Guide

## Installation

The Load Balancer is part of the routing module. No additional installation required.

## Basic Usage

### 1. Get Load Balancer Instance

```typescript
import { getLoadBalancer } from "@/aws/bedrock/routing/load-balancer";

// Get singleton instance with default configuration
const loadBalancer = getLoadBalancer();
```

### 2. Select Optimal Strand

```typescript
import type { WorkerTask } from "@/aws/bedrock/worker-protocol";
import type { RoutingContext } from "@/aws/bedrock/routing/types";

// Create task
const task: WorkerTask = {
  id: "task-123",
  type: "content-generator",
  description: "Generate blog post",
  input: { topic: "Real Estate Trends" },
  dependencies: [],
  createdAt: new Date().toISOString(),
  status: "pending",
};

// Create routing context
const context: RoutingContext = {
  userId: "user-456",
  priority: "normal",
  humanReviewAvailable: true,
};

// Select optimal strand
const selectedStrand = loadBalancer.selectStrand(
  task,
  availableStrands,
  context
);

console.log(`Selected: ${selectedStrand.id}`);
```

### 3. Update Load Metrics

```typescript
// After task execution, update metrics
loadBalancer.updateLoadMetrics(selectedStrand.id, {
  strandId: selectedStrand.id,
  currentLoad: 0.65,
  avgResponseTime: 2500,
  successRate: 0.95,
  queueDepth: 10,
  lastUpdated: new Date().toISOString(),
});
```

### 4. Monitor Load Distribution

```typescript
// Check load distribution
const distribution = loadBalancer.getLoadDistribution();

console.log(`Balance score: ${distribution.balanceScore.toFixed(2)}`);
console.log(`Average load: ${(distribution.avgLoad * 100).toFixed(0)}%`);
console.log(`Overloaded strands: ${distribution.overloadedStrands.length}`);
```

## Common Scenarios

### Scenario 1: High-Priority Task

```typescript
// Route urgent task to fastest available strand
const urgentContext: RoutingContext = {
  userId: "user-789",
  priority: "urgent", // Prioritizes speed
  humanReviewAvailable: false,
};

const strand = loadBalancer.selectStrand(
  urgentTask,
  availableStrands,
  urgentContext
);
```

### Scenario 2: Custom Strategy

```typescript
import {
  getLoadBalancer,
  resetLoadBalancer,
} from "@/aws/bedrock/routing/load-balancer";

// Reset to create new instance
resetLoadBalancer();

// Configure with specific strategy
const loadBalancer = getLoadBalancer({
  strategy: "least-loaded",
  overloadThreshold: 0.75,
});
```

### Scenario 3: Health Monitoring

```typescript
// Check strand health
const health = loadBalancer.getHealthStatus(strandId);

if (health?.status === "unhealthy") {
  console.error("Strand unhealthy:", health.issues);
  // Take corrective action
}

// Or perform health check
const health = await loadBalancer.performHealthCheck(strand);
```

### Scenario 4: Load Distribution Analysis

```typescript
// Analyze load distribution
const distribution = loadBalancer.getLoadDistribution();

if (distribution.balanceScore < 0.7) {
  console.warn("Poor load balance detected");
  console.log("Overloaded:", distribution.overloadedStrands);
  console.log("Underutilized:", distribution.underutilizedStrands);
}
```

## Configuration Options

### Minimal Configuration

```typescript
const loadBalancer = getLoadBalancer({
  strategy: "adaptive",
});
```

### Full Configuration

```typescript
const loadBalancer = getLoadBalancer({
  strategy: "adaptive",
  enableMonitoring: true,
  monitoringIntervalMs: 5000,
  overloadThreshold: 0.8,
  enableRebalancing: true,
  rebalancingIntervalMs: 30000,
  maxLoadPerStrand: 0.9,
  enableHealthChecks: true,
  healthCheckIntervalMs: 10000,
});
```

## Load Balancing Strategies

### 1. Adaptive (Recommended)

Combines load, performance, health, and priority.

```typescript
const loadBalancer = getLoadBalancer({
  strategy: "adaptive",
});
```

### 2. Least-Loaded

Routes to strand with lowest current load.

```typescript
const loadBalancer = getLoadBalancer({
  strategy: "least-loaded",
});
```

### 3. Response-Time

Routes to strand with best response time.

```typescript
const loadBalancer = getLoadBalancer({
  strategy: "response-time",
});
```

### 4. Power-of-Two

Randomly picks two strands and selects the better one.

```typescript
const loadBalancer = getLoadBalancer({
  strategy: "power-of-two",
});
```

### 5. Weighted Round-Robin

Round-robin with performance-based weights.

```typescript
const loadBalancer = getLoadBalancer({
  strategy: "weighted-round-robin",
});
```

## Integration with Adaptive Router

```typescript
import { getAdaptiveRouter } from "@/aws/bedrock/routing/adaptive-router";
import { getLoadBalancer } from "@/aws/bedrock/routing/load-balancer";

// Configure router with load balancing enabled
const router = getAdaptiveRouter({
  enableLoadBalancing: true,
});

const loadBalancer = getLoadBalancer({
  strategy: "adaptive",
});

// Route task
const decision = await router.routeTask(task, strands, context);

// Update metrics after execution
const result = await decision.selectedStrand.execute(task);

loadBalancer.updateLoadMetrics(decision.selectedStrand.id, {
  strandId: decision.selectedStrand.id,
  currentLoad: calculateLoad(decision.selectedStrand),
  avgResponseTime: result.executionTime,
  successRate: result.success ? 1.0 : 0.0,
  queueDepth: decision.selectedStrand.queueSize,
  lastUpdated: new Date().toISOString(),
});
```

## Monitoring and Alerts

### Check Balance Score

```typescript
const distribution = loadBalancer.getLoadDistribution();

if (distribution.balanceScore < 0.7) {
  // Alert: Poor load balance
  console.warn("Load imbalance detected");
}
```

### Check Overloaded Strands

```typescript
const distribution = loadBalancer.getLoadDistribution();

if (distribution.overloadedStrands.length > 0) {
  // Alert: Strands overloaded
  console.error("Overloaded strands:", distribution.overloadedStrands);
}
```

### Check Health Status

```typescript
const allHealth = loadBalancer.getAllHealthStatuses();

for (const [strandId, health] of allHealth) {
  if (health.status === "unhealthy") {
    // Alert: Unhealthy strand
    console.error(`Strand ${strandId} unhealthy:`, health.issues);
  }
}
```

## Best Practices

1. **Update metrics after every task execution**

   ```typescript
   const result = await strand.execute(task);
   loadBalancer.updateLoadMetrics(strand.id, {
     /* metrics */
   });
   ```

2. **Use adaptive strategy for most scenarios**

   ```typescript
   const loadBalancer = getLoadBalancer({ strategy: "adaptive" });
   ```

3. **Monitor load distribution regularly**

   ```typescript
   setInterval(() => {
     const dist = loadBalancer.getLoadDistribution();
     if (dist.balanceScore < 0.7) {
       console.warn("Load imbalance");
     }
   }, 60000);
   ```

4. **Handle priority tasks appropriately**

   ```typescript
   const context: RoutingContext = {
     userId: "user-123",
     priority: task.isUrgent ? "urgent" : "normal",
     humanReviewAvailable: true,
   };
   ```

5. **Check health before critical operations**
   ```typescript
   const health = loadBalancer.getHealthStatus(strandId);
   if (health?.status === "unhealthy") {
     // Use different strand or wait
   }
   ```

## Troubleshooting

### Problem: All strands overloaded

```typescript
const dist = loadBalancer.getLoadDistribution();
if (dist.overloadedStrands.length === dist.totalStrands) {
  console.error("All strands overloaded - scale up needed");
  // Add more strands or increase capacity
}
```

### Problem: Poor load balance

```typescript
const dist = loadBalancer.getLoadDistribution();
if (dist.balanceScore < 0.6) {
  console.warn("Poor balance:", {
    overloaded: dist.overloadedStrands,
    underutilized: dist.underutilizedStrands,
  });
  // Consider enabling rebalancing or adjusting strategy
}
```

### Problem: Unhealthy strands

```typescript
const health = loadBalancer.getHealthStatus(strandId);
if (health?.status === "unhealthy") {
  console.error("Unhealthy strand:", health.issues);
  // Investigate: high load, low success rate, slow response?
}
```

## Examples

See `load-balancer-example.ts` for complete examples:

```bash
# Run examples
npx tsx src/aws/bedrock/routing/load-balancer-example.ts
```

## Next Steps

1. Review [Load Balancer Implementation](./LOAD_BALANCER_IMPLEMENTATION.md) for detailed documentation
2. Check [Integration Guide](./INTEGRATION_GUIDE.md) for integration patterns
3. See [load-balancer-example.ts](./load-balancer-example.ts) for usage examples
4. Integrate with Priority Queue Manager (Task 41)

## Support

For issues or questions:

1. Check the implementation documentation
2. Review the examples
3. Check health status and metrics
4. Verify configuration settings
