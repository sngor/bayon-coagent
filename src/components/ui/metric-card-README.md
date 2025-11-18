# MetricCard Component

An interactive, animated metric card component with sparklines, trend indicators, and sophisticated hover effects. Perfect for dashboards and data visualization.

## Features

- ✨ **Animated Numbers**: Smooth counting animations with configurable easing
- 📈 **Sparklines**: Inline trend visualization with gradient fills
- 🎯 **Trend Indicators**: Animated arrows showing positive/negative changes
- 🎨 **Color Variants**: Multiple color schemes (default, success, warning, error, primary)
- 🌈 **Hover Effects**: Multi-layered depth effects with glow and scale
- 📱 **Responsive**: Optimized for mobile, tablet, and desktop
- ♿ **Accessible**: Keyboard navigation and screen reader support
- 🎭 **Framer Motion**: Smooth, physics-based animations

## Installation

The component is already installed as part of the UI component library. It depends on:

- `framer-motion` - For animations
- `recharts` - For sparkline charts
- `lucide-react` - For icons
- `AnimatedNumber` component
- `Sparkline` component

## Basic Usage

```tsx
import { MetricCard } from "@/components/ui/metric-card";
import { Star } from "lucide-react";

export function Dashboard() {
  return (
    <MetricCard
      value={4.8}
      label="Average Rating"
      decimals={1}
      icon={<Star className="h-6 w-6" />}
      trendData={[4.2, 4.3, 4.5, 4.6, 4.7, 4.8]}
      changePercent={14.3}
      showSparkline={true}
      showTrend={true}
      variant="primary"
    />
  );
}
```

## Props

### MetricCardProps

| Prop            | Type                                                          | Default     | Description                               |
| --------------- | ------------------------------------------------------------- | ----------- | ----------------------------------------- |
| `value`         | `number`                                                      | Required    | The main metric value to display          |
| `label`         | `string`                                                      | Required    | Label for the metric                      |
| `icon`          | `React.ReactNode`                                             | -           | Optional icon to display                  |
| `trendData`     | `number[]`                                                    | -           | Historical data for sparkline             |
| `changePercent` | `number`                                                      | -           | Change percentage (e.g., 12.5 for +12.5%) |
| `decimals`      | `number`                                                      | `0`         | Number of decimal places for the value    |
| `format`        | `'number' \| 'currency' \| 'percentage'`                      | `'number'`  | Format type for the value                 |
| `prefix`        | `string`                                                      | -           | Prefix for the value (e.g., "+")          |
| `suffix`        | `string`                                                      | -           | Suffix for the value (e.g., "k")          |
| `className`     | `string`                                                      | -           | Additional CSS classes                    |
| `onClick`       | `() => void`                                                  | -           | Callback when card is clicked             |
| `showSparkline` | `boolean`                                                     | `true`      | Show sparkline chart                      |
| `showTrend`     | `boolean`                                                     | `true`      | Show trend indicator                      |
| `variant`       | `'default' \| 'success' \| 'warning' \| 'error' \| 'primary'` | `'default'` | Color variant                             |

## Examples

### With Sparkline and Trend

```tsx
<MetricCard
  value={127}
  label="Total Reviews"
  icon={<Award className="h-6 w-6" />}
  trendData={[95, 102, 108, 115, 120, 124, 127]}
  changePercent={33.7}
  showSparkline={true}
  showTrend={true}
  variant="primary"
/>
```

### Currency Format

```tsx
<MetricCard
  value={285000}
  label="Total Revenue"
  format="currency"
  icon={<DollarSign className="h-6 w-6" />}
  trendData={[180000, 200000, 220000, 245000, 260000, 275000, 285000]}
  changePercent={58.3}
  variant="success"
/>
```

### Percentage Format

```tsx
<MetricCard
  value={96}
  label="Client Satisfaction"
  suffix="%"
  icon={<TrendingUp className="h-6 w-6" />}
  trendData={[88, 90, 92, 93, 94, 95, 96]}
  changePercent={9.1}
  variant="success"
/>
```

### Without Sparkline

```tsx
<MetricCard
  value={45}
  label="Active Clients"
  icon={<Users className="h-6 w-6" />}
  changePercent={40.6}
  showSparkline={false}
  showTrend={true}
  variant="success"
/>
```

### Clickable Card

```tsx
<MetricCard
  value={12}
  label="Active Listings"
  icon={<Home className="h-6 w-6" />}
  trendData={[8, 9, 10, 10, 11, 12]}
  changePercent={50.0}
  onClick={() => router.push("/listings")}
/>
```

## Color Variants

### Success (Green)

Used for positive metrics like growth, satisfaction, or achievements.

```tsx
<MetricCard variant="success" {...props} />
```

### Warning (Yellow/Orange)

Used for metrics that need attention or are approaching thresholds.

```tsx
<MetricCard variant="warning" {...props} />
```

### Error (Red)

Used for negative metrics or declining trends.

```tsx
<MetricCard variant="error" {...props} />
```

### Primary (Blue)

Used for key metrics and primary data points.

```tsx
<MetricCard variant="primary" {...props} />
```

### Default

Adapts color based on trend direction (green for up, red for down).

```tsx
<MetricCard variant="default" {...props} />
```

## Animation Details

### Number Animation

- Duration: 1200ms
- Easing: Ease-out cubic
- Smooth counting from 0 to target value

### Card Entrance

- Fade in with upward motion
- Duration: 400ms
- Staggered delays for multiple cards

### Hover Effects

- Scale: 1.02x
- Vertical lift: -4px
- Glow effect with radial gradient
- Duration: 200ms

### Sparkline Animation

- Line drawing effect
- Duration: 800ms
- Gradient fill animation

### Trend Indicator

- Spring animation
- Delay: 300ms
- Scale and slide-in effect

## Responsive Behavior

### Mobile (< 768px)

- Smaller text sizes
- Reduced padding
- Touch-optimized tap targets
- Simplified hover effects

### Tablet (768px - 1024px)

- Medium text sizes
- Balanced spacing
- Full hover effects

### Desktop (> 1024px)

- Large text sizes
- Maximum spacing
- Enhanced hover effects
- Glow animations

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Descriptive labels and ARIA attributes
- **Color Contrast**: WCAG AA compliant
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Focus Indicators**: Clear focus states

## Performance

- **GPU Acceleration**: Uses CSS transforms for smooth animations
- **Lazy Rendering**: Sparklines only render when visible
- **Optimized Re-renders**: Memoized calculations
- **Lightweight**: Minimal bundle impact

## Best Practices

1. **Provide Trend Data**: Always include historical data for sparklines
2. **Use Appropriate Variants**: Match variant to metric meaning
3. **Keep Labels Short**: Use concise, descriptive labels
4. **Group Related Metrics**: Display related metrics together
5. **Update Regularly**: Refresh data to keep metrics current

## Demo

Visit `/metric-card-demo` to see all variants and configurations in action.

## Related Components

- `AnimatedNumber` - Number animation component
- `Sparkline` - Sparkline chart component
- `Card` - Base card component

## Requirements Validated

This component validates the following requirements from the UI/UX Enhancement spec:

- **25.3**: Animated number counters with smooth transitions
- **25.4**: Sparklines for historical data visualization
- **25.5**: Color-coded change indicators with trend arrows
