# Content Detail Modal

A comprehensive modal component for displaying and editing scheduled content with rich metadata, performance analytics, and quick actions.

## Features

### 📋 Content Information

- **Inline Editing**: Edit title, content, and publish time directly in the modal
- **Real-time Validation**: Immediate feedback on input validation errors
- **Rich Metadata**: Display original prompts, AI model used, tags, and timestamps
- **Content Type & Status**: Clear visual indicators for content category and status

### 📊 Performance Analytics

- **Engagement Metrics**: Views, likes, shares, comments, clicks, and engagement rate
- **ROI Tracking**: Revenue, leads, conversions, and cost metrics
- **Visual Cards**: Clean metric display with icons and formatted numbers

### ⏰ Scheduling Features

- **Timezone Support**: Display times with timezone information and relative formatting
- **Optimal Times**: AI-powered recommendations for best posting times
- **Quick Reschedule**: Calendar picker with time selection
- **Channel Status**: Connection status indicators for each publishing channel

### 🚀 Quick Actions

- **Reschedule**: Change publish date and time with calendar interface
- **Duplicate**: Create a copy of the content for reuse
- **Delete**: Remove scheduled content with confirmation dialog
- **Edit**: Inline editing with save/cancel functionality

### 📱 Responsive Design

- **Mobile Optimized**: Full-screen modal on mobile devices
- **Desktop Layout**: Multi-column layout with optimal space usage
- **Touch Friendly**: Large touch targets and gesture support

## Usage

### Basic Usage

```tsx
import { ContentDetailModal } from "@/components/content-detail-modal";

function MyComponent() {
  const [selectedContent, setSelectedContent] =
    useState<ScheduledContent | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ContentDetailModal
      content={selectedContent}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onDuplicate={handleDuplicate}
      onReschedule={handleReschedule}
    />
  );
}
```

### With Analytics and Optimal Times

```tsx
<ContentDetailModal
  content={selectedContent}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onUpdate={handleUpdate}
  onDelete={handleDelete}
  onDuplicate={handleDuplicate}
  onReschedule={handleReschedule}
  analytics={engagementMetrics}
  optimalTimes={optimalTimesArray}
  roiData={roiAnalytics}
  loading={isLoadingData}
/>
```

### Integration with Content Calendar

```tsx
import { ContentCalendar } from "@/features/content-calendar/components/content-calendar";

function CalendarPage() {
  const handleContentUpdate = async (
    contentId: string,
    updates: Partial<ScheduledContent>
  ) => {
    // Update content via API
    await updateScheduledContent(contentId, updates);
  };

  const getAnalytics = async (contentId: string) => {
    // Fetch analytics data
    return await fetchContentAnalytics(contentId);
  };

  const getOptimalTimes = async (
    contentType: ContentCategory,
    channel: PublishChannelType
  ) => {
    // Fetch optimal posting times
    return await fetchOptimalTimes(contentType, channel);
  };

  return (
    <ContentCalendar
      userId={userId}
      scheduledContent={scheduledContent}
      onContentUpdate={handleContentUpdate}
      getAnalytics={getAnalytics}
      getOptimalTimes={getOptimalTimes}
      getROIData={getROIData}
    />
  );
}
```

## Props

### ContentDetailModalProps

| Prop           | Type                                                    | Required | Description                          |
| -------------- | ------------------------------------------------------- | -------- | ------------------------------------ |
| `content`      | `ScheduledContent \| null`                              | ✅       | The content to display in the modal  |
| `isOpen`       | `boolean`                                               | ✅       | Whether the modal is open            |
| `onClose`      | `() => void`                                            | ✅       | Callback when modal is closed        |
| `onUpdate`     | `(updates: Partial<ScheduledContent>) => Promise<void>` | ❌       | Callback for updating content        |
| `onDelete`     | `(contentId: string) => Promise<void>`                  | ❌       | Callback for deleting content        |
| `onDuplicate`  | `(contentId: string) => Promise<void>`                  | ❌       | Callback for duplicating content     |
| `onReschedule` | `(contentId: string, newDate: Date) => Promise<void>`   | ❌       | Callback for rescheduling content    |
| `analytics`    | `EngagementMetrics`                                     | ❌       | Performance analytics data           |
| `optimalTimes` | `OptimalTime[]`                                         | ❌       | Optimal posting time recommendations |
| `roiData`      | `ROIAnalytics`                                          | ❌       | ROI and conversion data              |
| `loading`      | `boolean`                                               | ❌       | Whether data is loading              |
| `className`    | `string`                                                | ❌       | Additional CSS classes               |

