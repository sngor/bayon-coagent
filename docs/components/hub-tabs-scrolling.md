# Hub Tabs Scrolling Implementation

## Overview

The hub tabs component has been enhanced to provide a smooth scrolling experience on small screens where tab content may overflow the container width.

## Key Features

### 1. Horizontal Scrolling
- **Smooth scrolling**: Uses `scroll-behavior: smooth` for animated scrolling
- **Touch-friendly**: Includes `-webkit-overflow-scrolling: touch` for iOS devices
- **Hidden scrollbars**: Uses custom `scrollbar-hide` utility to hide scrollbars while maintaining functionality

### 2. Responsive Margins & Layout Structure
- **Wrapper-based margins**: `mx-4` (16px) on mobile, `mx-6` (24px) on larger screens (`sm:mx-6`)
- **Variant-specific styling**: Each variant (default, pills, underline) has its own container and wrapper styles
- **Consistent spacing**: Maintains visual balance across all screen sizes and variants
- **Memoized styles**: Styles are calculated once and memoized to prevent unnecessary re-renders

### 3. Scroll Indicators
- **Left indicator**: Gradient fade showing when content is scrollable to the left
- **Right indicator**: Gradient fade showing when content is scrollable to the right
- **Dynamic visibility**: Indicators appear/disappear based on scroll position
- **Threshold-based**: 10px threshold prevents flickering at scroll boundaries

### 4. Auto-scroll to Active Tab
- **Smart centering**: Automatically scrolls to center the active tab when it changes
- **Visibility detection**: Only scrolls if the active tab is not fully visible
- **Smooth animation**: Uses `scrollTo` with smooth behavior for better UX

## Technical Implementation

### Style Architecture
The component now uses a memoized style system that separates concerns:

```tsx
const styles = useMemo(() => {
  const baseStyles = 'inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variantStyles = {
    default: {
      tab: 'px-4 py-2 rounded-full border-none bg-transparent whitespace-nowrap',
      container: 'overflow-x-auto scrollbar-hide rounded-full p-1.5 transition-all duration-200',
      wrapper: 'mx-4 sm:mx-6'
    },
    pills: {
      tab: 'px-4 py-2 rounded-full border-none bg-transparent whitespace-nowrap',
      container: 'overflow-x-auto scrollbar-hide rounded-full p-1.5 transition-all duration-200',
      wrapper: 'mx-4 sm:mx-6'
    },
    underline: {
      tab: 'px-4 py-2 rounded-none border-b-2 border-transparent bg-transparent whitespace-nowrap',
      container: 'overflow-x-auto scrollbar-hide border-b border-border px-1.5',
      wrapper: 'mx-4 sm:mx-6'
    }
  };

  return {
    base: baseStyles,
    tab: variantStyles[variant].tab,
    container: variantStyles[variant].container,
    wrapper: variantStyles[variant].wrapper
  };
}, [variant]);
```

### CSS Classes Added
```css
/* Scrollbar utilities */
.scrollbar-hide {
  -ms-overflow-style: none;  /* Internet Explorer 10+ */
  scrollbar-width: none;  /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Safari and Chrome */
}
```

### Component Structure
```tsx
<div className={cn("relative", styles.wrapper)}>
  {/* Left scroll indicator */}
  {showLeftIndicator && (
    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10 rounded-l-full" />
  )}
  
  {/* Scrollable container */}
  <div
    ref={scrollContainerRef}
    className={cn(
      styles.container,
      'scroll-smooth touch-pan-x',
      isSticky ? 'bg-background/95 backdrop-blur-xl border border-border/20 shadow-sm' : 'bg-transparent'
    )}
  >
    <div ref={tabsRef} className="inline-flex items-center gap-1 min-w-max" role="tablist">
      {/* Tab buttons with whitespace-nowrap */}
    </div>
  </div>
  
  {/* Right scroll indicator */}
  {showRightIndicator && (
    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 rounded-r-full" />
  )}
</div>
```

### Key Improvements

1. **Performance Optimized**
   - Memoized callbacks and styles to prevent unnecessary re-renders
   - Efficient scroll detection with proper cleanup
   - Variant-specific style calculation with memoization

2. **Improved Layout Structure**
   - Separated wrapper, container, and tab styling concerns
   - Consistent margin handling across all variants
   - Better separation of layout and visual styling

3. **Enhanced Styling System**
   - Variant-specific styles for default, pills, and underline tabs
   - Consistent whitespace handling with `whitespace-nowrap`
   - Improved container styling with proper padding and borders

4. **Accessibility**
   - Maintains keyboard navigation (arrow keys)
   - Proper ARIA attributes and roles
   - Focus management when navigating with keyboard

5. **Mobile-First Design**
   - Touch-friendly scrolling on mobile devices
   - Responsive margins that adapt to screen size
   - Smooth animations that work across devices

6. **Visual Polish**
   - Gradient indicators provide clear visual feedback
   - Smooth transitions and animations
   - Consistent styling across all variants (default, pills, underline)

## Usage

The component automatically handles scrolling behavior. No additional props or configuration needed:

```tsx
<HubTabs 
  tabs={tabs} 
  activeTab={currentTab}
  variant="default" // or "pills" or "underline"
  isSticky={false}
/>
```

## Browser Support

- **Modern browsers**: Full support with smooth scrolling
- **iOS Safari**: Touch scrolling with momentum
- **Firefox**: Hidden scrollbars with `scrollbar-width: none`
- **Internet Explorer 10+**: Hidden scrollbars with `-ms-overflow-style: none`

## Testing

Test the scrolling behavior by:
1. Reducing browser width to force tab overflow
2. Verifying scroll indicators appear/disappear correctly
3. Testing touch scrolling on mobile devices
4. Confirming active tab auto-centering works
5. Testing keyboard navigation (arrow keys)