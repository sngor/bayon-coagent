# AI Personalization Engine

The AI Personalization Engine tracks user behavior, learns patterns, and provides AI-powered personalized recommendations for real estate agents using the platform.

## Features

- **Feature Usage Tracking**: Automatically tracks which features users interact with most
- **Workflow Pattern Detection**: Identifies common sequences of actions
- **AI-Powered Recommendations**: Uses AWS Bedrock to generate personalized suggestions
- **Market Insights**: Provides relevant market insights based on user's focus areas
- **Goal Tracking**: Helps users set and track progress toward their goals
- **Content Preferences**: Learns which content types work best for each user

## Data Storage

Personalization data is stored in DynamoDB with the following key pattern:

- **PK**: `USER#<userId>`
- **SK**: `PERSONALIZATION`
- **EntityType**: `PersonalizationProfile`

## Usage

### Basic Setup

```typescript
import { getPersonalizationEngine } from "@/lib/ai-personalization";

const engine = getPersonalizationEngine();
```

### Track Feature Usage

Track when a user interacts with a feature:

```typescript
// In your feature component or server action
await engine.trackFeatureUsage(userId, "marketing-plan");
await engine.trackFeatureUsage(userId, "content-engine");
await engine.trackFeatureUsage(userId, "brand-audit");
```

### Get Personalized Dashboard

Retrieve AI-powered personalized dashboard data:

```typescript
const dashboard = await engine.getPersonalizedDashboard(userId);

// dashboard contains:
// - priorityActions: AI-suggested actions to take today
// - suggestedContent: Content types to create
// - marketInsights: Relevant market insights
// - nextBestActions: Predicted next steps based on patterns
```

### Get Contextual Suggestions

Get AI suggestions based on current context:

```typescript
const suggestions = await engine.getAISuggestions(userId, {
  currentPage: "dashboard",
  recentActions: ["viewed-profile", "created-content"],
  timeOfDay: new Date().getHours(),
  profileCompletion: 75,
});

// Returns array of suggestions with title, description, action, and priority
```

### Track Content Preferences

Track which content types work well for the user:

```typescript
// When user successfully creates content
await engine.trackContentPreference(userId, "blog-post", true);

// When content creation fails or is abandoned
await engine.trackContentPreference(userId, "social-media", false);
```

### Update User Goals

Set or update user's goals:

```typescript
await engine.updateGoals(userId, {
  shortTerm: [
    "Complete profile setup",
    "Run first brand audit",
    "Create 5 blog posts",
  ],
  longTerm: [
    "Become top agent in my market",
    "Build strong online presence",
    "Generate 10 leads per month from content",
  ],
});
```

### Update Market Focus

Set the user's market focus areas:

```typescript
await engine.updateMarketFocus(userId, [
  "Luxury homes",
  "Downtown condos",
  "First-time buyers",
]);
```

### Get Frequent Features

Retrieve the user's most frequently used features:

```typescript
const frequentFeatures = await engine.getFrequentFeatures(userId);
// Returns: ['marketing-plan', 'content-engine', 'brand-audit', ...]
```

## Integration Examples

### Server Action Integration

```typescript
// src/app/actions.ts
"use server";

import { getPersonalizationEngine } from "@/lib/ai-personalization";
import { getCurrentUser } from "@/aws/auth/use-user";

export async function trackFeature(feature: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const engine = getPersonalizationEngine();
  await engine.trackFeatureUsage(user.userId, feature);
}

export async function getPersonalizedDashboardData() {
  const user = await getCurrentUser();
  if (!user) return null;

  const engine = getPersonalizationEngine();
  return await engine.getPersonalizedDashboard(user.userId);
}
```

### Component Integration

```typescript
// src/app/(app)/dashboard/page.tsx
import { getPersonalizedDashboardData } from "@/app/actions";

export default async function DashboardPage() {
  const personalizedData = await getPersonalizedDashboardData();

  return (
    <div>
      <h1>Your Personalized Dashboard</h1>

      {/* Priority Actions */}
      <section>
        <h2>Recommended Actions</h2>
        {personalizedData?.priorityActions.map((action) => (
          <ActionCard key={action.title} action={action} />
        ))}
      </section>

      {/* Market Insights */}
      <section>
        <h2>Market Insights</h2>
        {personalizedData?.marketInsights.map((insight) => (
          <InsightCard key={insight.title} insight={insight} />
        ))}
      </section>
    </div>
  );
}
```

### Client-Side Tracking

```typescript
// src/components/feature-tracker.tsx
"use client";

import { useEffect } from "react";
import { trackFeature } from "@/app/actions";

export function FeatureTracker({ feature }: { feature: string }) {
  useEffect(() => {
    // Track feature usage when component mounts
    trackFeature(feature);
  }, [feature]);

  return null;
}

// Usage in a page:
// <FeatureTracker feature="marketing-plan" />
```

## AI-Powered Features

### Priority Actions

The engine uses AWS Bedrock to analyze the user's profile and generate personalized priority actions. These are specific, actionable recommendations based on:

- User's market focus
- Frequently used features
- Short-term and long-term goals
- Recent activity patterns

### Market Insights

AI-generated insights provide:

- Market opportunities relevant to the user's focus
- Trend analysis
- Actionable tips
- Warnings about potential issues

### Workflow Optimization

The engine detects common workflow patterns and suggests:

- Next logical steps based on past sequences
- Optimal times for certain activities
- Shortcuts and efficiency improvements

## Fallback Behavior

When AI services are unavailable, the engine provides intelligent fallbacks:

- Rule-based priority actions based on usage patterns
- Default content suggestions
- Generic but relevant market insights

## Performance Considerations

- Profile data is cached in DynamoDB for fast retrieval
- AI calls are made asynchronously and cached when possible
- Fallback mechanisms ensure the app remains functional without AI
- Feature tracking is fire-and-forget (doesn't block user actions)

## Privacy & Data

- All personalization data is stored per-user in DynamoDB
- Data is only used to improve the user's own experience
- No cross-user data sharing or analysis
- Users can reset their personalization data if needed

## Future Enhancements

Potential future improvements:

- Predictive content scheduling
- Automated workflow suggestions
- Performance benchmarking against goals
- Collaborative filtering for similar agents
- Real-time market alerts
- Integration with external data sources
