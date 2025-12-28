# Component Reference

Complete reference for UI components in the Bayon CoAgent platform.

## 🎨 shadcn/ui Components

### Form Components

#### Button

```typescript
import { Button } from "@/components/ui/button";

<Button variant="default" size="default">
  Click me
</Button>;

// Variants: default, primary, success, warning, destructive, outline, ghost, link, ai
// Sizes: default, sm, lg, icon, xs
```

#### Input

```typescript
import { Input } from "@/components/ui/input";

<Input type="text" placeholder="Enter text..." className="w-full" />;
```

#### Textarea

```typescript
import { Textarea } from "@/components/ui/textarea";

<Textarea placeholder="Enter description..." rows={4} />;
```

#### Select

```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>;
```

#### Checkbox

```typescript
import { Checkbox } from "@/components/ui/checkbox";

<Checkbox id="terms" />
<label htmlFor="terms">Accept terms</label>
```

#### Radio Group

```typescript
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

<RadioGroup defaultValue="option1">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="r1" />
    <Label htmlFor="r1">Option 1</Label>
  </div>
</RadioGroup>;
```

#### Switch

```typescript
import { Switch } from "@/components/ui/switch";

<Switch id="notifications" />
<Label htmlFor="notifications">Enable notifications</Label>
```

#### Slider

```typescript
import { Slider } from "@/components/ui/slider";

<Slider defaultValue={[50]} max={100} step={1} className="w-full" />;
```

### Layout Components

#### Card

```typescript
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>;
```

#### Separator

```typescript
import { Separator } from "@/components/ui/separator";

<div>
  <p>Content above</p>
  <Separator className="my-4" />
  <p>Content below</p>
</div>;
```

#### Scroll Area

```typescript
import { ScrollArea } from "@/components/ui/scroll-area";

<ScrollArea className="h-72 w-48 rounded-md border">
  <div className="p-4">{/* Scrollable content */}</div>
</ScrollArea>;
```

### Navigation Components

#### Tabs (Use AnimatedTabs)

```typescript
import {
  AnimatedTabs as Tabs,
  AnimatedTabsContent as TabsContent,
  AnimatedTabsList as TabsList,
  AnimatedTabsTrigger as TabsTrigger,
} from "@/components/ui/animated-tabs";

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    <p>Tab 1 content</p>
  </TabsContent>
  <TabsContent value="tab2">
    <p>Tab 2 content</p>
  </TabsContent>
</Tabs>;
```

#### Dropdown Menu

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Open</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
    <DropdownMenuItem>Item 2</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>;
```

#### Menubar

```typescript
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";

<Menubar>
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>New</MenubarItem>
      <MenubarItem>Open</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>;
```

### Feedback Components

#### Alert Dialog

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>;
```

#### Dialog

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>;
```

#### Toast

```typescript
import { useToast } from "@/hooks/use-toast";

function Component() {
  const { toast } = useToast();

  return (
    <Button
      onClick={() => {
        toast({
          title: "Success",
          description: "Operation completed successfully",
        });
      }}
    >
      Show Toast
    </Button>
  );
}
```

#### Tooltip

```typescript
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline">Hover me</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Tooltip content</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>;
```

#### Progress

```typescript
import { Progress } from "@/components/ui/progress";

<Progress value={33} className="w-full" />;
```

### Display Components

#### Avatar

```typescript
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

<Avatar>
  <AvatarImage src="/avatar.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>;
```

#### Badge

```typescript
import { Badge } from "@/components/ui/badge";

<Badge variant="default">Badge</Badge>;
// Variants: default, secondary, destructive, outline
```

#### Accordion

```typescript
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Question 1</AccordionTrigger>
    <AccordionContent>Answer 1</AccordionContent>
  </AccordionItem>
</Accordion>;
```

#### Collapsible

```typescript
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

<Collapsible>
  <CollapsibleTrigger>Toggle</CollapsibleTrigger>
  <CollapsibleContent>Collapsible content</CollapsibleContent>
</Collapsible>;
```

## 🏠 Hub Components

### Hub Layout

```typescript
import { HubLayout } from "@/components/hub/hub-layout";

<HubLayout title="Hub Title" description="Hub description" icon={<Icon />}>
  {children}
