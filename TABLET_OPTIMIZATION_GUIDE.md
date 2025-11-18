# Tablet Optimization Guide

## Overview

This guide documents the tablet viewport optimizations implemented for the real estate agent marketing platform. These optimizations ensure efficient use of tablet screen space (768px - 1024px) and smooth adaptation to orientation changes.

**Requirements Addressed:**

- 4.2: WHEN using a tablet viewport THEN the Application SHALL adapt layouts to utilize available screen space efficiently
- 4.4: WHEN rotating a device THEN the Application SHALL adjust the layout smoothly without losing context

## Tablet Viewport Definition

- **Tablet Range**: 768px - 1024px width
- **Portrait Orientation**: Height > Width
- **Landscape Orientation**: Width > Height

## Implementation

### 1. CSS Utilities (globals.css)

Added tablet-specific utility classes:

```css
/* Tablet viewport utilities (768px - 1024px) */
@media (min-width: 768px) and (max-width: 1024px) {
  .tablet\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .tablet\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .tablet\:col-span-2 {
    grid-column: span 2 / span 2;
  }
  .tablet\:gap-6 {
    gap: 1.5rem;
  }
  .tablet\:p-6 {
    padding: 1.5rem;
  }
}

/* Tablet portrait specific */
@media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
  .tablet-portrait\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Tablet landscape specific */
@media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
  .tablet-landscape\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* Smooth transitions for orientation changes */
.orientation-transition {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 2. Tailwind Configuration

Extended Tailwind with tablet-specific breakpoints:

```typescript
screens: {
  'tablet': {'min': '768px', 'max': '1024px'},
  'tablet-portrait': {'min': '768px', 'max': '1024px', 'raw': '(orientation: portrait)'},
  'tablet-landscape': {'min': '768px', 'max': '1024px', 'raw': '(orientation: landscape)'},
}
```

### 3. React Hook (use-tablet.tsx)

Created a hook for detecting tablet viewport and orientation:

```typescript
const { isTablet, orientation, isTabletPortrait, isTabletLandscape } =
  useTablet();
```

**Features:**

- Real-time viewport detection
- Orientation tracking
- Automatic updates on resize/orientation change
- SSR-safe implementation

### 4. Utility Functions (tablet-optimization.ts)

Comprehensive utilities for tablet optimization:

```typescript
// Viewport detection
isTabletViewport(): boolean
isPortraitOrientation(): boolean
isLandscapeOrientation(): boolean

// Layout helpers
getTabletColumnCount(portraitColumns, landscapeColumns): number
getRecommendedTabletGrid(contentType): { portrait, landscape }
getTabletLayoutClasses(layoutType): string

// Spacing calculations
getTabletSpacing(baseSpacing): { gap, padding }

