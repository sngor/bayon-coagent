# Interaction Optimization Guide

This guide explains how to use the interaction optimization utilities to ensure UI responds within 100ms to user interactions.

## Requirements

**Requirement 17.2**: Ensure UI responds within 100ms to interactions

## Overview

The interaction optimization utilities provide tools for:

1. **Debouncing** - Delay execution until after a wait period
2. **Throttling** - Limit execution frequency
3. **Optimistic UI Updates** - Update UI immediately, sync with server later
4. **Performance Measurement** - Track and log interaction response times
5. **Idle Callbacks** - Defer non-critical work

## Usage Examples

### 1. Debounced Search Input

Use debouncing for search inputs to reduce unnecessary operations while keeping the UI responsive.

```typescript
import { useDebouncedCallback } from "@/lib/interaction-optimization";

function SearchComponent() {
  const [query, setQuery] = useState("");

  // Debounce the actual search by 300ms
  const debouncedSearch = useDebouncedCallback((value: string) => {
    // Perform expensive search operation
    performSearch(value);
  }, 300);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Update UI immediately (<16ms)
    setQuery(value);
    // Debounced search execution
    debouncedSearch(value);
  };

  return <input value={query} onChange={handleChange} />;
}
```

### 2. Throttled Scroll Handler

Use throttling for scroll, resize, and mouse move handlers to prevent performance issues.

```typescript
import { useThrottledCallback } from "@/lib/interaction-optimization";

function ScrollComponent() {
  const [scrollPosition, setScrollPosition] = useState(0);

  // Throttle to run at most once every 100ms
  const handleScroll = useThrottledCallback(() => {
    setScrollPosition(window.scrollY);
  }, 100);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return <div>Scroll position: {scrollPosition}</div>;
}
```

### 3. Optimistic UI Updates

Update the UI immediately when users take actions, then sync with the server in the background.

```typescript
import { useOptimisticUpdate } from "@/lib/interaction-optimization";

function TodoList() {
  const { data, applyOptimisticUpdate } = useOptimisticUpdate(initialTodos);

  const handleToggleTodo = async (id: string) => {
    await applyOptimisticUpdate(
      // Optimistic update - applied immediately
      { completed: !data.find((t) => t.id === id)?.completed },
      // Actual API call
      async () => {
        const response = await fetch(`/api/todos/${id}/toggle`, {
          method: "POST",
        });
        return response.json();
      }
    );
  };

  return (
    <ul>
      {data.map((todo) => (
        <li key={todo.id} onClick={() => handleToggleTodo(todo.id)}>
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

### 4. Performance Measurement

Measure interaction response times to ensure they meet the 100ms target.

```typescript
import { measureInteractionTime } from "@/lib/interaction-optimization";

function ButtonComponent() {
  const handleClick = measureInteractionTime("Button Click", () => {
    // Your click handler logic
    performAction();
  });

  return <button onClick={handleClick}>Click Me</button>;
}
```

Console output:

```
[Performance] Button Click took 45.23ms ✓
[Performance] Button Click took 125.67ms (target: <100ms) ⚠️
```

### 5. Defer Non-Critical Work

Use idle callbacks to defer non-critical updates until the browser is idle.

```typescript
import { useIdleEffect } from "@/lib/interaction-optimization";

