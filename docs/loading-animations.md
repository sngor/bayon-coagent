# Loading Animations Guide

This guide covers the enhanced loading animations available in the application.

## Components

### 1. SessionLoading

**Location:** `src/components/session-loading.tsx`

Enhanced full-screen loading animation shown during session initialization with dynamic gradient mesh background, progress indication, and engaging micro-interactions.

```tsx
import { SessionLoading } from "@/components/session-loading";

<SessionLoading />;
```

**Features:**

- Dynamic gradient mesh background with 5 animated orbs
- Circular progress indicator with percentage display
- Rotating loading steps with smooth transitions
- Floating particle effects
- Enhanced logo animation with glow effect
- Responsive design optimized for all screen sizes

- Animated gradient mesh blur background (5 moving blobs)
- Logo with fade-in animation
- Pulsing text and animated dots
- Full-screen coverage

**Use Cases:**

- Initial app loading
- Session initialization
- Authentication flow

---

### 2. AILoading

**Location:** `src/components/ui/ai-loading.tsx`

Enhanced loading animation specifically for AI content generation with gradient mesh blur effects.

```tsx
import { AILoading } from '@/components/ui/ai-loading';

// Full version
<AILoading
  message="Generating content..."
  showSubtext={true}
/>

// Compact version
<AILoading
  message="Processing..."
  compact={true}
/>
```

**Props:**

- `message?: string` - Main loading message (default: "Generating content...")
- `showSubtext?: boolean` - Show rotating AI subtexts (default: true)
- `className?: string` - Additional CSS classes
- `compact?: boolean` - Use compact version (default: false)

**Features:**

- Animated gradient mesh blur background (5 moving blobs)
- Sparkles icon with glow and rotation
- Floating particles around icon
- Gradient text with breathing effect
- Rotating subtexts about AI capabilities
- Animated dots indicator

**Use Cases:**

- AI content generation (blog posts, descriptions, etc.)
- AI research and analysis
- Any AI-powered feature processing

---

### 3. LoadingDots

**Location:** `src/components/ui/loading-dots.tsx`

Compact animated dots for inline loading states.

```tsx
import { LoadingDots } from '@/components/ui/loading-dots';

<LoadingDots size="sm" />
<LoadingDots size="md" />
<LoadingDots size="lg" />
```

**Props:**

- `size?: 'sm' | 'md' | 'lg'` - Dot size (default: 'md')
- `className?: string` - Additional CSS classes

**Features:**

- Three animated dots with staggered animation
- Scales and fades in sequence
- Inherits text color from parent
- Minimal footprint

**Use Cases:**

- Button loading states
- Inline text loading
- Table row loading
- Compact containers

---

### 4. StandardLoadingSpinner

**Location:** `src/components/standard/loading-spinner.tsx`

Versatile loading spinner with multiple variants.

```tsx
import { StandardLoadingSpinner } from '@/components/standard/loading-spinner';

// Default
<StandardLoadingSpinner size="md" message="Loading..." />

// Overlay (full screen)
<StandardLoadingSpinner variant="overlay" message="Processing..." />

// AI variant (with gradient mesh)
<StandardLoadingSpinner
  variant="ai"
  message="Generating..."
  showSubtext={true}
/>
```

**Props:**

- `size?: 'sm' | 'md' | 'lg'` - Spinner size
- `variant?: 'default' | 'overlay' | 'ai'` - Visual variant
- `message?: string` - Loading message
- `className?: string` - Additional CSS classes
- `showSubtext?: boolean` - Show AI subtexts (AI variant only)

**Variants:**

- **default**: Simple spinner with optional message
- **overlay**: Full-screen backdrop with spinner
- **ai**: Enhanced with gradient mesh blur background

**Use Cases:**

- General loading states
- Modal/dialog loading
- Page-level loading
- AI processing (use 'ai' variant)

---

## Usage Patterns

### In Forms (AI Generation)

```tsx
import { AIFormWrapper } from "@/components/shared/ai-form-wrapper";

<AIFormWrapper
  formTitle="Generate Content"
  formContent={<YourForm />}
  output={generatedContent}
  isLoading={isGenerating}
  loadingMessage="Creating your content..."
/>;
```

The `AIFormWrapper` automatically uses `AILoading` for the best AI generation experience.

### In Buttons

```tsx
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";

<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <LoadingDots size="sm" className="mr-2" />
      Processing...
    </>
  ) : (
    "Submit"
  )}
</Button>;
```

Or use `ActionButtons` component which handles this automatically:

```tsx
import { ActionButtons } from "@/components/shared/action-buttons";

<ActionButtons
  primaryLabel="Generate"
  primaryVariant="ai"
  onPrimaryClick={handleGenerate}
  primaryLoading={isGenerating}
/>;
```

### In Tables

```tsx
import { DataTable } from "@/components/shared/data-table";

<DataTable data={data} columns={columns} loading={isLoading} />;
```

The `DataTable` automatically shows `LoadingDots` in the loading state.

### In Cards/Containers

```tsx
import { AILoading } from "@/components/ui/ai-loading";

<Card>
  <CardContent>
    {isLoading ? (
      <AILoading message="Loading data..." compact />
    ) : (
      <YourContent />
    )}
  </CardContent>
</Card>;
```

---

## Design Principles

1. **AI Features = Gradient Mesh**: Use `AILoading` or `StandardLoadingSpinner` with `variant="ai"` for AI-powered features
2. **Inline States = Dots**: Use `LoadingDots` for buttons, inline text, and compact spaces
3. **Full Screen = Session**: Use `SessionLoading` for app initialization
4. **General Purpose = Standard**: Use `StandardLoadingSpinner` for everything else

---

## Animation Details

### Gradient Mesh Blur

- 5 animated gradient blobs with different colors (primary, purple, blue)
- Each blob moves independently with different durations (6-10s)
- Smooth easing with `easeInOut`
- Heavy blur effect (`blur-3xl` or `blur-2xl`)
- Opacity and scale animations for depth

### Timing

- Entrance animations: 0.5s
- Breathing effects: 2s cycles
- Dot animations: 1.5s cycles with 0.2s stagger
- Subtext rotation: 3.5s intervals
- Blob movements: 6-10s cycles

### Colors

- Primary: Your theme primary color
- Purple: `purple-500/20-25`
- Blue: `blue-500/20`
- All with appropriate opacity for subtle effect

---

## Accessibility

All loading components include:

- `role="status"` for screen readers
- `aria-live="polite"` for dynamic updates
- `aria-busy="true"` to indicate loading state
- `aria-hidden="true"` on decorative elements
- Screen reader text with `sr-only` class

---

## Performance

- Uses Framer Motion for GPU-accelerated animations
- Blur effects use CSS `backdrop-filter` and `filter`
- Animations use `transform` and `opacity` for best performance
- No layout thrashing or reflows
- Cleanup on unmount to prevent memory leaks
