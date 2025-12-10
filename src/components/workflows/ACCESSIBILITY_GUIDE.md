# Workflow Components Accessibility Guide

This document outlines the accessibility features implemented in the workflow components to ensure WCAG 2.1 AA compliance and provide an excellent experience for all users, including those using assistive technologies.

## Overview

All workflow components have been enhanced with comprehensive accessibility features including:

- **ARIA labels and attributes** for screen reader support
- **Keyboard navigation** for all interactive elements
- **Focus management** for modals and complex interactions
- **Color contrast** meeting WCAG AA standards
- **Screen reader announcements** for state changes
- **Semantic HTML** structure with proper headings and landmarks

## Component-Specific Accessibility Features

### 1. Dashboard Workflow Widget

**File:** `src/components/workflows/dashboard-workflow-widget.tsx`

#### ARIA Labels

- View mode toggle buttons have `aria-label` and `aria-pressed` attributes
- All workflow sections use `aria-labelledby` to associate headings
- Search input has descriptive `aria-label`
- Category filter has `aria-label`
- Workflow cards have `aria-label` describing the workflow

#### Keyboard Navigation

- Workflow cards are keyboard accessible with `tabIndex={0}`
- Enter and Space keys trigger card selection
- View toggle buttons are fully keyboard navigable

#### Semantic Structure

- Main heading has `id="workflows-heading"`
- Sections use `<section>` with `aria-labelledby`
- Search area uses `role="search"`
- Badges include descriptive `aria-label` for counts

#### Screen Reader Support

- Icons marked with `aria-hidden="true"`
- Progress percentages announced with context
- Status indicators (active, completed, stale) clearly labeled

### 2. Workflow Progress Tracker

**File:** `src/components/workflows/workflow-progress-tracker.tsx`

#### ARIA Labels

- Main container has `role="region"` with `aria-label="Workflow progress"`
- Step indicator uses `<nav>` with `role="navigation"`
- Current step announced with `aria-live="polite"`
- Each step has comprehensive `aria-label` including state
- Skip button has descriptive `aria-label`

#### Keyboard Navigation

- All clickable steps are keyboard accessible
- Steps have `role="button"` and `tabIndex`
- Enter and Space keys navigate to steps
- Disabled steps have `tabIndex={-1}` and `aria-disabled`

#### State Announcements

- Current step changes announced via `aria-live="polite"`
- Remaining time updates announced
- Step completion status clearly indicated

#### Visual Indicators

- Current step marked with `aria-current="step"`
- Completed, skipped, and upcoming states clearly differentiated
- Optional steps visually distinguished with badges

### 3. Workflow Detail Modal

**File:** `src/components/workflows/workflow-detail-modal.tsx`

#### ARIA Labels

- Dialog has `aria-describedby` linking to description
- All sections use `aria-labelledby` for headings
- Action buttons have descriptive `aria-label`
- Integration status clearly announced

#### Focus Management

- Focus automatically moves to modal on open
- Focus trapped within modal while open
- Focus returns to trigger element on close
- Tab order follows logical reading order

#### Semantic Structure

- Sections use `<section>` with proper headings
- Steps list uses semantic list structure
- Outcomes and prerequisites use proper list markup
- Integration status uses semantic badges

#### Screen Reader Support

- Icons marked with `aria-hidden="true"`
- All interactive elements properly labeled
- Status information (connected/not connected) clearly announced

### 4. Workflow Help Panel

**File:** `src/components/workflows/workflow-help-panel.tsx`

#### ARIA Labels

- Panel has `role="region"` with `aria-label`
- Collapse trigger has `aria-expanded` and `aria-controls`
- Content area has matching `id` for `aria-controls`
- Trigger button has descriptive `aria-label`

#### Keyboard Navigation

- Collapse/expand fully keyboard accessible
- Enter and Space keys toggle panel
- Focus management for collapsible content
- Links to documentation keyboard accessible

#### State Announcements

- Panel state (expanded/collapsed) announced
- AI step badge clearly indicated
- Help sections properly structured

### 5. Workflow Completion Summary

**File:** `src/components/workflows/workflow-completion-summary.tsx`

#### ARIA Labels

- Main container has `role="region"` with `aria-label`
- Completion message has `role="status"` with `aria-live="polite"`
- All section headings have unique `id` attributes
- Action buttons have descriptive `aria-label`

#### Semantic Structure

- Headings properly nested (h2 for main, h3 for sections)
- Lists use proper `<ul>` and `<li>` structure
- Cards use semantic card components
- Buttons clearly labeled with context

#### Screen Reader Support

