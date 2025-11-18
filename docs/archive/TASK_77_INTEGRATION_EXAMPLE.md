# Real Estate Icons - Integration Examples

## Quick Integration Guide

Here are practical examples of how to integrate the custom real estate icons into the existing application.

## 1. Update Navigation (Sidebar)

Replace generic icons in the sidebar navigation with custom real estate icons.

### Before (using lucide-react):

```tsx
import { Home, BarChart, Users, FileText } from "lucide-react";

const navItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: BarChart, label: "Analytics", href: "/analytics" },
  { icon: Users, label: "Clients", href: "/clients" },
  { icon: FileText, label: "Content", href: "/content" },
];
```

### After (using custom icons):

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

// In the navigation component:
{
  navItems.map((item) => (
    <Link key={item.href} href={item.href}>
      <item.icon animated={false} className="w-5 h-5" />
      <span>{item.label}</span>
    </Link>
  ));
}
```

**Note**: Use `animated={false}` in navigation for better performance.

## 2. Enhance Dashboard Cards

Add animated icons to dashboard feature cards.

### Example:

```tsx
import {
  AISparkleIcon,
  ChartIcon,
  ContentIcon,
} from "@/components/ui/real-estate-icons";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export function DashboardFeatures() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <AISparkleIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription>
                Get personalized recommendations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <ChartIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle>Market Analytics</CardTitle>
              <CardDescription>Track trends in real-time</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <ContentIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle>Content Engine</CardTitle>
              <CardDescription>Generate marketing content</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
```

## 3. Improve Empty States

Replace generic empty states with illustrated icons.

### Before:

```tsx
<div className="text-center py-12">
  <p className="text-muted-foreground">No properties found</p>
  <Button>Add Property</Button>
</div>
```

### After:

```tsx
import { EmptyStateHouseIcon } from "@/components/ui/real-estate-icons";
import { Button } from "@/components/ui/button";

<div className="text-center py-12">
  <EmptyStateHouseIcon className="w-32 h-32 mx-auto mb-4" />
  <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
    Get started by adding your first property listing to showcase to potential
    clients
  </p>
  <Button>
    <HouseIcon animated={false} className="w-4 h-4 mr-2" />
    Add Property
  </Button>
</div>;
```

## 4. Success Messages

Use the SuccessIcon for completion feedback.

### Example:

```tsx
import { SuccessIcon } from "@/components/ui/real-estate-icons";
import { toast } from "@/hooks/use-toast";

// When an operation completes successfully:
function handleSuccess() {
  toast({
    title: (
      <div className="flex items-center gap-3">
        <SuccessIcon className="w-8 h-8 text-success" />
        <span>Success!</span>
      </div>
    ),
    description: "Your marketing plan has been generated",
  });
}
```

## 5. Page Headers

Add icons to page headers for visual interest.

### Example:

```tsx
import { ContentIcon } from "@/components/ui/real-estate-icons";
import { PageHeader } from "@/components/page-header";

export default function ContentEnginePage() {
  return (
    <div>
      <PageHeader
        icon={<ContentIcon className="w-10 h-10 text-primary" />}
        title="Content Engine"
        description="Generate high-quality marketing content with AI"
      />
      {/* Page content */}
    </div>
  );
}
```

## 6. Loading States

Combine with loading states for better UX.

### Example:

```tsx
import { AISparkleIcon } from "@/components/ui/real-estate-icons";
import { Card } from "@/components/ui/card";

export function AILoadingState() {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center gap-4">
        <AISparkleIcon className="w-16 h-16 text-primary" />
        <div className="text-center">
          <h3 className="font-semibold mb-1">AI is working...</h3>
          <p className="text-sm text-muted-foreground">
            Generating your personalized marketing plan
          </p>
        </div>
      </div>
    </Card>
  );
}
```

## 7. Feature Highlights

Use icons to highlight key features on landing pages.

### Example:

```tsx
import {
  HouseIcon,
  ChartIcon,
  UsersIcon,
  AISparkleIcon,
} from "@/components/ui/real-estate-icons";

const features = [
  {
    icon: HouseIcon,
    title: "Property Management",
    description: "Manage all your listings in one place",
  },
  {
    icon: ChartIcon,
    title: "Market Analytics",
    description: "Track market trends and performance",
  },
  {
    icon: UsersIcon,
    title: "Client Management",
    description: "Build and maintain client relationships",
  },
  {
    icon: AISparkleIcon,
    title: "AI-Powered Tools",
    description: "Leverage AI for marketing automation",
  },
];

