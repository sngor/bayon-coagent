# Typography Scale Documentation

## Overview

This document provides comprehensive documentation for the bold typography system implemented in the Co-agent Marketer platform. The typography system is designed to convey authority, professionalism, and trust—essential qualities for real estate agents building their brand.

The system uses **Inter** as the primary typeface with variable font weights (400-900), providing flexibility for different contexts while maintaining visual consistency.

---

## Typography Philosophy

Our typography system is built on three core principles:

1. **Authority**: Bold, confident typography that commands attention
2. **Clarity**: Optimal readability with generous spacing and line heights
3. **Hierarchy**: Clear visual distinction between content levels

---

## Font Family

### Primary Font: Inter

```css
font-family: "Inter", system-ui, -apple-system, sans-serif;
```

**Weights Available:**

- 400 (Regular) - Body text
- 500 (Medium) - Emphasized body text
- 600 (Semi-bold) - Subheadings, labels
- 700 (Bold) - Headings, important text
- 800 (Extra-bold) - Display text, hero sections
- 900 (Black) - Reserved for special emphasis

**Why Inter?**

- Excellent readability at all sizes
- Variable font support for smooth weight transitions
- Optimized for digital screens
- Professional, modern appearance
- Tabular number support for metrics

---

## Typography Scale

### Display Text (Hero Sizes)

Use for landing pages, hero sections, and major announcements.

#### `.text-display-hero`

```css
font-size: 4.5rem; /* 72px */
font-weight: 800;
line-height: 1.1;
letter-spacing: -0.02em;
```

**Usage:**

- Landing page headlines
- Major feature announcements
- Hero section titles

**Example:**

```tsx
<h1 className="text-display-hero">Transform Your Real Estate Marketing</h1>
```

**Responsive Behavior:**

- Desktop (>1024px): 72px
- Tablet (769-1024px): 56px
- Mobile (≤768px): 40px

---

#### `.text-display-large`

```css
font-size: 3.5rem; /* 56px */
font-weight: 700;
line-height: 1.2;
letter-spacing: -0.01em;
```

**Usage:**

- Section headlines
- Feature page titles
- Important announcements

**Example:**

```tsx
<h1 className="text-display-large">AI-Powered Marketing Plans</h1>
```

**Responsive Behavior:**

- Desktop (>1024px): 56px
- Tablet (769-1024px): 44px
- Mobile (≤768px): 32px

---

#### `.text-display-medium`

```css
font-size: 2.5rem; /* 40px */
font-weight: 700;
line-height: 1.2;
```

**Usage:**

- Page section headers
- Card titles in hero sections
- Prominent feature labels

**Example:**

```tsx
<h2 className="text-display-medium">Your Marketing Dashboard</h2>
```

**Responsive Behavior:**

- Desktop (>1024px): 40px
- Tablet (769-1024px): 32px
- Mobile (≤768px): 28px

---

### Heading Styles

Use for content hierarchy within pages.

#### `.text-heading-1`

```css
font-size: 2rem; /* 32px */
font-weight: 700;
line-height: 1.3;
```

**Usage:**

- Page titles
- Main section headings
- Primary content headers

**Example:**

```tsx
<h1 className="text-heading-1">Brand Audit Results</h1>
```

---

#### `.text-heading-2`

```css
font-size: 1.5rem; /* 24px */
font-weight: 600;
line-height: 1.4;
```

**Usage:**

- Subsection headings
- Card titles
- Feature labels

**Example:**

```tsx
<h2 className="text-heading-2">NAP Consistency Check</h2>
```

---

#### `.text-heading-3`

```css
font-size: 1.25rem; /* 20px */
font-weight: 600;
line-height: 1.4;
```

**Usage:**

- Tertiary headings
- List section headers
- Component titles

**Example:**

```tsx
<h3 className="text-heading-3">Recent Activity</h3>
```

---

### Metric Display Styles

Use for displaying numbers, statistics, and data visualizations.

#### `.text-metric-large`

```css
font-size: 3rem; /* 48px */
font-weight: 700;
font-variant-numeric: tabular-nums;
letter-spacing: -0.02em;
```

**Usage:**

- Dashboard key metrics
- Large statistics
- Hero numbers

**Example:**

```tsx
<div className="text-metric-large">$2.4M</div>
```

**Features:**

- Tabular numbers for alignment
- Tight letter spacing for compactness
- Bold weight for emphasis

**Responsive Behavior:**

- Desktop (>1024px): 48px
- Mobile (≤768px): 32px

---

#### `.text-metric-medium`

```css
font-size: 2rem; /* 32px */
font-weight: 600;
font-variant-numeric: tabular-nums;
letter-spacing: -0.01em;
```

**Usage:**

- Card metrics
- Secondary statistics
- Comparison numbers

**Example:**

```tsx
<div className="text-metric-medium">127</div>
```

**Responsive Behavior:**

- Desktop (>1024px): 32px
- Mobile (≤768px): 24px

