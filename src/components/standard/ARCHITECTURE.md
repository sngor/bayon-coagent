# Button Component Architecture

## Component Hierarchy

```
Button (shadcn/ui base)
  │
  ├─ ActionButton (base wrapper with loading)
  │   │
  │   ├─ SaveButton
  │   ├─ DeleteButton
  │   ├─ CreateButton
  │   ├─ SubmitButton
  │   ├─ DownloadButton
  │   ├─ UploadButton
  │   ├─ CopyButton
  │   ├─ RefreshButton
  │   ├─ SearchButton
  │   ├─ SendButton
  │   ├─ GenerateButton (AI variant)
  │   └─ AIButton (AI variant)
  │
  ├─ CancelButton (direct Button wrapper)
  ├─ EditButton (direct Button wrapper)
  ├─ BackButton (direct Button wrapper)
  ├─ NextButton (direct Button wrapper)
  │
  └─ IconButton (icon-only base)
      │
      ├─ CloseIconButton
      ├─ DeleteIconButton
      ├─ EditIconButton
      ├─ CopyIconButton
      └─ RefreshIconButton

FormActions (button group)
  └─ DialogActions (extends FormActions)
```

## Component Relationships

### Base Components

**Button** (from shadcn/ui)

- Provides core button functionality
- Handles variants, sizes, and styling
- Includes ripple effect and animations
- Touch-optimized (44px min-height)

**ActionButton** (wrapper)

- Adds loading state management
- Automatic loading indicator
- Icon support
- Extends Button with loading logic

### Specialized Buttons

All specialized buttons extend either `ActionButton` or `Button`:

**With Loading States** (extend ActionButton):

- SaveButton, DeleteButton, CreateButton, SubmitButton
- DownloadButton, UploadButton, CopyButton
- RefreshButton, SearchButton, SendButton
- GenerateButton, AIButton

**Without Loading States** (extend Button):

- CancelButton, EditButton
- BackButton, NextButton

**Icon-Only** (extend Button):

- IconButton (base)
- CloseIconButton, DeleteIconButton, etc.

### Button Groups

**FormActions**

- Manages multiple buttons
- Handles alignment
- Provides consistent spacing
- Supports custom children

**DialogActions**

- Extends FormActions
- Dialog-specific defaults
- Close/Submit pattern

## Data Flow

```
User Click
    ↓
Button Component
    ↓
onClick Handler
    ↓
Parent Component
    ↓
Update State (loading: true)
    ↓
Button Re-renders
    ↓
Shows Loading Indicator
    ↓
Async Operation
    ↓
Update State (loading: false)
    ↓
Button Re-renders
    ↓
Shows Normal State
```

## Props Flow

```
Parent Component
    ↓
    ├─ onClick: () => void
    ├─ loading: boolean
    ├─ loadingText?: string
    ├─ disabled?: boolean
    ├─ size?: ButtonSize
    ├─ variant?: ButtonVariant
    └─ className?: string
    ↓
Specialized Button (e.g., SaveButton)
    ↓
    ├─ Adds default icon
    ├─ Adds default text
    ├─ Adds default loadingText
    └─ Passes all props down
    ↓
ActionButton
    ↓
    ├─ Manages loading state
    ├─ Renders loading indicator
    ├─ Renders icon
    └─ Passes remaining props
    ↓
Button (shadcn/ui)
    ↓
    ├─ Applies variant styles
    ├─ Applies size styles
    ├─ Handles disabled state
    ├─ Adds ripple effect
    └─ Renders to DOM
```

## State Management

### Loading State Pattern

```tsx
// Parent Component
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  setIsLoading(true);
  try {
    await performAction();
  } finally {
    setIsLoading(false);
  }
};

// Button receives loading prop
<SaveButton onClick={handleAction} loading={isLoading} />;
```

### Form Actions Pattern

```tsx
// Parent Component
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  setIsSubmitting(true);
  try {
    await submitForm();
  } finally {
    setIsSubmitting(false);
  }
};

// FormActions manages multiple buttons
<FormActions
  onCancel={handleCancel}
  onSubmit={handleSubmit}
  isSubmitting={isSubmitting}
/>;
```

## Styling Architecture

### Variant System

