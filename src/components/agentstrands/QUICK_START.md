# AgentStrands UI Components - Quick Start Guide

Get started with the AgentStrands UI components in 5 minutes.

## Installation

The components are already included in your project. No additional installation needed!

## Basic Usage

### 1. Import Components

```tsx
import {
  FeedbackCollection,
  QuickFeedback,
  OpportunityDashboard,
  AnalyticsVisualizations,
  EditingInterface,
} from "@/components/agentstrands";
```

### 2. Add to Your Page

#### Feedback Collection

```tsx
// Full feedback form
<FeedbackCollection
  taskId="task-123"
  strandId="strand-456"
  onFeedbackSubmitted={() => console.log("Feedback received!")}
/>

// Quick thumbs up/down
<QuickFeedback
  taskId="task-123"
  strandId="strand-456"
/>
```

#### Opportunity Dashboard

```tsx
// Shows all AI-detected opportunities
<OpportunityDashboard />
```

#### Analytics Visualizations

```tsx
// Show all analytics
<AnalyticsVisualizations />

// Filter by specific strand
<AnalyticsVisualizations strandId="strand-123" />
```

#### Editing Interface

```tsx
<EditingInterface
  contentId="content-123"
  initialContent="Your content here..."
  onSave={(content) => {
    // Handle saved content
    console.log("Saved:", content);
  }}
  onClose={() => {
    // Handle close
    console.log("Closed");
  }}
/>
```

## Complete Example Page

Create a new page at `src/app/(app)/agentstrands/page.tsx`:

```tsx
"use client";

import {
  OpportunityDashboard,
  AnalyticsVisualizations,
  FeedbackCollection,
} from "@/components/agentstrands";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AgentStrandsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">AgentStrands</h1>
        <p className="text-muted-foreground">
          AI collaboration and analytics dashboard
        </p>
      </div>

      <Tabs defaultValue="opportunities">
        <TabsList>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities">
          <OpportunityDashboard />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsVisualizations />
        </TabsContent>

        <TabsContent value="feedback">
          <FeedbackCollection taskId="example-task" strandId="example-strand" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Integration with Existing Content

### Add Feedback to Content Cards

```tsx
import { QuickFeedback } from "@/components/agentstrands";

function ContentCard({ content, taskId, strandId }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{content.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{content.body}</p>
        <QuickFeedback taskId={taskId} strandId={strandId} />
      </CardContent>
    </Card>
  );
}
```

### Add Analytics to Dashboard

```tsx
import { AnalyticsVisualizations } from "@/components/agentstrands";

function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <AnalyticsVisualizations />
    </div>
  );
}
```

### Add Editing to Content Editor

```tsx
import { EditingInterface } from "@/components/agentstrands";
import { useState } from "react";

function ContentEditor({ initialContent, contentId }) {
  const [content, setContent] = useState(initialContent);

  return (
    <EditingInterface
      contentId={contentId}
      initialContent={content}
      onSave={(newContent) => {
        setContent(newContent);
        // Save to database
      }}
    />
  );
}
```

## API Requirements

These components require the following API endpoints to be available:

- `POST /api/agentstrands/feedback` - Submit feedback
- `GET /api/agentstrands/feedback` - Retrieve feedback
- `GET /api/agentstrands/opportunities` - Get opportunities
- `PATCH /api/agentstrands/opportunities` - Update opportunity status
- `GET /api/agentstrands/analytics/performance` - Get performance metrics
- `GET /api/agentstrands/analytics/cost` - Get cost analytics
- `POST /api/agentstrands/editing/session` - Start editing session
- `GET /api/agentstrands/editing/session` - Get editing session
- `PATCH /api/agentstrands/editing/session` - Update editing session

All APIs are already implemented in `src/app/api/agentstrands/`.

## Styling

Components use the existing design system:

- Tailwind CSS for styling
- shadcn/ui components
- Dark mode support
- Responsive design

No additional CSS needed!

## Demo Page

To see all components in action, check out the demo page:

```tsx
import { AgentStrandsDemoPage } from "@/components/agentstrands/demo-page";

export default function DemoPage() {
  return <AgentStrandsDemoPage />;
}
```

## Next Steps

1. **Customize**: Adjust colors, sizes, and layouts to match your design
2. **Extend**: Add new features or modify existing ones
3. **Integrate**: Connect with your existing workflows
4. **Test**: Add unit and integration tests

## Need Help?

- Check the full README: `src/components/agentstrands/README.md`
- Review API docs: `src/app/api/agentstrands/README.md`
- See design specs: `.kiro/specs/agentstrands-enhancement/design.md`

## Common Issues

### Components not rendering?

- Make sure you're using `"use client"` directive if needed
- Check that API endpoints are accessible
- Verify authentication is working

### Styling looks off?

- Ensure Tailwind CSS is configured
- Check that shadcn/ui components are installed
- Verify theme provider is set up

### API errors?

- Check browser console for error messages
- Verify API endpoints are running
- Check authentication tokens

## Tips

1. **Start Simple**: Begin with one component and expand
2. **Use Demo Page**: Reference the demo for implementation examples
3. **Check Types**: TypeScript will help catch errors early
4. **Test Locally**: Use the demo page to test before integrating
5. **Read Docs**: Full documentation is available in README.md