export function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((feature) => (
        <div key={feature.title} className="text-center">
          <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
            <feature.icon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">{feature.title}</h3>
          <p className="text-sm text-muted-foreground">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## 8. Buttons with Icons

Add icons to buttons for better visual hierarchy.

### Example:

```tsx
import {
  HouseIcon,
  ContentIcon,
  ChartIcon,
} from "@/components/ui/real-estate-icons";
import { Button } from "@/components/ui/button";

<div className="flex gap-3">
  <Button>
    <HouseIcon animated={false} className="w-4 h-4 mr-2" />
    Add Property
  </Button>

  <Button variant="outline">
    <ContentIcon animated={false} className="w-4 h-4 mr-2" />
    Create Content
  </Button>

  <Button variant="ghost">
    <ChartIcon animated={false} className="w-4 h-4 mr-2" />
    View Analytics
  </Button>
</div>;
```

## 9. Settings/Tools Pages

Use ToolsIcon for settings and configuration pages.

### Example:

```tsx
import { ToolsIcon } from "@/components/ui/real-estate-icons";

export default function SettingsPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ToolsIcon className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      {/* Settings content */}
    </div>
  );
}
```

## 10. Responsive Behavior

Adjust icon sizes for different screen sizes.

### Example:

```tsx
import { HouseIcon } from "@/components/ui/real-estate-icons";

<div className="flex items-center gap-2">
  {/* Small on mobile, larger on desktop */}
  <HouseIcon className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-primary" />
  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Dashboard</h1>
</div>;
```

## Performance Tips

### 1. Use Static Icons in Lists

```tsx
// ❌ Bad: Animated icons in a long list
{
  items.map((item) => (
    <div key={item.id}>
      <HouseIcon className="w-4 h-4" /> {/* animated by default */}
      {item.name}
    </div>
  ));
}

// ✅ Good: Static icons for better performance
{
  items.map((item) => (
    <div key={item.id}>
      <HouseIcon animated={false} className="w-4 h-4" />
      {item.name}
    </div>
  ));
}
```

### 2. Respect Reduced Motion

```tsx
import { useReducedMotion } from "framer-motion";
import { HouseIcon } from "@/components/ui/real-estate-icons";

function MyComponent() {
  const prefersReducedMotion = useReducedMotion();

  return <HouseIcon animated={!prefersReducedMotion} className="w-8 h-8" />;
}
```

### 3. Lazy Load Icons

```tsx
import dynamic from "next/dynamic";

// Lazy load illustrated icons for empty states
const EmptyStateHouseIcon = dynamic(
  () =>
    import("@/components/ui/real-estate-icons").then((mod) => ({
      default: mod.EmptyStateHouseIcon,
    })),
  { ssr: false }
);
```

## Migration Checklist

When migrating from generic icons to custom real estate icons:

- [ ] Update navigation icons
- [ ] Replace dashboard card icons
- [ ] Enhance empty states with illustrated icons
- [ ] Add icons to page headers
- [ ] Update button icons
- [ ] Add success icons to feedback messages
- [ ] Use AI sparkle for AI features
- [ ] Test performance with multiple animated icons
- [ ] Verify accessibility
- [ ] Test in light and dark modes
- [ ] Check responsive behavior
- [ ] Update documentation

## Common Patterns

### Icon + Text Pattern

```tsx
<div className="flex items-center gap-2">
  <HouseIcon animated={false} className="w-5 h-5 text-primary" />
  <span className="font-medium">Dashboard</span>
</div>
```

### Icon in Circle Pattern

```tsx
<div className="inline-flex p-3 rounded-full bg-primary/10">
  <ChartIcon className="w-6 h-6 text-primary" />
</div>
```

### Icon with Badge Pattern

```tsx
<div className="relative">
  <HouseIcon className="w-8 h-8 text-primary" />
  <Badge className="absolute -top-1 -right-1">3</Badge>
</div>
```

## Conclusion

The custom real estate icon set provides a distinctive, professional visual identity for the application. Use these integration examples as a starting point, and adapt them to fit your specific needs.

For more details, see:

- `src/components/ui/real-estate-icons-README.md` - Complete documentation
- `/real-estate-icons-demo` - Interactive demo page
- `TASK_77_VISUAL_VERIFICATION.md` - Testing checklist
