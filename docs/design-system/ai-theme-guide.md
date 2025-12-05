# AI Theme Guide - Blue Gradient

This guide covers the new AI-themed design system using a blue gradient color palette for a clean, professional, and sophisticated look.

## Color Palette

### Light Mode

- `--ai-blue-light`: 210 100% 95% - Light blue for subtle backgrounds
- `--ai-blue`: 215 85% 60% - Primary blue
- `--ai-blue-deep`: 220 75% 45% - Deep blue for contrast
- `--ai-gold-light`: 45 100% 85% - Light gold for highlights
- `--ai-gold`: 45 95% 60% - Primary gold
- `--ai-gold-deep`: 42 90% 50% - Deep gold for emphasis
- `--ai-white`: 0 0% 100% - Pure white for shimmer
- `--ai-shimmer`: 210 100% 98% - Near-white shimmer effect

### Dark Mode

Colors are automatically adjusted for dark mode with increased brightness and saturation.

## Usage Guidelines

### When to Use AI Theme

Apply AI-themed styles to:

- ✅ AI-powered features (Studio Write, Describe, Reimagine)
- ✅ Research Agent interface
- ✅ AI-generated content indicators
- ✅ Strategy generation features
- ✅ Smart analysis tools
- ✅ AI assistant/chatbot interface

### When NOT to Use

Avoid AI theme for:

- ❌ Standard navigation elements
- ❌ Form inputs (unless AI-powered)
- ❌ Static content displays
- ❌ User profile information
- ❌ Settings pages

## Component Classes

### Buttons

```tsx
// Primary AI button with gradient
<Button className="ai-gradient">
  Generate Content
</Button>

// Shimmer effect button (animated)
<Button className="shimmer-gradient">
  AI Research
</Button>

// AI button with glow effect
<Button className="ai-gradient button-glow-ai">
  Create Strategy
</Button>
```

### Containers

```tsx
// Subtle AI gradient container
<div className="container-gradient-ai">
  AI-powered content here
</div>

// Animated shimmer container
<div className="container-gradient-ai-shimmer">
  Processing with AI...
</div>

// Container with AI glow effect
<div className="container-ai-glow">
  AI analysis results
</div>
```

### Text Gradients

```tsx
// Blue to gold gradient text
<h1 className="text-gradient-ai">
  AI-Powered Insights
</h1>

// Animated shimmer text
<h2 className="text-gradient-ai-shimmer">
  Generating Content...
</h2>

// Gold gradient text
<span className="text-gradient-ai-gold">
  Premium AI Feature
</span>
```

### Borders

```tsx
// AI gradient border
<Card className="gradient-border gradient-border-ai">
  Content
</Card>

// Animated shimmer border
<Card className="gradient-border gradient-border-ai-shimmer">
  Content
</Card>

// Adjust border width
<Card className="gradient-border gradient-border-ai gradient-border-medium">
  Content
</Card>
```

### Badges

```tsx
// Solid AI badge
<span className="badge-ai">AI</span>

// Outline AI badge
<span className="badge-ai-outline">AI-Powered</span>

// Shimmer badge (animated)
<span className="badge-ai-shimmer">Generating...</span>
```

### Icons

```tsx
// AI icon wrapper with hover effect
<div className="ai-icon-wrapper">
  <Sparkles className="w-5 h-5" />
</div>
```

### Backgrounds

```tsx
// AI gradient background
<div className="bg-ai-gradient text-white p-4">
  Content
</div>

// Animated shimmer background
<div className="bg-ai-shimmer p-4">
  Content
</div>

// Subtle AI background
<div className="bg-ai-subtle p-4">
  Content
</div>
```

### Glow Effects

```tsx
// AI glow effect
<Card className="glow-effect-ai">
  Content
</Card>

// Animated AI shimmer glow
<Card className="glow-effect-ai-shimmer">
  Content
</Card>

// Card with AI glow on hover
<Card className="card-glow-ai">
  Content
</Card>
```

## Real-World Examples

### Studio Write Feature

```tsx
<div className="container-gradient-ai-shimmer p-6">
  <div className="flex items-center gap-3 mb-4">
    <div className="ai-icon-wrapper">
      <Sparkles className="w-5 h-5 text-blue-600" />
    </div>
    <h2 className="text-gradient-ai text-2xl font-bold">
      AI Content Generator
    </h2>
    <span className="badge-ai-shimmer">Powered by AI</span>
  </div>

  <Button className="shimmer-gradient button-glow-ai w-full">
    Generate Blog Post
  </Button>
</div>
```

### Research Agent Interface

