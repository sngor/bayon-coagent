# Load Balancer Implementation

## Overview

The Load Balancer provides intelligent task distribution across strands based on real-time performance monitoring and dynamic strand selection. It implements multiple load balancing strategies and continuously monitors strand health to ensure optimal task routing.

**Requirement**: 10.3

## Features

### 1. Load-Based Distribution

Distributes tasks across strands based on current load metrics:

- **Least-Loaded**: Routes to the strand with the lowest current load
- **Weighted Round-Robin**: Distributes based on inverse load weights
- **Response Time**: Routes to the strand with best response time
- **Power of Two**: Randomly selects two strands and picks the better one
- **Adaptive**: Combines multiple factors (load, performance, health, priority)

### 2. Real-Time Performance Monitoring

Continuously monitors strand performance:

- Current load (0-1 scale)
- Average response time
- Success rate
- Queue depth
- Health status

### 3. Dynamic Strand Selection

Intelligently selects strands based on:

- Current load and capacity
- Historical performance metrics
- Health status
- Task priority
- Response time requirements

### 4. Load Balancing Metrics

Provides comprehensive metrics:

- Load distribution across strands
- Balance score (0-1, higher is better)
- Overloaded strand identification
- Underutilized strand detection
- Health status tracking

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Strand Selection Engine                     │  │
│  │  - Strategy selection                                 │  │
│  │  - Health filtering                                   │  │
│  │  - Load-based scoring                                 │  │
│  │  - Priority adjustment                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Real-Time Monitoring                        │  │
│  │  - Load metrics tracking                              │  │
│  │  - Performance monitoring                             │  │
│  │  - Health checks                                      │  │
│  │  - Distribution analysis                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Health Management                           │  │
│  │  - Health status tracking                             │  │
│  │  - Issue detection                                    │  │
│  │  - Degraded strand handling                           │  │
│  │  - Automatic recovery                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Load Rebalancing                            │  │
│  │  - Balance score calculation                          │  │
│  │  - Overload detection                                 │  │
│  │  - Automatic rebalancing                              │  │
│  │  - Load redistribution                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Load Balancing Strategies

### 1. Least-Loaded Strategy

Routes tasks to the strand with the lowest current load.

**Best for**: Evenly distributing load across all strands

```typescript
const loadBalancer = getLoadBalancer({
  strategy: "least-loaded",
});
```

### 2. Weighted Round-Robin Strategy

Distributes tasks using round-robin with weights based on inverse load.

**Best for**: Fair distribution while considering strand capacity

```typescript
const loadBalancer = getLoadBalancer({
  strategy: "weighted-round-robin",
});
```

### 3. Response Time Strategy

Routes to the strand with the best average response time.

**Best for**: Latency-sensitive applications

```typescript
const loadBalancer = getLoadBalancer({
  strategy: "response-time",
});
```

### 4. Power of Two Strategy

Randomly selects two strands and picks the one with lower load.

**Best for**: High-throughput scenarios with minimal overhead

```typescript
const loadBalancer = getLoadBalancer({
  strategy: "power-of-two",
});
```

### 5. Adaptive Strategy (Recommended)

Combines multiple factors for intelligent routing:

- Load (40%)
- Performance (30%)
- Success rate (20%)
- Health (10%)
- Priority adjustments

**Best for**: Most production scenarios

```typescript
const loadBalancer = getLoadBalancer({
  strategy: "adaptive",
});
```

## Usage

### Basic Usage

```typescript
import { getLoadBalancer } from "./load-balancer";
import type { WorkerTask } from "../worker-protocol";
import type { RoutingContext } from "./types";

// Get load balancer instance
const loadBalancer = getLoadBalancer();

// Select optimal strand for task
const selectedStrand = loadBalancer.selectStrand(
  task,
  availableStrands,
  context
);

// Execute task on selected strand
const result = await selectedStrand.execute(task);
```

### Updating Load Metrics

```typescript
// Update metrics after task execution
loadBalancer.updateLoadMetrics(strandId, {
  strandId,
  currentLoad: 0.65,
  avgResponseTime: 2500,
  successRate: 0.95,
  queueDepth: 10,
  lastUpdated: new Date().toISOString(),
});
```

