# AgentStrands UI Components

This directory contains the UI components for the AgentStrands enhancement features, providing interfaces for feedback collection, opportunity management, analytics visualization, and collaborative editing.

## Components

### 1. FeedbackCollection

A comprehensive feedback collection interface that allows users to rate AI-generated content and provide comments.

**Features:**

- 5-star rating system with hover effects
- Optional comment field for detailed feedback
- Automatic submission to feedback API
- Toast notifications for success/error states
- Responsive design

**Usage:**

```tsx
import { FeedbackCollection } from "@/components/agentstrands";

<FeedbackCollection
  taskId="task-123"
  strandId="strand-456"
  contentId="content-789"
  onFeedbackSubmitted={() => console.log("Feedback submitted")}
/>;
```

**Props:**

- `taskId` (string, required): The task ID associated with the content
- `strandId` (string, required): The strand ID that generated the content
- `contentId` (string, optional): The content ID for reference
- `onFeedbackSubmitted` (function, optional): Callback when feedback is submitted
- `className` (string, optional): Additional CSS classes

### 2. QuickFeedback

A lightweight inline feedback component with thumbs up/down buttons.

**Features:**

- Simple thumbs up/down interface
- Minimal UI footprint
- Quick feedback submission
- Ideal for inline use in content cards

**Usage:**

```tsx
import { QuickFeedback } from "@/components/agentstrands";

<QuickFeedback
  taskId="task-123"
  strandId="strand-456"
  onFeedbackSubmitted={() => console.log("Quick feedback submitted")}
/>;
```

**Props:**

- `taskId` (string, required): The task ID associated with the content
- `strandId` (string, required): The strand ID that generated the content
- `onFeedbackSubmitted` (function, optional): Callback when feedback is submitted
- `className` (string, optional): Additional CSS classes

### 3. OpportunityDashboard

A comprehensive dashboard for viewing and managing AI-detected opportunities.

**Features:**

- Filterable opportunity list (all, trend, gap, timing, competitive)
- Color-coded opportunity types with icons
- Impact level indicators (high, medium, low)
- Confidence scores
- Actionable suggestions with links
- Status management (new, viewed, acted-on, dismissed)
- Expiration tracking
- Empty state handling

**Usage:**

```tsx
import { OpportunityDashboard } from "@/components/agentstrands";

<OpportunityDashboard className="w-full" />;
```

**Props:**

- `className` (string, optional): Additional CSS classes

**Opportunity Types:**

- **Trend**: Market trends and emerging patterns
- **Gap**: Content gaps in agent's library
- **Timing**: Optimal timing recommendations
- **Competitive**: Competitive intelligence insights

### 4. AnalyticsVisualizations

A comprehensive analytics dashboard with performance metrics, cost analysis, and quality tracking.

**Features:**

- Multiple timeframe options (1h, 24h, 7d, 30d, 90d)
- Key metrics cards (execution time, success rate, satisfaction, cost)
- Three main tabs:
  - **Performance**: Execution time and token usage trends
  - **Cost Analysis**: Cost breakdown by strand/user/task-type
  - **Quality Metrics**: Quality score, satisfaction, and success rate
- Interactive charts using Recharts
- Responsive design with grid layouts
- Real-time data fetching

**Usage:**

```tsx
import { AnalyticsVisualizations } from "@/components/agentstrands";

<AnalyticsVisualizations
  strandId="strand-123" // Optional: filter by specific strand
  className="w-full"
/>;
```

**Props:**

- `strandId` (string, optional): Filter analytics for a specific strand
- `className` (string, optional): Additional CSS classes

**Chart Types:**

- Line charts for trends over time
- Bar charts for token usage
- Pie charts for cost distribution
- Progress bars for quality metrics

### 5. EditingInterface

A collaborative editing interface that allows users to refine content through conversational AI.

**Features:**

- Version control with full history
- Conversational edit requests
- Quick action buttons for common edits
- Version rollback functionality
- Real-time content editing
- Session management
- History dialog with version comparison

**Usage:**

