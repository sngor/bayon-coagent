# Sparkline Component

A lightweight, animated sparkline component for displaying inline metrics and trends in dashboard cards.

## Features

- ✨ **Animated Line Drawing**: Smooth line drawing animation on initial render
- 🎨 **Gradient Fills**: Beautiful gradient fills with customizable colors
- 🎯 **Hover Tooltips**: Interactive tooltips showing exact values on hover
- 📈 **Trend Indicators**: Automatic trend detection with up/down/neutral indicators
- 🎭 **Smooth Animations**: Framer Motion powered animations with spring physics
- 🎨 **Customizable**: Extensive props for colors, sizes, and behavior
- ♿ **Accessible**: Built with accessibility in mind
- 📱 **Responsive**: Works seamlessly across all screen sizes

## Installation

The component is already installed as part of the UI component library. It requires:

- `recharts` - For chart rendering
- `framer-motion` - For animations
- `lucide-react` - For trend icons

## Basic Usage

```tsx
import { Sparkline } from "@/components/ui/sparkline";

export function MyComponent() {
  const data = [10, 15, 13, 18, 22, 20, 25];

  return <Sparkline data={data} />;
}
```

## Props

### Sparkline Props

| Prop          | Type                        | Default                 | Description                             |
| ------------- | --------------------------- | ----------------------- | --------------------------------------- |
| `data`        | `number[]`                  | **required**            | Array of numeric values to display      |
| `color`       | `string`                    | `"hsl(var(--primary))"` | Primary color for the line and gradient |
| `height`      | `number`                    | `40`                    | Height of the sparkline in pixels       |
| `width`       | `string \| number`          | `"100%"`                | Width of the sparkline                  |
| `className`   | `string`                    | `undefined`             | Additional CSS classes                  |
| `showTooltip` | `boolean`                   | `true`                  | Show tooltip on hover                   |
| `gradient`    | `boolean`                   | `true`                  | Enable gradient fill                    |
| `showTrend`   | `boolean`                   | `false`                 | Show trend indicator (up/down/neutral)  |
| `animated`    | `boolean`                   | `true`                  | Animate the line drawing effect         |
| `strokeWidth` | `number`                    | `2`                     | Line thickness in pixels                |
| `smooth`      | `boolean`                   | `true`                  | Smooth or sharp line curves             |
| `formatValue` | `(value: number) => string` | `undefined`             | Format function for tooltip values      |
| `onClick`     | `() => void`                | `undefined`             | Callback when sparkline is clicked      |

### SparklineCard Props

| Prop          | Type                        | Default                 | Description                           |
| ------------- | --------------------------- | ----------------------- | ------------------------------------- |
| `title`       | `string`                    | **required**            | Card title                            |
| `value`       | `string \| number`          | **required**            | Main metric value to display          |
| `data`        | `number[]`                  | **required**            | Array of numeric values for sparkline |
| `color`       | `string`                    | `"hsl(var(--primary))"` | Color for the sparkline               |
| `formatValue` | `(value: number) => string` | `undefined`             | Format function for tooltip values    |
| `className`   | `string`                    | `undefined`             | Additional CSS classes                |
| `onClick`     | `() => void`                | `undefined`             | Callback when card is clicked         |

## Examples

### Simple Sparkline

```tsx
import { Sparkline } from "@/components/ui/sparkline";

export function SimpleSparkline() {
  const data = [10, 15, 13, 18, 22, 20, 25];

  return (
    <div className="p-4">
      <Sparkline data={data} height={60} />
    </div>
  );
}
```

### Sparkline with Trend Indicator

```tsx
import { Sparkline } from "@/components/ui/sparkline";

export function SparklineWithTrend() {
  const data = [100, 120, 115, 130, 145, 140, 160];

  return (
    <Sparkline
      data={data}
      height={50}
      showTrend={true}
      color="hsl(142, 71%, 45%)" // Green for positive trend
    />
  );
}
```

### Custom Formatted Tooltip

```tsx
import { Sparkline } from "@/components/ui/sparkline";

export function FormattedSparkline() {
  const data = [1000, 1500, 1300, 1800, 2200, 2000, 2500];

  return (
    <Sparkline
      data={data}
      height={60}
      formatValue={(value) => `$${value.toLocaleString()}`}
      showTooltip={true}
    />
  );
}
```

### Sparkline Card for Dashboard

```tsx
import { SparklineCard } from "@/components/ui/sparkline";

export function DashboardMetric() {
  const data = [45, 52, 48, 58, 62, 59, 68];

  return (
    <SparklineCard
      title="Total Views"
      value="2,345"
      data={data}
      color="hsl(var(--primary))"
      formatValue={(value) => value.toLocaleString()}
      onClick={() => console.log("Card clicked")}
    />
  );
}
```