- Celebration animation marked `aria-hidden="true"`
- Icons marked with `aria-hidden="true"`
- Completion status announced immediately
- All interactive elements properly labeled

## Color Contrast

All components meet WCAG AA color contrast requirements:

- **Text on background:** Minimum 4.5:1 ratio
- **Large text:** Minimum 3:1 ratio
- **Interactive elements:** Minimum 3:1 ratio
- **Focus indicators:** Clearly visible with sufficient contrast

### Color Combinations Tested

- Primary text on background: ✓ Passes
- Muted text on background: ✓ Passes
- Primary buttons: ✓ Passes
- Outline buttons: ✓ Passes
- Badge text: ✓ Passes
- Link text: ✓ Passes

## Keyboard Navigation

All interactive elements are keyboard accessible:

### Navigation Keys

- **Tab:** Move forward through interactive elements
- **Shift+Tab:** Move backward through interactive elements
- **Enter:** Activate buttons, links, and cards
- **Space:** Activate buttons and toggle controls
- **Escape:** Close modals and dialogs
- **Arrow keys:** Navigate within lists (where applicable)

### Focus Indicators

- All focusable elements have visible focus indicators
- Focus indicators use browser default or custom styles
- Focus order follows logical reading order
- Focus is never trapped unintentionally

## Screen Reader Testing

Components have been designed for compatibility with:

- **JAWS** (Windows)
- **NVDA** (Windows)
- **VoiceOver** (macOS/iOS)
- **TalkBack** (Android)

### Testing Checklist

- ✓ All images have alt text or are decorative
- ✓ All form inputs have labels
- ✓ All buttons have accessible names
- ✓ Headings are properly nested
- ✓ Landmarks are properly used
- ✓ Live regions announce changes
- ✓ Focus management works correctly
- ✓ No keyboard traps exist

## Best Practices Implemented

### 1. Semantic HTML

- Use proper heading hierarchy (h1 → h2 → h3)
- Use semantic elements (`<nav>`, `<section>`, `<button>`)
- Use lists for list content
- Use tables for tabular data

### 2. ARIA Usage

- Use ARIA only when semantic HTML is insufficient
- Prefer native HTML elements over ARIA roles
- Always test ARIA with screen readers
- Keep ARIA attributes up to date with state

### 3. Focus Management

- Manage focus for modals and dialogs
- Restore focus when closing overlays
- Provide skip links where appropriate
- Ensure focus is always visible

### 4. State Communication

- Use `aria-live` for dynamic content
- Use `aria-current` for current items
- Use `aria-expanded` for collapsible content
- Use `aria-pressed` for toggle buttons

## Testing Recommendations

### Manual Testing

1. **Keyboard Only:** Navigate entire workflow using only keyboard
2. **Screen Reader:** Test with at least one screen reader
3. **Zoom:** Test at 200% zoom level
4. **Color Blindness:** Test with color blindness simulators
5. **High Contrast:** Test in high contrast mode

### Automated Testing

1. **axe DevTools:** Run automated accessibility checks
2. **Lighthouse:** Check accessibility score
3. **WAVE:** Validate ARIA usage
4. **Pa11y:** Continuous accessibility testing

### User Testing

1. Test with users who rely on assistive technologies
2. Gather feedback on navigation patterns
3. Validate that announcements are helpful
4. Ensure all features are discoverable

## Common Issues and Solutions

### Issue: Focus Not Visible

**Solution:** Ensure focus indicators have sufficient contrast and are not removed by CSS

### Issue: Screen Reader Not Announcing Changes

**Solution:** Use `aria-live` regions for dynamic content updates

### Issue: Keyboard Trap

**Solution:** Ensure all modals and overlays can be closed with Escape key

### Issue: Missing Labels

**Solution:** Add `aria-label` or `aria-labelledby` to all interactive elements

### Issue: Poor Color Contrast

**Solution:** Use color contrast checker and adjust colors to meet WCAG AA standards

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Maintenance

### When Adding New Features

1. Add appropriate ARIA labels
2. Ensure keyboard navigation works
3. Test with screen reader
4. Verify color contrast
5. Update this documentation

### When Modifying Existing Features

1. Verify accessibility features still work
2. Test keyboard navigation
3. Check ARIA attributes are correct
4. Validate with automated tools
5. Update documentation if needed

## Support

For accessibility questions or issues:

1. Review this guide
2. Check WCAG guidelines
3. Test with assistive technologies
4. Consult with accessibility experts
5. Gather user feedback

---

**Last Updated:** December 2025
**WCAG Version:** 2.1 Level AA
**Status:** ✓ Compliant
