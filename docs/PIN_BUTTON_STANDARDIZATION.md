# Pin Button Standardization Guide

## Overview

This guide documents the standardization of pin/star actions across all pages to ensure consistency and eliminate redundancy.

## Architecture

### Centralized Page Metadata

All page metadata is now centralized in `src/lib/page-metadata.ts`. This ensures:

- **No duplicate pins**: Each page has a unique ID
- **Consistency**: All pages use the same metadata structure
- **Maintainability**: Single source of truth for page information

### Key Components

1. **`src/lib/page-metadata.ts`**: Central registry of all pinnable pages
2. **`src/hooks/use-page-metadata.tsx`**: Hook to access page metadata
3. **`src/components/page-header-with-pin.tsx`**: Standardized header component with pin button
4. **`src/components/favorites-button.tsx`**: Reusable pin button component

## Usage Patterns

### Pattern 1: Using PageHeaderWithPin (Recommended)

For pages with a standard header:

```tsx
import { PageHeaderWithPin } from "@/components/page-header-with-pin";
import { getPageMetadata } from "@/lib/page-metadata";

export default function MyPage() {
  const pageMetadata = getPageMetadata("/my-page");

  if (!pageMetadata) return null;

  return (
    <div>
      <PageHeaderWithPin
        title="My Page"
        description="Page description"
        pageMetadata={pageMetadata}
        actions={<Button>Custom Action</Button>}
      />
      {/* Page content */}
    </div>
  );
}
```

### Pattern 2: Using FavoritesButton Directly

For pages with custom layouts:

```tsx
import { FavoritesButton } from "@/components/favorites-button";
import { getPageMetadata } from "@/lib/page-metadata";

export default function MyPage() {
  const pageMetadata = getPageMetadata("/my-page");

  if (!pageMetadata) return null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1>My Page</h1>
        <FavoritesButton item={pageMetadata} variant="outline" size="sm" />
      </div>
      {/* Page content */}
    </div>
  );
}
```

### Pattern 3: Using usePageMetadata Hook

For client components that need current page metadata:

```tsx
"use client";

import { usePageMetadata } from "@/hooks/use-page-metadata";
import { FavoritesButton } from "@/components/favorites-button";

export default function MyPage() {
  const pageMetadata = usePageMetadata();

  if (!pageMetadata) return null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1>{pageMetadata.title}</h1>
        <FavoritesButton item={pageMetadata} />
      </div>
    </div>
  );
}
```

### Pattern 4: Hub Layout (Automatic)

For pages using HubLayoutWithFavorites, the pin button is automatically added:

```tsx
import { HubLayoutWithFavorites } from "@/components/hub/hub-layout-with-favorites";

export default function MyPage() {
  return (
    <HubLayoutWithFavorites
      title="My Page"
      description="Page description"
      icon={MyIcon}
      tabs={tabs}
      enableFavorites={true} // Default is true
    >
      {/* Page content */}
    </HubLayoutWithFavorites>
  );
}
```

## Adding New Pages

To add a new page to the pin system:

1. **Add metadata to `src/lib/page-metadata.ts`**:

```typescript
export const PAGE_METADATA: Record<string, Omit<FavoriteItem, "addedAt">> = {
  // ... existing pages
  "/my-new-page": {
    id: "my-new-page",
    title: "My New Page",
    description: "Description of my page",
    href: "/my-new-page",
    icon: "IconName", // Lucide icon name
    color: "bg-blue-500",
    gradient: "from-blue-500 to-blue-600",
  },
};
```

2. **Use the metadata in your page**:

```tsx
import { getPageMetadata } from "@/lib/page-metadata";
import { FavoritesButton } from "@/components/favorites-button";

export default function MyNewPage() {
  const pageMetadata = getPageMetadata("/my-new-page");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1>My New Page</h1>
        {pageMetadata && <FavoritesButton item={pageMetadata} />}
      </div>
    </div>
  );
}
```

## Migration Checklist

### Pages with Pin Buttons (22 pages)

- [x] `/assistant`
- [x] `/brand/audit`
- [x] `/brand/calendar`
- [x] `/brand/competitors`
- [x] `/brand/profile`
- [x] `/brand/strategy`
- [x] `/brand/testimonials`
- [x] `/client-dashboards`
- [x] `/client-gifts`
- [x] `/intelligence/reports`
- [x] `/intelligence/trends`
- [x] `/knowledge-base`
- [x] `/learning/lessons`
- [x] `/library/content`
- [x] `/research-agent`
- [x] `/studio/describe`
- [x] `/studio/post-cards`
- [x] `/studio/reimagine`
- [x] `/studio/write`
- [x] `/tools/calculator`
- [x] `/tools/roi`
- [x] `/tools/valuation`

### Pages Missing Pin Buttons (Need to Add)

- [ ] `/dashboard`
- [ ] `/intelligence/agent`
- [ ] `/intelligence/news`
- [ ] `/intelligence/alerts`
- [ ] `/intelligence/opportunities`
- [ ] `/intelligence/analytics`
- [ ] `/intelligence/knowledge`
- [ ] `/tools/document-scanner`
- [ ] `/library/reports`
- [ ] `/library/media`
- [ ] `/library/templates`
- [ ] `/learning/ai-plan`
- [ ] `/settings`
- [ ] `/integrations`
- [ ] `/studio/open-house`

## Benefits

1. **No Duplicate Pins**: Each page has a unique ID, preventing the same page from being pinned multiple times
2. **Consistency**: All pin buttons look and behave the same way
3. **Maintainability**: Single source of truth for page metadata
4. **Type Safety**: TypeScript ensures correct usage
5. **Easy Discovery**: Users can find all pinnable pages in the quick actions dialog

## Deprecated Patterns

### ❌ Don't Use getPageConfig

```tsx
// OLD - Don't use this
import { getPageConfig } from "@/components/dashboard-quick-actions";

const pageConfig = getPageConfig("/my-page");
```

### ✅ Use getPageMetadata Instead

```tsx
// NEW - Use this
import { getPageMetadata } from "@/lib/page-metadata";

const pageMetadata = getPageMetadata("/my-page");
```

### ❌ Don't Add Pages to AVAILABLE_PAGES

```tsx
// OLD - Don't add pages here
export const AVAILABLE_PAGES = [
  // ...
];
```

### ✅ Add Pages to PAGE_METADATA

```tsx
// NEW - Add pages here
export const PAGE_METADATA: Record<string, Omit<FavoriteItem, "addedAt">> = {
  // ...
};
```

## Testing

To verify pin button functionality:

1. Navigate to a page with a pin button
2. Click the pin button - should show "Pinned" toast
3. Go to dashboard - page should appear in Quick Actions
4. Click pin button again - should show "Unpinned" toast
5. Go to dashboard - page should be removed from Quick Actions
6. Try pinning the same page from different locations - should maintain single pin

## Troubleshooting

### Pin button not showing

1. Check if page is registered in `src/lib/page-metadata.ts`
2. Verify the path matches exactly (including leading slash)
3. Check if `pageMetadata` is undefined in your component

### Duplicate pins appearing

1. Ensure page ID is unique in `PAGE_METADATA`
2. Check if page is using old `getPageConfig` pattern
3. Verify only one pin button per page

### Pin not persisting

1. Check browser localStorage
2. Verify user is authenticated
3. Check console for errors

## Future Enhancements

- [ ] Add pin categories/folders
- [ ] Allow custom pin icons
- [ ] Add pin reordering in dashboard
- [ ] Add pin search/filter
- [ ] Add pin analytics (most pinned pages)
