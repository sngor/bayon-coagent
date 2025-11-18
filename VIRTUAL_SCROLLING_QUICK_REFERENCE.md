# Virtual Scrolling Quick Reference

## Quick Start

### 1. Basic Virtual List

```typescript
import { VirtualList } from "@/components/ui/virtual-list";

<VirtualList
  items={myData}
  itemHeight={80}
  containerHeight={600}
  renderItem={(item) => <div>{item.title}</div>}
/>;
```

### 2. With Pagination Fallback

```typescript
import { usePagination } from "@/hooks/use-pagination";
import { Pagination } from "@/components/ui/pagination";

const { pageItems, currentPage, totalPages, goToPage } = usePagination(items);

<div>
  {pageItems.map((item) => (
    <ItemCard key={item.id} item={item} />
  ))}
  <Pagination
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={goToPage}
  />
</div>;
```

### 3. Automatic Strategy Selection

```typescript
import { getOptimalListStrategy } from "@/lib/list-optimization";

const strategy = getOptimalListStrategy({
  itemCount: items.length,
  estimatedItemHeight: 80,
});

// Use strategy.strategy to decide which component to render
```

## When to Use What

| Item Count | Recommended Approach | Reason                     |
| ---------- | -------------------- | -------------------------- |
| < 50       | Standard rendering   | Fast enough, simpler code  |
| 50-500     | Pagination           | Good balance, SEO-friendly |
| 500+       | Virtual scrolling    | Best performance           |

## Common Patterns

### With Search

```typescript
const filteredItems = useMemo(() =>
  items.filter(item => item.title.includes(search)),
  [items, search]
);

<VirtualList items={filteredItems} ... />
```

### With Filters

```typescript
const filteredItems = useMemo(() =>
  items.filter(item => filters.includes(item.status)),
  [items, filters]
);

<VirtualList items={filteredItems} ... />
```

### Variable Height Items

For items with different heights, use average height:

```typescript
<VirtualList
  items={items}
  itemHeight={100} // Use average height
  containerHeight={600}
  overscan={10} // Increase overscan for smoother scrolling
  renderItem={renderItem}
/>
```

## Performance Tips

1. **Memoize filtered data**: Always use `useMemo` for filtered/sorted lists
2. **Keep render simple**: Avoid heavy computations in render function
3. **Use fixed heights**: Virtual scrolling works best with consistent item heights
4. **Adjust overscan**: Higher overscan = smoother scrolling, more DOM nodes

## Demo

Visit `/virtual-scroll-demo` to see live examples and performance comparisons.

## Files

- `src/hooks/use-virtual-scroll.tsx` - Virtual scrolling hook
- `src/components/ui/virtual-list.tsx` - Virtual list component
- `src/hooks/use-pagination.tsx` - Pagination hook
- `src/components/ui/pagination.tsx` - Pagination component
- `src/lib/list-optimization.ts` - Optimization utilities
- `src/components/ui/virtual-scroll-guide.md` - Full documentation
