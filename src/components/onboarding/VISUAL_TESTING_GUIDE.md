# Onboarding Visual Testing Guide

## Overview

This guide helps you visually test the responsive design implementation across different devices and viewports.

## Testing Tools

### Browser DevTools

1. Open Chrome/Firefox DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. Select device or custom dimensions
4. Test in both portrait and landscape

### Recommended Test Devices

#### Mobile

- iPhone SE (375x667) - Small mobile
- iPhone 12/13/14 (390x844) - Standard mobile
- iPhone 14 Pro Max (430x932) - Large mobile
- Samsung Galaxy S21 (360x800) - Android mobile
- Pixel 5 (393x851) - Android mobile

#### Tablet

- iPad Mini (768x1024) - Small tablet
- iPad Air (820x1180) - Standard tablet
- iPad Pro 11" (834x1194) - Medium tablet
- iPad Pro 12.9" (1024x1366) - Large tablet

#### Desktop

- 1280x720 - Small desktop
- 1920x1080 - Standard desktop
- 2560x1440 - Large desktop

## Visual Checklist

### Mobile (< 768px)

#### Layout

- [ ] Single column layout for all cards
- [ ] Full-width buttons
- [ ] Stacked navigation (vertical)
- [ ] Compact header with scaled logo
- [ ] No horizontal scrolling

#### Typography

- [ ] Headings: 24px (text-2xl)
- [ ] Body text: 16px (text-base)
- [ ] Small text: 12px (text-xs)
- [ ] All text readable without zoom

#### Spacing

- [ ] Container padding: 16px (px-4)
- [ ] Card padding: 16px (p-4)
- [ ] Gap between cards: 12px (gap-3)
- [ ] Vertical spacing: 24px (space-y-6)

#### Touch Targets

- [ ] All buttons ≥ 44px height
- [ ] All interactive elements ≥ 44x44px
- [ ] Adequate spacing between tappable elements
- [ ] Touch feedback on tap (scale effect)

#### Progress Indicator

- [ ] Thin progress bar (6px)
- [ ] Simple dot indicators
- [ ] Centered layout
- [ ] Step counter: "1/6" format

#### Icons

- [ ] Icon size: 40px (w-10 h-10)
- [ ] Icon container: 40px (w-10 h-10)
- [ ] Clear and visible

#### Safe Areas (iPhone X+)

- [ ] Header respects top notch
- [ ] Content respects bottom home indicator
- [ ] No content hidden behind notch

### Tablet (768px - 1024px)

#### Layout

- [ ] Two-column grid for cards
- [ ] Flexible button widths
- [ ] Horizontal navigation
- [ ] Standard header
- [ ] Balanced spacing

#### Typography

- [ ] Headings: 30px (text-3xl)
- [ ] Body text: 18px (text-lg)
- [ ] Small text: 14px (text-sm)

#### Spacing

- [ ] Container padding: 24px (px-6)
- [ ] Card padding: 24px (p-6)
- [ ] Gap between cards: 16px (gap-4)
- [ ] Vertical spacing: 32px (space-y-8)

#### Touch Targets

- [ ] All buttons ≥ 40px height
- [ ] All interactive elements ≥ 40x40px
- [ ] Comfortable spacing

#### Progress Indicator

- [ ] Standard progress bar (8px)
- [ ] Medium step indicators (28px)
- [ ] Checkmarks on completed steps
- [ ] Evenly spaced

#### Icons

- [ ] Icon size: 48px (w-12 h-12)
- [ ] Icon container: 48px (w-12 h-12)

### Desktop (> 1024px)

#### Layout

- [ ] Two-column grid for cards
- [ ] Centered with max-width (896px)
- [ ] Auto-width buttons
- [ ] Horizontal navigation
- [ ] Full header
- [ ] Generous spacing

#### Typography

- [ ] Headings: 36px (text-4xl)
- [ ] Body text: 18px (text-lg)
- [ ] Small text: 14px (text-sm)

#### Spacing

- [ ] Container padding: 32px (px-8)
- [ ] Card padding: 24px (p-6)
- [ ] Gap between cards: 16px (gap-4)
- [ ] Vertical spacing: 32px (space-y-8)

#### Touch Targets

- [ ] Standard button sizing
- [ ] Hover states visible
- [ ] Cursor changes on hover

#### Progress Indicator

- [ ] Standard progress bar (8px)
- [ ] Full step indicators (32px)
- [ ] Checkmarks on completed steps
- [ ] Numbers visible
- [ ] Evenly spaced

#### Icons

- [ ] Icon size: 48px (w-12 h-12)
- [ ] Icon container: 48px (w-12 h-12)

## Interaction Testing

### Touch Interactions (Mobile/Tablet)

- [ ] Tap buttons - should have visual feedback
- [ ] Tap cards - should scale slightly (0.98)
- [ ] Swipe - should scroll smoothly
- [ ] No accidental zooms on double-tap
- [ ] No text selection on tap