</HubLayout>;
```

### Hub Tabs

```typescript
import { HubTabs } from "@/components/hub/hub-tabs";

<HubTabs
  tabs={[
    { id: "tab1", label: "Tab 1", href: "/hub/tab1", icon: User },
    { id: "tab2", label: "Tab 2", href: "/hub/tab2", badge: 5 },
  ]}
  variant="pills"
  isSticky={true}
/>;
```

### Hub Header

```typescript
import { HubHeader } from "@/components/hub/hub-header";

<HubHeader
  title="Hub Title"
  description="Hub description"
  icon={<Icon />}
  actions={<Button>Action</Button>}
/>;
```

### Hub Breadcrumbs

```typescript
import { HubBreadcrumbs } from "@/components/hub/hub-breadcrumbs";

<HubBreadcrumbs
  items={[
    { label: "Home", href: "/" },
    { label: "Hub", href: "/hub" },
    { label: "Current Page" },
  ]}
/>;
```

## 🎯 Custom Components

### Search Input

```typescript
import { SearchInput } from "@/components/ui/search-input";

<SearchInput
  placeholder="Search..."
  onSearch={(query) => console.log(query)}
  debounceMs={300}
/>;
```

### Metric Card

```typescript
import { MetricCard } from "@/components/ui/metric-card";

<MetricCard
  title="Total Revenue"
  value={125000}
  format="currency"
  trend={{ value: 12, direction: "up" }}
  sparklineData={[100, 120, 110, 125]}
/>;
```

### Sparkline

```typescript
import { Sparkline } from "@/components/ui/sparkline";

<Sparkline
  data={[1, 5, 3, 8, 2, 7, 4]}
  type="line"
  color="blue"
  className="w-20 h-8"
/>;
```

### Intelligent Empty State

```typescript
import { IntelligentEmptyState } from "@/components/ui/intelligent-empty-state";

<IntelligentEmptyState
  icon={<FileIcon />}
  title="No content yet"
  description="Create your first piece of content to get started"
  action={{
    label: "Create Content",
    onClick: () => navigate("/studio/write"),
  }}
  variant="card"
/>;
```

### Usage Tracking

```typescript
import { UsageTracking } from "@/components/ui/usage-tracking";

<UsageTracking
  title="API Usage"
  current={750}
  limit={1000}
  period="monthly"
  resetDate="2024-02-01"
/>;
```

### Profile Completion Banner

```typescript
import { ProfileCompletionBanner } from "@/components/profile-completion-banner";

<ProfileCompletionBanner
  completionPercentage={75}
  missingFields={["phone", "bio"]}
  variant="banner"
/>;
```

## 🎨 Real Estate Icons

### Custom Icons

```typescript
import {
  ContentIcon,
  AISparkleIcon,
  RealEstateIcon
} from "@/components/ui/real-estate-icons";

<ContentIcon className="w-6 h-6" />
<AISparkleIcon className="w-6 h-6 animate-pulse" />
<RealEstateIcon className="w-6 h-6" />
```

## 📊 Data Display Components

### Market Insights Components

#### Market Insights Filters

```typescript
import { MarketInsightsFilters } from "@/components/market-insights/market-insights-filters";

<MarketInsightsFilters
  filters={{ location: 'Seattle, WA', timeframe: '3months' }}
  onFiltersChange={(filters) => setFilters(filters)}
  onAnalyze={() => analyzeMarket()}
/>
```

#### Market Trends Tab

```typescript
import { MarketTrendsTab } from "@/components/market-insights/market-trends-tab";

<MarketTrendsTab trends={marketTrends} />
```

#### Life Events Tab

```typescript
import { LifeEventsTab } from "@/components/market-insights/life-events-tab";

<LifeEventsTab lifeEvents={lifeEventPredictions} />
```

#### Market Stats Cards

```typescript
import { MarketStatsCards } from "@/components/market-insights/market-stats-cards";

<MarketStatsCards />
```

### Responsive Table

```typescript
import { ResponsiveTable } from "@/components/ui/responsive-table";