## Data Types

### ScheduledContent

```typescript
interface ScheduledContent {
  id: string;
  userId: string;
  contentId: string;
  title: string;
  content: string;
  contentType: ContentCategory;
  publishTime: Date;
  channels: PublishChannel[];
  status: ScheduledContentStatus;
  metadata?: {
    originalPrompt?: string;
    aiModel?: string;
    generatedAt?: Date;
    tags?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### EngagementMetrics

```typescript
interface EngagementMetrics {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  saves?: number;
  engagementRate: number;
  reach?: number;
  impressions?: number;
}
```

### OptimalTime

```typescript
interface OptimalTime {
  time: string; // HH:MM format
  dayOfWeek: number; // 0-6, Sunday=0
  expectedEngagement: number;
  confidence: number;
  historicalData: {
    sampleSize: number;
    avgEngagement: number;
    lastCalculated: Date;
  };
}
```

## Validation Rules

### Title Validation

- Required field
- Maximum 200 characters
- Real-time validation with error display

### Content Validation

- Required field
- Minimum 10 characters
- Maximum 10,000 characters
- Preserves formatting and line breaks

### Publish Time Validation

- Must be in the future
- Timezone-aware validation
- Displays relative time (e.g., "in 2 hours")

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Logical tab order and focus trapping
- **High Contrast**: Supports high contrast mode
- **Touch Targets**: Minimum 44px touch targets for mobile

## Styling

The modal uses the existing design system components and follows the established patterns:

- **Colors**: Uses semantic color tokens (primary, destructive, muted, etc.)
- **Typography**: Consistent font sizes and weights
- **Spacing**: Standard spacing scale (2, 4, 6, 8, etc.)
- **Borders**: Consistent border radius and colors
- **Shadows**: Appropriate elevation for modal overlay

## Performance Considerations

- **Lazy Loading**: Analytics and ROI data are loaded on demand
- **Optimistic Updates**: UI updates immediately while API calls are in progress
- **Error Handling**: Graceful error states with retry options
- **Memory Management**: Proper cleanup of event listeners and timers

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 90+
- **Responsive**: Works on all screen sizes from 320px to 4K displays

## Examples

See `src/components/examples/content-detail-modal-example.tsx` for a complete working example with mock data.

## Requirements Validated

This component validates the following requirements from the Content Workflow Features spec:

- **Requirement 2.3**: Display full content details and scheduling information
- **Inline Editing**: Real-time validation and save functionality
- **Quick Actions**: Edit, reschedule, duplicate, delete with confirmations
- **Performance Metrics**: Display engagement predictions when available
- **Timezone Support**: Complete scheduling information with timezone display

## Integration Notes

### With Content Calendar

The modal integrates seamlessly with the ContentCalendar component. When a user clicks on scheduled content, the calendar automatically loads analytics data and displays the modal.

### With Server Actions

The modal works with the existing content workflow server actions:

- `updateScheduleAction` for content updates
- `cancelScheduleAction` for content deletion
- `getOptimalTimesAction` for timing recommendations

### With Analytics Service

The modal can display real-time analytics data when integrated with the analytics service:

- Engagement metrics from social media platforms
- ROI data with attribution modeling
- Performance comparisons and trends

## Future Enhancements

- **Version History**: Track and display content edit history
- **Collaboration**: Multi-user editing with conflict resolution
- **Templates**: Save content as reusable templates
- **Bulk Actions**: Select and modify multiple content items
- **Advanced Analytics**: Deeper performance insights and predictions
