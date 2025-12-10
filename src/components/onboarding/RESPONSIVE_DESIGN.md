# Onboarding Responsive Design Guide

## Overview

The onboarding system implements a mobile-first responsive design approach with three breakpoints and touch optimization for mobile devices.

**Requirements**: 7.1, 7.4

## Breakpoints

### Mobile (< 768px)

- **Layout**: Single column, full-width components
- **Touch Targets**: Minimum 44x44 pixels for all interactive elements
- **Typography**: Scaled down for readability (text-2xl for h1)
- **Spacing**: Reduced padding and gaps (px-4, gap-3)
- **Navigation**: Stacked buttons, full-width
- **Progress**: Simplified dot indicators
- **Animations**: Reduced motion (10px translate vs 20px)

### Tablet (768px - 1024px)

- **Layout**: Two-column grid for cards
- **Touch Targets**: Minimum 40x40 pixels
- **Typography**: Medium sizing (text-3xl for h1)
- **Spacing**: Moderate padding (px-6, gap-4)
- **Navigation**: Horizontal layout with flexible buttons
- **Progress**: Medium-sized step indicators with checkmarks
- **Animations**: Standard motion

### Desktop (> 1024px)

- **Layout**: Two-column grid with max-width container
- **Touch Targets**: Standard sizing
- **Typography**: Full sizing (text-4xl for h1)
- **Spacing**: Full padding (px-8, gap-4)
- **Navigation**: Horizontal layout with auto-width buttons
- **Progress**: Full-sized step indicators with checkmarks
- **Animations**: Full motion effects

## Component Responsive Features

### OnboardingContainer

- **Mobile**:
  - Reduced padding (px-4, py-6)
  - Scaled logo (scale-90)
  - Compact step counter (1/6 format)
  - Reduced animation distance (10px)
  - Faster animation (0.2s)
- **Tablet**:
  - Medium padding (px-6, py-8)
  - Standard logo
  - Full step counter
  - Standard animations
- **Desktop**:
  - Full padding (px-8, py-12)
  - Full animations (20px translate, 0.3s)

### OnboardingProgress

- **Mobile**:
  - Thinner progress bar (h-1.5)
  - Simple dot indicators
  - Centered layout
- **Tablet**:
  - Standard progress bar (h-2)
  - Medium step indicators (w-7 h-7)
  - Checkmarks for completed steps
- **Desktop**:
  - Standard progress bar (h-2)
  - Full step indicators (w-8 h-8)
  - Checkmarks for completed steps

### OnboardingNavigation

- **Mobile**:
  - Stacked layout (flex-col)
  - Full-width buttons
  - Minimum 44px height
  - Touch manipulation enabled
  - Back button at bottom
- **Tablet/Desktop**:
  - Horizontal layout (flex-row)
  - Auto-width buttons
  - Standard sizing
  - Back button at left

### Welcome Page Cards

- **Mobile**:
  - Single column grid
  - Compact padding (p-4)
  - Smaller icons (w-10 h-10)
  - Reduced text size (text-base, text-xs)
  - Active scale effect (0.98)
  - Minimum 88px height
- **Tablet/Desktop**:
  - Two-column grid
  - Full padding (p-6)
  - Standard icons (w-12 h-12)
  - Standard text size (text-lg, text-sm)

## Touch Optimization

### Minimum Touch Targets

All interactive elements meet WCAG 2.1 Level AAA guidelines:

- **Mobile**: 44x44 pixels minimum
- **Tablet**: 40x40 pixels minimum
- **Desktop**: Standard sizing

### Touch Enhancements

- `touch-manipulation` class prevents double-tap zoom
- `-webkit-tap-highlight-color: transparent` removes tap highlight
- `user-select: none` prevents text selection during touch
- Active states with scale transforms for feedback

### Safe Area Support

- `safe-area-inset-top` for notched devices
- `safe-area-inset-bottom` for home indicator
- Automatic padding adjustment for iOS devices

## Accessibility Features

### Keyboard Navigation

- Logical tab order
- Focus visible styles (2px outline)
- Focus-within states for containers
- Skip links for keyboard users