```tsx
<Card className="gradient-border gradient-border-ai-shimmer container-ai-glow">
  <CardHeader>
    <div className="flex items-center gap-2">
      <div className="ai-icon-wrapper">
        <Brain className="w-5 h-5" />
      </div>
      <CardTitle className="text-gradient-ai">Research Agent</CardTitle>
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground mb-4">
      Ask any question about your market
    </p>
    <Button className="ai-gradient button-glow-ai">Start Research</Button>
  </CardContent>
</Card>
```

### AI Strategy Generation

```tsx
<div className="container-gradient-ai p-8">
  <h1 className="text-gradient-ai-shimmer text-4xl font-bold mb-4">
    Your AI Marketing Strategy
  </h1>

  <div className="space-y-4">
    {strategies.map((strategy, i) => (
      <Card key={i} className="card-glow-ai">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <span className="badge-ai">Step {i + 1}</span>
            <div>
              <h3 className="font-semibold mb-2">{strategy.title}</h3>
              <p className="text-muted-foreground">{strategy.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
</div>
```

### AI Processing State

```tsx
<div className="container-gradient-ai-shimmer p-6 text-center">
  <div className="ai-icon-wrapper mx-auto mb-4">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
  </div>
  <h3 className="text-gradient-ai-shimmer text-xl font-semibold mb-2">
    AI is analyzing your content...
  </h3>
  <p className="text-muted-foreground">This may take a few moments</p>
</div>
```

## Animation Performance

### Animated Classes

These classes include animations and should be used sparingly:

- `shimmer-gradient` - Animated gradient background
- `text-gradient-ai-shimmer` - Animated text gradient
- `container-gradient-ai-shimmer` - Animated container background
- `badge-ai-shimmer` - Animated badge
- `glow-effect-ai-shimmer` - Animated glow effect
- `gradient-border-ai-shimmer` - Animated border

### Performance Tips

1. Limit to 1-2 animated elements per view
2. Use static variants for list items
3. Disable animations on mobile if needed
4. Prefer hover animations over constant animations

## Accessibility

### Color Contrast

All AI-themed components maintain WCAG AA contrast ratios:

- Blue text on white: 4.5:1+
- White text on blue: 7:1+
- Gold accents are decorative only

### Motion Preferences

Animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .shimmer-gradient,
  .text-gradient-ai-shimmer,
  .container-gradient-ai-shimmer {
    animation: none !important;
  }
}
```

## Best Practices

### Do's ✅

- Use AI theme consistently across all AI features
- Combine with existing design system components
- Use badges to clearly indicate AI-powered features
- Apply glow effects to emphasize AI interactions
- Use shimmer effects during AI processing states

### Don'ts ❌

- Don't overuse animated effects (max 1-2 per view)
- Don't apply AI theme to non-AI features
- Don't stack multiple glow effects
- Don't use AI gradients for critical UI elements (errors, warnings)
- Don't animate text that users need to read

## Component Combinations

### Recommended Pairings

**High Impact (Hero Sections)**

```tsx
<div className="container-gradient-ai-shimmer">
  <h1 className="text-gradient-ai">Title</h1>
  <Button className="shimmer-gradient button-glow-ai">CTA</Button>
</div>
```

**Medium Impact (Feature Cards)**

```tsx
<Card className="gradient-border gradient-border-ai card-glow-ai">
  <div className="ai-icon-wrapper">Icon</div>
  <h3 className="text-gradient-ai">Title</h3>
  <Button className="ai-gradient">Action</Button>
</Card>
```

**Low Impact (Indicators)**

```tsx
<div className="flex items-center gap-2">
  <span className="badge-ai-outline">AI</span>
  <span className="text-gradient-ai-gold">Premium</span>
</div>
```

## Migration from Old Theme

If you're updating existing AI features:

1. Replace old gradient classes:

   - `bg-gradient-to-r from-blue-500 to-purple-500` → `ai-gradient`
   - `bg-gradient-to-br from-primary/5` → `container-gradient-ai`

2. Update button variants:

   - `variant="ai"` now uses blue-white-gold theme
   - `variant="shimmer"` now uses blue-white-gold theme

3. Add AI badges to features:

   ```tsx
   <span className="badge-ai">AI</span>
   ```

4. Apply glow effects:
   ```tsx
   className = "glow-effect-ai";
   ```

## Questions?

For design system questions, refer to:

- `/docs/design-system/gradients.md` - General gradient usage
- `/docs/design-system/typography.md` - Text styling
- `/docs/container-styling-guide.md` - Container patterns
