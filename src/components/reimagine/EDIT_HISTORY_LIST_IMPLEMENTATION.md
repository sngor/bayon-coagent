# Edit History List Component Implementation

## Overview

The `EditHistoryList` component displays a user's edit history for the Reimagine Image Toolkit with support for lazy loading, edit chains, and management actions.

## Features

### Core Functionality

- ✅ Display edit history with thumbnails
- ✅ Show edit type, timestamp, and status
- ✅ Implement lazy loading for images using Intersection Observer
- ✅ Provide download and delete actions
- ✅ Show edit chains with visual indicators
- ✅ Responsive design for mobile and desktop
- ✅ Smooth animations with Framer Motion

### Requirements Coverage

- **7.2**: Display all processed images with timestamps, operation types, and source images
- **7.3**: Provide download button for high-quality images
- **7.4**: Display both original and processed images for comparison (via view action)
- **7.5**: Delete edits from S3 and DynamoDB
- **9.3**: Maintain edit sequence in history
- **9.4**: Display complete transformation chain

## Component API

### Props

```typescript
interface EditHistoryListProps {
  userId: string; // User ID to load history for
  onViewEdit?: (item: EditHistoryItem) => void; // Optional callback when viewing an edit
  className?: string; // Optional CSS classes
}
```

### EditHistoryItem Type

```typescript
interface EditHistoryItem {
  editId: string;
  imageId: string;
  editType: EditType;
  originalUrl: string; // Presigned URL for original image
  resultUrl: string; // Presigned URL for result image
  createdAt: string; // ISO timestamp
  status: string; // completed, preview, processing, failed
  parentEditId?: string; // For chained edits
}
```

## Key Features

### 1. Lazy Loading Images

Uses Intersection Observer API to load images only when they come into viewport:

```typescript
const observerRef = useRef<IntersectionObserver | null>(null);

useEffect(() => {
  observerRef.current = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src && !loadedImages.has(src)) {
            img.src = src;
            setLoadedImages((prev) => new Set(prev).add(src));
            observerRef.current?.unobserve(img);
          }
        }
      });
    },
    { rootMargin: "50px" }
  );
}, [loadedImages]);
```

Benefits:

- Improves initial page load performance
- Reduces bandwidth usage
- Better user experience with progressive loading

### 2. Edit Chains

Automatically detects and displays edit chains (sequences of edits):

```typescript
const buildEditChains = useCallback(() => {
  const chains = new Map<string, EditHistoryItem[]>();
  const childMap = new Map<string, EditHistoryItem[]>();

  // Group edits by parent
  edits.forEach((edit) => {
    if (edit.parentEditId) {
      const siblings = childMap.get(edit.parentEditId) || [];
      siblings.push(edit);
      childMap.set(edit.parentEditId, siblings);
    }
  });

  // Build chains starting from root edits
  edits.forEach((edit) => {
    if (!edit.parentEditId) {
      const chain: EditHistoryItem[] = [edit];
      let current = edit;

      while (childMap.has(current.editId)) {
        const children = childMap.get(current.editId)!;
        if (children.length > 0) {
          current = children[0];
          chain.push(current);
        } else {
          break;
        }
      }

      chains.set(edit.editId, chain);
    }
  });

  return chains;
}, [edits]);
```

Visual indicators:

- Indented layout for chained edits
- Connector lines showing relationships
- Chain counter showing total edits in sequence
- Numbered badges on thumbnails

### 3. Status Display

Dynamic status badges with appropriate colors and icons:

```typescript
const getStatusDisplay = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return {
        variant: "default",
        icon: CheckCircle2,
        label: "Completed",
        color: "text-green-600",
      };
    case "preview":
      return {
        variant: "secondary",
        icon: Eye,
        label: "Preview",
        color: "text-blue-600",
      };
    case "processing":
      return {
        variant: "secondary",
        icon: Loader2,
        label: "Processing",
        color: "text-yellow-600",
      };
    case "failed":
      return {
        variant: "destructive",
        icon: XCircle,
        label: "Failed",
        color: "text-red-600",
      };
  }
};
```

### 4. Timestamp Formatting

