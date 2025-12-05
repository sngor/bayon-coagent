# Standardized Button Components

A collection of reusable, consistent button components used throughout the Bayon Coagent application.

## Overview

These components provide a standardized way to implement common button patterns across the application, ensuring:

- **Consistency**: Same look and feel everywhere
- **Accessibility**: Proper ARIA labels and keyboard support
- **Loading states**: Built-in loading indicators
- **Type safety**: Full TypeScript support
- **Easy to use**: Simple, intuitive API

## Installation

```tsx
import { SaveButton, CancelButton, FormActions } from "@/components/standard";
```

## Components

### Action Buttons

#### SaveButton

```tsx
<SaveButton onClick={handleSave} loading={isSaving} loadingText="Saving..." />
```

#### CancelButton

```tsx
<CancelButton onClick={handleCancel} />
```

#### DeleteButton

```tsx
<DeleteButton
  onClick={handleDelete}
  loading={isDeleting}
  loadingText="Deleting..."
/>
```

#### CreateButton

```tsx
<CreateButton onClick={handleCreate} loading={isCreating}>
  Create New Item
</CreateButton>
```

#### SubmitButton

```tsx
<SubmitButton loading={isSubmitting} loadingText="Submitting...">
  Submit Form
</SubmitButton>
```

#### BackButton / NextButton

```tsx
<BackButton onClick={handleBack} />
<NextButton onClick={handleNext}>Continue</NextButton>
```

#### DownloadButton / UploadButton

```tsx
<DownloadButton onClick={handleDownload} loading={isDownloading} />
<UploadButton onClick={handleUpload} loading={isUploading} />
```

#### CopyButton

```tsx
<CopyButton onClick={handleCopy} loading={isCopying} />
```

#### EditButton

```tsx
<EditButton onClick={handleEdit} />
```

#### RefreshButton

```tsx
<RefreshButton onClick={handleRefresh} loading={isRefreshing} />
```

#### SearchButton

```tsx
<SearchButton onClick={handleSearch} loading={isSearching} />
```

#### SendButton

```tsx
<SendButton onClick={handleSend} loading={isSending} />
```

### AI-Specific Buttons

#### GenerateButton

```tsx
<GenerateButton
  onClick={handleGenerate}
  loading={isGenerating}
  loadingText="Generating..."
>
  Generate Content
</GenerateButton>
```

#### AIButton

```tsx
<AIButton
  onClick={handleAIAction}
  loading={isProcessing}
  loadingText="Processing..."
>
  Analyze with AI
</AIButton>
```

### Form Button Groups

#### FormActions

Standardized form action buttons with consistent spacing and alignment.

```tsx
<FormActions
  onCancel={handleCancel}
  onSubmit={handleSubmit}
  submitText="Save Changes"
  cancelText="Cancel"
  isSubmitting={isSubmitting}
  submitLoadingText="Saving..."
  submitVariant="default"
  alignment="right"
/>
```

**Props:**

- `onCancel`: Cancel button click handler
- `onSubmit`: Submit button click handler
- `submitText`: Submit button text (default: "Submit")
- `cancelText`: Cancel button text (default: "Cancel")
- `isSubmitting`: Loading state (default: false)
- `submitLoadingText`: Loading text (default: "Submitting...")
- `submitVariant`: Button variant (default: "default")
- `alignment`: Button alignment - "left" | "right" | "between" | "center" (default: "right")
- `children`: Custom buttons (overrides default buttons)

**Alignment Options:**

```tsx
// Right aligned (default)
<FormActions alignment="right" onCancel={...} onSubmit={...} />

// Left aligned
<FormActions alignment="left" onCancel={...} onSubmit={...} />

// Space between
<FormActions alignment="between" onCancel={...} onSubmit={...} />

// Center aligned
<FormActions alignment="center" onCancel={...} onSubmit={...} />
```

**Custom Buttons:**

```tsx
<FormActions>
  <BackButton onClick={handleBack} />
  <div className="flex gap-2">
    <CancelButton onClick={handleCancel} />
    <SaveButton onClick={handleSave} loading={isSaving} />
  </div>
</FormActions>
```

#### DialogActions

Same as FormActions but with dialog-specific defaults.

```tsx
<DialogActions
  onClose={handleClose}
  onSubmit={handleSubmit}
  submitText="Confirm"
  closeText="Close"
  isSubmitting={isSubmitting}
/>
```

### Icon-Only Buttons

#### IconButton

Generic icon button with accessibility support.

```tsx
<IconButton
  icon={<Star className="h-4 w-4" />}
  label="Add to favorites"
  variant="ghost"
  onClick={handleFavorite}
/>
```

#### Pre-configured Icon Buttons

