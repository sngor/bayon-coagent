# Search Functionality Implementation

## Overview

This document describes the implementation of reusable search functionality for content lists across the application. The implementation includes a search input component, utility functions for filtering and highlighting, and integration examples.

## Components Created

### 1. SearchInput Component (`src/components/ui/search-input.tsx`)

A reusable search input component with the following features:

- **Debounced Input**: Prevents excessive re-renders by debouncing user input (default 300ms)
- **Clear Button**: Shows an X button when text is present to quickly clear the search
- **Search Icon**: Visual indicator that this is a search field
- **Accessible**: Proper ARIA labels and keyboard navigation support
- **Customizable**: Accepts all standard input props plus custom debounce timing

#### Usage Example

```tsx
import { SearchInput } from "@/components/ui/search-input";

function MyComponent() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <SearchInput
      value={searchQuery}
      onChange={setSearchQuery}
      onClear={() => setSearchQuery("")}
      placeholder="Search..."
      aria-label="Search items"
    />
  );
}
```

#### Props

- `value: string` - Current search value
- `onChange: (value: string) => void` - Callback when search value changes
- `onClear?: () => void` - Optional callback when clear button is clicked
- `debounceMs?: number` - Debounce delay in milliseconds (default: 300)
- All standard HTML input attributes

### 2. Search Utility Functions (`src/lib/search-utils.ts`)

#### `filterBySearch<T>(items, query, searchFields)`

Filters an array of items based on a search query.

**Parameters:**

- `items: T[]` - Array of items to filter
- `query: string` - Search query string
- `searchFields: (item: T) => string[]` - Function that returns searchable fields from an item

**Returns:** Filtered array of items

**Example:**

```tsx
const filtered = filterBySearch(reports, searchQuery, (report) => [
  report.topic,
  report.description,
]);
```

#### `highlightMatches(text, query)`

Highlights matching text by wrapping matches in `<mark>` elements.

**Parameters:**

- `text: string` - Text to search within
- `query: string` - Search query to highlight

**Returns:** HTML string with highlighted matches

**Example:**

```tsx
<div
  dangerouslySetInnerHTML={{
    __html: highlightMatches(item.title, searchQuery),
  }}
/>
```

#### `matchesSearch(text, query)`

Simple boolean check if text matches a search query.

**Parameters:**

- `text: string` - Text to search in
- `query: string` - Search query

**Returns:** `true` if text contains query (case-insensitive)

### 3. NoResultsEmptyState Component

Enhanced the existing `NoResultsEmptyState` component in `src/components/ui/empty-states.tsx` to display when search returns no results.

#### Usage Example

```tsx
import { NoResultsEmptyState } from "@/components/ui/empty-states";

{
  searchQuery && filteredItems.length === 0 && (
    <NoResultsEmptyState
      searchTerm={searchQuery}
      onClearSearch={() => setSearchQuery("")}
      icon={<Search className="w-8 h-8 text-muted-foreground" />}
    />
  );
}
```

## Integration Examples

### Knowledge Base Page

The Knowledge Base page (`src/app/(app)/knowledge-base/page.tsx`) now includes:

1. **Search Input**: Filters research reports by topic
2. **Real-time Filtering**: Results update as you type (debounced)
3. **Highlighted Results**: Matching text is highlighted in yellow
4. **No Results State**: Shows helpful message when no matches found

### Research Agent Page

The Research Agent page (`src/app/(app)/research-agent/page.tsx`) includes search in the "Recent Reports" section with the same features.

### Demo Page

A comprehensive demo page (`src/app/(app)/search-demo/page.tsx`) showcases all search features:

- Search across multiple fields (title, description, category)
- Result count display
- Highlighted matches in all fields
- Empty states for both no search and no results

## Implementation Pattern

Here's the recommended pattern for adding search to any content list:

