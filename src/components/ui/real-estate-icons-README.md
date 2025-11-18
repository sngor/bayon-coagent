# Real Estate Icon Set

A custom-designed icon set specifically created for real estate applications, featuring smooth Framer Motion animations and a consistent, professional style.

## Features

- **Custom Designs**: Icons specifically designed for real estate use cases
- **Animated Versions**: Smooth, spring-based animations using Framer Motion
- **Static Fallbacks**: Non-animated versions for performance-critical scenarios
- **Consistent Style**: Unified design language across all icons
- **Accessible**: Proper ARIA attributes and semantic HTML
- **Customizable**: Full control over size, color, and animation behavior

## Available Icons

### Navigation & Feature Icons

#### HouseIcon

Represents home, property, and real estate listings.

- **Use cases**: Navigation, property cards, home page
- **Animation**: Path drawing with spring entrance

#### ChartIcon

Represents market trends, statistics, and performance data.

- **Use cases**: Analytics, dashboard, reports
- **Animation**: Staggered bar growth animation

#### UsersIcon

Represents clients, contacts, and community.

- **Use cases**: Client management, team pages, contacts
- **Animation**: Sequential path drawing

#### ContentIcon

Represents blog posts, social media, and content creation.

- **Use cases**: Content engine, blog, marketing materials
- **Animation**: Document reveal with line drawing

#### ToolsIcon

Represents settings, utilities, and tools.

- **Use cases**: Settings, configuration, utilities
- **Animation**: Wrench rotation and path drawing

#### AISparkleIcon

Represents AI operations, intelligence, and automation.

- **Use cases**: AI features, automation, smart suggestions
- **Animation**: Continuous rotation with pulsing scale

### Success & Feedback Icons

#### SuccessIcon

Represents successful operations and achievements.

- **Use cases**: Success messages, completion states, celebrations
- **Animation**: Bouncy entrance with checkmark drawing

### Empty State Illustrations

#### EmptyStateHouseIcon

Illustrated icon for "no properties" scenarios.

- **Use cases**: Empty property lists, first-time user states
- **Style**: Friendly, professional illustration

#### EmptyStateContentIcon

Illustrated icon for "no content" scenarios.

- **Use cases**: Empty content lists, no documents
- **Style**: Document illustration with lines

#### EmptyStateChartIcon

Illustrated icon for "no data" scenarios.

- **Use cases**: Empty analytics, no metrics
- **Style**: Bar chart illustration with growth animation

## Usage

### Basic Usage

```tsx
import {
  HouseIcon,
  ChartIcon,
  AISparkleIcon,
} from "@/components/ui/real-estate-icons";

function MyComponent() {
  return (
    <div>
      {/* Animated icon (default) */}
      <HouseIcon className="w-8 h-8 text-primary" />

      {/* Static icon for performance */}
      <ChartIcon animated={false} className="w-6 h-6 text-muted-foreground" />

      {/* AI sparkle with custom size */}
      <AISparkleIcon className="w-12 h-12" />
    </div>
  );
}
```

### In Navigation

```tsx
import {
  HouseIcon,
  ChartIcon,
  UsersIcon,
  ContentIcon,
} from "@/components/ui/real-estate-icons";

const navItems = [
  { icon: HouseIcon, label: "Dashboard", href: "/dashboard" },
  { icon: ChartIcon, label: "Analytics", href: "/analytics" },
  { icon: UsersIcon, label: "Clients", href: "/clients" },
  { icon: ContentIcon, label: "Content", href: "/content" },
];

function Navigation() {
  return (
    <nav>
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
```

### In Empty States

```tsx
import { EmptyStateHouseIcon } from "@/components/ui/real-estate-icons";
import { Button } from "@/components/ui/button";

function EmptyPropertyList() {
  return (
    <div className="text-center py-12">
      <EmptyStateHouseIcon className="w-32 h-32 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
      <p className="text-muted-foreground mb-4">
        Get started by adding your first property listing
      </p>
      <Button>Add Property</Button>
    </div>
  );
}
```

### Success Feedback

```tsx
import { SuccessIcon } from "@/components/ui/real-estate-icons";

function SuccessMessage() {
  return (
    <div className="flex items-center gap-3">
      <SuccessIcon className="w-12 h-12 text-success" />
      <div>
        <h3 className="font-semibold">Success!</h3>
        <p className="text-sm text-muted-foreground">
          Your marketing plan has been generated
        </p>
      </div>
    </div>
  );
}
```

