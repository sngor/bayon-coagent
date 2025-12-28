# Sparkline Components

Compact inline charts for visualizing trends and data patterns.

## Features

- **Line Sparklines**: Simple line charts showing trends
- **Bar Sparklines**: Compact bar charts for comparisons
- **Fill Support**: Optional area fill under the line
- **Dot Markers**: Show individual data points
- **Animations**: Smooth fade-in animations
- **Customizable**: Colors, sizes, and stroke widths

## Usage

### Line Sparkline

```tsx
import { Sparkline } from "@/components/ui/sparkline";

<Sparkline
  data={[20, 25, 22, 30, 28, 35, 40]}
  width={120}
  height={40}
  color="rgb(34, 197, 94)"
  showFill={true}
  showDots={false}
  animate={true}
/>;
```

### Bar Sparkline

```tsx
import { SparklineBar } from "@/components/ui/sparkline";

<SparklineBar
  data={[20, 25, 22, 30, 28, 35, 40]}
  width={120}
  height={40}
  color="rgb(59, 130, 246)"
  animate={true}
/>;
```

## Props

### Sparkline

- `data`: Array of numbers to visualize
- `width`: Chart width in pixels (default: 100)
- `height`: Chart height in pixels (default: 30)
- `strokeWidth`: Line thickness (default: 2)
- `color`: Line color (default: 'currentColor')
- `fillColor`: Fill color (optional)
- `showFill`: Show area fill (default: false)
- `showDots`: Show data point markers (default: false)
- `animate`: Enable animations (default: true)
- `className`: Additional CSS classes

### SparklineBar

- `data`: Array of numbers to visualize
- `width`: Chart width in pixels (default: 100)
- `height`: Chart height in pixels (default: 30)
- `color`: Bar color (default: 'currentColor')
- `animate`: Enable animations (default: true)
- `className`: Additional CSS classes

## Integration

Used in:

- Dashboard metric cards (trend visualization)
- Analytics displays
- Performance monitoring
- Data comparison views
