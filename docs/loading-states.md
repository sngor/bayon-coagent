# Loading States Documentation

## Overview

The Bayon Coagent application uses a standardized loading state system to provide consistent user experience across all hubs and features. This system ensures users always know what's happening and maintains visual consistency throughout the application.

## Architecture

### Core Components

1. **PageLoading** - Primary loading component for full-page states
2. **SuspenseWrapper** - React Suspense wrapper with consistent fallbacks
3. **Loading Messages** - Centralized message constants for consistency
4. **Specialized Components** - Purpose-built loading states for specific contexts

### Loading Message System

All loading messages are centralized in `src/lib/constants/loading-messages.ts`:

```typescript
export const LOADING_MESSAGES = {
  // Hub-level loading messages
  HUBS: {
    DASHBOARD: 'Loading dashboard...',
    ASSISTANT: 'Loading assistant...',
    BRAND: 'Loading brand...',
    STUDIO: 'Loading studio...',
    RESEARCH: 'Loading research...',
    MARKET: 'Loading market intelligence...',
    TOOLS: 'Loading tools...',
    LIBRARY: 'Loading library...',
    // ... more hubs
  },

  // Feature-level loading messages
  FEATURES: {
    BRAND_PROFILE: 'Loading brand profile...',
    CONTENT_LIBRARY: 'Loading content library...',
    MARKET_INSIGHTS: 'Loading market insights...',
    // ... more features
  },

  // AI-specific loading messages
  AI: {
    THINKING: 'AI is thinking...',
    ANALYZING: 'AI is analyzing...',
    GENERATING: 'AI is generating content...',
    // ... more AI states
  }
};
```

## Implementation Patterns

### Hub Loading Pages

Each hub has a standardized `loading.tsx` file:

```typescript
// src/app/(app)/brand/loading.tsx
import { PageLoading } from '@/components/ui/page-loading';

export default function Loading() {
    return <PageLoading text="Loading brand..." />;
}
```

**Key Points:**
- Uses `PageLoading` component for consistency
- Hub-specific loading message
- Follows Next.js App Router loading UI pattern

### Page Loading Component

The `PageLoading` component provides flexible loading states:

```typescript
interface PageLoadingProps {
    text?: string;
    className?: string;
    variant?: 'default' | 'hub' | 'feature';
}

export function PageLoading({ 
    text = 'Loading...', 
    className,
    variant = 'default'
}: PageLoadingProps) {
    const minHeight = variant === 'hub' ? 'min-h-[60vh]' : 'min-h-[400px]';
    
    return (
        <div className={cn(
            "flex items-center justify-center",
            minHeight,
            className
        )}>
            <Loading size="lg" text={text} />
        </div>
    );
}
```

**Variants:**
- `default`: Standard loading state (400px min height)
- `hub`: Hub-specific loading (60vh min height for better UX)
- `feature`: Feature-specific loading state

### Suspense Wrappers

For lazy-loaded components:

```typescript
// Basic suspense wrapper
<SuspenseWrapper loadingText="Loading component...">
  <LazyComponent />
</SuspenseWrapper>

// Hub-specific wrapper
<HubSuspenseWrapper loadingText="Loading dashboard...">
  <LazyDashboard />
</HubSuspenseWrapper>
```

**Benefits:**
- Consistent loading fallbacks
- Centralized loading message management
- Type-safe loading text with TypeScript

## Loading State Types

### 1. Page-Level Loading

Used for entire page loads (Next.js loading.tsx files):

```typescript
// Hub loading
<PageLoading text="Loading brand..." variant="hub" />

// Feature loading
<PageLoading text="Loading brand profile..." variant="feature" />
```

### 2. Component-Level Loading

Used for individual components or sections:

```typescript
// Inline loading for small components
<InlineLoading text="Saving..." />

// Section loading for content areas
<LoadingSection title="Loading data..." />
```

### 3. Action-Level Loading

Used for button and form actions:

```typescript
// Button loading state
<ButtonLoading text="Processing..." />

// Form submission loading
<Button disabled={isLoading}>
  {isLoading ? <ButtonLoading text="Saving..." /> : "Save"}
</Button>
```

### 4. AI Operation Loading

Special loading states for AI operations:

```typescript
// AI thinking state
<PageLoading text={LOADING_MESSAGES.AI.THINKING} />

// AI generation with progress
<AIOperationProgress 
  message="AI is generating your marketing plan..."
  steps={['Analyzing profile', 'Research competitors', 'Creating strategy']}
  currentStep={1}
/>
```

## Best Practices

### Message Guidelines

**Do:**
- Use specific, descriptive messages ("Loading brand profile..." vs "Loading...")
- Import messages from `LOADING_MESSAGES` constants
- Match message to the actual operation being performed
- Use present continuous tense ("Loading...", "Generating...")

**Don't:**
- Create ad-hoc loading messages
- Use generic "Loading..." for specific features
- Use past tense ("Loaded") or future tense ("Will load")
- Make messages too long or technical

### Visual Guidelines

