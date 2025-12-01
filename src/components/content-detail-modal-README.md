# Content Detail Modal Component

## Overview

The `ContentDetailModal` component provides a comprehensive detail view for scheduled content items in the content workflow system. It displays all relevant information about a piece of scheduled content, supports inline editing, and provides quick actions for managing the content.

**Validates:** Requirements 2.3 - Display content details on click

## Features

### 1. Comprehensive Content Display

- **Content Preview**: Full content text with formatting preserved
- **Title and Metadata**: Content title, type, status, and tags
- **Media Attachments**: Display and link to attached media files
- **Hashtags**: Visual display of associated hashtags

### 2. Scheduling Information with Timezone

- **Publish Time**: Formatted date and time with user's timezone
- **Creation Time**: When the content was originally created
- **Channel Information**: All selected publishing channels with account names
- **Status Badge**: Visual indicator of current status (scheduled, publishing, published, failed, cancelled)

### 3. Inline Editing with Validation

- **Edit Mode**: Toggle between view and edit modes
- **Editable Fields**: Title, content text, and publish time
- **Validation**: Future date validation for publish time
- **Save/Cancel**: Commit or discard changes

### 4. Quick Actions

- **Edit**: Enter inline editing mode
- **Reschedule**: Change the publish time
- **Duplicate**: Create a copy of the content
- **Delete**: Remove the scheduled content (with confirmation)

### 5. Performance Metrics (When Available)

- **Engagement Metrics**: Views, likes, shares, comments, clicks
- **Engagement Rate**: Calculated engagement percentage
- **Last Updated**: Timestamp of last metrics sync
- **Visual Cards**: Color-coded metric cards with icons

### 6. Publishing Results

- **Per-Channel Results**: Success/failure status for each channel
- **Error Messages**: Detailed error information for failed publishes
- **Published URLs**: Direct links to published posts

## Usage

### Basic Usage

```tsx
import { ContentDetailModal } from "@/components/content-detail-modal";
import { useState } from "react";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContent, setSelectedContent] =
    useState<ScheduledContent | null>(null);

  return (
    <>
      <button
        onClick={() => {
          setSelectedContent(myContent);
          setIsOpen(true);
        }}
      >
        View Details
      </button>

      <ContentDetailModal
        open={isOpen}
        onOpenChange={setIsOpen}
        content={selectedContent}
      />
    </>
  );
}
```

### With All Features

```tsx
import { ContentDetailModal } from "@/components/content-detail-modal";
import { useState } from "react";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContent, setSelectedContent] =
    useState<ScheduledContent | null>(null);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = async (
    contentId: string,
    updates: Partial<ScheduledContent>
  ) => {
    setIsLoading(true);
    try {
      await updateScheduledContent(contentId, updates);
      // Refresh content
    } finally {
      setIsLoading(false);
    }
  };

  const handleReschedule = async (contentId: string, newTime: Date) => {
    setIsLoading(true);
    try {
      await rescheduleContent(contentId, newTime);
      // Refresh content
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async (contentId: string) => {
    setIsLoading(true);
    try {
      await duplicateContent(contentId);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (contentId: string) => {
    setIsLoading(true);
    try {
      await deleteScheduledContent(contentId);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ContentDetailModal
      open={isOpen}
      onOpenChange={setIsOpen}
      content={selectedContent}
      analytics={analytics}
      onEdit={handleEdit}
      onReschedule={handleReschedule}
      onDuplicate={handleDuplicate}
      onDelete={handleDelete}
      isLoading={isLoading}
    />
  );
}
```

## Props

### ContentDetailModalProps

| Prop           | Type                                                                       | Required | Description                                   |
| -------------- | -------------------------------------------------------------------------- | -------- | --------------------------------------------- |
| `open`         | `boolean`                                                                  | Yes      | Whether the modal is open                     |
| `onOpenChange` | `(open: boolean) => void`                                                  | Yes      | Callback when modal should close              |
| `content`      | `ScheduledContent \| null`                                                 | Yes      | The scheduled content to display              |
| `analytics`    | `{ metrics: EngagementMetrics; lastUpdated: Date }`                        | No       | Optional analytics data for published content |
| `onEdit`       | `(contentId: string, updates: Partial<ScheduledContent>) => Promise<void>` | No       | Callback when content is edited               |
| `onReschedule` | `(contentId: string, newTime: Date) => Promise<void>`                      | No       | Callback when content is rescheduled          |
| `onDuplicate`  | `(contentId: string) => Promise<void>`                                     | No       | Callback when content is duplicated           |
| `onDelete`     | `(contentId: string) => Promise<void>`                                     | No       | Callback when content is deleted              |
| `isLoading`    | `boolean`                                                                  | No       | Whether actions are currently loading         |

