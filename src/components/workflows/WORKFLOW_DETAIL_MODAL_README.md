# WorkflowDetailModal Component

## Overview

The `WorkflowDetailModal` component displays comprehensive information about a workflow preset before users start it. It provides a detailed view of steps, outcomes, prerequisites, and required integrations.

## Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Dialog (Modal)                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Header                                                  │ │
│ │ ┌─────┐                                                 │ │
│ │ │Icon │ Title                    [Recommended Badge]   │ │
│ │ └─────┘ Description                                    │ │
│ │                                                         │ │
│ │ [⏱ 30 min] [3 steps] [Brand Building]                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ─────────────────────────────────────────────────────────── │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Scrollable Content                                      │ │
│ │                                                         │ │
│ │ Workflow Steps                                          │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ ① First Step                    [Optional]          │ │ │
│ │ │   Description                                       │ │ │
│ │ │   ⏱ 10 min                                          │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ ② Second Step                                       │ │ │
│ │ │   Description                                       │ │ │
│ │ │   ⏱ 15 min                                          │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ Expected Outcomes                                       │ │
│ │ ✓ Outcome 1                                            │ │
│ │ ✓ Outcome 2                                            │ │
│ │ ✓ Outcome 3                                            │ │
│ │                                                         │ │
│ │ Prerequisites                                           │ │
│ │ ⚠ Prerequisite 1                                       │ │
│ │ ⚠ Prerequisite 2                                       │ │
│ │                                                         │ │
│ │ Required Integrations                                   │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ ✓ Google Business Profile      [Connected]         │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ ✗ Facebook                     [Not Connected]      │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ ⚠ Some integrations are not connected...              │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ─────────────────────────────────────────────────────────── │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Footer                                                  │ │
│ │                          [Cancel] [Start Workflow →]   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Props

### `WorkflowDetailModalProps`

| Prop                  | Type                         | Required | Description                            |
| --------------------- | ---------------------------- | -------- | -------------------------------------- |
| `open`                | `boolean`                    | Yes      | Whether the modal is open              |
| `onOpenChange`        | `(open: boolean) => void`    | Yes      | Callback when modal should close       |
| `preset`              | `WorkflowPreset \| null`     | Yes      | Workflow preset to display             |
| `onStartWorkflow`     | `(presetId: string) => void` | Yes      | Callback when user starts the workflow |
| `integrationStatuses` | `IntegrationStatus[]`        | No       | Integration connection statuses        |

### `IntegrationStatus`

| Property      | Type      | Description                                              |
| ------------- | --------- | -------------------------------------------------------- |
| `id`          | `string`  | Integration identifier (e.g., 'google-business-profile') |
| `name`        | `string`  | Display name                                             |
| `isConnected` | `boolean` | Whether the integration is connected                     |

## Features

### 1. Workflow Information Display

- **Title & Description**: Clear heading with descriptive text
- **Icon**: Visual identifier for the workflow type
- **Badges**: Recommended, category, time, and step count
- **Responsive**: Adapts to different screen sizes

### 2. Step-by-Step Breakdown

- **Numbered Steps**: Sequential display with step numbers
- **Step Details**: Title, description, and estimated time
- **Optional Indicators**: Visual badge for optional steps
- **Scrollable**: Handles workflows with many steps

### 3. Expected Outcomes

- **Deliverables List**: What users will accomplish
- **Visual Checkmarks**: Clear indication of outcomes
- **Organized Display**: Easy to scan list format

### 4. Prerequisites

- **Conditional Display**: Only shown if prerequisites exist
- **Warning Icons**: Visual emphasis for important requirements
- **Clear Communication**: Helps users prepare before starting

### 5. Integration Status

- **Connection Indicators**: Visual status for each integration
- **Color Coding**: Green for connected, orange for not connected
- **Warning Messages**: Alerts when integrations are missing
- **Graceful Fallback**: Handles missing status data

### 6. User Actions

- **Start Workflow**: Primary action button
- **Cancel**: Secondary action to close modal
- **Auto-Close**: Modal closes after starting workflow

## Usage

### Basic Usage

