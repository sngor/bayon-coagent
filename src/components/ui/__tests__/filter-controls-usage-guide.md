# Filter Controls Usage Guide

## Overview

The `FilterControls` component provides a reusable, accessible filtering system for lists with multiple categories. It works seamlessly with the existing search functionality to provide comprehensive data filtering capabilities.

## Features

- ✅ Multiple filter groups with dropdown menus
- ✅ Clear filter indicators with badges
- ✅ Active filter count display
- ✅ Clear all filters functionality
- ✅ Accessible keyboard navigation
- ✅ Works with search functionality
- ✅ Responsive design
- ✅ Item count per filter option

## Basic Usage

### 1. Import Required Components

```tsx
import {
  FilterControls,
  useFilters,
  type FilterGroup,
} from "@/components/ui/filter-controls";
import { filterBySearchAndFilters } from "@/lib/search-utils";
```

### 2. Set Up Filter State

```tsx
const {
  selectedFilters,
  handleFilterChange,
  handleClearAll,
  hasActiveFilters,
} = useFilters();
```

### 3. Define Filter Groups

```tsx
const filterGroups: FilterGroup[] = [
  {
    id: "category",
    label: "Category",
    options: [
      { value: "residential", label: "Residential", count: 10 },
      { value: "commercial", label: "Commercial", count: 5 },
    ],
  },
  {
    id: "status",
    label: "Status",
    options: [
      { value: "available", label: "Available", count: 8 },
      { value: "sold", label: "Sold", count: 7 },
    ],
  },
];
```

### 4. Render Filter Controls

```tsx
<FilterControls
  filterGroups={filterGroups}
  selectedFilters={selectedFilters}
  onFilterChange={handleFilterChange}
  onClearAll={handleClearAll}
/>
```

### 5. Apply Filters to Data

```tsx
const filteredItems = useMemo(() => {
  return filterBySearchAndFilters(
    items,
    searchQuery,
    selectedFilters,
    (item) => [item.name, item.description], // Search fields
    (item) => ({
      category: item.category,
      status: item.status,
    }) // Filter fields
  );
}, [items, searchQuery, selectedFilters]);
```

## Integration with Search

The filter controls work seamlessly with the search functionality:

```tsx
import { SearchInput } from "@/components/ui/search-input";
import { FilterControls, useFilters } from "@/components/ui/filter-controls";
import { filterBySearchAndFilters } from "@/lib/search-utils";

function MyComponent() {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    selectedFilters,
    handleFilterChange,
    handleClearAll,
    hasActiveFilters,
  } = useFilters();

  const filteredData = useMemo(() => {
    return filterBySearchAndFilters(
      data,
      searchQuery,
      selectedFilters,
      (item) => [item.title, item.description],
      (item) => ({ category: item.category })
    );
  }, [data, searchQuery, selectedFilters]);

  return (
    <div className="space-y-4">
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search..."
      />

      <FilterControls
        filterGroups={filterGroups}
        selectedFilters={selectedFilters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
      />

      {/* Results display */}
      <div>
        {filteredData.map((item) => (
          <div key={item.id}>{item.title}</div>
        ))}
      </div>
    </div>
  );
}
```

## Advanced Usage

### Custom Initial Filters

```tsx
const { selectedFilters, handleFilterChange } = useFilters({
  category: ["residential"],
  status: ["available"],
});
```

### Dynamic Filter Counts

Use the `countFilterOptions` utility to calculate counts dynamically:

```tsx
import { countFilterOptions } from "@/lib/search-utils";

const categoryCounts = useMemo(() => {
  return countFilterOptions(items, (item) => item.category);
}, [items]);

const filterGroups: FilterGroup[] = [
  {
    id: "category",
    label: "Category",
    options: [
      {
        value: "residential",
        label: "Residential",
        count: categoryCounts["residential"],
      },
      {
        value: "commercial",
        label: "Commercial",
        count: categoryCounts["commercial"],
      },
    ],
  },
];
```

### Conditional Filter Display

```tsx
{
  hasActiveFilters && (
    <div className="text-sm text-muted-foreground">
      {filteredItems.length} results with active filters
    </div>
  );
}
```

