# Performance Components - Quick Start

Get started with performance-optimized components in 5 minutes.

## Installation

Components are already available in the project:

```tsx
import {
  LazyComponent,
  VirtualList,
  OptimizedImage,
} from "@/components/performance";
```

## Quick Examples

### 1. Lazy Load a Heavy Component

```tsx
import { LazyComponent } from "@/components/performance";
import { StandardLoadingState } from "@/components/standard";

export function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Lazy load heavy chart component */}
      <LazyComponent
        loader={() => import("./AnalyticsChart")}
        fallback={<StandardLoadingState variant="skeleton" />}
        props={{ data: analyticsData }}
      />
    </div>
  );
}
```

### 2. Render a Large List

```tsx
import { SimpleVirtualList } from "@/components/performance";

export function ContentLibrary({ items }: { items: Content[] }) {
  return (
    <SimpleVirtualList
      items={items}
      itemHeight={100}
      height={600}
      renderItem={(item) => (
        <div className="p-4 border-b">
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </div>
      )}
    />
  );
}
```

### 3. Optimize Images

```tsx
import { PropertyImage, CardImage } from "@/components/performance";

export function PropertyCard({ property }: { property: Property }) {
  return (
    <div className="card">
      {/* Optimized property image */}
      <PropertyImage src={property.imageUrl} alt={property.address} />

      <div className="p-4">
        <h3>{property.address}</h3>
        <p>${property.price.toLocaleString()}</p>
      </div>
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Modal with Lazy Content

```tsx
import { Dialog } from "@/components/ui/dialog";
import { LazyComponent } from "@/components/performance";

export function EditModal({ isOpen, onClose, itemId }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        {/* Only load form when modal opens */}
        {isOpen && (
          <LazyComponent
            loader={() => import("./EditForm")}
            props={{ itemId, onSave: handleSave }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern 2: Infinite Scroll List

```tsx
import { VirtualList } from "@/components/performance";
import { useInfiniteQuery } from "@tanstack/react-query";

export function InfiniteList() {
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["items"],
    queryFn: fetchItems,
  });

  const allItems = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <VirtualList
      items={allItems}
      itemHeight={80}
      height="100vh"
      renderItem={(item) => <ItemCard item={item} />}
      onScroll={(scrollTop) => {
        // Load more when near bottom
        if (hasNextPage && scrollTop > totalHeight - 1000) {
          fetchNextPage();
        }
      }}
    />
  );
}
```

### Pattern 3: Hero Section with Optimized Image

```tsx
import { HeroImage } from "@/components/performance";

export function HeroSection() {
  return (
    <section className="relative h-[600px]">
      {/* Priority load hero image */}
      <HeroImage
        src="/hero.jpg"
        alt="Welcome to Bayon"
        priority
        className="absolute inset-0"
      />

      <div className="relative z-10 flex items-center justify-center h-full">
        <h1 className="text-6xl font-bold text-white">
          Welcome to Bayon Coagent
        </h1>
      </div>
    </section>
  );
}
```

### Pattern 4: Tabbed Content with Lazy Loading

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LazyComponent } from "@/components/performance";

export function AnalyticsTabs() {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="charts">Charts</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewContent />
      </TabsContent>

      <TabsContent value="charts">
        {/* Only load when tab is active */}
        <LazyComponent loader={() => import("./ChartsTab")} />
      </TabsContent>

      <TabsContent value="reports">
        <LazyComponent loader={() => import("./ReportsTab")} />
      </TabsContent>
    </Tabs>
  );
}
```

## Performance Checklist

### ✅ Lazy Loading

- [ ] Heavy components (>50KB) are lazy loaded
- [ ] Modal/dialog content is lazy loaded
- [ ] Below-the-fold content is lazy loaded
- [ ] Third-party integrations are lazy loaded

### ✅ Virtual Scrolling

- [ ] Lists with 100+ items use VirtualList
- [ ] Infinite scroll uses VirtualList
- [ ] Chat/message lists use VirtualList

### ✅ Image Optimization

- [ ] All images use OptimizedImage or presets
- [ ] Above-the-fold images have `priority`
- [ ] Images have proper dimensions or aspect ratios
- [ ] Responsive images have `sizes` prop

## Troubleshooting

### LazyComponent not loading

**Problem:** Component never loads or shows error.

**Solution:**

```tsx
// Check import path
<LazyComponent
  loader={() => import('./MyComponent')} // ✓ Correct
  // loader={() => import('MyComponent')} // ✗ Wrong
/>

// Add error handling
<LazyComponent
  loader={() => import('./MyComponent')}
  onError={(error) => console.error('Load failed:', error)}
  errorMessage="Failed to load component"
/>
```

### VirtualList items not rendering

**Problem:** List appears empty or items are cut off.

**Solution:**

```tsx
// Ensure height is set
<VirtualList
  items={items}
  itemHeight={80}
  height={600} // ✓ Required
  renderItem={(item) => <div>{item.name}</div>}
/>

// For variable heights, provide getItemHeight
<VirtualList
  items={items}
  getItemHeight={(item) => item.isLarge ? 120 : 60}
  height={600}
  renderItem={(item) => <div>{item.name}</div>}
/>
```

### OptimizedImage layout shift

**Problem:** Images cause layout to jump when loading.

**Solution:**

```tsx
// Always provide dimensions or aspect ratio
<OptimizedImage
  src="/image.jpg"
  alt="Image"
  width={800}
  height={600}
  aspectRatio="4/3" // ✓ Prevents layout shift
/>

// Or use preset components
<PropertyImage src="/property.jpg" alt="Property" />
```

## Next Steps

1. **Read the full documentation**: [README.md](./README.md)
2. **Review examples**: Check `src/components/performance/__tests__/` for more examples
3. **Check performance**: Use Chrome DevTools Performance tab
4. **Monitor bundle size**: Run `npm run analyze` to see bundle impact

## Need Help?

- Check [README.md](./README.md) for detailed documentation
- Review [Design System Performance Spec](.kiro/specs/design-system-performance/)
- See [Standard Components](../standard/QUICK_START.md) for related patterns
