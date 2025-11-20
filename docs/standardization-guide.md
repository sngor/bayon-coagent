# Component Standardization Guide

This guide explains how to use standardized, reusable components to maintain consistency across the Bayon Coagent application.

## Overview

The `/src/components/shared` directory contains standardized components that eliminate duplication and ensure consistent patterns throughout the app.

## Core Shared Components

### 1. AIFormWrapper

**Purpose:** Standardized layout for AI generation forms with input on left and output on right.

**Use when:**

- Building AI content generation features
- Need consistent form/output layout
- Want built-in loading, error, and empty states

**Example:**

```tsx
import { AIFormWrapper } from "@/components/shared";
import { useAIGeneration } from "@/components/shared";
import { Home } from "lucide-react";

function MyAIForm() {
  const { output, isLoading, error, generate, copied, copyToClipboard } =
    useAIGeneration({
      onGenerate: async (input) => {
        const result = await generateContentAction(input);
        return result.data;
      },
    });

  return (
    <AIFormWrapper
      formTitle="Generate Content"
      formDescription="Enter your details below"
      formContent={
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generate({
              /* your input */
            });
          }}
        >
          {/* Your form fields */}
        </form>
      }
      outputTitle="Generated Content"
      output={output || ""}
      isLoading={isLoading}
      error={error}
      onCopy={() => copyToClipboard(output || "")}
      copied={copied}
      emptyStateIcon={<Home className="w-8 h-8 text-primary" />}
      emptyStateTitle="Your content will appear here"
      loadingMessage="Generating your content..."
    />
  );
}
```

**Props:**

- `formTitle`, `formDescription`: Form section header
- `formContent`: Your form JSX
- `outputTitle`, `outputDescription`: Output section header
- `output`: Generated content string
- `isLoading`, `error`: State management
- `onCopy`, `onSave`, `onDownload`: Action handlers
- `emptyStateIcon`, `emptyStateTitle`: Customize empty state
- `loadingMessage`: Custom loading text
- `outputEditable`: Allow editing output (default: true)

### 2. useAIGeneration Hook

**Purpose:** Reusable hook for AI generation workflows with loading, error handling, and toast notifications.

**Use when:**

- Building any AI generation feature
- Need consistent error handling
- Want automatic toast notifications

**Example:**

```tsx
import { useAIGeneration } from "@/components/shared";

function MyComponent() {
  const {
    output,
    setOutput,
    isLoading,
    error,
    generate,
    reset,
    copied,
    copyToClipboard,
  } = useAIGeneration({
    onGenerate: async (input) => {
      const result = await myServerAction(input);
      return result.data;
    },
    onSuccess: (output) => {
      console.log("Generated:", output);
    },
    successTitle: "Content Generated!",
    successDescription: "Your content is ready",
    errorTitle: "Generation Failed",
  });

  return (
    <div>
      <button onClick={() => generate({ prompt: "test" })}>Generate</button>
      {output && <div>{output}</div>}
    </div>
  );
}
```

**Returns:**

- `output`: Generated content
- `setOutput`: Manually set output
- `isLoading`: Loading state
- `error`: Error message
- `generate`: Function to trigger generation
- `reset`: Reset all state
- `copied`: Copy state
- `copyToClipboard`: Copy function with toast

### 3. FormSection

**Purpose:** Standardized form section with consistent styling and optional icon.

**Use when:**

- Building multi-section forms
- Need consistent card-based form layout
- Want to group related form fields

**Example:**

```tsx
import { FormSection, FormSectionGroup } from "@/components/shared";
import { User, Building, MapPin } from "lucide-react";

function ProfileForm() {
  return (
    <FormSectionGroup
      title="Profile Settings"
      description="Manage your professional information"
    >
      <FormSection
        title="Personal Information"
        description="Your basic details"
        icon={<User className="h-5 w-5 text-primary" />}
      >
        {/* Form fields */}
      </FormSection>

      <FormSection
        title="Business Information"
        description="Your brokerage details"
        icon={<Building className="h-5 w-5 text-primary" />}
      >
        {/* Form fields */}
      </FormSection>
    </FormSectionGroup>
  );
}
```

### 4. ActionButtons

**Purpose:** Standardized action buttons with consistent patterns for primary, secondary, and quick actions.

**Use when:**

- Need consistent button layouts
- Building forms with multiple actions
- Want copy/save/download functionality

**Example:**

```tsx
import { ActionButtons, ActionButtonPresets } from "@/components/shared";
import { Sparkles } from "lucide-react";

function MyForm() {
  const [copied, setCopied] = useState(false);

  return (
    <form>
      {/* Form fields */}

      <ActionButtons
        {...ActionButtonPresets.generateAI}
        primaryLabel="Generate"
        onPrimaryClick={handleGenerate}
        primaryLoading={isLoading}
        secondaryLabel="Cancel"
        onSecondaryClick={handleCancel}
        onCopy={handleCopy}
        onSave={handleSave}
        copied={copied}
        alignment="right"
      />
    </form>
  );
}
```

**Presets:**

- `ActionButtonPresets.generateAI`: AI generation button
- `ActionButtonPresets.saveForm`: Save/Cancel buttons
- `ActionButtonPresets.deleteConfirm`: Delete/Cancel buttons

### 5. DataTable

**Purpose:** Standardized data table with sorting, search, and responsive mobile view.

**Use when:**

- Displaying tabular data
- Need sorting and search functionality
- Want automatic mobile card view

**Example:**

