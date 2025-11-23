# Container Styling Guide

This guide explains the standardized container styling system for consistent borders and shadows across the application.

## Overview

All containers now use a unified styling system with consistent:

- Border styles and colors
- Shadow depths and effects
- Padding and spacing
- Interactive behaviors
- Status-based variants

## Base Container Classes

### Core Variants

```css
.container-base        /* Basic container: border + shadow-sm */
/* Basic container: border + shadow-sm */
.container-elevated    /* Elevated: border + shadow-md */
.container-floating    /* Floating: border + shadow-lg */
.container-modal       /* Modal: rounded-xl + shadow-xl */
.container-premium; /* Premium: rounded-xl + shadow-2xl */
```

### Interactive Variants

```css
.container-interactive          /* Hover effects for base containers */
/* Hover effects for base containers */
.container-interactive-elevated /* Hover effects for elevated containers */
.container-interactive-floating; /* Hover effects for floating containers */
```

### Glass Variants

```css
.container-glass          /* Glass effect with backdrop blur */
/* Glass effect with backdrop blur */
.container-glass-elevated; /* Enhanced glass with stronger blur */
```

## Using the Container Component

### Basic Usage

```tsx
import { Container } from "@/components/ui/container"

// Basic container
<Container>Content here</Container>

// Elevated with interaction
<Container variant="elevated" interactive>
  Clickable content
</Container>

// Modal-style with large padding
<Container variant="modal" padding="xl">
  Modal content
</Container>
```

### Props

| Prop          | Type                                                                                 | Default  | Description                           |
| ------------- | ------------------------------------------------------------------------------------ | -------- | ------------------------------------- |
| `variant`     | `'base' \| 'elevated' \| 'floating' \| 'modal' \| 'premium'`                         | `'base'` | Container elevation level             |
| `interactive` | `boolean`                                                                            | `false`  | Adds hover effects and cursor pointer |
| `padding`     | `'sm' \| 'md' \| 'lg' \| 'xl'`                                                       | `'md'`   | Internal padding size                 |
| `border`      | `'subtle' \| 'default' \| 'strong' \| 'accent' \| 'success' \| 'warning' \| 'error'` | -        | Border style override                 |
| `gradient`    | `'primary' \| 'success' \| 'warning' \| 'error'`                                     | -        | Background gradient                   |
| `glass`       | `boolean`                                                                            | `false`  | Enable glass morphism effect          |

## Specialized Containers

### Metric Containers

For displaying key metrics and statistics:

```tsx
import { MetricContainer } from "@/components/ui/container";

<MetricContainer>
  <div className="text-3xl font-bold">$1.2M</div>
  <div className="text-sm text-muted-foreground">Total Sales</div>
</MetricContainer>;
```

### Status Containers

For status-based content:

```tsx
import { SuccessContainer, WarningContainer, ErrorContainer } from "@/components/ui/container"

<SuccessContainer>Profile completed successfully!</SuccessContainer>
<WarningContainer>Please verify your email address</WarningContainer>
<ErrorContainer>Failed to save changes</ErrorContainer>
```

### Feature Containers

For feature highlights and cards:

```tsx
import { FeatureContainer } from "@/components/ui/container";

<FeatureContainer>
  <h3>AI Content Generation</h3>
  <p>Create professional content in minutes</p>
</FeatureContainer>;
```

## Updated Card Component

The Card component now supports the standardized system:

```tsx
import { Card } from "@/components/ui/card"

// Basic card (uses container-base)
<Card>Basic content</Card>

// Elevated interactive card
<Card variant="elevated" interactive>
  Clickable card
</Card>

// Premium modal-style card
<Card variant="premium">
  Premium content
</Card>
```

## Migration Guide

### Before (Inconsistent)

```tsx
// Various inconsistent patterns
<div className="border rounded-lg shadow-sm p-4">...</div>
<div className="border-2 border-primary/20 rounded-xl shadow-lg p-6">...</div>
<div className="bg-card border shadow-md rounded-lg p-4 hover:shadow-lg">...</div>
```

### After (Standardized)

```tsx
// Consistent using container classes
<Container>...</Container>
<Container variant="floating" border="accent" padding="lg">...</Container>
<Container variant="elevated" interactive>...</Container>
```

## CSS Classes Reference

### Border Variants

- `.container-border-subtle` - 50% opacity border
- `.container-border-default` - Standard border
- `.container-border-strong` - 2px border
- `.container-border-accent` - Primary color border
- `.container-border-success` - Success color border
- `.container-border-warning` - Warning color border
- `.container-border-error` - Error color border

### Padding Variants

- `.container-padding-sm` - 12px padding
- `.container-padding-md` - 16px/24px responsive padding
- `.container-padding-lg` - 24px/32px responsive padding
- `.container-padding-xl` - 32px/40px responsive padding

### Gradient Variants

- `.container-gradient-primary` - Primary color gradient background
- `.container-gradient-success` - Success color gradient background
- `.container-gradient-warning` - Warning color gradient background
- `.container-gradient-error` - Error color gradient background

## Best Practices

1. **Use semantic containers** - Choose SuccessContainer, WarningContainer, etc. for status-based content
2. **Consistent elevation** - Use base for content, elevated for cards, floating for important elements
3. **Interactive feedback** - Add `interactive` prop for clickable containers
4. **Responsive padding** - Use `padding="md"` or `padding="lg"` for responsive behavior
5. **Glass effects sparingly** - Use glass containers for overlays and special UI elements

## Examples

### Dashboard Metric Card

```tsx
<MetricContainer>
  <div className="text-3xl font-bold text-primary">127</div>
  <div className="text-sm text-muted-foreground">Active Listings</div>
</MetricContainer>
```

### Interactive Feature Card

```tsx
<FeatureContainer>
  <div className="flex items-center gap-3 mb-3">
    <Zap className="h-6 w-6 text-primary" />
    <h3 className="font-semibold">AI Content Generation</h3>
  </div>
  <p className="text-sm text-muted-foreground">
    Generate professional blog posts, social media content, and marketing
    materials in minutes.
  </p>
</FeatureContainer>
```

### Status Notification

```tsx
<SuccessContainer>
  <div className="flex items-center gap-2">
    <CheckCircle className="h-4 w-4" />
    <span>Profile setup completed successfully!</span>
  </div>
</SuccessContainer>
```

This standardized system ensures all containers have consistent styling while providing flexibility for different use cases.
