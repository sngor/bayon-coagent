# Design Token Documentation

## Overview

This document provides comprehensive documentation for all design tokens used in the Bayon Coagent application. Design tokens are the visual design atoms of the design system — specifically, they are named entities that store visual design attributes. They are used in place of hard-coded values to ensure consistency and maintainability across the application.

All design tokens are defined as CSS custom properties in `src/app/globals.css` and can be referenced throughout the application using Tailwind utility classes or directly via `hsl(var(--token-name))`.

---

## Table of Contents

1. [Colors](#colors)
2. [Typography](#typography)
3. [Spacing](#spacing)
4. [Shadows](#shadows)
5. [Borders](#borders)
6. [Transitions](#transitions)
7. [Glassmorphism](#glassmorphism)
8. [Migration Guide](#migration-guide)

---

## Colors

### Semantic Colors

Semantic colors convey meaning and should be used for specific purposes throughout the application.

| Token                       | Light Mode        | Dark Mode     | Usage                                      |
| --------------------------- | ----------------- | ------------- | ------------------------------------------ |
| `--primary`                 | `220 60% 50%`     | `220 60% 50%` | Primary brand color, main CTAs, links      |
| `--primary-foreground`      | `210 20% 98%`     | `210 20% 98%` | Text on primary background                 |
| `--primary-hover`           | `220 60% 45%`     | `220 60% 55%` | Hover state for primary elements           |
| `--primary-active`          | `220 60% 40%`     | `220 60% 60%` | Active/pressed state for primary elements  |
| `--secondary`               | `220 14.3% 95.9%` | `220 20% 14%` | Secondary actions, less prominent elements |
| `--secondary-foreground`    | `220 9.1% 42.9%`  | `210 20% 98%` | Text on secondary background               |
| `--success`                 | `142 71% 45%`     | `142 71% 50%` | Success states, positive feedback          |
| `--success-foreground`      | `0 0% 100%`       | `0 0% 100%`   | Text on success background                 |
| `--success-light`           | `142 71% 95%`     | `142 71% 15%` | Light success background                   |
| `--success-hover`           | `142 71% 40%`     | `142 71% 55%` | Hover state for success elements           |
| `--warning`                 | `38 92% 50%`      | `38 92% 55%`  | Warning states, caution messages           |
| `--warning-foreground`      | `0 0% 100%`       | `0 0% 100%`   | Text on warning background                 |
| `--warning-light`           | `38 92% 95%`      | `38 92% 15%`  | Light warning background                   |
| `--warning-hover`           | `38 92% 45%`      | `38 92% 60%`  | Hover state for warning elements           |
| `--error` / `--destructive` | `0 84% 60%`       | `0 84% 65%`   | Error states, destructive actions          |
| `--error-foreground`        | `0 0% 100%`       | `0 0% 100%`   | Text on error background                   |
| `--error-light`             | `0 84% 95%`       | `0 84% 15%`   | Light error background                     |
| `--error-hover`             | `0 84% 55%`       | `0 84% 70%`   | Hover state for error elements             |

**Example Usage:**

```tsx
// Using Tailwind utilities
<Button className="bg-primary text-primary-foreground hover:bg-primary-hover">
  Primary Action
</Button>

// Using CSS custom properties directly
<div style={{ backgroundColor: 'hsl(var(--success))' }}>
  Success message
</div>
```

### Surface Colors

Surface colors define the background layers of the application.

| Token                  | Light Mode        | Dark Mode           | Usage                        |
| ---------------------- | ----------------- | ------------------- | ---------------------------- |
| `--background`         | `40 20% 96%`      | `224 71.4% 4.1%`    | Main application background  |
| `--foreground`         | `224 71.4% 4.1%`  | `210 20% 98%`       | Main text color              |
| `--card`               | `40 30% 98%`      | `220 20% 10%`       | Card backgrounds             |
| `--card-foreground`    | `224 71.4% 4.1%`  | `210 20% 98%`       | Text on card backgrounds     |
| `--popover`            | `40 30% 98%`      | `220 20% 10%`       | Popover/dropdown backgrounds |
| `--popover-foreground` | `224 71.4% 4.1%`  | `210 20% 98%`       | Text on popover backgrounds  |
| `--muted`              | `220 14.3% 95.9%` | `220 20% 14%`       | Muted backgrounds            |
| `--muted-foreground`   | `220 8.9% 46.1%`  | `217.9 10.6% 64.9%` | Muted text                   |
| `--accent`             | `220 10% 90%`     | `220 20% 14%`       | Accent backgrounds           |
| `--accent-foreground`  | `220 9.1% 42.9%`  | `210 20% 98%`       | Text on accent backgrounds   |

**Example Usage:**

```tsx
<Card className="bg-card text-card-foreground">
  <CardHeader>Card Title</CardHeader>
  <CardContent>Card content goes here</CardContent>
</Card>
```

### AI Theme Colors

Special color palette for AI-powered features with blue, white, and gold accents.

| Token             | Light Mode     | Dark Mode      | Usage                      |
| ----------------- | -------------- | -------------- | -------------------------- |
| `--ai-blue-light` | `210 100% 95%` | `215 80% 70%`  | Light AI accent            |
| `--ai-blue`       | `215 85% 60%`  | `215 85% 60%`  | Primary AI color           |
| `--ai-blue-deep`  | `220 75% 45%`  | `220 90% 50%`  | Deep AI accent             |
| `--ai-gold-light` | `45 100% 85%`  | `45 100% 75%`  | Light gold accent          |
| `--ai-gold`       | `45 95% 60%`   | `45 95% 65%`   | Primary gold accent        |
| `--ai-gold-deep`  | `42 90% 50%`   | `42 100% 55%`  | Deep gold accent           |
| `--ai-white`      | `0 0% 100%`    | `0 0% 100%`    | Pure white for AI elements |
| `--ai-shimmer`    | `210 100% 98%` | `210 100% 98%` | Shimmer effect color       |

**Example Usage:**

```tsx
// AI-themed button with gradient
<Button className="ai-gradient">
  Generate with AI
</Button>

// AI-themed container with glow
<div className="container-ai-glow">
  AI-powered content
</div>

// AI-themed text gradient
<h2 className="text-gradient-ai">
  AI Assistant
</h2>
```

### Gray Palette

Comprehensive gray scale for neutral elements.

| Token        | Light Mode    | Dark Mode     | Usage             |
| ------------ | ------------- | ------------- | ----------------- |
| `--gray-50`  | `220 20% 98%` | `220 30% 8%`  | Lightest gray     |
| `--gray-100` | `220 20% 95%` | `220 25% 12%` | Very light gray   |
| `--gray-200` | `220 15% 90%` | `220 20% 20%` | Light gray        |
| `--gray-300` | `220 15% 80%` | `220 15% 30%` | Medium-light gray |
| `--gray-400` | `220 10% 60%` | `220 10% 45%` | Medium gray       |
| `--gray-500` | `220 10% 45%` | `220 10% 60%` | True middle gray  |
| `--gray-600` | `220 15% 30%` | `220 15% 80%` | Medium-dark gray  |
| `--gray-700` | `220 20% 20%` | `220 15% 90%` | Dark gray         |
| `--gray-800` | `220 25% 12%` | `220 20% 95%` | Very dark gray    |
| `--gray-900` | `220 30% 8%`  | `220 20% 98%` | Darkest gray      |

**Example Usage:**

```tsx
<div className="bg-gray-100 text-gray-900 border border-gray-300">
  Neutral content
</div>
```

### Gradient Colors

Gradient stops for creating smooth color transitions.

| Token              | Value         | Usage                        |
| ------------------ | ------------- | ---------------------------- |
| `--gradient-start` | `220 60% 50%` | Starting color for gradients |
| `--gradient-end`   | `260 60% 50%` | Ending color for gradients   |

**Example Usage:**

```tsx
<div className="bg-gradient-to-r from-[hsl(var(--gradient-start))] to-[hsl(var(--gradient-end))]">
  Gradient background
</div>
```

### Chart Colors

Colors for data visualization and charts.

| Token       | Value         | Usage                  |
| ----------- | ------------- | ---------------------- |
| `--chart-1` | `220 70% 50%` | Primary chart color    |
| `--chart-2` | `160 60% 45%` | Secondary chart color  |
| `--chart-3` | `30 80% 55%`  | Tertiary chart color   |
| `--chart-4` | `280 65% 60%` | Quaternary chart color |
| `--chart-5` | `340 75% 55%` | Quinary chart color    |

---

## Typography

### Font Families

| Token            | Value                                             | Usage                           |
| ---------------- | ------------------------------------------------- | ------------------------------- |
| `--font-display` | `var(--font-playfair), "Playfair Display", serif` | Headings, display text, metrics |
| `--font-body`    | `var(--font-pt-sans), "PT Sans", sans-serif`      | Body text, UI elements          |

**Example Usage:**

```tsx
// Display font for headings
<h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">
  Heading Text
</h1>

// Or use utility classes
<h1 className="text-display-hero">
  Hero Heading
</h1>

// Body font (default)
<p className="font-[family-name:var(--font-body)]">
  Body text
</p>
```

### Font Sizes

Use the predefined text utility classes for consistent typography:

| Utility Class          | Size              | Usage                        |
| ---------------------- | ----------------- | ---------------------------- |
| `.text-display-hero`   | `4.5rem` (72px)   | Hero sections, landing pages |
| `.text-display-large`  | `3.5rem` (56px)   | Large display text           |
| `.text-display-medium` | `2.5rem` (40px)   | Medium display text          |
| `.text-metric-large`   | `3rem` (48px)     | Large metrics/numbers        |
| `.text-metric-medium`  | `2rem` (32px)     | Medium metrics/numbers       |
| `.text-metric-small`   | `1.5rem` (24px)   | Small metrics/numbers        |
| `.text-heading-1`      | `2rem` (32px)     | H1 headings                  |
| `.text-heading-2`      | `1.5rem` (24px)   | H2 headings                  |
| `.text-heading-3`      | `1.25rem` (20px)  | H3 headings                  |
| `.text-bold-cta`       | `1.125rem` (18px) | Call-to-action text          |
| `.text-bold-cta-large` | `1.25rem` (20px)  | Large CTA text               |

**Example Usage:**

```tsx
<h1 className="text-display-hero">Welcome to Bayon</h1>
<div className="text-metric-large">$1,250,000</div>
<h2 className="text-heading-1">Section Title</h2>
<button className="text-bold-cta">GET STARTED</button>
```

### Font Weights

Use Tailwind's font weight utilities:

- `font-normal` (400)
- `font-medium` (500)
- `font-semibold` (600)
- `font-bold` (700)
- `font-extrabold` (800)

---

## Spacing

### Spacing Scale

| Token           | Value           | Usage                 |
| --------------- | --------------- | --------------------- |
| `--spacing-xs`  | `0.25rem` (4px) | Extra small spacing   |
| `--spacing-sm`  | `0.5rem` (8px)  | Small spacing         |
| `--spacing-md`  | `1rem` (16px)   | Medium spacing (base) |
| `--spacing-lg`  | `1.5rem` (24px) | Large spacing         |
| `--spacing-xl`  | `2rem` (32px)   | Extra large spacing   |
| `--spacing-2xl` | `3rem` (48px)   | 2X large spacing      |
| `--spacing-3xl` | `4rem` (64px)   | 3X large spacing      |

**Example Usage:**

```tsx
// Using Tailwind utilities (preferred)
<div className="p-4 space-y-6">
  <div className="mb-8">Content</div>
</div>

// Using CSS custom properties
<div style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
  Content
</div>
```

### Container Padding Variants

Pre-defined padding combinations for containers:

| Utility Class           | Padding       | Usage                               |
| ----------------------- | ------------- | ----------------------------------- |
| `.container-padding-sm` | `p-3`         | Small containers                    |
| `.container-padding-md` | `p-4 sm:p-6`  | Medium containers (responsive)      |
| `.container-padding-lg` | `p-6 sm:p-8`  | Large containers (responsive)       |
| `.container-padding-xl` | `p-8 sm:p-10` | Extra large containers (responsive) |

---

## Shadows

### Shadow Scale

| Token          | Value                                 | Usage                 |
| -------------- | ------------------------------------- | --------------------- |
| `--shadow-sm`  | `0 1px 2px 0 rgb(0 0 0 / 0.05)`       | Subtle elevation      |
| `--shadow-md`  | `0 4px 6px -1px rgb(0 0 0 / 0.1)`     | Medium elevation      |
| `--shadow-lg`  | `0 10px 15px -3px rgb(0 0 0 / 0.1)`   | Large elevation       |
| `--shadow-xl`  | `0 20px 25px -5px rgb(0 0 0 / 0.1)`   | Extra large elevation |
| `--shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` | Maximum elevation     |

**Example Usage:**

```tsx
// Using Tailwind utilities (preferred)
<Card className="shadow-md hover:shadow-lg transition-shadow">
  Card content
</Card>

// Using CSS custom properties
<div style={{ boxShadow: 'var(--shadow-lg)' }}>
  Content
</div>
```

### Container Shadow Variants

Pre-defined container styles with shadows:

| Utility Class         | Shadow       | Usage                    |
| --------------------- | ------------ | ------------------------ |
| `.container-base`     | `shadow-sm`  | Base container           |
| `.container-elevated` | `shadow-md`  | Elevated container       |
| `.container-floating` | `shadow-lg`  | Floating container       |
| `.container-modal`    | `shadow-xl`  | Modal dialogs            |
| `.container-premium`  | `shadow-2xl` | Premium/featured content |

---

## Borders

### Border Widths

Use Tailwind's border utilities:

- `border` (1px)
- `border-2` (2px)
- `border-3` (3px - custom)

### Border Radius

| Token      | Value          | Usage                 |
| ---------- | -------------- | --------------------- |
| `--radius` | `0.5rem` (8px) | Default border radius |

Use Tailwind utilities:

- `rounded-sm` (2px)
- `rounded` (4px)
- `rounded-md` (6px)
- `rounded-lg` (8px - matches `--radius`)
- `rounded-xl` (12px)
- `rounded-2xl` (16px)
- `rounded-full` (9999px)

### Border Colors

| Token      | Value                                        | Usage                |
| ---------- | -------------------------------------------- | -------------------- |
| `--border` | `220 13% 91%` (light) / `220 20% 20%` (dark) | Default border color |
| `--input`  | `220 13% 91%` (light) / `220 20% 14%` (dark) | Input border color   |
| `--ring`   | `220 60% 50%`                                | Focus ring color     |

**Important Border Rule:**

> **If a border doesn't have a shadow, use black color**
>
> Use `.border-no-shadow` or `.border-solid-black` classes for borders without shadows.

**Example Usage:**

```tsx
// Standard border
<div className="border border-border rounded-lg">
  Content
</div>

// Border without shadow (use black)
<div className="border border-no-shadow rounded-lg">
  Content
</div>

// Focus ring
<input className="focus:ring-2 focus:ring-ring focus:ring-offset-2" />
```

---

## Transitions

### Transition Durations

| Token                  | Value                                          | Usage                               |
| ---------------------- | ---------------------------------------------- | ----------------------------------- |
| `--transition-fast`    | `150ms cubic-bezier(0.4, 0, 0.2, 1)`           | Quick interactions                  |
| `--transition-base`    | `250ms cubic-bezier(0.4, 0, 0.2, 1)`           | Standard transitions                |
| `--transition-slow`    | `350ms cubic-bezier(0.4, 0, 0.2, 1)`           | Slower, more noticeable transitions |
| `--transition-bounce`  | `500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Bouncy animations                   |
| `--transition-elastic` | `600ms cubic-bezier(0.68, -0.6, 0.32, 1.6)`    | Elastic animations                  |
| `--transition-smooth`  | `400ms cubic-bezier(0.4, 0, 0.2, 1)`           | Smooth transitions                  |
| `--transition-spring`  | `500ms cubic-bezier(0.34, 1.56, 0.64, 1)`      | Spring-like animations              |

**Example Usage:**

```tsx
// Using Tailwind utilities
<Button className="transition-all duration-[var(--transition-base)] hover:scale-105">
  Hover me
</Button>

// Using CSS custom properties
<div style={{ transition: 'all var(--transition-base)' }}>
  Content
</div>
```

### Animation Utilities

Pre-defined animation classes:

| Utility Class             | Animation          | Usage             |
| ------------------------- | ------------------ | ----------------- |
| `.animate-fade-in`        | Fade in            | Appearing content |
| `.animate-fade-in-up`     | Fade in + slide up | Entering content  |
| `.animate-scale-in`       | Scale in           | Popping content   |
| `.animate-slide-in-right` | Slide from left    | Side entrances    |
| `.animate-slide-in-left`  | Slide from right   | Side entrances    |
| `.animate-bounce-in`      | Bounce in          | Playful entrances |
| `.animate-shake`          | Shake              | Error feedback    |
| `.animate-pulse-success`  | Pulse              | Success feedback  |

---

## Glassmorphism

### Glass Effect Tokens

| Token                | Value                                                     | Usage                |
| -------------------- | --------------------------------------------------------- | -------------------- |
| `--glass-bg`         | `255 255 255 / 0.7` (light) / `0 0 0 / 0.5` (dark)        | Glass background     |
| `--glass-border`     | `255 255 255 / 0.2` (light) / `255 255 255 / 0.1` (dark)  | Glass border         |
| `--glass-blur`       | `12px` (light) / `16px` (dark)                            | Backdrop blur amount |
| `--glass-tint-light` | `255 255 255 / 0.1` (light) / `255 255 255 / 0.05` (dark) | Light tint           |
| `--glass-tint-dark`  | `0 0 0 / 0.1` (light) / `0 0 0 / 0.2` (dark)              | Dark tint            |

### Glass Effect Utilities

| Utility Class      | Blur   | Usage                     |
| ------------------ | ------ | ------------------------- |
| `.glass-effect`    | `12px` | Standard glass effect     |
| `.glass-effect-sm` | `8px`  | Subtle glass effect       |
| `.glass-effect-md` | `12px` | Medium glass effect       |
| `.glass-effect-lg` | `16px` | Strong glass effect       |
| `.glass-effect-xl` | `24px` | Extra strong glass effect |

**Example Usage:**

```tsx
<div className="glass-effect rounded-lg p-6">
  Glassmorphic content
</div>

<div className="container-glass">
  Glass container
</div>
```

---

## Migration Guide

### Converting Hardcoded Values to Tokens

#### Colors

**Before:**

```tsx
<div className="bg-blue-500 text-white">Content</div>
```

**After:**

```tsx
<div className="bg-primary text-primary-foreground">Content</div>
```

#### Spacing

**Before:**

```tsx
<div className="p-4 mb-6 space-y-8">Content</div>
```

**After (using Tailwind - preferred):**

```tsx
<div className="p-4 mb-6 space-y-8">Content (Tailwind utilities are fine!)</div>
```

**After (using tokens directly):**

```tsx
<div
  style={{
    padding: "var(--spacing-md)",
    marginBottom: "var(--spacing-lg)",
  }}
>
  Content
</div>
```

#### Shadows

**Before:**

```tsx
<Card style={{ boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>Content</Card>
```

**After:**

```tsx
<Card className="shadow-md">Content</Card>
```

#### Typography

**Before:**

```tsx
<h1 style={{ fontSize: "48px", fontWeight: 700 }}>Heading</h1>
```

**After:**

```tsx
<h1 className="text-metric-large">Heading</h1>
```

#### Transitions

**Before:**

```tsx
<Button style={{ transition: "all 0.3s ease" }}>Click me</Button>
```

**After:**

```tsx
<Button className="transition-all duration-[var(--transition-base)]">
  Click me
</Button>
```

### Common Patterns

#### AI-Themed Components

```tsx
// AI button with gradient
<Button className="ai-gradient">
  Generate with AI
</Button>

// AI container with glow
<div className="container-ai-glow p-6">
  AI content
</div>

// AI text gradient
<h2 className="text-gradient-ai text-3xl font-bold">
  AI Feature
</h2>
```

#### Status Messages

```tsx
// Success
<div className="container-success">
  <CheckCircle className="text-success" />
  <p>Operation successful!</p>
</div>

// Warning
<div className="container-warning">
  <AlertTriangle className="text-warning" />
  <p>Please review this</p>
</div>

// Error
<div className="container-error">
  <XCircle className="text-error" />
  <p>Something went wrong</p>
</div>
```

#### Interactive Cards

```tsx
<Card className="container-interactive-floating">
  <CardHeader>
    <CardTitle>Interactive Card</CardTitle>
  </CardHeader>
  <CardContent>Hover to see the effect</CardContent>
</Card>
```

### Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Prefer Tailwind utilities** for spacing, colors, and typography
3. **Use semantic color names** (primary, success, error) instead of specific colors (blue, green, red)
4. **Follow the border rule**: If no shadow, use black border
5. **Use container variants** for consistent card/container styling
6. **Respect reduced motion preferences** - animations will be disabled automatically
7. **Use AI theme colors** for AI-powered features
8. **Use display font** for headings and metrics, body font for content

### Quick Reference

```tsx
// Colors
className = "bg-primary text-primary-foreground";
className = "bg-success text-success-foreground";
className = "bg-card text-card-foreground";

// Spacing
className = "p-4 space-y-6 mb-8";

// Typography
className = "text-heading-1 font-bold";
className = "text-metric-large";

// Shadows & Borders
className = "shadow-md rounded-lg border border-border";

// Transitions
className = "transition-all duration-[var(--transition-base)]";

// Containers
className = "container-elevated container-padding-md";

// AI Theme
className = "ai-gradient text-gradient-ai";

// Interactive
className = "container-interactive-floating hover:shadow-xl";
```

---

## Additional Resources

- **Tailwind CSS Documentation**: https://tailwindcss.com/docs
- **shadcn/ui Components**: https://ui.shadcn.com
- **Design System Figma**: [Link to Figma file if available]
- **Component Library**: See `src/components/ui` for base components

---

## Questions or Issues?

If you encounter any issues with design tokens or need clarification:

1. Check this documentation first
2. Review `src/app/globals.css` for the source of truth
3. Consult with the design team
4. Create an issue in the project repository