```tsx
'use client';

import { useState, useMemo } from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { NoResultsEmptyState } from '@/components/ui/empty-states';
import { filterBySearch, highlightMatches } from '@/lib/search-utils';
import { Search } from 'lucide-react';

export default function MyListPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Your data fetching logic here
  const { data: items, isLoading } = useQuery(...);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return filterBySearch(items, searchQuery, (item) => [
      item.title,
      item.description,
      // Add more searchable fields as needed
    ]);
  }, [items, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Search Input */}
      {!isLoading && items && items.length > 0 && (
        <div className="max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder="Search..."
            aria-label="Search items"
          />
        </div>
      )}

      {/* No Results State */}
      {!isLoading && items && items.length > 0 && searchQuery && filteredItems.length === 0 && (
        <NoResultsEmptyState
          searchTerm={searchQuery}
          onClearSearch={() => setSearchQuery('')}
          icon={<Search className="w-8 h-8 text-muted-foreground" />}
        />
      )}

      {/* Results */}
      {!isLoading && filteredItems && filteredItems.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle
                  dangerouslySetInnerHTML={{
                    __html: searchQuery
                      ? highlightMatches(item.title, searchQuery)
                      : item.title
                  }}
                />
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Features Implemented

### ✅ Reusable Search Input Component

- Debounced input for performance
- Clear button functionality
- Search icon indicator
- Accessible keyboard navigation
- Customizable styling

### ✅ Real-time Filtering

- Filters update as user types
- Debounced to prevent excessive re-renders
- Works with any data structure via callback function

### ✅ Search Result Highlighting

- Matches are highlighted in yellow
- Case-insensitive matching
- Works with dark mode
- Escapes special regex characters

### ✅ No Results Empty State

- Clear messaging when no results found
- Suggestions for improving search
- Clear search button
- Consistent with design system

## Requirements Validated

This implementation validates the following requirements from the spec:

- **22.1**: WHEN viewing lists of items THEN the Application SHALL provide a search input ✅
- **22.2**: WHEN typing in search THEN the Application SHALL filter results in real-time ✅
- **22.3**: WHEN viewing searchable content THEN the Application SHALL highlight matching terms ✅
- **22.4**: WHEN no results match THEN the Application SHALL display a helpful empty state ✅

## Testing

To test the search functionality:

1. **Visit the Demo Page**: Navigate to `/search-demo` to see all features in action
2. **Try Different Queries**: Search for "buyer", "market", "investment", etc.
3. **Test Edge Cases**: Try empty search, special characters, very long queries
4. **Test Highlighting**: Verify matches are highlighted correctly
5. **Test No Results**: Search for something that doesn't exist
6. **Test Clear Button**: Click the X to clear search
7. **Test Keyboard Navigation**: Use Tab and Enter keys

## Performance Considerations

- **Debouncing**: 300ms debounce prevents excessive filtering operations
- **Memoization**: `useMemo` ensures filtering only runs when data or query changes
- **Case-insensitive**: Converts to lowercase once for comparison
- **Regex Escaping**: Properly escapes special characters to prevent regex errors

## Accessibility

- **ARIA Labels**: Search inputs have proper `aria-label` attributes
- **Keyboard Navigation**: Full keyboard support (Tab, Enter, Escape)
- **Screen Readers**: Clear button has `aria-label="Clear search"`
- **Focus Management**: Proper focus indicators on all interactive elements

## Future Enhancements

Potential improvements for future iterations:

1. **Advanced Filters**: Add dropdown filters for categories, dates, etc.
2. **Search History**: Remember recent searches
3. **Fuzzy Matching**: Implement fuzzy search for typo tolerance
4. **Search Suggestions**: Show autocomplete suggestions as user types
5. **Search Analytics**: Track popular search terms
6. **Multi-field Weighting**: Prioritize matches in titles over descriptions
7. **Keyboard Shortcuts**: Add Cmd+K or Ctrl+K to focus search

## Conclusion

The search functionality is now fully implemented and ready for use across the application. The reusable components and utilities make it easy to add search to any content list with minimal code.
