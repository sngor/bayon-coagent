# Mobile Optimizations Quick Reference

## Touch Target Sizes

All interactive elements automatically meet the 44x44px minimum:

```tsx
// Buttons - already optimized
<Button>Click me</Button>

// Tabs - already optimized
<TabsTrigger value="tab1">Tab 1</TabsTrigger>

// Custom elements - add touch-target class
<div className="touch-target" onClick={handleClick}>
  Custom interactive element
</div>
```

## Momentum Scrolling

Enabled globally. For custom scrollable containers:

```tsx
<div className="overflow-auto momentum-scroll">Scrollable content</div>
```

## Mobile Layout Classes

```tsx
// Stack on mobile
<div className="flex mobile-stack">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Full width on mobile
<div className="w-1/2 mobile-full-width">Content</div>

// Hide on mobile
<div className="mobile-hidden">Desktop only</div>

// Show only on mobile
<div className="mobile-only">Mobile only</div>
```

## Touch Feedback

Automatically applied to buttons. For custom elements:

```tsx
<div className="touch-feedback" onClick={handleClick}>
  Interactive element with feedback
</div>
```

## Safe Area Insets (for notched devices)

```tsx
<div className="safe-area-inset">Content respects notches</div>
```

## Prevent Zoom on iOS

Input fields automatically have `font-size: 16px` to prevent zoom.

## Component Updates

All UI components have been updated:

- ✅ Button
- ✅ Tabs
- ✅ AnimatedTabs
- ✅ Checkbox (increased to 24x24px)
- ✅ Switch
- ✅ FloatingActionButton

## Testing

Test on actual devices:

- iOS Safari
- Chrome Mobile
- Various screen sizes (320px, 375px, 414px, 768px)

## Files Modified

- `src/styles/mobile-optimizations.css` - Main optimization styles
- `src/app/globals.css` - Import added
- `src/components/ui/button.tsx` - Already had touch targets
- `src/components/ui/tabs.tsx` - Added touch targets
- `src/components/ui/animated-tabs.tsx` - Added touch targets
- `src/components/ui/checkbox.tsx` - Increased size, added touch targets
- `src/components/ui/switch.tsx` - Added touch targets
- `src/components/ui/floating-action-button.tsx` - Added touch targets
