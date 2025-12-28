# Intelligent Empty States

Enhanced empty state components with contextual guidance, smart recommendations, and visual progress indicators.

## Features

- **Contextual Guidance**: Recommendations adapt based on profile completion, existing data, and current page context
- **Smart Prioritization**: Actions are automatically prioritized by impact (high, medium, low)
- **Prerequisite Checking**: Locked features show clear prerequisites and guide users to complete them
- **Visual Progress**: Progress bars and completion percentages provide clear feedback
- **Progressive Disclosure**: Information is revealed gradually to reduce cognitive load

## Requirements

Validates Requirements 27.2, 27.4, 27.7:

- 27.2: WHEN viewing dashboards THEN the Application SHALL use AI to highlight actionable insights
- 27.4: WHERE data is missing THEN the Application SHALL proactively guide the Agent to complete their profile
- 27.7: WHEN viewing content THEN the Application SHALL use progressive disclosure to reduce cognitive load

## Components

### IntelligentEmptyState

The main component that displays an enhanced empty state with all features.

```tsx
import { IntelligentEmptyState } from "@/components/ui/empty-states";
import { Sparkles } from "lucide-react";

<IntelligentEmptyState
  icon={<Sparkles className="w-8 h-8 text-primary" />}
  title="No Marketing Plan Yet"
  description="Generate a personalized 3-step marketing strategy powered by AI."
  recommendations={recommendations}
  profileCompletion={profileCompletion}
  contextualTips={tips}
  primaryAction={{
    label: "Get Started",
    onClick: handleGetStarted,
  }}
/>;
```

### Props

#### IntelligentEmptyStateProps

```typescript
interface IntelligentEmptyStateProps {
  // Basic content
  icon: React.ReactNode;
  title: string;
  description: string;

  // Smart recommendations
  recommendations?: SmartRecommendation[];

  // Profile completion status
  profileCompletion?: ProfileCompletionStatus;

  // Contextual tips
  contextualTips?: string[];

  // Primary action
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ai";
  };

  className?: string;
}
```

#### SmartRecommendation

```typescript
interface SmartRecommendation {
  id: string;
  title: string;
  description: string;
  href: string;
  priority: "high" | "medium" | "low";
  icon?: React.ReactNode;
  estimatedTime?: string;
  prerequisitesMet: boolean;
  prerequisites?: Array<{
    description: string;
    met: boolean;
    actionHref?: string;
    actionLabel?: string;
  }>;
}
```

#### ProfileCompletionStatus

```typescript
interface ProfileCompletionStatus {
  percentage: number;
  isComplete: boolean;
  hasRequiredFields: boolean;
  missingFields: Array<{
    key: string;
    label: string;
    benefit: string;
    required: boolean;
  }>;
  nextField?: {
    key: string;
    label: string;
    benefit: string;
    required: boolean;
  };
}
```

## Utility Functions

### calculateProfileCompletion

Calculate profile completion status from user profile data.

```typescript
import { calculateProfileCompletion } from "@/lib/intelligent-empty-states";

const profileCompletion = calculateProfileCompletion(profile);
```

### generateSmartRecommendations

Generate smart recommendations based on user context.

```typescript
import { generateSmartRecommendations } from "@/lib/intelligent-empty-states";

const recommendations = generateSmartRecommendations({
  profile,
  hasMarketingPlan: false,
  hasBrandAudit: false,
  hasCompetitors: false,
  hasContent: false,
  currentPage: "/dashboard",
});
```

### generateContextualTips

Generate contextual tips based on page and user state.

```typescript
import { generateContextualTips } from "@/lib/intelligent-empty-states";

const tips = generateContextualTips({
  profile,
  hasMarketingPlan: false,
  hasBrandAudit: false,
  hasCompetitors: false,
  hasContent: false,
  currentPage: "/marketing-plan",
});
```

### getEmptyStateConfig

Get complete empty state configuration for a page.

```typescript
import { getEmptyStateConfig } from "@/lib/intelligent-empty-states";

const config = getEmptyStateConfig({
  profile,
  hasMarketingPlan: false,
  hasBrandAudit: false,
  hasCompetitors: false,
  hasContent: false,
  currentPage: "/dashboard",
});

// Use in component
<IntelligentEmptyState
  icon={<Icon />}
  title="Title"
  description="Description"
  {...config}
/>;
```

## Usage Examples

### Basic Empty State

```tsx
<IntelligentEmptyState
  icon={<FileText className="w-8 h-8 text-primary" />}
  title="No Content Yet"
  description="Start creating high-quality marketing content with AI assistance."
  primaryAction={{
    label: "Create Content",
    onClick: () => router.push("/content-engine"),
  }}
/>
```

### With Profile Completion

```tsx
const profileCompletion = calculateProfileCompletion(profile);

<IntelligentEmptyState
  icon={<Sparkles className="w-8 h-8 text-primary" />}
  title="No Marketing Plan Yet"
  description="Complete your profile to generate a personalized marketing strategy."
  profileCompletion={profileCompletion}
  primaryAction={{
    label: "Complete Profile",
    onClick: () => router.push("/profile"),
  }}
/>;
```

### With Recommendations

```tsx
const recommendations = generateSmartRecommendations(context);

<IntelligentEmptyState
  icon={<TrendingUp className="w-8 h-8 text-primary" />}
  title="Welcome to Your Dashboard"
  description="Here are the recommended next steps to maximize your marketing impact."
  recommendations={recommendations}
  contextualTips={[
    "Start with high-priority actions for maximum impact",
    "Each feature includes estimated completion time",
  ]}
/>;
```

### With Mixed State (Available + Locked Features)

```tsx
const recommendations: SmartRecommendation[] = [
  {
    id: "generate-plan",
    title: "Generate Marketing Plan",
    description: "Create a personalized strategy",
    href: "/marketing-plan",
    priority: "high",
    estimatedTime: "2 min",
    prerequisitesMet: true,
  },
  {
    id: "track-rankings",
    title: "Track Keyword Rankings",
    description: "Monitor your position",
    href: "/competitive-analysis",
    priority: "medium",
    estimatedTime: "2 min",
    prerequisitesMet: false,
    prerequisites: [
      {
        description: "You must have analyzed competitors first",
        met: false,
        actionHref: "/competitive-analysis",
        actionLabel: "Analyze Competitors",
      },
    ],
  },
];

<IntelligentEmptyState
  icon={<Users className="w-8 h-8 text-primary" />}
  title="Competitive Analysis"
  description="Some features require prerequisites."
  recommendations={recommendations}
/>;
```

## Best Practices

1. **Always provide context**: Include relevant tips and recommendations for the current page
2. **Check prerequisites**: Use `checkFeatureAccess` to determine if features should be locked
3. **Prioritize actions**: Order recommendations by impact (high → medium → low)
4. **Show progress**: Include profile completion status when relevant
5. **Be specific**: Provide estimated times and clear descriptions
6. **Guide users**: Always show the next logical step

## Demo

Visit `/intelligent-empty-state-demo` to see all variations in action.

## Related Components

- `EmptyState`: Basic empty state component
- `NoDataEmptyState`: Preset for no data scenarios
- `NoResultsEmptyState`: Preset for search results
- `FirstTimeUseEmptyState`: Preset for onboarding
