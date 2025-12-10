# Workflow Integration Guide for Hub Pages

This guide explains how to integrate guided workflows into hub pages using the `HubLayoutWithWorkflow` component and workflow context hooks.

## Overview

The workflow integration system provides:

- Automatic workflow detection via URL parameters
- Progress tracker display in hub layouts
- Context data pre-population for forms
- Step completion callbacks
- Navigation between workflow steps

## Components

### 1. HubLayoutWithWorkflow

A wrapper around `HubLayout` that adds workflow integration capabilities.

**Location**: `src/components/hub/hub-layout-with-workflow.tsx`

**Features**:

- Detects workflow query parameters (`workflowInstanceId`, `workflowStepId`)
- Loads workflow instance and preset
- Displays progress tracker when in workflow mode
- Handles step completion and navigation
- Provides context data to child components

### 2. Workflow Context Hooks

**Location**: `src/hooks/use-workflow-context.ts`

**Hooks**:

- `useWorkflowContext()` - Main hook for accessing workflow state
- `useWorkflowStepInputs()` - Get context inputs for current step
- `useIsWorkflowStep(hubRoute)` - Check if page is active workflow step

## Integration Steps

### Step 1: Update Hub Layout

Replace `HubLayout` with `HubLayoutWithWorkflow` in your hub's layout file.

**Before**:

```tsx
// src/app/(app)/brand/layout.tsx
import { HubLayoutWithFavorites } from "@/components/hub/hub-layout-with-favorites";

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HubLayoutWithFavorites
      title="Brand Identity & Strategy"
      description="Own your market position"
      icon={Target}
      tabs={tabs}
    >
      {children}
    </HubLayoutWithFavorites>
  );
}
```

**After**:

```tsx
// src/app/(app)/brand/layout.tsx
"use client";

import { HubLayoutWithWorkflow } from "@/components/hub/hub-layout-with-workflow";
import { WorkflowProvider } from "@/contexts/workflow-context";

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkflowProvider>
      <HubLayoutWithWorkflow
        title="Brand Identity & Strategy"
        description="Own your market position"
        icon={Target}
        tabs={tabs}
      >
        {children}
      </HubLayoutWithWorkflow>
    </WorkflowProvider>
  );
}
```

**Important**: Wrap with `WorkflowProvider` to enable workflow context.

### Step 2: Use Workflow Context in Pages

Use the `useWorkflowContext` hook to access workflow data and pre-populate forms.

**Example**: Brand Profile Page with Workflow Integration

```tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useWorkflowContext } from "@/hooks/use-workflow-context";
import { useUser } from "@/aws/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProfilePage() {
  const { user } = useUser();
  const { isInWorkflowMode, getContext, hasContext, contextData } =
    useWorkflowContext();

  // Pre-populate form with workflow context
  const initialProfile = useMemo(() => {
    if (isInWorkflowMode && hasContext("profileData")) {
      return getContext("profileData", {});
    }
    return {};
  }, [isInWorkflowMode, hasContext, getContext]);

  const [profile, setProfile] = useState(initialProfile);

  // Update form when context changes
  useEffect(() => {
    if (isInWorkflowMode && hasContext("profileData")) {
      setProfile(getContext("profileData", {}));
    }
  }, [isInWorkflowMode, hasContext, getContext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Save profile data
    // ... your save logic here

    // If in workflow mode, the HubLayoutWithWorkflow will handle
    // step completion and navigation automatically
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        name="name"
        value={profile.name || ""}
        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        placeholder="Your name"
      />

      {/* Show workflow-specific UI */}
      {isInWorkflowMode && (
        <div className="mt-4 p-4 bg-primary/10 rounded-lg">
          <p className="text-sm text-muted-foreground">
            You're completing this as part of a workflow
          </p>
        </div>
      )}

      <Button type="submit">
        {isInWorkflowMode ? "Continue Workflow" : "Save Profile"}
      </Button>
    </form>
  );
}
```

### Step 3: Provide Context Data on Completion

Use the `getWorkflowContext` callback to provide context data when a step is completed.

```tsx
"use client";

import { HubLayoutWithWorkflow } from "@/components/hub/hub-layout-with-workflow";
import { WorkflowProvider } from "@/contexts/workflow-context";
import { useState } from "react";

export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentFormData, setCurrentFormData] = useState({});

  // Provide context data when step is completed
  const getWorkflowContext = () => {
    return {
      profileData: currentFormData,
      timestamp: new Date().toISOString(),
    };
  };

  // Handle step completion
  const handleStepComplete = (stepId: string, data?: Record<string, any>) => {
    console.log("Step completed:", stepId, data);
    // Optional: perform additional actions on step completion
  };

  return (
    <WorkflowProvider>
      <HubLayoutWithWorkflow
        title="Brand Identity & Strategy"
        description="Own your market position"
        icon={Target}
        tabs={tabs}
        getWorkflowContext={getWorkflowContext}
        onWorkflowStepComplete={handleStepComplete}
      >
        {children}
      </HubLayoutWithWorkflow>
    </WorkflowProvider>
  );
}
```

