# Standardized Buttons - Quick Reference

## Import

```tsx
import {
  SaveButton,
  CancelButton,
  DeleteButton,
  GenerateButton,
  FormActions,
} from "@/components/standard";
```

## Common Buttons

| Button             | Usage          | Props                    |
| ------------------ | -------------- | ------------------------ |
| `<SaveButton />`   | Save actions   | `loading`, `loadingText` |
| `<CancelButton />` | Cancel actions | Standard button props    |
| `<DeleteButton />` | Delete actions | `loading`, `loadingText` |
| `<CreateButton />` | Create new     | `loading`, `loadingText` |
| `<SubmitButton />` | Form submit    | `loading`, `loadingText` |
| `<EditButton />`   | Edit actions   | Standard button props    |
| `<BackButton />`   | Go back        | Standard button props    |
| `<NextButton />`   | Go forward     | Standard button props    |

## AI Buttons

| Button               | Usage         | Props                    |
| -------------------- | ------------- | ------------------------ |
| `<GenerateButton />` | AI generation | `loading`, `loadingText` |
| `<AIButton />`       | AI actions    | `loading`, `loadingText` |

## Form Groups

### FormActions

```tsx
<FormActions
  onCancel={handleCancel}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
  submitText="Save"
  alignment="right"
/>
```

**Alignment options:** `"right"` | `"left"` | `"between"` | `"center"`

### DialogActions

```tsx
<DialogActions
  onClose={handleClose}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
  submitText="Confirm"
/>
```

## Icon Buttons

```tsx
<CloseIconButton onClick={handleClose} />
<DeleteIconButton onClick={handleDelete} />
<EditIconButton onClick={handleEdit} />
<CopyIconButton onClick={handleCopy} />
<RefreshIconButton onClick={handleRefresh} />
```

## Common Props

All buttons support:

- `onClick` - Click handler
- `disabled` - Disable button
- `loading` - Show loading state
- `loadingText` - Custom loading text
- `size` - `"sm"` | `"default"` | `"lg"` | `"xl"`
- `className` - Custom CSS classes
- `type` - `"button"` | `"submit"` | `"reset"`

## Examples

### Simple Save

```tsx
<SaveButton onClick={handleSave} loading={isSaving} />
```

### Form with Actions

```tsx
<form onSubmit={handleSubmit}>
  {/* fields */}
  <FormActions onCancel={handleCancel} isSubmitting={isSubmitting} />
</form>
```

### AI Generation

```tsx
<GenerateButton onClick={handleGenerate} loading={isGenerating}>
  Generate Content
</GenerateButton>
```

### Delete Confirmation

```tsx
<DialogFooter>
  <DialogActions
    onClose={onClose}
    onSubmit={handleDelete}
    submitText="Delete"
    submitVariant="destructive"
    isSubmitting={isDeleting}
  />
</DialogFooter>
```

### Multi-Step Navigation

```tsx
<div className="flex justify-between">
  <BackButton onClick={handleBack} />
  <NextButton onClick={handleNext} />
</div>
```

## Sizes

```tsx
<SaveButton size="sm" />    // Small
<SaveButton size="default" /> // Default
<SaveButton size="lg" />    // Large
<SaveButton size="xl" />    // Extra Large
```

## Custom Text

```tsx
<SaveButton>Save Profile</SaveButton>
<DeleteButton>Delete Account</DeleteButton>
<GenerateButton>Create Content</GenerateButton>
```

## Loading States

```tsx
const [isSaving, setIsSaving] = useState(false);

<SaveButton
  onClick={handleSave}
  loading={isSaving}
  loadingText="Saving changes..."
/>;
```

## Full Documentation

See `src/components/standard/README.md` for complete documentation.
