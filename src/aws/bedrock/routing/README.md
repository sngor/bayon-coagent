# Priority Queue Manager

The Priority Queue Manager provides intelligent task prioritization and queuing for the AgentStrands system. It ensures urgent tasks are processed before routine tasks while maintaining fairness and preventing starvation.

## Features

- **Priority-Based Queuing**: Five priority levels (Critical, High, Normal, Low, Background)
- **Urgent Task Handling**: Fast-track critical tasks
- **Aging Prevention**: Automatically boost priority of long-waiting tasks
- **Deadline Management**: Boost priority as deadlines approach
- **Queue Metrics**: Comprehensive monitoring and analytics
- **Event-Driven**: Real-time notifications for queue events

## Priority Levels

```typescript
enum TaskPriority {
  CRITICAL = 0, // Immediate processing required
  HIGH = 1, // Process as soon as possible
  NORMAL = 2, // Standard priority
  LOW = 3, // Process when resources available
  BACKGROUND = 4, // Lowest priority, process during idle time
}
```

## Basic Usage

### Creating a Queue Manager

```typescript
import { PriorityQueueManager, TaskPriority } from "@/aws/bedrock/routing";

const queueManager = new PriorityQueueManager({
  maxQueueSize: 1000,
  enableAging: true,
  agingThresholdMs: 5 * 60 * 1000, // 5 minutes
  enableDeadlineBoost: true,
  deadlineBoostThresholdMs: 2 * 60 * 1000, // 2 minutes
});
```

### Enqueuing Tasks

```typescript
import { createWorkerTask } from "@/aws/bedrock/worker-protocol";

// Create a task
const task = createWorkerTask("data-analyst", "Analyze market data", {
  query: "market trends",
});

// Enqueue with normal priority
queueManager.enqueue(task, TaskPriority.NORMAL);

// Enqueue with deadline
const deadline = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
queueManager.enqueue(task, TaskPriority.HIGH, {
  deadline,
  estimatedExecutionTime: 5000, // 5 seconds
  maxRetries: 3,
});
```

### Dequeuing Tasks

```typescript
// Get highest priority task
const entry = queueManager.dequeue();

if (entry) {
  console.log(`Processing task: ${entry.task.description}`);
  console.log(`Priority: ${TaskPriority[entry.priority]}`);
  console.log(
    `Wait time: ${Date.now() - new Date(entry.enqueuedAt).getTime()}ms`
  );
}
```

### Automatic Priority Determination

```typescript
import { determinePriority } from "@/aws/bedrock/routing";

// Urgent task
const urgentPriority = determinePriority(task, { isUrgent: true });
// Returns: TaskPriority.CRITICAL

// Task with deadline
const deadlinePriority = determinePriority(task, { hasDeadline: true });
// Returns: TaskPriority.HIGH

// User-specified priority
const userPriority = determinePriority(task, { userPriority: "high" });
// Returns: TaskPriority.HIGH
```

## Queue Management

### Checking Queue Status

```typescript
// Check if empty
if (queueManager.isEmpty()) {
  console.log("Queue is empty");
}

// Get total size
const size = queueManager.getTotalQueueSize();
console.log(`Queue has ${size} tasks`);

// Get tasks by priority
const highPriorityTasks = queueManager.getTasksByPriority(TaskPriority.HIGH);
console.log(`${highPriorityTasks.length} high priority tasks`);
```

### Task Operations

```typescript
// Peek at next task without removing
const next = queueManager.peek();

// Remove specific task
queueManager.remove(taskId);

// Update task priority
queueManager.updatePriority(taskId, TaskPriority.CRITICAL);

// Clear all tasks
queueManager.clear();
```

## Metrics and Monitoring

### Getting Queue Metrics

```typescript
const metrics = queueManager.getMetrics();

console.log("Queue Metrics:");
console.log(`Total tasks: ${metrics.totalTasks}`);
console.log(`Tasks by priority:`, metrics.tasksByPriority);
console.log(`Average wait times:`, metrics.avgWaitTimeByPriority);
console.log(`Longest wait: ${metrics.longestWaitTime}ms`);
console.log(`Throughput: ${metrics.currentThroughput} tasks/min`);
console.log(`Utilization: ${(metrics.utilizationRate * 100).toFixed(1)}%`);
```

### Event Monitoring

