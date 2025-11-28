# Mobile Gesture Handling

This document describes the comprehensive gesture handling system implemented for mobile interactions in the Bayon Coagent platform.

## Overview

The gesture handling system provides support for:

- **Swipe gestures** (left, right, up, down)
- **Pinch gestures** (zoom in/out)
- **Long-press gestures** (press and hold)
- **Haptic feedback** (vibration)
- **Visual feedback** (animations)

## Requirements

Implements **Requirement 10.3**: WHEN a user performs gestures (swipe, pinch, long-press), THE Mobile App SHALL respond with appropriate actions

## Architecture

### Core Components

1. **GestureHandler Class** (`src/lib/gesture-handler.ts`)

   - Low-level gesture detection and handling
   - Touch event management
   - Feedback provision (haptic and visual)

2. **React Hooks** (`src/hooks/use-gesture-handler.ts`)

   - `useGestureHandler` - General purpose gesture handling
   - `useSwipeGesture` - Specialized for swipe gestures
   - `usePinchGesture` - Specialized for pinch gestures
   - `useLongPressGesture` - Specialized for long-press gestures
   - `useMobileGestures` - Simplified API for common mobile gestures

3. **Demo Component** (`src/components/mobile/gesture-demo.tsx`)
   - Interactive demonstration of all gesture types
   - Event logging and visualization
   - Example implementations

## Usage

### Basic Swipe Gesture

```typescript
import { useSwipeGesture } from "@/hooks/use-gesture-handler";

function MyComponent() {
  const { ref } = useSwipeGesture<HTMLDivElement>(
    (gesture) => {
      console.log(`Swiped ${gesture.direction}`);
      console.log(`Distance: ${gesture.distance}px`);
      console.log(`Velocity: ${gesture.velocity}px/ms`);
    },
    {
      swipeThreshold: 50, // Minimum distance
      swipeVelocityThreshold: 0.3, // Minimum velocity
      hapticFeedback: true,
      visualFeedback: true,
    }
  );

  return (
    <div ref={ref} className="touch-pan-y">
      Swipe me!
    </div>
  );
}
```

### Pinch Gesture

```typescript
import { usePinchGesture } from "@/hooks/use-gesture-handler";

function ZoomableImage() {
  const [scale, setScale] = useState(1);

  const { ref } = usePinchGesture<HTMLDivElement>(
    {
      onPinch: (gesture) => {
        setScale(gesture.scale);
      },
      onPinchEnd: (gesture) => {
        console.log(`Final scale: ${gesture.scale}`);
      },
    },
    {
      pinchThreshold: 0.1,
      hapticFeedback: true,
    }
  );

  return (
    <div ref={ref}>
      <img src="/image.jpg" style={{ transform: `scale(${scale})` }} />
    </div>
  );
}
```

### Long Press Gesture

```typescript
import { useLongPressGesture } from "@/hooks/use-gesture-handler";

function ContextMenuTrigger() {
  const { ref } = useLongPressGesture<HTMLDivElement>(
    {
      onLongPressStart: (gesture) => {
        console.log("Long press started");
      },
      onLongPress: (gesture) => {
        console.log(`Long press at (${gesture.x}, ${gesture.y})`);
        // Show context menu
      },
    },
    {
      longPressDelay: 500, // 500ms
      longPressMoveThreshold: 10, // 10px max movement
      hapticFeedback: true,
    }
  );

  return <div ref={ref}>Press and hold for context menu</div>;
}
```

### Simplified Mobile Gestures

```typescript
import { useMobileGestures } from "@/hooks/use-gesture-handler";

function SwipeableCard() {
  const { ref } = useMobileGestures<HTMLDivElement>({
    onSwipeLeft: () => console.log("Next card"),
    onSwipeRight: () => console.log("Previous card"),
    onPinchOut: (scale) => console.log("Zoom in"),
    onPinchIn: (scale) => console.log("Zoom out"),
    onLongPress: (x, y) => console.log("Show options"),
  });

  return (
    <div ref={ref} className="touch-pan-y">
      Swipeable card content
    </div>
  );
}
```

### All Gestures Combined

```typescript
import { useGestureHandler } from "@/hooks/use-gesture-handler";

function AdvancedComponent() {
  const { ref, enable, disable } = useGestureHandler<HTMLDivElement>(
    {
      onSwipe: (gesture) => {
        console.log(`Swipe ${gesture.direction}`);
      },
      onPinch: (gesture) => {
        console.log(`Pinch scale: ${gesture.scale}`);
      },
      onLongPress: (gesture) => {
        console.log(`Long press at (${gesture.x}, ${gesture.y})`);
      },
    },
    {
      swipeThreshold: 50,
      pinchThreshold: 0.1,
      longPressDelay: 500,
      hapticFeedback: true,
      visualFeedback: true,
    }
  );

  return (
    <div>
      <div ref={ref}>Interactive area</div>
      <button onClick={enable}>Enable Gestures</button>
      <button onClick={disable}>Disable Gestures</button>
    </div>
  );
}
```

## Configuration Options

### Swipe Options

- `swipeThreshold` (default: 50) - Minimum distance in pixels for a swipe
- `swipeVelocityThreshold` (default: 0.3) - Minimum velocity in px/ms

