# Hub Tabs Scrolling Implementation

## Overview

The hub tabs component has been enhanced to provide a smooth scrolling experience on small screens where tab content may overflow the container width. The component has been refactored for better maintainability, performance, and accessibility.

## Architecture Improvements

### 1. Separation of Concerns
The component has been split into focused modules:

- **`hub-tabs.tsx`**: Main component with presentation logic
- **`use-tab-scroll.ts`**: Custom hook handling all scroll-related logic
- **`tab-styles.ts`**: Centralized styling utilities and variant management

### 2. Custom Hook Pattern
The scroll logic has been extracted into `useTabScroll` hook:

```tsx
const { scrollContainerRef, tabsRef, showLeftIndicator, showRightIndicator } = useTabScroll({
    tabs,
    currentTab
});
```

This provides:
- Better testability
- Reusable scroll logic
- Cleaner component code
- Proper separation of concerns

### 3. Styling Utilities
Centralized styling system in `tab-styles.ts`:

```tsx
// Get styles for a variant
const styles = getTabStyles(variant);

// Get classes for a specific tab state
const className = getTabClasses(variant, isActive);
```

## Key Features

### 1. Horizontal Scrolling
- **Smooth scrolling**: Uses `scroll-behavior: smooth` for animated scrolling
- **Touch-friendly**: Includes `touch-pan-x` for optimal mobile scrolling
- **Hidden scrollbars**: Uses custom `scrollbar-hide` utility to hide scrollbars while maintaining functionality

### 2. Responsive Margins & Layout Structure
- **Progressive margins**: `mx-0` on mobile, `mx-4` on small screens, `mx-6` on medium+ screens
- **Mobile-first approach**: Zero margins on mobile (< 640px) for full-width utilization
- **Variant-specific styling**: Each variant (default, pills, underline) has its own container and wrapper styles
- **Consistent spacing**: Maintains visual balance across all screen sizes and variants
- **Optimized performance**: Styles are calculated once and memoized to prevent unnecessary re-renders

### 3. Scroll Indicators
- **Left indicator**: Gradient fade showing when content is scrollable to the left
- **Right indicator**: Gradient fade showing when content is scrollable to the right
- **Dynamic visibility**: Indicators appear/disappear based on scroll position
- **Threshold-based**: 10px threshold prevents flickering at scroll boundaries

### 4. Auto-scroll to Active Tab
- **Smart centering**: Automatically scrolls to center the active tab when it changes
- **Visibility detection**: Only scrolls if the active tab is not fully visible
- **Smooth animation**: Uses `scrollTo` with smooth behavior for better UX

### 5. Accessibility Improvements
- **Proper ARIA attributes**: Fixed `aria-selected` boolean values
- **Keyboard navigation**: Arrow key support with proper focus management
- **Screen reader support**: Comprehensive labeling and role definitions
- **Focus management**: Proper tab order and focus indicators

## Technical Implementation

### Performance Optimizations

1. **Memoized Callbacks**: All event handlers are memoized to prevent unnecessary re-renders
2. **Throttled Scroll**: Scroll detection uses `requestAnimationFrame` for optimal performance
3. **Memoized Styles**: Style calculations are cached and only recalculated when variant changes
4. **Efficient Re-renders**: Component only re-renders when necessary dependencies change

### Style Architecture
```tsx
const styles = useMemo(() => getTabStyles(variant), [variant]);
```

The styling system supports three variants with responsive margins:
- **default**: Rounded tabs with background colors
- **pills**: Similar to default with pill-shaped styling  
- **underline**: Bottom border tabs for minimal design

All variants use the progressive margin system: `mx-0 sm:mx-4 md:mx-6` for optimal mobile experience.

### Component Structure
```tsx
<div className={cn("relative", styles.wrapper)}>
  {/* Left scroll indicator */}
  {showLeftIndicator && <div className="gradient-fade-left" />}
  
  {/* Scrollable container */}
  <div ref={scrollContainerRef} className={styles.container}>
    <div ref={tabsRef} role="tablist">
      {/* Tab buttons */}
    </div>
  </div>
  
  {/* Right scroll indicator */}
  {showRightIndicator && <div className="gradient-fade-right" />}
</div>
```

### Key Improvements

1. **Code Organization**
   - Extracted scroll logic into reusable hook
   - Centralized styling utilities
   - Cleaner, more focused main component
   - Better separation of concerns

2. **Performance**
   - Memoized callbacks and styles prevent unnecessary re-renders
   - Efficient scroll detection with proper cleanup
   - Optimized container width with `w-fit`

3. **Maintainability**
   - Modular architecture makes testing easier
   - Clear separation between presentation and logic
   - Consistent styling patterns across variants
   - Well-documented interfaces

4. **Accessibility**
   - Fixed ARIA attribute values
   - Proper keyboard navigation
   - Screen reader compatibility
   - Focus management

5. **Mobile-First Design**
   - Progressive margin system (0 → 4 → 6) for optimal mobile experience
   - Full-width utilization on mobile devices (< 640px)
   - Touch-optimized scrolling
   - Responsive behavior across all devices

## Usage

The component automatically handles scrolling behavior with the improved architecture:

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

The modular architecture makes testing easier:

1. **Unit test the hook**: Test scroll logic in isolation
2. **Test styling utilities**: Verify variant styles are correct
3. **Integration tests**: Test component behavior with different props
4. **Accessibility tests**: Verify ARIA attributes and keyboard navigation

Test scenarios:
1. Reducing browser width to force tab overflow
2. Verifying scroll indicators appear/disappear correctly
3. Testing touch scrolling on mobile devices
4. Confirming active tab auto-centering works
5. Testing keyboard navigation (arrow keys)
6. Verifying ARIA attributes are properly set