# Component Library

Comprehensive guide to all reusable components in the Bayon Coagent application.

## Table of Contents

1. [Shared Components](#shared-components) ⭐ **Start Here**
2. [Hub Components](#hub-components)
3. [Standard Components](#standard-components)
4. [UI Components (shadcn/ui)](#ui-components)
5. [Feature Components](#feature-components)
6. [Layout Components](#layout-components)
7. [Utility Components](#utility-components)
8. [Usage Guidelines](#usage-guidelines)

---

## Shared Components

**⭐ Use these first!** Standardized, reusable components that eliminate duplication and ensure consistency.

Located in `/src/components/shared` - [Full Guide](./standardization-guide.md)

### AIFormWrapper

Standardized layout for AI generation forms with input/output split view.

```tsx
import { AIFormWrapper, useAIGeneration } from "@/components/shared";

const { output, isLoading, error, generate, copied, copyToClipboard } =
  useAIGeneration({
    onGenerate: async (input) => await generateAction(input),
  });

<AIFormWrapper
  formTitle="Generate Content"
  formContent={<form>{/* fields */}</form>}
  output={output || ""}
  isLoading={isLoading}
  error={error}
  onCopy={() => copyToClipboard(output || "")}
  copied={copied}
/>;
```

### useAIGeneration Hook

Reusable hook for AI workflows with automatic error handling, toasts, and engaging loading messages.

```tsx
import { useAIGeneration } from "@/components/shared";
import { getLoadingMessages } from "@/lib/loading-messages";

const {
  output,
  isLoading,
  error,
  generate,
  reset,
  copied,
  copyToClipboard,
  currentLoadingMessage,
} = useAIGeneration({
  onGenerate: async (input) => await myAction(input),
  successTitle: "Generated!",
  errorTitle: "Failed",
  loadingMessages: getLoadingMessages("blogPost"), // Contextual messages
});

// Use currentLoadingMessage in your UI
{
  isLoading && <p>{currentLoadingMessage}</p>;
}
```

**Available Loading Message Types:**

- `blogPost` - Blog post generation
- `socialMedia` - Social media content
- `listingDescription` - Property descriptions
- `marketUpdate` - Market updates
- `videoScript` - Video scripts
- `neighborhoodGuide` - Neighborhood guides
- `research` - Research reports
- `strategy` - Marketing strategy
- `competitors` - Competitor analysis
- `imageProcessing` - Image enhancements
- `default` - Generic messages

### FormSection

Standardized form section with icon and consistent styling.

```tsx
import { FormSection, FormSectionGroup } from "@/components/shared";

<FormSectionGroup title="Settings">
  <FormSection
    title="Profile"
    description="Your information"
    icon={<User className="h-5 w-5" />}
  >
    {/* form fields */}
  </FormSection>
</FormSectionGroup>;
```

### ActionButtons

Consistent button patterns with presets for common actions.

```tsx
import { ActionButtons, ActionButtonPresets } from "@/components/shared";

<ActionButtons
  {...ActionButtonPresets.generateAI}
  onPrimaryClick={handleGenerate}
  primaryLoading={isLoading}
  onCopy={handleCopy}
  onSave={handleSave}
  copied={copied}
/>;
```

### DataTable

Responsive table with sorting, search, and mobile card view.

```tsx
import { DataTable } from "@/components/shared";

<DataTable
  data={items}
  columns={[
    { key: "name", label: "Name", sortable: true },
    {
      key: "status",
      label: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
  ]}
  actions={[
    { label: "Edit", onClick: handleEdit },
    { label: "Delete", onClick: handleDelete, variant: "destructive" },
  ]}
  searchable
/>;
```

### StatusBadge

Consistent status badges with predefined colors and icons.

```tsx
import { StatusBadge } from '@/components/shared';

<StatusBadge status="published" />
<StatusBadge status="draft" />
<StatusBadge status="processing" />
```

**Statuses:** success, error, warning, info, pending, processing, active, inactive, draft, published

### ConfirmationDialog

Standardized confirmation for destructive actions.

```tsx
import { ConfirmationDialog } from "@/components/shared";

<ConfirmationDialog
  open={open}
  onOpenChange={setOpen}
  title="Delete Item"
  description="This cannot be undone"
  onConfirm={handleDelete}
  variant="destructive"
  loading={loading}
/>;
```

---

## Hub Components

Hub components provide consistent navigation and layout across all feature hubs (Studio, Brand, Market, Library).

### HubLayout

Main layout wrapper for all hub pages with header, tabs, and content area. Provides consistent structure across all feature hubs with sticky header behavior and tab navigation.

```tsx
import { HubLayout } from "@/components/hub";
import { Palette } from "lucide-react";

<HubLayout
  title="Brand"
  description="Build authority and stand out"
  icon={Palette}
  tabs={[
    { id: "profile", label: "Profile", href: "/brand/profile" },
    { id: "audit", label: "Audit", href: "/brand/audit" },
  ]}
  tabsVariant="pills"
  actions={<Button>Action</Button>}
>
  {children}
</HubLayout>;
```

**Props:**

- `title` (string): Hub title displayed in header
- `description` (string, optional): Hub description text
- `icon` (LucideIcon): Hub icon for header and sticky navigation
- `tabs` (HubTab[], optional): Tab configuration for hub navigation
- `tabsVariant` ('default' | 'pills' | 'underline', optional): Tab visual style (default: 'default')
- `actions` (ReactNode, optional): Action buttons displayed in header
- `children` (ReactNode): Hub content

**Features:**

- **Sticky Header Integration**: Automatically updates sticky header when scrolling
- **Responsive Design**: Adapts to mobile and tablet layouts
- **Tab Navigation**: Integrated HubTabs with variant support
- **Intersection Observer**: Detects when header is covered for sticky behavior
- **Performance Optimized**: Memoized components and minimal re-renders

**Common Usage Patterns:**

```tsx
// Most hubs use pills variant
<HubLayout
  title="Studio"
  description="Turn ideas into polished content"
  icon={Wand2}
  tabs={studioTabs}
  tabsVariant="pills"
>
  {children}
</HubLayout>

// Simple hub without tabs
<HubLayout
  title="Dashboard"
  description="Your command center"
  icon={Home}
>
  {children}
</HubLayout>
```

### HubTabs

Horizontal tab navigation with keyboard support, active state management, multiple visual variants, and scroll indicators for mobile.

```tsx
import { HubTabs } from "@/components/hub";

<HubTabs
  tabs={tabs}
  activeTab="profile"
  onChange={(tabId) => console.log(tabId)}
  variant="pills"
  isSticky={true}
/>;
```

**Props:**

- `tabs` (HubTab[]): Array of tab objects with id, label, href, optional icon and badge
- `activeTab` (string, optional): Currently active tab ID (auto-detected from pathname if not provided)
- `onChange` (function, optional): Tab change handler (uses router navigation if not provided)
- `variant` ('default' | 'pills' | 'underline', optional): Visual style variant (default: 'default')
- `isSticky` (boolean, optional): Whether to apply sticky styling with backdrop blur and border

**Variants:**

- **default**: Rounded pill-style tabs with background colors
- **pills**: Same as default (alias for consistency)
- **underline**: Minimal tabs with bottom border indicators

**Features:**

- **Keyboard Navigation**: Arrow keys to navigate between tabs
- **Auto-detection**: Automatically determines active tab from current pathname
- **Scroll Indicators**: Shows gradient indicators when tabs overflow horizontally
- **Accessibility**: Full ARIA support with proper roles and labels
- **Performance**: Memoized calculations and event handlers to prevent unnecessary re-renders
- **Mobile Optimized**: Horizontal scrolling with touch support and visual indicators
- **Multiple Variants**: Support for different visual styles to match design needs

**Tab Object Structure:**

```tsx
interface HubTab {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: number | string;
}
```

**Usage Examples:**

```tsx
// Pills variant (most common in hubs)
<HubTabs tabs={brandTabs} variant="pills" />

// Underline variant (minimal style)
<HubTabs tabs={settingsTabs} variant="underline" />

// With sticky behavior
<HubTabs tabs={tabs} variant="pills" isSticky={true} />
```

### HubHeader

Header section with title, description, icon, and action buttons.

```tsx
import { HubHeader } from "@/components/hub";
import { Palette } from "lucide-react";

<HubHeader
  title="Brand Profile"
  description="Manage your professional information"
  icon={Palette}
  actions={<Button>Save</Button>}
/>;
```

### HubBreadcrumbs

Breadcrumb navigation for hierarchical pages.

```tsx
import { HubBreadcrumbs } from "@/components/hub";

<HubBreadcrumbs
  items={[
    { label: "Brand", href: "/brand" },
    { label: "Profile", href: "/brand/profile" },
    { label: "Edit" },
  ]}
/>;
```

---

## Standard Components

Standardized components with consistent styling and behavior patterns.

### StandardPageLayout

Full-page layout with title, description, breadcrumbs, and action area.

```tsx
import { StandardPageLayout } from "@/components/standard";

<StandardPageLayout
  title="Page Title"
  description="Page description"
  breadcrumbs={[{ label: "Home", href: "/" }]}
  actions={<Button>Action</Button>}
  maxWidth="default"
  spacing="default"
>
  {content}
</StandardPageLayout>;
```

**Props:**

- `title` (string): Page title
- `description` (string, optional): Page description
- `breadcrumbs` (BreadcrumbItem[], optional): Breadcrumb items
- `actions` (ReactNode, optional): Action buttons
- `maxWidth` ('default' | 'wide' | 'full'): Content width
- `spacing` ('default' | 'compact' | 'spacious'): Vertical spacing

### StandardCard

Flexible card component with multiple variants and states.

```tsx
import { StandardCard } from "@/components/standard";

<StandardCard
  title="Card Title"
  description="Card description"
  variant="interactive"
  padding="default"
  footer={<Button>Action</Button>}
  isLoading={false}
>
  {content}
</StandardCard>;
```

**Variants:**

- `default`: Standard card with border
- `interactive`: Hover effects and cursor pointer
- `elevated`: Shadow elevation
- `flat`: No border or shadow

### StandardFormField

Form field wrapper with label, error handling, and help text.

```tsx
import { StandardFormField } from "@/components/standard";

<StandardFormField
  label="Email"
  id="email"
  error="Invalid email"
  helpText="We'll never share your email"
  required
>
  <Input id="email" type="email" />
</StandardFormField>;
```

### StandardFormActions

Consistent form action buttons with primary/secondary patterns.

```tsx
import { StandardFormActions } from "@/components/standard";

<StandardFormActions
  primaryAction={{
    label: "Save",
    onClick: handleSave,
    isLoading: saving,
    variant: "default",
  }}
  secondaryAction={{
    label: "Cancel",
    onClick: handleCancel,
  }}
  alignment="right"
/>;
```

### StandardLoadingSpinner

Loading indicator with multiple sizes and variants.

```tsx
import { StandardLoadingSpinner } from "@/components/standard";

<StandardLoadingSpinner
  size="md"
  variant="default"
  text="Loading..."
  fullScreen={false}
/>;
```

**Variants:**

- `default`: Standard spinner
- `overlay`: Full-screen overlay with backdrop
- `ai`: AI-themed spinner with gradient

### StandardSkeleton

Skeleton loading states for different content types.

```tsx
import { StandardSkeleton } from "@/components/standard";

<StandardSkeleton variant="card" count={3} />;
```

**Variants:**

- `card`: Card skeleton
- `list`: List item skeleton
- `form`: Form field skeleton
- `content`: Content block skeleton
- `metric`: Metric card skeleton

### StandardEmptyState

Empty state displays with icon, title, description, and action.

```tsx
import { StandardEmptyState } from "@/components/standard";
import { FileText } from "lucide-react";

<StandardEmptyState
  icon={FileText}
  title="No content yet"
  description="Create your first piece of content"
  action={{
    label: "Create Content",
    onClick: handleCreate,
  }}
  variant="default"
/>;
```

### StandardErrorDisplay

Error message display with retry functionality.

```tsx
import { StandardErrorDisplay } from "@/components/standard";

<StandardErrorDisplay
  title="Error"
  message="Failed to load data"
  variant="error"
  onRetry={handleRetry}
  showRetry
/>;
```

---

## UI Components (shadcn/ui)

Base UI primitives built on Radix UI. These are the foundation of the design system.

### Core Components

#### Button

Enhanced button component with neumorphic design that provides tactile feedback and depth.

```tsx
import { Button } from "@/components/ui/button";

<Button variant="default" size="default">
  Click me
</Button>;

// AI-themed button (Studio/Research hubs)
<Button variant="ai" size="lg">
  Generate Content
</Button>

// Form actions pattern
<div className="flex gap-2">
  <Button variant="outline" onClick={onCancel}>Cancel</Button>
  <Button variant="primary" onClick={onSave}>Save</Button>
</div>
```

**Variants:** default, primary, success, warning, destructive, outline, ghost, link, ai
**Sizes:** default, sm, lg, icon, xs

**Features:**
- Neumorphic raised/pressed states with soft shadows
- Smooth transitions and hover effects (200ms duration)
- Accessibility support with focus states
- Dark mode compatibility
- Touch-optimized with proper sizing

#### Input

```tsx
import { Input } from "@/components/ui/input";

<Input type="text" placeholder="Enter text" />;
```

#### Textarea

```tsx
import { Textarea } from "@/components/ui/textarea";

<Textarea placeholder="Enter description" rows={4} />;
```

#### Select

Enhanced with mobile optimization, smooth animations, and responsive chevron icon.

```tsx
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Basic usage
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
    <SelectItem value="3">Option 3</SelectItem>
  </SelectContent>
</Select>

// With groups and labels
<Select>
  <SelectTrigger className="w-[280px]">
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>Fruits</SelectLabel>
      <SelectItem value="apple">Apple</SelectItem>
      <SelectItem value="banana">Banana</SelectItem>
      <SelectItem value="orange">Orange</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Vegetables</SelectLabel>
      <SelectItem value="carrot">Carrot</SelectItem>
      <SelectItem value="potato">Potato</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>

// With icons (used in Studio)
<Select value={contentType} onValueChange={setContentType}>
  <SelectTrigger>
    <SelectValue placeholder="Select content type" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="blog">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4" />
        <span>Blog Post</span>
      </div>
    </SelectItem>
    <SelectItem value="social">
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4" />
        <span>Social Media</span>
      </div>
    </SelectItem>
  </SelectContent>
</Select>
```

**Features:**

- Mobile-optimized with larger touch targets (2.75rem on mobile, 2.5rem on desktop)
- Responsive chevron icon (20px on mobile, 16px on desktop) with rotation animation
- Smooth transitions and hover effects
- Active state with subtle scale animation
- Backdrop blur for modern look
- Auto collision detection with viewport padding
- Larger padding in dropdown items on mobile

#### Checkbox

```tsx
import { Checkbox } from "@/components/ui/checkbox";

<Checkbox id="terms" />;
```

#### Radio Group

```tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

<RadioGroup defaultValue="option1">
  <RadioGroupItem value="option1" id="option1" />
  <RadioGroupItem value="option2" id="option2" />
</RadioGroup>;
```

#### Switch

Enhanced switch component with realistic toggle design that provides smooth animations and tactile feedback.

```tsx
import { Switch } from "@/components/ui/switch";

// Basic usage
<Switch checked={enabled} onCheckedChange={setEnabled} />

// Disabled state
<Switch disabled checked={false} />

// With form integration
<div className="flex items-center space-x-2">
  <Switch id="notifications" checked={enabled} onCheckedChange={setEnabled} />
  <Label htmlFor="notifications">Enable notifications</Label>
</div>

// In settings forms (Brand/Settings hubs pattern)
<div className="flex items-center justify-between">
  <div className="space-y-0.5">
    <Label htmlFor="dark-mode">Dark Mode</Label>
    <p className="text-sm text-muted-foreground">
      Toggle between light and dark themes
    </p>
  </div>
  <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
</div>
```

**Features:**
- **Horizontal Toggle**: Standard horizontal toggle switch (12×7) with left-to-right thumb movement
- **Physical Realism**: Recessed track with enhanced inset shadows for realistic depth
- **Smooth Animations**: 300ms transitions with ease-in-out timing for natural movement
- **Color States**: Green gradient when active, transparent when inactive with proper contrast
- **Enhanced Shadows**: Layered inset shadows for realistic depth and recessed appearance
- **Dark Mode**: Automatically adapts colors for dark theme compatibility
- **Accessibility**: Full keyboard support and screen reader compatibility
- **Touch Optimized**: Mobile-friendly with proper touch targets

**Design Details:**
- **Track**: Horizontal rounded rectangle (12×7) with transparent background when off, green gradient when on
- **Thumb**: Square toggle (5×5) with horizontal translation movement and subtle texture
- **Movement**: Moves from left (off) to right (on) with smooth transform animations
- **Colors**: Green gradients for active state, transparent for inactive state
- **Shadows**: Enhanced layered inset shadows with rgba values for realistic depth perception

#### Slider

```tsx
import { Slider } from "@/components/ui/slider";

<Slider defaultValue={[50]} max={100} step={1} />;
```

### Layout Components

#### Card

Enhanced card component with interactive features and multiple variants.

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

// Basic card
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>

// Interactive card with hover effects
<Card interactive hoverEffect="lift" onClick={handleClick}>
  <CardHeader>
    <CardTitle>Clickable Card</CardTitle>
    <CardDescription>This card responds to interactions</CardDescription>
  </CardHeader>
  <CardContent>Interactive content</CardContent>
</Card>

// Different variants
<Card variant="elevated">Elevated card with shadow</Card>
<Card variant="floating">Floating card effect</Card>
<Card variant="modal">Modal-style card</Card>
<Card variant="premium">Premium styled card</Card>
<Card variant="bordered">Card with visible border</Card>
<Card variant="glass">Glassmorphism effect card</Card>

// Different hover effects
<Card interactive hoverEffect="glow">Glow on hover</Card>
<Card interactive hoverEffect="scale">Scale on hover</Card>
<Card interactive hoverEffect="none">No hover effect</Card>
```

**Props:**

- `interactive` (boolean): Makes the card clickable with cursor pointer
- `variant` ('base' | 'elevated' | 'floating' | 'modal' | 'premium' | 'bordered' | 'glass'): Visual style variant
- `hoverEffect` ('lift' | 'glow' | 'scale' | 'none'): Hover animation effect (defaults to 'lift' for interactive cards)

**Features:**

- **Interactive States**: Clickable cards with proper cursor and hover feedback
- **Multiple Variants**: Different visual styles for various use cases
- **Hover Effects**: Smooth animations with 300ms duration and ease-out timing
- **Accessibility**: Maintains focus states and keyboard navigation
- **Responsive**: Works across all device sizes

**Common Usage Patterns:**

```tsx
// Content Type Selector (Studio Write pattern)
<Card>
  <CardContent>
    <div className="flex items-center gap-4">
      <Label htmlFor="content-type" className="text-sm font-medium whitespace-nowrap">
        Content Type:
      </Label>
      <Select value={activeTab} onValueChange={setActiveTab}>
        <SelectTrigger id="content-type" className="w-full max-w-md">
          <SelectValue placeholder="Select content type" />
        </SelectTrigger>
        <SelectContent>
          {contentTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span>{type.title}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </CardContent>
</Card>

// Interactive Feature Card (Dashboard pattern)
<Card interactive hoverEffect="lift" onClick={() => navigate('/studio/write')}>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <FileText className="w-5 h-5" />
      Content Generator
    </CardTitle>
    <CardDescription>Create AI-powered content in minutes</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      Generate blog posts, social media content, and more
    </p>
  </CardContent>
</Card>

// Form Section Card
<Card>
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
    <CardDescription>Section description</CardDescription>
  </CardHeader>
  <CardContent>
    <form className="space-y-4">
      {/* Form fields */}
    </form>
  </CardContent>
</Card>

// Output Display Card
<Card className="lg:col-span-2">
  <CardHeader>
    <CardTitle>Generated Content</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content display area */}
  </CardContent>
</Card>

// Premium Feature Card
<Card variant="premium" interactive hoverEffect="glow">
  <CardHeader>
    <CardTitle>Premium Feature</CardTitle>
    <CardDescription>Unlock advanced capabilities</CardDescription>
  </CardHeader>
  <CardContent>Premium content</CardContent>
</Card>
```

#### Separator

```tsx
import { Separator } from "@/components/ui/separator";

<Separator orientation="horizontal" />;
```

### AnimatedTabs (shadcn/ui Enhanced)

Enhanced tab component with animated indicator and fully rounded pill styling. This is the recommended tab component per tech stack guidelines.

```tsx
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
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

**Features:**
- **Animated Indicator**: Smooth sliding indicator that follows the active tab with precise positioning
- **Fully Rounded Design**: Uses `rounded-full` for modern pill-style appearance
- **Automatic Positioning**: Indicator automatically positions and sizes to match the active tab dimensions exactly
- **Smooth Transitions**: 300ms ease-out transitions for natural movement
- **Responsive**: Works across all device sizes with proper touch targets
- **Accessibility**: Full keyboard support and screen reader compatibility
- **Dynamic Styling**: Uses inline styles for optimal performance with transform and width properties

**Design Details:**
- **Container**: Fully rounded (`rounded-full`) with muted background, subtle border, and 1.5rem padding
- **Indicator**: Animated background element with matching `rounded-full` styling, shadow, and precise positioning that matches the active tab dimensions exactly
- **Triggers**: Individual tab buttons with optimized padding (1rem horizontal, 0.625rem vertical) and hover states for balanced touch targets and visual density
- **Transitions**: Smooth 300ms animations for indicator movement and size changes
- **Performance**: Uses inline styles for dynamic positioning with transform and width properties

**Usage Patterns:**
```tsx
// Page-level tab navigation (Calculator, Reimagine)
<Tabs defaultValue="mortgage" className="w-full">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="mortgage">Mortgage</TabsTrigger>
    <TabsTrigger value="affordability">Affordability</TabsTrigger>
    <TabsTrigger value="refinance">Refinance</TabsTrigger>
  </TabsList>
  <TabsContent value="mortgage">{/* Content */}</TabsContent>
</Tabs>

// Section toggles within features
<Tabs defaultValue="basic" className="w-full max-w-md">
  <TabsList>
    <TabsTrigger value="basic">Basic</TabsTrigger>
    <TabsTrigger value="advanced">Advanced</TabsTrigger>
  </TabsList>
  <TabsContent value="basic">{/* Basic form */}</TabsContent>
  <TabsContent value="advanced">{/* Advanced form */}</TabsContent>
</Tabs>
```

**Tech Stack Requirement:**
Always use `AnimatedTabs` components instead of standard `Tabs` components for consistent animated transitions and styling across the application.

#### Accordion

```tsx
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

<Accordion type="single" collapsible>
  <AccordionItem value="item1">
    <AccordionTrigger>Section 1</AccordionTrigger>
    <AccordionContent>Content 1</AccordionContent>
  </AccordionItem>
</Accordion>;
```

#### Collapsible

```tsx
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

<Collapsible>
  <CollapsibleTrigger>Toggle</CollapsibleTrigger>
  <CollapsibleContent>Hidden content</CollapsibleContent>
</Collapsible>;
```

### Overlay Components

#### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <div>Content</div>
    <DialogFooter>
      <Button>Action</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

#### Sheet

```tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Title</SheetTitle>
      <SheetDescription>Description</SheetDescription>
    </SheetHeader>
    <div>Content</div>
  </SheetContent>
</Sheet>;
```

**Sides:** top, right, bottom, left

#### Alert Dialog

```tsx
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>;
```

#### Popover

```tsx
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

<Popover>
  <PopoverTrigger asChild>
    <Button>Open</Button>
  </PopoverTrigger>
  <PopoverContent>Content</PopoverContent>
</Popover>;
```

#### Tooltip

```tsx
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Hover me</TooltipTrigger>
    <TooltipContent>Tooltip text</TooltipContent>
  </Tooltip>
</TooltipProvider>;
```

#### Dropdown Menu

Enhanced with mobile optimization, smooth animations, and better touch targets.

```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuDescription,
  DropdownMenuShortcut,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

// Basic usage
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button>Menu</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem destructive>Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// With labels, shortcuts, and descriptions
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Actions</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <div className="flex flex-col">
        <span>Profile</span>
        <DropdownMenuDescription>
          View and edit your profile
        </DropdownMenuDescription>
      </div>
      <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem>
      Settings
      <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// With checkboxes
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">View</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuCheckboxItem checked={showPanel}>
      Show Panel
    </DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem checked={showToolbar}>
      Show Toolbar
    </DropdownMenuCheckboxItem>
  </DropdownMenuContent>
</DropdownMenu>

// With radio group
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Sort By</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
      <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="size">Size</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenu>
```

**Features:**

- Mobile-optimized with larger touch targets (2.5rem on mobile, 1.5rem on desktop)
- Smooth transitions and hover effects
- Active state with subtle scale animation
- Backdrop blur for modern look
- Auto collision detection with viewport padding
- Destructive variant for dangerous actions
- Keyboard shortcuts (hidden on mobile)
- Description text support for complex items

### Feedback Components

#### Alert

```tsx
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

<Alert variant="default">
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>Important message here.</AlertDescription>
</Alert>;
```

**Variants:** default, destructive

#### Toast

Enhanced toast notification system with multiple variants and smooth animations.

```tsx
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

// Basic usage
toast({
  title: "Success",
  description: "Operation completed",
  variant: "default",
});

// Success toast
toast({
  title: "Content Saved",
  description: "Your blog post has been saved to drafts.",
  variant: "success"
});

// AI-themed toast (Studio/Research hubs)
toast({
  title: "AI Analysis Complete",
  description: "Your market research is ready.",
  variant: "ai"
});

// Warning toast
toast({
  title: "Profile Incomplete",
  description: "Please complete your profile to continue.",
  variant: "warning"
});

// Error toast
toast({
  title: "Upload Failed",
  description: "Please try again or contact support.",
  variant: "destructive"
});

// Toast with action
toast({
  title: "Content saved",
  description: "Your blog post has been saved to drafts.",
  action: <ToastAction altText="View">View</ToastAction>
});
```

**Variants:** default, destructive, success, warning, ai

**Features:**
- **Multiple Visual Variants**: Different colors and styles for various message types
- **Swipe-to-Dismiss**: Touch-friendly dismissal on mobile devices
- **Smooth Animations**: Slide-in/slide-out animations with proper timing
- **Auto-Dismiss**: Configurable duration with manual dismiss option
- **Action Support**: Interactive buttons for follow-up actions
- **Accessibility**: Full ARIA support and screen reader compatibility
- **Responsive Design**: Mobile-optimized positioning and interactions
- **Dark Mode**: Automatic color adaptation for dark themes

**Usage Patterns:**

```tsx
// Success feedback (common in Studio/Brand hubs)
toast({
  title: "Generated Successfully",
  description: "Your content is ready to use.",
  variant: "success"
});

// AI operation completion (Research/Studio hubs)
toast({
  title: "AI Processing Complete",
  description: "Your analysis has been generated.",
  variant: "ai"
});

// Warning notifications (Profile/Settings)
toast({
  title: "Action Required",
  description: "Please verify your email address.",
  variant: "warning"
});

// Error handling (all hubs)
toast({
  title: "Something went wrong",
  description: "Please try again or contact support.",
  variant: "destructive"
});
```

#### Progress

```tsx
import { Progress } from "@/components/ui/progress";

<Progress value={60} />;
```

#### Badge

```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="default">New</Badge>;
```

**Variants:** default, secondary, destructive, outline

#### Skeleton

```tsx
import { Skeleton } from "@/components/ui/skeleton";

<Skeleton className="h-4 w-full" />;
```

### Data Display Components

#### Table

```tsx
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>;
```

#### Avatar

```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

<Avatar>
  <AvatarImage src="/avatar.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>;
```

#### Calendar

```tsx
import { Calendar } from "@/components/ui/calendar";

<Calendar mode="single" selected={date} onSelect={setDate} />;
```

#### Chart

```tsx
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

<ChartContainer config={chartConfig}>
  <LineChart data={data}>
    <ChartTooltip content={<ChartTooltipContent />} />
  </LineChart>
</ChartContainer>;
```

### Navigation Components

#### Breadcrumbs

```tsx
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumbs";

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/page">Page</BreadcrumbLink>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>;
```

#### Pagination

```tsx
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>;
```

#### Sidebar

```tsx
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

<Sidebar>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>Item</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>
</Sidebar>;
```

#### Menubar

```tsx
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
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

### Utility Components

#### Scroll Area

```tsx
import { ScrollArea } from "@/components/ui/scroll-area";

<ScrollArea className="h-[200px]">
  <div>Long content...</div>
</ScrollArea>;
```

#### Form

```tsx
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

const form = useForm();

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormDescription>Your email address</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>;
```

---

## Custom Enhanced UI Components

Advanced UI components built on top of shadcn/ui with additional features.

### Animated Components

#### AnimatedNumber

Smooth number transitions with formatting options.

```tsx
import { AnimatedNumber } from "@/components/ui/animated-number";

<AnimatedNumber
  value={1234.56}
  format="currency"
  duration={1000}
  decimals={2}
/>;
```

**Formats:** number, currency, percentage, compact

#### AnimatedChart

Charts with entrance animations and smooth transitions.

```tsx
import { AnimatedChart } from "@/components/ui/animated-chart";

<AnimatedChart
  data={chartData}
  type="line"
  animationDuration={1000}
  staggerDelay={50}
/>;
```

#### AnimatedTabs

Tabs with smooth indicator animation.

```tsx
import { AnimatedTabs } from "@/components/ui/animated-tabs";

<AnimatedTabs
  tabs={[
    { id: "1", label: "Tab 1", content: <div>Content 1</div> },
    { id: "2", label: "Tab 2", content: <div>Content 2</div> },
  ]}
  defaultTab="1"
/>;
```

#### Celebration

Confetti and success animations for achievements.

```tsx
import { Celebration } from "@/components/ui/celebration";

<Celebration type="confetti" trigger={showCelebration} duration={3000} />;
```

**Types:** confetti, success, achievement, milestone

### Visual Enhancement Components

#### GlassCard

Card with glassmorphism effect.

```tsx
import { GlassCard } from "@/components/ui/glass-card";

<GlassCard blur="md" opacity={0.8} border>
  Content
</GlassCard>;
```

#### GradientBorder

Animated gradient border wrapper.

```tsx
import { GradientBorder } from "@/components/ui/gradient-border";

<GradientBorder
  colors={["#3b82f6", "#8b5cf6", "#ec4899"]}
  animate
  borderWidth={2}
>
  <div>Content with gradient border</div>
</GradientBorder>;
```

#### GradientMesh

Animated gradient mesh background.

```tsx
import { GradientMesh } from "@/components/ui/gradient-mesh";

<GradientMesh
  colors={["#3b82f6", "#8b5cf6", "#ec4899"]}
  animate
  speed="slow"
/>;
```

#### EnhancedCard

Card with hover effects and interactive states.

```tsx
import { EnhancedCard } from "@/components/ui/enhanced-card";

<EnhancedCard hover="lift" glow gradient>
  Content
</EnhancedCard>;
```

**Hover effects:** lift, scale, glow, tilt

### Data Visualization Components

#### MetricCard

Display metrics with trends and sparklines.

```tsx
import { MetricCard } from "@/components/ui/metric-card";

<MetricCard
  title="Total Views"
  value={12345}
  change={12.5}
  trend="up"
  sparklineData={[10, 20, 15, 30, 25]}
  format="number"
/>;
```

#### Sparkline

Inline mini chart for trends.

```tsx
import { Sparkline } from "@/components/ui/sparkline";

<Sparkline
  data={[10, 20, 15, 30, 25, 35]}
  color="#3b82f6"
  height={40}
  showDots
/>;
```

### Feedback & Progress Components

#### AIOperationProgress

Progress indicator for AI operations with streaming support.

```tsx
import { AIOperationProgress } from "@/components/ui/ai-operation-progress";

<AIOperationProgress
  status="processing"
  progress={60}
  message="Generating content..."
  estimatedTime={30}
/>;
```

**Statuses:** idle, processing, streaming, complete, error

#### FeedbackCue

Micro-interaction feedback for user actions.

```tsx
import { FeedbackCue } from "@/components/ui/feedback-cue";

<FeedbackCue
  type="success"
  message="Saved!"
  duration={2000}
  position="top-right"
/>;
```

**Types:** success, error, warning, info

### Help & Guidance Components

#### ContextualTooltip

Rich tooltips with examples and keyboard shortcuts.

```tsx
import { ContextualTooltip } from "@/components/ui/contextual-tooltip";

<ContextualTooltip
  title="Feature Name"
  description="Detailed explanation"
  example="Usage example"
  shortcut="⌘K"
  learnMoreUrl="/docs/feature"
>
  <Button>Hover me</Button>
</ContextualTooltip>;
```

#### ContextualHelp

Inline help with expandable details.

```tsx
import { ContextualHelp } from "@/components/ui/contextual-help";

<ContextualHelp
  title="What is this?"
  content="Detailed explanation..."
  placement="right"
/>;
```

#### FeatureTooltip

Feature-specific tooltips with onboarding support.

```tsx
import { FeatureTooltip } from "@/components/ui/feature-tooltip";

<FeatureTooltip
  featureId="content-generator"
  title="Content Generator"
  description="Create AI-powered content"
  showOnce
>
  <Button>Generate</Button>
</FeatureTooltip>;
```

#### TaskGuidance

Step-by-step task guidance panel.

```tsx
import { TaskGuidance } from "@/components/ui/task-guidance";

<TaskGuidance
  steps={[
    { id: "1", title: "Step 1", description: "Do this", completed: true },
    { id: "2", title: "Step 2", description: "Then this", completed: false },
  ]}
  currentStep="2"
/>;
```

#### PrerequisiteCheck

Check and display prerequisites before actions.

```tsx
import { PrerequisiteCheck } from "@/components/ui/prerequisite-check";

<PrerequisiteCheck
  prerequisites={[
    { id: "1", label: "Profile complete", met: true },
    { id: "2", label: "Email verified", met: false },
  ]}
  onComplete={handleComplete}
/>;
```

### Empty State Components

#### IntelligentEmptyState

Context-aware empty states with smart suggestions.

```tsx
import { IntelligentEmptyState } from "@/components/ui/intelligent-empty-state";

<IntelligentEmptyState
  context="content"
  userProfile={profile}
  onActionClick={handleAction}
/>;
```

#### EmptyStates

Pre-configured empty states for common scenarios.

```tsx
import { EmptyStates } from "@/components/ui/empty-states";

<EmptyStates.NoContent
  title="No content yet"
  description="Create your first piece"
  action={{ label: "Create", onClick: handleCreate }}
/>;
```

**Variants:** NoContent, NoResults, NoData, Error, Offline

### Interactive Components

#### QuickActionsMenu

Floating action menu with keyboard shortcuts.

```tsx
import { QuickActionsMenu } from "@/components/ui/quick-actions-menu";

<QuickActionsMenu
  actions={[
    {
      id: "1",
      label: "New Post",
      icon: FileText,
      onClick: handleNew,
      shortcut: "⌘N",
    },
    {
      id: "2",
      label: "Search",
      icon: Search,
      onClick: handleSearch,
      shortcut: "⌘K",
    },
  ]}
  position="bottom-right"
/>;
```

#### FilterControls

Advanced filtering UI with multiple filter types.

```tsx
import { FilterControls } from "@/components/ui/filter-controls";

<FilterControls
  filters={[
    {
      id: "status",
      label: "Status",
      type: "select",
      options: ["All", "Active", "Draft"],
    },
    { id: "date", label: "Date", type: "date-range" },
  ]}
  onFilterChange={handleFilterChange}
/>;
```

#### SearchInput

Enhanced search input with suggestions and recent searches.

```tsx
import { SearchInput } from "@/components/ui/search-input";

<SearchInput
  placeholder="Search..."
  onSearch={handleSearch}
  suggestions={["Recent 1", "Recent 2"]}
  showRecent
/>;
```

### Table & List Components

#### ResponsiveTable

Table that adapts to mobile with card view.

```tsx
import { ResponsiveTable } from "@/components/ui/responsive-table";

<ResponsiveTable
  columns={[
    { key: "name", label: "Name", sortable: true },
    { key: "status", label: "Status" },
  ]}
  data={items}
  mobileBreakpoint="md"
/>;
```

#### VirtualList

Virtualized list for large datasets.

```tsx
import { VirtualList } from "@/components/ui/virtual-list";

<VirtualList
  items={largeArray}
  itemHeight={60}
  renderItem={(item) => <div>{item.name}</div>}
  overscan={5}
/>;
```

### Real Estate Specific Components

#### RealEstateIcons

Icon set for real estate features.

```tsx
import { RealEstateIcons } from '@/components/ui/real-estate-icons';

<RealEstateIcons.House className="h-6 w-6" />
<RealEstateIcons.Bedroom className="h-6 w-6" />
<RealEstateIcons.Bathroom className="h-6 w-6" />
```

**Available icons:** House, Apartment, Condo, Land, Commercial, Bedroom, Bathroom, Garage, Pool, Garden, Kitchen, Office, Warehouse, Retail

#### NextStepsCard

Suggested next steps for user workflows.

```tsx
import { NextStepsCard } from "@/components/ui/next-steps-card";

<NextStepsCard
  steps={[
    { id: "1", title: "Complete profile", completed: true },
    { id: "2", title: "Add listing", completed: false },
  ]}
  onStepClick={handleStepClick}
/>;
```

#### MarketNotifications

Market alert and notification preferences.

```tsx
import { MarketNotifications } from "@/components/ui/market-notifications";

<MarketNotifications
  notifications={alerts}
  onPreferenceChange={handleChange}
/>;
```

#### NotificationPreferences

User notification settings panel.

```tsx
import { NotificationPreferences } from "@/components/ui/notification-preferences";

<NotificationPreferences preferences={userPrefs} onSave={handleSave} />;
```

### Performance Components

#### OptimizedImage

Optimized image component with lazy loading and blur placeholder.

```tsx
import { OptimizedImage } from "@/components/ui/optimized-image";

<OptimizedImage
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority={false}
  blur
/>;
```

#### LoadingStates

Pre-configured loading states for different scenarios.

```tsx
import { LoadingStates } from '@/components/ui/loading-states';

<LoadingStates.Spinner size="lg" />
<LoadingStates.Skeleton variant="card" />
<LoadingStates.Progress value={60} />
```

#### UsageTracking

Component usage analytics wrapper.

```tsx
import { UsageTracking } from "@/components/ui/usage-tracking";

<UsageTracking componentId="feature-name" trackClicks trackViews>
  <YourComponent />
</UsageTracking>;
```

#### WorkflowOptimizationPanel

Workflow suggestions based on user behavior.

```tsx
import { WorkflowOptimizationPanel } from "@/components/ui/workflow-optimization-panel";

<WorkflowOptimizationPanel
  userProfile={profile}
  recentActions={actions}
  onSuggestionClick={handleClick}
/>;
```

---

## Feature Components

Domain-specific components for core features.

### Content Creation

#### ListingDescriptionGeneratorForm

Generate AI-powered listing descriptions.

```tsx
import { ListingDescriptionGeneratorForm } from "@/components/listing-description-generator/listing-description-generator-form";

<ListingDescriptionGeneratorForm isOptimizeMode={false} />;
```

### Market Intelligence

#### LifeEventPredictorForm

Predict life events and market opportunities.

```tsx
import { LifeEventPredictorForm } from "@/components/life-event-predictor/life-event-predictor-form";

<LifeEventPredictorForm />;
```

#### InvestmentOpportunityIdentificationForm

Identify investment opportunities.

```tsx
import { InvestmentOpportunityIdentificationForm } from "@/components/investment-opportunity-identification/investment-opportunity-identification-form";

<InvestmentOpportunityIdentificationForm />;
```

### Brand Management

#### CompetitorForm

Add and manage competitors.

```tsx
import { CompetitorForm } from "@/components/competitor-form";

<CompetitorForm isOpen={open} setIsOpen={setOpen} onSuccess={handleSuccess} />;
```

#### ProfileImageUpload

Upload and manage profile images.

```tsx
import { ProfileImageUpload } from "@/components/profile-image-upload";

<ProfileImageUpload
  userId={userId}
  currentImageUrl={imageUrl}
  onUploadComplete={handleComplete}
/>;
```

### Reimagine (Image Editing)

#### ImageUploader

Upload images for AI editing.

```tsx
import { ImageUploader } from "@/components/reimagine/image-uploader";

<ImageUploader
  onUpload={handleUpload}
  maxSize={10}
  acceptedFormats={["jpg", "png"]}
/>;
```

#### EditOptionsPanel

Image editing options selector.

```tsx
import { EditOptionsPanel } from "@/components/reimagine/edit-options-panel";

<EditOptionsPanel selectedOption={option} onOptionChange={handleChange} />;
```

#### EditPreview

Preview edited images with before/after comparison.

```tsx
import { EditPreview } from "@/components/reimagine/edit-preview";

<EditPreview originalImage={original} editedImage={edited} showComparison />;
```

#### ProcessingProgress

Track image processing progress.

```tsx
import { ProcessingProgress } from "@/components/reimagine/processing-progress";

<ProcessingProgress status="processing" progress={60} estimatedTime={30} />;
```

#### EditHistoryList

View and manage edit history.

```tsx
import { EditHistoryList } from "@/components/reimagine/edit-history-list";

<EditHistoryList
  edits={editHistory}
  onRevert={handleRevert}
  onDelete={handleDelete}
/>;
```

#### RateLimitStatus

Display API rate limit status.

```tsx
import { RateLimitStatus } from "@/components/reimagine/rate-limit-status";

<RateLimitStatus remaining={45} total={50} resetTime={resetDate} />;
```

### AI Assistant

#### ChatInterface

AI chat interface with message history.

```tsx
import { ChatInterface } from "@/components/bayon-assistant/chat-interface";

<ChatInterface userId={userId} agentId={agentId} initialMessages={messages} />;
```

#### VisionInterface

AI vision analysis interface for images.

```tsx
import { VisionInterface } from "@/components/bayon-assistant/vision-interface";

<VisionInterface onAnalysisComplete={handleComplete} />;
```

#### VisionAnalysisResults

Display vision analysis results.

```tsx
import { VisionAnalysisResults } from "@/components/bayon-assistant/vision-analysis-results";

<VisionAnalysisResults results={analysisData} imageUrl={imageUrl} />;
```

#### AgentProfileForm

Create and edit AI agent profiles.

```tsx
import { AgentProfileForm } from "@/components/bayon-assistant/agent-profile-form";

<AgentProfileForm agentId={agentId} onSave={handleSave} />;
```

#### AgentProfilePreview

Preview agent profile configuration.

```tsx
import { AgentProfilePreview } from "@/components/bayon-assistant/agent-profile-preview";

<AgentProfilePreview profile={agentProfile} />;
```

### Integrations

#### SocialMediaConnections

Manage social media OAuth connections.

```tsx
import { SocialMediaConnections } from "@/components/social-media-connections";

<SocialMediaConnections userId={userId} onConnectionChange={handleChange} />;
```

#### SocialPublishingDialog

Publish content to social media platforms.

```tsx
import { SocialPublishingDialog } from "@/components/social-publishing-dialog";

<SocialPublishingDialog
  listing={listingData}
  open={open}
  onOpenChange={setOpen}
  onPublish={handlePublish}
/>;
```

#### MLSConnection

Connect to MLS services.

```tsx
import { MLSConnection } from "@/components/mls-connection";

<MLSConnection onConnectionChange={handleChange} />;
```

#### GoogleOAuthCallback

Handle Google OAuth callback.

```tsx
import { GoogleOAuthCallback } from "@/components/google-oauth-callback";

<GoogleOAuthCallback />;
```

### User Experience

#### ProfileCompletionBanner

Show profile completion progress.

```tsx
import { ProfileCompletionBanner } from "@/components/profile-completion-banner";

<ProfileCompletionBanner userId={userId} onDismiss={handleDismiss} />;
```

#### SuggestedNextSteps

Suggest next actions based on user context.

```tsx
import { SuggestedNextSteps } from "@/components/suggested-next-steps";

<SuggestedNextSteps
  steps={suggestedSteps}
  onStepClick={handleClick}
  className="mt-6"
/>;
```

#### FrequentFeatures

Show frequently used features.

```tsx
import { FrequentFeatures } from "@/components/frequent-features";

<FrequentFeatures limit={5} onFeatureClick={handleClick} />;
```

#### LoginHistory

Display user login history.

```tsx
import { LoginHistory } from "@/components/login-history";

<LoginHistory userId={userId} limit={10} />;
```

### Training & Education

#### AITrainingPlan

Personalized AI training plans.

```tsx
import { AITrainingPlan } from "@/components/ai-training-plan";

<AITrainingPlan />;
```

#### AIRolePlay

Interactive role-play scenarios.

```tsx
import { AIRolePlay } from "@/components/ai-role-play";

<AIRolePlay moduleId={moduleId} />;
```

#### Quiz

Interactive quizzes for training modules.

```tsx
import { Quiz } from "@/components/quiz";

<Quiz
  moduleId={moduleId}
  questions={questions}
  onComplete={handleComplete}
  isCompleted={false}
/>;
```

### Dashboard

#### AIDashboard

AI-powered personalized dashboard.

```tsx
import { AIDashboard } from "@/components/ai-dashboard";

<AIDashboard userId={userId} userName={userName} />;
```

---

## Layout Components

### PageLayout

Full-page layout with consistent structure.

```tsx
import { PageLayout } from "@/components/layouts/page-layout";

<PageLayout
  title="Page Title"
  description="Page description"
  breadcrumbs={[{ label: "Home", href: "/" }]}
  actions={<Button>Action</Button>}
>
  {content}
</PageLayout>;
```

---

## Utility Components

### Theme & Appearance

#### ThemeProvider

Theme context provider for dark/light mode.

```tsx
import { ThemeProvider } from "@/components/theme-provider";

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>;
```

#### ThemeToggle

Theme switcher dropdown.

```tsx
import { ThemeToggle } from "@/components/theme-toggle";

<ThemeToggle />;
```

#### Logo

Application logo with responsive sizing.

```tsx
import { Logo } from "@/components/logo";

<Logo className="h-8" />;
```

### Navigation & Transitions

#### PageTransition

Smooth page transitions with Framer Motion.

```tsx
import { PageTransition } from "@/components/page-transition";

<PageTransition>{children}</PageTransition>;
```

#### PageHeader

Standard page header component.

```tsx
import { PageHeader } from "@/components/page-header";

<PageHeader title="Page Title" description="Page description" />;
```

### File Management

#### S3FileUpload

Upload files to S3 with progress tracking.

```tsx
import { S3FileUpload } from "@/components/s3-file-upload";

<S3FileUpload
  userId={userId}
  fileType="document"
  onUploadComplete={handleComplete}
  maxSize={10}
/>;
```

### Data Display

#### JsonLdDisplay

Display JSON-LD schema markup.

```tsx
import { JsonLdDisplay } from "@/components/json-ld-display";

<JsonLdDisplay schema={schemaData} />;
```

#### ListingMetricsDisplay

Display listing performance metrics.

```tsx
import { ListingMetricsDisplay } from "@/components/listing-metrics-display";

<ListingMetricsDisplay listingId={listingId} metrics={metricsData} />;
```

### Development Tools

#### PerformanceMonitor

Monitor app performance (dev only).

```tsx
import { PerformanceMonitor } from "@/components/performance-monitor";

<PerformanceMonitor />;
```

#### PerformanceMonitorDev

Detailed performance monitoring UI.

```tsx
import { PerformanceMonitorDev } from "@/components/performance-monitor-dev";

<PerformanceMonitorDev />;
```

#### ErrorBoundary

Catch and display React errors.

```tsx
import { ErrorBoundary } from "@/components/error-boundary";

<ErrorBoundary fallback={<ErrorDisplay />}>{children}</ErrorBoundary>;
```

#### SessionLoading

Loading screen during session initialization.

```tsx
import { SessionLoading } from "@/components/session-loading";

<SessionLoading />;
```

### Demo Components

#### OptimisticUIDemo

Demonstrate optimistic UI patterns.

```tsx
import { OptimisticUIDemo } from "@/components/optimistic-ui-demo";

<OptimisticUIDemo />;
```

#### WorkflowOptimizationDemo

Demonstrate workflow optimization features.

```tsx
import { WorkflowOptimizationDemo } from "@/components/workflow-optimization-demo";

<WorkflowOptimizationDemo profile={profile} hasCompletedAction={false} />;
```

### Onboarding

#### OnboardingProvider

Onboarding flow context provider.

```tsx
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";

<OnboardingProvider>{children}</OnboardingProvider>;
```

---

## Usage Guidelines

### Component Selection

**When to use Hub Components:**

- Building hub pages (Studio, Brand, Market, Library)
- Need consistent navigation with tabs
- Require breadcrumb navigation

**When to use Standard Components:**

- Building forms and data entry pages
- Need consistent styling across features
- Want pre-configured loading and error states

**When to use UI Components:**

- Building custom interfaces
- Need maximum flexibility
- Want to compose your own patterns

**When to use Feature Components:**

- Implementing specific features (content generation, image editing)
- Need domain-specific functionality
- Want pre-built feature workflows

### Best Practices

1. **Import from index files:**

   ```tsx
   // Good
   import { HubLayout, HubTabs } from "@/components/hub";

   // Avoid
   import { HubLayout } from "@/components/hub/hub-layout";
   ```

2. **Use TypeScript types:**

   ```tsx
   import type { HubLayoutProps } from "@/components/hub";
   ```

3. **Compose components:**

   ```tsx
   <StandardPageLayout>
     <StandardCard>
       <StandardFormField>
         <Input />
       </StandardFormField>
     </StandardCard>
   </StandardPageLayout>
   ```

4. **Leverage variants:**

   ```tsx
   <Button variant="ai">Generate</Button>
   <StandardCard variant="interactive">...</StandardCard>
   ```

5. **Use loading states:**

   ```tsx
   {
     isLoading ? <StandardLoadingSpinner variant="overlay" /> : <Content />;
   }
   ```

6. **Handle empty states:**

   ```tsx
   {
     items.length === 0 ? (
       <StandardEmptyState
         icon={FileText}
         title="No items"
         action={{ label: "Create", onClick: handleCreate }}
       />
     ) : (
       <ItemList items={items} />
     );
   }
   ```

7. **Optimize performance:**

   ```tsx
   // Use virtual scrolling for large lists
   <VirtualList items={largeArray} />

   // Use optimized images
   <OptimizedImage src="/image.jpg" blur />
   ```

### Accessibility

All components follow accessibility best practices:

- Keyboard navigation support
- ARIA labels and roles
- Focus management
- Screen reader compatibility
- Color contrast compliance

### Responsive Design

Components are mobile-first and responsive:

- Use `use-mobile()` and `use-tablet()` hooks for conditional rendering
- ResponsiveTable automatically switches to card view on mobile
- Touch-optimized interactions on mobile devices

### Performance

- Virtual scrolling for lists >100 items
- Lazy loading for images and heavy components
- Optimistic UI updates for better perceived performance
- Request deduplication and caching

---

## Component Index

Quick reference of all components by category:

**⭐ Shared (Use First):** AIFormWrapper, useAIGeneration, FormSection, FormSectionGroup, ActionButtons, DataTable, StatusBadge, ConfirmationDialog

**Hub:** HubLayout, HubTabs, HubHeader, HubBreadcrumbs

**Standard:** StandardPageLayout, StandardCard, StandardFormField, StandardFormActions, StandardLoadingSpinner, StandardSkeleton, StandardEmptyState, StandardErrorDisplay

**UI Core:** Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, Label

**UI Layout:** Card, Separator, Tabs, Accordion, Collapsible

**UI Overlay:** Dialog, Sheet, AlertDialog, Popover, Tooltip, DropdownMenu

**UI Feedback:** Alert, Toast, Progress, Badge, Skeleton

**UI Data:** Table, Avatar, Calendar, Chart

**UI Navigation:** Breadcrumbs, Pagination, Sidebar, Menubar

**Enhanced UI:** AnimatedNumber, AnimatedChart, AnimatedTabs, Celebration, GlassCard, GradientBorder, GradientMesh, EnhancedCard, MetricCard, Sparkline, AIOperationProgress, FeedbackCue, ContextualTooltip, ContextualHelp, FeatureTooltip, TaskGuidance, PrerequisiteCheck, IntelligentEmptyState, QuickActionsMenu, FilterControls, SearchInput, ResponsiveTable, VirtualList, RealEstateIcons, NextStepsCard, MarketNotifications, OptimizedImage, LoadingStates

**Feature:** ListingDescriptionGeneratorForm, LifeEventPredictorForm, InvestmentOpportunityIdentificationForm, CompetitorForm, ProfileImageUpload, ImageUploader, EditOptionsPanel, EditPreview, ProcessingProgress, EditHistoryList, RateLimitStatus, ChatInterface, VisionInterface, VisionAnalysisResults, AgentProfileForm, AgentProfilePreview, SocialMediaConnections, SocialPublishingDialog, MLSConnection, ProfileCompletionBanner, SuggestedNextSteps, FrequentFeatures, LoginHistory, AITrainingPlan, AIRolePlay, Quiz, AIDashboard

**Layout:** PageLayout

**Utility:** ThemeProvider, ThemeToggle, Logo, PageTransition, PageHeader, S3FileUpload, JsonLdDisplay, ListingMetricsDisplay, PerformanceMonitor, ErrorBoundary, SessionLoading, OnboardingProvider

---

## Additional Resources

- **[Standardization Guide](./standardization-guide.md)** - How to use shared components ⭐
- [Component Reference](./component-reference.md) - Detailed API documentation
- [Design System](./design-system/) - Design tokens and guidelines
- [Best Practices](./best-practices.md) - Development guidelines
- [Quick Reference](./quick-reference.md) - Common patterns and snippets
