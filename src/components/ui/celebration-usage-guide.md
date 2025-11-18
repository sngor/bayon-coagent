# Celebration Component Usage Guide

## Overview

The Celebration component provides professional, tasteful animations for celebrating user achievements and milestones. It includes confetti animations, success feedback, and subtle effects for various completion scenarios.

## Quick Start

```tsx
import { Celebration } from "@/components/ui/celebration";

function MyComponent() {
  const [showCelebration, setShowCelebration] = useState(false);

  const handleSuccess = () => {
    setShowCelebration(true);
  };

  return (
    <>
      <Button onClick={handleSuccess}>Complete Task</Button>
      <Celebration
        show={showCelebration}
        type="confetti"
        message="🎉 Task completed!"
        onComplete={() => setShowCelebration(false)}
      />
    </>
  );
}
```

## Components

### 1. Celebration

Main celebration component with multiple types.

**Props:**

- `show: boolean` - Controls visibility
- `type?: "confetti" | "success" | "milestone" | "achievement"` - Animation type
- `message?: string` - Optional message to display
- `duration?: number` - Duration in milliseconds (default: 3000)
- `onComplete?: () => void` - Callback when animation completes

**Types:**

#### Confetti

Full celebration with 50 confetti pieces. Use for major completions.

```tsx
<Celebration
  show={show}
  type="confetti"
  message="🎉 Marketing plan generated!"
/>
```

#### Success

Green-themed with checkmark. Use for successful operations.

```tsx
<Celebration show={show} type="success" message="✅ Data saved successfully!" />
```

#### Milestone

Trophy icon with confetti. Use for reaching milestones.

```tsx
<Celebration
  show={show}
  type="milestone"
  message="🏆 First marketing plan created!"
/>
```

#### Achievement

Star icon with confetti. Use for unlocking achievements.

```tsx
<Celebration show={show} type="achievement" message="⭐ Tutorial completed!" />
```

### 2. SuccessPing

Brief success animation without confetti. Use for quick confirmations.

**Props:**

- `show: boolean` - Controls visibility
- `onComplete?: () => void` - Callback when animation completes

```tsx
import { SuccessPing } from "@/components/ui/celebration";

<SuccessPing show={itemSaved} onComplete={() => setItemSaved(false)} />;
```

### 3. SparkleEffect

Sparkle particles for AI operations and special moments.

**Props:**

- `show: boolean` - Controls visibility
- `message?: string` - Optional message to display
- `onComplete?: () => void` - Callback when animation completes

```tsx
import { SparkleEffect } from "@/components/ui/celebration";

<SparkleEffect
  show={aiComplete}
  message="✨ Content generated!"
  onComplete={() => setAiComplete(false)}
/>;
```

### 4. useCelebration Hook

Hook for programmatic celebration control.

```tsx
import { useCelebration } from "@/components/ui/celebration";

function MyComponent() {
  const { celebration, celebrate, handleComplete } = useCelebration();

  const handleSuccess = () => {
    celebrate("confetti", "🎉 You did it!");
  };

  return (
    <>
      <Button onClick={handleSuccess}>Complete</Button>
      <Celebration {...celebration} onComplete={handleComplete} />
    </>
  );
}
```

## When to Use Each Type

### Major Celebrations (Confetti)

- Marketing plan generated
- Onboarding completed
- Complex workflow finished
- First-time achievements

### Success Celebrations

- Form submitted successfully
- Data saved
- AI operation completed
- Profile updated

### Milestone Celebrations

- First marketing plan
- 10th blog post
- Profile completion
- Usage milestones

### Achievement Celebrations

- Feature unlocked
- Tutorial completed
- Goal reached
- Badge earned

### Success Ping (Subtle)

- Settings saved
- Text copied
- Preference toggled
- Quick confirmations

### Sparkle Effect

- AI processing complete
- Content generated
- Special moments
- Magic moments

## Best Practices

### 1. Don't Overuse

Only celebrate meaningful achievements. Too many celebrations lose their impact.

