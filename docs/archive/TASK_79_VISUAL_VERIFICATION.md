# Task 79: Icon Replacement - Visual Verification Guide

## Overview

This guide helps verify that all custom icons have been properly integrated and are displaying correctly throughout the application.

## Verification Checklist

### 1. Navigation (Sidebar)

**Location:** Left sidebar navigation

**Icons to Verify:**

- [ ] **Dashboard** - Should show animated house icon (HouseIcon)
- [ ] **Content Engine** - Should show animated document icon (ContentIcon)
- [ ] **Competitive Analysis** - Should show animated users icon (UsersIcon)
- [ ] **Research Agent** - Should show animated AI sparkle icon (AISparkleIcon)

**How to Test:**

1. Navigate to any page in the app
2. Check the sidebar (expand if collapsed)
3. Verify icons match the custom real estate theme
4. Icons should NOT animate in navigation (performance optimization)
5. Hover over items to see smooth transitions

**Expected Behavior:**

- Icons render at consistent size (w-5 h-5)
- Icons maintain proper spacing with labels
- Icons work in both expanded and collapsed sidebar states
- Tooltips appear correctly in collapsed state

---

### 2. Dashboard Page

**Location:** `/dashboard`

**Icons to Verify:**

#### Your Next Steps Section

- [ ] **Section Header** - ContentIcon (animated) next to "Your Next Steps"

#### Empty State (if no marketing plan)

- [ ] **Empty State Icon** - AISparkleIcon (animated) in the center
- [ ] **Generate Button** - AISparkleIcon (non-animated) in button

#### Reviews Section

- [ ] **Empty State** - MessageSquare icon (if no reviews)

**How to Test:**

1. Navigate to `/dashboard`
2. Check the "Your Next Steps" card header
3. If no marketing plan exists, verify the empty state icon
4. Check the reviews carousel for empty state

**Expected Behavior:**

- Animated icons should have smooth, continuous animation
- Icons should be properly sized and centered
- Icons should work in both light and dark mode
- Empty state icons should draw attention without being distracting

---

### 3. Marketing Plan Page

**Location:** `/marketing-plan`

**Icons to Verify:**

#### Empty State (if no plan)

- [ ] **Empty State Icon** - AISparkleIcon (animated) in center
- [ ] **Generate Button** - AISparkleIcon (non-animated) in button

#### Loading State

- [ ] **Loading Header** - AISparkleIcon (animated) during generation

**How to Test:**

1. Navigate to `/marketing-plan`
2. If no plan exists, verify empty state icon
3. Click "Generate My Marketing Plan" and watch loading state
4. Verify icon in button before clicking

**Expected Behavior:**

- Empty state icon should rotate/pulse smoothly
- Button icon should be static (no animation)
- Loading state icon should indicate AI processing
- Icons should maintain proper sizing throughout states

---

### 4. Brand Audit Page

**Location:** `/brand-audit`

**Icons to Verify:**

#### Empty State (if no audit)

- [ ] **Empty State Icon** - ChartIcon (animated) in center

#### Action Buttons

- [ ] **Run Audit Button** - AISparkleIcon (non-animated)
- [ ] **Fetch Reviews Button** - AISparkleIcon (non-animated)

**How to Test:**

1. Navigate to `/brand-audit`
2. If no audit exists, verify empty state icon
3. Check the "Run Audit" button icon
4. Check the "Fetch Reviews" button icon

**Expected Behavior:**

- Chart icon should animate with bars growing
- Button icons should be static
- Icons should be properly aligned with button text
- Icons should work during loading states (spinner replaces icon)

---

### 5. Toast Notifications

**Location:** Appears in top-right corner

**Icons to Verify:**

#### Success Toasts

- [ ] **Success Icon** - SuccessIcon (animated) with checkmark

#### AI Toasts

- [ ] **AI Icon** - AISparkleIcon (animated) with sparkle effect

#### Error Toasts

- [ ] **Error Icon** - AlertCircle (Lucide) for consistency

**How to Test:**

1. Trigger various actions that show toasts:
   - Save profile → Success toast
   - Generate content → AI toast
   - Cause an error → Error toast
2. Verify icons appear on the left side of toast
3. Check animation plays smoothly

**Expected Behavior:**

- Icons should appear immediately with toast
- Success icon should have celebration animation
- AI icon should have sparkle/rotation animation
- Icons should not squish or overflow
- Icons should work in both light and dark mode

---

## Common Issues and Solutions

### Issue: Icons Not Showing

**Solution:** Check browser console for import errors. Verify `@/components/ui/real-estate-icons` is accessible.

### Issue: Icons Too Large/Small

**Solution:** Verify className includes proper sizing (e.g., `w-5 h-5`, `h-8 w-8`)

### Issue: Animations Not Working

**Solution:**

- Check that `animated={true}` is set for icons that should animate
- Verify Framer Motion is installed and working
- Check if user has reduced motion preferences enabled

### Issue: Icons Misaligned

**Solution:**

- Verify flex/grid layout is correct
- Check that `flex-shrink-0` is applied where needed
- Verify spacing classes (gap-2, gap-3, etc.)

### Issue: Dark Mode Issues

**Solution:**

- Icons use `currentColor` and CSS variables
- Verify theme provider is working
- Check that color classes use theme variables

---

## Browser Testing

Test in the following browsers:

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Accessibility Testing

- [ ] Icons have proper ARIA labels where needed
- [ ] Icons don't interfere with screen readers
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Icons maintain sufficient color contrast
- [ ] Icons are not the only way to convey information

---

## Performance Testing

- [ ] Page load time not significantly impacted
- [ ] Animations run at 60fps
- [ ] No layout shift when icons load
- [ ] Icons don't cause memory leaks
- [ ] Bundle size increase is acceptable

---

## Sign-Off

Once all items are verified:

- [ ] All navigation icons display correctly
- [ ] All dashboard icons display correctly
- [ ] All page-specific icons display correctly
- [ ] All toast icons display correctly
- [ ] Animations work smoothly
- [ ] Dark mode works correctly
- [ ] Mobile responsive
- [ ] Accessibility compliant
- [ ] Performance acceptable

**Verified By:** ********\_********
**Date:** ********\_********
**Notes:** ********\_********
