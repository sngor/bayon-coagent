# Workflow Components

This directory contains components for the Guided Workflows feature.

## Components

### DashboardWorkflowWidget

The main dashboard widget for displaying and managing workflows.

**Features:**

- Grid/list view toggle for workflow display
- Category filtering (Brand Building, Content Creation, Market Analysis, Client Acquisition)
- Search with debouncing (300ms delay)
- Workflow preset cards with:
  - Title, description, icon
  - Estimated time and step count
  - Category badge
  - Recommended badge for suggested workflows
  - Hover preview showing key outcomes
- Active workflow instances with:
  - Progress bars showing completion percentage
  - Remaining time calculation
  - Resume buttons
- Completed workflows with:
  - Completion date
  - Restart buttons
- Stale workflows (inactive >30 days) with:
  - Days since last activity
  - Resume and archive options

**Usage:**

```tsx
import { DashboardWorkflowWidget } from "@/components/workflows";

function DashboardPage() {
  const { user } = useUser();
  const [activeInstances, setActiveInstances] = useState<WorkflowInstance[]>(
    []
  );

  const handleStartWorkflow = async (presetId: string) => {
    // Call server action to start workflow
    const formData = new FormData();
    formData.append("presetId", presetId);
    const result = await startWorkflow(null, formData);

    if (result.success) {
      // Navigate to first step or refresh instances
    }
  };

  const handleResumeWorkflow = async (instanceId: string) => {
    // Call server action to resume workflow
    const formData = new FormData();
    formData.append("instanceId", instanceId);
    const result = await resumeWorkflow(null, formData);

    if (result.success) {
      // Navigate to current step
    }
  };

  const handleViewDetails = (presetId: string) => {
    // Open workflow detail modal
    setSelectedPreset(presetId);
    setIsDetailModalOpen(true);
  };

  const handleRestartWorkflow = async (instanceId: string) => {
    // Call server action to restart workflow
    const formData = new FormData();
    formData.append("instanceId", instanceId);
    const result = await restartWorkflow(null, formData);

    if (result.success) {
      // Navigate to first step of new instance
    }
  };

  const handleArchiveWorkflow = async (instanceId: string) => {
    // Call server action to archive workflow
    const formData = new FormData();
    formData.append("instanceId", instanceId);
    const result = await archiveWorkflow(null, formData);

    if (result.success) {
      // Refresh instances
    }
  };

  return (
    <DashboardWorkflowWidget
      userId={user.id}
      activeInstances={activeInstances}
      onStartWorkflow={handleStartWorkflow}
      onResumeWorkflow={handleResumeWorkflow}
      onViewDetails={handleViewDetails}
      onRestartWorkflow={handleRestartWorkflow}
      onArchiveWorkflow={handleArchiveWorkflow}
    />
  );
}
```

**Props:**

| Prop                | Type                           | Required | Description                               |
| ------------------- | ------------------------------ | -------- | ----------------------------------------- |
| `userId`            | `string`                       | Yes      | User ID for fetching workflow instances   |
| `activeInstances`   | `WorkflowInstance[]`           | Yes      | Array of active workflow instances        |
| `onStartWorkflow`   | `(presetId: string) => void`   | Yes      | Callback when user starts a workflow      |
| `onResumeWorkflow`  | `(instanceId: string) => void` | Yes      | Callback when user resumes a workflow     |
| `onViewDetails`     | `(presetId: string) => void`   | Yes      | Callback when user views workflow details |
| `onRestartWorkflow` | `(instanceId: string) => void` | No       | Callback when user restarts a workflow    |
| `onArchiveWorkflow` | `(instanceId: string) => void` | No       | Callback when user archives a workflow    |

**Server Actions:**

The component integrates with the following server actions from `/src/app/workflow-actions.ts`:

- `startWorkflow(prevState, formData)` - Creates a new workflow instance
- `resumeWorkflow(prevState, formData)` - Resumes an existing workflow
- `restartWorkflow(prevState, formData)` - Creates a new instance from a completed workflow
- `archiveWorkflow(prevState, formData)` - Archives a stale workflow

**State Management:**

The component uses local state for:

- View mode (grid/list)
- Selected category filter
- Search query with debouncing

Parent components should manage:

- Active workflow instances (fetch from server)
- Navigation to workflow steps
- Modal state for workflow details

**Styling:**

The component uses:

- Tailwind CSS for styling
- Framer Motion for animations
- shadcn/ui components (Card, Button, Badge, Progress, Input, Select)
- Lucide icons

**Responsive Design:**

- Mobile: Single column layout
- Tablet: 2 columns for grid view
- Desktop: 3 columns for grid view
- List view: Always single column

**Accessibility:**

- Keyboard navigation supported
- ARIA labels on interactive elements
- Focus management
- Screen reader compatible

## Future Components

The following components will be added in subsequent tasks:

- `WorkflowDetailModal` - Modal for viewing workflow details before starting
- `WorkflowProgressTracker` - Visual step-by-step progress indicator
- `WorkflowCompletionSummary` - Completion celebration and summary
- `WorkflowHelpPanel` - Contextual help and tips for each step
- `WorkflowErrorBoundary` - Error handling for workflow components

## Testing

Unit tests for workflow components are located in:

- `src/components/workflows/__tests__/`

Property-based tests for workflow logic are in:

- `src/lib/__tests__/workflow-*.test.ts`

## Related Files

- Types: `src/types/workflows.ts`
- Presets: `src/lib/workflow-presets.ts`
- State Management: `src/lib/workflow-state-manager.ts`
- Server Actions: `src/app/workflow-actions.ts`
- Repository: `src/aws/dynamodb/workflow-repository.ts`
