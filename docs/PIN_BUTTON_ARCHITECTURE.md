# Pin Button Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Pin Button System                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   src/lib/page-metadata.ts              │
        │   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
        │   Central Registry (Single Source)      │
        │   • 40+ page definitions                │
        │   • Unique IDs                          │
        │   • Metadata (title, icon, color)       │
        └─────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
    ┌───────────────────────┐   ┌───────────────────────┐
    │  getPageMetadata()    │   │  getAllPages()        │
    │  getPagesByCategory() │   │  usePageMetadata()    │
    └───────────────────────┘   └───────────────────────┘
                │                           │
                └─────────────┬─────────────┘
                              ▼
        ┌─────────────────────────────────────────┐
        │   src/components/favorites-button.tsx   │
        │   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
        │   Reusable Pin Button Component         │
        │   • Toggle pin/unpin                    │
        │   • Show toast notifications            │
        │   • Consistent styling                  │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   src/hooks/use-favorites.tsx           │
        │   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
        │   Favorites State Management             │
        │   • localStorage persistence            │
        │   • Add/remove/toggle                   │
        │   • Check if favorited                  │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   Dashboard Quick Actions               │
        │   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
        │   Display pinned pages                  │
        │   • Grid layout                         │
        │   • Search/filter                       │
        │   • Add more pages dialog               │
        └─────────────────────────────────────────┘
```

## Data Flow

### 1. Pin a Page

```
User clicks pin button
        │
        ▼
FavoritesButton component
        │
        ▼
toggleFavorite() from useFavorites hook
        │
        ▼
Update state + localStorage
        │
        ▼
Show toast notification
        │
        ▼
Dashboard Quick Actions updates automatically
```

### 2. Load Pinned Pages

```
User visits dashboard
        │
        ▼
DashboardQuickActions component
        │
        ▼
useFavorites() hook
        │
        ▼
Load from localStorage
        │
        ▼
Display pinned pages in grid
```

### 3. Add New Page to System

```
Developer adds page
        │
        ▼
Add to src/lib/page-metadata.ts
        │
        ▼
Import getPageMetadata in page
        │
        ▼
Add FavoritesButton to page
        │
        ▼
Page is now pinnable
        │
        ▼
Appears in "Add Pages" dialog
```

## Component Hierarchy

```
App
├── Dashboard
│   └── DashboardQuickActions
│       ├── useFavorites()
│       └── FavoritesButton (for each pinned page)
│
├── Studio Pages
│   ├── Write Page
│   │   └── FavoritesButton
│   ├── Describe Page
│   │   └── FavoritesButton
│   └── Reimagine Page
│       └── FavoritesButton
│
├── Brand Pages
│   ├── Profile Page
│   │   └── FavoritesButton
│   ├── Audit Page
│   │   └── FavoritesButton
│   └── ... (all have FavoritesButton)
│
└── Other Hubs
    └── ... (same pattern)
```

## File Structure

```
src/
├── lib/
│   └── page-metadata.ts          ← Central registry
│
├── hooks/
│   ├── use-favorites.tsx          ← State management
│   └── use-page-metadata.tsx      ← Metadata access
│
├── components/
│   ├── favorites-button.tsx       ← Pin button UI
│   ├── page-header-with-pin.tsx   ← Standardized header
│   ├── dashboard-quick-actions.tsx ← Dashboard display
│   └── hub/
│       └── hub-layout-with-favorites.tsx ← Hub integration
│
└── app/(app)/
    ├── studio/
    │   ├── write/page.tsx         ← Uses FavoritesButton
    │   ├── describe/page.tsx      ← Uses FavoritesButton
    │   └── reimagine/page.tsx     ← Uses FavoritesButton
    │
    ├── brand/
    │   ├── profile/page.tsx       ← Uses FavoritesButton
    │   └── ... (all use it)
    │
    └── ... (other hubs)
