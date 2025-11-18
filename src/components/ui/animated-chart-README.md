# Animated Chart Component

A sophisticated, animated chart component built on top of Recharts with gradient fills, smooth animations, interactive tooltips, and zoom/pan capabilities.

## Features

- ✨ **Smooth Animations**: Spring-based physics animations with ease-out timing
- 🎨 **Gradient Fills**: Beautiful gradient fills for area and bar charts
- 🖱️ **Interactive Tooltips**: Animated tooltips with hover effects
- 🔍 **Zoom & Pan**: Built-in brush component for zooming into data ranges
- 📊 **Multiple Chart Types**: Area, Line, and Bar charts
- 📈 **Sparklines**: Compact inline charts for dashboard metrics
- 🎯 **Click Events**: Handle data point clicks for drill-down interactions
- 🌓 **Theme Support**: Automatically adapts to light/dark mode
- 📱 **Responsive**: Adapts to container size automatically

## Installation

The component is already installed and ready to use. It depends on:

- `recharts` - Charting library
- `framer-motion` - Animation library
- `@/components/ui/chart` - Base chart components from shadcn/ui

## Usage

### Basic Area Chart

```tsx
import { AnimatedChart } from "@/components/ui/animated-chart";

const data = [
  { month: "Jan", revenue: 4200 },
  { month: "Feb", revenue: 5100 },
  { month: "Mar", revenue: 4800 },
];

const config = {
  revenue: {
    label: "Revenue ($)",
    color: "hsl(var(--primary))",
  },
};

<AnimatedChart
  data={data}
  type="area"
  dataKey="revenue"
  xAxisKey="month"
  config={config}
  gradient={true}
  interactive={true}
  height={400}
/>;
```

### Line Chart with Custom Colors

```tsx
<AnimatedChart
  data={data}
  type="line"
  dataKey="leads"
  xAxisKey="month"
  config={config}
  gradient={true}
  interactive={true}
  height={400}
  colors={{
    primary: "hsl(142 71% 45%)",
    secondary: "hsl(142 71% 65%)",
    gradient: {
      start: "hsl(142 71% 45%)",
      end: "hsl(142 71% 65%)",
    },
  }}
/>
```

### Bar Chart with Zoom

```tsx
<AnimatedChart
  data={data}
  type="bar"
  dataKey="views"
  xAxisKey="day"
  config={config}
  gradient={true}
  interactive={true}
  height={400}
  showBrush={true}
  showGrid={true}
/>
```

### Sparkline for Metrics

```tsx
import { Sparkline } from "@/components/ui/animated-chart";

<Sparkline
  data={[45, 52, 48, 61, 58, 72, 68, 85, 92, 88, 95, 102]}
  height={60}
  color="hsl(var(--primary))"
  gradient={true}
  showTooltip={true}
/>;
```

### With Click Events

```tsx
const handleDataPointClick = (data: any) => {
  console.log("Clicked:", data);
  // Navigate to detail view, show modal, etc.
};

<AnimatedChart
  data={data}
  type="area"
  dataKey="revenue"
  xAxisKey="month"
  config={config}
  onDataPointClick={handleDataPointClick}
/>;
```

## Props

### AnimatedChart Props

| Prop               | Type                                | Default  | Description                                   |
| ------------------ | ----------------------------------- | -------- | --------------------------------------------- |
| `data`             | `AnimatedChartData[]`               | Required | Array of data objects                         |
| `type`             | `"line" \| "bar" \| "area"`         | `"area"` | Chart type                                    |
| `dataKey`          | `string`                            | Required | Key for the data values                       |
| `xAxisKey`         | `string`                            | Required | Key for the x-axis labels                     |
| `config`           | `ChartConfig`                       | Required | Chart configuration object                    |
| `gradient`         | `boolean`                           | `true`   | Enable gradient fills                         |
| `interactive`      | `boolean`                           | `true`   | Enable interactive tooltips and hover effects |
| `animated`         | `boolean`                           | `true`   | Enable animations                             |
| `height`           | `number`                            | `300`    | Chart height in pixels                        |
| `className`        | `string`                            | -        | Additional CSS classes                        |
| `showGrid`         | `boolean`                           | `true`   | Show grid lines                               |
| `showLegend`       | `boolean`                           | `false`  | Show legend                                   |
| `showBrush`        | `boolean`                           | `false`  | Show brush for zoom/pan                       |
| `colors`           | `ChartColors`                       | -        | Custom color configuration                    |
| `onDataPointClick` | `(data: AnimatedChartData) => void` | -        | Callback when data point is clicked           |

