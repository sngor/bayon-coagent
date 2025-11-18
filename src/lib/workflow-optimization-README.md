# Workflow Optimization System

## Overview

The Workflow Optimization System provides intelligent workflow detection, shortcuts, contextual assistance, and step-by-step guidance for complex tasks. It learns from user behavior to suggest optimizations and helps users when they get stuck.

**Requirements:** 27.6, 27.12

## Features

### 1. Workflow Pattern Detection

Automatically detects common sequences of actions users perform:

- **Profile → Marketing Plan → Content Creation**
- **Brand Audit → Competitive Analysis → Marketing Plan**
- **Research → Content Creation**

### 2. Workflow Shortcuts

Suggests quick actions based on detected patterns:

- Context-aware shortcuts for the current page
- Time-saving estimates for each shortcut
- One-click navigation to next logical step

### 3. Stuck Detection

Identifies when users need help:

- Long time on page without action (>3 minutes)
- Missing prerequisites
- Repeated visits without completion

Provides contextual assistance:

- Tutorial links
- Help documentation
- Support contact
- Prerequisite completion shortcuts

### 4. Complex Task Guidance

Step-by-step instructions for complex workflows:

- **Complete Your Professional Profile**
- **Generate Your First Marketing Plan**
- **Create Your First Marketing Content**

Each task includes:

- Detailed instructions
- Helpful tips
- Estimated time per step
- Progress tracking
- Help links

### 5. Workflow Efficiency Score

Calculates a 0-100 score based on:

- Profile completion (40 points)
- Feature usage diversity (30 points)
- Workflow pattern adoption (30 points)

## Usage

### Basic Hook Usage

```typescript
import { useWorkflowOptimization } from "@/hooks/use-workflow-optimization";

function MyComponent() {
  const {
    patterns,
    shortcuts,
    stuckDetection,
    optimizations,
    efficiencyScore,
    getGuidance,
    updateStep,
  } = useWorkflowOptimization({
    profile,
    hasCompletedAction: false,
  });

  return (
    <div>
      <p>Efficiency Score: {efficiencyScore}%</p>
      {/* Display shortcuts, optimizations, etc. */}
    </div>
  );
}
```

### Display Optimization Panel

```typescript
import { WorkflowOptimizationPanel } from "@/components/ui/workflow-optimization-panel";

<WorkflowOptimizationPanel
  shortcuts={shortcuts}
  stuckDetection={stuckDetection}
  optimizations={optimizations}
  efficiencyScore={efficiencyScore}
  onDismiss={() => setShowPanel(false)}
/>;
```

### Show Task Guidance

```typescript
import { TaskGuidance } from "@/components/ui/task-guidance";

const guidance = getGuidance("setup-complete-profile");

<TaskGuidance
  guidance={guidance}
  onStepComplete={(stepId) => {
    const updated = updateStep(guidance, stepId, true);
    setGuidance(updated);
  }}
  onClose={() => setGuidance(null)}
/>;
```

## Available Task Guidance

### 1. Complete Your Professional Profile

**Task ID:** `setup-complete-profile`

Steps:

1. Add Basic Information (2 min)
2. Add Contact Information (3 min)
3. Write Your Bio and Expertise (5 min)
4. Connect Social Media (2 min)

**Total Time:** 10-15 minutes

### 2. Generate Your First Marketing Plan

**Task ID:** `generate-first-marketing-plan`

Steps:

1. Run Brand Audit (3 min)
2. Analyze Competitors - Optional (2 min)
3. Generate Marketing Plan (2 min)

**Total Time:** 5-7 minutes

**Prerequisites:** Complete profile with NAP information

### 3. Create Your First Marketing Content

**Task ID:** `create-first-content`

Steps:

1. Choose Content Type (1 min)
2. Provide Content Details (3 min)
3. Review and Edit (3 min)
4. Save and Use (2 min)

**Total Time:** 5-10 minutes

**Prerequisites:** Complete profile

## API Reference

### `detectWorkflowPatterns()`

Detects common workflow patterns from usage history.

**Returns:** `WorkflowPattern[]`

### `suggestWorkflowShortcuts(currentFeature, patterns)`

Suggests shortcuts based on current feature and detected patterns.

**Parameters:**

- `currentFeature: string` - Current feature ID
- `patterns: WorkflowPattern[]` - Detected patterns

