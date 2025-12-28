# Virtual Scrolling Implementation Guide

This guide explains how to implement virtual scrolling for large lists in the application.

## Overview

Virtual scrolling is a technique that only renders visible items in a list, dramatically improving performance for large datasets. Instead of rendering 10,000 DOM nodes, we only render the 15-20 items currently visible on screen.

## When to Use Virtual Scrolling

Use the `getOptimalListStrategy` utility to determine the best approach:

```typescript
import { getOptimalListStrategy } from "@/lib/list-optimization";

const strategy = getOptimalListStrategy({
  itemCount: items.length,
  estimatedItemHeight: 80,
  containerHeight: 600,
});

// strategy.strategy will be: 'virtual-scroll' | 'pagination' | 'standard'
```

### Guidelines

- **Standard rendering**: < 50 items
- **Pagination**: 50-500 items (or when SEO is important)
- **Virtual scrolling**: 500+ items (or when smooth scrolling is critical)

## Basic Usage

### Using the VirtualList Component

```typescript
import { VirtualList } from '@/components/ui/virtual-list';

function MyListComponent() {
  const items = [...]; // Your data array

  return (
    <VirtualList
      items={items}
      itemHeight={80}
      containerHeight={600}
      renderItem={(item, index) => (
        <div className="p-4 border-b">
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </div>
      )}
      className="border rounded-lg"
    />
  );
}
```

### Using the useVirtualScroll Hook

For more control, use the hook directly:

```typescript
import { useVirtualScroll } from '@/hooks/use-virtual-scroll';

function MyCustomList() {
  const items = [...]; // Your data array

  const { virtualItems, totalHeight, containerRef } = useVirtualScroll(items, {
    itemHeight: 80,
    containerHeight: 600,
    overscan: 3,
  });

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: 600 }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map(({ index, item, offsetTop }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: 80,
              transform: `translateY(${offsetTop}px)`,
            }}
          >
            {/* Your item content */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Pagination Fallback

For cases where pagination is more appropriate:

```typescript
import { usePagination } from '@/hooks/use-pagination';
import { Pagination } from '@/components/ui/pagination';

function MyPaginatedList() {
  const items = [...]; // Your data array

  const {
    currentPage,
    totalPages,
    pageItems,
    goToPage,
    startIndex,
    endIndex,
  } = usePagination(items, { itemsPerPage: 20 });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {pageItems.map((item) => (
          <div key={item.id}>{/* Your item content */}</div>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={items.length}
      />
    </div>
  );
}
```

## Integration with Search and Filters

Virtual scrolling works seamlessly with search and filters:

```typescript
function MySearchableList() {
  const [searchQuery, setSearchQuery] = useState('');
  const allItems = [...]; // Your data

  // Filter items
  const filteredItems = useMemo(() => {
    if (!searchQuery) return allItems;
    return allItems.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allItems, searchQuery]);

  return (
    <div className="space-y-4">
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search items..."
      />

      <VirtualList
        items={filteredItems}
        itemHeight={80}
        containerHeight={600}
        renderItem={(item) => (
          <div>{item.title}</div>
        )}
      />
    </div>
  );
}
```

## Performance Optimization

### 1. Fixed Item Heights

Virtual scrolling works best with fixed-height items. If your items have variable heights, consider:

- Using an average height
- Implementing dynamic height calculation (more complex)
- Using pagination instead

### 2. Overscan

The `overscan` prop controls how many extra items to render above/below the visible area:

```typescript
<VirtualList
  items={items}
  itemHeight={80}
  containerHeight={600}
  overscan={5} // Render 5 extra items above and below
  renderItem={renderItem}
/>
```

- Lower overscan (1-3): Better performance, possible blank areas during fast scrolling
- Higher overscan (5-10): Smoother scrolling, slightly more DOM nodes

### 3. Memoization

Always memoize your filtered/sorted data:

```typescript
const filteredItems = useMemo(() => {
  return items.filter(/* ... */);
}, [items, dependencies]);
```

### 4. Render Function

Keep your render function lightweight:

```typescript
// Good: Simple, fast rendering
const renderItem = (item) => (
  <div className="p-4">
    <h3>{item.title}</h3>
  </div>
);

// Avoid: Heavy computations in render
const renderItem = (item) => (
  <div className="p-4">
    <h3>{expensiveComputation(item)}</h3> {/* Move to useMemo */}
  </div>
);
```

## Accessibility

Virtual scrolling maintains accessibility:

- Keyboard navigation works normally
- Screen readers can access all content
- Focus management is preserved

## Browser Support

Virtual scrolling works in all modern browsers:

- Chrome/Edge: Excellent
- Firefox: Excellent
- Safari: Excellent
- Mobile browsers: Good (with touch scrolling)

## Examples

See the demo page for live examples:

```
/virtual-scroll-demo
```

## Troubleshooting

### Items appear blank during scrolling

- Increase the `overscan` value
- Ensure `itemHeight` is accurate
- Check that items render quickly

### Scrolling feels janky

- Reduce complexity in render function
- Use CSS transforms instead of top/left positioning
- Ensure no expensive computations in render

### Items have wrong positions

- Verify `itemHeight` matches actual rendered height
- Check that container has fixed height
- Ensure no margin/padding affecting calculations

## Migration Guide

### From Standard List

Before:

```typescript
<div className="space-y-2">
  {items.map((item) => (
    <div key={item.id}>{item.title}</div>
  ))}
</div>
```

After:

```typescript
<VirtualList
  items={items}
  itemHeight={80}
  containerHeight={600}
  renderItem={(item) => <div className="p-4">{item.title}</div>}
/>
```

### From Pagination

Keep pagination for:

- SEO-critical pages
- Server-side data fetching
- When users need bookmarkable pages

Use virtual scrolling for:

- Client-side data
- Real-time filtering/search
- Smooth scrolling experience