```tsx
import { EditingInterface } from "@/components/agentstrands";

<EditingInterface
  contentId="content-123"
  initialContent="Your initial content here..."
  onSave={(content) => console.log("Saved:", content)}
  onClose={() => console.log("Closed")}
/>;
```

**Props:**

- `contentId` (string, required): The content ID being edited
- `initialContent` (string, required): The initial content to edit
- `onSave` (function, optional): Callback when content is saved
- `onClose` (function, optional): Callback when editing is closed
- `className` (string, optional): Additional CSS classes

**Quick Actions:**

- Make Concise
- Add Details
- More Professional
- More Casual
- Fix Grammar

## API Integration

All components integrate with the AgentStrands API endpoints:

- **Feedback API**: `/api/agentstrands/feedback`
- **Opportunities API**: `/api/agentstrands/opportunities`
- **Performance Analytics API**: `/api/agentstrands/analytics/performance`
- **Cost Analytics API**: `/api/agentstrands/analytics/cost`
- **Editing Sessions API**: `/api/agentstrands/editing/session`

See `src/app/api/agentstrands/README.md` for detailed API documentation.

## Dependencies

These components use the following UI libraries and utilities:

- **shadcn/ui**: Card, Button, Badge, Tabs, Select, Dialog, Textarea, etc.
- **Recharts**: For data visualization (charts and graphs)
- **Lucide React**: For icons
- **React Hooks**: useState, useEffect
- **Custom Hooks**: useToast for notifications

## Styling

All components use:

- Tailwind CSS for styling
- shadcn/ui design system
- Responsive design patterns
- Dark mode support (via theme provider)
- Consistent spacing and typography

## Best Practices

1. **Error Handling**: All API calls include try-catch blocks with user-friendly error messages
2. **Loading States**: Components show loading skeletons while fetching data
3. **Empty States**: Meaningful empty states when no data is available
4. **Accessibility**: Proper ARIA labels, keyboard navigation, and focus management
5. **Responsive Design**: Mobile-first approach with responsive breakpoints
6. **Type Safety**: Full TypeScript support with proper interfaces

## Example Integration

Here's a complete example of integrating these components into a page:

```tsx
"use client";

import {
  FeedbackCollection,
  OpportunityDashboard,
  AnalyticsVisualizations,
  EditingInterface,
} from "@/components/agentstrands";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AgentStrandsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">AgentStrands Dashboard</h1>
        <p className="text-muted-foreground">
          Manage AI-generated content, opportunities, and analytics
        </p>
      </div>

      <Tabs defaultValue="opportunities">
        <TabsList>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <OpportunityDashboard />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsVisualizations />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <FeedbackCollection taskId="example-task" strandId="example-strand" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Future Enhancements

Potential improvements for these components:

1. **Real-time Updates**: WebSocket integration for live analytics
2. **Export Functionality**: Export analytics data to CSV/PDF
3. **Advanced Filtering**: More granular filtering options
4. **Comparison Views**: Compare performance across strands
5. **Notifications**: Push notifications for new opportunities
6. **Batch Operations**: Bulk actions on opportunities
7. **Custom Dashboards**: User-configurable dashboard layouts
8. **AI Suggestions**: AI-powered insights in analytics

## Testing

To test these components:

1. **Unit Tests**: Test individual component logic
2. **Integration Tests**: Test API integration
3. **Visual Tests**: Test responsive design and styling
4. **Accessibility Tests**: Test keyboard navigation and screen readers

Example test:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { FeedbackCollection } from "./feedback-collection";

describe("FeedbackCollection", () => {
  it("should submit feedback when rating is selected", async () => {
    render(<FeedbackCollection taskId="test-task" strandId="test-strand" />);

    // Click 5-star rating
    const stars = screen.getAllByRole("button");
    fireEvent.click(stars[4]);

    // Click submit
    const submitButton = screen.getByText("Submit Feedback");
    fireEvent.click(submitButton);

    // Verify API call was made
    // ... assertions
  });
});
```

## Support

For issues or questions about these components:

1. Check the API documentation in `src/app/api/agentstrands/README.md`
2. Review the design document in `.kiro/specs/agentstrands-enhancement/design.md`
3. Check the requirements in `.kiro/specs/agentstrands-enhancement/requirements.md`