```
Button Variants (from shadcn/ui):
├─ default      → Primary actions
├─ destructive  → Dangerous actions (delete)
├─ outline      → Secondary actions
├─ secondary    → Alternative actions
├─ ghost        → Minimal styling
├─ link         → Link-style
├─ ai           → AI-powered actions (gradient)
├─ shimmer      → Loading state
├─ success      → Success actions
├─ premium      → Premium features
├─ glow         → Glowing effect
└─ gradient-border → Gradient border

Specialized Button Mappings:
├─ SaveButton       → default
├─ DeleteButton     → destructive
├─ CancelButton     → outline
├─ GenerateButton   → ai
├─ AIButton         → ai
└─ Others           → default or outline
```

### Size System

```
Sizes:
├─ sm      → 40px min-height, small padding
├─ default → 44px min-height, standard padding
├─ lg      → 48px min-height, large padding
├─ xl      → 52px min-height, extra large padding
└─ icon    → 44x44px square
```

## Extension Points

### Adding New Button Types

```tsx
// 1. Create new button component
export function MyButton({
  loading,
  loadingText = "Processing...",
  ...props
}: CommonButtonProps) {
  return (
    <ActionButton
      variant="default"
      icon={!loading && <MyIcon className="h-4 w-4" />}
      loading={loading}
      loadingText={loadingText}
      {...props}
    >
      My Action
    </ActionButton>
  );
}

// 2. Export from index.ts
export { MyButton } from "./buttons";

// 3. Document in README.md
```

### Adding New Variants

```tsx
// 1. Add variant to Button component (ui/button.tsx)
// 2. Use in specialized button
export function MyButton({ ...props }: CommonButtonProps) {
  return (
    <ActionButton variant="my-new-variant" {...props}>
      My Action
    </ActionButton>
  );
}
```

### Custom Button Groups

```tsx
// Create custom group component
export function MyFormActions({ ...props }: MyFormActionsProps) {
  return (
    <div className="flex gap-3">
      <BackButton onClick={props.onBack} />
      <div className="flex gap-2 ml-auto">
        <CancelButton onClick={props.onCancel} />
        <SaveButton onClick={props.onSave} loading={props.isSaving} />
      </div>
    </div>
  );
}
```

## Performance Considerations

### Bundle Size

- Tree-shaking removes unused buttons
- Each button adds ~0.5KB gzipped
- FormActions adds ~1KB gzipped
- Total library: ~5KB gzipped

### Runtime Performance

- No performance overhead
- Same as base Button component
- Loading state is simple boolean check
- No complex state management

### Re-render Optimization

```tsx
// ✅ Good: Memoize handlers
const handleSave = useCallback(async () => {
  // save logic
}, [dependencies]);

<SaveButton onClick={handleSave} loading={isSaving} />

// ❌ Avoid: Inline functions (causes re-renders)
<SaveButton onClick={() => handleSave()} loading={isSaving} />
```

## Testing Strategy

### Unit Tests

```tsx
import { SaveButton } from "@/components/standard";
import { render, screen, fireEvent } from "@testing-library/react";

test("SaveButton shows loading state", () => {
  const { rerender } = render(
    <SaveButton onClick={jest.fn()} loading={false} />
  );

  expect(screen.getByText("Save")).toBeInTheDocument();

  rerender(<SaveButton onClick={jest.fn()} loading={true} />);

  expect(screen.getByText("Saving...")).toBeInTheDocument();
});
```

### Integration Tests

```tsx
test("FormActions handles submit flow", async () => {
  const handleSubmit = jest.fn();

  render(<FormActions onSubmit={handleSubmit} isSubmitting={false} />);

  fireEvent.click(screen.getByText("Submit"));

  expect(handleSubmit).toHaveBeenCalled();
});
```

## Accessibility Architecture

### ARIA Labels

```tsx
// Icon buttons automatically include aria-label
<IconButton
  icon={<X />}
  label="Close dialog" // → aria-label="Close dialog"
/>
```

### Keyboard Navigation

- All buttons are keyboard accessible
- Tab navigation works automatically
- Enter/Space triggers onClick
- Focus indicators visible

### Screen Readers

- Loading state announced automatically
- Button purpose clear from text/label
- Disabled state announced

## Migration Path

```
Phase 1: New Development
    ↓
Use standardized buttons for all new features
    ↓
Phase 2: High-Traffic Pages
    ↓
Migrate frequently used pages
    ↓
Phase 3: Gradual Migration
    ↓
Update pages as they're modified
    ↓
Phase 4: Cleanup
    ↓
Remove old button patterns
```

## Related Documentation

- **README.md** - Complete API documentation
- **MIGRATION.md** - Migration guide with examples
- **QUICK_REFERENCE.md** - Quick lookup guide
- **buttons-demo.tsx** - Interactive examples
