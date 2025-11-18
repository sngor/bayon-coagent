# Workflow Optimization - Integration Examples

## Quick Start

### 1. Add to Dashboard

```typescript
// src/app/(app)/dashboard/page.tsx
"use client";

import { useState } from "react";
import { useWorkflowOptimization } from "@/hooks/use-workflow-optimization";
import { WorkflowOptimizationPanel } from "@/components/ui/workflow-optimization-panel";

export default function DashboardPage() {
  const [showPanel, setShowPanel] = useState(true);

  // Get user profile from your auth system
  const profile = useUser(); // Your existing hook

  const { shortcuts, stuckDetection, optimizations, efficiencyScore } =
    useWorkflowOptimization({
      profile,
      hasCompletedAction: false,
    });

  return (
    <div>
      {/* Your existing dashboard content */}
      <h1>Dashboard</h1>
      {/* ... */}

      {/* Add the floating optimization panel */}
      {showPanel && (
        <WorkflowOptimizationPanel
          shortcuts={shortcuts}
          stuckDetection={stuckDetection}
          optimizations={optimizations}
          efficiencyScore={efficiencyScore}
          onDismiss={() => setShowPanel(false)}
        />
      )}
    </div>
  );
}
```

### 2. Add Task Guidance to Profile Page

```typescript
// src/app/(app)/profile/page.tsx
"use client";

import { useState } from "react";
import { useWorkflowOptimization } from "@/hooks/use-workflow-optimization";
import { TaskGuidance } from "@/components/ui/task-guidance";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const profile = useUser();
  const { getGuidance, updateStep } = useWorkflowOptimization({ profile });

  const [guidance, setGuidance] = useState(
    getGuidance("setup-complete-profile")
  );
  const [showGuidance, setShowGuidance] = useState(true);

  // Check if profile is incomplete
  const isProfileIncomplete = !profile?.name || !profile?.bio;

  const handleStepComplete = (stepId: string) => {
    if (guidance) {
      const updated = updateStep(guidance, stepId, true);
      setGuidance(updated);
    }
  };

  return (
    <div>
      {/* Your existing profile form */}
      <h1>Profile</h1>

      {/* Show guidance button if profile incomplete */}
      {isProfileIncomplete && (
        <Button onClick={() => setShowGuidance(true)}>Show Setup Guide</Button>
      )}

      {/* Task guidance dialog */}
      <Dialog open={showGuidance} onOpenChange={setShowGuidance}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {guidance && (
            <TaskGuidance
              guidance={guidance}
              onStepComplete={handleStepComplete}
              onClose={() => setShowGuidance(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### 3. Add to Marketing Plan Page

```typescript
// src/app/(app)/marketing-plan/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useWorkflowOptimization } from "@/hooks/use-workflow-optimization";
import { TaskGuidance } from "@/components/ui/task-guidance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function MarketingPlanPage() {
  const profile = useUser();
  const [hasMarketingPlan, setHasMarketingPlan] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);

  const { getGuidance, updateStep, checkPrerequisites } =
    useWorkflowOptimization({
      profile,
      hasCompletedAction: hasMarketingPlan,
    });

  // Check prerequisites
  const prereqCheck = checkPrerequisites("generate-marketing-plan");

  // Show guidance for first-time users
  useEffect(() => {
    if (!hasMarketingPlan && prereqCheck.canProceed) {
      setShowGuidance(true);
    }
  }, [hasMarketingPlan, prereqCheck.canProceed]);

  const guidance = getGuidance("generate-first-marketing-plan");

  return (
    <div>
      <h1>Marketing Plan</h1>

      {/* Show prerequisite warning */}
      {!prereqCheck.canProceed && (
        <Alert>
          <AlertDescription>
            Please complete the following before generating your plan:
            <ul className="mt-2 space-y-1">
              {prereqCheck.prerequisites
                .filter((p) => !p.met)
                .map((p) => (
                  <li key={p.id}>
                    • {p.description}
                    {p.actionHref && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => (window.location.href = p.actionHref!)}
                      >
                        {p.actionLabel}
                      </Button>
                    )}
                  </li>
                ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Your existing marketing plan content */}
      {/* ... */}

      {/* Task guidance for first-time users */}
      {showGuidance && guidance && (
        <TaskGuidance
          guidance={guidance}
          onStepComplete={(stepId) => {
            const updated = updateStep(guidance, stepId, true);
            // Update guidance state
          }}
          onClose={() => setShowGuidance(false)}
        />
      )}
    </div>
  );
}
```

### 4. Track Feature Usage

```typescript
// Add to any feature page to track usage
import { useTrackFeature } from "@/hooks/use-usage-tracking";

export default function ContentEnginePage() {
  // Automatically track when user visits this page
  useTrackFeature(
    "content-engine",
    "Content Engine",
    "/content-engine",
    "content"
  );

  return <div>{/* Your content */}</div>;
}
```

### 5. Show Efficiency Score in Header

```typescript
// src/components/layouts/header.tsx
"use client";

import { useWorkflowOptimization } from "@/hooks/use-workflow-optimization";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

export function Header() {
  const profile = useUser();
  const { efficiencyScore } = useWorkflowOptimization({ profile });

  return (
    <header>
      {/* Your existing header content */}

      {/* Show efficiency score */}
      <Badge variant="outline" className="gap-1">
        <TrendingUp className="w-3 h-3" />
        Efficiency: {efficiencyScore}%
      </Badge>
    </header>
  );
}
```

## Advanced Usage

### Custom Stuck Detection

```typescript
import { detectIfStuck } from "@/lib/workflow-optimization";

function MyComponent() {
  const [timeOnPage, setTimeOnPage] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Custom stuck detection with your own logic
  const stuckDetection = detectIfStuck(
    "my-feature",
    timeOnPage,
    profile,
    hasCompleted
  );

  if (stuckDetection.isStuck) {
    // Show custom help UI
    return <CustomHelpDialog suggestions={stuckDetection.suggestions} />;
  }

  return <div>{/* Normal content */}</div>;
}
```

### Custom Task Guidance

```typescript
import {
  getComplexTaskGuidance,
  updateGuidanceStep,
} from "@/lib/workflow-optimization";

function CustomGuidanceFlow() {
  const [guidance, setGuidance] = useState(
    getComplexTaskGuidance("setup-complete-profile")
  );

  const handleComplete = (stepId: string) => {
    if (guidance) {
      const updated = updateGuidanceStep(guidance, stepId, true);
      setGuidance(updated);

      // Save progress to backend
      saveProgress(updated);

      // Show celebration for completion
      if (updated.steps.every((s) => s.completed)) {
        showConfetti();
      }
    }
  };

  return <div>{/* Custom guidance UI */}</div>;
}
```

### Pattern-Based Recommendations

```typescript
import {
  detectWorkflowPatterns,
  suggestWorkflowShortcuts,
} from "@/lib/workflow-optimization";

function SmartRecommendations() {
  const patterns = detectWorkflowPatterns();
  const shortcuts = suggestWorkflowShortcuts("current-feature", patterns);

  return (
    <div>
      <h2>Recommended Next Steps</h2>
      {shortcuts.map((shortcut) => (
        <Card key={shortcut.id}>
          <CardHeader>
            <CardTitle>{shortcut.title}</CardTitle>
            <CardDescription>{shortcut.description}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate(shortcut.action.href)}>
              {shortcut.action.label}
            </Button>
            <Badge>Saves {shortcut.estimatedTimeSaved}</Badge>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
```

### Efficiency Score Dashboard

```typescript
import { getWorkflowEfficiencyScore } from "@/lib/workflow-optimization";
import { Progress } from "@/components/ui/progress";

function EfficiencyDashboard() {
  const profile = useUser();
  const score = getWorkflowEfficiencyScore(profile);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Improvement";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Efficiency</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{score}%</span>
            <Badge className={getScoreColor(score)}>
              {getScoreLabel(score)}
            </Badge>
          </div>
          <Progress value={score} />
          <div className="text-sm text-muted-foreground">
            Complete your profile and use more features to improve your score
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Best Practices

### 1. Conditional Display

Only show the optimization panel when there are actionable suggestions:

```typescript
const hasContent =
  shortcuts.length > 0 || stuckDetection.isStuck || optimizations.length > 0;

{
  hasContent && <WorkflowOptimizationPanel {...props} />;
}
```

### 2. Persist Dismissal

Remember when users dismiss the panel:

```typescript
const [dismissed, setDismissed] = useState(() => {
  return localStorage.getItem("workflow-panel-dismissed") === "true";
});

const handleDismiss = () => {
  setDismissed(true);
  localStorage.setItem("workflow-panel-dismissed", "true");
};
```

### 3. Track Completion

Mark actions as completed to improve detection:

```typescript
const handleActionComplete = async () => {
  // Your action logic
  await generateMarketingPlan();

  // Track completion
  trackFeatureUsage("marketing-plan", "Marketing Plan", "/marketing-plan");

  // Update state
  setHasCompletedAction(true);
};
```

### 4. Progressive Disclosure

Show guidance progressively based on user level:

```typescript
const isNewUser = efficiencyScore < 40;
const isIntermediateUser = efficiencyScore >= 40 && efficiencyScore < 70;
const isPowerUser = efficiencyScore >= 70;

{
  isNewUser && <FullGuidance />;
}
{
  isIntermediateUser && <QuickTips />;
}
{
  isPowerUser && <AdvancedShortcuts />;
}
```

## Testing

### Unit Tests

```typescript
import {
  detectWorkflowPatterns,
  getWorkflowEfficiencyScore,
} from "@/lib/workflow-optimization";

describe("Workflow Optimization", () => {
  it("detects patterns from usage history", () => {
    const patterns = detectWorkflowPatterns();
    expect(patterns).toBeInstanceOf(Array);
  });

  it("calculates efficiency score correctly", () => {
    const profile = { name: "Test", agencyName: "Test Agency" };
    const score = getWorkflowEfficiencyScore(profile);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
```

### Integration Tests

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { WorkflowOptimizationPanel } from "@/components/ui/workflow-optimization-panel";

describe("WorkflowOptimizationPanel", () => {
  it("displays shortcuts", () => {
    const shortcuts = [
      {
        id: "test",
        title: "Test Shortcut",
        description: "Test description",
        fromFeature: "a",
        toFeature: "b",
        estimatedTimeSaved: "2 min",
        action: { label: "Go", href: "/test" },
      },
    ];

    render(
      <WorkflowOptimizationPanel
        shortcuts={shortcuts}
        stuckDetection={{ isStuck: false, reason: "", suggestions: [] }}
        optimizations={[]}
        efficiencyScore={75}
      />
    );

    expect(screen.getByText("Test Shortcut")).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Panel Not Showing

1. Check if there are shortcuts/optimizations
2. Verify profile data is loaded
3. Check localStorage for dismissal state

### Patterns Not Detected

1. Ensure usage tracking is working
2. Check localStorage for usage data
3. Verify sufficient usage history (need 2+ features)

### Stuck Detection Not Triggering

1. Verify time tracking is working
2. Check if prerequisites are met
3. Ensure hasCompletedAction is updated correctly

## Support

For questions or issues:

- Check the README: `src/lib/workflow-optimization-README.md`
- View the demo: `/workflow-optimization-demo`
- Review the visual guide: `TASK_72_VISUAL_GUIDE.md`
