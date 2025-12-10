# Onboarding Mobile Optimization - Quick Reference

## Quick Start

### Import Responsive Hooks

```typescript
import { useIsMobile } from "@/hooks/use-mobile";
import { useTablet } from "@/hooks/use-tablet";

const isMobile = useIsMobile();
const { isTablet, isTabletPortrait } = useTablet();
```

### Touch-Optimized Button

```typescript
<Button
  className={cn(
    "w-full sm:w-auto",
    isMobile && "min-h-[44px] touch-manipulation"
  )}
>
  Button Text
</Button>
```

### Responsive Grid

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
  {/* Content */}
</div>
```

### Responsive Typography

```typescript
<h1 className="text-2xl sm:text-3xl md:text-4xl">Title</h1>
<p className="text-sm sm:text-base md:text-lg">Body</p>
```

### Responsive Padding

```typescript
<div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
  {/* Content */}
</div>
```

## Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## Touch Targets

- **Mobile**: 44x44px minimum
- **Tablet**: 40x40px minimum
- **Desktop**: Standard

## Common Patterns

### Conditional Rendering

```typescript
{
  isMobile ? <MobileComponent /> : <DesktopComponent />;
}
```

### Conditional Styling

```typescript
className={cn(
  "base-styles",
  isMobile && "mobile-styles",
  isTablet && "tablet-styles"
)}
```

### Touch Feedback

```typescript
className={cn(
  "transition-all",
  isMobile && "active:scale-[0.98] touch-manipulation"
)}
```

## CSS Classes

### Safe Areas

- `safe-area-inset-top`
- `safe-area-inset-bottom`
- `safe-area-inset-left`
- `safe-area-inset-right`

### Touch Optimization

- `touch-manipulation` - Prevents double-tap zoom
- `touch-target` - Ensures 44x44px minimum
- `touch-target-large` - Ensures 56x56px minimum

### Performance

- `animate-optimized` - GPU acceleration for mobile
- `prevent-overscroll` - Prevents overscroll on iOS

## Accessibility

### ARIA Labels

```typescript
<Button aria-label="Descriptive action">Icon Only</Button>
```

### Focus Management

```typescript
<div className="focus-visible:outline-2 focus-visible:outline-primary">
  {/* Content */}
</div>
```

## Testing Checklist

### Mobile

- [ ] Touch targets ≥ 44x44px
- [ ] Text readable without zoom
- [ ] No horizontal scroll
- [ ] Touch feedback works
- [ ] Safe areas respected

### Tablet

- [ ] Touch targets ≥ 40x40px
- [ ] Layout adapts properly
- [ ] Navigation works
- [ ] Text sizing appropriate

### Desktop

- [ ] Layout centered
- [ ] Hover states work
- [ ] Keyboard navigation
- [ ] All features visible

## Common Issues

### Issue: Text too small on mobile

**Solution**: Use responsive text classes

```typescript
className = "text-sm sm:text-base md:text-lg";
```

### Issue: Buttons too small to tap

**Solution**: Add minimum height

```typescript
className={cn(isMobile && "min-h-[44px]")}
```

### Issue: Layout breaks on tablet

**Solution**: Test all breakpoints

```typescript
className = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
```

### Issue: Animations janky on mobile

**Solution**: Use GPU acceleration

```typescript
className="animate-optimized"
// or
style={{ willChange: 'transform', transform: 'translateZ(0)' }}
```

## Resources

- Full Guide: `RESPONSIVE_DESIGN.md`
- Mobile CSS: `src/styles/onboarding-mobile.css`
- Implementation: `TASK_15_RESPONSIVE_DESIGN_SUMMARY.md`
