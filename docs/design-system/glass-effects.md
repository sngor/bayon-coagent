# Glass Effects Usage Guide

> Comprehensive guide to implementing glassmorphism effects in Co-agent Marketer

**Version:** 1.0  
**Last Updated:** November 2024

---

## Table of Contents

1. [Introduction](#introduction)
2. [Technical Implementation](#technical-implementation)
3. [Component Examples](#component-examples)
4. [Best Practices](#best-practices)
5. [Performance Considerations](#performance-considerations)
6. [Browser Support](#browser-support)

---

## Introduction

Glassmorphism creates a frosted glass effect using backdrop filters, translucent backgrounds, and subtle borders. This modern design technique adds depth and sophistication to the interface while maintaining readability.

### When to Use Glass Effects

✅ **Good Use Cases:**

- Navigation bars (fixed/sticky)
- Modal overlays and dialogs
- Cards on gradient backgrounds
- Floating action buttons
- Tooltips and popovers
- Hero section elements

❌ **Avoid Using For:**

- Main content areas
- Text-heavy sections
- Components on solid backgrounds
- Mobile-only interfaces (performance)
- Accessibility-critical elements

---

## Technical Implementation

### Basic Glass Effect

```css
.glass-basic {
  /* Translucent background */
  background: rgba(255, 255, 255, 0.7);

  /* Backdrop blur - the key to glass effect */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  /* Subtle border for definition */
  border: 1px solid rgba(255, 255, 255, 0.2);

  /* Soft shadow for depth */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  /* Rounded corners */
  border-radius: 16px;
}
```

### Dark Mode Adaptation

```css
.dark .glass-basic {
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### Blur Intensity Levels

```css
/* Subtle blur - for minimal effect */
.glass-sm {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* Medium blur - standard glass effect */
.glass-md {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Strong blur - heavy frosted glass */
.glass-lg {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Extra strong blur - maximum frosting */
.glass-xl {
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
}
```

### Tint Variations

```css
/* Light tint - for dark backgrounds */
.glass-light {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Dark tint - for light backgrounds */
.glass-dark {
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.2);
}

/* Primary color tint */
.glass-primary {
  background: hsl(var(--primary) / 0.1);
  border: 1px solid hsl(var(--primary) / 0.2);
}

/* Accent gradient tint */
.glass-accent {
  background: linear-gradient(
    135deg,
    hsl(var(--accent-start) / 0.1),
    hsl(var(--accent-end) / 0.1)
  );
  border: 1px solid hsl(var(--accent-start) / 0.2);
}
```

---

## Component Examples

### 1. Glass Navigation Bar

```tsx
// Fixed navigation with glass effect
export function GlassNavigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-white/20 dark:border-gray-800/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Logo />
          <NavigationMenu />
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
```

**Key Features:**

- Fixed positioning for persistent visibility
- High z-index to stay above content
- Backdrop blur for content visibility
- Border for subtle definition

### 2. Glass Card Component

```tsx
interface GlassCardProps {
  blur?: "sm" | "md" | "lg" | "xl";
  tint?: "light" | "dark" | "primary";
  border?: boolean;
  glow?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({
  blur = "md",
  tint = "light",
  border = true,
  glow = false,
  children,
  className,
}: GlassCardProps) {
  const blurClasses = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
    xl: "backdrop-blur-xl",
  };

  const tintClasses = {
    light: "bg-white/70 dark:bg-gray-900/70",
    dark: "bg-gray-900/70 dark:bg-white/70",
    primary: "bg-primary/10",
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-300",
        blurClasses[blur],
        tintClasses[tint],
        border && "border border-white/20 dark:border-gray-800/20",
        glow && "shadow-2xl shadow-primary/10 hover:shadow-primary/20",
        "hover:scale-[1.02] hover:-translate-y-1",
        className
      )}
    >
      {children}
    </div>
  );
}
```

**Usage:**

```tsx
// On gradient background
<div className="bg-gradient-to-br from-primary/20 to-accent-start/20 p-8">
  <GlassCard blur="lg" tint="light" glow>
    <h3 className="text-xl font-bold mb-2">Premium Feature</h3>
    <p className="text-muted-foreground">
      This card uses glass effect for modern look
    </p>
  </GlassCard>
</div>
```

### 3. Glass Modal Dialog

```tsx
export function GlassModal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content with glass effect */}
      <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-800/20 shadow-2xl max-w-lg w-full p-6 animate-scale-in">
        {children}
      </div>
    </div>
  );
}
```

**Key Features:**

- Blurred backdrop for focus
- Glass modal for modern feel
- Smooth entrance animation
- Click outside to close

### 4. Glass Button

```tsx
export function GlassButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-6 py-3 rounded-xl",
        "bg-white/70 dark:bg-gray-900/70",
        "backdrop-blur-md",
        "border border-white/20 dark:border-gray-800/20",
        "shadow-lg hover:shadow-xl",
        "transition-all duration-300",
        "hover:scale-105 hover:-translate-y-0.5",
        "active:scale-95",
        "font-medium",
        className
      )}
    >
      {children}
    </button>
  );
}
```

### 5. Glass Sidebar

```tsx
export function GlassSidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-white/20 dark:border-gray-800/20 p-6">
      <div className="space-y-6">
        <Logo />

        <nav className="space-y-2">
          <SidebarLink href="/dashboard" icon={<Home />}>
            Dashboard
          </SidebarLink>
          <SidebarLink href="/marketing-plan" icon={<FileText />}>
            Marketing Plan
          </SidebarLink>
          {/* More links */}
        </nav>
      </div>
    </aside>
  );
}
```

### 6. Glass Tooltip

```tsx
export function GlassTooltip({
  content,
  children,
}: {
  content: string;
  children: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900/90 dark:bg-white/90 backdrop-blur-lg rounded-lg border border-white/20 text-sm text-white dark:text-gray-900 whitespace-nowrap animate-fade-in">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900/90 dark:border-t-white/90" />
        </div>
      )}
    </div>
  );
}
```

### 7. Glass Hero Section

```tsx
export function GlassHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent-mid/20 to-accent-end/20" />

      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-20 right-20 w-96 h-96 bg-accent-start/30 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />

      {/* Glass content card */}
      <GlassCard
        blur="xl"
        tint="light"
        glow
        className="relative z-10 max-w-2xl text-center"
      >
        <h1 className="text-display-hero mb-6">Welcome to Co-agent Marketer</h1>
        <p className="text-xl text-muted-foreground mb-8">
          AI-powered marketing platform for real estate agents
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="premium" size="lg">
            Get Started
          </Button>
          <GlassButton>Learn More</GlassButton>
        </div>
      </GlassCard>
    </section>
  );
}
```

---

## Best Practices

### 1. Contrast & Readability

✅ **Do:**

```tsx
// Ensure sufficient contrast
<GlassCard blur="md" className="text-foreground">
  <p className="font-medium">Readable text</p>