### Step 4: Access Specific Step Context

Use `getStepContext` to access data from a specific previous step.

```tsx
const { getStepContext } = useWorkflowContext();

// Get data from the profile setup step
const profileData = getStepContext("profile-setup");

if (profileData) {
  console.log("Profile data from previous step:", profileData);
}
```

### Step 5: Use Step Inputs Hook

Use `useWorkflowStepInputs` to automatically get all expected inputs for the current step.

```tsx
import { useWorkflowStepInputs } from "@/hooks/use-workflow-context";

export default function MyPage() {
  // Automatically gets all context data that this step expects
  const stepInputs = useWorkflowStepInputs();

  // stepInputs will contain data from previous steps
  // based on the step's contextInputs definition
  const [formData, setFormData] = useState(stepInputs);

  return <form>{/* Form fields pre-populated with stepInputs */}</form>;
}
```

## URL Parameters

When a page is in workflow mode, the URL will contain:

- `workflowInstanceId` - The unique ID of the workflow instance
- `workflowStepId` - The ID of the current step

Example:

```
/brand/profile?workflowInstanceId=abc123&workflowStepId=profile-setup
```

## Workflow Progress Tracker

The progress tracker is automatically displayed when in workflow mode. It shows:

- All workflow steps with visual indicators (completed, current, upcoming, skipped)
- Estimated time remaining
- Help text and tips for the current step
- Skip button for optional steps
- Navigation to completed steps

## Context Data Flow

1. **Step 1**: User completes form → Data saved as `contextOutputs`
2. **Step 2**: Page loads → `contextInputs` pre-populate form with data from Step 1
3. **Step 2**: User completes form → New data added to context
4. **Step 3**: Page loads → Gets data from both Step 1 and Step 2

## Best Practices

### 1. Always Check Workflow Mode

```tsx
const { isInWorkflowMode } = useWorkflowContext();

if (isInWorkflowMode) {
  // Show workflow-specific UI
}
```

### 2. Provide Meaningful Context Keys

Use descriptive keys that match the workflow preset's `contextOutputs`:

```tsx
const getWorkflowContext = () => ({
  profileData: profile, // Good: descriptive
  auditResults: auditData, // Good: descriptive
  data: someData, // Bad: too generic
});
```

### 3. Handle Missing Context Gracefully

```tsx
const profileData = getContext("profileData", {
  name: "",
  email: "",
  // ... default values
});
```

### 4. Update Context When Data Changes

If the user modifies data from a previous step, update the context:

```tsx
const { isInWorkflowMode } = useWorkflowContext();

const handleDataChange = (newData) => {
  setData(newData);

  if (isInWorkflowMode) {
    // Context will be updated on next save/completion
  }
};
```

### 5. Test Both Modes

Always test your pages in both workflow mode and standalone mode:

```tsx
// Standalone: /brand/profile
// Workflow: /brand/profile?workflowInstanceId=abc&workflowStepId=profile-setup
```

## Complete Example

See `src/app/(app)/brand/profile/page.tsx` for a complete example of workflow integration.

## Troubleshooting

### Progress Tracker Not Showing

- Ensure `WorkflowProvider` wraps the layout
- Check URL contains both `workflowInstanceId` and `workflowStepId`
- Verify workflow instance exists in database

### Context Data Not Pre-populating

- Check `contextInputs` in workflow preset definition
- Verify previous step saved data with matching `contextOutputs` keys
- Use `console.log(contextData)` to debug available context

### Navigation Not Working

- Ensure step IDs match between URL and workflow preset
- Check that steps are marked as completed before navigating back
- Verify `hubRoute` in step definition matches actual route

## API Reference

### useWorkflowContext()

```typescript
interface UseWorkflowContextReturn {
  isInWorkflowMode: boolean;
  workflowInstanceId: string | null;
  workflowStepId: string | null;
  contextData: Record<string, any>;
  getContext: <T>(key: string, defaultValue?: T) => T;
  hasContext: (key: string) => boolean;
  getStepContext: (stepId: string) => Record<string, any> | null;
  isWorkflowLoaded: boolean;
  currentStep: WorkflowStepDefinition | null;
  preset: WorkflowPreset | null;
}
```

### useWorkflowStepInputs()

```typescript
function useWorkflowStepInputs(): Record<string, any>;
```

Returns all context data that the current step expects as input.

### useIsWorkflowStep(hubRoute)

```typescript
function useIsWorkflowStep(hubRoute: string): boolean;
```

Checks if the current page is the active step in a workflow.

## Related Files

- `src/components/hub/hub-layout-with-workflow.tsx` - Main workflow layout component
- `src/hooks/use-workflow-context.ts` - Workflow context hooks
- `src/contexts/workflow-context.tsx` - Workflow context provider
- `src/components/workflows/workflow-progress-tracker.tsx` - Progress tracker UI
- `src/lib/workflow-state-manager.ts` - State management utilities
- `src/app/workflow-actions.ts` - Server actions for workflows
