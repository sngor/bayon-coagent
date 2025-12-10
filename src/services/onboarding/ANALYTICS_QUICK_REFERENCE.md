# Onboarding Analytics - Quick Reference

## Import

```typescript
import { onboardingAnalytics } from "@/services/onboarding/onboarding-analytics";
```

## Basic Usage

### Track Onboarding Start

```typescript
await onboardingAnalytics.trackOnboardingStarted(
  userId: string,
  flowType: 'user' | 'admin' | 'both',
  sessionId?: string  // Optional, auto-generated if not provided
);
```

### Track Step Completion

```typescript
await onboardingAnalytics.trackStepCompleted(
  userId: string,
  flowType: 'user' | 'admin' | 'both',
  stepId: string,
  timeSpent?: number,  // Optional, in milliseconds
  sessionId?: string
);
```

### Track Step Skip

```typescript
await onboardingAnalytics.trackStepSkipped(
  userId: string,
  flowType: 'user' | 'admin' | 'both',
  stepId: string,
  skipReason?: string,  // Optional
  sessionId?: string
);
```

### Track Onboarding Completion

```typescript
await onboardingAnalytics.trackOnboardingCompleted(
  userId: string,
  flowType: 'user' | 'admin' | 'both',
  totalTime?: number,  // Optional, in milliseconds
  sessionId?: string
);
```

## Additional Methods

### Track Abandonment

```typescript
await onboardingAnalytics.trackOnboardingAbandoned(
  userId: string,
  flowType: 'user' | 'admin' | 'both',
  lastStepId?: string,
  sessionId?: string
);
```

### Track Resume

```typescript
await onboardingAnalytics.trackOnboardingResumed(
  userId: string,
  flowType: 'user' | 'admin' | 'both',
  resumeStepId: string,
  sessionId?: string
);
```

### Track Flow Switch (Dual Role Users)

```typescript
await onboardingAnalytics.trackFlowSwitched(
  userId: string,
  fromFlow: 'user' | 'admin' | 'both',
  toFlow: 'user' | 'admin' | 'both',
  sessionId?: string
);
```

### Batch Log Events

```typescript
await onboardingAnalytics.batchLogEvents(
  events: OnboardingAnalyticsEvent[]
);
```

## Integration Example

```typescript
// In your onboarding component
import { onboardingAnalytics } from "@/services/onboarding/onboarding-analytics";
import { useUser } from "@/aws/auth/use-user";

export function OnboardingFlow() {
  const { user } = useUser();
  const [sessionId] = useState(() => uuidv4());

  useEffect(() => {
    // Track onboarding start
    if (user?.userId) {
      onboardingAnalytics.trackOnboardingStarted(
        user.userId,
        "user",
        sessionId
      );
    }
  }, [user?.userId, sessionId]);

  const handleStepComplete = async (stepId: string, timeSpent: number) => {
    if (user?.userId) {
      await onboardingAnalytics.trackStepCompleted(
        user.userId,
        "user",
        stepId,
        timeSpent,
        sessionId
      );
    }
  };

  const handleStepSkip = async (stepId: string, reason?: string) => {
    if (user?.userId) {
      await onboardingAnalytics.trackStepSkipped(
        user.userId,
        "user",
        stepId,
        reason,
        sessionId
      );
    }
  };

  const handleComplete = async (totalTime: number) => {
    if (user?.userId) {
      await onboardingAnalytics.trackOnboardingCompleted(
        user.userId,
        "user",
        totalTime,
        sessionId
      );
    }
  };

  // ... rest of component
}
```

## CloudWatch Queries

### View All Onboarding Events

```
fields @timestamp, eventType, userId, flowType, stepId
| filter service = "onboarding"
| sort @timestamp desc
```

### Completion Rate by Flow

```
fields @timestamp, eventType, flowType, userId
| filter eventType in ["onboarding_started", "onboarding_completed"]
| stats count() as total by eventType, flowType
```

### Step Abandonment Analysis

```
fields @timestamp, stepId, eventType
| filter eventType in ["step_completed", "step_skipped", "onboarding_abandoned"]
| stats count() as total by stepId, eventType
| sort total desc
```

### Average Time Per Step

```
fields stepId, metadata.timeSpent
| filter eventType = "step_completed" and metadata.timeSpent > 0
| stats avg(metadata.timeSpent) as avgTime by stepId
```

## Event Structure

All events are logged with this structure:

```typescript
{
  eventType: 'onboarding_started' | 'step_completed' | 'step_skipped' | 'onboarding_completed' | 'onboarding_abandoned' | 'onboarding_resumed' | 'flow_switched'
  userId: string
  flowType: 'user' | 'admin' | 'both'
  stepId?: string
  timestamp: string  // ISO format
  sessionId: string
  metadata: {
    deviceType: 'mobile' | 'tablet' | 'desktop' | 'server'
    userAgent?: string
    timeSpent?: number  // milliseconds
    skipReason?: string
    totalTime?: number  // milliseconds
    previousStep?: string
    nextStep?: string
  }
}
```

## Best Practices

1. **Always use the same sessionId** throughout a single onboarding session
2. **Track time spent** on each step for performance insights
3. **Provide skip reasons** when available for better understanding
4. **Don't await analytics calls** if you want to avoid blocking the UI
5. **Use try-catch** if you need to handle analytics failures explicitly
6. **Batch events** when syncing offline data

## Error Handling

Analytics failures are automatically caught and logged but won't break your application:

```typescript
// This is safe - errors are handled internally
await onboardingAnalytics.trackStepCompleted(userId, flowType, stepId);

// But you can also handle errors explicitly if needed
try {
  await onboardingAnalytics.trackStepCompleted(userId, flowType, stepId);
} catch (error) {
  // Handle error (though this rarely happens)
  console.error("Analytics error:", error);
}
```

## Configuration

CloudWatch configuration is in `src/lib/onboarding/cloudwatch-config.ts`:

- Log group: `/bayon-coagent/onboarding`
- Metric namespace: `BayonCoagent/Onboarding`
- Log retention: 30 days (production), 7 days (development)

## Monitoring

Set up CloudWatch alarms for:

- Low completion rate (< 50%)
- High abandonment rate (> 30%)
- Slow step times (> 5 minutes)

See `ONBOARDING_ALARM_THRESHOLDS` in cloudwatch-config.ts for threshold values.
