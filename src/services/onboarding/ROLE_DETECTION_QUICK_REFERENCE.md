# Role Detection Quick Reference

## Overview

Role detection determines which onboarding flow a user should see based on their Cognito role attributes.

## Quick Start

```typescript
import { detectOnboardingFlow } from "@/services/onboarding/role-detection";

// Detect user's role and get recommended flow
const roleDetection = await detectOnboardingFlow(userId);

// Use the recommended flow
await onboardingService.initializeOnboarding(
  userId,
  roleDetection.recommendedFlow
);
```

## Role Detection Result

```typescript
interface RoleDetectionResult {
  isAdmin: boolean; // Has admin or superadmin role
  isUser: boolean; // Has user capabilities (always true)
  isDualRole: boolean; // Has both admin and user roles
  cognitoRole: UserRole; // Actual role from Cognito
  recommendedFlow: OnboardingFlowType; // 'user', 'admin', or 'both'
}
```

## Flow Types

| Role         | Recommended Flow | Description                      |
| ------------ | ---------------- | -------------------------------- |
| `user`       | `user`           | Standard user onboarding         |
| `admin`      | `both`           | Admin flow first, then user flow |
| `superadmin` | `both`           | Admin flow first, then user flow |

## Common Patterns

### Pattern 1: Simple Flow Detection

```typescript
const { recommendedFlow } = await detectOnboardingFlow(userId);
await onboardingService.initializeOnboarding(userId, recommendedFlow);
```

### Pattern 2: Dual Role Flow Choice

```typescript
import {
  detectOnboardingFlow,
  shouldShowFlowChoice,
  getFlowChoiceOptions,
} from "@/services/onboarding/role-detection";

const roleDetection = await detectOnboardingFlow(userId);

if (shouldShowFlowChoice(roleDetection, false)) {
  // Show flow choice screen
  const options = getFlowChoiceOptions();
  // Let user choose: 'both', 'admin', or 'user'
  const chosenFlow = await showFlowChoiceUI(options);
  await onboardingService.initializeOnboarding(userId, chosenFlow);
} else {
  // Use recommended flow
  await onboardingService.initializeOnboarding(
    userId,
    roleDetection.recommendedFlow
  );
}
```

### Pattern 3: Dual Role Flow Progression

```typescript
import { getNextFlowForDualRole } from "@/services/onboarding/role-detection";

const state = await onboardingService.getOnboardingState(userId);

if (state.flowType === "both") {
  const nextFlow = getNextFlowForDualRole(
    state.metadata?.adminFlowComplete || false,
    state.metadata?.userFlowComplete || false
  );

  if (nextFlow === "admin") {
    // Show admin onboarding steps
  } else if (nextFlow === "user") {
    // Show user onboarding steps
  } else {
    // Both flows complete
    await onboardingService.completeOnboarding(userId);
  }
}
```

### Pattern 4: Flow Validation

```typescript
import { isFlowTypeValid } from "@/services/onboarding/role-detection";

const roleDetection = await detectOnboardingFlow(userId);
const requestedFlow = "admin"; // From user input

if (isFlowTypeValid(requestedFlow, roleDetection)) {
  await onboardingService.initializeOnboarding(userId, requestedFlow);
} else {
  throw new Error("User does not have permission for this flow");
}
```

## Helper Functions

### Display Helpers

```typescript
import {
  getFlowDisplayName,
  getFlowDescription,
} from "@/services/onboarding/role-detection";

const name = getFlowDisplayName("user"); // "User Onboarding"
const desc = getFlowDescription("admin"); // "Learn how to manage users..."
```

### Completion Tracking

```typescript
import { areBothFlowsComplete } from "@/services/onboarding/role-detection";

const isComplete = areBothFlowsComplete(
  state.metadata?.adminFlowComplete || false,
  state.metadata?.userFlowComplete || false
);

if (isComplete) {
  await onboardingService.completeOnboarding(userId);
}
```

## Error Handling

Role detection gracefully handles errors:

