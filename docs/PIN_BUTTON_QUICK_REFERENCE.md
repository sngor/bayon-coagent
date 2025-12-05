# Pin Button Quick Reference

## TL;DR

**Adding a pin button to a page? Follow these 2 steps:**

### Step 1: Add to Registry

Edit `src/lib/page-metadata.ts`:

```typescript
'/my-page': {
    id: 'my-page',
    title: 'My Page',
    description: 'What this page does',
    href: '/my-page',
    icon: 'IconName', // Lucide icon
    color: 'bg-blue-500',
    gradient: 'from-blue-500 to-blue-600'
}
```

### Step 2: Add to Page

```tsx
import { FavoritesButton } from "@/components/favorites-button";
import { getPageMetadata } from "@/lib/page-metadata";

export default function MyPage() {
  const pageMetadata = getPageMetadata("/my-page");

  return (
    <div className="flex items-center justify-between">
      <h1>My Page</h1>
      {pageMetadata && <FavoritesButton item={pageMetadata} />}
    </div>
  );
}
```

## Common Patterns

### With ContentSection

```tsx
<ContentSection
  title="My Page"
  actions={
    pageMetadata && (
      <FavoritesButton item={pageMetadata} variant="outline" size="sm" />
    )
  }
>
  {/* content */}
</ContentSection>
```

### With Card Header

```tsx
<CardHeader>
  <div className="flex items-center justify-between">
    <CardTitle>My Page</CardTitle>
    {pageMetadata && <FavoritesButton item={pageMetadata} />}
  </div>
</CardHeader>
```

### Using Hook (Client Components)

```tsx
"use client";

import { usePageMetadata } from "@/hooks/use-page-metadata";

export default function MyPage() {
  const pageMetadata = usePageMetadata(); // Auto-detects current page

  return <div>{pageMetadata && <FavoritesButton item={pageMetadata} />}</div>;
}
```

## Icon Names

Use Lucide icon names (without 'Icon' suffix):

- `Home`, `MessageSquare`, `PenTool`, `FileText`, `Image`
- `Users`, `Award`, `TrendingUp`, `Target`, `Search`
- `BookOpen`, `Calculator`, `DollarSign`, `Building`
- `Settings`, `Bell`, `Calendar`, `Gift`, `Brain`

## Color Schemes by Hub

- **Overview**: `bg-slate-500`, `bg-indigo-500`
- **Studio**: `bg-blue-500`, `bg-cyan-500`, `bg-pink-500`, `bg-purple-500`
- **Brand**: `bg-emerald-500`, `bg-yellow-500`, `bg-orange-500`, `bg-red-500`
- **Research**: `bg-green-500`, `bg-teal-500`
- **Market**: `bg-violet-500`, `bg-purple-500`
- **Tools**: `bg-purple-500`, `bg-green-600`, `bg-stone-500`
- **Library**: `bg-amber-500`, `bg-blue-500`, `bg-pink-500`

## Don't Do This ❌

```tsx
// OLD - Don't use
import { getPageConfig } from "@/components/dashboard-quick-actions";
const pageConfig = getPageConfig("/my-page");
```

```tsx
// OLD - Don't add pages here
export const AVAILABLE_PAGES = [
  /* ... */
];
```

## Do This ✅

```tsx
// NEW - Use this
import { getPageMetadata } from "@/lib/page-metadata";
const pageMetadata = getPageMetadata("/my-page");
```

```typescript
// NEW - Add pages here
export const PAGE_METADATA: Record<string, Omit<FavoriteItem, "addedAt">> = {
  // Add your page
};
```

## Testing

1. Click pin → Should show "Pinned" toast
2. Go to dashboard → Page appears in Quick Actions
3. Click pin again → Should show "Unpinned" toast
4. Go to dashboard → Page removed from Quick Actions
5. Try pinning from different locations → Should maintain single pin

## Need Help?

- **Full docs**: `docs/PIN_BUTTON_STANDARDIZATION.md`
- **Summary**: `PIN_STANDARDIZATION_SUMMARY.md`
- **Examples**: Check any page in `/studio`, `/brand`, or `/tools`