### Monitoring Load Distribution

```typescript
// Get current load distribution
const distribution = loadBalancer.getLoadDistribution();

console.log(`Balance score: ${distribution.balanceScore}`);
console.log(`Overloaded strands: ${distribution.overloadedStrands.length}`);
console.log(`Average load: ${distribution.avgLoad}`);
```

### Health Checks

```typescript
// Perform health check on a strand
const health = await loadBalancer.performHealthCheck(strand);

if (health.status === "unhealthy") {
  console.log("Strand is unhealthy:", health.issues);
  // Take corrective action
}
```

## Configuration

### Default Configuration

```typescript
{
    strategy: 'adaptive',
    enableMonitoring: true,
    monitoringIntervalMs: 5000,
    overloadThreshold: 0.8,
    enableRebalancing: true,
    rebalancingIntervalMs: 30000,
    maxLoadPerStrand: 0.9,
    enableHealthChecks: true,
    healthCheckIntervalMs: 10000,
}
```

### Custom Configuration

```typescript
const loadBalancer = getLoadBalancer({
  strategy: "least-loaded",
  overloadThreshold: 0.75,
  enableMonitoring: true,
  monitoringIntervalMs: 3000,
  enableHealthChecks: true,
  healthCheckIntervalMs: 5000,
});
```

## Health Status

### Health Levels

1. **Healthy** (score ≥ 0.7)

   - Load < 80%
   - Success rate ≥ 80%
   - Response time < 10s
   - Queue depth < 100

2. **Degraded** (0.4 ≤ score < 0.7)

   - Moderate load or performance issues
   - May still handle tasks
   - Monitored closely

3. **Unhealthy** (score < 0.4)
   - High load or severe performance issues
   - Filtered out from task routing
   - Requires intervention

### Health Scoring

Health score is calculated based on:

- Load factor: -0.3 if overloaded
- Success rate: -0.3 if < 80%
- Response time: -0.2 if > 10s
- Queue depth: -0.2 if > 100 tasks

## Load Distribution Metrics

### Balance Score

The balance score (0-1) indicates how evenly load is distributed:

- **1.0**: Perfect balance (all strands have equal load)
- **0.8-1.0**: Good balance
- **0.6-0.8**: Moderate imbalance
- **< 0.6**: Poor balance (rebalancing recommended)

Calculated as: `1 - standardDeviation(loads)`

### Overload Detection

Strands are considered overloaded when:

- Current load > overloadThreshold (default: 0.8)
- Automatically filtered from task routing
- Triggers rebalancing if enabled

### Underutilization Detection

Strands are considered underutilized when:

- Current load < 0.3
- Average load across all strands > 0.5
- Candidates for receiving more tasks

## Monitoring

### Real-Time Monitoring

The load balancer continuously monitors:

1. **Load Distribution** (every 5s by default)

   - Tracks balance score
   - Identifies overloaded strands
   - Detects imbalances

2. **Health Checks** (every 10s by default)

   - Updates health status
   - Detects degraded strands
   - Identifies issues

3. **Automatic Rebalancing** (every 30s by default)
   - Analyzes load distribution
   - Triggers rebalancing if needed
   - Optimizes task distribution

### Disabling Monitoring

```typescript
const loadBalancer = getLoadBalancer({
  enableMonitoring: false,
  enableHealthChecks: false,
  enableRebalancing: false,
});

// Or stop monitoring later
loadBalancer.stopMonitoring();
```

## Integration with Adaptive Router

The Load Balancer integrates seamlessly with the Adaptive Router:

```typescript
import { getAdaptiveRouter } from "./adaptive-router";
import { getLoadBalancer } from "./load-balancer";

// Configure adaptive router with load balancing
const router = getAdaptiveRouter({
  enableLoadBalancing: true,
});

const loadBalancer = getLoadBalancer({
  strategy: "adaptive",
});

// Router uses load balancer for strand selection
const decision = await router.routeTask(task, strands, context);

// Update load metrics after execution
loadBalancer.updateLoadMetrics(decision.selectedStrand.id, {
  // ... metrics
});
```

