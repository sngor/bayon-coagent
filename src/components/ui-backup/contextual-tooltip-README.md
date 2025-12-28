# Contextual Tooltip System

A comprehensive tooltip system for providing first-time feature guidance that remembers user preferences and persists seen state to DynamoDB.

## Features

- ✅ **Dismissible tooltips** - Users can dismiss tooltips they've seen
- ✅ **Persistent state** - Seen tooltips are stored in DynamoDB user preferences
- ✅ **Automatic visibility** - Tooltips only show for first-time users
- ✅ **Hover fallback** - Optional hover behavior after dismissal
- ✅ **Help hints** - Always-available help icons for reference
- ✅ **Flexible positioning** - Position tooltips on any side of the trigger
- ✅ **Accessible** - Built on Radix UI with proper ARIA attributes

## Components

### `FeatureTooltip`

The main component for first-time feature guidance. Shows automatically for new users and remembers when dismissed.

```tsx
import { FeatureTooltip } from "@/components/ui/feature-tooltip";

<FeatureTooltip
  id="unique-feature-id"
  content="This is helpful guidance for first-time users."
  side="right"
>
  <Button>Feature Button</Button>
</FeatureTooltip>;
```

**Props:**

- `id` (required): Unique identifier for this tooltip
- `content` (required): The help text or React node to display
- `children` (required): The element that triggers the tooltip
- `side`: Position of tooltip ("top" | "right" | "bottom" | "left")
- `className`: Additional CSS classes
- `showOnFirstRender`: Whether to show immediately (default: true)

### `FeatureTooltipWithHover`

Similar to `FeatureTooltip` but shows on hover after being dismissed, allowing users to reference the help again.

```tsx
import { FeatureTooltipWithHover } from "@/components/ui/feature-tooltip";

<FeatureTooltipWithHover
  id="feature-with-hover"
  content="This tooltip shows on first visit, then on hover after dismissal."
  side="bottom"
>
  <Button>Hover Me Later</Button>
</FeatureTooltipWithHover>;
```

### `HelpHint`

A simple help icon that shows a tooltip on hover. Use for features that don't need first-time guidance.

```tsx
import { HelpHint } from "@/components/ui/contextual-tooltip";

<div className="flex items-center gap-2">
  <span>Advanced Settings</span>
  <HelpHint content="These settings are for advanced users only." />
</div>;
```

### `ContextualTooltip`

Low-level component for building custom tooltip behaviors. Most users should use `FeatureTooltip` instead.

```tsx
import { ContextualTooltip } from "@/components/ui/contextual-tooltip";

<ContextualTooltip
  id="custom-tooltip"
  content="Custom tooltip content"
  show={isVisible}
  onDismiss={handleDismiss}
  dismissible={true}
>
  <Button>Custom Behavior</Button>
</ContextualTooltip>;
```

## Context Provider

The `TooltipProvider` must wrap your app to enable tooltip state management and persistence.

```tsx
import { TooltipProvider } from "@/contexts/tooltip-context";

export default function AppLayout({ children }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}
```

## Hooks

### `useContextualTooltip`

Hook for managing a specific tooltip's visibility state.

```tsx
import { useContextualTooltip } from "@/contexts/tooltip-context";

function MyComponent() {
  const { isVisible, dismiss, isLoading } =
    useContextualTooltip("my-tooltip-id");

  return (
    <div>
      {isVisible && <div>First time here!</div>}
      <button onClick={dismiss}>Got it</button>
    </div>
  );
}
```

### `useTooltipContext`

Access the full tooltip context for advanced use cases.

```tsx
import { useTooltipContext } from "@/contexts/tooltip-context";

function MyComponent() {
  const { hasSeenTooltip, markTooltipAsSeen, resetSeenTooltips } =
    useTooltipContext();

  const checkTooltip = () => {
    if (hasSeenTooltip("some-tooltip")) {
      console.log("User has seen this tooltip");
    }
  };

  return <button onClick={checkTooltip}>Check Tooltip</button>;
}
```

## Data Storage

Tooltip preferences are stored in DynamoDB with the following structure:

