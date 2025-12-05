# Transition Components

Smooth, accessible transitions for pages and content with automatic reduced motion support.

## Components

### PageTransition

Provides smooth transitions between pages in Next.js applications.

```tsx
import { PageTransition } from "@/components/transitions";

// In layout.tsx
export default function Layout({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
```

**Props:**

| Prop        | Type                                              | Default  | Description            |
| ----------- | ------------------------------------------------- | -------- | ---------------------- |
| `children`  | `ReactNode`                                       | -        | Content to animate     |
| `className` | `string`                                          | -        | Additional CSS classes |
| `variant`   | `"fade" \| "slide-up" \| "slide-down" \| "scale"` | `"fade"` | Animation variant      |
| `duration`  | `"fast" \| "base" \| "slow"`                      | `"base"` | Animation duration     |

**Variants:**

```tsx
// Fade transition (default)
<PageTransition variant="fade">
  {children}
</PageTransition>

// Slide up transition
<PageTransition variant="slide-up">
  {children}
</PageTransition>

// Scale transition
<PageTransition variant="scale" duration="slow">
  {children}
</PageTransition>
```

**Convenience Wrappers:**

```tsx
import { FadeTransition, SlideUpTransition } from "@/components/transitions";

// Simple fade
<FadeTransition>
  {children}
</FadeTransition>

// Simple slide up
<SlideUpTransition>
  {children}
</SlideUpTransition>
```

### ContentTransition

Provides smooth transitions for content sections with support for scroll-triggered animations.

```tsx
import { ContentTransition } from "@/components/transitions";

// Simple fade in
<ContentTransition>
  <div>Content</div>
</ContentTransition>

// Slide up with delay
<ContentTransition variant="slide-up" delay={200}>
  <div>Content</div>
</ContentTransition>

// Animate when scrolled into view
<ContentTransition animateOnScroll>
  <div>Content</div>
</ContentTransition>
```

**Props:**

| Prop              | Type                                                                               | Default  | Description                               |
| ----------------- | ---------------------------------------------------------------------------------- | -------- | ----------------------------------------- |
| `children`        | `ReactNode`                                                                        | -        | Content to animate                        |
| `className`       | `string`                                                                           | -        | Additional CSS classes                    |
| `variant`         | `"fade" \| "slide-up" \| "slide-down" \| "slide-left" \| "slide-right" \| "scale"` | `"fade"` | Animation variant                         |
| `duration`        | `"fast" \| "base" \| "slow"`                                                       | `"base"` | Animation duration                        |
| `delay`           | `number`                                                                           | `0`      | Delay before animation starts (ms)        |
| `animateOnMount`  | `boolean`                                                                          | `true`   | Whether to animate on mount               |
| `animateOnScroll` | `boolean`                                                                          | `false`  | Whether to use scroll-triggered animation |
| `threshold`       | `number`                                                                           | `0.1`    | Intersection observer threshold (0-1)     |

**Examples:**

```tsx
// Fade in on mount
<ContentTransition>
  <Card>Content</Card>
</ContentTransition>

// Slide up with 300ms delay
<ContentTransition variant="slide-up" delay={300}>
  <Card>Content</Card>
</ContentTransition>

// Animate when 50% visible
<ContentTransition animateOnScroll threshold={0.5}>
  <Card>Content</Card>
</ContentTransition>

// Slide from left
<ContentTransition variant="slide-left" duration="slow">
  <Card>Content</Card>
</ContentTransition>
```

### StaggeredList

Animates list items with sequential delays.

```tsx
import { StaggeredList } from "@/components/transitions";

<StaggeredList>
  <div>Item 1 (50ms delay)</div>
  <div>Item 2 (100ms delay)</div>
  <div>Item 3 (150ms delay)</div>
  <div>Item 4 (200ms delay)</div>
</StaggeredList>;
```

**Props:**

| Prop           | Type        | Default | Description                  |
| -------------- | ----------- | ------- | ---------------------------- |
| `children`     | `ReactNode` | -       | List items to animate        |
| `className`    | `string`    | -       | Additional CSS classes       |
| `staggerDelay` | `number`    | `50`    | Delay between each item (ms) |

