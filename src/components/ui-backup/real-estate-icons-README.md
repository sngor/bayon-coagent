# Real Estate Icons

Custom SVG icons designed specifically for real estate applications.

## Features

- **Industry-Specific**: Icons tailored for real estate use cases
- **Lucide-Compatible**: Same API as Lucide icons
- **Scalable**: SVG-based for crisp rendering at any size
- **Customizable**: Support for color, size, and className props
- **Animated Variants**: Some icons support animation prop

## Available Icons

### Property Icons

- `HouseKey` - House with key (property access)
- `OpenHouse` - Open house event
- `ForSale` - Property for sale
- `Sold` - Sold property
- `Listing` - Property listing

### Search & Discovery

- `PropertySearch` - Property search
- `Neighborhood` - Neighborhood/community
- `VirtualTour` - Virtual tour

### Financial

- `Mortgage` - Mortgage/financing
- `PropertyValue` - Property valuation

### Special Icons

- `ContentIcon` - Content/document icon (with animation support)
- `AISparkleIcon` - AI/sparkle icon (with animation support)

## Usage

```tsx
import { HouseKey, PropertySearch, AISparkleIcon } from '@/components/ui/real-estate-icons';

// Basic usage
<HouseKey className="h-6 w-6" />

// With color
<PropertySearch className="h-6 w-6 text-primary" />

// Animated
<AISparkleIcon animated={true} className="h-6 w-6 text-primary" />
```

## Props

All icons accept standard Lucide icon props:

- `className`: CSS classes for styling
- `size`: Icon size (number or string)
- `color`: Stroke color
- `strokeWidth`: Line thickness

Special icons (`ContentIcon`, `AISparkleIcon`) also accept:

- `animated`: Boolean to enable pulse animation

## Integration

Used throughout the application:

- Dashboard (content and AI indicators)
- Navigation icons
- Feature cards
- Empty states
- Marketing materials