---

#### `.text-metric-small`

```css
font-size: 1.5rem; /* 24px */
font-weight: 600;
font-variant-numeric: tabular-nums;
```

**Usage:**

- Inline metrics
- Small stat cards
- List item numbers

**Example:**

```tsx
<span className="text-metric-small">42%</span>
```

---

### Call-to-Action (CTA) Styles

Use for buttons, links, and action-oriented text.

#### `.text-bold-cta`

```css
font-size: 1.125rem; /* 18px */
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.05em;
```

**Usage:**

- Primary button text
- Important action links
- Navigation items

**Example:**

```tsx
<button className="text-bold-cta">Get Started</button>
```

---

#### `.text-bold-cta-large`

```css
font-size: 1.25rem; /* 20px */
font-weight: 800;
text-transform: uppercase;
letter-spacing: 0.05em;
```

**Usage:**

- Hero CTAs
- Primary landing page actions
- Major conversion buttons

**Example:**

```tsx
<button className="text-bold-cta-large">Start Free Trial</button>
```

---

### Gradient Text Effects

Add visual interest and emphasis to headings.

#### `.text-gradient`

```css
background: linear-gradient(
  135deg,
  hsl(var(--foreground)) 0%,
  hsl(var(--foreground) / 0.7) 100%
);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

**Usage:**

- Hero headlines
- Feature titles
- Special announcements

**Example:**

```tsx
<h1 className="text-display-hero text-gradient">Welcome to the Future</h1>
```

---

#### `.text-gradient-primary`

Uses primary brand colors for gradient effect.

**Example:**

```tsx
<h2 className="text-display-large text-gradient-primary">
  AI-Powered Insights
</h2>
```

---

#### `.text-gradient-accent`

Uses accent gradient (purple to blue) for special emphasis.

**Example:**

```tsx
<h2 className="text-heading-1 text-gradient-accent">Premium Features</h2>
```

---

#### `.text-gradient-success`

Uses success colors for positive messaging.

**Example:**

```tsx
<div className="text-metric-large text-gradient-success">+127%</div>
```

---

## Usage Guidelines

### When to Use Each Style

#### Display Text

- **Hero**: Landing pages, major announcements only
- **Large**: Feature pages, section intros
- **Medium**: Page headers, prominent sections

#### Headings

- **H1**: One per page, main page title
- **H2**: Major sections within a page
- **H3**: Subsections, card titles

#### Metrics

- **Large**: Dashboard hero metrics (1-3 per page)
- **Medium**: Card metrics, secondary stats
- **Small**: Inline metrics, list items

#### CTAs

- **Standard**: Most buttons and action links
- **Large**: Hero CTAs, primary conversions

### Combining Styles

You can combine typography classes with other utilities:

```tsx
// Gradient heading with spacing
<h1 className="text-display-hero text-gradient mb-6">
  Your Title
</h1>

// Metric with color
<div className="text-metric-large text-primary">
  $1.2M
</div>

// CTA with animation
<button className="text-bold-cta hover:scale-105 transition-transform">
  Learn More
</button>
```

---

## Accessibility Considerations

### Contrast Requirements

All typography must meet WCAG 2.1 Level AA standards:

- **Normal text** (< 18px): Minimum 4.5:1 contrast ratio
- **Large text** (≥ 18px or ≥ 14px bold): Minimum 3:1 contrast ratio
- **Display text**: Minimum 3:1 contrast ratio

### Gradient Text Accessibility

When using gradient text effects:

1. Ensure the lightest color in the gradient meets contrast requirements
2. Test with color blindness simulators
3. Provide sufficient fallback for browsers without gradient support
4. Avoid gradients on body text (use only for headings)

### Font Size Minimums

- **Body text**: Never below 16px (1rem)
- **Small text**: Never below 14px (0.875rem)
- **Touch targets**: Minimum 44x44px for interactive elements

### Line Height

Optimal line heights for readability:

- **Display text**: 1.1 - 1.2
- **Headings**: 1.3 - 1.4
- **Body text**: 1.5 - 1.6
- **Dense content**: 1.4 - 1.5

### Letter Spacing

- **Display text**: Negative spacing (-0.02em to -0.01em) for tighter appearance
- **Headings**: Default or slightly negative
- **Body text**: Default (0)
- **CTAs**: Positive spacing (0.05em) for emphasis and readability

---

## Responsive Typography

### Breakpoint Strategy

Our typography scales responsively across three breakpoints:

1. **Mobile** (≤768px): Reduced sizes for smaller screens
2. **Tablet** (769-1024px): Intermediate sizes
3. **Desktop** (>1024px): Full sizes

### Scaling Ratios

- **Display Hero**: 72px → 56px → 40px (0.78x → 0.56x)
- **Display Large**: 56px → 44px → 32px (0.79x → 0.57x)
- **Display Medium**: 40px → 32px → 28px (0.80x → 0.70x)
- **Metrics Large**: 48px → 32px (0.67x)
- **Metrics Medium**: 32px → 24px (0.75x)

### Implementation

Responsive scaling is automatic when using the utility classes:

```tsx
// Automatically scales from 72px → 56px → 40px
<h1 className="text-display-hero">Responsive Heading</h1>
```

---

## Best Practices

### Do's ✅

1. **Use semantic HTML**: Match heading levels to content hierarchy
2. **Limit display text**: Use sparingly for maximum impact
3. **Consistent spacing**: Maintain rhythm with margin utilities
4. **Test readability**: Check on actual devices, not just browser resize
5. **Use tabular numbers**: For metrics and data that need alignment
6. **Combine with color**: Use text color utilities for emphasis
7. **Respect hierarchy**: Don't skip heading levels (h1 → h2 → h3)

### Don'ts ❌

1. **Don't overuse bold**: Not every word needs emphasis
2. **Don't use all caps for body text**: Reserve for CTAs only
3. **Don't use gradient text everywhere**: Use for special emphasis only
4. **Don't ignore line height**: Cramped text is hard to read
5. **Don't use display text for body content**: It's too large
6. **Don't mix too many weights**: Stick to 2-3 weights per section
7. **Don't forget mobile**: Always test responsive behavior

---

## Code Examples

### Dashboard Metric Card

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-heading-3">Total Revenue</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-metric-large text-gradient-success">$2.4M</div>
    <p className="text-sm text-muted-foreground mt-2">+12.5% from last month</p>
  </CardContent>
</Card>
```

