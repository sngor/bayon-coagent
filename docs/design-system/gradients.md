# Gradient Usage Guidelines

## Purpose

This document provides guidelines for using gradients, glass effects, and glow effects in the UI/UX enhancement to ensure a tasteful, premium feel without overwhelming users.

## Gradient Hierarchy

### Level 1: Hero Sections (Maximum Impact)

**Where:** Landing pages, major feature introductions, login page hero  
**Allowed Effects:**

- ✅ Gradient mesh backgrounds (animated float effects)
- ✅ Gradient text on main headings
- ✅ Animated gradients (ai-gradient, shimmer-gradient)
- ✅ Glass effects with backdrop blur
- ✅ Glow effects on primary CTAs

**Example:**

```tsx
<section className="relative">
  {/* Gradient mesh background */}
  <div className="absolute inset-0 -z-10">
    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-primary/10 to-transparent blur-3xl animate-float-slow" />
    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-accent-start/10 to-transparent blur-3xl animate-float-medium" />
  </div>

  {/* Gradient text */}
  <h1 className="text-display-hero text-gradient-primary">
    Welcome to Co-agent Marketer
  </h1>

  {/* Premium button with glow */}
  <Button variant="premium" className="button-glow">
    Get Started
  </Button>
</section>
```

**Limit:** Max 2-3 gradient mesh orbs per section

### Level 2: Feature Sections (Moderate Impact)

**Where:** Dashboard cards, feature highlights, important content areas  
**Allowed Effects:**

- ✅ Gradient borders (static or subtle animation)
- ✅ Gradient text on section headings
- ✅ Glass effects on cards
- ✅ Subtle glow on hover
- ❌ No gradient mesh backgrounds
- ❌ No animated gradients

**Example:**

```tsx
<Card className="gradient-border-primary glass-effect-md hover-glow-sm">
  <CardHeader>
    <h2 className="text-heading-2 text-gradient-accent">AI Marketing Plan</h2>
  </CardHeader>
  <CardContent>{/* Content */}</CardContent>
</Card>
```

**Limit:** Max 3-4 gradient borders per viewport

### Level 3: Content Sections (Minimal Impact)

**Where:** Lists, tables, forms, body content  
**Allowed Effects:**

- ✅ Glass effects on overlays/modals
- ✅ Subtle glow on active/focus states
- ❌ No gradient text
- ❌ No gradient borders
- ❌ No gradient backgrounds
- ❌ No animated effects

**Example:**

```tsx
<Dialog>
  <DialogContent className="glass-effect-lg">
    {/* Modal content */}
  </DialogContent>
</Dialog>

<Input className="focus:glow-effect-sm" />
```

**Limit:** Glass effects on overlays only, glow on interaction states only

### Level 4: UI Components (Interaction Only)

**Where:** Buttons, inputs, navigation items  
**Allowed Effects:**

- ✅ Glow on hover/active states
- ✅ Subtle gradient on premium buttons
- ❌ No gradient text
- ❌ No gradient borders
- ❌ No glass effects
- ❌ No animated gradients

**Example:**

```tsx
<Button variant="premium" className="hover-glow-md">
  Generate Plan
</Button>

<NavigationItem className="hover:glow-effect-sm" />
```

**Limit:** Glow effects on interaction only

## Gradient Density Rules

### Rule 1: Maximum Simultaneous Effects

**Per Viewport:**

- Max 1 gradient mesh background
- Max 2-3 gradient borders
- Max 1-2 gradient text elements
- Max 3-4 glow effects (on hover)
- Max 1 animated gradient

**Example of GOOD density:**

```tsx
<Page>
  {/* 1 gradient mesh */}
  <GradientMeshBackground />

  {/* 1 gradient text */}
  <h1 className="text-gradient-primary">Title</h1>

  {/* 2 gradient borders */}
  <Card className="gradient-border-primary" />
  <Card className="gradient-border-accent" />

  {/* Glow on hover only */}
  <Button className="hover-glow-md">Action</Button>
</Page>
```

**Example of BAD density (too much):**

```tsx
<Page>
  {/* ❌ Too many effects */}
  <GradientMeshBackground />
  <h1 className="text-gradient-primary ai-gradient">Title</h1>
  <Card className="gradient-border-animated shimmer-gradient" />
  <Card className="gradient-border-primary glow-effect-lg" />
  <Card className="gradient-border-accent premium-glow" />
  <Button className="ai-gradient button-glow">Action</Button>
</Page>
```

### Rule 2: Gradient Combination Restrictions

**Never combine:**

- ❌ Gradient text + Gradient border on same element
- ❌ Multiple animated gradients in same viewport
- ❌ Gradient mesh + Animated gradient borders
- ❌ Glass effect + Gradient border (visual conflict)