## Best Practices

### 1. Choose the Right Strategy

- **Adaptive**: Best for most scenarios
- **Least-Loaded**: When even distribution is critical
- **Response-Time**: For latency-sensitive applications
- **Power-of-Two**: For high-throughput with minimal overhead

### 2. Update Metrics Regularly

```typescript
// Update after every task execution
const startTime = Date.now();
const result = await strand.execute(task);
const executionTime = Date.now() - startTime;

loadBalancer.updateLoadMetrics(strand.id, {
  strandId: strand.id,
  currentLoad: calculateCurrentLoad(strand),
  avgResponseTime: updateAverage(executionTime),
  successRate: calculateSuccessRate(result),
  queueDepth: strand.queueSize,
  lastUpdated: new Date().toISOString(),
});
```

### 3. Monitor Health Status

```typescript
// Periodically check health
const health = loadBalancer.getHealthStatus(strandId);

if (health?.status === "degraded") {
  console.warn(`Strand ${strandId} is degraded:`, health.issues);
  // Consider scaling or investigation
}
```

### 4. Handle Priority Tasks

```typescript
// Use priority in routing context
const context: RoutingContext = {
  userId: "user-123",
  priority: "urgent", // Prioritizes speed over load
  humanReviewAvailable: true,
};

const strand = loadBalancer.selectStrand(task, strands, context);
```

### 5. Monitor Load Distribution

```typescript
// Check balance regularly
const distribution = loadBalancer.getLoadDistribution();

if (distribution.balanceScore < 0.7) {
  console.warn("Poor load balance detected");
  // Consider adding more strands or rebalancing
}
```

## Performance Considerations

### Overhead

- Strand selection: < 1ms for typical scenarios
- Health checks: Minimal overhead (background process)
- Monitoring: Configurable intervals to balance accuracy vs overhead

### Scalability

- Supports 100+ strands efficiently
- O(n) complexity for most operations
- O(n log n) for sorting-based strategies

### Memory Usage

- Minimal memory footprint
- Metrics stored in-memory (can be persisted to DynamoDB)
- Automatic cleanup of old data

## Troubleshooting

### All Strands Overloaded

```typescript
// Check if all strands are overloaded
const distribution = loadBalancer.getLoadDistribution();

if (distribution.overloadedStrands.length === distribution.totalStrands) {
  console.error("All strands overloaded - need to scale up");
  // Add more strands or increase capacity
}
```

### Poor Load Balance

```typescript
// Check balance score
const distribution = loadBalancer.getLoadDistribution();

if (distribution.balanceScore < 0.6) {
  console.warn("Poor load balance");
  console.log("Overloaded:", distribution.overloadedStrands);
  console.log("Underutilized:", distribution.underutilizedStrands);

  // Consider:
  // 1. Enabling rebalancing
  // 2. Adjusting strategy
  // 3. Investigating strand performance
}
```

### Unhealthy Strands

```typescript
// Check for unhealthy strands
const allHealth = loadBalancer.getAllHealthStatuses();

for (const [strandId, health] of allHealth) {
  if (health.status === "unhealthy") {
    console.error(`Strand ${strandId} is unhealthy:`, health.issues);
    // Investigate and fix issues
  }
}
```

## Testing

See `load-balancer-example.ts` for comprehensive usage examples including:

1. Basic load balancing
2. Custom strategy configuration
3. Real-time monitoring
4. Priority-based routing
5. Health checks
6. Load distribution analysis

## Related Components

- **Adaptive Router**: Uses load balancer for intelligent routing
- **Fallback Manager**: Handles failures and retries
- **Priority Queue Manager**: Manages task priorities
- **Performance Tracker**: Tracks strand performance metrics

## Next Steps

1. Integrate with Adaptive Router for complete routing solution
2. Implement Priority Queue Manager (Task 41)
3. Add persistence layer for metrics (DynamoDB)
4. Implement advanced rebalancing algorithms
5. Add predictive load forecasting
