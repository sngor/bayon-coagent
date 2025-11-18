/**
 * Utility functions for search functionality
 */

/**
 * Highlights matching text in a string by wrapping matches in a mark element
 * @param text - The text to search within
 * @param query - The search query to highlight
 * @returns HTML string with highlighted matches
 */
export function highlightMatches(text: string, query: string): string {
  if (!query.trim()) {
    return text;
  }

  // Escape special regex characters in the query
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Create case-insensitive regex with global flag
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  
  // Replace matches with mark tags
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900 text-foreground font-medium rounded px-0.5">$1</mark>');
}

/**
 * Filters an array of items based on a search query
 * @param items - Array of items to filter
 * @param query - Search query string
 * @param searchFields - Function that returns searchable text from an item
 * @returns Filtered array of items
 */
export function filterBySearch<T>(
  items: T[],
  query: string,
  searchFields: (item: T) => string[]
): T[] {
  if (!query.trim()) {
    return items;
  }

  const lowerQuery = query.toLowerCase();

  return items.filter((item) => {
    const fields = searchFields(item);
    return fields.some((field) =>
      field.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Checks if a string matches a search query (case-insensitive)
 * @param text - Text to search in
 * @param query - Search query
 * @returns true if text contains query
 */
export function matchesSearch(text: string, query: string): boolean {
  if (!query.trim()) {
    return true;
  }
  return text.toLowerCase().includes(query.toLowerCase());
}

/**
 * Filters items by both search query and filter selections
 * @param items - Array of items to filter
 * @param searchQuery - Search query string
 * @param selectedFilters - Object mapping filter group IDs to selected values
 * @param searchFields - Function that returns searchable text from an item
 * @param filterFields - Function that returns filter values from an item
 * @returns Filtered array of items
 */
export function filterBySearchAndFilters<T>(
  items: T[],
  searchQuery: string,
  selectedFilters: Record<string, string[]>,
  searchFields: (item: T) => string[],
  filterFields: (item: T) => Record<string, string>
): T[] {
  // First apply search filter
  let filtered = filterBySearch(items, searchQuery, searchFields);

  // Then apply category filters
  const hasActiveFilters = Object.values(selectedFilters).some(
    (filters) => filters.length > 0
  );

  if (hasActiveFilters) {
    filtered = filtered.filter((item) => {
      const itemFilters = filterFields(item);
      
      // Item must match ALL active filter groups
      return Object.entries(selectedFilters).every(([groupId, values]) => {
        // If no filters selected for this group, pass
        if (values.length === 0) return true;
        
        // Check if item's value for this group is in selected values
        const itemValue = itemFilters[groupId];
        return values.includes(itemValue);
      });
    });
  }

  return filtered;
}

/**
 * Counts items per filter option
 * @param items - Array of items
 * @param filterField - Function that returns the filter value from an item
 * @returns Object mapping filter values to counts
 */
export function countFilterOptions<T>(
  items: T[],
  filterField: (item: T) => string
): Record<string, number> {
  const counts: Record<string, number> = {};
  
  items.forEach((item) => {
    const value = filterField(item);
    counts[value] = (counts[value] || 0) + 1;
  });
  
  return counts;
}