```typescript
import { useState } from "react";
import { WorkflowDetailModal } from "@/components/workflows";
import { WorkflowPreset } from "@/types/workflows";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<WorkflowPreset | null>(
    null
  );

  const handleStartWorkflow = (presetId: string) => {
    console.log("Starting workflow:", presetId);
    // Create workflow instance and navigate to first step
  };

  return (
    <WorkflowDetailModal
      open={isOpen}
      onOpenChange={setIsOpen}
      preset={selectedPreset}
      onStartWorkflow={handleStartWorkflow}
    />
  );
}
```

### With Integration Status

```typescript
import { WorkflowDetailModal, IntegrationStatus } from "@/components/workflows";

const integrationStatuses: IntegrationStatus[] = [
  {
    id: "google-business-profile",
    name: "Google Business Profile",
    isConnected: true,
  },
  {
    id: "facebook",
    name: "Facebook",
    isConnected: false,
  },
];

<WorkflowDetailModal
  open={isOpen}
  onOpenChange={setIsOpen}
  preset={selectedPreset}
  onStartWorkflow={handleStartWorkflow}
  integrationStatuses={integrationStatuses}
/>;
```

### Integration with Dashboard Widget

```typescript
import { DashboardWorkflowWidget } from "@/components/workflows";
import { WorkflowDetailModal } from "@/components/workflows";

function Dashboard() {
  const [selectedPreset, setSelectedPreset] = useState<WorkflowPreset | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (presetId: string) => {
    const preset = ALL_WORKFLOW_PRESETS.find((p) => p.id === presetId);
    setSelectedPreset(preset || null);
    setIsModalOpen(true);
  };

  return (
    <>
      <DashboardWorkflowWidget
        userId={userId}
        activeInstances={instances}
        onStartWorkflow={handleStartWorkflow}
        onResumeWorkflow={handleResumeWorkflow}
        onViewDetails={handleViewDetails}
      />

      <WorkflowDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        preset={selectedPreset}
        onStartWorkflow={handleStartWorkflow}
        integrationStatuses={integrationStatuses}
      />
    </>
  );
}
```

## Styling

The component uses Tailwind CSS and follows the project's design system:

- **Colors**: Primary, secondary, muted, green (success), orange (warning)
- **Spacing**: Consistent padding and gaps
- **Typography**: Font weights and sizes from design system
- **Borders**: Rounded corners and subtle borders
- **Shadows**: Elevation for modal overlay

## Accessibility

- **Keyboard Navigation**: Full keyboard support via Radix UI Dialog
- **Focus Management**: Automatic focus trapping in modal
- **ARIA Labels**: Proper labeling for screen readers
- **Color Contrast**: WCAG compliant color combinations
- **Close Button**: Visible X button in top-right corner

## Responsive Design

- **Mobile (< 768px)**: Full-width modal with vertical scrolling
- **Tablet (768px - 1024px)**: Centered modal with max-width
- **Desktop (> 1024px)**: Centered modal with max-width of 2xl

## Performance

- **useMemo**: Computed values cached (total time, integration status)
- **Conditional Rendering**: Sections only render when data exists
- **Lazy Loading**: Modal content only renders when open
- **Optimized Re-renders**: Callbacks memoized in parent components

## Testing

Comprehensive test suite with 19 tests covering:

- Component rendering
- Data display
- User interactions
- Edge cases
- Requirement validation

Run tests:

```bash
npm test -- --testPathPattern="workflow-detail-modal"
```

## Related Components

- `DashboardWorkflowWidget`: Displays workflow cards and triggers modal
- `WorkflowProgressTracker`: Shows progress during workflow execution
- `WorkflowCompletionSummary`: Displays summary after completion

## Requirements Mapping

| Requirement | Description                  | Implementation                     |
| ----------- | ---------------------------- | ---------------------------------- |
| 1.2         | Display workflow details     | Title, description, icon, badges   |
| 8.1         | Display estimated total time | Total minutes badge in header      |
| 8.2         | Display step times           | Individual time for each step      |
| 13.2        | Step-by-step breakdown       | Numbered steps with details        |
| 13.3        | Expected deliverables        | Outcomes section with checkmarks   |
| 13.4        | Prerequisites                | Conditional prerequisites section  |
| 13.5        | Integration requirements     | Integration status with indicators |

## Future Enhancements

- [ ] Add preview images for workflow steps
- [ ] Add video tutorials or help links
- [ ] Add estimated difficulty level
- [ ] Add user ratings and reviews
- [ ] Add "Save for Later" functionality
- [ ] Add social sharing capabilities