```typescript
try {
  const roleDetection = await detectOnboardingFlow(userId);
  // Use roleDetection
} catch (error) {
  // Error is thrown only for invalid input (empty userId)
  // Cognito errors are caught internally and default to 'user' role
  console.error("Invalid user ID:", error);
}
```

## Flow Choice Options

```typescript
import { getFlowChoiceOptions } from "@/services/onboarding/role-detection";

const options = getFlowChoiceOptions();
// Returns:
// [
//   {
//     flowType: 'both',
//     title: 'Complete Both Flows',
//     description: '...',
//     recommended: true,
//     icon: 'users-cog'
//   },
//   {
//     flowType: 'admin',
//     title: 'Admin Flow Only',
//     description: '...',
//     recommended: false,
//     icon: 'shield-check'
//   },
//   {
//     flowType: 'user',
//     title: 'User Flow Only',
//     description: '...',
//     recommended: false,
//     icon: 'user'
//   }
// ]
```

## Metadata Structure

For dual role users, track completion in metadata:

```typescript
interface OnboardingMetadata {
  adminFlowComplete?: boolean;
  userFlowComplete?: boolean;
  // ... other metadata
}

// Update metadata when completing a flow
await onboardingService.updateMetadata(userId, {
  adminFlowComplete: true,
});
```

## Testing

```typescript
// Mock Cognito client in tests
jest.mock("@/aws/auth/cognito-client", () => ({
  getCognitoClient: jest.fn(() => ({
    getUserRole: jest.fn().mockResolvedValue("admin"),
  })),
}));

// Test role detection
const result = await detectOnboardingFlow("test-user");
expect(result.recommendedFlow).toBe("both");
```

## Important Notes

1. **Admin Credentials Required**: Role detection uses `AdminGetUserCommand` which requires admin credentials
2. **Fallback Behavior**: If Cognito fetch fails, defaults to `user` role (least privileged)
3. **Flow Ordering**: For dual role users, admin flow always comes before user flow
4. **Caching**: Role detection result should be cached in onboarding state
5. **Server-Side Only**: Never trust client-side role detection - always verify server-side

## API Reference

### `detectOnboardingFlow(userId: string): Promise<RoleDetectionResult>`

Detects user role from Cognito and determines recommended flow.

**Parameters:**

- `userId`: User ID (Cognito username/sub)

**Returns:** `RoleDetectionResult` with role information and recommended flow

**Throws:** Error if userId is invalid (empty or whitespace)

### `getFlowChoiceOptions(): FlowChoiceOption[]`

Returns flow choice options for dual role users.

**Returns:** Array of 3 flow choice options

### `isFlowTypeValid(flowType: OnboardingFlowType, roleDetection: RoleDetectionResult): boolean`

Validates if a flow type is appropriate for a user's roles.

**Parameters:**

- `flowType`: Flow type to validate
- `roleDetection`: User's role detection result

**Returns:** `true` if flow type is valid for user

### `shouldShowFlowChoice(roleDetection: RoleDetectionResult, hasStartedOnboarding: boolean): boolean`

Determines if user should see flow choice screen.

**Parameters:**

- `roleDetection`: User's role detection result
- `hasStartedOnboarding`: Whether user has started onboarding

**Returns:** `true` if flow choice screen should be shown

### `getNextFlowForDualRole(adminFlowComplete: boolean, userFlowComplete: boolean): OnboardingFlowType | null`

Determines next flow for dual role users.

**Parameters:**

- `adminFlowComplete`: Whether admin flow is complete
- `userFlowComplete`: Whether user flow is complete

**Returns:** Next flow type or `null` if both complete

### `areBothFlowsComplete(adminFlowComplete: boolean, userFlowComplete: boolean): boolean`

Checks if both flows are complete for dual role users.

**Parameters:**

- `adminFlowComplete`: Whether admin flow is complete
- `userFlowComplete`: Whether user flow is complete

**Returns:** `true` if both flows are complete

## See Also

- [Onboarding Service](./onboarding-service.ts)
- [Onboarding Types](../../types/onboarding.ts)
- [Task 3 Summary](../../.kiro/specs/user-onboarding/TASK_3_ROLE_DETECTION_SUMMARY.md)
