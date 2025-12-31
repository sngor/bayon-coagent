# Component Library Reference

## UI Components (shadcn/ui)

### Basic Components

#### Button

```typescript
import { Button } from "@/components/ui/button";

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>

// States
<Button disabled>Disabled</Button>
<Button loading>Loading...</Button>
```

#### Input

```typescript
import { Input } from "@/components/ui/input";

<Input type="text" placeholder="Enter text..." />
<Input type="email" placeholder="Email address" />
<Input type="password" placeholder="Password" />
<Input disabled placeholder="Disabled input" />
```

#### Textarea

```typescript
import { Textarea } from "@/components/ui/textarea";

<Textarea placeholder="Enter your message..." />
<Textarea rows={5} placeholder="Larger textarea" />
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
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
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
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

#### Tabs

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
    <p>Content for tab 1</p>
  </TabsContent>
  <TabsContent value="tab2">
    <p>Content for tab 2</p>
  </TabsContent>
</Tabs>
```

#### Dialog

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
    <div>Dialog content</div>
    <DialogFooter>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Sheet

```typescript
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

<Sheet>
  <SheetTrigger asChild>
    <Button>Open Sheet</Button>
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Sheet Title</SheetTitle>
      <SheetDescription>Sheet description</SheetDescription>
    </SheetHeader>
    <div>Sheet content</div>
  </SheetContent>
</Sheet>
```

### Navigation Components

#### Breadcrumb

```typescript
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/studio">Studio</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Write</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

#### Navigation Menu

```typescript
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Features</NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuLink href="/studio">Studio</NavigationMenuLink>
        <NavigationMenuLink href="/brand">Brand</NavigationMenuLink>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
```

### Data Display Components

#### Table

```typescript
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

<Table>
  <TableCaption>A list of your recent content.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Title</TableHead>
      <TableHead>Type</TableHead>
      <TableHead>Created</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Blog Post Title</TableCell>
      <TableCell>Blog</TableCell>
      <TableCell>2024-01-01</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

#### Badge

```typescript
import { Badge } from "@/components/ui/badge";

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

#### Avatar

```typescript
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

<Avatar>
  <AvatarImage src="/avatar.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

### Feedback Components

#### Alert

```typescript
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components to your app using the cli.
  </AlertDescription>
</Alert>

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong.</AlertDescription>
</Alert>
```

#### Toast

```typescript
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

// Success toast
toast({
  title: "Success",
  description: "Content created successfully",
});

// Error toast
toast({
  title: "Error",
  description: "Failed to create content",
  variant: "destructive",
});

// Custom toast
toast({
  title: "Custom Toast",
  description: "With custom styling",
  duration: 5000,
});
```

#### Progress

```typescript
import { Progress } from "@/components/ui/progress";

<Progress value={33} className="w-full" />
<Progress value={66} className="w-full" />
<Progress value={100} className="w-full" />
```

### Form Components

#### Label

```typescript
import { Label } from "@/components/ui/label";

<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

#### Checkbox

```typescript
import { Checkbox } from "@/components/ui/checkbox";

<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>
```

#### Radio Group

```typescript
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

<RadioGroup defaultValue="option-one">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-one" id="option-one" />
    <Label htmlFor="option-one">Option One</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-two" id="option-two" />
    <Label htmlFor="option-two">Option Two</Label>
  </div>
</RadioGroup>
```

#### Switch

```typescript
import { Switch } from "@/components/ui/switch";

<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>
```

## Hub Components

### Hub Layout

```typescript
import { HubLayout } from "@/components/hub/hub-layout";
import { Search } from "lucide-react";

<HubLayout
  title="Research Hub"
  description="AI-powered research capabilities"
  icon={Search}
  tabs={[
    { id: 'agent', label: 'Research Agent', href: '/research/agent' },
    { id: 'reports', label: 'Reports', href: '/research/reports' },
  ]}
>
  {children}
</HubLayout>
```

### Hub Tabs

```typescript
import { HubTabs } from "@/components/hub/hub-tabs";

const tabs = [
  { id: 'write', label: 'Write', href: '/studio/write' },
  { id: 'describe', label: 'Describe', href: '/studio/describe' },
  { id: 'reimagine', label: 'Reimagine', href: '/studio/reimagine' },
];

<HubTabs tabs={tabs} currentTab="write" />
```

### Hub Header

```typescript
import { HubHeader } from "@/components/hub/hub-header";
import { Palette } from "lucide-react";