```

## State Management

### localStorage Structure

```json
{
  "favorites_user123": [
    {
      "id": "studio-write",
      "title": "Write Content",
      "description": "Create blog posts and articles",
      "href": "/studio/write",
      "icon": "PenTool",
      "color": "bg-blue-500",
      "gradient": "from-blue-500 to-blue-600",
      "addedAt": "2025-12-03T10:30:00.000Z"
    },
    {
      "id": "brand-competitors",
      "title": "Competitors",
      "description": "Track your competition",
      "href": "/brand/competitors",
      "icon": "TrendingUp",
      "color": "bg-orange-500",
      "gradient": "from-orange-500 to-orange-600",
      "addedAt": "2025-12-03T10:31:00.000Z"
    }
  ]
}
```

### React State Flow

```
useFavorites() hook
    │
    ├── favorites: FavoriteItem[]     ← Current pinned pages
    ├── isLoading: boolean            ← Loading state
    │
    ├── addFavorite(item)             ← Add to pins
    ├── removeFavorite(id)            ← Remove from pins
    ├── toggleFavorite(item)          ← Toggle pin state
    ├── isFavorite(id)                ← Check if pinned
    └── reorderFavorites(newOrder)    ← Reorder pins
```

## Integration Points

### 1. Page Metadata Registry

```typescript
// src/lib/page-metadata.ts
export const PAGE_METADATA: Record<string, Omit<FavoriteItem, "addedAt">> = {
  "/studio/write": {
    id: "studio-write",
    title: "Write Content",
    // ... metadata
  },
};
```

### 2. Page Component

```tsx
// src/app/(app)/studio/write/page.tsx
import { FavoritesButton } from "@/components/favorites-button";
import { getPageMetadata } from "@/lib/page-metadata";

export default function WritePage() {
  const pageMetadata = getPageMetadata("/studio/write");

  return <div>{pageMetadata && <FavoritesButton item={pageMetadata} />}</div>;
}
```

### 3. Dashboard Display

```tsx
// src/components/dashboard-quick-actions.tsx
export function DashboardQuickActions() {
  const { favorites } = useFavorites();

  return (
    <div className="grid grid-cols-4 gap-4">
      {favorites.map((favorite) => (
        <QuickActionCard key={favorite.id} {...favorite} />
      ))}
    </div>
  );
}
```

## Key Design Decisions

### 1. Centralized Metadata

**Why**: Single source of truth prevents duplicates and ensures consistency

### 2. localStorage Persistence

**Why**: Fast, client-side, no server calls needed for pins

### 3. Unique IDs

**Why**: Prevents duplicate pins of the same page

### 4. Reusable Components

**Why**: Consistent UX across all pages

### 5. TypeScript Types

**Why**: Compile-time safety and better DX

## Benefits

1. **No Duplicates**: Unique IDs in central registry
2. **Consistency**: Same component everywhere
3. **Performance**: localStorage is fast
4. **Maintainability**: Single source of truth
5. **Scalability**: Easy to add new pages
6. **Type Safety**: TypeScript prevents errors
7. **User Experience**: Smooth, predictable behavior

## Future Enhancements

1. **Categories**: Group pins by hub/category
2. **Reordering**: Drag-and-drop pin reordering
3. **Sync**: Sync pins across devices (backend)
4. **Analytics**: Track most pinned pages
5. **Recommendations**: Suggest pages to pin
6. **Limits**: Max pins per user
7. **Sharing**: Share pin configurations

## Testing Strategy

### Unit Tests

- `useFavorites` hook logic
- `getPageMetadata` function
- localStorage operations

### Integration Tests

- Pin/unpin flow
- Dashboard display
- State persistence

### E2E Tests

- User pins a page
- Page appears in dashboard
- User unpins a page
- Page removed from dashboard
- Pins persist across sessions

## Performance Considerations

1. **localStorage**: Fast, synchronous reads
2. **React State**: Minimal re-renders
3. **Memoization**: useMemo for computed values
4. **Lazy Loading**: Dashboard loads pins on demand
5. **No Network**: All client-side operations

## Security Considerations

1. **User Isolation**: Pins stored per user ID
2. **Validation**: Validate page IDs before pinning
3. **Sanitization**: Sanitize user input
4. **XSS Prevention**: React handles escaping
5. **localStorage Limits**: Handle quota exceeded

---

**Architecture Status**: ✅ Complete and Production-Ready
**Last Updated**: December 3, 2025
