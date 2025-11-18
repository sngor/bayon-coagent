# Animation Performance Optimization Guide

## Overview

This guide provides best practices for optimizing animation performance in the UI/UX enhancement to ensure smooth 60fps animations across all devices.

## Current Performance Issues

Based on CSS diagnostics, we have identified 136 performance hints:

- Many animations trigger "Composite" layer (opacity, transform)
- Some animations trigger "Paint" (background-position, box-shadow)
- Multiple simultaneous animations can cause jank
- Gradient animations use expensive background-position

## Performance Optimization Strategies

### 1. Use Will-Change Hints

The `will-change` CSS property tells the browser which properties will animate, allowing it to optimize ahead of time.

#### When to Use Will-Change

**✅ Good Use Cases:**

- Elements that animate frequently
- Elements with complex animations
- Elements that animate on user interaction
- Critical animations (page transitions, hero animations)

**❌ Avoid:**

- Static elements
- Elements that animate rarely
- Too many elements (causes memory issues)
- Leaving will-change on permanently

#### Implementation

```css
/* Add will-change before animation starts */
.animated-element {
  will-change: transform, opacity;
}

/* Remove will-change after animation completes */
.animated-element.animation-complete {
  will-change: auto;
}
```

#### Recommended Will-Change Additions

Add to `src/app/globals.css`:

```css
@layer components {
  /* Page transitions */
  .animate-page-transition {
    will-change: transform, opacity;
  }

  /* Card animations */
  .card-hover-lift,
  .card-hover-scale {
    will-change: transform;
  }

  /* Button animations */
  .button-interactive {
    will-change: transform, box-shadow;
  }

  /* Gradient mesh animations */
  .animate-float-slow,
  .animate-float-medium,
  .animate-float-fast {
    will-change: transform;
  }

  /* Modal animations */
  [data-state="open"] {
    will-change: transform, opacity;
  }

  /* Remove will-change after animation */
  .animation-complete {
    will-change: auto;
  }
}
```

### 2. Optimize Animation Properties

#### GPU-Accelerated Properties (Fast)

Use these properties for smooth animations:

- ✅ `transform` (translate, scale, rotate)
- ✅ `opacity`
- ✅ `filter` (with caution)

#### CPU-Bound Properties (Slow)

Avoid animating these properties:

- ❌ `background-position` (triggers Paint)
- ❌ `box-shadow` (triggers Paint)
- ❌ `width/height` (triggers Layout)
- ❌ `top/left/right/bottom` (triggers Layout)
- ❌ `margin/padding` (triggers Layout)

#### Refactoring Examples

**❌ Bad: Animating background-position**

```css
@keyframes gradient-animation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
```

**✅ Good: Use transform instead**

```css
@keyframes gradient-animation {
  0% {
    transform: translateX(0%);
  }
  50% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(0%);
  }
}
```

**❌ Bad: Animating box-shadow**

```css
@keyframes glow {
  0% {
    box-shadow: 0 0 5px hsl(var(--primary) / 0.5);
  }
  50% {
    box-shadow: 0 0 20px hsl(var(--primary) / 0.8);
  }
  100% {
    box-shadow: 0 0 5px hsl(var(--primary) / 0.5);
  }
}
```

**✅ Good: Use opacity on pseudo-element**

```css
.glow-effect::after {
  content: "";
  position: absolute;
  inset: 0;
  box-shadow: 0 0 20px hsl(var(--primary) / 0.8);
  opacity: 0;
  transition: opacity 0.3s;
}

.glow-effect:hover::after {
  opacity: 1;
}
```

### 3. Limit Simultaneous Animations

#### Animation Budget

**Per Page:**