### Mouse Interactions (Desktop)

- [ ] Hover buttons - should show hover state
- [ ] Hover cards - should show shadow
- [ ] Click - should respond immediately
- [ ] Cursor changes appropriately

### Keyboard Navigation (All)

- [ ] Tab through elements in logical order
- [ ] Focus visible on all interactive elements
- [ ] Enter activates buttons
- [ ] Escape dismisses modals
- [ ] No focus traps

## Animation Testing

### Page Transitions

- [ ] Smooth fade and slide
- [ ] No jank or stuttering
- [ ] Appropriate speed (0.2s mobile, 0.3s desktop)
- [ ] Respects reduced motion preference

### Progress Bar

- [ ] Smooth width animation
- [ ] Spring animation feels natural
- [ ] Updates immediately on step change

### Button States

- [ ] Loading spinner smooth
- [ ] Disabled state clear
- [ ] Active state visible

## Accessibility Testing

### Screen Reader

- [ ] All buttons have labels
- [ ] Progress announced
- [ ] Step changes announced
- [ ] Error messages announced

### Keyboard Only

- [ ] Can complete entire flow
- [ ] Focus always visible
- [ ] Logical tab order
- [ ] No keyboard traps

### Color Contrast

- [ ] Text meets WCAG AA (4.5:1)
- [ ] Interactive elements distinguishable
- [ ] Focus indicators visible

### Reduced Motion

- [ ] Animations minimal or instant
- [ ] No motion sickness triggers
- [ ] Core functionality works

## Performance Testing

### Mobile Performance

- [ ] Smooth scrolling (60fps)
- [ ] No layout shifts
- [ ] Fast initial render
- [ ] Responsive to touch

### Load Time

- [ ] Page loads < 2 seconds
- [ ] Images load progressively
- [ ] No blocking resources

### Memory

- [ ] No memory leaks
- [ ] Smooth after extended use
- [ ] No crashes

## Edge Cases

### Orientation Changes

- [ ] Layout adapts smoothly
- [ ] No content loss
- [ ] State preserved
- [ ] Animations restart gracefully

### Viewport Resizing

- [ ] Responsive at all sizes
- [ ] No breaking points
- [ ] Smooth transitions
- [ ] Content reflows properly

### Long Content

- [ ] Long titles wrap properly
- [ ] Long descriptions don't overflow
- [ ] Scrolling works correctly
- [ ] No horizontal scroll

### Network Issues

- [ ] Loading states clear
- [ ] Error messages helpful
- [ ] Retry functionality works
- [ ] Offline handling graceful

## Browser Testing

### Required Browsers

- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)

### Mobile Browsers

- [ ] Safari iOS (latest)
- [ ] Chrome Android (latest)
- [ ] Samsung Internet (latest)

## Device Testing

### Real Device Testing

- [ ] Test on actual iPhone
- [ ] Test on actual iPad
- [ ] Test on actual Android phone
- [ ] Test on actual Android tablet

### Why Real Devices Matter

- Touch feel different
- Performance varies
- Safe areas behave differently
- Gestures work differently
- Network conditions vary

## Common Issues to Check

### Mobile

- [ ] Text not too small (min 16px)
- [ ] Buttons not too small (min 44px)
- [ ] No accidental zooms
- [ ] No horizontal scroll
- [ ] Safe areas respected

### Tablet

- [ ] Layout not too cramped
- [ ] Layout not too sparse
- [ ] Touch targets adequate
- [ ] Orientation changes smooth

### Desktop

- [ ] Content not too wide
- [ ] Content not too narrow
- [ ] Hover states work
- [ ] Keyboard navigation smooth

## Reporting Issues

When reporting visual issues, include:

1. Device/viewport size
2. Browser and version
3. Screenshot or video
4. Steps to reproduce
5. Expected vs actual behavior

## Quick Test Script

```bash
# Test mobile
1. Open DevTools
2. Set to iPhone 12 (390x844)
3. Refresh page
4. Check all items in Mobile checklist
5. Test touch interactions

# Test tablet
1. Set to iPad Air (820x1180)
2. Refresh page
3. Check all items in Tablet checklist
4. Test both orientations

# Test desktop
1. Set to 1920x1080
2. Refresh page
3. Check all items in Desktop checklist
4. Test keyboard navigation

# Test transitions
1. Slowly resize from 375px to 1920px
2. Watch for breaking points
3. Verify smooth transitions
4. Check all breakpoints
```

## Success Criteria

All checkboxes checked = Ready for production ✓

## Resources

- Responsive Design Guide: `RESPONSIVE_DESIGN.md`
- Mobile Quick Reference: `MOBILE_QUICK_REFERENCE.md`
- Implementation Summary: `TASK_15_RESPONSIVE_DESIGN_SUMMARY.md`
