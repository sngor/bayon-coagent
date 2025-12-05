# AI Theme Quick Reference - Blue Gradient

Quick reference for the new AI-themed design system with blue gradient effects.

## 🎨 Color Tokens (Tailwind)

Use these in your components:

```tsx
// Direct color usage
<div className="bg-ai-blue text-white">Blue background</div>
<div className="text-ai-gold">Gold text</div>
<div className="border-ai-blue-deep">Blue border</div>

// Available tokens:
// bg-ai-blue-light, bg-ai-blue, bg-ai-blue-deep
// bg-ai-gold-light, bg-ai-gold, bg-ai-gold-deep
// bg-ai-white, bg-ai-shimmer
```

## 🔘 Buttons

```tsx
// AI gradient button
<Button variant="ai">Generate Content</Button>

// Shimmer button (animated)
<Button variant="shimmer">AI Research</Button>

// With glow effect
<Button className="ai-gradient button-glow-ai">Create</Button>
```

## 📦 Containers

```tsx
// Subtle AI container
<div className="container-gradient-ai">Content</div>

// Animated shimmer (use sparingly!)
<div className="container-gradient-ai-shimmer">Processing...</div>

// With glow effect
<div className="container-ai-glow">Results</div>
```

## 📝 Text

```tsx
// AI gradient text
<h1 className="text-gradient-ai">AI-Powered</h1>

// Animated shimmer text
<h2 className="text-gradient-ai-shimmer">Generating...</h2>

// Gold gradient
<span className="text-gradient-ai-gold">Premium</span>
```

## 🎯 Badges

```tsx
// Solid badge
<span className="badge-ai">AI</span>

// Outline badge
<span className="badge-ai-outline">AI-Powered</span>

// Shimmer badge (animated)
<span className="badge-ai-shimmer">Processing</span>
```

## 🖼️ Borders

```tsx
// AI gradient border
<Card className="gradient-border gradient-border-ai">
  Content
</Card>

// Animated shimmer border
<Card className="gradient-border gradient-border-ai-shimmer">
  Content
</Card>
```

## ✨ Icons

```tsx
// Icon wrapper with hover effect
<div className="ai-icon-wrapper">
  <Sparkles className="w-5 h-5" />
</div>
```

## 💫 Glow Effects

```tsx
// AI glow
<Card className="glow-effect-ai">Content</Card>

// Animated shimmer glow
<Card className="glow-effect-ai-shimmer">Content</Card>

// Card with hover glow
<Card className="card-glow-ai">Content</Card>
```

## 🎭 Backgrounds

```tsx
// Gradient background
<div className="bg-ai-gradient text-white">Content</div>

// Animated shimmer background
<div className="bg-ai-shimmer">Content</div>

// Subtle background
<div className="bg-ai-subtle">Content</div>
```

## 📋 Common Patterns

### AI Feature Header

```tsx
<div className="container-gradient-ai p-6">
  <div className="flex items-center gap-3">
    <div className="ai-icon-wrapper">
      <Sparkles className="w-5 h-5" />
    </div>
    <h2 className="text-gradient-ai text-2xl font-bold">AI Feature Name</h2>
    <span className="badge-ai">AI</span>
  </div>
</div>
```

### AI Action Button

```tsx
<Button variant="shimmer" className="button-glow-ai">
  <Sparkles className="w-4 h-4" />
  Generate with AI
</Button>
```

### AI Processing State

```tsx
<div className="container-gradient-ai-shimmer p-6 text-center">
  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-ai-blue" />
  <h3 className="text-gradient-ai-shimmer text-xl font-semibold">
    AI is working...
  </h3>
</div>
```

### AI Feature Card

```tsx
<Card className="gradient-border gradient-border-ai card-glow-ai">
  <CardHeader>
    <div className="flex items-center gap-2">
      <div className="ai-icon-wrapper">
        <Brain className="w-5 h-5" />
      </div>
      <CardTitle className="text-gradient-ai">Feature Title</CardTitle>
    </div>
  </CardHeader>
  <CardContent>
    <p className="mb-4">Description</p>
    <Button variant="ai">Try Now</Button>
  </CardContent>
</Card>
```

## ⚠️ Usage Rules

### ✅ DO

- Use AI theme for AI-powered features only
- Limit animated effects to 1-2 per view
- Use badges to indicate AI features
- Apply glow effects to emphasize AI interactions
- Use shimmer effects during processing

### ❌ DON'T

- Don't use on non-AI features
- Don't stack multiple animated effects
- Don't use for critical UI (errors, warnings)
- Don't animate text users need to read
- Don't overuse glow effects

## 🎯 Feature Mapping

Apply AI theme to these features:

**Studio Hub**

- ✅ Write (AI content generation)
- ✅ Describe (AI listing descriptions)
- ✅ Reimagine (AI image editing)

**Brand Hub**

- ✅ Strategy (AI marketing plans)
- ✅ Competitors (AI competitor analysis)

**Research Hub**

- ✅ Research Agent (AI research)
- ✅ Reports (AI-generated reports)

**Market Hub**

- ✅ Opportunities (AI predictions)
- ✅ Analytics (AI analysis)

**Tools Hub**

- ✅ Valuation (AI property valuation)

**Assistant**

- ✅ Chat interface (AI assistant)

## 📚 Full Documentation

For complete details, see:

- `/docs/design-system/ai-theme-guide.md` - Complete guide with examples
- `/docs/design-system/gradients.md` - General gradient usage
- `/src/app/globals.css` - All CSS classes and animations

## 🎨 Color Values

**Light Mode:**

- Blue Light: `hsl(210 100% 95%)`
- Blue: `hsl(215 85% 60%)`
- Blue Deep: `hsl(220 75% 45%)`
- Gold Light: `hsl(45 100% 85%)`
- Gold: `hsl(45 95% 60%)`
- Gold Deep: `hsl(42 90% 50%)`
- White: `hsl(0 0% 100%)`
- Shimmer: `hsl(210 100% 98%)`

**Dark Mode:**
Colors automatically adjust with increased brightness and saturation.
