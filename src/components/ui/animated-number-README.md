# Animated Number Component

A smooth, performant animated number counter component with support for multiple formats including currency, percentages, and decimals.

## Features

- ✨ Smooth counting animation with ease-out cubic easing
- 🎯 Multiple format types: number, currency, percentage
- 🔢 Configurable decimal precision
- ⚡ Performance optimized with `requestAnimationFrame`
- 🎨 Customizable duration and styling
- 📱 Responsive and accessible
- 🔤 Support for custom prefix and suffix

## Installation

The component is already included in the project at `src/components/ui/animated-number.tsx`.

## Basic Usage

```tsx
import { AnimatedNumber } from "@/components/ui/animated-number";

function MyComponent() {
  return (
    <div>
      <AnimatedNumber value={1234} duration={1000} />
    </div>
  );
}
```

## API Reference

### AnimatedNumber

Main component for animated numbers with full customization.

#### Props

| Prop        | Type                                     | Default     | Description                         |
| ----------- | ---------------------------------------- | ----------- | ----------------------------------- |
| `value`     | `number`                                 | required    | The target number to animate to     |
| `duration`  | `number`                                 | `1000`      | Animation duration in milliseconds  |
| `decimals`  | `number`                                 | `0`         | Number of decimal places to display |
| `format`    | `'number' \| 'currency' \| 'percentage'` | `'number'`  | Format type                         |
| `currency`  | `string`                                 | `'USD'`     | Currency code for currency format   |
| `className` | `string`                                 | `undefined` | Additional CSS classes              |
| `prefix`    | `string`                                 | `''`        | Text to display before the number   |
| `suffix`    | `string`                                 | `''`        | Text to display after the number    |

#### Example

```tsx
<AnimatedNumber
  value={5000}
  duration={1500}
  decimals={2}
  format="number"
  prefix="$"
  className="text-4xl font-bold"
/>
```

### AnimatedCurrency

Convenience component for currency values.

#### Props

| Prop        | Type     | Default     | Description                         |
| ----------- | -------- | ----------- | ----------------------------------- |
| `value`     | `number` | required    | The currency amount                 |
| `duration`  | `number` | `1000`      | Animation duration in milliseconds  |
| `currency`  | `string` | `'USD'`     | Currency code (USD, EUR, GBP, etc.) |
| `className` | `string` | `undefined` | Additional CSS classes              |

#### Example

```tsx
<AnimatedCurrency
  value={50000}
  currency="USD"
  duration={1200}
  className="text-5xl font-bold text-success"
/>
// Output: $50,000
```

### AnimatedPercentage

Convenience component for percentage values.

#### Props

| Prop        | Type     | Default     | Description                        |
| ----------- | -------- | ----------- | ---------------------------------- |
| `value`     | `number` | required    | The percentage value (0-100)       |
| `duration`  | `number` | `1000`      | Animation duration in milliseconds |
| `decimals`  | `number` | `1`         | Number of decimal places           |
| `className` | `string` | `undefined` | Additional CSS classes             |

#### Example

```tsx
<AnimatedPercentage
  value={75}
  decimals={1}
  duration={1000}
  className="text-4xl font-bold text-blue-500"
/>
// Output: 75.0%
```

### AnimatedDecimal

Convenience component for decimal numbers (like ratings).

#### Props

| Prop        | Type     | Default     | Description                        |
| ----------- | -------- | ----------- | ---------------------------------- |
| `value`     | `number` | required    | The decimal number                 |
| `duration`  | `number` | `1000`      | Animation duration in milliseconds |
| `decimals`  | `number` | `1`         | Number of decimal places           |
| `className` | `string` | `undefined` | Additional CSS classes             |
| `prefix`    | `string` | `''`        | Text before the number             |
| `suffix`    | `string` | `''`        | Text after the number              |

#### Example

```tsx
<AnimatedDecimal
  value={4.5}
  decimals={1}
  duration={1200}
  className="text-5xl font-bold text-yellow-500"
/>
// Output: 4.5
```

## Real-World Examples

### Dashboard Metrics Card

```tsx
<div className="flex flex-col items-center justify-center rounded-xl border-2 p-6 bg-gradient-to-br from-primary/5 to-transparent">
  <div className="text-5xl font-bold text-primary mb-2">
    <AnimatedDecimal value={averageRating} decimals={1} duration={1200} />
  </div>
  <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
</div>
```

### Total Count with Prefix

```tsx
<div className="text-4xl font-bold text-primary">
  <AnimatedNumber value={recentReviewsCount} duration={1200} prefix="+" />
</div>
```

### Currency Display

```tsx
<div className="text-6xl font-bold text-success">
  <AnimatedCurrency value={revenue} currency="USD" duration={1500} />
</div>
```

### Percentage Progress

```tsx
<div className="flex items-center gap-2">
  <div className="text-3xl font-bold">
    <AnimatedPercentage value={completionRate} decimals={0} duration={1000} />
  </div>
  <span className="text-sm text-muted-foreground">Complete</span>
</div>
```

## Animation Behavior

The component uses an **ease-out cubic** easing function for natural deceleration:

```typescript
const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};
```

This creates a smooth animation that:

- Starts fast
- Gradually slows down
- Ends smoothly at the target value

## Performance Considerations

- Uses `requestAnimationFrame` for optimal performance
- Automatically cancels animations when component unmounts
- Minimal re-renders with efficient state management
- Uses `tabular-nums` font feature for consistent width

## Styling

The component applies `tabular-nums` by default to ensure numbers don't shift during animation:

```tsx
<span className="tabular-nums transition-opacity duration-200">
  {formattedValue}
</span>
```

You can add custom classes via the `className` prop:

```tsx
<AnimatedNumber
  value={1234}
  className="text-6xl font-bold text-primary tracking-tight"
/>
```

## Testing

Visit the demo page at `/animated-number-demo` to:

- Test different formats (number, currency, percentage, decimal)
- Adjust animation duration
- Randomize values to see animations
- View dashboard-style examples

## Browser Support

Works in all modern browsers that support:

- `requestAnimationFrame`
- `Intl.NumberFormat`
- ES6+ features

## Accessibility

- Uses semantic HTML
- Respects user's motion preferences (can be extended with `prefers-reduced-motion`)
- Maintains readable contrast ratios
- Works with screen readers (reads final value)

## Future Enhancements

Potential improvements:

- Add support for `prefers-reduced-motion` to skip animation
- Add callback when animation completes
- Support for negative numbers with special styling
- Add spring physics option for more dynamic animations
- Support for counting down (decreasing values)

## Related Components

- `Card` - For containing metrics
- `Badge` - For labeling metrics
- `Skeleton` - For loading states before data arrives

## Requirements Validated

This component validates the following requirements from the UI/UX Enhancement spec:

- **Requirement 10.10**: Animated number counters with smooth counting animation
- **Requirement 25.3**: Interactive metric cards with animated numbers
