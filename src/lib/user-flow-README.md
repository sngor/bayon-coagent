# User Flow Management System

A comprehensive system for guiding users through the application with intelligent suggestions, prerequisite checks, contextual help, and quick actions.

## Overview

The User Flow Management System provides:

- **Next Steps Suggestions**: Intelligent recommendations based on user progress and context
- **Prerequisite Checks**: Ensure requirements are met before allowing actions
- **Contextual Help**: Page-specific guidance and tips
- **Breadcrumb Navigation**: Track user's journey through the application
- **Quick Actions Menu**: Fast access to common tasks

## Requirements

This system implements the following requirements from the UI/UX Enhancement spec:

- **Requirement 20.1**: Guide users to the next logical step after completing profile setup
- **Requirement 20.2**: Suggest related actions after generating marketing content
- **Requirement 20.3**: Ensure prerequisites are met before allowing actions
- **Requirement 20.4**: Provide contextual help based on current page and user state
- **Requirement 20.5**: Offer quick actions menu for common next steps

## Core Components

### 1. UserFlowManager Class (`src/lib/user-flow.ts`)

The main class that manages user flow logic.

```typescript
import { createUserFlowManager } from "@/lib/user-flow";

const flowManager = createUserFlowManager(
  "/dashboard", // current page
  profile, // user profile
  hasMarketingPlan, // boolean flags
  hasBrandAudit,
  hasCompetitors,
  hasContent
);

// Get next steps
const nextSteps = flowManager.getNextSteps();

// Check prerequisites
const { canProceed, prerequisites } = flowManager.checkPrerequisites(
  "generate-marketing-plan"
);

// Get contextual help
const help = flowManager.getContextualHelp();

// Get quick actions
const quickActions = flowManager.getQuickActions();

// Get breadcrumbs
const breadcrumbs = flowManager.getBreadcrumbs();
```

### 2. useUserFlow Hook (`src/hooks/use-user-flow.ts`)

React hook for easy integration in components.

```typescript
import { useUserFlow } from "@/hooks/use-user-flow";

function MyComponent() {
  const {
    nextSteps,
    contextualHelp,
    quickActions,
    breadcrumbs,
    checkPrerequisites,
  } = useUserFlow({
    profile,
    hasMarketingPlan: true,
    hasBrandAudit: false,
  });

  return (
    <div>
      <NextStepsCard steps={nextSteps} />
      {contextualHelp && <ContextualHelp help={contextualHelp} />}
    </div>
  );
}
```

## UI Components

### NextStepsCard

Displays suggested next steps with priority levels and prerequisites.

```typescript
import { NextStepsCard } from "@/components/ui/next-steps-card";

<NextStepsCard steps={nextSteps} maxVisible={3} showPrerequisites={true} />;
```

**Features:**

- Priority-based visual styling (high, medium, low)
- Expandable prerequisite details
- Time estimates for each step
- Automatic sorting by priority

### NextStepBanner

Compact banner for displaying the top next step in page headers.

```typescript
import { NextStepBanner } from "@/components/ui/next-steps-card";

<NextStepBanner step={topNextStep} />;
```

### ContextualHelp

Displays page-specific help information.

```typescript
import { ContextualHelp } from "@/components/ui/contextual-help";

<ContextualHelp help={contextualHelp} />;
```

**Features:**

- Page title and description
- Helpful tips list
- Related page links
- Collapsible option

### PrerequisiteCheck

Shows prerequisite requirements and their status.

```typescript
import { PrerequisiteCheck } from "@/components/ui/prerequisite-check";

<PrerequisiteCheck
  actionTitle="Generate Marketing Plan"
  prerequisites={prerequisites}
  canProceed={canProceed}
  onProceed={() => handleProceed()}
  proceedLabel="Continue"
/>;
```

**Features:**

- Visual status indicators (completed/incomplete)
- Quick links to complete missing items
- Proceed button (enabled when all met)
- Clear messaging about remaining requirements

### QuickActionsMenu

Dropdown menu with quick access to common actions.

```typescript
import { QuickActionsMenu } from "@/components/ui/quick-actions-menu";

<QuickActionsMenu actions={quickActions} />;
```

