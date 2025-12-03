# AgentStrands UI Components - Integration Examples

This document provides practical examples of integrating AgentStrands UI components into the existing Bayon Coagent application.

## Integration Scenarios

### 1. Add Feedback to Content Library

Integrate feedback collection into the content library to gather user ratings on generated content.

**File:** `src/app/(app)/library/content/page.tsx`

```tsx
"use client";

import { QuickFeedback } from "@/components/agentstrands";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContentLibraryPage() {
  const [contents, setContents] = useState([]);

  return (
    <div className="space-y-4">
      {contents.map((content) => (
        <Card key={content.id}>
          <CardHeader>
            <CardTitle>{content.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{content.body}</p>

            {/* Add quick feedback */}
            <QuickFeedback
              taskId={content.taskId}
              strandId={content.strandId}
              onFeedbackSubmitted={() => {
                // Optionally refresh content or show success message
                console.log("Feedback submitted for", content.id);
              }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### 2. Add Opportunities to Dashboard

Display AI-detected opportunities on the main dashboard.

**File:** `src/app/(app)/dashboard/page.tsx`

```tsx
"use client";

import { OpportunityDashboard } from "@/components/agentstrands";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Existing dashboard content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Existing metric cards */}
      </div>

      {/* Add opportunities section */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Detected Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <OpportunityDashboard />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3. Add Analytics to Admin Dashboard

Create an admin analytics page for monitoring strand performance.

**File:** `src/app/(app)/admin/analytics/page.tsx`

```tsx
"use client";

import { AnalyticsVisualizations } from "@/components/agentstrands";

export default function AdminAnalyticsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold">AgentStrands Analytics</h1>
        <p className="text-muted-foreground">
          Monitor performance, costs, and quality metrics
        </p>
      </div>

      <AnalyticsVisualizations />
    </div>
  );
}
```

### 4. Add Collaborative Editing to Content Generator

Integrate the editing interface into the content generation workflow.

**File:** `src/app/(app)/studio/write/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { EditingInterface } from "@/components/agentstrands";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContentWritePage() {
  const [generatedContent, setGeneratedContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [contentId, setContentId] = useState("");

  const handleGenerate = async () => {
    // Generate content using existing flow
    const result = await generateContent();
    setGeneratedContent(result.content);
    setContentId(result.id);
  };

  const handleSaveEdited = async (editedContent: string) => {
    // Save edited content
    await saveContent(contentId, editedContent);
    setGeneratedContent(editedContent);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Existing content generation form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Content</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Existing form fields */}
          <Button onClick={handleGenerate}>Generate</Button>
        </CardContent>
      </Card>

      {/* Show generated content or editing interface */}
      {generatedContent && !isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>{generatedContent}</p>
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(true)}>Refine with AI</Button>
              <Button
                variant="outline"
                onClick={() => handleSaveEdited(generatedContent)}
              >
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isEditing && (
        <EditingInterface
          contentId={contentId}
          initialContent={generatedContent}
          onSave={handleSaveEdited}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}
```

### 5. Add Feedback Modal to Any Content

Create a reusable feedback modal that can be triggered from anywhere.

**File:** `src/components/feedback-modal.tsx`

```tsx
"use client";

import { FeedbackCollection } from "@/components/agentstrands";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  strandId: string;
  contentId?: string;
}

export function FeedbackModal({
  open,
  onOpenChange,
  taskId,
  strandId,
  contentId,
}: FeedbackModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Your Feedback</DialogTitle>
          <DialogDescription>
            Help us improve by rating this content
          </DialogDescription>
        </DialogHeader>
        <FeedbackCollection
          taskId={taskId}
          strandId={strandId}
          contentId={contentId}
          onFeedbackSubmitted={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

**Usage:**

```tsx
import { FeedbackModal } from "@/components/feedback-modal";
import { useState } from "react";

function MyComponent() {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <Button onClick={() => setShowFeedback(true)}>Rate This Content</Button>

      <FeedbackModal
        open={showFeedback}
        onOpenChange={setShowFeedback}
        taskId="task-123"
        strandId="strand-456"
      />
    </>
  );
}
```

### 6. Add Opportunities Widget to Sidebar

Create a compact opportunities widget for the sidebar.

**File:** `src/components/opportunities-widget.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function OpportunitiesWidget() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Fetch opportunity count
    fetch("/api/agentstrands/opportunities?status=new")
      .then((res) => res.json())
      .then((data) => setCount(data.opportunities?.length || 0));
  }, []);

  if (count === 0) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            New Opportunities
          </CardTitle>
          <Badge variant="default">{count}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          AI detected {count} new opportunity{count !== 1 ? "ies" : "y"} for you
        </p>
        <Button asChild size="sm" className="w-full">
          <Link href="/opportunities">View All</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

### 7. Add Analytics Summary to Dashboard

Create a compact analytics summary for the dashboard.

