# Migration Guide: Standardized Buttons

This guide helps you migrate existing button implementations to use the new standardized button components.

## Quick Reference

### Before → After

```tsx
// ❌ Before: Manual button with loading state
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

// ✅ After: Standardized button
<SaveButton onClick={handleSave} loading={isSaving} />
```

## Common Patterns

### 1. Save/Cancel Buttons

**Before:**

```tsx
<div className="flex gap-3 justify-end">
  <Button variant="outline" onClick={handleCancel}>
    Cancel
  </Button>
  <Button onClick={handleSave} disabled={isSaving}>
    {isSaving ? "Saving..." : "Save"}
  </Button>
</div>
```

**After:**

```tsx
import { FormActions } from "@/components/standard";

<FormActions
  onCancel={handleCancel}
  onSubmit={handleSave}
  submitText="Save"
  isSubmitting={isSaving}
/>;
```

### 2. Form Submit Buttons

**Before:**

```tsx
<Button type="submit" disabled={isPending}>
  {isPending ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Submitting...
    </>
  ) : (
    "Submit"
  )}
</Button>
```

**After:**

```tsx
import { SubmitButton } from "@/components/standard";

<SubmitButton loading={isPending} />;
```

### 3. Delete Buttons

**Before:**

```tsx
<Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
  {isDeleting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Deleting...
    </>
  ) : (
    <>
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </>
  )}
</Button>
```

**After:**

```tsx
import { DeleteButton } from "@/components/standard";

<DeleteButton onClick={handleDelete} loading={isDeleting} />;
```

### 4. AI Generate Buttons

**Before:**

```tsx
<Button variant="ai" disabled={isGenerating}>
  {isGenerating ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Generating...
    </>
  ) : (
    <>
      <Sparkles className="mr-2 h-4 w-4" />
      Generate
    </>
  )}
</Button>
```

**After:**

```tsx
import { GenerateButton } from "@/components/standard";

<GenerateButton onClick={handleGenerate} loading={isGenerating} />;
```

### 5. Dialog Actions

**Before:**

```tsx
<DialogFooter>
  <Button variant="outline" onClick={onClose}>
    Cancel
  </Button>
  <Button onClick={handleSubmit} disabled={isSubmitting}>
    {isSubmitting ? "Submitting..." : "Confirm"}
  </Button>
</DialogFooter>
```

**After:**

```tsx
import { DialogActions } from "@/components/standard";

<DialogFooter>
  <DialogActions
    onClose={onClose}
    onSubmit={handleSubmit}
    submitText="Confirm"
    isSubmitting={isSubmitting}
  />
</DialogFooter>;
```

### 6. Icon-Only Buttons

**Before:**

```tsx
<Button variant="ghost" size="icon" onClick={handleClose}>
  <X className="h-4 w-4" />
</Button>
```

**After:**

```tsx
import { CloseIconButton } from "@/components/standard";

<CloseIconButton onClick={handleClose} />;
```

## Step-by-Step Migration

### Step 1: Identify Button Patterns

Search your codebase for common patterns:

- `<Button.*variant="destructive"` → DeleteButton
- `<Button.*type="submit"` → SubmitButton
- `<Button.*variant="ai"` → GenerateButton or AIButton
- `<Button.*variant="outline".*Cancel` → CancelButton
- Manual loading states with Loader2 → Use loading prop

### Step 2: Update Imports

**Before:**

```tsx
import { Button } from "@/components/ui/button";
import { Loader2, Save, Trash2 } from "lucide-react";
```

**After:**

```tsx
import { SaveButton, DeleteButton, FormActions } from "@/components/standard";
// You may still need Button for custom cases
import { Button } from "@/components/ui/button";
```

### Step 3: Replace Button Groups

Look for multiple buttons grouped together and replace with FormActions:

**Before:**

```tsx
<div className="flex gap-3 justify-end pt-4">
  <Button variant="outline" onClick={handleCancel}>
    Cancel
  </Button>
  <Button onClick={handleSave} disabled={isSaving}>
    {isSaving ? "Saving..." : "Save"}
  </Button>
</div>
```

**After:**

```tsx
<FormActions
  onCancel={handleCancel}
  onSubmit={handleSave}
  submitText="Save"
  isSubmitting={isSaving}
  className="pt-4"
/>
```

### Step 4: Simplify Loading States

**Before:**

```tsx
const [isLoading, setIsLoading] = useState(false);

<Button onClick={handleAction} disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading...
    </>
  ) : (
    <>
      <Icon className="mr-2 h-4 w-4" />
      Action
    </>
  )}
</Button>;
```

**After:**

```tsx
const [isLoading, setIsLoading] = useState(false);

<ActionButton onClick={handleAction} loading={isLoading}>
  Action
</ActionButton>;
```

## File-by-File Examples

### Example 1: Form Component

**Before (`src/components/my-form.tsx`):**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

export function MyForm() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // save logic
    setIsSaving(false);
  };

  return (
    <form>
      {/* form fields */}

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => console.log("cancel")}>
          Cancel
        </Button>
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
      </div>
    </form>
  );
}
```

**After:**

```tsx
"use client";

import { useState } from "react";
import { FormActions } from "@/components/standard";

export function MyForm() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // save logic
    setIsSaving(false);
  };

  return (
    <form>
      {/* form fields */}

      <FormActions
        onCancel={() => console.log("cancel")}
        onSubmit={handleSave}
        submitText="Save"
        isSubmitting={isSaving}
      />
    </form>
  );
}
```

### Example 2: AI Content Generator

**Before (`src/app/(app)/studio/write/page.tsx`):**

```tsx
<Button type="submit" variant={pending ? "shimmer" : "ai"} disabled={pending}>
  {pending ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Generating...
    </>
  ) : (
    <>
      <Sparkles className="mr-2 h-4 w-4" />
      Generate Content
    </>
  )}
</Button>
```

**After:**

```tsx
import { GenerateButton } from "@/components/standard";

<GenerateButton type="submit" loading={pending}>
  Generate Content
</GenerateButton>;
```

### Example 3: Dialog with Actions

**Before:**

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
    </DialogHeader>

    {/* content */}

    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm} disabled={isSubmitting}>
        {isSubmitting ? "Processing..." : "Confirm"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**After:**

```tsx
import { DialogActions } from "@/components/standard";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
    </DialogHeader>

    {/* content */}

    <DialogFooter>
      <DialogActions
        onClose={() => setOpen(false)}
        onSubmit={handleConfirm}
        submitText="Confirm"
        isSubmitting={isSubmitting}
      />
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

## Testing After Migration

1. **Visual Check**: Ensure buttons look consistent
2. **Loading States**: Test that loading indicators work correctly
3. **Accessibility**: Verify keyboard navigation and screen reader support
4. **Responsive**: Check button behavior on mobile devices

## Rollback Plan

If you need to rollback, the original Button component is still available:

```tsx
import { Button } from "@/components/ui/button";

// Use as before
<Button variant="default" onClick={handleClick}>
  Click Me
</Button>;
```

## Benefits After Migration

✅ **Consistency**: All buttons look and behave the same way
✅ **Less Code**: Reduce boilerplate by 60-80%
✅ **Maintainability**: Update button styles in one place
✅ **Type Safety**: Full TypeScript support with proper types
✅ **Accessibility**: Built-in ARIA labels and keyboard support
✅ **Loading States**: Automatic loading indicators

## Need Help?

- See `src/components/standard/README.md` for full documentation
- Check `src/components/standard/buttons-demo.tsx` for live examples
- Review existing implementations in the codebase
