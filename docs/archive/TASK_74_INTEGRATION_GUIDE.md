# Typography System Integration Guide

## Quick Start

The bold typography system is now available throughout the application. Here's how to integrate it into existing pages.

## Typography Classes Reference

### Display Text (Hero Sections)

```tsx
// Hero text - 72px / 800 weight
<h1 className="text-display-hero">Your Real Estate Success</h1>

// Large display - 56px / 700 weight
<h2 className="text-display-large">Build Your Authority Online</h2>

// Medium display - 40px / 700 weight
<h3 className="text-display-medium">Marketing Made Simple</h3>
```

### Metric Numbers (Dashboards & Stats)

```tsx
// Large metrics - 48px / 700 weight / tabular-nums
<div className="text-metric-large text-primary">$1,234,567</div>

// Medium metrics - 32px / 600 weight / tabular-nums
<div className="text-metric-medium text-success">98.5%</div>

// Small metrics - 24px / 600 weight / tabular-nums
<div className="text-metric-small text-primary">1,234</div>
```

### Gradient Text Effects

```tsx
// Default gradient (foreground colors)
<h1 className="text-display-hero text-gradient">Premium Marketing</h1>

// Primary gradient (blue)
<h2 className="text-display-large text-gradient-primary">Grow Your Business</h2>

// Accent gradient (purple to blue)
<h2 className="text-display-large text-gradient-accent">AI-Powered Success</h2>

// Success gradient (green)
<h2 className="text-display-large text-gradient-success">Achieve Your Goals</h2>
```

### Bold CTA Text

```tsx
// Standard CTA - 18px / 700 weight / uppercase
<Button className="text-bold-cta">Get Started Now</Button>

// Large CTA - 20px / 800 weight / uppercase
<Button size="lg" className="text-bold-cta-large">Start Your Free Trial</Button>
```

### Heading Styles

```tsx
// Heading 1 - 32px / 700 weight
<h1 className="text-heading-1">Transform Your Marketing</h1>

// Heading 2 - 24px / 600 weight
<h2 className="text-heading-2">AI-Powered Content</h2>

// Heading 3 - 20px / 600 weight
<h3 className="text-heading-3">Build Your Authority</h3>
```

## Integration Examples

### Dashboard Page

**Before:**

```tsx
<h1 className="text-3xl font-bold">Dashboard</h1>
<div className="text-2xl font-semibold">{totalSales}</div>
```

**After:**

```tsx
<h1 className="text-display-large text-gradient-primary">Dashboard</h1>
<div className="text-metric-large text-primary">{totalSales}</div>
```

### Login Page

**Before:**

```tsx
<h1 className="text-4xl font-bold">Welcome Back</h1>
<Button>Sign In</Button>
```

**After:**

```tsx
<h1 className="text-display-hero text-gradient">Welcome Back</h1>
<Button className="text-bold-cta-large">Sign In</Button>
```

### Marketing Plan Page

**Before:**

```tsx
<h2 className="text-2xl font-semibold">Your Marketing Plan</h2>
<Button>Generate Plan</Button>
```

**After:**

```tsx
<h2 className="text-display-medium text-gradient-accent">Your Marketing Plan</h2>
<Button className="text-bold-cta">Generate Plan</Button>
```

### Metric Cards

**Before:**

```tsx
<Card>
  <div className="text-3xl font-bold">{value}</div>
  <p className="text-sm">{label}</p>
</Card>
```

**After:**

```tsx
<Card>
  <div className="text-metric-large text-primary">{value}</div>
  <p className="text-heading-3">{label}</p>
</Card>
```

## Best Practices

### 1. Use Display Text for Impact

- Hero sections and landing pages
- Major page headings
- Key value propositions

### 2. Use Metric Numbers for Data

- Dashboard statistics
- Financial figures
- KPIs and performance metrics
- Any numbers that need alignment

### 3. Use Gradient Text Sparingly

- Key headings only
- Primary CTAs
- Hero sections
- Avoid overuse to maintain impact

### 4. Use Bold CTAs for Actions

- Primary action buttons
- Important form submissions
- Key navigation items

### 5. Responsive Considerations

- Typography automatically scales on mobile
- Test on multiple screen sizes
- Ensure readability at all breakpoints

## Common Patterns

### Hero Section

```tsx
<div className="text-center space-y-4">
  <h1 className="text-display-hero text-gradient-primary">
    Transform Your Real Estate Business
  </h1>
  <p className="text-heading-2 text-muted-foreground">
    AI-powered marketing tools for modern agents
  </p>
  <Button size="lg" className="text-bold-cta-large">
    Get Started Free
  </Button>
</div>
```

### Dashboard Stats Grid

```tsx
<div className="grid grid-cols-3 gap-6">
  <Card className="text-center">
    <div className="text-metric-large text-primary">$2.4M</div>
    <p className="text-heading-3">Total Sales</p>
    <p className="text-sm text-muted-foreground">+12% from last month</p>
  </Card>
  {/* More cards... */}
</div>
```

### Page Header

```tsx
<div className="space-y-2">
  <h1 className="text-display-large text-gradient">Marketing Plan</h1>
  <p className="text-heading-3 text-muted-foreground">
    Your personalized 3-step marketing strategy
  </p>
</div>
```

## Migration Checklist

- [ ] Update dashboard page with display text and metrics
- [ ] Update login page with hero text and bold CTAs
- [ ] Update marketing plan page with display text
- [ ] Update brand audit page with metrics
- [ ] Update content engine page with headings
- [ ] Update all primary CTAs with bold text styles
- [ ] Update all metric displays with tabular nums
- [ ] Test responsive behavior on mobile and tablet
- [ ] Verify gradient text usage is not overwhelming
- [ ] Ensure consistent typography across all pages

## Demo Page

Visit `/typography-demo` to see all typography utilities in action with real-world examples.

## Notes

- Inter variable font is loaded from Google Fonts CDN
- All typography classes are responsive by default
- Tabular nums ensure consistent number alignment
- Gradient text uses `-webkit-background-clip` for compatibility
- Bold CTAs use uppercase transformation automatically
