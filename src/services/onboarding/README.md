# Onboarding Services

This directory contains the infrastructure and services for the user onboarding system.

## Overview

The onboarding system provides a progressive, non-intrusive experience for first-time users. It supports two distinct flows:

- **User Flow**: For real estate agents (profile setup, feature tour, hub selection)
- **Admin Flow**: For administrators (user management, analytics, configuration)
- **Dual Role**: Users with both roles can complete both flows

## Architecture

### Data Models

#### OnboardingState

Stored in DynamoDB with the following structure:

- **PK**: `USER#<userId>`
- **SK**: `ONBOARDING#STATE`
- **GSI1**: `ONBOARDING#INCOMPLETE` (for querying incomplete onboardings)

Contains:

- `userId`: User identifier
- `flowType`: 'user' | 'admin' | 'both'
- `currentStep`: Current step index
- `completedSteps`: Array of completed step IDs
- `skippedSteps`: Array of skipped step IDs
- `isComplete`: Boolean completion status
- `startedAt`: ISO timestamp
- `completedAt`: ISO timestamp (optional)
- `lastAccessedAt`: ISO timestamp
- `metadata`: Additional data (selected hub, profile completion, etc.)

#### OnboardingAnalytics

Analytics events logged to CloudWatch Logs:

- `onboarding_started`: User begins onboarding
- `step_completed`: User completes a step
- `step_skipped`: User skips a step
- `onboarding_completed`: User finishes entire flow
- `onboarding_abandoned`: User leaves without completing
- `onboarding_resumed`: User returns to incomplete onboarding
- `flow_switched`: Dual-role user switches between flows

### Services

#### OnboardingService

Business logic for managing onboarding state with comprehensive error handling and retry logic:

**Features:**

- Automatic retry logic for network failures (3 retries with exponential backoff)
- Input validation for all parameters
- User-friendly error messages wrapped in `OnboardingError`
- State consistency checks
- Graceful degradation on errors for non-blocking operations

**Methods:**

- `getOnboardingState(userId)`: Get current state
- `initializeOnboarding(userId, flowType)`: Create new onboarding (idempotent)
- `completeStep(userId, stepId)`: Mark step as complete with validation
- `skipStep(userId, stepId)`: Mark step as skipped
- `completeOnboarding(userId)`: Mark entire flow as complete (idempotent)
- `needsOnboarding(userId)`: Check if user needs onboarding (returns false on error)
- `getNextStep(userId)`: Get next incomplete step (returns null on error)
- `updateMetadata(userId, metadata)`: Update metadata
- `resetOnboarding(userId)`: Reset state (testing/re-onboarding)

**Error Handling:**

- All methods throw `OnboardingError` with descriptive messages
- Network errors are automatically retried with exponential backoff
- Validation errors are caught early with clear error codes
- Non-blocking methods (`needsOnboarding`, `getNextStep`) return safe defaults on error

#### OnboardingAnalyticsService

Event tracking and CloudWatch logging:

- `trackOnboardingStarted(userId, flowType, sessionId?)`
- `trackStepCompleted(userId, flowType, stepId, timeSpent?, sessionId?)`
- `trackStepSkipped(userId, flowType, stepId, skipReason?, sessionId?)`
- `trackOnboardingCompleted(userId, flowType, totalTime?, sessionId?)`
- `trackOnboardingAbandoned(userId, flowType, lastStepId?, sessionId?)`
- `trackOnboardingResumed(userId, flowType, resumeStepId, sessionId?)`
- `trackFlowSwitched(userId, fromFlow, toFlow, sessionId?)`
- `batchLogEvents(events)`: Batch log multiple events

## CloudWatch Configuration

### Log Group

- **Name**: `/bayon-coagent/onboarding`
- **Retention**: 30 days
- **Stream Prefix**: `onboarding-events`

### Metrics

