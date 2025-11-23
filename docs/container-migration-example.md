# Container Migration Example

This example shows how to migrate from inconsistent container styling to the standardized system.

## Before: Inconsistent Styling

```tsx
// Dashboard error state - inconsistent classes
<div className="rounded-lg border bg-card text-card-foreground shadow-lg p-6">
  <div className="text-center">
    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
    <h3 className="text-lg font-semibold mb-2">Unable to Load Dashboard</h3>
    <p className="text-muted-foreground mb-4">{dashboardError}</p>
    <Button onClick={() => window.location.reload()}>Try Again</Button>
  </div>
</div>

// Welcome message - complex custom styling
<div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 shadow-lg rounded-lg border bg-card text-card-foreground">
  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5 opacity-50" />
  <div className="relative flex items-start gap-4 p-6">
    {/* Content */}
  </div>
</div>

// Metric cards - verbose styling
<div className="group relative overflow-hidden text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 dark:from-blue-950 dark:via-blue-900 dark:to-blue-950 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  <div className="relative">
    {/* Metric content */}
  </div>
</div>
```

## After: Standardized System

```tsx
import {
  Container,
  ErrorContainer,
  NotificationContainer,
  MetricContainer
} from "@/components/ui/container"

// Dashboard error state - clean and semantic
<ErrorContainer padding="lg">
  <div className="text-center">
    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
    <h3 className="text-lg font-semibold mb-2">Unable to Load Dashboard</h3>
    <p className="text-muted-foreground mb-4">{dashboardError}</p>
    <Button onClick={() => window.location.reload()}>Try Again</Button>
  </div>
</ErrorContainer>

// Welcome message - semantic and clean
<NotificationContainer padding="lg">
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
      <Zap className="w-7 h-7 text-white" />
    </div>
    <div className="flex-1">
      <h3 className="font-bold text-xl mb-3">Welcome to Bayon Coagent! 🎉</h3>
      <p className="text-muted-foreground mb-6 text-base leading-relaxed">
        Let's get you set up for success. Complete your profile to unlock personalized strategies and AI-powered tools.
      </p>
      {/* Rest of content */}
    </div>
  </div>
</NotificationContainer>

// Metric cards - simple and consistent
<MetricContainer>
  <div className="text-3xl font-bold text-blue-600">$1.2M</div>
  <div className="text-sm text-muted-foreground">Total Sales</div>
</MetricContainer>
```

## Benefits of Migration

### 1. Consistency

- All containers use the same border and shadow system
- Consistent spacing and padding
- Unified color schemes

### 2. Maintainability

- Single source of truth for container styles
- Easy to update styling across the entire app
- Semantic component names make code self-documenting

### 3. Developer Experience

- IntelliSense support for container variants
- Type-safe props prevent styling mistakes
- Clear documentation and examples

### 4. Performance

- Reduced CSS bundle size through class reuse
- Optimized animations with GPU acceleration
- Consistent transition timing

## Step-by-Step Migration

### 1. Identify Container Patterns

Look for these common patterns in your code:

```tsx
// Basic containers
className = "border rounded-lg shadow-sm p-4";
className = "bg-card border shadow-md rounded-lg";

// Status containers
className = "bg-green-50 border border-green-200 rounded-lg p-4";
className = "bg-red-50 border border-red-200 rounded-lg p-4";

// Interactive containers
className = "border rounded-lg hover:shadow-lg transition-all";
```

### 2. Choose Appropriate Container

- **Basic content**: `<Container>`
- **Cards/features**: `<Container variant="elevated">`
- **Important elements**: `<Container variant="floating">`
- **Status messages**: `<SuccessContainer>`, `<ErrorContainer>`, etc.
- **Metrics/stats**: `<MetricContainer>`
- **Notifications**: `<NotificationContainer>`

### 3. Replace Classes

```tsx
// Before
<div className="border rounded-lg shadow-sm p-4 bg-card">

// After
<Container>
```

### 4. Add Interactivity

```tsx
// Before
<div className="border rounded-lg shadow-sm p-4 hover:shadow-lg cursor-pointer transition-all">

// After
<Container interactive>
```

### 5. Handle Special Cases

```tsx
// Custom styling still supported
<Container className="custom-class">

// Combine with existing patterns
<Container variant="floating" padding="xl" border="accent">
```

## Common Migration Patterns

### Dashboard Cards

```tsx
// Before
<div className="bg-card border rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">

// After
<Container variant="elevated" interactive padding="lg">
```

### Status Messages

```tsx
// Before
<div className="bg-green-50 border border-green-200 rounded-lg p-4">

// After
<SuccessContainer>
```

### Feature Highlights

```tsx
// Before
<div className="border-2 border-primary/20 rounded-xl shadow-lg p-6 bg-gradient-to-br from-primary/5 to-transparent">

// After
<Container variant="floating" gradient="primary" padding="lg">
```

### Modal Content

```tsx
// Before
<div className="bg-background border rounded-xl shadow-2xl p-8">

// After
<Container variant="modal" padding="xl">
```

This migration approach ensures all containers have consistent styling while maintaining flexibility for custom use cases.