```typescript
{
  PK: "USER#<userId>",
  SK: "PREFERENCES#TOOLTIPS",
  EntityType: "UserProfile",
  Data: {
    seenTooltips: ["tooltip-id-1", "tooltip-id-2", ...]
  },
  CreatedAt: 1234567890,
  UpdatedAt: 1234567890
}
```

## Best Practices

### Naming Tooltip IDs

Use descriptive, hierarchical IDs:

- ✅ `marketing-plan-generate`
- ✅ `brand-audit-run-first-time`
- ✅ `dashboard-welcome`
- ❌ `tooltip1`
- ❌ `tip`

### When to Use Each Component

- **FeatureTooltip**: For important features users should know about on first use
- **FeatureTooltipWithHover**: For features users might want to reference again
- **HelpHint**: For optional help that's always available
- **ContextualTooltip**: For custom tooltip behaviors

### Content Guidelines

Keep tooltip content:

- **Concise**: 1-2 sentences maximum
- **Actionable**: Tell users what to do, not just what something is
- **Friendly**: Use conversational language
- **Specific**: Mention actual button names or steps

Good examples:

- ✅ "Click 'Generate' to create a personalized marketing plan. This takes about 60 seconds."
- ✅ "Connect your Google Business Profile to import reviews automatically."

Bad examples:

- ❌ "This is the marketing plan feature."
- ❌ "Click here to do something with your data."

### Positioning

Choose tooltip position based on:

- **Available space**: Avoid tooltips that overflow the viewport
- **Reading flow**: Position tooltips where users naturally look
- **Element size**: Larger elements can support more tooltip positions

## Examples

### Onboarding Workflow

Guide users through a multi-step process:

```tsx
<div className="space-y-4">
  <FeatureTooltip
    id="onboarding-step-1"
    content="Step 1: Complete your profile with business information."
  >
    <Button>Complete Profile</Button>
  </FeatureTooltip>

  <FeatureTooltip
    id="onboarding-step-2"
    content="Step 2: Connect your Google Business Profile."
  >
    <Button>Connect Integrations</Button>
  </FeatureTooltip>

  <FeatureTooltip
    id="onboarding-step-3"
    content="Step 3: Generate your first marketing plan."
  >
    <Button>Generate Plan</Button>
  </FeatureTooltip>
</div>
```

### Dashboard Welcome

Show a welcome tooltip on the dashboard:

```tsx
<FeatureTooltip
  id="dashboard-welcome"
  content="Welcome! This dashboard shows your key marketing metrics at a glance. Click any card to dive deeper."
  side="bottom"
>
  <Card>
    <CardHeader>
      <CardTitle>Dashboard Overview</CardTitle>
    </CardHeader>
  </Card>
</FeatureTooltip>
```

### Complex Feature

Combine tooltip with help hint for complex features:

```tsx
<div className="flex items-center gap-2">
  <FeatureTooltip
    id="ai-content-generator"
    content="Generate blog posts, social media content, and more with AI. Select a content type to get started."
  >
    <Button variant="ai">Generate Content</Button>
  </FeatureTooltip>
  <HelpHint content="AI content generation uses your profile and preferences to create personalized marketing content." />
</div>
```

## Testing

To test tooltips in development:

1. Visit `/contextual-tooltip-demo` to see all examples
2. Use the browser's Application/Storage tab to clear IndexedDB/localStorage
3. Use the `resetSeenTooltips()` function from `useTooltipContext()`

```tsx
import { useTooltipContext } from "@/contexts/tooltip-context";

function DevTools() {
  const { resetSeenTooltips } = useTooltipContext();

  return (
    <button onClick={resetSeenTooltips}>Reset All Tooltips (Dev Only)</button>
  );
}
```

## Accessibility

The tooltip system is built on Radix UI and includes:

- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Screen reader announcements

## Requirements Validation

This implementation satisfies:

- ✅ **Requirement 19.2**: Contextual tooltips for first-time feature use
- ✅ **Requirement 19.5**: Dismissible help hints
- ✅ **Task 34**: Tooltip system with stored seen state in user preferences