**Example:**

```tsx
<StaggeredList staggerDelay={100}>
  {items.map((item) => (
    <Card key={item.id}>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </Card>
  ))}
</StaggeredList>
```

### ScrollReveal

Reveals content when scrolled into view.

```tsx
import { ScrollReveal } from "@/components/transitions";

<ScrollReveal>
  <div>Content revealed on scroll</div>
</ScrollReveal>;
```

**Props:**

| Prop        | Type                                                                               | Default  | Description                           |
| ----------- | ---------------------------------------------------------------------------------- | -------- | ------------------------------------- |
| `children`  | `ReactNode`                                                                        | -        | Content to reveal                     |
| `className` | `string`                                                                           | -        | Additional CSS classes                |
| `variant`   | `"fade" \| "slide-up" \| "slide-down" \| "slide-left" \| "slide-right" \| "scale"` | `"fade"` | Animation variant                     |
| `threshold` | `number`                                                                           | `0.1`    | Intersection observer threshold (0-1) |

**Examples:**

```tsx
// Fade in when scrolled into view
<ScrollReveal>
  <Card>Content</Card>
</ScrollReveal>

// Slide up when 30% visible
<ScrollReveal variant="slide-up" threshold={0.3}>
  <Card>Content</Card>
</ScrollReveal>

// Scale in when fully visible
<ScrollReveal variant="scale" threshold={1.0}>
  <Card>Content</Card>
</ScrollReveal>
```

## Common Patterns

### Page Layout with Transitions

```tsx
// app/layout.tsx
import { PageTransition } from "@/components/transitions";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
```

### Section Reveals

```tsx
import { ScrollReveal } from "@/components/transitions";

export default function Page() {
  return (
    <div>
      <ScrollReveal>
        <section>
          <h2>Section 1</h2>
          <p>Content</p>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="slide-up">
        <section>
          <h2>Section 2</h2>
          <p>Content</p>
        </section>
      </ScrollReveal>

      <ScrollReveal variant="slide-left">
        <section>
          <h2>Section 3</h2>
          <p>Content</p>
        </section>
      </ScrollReveal>
    </div>
  );
}
```

### Staggered Card Grid

```tsx
import { StaggeredList } from "@/components/transitions";
import { Card } from "@/components/ui/card";

export default function CardGrid({ items }: { items: Item[] }) {
  return (
    <StaggeredList className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((item) => (
        <Card key={item.id}>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </Card>
      ))}
    </StaggeredList>
  );
}
```

### Modal with Transition

```tsx
import { ContentTransition } from "@/components/transitions";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function Modal({ open, onClose }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <ContentTransition variant="scale" duration="fast">
          <h2>Modal Title</h2>
          <p>Modal content</p>
        </ContentTransition>
      </DialogContent>
    </Dialog>
  );
}
```

### Sequential Content Loading

```tsx
import { ContentTransition } from "@/components/transitions";

export default function SequentialContent() {
  return (
    <div>
      <ContentTransition delay={0}>
        <h1>Title</h1>
      </ContentTransition>

      <ContentTransition delay={150}>
        <p>First paragraph</p>
      </ContentTransition>

      <ContentTransition delay={300}>
        <p>Second paragraph</p>
      </ContentTransition>

      <ContentTransition delay={450}>
        <Button>Call to Action</Button>
      </ContentTransition>
    </div>
  );
}
```

## Accessibility

All transition components automatically respect `prefers-reduced-motion`:

- Animations complete instantly for users who prefer reduced motion
- Content appears in its final state immediately
- No layout shifts or jarring changes
- Focus management is preserved

## Performance

- GPU-accelerated animations using `transform` and `opacity`
- Intersection Observer for efficient scroll-triggered animations
- Automatic cleanup of observers and timers
- Minimal JavaScript overhead

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## Related Documentation

- [Animation System](../../../docs/design-system/animation-system.md)
- [Reduced Motion Support](../../../docs/design-system/reduced-motion-support.md)
- [Animation Quick Reference](../../../docs/design-system/animation-quick-reference.md)
