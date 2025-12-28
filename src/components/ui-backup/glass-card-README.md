# Glass Card Component

A professional glass morphism card component with backdrop blur effects, configurable tints, and optional glow effects. Perfect for creating modern, layered UI designs.

## Features

- **Backdrop Blur**: Configurable blur levels (sm, md, lg, xl)
- **Tint Options**: Light, dark, or primary color tints
- **Border Styles**: Optional glass borders with transparency
- **Glow Effects**: Subtle hover glow for interactive cards
- **Interactive Mode**: Scale and lift animations on hover
- **Gradient Borders**: Optional animated gradient borders
- **Composable**: Includes Header, Title, Description, Content, and Footer sub-components

## Usage

### Basic Glass Card

```tsx
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
} from "@/components/ui/glass-card";

export function BasicGlassCard() {
  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle>Glass Card Title</GlassCardTitle>
        <GlassCardDescription>
          A beautiful glass morphism card with backdrop blur
        </GlassCardDescription>
      </GlassCardHeader>
      <GlassCardContent>
        <p>Your content goes here</p>
      </GlassCardContent>
    </GlassCard>
  );
}
```

### Interactive Card with Glow

```tsx
<GlassCard interactive glow blur="lg">
  <GlassCardContent>
    <h3 className="text-xl font-bold mb-2">Interactive Card</h3>
    <p>Hover over me to see the glow effect</p>
  </GlassCardContent>
</GlassCard>
```

### Different Blur Levels

```tsx
{
  /* Subtle blur */
}
<GlassCard blur="sm">
  <GlassCardContent>Subtle blur effect</GlassCardContent>
</GlassCard>;

{
  /* Medium blur (default) */
}
<GlassCard blur="md">
  <GlassCardContent>Medium blur effect</GlassCardContent>
</GlassCard>;

{
  /* Strong blur */
}
<GlassCard blur="lg">
  <GlassCardContent>Strong blur effect</GlassCardContent>
</GlassCard>;

{
  /* Extra strong blur */
}
<GlassCard blur="xl">
  <GlassCardContent>Extra strong blur effect</GlassCardContent>
</GlassCard>;
```

### Tint Options

```tsx
{
  /* Light tint (default) - white in light mode, dark in dark mode */
}
<GlassCard tint="light">
  <GlassCardContent>Light tint</GlassCardContent>
</GlassCard>;

{
  /* Dark tint - dark in light mode, light in dark mode */
}
<GlassCard tint="dark">
  <GlassCardContent>Dark tint</GlassCardContent>
</GlassCard>;

{
  /* Primary color tint */
}
<GlassCard tint="primary">
  <GlassCardContent>Primary color tint</GlassCardContent>
</GlassCard>;
```

### With Gradient Border

```tsx
<GlassCard gradientBorder glow>
  <GlassCardContent>
    <h3 className="text-xl font-bold">Premium Card</h3>
    <p>With animated gradient border</p>
  </GlassCardContent>
</GlassCard>
```

### Dashboard Stat Card Example

```tsx
<GlassCard blur="lg" glow interactive>
  <GlassCardHeader>
    <GlassCardTitle className="text-sm font-medium text-muted-foreground">
      Total Revenue
    </GlassCardTitle>
  </GlassCardHeader>
  <GlassCardContent>
    <div className="text-3xl font-bold">$45,231.89</div>
    <p className="text-xs text-muted-foreground mt-1">+20.1% from last month</p>
  </GlassCardContent>
</GlassCard>
```

### Feature Highlight Card

```tsx
<GlassCard blur="xl" tint="primary" gradientBorder glow interactive>
  <GlassCardHeader>
    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
      <Sparkles className="w-6 h-6 text-primary" />
    </div>
    <GlassCardTitle>AI-Powered Insights</GlassCardTitle>
    <GlassCardDescription>
      Get intelligent recommendations based on your market data
    </GlassCardDescription>
  </GlassCardHeader>
  <GlassCardContent>
    <ul className="space-y-2 text-sm">
      <li>✓ Real-time market analysis</li>
      <li>✓ Predictive analytics</li>
      <li>✓ Automated reporting</li>
    </ul>
  </GlassCardContent>
</GlassCard>
```

## Props

### GlassCard

| Prop             | Type                             | Default   | Description                  |
| ---------------- | -------------------------------- | --------- | ---------------------------- |
| `blur`           | `"sm" \| "md" \| "lg" \| "xl"`   | `"md"`    | Backdrop blur intensity      |
| `tint`           | `"light" \| "dark" \| "primary"` | `"light"` | Background tint color        |
| `border`         | `boolean`                        | `true`    | Show glass border            |
| `glow`           | `boolean`                        | `false`   | Add glow effect on hover     |
| `interactive`    | `boolean`                        | `false`   | Add scale and lift on hover  |
| `gradientBorder` | `boolean`                        | `false`   | Use animated gradient border |
| `className`      | `string`                         | -         | Additional CSS classes       |

### Sub-components

All sub-components (`GlassCardHeader`, `GlassCardTitle`, `GlassCardDescription`, `GlassCardContent`, `GlassCardFooter`) accept standard HTML div/heading props and can be styled with `className`.

## Design Guidelines

### When to Use

- **Dashboard Cards**: Stats, metrics, and data visualizations
- **Feature Highlights**: Showcase premium features or benefits
- **Modal Overlays**: Create depth with backdrop blur
- **Navigation Panels**: Floating navigation or sidebars
- **Content Sections**: Separate content with visual hierarchy

### Best Practices

1. **Use Sparingly**: Glass effects work best as accents, not everywhere
2. **Ensure Contrast**: Make sure text is readable against blurred backgrounds
3. **Layer Thoughtfully**: Place glass cards over interesting backgrounds for best effect
4. **Performance**: Use lower blur levels on mobile for better performance
5. **Accessibility**: Maintain sufficient color contrast for text content

### Blur Level Guidelines

- **sm**: Subtle effect for slight depth (4px blur)
- **md**: Standard glass effect for most use cases (12px blur)
- **lg**: Strong effect for prominent cards (16px blur)
- **xl**: Maximum effect for hero sections (24px blur)

### Tint Guidelines

- **light**: Default for most cards, adapts to theme
- **dark**: Use for contrast or inverted sections
- **primary**: Use sparingly for featured/premium content

## Accessibility

- Maintains proper color contrast ratios
- Supports keyboard navigation when interactive
- Works with screen readers
- Respects reduced motion preferences (animations disabled)

## Browser Support

Backdrop blur is supported in all modern browsers. For older browsers, the component gracefully degrades to a solid background with transparency.

## Examples in the App

See these pages for real-world usage:

- Dashboard: Metric cards with glass effects
- Marketing Plan: Action item cards
- Content Engine: Content type selection cards