</GlassCard>
```

❌ **Don't:**

```tsx
// Low contrast text on glass
<GlassCard blur="xl" className="text-gray-400">
  <p>Hard to read</p>
</GlassCard>
```

### 2. Background Complexity

✅ **Do:**

```tsx
// Glass on gradient or image
<div className="bg-gradient-to-br from-primary/20 to-accent/20">
  <GlassCard>Content</GlassCard>
</div>
```

❌ **Don't:**

```tsx
// Glass on solid color (no effect visible)
<div className="bg-white">
  <GlassCard>Content</GlassCard>
</div>
```

### 3. Blur Intensity

✅ **Do:**

```tsx
// Adjust blur based on content importance
<GlassCard blur="sm">
  {" "}
  {/* Less blur for readability */}
  <p>Important text content</p>
</GlassCard>
```

❌ **Don't:**

```tsx
// Too much blur for text-heavy content
<GlassCard blur="xl">
  <article>Long article text...</article>
</GlassCard>
```

### 4. Layering

✅ **Do:**

```tsx
// Proper z-index hierarchy
<div className="relative">
  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
  <GlassCard className="relative z-10">Content on top</GlassCard>
</div>
```

❌ **Don't:**

```tsx
// Stacking multiple glass layers
<GlassCard>
  <GlassCard>
    <GlassCard>Too many layers</GlassCard>
  </GlassCard>
</GlassCard>
```

### 5. Animation

✅ **Do:**

```tsx
// Smooth transitions
<GlassCard className="transition-all duration-300 hover:scale-105">
  Content
</GlassCard>
```

❌ **Don't:**

```tsx
// Jarring instant changes
<GlassCard className="hover:backdrop-blur-xl">Content</GlassCard>
```

---

## Performance Considerations

### 1. Backdrop Filter Performance

Backdrop filters are GPU-intensive. Optimize by:

```css
/* Use will-change for animated glass elements */
.glass-animated {
  will-change: backdrop-filter;
}