<HubHeader
  title="Studio Hub"
  description="Create professional content in minutes"
  icon={Palette}
  actions={
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      New Content
    </Button>
  }
/>
```

## Custom Components

### Loading States

```typescript
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

// Spinner
<LoadingSpinner size="sm" />
<LoadingSpinner size="md" />
<LoadingSpinner size="lg" />

// Skeleton
<LoadingSkeleton className="h-4 w-full" />
<LoadingSkeleton className="h-8 w-32" />
```

### Empty States

```typescript
import { EmptyState } from "@/components/ui/empty-state";
import { FileText } from "lucide-react";

<EmptyState
  icon={FileText}
  title="No content yet"
  description="Create your first piece of content to get started"
  action={
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Create Content
    </Button>
  }
/>
```

### Error Boundary

```typescript
import { ErrorBoundary } from "@/components/ui/error-boundary";

<ErrorBoundary fallback={<div>Something went wrong</div>}>
  <YourComponent />
</ErrorBoundary>
```

### Virtual Scroll

```typescript
import { VirtualScrollList } from "@/components/ui/virtual-scroll";

<VirtualScrollList
  items={largeItemList}
  itemHeight={60}
  containerHeight={400}
  renderItem={({ item, index }) => (
    <div key={index} className="p-4 border-b">
      {item.title}
    </div>
  )}
/>
```

## Form Patterns

### Basic Form

```typescript
import { useFormState } from "react-dom";
import { createContentAction } from "@/app/actions";

export function ContentForm() {
  const [state, formAction] = useFormState(createContentAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
      </div>
      
      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea id="content" name="content" required />
      </div>
      
      <div>
        <Label htmlFor="type">Type</Label>
        <Select name="type">
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blog">Blog Post</SelectItem>
            <SelectItem value="social">Social Media</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button type="submit">Create Content</Button>
      
      {state?.message && (
        <Alert variant={state.data ? "default" : "destructive"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
```

### Form with Validation

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  type: z.enum(["blog", "social"]),
});

export function ValidatedForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      type: "blog",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // Handle form submission
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

## Animation Components

### Framer Motion Wrappers

```typescript
import { motion } from "framer-motion";

// Fade in animation
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// Slide in animation
<motion.div
  initial={{ x: -20, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// Stagger children
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
>
  {items.map((item, index) => (
    <motion.div
      key={index}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {item}
    </motion.div>
  ))}
</motion.div>
```

## Responsive Patterns

### Mobile-First Design

```typescript
// Responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>

// Responsive spacing
<div className="p-4 md:p-6 lg:p-8">
  {/* Content */}
</div>
```

### Conditional Rendering

```typescript
import { useIsMobile } from "@/hooks/use-mobile";

export function ResponsiveComponent() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileView />;
  }

  return <DesktopView />;
}
```

## Accessibility Patterns

### Keyboard Navigation

```typescript
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation";

export function NavigableList({ items }: { items: any[] }) {
  const { focusedIndex, handleKeyDown } = useKeyboardNavigation(items.length);

  return (
    <div onKeyDown={handleKeyDown} tabIndex={0}>
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            "p-2 cursor-pointer",
            focusedIndex === index && "bg-accent"
          )}
          tabIndex={-1}
        >
          {item.title}
        </div>
      ))}
    </div>
  );
}
```

### Screen Reader Support

```typescript
// ARIA labels and descriptions
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

<div aria-describedby="help-text">
  <Input />
  <p id="help-text" className="sr-only">
    Enter your email address
  </p>
</div>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {status && <p>{status}</p>}
</div>
```

## Performance Patterns

### Memoization

```typescript
import { memo, useMemo } from "react";

// Memoized component
const ExpensiveComponent = memo(({ data }: { data: any[] }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: expensiveCalculation(item)
    }));
  }, [data]);

  return (
    <div>
      {processedData.map(item => (
        <div key={item.id}>{item.processed}</div>
      ))}
    </div>
  );
});
```

### Lazy Loading

```typescript
import { lazy, Suspense } from "react";

const HeavyComponent = lazy(() => import("./heavy-component"));

export function LazyWrapper() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

This component library reference provides comprehensive examples of all available UI components and patterns used in Bayon CoAgent. Use these examples as templates for building consistent, accessible, and performant user interfaces.