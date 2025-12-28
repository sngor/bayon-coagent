# Gradient Border & Glow Effects

Premium gradient border and glow effect utilities for creating sophisticated UI components.

## Components

### GradientBorder

A wrapper component that adds animated gradient borders to any content.

```tsx
import { GradientBorder } from "@/components/ui/gradient-border";

<GradientBorder variant="primary" glow="md" rounded="lg">
  <div className="p-6">Your content here</div>
</GradientBorder>;
```

#### Props

- `variant`: `"default" | "primary" | "accent" | "success" | "animated"` - Border gradient style
- `borderWidth`: `"thin" | "medium" | "thick"` - Border thickness
- `glow`: `"none" | "sm" | "md" | "lg"` - Glow effect intensity
- `rounded`: `"none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full"` - Border radius
- `animate`: `boolean` - Enable gradient animation

## Button Variants

New button variants with glow effects:

```tsx
import { Button } from "@/components/ui/button";

// Premium gradient button with glow
<Button variant="premium">Premium</Button>

// Primary button with glow effect
<Button variant="glow">Glow</Button>

// Success button with glow effect
<Button variant="glow-success">Success</Button>

// Gradient border button
<Button variant="gradient-border">Border</Button>
```

## CSS Utility Classes

### Gradient Border Classes

Apply gradient borders directly with CSS classes:

```tsx
// Basic gradient border
<div className="gradient-border p-6">Content</div>

// Gradient border variants
<div className="gradient-border gradient-border-primary">Primary</div>
<div className="gradient-border gradient-border-accent">Accent</div>
<div className="gradient-border gradient-border-success">Success</div>
<div className="gradient-border gradient-border-animated">Animated</div>

// Border widths
<div className="gradient-border gradient-border-thin">Thin</div>
<div className="gradient-border gradient-border-medium">Medium</div>
<div className="gradient-border gradient-border-thick">Thick</div>

// With animation
<div className="gradient-border gradient-border-animate">Animated</div>
```

### Glow Effect Classes

Add glow effects to any element:

```tsx
// Static glow effects
<div className="glow-effect-sm">Small glow</div>
<div className="glow-effect-md">Medium glow</div>
<div className="glow-effect-lg">Large glow</div>

// Hover glow effects
<div className="hover-glow-sm">Hover for small glow</div>
<div className="hover-glow-md">Hover for medium glow</div>
<div className="hover-glow-lg">Hover for large glow</div>

// Button glow
<button className="button-glow">Button with glow</button>
<button className="button-glow-success">Success button glow</button>

// Card glow
<div className="card-glow">Card with hover glow</div>

// Premium multi-layer glow
<div className="premium-glow">Premium glow</div>
<div className="premium-glow-hover">Premium hover glow</div>
```

## Usage Examples

### Premium Feature Card

```tsx
<GradientBorder variant="primary" glow="md" rounded="xl">
  <Card className="border-0">
    <CardHeader>
      <CardTitle>Premium Feature</CardTitle>
      <CardDescription>Enhanced with gradient border</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Your premium content here</p>
      <Button variant="premium" className="w-full">
        Get Started
      </Button>
    </CardContent>
  </Card>
</GradientBorder>
```

### Animated Gradient Border

```tsx
<GradientBorder variant="animated" glow="lg" rounded="lg" animate>
  <div className="p-6">
    <h3 className="font-semibold mb-2">Animated Border</h3>
    <p className="text-sm text-muted-foreground">Rotating gradient animation</p>
  </div>
</GradientBorder>
```

### Interactive Card with Hover Glow

```tsx
<Card className="hover-glow-md cursor-pointer transition-all">
  <CardHeader>
    <CardTitle>Hover Me</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Hover to see the glow effect</p>
  </CardContent>
</Card>
```

### Premium Button Group

```tsx
<div className="flex gap-4">
  <Button variant="premium" size="lg">
    <Sparkles className="w-4 h-4" />
    Premium
  </Button>
  <Button variant="glow" size="lg">
    <Zap className="w-4 h-4" />
    Glow
  </Button>
  <Button variant="glow-success" size="lg">
    <Star className="w-4 h-4" />
    Success
  </Button>
</div>
```

## Customization

### Custom Gradient Colors

You can customize gradient colors in `globals.css`:

```css
:root {
  --gradient-start: 220 60% 50%;
  --gradient-end: 260 60% 50%;
  --glow-primary: 220 60% 50% / 0.3;
  --glow-active: 220 60% 50% / 0.5;
}
```

### Custom Border Width

Create custom border widths:

```css
.gradient-border-custom::before {
  padding: 4px; /* Custom width */
}
```

### Custom Glow Intensity

Create custom glow effects:

```css
.custom-glow {
  box-shadow: 0 0 40px hsl(var(--primary) / 0.6), 0 0 80px hsl(var(--primary) /
          0.4);
}
```

## Performance Considerations

- Gradient borders use CSS pseudo-elements for optimal performance
- Glow effects use `box-shadow` which is GPU-accelerated
- Animations respect `prefers-reduced-motion` preferences
- Use glow effects sparingly to avoid visual clutter

## Accessibility

- Gradient borders maintain sufficient contrast ratios
- Glow effects are decorative and don't convey essential information
- All interactive elements maintain proper focus indicators
- Animations can be disabled via reduced motion preferences

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Gradient borders use standard CSS with fallbacks
- Glow effects work in all browsers supporting `box-shadow`
- Animations use standard CSS keyframes

## Demo

Visit `/gradient-border-demo` to see all variants and effects in action.