User-friendly relative timestamps:

```typescript
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};
```

### 5. Download Functionality

Downloads images with descriptive filenames:

```typescript
const handleDownload = useCallback(async (item: EditHistoryItem) => {
  try {
    const link = document.createElement("a");
    link.href = item.resultUrl;
    link.download = `${formatEditType(item.editType)}-${
      new Date(item.createdAt).toISOString().split("T")[0]
    }.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Error downloading edit:", err);
    alert("Failed to download image. Please try again.");
  }
}, []);
```

### 6. Delete with Confirmation

Safe deletion with user confirmation:

```typescript
const handleDelete = useCallback(
  async (editId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this edit? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeletingIds((prev) => new Set(prev).add(editId));
      const response = await deleteEditAction(userId, editId);

      if (!response.success) {
        throw new Error(response.error || "Failed to delete edit");
      }

      setEdits((prev) => prev.filter((edit) => edit.editId !== editId));
    } catch (err) {
      console.error("Error deleting edit:", err);
      alert(err instanceof Error ? err.message : "Failed to delete edit");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(editId);
        return next;
      });
    }
  },
  [userId]
);
```

## UI States

### Loading State

- Displays centered spinner
- Shows while fetching edit history

### Error State

- Shows error icon and message
- Provides "Try Again" button to retry

### Empty State

- Displays when no edits exist
- Shows helpful message to guide user

### Loaded State

- Displays edit cards with thumbnails
- Shows all metadata and actions
- Animates items with Framer Motion

## Responsive Design

### Mobile (< 640px)

- Stacked layout
- Touch-optimized buttons (44px min height)
- Simplified action buttons

### Tablet (640px - 1024px)

- Optimized card layout
- Balanced spacing

### Desktop (> 1024px)

- Full feature display
- Hover effects
- Tooltips for actions

## Animations

Uses Framer Motion for smooth transitions:

```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.2 }}
>
  {/* Edit card content */}
</motion.div>
```

## Integration Example

```tsx
import { EditHistoryList } from "@/components/reimagine/edit-history-list";
import { useUser } from "@/aws/auth/use-user";

export default function ReimagineToolkitPage() {
  const { user } = useUser();
  const [selectedEdit, setSelectedEdit] = useState(null);

  return (
    <div className="space-y-8">
      {/* Other components */}

      <EditHistoryList userId={user?.id || ""} onViewEdit={setSelectedEdit} />

      {/* Optional: Preview modal */}
      {selectedEdit && (
        <EditPreview
          originalUrl={selectedEdit.originalUrl}
          editedUrl={selectedEdit.resultUrl}
          onAccept={() => {
            /* handle accept */
          }}
          onRegenerate={() => {
            /* handle regenerate */
          }}
          onCancel={() => setSelectedEdit(null)}
        />
      )}
    </div>
  );
}
```

## Performance Considerations

1. **Lazy Loading**: Images load only when visible
2. **Intersection Observer**: Efficient viewport detection
3. **Optimistic Updates**: Immediate UI feedback for deletions
4. **Memoization**: Callbacks wrapped in useCallback
5. **Efficient Re-renders**: Minimal state updates

## Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management
- Screen reader friendly

## Error Handling

- Network errors caught and displayed
- User-friendly error messages
- Retry mechanisms
- Graceful degradation

## Future Enhancements

1. Infinite scroll for large histories
2. Filtering by edit type
3. Search functionality
4. Bulk operations (delete multiple)
5. Export history as JSON
6. Share edits with team members
7. Comparison view for multiple edits
8. Undo/redo functionality

## Testing Recommendations

1. Test with empty history
2. Test with single edit
3. Test with edit chains
4. Test lazy loading behavior
5. Test delete confirmation
6. Test download functionality
7. Test error states
8. Test responsive layouts
9. Test with slow network
10. Test with failed edits

## Dependencies

- `framer-motion`: Animations
- `lucide-react`: Icons
- `@radix-ui/react-tooltip`: Tooltips
- `@/components/ui/*`: shadcn/ui components
- `@/app/reimagine-actions`: Server actions
- `@/ai/schemas/reimagine-schemas`: Type definitions