### Screen Readers

- ARIA labels on all interactive elements
- Progress announcements
- Step status indicators
- Descriptive button labels

### Reduced Motion

- Respects `prefers-reduced-motion` setting
- Minimal animations when enabled
- Instant transitions (0.01ms)

## Performance Optimizations

### Mobile Performance

- `will-change: transform, opacity` for animated elements
- `transform: translateZ(0)` for GPU acceleration
- `backface-visibility: hidden` prevents flickering
- Reduced animation complexity on mobile

### Rendering Optimizations

- Font smoothing for better text rendering
- Optimized for high DPI displays
- Backdrop blur with fallbacks
- Smooth scrolling with `-webkit-overflow-scrolling: touch`

## Testing Checklist

### Mobile (< 768px)

- [ ] All buttons are at least 44x44 pixels
- [ ] Text is readable without zooming
- [ ] Cards are full-width and stack vertically
- [ ] Navigation buttons are full-width and stacked
- [ ] Progress shows simplified dots
- [ ] Animations are smooth and reduced
- [ ] Safe areas are respected on notched devices
- [ ] No horizontal scrolling
- [ ] Touch interactions feel responsive

### Tablet (768px - 1024px)

- [ ] Cards display in 2-column grid
- [ ] Touch targets are at least 40x40 pixels
- [ ] Navigation is horizontal
- [ ] Progress shows medium indicators
- [ ] Text sizing is appropriate
- [ ] Spacing is balanced

### Desktop (> 1024px)

- [ ] Layout is centered with max-width
- [ ] All features are fully visible
- [ ] Hover states work correctly
- [ ] Keyboard navigation is smooth
- [ ] Progress shows full indicators

### Cross-Device

- [ ] Orientation changes are handled smoothly
- [ ] Transitions between breakpoints are seamless
- [ ] Content reflows without breaking
- [ ] Images and icons scale appropriately
- [ ] No layout shifts during loading

## Usage Examples

### Using Responsive Hooks

```typescript
import { useIsMobile } from "@/hooks/use-mobile";
import { useTablet } from "@/hooks/use-tablet";

function MyComponent() {
  const isMobile = useIsMobile();
  const { isTablet, isTabletPortrait } = useTablet();

  return (
    <div className={cn("p-4", isMobile && "p-2", isTablet && "p-6")}>
      {/* Content */}
    </div>
  );
}
```

### Touch-Optimized Buttons

```typescript
<Button
  className={cn(
    "w-full sm:w-auto",
    isMobile && "min-h-[44px] touch-manipulation"
  )}
  aria-label="Descriptive label for screen readers"
>
  Button Text
</Button>
```

### Responsive Grid

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
  {items.map((item) => (
    <Card
      key={item.id}
      className={cn(isMobile && "active:scale-[0.98] touch-manipulation")}
    >
      {/* Card content */}
    </Card>
  ))}
</div>
```

### Responsive Typography

```typescript
<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
  {title}
</h1>
<p className="text-sm sm:text-base md:text-lg text-muted-foreground">
  {description}
</p>
```

## Best Practices

1. **Mobile-First**: Start with mobile styles, add complexity for larger screens
2. **Touch Targets**: Always ensure minimum 44x44px on mobile
3. **Readable Text**: Use 16px minimum font size to prevent zoom on iOS
4. **Safe Areas**: Always account for notches and home indicators
5. **Performance**: Use GPU acceleration for animations on mobile
6. **Testing**: Test on real devices, not just browser DevTools
7. **Accessibility**: Ensure keyboard navigation and screen reader support
8. **Progressive Enhancement**: Core functionality works without JavaScript

## Common Patterns

### Responsive Padding

```typescript
className = "px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12";
```

### Responsive Text

```typescript
className = "text-sm sm:text-base md:text-lg";
```

### Responsive Grid

```typescript
className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4";
```

### Touch-Optimized Interactive

```typescript
className={cn(
  "transition-all",
  isMobile && "min-h-[44px] touch-manipulation active:scale-[0.98]"
)}
```

## Resources

- [WCAG 2.1 Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/)
- [Material Design Touch Targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