### Clear Search and Filters Together

```tsx
<NoResultsEmptyState
  searchTerm={searchQuery}
  onClearSearch={() => {
    setSearchQuery("");
    handleClearAll();
  }}
/>
```

## API Reference

### FilterControls Props

| Prop              | Type                                          | Description                            |
| ----------------- | --------------------------------------------- | -------------------------------------- |
| `filterGroups`    | `FilterGroup[]`                               | Array of filter group definitions      |
| `selectedFilters` | `Record<string, string[]>`                    | Currently selected filters             |
| `onFilterChange`  | `(groupId: string, values: string[]) => void` | Callback when filters change           |
| `onClearAll`      | `() => void`                                  | Optional callback to clear all filters |
| `className`       | `string`                                      | Optional CSS class name                |

### FilterGroup Type

```typescript
interface FilterGroup {
  id: string; // Unique identifier for the filter group
  label: string; // Display label for the filter group
  options: FilterOption[]; // Available filter options
}
```

### FilterOption Type

```typescript
interface FilterOption {
  value: string; // Unique value for the option
  label: string; // Display label for the option
  count?: number; // Optional count of items with this option
}
```

### useFilters Hook

Returns an object with:

- `selectedFilters`: Current filter selections
- `handleFilterChange`: Function to update filters
- `handleClearAll`: Function to clear all filters
- `hasActiveFilters`: Boolean indicating if any filters are active

## Utility Functions

### filterBySearchAndFilters

Filters items by both search query and filter selections:

```typescript
filterBySearchAndFilters<T>(
  items: T[],
  searchQuery: string,
  selectedFilters: Record<string, string[]>,
  searchFields: (item: T) => string[],
  filterFields: (item: T) => Record<string, string>
): T[]
```

### countFilterOptions

Counts items per filter option:

```typescript
countFilterOptions<T>(
  items: T[],
  filterField: (item: T) => string
): Record<string, number>
```

## Accessibility

The filter controls are fully accessible:

- ✅ Keyboard navigation support
- ✅ ARIA labels for screen readers
- ✅ Focus indicators
- ✅ Semantic HTML structure

## Responsive Design

The filter controls adapt to different screen sizes:

- Mobile: Filters stack vertically
- Tablet/Desktop: Filters display horizontally with wrapping

## Examples in Codebase

See these files for working examples:

1. **Search Demo Page**: `src/app/(app)/search-demo/page.tsx`

   - Basic filter implementation with categories
   - Integration with search functionality

2. **Knowledge Base Page**: `src/app/(app)/knowledge-base/page.tsx`

   - Time period filtering
   - Dynamic filter counts
   - Integration with DynamoDB queries

3. **Filter Demo Component**: `src/components/ui/__tests__/filter-controls-demo.tsx`
   - Comprehensive demo with multiple filter groups
   - Shows filtered results in real-time

## Best Practices

1. **Always provide counts**: Include item counts in filter options when possible
2. **Use meaningful IDs**: Filter group IDs should match your data structure
3. **Combine with search**: Filters work best alongside search functionality
4. **Clear feedback**: Show active filter count and filtered results count
5. **Easy reset**: Always provide a way to clear all filters
6. **Responsive design**: Test filters on mobile devices

## Troubleshooting

### Filters not working

Ensure your `filterFields` function returns the correct field names:

```tsx
// ❌ Wrong - field names don't match filter group IDs
filterFields: (item) => ({ cat: item.category });

// ✅ Correct - field names match filter group IDs
filterFields: (item) => ({ category: item.category });
```

### Counts not updating

Make sure to recalculate counts when data changes:

```tsx
const categoryCounts = useMemo(() => {
  return countFilterOptions(items, (item) => item.category);
}, [items]); // Recalculate when items change
```

### Filters cleared on navigation

Use URL parameters or state management to persist filters:

```tsx
// Example with URL search params
const searchParams = useSearchParams();
const initialFilters = {
  category: searchParams.getAll("category"),
};
const { selectedFilters, handleFilterChange } = useFilters(initialFilters);
```
