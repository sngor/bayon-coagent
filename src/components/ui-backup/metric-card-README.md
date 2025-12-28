# Metric Card Component

Display key metrics with trends, sparklines, and visual indicators.

## Features

- **Animated Numbers**: Smooth counting animations
- **Trend Indicators**: Up/down arrows with percentage changes
- **Sparkline Integration**: Inline trend visualization
- **Multiple Formats**: Number, currency, percentage
- **Variant Styles**: Primary, success, warning, danger
- **Icon Support**: Display contextual icons
- **Prefix/Suffix**: Add custom text before/after values

## Usage

```tsx
import { MetricCard } from "@/components/ui/metric-card";
import { DollarSign } from "lucide-react";

<MetricCard
  value={485000}
  label="Average Property Value"
  format="currency"
  icon={<DollarSign className="h-5 w-5" />}
  changePercent={7.8}
  trendData={[450000, 460000, 470000, 475000, 485000]}
  showSparkline={true}
  showTrend={true}
  variant="primary"
/>;
```

## Props

- `value`: Numeric value to display
- `label`: Metric label/title
- `icon`: React node (typically Lucide icon)
- `decimals`: Number of decimal places (default: 0)
- `format`: 'number' | 'currency' | 'percentage'
- `prefix`: Text before value (e.g., '+')
- `suffix`: Text after value (e.g., '%')
- `changePercent`: Percentage change for trend indicator
- `trendData`: Array of numbers for sparkline
- `showSparkline`: Display sparkline chart (default: false)
- `showTrend`: Display trend indicator (default: false)
- `variant`: 'default' | 'primary' | 'success' | 'warning' | 'danger'
- `className`: Additional CSS classes

## Variants

- **default**: Standard background
- **primary**: Primary color gradient
- **success**: Green gradient (positive metrics)
- **warning**: Yellow gradient (caution metrics)
- **danger**: Red gradient (negative metrics)

## Integration

Used in:

- Dashboard (reputation metrics, statistics)
- Analytics pages
- Performance tracking
- KPI displays
