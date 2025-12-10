# Workflow Integration Quick Start

## 5-Minute Setup Guide

### Step 1: Update Your Hub Layout (2 minutes)

```tsx
// Before
import { HubLayout } from "@/components/hub/hub-layout";

export default function MyHubLayout({ children }) {
  return (
    <HubLayout title="My Hub" icon={MyIcon} tabs={tabs}>
      {children}
    </HubLayout>
  );
}

// After
import { HubLayoutWithWorkflow } from "@/components/hub/hub-layout-with-workflow";
import { WorkflowProvider } from "@/contexts/workflow-context";

export default function MyHubLayout({ children }) {
  return (
    <WorkflowProvider>
      <HubLayoutWithWorkflow title="My Hub" icon={MyIcon} tabs={tabs}>
        {children}
      </HubLayoutWithWorkflow>
    </WorkflowProvider>
  );
}
```

### Step 2: Use Workflow Context in Your Page (3 minutes)

```tsx
import { useWorkflowContext } from "@/hooks/use-workflow-context";

export default function MyPage() {
  const { isInWorkflowMode, getContext, hasContext } = useWorkflowContext();

  // Pre-populate form with workflow context
  const initialData = hasContext("myData") ? getContext("myData") : {};

  return (
    <div>
      {isInWorkflowMode && <p>You're in a workflow! 🎉</p>}
      <MyForm initialData={initialData} />
    </div>
  );
}
```

### That's It! 🚀

Your hub now supports workflows. When users access your page with workflow parameters, they'll see:

- Progress tracker showing all steps
- Help text and tips
- Auto-save functionality
- Context data from previous steps

## Common Use Cases

### Pre-populate a Form

```tsx
const { getContext } = useWorkflowContext();
const [formData, setFormData] = useState(getContext("formData", {}));
```

### Get All Step Inputs

```tsx
import { useWorkflowStepInputs } from "@/hooks/use-workflow-context";

const stepInputs = useWorkflowStepInputs();
// Contains all context data this step expects
```

### Check if in Workflow Mode

```tsx
const { isInWorkflowMode } = useWorkflowContext();

if (isInWorkflowMode) {
  // Show workflow-specific UI
}
```

### Provide Context Data

```tsx
// In layout.tsx
const getWorkflowContext = () => ({
  myData: currentPageData,
});

<HubLayoutWithWorkflow getWorkflowContext={getWorkflowContext} {...props} />;
```

## Testing Your Integration

1. Start a workflow from the dashboard
2. Navigate to your hub page
3. Verify progress tracker appears
4. Check that context data pre-populates
5. Complete the step and verify navigation

## Need More Help?

See `WORKFLOW_INTEGRATION_GUIDE.md` for detailed documentation.