**Safe combinations:**

- ✅ Gradient text + Glass effect
- ✅ Gradient border + Glow effect
- ✅ Glass effect + Glow effect
- ✅ Gradient mesh + Static gradient borders

### Rule 3: Animation Budget

**Per Page:**

- Max 1 gradient mesh with float animation
- Max 1 animated gradient (ai-gradient or shimmer)
- Max 1 animated gradient border
- Unlimited hover/interaction animations (they're triggered, not constant)

**Rationale:** Constant animations impact performance and can cause visual fatigue

## Glass Effect Guidelines

### When to Use Glass Effects

**✅ Good Use Cases:**

- Modal dialogs and overlays
- Navigation bars (sidebar, header)
- Floating action buttons
- Tooltips and popovers
- Card overlays on images
- Loading overlays

**❌ Avoid:**

- Body content areas
- Form inputs (use on focus only)
- Tables and lists
- Text-heavy sections

### Glass Effect Levels

**Small Blur (8px):** Tooltips, small popovers

```css
.glass-effect-sm
```

**Medium Blur (12px):** Cards, navigation

```css
.glass-effect-md
```

**Large Blur (16px):** Modals, major overlays

```css
.glass-effect-lg
```

**Extra Large Blur (24px):** Full-screen overlays, hero sections

```css
.glass-effect-xl
```

**Rule:** Use larger blur for larger elements and more important overlays

## Glow Effect Guidelines

### When to Use Glow Effects

**✅ Good Use Cases:**

- Primary CTAs (on hover)
- Active navigation items
- Focus states on inputs
- Success states
- Premium features
- Interactive cards (on hover)

**❌ Avoid:**

- Static elements (no interaction)
- Body text
- Multiple elements simultaneously
- Low-priority actions

### Glow Effect Intensity

**Small Glow:** Subtle hover effects, focus states

```css
.glow-effect-sm .hover-glow-sm;
```

**Medium Glow:** Primary buttons, active states

```css
.glow-effect-md .hover-glow-md;
```

**Large Glow:** Hero CTAs, premium features

```css
.glow-effect-lg .hover-glow-lg;
```

**Premium Glow:** Special occasions, celebrations

```css
.premium-glow .premium-glow-hover;
```

**Rule:** Intensity should match element importance

## Performance Considerations

### Optimization Rules

1. **Limit Animated Gradients**

   - Max 3 animated gradients per page
   - Use static gradients for non-critical elements
   - Consider lazy-loading gradient mesh backgrounds

2. **Use Will-Change Hints**

   ```css
   .animated-element {
     will-change: transform, opacity;
   }
   ```

3. **Prefer Transform Over Background-Position**

   - Use transform for movement
   - Avoid animating background-position when possible

4. **Lazy Load Heavy Effects**

   ```tsx
   const GradientMesh = lazy(() => import("./GradientMesh"));
   ```

5. **Provide Reduced Effects Mode**

   ```tsx
   const prefersReducedMotion = useReducedMotion();

   if (prefersReducedMotion) {
     return <StaticBackground />;
   }
   ```

### Performance Budget

**Per Page:**

- Max 3 animated gradients
- Max 5 glass effects
- Max 10 glow effects (on hover)
- Max 1 gradient mesh background

**Monitor:**

- Frame rate (target: 60fps)
- Paint time (target: < 16ms)
- Composite time (target: < 16ms)

## Design Review Checklist

Before implementing gradients, check:

- [ ] Does this page already have a gradient mesh?
- [ ] How many gradient borders are visible?
- [ ] How many gradient text elements are visible?
- [ ] Are there any animated gradients?
- [ ] Is the total gradient count < 5 per viewport?
- [ ] Are glass effects used appropriately?
- [ ] Are glow effects only on interaction?
- [ ] Does it work in dark mode?
- [ ] Does it respect reduced motion?
- [ ] Is performance acceptable (60fps)?

## Examples by Page Type

### Dashboard Page

```tsx
<Page>
  {/* Subtle gradient mesh */}
  <GradientMeshBackground opacity={0.3} />

  {/* Gradient text on main heading */}
  <h1 className="text-display-large text-gradient-primary">Dashboard</h1>

  {/* Glass effect cards with subtle glow on hover */}
  <Card className="glass-effect-md hover-glow-sm">
    <MetricCard />
  </Card>

  {/* Premium button with glow */}
  <Button variant="premium" className="hover-glow-md">
    Generate Plan
  </Button>
</Page>
```

**Gradient Count:** 1 mesh + 1 text + 3-4 glass cards + 1 button = ✅ Good

### Feature Page (Marketing Plan, Brand Audit)

```tsx
<Page>
  {/* No gradient mesh */}

  {/* Gradient text on heading */}
  <h1 className="text-heading-1 text-gradient-accent">Marketing Plan</h1>

  {/* Gradient borders on feature cards */}
  <Card className="gradient-border-primary">
    <ActionItem />
  </Card>

  {/* Glass effect on modal */}
  <Dialog>
    <DialogContent className="glass-effect-lg">{/* Content */}</DialogContent>
  </Dialog>
</Page>
```

**Gradient Count:** 1 text + 2-3 borders + 1 glass modal = ✅ Good

### Content Page (Lists, Tables)

```tsx
<Page>
  {/* No gradient mesh */}
  {/* No gradient text */}
  {/* No gradient borders */}

  {/* Glass effect on navigation only */}
  <Sidebar className="glass-effect-md" />

  {/* Glow on interactive elements only */}
  <Button className="hover-glow-sm">Action</Button>

  {/* Focus glow on inputs */}
  <Input className="focus:glow-effect-sm" />
</Page>
```

**Gradient Count:** 1 glass sidebar + hover glows = ✅ Good

### Login/Hero Page

```tsx
<Page>
  {/* Full gradient mesh */}
  <GradientMeshBackground>
    <div className="animate-float-slow" />
    <div className="animate-float-medium" />
  </GradientMeshBackground>

  {/* Large gradient text */}
  <h1 className="text-display-hero text-gradient-primary">Welcome</h1>

  {/* Premium button with large glow */}
  <Button variant="premium" className="premium-glow-hover">
    Get Started
  </Button>

  {/* Glass effect on form */}
  <Card className="glass-effect-xl">
    <LoginForm />
  </Card>
</Page>
```

**Gradient Count:** 1 mesh + 1 text + 1 button + 1 glass card = ✅ Good (hero page exception)

## Common Mistakes to Avoid

### ❌ Mistake 1: Gradient Overload

```tsx
{
  /* Too many gradients */
}
<Card className="gradient-border-animated shimmer-gradient">
  <h3 className="text-gradient-primary ai-gradient">Title</h3>
  <Button className="premium-glow">Action</Button>
</Card>;
```

### ✅ Fix: Choose One Primary Effect

```tsx
<Card className="gradient-border-primary">
  <h3 className="font-bold">Title</h3>
  <Button className="hover-glow-sm">Action</Button>
</Card>
```

### ❌ Mistake 2: Animated Everything

```tsx
{
  /* Too many animations */
}
<Page>
  <GradientMesh className="animate-float-slow" />
  <h1 className="ai-gradient">Title</h1>
  <Card className="gradient-border-animated" />
  <Button className="shimmer-gradient">Action</Button>
</Page>;
```

### ✅ Fix: Limit to One Animation

```tsx
<Page>
  <GradientMesh className="animate-float-slow" />
  <h1 className="text-gradient-primary">Title</h1>
  <Card className="gradient-border-primary">
  <Button className="hover-glow-md">Action</Button>
</Page>
```

### ❌ Mistake 3: Glass Effect Everywhere

```tsx
{
  /* Glass effects on everything */
}
<Page className="glass-effect-lg">
  <Card className="glass-effect-md">
    <Input className="glass-effect-sm" />
  </Card>
</Page>;
```

### ✅ Fix: Use Glass Selectively

```tsx
<Page>
  <Sidebar className="glass-effect-md" />
  <Card>
    <Input />
  </Card>
</Page>
```

## Testing Checklist

Before deploying gradient changes:

- [ ] Test on Chrome (latest)
- [ ] Test on Firefox (latest)
- [ ] Test on Safari (latest)
- [ ] Test on mobile Safari (iOS)
- [ ] Test on mobile Chrome (Android)
- [ ] Test in dark mode
- [ ] Test with reduced motion enabled
- [ ] Check frame rate (should be 60fps)
- [ ] Check paint time (should be < 16ms)
- [ ] Get feedback from 2-3 team members
- [ ] Verify gradient count < 5 per viewport
- [ ] Verify animation count < 3 per page

## Summary

**Golden Rules:**

1. **Less is more** - Use gradients sparingly for maximum impact
2. **Hierarchy matters** - Hero sections get more effects than content sections
3. **Performance first** - Limit animated gradients and monitor frame rates
4. **Consistency wins** - Follow the gradient hierarchy consistently
5. **Test thoroughly** - Check on multiple devices and browsers

**Quick Reference:**

- Hero sections: Full effects (mesh + text + borders + glow)
- Feature sections: Moderate effects (borders + text + glass)
- Content sections: Minimal effects (glass + hover glow only)
- UI components: Interaction only (hover/focus glow)

**When in doubt:** Use fewer gradients rather than more. A single well-placed gradient is more impactful than multiple competing effects.