## Component Behavior

### Status-Based Actions

The available actions depend on the content status:

- **Scheduled**: Edit, Duplicate, Delete
- **Publishing**: No actions (read-only)
- **Published**: Duplicate only
- **Failed**: Edit, Duplicate, Delete
- **Cancelled**: Duplicate only

### Edit Mode

When entering edit mode:

1. Title, content, and publish time become editable
2. Action buttons change to Save/Cancel
3. Validation is applied on save:
   - Publish time must be in the future
   - Title and content cannot be empty

### Delete Confirmation

When deleting content:

1. Browser confirmation dialog appears
2. User must confirm the deletion
3. Modal closes after successful deletion

### Timezone Display

The component automatically detects and displays the user's timezone using:

```typescript
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
```

## Styling

The component uses Tailwind CSS and follows the application's design system:

- **Responsive**: Adapts to mobile, tablet, and desktop screens
- **Scrollable**: Content scrolls within the modal for long content
- **Accessible**: Proper ARIA labels and keyboard navigation
- **Consistent**: Uses shadcn/ui components for consistency

### Color Coding

- **Status Badges**: Color-coded by status (blue=scheduled, green=published, red=failed)
- **Metric Cards**: Each metric has a unique color (blue=views, red=likes, green=shares, etc.)
- **Publishing Results**: Green for success, red for failure

## Accessibility

The component follows WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: Full keyboard support for all actions
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Focus Management**: Focus is trapped within the modal when open
- **Color Contrast**: All text meets contrast requirements
- **Touch Targets**: Minimum 44x44px touch targets for mobile

## Integration with Calendar

The modal is designed to be used with the ContentCalendar component:

```tsx
import { ContentCalendar } from "@/components/content-calendar";
import { ContentDetailModal } from "@/components/content-detail-modal";

function CalendarPage() {
  const [selectedContent, setSelectedContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <ContentCalendar
        userId={userId}
        onContentClick={(content) => {
          setSelectedContent(content);
          setIsModalOpen(true);
        }}
      />

      <ContentDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        content={selectedContent}
        // ... other props
      />
    </>
  );
}
```

## Performance Considerations

- **Lazy Loading**: Analytics data is only loaded when needed
- **Optimistic Updates**: UI updates immediately, then syncs with server
- **Debouncing**: Edit changes are debounced to reduce API calls
- **Memoization**: Component uses React.memo for performance

## Error Handling

The component handles errors gracefully:

- **API Errors**: Displays error messages to the user
- **Validation Errors**: Shows inline validation messages
- **Network Errors**: Retries failed requests automatically
- **Loading States**: Shows loading indicators during async operations

## Testing

See the example file for a complete working demo:

- `src/components/content-detail-modal-example.tsx`

## Related Components

- `ContentCalendar` - Calendar view that opens this modal
- `SchedulingModal` - Modal for creating new scheduled content
- `AnalyticsDashboard` - Dashboard showing aggregated analytics

## Future Enhancements

Potential improvements for future versions:

1. **Rich Text Editing**: Support for formatted text editing
2. **Image Preview**: Display attached images inline
3. **Version History**: Show edit history and allow rollback
4. **Comments**: Add commenting system for team collaboration
5. **Approval Workflow**: Add approval process for scheduled content
6. **AI Suggestions**: Suggest improvements to content
7. **A/B Testing**: Create A/B test variations from the modal
8. **Export**: Export content in various formats

## Support

For issues or questions:

- Check the example file for usage patterns
- Review the type definitions in `content-workflow-types.ts`
- Consult the design document at `.kiro/specs/content-workflow-features/design.md`
