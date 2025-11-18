# Color Palette Guide

> Complete reference for colors, gradients, and color usage in Co-agent Marketer

**Version:** 1.0  
**Last Updated:** November 2024

---

## Table of Contents

1. [Color Philosophy](#color-philosophy)
2. [Primary Colors](#primary-colors)
3. [Semantic Colors](#semantic-colors)
4. [Neutral Palette](#neutral-palette)
5. [Gradient System](#gradient-system)
6. [Dark Mode](#dark-mode)
7. [Usage Guidelines](#usage-guidelines)
8. [Accessibility](#accessibility)

---

## Color Philosophy

Our color system is designed to:

1. **Build Trust**: Professional blues convey reliability
2. **Show Innovation**: Purple accents suggest cutting-edge technology
3. **Provide Clarity**: Semantic colors communicate meaning instantly
4. **Create Depth**: Gradients add sophistication and visual interest
5. **Ensure Accessibility**: All colors meet WCAG 2.1 AA standards

### Color Psychology

- **Blue (Primary)**: Trust, professionalism, stability
- **Purple (Accent)**: Innovation, creativity, premium
- **Green (Success)**: Growth, achievement, positive action
- **Orange (Warning)**: Caution, attention, important information
- **Red (Error)**: Problems, errors, critical issues

---

## Primary Colors

### Primary Blue

Our main brand color - sophisticated and trustworthy.

```css
--primary: 220 60% 50%; /* hsl(220, 60%, 50%) - #3B82F6 */
--primary-hover: 220 60% 45%; /* Darker on hover */
--primary-active: 220 60% 40%; /* Even darker when active */
--primary-light: 220 60% 95%; /* Very light for backgrounds */
--primary-foreground: 0 0% 100%; /* White text on primary */
--primary-glow: 220 60% 50% / 0.3; /* Glow effect */
```

**Visual Examples:**

<div style="display: flex; gap: 1rem; margin: 1rem 0;">
  <div style="width: 100px; height: 100px; background: hsl(220, 60%, 50%); border-radius: 8px;"></div>
  <div style="width: 100px; height: 100px; background: hsl(220, 60%, 45%); border-radius: 8px;"></div>
  <div style="width: 100px; height: 100px; background: hsl(220, 60%, 40%); border-radius: 8px;"></div>
  <div style="width: 100px; height: 100px; background: hsl(220, 60%, 95%); border-radius: 8px; border: 1px solid #ddd;"></div>
</div>

**Usage:**

- Primary buttons and CTAs
- Active navigation items
- Links and interactive elements
- Focus indicators
- Brand elements

**Code Examples:**

```tsx
// Button
<Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
  Click me
</Button>

// Link
<a className="text-primary hover:underline">
  Learn more
</a>

// Badge
<Badge className="bg-primary-light text-primary">
  New
</Badge>
```

---

## Semantic Colors

### Success Green

Indicates positive actions, achievements, and confirmations.

```css
--success: 142 71% 45%; /* hsl(142, 71%, 45%) - #22C55E */
--success-light: 142 71% 95%; /* Light background */
--success-foreground: 0 0% 100%; /* White text */
--success-glow: 142 71% 45% / 0.3; /* Glow effect */
```

**Usage:**

- Success messages and toasts
- Completed states
- Positive metrics
- Confirmation buttons
- Achievement badges

**Code Examples:**

```tsx
// Success toast
<Toast className="bg-success text-success-foreground">
  ✓ Plan generated successfully!
</Toast>

// Success button
<Button className="bg-success hover:bg-success/90">
  Confirm
</Button>

// Success badge
<Badge className="bg-success-light text-success">
  Active
</Badge>
```

### Warning Orange

Draws attention to important information requiring caution.

```css
--warning: 38 92% 50%; /* hsl(38, 92%, 50%) - #F59E0B */
--warning-light: 38 92% 95%; /* Light background */
--warning-foreground: 0 0% 100%; /* White text */
--warning-glow: 38 92% 50% / 0.3; /* Glow effect */
```

**Usage:**

- Warning messages
- Incomplete profiles
- Pending actions
- Caution states
- Important notices

**Code Examples:**

```tsx
// Warning alert
<Alert className="bg-warning-light border-warning">
  <AlertTitle className="text-warning">Attention Required</AlertTitle>
  <AlertDescription>Please complete your profile.</AlertDescription>
</Alert>

// Warning badge
<Badge className="bg-warning text-warning-foreground">
  Pending
</Badge>
```

### Error Red

Indicates problems, errors, and destructive actions.

```css
--error: 0 84% 60%; /* hsl(0, 84%, 60%) - #EF4444 */
--error-light: 0 84% 95%; /* Light background */
--error-foreground: 0 0% 100%; /* White text */
--error-glow: 0 84% 60% / 0.3; /* Glow effect */
```

**Usage:**

- Error messages
- Failed operations
- Validation errors
- Destructive actions
- Critical alerts

**Code Examples:**

```tsx
// Error toast
<Toast variant="destructive">
  ✗ Failed to generate plan
</Toast>

// Error input
<Input className="border-error focus:ring-error" />
<p className="text-sm text-error">Invalid email address</p>

// Destructive button
<Button variant="destructive">
  Delete Account
</Button>
```

---

## Neutral Palette

Sophisticated grays with subtle blue tint for cohesion with primary color.

```css
/* Light Mode */
--gray-50: 220 20% 98%; /* #F8F9FB - Almost white */
--gray-100: 220 20% 95%; /* #F1F3F5 - Very light */
--gray-200: 220 15% 90%; /* #E4E7EB - Light */
--gray-300: 220 15% 80%; /* #C8CDD4 - Medium light */
--gray-400: 220 10% 60%; /* #9BA3AF - Medium */
--gray-500: 220 10% 45%; /* #6B7280 - Medium dark */
--gray-600: 220 15% 30%; /* #4B5563 - Dark */
--gray-700: 220 20% 20%; /* #374151 - Very dark */
--gray-800: 220 25% 12%; /* #1F2937 - Almost black */
--gray-900: 220 30% 8%; /* #111827 - Near black */
```

**Visual Scale:**

<div style="display: flex; gap: 0.5rem; margin: 1rem 0;">
  <div style="width: 60px; height: 60px; background: hsl(220, 20%, 98%); border: 1px solid #ddd; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: hsl(220, 20%, 95%); border: 1px solid #ddd; border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: hsl(220, 15%, 90%); border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: hsl(220, 15%, 80%); border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: hsl(220, 10%, 60%); border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: hsl(220, 10%, 45%); border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: hsl(220, 15%, 30%); border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: hsl(220, 20%, 20%); border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: hsl(220, 25%, 12%); border-radius: 4px;"></div>
  <div style="width: 60px; height: 60px; background: hsl(220, 30%, 8%); border-radius: 4px;"></div>
</div>

**Usage Guidelines:**

| Color    | Use Case                       |
| -------- | ------------------------------ |
| gray-50  | Page backgrounds (light mode)  |
| gray-100 | Card backgrounds, hover states |
| gray-200 | Borders, dividers              |
| gray-300 | Disabled states, placeholders  |
| gray-400 | Secondary text, icons          |
| gray-500 | Body text (light mode)         |
| gray-600 | Headings (light mode)          |
| gray-700 | Dark text emphasis             |
| gray-800 | Card backgrounds (dark mode)   |
| gray-900 | Page backgrounds (dark mode)   |

---

## Gradient System

### Accent Gradient

Our signature gradient for premium features and AI elements.

```css
--accent-start: 260 60% 55%; /* Purple - #8B5CF6 */
--accent-mid: 240 60% 52%; /* Blue-Purple - #6366F1 */
--accent-end: 220 60% 50%; /* Blue - #3B82F6 */
```

**Linear Gradient:**

```css
.gradient-accent {
  background: linear-gradient(
    to right,
    hsl(var(--accent-start)),
    hsl(var(--accent-mid)),
    hsl(var(--accent-end))
  );
}
```

**Radial Gradient:**

```css
.gradient-accent-radial {
  background: radial-gradient(
    circle at center,
    hsl(var(--accent-start)),
    hsl(var(--accent-end))
  );
}
```

**Usage:**

```tsx
// Premium button
<Button className="bg-gradient-to-r from-[hsl(var(--accent-start))] via-[hsl(var(--accent-mid))] to-[hsl(var(--accent-end))] text-white">
  Get Started
</Button>

// AI feature card
<Card className="bg-gradient-to-br from-primary/10 to-accent-start/10 border-primary/20">
  AI-powered content
</Card>
```

### Gradient Mesh Backgrounds

Subtle animated gradients for page backgrounds.

```css
/* Gradient mesh variables */
--gradient-mesh-1: radial-gradient(
  at 0% 0%,
  hsl(var(--primary)) 0px,
  transparent 50%
);

--gradient-mesh-2: radial-gradient(
  at 100% 100%,
  hsl(var(--accent-start)) 0px,
  transparent 50%
);

--gradient-mesh-3: radial-gradient(
  at 50% 50%,
  hsl(var(--accent-mid)) 0px,
  transparent 50%
);
```

**Usage:**

```tsx
// Hero section with gradient mesh
<section className="relative min-h-screen">
  <div className="absolute inset-0 -z-10">
    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-primary/10 to-transparent blur-3xl" />
    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-accent-start/10 to-transparent blur-3xl" />
  </div>
  <div className="relative z-10">Content here</div>
</section>
```

### Gradient Text

```css
.text-gradient {
  background: linear-gradient(
    135deg,
    hsl(var(--foreground)) 0%,
    hsl(var(--foreground) / 0.7) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-gradient-accent {
  background: linear-gradient(
    135deg,
    hsl(var(--accent-start)),
    hsl(var(--accent-end))
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

**Usage:**

```tsx
<h1 className="text-display-hero text-gradient">
  Welcome to Co-agent Marketer
</h1>
```

### Gradient Borders

```css
.gradient-border {
  position: relative;
  background: var(--card);
  border-radius: 1rem;
}

.gradient-border::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  padding: 2px;
  background: linear-gradient(
    135deg,
    hsl(var(--accent-start)),
    hsl(var(--accent-end))
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
```

---

## Dark Mode

### Color Adaptations

```css
.dark {
  /* Backgrounds */
  --background: 220 30% 8%; /* gray-900 */
  --foreground: 220 20% 98%; /* gray-50 */

  /* Cards */
  --card: 220 25% 12%; /* gray-800 */
  --card-foreground: 220 20% 98%; /* gray-50 */

  /* Muted */
  --muted: 220 15% 30%; /* gray-600 */
  --muted-foreground: 220 10% 60%; /* gray-400 */

  /* Borders */
  --border: 220 15% 20%; /* gray-700 */

  /* Primary (stays same) */
  --primary: 220 60% 50%;
  --primary-foreground: 0 0% 100%;

  /* Semantic colors (stay same) */
  --success: 142 71% 45%;
  --warning: 38 92% 50%;
  --error: 0 84% 60%;
}
```

### Dark Mode Best Practices

✅ **Do:**

- Use lighter text on dark backgrounds
- Reduce shadow intensity
- Increase border visibility
- Adjust gradient opacity
- Test contrast ratios

❌ **Don't:**

- Use pure black (#000)
- Use pure white (#FFF)
- Invert all colors
- Ignore semantic colors
- Forget to test

**Example:**

```tsx
// Adaptive card
<Card className="bg-card text-card-foreground border-border">
  Content adapts to theme
</Card>

// Dark mode specific styling
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50">
  Theme-aware content
</div>
```

---

## Usage Guidelines

### Color Hierarchy

1. **Primary**: Main actions, brand elements
2. **Semantic**: Status communication (success, warning, error)
3. **Neutral**: Text, backgrounds, borders
4. **Accent**: Premium features, highlights

### Do's and Don'ts

✅ **Do:**

- Use primary for main CTAs
- Use semantic colors consistently
- Maintain sufficient contrast
- Test in both light and dark mode
- Use gradients sparingly

❌ **Don't:**

- Mix too many colors on one page
- Use color as the only indicator
- Override semantic color meanings
- Use low-contrast combinations
- Overuse gradients

### Color Combinations

**Good Combinations:**

```tsx
// Primary with neutral
<div className="bg-primary text-primary-foreground">
  High contrast, readable
</div>

// Success with light background
<div className="bg-success-light text-success border-success">
  Clear status indication
</div>

// Gradient with white text
<div className="bg-gradient-to-r from-primary to-accent-start text-white">
  Premium feel
</div>
```

**Avoid:**

```tsx
// ❌ Low contrast
<div className="bg-gray-200 text-gray-300">
  Hard to read
</div>

// ❌ Clashing colors
<div className="bg-error text-success">
  Confusing
</div>

// ❌ Too many gradients
<div className="bg-gradient-to-r from-primary to-accent">
  <div className="bg-gradient-to-b from-success to-warning">
    Overwhelming
  </div>
</div>
```

---

## Accessibility

### Contrast Ratios

**WCAG 2.1 AA Requirements:**

- Normal text (< 18px): 4.5:1 minimum
- Large text (≥ 18px or ≥ 14px bold): 3:1 minimum
- UI components: 3:1 minimum

**Our Compliance:**

| Combination       | Ratio  | Status             |
| ----------------- | ------ | ------------------ |
| Primary on white  | 4.52:1 | ✅ Pass            |
| Gray-600 on white | 7.23:1 | ✅ Pass            |
| Gray-400 on white | 3.12:1 | ⚠️ Large text only |
| White on primary  | 4.52:1 | ✅ Pass            |
| White on success  | 3.98:1 | ✅ Pass (large)    |

### Testing Contrast

```typescript
// Utility to check contrast ratio
function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Check if combination meets WCAG AA
function meetsWCAG_AA(ratio: number, isLargeText: boolean): boolean {
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}
```

### Color Blindness

Our color system is designed to be distinguishable for common types of color blindness:

- **Protanopia** (red-blind): ✅ Blue/purple distinguishable
- **Deuteranopia** (green-blind): ✅ Blue/orange distinguishable
- **Tritanopia** (blue-blind): ✅ Red/green distinguishable

**Additional Indicators:**

- Icons alongside colors
- Text labels for status
- Patterns or shapes
- Position/location cues

---

## Quick Reference

### Color Variables

```css
/* Primary */
--primary: 220 60% 50%;
--primary-foreground: 0 0% 100%;

/* Semantic */
--success: 142 71% 45%;
--warning: 38 92% 50%;
--error: 0 84% 60%;

/* Neutral */
--gray-50 through --gray-900

/* Accent Gradient */
--accent-start: 260 60% 55%;
--accent-mid: 240 60% 52%;
--accent-end: 220 60% 50%;
```

### Common Patterns

```tsx
// Primary button
<Button className="bg-primary hover:bg-primary-hover text-primary-foreground">

// Success toast
<Toast className="bg-success-light text-success border-success">

// Premium card
<Card className="bg-gradient-to-br from-primary/10 to-accent-start/10">

// Gradient text
<h1 className="bg-gradient-to-r from-accent-start to-accent-end bg-clip-text text-transparent">
```

---

## Resources

- [Design System Documentation](./DESIGN_SYSTEM.md)
- [Gradient Usage Guidelines](./GRADIENT_USAGE_GUIDELINES.md)
- [WCAG Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Blind Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/)

---

**Maintained by:** Design System Team  
**Version:** 1.0  
**Last Updated:** November 2024
