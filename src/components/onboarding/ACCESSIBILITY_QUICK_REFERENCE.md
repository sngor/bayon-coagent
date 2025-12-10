# Accessibility Quick Reference

Quick reference for using accessibility utilities in the onboarding system.

## Import Utilities

```typescript
import {
  // Announcer
  announce,
  announceProgress,
  announceNavigation,
  announceError,
  announceSuccess,

  // Keyboard Navigation
  createKeyboardHandler,
  focusFirstElement,
  focusLastElement,
  getFocusableElements,
  trapFocus,
  handleArrowNavigation,
  updateRovingTabindex,

  // Focus Management
  saveFocus,
  restoreFocus,
  focusElement,
  focusBySelector,
  manageFocusForStepTransition,
  createFocusTrap,
  ensureVisible,

  // Skip Link
  SkipLink,
} from "@/lib/accessibility";
```

## Common Patterns

### Announce to Screen Readers

```typescript
// Progress update
announceProgress(2, 5, "Profile Setup");
// Output: "Step 2 of 5: Profile Setup. 40% complete."

// Navigation
announceNavigation("forward", "Next Step");
// Output: "Navigating forward to Next Step"

// Error
announceError("Failed to save progress");
// Output: "Error: Failed to save progress"

// Success
announceSuccess("Profile saved successfully");
// Output: "Success: Profile saved successfully"
```

### Keyboard Navigation

```typescript
// Create keyboard handler
useEffect(() => {
  const handleKeyboard = createKeyboardHandler([
    {
      key: "Enter",
      handler: () => handleSubmit(),
      preventDefault: true,
    },
    {
      key: "Escape",
      handler: () => handleCancel(),
    },
  ]);

  document.addEventListener("keydown", handleKeyboard);
  return () => document.removeEventListener("keydown", handleKeyboard);
}, [handleSubmit, handleCancel]);
```

### Focus Management

```typescript
// Manage focus on step transition
useEffect(() => {
  manageFocusForStepTransition(stepId);
}, [stepId]);

// Focus specific element
focusElement(buttonRef.current, 100); // with 100ms delay

// Focus by selector
focusBySelector("#main-content", 200);
```

### Skip Link

```tsx
<SkipLink targetId="main-content" text="Skip to main content" />
```

## ARIA Attributes Checklist

### Buttons

```tsx
<Button aria-label="Descriptive label" title="Tooltip text">
  <Icon aria-hidden="true" />
  Button Text
</Button>
```

### Progress Bar

```tsx
<Progress
  value={progress}
  aria-label={`Progress: ${progress}% complete`}
  aria-valuenow={currentValue}
  aria-valuemin={0}
  aria-valuemax={100}
  role="progressbar"
/>
```

### Navigation

```tsx
<nav role="navigation" aria-label="Descriptive navigation label">
  {/* Navigation items */}
</nav>
```

### Regions

```tsx
<div role="region" aria-label="Region description" aria-labelledby="heading-id">
  {/* Content */}
</div>
```

### Current Item

```tsx
<div
  aria-current="step" // or "page", "location", "date", "time"
  aria-label="Current step"
>
  {/* Current item */}
</div>
```

## Keyboard Shortcuts

| Key        | Action            | Context                  |
| ---------- | ----------------- | ------------------------ |
| Tab        | Navigate forward  | All interactive elements |
| Shift+Tab  | Navigate backward | All interactive elements |
| Enter      | Activate/Continue | Buttons, links, forms    |
| Escape     | Cancel/Close      | Dialogs, skip onboarding |
| Space      | Activate          | Buttons, checkboxes      |
| Arrow Keys | Navigate items    | Lists, menus (future)    |

## Touch Targets

Ensure minimum touch target sizes:

```tsx
<Button
  className={cn(
    "w-full sm:w-auto",
    isMobile && "min-h-[44px] touch-manipulation"
  )}
>
  Button Text
</Button>
```

## Color Contrast

Use design tokens for consistent contrast:

```tsx
// High contrast
<p className="text-foreground">Normal text</p>

// Reduced but accessible
<p className="text-muted-foreground">Secondary text</p>

// Primary color
<Button className="bg-primary text-primary-foreground">
    Primary Button
</Button>
```

## Screen Reader Only Content

```tsx
<span className="sr-only">Screen reader only text</span>
```

## Live Regions

Already included in layout - just use the announce functions:

```typescript
// Polite (non-disruptive)
announce("Message", "polite");

// Assertive (immediate)
announce("Urgent message", "assertive");
```

## Testing Commands

```bash
# Run accessibility linter
npm run lint

# Type check
npm run typecheck

# Manual testing with keyboard
# - Tab through all elements
# - Test Enter, Escape, Arrow keys
# - Verify focus indicators

# Screen reader testing
# - macOS: VoiceOver (Cmd+F5)
# - Windows: NVDA or JAWS
# - Mobile: TalkBack (Android) or VoiceOver (iOS)
```

## Common Issues and Solutions

### Issue: Focus not visible

**Solution**: Ensure focus-visible styles are applied

```tsx
className =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
```

### Issue: Screen reader not announcing

**Solution**: Check live regions exist and use announce functions

```typescript
announceProgress(currentStep, totalSteps, title);
```

### Issue: Keyboard trap

**Solution**: Ensure Tab cycles through all elements

```typescript
const cleanup = trapFocus(modalRef.current);
// Later: cleanup();
```

### Issue: Poor color contrast

**Solution**: Use design tokens instead of custom colors

```tsx
className = "text-foreground bg-background";
```

## Resources

- [WCAG Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Full Accessibility Guide](./ACCESSIBILITY_GUIDE.md)