```tsx
// ✅ Good - Major completion
celebrate("confetti", "Marketing plan generated!");

// ❌ Bad - Minor action
celebrate("confetti", "Button clicked!");
```

### 2. Match Type to Importance

Use appropriate celebration types for the level of achievement.

```tsx
// ✅ Good - Major milestone
<Celebration type="milestone" message="🏆 100th customer!" />

// ✅ Good - Quick save
<SuccessPing show={saved} />

// ❌ Bad - Overkill for minor action
<Celebration type="confetti" message="Text copied!" />
```

### 3. Provide Clear Messages

Messages should be concise and celebratory.

```tsx
// ✅ Good
message = "🎉 Marketing plan generated!";

// ❌ Bad - Too verbose
message =
  "Your marketing plan has been successfully generated and is now ready for viewing.";
```

### 4. Handle Cleanup

Always provide an `onComplete` callback to clean up state.

```tsx
// ✅ Good
<Celebration
  show={show}
  onComplete={() => setShow(false)}
/>

// ❌ Bad - No cleanup
<Celebration show={show} />
```

### 5. Respect Reduced Motion

The component automatically respects `prefers-reduced-motion`. No additional code needed.

## Integration Examples

### With Form Submission

```tsx
function MyForm() {
  const [showSuccess, setShowSuccess] = useState(false);

  async function handleSubmit(data: FormData) {
    try {
      await saveData(data);
      setShowSuccess(true);
    } catch (error) {
      // Handle error
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>{/* Form fields */}</form>
      <SuccessPing
        show={showSuccess}
        onComplete={() => setShowSuccess(false)}
      />
    </>
  );
}
```

### With AI Operations

```tsx
function AIGenerator() {
  const [showCelebration, setShowCelebration] = useState(false);

  async function generateContent() {
    try {
      await aiGenerate();
      setShowCelebration(true);
    } catch (error) {
      // Handle error
    }
  }

  return (
    <>
      <Button onClick={generateContent}>Generate</Button>
      <Celebration
        show={showCelebration}
        type="confetti"
        message="🎉 Content generated!"
        onComplete={() => setShowCelebration(false)}
      />
    </>
  );
}
```

### With Milestone Tracking

```tsx
function MilestoneTracker() {
  const { celebration, celebrate, handleComplete } = useCelebration();

  function checkMilestone(count: number) {
    if (count === 1) {
      celebrate("milestone", "🏆 First plan created!");
    } else if (count === 10) {
      celebrate("milestone", "🏆 10 plans created!");
    } else if (count === 100) {
      celebrate("achievement", "⭐ Century milestone!");
    }
  }

  return <Celebration {...celebration} onComplete={handleComplete} />;
}
```

## Accessibility

### Reduced Motion

Automatically respects user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations are disabled */
}
```

### Screen Readers

- Messages are readable by screen readers
- Non-blocking (pointer-events-none)
- Auto-dismissal prevents focus traps

### Keyboard Navigation

- No keyboard interaction required
- Doesn't trap focus
- Auto-dismisses after duration

## Performance

- Limited confetti count (50 max)
- GPU-accelerated animations
- Auto-cleanup after completion
- Conditional rendering
- Short durations (1-3 seconds)

## Demo

Visit `/celebration-demo` to see all celebration types in action and test them interactively.

## Troubleshooting

### Celebration doesn't show

- Ensure `show` prop is `true`
- Check that component is rendered
- Verify no z-index conflicts

### Animation is choppy

- Check browser performance
- Reduce confetti count if needed
- Ensure GPU acceleration is enabled

### Celebration doesn't dismiss

- Provide `onComplete` callback
- Set `show` to `false` in callback
- Check duration prop

### Message not visible

- Ensure message prop is provided
- Check text color contrast
- Verify no overlapping elements

## Support

For issues or questions, check:

- Demo page: `/celebration-demo`
- Verification doc: `celebration-verification.md`
- Component source: `celebration.tsx`