### Multiple Sparklines in Grid

```tsx
import { SparklineCard } from "@/components/ui/sparkline";

export function MetricsGrid() {
  const metrics = [
    {
      title: "Revenue",
      value: "$12,345",
      data: [100, 120, 115, 130, 145, 140, 160],
      color: "hsl(142, 71%, 45%)",
    },
    {
      title: "Users",
      value: "1,234",
      data: [50, 55, 52, 58, 62, 59, 65],
      color: "hsl(220, 60%, 50%)",
    },
    {
      title: "Conversions",
      value: "89",
      data: [10, 12, 11, 13, 15, 14, 16],
      color: "hsl(260, 60%, 55%)",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric) => (
        <SparklineCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          data={metric.data}
          color={metric.color}
        />
      ))}
    </div>
  );
}
```

### Inline Sparkline in Table

```tsx
import { Sparkline } from "@/components/ui/sparkline";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TableWithSparklines() {
  const rows = [
    { name: "Product A", trend: [10, 15, 13, 18, 22, 20, 25] },
    { name: "Product B", trend: [20, 18, 22, 19, 24, 26, 28] },
    { name: "Product C", trend: [15, 14, 16, 15, 17, 19, 18] },
  ];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Trend</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.name}>
            <TableCell>{row.name}</TableCell>
            <TableCell>
              <Sparkline
                data={row.trend}
                height={30}
                width={120}
                showTooltip={true}
                showTrend={true}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Different Colors for Different Trends

```tsx
import { Sparkline } from "@/components/ui/sparkline";

export function ColoredSparklines() {
  const positiveData = [100, 120, 115, 130, 145, 140, 160];
  const negativeData = [100, 95, 98, 90, 85, 88, 80];
  const neutralData = [100, 102, 99, 101, 100, 103, 101];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-2">Positive Trend</p>
        <Sparkline
          data={positiveData}
          color="hsl(142, 71%, 45%)"
          showTrend={true}
        />
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-2">Negative Trend</p>
        <Sparkline
          data={negativeData}
          color="hsl(0, 84%, 60%)"
          showTrend={true}
        />
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-2">Neutral Trend</p>
        <Sparkline
          data={neutralData}
          color="hsl(var(--muted-foreground))"
          showTrend={true}
        />
      </div>
    </div>
  );
}
```

### Clickable Sparkline

```tsx
import { Sparkline } from "@/components/ui/sparkline";
import { useRouter } from "next/navigation";

export function ClickableSparkline() {
  const router = useRouter();
  const data = [10, 15, 13, 18, 22, 20, 25];

  return (
    <Sparkline
      data={data}
      height={60}
      onClick={() => router.push("/analytics")}
      className="cursor-pointer hover:opacity-80 transition-opacity"
    />
  );
}
```

## Styling

The component uses Tailwind CSS and CSS variables for theming. You can customize colors using:

```css
:root {
  --primary: 220 60% 50%;
  --success: 142 71% 45%;
  --error: 0 84% 60%;
}
```

## Accessibility

- Tooltips are keyboard accessible
- Proper ARIA labels for trend indicators
- Respects `prefers-reduced-motion` for animations
- Semantic HTML structure

## Performance

- Optimized with React.memo for data changes
- Efficient re-renders using useMemo
- Smooth 60fps animations
- Minimal bundle size impact

## Browser Support

Works in all modern browsers that support:

- CSS Grid
- CSS Custom Properties
- SVG
- ES6+

## Related Components

- `AnimatedChart` - Full-featured chart component
- `AnimatedNumber` - Animated number counter
- `Card` - Card container component

## Tips

1. **Data Length**: Works best with 7-30 data points for inline sparklines
2. **Colors**: Use semantic colors (green for positive, red for negative)
3. **Height**: 40-60px works well for inline usage, 80-100px for cards
4. **Tooltips**: Enable tooltips for detailed data inspection
5. **Trends**: Show trend indicators for quick visual feedback

## Troubleshooting

### Sparkline not rendering

Make sure you have valid numeric data:

```tsx
// ❌ Bad
<Sparkline data={[]} />

// ✅ Good
<Sparkline data={[1, 2, 3, 4, 5]} />
```

### Animation not working

Check that Framer Motion is installed:

```bash
npm install framer-motion
```

### Tooltip not showing

Ensure `showTooltip` is true and you're hovering over the line:

```tsx
<Sparkline data={data} showTooltip={true} />
```

## License

Part of the Co-agent Marketer UI component library.
