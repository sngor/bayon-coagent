# Device Testing Checklist

Cross-device testing checklist for quality assurance.

## Desktop (1920x1080)

### Layout

- [ ] Page layout renders correctly
- [ ] Navigation is accessible
- [ ] Content is properly aligned
- [ ] Sidebar layouts work correctly
- [ ] Grid layouts display properly

### Interactions

- [ ] All buttons are clickable
- [ ] Forms submit correctly
- [ ] Modals open and close
- [ ] Dropdowns work
- [ ] Hover states display

### Performance

- [ ] Page loads in < 3 seconds
- [ ] Animations are smooth (60fps)
- [ ] No layout shifts
- [ ] Images load properly

## Tablet (768x1024)

### Layout

- [ ] Responsive grid adjusts (2 columns)
- [ ] Navigation adapts (hamburger or tabs)
- [ ] Cards stack properly
- [ ] Tables switch to card view
- [ ] Sidebar moves below content

### Interactions

- [ ] Touch targets are 44x44px minimum
- [ ] Swipe gestures work
- [ ] Forms are easy to fill
- [ ] Modals are full-screen or large
- [ ] Dropdowns are touch-friendly

### Performance

- [ ] Page loads in < 4 seconds
- [ ] Smooth scrolling
- [ ] No janky animations

## Mobile (375x667)

### Layout

- [ ] Single column layout
- [ ] Navigation is hamburger menu
- [ ] Cards stack vertically
- [ ] Tables are card view
- [ ] Forms are single column
- [ ] Text is readable (16px minimum)

### Interactions

- [ ] Touch targets are 44x44px minimum
- [ ] Forms are easy to fill on small screen
- [ ] Modals are full-screen
- [ ] Bottom sheets work correctly
- [ ] Pull-to-refresh works (if applicable)

### Performance

- [ ] Page loads in < 5 seconds
- [ ] Smooth scrolling
- [ ] Minimal JavaScript
- [ ] Images are optimized

## All Devices

### Dark Mode

- [ ] All colors adapt correctly
- [ ] Text is readable
- [ ] Images have proper contrast
- [ ] Icons are visible
- [ ] Borders are visible

### Loading States

- [ ] Spinners display correctly
- [ ] Skeletons match content
- [ ] Progress indicators work
- [ ] Loading messages are clear

### Empty States

- [ ] Icons display correctly
- [ ] Messages are clear
- [ ] Actions are accessible
- [ ] Layout is centered

### Error States

- [ ] Error messages are clear
- [ ] Actions are provided (retry, etc.)
- [ ] Layout doesn't break
- [ ] User can recover

### Forms

- [ ] Labels are associated with inputs
- [ ] Validation messages display
- [ ] Required fields are marked
- [ ] Submit buttons have loading states
- [ ] Success/error feedback is shown

### Accessibility

- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] ARIA labels are correct
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader compatible

## Browser Testing

### Chrome

- [ ] Desktop
- [ ] Mobile

### Safari

- [ ] Desktop (macOS)
- [ ] Mobile (iOS)

### Firefox

- [ ] Desktop

### Edge

- [ ] Desktop

## Testing Tools

### Manual Testing

- Chrome DevTools (Device Mode)
- Safari Responsive Design Mode
- Physical devices (if available)

### Automated Testing

```bash
# Run tests
npm test

# Visual regression tests
npm run test:visual
```

### Performance Testing

```bash
# Lighthouse
npm run lighthouse

# Bundle analysis
npm run analyze
```

## Common Issues

### Layout Issues

- Content overflow on small screens
- Grid not responsive
- Fixed widths breaking layout
- Z-index conflicts

### Interaction Issues

- Touch targets too small
- Hover states on mobile
- Form inputs hard to tap
- Modals not scrollable

### Performance Issues

- Large images not optimized
- Too much JavaScript
- Blocking resources
- Layout shifts

## Quick Fixes

### Responsive Grid

```tsx
<div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Touch Targets

```tsx
<button className="min-h-[44px] min-w-[44px]">
```

### Readable Text

```tsx
<p className="text-base"> {/* 16px minimum */}
```

### Responsive Table

```tsx
import { ResponsiveTable } from "@/components/responsive-table";

<ResponsiveTable
  data={items}
  columns={columns}
  mobileCard={(item) => <ItemCard item={item} />}
/>;
```

## See Also

- [Mobile Optimization](./guides/mobile-optimization.md)
- [Tablet Optimization](./guides/tablet-optimization.md)
- [Performance Guide](./guides/performance.md)