```tsx
import { DataTable } from "@/components/shared";
import { Edit, Trash2 } from "lucide-react";

function ContentList() {
  const columns = [
    { key: "title", label: "Title", sortable: true },
    {
      key: "status",
      label: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    { key: "createdAt", label: "Created", sortable: true, mobileHidden: true },
  ];

  const actions = [
    {
      label: "Edit",
      icon: <Edit className="mr-2 h-4 w-4" />,
      onClick: handleEdit,
    },
    {
      label: "Delete",
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      onClick: handleDelete,
      variant: "destructive",
    },
  ];

  return (
    <DataTable
      data={items}
      columns={columns}
      actions={actions}
      searchable
      searchPlaceholder="Search content..."
      emptyState={<div>No content found</div>}
    />
  );
}
```

### 6. StatusBadge

**Purpose:** Consistent status badges with predefined colors and icons.

**Use when:**

- Displaying status information
- Need consistent status styling
- Want automatic icon selection

**Example:**

```tsx
import { StatusBadge } from "@/components/shared";

function ContentCard() {
  return (
    <div>
      <StatusBadge status="published" />
      <StatusBadge status="draft" />
      <StatusBadge status="processing" showIcon={false} />
      <StatusBadge status="success" label="Completed" />
    </div>
  );
}
```

**Available statuses:**

- `success`, `error`, `warning`, `info`
- `pending`, `processing`
- `active`, `inactive`
- `draft`, `published`

### 7. ConfirmationDialog

**Purpose:** Standardized confirmation dialog for destructive or important actions.

**Use when:**

- Need user confirmation before action
- Performing destructive operations
- Want consistent confirmation UX

**Example:**

```tsx
import { ConfirmationDialog } from "@/components/shared";

function DeleteButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await deleteItemAction(itemId);
    setLoading(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Delete</Button>

      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Item"
        description="This action cannot be undone. Are you sure?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
        loading={loading}
      />
    </>
  );
}
```

## Migration Examples

### Before: Duplicate Form Pattern

```tsx
// Old way - duplicated across multiple files
function OldForm() {
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateAction(data);
      setOutput(result.data);
      toast({ title: "Success" });
    } catch (err) {
      setError(err.message);
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast({ title: "Copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Input</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {/* form fields */}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : null}
              Generate
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Output</CardTitle>
          {output && (
            <Button onClick={copyToClipboard}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : output ? (
            <Textarea value={output} />
          ) : (
            <div>Empty state</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### After: Using Shared Components

```tsx
// New way - standardized and reusable
import { AIFormWrapper, useAIGeneration } from "@/components/shared";

function NewForm() {
  const { output, isLoading, error, generate, copied, copyToClipboard } =
    useAIGeneration({
      onGenerate: async (data) => {
        const result = await generateAction(data);
        return result.data;
      },
    });

  return (
    <AIFormWrapper
      formTitle="Input"
      formContent={
        <form
          onSubmit={(e) => {
            e.preventDefault();
            generate(formData);
          }}
        >
          {/* form fields */}
          <Button type="submit">Generate</Button>
        </form>
      }
      outputTitle="Output"
      output={output || ""}
      isLoading={isLoading}
      error={error}
      onCopy={() => copyToClipboard(output || "")}
      copied={copied}
    />
  );
}
```

## Best Practices

### 1. Always Use Shared Components First

Before creating a new component, check if a shared component exists:

```tsx
// ❌ Don't create custom implementations
function MyCustomTable() {
  /* ... */
}

// ✅ Use shared components
import { DataTable } from "@/components/shared";
```

### 2. Compose Shared Components

Build complex UIs by composing shared components:

```tsx
import { FormSection, ActionButtons, StatusBadge } from "@/components/shared";

function ComplexForm() {
  return (
    <FormSection title="Settings">
      <StatusBadge status="active" />
      {/* form fields */}
      <ActionButtons {...ActionButtonPresets.saveForm} />
    </FormSection>
  );
}
```

### 3. Extend, Don't Duplicate

If you need custom behavior, extend shared components:

```tsx
import { AIFormWrapper } from "@/components/shared";

function CustomAIForm(props) {
  return (
    <AIFormWrapper
      {...props}
      // Add custom props
      outputEditable={false}
      className="custom-class"
    />
  );
}
```

### 4. Use TypeScript Types

Import and use provided types:

```tsx
import type { DataTableColumn, StatusType } from "@/components/shared";

const columns: DataTableColumn<MyType>[] = [
  { key: "name", label: "Name", sortable: true },
];
```

### 5. Consistent Imports

Always import from the index file:

```tsx
// ✅ Good
import {
  AIFormWrapper,
  useAIGeneration,
  FormSection,
} from "@/components/shared";

// ❌ Avoid
import { AIFormWrapper } from "@/components/shared/ai-form-wrapper";
```

## Component Decision Tree

```
Need to display data?
├─ Tabular data → DataTable
├─ Status info → StatusBadge
└─ Metrics → MetricCard (from ui)

Need a form?
├─ AI generation → AIFormWrapper + useAIGeneration
├─ Multi-section → FormSection + FormSectionGroup
└─ Standard → StandardFormField + StandardFormActions

Need actions?
├─ Multiple buttons → ActionButtons
├─ Confirmation → ConfirmationDialog
└─ Single button → Button (from ui)

Need layout?
├─ Hub page → HubLayout (from hub)
├─ Standard page → StandardPageLayout (from standard)
└─ Form section → FormSection
```

## Migration Checklist

When refactoring existing components:

- [ ] Identify duplicate patterns
- [ ] Check if shared component exists
- [ ] Replace custom implementation with shared component
- [ ] Test functionality
- [ ] Update imports
- [ ] Remove unused code
- [ ] Update tests if needed

## Additional Resources

- [Component Library](./component-library.md) - Complete component reference
- [Standard Components](./component-library.md#standard-components) - Pre-configured components
- [Hub Components](./component-library.md#hub-components) - Hub-specific layouts