- Max 3 constant animations (gradient mesh, shimmer, etc.)
- Max 5 transition animations (page load, card entrance)
- Unlimited hover/interaction animations (they're triggered)

#### Implementation Strategy

```tsx
// Track active animations
const [activeAnimations, setActiveAnimations] = useState(0);

// Only start animation if under budget
const startAnimation = () => {
  if (activeAnimations < 3) {
    setActiveAnimations((prev) => prev + 1);
    // Start animation
  }
};

// Clean up when animation completes
const endAnimation = () => {
  setActiveAnimations((prev) => prev - 1);
};
```

### 4. Use CSS Containment

CSS containment tells the browser that an element's contents are independent, allowing better optimization.

```css
@layer components {
  /* Contain layout and paint for cards */
  .card {
    contain: layout paint;
  }

  /* Contain layout, paint, and style for isolated components */
  .modal-content {
    contain: layout paint style;
  }

  /* Strict containment for completely isolated components */
  .isolated-component {
    contain: strict;
  }
}
```

### 5. Optimize Gradient Animations

#### Current Issue

Gradient animations use `background-position` which triggers Paint:

```css
@keyframes gradient-animation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
```

#### Solution 1: Use Transform on Pseudo-Element

```css
.ai-gradient {
  position: relative;
  overflow: hidden;
}

.ai-gradient::before {
  content: "";
  position: absolute;
  inset: -100%;
  background: linear-gradient(
    -45deg,
    hsl(var(--primary)),
    hsl(var(--primary) / 0.7)
  );
  animation: gradient-slide 8s ease infinite;
}

@keyframes gradient-slide {
  0% {
    transform: translateX(-25%);
  }
  50% {
    transform: translateX(25%);
  }
  100% {
    transform: translateX(-25%);
  }
}
```

#### Solution 2: Use Opacity Transitions

```css
.gradient-effect {
  position: relative;
}

.gradient-effect::before,
.gradient-effect::after {
  content: "";
  position: absolute;
  inset: 0;
  transition: opacity 2s ease-in-out;
}

.gradient-effect::before {
  background: linear-gradient(0deg, hsl(var(--primary)), transparent);
  opacity: 1;
  animation: fade-alternate 4s ease-in-out infinite;
}

.gradient-effect::after {
  background: linear-gradient(180deg, hsl(var(--primary)), transparent);
  opacity: 0;
  animation: fade-alternate 4s ease-in-out infinite reverse;
}

@keyframes fade-alternate {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
```

### 6. Lazy Load Heavy Animations

#### Intersection Observer for Animations

```tsx
import { useEffect, useRef, useState } from "react";

export function useInViewAnimation() {
  const ref = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          // Optionally unobserve after first view
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
}

// Usage
function AnimatedCard() {
  const { ref, isInView } = useInViewAnimation();

  return (
    <div ref={ref} className={isInView ? "animate-fade-in-up" : "opacity-0"}>
      {/* Content */}
    </div>
  );
}
```

#### Lazy Load Gradient Mesh

```tsx
import { lazy, Suspense } from "react";

const GradientMesh = lazy(() => import("./GradientMesh"));

function HeroSection() {
  return (
    <section>
      <Suspense fallback={null}>
        <GradientMesh />
      </Suspense>
      {/* Content */}
    </section>
  );
}
```

### 7. Implement Performance Monitoring

#### Frame Rate Monitor

```tsx
import { useEffect, useState } from "react";

export function useFrameRate() {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return fps;
}

// Usage
function PerformanceMonitor() {
  const fps = useFrameRate();

  if (process.env.NODE_ENV === "development") {
    return (
      <div className="fixed bottom-4 right-4 bg-black/80 text-white px-3 py-2 rounded text-sm">
        FPS: {fps}
        {fps < 50 && <span className="text-red-500 ml-2">⚠️ Low</span>}
      </div>
    );
  }

  return null;
}
```

#### Animation Performance Tracker

```tsx
export function trackAnimationPerformance(animationName: string) {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;

    if (duration > 16.67) {
      // More than one frame at 60fps
      console.warn(
        `Animation "${animationName}" took ${duration.toFixed(2)}ms (> 16.67ms)`
      );
    }

    // Send to analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "animation_performance", {
        animation_name: animationName,
        duration: duration,
        is_slow: duration > 16.67,
      });
    }
  };
}

// Usage
function AnimatedComponent() {
  const handleAnimationStart = () => {
    const endTracking = trackAnimationPerformance("card-entrance");

    // Animation logic

    setTimeout(endTracking, 300); // After animation completes
  };
}
```

### 8. Optimize for Mobile

#### Reduce Animation Complexity on Mobile

```tsx
import { useIsMobile } from "@/hooks/use-mobile";

function AnimatedSection() {
  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? "animate-fade-in" : "animate-fade-in-up"}>
      {/* Simpler animation on mobile */}
    </div>
  );
}
```

#### Disable Heavy Effects on Low-End Devices

```tsx
export function useDeviceCapability() {
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    // Check device memory (if available)
    const memory = (navigator as any).deviceMemory;
    const isLowMemory = memory && memory < 4;

    // Check hardware concurrency
    const cores = navigator.hardwareConcurrency;
    const isLowCore = cores && cores < 4;

    setIsLowEnd(isLowMemory || isLowCore);
  }, []);

  return { isLowEnd };
}

// Usage
function GradientMeshBackground() {
  const { isLowEnd } = useDeviceCapability();

  if (isLowEnd) {
    return <StaticGradientBackground />;
  }

  return <AnimatedGradientMesh />;
}
```

### 9. Batch DOM Updates

#### Use React Transitions

```tsx
import { useTransition } from "react";

function AnimatedList({ items }) {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (newItems) => {
    startTransition(() => {
      setItems(newItems);
    });
  };

  return (
    <div className={isPending ? "opacity-50" : ""}>
      {items.map((item) => (
        <AnimatedCard key={item.id} {...item} />
      ))}
    </div>
  );
}
```

### 10. Optimize Backdrop Blur

Backdrop blur is expensive, especially on mobile. Use sparingly.

#### Reduce Blur Radius on Mobile

```css
@media (max-width: 768px) {
  .glass-effect-lg {
    -webkit-backdrop-filter: blur(8px); /* Reduced from 16px */
    backdrop-filter: blur(8px);
  }

  .glass-effect-xl {
    -webkit-backdrop-filter: blur(12px); /* Reduced from 24px */
    backdrop-filter: blur(12px);
  }
}
```

#### Provide Fallback for Unsupported Browsers

```css
.glass-effect {
  background: hsl(var(--glass-bg));
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
}

/* Fallback for browsers without backdrop-filter support */
@supports not (backdrop-filter: blur(12px)) {
  .glass-effect {
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
  }
}
```

## Implementation Checklist

### Phase 1: Critical Fixes (1-2 days)

- [ ] Add will-change hints to frequently animated elements
- [ ] Fix backdrop-filter ordering for Safari
- [ ] Add CSS containment to cards and modals
- [ ] Optimize gradient animations to use transform

### Phase 2: Performance Monitoring (1 day)

- [ ] Implement frame rate monitor (dev mode only)
- [ ] Add animation performance tracking
- [ ] Set up performance budgets
- [ ] Add analytics for slow animations

### Phase 3: Mobile Optimization (2-3 days)

- [ ] Reduce animation complexity on mobile
- [ ] Reduce blur radius on mobile
- [ ] Detect low-end devices
- [ ] Disable heavy effects on low-end devices

### Phase 4: Advanced Optimization (1 week)

- [ ] Implement lazy loading for gradient mesh
- [ ] Use Intersection Observer for animations
- [ ] Batch DOM updates with React transitions
- [ ] Optimize gradient animations with pseudo-elements

## Performance Targets

### Frame Rate

- **Target:** 60fps (16.67ms per frame)
- **Acceptable:** 50fps (20ms per frame)
- **Poor:** < 50fps

### Animation Duration

- **Fast:** < 200ms (button press, scale)
- **Base:** 200-300ms (fade, slide)
- **Slow:** 300-500ms (complex transitions)
- **Ambient:** 2-8s (gradient animations)

### Paint Time

- **Target:** < 10ms
- **Acceptable:** < 16ms
- **Poor:** > 16ms

### Composite Time

- **Target:** < 5ms
- **Acceptable:** < 10ms
- **Poor:** > 10ms

## Testing Checklist

Before deploying performance optimizations:

- [ ] Test on Chrome DevTools Performance tab
- [ ] Check frame rate during animations
- [ ] Verify paint time < 16ms
- [ ] Verify composite time < 10ms
- [ ] Test on iPhone 12/13 (mid-range mobile)
- [ ] Test on Android mid-range device
- [ ] Test on iPad (tablet)
- [ ] Test with CPU throttling (4x slowdown)
- [ ] Test with network throttling (Slow 3G)
- [ ] Verify reduced motion works
- [ ] Check memory usage (< 100MB increase)
- [ ] Verify no layout thrashing

## Monitoring in Production

### Key Metrics to Track

1. **Frame Rate**

   - Average FPS during animations
   - Percentage of time below 50fps
   - Devices with poor performance

2. **Animation Duration**

   - Actual vs. expected duration
   - Animations taking > 16ms
   - Slow animations by device type

3. **User Experience**
   - Bounce rate on animated pages
   - Time to interactive
   - User feedback on performance

### Analytics Implementation

```tsx
// Track animation performance
export function trackAnimation(name: string, duration: number, fps: number) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "animation_metrics", {
      animation_name: name,
      duration_ms: duration,
      average_fps: fps,
      is_smooth: fps >= 50,
      device_type: isMobile() ? "mobile" : "desktop",
    });
  }
}
```

## Summary

**Key Takeaways:**

1. Use `will-change` for frequently animated elements
2. Only animate `transform` and `opacity` for best performance
3. Limit simultaneous animations to 3-5 per page
4. Use CSS containment for isolated components
5. Lazy load heavy animations
6. Monitor performance in development and production
7. Optimize for mobile devices
8. Provide fallbacks for low-end devices

**Performance Budget:**

- Max 3 constant animations per page
- Max 5 transition animations on load
- Target 60fps for all animations
- Paint time < 16ms
- Composite time < 10ms

**Quick Wins:**

1. Add will-change hints (30 minutes)
2. Fix backdrop-filter ordering (5 minutes)
3. Add CSS containment (15 minutes)
4. Implement frame rate monitor (1 hour)
5. Reduce blur on mobile (15 minutes)

**Total Time for Quick Wins:** 2-3 hours
**Expected Performance Improvement:** 20-30% smoother animations
# Animation Performance Optimization Guide

This document outlines the animation performance optimizations implemented in the application to ensure smooth 60fps animations across all devices.

## Overview

All animations in the application are optimized for GPU acceleration and 60fps performance. We use strategic `will-change` hints, CSS transforms, and opacity for maximum performance.

## Key Optimizations

### 1. GPU Acceleration

All animated elements use GPU-accelerated properties:

```css
/* GPU-accelerated properties */
transform: translateZ(0);
backface-visibility: hidden;
```

**Why it works:**

- Forces browser to create a new compositing layer
- Animations run on GPU instead of CPU
- Prevents repaints and reflows

### 2. Strategic will-change Hints

We apply `will-change` hints strategically to optimize performance:

```css
/* Apply on hover/interaction */
.card-interactive:hover {
  will-change: transform, box-shadow;
}

/* Apply during animation */
.animate-fade-in {
  will-change: opacity, transform;
}
```

**Best Practices:**

- Only use on elements that will actually animate
- Remove after animation completes
- Don't overuse (max 3-4 properties)
- Apply just before animation starts

### 3. Optimized Animation Properties

We only animate GPU-accelerated properties:

**✅ Use These (GPU Accelerated):**

- `transform` (translate, scale, rotate)
- `opacity`
- `filter` (with caution)

**❌ Avoid These (Cause Reflow/Repaint):**

- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `border-width`

### 4. Reduced Motion Support

All animations respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Performance Monitoring

### Development Tools

#### 1. Performance Monitor Component

Press `Ctrl+Shift+P` to toggle the performance monitor:

```tsx
import { PerformanceMonitorDev } from "@/components/performance-monitor-dev";

// Add to your layout
<PerformanceMonitorDev />;
```

Shows:

- Real-time FPS
- Memory usage
- Paint timing
- Janky animation detection

#### 2. Animation Performance Hooks

```tsx
import { useAnimationPerformance } from "@/hooks/use-animation-performance";

function MyComponent() {
  const { metrics, isGood, start, stop } = useAnimationPerformance();

  useEffect(() => {
    start();
    return () => {
      const finalMetrics = stop();
      console.log("Animation metrics:", finalMetrics);
    };
  }, []);
}
```

#### 3. FPS Monitoring

```tsx
import { useFPS, useJankyDetection } from "@/hooks/use-animation-performance";

function MyComponent() {
  const fps = useFPS();
  const isJanky = useJankyDetection();

  if (isJanky) {
    console.warn("Animations are janky!");
  }
}
```

### Chrome DevTools Profiling

#### 1. Performance Tab

1. Open Chrome DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Interact with animations
5. Stop recording
6. Look for:
   - Frame rate (should be 60fps)
   - Long tasks (should be < 16.67ms)
   - Layout/Paint operations (should be minimal)

#### 2. Rendering Tab

1. Open Chrome DevTools
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
3. Type "Show Rendering"
4. Enable:
   - **FPS Meter**: Shows real-time FPS
   - **Paint Flashing**: Highlights repainted areas
   - **Layer Borders**: Shows compositing layers

#### 3. Performance Monitor

1. Open Chrome DevTools
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
3. Type "Show Performance Monitor"
4. Monitor:
   - CPU usage
   - JS heap size
   - DOM nodes
   - Layouts/sec
   - Style recalcs/sec

## Optimization Utilities

### 1. Optimized Animation Hook

```tsx
import { useOptimizedAnimation } from "@/hooks/use-animation-performance";

function MyComponent() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useOptimizedAnimation("animate-fade-in", isVisible, 300);

  return <div ref={ref}>Content</div>;
}
```

**Features:**

- Automatic will-change hints
- Cleanup after animation
- Reduced motion support

### 2. Will-Change Hook

```tsx
import { useWillChange } from "@/hooks/use-animation-performance";

function MyComponent() {
  const [isAnimating, setIsAnimating] = useState(false);
  const ref = useWillChange(["transform", "opacity"], isAnimating, 300);

  return <div ref={ref}>Content</div>;
}
```

### 3. GPU Acceleration Hook

```tsx
import { useGPUAcceleration } from "@/hooks/use-animation-performance";

function MyComponent() {
  const ref = useGPUAcceleration();

  return <div ref={ref}>Content</div>;
}
```

## Animation Classes

### GPU-Accelerated Classes

All animation classes include GPU acceleration:

```css
/* Fade animations */
.animate-fade-in
.animate-fade-out
.animate-fade-in-up

/* Scale animations */
.animate-scale-in
.animate-bounce-in

/* Slide animations */
.animate-slide-in-right
.animate-slide-in-left
.animate-slide-down

/* Special effects */
.animate-confetti
.animate-ripple
.animate-glow;
```

### Interactive Classes

```css
/* Cards */
.card-interactive
.card-hover-lift
.card-hover-scale
.card-hover-glow

/* Buttons */
.button-interactive
.button-ripple;
```

## Performance Targets

### Target Metrics

- **FPS**: 60fps (minimum 55fps acceptable)
- **Frame Time**: < 16.67ms per frame
- **Paint Time**: < 10ms
- **Layout Time**: < 5ms

### Performance Thresholds

```typescript
const PERFORMANCE_THRESHOLDS = {
  TARGET_FPS: 60,
  FRAME_TIME_MS: 16.67,
  WARNING_THRESHOLD_MS: 20,
  CRITICAL_THRESHOLD_MS: 33,
};
```

## Common Performance Issues

### Issue 1: Janky Animations

**Symptoms:**

- FPS drops below 55
- Stuttering during animations
- Delayed responses

**Solutions:**

1. Check for layout thrashing
2. Reduce number of animated elements
3. Use `will-change` hints
4. Simplify animations

### Issue 2: Memory Leaks

**Symptoms:**

- Memory usage increases over time
- Animations slow down after extended use

**Solutions:**

1. Clean up animation listeners
2. Remove will-change after animation
3. Cancel animation frames on unmount

### Issue 3: Paint Storms

**Symptoms:**

- Excessive paint operations
- Entire screen repaints

**Solutions:**

1. Use transform instead of position
2. Isolate animated elements
3. Use compositing layers

## Best Practices

### 1. Animation Duration

```typescript
const duration = {
  fast: 150, // Quick feedback
  base: 250, // Standard animations
  slow: 350, // Emphasis animations
  bounce: 500, // Playful animations
};
```

### 2. Easing Functions

```typescript
const easing = {
  easeOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
};
```

### 3. Staggered Animations

```tsx
{
  items.map((item, index) => (
    <div
      key={item.id}
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {item.content}
    </div>
  ));
}
```

### 4. Conditional Animations

```tsx
const prefersReduced = useReducedMotion();
const duration = prefersReduced ? 0 : 300;

<div
  className={prefersReduced ? "" : "animate-fade-in"}
  style={{ transitionDuration: `${duration}ms` }}
>
  Content
</div>;
```

## Testing Checklist

- [ ] All animations run at 60fps
- [ ] No layout thrashing
- [ ] No excessive paint operations
- [ ] Memory usage is stable
- [ ] Reduced motion is respected
- [ ] Animations work on mobile devices
- [ ] No janky scrolling
- [ ] GPU acceleration is active

## Resources

### Chrome DevTools

- [Performance Analysis](https://developer.chrome.com/docs/devtools/performance/)
- [Rendering Performance](https://developer.chrome.com/docs/devtools/rendering/)
- [Layer Visualization](https://developer.chrome.com/docs/devtools/css/layers/)

### Web Performance

- [CSS Triggers](https://csstriggers.com/)
- [will-change MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- [Compositing and Layers](https://web.dev/animations-guide/)

### Best Practices

- [High Performance Animations](https://web.dev/animations/)
- [Rendering Performance](https://web.dev/rendering-performance/)
- [Stick to Compositor-Only Properties](https://web.dev/stick-to-compositor-only-properties-and-manage-layer-count/)

## Troubleshooting

### Debug Slow Animations

1. Open Performance Monitor (`Ctrl+Shift+P`)
2. Check FPS (should be 60)
3. If low:
   - Check Chrome DevTools Performance tab
   - Look for long tasks
   - Identify layout/paint operations
   - Optimize or simplify animation

### Debug Memory Leaks

1. Open Chrome DevTools Memory tab
2. Take heap snapshot
3. Interact with animations
4. Take another snapshot
5. Compare snapshots
6. Look for detached DOM nodes

### Debug Paint Issues

1. Enable Paint Flashing in Rendering tab
2. Interact with animations
3. Green flashes indicate repaints
4. Minimize repainted areas
5. Use compositing layers

## Conclusion

By following these optimization techniques and using the provided tools, all animations in the application maintain smooth 60fps performance across devices. Regular monitoring and profiling ensure continued performance as the application evolves.
# Animation Performance Quick Reference

## Quick Commands

### Toggle Performance Monitor

```
Ctrl+Shift+P (or Cmd+Shift+P on Mac)
```

### Chrome DevTools

```
F12 - Open DevTools
Ctrl+Shift+P - Command Palette
```

## Performance Targets

| Metric     | Target    | Warning | Critical |
| ---------- | --------- | ------- | -------- |
| FPS        | 60        | < 55    | < 30     |
| Frame Time | < 16.67ms | > 20ms  | > 33ms   |
| Paint Time | < 10ms    | > 15ms  | > 25ms   |

## GPU-Accelerated Properties

### ✅ Use These

- `transform` (translate, scale, rotate)
- `opacity`
- `filter` (with caution)

### ❌ Avoid These

- `width`, `height`
- `top`, `left`, `right`, `bottom`
- `margin`, `padding`
- `border-width`

## Quick Hooks

### Monitor Performance

```tsx
import { useAnimationPerformance } from "@/hooks/use-animation-performance";

const { metrics, isGood, start, stop } = useAnimationPerformance();
```

### Check FPS

```tsx
import { useFPS } from "@/hooks/use-animation-performance";

const fps = useFPS();
```

### Detect Janky Animations

```tsx
import { useJankyDetection } from "@/hooks/use-animation-performance";

const isJanky = useJankyDetection();
```

### Optimized Animation

```tsx
import { useOptimizedAnimation } from "@/hooks/use-animation-performance";

const ref = useOptimizedAnimation("animate-fade-in", isVisible, 300);
```

### GPU Acceleration

```tsx
import { useGPUAcceleration } from "@/hooks/use-animation-performance";

const ref = useGPUAcceleration();
```

### Reduced Motion

```tsx
import { useReducedMotion } from "@/hooks/use-animation-performance";

const prefersReduced = useReducedMotion();
```

## Animation Classes

### Fade

```css
.animate-fade-in .animate-fade-out .animate-fade-in-up;
```

### Scale

```css
.animate-scale-in .animate-bounce-in;
```

### Slide

```css
.animate-slide-in-right .animate-slide-in-left .animate-slide-down;
```

### Interactive

```css
.card-interactive .card-hover-lift .card-hover-scale .button-interactive;
```

## will-change Best Practices

### ✅ Do

```css
/* Apply on hover */
.element:hover {
  will-change: transform;
}

/* Apply during animation */
.animate-fade-in {
  will-change: opacity, transform;
}
```

### ❌ Don't

```css
/* Don't apply globally */
* {
  will-change: transform; /* BAD */
}

/* Don't use too many properties */
.element {
  will-change: transform, opacity, width, height, margin; /* BAD */
}
```

## Debugging Steps

### 1. Check FPS

1. Press `Ctrl+Shift+P` to show performance monitor
2. Look at FPS value
3. Should be 60 (55+ acceptable)

### 2. Profile in Chrome

1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Interact with animation
5. Stop recording
6. Look for long tasks (> 16.67ms)

### 3. Check Paint Operations

1. Open DevTools
2. Press `Ctrl+Shift+P`
3. Type "Show Rendering"
4. Enable "Paint Flashing"
5. Green flashes = repaints (minimize these)

### 4. Check Layers

1. Open DevTools
2. Press `Ctrl+Shift+P`
3. Type "Show Rendering"
4. Enable "Layer Borders"
5. Orange borders = compositing layers

## Common Fixes

### Janky Animation

```tsx
// Before
<div style={{ width: isOpen ? "300px" : "0" }}>

// After (use transform)
<div style={{ transform: isOpen ? "scaleX(1)" : "scaleX(0)" }}>
```

### Slow Hover Effect

```css
/* Before */
.card {
  transition: all 0.3s;
}

/* After (specify properties) */
.card {
  transition: transform 0.3s, opacity 0.3s;
  transform: translateZ(0); /* GPU acceleration */
}

.card:hover {
  will-change: transform, opacity;
}
```

### Memory Leak

```tsx
// Before
useEffect(() => {
  element.style.willChange = "transform";
}, []);

// After (cleanup)
useEffect(() => {
  element.style.willChange = "transform";
  return () => {
    element.style.willChange = "auto";
  };
}, []);
```

## Performance Utilities

### Debounce

```tsx
import { debounce } from "@/lib/animation-performance";

const handleScroll = debounce(() => {
  // Handle scroll
}, 100);
```

### Throttle

```tsx
import { throttle } from "@/lib/animation-performance";

const handleResize = throttle(() => {
  // Handle resize
}, 100);
```

### Request Idle Callback

```tsx
import { requestIdleCallback } from "@/lib/animation-performance";

requestIdleCallback(() => {
  // Non-critical work
});
```

## Animation Durations

```typescript
fast: 150ms    // Quick feedback
base: 250ms    // Standard animations
slow: 350ms    // Emphasis animations
bounce: 500ms  // Playful animations
```

## Easing Functions

```typescript
easeOut: "cubic-bezier(0.4, 0, 0.2, 1)";
easeIn: "cubic-bezier(0.4, 0, 1, 1)";
easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)";
spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)";
```

## Checklist

- [ ] FPS is 60
- [ ] Using transform/opacity only
- [ ] will-change applied strategically
- [ ] GPU acceleration enabled
- [ ] Reduced motion supported
- [ ] No layout thrashing
- [ ] No excessive paints
- [ ] Memory usage stable

## Resources

- [CSS Triggers](https://csstriggers.com/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Web.dev Animations](https://web.dev/animations/)