**Do:**
- Use appropriate variant for context (`hub` for main pages)
- Maintain consistent minimum heights
- Use loading spinners for operations > 200ms
- Provide visual feedback for all async operations

**Don't:**
- Show loading states for very fast operations (<200ms)
- Mix different loading component styles on same page
- Use loading states without clear end conditions
- Block entire UI for partial updates

### Performance Guidelines

**Do:**
- Use Suspense boundaries to isolate loading states
- Implement skeleton loading for known content structures
- Show partial content while loading additional data
- Cache loading states to prevent flashing

**Don't:**
- Show loading for already cached data
- Use loading states that cause layout shifts
- Block user interaction unnecessarily
- Show multiple loading states simultaneously

## Component Reference

### PageLoading

Primary loading component for full-page states.

```typescript
<PageLoading 
  text="Loading brand..." 
  variant="hub" 
  className="custom-class" 
/>
```

**Props:**
- `text?: string` - Loading message
- `variant?: 'default' | 'hub' | 'feature'` - Visual variant
- `className?: string` - Additional CSS classes

### SuspenseWrapper

React Suspense wrapper with consistent fallbacks.

```typescript
<SuspenseWrapper 
  loadingText="Loading component..."
  variant="hub"
  fallback={<CustomLoading />}
>
  <LazyComponent />
</SuspenseWrapper>
```

**Props:**
- `children: ReactNode` - Component to wrap
- `loadingText?: string` - Loading message
- `variant?: 'default' | 'hub' | 'feature'` - Visual variant
- `fallback?: ReactNode` - Custom fallback component

### HubSuspenseWrapper

Hub-specific suspense wrapper.

```typescript
<HubSuspenseWrapper loadingText="Loading dashboard...">
  <LazyDashboard />
</HubSuspenseWrapper>
```

**Props:**
- `children: ReactNode` - Component to wrap
- `loadingText?: string` - Loading message

### Specialized Components

#### PageTransitionLoading

For page transitions with full-screen overlay.

```typescript
<PageTransitionLoading 
  text="Navigating to dashboard..." 
  className="z-50" 
/>
```

#### InlineLoading

For small, inline loading states.

```typescript
<InlineLoading text="Saving..." className="ml-2" />
```

#### ButtonLoading

For button loading states.

```typescript
<ButtonLoading text="Processing..." className="w-4 h-4" />
```

## Migration Guide

### From Custom Loading to Standardized

**Before:**
```typescript
// Custom loading component
export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading brand profile...</span>
        </div>
    );
}
```

**After:**
```typescript
// Standardized loading component
import { PageLoading } from '@/components/ui/page-loading';

export default function Loading() {
    return <PageLoading text="Loading brand..." />;
}
```

### From Hardcoded Messages to Constants

**Before:**
```typescript
<PageLoading text="Loading brand profile..." />
```

**After:**
```typescript
import { LOADING_MESSAGES } from '@/lib/constants/loading-messages';

<PageLoading text={LOADING_MESSAGES.FEATURES.BRAND_PROFILE} />
```

## Testing Loading States

### Manual Testing

1. **Network Throttling**: Use browser dev tools to simulate slow connections
2. **Loading Duration**: Verify loading states appear for appropriate duration
3. **Message Accuracy**: Ensure loading messages match actual operations
4. **Visual Consistency**: Check loading states across different pages/components

### Automated Testing

```typescript
// Test loading state appears
test('shows loading state while fetching data', async () => {
  render(<ComponentWithLoading />);
  
  expect(screen.getByText('Loading brand...')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.queryByText('Loading brand...')).not.toBeInTheDocument();
  });
});

// Test loading message consistency
test('uses correct loading message', () => {
  render(<BrandLoading />);
  
  expect(screen.getByText(LOADING_MESSAGES.HUBS.BRAND)).toBeInTheDocument();
});
```

## Accessibility Considerations

### Screen Readers

- Loading states include appropriate ARIA labels
- Loading messages are announced to screen readers
- Loading spinners have `aria-label` attributes

### Visual Indicators

- Loading states provide clear visual feedback
- Sufficient color contrast for loading text
- Loading animations respect `prefers-reduced-motion`

### Keyboard Navigation

- Loading states don't trap keyboard focus
- Users can still navigate while content loads
- Loading states don't interfere with keyboard shortcuts

## Future Enhancements

### Planned Improvements

1. **Progress Indicators**: Show progress for multi-step operations
2. **Skeleton Loading**: Implement skeleton screens for known layouts
3. **Smart Loading**: Context-aware loading messages based on user actions
4. **Loading Analytics**: Track loading times and user experience metrics

### Extension Points

- Custom loading animations for specific features
- Branded loading states for white-label deployments
- Internationalization support for loading messages
- Advanced progress tracking for complex operations

---

## Related Documentation

- [Design System](./design-system/design-system.md) - Overall design system documentation
- [Component Library](../src/components/ui/) - UI component implementations
- [Animation Guidelines](./design-system/animation-patterns-guide.md) - Animation patterns and timing
- [Accessibility Guide](./design-system/accessibility-guide.md) - Accessibility standards

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Maintained by:** Frontend Team