### Pinch Options

- `pinchThreshold` (default: 0.1) - Minimum scale change to trigger pinch

### Long Press Options

- `longPressDelay` (default: 500) - Time in ms to trigger long press
- `longPressMoveThreshold` (default: 10) - Maximum movement in pixels during long press

### Feedback Options

- `hapticFeedback` (default: true) - Enable vibration feedback
- `visualFeedback` (default: true) - Enable visual animations

## Gesture Data Structures

### SwipeGesture

```typescript
interface SwipeGesture {
  direction: "left" | "right" | "up" | "down";
  distance: number; // Total distance in pixels
  velocity: number; // Velocity in px/ms
  startX: number; // Starting X coordinate
  startY: number; // Starting Y coordinate
  endX: number; // Ending X coordinate
  endY: number; // Ending Y coordinate
  duration: number; // Duration in milliseconds
}
```

### PinchGesture

```typescript
interface PinchGesture {
  scale: number; // Scale factor (1.0 = no change)
  centerX: number; // Center X coordinate
  centerY: number; // Center Y coordinate
  startDistance: number; // Initial distance between touches
  currentDistance: number; // Current distance between touches
}
```

### LongPressGesture

```typescript
interface LongPressGesture {
  x: number; // X coordinate
  y: number; // Y coordinate
  duration: number; // Duration in milliseconds
}
```

## Feedback Patterns

### Haptic Feedback

The system provides different vibration patterns for different gestures:

- **Swipe**: Single 50ms vibration
- **Pinch**: Triple vibration (25ms, 25ms, 25ms)
- **Long Press Start**: Single 100ms vibration
- **Long Press End**: Single 50ms vibration

### Visual Feedback

Automatic visual feedback includes:

- **Swipe**: Brief translation in swipe direction (2px)
- **Pinch**: Scale animation (1.02x)
- **Long Press**: Scale down animation (0.98x)

All visual feedback automatically resets after 100ms.

## Best Practices

### 1. Use Appropriate CSS Classes

Always include `touch-pan-y` or `touch-pan-x` to prevent default browser gestures:

```tsx
<div ref={ref} className="touch-pan-y select-none">
  Content
</div>
```

### 2. Prevent Text Selection

Use `select-none` class to prevent text selection during gestures:

```tsx
<div ref={ref} className="select-none">
  Content
</div>
```

### 3. Provide Visual Cues

Give users visual hints that an element is interactive:

```tsx
<div ref={ref} className="cursor-move">
  Swipeable content
</div>
```

### 4. Handle Cleanup

The hooks automatically handle cleanup, but if using the class directly:

```typescript
const handler = new GestureHandler(element, callbacks, options);

// Later...
handler.destroy();
```

### 5. Combine with Touch-Friendly Controls

Use with the mobile optimization utilities:

```typescript
import { TOUCH_FRIENDLY_CLASSES } from "@/lib/mobile-optimization";

<button className={TOUCH_FRIENDLY_CLASSES.button}>
  Touch-friendly button
</button>;
```

## Testing

### Interactive Demo

Visit `/mobile-gestures-demo` to see an interactive demonstration of all gesture types.

### Manual Testing

1. Open the app on a mobile device or use browser dev tools mobile emulation
2. Try each gesture type:
   - Swipe in different directions
   - Pinch with two fingers
   - Press and hold for long press
3. Verify haptic feedback (if device supports it)
4. Check visual feedback animations

### Automated Testing

See `src/__tests__/mobile-device-testing.test.ts` for gesture testing examples.

## Browser Compatibility

- **iOS Safari 14+**: Full support
- **Chrome Mobile 90+**: Full support
- **Firefox Mobile 90+**: Full support
- **Samsung Internet 14+**: Full support

Haptic feedback requires browser support for the Vibration API.

## Performance Considerations

1. **Event Listeners**: Uses passive: false for touch events to enable preventDefault
2. **Memory Management**: Automatic cleanup on component unmount
3. **Throttling**: Gesture detection is optimized to avoid excessive callbacks
4. **Visual Feedback**: Uses CSS transforms for hardware acceleration

## Troubleshooting

### Gestures Not Detected

1. Ensure element has `ref` attached
2. Check that touch events are not being prevented by parent elements
3. Verify thresholds are appropriate for your use case

### Haptic Feedback Not Working

1. Check browser support: `navigator.vibrate` must be available
2. Verify device supports vibration
3. Check that `hapticFeedback: true` in options

### Visual Feedback Not Showing

1. Ensure `visualFeedback: true` in options
2. Check that element is not position: fixed or absolute
3. Verify no conflicting CSS transitions

## Related Files

- `src/lib/gesture-handler.ts` - Core gesture handling class
- `src/hooks/use-gesture-handler.ts` - React hooks
- `src/components/mobile/gesture-demo.tsx` - Interactive demo
- `src/lib/mobile-optimization.ts` - Mobile utilities
- `src/__tests__/mobile-device-testing.test.ts` - Tests

## Future Enhancements

Potential improvements for future iterations:

1. Multi-finger gestures (3+ fingers)
2. Rotation gestures
3. Custom gesture patterns
4. Gesture recording and playback
5. Accessibility improvements for gesture alternatives