**File:** `src/components/analytics-summary.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { Activity, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AnalyticsSummary() {
  const [metrics, setMetrics] = useState({
    successRate: 0,
    avgSatisfaction: 0,
    totalCost: 0,
  });

  useEffect(() => {
    // Fetch summary metrics
    Promise.all([
      fetch("/api/agentstrands/analytics/performance?timeframe=7d"),
      fetch("/api/agentstrands/analytics/cost?timeframe=7d&dimension=user"),
    ])
      .then(([perfRes, costRes]) =>
        Promise.all([perfRes.json(), costRes.json()])
      )
      .then(([perfData, costData]) => {
        setMetrics({
          successRate: perfData.aggregatedMetrics?.avgSuccessRate || 0,
          avgSatisfaction: perfData.aggregatedMetrics?.avgUserSatisfaction || 0,
          totalCost: costData.totals?.totalCost || 0,
        });
      });
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(metrics.successRate * 100).toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.avgSatisfaction.toFixed(1)}/5
          </div>
          <p className="text-xs text-muted-foreground">Average rating</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">AI Cost</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${metrics.totalCost.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Hub Integration

### Create AgentStrands Hub

Create a dedicated hub for AgentStrands features following the existing hub pattern.

**File:** `src/app/(app)/agentstrands/layout.tsx`

```tsx
import { HubLayout } from "@/components/hub";
import { Sparkles } from "lucide-react";

const tabs = [
  { label: "Opportunities", href: "/agentstrands/opportunities" },
  { label: "Analytics", href: "/agentstrands/analytics" },
  { label: "Feedback", href: "/agentstrands/feedback" },
];

export default function AgentStrandsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HubLayout
      title="AgentStrands"
      description="AI collaboration, learning, and analytics"
      icon={Sparkles}
      tabs={tabs}
    >
      {children}
    </HubLayout>
  );
}
```

**File:** `src/app/(app)/agentstrands/opportunities/page.tsx`

```tsx
"use client";

import { OpportunityDashboard } from "@/components/agentstrands";

export default function OpportunitiesPage() {
  return <OpportunityDashboard />;
}
```

**File:** `src/app/(app)/agentstrands/analytics/page.tsx`

```tsx
"use client";

import { AnalyticsVisualizations } from "@/components/agentstrands";

export default function AnalyticsPage() {
  return <AnalyticsVisualizations />;
}
```

**File:** `src/app/(app)/agentstrands/feedback/page.tsx`

```tsx
"use client";

import { FeedbackCollection } from "@/components/agentstrands";

export default function FeedbackPage() {
  return (
    <div className="max-w-2xl">
      <FeedbackCollection taskId="example-task" strandId="example-strand" />
    </div>
  );
}
```

## Navigation Integration

Add AgentStrands to the main navigation.

**File:** `src/components/layouts/main-nav.tsx` (or wherever navigation is defined)

```tsx
import { Sparkles } from "lucide-react";

const navItems = [
  // ... existing items
  {
    title: "AgentStrands",
    href: "/agentstrands/opportunities",
    icon: Sparkles,
    description: "AI collaboration and analytics",
  },
];
```

## Best Practices

1. **Progressive Enhancement**: Start with one component and expand
2. **Error Boundaries**: Wrap components in error boundaries
3. **Loading States**: Show loading indicators during data fetch
4. **Responsive Design**: Test on mobile and tablet
5. **Accessibility**: Ensure keyboard navigation works
6. **Performance**: Monitor bundle size and render performance
7. **Testing**: Add tests for critical user flows

## Common Patterns

### Pattern 1: Conditional Rendering

```tsx
{
  hasGeneratedContent && <QuickFeedback taskId={taskId} strandId={strandId} />;
}
```

### Pattern 2: Callback Handling

```tsx
<FeedbackCollection
  taskId={taskId}
  strandId={strandId}
  onFeedbackSubmitted={() => {
    // Refresh data
    refetch();
    // Show success message
    toast({ title: "Thank you for your feedback!" });
  }}
/>
```

### Pattern 3: Error Handling

```tsx
try {
  // Component usage
} catch (error) {
  console.error("AgentStrands component error:", error);
  // Show fallback UI
}
```

## Troubleshooting

### Issue: Components not rendering

**Solution**: Ensure `"use client"` directive is present in parent component

### Issue: API errors

**Solution**: Check that API endpoints are accessible and authentication is working

### Issue: Styling conflicts

**Solution**: Verify Tailwind CSS is configured and shadcn/ui is installed

### Issue: Type errors

**Solution**: Ensure all required props are provided with correct types

## Next Steps

1. Choose integration points based on your needs
2. Start with one component (e.g., QuickFeedback)
3. Test thoroughly before expanding
4. Gather user feedback
5. Iterate and improve

## Support

For questions or issues:

- Check component README: `src/components/agentstrands/README.md`
- Review API docs: `src/app/api/agentstrands/README.md`
- See design specs: `.kiro/specs/agentstrands-enhancement/design.md`
