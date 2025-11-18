# Accessibility Guide

> Comprehensive guide to accessibility standards and implementation in Co-agent Marketer

**Version:** 1.0  
**Last Updated:** November 2024  
**Standard:** WCAG 2.1 Level AA

---

## Table of Contents

1. [Overview](#overview)
2. [Color & Contrast](#color--contrast)
3. [Keyboard Navigation](#keyboard-navigation)
4. [Screen Readers](#screen-readers)
5. [Focus Management](#focus-management)
6. [Forms & Validation](#forms--validation)
7. [Motion & Animation](#motion--animation)
8. [Testing](#testing)

---

## Overview

### Our Commitment

Co-agent Marketer is committed to providing an accessible experience for all users, including those with:

- Visual impairments (blindness, low vision, color blindness)
- Motor impairments (limited dexterity, tremors)
- Cognitive impairments (dyslexia, ADHD)
- Hearing impairments (deafness, hard of hearing)

### Standards Compliance

We follow **WCAG 2.1 Level AA** guidelines, which include:

- ✅ Perceivable: Information presented in multiple ways
- ✅ Operable: Functionality available via keyboard
- ✅ Understandable: Clear, predictable interface
- ✅ Robust: Compatible with assistive technologies

### POUR Principles

1. **Perceivable**: Users can perceive the information
2. **Operable**: Users can operate the interface
3. **Understandable**: Users can understand the information
4. **Robust**: Content works with current and future technologies

---

## Color & Contrast

### Contrast Requirements

**WCAG 2.1 AA Standards:**

| Content Type                       | Minimum Ratio  | Our Target |
| ---------------------------------- | -------------- | ---------- |
| Normal text (< 18px)               | 4.5:1          | 4.5:1+     |
| Large text (≥ 18px or ≥ 14px bold) | 3:1            | 3:1+       |
| UI components & graphics           | 3:1            | 3:1+       |
| Inactive/disabled elements         | No requirement | 3:1+       |

### Compliant Color Combinations

```tsx
// ✅ High contrast text
<p className="text-gray-900 dark:text-gray-50">
  Body text with 16:1 contrast ratio
</p>

// ✅ Primary button
<Button className="bg-primary text-white">
  4.52:1 contrast ratio
</Button>

// ✅ Success message
<Alert className="bg-success-light text-success border-success">
  Clear status with sufficient contrast
</Alert>

// ⚠️ Use with caution - large text only
<p className="text-lg font-bold text-gray-400">
  3.12:1 - acceptable for large text
</p>
```

### Color Independence

Never use color as the only means of conveying information.

```tsx
// ❌ Bad: Color only
<span className="text-error">Error</span>

// ✅ Good: Color + icon + text
<span className="text-error flex items-center gap-2">
  <AlertCircle className="w-4 h-4" />
  <span>Error: Invalid input</span>
</span>

// ✅ Good: Color + pattern
<div className="border-2 border-error bg-error/10">
  <AlertCircle className="w-5 h-5 text-error" />
  <p className="text-error font-medium">Error message</p>
</div>
```

### Color Blindness Considerations

Test designs with color blindness simulators:

- **Protanopia** (red-blind): Use blue/orange instead of red/green
- **Deuteranopia** (green-blind): Use blue/orange instead of red/green
- **Tritanopia** (blue-blind): Use red/green instead of blue/yellow

```tsx
// ✅ Good: Distinguishable for all types
<Badge className="bg-primary">Info</Badge>
<Badge className="bg-success">Success</Badge>
<Badge className="bg-warning">Warning</Badge>
<Badge className="bg-error">Error</Badge>

// Each has unique icon and text
```

---

## Keyboard Navigation

### Tab Order

Ensure logical tab order through interactive elements.

```tsx
// ✅ Good: Natural DOM order
<form>
  <Input id="name" />      {/* Tab 1 */}
  <Input id="email" />     {/* Tab 2 */}
  <Button type="submit">   {/* Tab 3 */}
    Submit
  </Button>
</form>

// ❌ Bad: Using tabIndex to override
<form>
  <Input tabIndex={3} />
  <Input tabIndex={1} />
  <Button tabIndex={2}>Submit</Button>
</form>
```

### Focus Indicators

All interactive elements must have visible focus indicators.

```css
/* Global focus styles */
*:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
  border-radius: 4px;
}

/* Custom focus for specific elements */
.button:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 2px;
  box-shadow: 0 0 0 4px hsl(var(--primary) / 0.1);
}

/* Never remove focus without replacement */
/* ❌ Bad */
*:focus {
  outline: none;
}

/* ✅ Good */
*:focus {
  outline: none;
}
*:focus-visible {
  outline: 2px solid hsl(var(--primary));
}
```

### Keyboard Shortcuts

```tsx
// Common keyboard patterns
const KeyboardShortcuts = {
  // Navigation
  Tab: "Next element",
  "Shift + Tab": "Previous element",
  Enter: "Activate button/link",
  Space: "Activate button/checkbox",

  // Modals
  Escape: "Close modal/menu",

  // Lists
  "Arrow Up/Down": "Navigate list items",
  Home: "First item",
  End: "Last item",

  // Menus
  "Arrow Left/Right": "Navigate menu items",
  "Enter/Space": "Select menu item",
};

// Implementation example
function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  return isOpen ? <div>{children}</div> : null;
}
```

### Skip Links

Provide skip links for keyboard users to bypass repetitive content.

```tsx
// Skip to main content
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg"
>
  Skip to main content
</a>

<nav>{/* Navigation */}</nav>

<main id="main-content">
  {/* Main content */}
</main>
```

---

## Screen Readers

### Semantic HTML

Use semantic HTML elements for proper structure.

```tsx
// ✅ Good: Semantic HTML
<header>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Page Title</h1>
    <p>Content</p>
  </article>
</main>

<footer>
  <p>Copyright 2024</p>
</footer>

// ❌ Bad: Divs for everything
<div className="header">
  <div className="nav">
    <div className="link">Home</div>
  </div>
</div>
```

### ARIA Labels

Use ARIA attributes when semantic HTML isn't sufficient.

```tsx
// Button with icon only
<button aria-label="Close modal">
  <X className="w-4 h-4" />
</button>

// Link with icon
<a href="/settings" aria-label="Go to settings">
  <Settings className="w-5 h-5" />
</a>

// Form input
<div>
  <label htmlFor="email">Email Address</label>
  <input
    id="email"
    type="email"
    aria-describedby="email-hint"
    aria-invalid={hasError}
    aria-required="true"
  />
  <p id="email-hint" className="text-sm text-muted-foreground">
    We'll never share your email
  </p>
  {hasError && (
    <p id="email-error" className="text-sm text-error" role="alert">
      Please enter a valid email
    </p>
  )}
</div>
```

### ARIA Roles

```tsx
// Navigation landmark
<nav role="navigation" aria-label="Main navigation">
  {/* Nav items */}
</nav>

// Search landmark
<div role="search">
  <input type="search" aria-label="Search content" />
</div>

// Alert for important messages
<div role="alert" aria-live="assertive">
  Your session will expire in 5 minutes
</div>

// Status for non-critical updates
<div role="status" aria-live="polite">
  Content saved
</div>

// Tab interface
<div role="tablist" aria-label="Content sections">
  <button role="tab" aria-selected="true" aria-controls="panel-1">
    Tab 1
  </button>
  <button role="tab" aria-selected="false" aria-controls="panel-2">
    Tab 2
  </button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">
  Panel content
</div>
```

### Alt Text for Images

```tsx
// ✅ Good: Descriptive alt text
<img
  src="/agent-photo.jpg"
  alt="Professional headshot of Jane Smith, real estate agent"
/>

// ✅ Good: Decorative image
<img
  src="/decorative-pattern.svg"
  alt=""
  role="presentation"
/>

// ✅ Good: Complex image with description
<figure>
  <img
    src="/market-chart.png"
    alt="Bar chart showing market trends"
    aria-describedby="chart-description"
  />
  <figcaption id="chart-description">
    Market prices increased 15% in Q1, remained stable in Q2,
    and decreased 5% in Q3.
  </figcaption>
</figure>

// ❌ Bad: Generic alt text
<img src="/photo.jpg" alt="image" />
```

### Live Regions

```tsx
// Announce dynamic content changes
function Toast({ message, type }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "fixed bottom-4 right-4 p-4 rounded-lg",
        type === "error" && "bg-error text-white"
      )}
    >
      {message}
    </div>
  );
}

// Urgent announcements
function ErrorAlert({ message }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-error-light text-error p-4 rounded-lg"
    >
      <AlertCircle className="w-5 h-5" />
      <p>{message}</p>
    </div>
  );
}
```

---

## Focus Management

### Focus Trapping

Trap focus within modals and dialogs.

```tsx
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    // Get all focusable elements
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    // Focus first element
    firstElement?.focus();

    // Trap focus
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener("keydown", handleTab);
    return () => modal.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {children}
    </div>
  );
}
```

### Focus Restoration

Return focus to the triggering element when closing modals.

```tsx
function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = () => {
    triggerRef.current = document.activeElement as HTMLElement;
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    // Restore focus after modal closes
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 0);
  };

  return { isOpen, open, close };
}
```

---

## Forms & Validation

### Form Labels

Every input must have an associated label.

```tsx
// ✅ Good: Explicit label
<div>
  <label htmlFor="email">Email Address</label>
  <input id="email" type="email" />
</div>

// ✅ Good: Implicit label
<label>
  Email Address
  <input type="email" />
</label>

// ✅ Good: aria-label for icon-only
<input
  type="search"
  aria-label="Search content"
  placeholder="Search..."
/>

// ❌ Bad: No label
<input type="email" placeholder="Email" />
```

### Error Messages

```tsx
function FormField({ error, ...props }) {
  const errorId = `${props.id}-error`;

  return (
    <div>
      <label htmlFor={props.id}>{props.label}</label>
      <input
        {...props}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "border rounded-lg px-3 py-2",
          error && "border-error focus:ring-error"
        )}
      />
      {error && (
        <p id={errorId} className="text-sm text-error mt-1" role="alert">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          {error}
        </p>
      )}
    </div>
  );
}
```

### Required Fields

```tsx
// ✅ Good: Multiple indicators
<div>
  <label htmlFor="name">
    Name
    <span className="text-error ml-1" aria-label="required">*</span>
  </label>
  <input
    id="name"
    type="text"
    required
    aria-required="true"
  />
</div>

// ✅ Good: Legend for required fields
<form>
  <p className="text-sm text-muted-foreground mb-4">
    Fields marked with <span className="text-error">*</span> are required
  </p>
  {/* Form fields */}
</form>
```

### Form Validation

```tsx
function AccessibleForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (name: string, value: string) => {
    // Validation logic
    if (!value) {
      return "This field is required";
    }
    return "";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const error = validate(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    // ... validation logic

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // Focus first error
      const firstErrorField = Object.keys(newErrors)[0];
      document.getElementById(firstErrorField)?.focus();

      // Announce errors to screen readers
      const errorCount = Object.keys(newErrors).length;
      announceToScreenReader(
        `Form has ${errorCount} error${
          errorCount > 1 ? "s" : ""
        }. Please correct and resubmit.`
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Form fields */}
    </form>
  );
}
```

---

## Motion & Animation

### Reduced Motion

Respect user's motion preferences.

```css
/* Disable animations for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```tsx
// React hook for reduced motion
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}

// Usage
function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3,
      }}
    >
      Content
    </motion.div>
  );
}
```

### Safe Animation Patterns

```tsx
// ✅ Good: Respects reduced motion
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// ❌ Bad: Rapid spinning
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 0.5, repeat: Infinity }}
>
  Spinning content
</motion.div>

// ❌ Bad: Excessive parallax
<div style={{ transform: `translateY(${scrollY * 0.5}px)` }}>
  Parallax content
</div>
```

---

## Testing

### Automated Testing

```typescript
// Using jest-axe
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("Accessibility", () => {
  it("dashboard has no accessibility violations", async () => {
    const { container } = render(<Dashboard />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("form has proper labels", () => {
    const { getByLabelText } = render(<ContactForm />);
    expect(getByLabelText("Email Address")).toBeInTheDocument();
  });

  it("buttons have accessible names", () => {
    const { getByRole } = render(<ActionButtons />);
    expect(getByRole("button", { name: "Submit form" })).toBeInTheDocument();
  });
});
```

### Manual Testing

**Keyboard Testing:**

1. Unplug mouse
2. Navigate using Tab/Shift+Tab
3. Activate using Enter/Space
4. Close modals with Escape
5. Navigate lists with arrows

**Screen Reader Testing:**

- **macOS**: VoiceOver (Cmd + F5)
- **Windows**: NVDA (free) or JAWS
- **iOS**: VoiceOver (Settings > Accessibility)
- **Android**: TalkBack (Settings > Accessibility)

**Contrast Testing:**

- Use browser DevTools
- WebAIM Contrast Checker
- Stark plugin for Figma

### Accessibility Checklist

- [ ] All images have alt text
- [ ] All form inputs have labels
- [ ] Color contrast meets 4.5:1 (text) and 3:1 (UI)
- [ ] Keyboard navigation works throughout
- [ ] Focus indicators are visible
- [ ] No keyboard traps
- [ ] Headings are in logical order (h1 → h2 → h3)
- [ ] Links have descriptive text
- [ ] Buttons have accessible names
- [ ] Error messages are clear and associated with inputs
- [ ] Modals trap focus and restore on close
- [ ] Animations respect reduced motion
- [ ] ARIA attributes used correctly
- [ ] Semantic HTML used where possible
- [ ] Skip links provided
- [ ] Page has descriptive title

---

## Resources

### Tools

- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Built into Chrome
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/) - Desktop app

### Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM](https://webaim.org/)

### Testing

- [Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Keyboard Testing](https://webaim.org/articles/keyboard/)
- [Color Blindness Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/)

---

**Maintained by:** Design System Team  
**Version:** 1.0  
**Last Updated:** November 2024  
**Standard:** WCAG 2.1 Level AA
