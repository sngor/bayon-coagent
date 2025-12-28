# Gradient Mesh Component

Beautiful, animated gradient mesh backgrounds that add depth and visual interest to your UI.

## Features

- 🎨 **Customizable Colors**: Use any HSL color for gradient orbs
- 🎭 **Multiple Blur Levels**: From subtle to dramatic blur effects
- ⚡ **Performance Optimized**: Uses CSS transforms for smooth 60fps animations
- 🎬 **Animated Orbs**: Floating orbs with configurable animation speeds
- 📱 **Responsive**: Works beautifully on all screen sizes
- ♿ **Accessible**: Properly marked with `aria-hidden` to not interfere with screen readers

## Components

### GradientMesh

The base component for creating custom gradient meshes.

```tsx
import { GradientMesh } from "@/components/ui/gradient-mesh";

<GradientMesh orbs={customOrbs} blur="xl" opacity={0.15} animate>
  <YourContent />
</GradientMesh>;
```

**Props:**

- `orbs`: Array of gradient orb configurations (optional, defaults to `defaultOrbs`)
- `blur`: Blur level - `'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'` (optional, default: `'xl'`)
- `opacity`: Overall opacity (optional)
- `animate`: Enable/disable animations (optional, default: `true`)
- `className`: Additional CSS classes (optional)
- `children`: Content to render on top of the gradient mesh

### SubtleGradientMesh

A subtle gradient mesh perfect for page backgrounds.

```tsx
import { SubtleGradientMesh } from "@/components/ui/gradient-mesh";

<SubtleGradientMesh>
  <YourPageContent />
</SubtleGradientMesh>;
```

**Features:**

- Very low opacity (0.05) for minimal distraction
- Large, heavily blurred orbs
- Slow animation for subtle movement

### HeroGradientMesh

A prominent gradient mesh for hero sections.

```tsx
import { HeroGradientMesh } from "@/components/ui/gradient-mesh";

<HeroGradientMesh>
  <YourHeroContent />
</HeroGradientMesh>;
```

**Features:**

- Higher opacity (0.1-0.2) for visual impact
- Multiple orbs for depth
- Medium animation speed

### CardGradientMesh

A subtle gradient mesh designed for card backgrounds.

```tsx
import { CardGradientMesh } from "@/components/ui/gradient-mesh";

<CardGradientMesh>
  <YourCardContent />
</CardGradientMesh>;
```

**Features:**

- Low opacity (0.06-0.08) for subtlety
- Smaller orbs sized for cards
- No animation (static)

## Gradient Orb Configuration

Each gradient orb is configured with the following properties:

```typescript
interface GradientOrb {
  id: string; // Unique identifier
  color: string; // HSL color (e.g., 'hsl(var(--primary))')
  size: number; // Size in pixels
  x: number; // X position (0-100%)
  y: number; // Y position (0-100%)
  blur: number; // Blur amount in pixels
  opacity: number; // Opacity (0-1)
  animationDuration?: number; // Animation duration in seconds
}
```

## Examples

### Hero Section

```tsx
<section className="relative min-h-[400px]">
  <HeroGradientMesh>
    <div className="text-center p-12">
      <h1 className="text-5xl font-bold">Welcome</h1>
      <p className="text-xl">Beautiful gradient backgrounds</p>
    </div>
  </HeroGradientMesh>
</section>
```

### Page Background

```tsx
<div className="min-h-screen">
  <SubtleGradientMesh>
    <YourPageLayout />
  </SubtleGradientMesh>
</div>
```

### Card with Gradient

```tsx
<div className="relative rounded-xl overflow-hidden border">
  <CardGradientMesh>
    <div className="p-8">
      <h3 className="text-2xl font-bold">Premium Feature</h3>
      <p>This card has a subtle gradient background</p>
    </div>
  </CardGradientMesh>
</div>
```

### Custom Gradient Mesh

```tsx
const customOrbs: GradientOrb[] = [
  {
    id: "custom-1",
    color: "hsl(280, 70%, 60%)",
    size: 400,
    x: 20,
    y: 20,
    blur: 70,
    opacity: 0.2,
    animationDuration: 15,
  },
  {
    id: "custom-2",
    color: "hsl(200, 70%, 60%)",
    size: 350,
    x: 80,
    y: 80,
    blur: 70,
    opacity: 0.15,
    animationDuration: 20,
  },
];

<GradientMesh orbs={customOrbs} blur="xl" animate>
  <YourContent />
</GradientMesh>;
```

## Utility Functions

The `gradient-mesh.ts` utility file provides several helper functions:

### createSubtleMesh()

Creates a subtle gradient mesh configuration for page backgrounds.

```typescript
import { createSubtleMesh } from "@/lib/gradient-mesh";

const orbs = createSubtleMesh();
```

### createHeroMesh()

Creates a prominent gradient mesh configuration for hero sections.

```typescript
import { createHeroMesh } from "@/lib/gradient-mesh";

const orbs = createHeroMesh();
```

### createCardMesh()

Creates a subtle gradient mesh configuration for card backgrounds.

```typescript
import { createCardMesh } from "@/lib/gradient-mesh";

const orbs = createCardMesh();
```

### getResponsiveOrbSize()

Calculates responsive orb sizes based on viewport.

```typescript
import { getResponsiveOrbSize } from "@/lib/gradient-mesh";

const size = getResponsiveOrbSize(500, "mobile"); // Returns 250
```

## Performance Considerations

The gradient mesh is optimized for performance:

1. **CSS Transforms**: Uses `transform` and `opacity` for GPU-accelerated animations
2. **Will-Change**: Applies `will-change: transform` for smooth animations
3. **Pointer Events**: Disables pointer events on gradient orbs
4. **Reduced Motion**: Respects user's reduced motion preferences

## Accessibility

- Gradient meshes are marked with `aria-hidden="true"` to hide them from screen readers
- Content is properly layered with `z-index` for correct stacking
- Animations respect `prefers-reduced-motion` media query

## Browser Support

Works in all modern browsers that support:

- CSS `backdrop-filter` (with fallbacks)
- CSS transforms
- CSS animations

## Tips

1. **Use Subtle Opacity**: Keep opacity low (0.05-0.15) for professional look
2. **Match Brand Colors**: Use your brand's primary and accent colors
3. **Layer Carefully**: Ensure content remains readable on top of gradient
4. **Test Performance**: Monitor frame rate on lower-end devices
5. **Combine with Glass Effects**: Pairs beautifully with glassmorphism

## Related Components

- `glass-card.tsx` - Glassmorphism card component
- `animated-chart.tsx` - Animated charts with gradients
- `metric-card.tsx` - Metric cards with gradient accents