```typescript
// Task enqueued
queueManager.on("task-enqueued", (entry) => {
  console.log(`Task enqueued: ${entry.task.description}`);
});

// Task dequeued
queueManager.on("task-dequeued", (entry) => {
  console.log(`Task dequeued: ${entry.task.description}`);
});

// Priority boosted
queueManager.on("priority-boosted", (entry, oldPriority, newPriority) => {
  console.log(
    `Priority boosted from ${TaskPriority[oldPriority]} to ${TaskPriority[newPriority]}`
  );
});

// Queue full
queueManager.on("queue-full", (task) => {
  console.error(`Queue full! Cannot enqueue: ${task.description}`);
});

// Metrics updated (every 30 seconds)
queueManager.on("metrics-updated", (metrics) => {
  console.log("Metrics updated:", metrics);
});
```

## Integration with AgentCore

### Using the Priority-Aware Orchestrator

```typescript
import { getPriorityAwareOrchestrator } from "@/aws/bedrock/routing";

const orchestrator = getPriorityAwareOrchestrator();

// Submit urgent task
await orchestrator.submitUrgentTask(task);

// Submit task with options
await orchestrator.submitTask(task, {
  userPriority: "high",
  deadline: new Date(Date.now() + 5 * 60 * 1000),
  estimatedExecutionTime: 3000,
});

// Monitor events
orchestrator.on("task-allocated", (task, strand, priority) => {
  console.log(
    `Task allocated to ${strand.type} with priority ${TaskPriority[priority]}`
  );
});

// Get queue status
const status = orchestrator.getQueueStatus();
console.log("Queue status:", status);

// Cancel task
orchestrator.cancelTask(taskId);

// Boost priority
orchestrator.boostTaskPriority(taskId, TaskPriority.CRITICAL);
```

## Advanced Features

### Priority Aging

Tasks that wait too long automatically get priority boosts to prevent starvation:

```typescript
const queueManager = new PriorityQueueManager({
  enableAging: true,
  agingThresholdMs: 5 * 60 * 1000, // Boost after 5 minutes
});
```

### Deadline-Based Boosting

Tasks approaching their deadline get automatic priority boosts:

```typescript
const queueManager = new PriorityQueueManager({
  enableDeadlineBoost: true,
  deadlineBoostThresholdMs: 2 * 60 * 1000, // Boost 2 minutes before deadline
});
```

### Retry Logic

Failed tasks can be automatically retried with configurable limits:

```typescript
queueManager.enqueue(task, TaskPriority.NORMAL, {
  maxRetries: 3,
});
```

## Best Practices

1. **Use Appropriate Priorities**: Reserve CRITICAL for truly urgent tasks
2. **Set Deadlines**: Help the system optimize task ordering
3. **Monitor Metrics**: Watch for queue buildup and adjust capacity
4. **Handle Queue Full**: Implement backpressure when queue is full
5. **Clean Shutdown**: Always call `shutdown()` to clean up resources

```typescript
// Proper shutdown
process.on("SIGTERM", () => {
  queueManager.shutdown();
  process.exit(0);
});
```

## Configuration Options

```typescript
interface QueueConfig {
  /** Maximum queue size (0 = unlimited) */
  maxQueueSize: number;

  /** Enable aging to prevent starvation */
  enableAging: boolean;

  /** Time in ms before priority increases due to aging */
  agingThresholdMs: number;

  /** Enable deadline-based priority boost */
  enableDeadlineBoost: boolean;

  /** Time in ms before deadline to boost priority */
  deadlineBoostThresholdMs: number;
}
```

## Performance Considerations

- **Queue Size**: Monitor utilization and adjust `maxQueueSize` as needed
- **Aging Threshold**: Balance between fairness and priority enforcement
- **Metrics Interval**: Metrics update every 30 seconds by default
- **Event Handlers**: Remove listeners when no longer needed to prevent memory leaks

## Testing

The module includes comprehensive unit tests covering:

- Basic queue operations
- Priority ordering
- Task management
- Metrics tracking
- Priority adjustments
- Event emission
- Singleton pattern

Run tests:

```bash
npm test -- src/aws/bedrock/routing/__tests__/priority-queue-manager.test.ts
```

## Requirements Validation

This implementation satisfies **Requirement 10.4**:

> WHEN urgent tasks are submitted, THEN the system SHALL use priority queues to handle time-sensitive work faster than routine tasks

**Property 49: Priority queue ordering**

> For any set of tasks with different priorities, urgent tasks should be processed before routine tasks.

The implementation ensures:

- ✅ Priority-based ordering (CRITICAL → HIGH → NORMAL → LOW → BACKGROUND)
- ✅ FIFO ordering within same priority level
- ✅ Urgent task handling with CRITICAL priority
- ✅ Comprehensive queue metrics
- ✅ Aging prevention for fairness
- ✅ Deadline-based priority boosting