**Returns:** `WorkflowShortcut[]`

### `detectIfStuck(currentFeature, timeOnPage, profile, hasCompletedAction)`

Detects if user is stuck and provides assistance.

**Parameters:**

- `currentFeature: string` - Current feature ID
- `timeOnPage: number` - Time spent on page (ms)
- `profile: Partial<Profile> | null` - User profile
- `hasCompletedAction: boolean` - Whether user completed an action

**Returns:** `StuckDetection`

### `getComplexTaskGuidance(taskId)`

Gets step-by-step guidance for a complex task.

**Parameters:**

- `taskId: string` - Task identifier

**Returns:** `ComplexTaskGuidance | null`

### `updateGuidanceStep(guidance, stepId, completed)`

Updates completion status of a guidance step.

**Parameters:**

- `guidance: ComplexTaskGuidance` - Current guidance
- `stepId: string` - Step identifier
- `completed: boolean` - Completion status

**Returns:** `ComplexTaskGuidance`

### `getWorkflowOptimizations(currentFeature, profile, timeOnPage, hasCompletedAction)`

Gets all workflow optimizations for current context.

**Parameters:**

- `currentFeature: string` - Current feature ID
- `profile: Partial<Profile> | null` - User profile
- `timeOnPage: number` - Time spent on page (ms)
- `hasCompletedAction: boolean` - Whether user completed an action

**Returns:** `WorkflowOptimization[]`

### `getWorkflowEfficiencyScore(profile)`

Calculates workflow efficiency score (0-100).

**Parameters:**

- `profile: Partial<Profile> | null` - User profile

**Returns:** `number`

## Integration Examples

### Dashboard Integration

```typescript
import { useWorkflowOptimization } from "@/hooks/use-workflow-optimization";
import { WorkflowOptimizationPanel } from "@/components/ui/workflow-optimization-panel";

export function Dashboard({ profile }) {
  const { shortcuts, stuckDetection, optimizations, efficiencyScore } =
    useWorkflowOptimization({ profile });

  return (
    <div>
      {/* Dashboard content */}

      <WorkflowOptimizationPanel
        shortcuts={shortcuts}
        stuckDetection={stuckDetection}
        optimizations={optimizations}
        efficiencyScore={efficiencyScore}
      />
    </div>
  );
}
```

### Profile Page Integration

```typescript
import { useWorkflowOptimization } from "@/hooks/use-workflow-optimization";
import { TaskGuidance } from "@/components/ui/task-guidance";

export function ProfilePage({ profile }) {
  const { getGuidance, updateStep } = useWorkflowOptimization({ profile });
  const [guidance, setGuidance] = useState(
    getGuidance("setup-complete-profile")
  );

  if (!guidance) return null;

  return (
    <TaskGuidance
      guidance={guidance}
      onStepComplete={(stepId) => {
        const updated = updateStep(guidance, stepId, true);
        setGuidance(updated);
      }}
    />
  );
}
```

## Demo

Visit `/workflow-optimization-demo` to see the system in action.

## Architecture

The system consists of:

1. **Core Library** (`src/lib/workflow-optimization.ts`)

   - Pattern detection algorithms
   - Shortcut suggestion logic
   - Stuck detection heuristics
   - Task guidance definitions

2. **React Hook** (`src/hooks/use-workflow-optimization.ts`)

   - Easy integration with React components
   - Automatic time tracking
   - Memoized computations

3. **UI Components**

   - `WorkflowOptimizationPanel` - Floating assistance panel
   - `TaskGuidance` - Step-by-step guidance display

4. **Integration with Existing Systems**
   - Uses `usage-tracking.ts` for pattern detection
   - Uses `user-flow.ts` for prerequisite checking
   - Stores data in localStorage

## Best Practices

1. **Show panel contextually** - Only display when there are actionable suggestions
2. **Allow dismissal** - Users should be able to hide the panel
3. **Track completion** - Mark actions as completed to improve detection
4. **Update guidance** - Keep task guidance up-to-date with product changes
5. **Test patterns** - Verify pattern detection with real usage data

## Future Enhancements

- AI-powered suggestion generation using Bedrock
- Personalized workflow recommendations
- A/B testing of different guidance approaches
- Analytics dashboard for workflow insights
- Export workflow patterns for team sharing