/* Remove will-change after animation */
.glass-animated:not(:hover) {
  will-change: auto;
}
```

### 2. Limit Glass Elements

```tsx
// ✅ Good: Few glass elements
<Page>
  <GlassNavigation />
  <Content />
  <GlassModal />
</Page>

// ❌ Bad: Too many glass elements
<Page>
  <GlassNavigation />
  <GlassCard>
    <GlassCard>
      <GlassCard>...</GlassCard>
    </GlassCard>
  </GlassCard>
</Page>
```

### 3. Mobile Optimization

```tsx
// Reduce blur on mobile for performance
export function ResponsiveGlassCard({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();

  return <GlassCard blur={isMobile ? "sm" : "lg"}>{children}</GlassCard>;
}
```

### 4. Conditional Rendering

```tsx
// Only render glass effect when needed
export function ConditionalGlass({
  useGlass,
  children,
}: {
  useGlass: boolean;
  children: React.ReactNode;
}) {
  if (!useGlass) {
    return <Card>{children}</Card>;
  }

  return <GlassCard>{children}</GlassCard>;
}
```

---

## Browser Support

### Backdrop Filter Support

| Browser | Version | Support                 |
| ------- | ------- | ----------------------- |
| Chrome  | 76+     | ✅ Full                 |
| Firefox | 103+    | ✅ Full                 |
| Safari  | 9+      | ✅ Full (with -webkit-) |
| Edge    | 79+     | ✅ Full                 |
| Opera   | 63+     | ✅ Full                 |

### Fallback Strategy

```css
/* Fallback for browsers without backdrop-filter support */
@supports not (backdrop-filter: blur(12px)) {
  .glass {
    background: rgba(255, 255, 255, 0.95);
    /* Increase opacity for better readability */
  }
}
```

### Feature Detection

```tsx
// Detect backdrop-filter support
const supportsBackdropFilter =
  CSS.supports("backdrop-filter", "blur(12px)") ||
  CSS.supports("-webkit-backdrop-filter", "blur(12px)");

export function AdaptiveGlassCard({ children }: { children: React.ReactNode }) {
  if (!supportsBackdropFilter) {
    // Fallback to solid card
    return <Card className="bg-white/95">{children}</Card>;
  }

  return <GlassCard>{children}</GlassCard>;
}
```

---

## Testing Checklist

### Visual Testing

- [ ] Glass effect visible on gradient backgrounds
- [ ] Sufficient contrast for text readability
- [ ] Border visible and subtle
- [ ] Shadow adds appropriate depth
- [ ] Hover effects smooth and responsive

### Performance Testing

- [ ] 60fps during animations
- [ ] No jank on scroll
- [ ] Acceptable performance on mobile
- [ ] GPU usage reasonable

### Accessibility Testing

- [ ] Text meets 4.5:1 contrast ratio
- [ ] Focus indicators visible
- [ ] Works with screen readers
- [ ] Keyboard navigation functional

### Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

---

## Examples Gallery

### Navigation Examples

```tsx
// Top navigation
<nav className="fixed top-0 w-full bg-white/70 backdrop-blur-xl border-b border-white/20">
  {/* Nav content */}
</nav>

// Side navigation
<aside className="fixed left-0 h-full bg-white/80 backdrop-blur-lg border-r border-white/20">
  {/* Sidebar content */}
</aside>

// Bottom navigation (mobile)
<nav className="fixed bottom-0 w-full bg-white/90 backdrop-blur-xl border-t border-white/20">
  {/* Mobile nav */}
</nav>
```

### Card Examples

```tsx
// Feature card
<GlassCard blur="lg" glow className="p-8">
  <Icon className="w-12 h-12 mb-4" />
  <h3 className="text-xl font-bold mb-2">Feature Title</h3>
  <p className="text-muted-foreground">Description</p>
</GlassCard>

// Stat card
<GlassCard blur="md" className="text-center">
  <div className="text-metric-large text-primary">1,234</div>
  <div className="text-sm text-muted-foreground">Total Views</div>
</GlassCard>

// Action card
<GlassCard blur="lg" className="hover:scale-105 cursor-pointer">
  <div className="flex items-center justify-between">
    <div>
      <h4 className="font-semibold">Quick Action</h4>
      <p className="text-sm text-muted-foreground">Description</p>
    </div>
    <ArrowRight className="w-5 h-5" />
  </div>
</GlassCard>
```

---

## Resources

- [Design System Documentation](./DESIGN_SYSTEM.md)
- [Animation Performance Guide](./ANIMATION_PERFORMANCE_GUIDE.md)
- [Component Library](./src/components/ui/)
- [Demo Pages](<./src/app/(app)/*-demo/>)

---

**Maintained by:** Design System Team  
**Version:** 1.0  
**Last Updated:** November 2024
# Glass Card Component - Integration Guide

## ✅ Implementation Complete

The glass morphism card component has been successfully implemented with professional, subtle effects appropriate for a real estate business platform.

## What Was Created

### 1. Core Component (`src/components/ui/glass-card.tsx`)

- Professional glass morphism card with backdrop blur
- Configurable blur levels (sm, md, lg, xl)
- Three tint options (light, dark, primary)
- Optional glow effects on hover
- Interactive mode with scale and lift animations
- Gradient border support
- Fully composable with sub-components

### 2. Sub-components

- `GlassCard` - Main container
- `GlassCardHeader` - Header section
- `GlassCardTitle` - Title text
- `GlassCardDescription` - Description text
- `GlassCardContent` - Main content area
- `GlassCardFooter` - Footer section

### 3. Documentation

- Comprehensive README with examples (`src/components/ui/glass-card-README.md`)
- Usage guidelines and best practices
- Accessibility considerations
- Design guidelines

### 4. Demo Page

- Live examples at `/glass-card-demo`
- Shows all blur levels, tints, and interactive options
- Dashboard stats example
- Feature highlight cards example

## Quick Start

```tsx
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
} from "@/components/ui/glass-card";