```tsx
<CloseIconButton onClick={handleClose} />
<DeleteIconButton onClick={handleDelete} />
<EditIconButton onClick={handleEdit} />
<CopyIconButton onClick={handleCopy} />
<RefreshIconButton onClick={handleRefresh} />
```

## Usage Examples

### Simple Form

```tsx
import { SaveButton, CancelButton } from "@/components/standard";

function MyForm() {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}

      <div className="flex gap-3 justify-end">
        <CancelButton onClick={handleCancel} />
        <SaveButton loading={isSaving} />
      </div>
    </form>
  );
}
```

### Using FormActions

```tsx
import { FormActions } from "@/components/standard";

function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}

      <FormActions
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitText="Save Changes"
      />
    </form>
  );
}
```

### Dialog with Actions

```tsx
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DialogActions } from "@/components/standard";

function MyDialog({ open, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        {/* dialog content */}

        <DialogFooter>
          <DialogActions
            onClose={onClose}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitText="Confirm"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### AI Generation Flow

```tsx
import { GenerateButton, RefreshButton } from "@/components/standard";

function AIContentGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState("");

  return (
    <div>
      <GenerateButton onClick={handleGenerate} loading={isGenerating} />

      {content && (
        <RefreshButton onClick={handleRegenerate} loading={isGenerating}>
          Regenerate
        </RefreshButton>
      )}
    </div>
  );
}
```

### Multi-Step Form

```tsx
import { BackButton, NextButton, SubmitButton } from "@/components/standard";

function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form onSubmit={handleSubmit}>
      {/* step content */}

      <div className="flex justify-between">
        {step > 1 && <BackButton onClick={() => setStep(step - 1)} />}

        <div className="flex gap-3 ml-auto">
          {step < 3 ? (
            <NextButton onClick={() => setStep(step + 1)} />
          ) : (
            <SubmitButton loading={isSubmitting} />
          )}
        </div>
      </div>
    </form>
  );
}
```

## Customization

All buttons accept standard Button props for customization:

```tsx
<SaveButton
  onClick={handleSave}
  loading={isSaving}
  size="lg"
  className="w-full"
  disabled={!isValid}
/>
```

## Button Variants

Available variants (from base Button component):

- `default` - Primary action
- `destructive` - Dangerous actions (delete, remove)
- `outline` - Secondary actions
- `secondary` - Alternative actions
- `ghost` - Minimal styling
- `link` - Link-style button
- `ai` - AI-powered actions (with gradient)
- `shimmer` - Loading state with shimmer effect
- `success` - Success actions
- `premium` - Premium features
- `glow` - Glowing effect
- `gradient-border` - Gradient border effect

## Sizes

Available sizes:

- `default` - Standard size (44px min-height)
- `sm` - Small (40px min-height)
- `lg` - Large (48px min-height)
- `xl` - Extra large (52px min-height)
- `icon` - Icon-only (44x44px)

## Best Practices

1. **Use semantic buttons**: Choose the button that matches the action (SaveButton for saving, DeleteButton for deleting, etc.)

2. **Always provide loading states**: Use the `loading` prop to show feedback during async operations

3. **Use FormActions for consistency**: Instead of manually arranging buttons, use FormActions or DialogActions

4. **Provide meaningful text**: Override default text when needed to be more specific

   ```tsx
   <SaveButton>Save Profile</SaveButton>
   <DeleteButton>Delete Account</DeleteButton>
   ```

5. **Use icon-only buttons sparingly**: Only for common actions where the icon is universally understood

6. **Maintain accessibility**: Icon buttons automatically include aria-label, but ensure all buttons have clear purposes

7. **Group related actions**: Use FormActions alignment options to properly group buttons
   ```tsx
   <FormActions alignment="between">
     <BackButton onClick={handleBack} />
     <div className="flex gap-2">
       <CancelButton onClick={handleCancel} />
       <SaveButton onClick={handleSave} />
     </div>
   </FormActions>
   ```

## Migration Guide

### Before (inconsistent)

```tsx
<Button onClick={handleSave} disabled={isSaving}>
  {isSaving ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    <>
      <Save className="mr-2 h-4 w-4" />
      Save
    </>
  )}
</Button>
```

### After (standardized)

```tsx
<SaveButton onClick={handleSave} loading={isSaving} />
```

### Before (manual layout)

```tsx
<div className="flex gap-3 justify-end">
  <Button variant="outline" onClick={handleCancel}>
    Cancel
  </Button>
  <Button onClick={handleSubmit} disabled={isSubmitting}>
    {isSubmitting ? "Submitting..." : "Submit"}
  </Button>
</div>
```

### After (using FormActions)

```tsx
<FormActions
  onCancel={handleCancel}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
/>
```

## Related Components

- `Button` - Base button component from shadcn/ui
- `ActionBar` - Layout component for action buttons (from `/components/layouts/action-bar.tsx`)