### Sparkline Props

| Prop          | Type       | Default                 | Description                |
| ------------- | ---------- | ----------------------- | -------------------------- |
| `data`        | `number[]` | Required                | Array of numeric values    |
| `color`       | `string`   | `"hsl(var(--primary))"` | Line and fill color        |
| `height`      | `number`   | `40`                    | Sparkline height in pixels |
| `className`   | `string`   | -                       | Additional CSS classes     |
| `showTooltip` | `boolean`  | `true`                  | Show tooltip on hover      |
| `gradient`    | `boolean`  | `true`                  | Enable gradient fill       |

## Chart Configuration

The `config` prop defines how data keys are displayed:

```tsx
const config = {
  revenue: {
    label: "Revenue ($)",
    color: "hsl(var(--primary))",
  },
  leads: {
    label: "Leads",
    color: "hsl(var(--accent-start))",
  },
};
```

## Color Customization

You can customize colors using the `colors` prop:

```tsx
colors={{
  primary: "hsl(142 71% 45%)",      // Main line/bar color
  secondary: "hsl(142 71% 65%)",    // Secondary color
  gradient: {
    start: "hsl(142 71% 45%)",      // Gradient start color
    end: "hsl(142 71% 65%)",        // Gradient end color
  },
}}
```

## Animation Details

### Chart Container Animation

- **Initial**: Fades in from below with opacity 0
- **Duration**: 500ms
- **Easing**: ease-out

### Data Animation

- **Duration**: 1000ms
- **Easing**: ease-out
- **Behavior**: Animates from 0 to final value

### Tooltip Animation

- **Type**: Spring physics
- **Stiffness**: 300
- **Damping**: 25
- **Behavior**: Scales and fades in with slight upward motion

### Dot Animation

- **Type**: Spring physics
- **Stiffness**: 300
- **Damping**: 20
- **Hover**: Scales to 1.5x with glow effect

## Examples

### Dashboard Metric Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Total Revenue</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">$94,200</span>
        <Badge variant="outline">+12.5%</Badge>
      </div>
      <Sparkline
        data={[45, 52, 48, 61, 58, 72, 68, 85, 92, 88, 95, 102]}
        height={60}
        color="hsl(var(--primary))"
      />
    </div>
  </CardContent>
</Card>
```

### Full-Featured Chart

```tsx
<Card>
  <CardHeader>
    <CardTitle>Monthly Revenue</CardTitle>
    <CardDescription>
      Revenue performance over the last 12 months
    </CardDescription>
  </CardHeader>
  <CardContent>
    <AnimatedChart
      data={monthlyData}
      type="area"
      dataKey="revenue"
      xAxisKey="month"
      config={chartConfig}
      gradient={true}
      interactive={true}
      animated={true}
      height={400}
      showGrid={true}
      showBrush={true}
      onDataPointClick={(data) => console.log(data)}
    />
  </CardContent>
</Card>
```

## Accessibility

- All charts use semantic HTML and ARIA attributes
- Tooltips are keyboard accessible
- Colors meet WCAG contrast requirements
- Animations respect `prefers-reduced-motion`

## Performance

- Charts use `ResponsiveContainer` for efficient resizing
- Animations are GPU-accelerated using CSS transforms
- Data updates trigger smooth morphing animations
- Sparklines are optimized for dashboard use

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support with touch interactions

## Demo

Visit `/animated-chart-demo` to see all features in action.

## Requirements Validated

This component validates the following requirements from the UI/UX Enhancement spec:

- **25.1**: Animated, gradient-filled visualizations with smooth transitions
- **25.2**: Interactive tooltips with hover effects and detailed information
- **25.3**: Smooth number counting and chart morphing animations
- **25.6**: Zoom and pan capabilities through brush component