### AI Features

```tsx
import { AISparkleIcon } from "@/components/ui/real-estate-icons";

function AIFeatureCard() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-purple-600/10">
      <AISparkleIcon className="w-8 h-8" />
      <div>
        <h4 className="font-semibold">AI-Powered Insights</h4>
        <p className="text-sm text-muted-foreground">
          Get personalized recommendations
        </p>
      </div>
    </div>
  );
}
```

## Props

All icons accept the following props:

| Prop        | Type          | Default     | Description                  |
| ----------- | ------------- | ----------- | ---------------------------- |
| `animated`  | `boolean`     | `true`      | Enable/disable animations    |
| `className` | `string`      | `'w-6 h-6'` | Tailwind classes for styling |
| `...props`  | `LucideProps` | -           | All standard SVG props       |

## Animation Behavior

### Entrance Animations

- **Scale & Fade**: Icons scale from 0.8 to 1.0 with fade-in
- **Spring Physics**: Natural, bouncy motion using spring animations
- **Path Drawing**: SVG paths animate from 0 to full length

### Hover Animations

- **Scale Up**: Icons scale to 1.1 on hover
- **Spring Response**: Quick, responsive spring animation
- **Smooth Transitions**: All state changes are smooth

### Tap Animations

- **Scale Down**: Icons scale to 0.95 on tap/click
- **Immediate Feedback**: Instant visual response

### Continuous Animations

- **AI Sparkle**: Rotates 360° and pulses continuously
- **Smooth Loop**: Infinite animation with easing

## Performance Considerations

### When to Use Animated Icons

- ✅ Navigation items (limited number)
- ✅ Feature highlights
- ✅ Success/feedback messages
- ✅ Empty states
- ✅ Hero sections

### When to Use Static Icons

- ✅ Large lists (>20 items)
- ✅ Tables with many rows
- ✅ Repeated elements
- ✅ Mobile devices (battery consideration)
- ✅ Reduced motion preference

### Optimization Tips

```tsx
// Use static icons in lists
{
  items.map((item) => (
    <div key={item.id}>
      <HouseIcon animated={false} className="w-4 h-4" />
      {item.name}
    </div>
  ));
}

// Respect reduced motion preference
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

<HouseIcon animated={!prefersReducedMotion} />;
```

## Accessibility

All icons follow accessibility best practices:

- **Semantic HTML**: Proper SVG structure
- **Color Contrast**: Works with light and dark themes
- **Reduced Motion**: Can be disabled for accessibility
- **Screen Readers**: Use with proper ARIA labels

```tsx
<button aria-label="Go to dashboard">
  <HouseIcon className="w-5 h-5" />
</button>
```

## Customization

### Colors

Icons inherit the current text color via `currentColor`:

```tsx
{
  /* Primary color */
}
<HouseIcon className="text-primary" />;

{
  /* Success color */
}
<SuccessIcon className="text-success" />;

{
  /* Custom color */
}
<ChartIcon className="text-blue-600" />;

{
  /* Gradient (for filled icons) */
}
<AISparkleIcon className="text-transparent bg-gradient-to-r from-primary to-purple-600 bg-clip-text" />;
```

### Sizes

Use Tailwind width/height classes:

```tsx
{
  /* Small */
}
<HouseIcon className="w-4 h-4" />;

{
  /* Medium (default) */
}
<HouseIcon className="w-6 h-6" />;

{
  /* Large */
}
<HouseIcon className="w-8 h-8" />;

{
  /* Extra large */
}
<HouseIcon className="w-12 h-12" />;

{
  /* Custom size */
}
<HouseIcon className="w-[32px] h-[32px]" />;
```

### Animation Speed

Modify animation duration by wrapping in a motion component:

```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  <HouseIcon />
</motion.div>;
```

## Design Principles

1. **Consistency**: All icons follow the same visual style
2. **Clarity**: Simple, recognizable shapes
3. **Scalability**: Work well at any size
4. **Professionalism**: Appropriate for business use
5. **Delight**: Subtle animations add polish without distraction

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ⚠️ IE11 (static icons only, no animations)

## Related Components

- `lucide-react` - For additional generic icons
- `@/components/ui/button` - Buttons with icon support
- `@/components/ui/empty-states` - Empty state components
- `@/components/ui/loading-states` - Loading indicators

## Examples

See the icon demo page at `/real-estate-icons-demo` for live examples of all icons with different configurations.
