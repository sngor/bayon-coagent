# Hub Workflow Integration

This directory contains components and utilities for integrating guided workflows into hub pages.

## Quick Links

- **[Quick Start Guide](./WORKFLOW_QUICK_START.md)** - Get started in 5 minutes
- **[Integration Guide](./WORKFLOW_INTEGRATION_GUIDE.md)** - Comprehensive documentation
- **[Task Summary](./../../../.kiro/specs/guided-workflows/TASK_18_SUMMARY.md)** - Implementation details
- **[Verification Checklist](./../../../.kiro/specs/guided-workflows/TASK_18_VERIFICATION.md)** - Testing checklist

## Overview

The workflow integration system allows hub pages to seamlessly participate in guided multi-step workflows. When a user is in a workflow, the hub page automatically:

- Displays a progress tracker showing all steps
- Pre-populates forms with context data from previous steps
- Provides help text and tips for the current step
- Handles step completion and navigation
- Auto-saves progress

## Key Components

### HubLayoutWithWorkflow

Main component that wraps hub layouts to add workflow support.

```tsx
import { HubLayoutWithWorkflow } from "@/components/hub/hub-layout-with-workflow";
import { WorkflowProvider } from "@/contexts/workflow-context";

<WorkflowProvider>
  <HubLayoutWithWorkflow {...props}>{children}</HubLayoutWithWorkflow>
</WorkflowProvider>;
```

### Workflow Context Hooks

Hooks for accessing workflow state in hub pages.

```tsx
import { useWorkflowContext } from "@/hooks/use-workflow-context";

const { isInWorkflowMode, getContext, hasContext, contextData } =
  useWorkflowContext();
```

## Examples

### Brand Hub

See `src/app/(app)/brand/layout-with-workflow-example.tsx`

### Studio Hub

See `src/app/(app)/studio/layout-with-workflow-example.tsx`

## Architecture

```
WorkflowProvider (Context)
  └── HubLayoutWithWorkflow
      ├── WorkflowProgressTracker (when in workflow mode)
      └── Hub Page Content
          └── Uses useWorkflowContext() hook
```

## URL Structure

Workflow mode is activated via URL parameters:

```
/[hub]/[page]?workflowInstanceId=[id]&workflowStepId=[stepId]
```

Example:

```
/brand/profile?workflowInstanceId=abc123&workflowStepId=profile-setup
```

## Requirements Satisfied

- ✅ 2.1: Progress tracker display in hub layouts
- ✅ 2.2: Workflow state persistence
- ✅ 4.3: Context data pre-population
- ✅ 4.4: Context data propagation
- ✅ 4.5: Context data updates

## Files

### Components

- `hub-layout-with-workflow.tsx` - Main workflow layout component
- `hub-layout.tsx` - Base hub layout (unchanged)
- `hub-tabs.tsx` - Hub tabs component (unchanged)

### Hooks

- `../../hooks/use-workflow-context.ts` - Workflow context hooks

### Examples

- `../../app/(app)/brand/layout-with-workflow-example.tsx` - Brand hub example
- `../../app/(app)/studio/layout-with-workflow-example.tsx` - Studio hub example

### Documentation

- `WORKFLOW_QUICK_START.md` - 5-minute setup guide
- `WORKFLOW_INTEGRATION_GUIDE.md` - Comprehensive guide
- `WORKFLOW_README.md` - This file

## Getting Started

1. Read the [Quick Start Guide](./WORKFLOW_QUICK_START.md)
2. Update your hub layout to use `HubLayoutWithWorkflow`
3. Add workflow context hooks to your pages
4. Test with a workflow URL

## Support

For questions or issues:

1. Check the [Integration Guide](./WORKFLOW_INTEGRATION_GUIDE.md)
2. Review the [examples](<../../app/(app)/brand/layout-with-workflow-example.tsx>)
3. See the [verification checklist](./../../../.kiro/specs/guided-workflows/TASK_18_VERIFICATION.md)