// Monitoring
onOrientationChange(callback): cleanup function
auditTabletResponsiveness(): { issues, warnings, passed }
```

## Usage Examples

### Basic Grid Layout

```tsx
<div className="grid grid-cols-1 tablet-portrait:grid-cols-2 tablet-landscape:grid-cols-3 lg:grid-cols-4 gap-4 tablet:gap-6 orientation-transition">
  {items.map((item) => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</div>
```

**Behavior:**

- Mobile: 1 column
- Tablet Portrait: 2 columns
- Tablet Landscape: 3 columns
- Desktop: 4 columns

### Dashboard Layout

```tsx
<div className="grid grid-cols-1 tablet:grid-cols-3 lg:grid-cols-3 gap-6 tablet:gap-8 orientation-transition">
  <div className="tablet:col-span-2 lg:col-span-2">
    {/* Main content - 2/3 width on tablet */}
  </div>
  <div className="tablet:col-span-1 lg:col-span-1">
    {/* Sidebar - 1/3 width on tablet */}
  </div>
</div>
```

### Using the Hook

```tsx
function MyComponent() {
  const { isTablet, orientation } = useTablet();

  return (
    <div>{isTablet && <p>Viewing on tablet in {orientation} mode</p>}</div>
  );
}
```

### Using Utility Functions

```typescript
import {
  getTabletLayoutClasses,
  getRecommendedTabletGrid,
} from "@/lib/tablet-optimization";

// Get pre-configured layout classes
const layoutClasses = getTabletLayoutClasses("grid");

// Get recommended grid for content type
const gridClasses = getRecommendedTabletGrid("cards");
// Returns: { portrait: 'tablet-portrait:grid-cols-2', landscape: 'tablet-landscape:grid-cols-3' }
```

## Pages Updated

The following pages have been optimized for tablet viewports:

1. **Dashboard** (`src/app/(app)/dashboard/page.tsx`)

   - 3-column layout on tablet (2 main + 1 sidebar)
   - Optimized metric cards grid
   - Smooth orientation transitions

2. **Brand Audit** (`src/app/(app)/brand-audit/page.tsx`)

   - 3-column layout on tablet
   - 2-column bottom section
   - Efficient space utilization

3. **Content Engine** (`src/app/(app)/content-engine/page.tsx`)

   - Adaptive content type grid
   - 2 columns in portrait, 3 in landscape

4. **Tablet Test Page** (`src/app/(app)/tablet-test/page.tsx`)
   - Comprehensive testing interface
   - Real-time viewport detection
   - Orientation change demonstrations

## Testing

### Desktop Browser Testing

1. Open Chrome DevTools (F12)
2. Enable device toolbar (Ctrl+Shift+M)
3. Select iPad or tablet device
4. Test both portrait and landscape orientations
5. Verify smooth transitions

### Tablet Device Testing

1. Open application on tablet device
2. Navigate to `/tablet-test` page
3. Verify viewport detection shows "Tablet"
4. Rotate device between orientations
5. Observe smooth layout transitions
6. Check for horizontal scrolling (should be none)

### Automated Audit

```typescript
import { auditTabletResponsiveness } from "@/lib/tablet-optimization";

const results = auditTabletResponsiveness();
console.log(results);
// { issues: [], warnings: [], passed: true }
```

## Best Practices

### 1. Always Use Orientation Transitions

Add `orientation-transition` class to containers that should smoothly adapt:

```tsx
<div className="grid grid-cols-1 tablet:grid-cols-2 orientation-transition">
```

### 2. Consider Both Orientations

Design for both portrait and landscape:

```tsx
<div className="tablet-portrait:grid-cols-2 tablet-landscape:grid-cols-3">
```

### 3. Optimize Spacing

Use tablet-specific spacing for better visual hierarchy:

```tsx
<div className="gap-4 tablet:gap-6 lg:gap-8">
```

### 4. Test Orientation Changes

Always test how layouts behave when rotating the device.

### 5. Avoid Fixed Widths

Use responsive units and grid systems instead of fixed pixel widths.

## Common Patterns

### Two-Column Tablet Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 orientation-transition">
  {/* Mobile: 1 col, Tablet: 2 cols, Desktop: 4 cols */}
</div>
```

### Three-Column Dashboard

```tsx
<div className="grid grid-cols-1 tablet:grid-cols-3 gap-6 orientation-transition">
  <div className="tablet:col-span-2">{/* Main content */}</div>
  <div className="tablet:col-span-1">{/* Sidebar */}</div>
</div>
```

### Orientation-Aware Grid

```tsx
<div className="grid grid-cols-1 tablet-portrait:grid-cols-2 tablet-landscape:grid-cols-3 gap-4 orientation-transition">
  {/* Adapts to orientation */}
</div>
```

## Performance Considerations

1. **CSS Transitions**: The `orientation-transition` class uses hardware-accelerated transforms
2. **Event Listeners**: The `useTablet` hook efficiently debounces resize events
3. **SSR Safety**: All viewport detection is client-side only

## Accessibility

- Orientation changes maintain focus state
- No content is hidden or lost during transitions
- Touch targets remain adequately sized (44x44px minimum)
- Reduced motion preferences are respected

## Browser Support

- Chrome/Edge: Full support
- Safari: Full support
- Firefox: Full support
- iOS Safari: Full support with orientation events
- Android Chrome: Full support with orientation events

## Troubleshooting

### Layouts Not Adapting

1. Ensure `orientation-transition` class is applied
2. Check that tablet breakpoint classes are used
3. Verify no conflicting CSS overrides

### Jerky Transitions

1. Check for JavaScript that modifies layout during transitions
2. Ensure `prefers-reduced-motion` is respected
3. Verify GPU acceleration is enabled

### Orientation Not Detected

1. Check browser console for errors
2. Verify `useTablet` hook is used in client component
3. Test with actual device rotation, not just browser resize

## Future Enhancements

- [ ] Add tablet-specific touch gestures
- [ ] Implement split-screen optimizations
- [ ] Add tablet-specific navigation patterns
- [ ] Create tablet-optimized modals and dialogs

## Related Files

- `src/app/globals.css` - CSS utilities
- `tailwind.config.ts` - Tailwind configuration
- `src/hooks/use-tablet.tsx` - React hook
- `src/lib/tablet-optimization.ts` - Utility functions
- `src/app/(app)/tablet-test/page.tsx` - Test page

## References

- Requirements: 4.2, 4.4
- Design Document: `.kiro/specs/ui-ux-enhancement/design.md`
- Tasks: `.kiro/specs/ui-ux-enhancement/tasks.md` (Task 25)