function AnalyticsComponent() {
  const [data, setData] = useState(null);

  // Track analytics when browser is idle
  useIdleEffect(() => {
    trackPageView();
  }, []);

  return <div>Content</div>;
}
```

## API Reference

### Hooks

#### `useDebounce<T>(value: T, delay?: number): T`

Returns a debounced version of the value.

- **value**: Value to debounce
- **delay**: Delay in milliseconds (default: 300ms)
- **Returns**: Debounced value

#### `useThrottle<T>(value: T, limit?: number): T`

Returns a throttled version of the value.

- **value**: Value to throttle
- **limit**: Limit in milliseconds (default: 100ms)
- **Returns**: Throttled value

#### `useDebouncedCallback<T>(callback: T, delay?: number)`

Returns a debounced version of the callback.

- **callback**: Callback to debounce
- **delay**: Delay in milliseconds (default: 300ms)
- **Returns**: Debounced callback

#### `useThrottledCallback<T>(callback: T, limit?: number)`

Returns a throttled version of the callback.

- **callback**: Callback to throttle
- **limit**: Limit in milliseconds (default: 100ms)
- **Returns**: Throttled callback

#### `useOptimisticUpdate<T>(initialData: T)`

Manages optimistic UI updates.

- **initialData**: Initial data state
- **Returns**: Object with:
  - `data`: Current data
  - `pendingUpdates`: Array of pending updates
  - `applyOptimisticUpdate`: Function to apply optimistic update
  - `clearPendingUpdates`: Function to clear pending updates
  - `hasPendingUpdates`: Boolean indicating if there are pending updates

#### `useIdleEffect(callback: () => void, deps: DependencyList)`

Runs an effect when the browser is idle.

- **callback**: Callback to execute when idle
- **deps**: Dependencies array

### Functions

#### `debounce<T>(func: T, wait?: number)`

Creates a debounced function.

- **func**: Function to debounce
- **wait**: Milliseconds to wait (default: 300ms)
- **Returns**: Debounced function

#### `throttle<T>(func: T, limit?: number)`

Creates a throttled function.

- **func**: Function to throttle
- **limit**: Milliseconds between calls (default: 100ms)
- **Returns**: Throttled function

#### `measureInteractionTime<T>(label: string, func: T)`

Measures and logs the execution time of a function.

- **label**: Label for the interaction
- **func**: Function to measure
- **Returns**: Wrapped function that logs performance

#### `runWhenIdle(callback: () => void, options?: { timeout?: number })`

Executes a callback when the browser is idle.

- **callback**: Callback to execute
- **options**: Options for requestIdleCallback

## Best Practices

### 1. Choose the Right Tool

- **Debounce**: Use for search inputs, form validation, API calls
- **Throttle**: Use for scroll handlers, resize handlers, mouse move
- **Optimistic Updates**: Use for user actions that modify data
- **Idle Callbacks**: Use for analytics, logging, non-critical updates

### 2. Timing Guidelines

- **Search inputs**: 300ms debounce
- **Scroll/resize handlers**: 100ms throttle
- **Button clicks**: Immediate response (<16ms for visual feedback)
- **Form submissions**: Immediate loading state, then async operation

### 3. Visual Feedback

Always provide immediate visual feedback:

```typescript
const handleClick = async () => {
  // Immediate visual feedback
  setLoading(true);

  try {
    // Async operation
    await performAction();
  } finally {
    setLoading(false);
  }
};
```

### 4. Error Handling

Always handle errors in optimistic updates:

```typescript
await applyOptimisticUpdate(optimisticData, async () => {
  try {
    return await apiCall();
  } catch (error) {
    // Error is automatically handled by reverting the optimistic update
    showErrorToast("Operation failed");
    throw error;
  }
});
```

### 5. Performance Monitoring

Use performance measurement in development:

```typescript
if (process.env.NODE_ENV === "development") {
  const measuredHandler = measureInteractionTime("Click", handler);
  return <button onClick={measuredHandler}>Click</button>;
}
```

## Performance Targets

| Interaction Type | Target Response Time   | Technique                              |
| ---------------- | ---------------------- | -------------------------------------- |
| Button click     | <16ms (1 frame)        | Immediate state update                 |
| Input typing     | <16ms (1 frame)        | Immediate UI update + debounced action |
| Scroll handling  | <100ms                 | Throttling                             |
| Search execution | 300ms debounce         | Debouncing                             |
| Form submission  | <100ms to show loading | Optimistic update                      |
| Data mutation    | <16ms UI update        | Optimistic update                      |

## Testing

Test interaction responsiveness:

```typescript
import { measureInteractionTime } from "@/lib/interaction-optimization";

describe("Button interactions", () => {
  it("responds within 100ms", async () => {
    const startTime = performance.now();

    fireEvent.click(button);

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(100);
  });
});
```

## Demo

See the interaction optimization demo at `/interaction-optimization-demo` for live examples of all techniques.