**Features:**

- Grouped by category (profile, marketing, content, analysis)
- Badge showing action count
- Icon support for each action
- Responsive dropdown

### QuickActionsBar

Compact horizontal bar for mobile devices.

```typescript
import { QuickActionsBar } from "@/components/ui/quick-actions-menu";

<QuickActionsBar actions={quickActions} />;
```

## Usage Examples

### Basic Integration

```typescript
"use client";

import { useUserFlow } from "@/hooks/use-user-flow";
import { NextStepsCard } from "@/components/ui/next-steps-card";
import { ContextualHelp } from "@/components/ui/contextual-help";
import { QuickActionsMenu } from "@/components/ui/quick-actions-menu";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export default function DashboardPage() {
  const profile = useProfile(); // Your profile hook

  const { nextSteps, contextualHelp, quickActions, breadcrumbs } = useUserFlow({
    profile,
    hasMarketingPlan: !!marketingPlan,
    hasBrandAudit: !!brandAudit,
    hasCompetitors: competitors.length > 0,
    hasContent: content.length > 0,
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex justify-between">
        <h1>Dashboard</h1>
        <QuickActionsMenu actions={quickActions} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <NextStepsCard steps={nextSteps} />
        {contextualHelp && <ContextualHelp help={contextualHelp} />}
      </div>
    </div>
  );
}
```

### Checking Prerequisites Before Action

```typescript
"use client";

import { useUserFlow } from "@/hooks/use-user-flow";
import { PrerequisiteCheck } from "@/components/ui/prerequisite-check";
import { useState } from "react";

export default function MarketingPlanPage() {
  const [showPrereqCheck, setShowPrereqCheck] = useState(false);
  const { checkPrerequisites } = useUserFlow({ profile });

  const handleGeneratePlan = () => {
    const { canProceed, prerequisites } = checkPrerequisites(
      "generate-marketing-plan"
    );

    if (!canProceed) {
      setShowPrereqCheck(true);
      return;
    }

    // Proceed with generation
    generateMarketingPlan();
  };

  const prereqs = checkPrerequisites("generate-marketing-plan");

  return (
    <div>
      {showPrereqCheck && !prereqs.canProceed ? (
        <PrerequisiteCheck
          actionTitle="Generate Marketing Plan"
          prerequisites={prereqs.prerequisites}
          canProceed={prereqs.canProceed}
          onProceed={() => {
            setShowPrereqCheck(false);
            generateMarketingPlan();
          }}
        />
      ) : (
        <Button onClick={handleGeneratePlan}>Generate Marketing Plan</Button>
      )}
    </div>
  );
}
```

### Custom Next Steps Logic

```typescript
import { createUserFlowManager } from "@/lib/user-flow";

// Create custom flow manager
const flowManager = createUserFlowManager(
  pathname,
  profile,
  hasMarketingPlan,
  hasBrandAudit,
  hasCompetitors,
  hasContent
);

// Get next steps
const allSteps = flowManager.getNextSteps();

// Filter to only high priority
const highPrioritySteps = allSteps.filter((step) => step.priority === "high");

// Get only steps with met prerequisites
const readySteps = allSteps.filter((step) => step.prerequisitesMet);
```

## Priority Levels

The system uses three priority levels for next steps:

### High Priority (Red/Primary)

- Critical actions for getting started
- Blocking prerequisites (e.g., complete profile)
- Essential features (e.g., generate marketing plan)

### Medium Priority (Blue)

- Important actions to enhance presence
- Recommended features (e.g., analyze competitors)
- Profile enhancements

### Low Priority (Gray)

- Optional improvements
- Additional features
- Nice-to-have enhancements

## Prerequisite System

### Built-in Prerequisites

The system includes built-in prerequisite checks for common actions:

- **generate-marketing-plan**: Requires complete profile (name, agency, phone, address, bio)
- **run-brand-audit**: Requires NAP information (name, address, phone)
- **analyze-competitors**: Requires business address
- **create-content**: Requires basic profile (name, agency name)
- **track-rankings**: Requires competitors to be analyzed first

### Custom Prerequisites

You can add custom prerequisite checks by extending the `checkPrerequisites` method:

