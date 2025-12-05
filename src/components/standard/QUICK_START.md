# Standard Component Library - Quick Start Guide

## Installation

All components are already available in your project. Simply import them:

```tsx
import {
  StandardFormField,
  StandardLoadingState,
  StandardErrorDisplay,
  StandardEmptyState,
} from "@/components/standard";
```

## Quick Examples

### Form Field

```tsx
import { StandardFormField } from "@/components/standard";
import { Input } from "@/components/ui/input";

function MyForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  return (
    <StandardFormField
      label="Email Address"
      id="email"
      required
      error={error}
      helpText="We'll never share your email"
    >
      <Input
        type="email"
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </StandardFormField>
  );
}
```

### Loading State

```tsx
import { StandardLoadingState } from '@/components/standard';

// Spinner
<StandardLoadingState variant="spinner" size="md" text="Loading..." />

// Skeleton
<StandardLoadingState variant="skeleton" size="lg" />

// Full screen
<StandardLoadingState variant="spinner" fullScreen text="Processing..." />
```

### Error Display

```tsx
import { StandardErrorDisplay } from '@/components/standard';

// Error
<StandardErrorDisplay
  title="Failed to Load"
  message="Unable to fetch data. Please try again."
  variant="error"
  action={{ label: "Retry", onClick: handleRetry }}
/>

// Warning
<StandardErrorDisplay
  title="Unsaved Changes"
  message="You have unsaved changes."
  variant="warning"
/>

// Info
<StandardErrorDisplay
  title="New Feature"
  message="Check out our new feature!"
  variant="info"
/>
```

### Empty State

```tsx
import { StandardEmptyState } from "@/components/standard";
import { FileText } from "lucide-react";

<StandardEmptyState
  icon={FileText}
  title="No Content Yet"
  description="Create your first piece of content to get started."
  action={{
    label: "Create Content",
    onClick: handleCreate,
    variant: "default",
  }}
/>;
```

## Common Patterns

### Form with Loading and Error States

```tsx
function MyComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  if (loading) {
    return <StandardLoadingState variant="spinner" text="Loading data..." />;
  }

  if (error) {
    return (
      <StandardErrorDisplay
        title="Error"
        message={error}
        variant="error"
        action={{ label: "Retry", onClick: handleRetry }}
      />
    );
  }

  if (!data) {
    return (
      <StandardEmptyState
        icon={FileText}
        title="No Data"
        description="No data available yet."
      />
    );
  }

  return <div>{/* Render data */}</div>;
}
```

### Form Field with Validation

```tsx
function ValidatedForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError("Email is required");
    } else if (!value.includes("@")) {
      setEmailError("Please enter a valid email");
    } else {
      setEmailError("");
    }
  };

  return (
    <StandardFormField
      label="Email"
      id="email"
      required
      error={emailError}
      helpText="Enter your email address"
    >
      <Input
        type="email"
        id="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          validateEmail(e.target.value);
        }}
      />
    </StandardFormField>
  );
}
```

## Best Practices

1. **Always use StandardFormField for form inputs** - Ensures consistent styling and accessibility
2. **Use appropriate loading variants** - Spinner for quick loads, skeleton for content placeholders
3. **Match error variant to severity** - Error for failures, warning for cautions, info for notifications
4. **Provide action buttons when appropriate** - Help users recover from errors or take next steps
5. **Use design tokens** - All components use centralized design tokens for consistency

## Accessibility

All components include proper accessibility features:

- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader announcements
- Semantic HTML elements
- Focus management

## Demo

See `src/components/standard/demo.tsx` for a comprehensive showcase of all components.

## Support

For issues or questions, refer to:

- `IMPLEMENTATION_SUMMARY.md` - Detailed implementation documentation
- `README.md` - Component architecture and guidelines
- Design spec: `.kiro/specs/design-system-performance/design.md`