### Hero Section

```tsx
<section className="py-20">
  <h1 className="text-display-hero text-gradient mb-6">
    Transform Your Real Estate Marketing
  </h1>
  <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
    AI-powered tools to build your brand, create content, and dominate your
    market
  </p>
  <Button size="lg" className="text-bold-cta-large">
    Get Started Free
  </Button>
</section>
```

### Feature Section

```tsx
<section>
  <h2 className="text-display-medium text-gradient-primary mb-4">
    AI-Powered Features
  </h2>
  <div className="grid grid-cols-3 gap-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-2">Marketing Plans</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-base text-muted-foreground">
          Get personalized 3-step marketing strategies
        </p>
      </CardContent>
    </Card>
    {/* More cards... */}
  </div>
</section>
```

### Stat Display

```tsx
<div className="grid grid-cols-4 gap-4">
  <div className="text-center">
    <div className="text-metric-medium text-primary">127</div>
    <p className="text-sm text-muted-foreground mt-1">Active Listings</p>
  </div>
  <div className="text-center">
    <div className="text-metric-medium text-success">4.8</div>
    <p className="text-sm text-muted-foreground mt-1">Average Rating</p>
  </div>
  {/* More stats... */}
</div>
```

---

## Testing Checklist

When implementing typography, verify:

- [ ] Contrast ratios meet WCAG AA standards
- [ ] Text is readable on all background colors
- [ ] Responsive scaling works on mobile, tablet, desktop
- [ ] Gradient text has sufficient fallback
- [ ] Line heights provide comfortable reading
- [ ] Letter spacing is appropriate for each style
- [ ] Semantic HTML is used correctly
- [ ] Font weights load properly
- [ ] Tabular numbers align in tables/lists
- [ ] Text doesn't overflow containers
- [ ] Reduced motion preferences are respected
- [ ] Screen readers can parse content hierarchy

---

## Performance Considerations

### Font Loading

The Inter font is loaded via Google Fonts with `display=swap`:

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap");
```

**Benefits:**

- `display=swap` prevents invisible text during load
- Variable font reduces file size
- Only weights 400-900 are loaded (not the full range)

### Optimization Tips

1. **Preload critical fonts**: Add to `<head>` for above-the-fold text
2. **Subset fonts**: Only include Latin characters if not using others
3. **Use system fonts as fallback**: Ensures text is always visible
4. **Avoid font weight changes on hover**: Can cause layout shift
5. **Cache font files**: Set long cache headers

---

## Browser Support

### Full Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Partial Support

- Older browsers fall back to system fonts
- Gradient text falls back to solid color
- Variable fonts fall back to nearest weight

### Fallback Strategy

```css
font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif;
```

---

## Related Documentation

- [Design System Overview](./DESIGN_SYSTEM.md)
- [Color Palette Documentation](./COLOR_PALETTE.md)
- [Component Library](./COMPONENTS.md)
- [Accessibility Guidelines](./ACCESSIBILITY.md)

---

## Changelog

### Version 1.0 (Current)

- Initial typography scale implementation
- Inter variable font integration
- Display, heading, metric, and CTA styles
- Gradient text effects
- Responsive scaling
- Accessibility compliance

---

## Support

For questions or issues with typography:

1. Check this documentation first
2. Review the design system in `src/app/globals.css`
3. Test on actual devices
4. Consult the design team for special cases

---

**Last Updated:** November 2024  
**Maintained By:** Design System Team