- **Namespace**: `BayonCoagent/Onboarding`
- **Metrics**:
  - `OnboardingStarted`: Count of started onboardings
  - `OnboardingCompleted`: Count of completed onboardings
  - `OnboardingAbandoned`: Count of abandoned onboardings
  - `StepCompleted`: Count of completed steps
  - `StepSkipped`: Count of skipped steps
  - `OnboardingResumed`: Count of resumed onboardings
  - `FlowSwitched`: Count of flow switches
  - `CompletionTime`: Time to complete onboarding (ms)
  - `StepTime`: Time per step (ms)

### Dimensions

- `FlowType`: user | admin | both
- `StepId`: Specific step identifier
- `DeviceType`: mobile | tablet | desktop
- `UserId`: User identifier

### Alarms

- **Low Completion Rate**: Alert if < 50%
- **High Abandonment Rate**: Alert if > 30%
- **Slow Step Time**: Alert if > 5 minutes

## CloudWatch Insights Queries

Pre-defined queries for analytics:

- `COMPLETION_RATE_BY_FLOW`: Completion rates by flow type
- `STEP_ABANDONMENT`: Step-by-step abandonment rates
- `AVERAGE_STEP_TIME`: Average time spent per step
- `TOTAL_COMPLETION_TIME`: Total time to complete onboarding
- `DEVICE_DISTRIBUTION`: Device type distribution
- `USER_FLOW_PATHS`: Individual user flow paths
- `SKIP_REASONS`: Reasons for skipping steps
- `RESUME_RATE`: Rate of resumed onboardings

## Usage Examples

### Initialize Onboarding

```typescript
import { onboardingService } from "@/services/onboarding";

// Detect user role and initialize
const flowType = isAdmin ? "admin" : "user";
await onboardingService.initializeOnboarding(userId, flowType);
```

### Complete a Step

```typescript
import { onboardingService, onboardingAnalytics } from "@/services/onboarding";

// Mark step as complete
const state = await onboardingService.completeStep(userId, "profile");

// Track analytics
await onboardingAnalytics.trackStepCompleted(
  userId,
  state.flowType,
  "profile",
  timeSpent
);
```

### Check if User Needs Onboarding

```typescript
import { onboardingService } from "@/services/onboarding";

const needsOnboarding = await onboardingService.needsOnboarding(userId);
if (needsOnboarding) {
  // Redirect to onboarding
  const nextStep = await onboardingService.getNextStep(userId);
  redirect(`/onboarding/${nextStep?.path}`);
}
```

### Track Analytics Events

```typescript
import { onboardingAnalytics } from "@/services/onboarding";

// Track start
await onboardingAnalytics.trackOnboardingStarted(userId, "user", sessionId);

// Track skip with reason
await onboardingAnalytics.trackStepSkipped(
  userId,
  "user",
  "tour",
  "Already familiar with platform",
  sessionId
);

// Track completion
await onboardingAnalytics.trackOnboardingCompleted(
  userId,
  "user",
  totalTime,
  sessionId
);
```

## Testing

### Unit Tests

Test files should be created for:

- `onboarding-service.test.ts`: Service logic tests
- `onboarding-analytics.test.ts`: Analytics tracking tests
- `onboarding-types.test.ts`: Type utility function tests

### Integration Tests

- DynamoDB state persistence
- CloudWatch log delivery
- End-to-end flow completion

## Requirements Validation

This infrastructure satisfies the following requirements:

- **6.1**: Automatic state persistence to DynamoDB
- **6.2**: Data preservation on navigation
- **8.1**: Analytics event logging for onboarding start
- **8.2**: Step completion event tracking
- **8.3**: Step skip event tracking
- **8.4**: Onboarding completion event with timing
- **8.5**: CloudWatch Logs integration

## Next Steps

1. Implement onboarding UI components
2. Create middleware for onboarding detection
3. Build onboarding screens (welcome, profile, tour, etc.)
4. Add property-based tests for state management
5. Set up CloudWatch dashboards and alarms