<ResponsiveTable
  data={tableData}
  columns={[
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email" },
    {
      key: "status",
      label: "Status",
      render: (value) => <Badge>{value}</Badge>,
    },
  ]}
  mobileCardRender={(item) => (
    <Card>
      <CardContent>
        <h3>{item.name}</h3>
        <p>{item.email}</p>
      </CardContent>
    </Card>
  )}
/>;
```

### Virtual Scroll

```typescript
import { VirtualScroll } from "@/components/ui/virtual-scroll";

<VirtualScroll
  items={largeDataSet}
  itemHeight={60}
  containerHeight={400}
  renderItem={({ item, index }) => (
    <div key={index} className="p-4 border-b">
      {item.name}
    </div>
  )}
/>;
```

## 🎭 Animation Components

### Animated Number

```typescript
import { AnimatedNumber } from "@/components/ui/animated-number";

<AnimatedNumber value={1250} format="currency" duration={1000} />;
```

### Celebration

```typescript
import { Celebration } from "@/components/ui/celebration";

<Celebration trigger={showCelebration} type="confetti" duration={3000} />;
```

### Loading States

```typescript
import { AILoadingState } from "@/components/ai-loading-state";

<AILoadingState
  operation="blog-post-generation"
  stage="generating"
  progress={45}
  message="Creating your blog post..."
/>;
```

## 🔧 Utility Components

### Error Boundary

```typescript
import { ErrorBoundary, AIErrorBoundary } from "@/components/error-boundary";

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

<AIErrorBoundary>
  <AIComponent />
</AIErrorBoundary>
```

### Contextual Tooltip

```typescript
import { ContextualTooltip } from "@/components/ui/contextual-tooltip";

<ContextualTooltip
  content="This helps you create better content"
  context="content-creation"
  placement="top"
>
  <Button>Create Content</Button>
</ContextualTooltip>;
```

## 📱 Mobile Components

### Mobile Optimized Components

All components are mobile-optimized by default. Use these hooks for responsive behavior:

```typescript
import { useMobile, useTablet } from "@/hooks/use-mobile";

function ResponsiveComponent() {
  const isMobile = useMobile();
  const isTablet = useTablet();

  if (isMobile) {
    return <MobileLayout />;
  }

  if (isTablet) {
    return <TabletLayout />;
  }

  return <DesktopLayout />;
}
```

## 🎨 Styling Guidelines

### Component Styling

```typescript
// Use cn() utility for conditional classes
import { cn } from "@/lib/utils";

<Button
  className={cn(
    "base-styles",
    variant === "primary" && "primary-styles",
    disabled && "disabled-styles"
  )}
>
  Button
</Button>;
```

### Design Tokens

```typescript
// Use CSS variables for consistent theming
<div className="bg-background text-foreground border-border">
  Content
</div>

// Color palette
<div className="bg-primary text-primary-foreground">Primary</div>
<div className="bg-secondary text-secondary-foreground">Secondary</div>
<div className="bg-muted text-muted-foreground">Muted</div>
```

### Animation Classes

```typescript
// Use predefined animation classes
<div className="animate-fade-in">Fade in</div>
<div className="animate-slide-up">Slide up</div>
<div className="animate-pulse">Pulse</div>
<div className="animate-spin">Spin</div>
```

## 🔍 Component Development

### Creating New Components

1. **Use TypeScript** for all components
2. **Export from index** for clean imports
3. **Include JSDoc** for documentation
4. **Add Storybook stories** for testing
5. **Follow naming conventions**

```typescript
// components/ui/my-component.tsx
interface MyComponentProps {
  /** Component title */
  title: string;
  /** Optional description */
  description?: string;
  /** Click handler */
  onClick?: () => void;
}

export function MyComponent({ title, description, onClick }: MyComponentProps) {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="text-muted-foreground">{description}</p>}
      {onClick && <Button onClick={onClick}>Action</Button>}
    </div>
  );
}
```

### Component Testing

```typescript
// __tests__/my-component.test.tsx
import { render, screen } from "@testing-library/react";
import { MyComponent } from "../my-component";

test("renders component with title", () => {
  render(<MyComponent title="Test Title" />);
  expect(screen.getByText("Test Title")).toBeInTheDocument();
});
```

This component reference provides a comprehensive guide to all available UI components in the Bayon CoAgent platform.
