# Workflow Components - Accessibility Quick Reference

## Quick Checklist for Developers

When working with workflow components, ensure:

### ✅ ARIA Labels

- [ ] All buttons have `aria-label` or visible text
- [ ] Icons are marked `aria-hidden="true"`
- [ ] Sections use `aria-labelledby` with heading IDs
- [ ] Interactive cards have descriptive `aria-label`
- [ ] Toggle buttons have `aria-pressed`
- [ ] Collapsible content has `aria-expanded` and `aria-controls`

### ✅ Keyboard Navigation

- [ ] All interactive elements have `tabIndex={0}` or are naturally focusable
- [ ] Enter and Space keys work on custom interactive elements
- [ ] Disabled elements have `tabIndex={-1}`
- [ ] Focus order is logical
- [ ] No keyboard traps exist

### ✅ Semantic HTML

- [ ] Use `<button>` not `<div>` for buttons
- [ ] Use `<nav>` for navigation areas
- [ ] Use `<section>` with `aria-labelledby` for major sections
- [ ] Use proper heading hierarchy (h2 → h3)
- [ ] Use `<ul>` and `<li>` for lists

### ✅ Screen Reader Support

- [ ] Dynamic content uses `aria-live="polite"`
- [ ] Status messages use `role="status"`
- [ ] Current items marked with `aria-current`
- [ ] Disabled items marked with `aria-disabled`
- [ ] All form inputs have labels

### ✅ Color Contrast

- [ ] Text on background: 4.5:1 minimum
- [ ] Large text: 3:1 minimum
- [ ] Interactive elements: 3:1 minimum
- [ ] Focus indicators are clearly visible

## Common Patterns

### Interactive Card

```tsx
<Card
  onClick={handleClick}
  role="button"
  tabIndex={0}
  aria-label="View details for workflow name"
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }}
>
  {/* Card content */}
</Card>
```

### Toggle Button

```tsx
<Button onClick={handleToggle} aria-label="Grid view" aria-pressed={isActive}>
  <Icon aria-hidden="true" />
</Button>
```

### Section with Heading

```tsx
<section aria-labelledby="section-heading">
  <h3 id="section-heading">Section Title</h3>
  {/* Section content */}
</section>
```

### Live Region

```tsx
<div aria-live="polite" aria-atomic="true">
  Step {currentStep} of {totalSteps}
</div>
```

### Collapsible Panel

```tsx
<Collapsible open={isOpen} onOpenChange={setIsOpen}>
  <CollapsibleTrigger
    aria-expanded={isOpen}
    aria-controls="panel-content"
    aria-label={`${isOpen ? "Collapse" : "Expand"} panel`}
  >
    Toggle
  </CollapsibleTrigger>
  <CollapsibleContent id="panel-content">{/* Content */}</CollapsibleContent>
</Collapsible>
```

## Testing Commands

### Keyboard Testing

- **Tab:** Navigate forward
- **Shift+Tab:** Navigate backward
- **Enter:** Activate
- **Space:** Activate
- **Escape:** Close modal

### Screen Reader Testing

```bash
# macOS VoiceOver
Cmd + F5

# Windows NVDA (download from nvaccess.org)
Ctrl + Alt + N
```

### Automated Testing

```bash
# Install axe-core
npm install --save-dev @axe-core/react

# Run Lighthouse
npm run lighthouse

# Check with Pa11y
npx pa11y http://localhost:3000
```

## Common Mistakes to Avoid

❌ **Don't:**

- Use `<div>` with `onClick` without keyboard support
- Forget `aria-label` on icon-only buttons
- Use inline styles for colors (use Tailwind)
- Nest interactive elements (button inside button)
- Remove focus indicators with CSS
- Use `aria-label` on non-interactive elements

✅ **Do:**

- Use semantic HTML first, ARIA second
- Test with keyboard only
- Test with screen reader
- Provide text alternatives for icons
- Maintain logical focus order
- Keep ARIA attributes in sync with state

## Resources

- [WCAG Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Full Accessibility Guide](./ACCESSIBILITY_GUIDE.md)

## Questions?

Refer to the comprehensive [Accessibility Guide](./ACCESSIBILITY_GUIDE.md) for detailed information.