```typescript
// In your component
const customCheck = {
  canProceed: myCondition,
  prerequisites: [
    {
      id: "custom-prereq",
      description: "Custom requirement",
      met: myCondition,
      actionHref: "/custom-action",
      actionLabel: "Complete This",
    },
  ],
};
```

## Contextual Help

The system provides contextual help for these pages:

- `/dashboard` - Dashboard overview and getting started
- `/marketing-plan` - Marketing plan generation guidance
- `/brand-audit` - Brand audit tool instructions
- `/competitive-analysis` - Competitor analysis tips
- `/content-engine` - Content creation guidance
- `/profile` - Profile completion help
- `/research-agent` - Research agent usage
- `/knowledge-base` - Knowledge base navigation

### Adding Custom Help

To add help for a new page, update the `getContextualHelp` method in `UserFlowManager`:

```typescript
const helpContent: Record<string, ContextualHelp> = {
  "/your-page": {
    title: "Your Page Title",
    description: "Description of what this page does",
    tips: ["Tip 1", "Tip 2", "Tip 3"],
    relatedLinks: [{ label: "Related Page", href: "/related" }],
  },
};
```

## Quick Actions

Quick actions are automatically generated based on:

1. Profile completion status
2. Available features
3. Completed actions
4. Current page context

Actions are grouped into categories:

- **profile**: Profile-related actions
- **marketing**: Marketing strategy actions
- **content**: Content creation actions
- **analysis**: Analysis and research actions

## Breadcrumbs

Breadcrumbs are automatically generated based on the current route. The system maps routes to human-readable labels.

To add a new route to breadcrumbs, update the `routeLabels` object in the `getBreadcrumbs` method.

## Best Practices

### 1. Always Check Prerequisites

Before allowing users to start an action, check prerequisites:

```typescript
const { canProceed, prerequisites } = checkPrerequisites('action-id');

if (!canProceed) {
  // Show prerequisite check UI
  return <PrerequisiteCheck ... />;
}
```

### 2. Show Next Steps After Completion

After a user completes an action, show relevant next steps:

```typescript
const handleComplete = async () => {
  await completeAction();

  // Refresh next steps
  const updatedSteps = flowManager.getNextSteps();

  // Show top next step
  if (updatedSteps[0]) {
    showNextStepBanner(updatedSteps[0]);
  }
};
```

### 3. Use Contextual Help

Always show contextual help on complex pages:

```typescript
{
  contextualHelp && <ContextualHelp help={contextualHelp} />;
}
```

### 4. Provide Quick Actions

Include quick actions menu in page headers for easy navigation:

```typescript
<div className="flex justify-between">
  <h1>Page Title</h1>
  <QuickActionsMenu actions={quickActions} />
</div>
```

### 5. Track User Journey

Use breadcrumbs to help users understand their location:

```typescript
<Breadcrumbs items={breadcrumbs} />
```

## Demo Page

A comprehensive demo page is available at `/user-flow-demo` that showcases all features of the user flow system.

## Testing

The user flow system can be tested by:

1. Mocking different profile states (complete, incomplete, partial)
2. Testing prerequisite checks with various conditions
3. Verifying next steps change based on completed actions
4. Checking contextual help appears on correct pages
5. Ensuring quick actions update based on state

## Future Enhancements

Potential improvements to the system:

- [ ] Persist user journey history in database
- [ ] AI-powered next step suggestions based on usage patterns
- [ ] A/B testing for different suggestion strategies
- [ ] Analytics tracking for user flow effectiveness
- [ ] Customizable priority levels per user
- [ ] Time-based suggestions (e.g., "It's been a week since...")
- [ ] Gamification elements (badges, progress tracking)
- [ ] Multi-step wizards for complex actions
- [ ] Undo/redo functionality for actions
- [ ] Smart notifications for important next steps

## Support

For questions or issues with the user flow system, please refer to:

- Design document: `.kiro/specs/ui-ux-enhancement/design.md`
- Requirements: `.kiro/specs/ui-ux-enhancement/requirements.md`
- Task list: `.kiro/specs/ui-ux-enhancement/tasks.md`