export function MyComponent() {
  return (
    <GlassCard blur="lg" glow interactive>
      <GlassCardHeader>
        <GlassCardTitle>Professional Card</GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent>
        <p>Your content here</p>
      </GlassCardContent>
    </GlassCard>
  );
}
```

## Where to Use

### Recommended Use Cases

1. **Dashboard Metric Cards** - Stats and KPIs with subtle depth
2. **Feature Highlights** - Showcase premium features
3. **Content Sections** - Separate content with visual hierarchy
4. **Modal Overlays** - Create depth with backdrop blur

### Design Principles

- ✅ Use sparingly as accents, not everywhere
- ✅ Ensure text contrast for readability
- ✅ Place over interesting backgrounds for best effect
- ✅ Use lower blur on mobile for performance
- ✅ Maintain professional appearance

## Integration Examples

### Dashboard Stats Card

```tsx
<GlassCard blur="lg" glow interactive>
  <GlassCardContent>
    <p className="text-sm text-muted-foreground">Total Revenue</p>
    <div className="text-3xl font-bold">$45,231</div>
    <p className="text-xs text-success">+20.1% from last month</p>
  </GlassCardContent>
</GlassCard>
```

### Feature Card

```tsx
<GlassCard blur="xl" tint="primary" gradientBorder glow>
  <GlassCardHeader>
    <GlassCardTitle>AI-Powered Insights</GlassCardTitle>
    <GlassCardDescription>Get intelligent recommendations</GlassCardDescription>
  </GlassCardHeader>
  <GlassCardContent>
    <ul className="space-y-2">
      <li>✓ Real-time analysis</li>
      <li>✓ Predictive analytics</li>
    </ul>
  </GlassCardContent>
</GlassCard>
```

## Props Reference

| Prop             | Type                             | Default   | Description              |
| ---------------- | -------------------------------- | --------- | ------------------------ |
| `blur`           | `"sm" \| "md" \| "lg" \| "xl"`   | `"md"`    | Backdrop blur intensity  |
| `tint`           | `"light" \| "dark" \| "primary"` | `"light"` | Background tint          |
| `border`         | `boolean`                        | `true`    | Show glass border        |
| `glow`           | `boolean`                        | `false`   | Hover glow effect        |
| `interactive`    | `boolean`                        | `false`   | Scale/lift on hover      |
| `gradientBorder` | `boolean`                        | `false`   | Animated gradient border |

## Testing

View the demo page to see all variations:

```bash
npm run dev
# Navigate to: http://localhost:3000/glass-card-demo
```

## Accessibility

- ✅ Maintains proper color contrast
- ✅ Supports keyboard navigation
- ✅ Works with screen readers
- ✅ Respects reduced motion preferences

## Browser Support

Backdrop blur is supported in all modern browsers. Gracefully degrades to solid backgrounds in older browsers.

## Next Steps

Consider using glass cards in:

1. Dashboard page for metric cards
2. Marketing plan page for action items
3. Content engine for content type selection
4. Profile page for section highlights

---

**Status**: ✅ Complete and ready for production use
**Demo**: Available at `/glass-card-demo`
**Documentation**: See `src/components/ui/glass-card-README.md`
