# Workflow Error Handling - Quick Start

## TL;DR

1. **Wrap workflow components** in `WorkflowErrorBoundary`
2. **Use `useWorkflowActionHandler`** for all workflow actions
3. **Server actions automatically retry** network/database errors
4. **Errors are logged** to CloudWatch automatically

## 3-Step Integration

### Step 1: Add Error Boundary

```tsx
import { WorkflowErrorBoundary } from "@/components/workflows/workflow-error-boundary";

function WorkflowPage() {
  const router = useRouter();

  return (
    <WorkflowErrorBoundary
      onRestart={() => router.push("/dashboard")}
      onReturnToDashboard={() => router.push("/dashboard")}
    >
      {/* Your workflow components */}
    </WorkflowErrorBoundary>
  );
}
```

### Step 2: Use Action Handler Hook

```tsx
import { useWorkflowActionHandler } from "@/hooks/use-workflow-action-handler";
import { startWorkflow } from "@/app/workflow-actions";

function MyComponent() {
  const { handleActionResult } = useWorkflowActionHandler();

  const handleClick = async () => {
    const formData = new FormData();
    formData.append("presetId", "my-preset");

    const result = await startWorkflow(null, formData);

    handleActionResult(result, {
      successMessage: "Success!",
      onSuccess: (data) => {
        // Handle success
      },
    });
  };

  return <button onClick={handleClick}>Start</button>;
}
```

### Step 3: That's It!

All error handling is automatic:

- ✅ Network errors retry automatically
- ✅ User sees toast notifications
- ✅ Errors logged to CloudWatch
- ✅ Concurrent updates detected
- ✅ Validation errors displayed

## Common Patterns

### Pattern: Form Submission

```tsx
const { handleActionResult } = useWorkflowActionHandler();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const formData = new FormData(e.target as HTMLFormElement);

  const result = await completeWorkflowStep(null, formData);
  handleActionResult(result, {
    successMessage: "Step completed!",
    onSuccess: () => router.push("/next-step"),
  });
};
```

### Pattern: Button Click

```tsx
const { executeAction } = useWorkflowActionHandler();

const handleClick = async () => {
  await executeAction(
    async () => {
      const formData = new FormData();
      formData.append("instanceId", id);
      return skipWorkflowStep(null, formData);
    },
    {
      successMessage: "Step skipped!",
    }
  );
};
```

### Pattern: Validation Errors

```tsx
const { handleActionResult } = useWorkflowActionHandler();
const [errors, setErrors] = useState({});

const handleSubmit = async (formData: FormData) => {
  const result = await someAction(null, formData);

  handleActionResult(result, {
    showErrorToast: false, // Don't show toast for validation
    onError: (error) => setErrors(error.errors),
  });
};
```

## Error Types

| Type              | Description        | Retryable | User Action     |
| ----------------- | ------------------ | --------- | --------------- |
| NETWORK           | Connection failed  | ✅ Yes    | Check internet  |
| DATABASE          | DynamoDB error     | ✅ Yes    | Try again       |
| CONCURRENT_UPDATE | Modified elsewhere | ✅ Yes    | Refresh & retry |
| VALIDATION        | Invalid input      | ❌ No     | Fix input       |
| NOT_FOUND         | Resource missing   | ❌ No     | Check ID        |
| UNAUTHORIZED      | No permission      | ❌ No     | Check auth      |
| UNKNOWN           | Other error        | ✅ Yes    | Try again       |

## What Gets Logged

Every error logs to CloudWatch with:

- Error type and message
- User ID and workflow instance ID
- Stack trace
- Operation name
- Timestamp

## Need More?

See `ERROR_HANDLING_GUIDE.md` for:

- Detailed examples
- Testing strategies
- Advanced patterns
- Monitoring setup
