# TabToggle Component

A reusable animated tab component with sliding indicator, perfect for admin interfaces and feature toggles.

## Features

- ✨ Animated sliding indicator
- 🎨 Consistent styling with calculator tabs
- 🔧 Support for icons and badges
- ♿ Full accessibility support
- 📱 Responsive design

## Usage

```tsx
import { TabToggle, TabToggleContent } from "@/components/ui/tab-toggle";
import { Zap, Beaker, Target } from "lucide-react";

export function MyAdminPage() {
  return (
    <TabToggle
      defaultValue="features"
      tabs={[
        { value: "features", label: "Features", icon: Zap },
        { value: "beta", label: "Beta", icon: Beaker, badge: 3 },
        { value: "experiments", label: "A/B Tests", icon: Target },
      ]}
    >
      <TabToggleContent value="features">
        <div>Features content...</div>
      </TabToggleContent>

      <TabToggleContent value="beta">
        <div>Beta content...</div>
      </TabToggleContent>

      <TabToggleContent value="experiments">
        <div>Experiments content...</div>
      </TabToggleContent>
    </TabToggle>
  );
}
```

## Props

### TabToggle

| Prop            | Type                      | Default | Description                 |
| --------------- | ------------------------- | ------- | --------------------------- |
| `tabs`          | `TabToggleItem[]`         | -       | Array of tab configurations |
| `defaultValue`  | `string`                  | -       | Initial active tab value    |
| `value`         | `string`                  | -       | Controlled active tab value |
| `onValueChange` | `(value: string) => void` | -       | Callback when tab changes   |
| `children`      | `ReactNode`               | -       | Tab content components      |
| `className`     | `string`                  | -       | Additional CSS classes      |

### TabToggleItem

| Prop    | Type                                  | Description                   |
| ------- | ------------------------------------- | ----------------------------- |
| `value` | `string`                              | Unique identifier for the tab |
| `label` | `string`                              | Display text for the tab      |
| `icon`  | `ComponentType<{className?: string}>` | Optional Lucide icon          |
| `badge` | `number \| string`                    | Optional badge content        |

## Examples

### Basic Usage

```tsx
<TabToggle
  defaultValue="overview"
  tabs={[
    { value: "overview", label: "Overview" },
    { value: "settings", label: "Settings" },
  ]}
>
  {/* Content */}
</TabToggle>
```

### With Icons and Badges

```tsx
<TabToggle
  defaultValue="users"
  tabs={[
    { value: "users", label: "All Users", icon: Users, badge: 150 },
    { value: "active", label: "Active", icon: Activity, badge: "12" },
    { value: "premium", label: "Premium", icon: Crown },
  ]}
>
  {/* Content */}
</TabToggle>
```

### Controlled Component

```tsx
const [activeTab, setActiveTab] = useState("dashboard");

<TabToggle
  value={activeTab}
  onValueChange={setActiveTab}
  tabs={[
    { value: "dashboard", label: "Dashboard" },
    { value: "analytics", label: "Analytics" },
  ]}
>
  {/* Content */}
</TabToggle>;
```
