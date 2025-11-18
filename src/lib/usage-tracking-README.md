# Usage Pattern Tracking System

## Overview

The usage pattern tracking system learns from user behavior to surface frequently used features and provide personalized navigation experiences. It tracks feature usage, calculates intelligent scores based on frequency and recency, and stores data locally for persistence.

**Requirements:** 27.1 - Learn and surface frequently used features with AI-powered recommendations

## Features

- ✅ Track feature usage automatically or manually
- ✅ Calculate intelligent usage scores (frequency + recency)
- ✅ Surface frequently used features in navigation
- ✅ Provide usage insights and statistics
- ✅ Export/import data for backup or analysis
- ✅ Sync across browser tabs
- ✅ Category-based analytics

## Architecture

### Storage

Data is stored in `localStorage` under the key `co-agent-usage-patterns`:

```typescript
interface UsagePatterns {
  features: Record<string, FeatureUsage>;
  totalUsage: number;
  lastUpdated: number;
}

interface FeatureUsage {
  featureId: string;
  featureName: string;
  featurePath: string;
  count: number;
  lastUsed: number;
  firstUsed: number;
  category?: string;
}
```

### Scoring Algorithm

Features are ranked using a weighted score:

- **Frequency Score (60%)**: `count / totalUsage`
- **Recency Score (40%)**: Decays over 30 days
- **Combined Score**: `frequency * 0.6 + recency * 0.4`

Only features with ≥3 uses are considered "frequent".

## Usage

### 1. Track Feature Usage Automatically

Add to any page component to track when users visit:

```tsx
import { useTrackFeature } from "@/hooks/use-usage-tracking";

export default function MarketingPlanPage() {
  useTrackFeature(
    "marketing-plan",
    "Marketing Plan",
    "/marketing-plan",
    "Marketing"
  );

  return <div>...</div>;
}
```

### 2. Track Feature Usage Manually

For tracking specific actions within a page:

```tsx
import { useTrackFeatureManually } from "@/hooks/use-usage-tracking";

export default function ContentEngine() {
  const track = useTrackFeatureManually();

  const handleGenerateContent = (type: string) => {
    track(
      `content-${type}`,
      `Generate ${type}`,
      `/content-engine?type=${type}`,
      "Content"
    );
    // ... generate content
  };

  return (
    <button onClick={() => handleGenerateContent("blog")}>Generate</button>
  );
}
```

### 3. Display Frequent Features

Show frequently used features in the sidebar:

```tsx
import { FrequentFeatures } from "@/components/frequent-features";

export default function Sidebar() {
  return (
    <nav>
      {/* Regular navigation items */}
      <NavItems />

      {/* Frequently used features */}
      <FrequentFeatures limit={5} />
    </nav>
  );
}
```

### 4. Get Usage Insights

Display usage statistics on a dashboard:

```tsx
import { useUsageInsights } from "@/hooks/use-usage-tracking";

export default function Dashboard() {
  const { insights } = useUsageInsights();

  return (
    <div>
      <h2>Your Usage</h2>
      <p>Total features used: {insights?.totalFeatures}</p>
      <p>Most used: {insights?.mostUsedFeature?.featureName}</p>
      <p>Favorite category: {insights?.favoriteCategory}</p>
    </div>
  );
}
```

### 5. Get Frequent Features List

Access the list programmatically:

```tsx
import { useFrequentFeatures } from "@/hooks/use-usage-tracking";

export default function QuickActions() {
  const { features, refresh } = useFrequentFeatures(3);

  return (
    <div>
      <h3>Quick Access</h3>
      {features.map((feature) => (
        <Link key={feature.featureId} href={feature.featurePath}>
          {feature.featureName} ({feature.count})
        </Link>
      ))}
    </div>
  );
}
```

## API Reference

### Core Functions

#### `trackFeatureUsage(featureId, featureName, featurePath, category?)`

Track a feature usage event.

```typescript
trackFeatureUsage("dashboard", "Dashboard", "/dashboard", "Core");
```

#### `getFrequentFeatures(limit?)`

Get frequently used features sorted by score.

```typescript
const features = getFrequentFeatures(5);
// Returns: FrequentFeature[]
```

#### `getRecentFeatures(limit?)`

Get recently used features (last 7 days).

```typescript
const features = getRecentFeatures(5);
// Returns: FrequentFeature[]
```

#### `getUsageInsights()`

Get comprehensive usage statistics.

```typescript
const insights = getUsageInsights();
// Returns: UsageInsights
```

#### `getUsageByCategory()`

Get usage counts grouped by category.

```typescript
const stats = getUsageByCategory();
// Returns: Record<string, number>
```

#### `clearUsageData()`

Clear all usage data (useful for testing).

```typescript
clearUsageData();
```

#### `exportUsageData()`

Export usage data as JSON string.

```typescript
const json = exportUsageData();
// Save to file or send to server
```

#### `importUsageData(data)`

Import usage data from JSON string.

```typescript
const success = importUsageData(jsonString);
```

### React Hooks

#### `useTrackFeature(featureId, featureName, featurePath, category?)`

Automatically track feature when component mounts.

#### `useTrackFeatureManually()`

Returns a function to track features manually.

#### `useFrequentFeatures(limit?)`

Returns frequently used features with auto-refresh.

```typescript
const { features, refresh } = useFrequentFeatures(5);
```

#### `useRecentFeatures(limit?)`

Returns recently used features with auto-refresh.

```typescript
const { features, refresh } = useRecentFeatures(5);
```

#### `useUsageInsights()`

Returns usage insights with auto-refresh.

```typescript
const { insights, refresh } = useUsageInsights();
```

## Integration Guide

### Step 1: Add Tracking to Pages

Add `useTrackFeature` to all major pages:

```tsx
// src/app/(app)/dashboard/page.tsx
export default function Dashboard() {
  useTrackFeature("dashboard", "Dashboard", "/dashboard", "Core");
  // ...
}

// src/app/(app)/marketing-plan/page.tsx
export default function MarketingPlan() {
  useTrackFeature(
    "marketing-plan",
    "Marketing Plan",
    "/marketing-plan",
    "Marketing"
  );
  // ...
}
```

### Step 2: Add to Sidebar Navigation

Update the sidebar to show frequent features:

```tsx
// src/app/(app)/layout.tsx
import { FrequentFeatures } from "@/components/frequent-features";

export default function AppLayout({ children }) {
  return (
    <div>
      <Sidebar>
        <NavItems />
        <Separator />
        <FrequentFeatures limit={5} />
      </Sidebar>
      <main>{children}</main>
    </div>
  );
}
```

### Step 3: Add to Dashboard

Show usage insights on the dashboard:

```tsx
// src/app/(app)/dashboard/page.tsx
import { useUsageInsights } from "@/hooks/use-usage-tracking";

export default function Dashboard() {
  const { insights } = useUsageInsights();

  return (
    <div>
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle>Your Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Stat label="Features Used" value={insights.totalFeatures} />
              <Stat label="Total Actions" value={insights.totalUsage} />
              <Stat
                label="Most Used"
                value={insights.mostUsedFeature?.featureName}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### Step 4: Track Specific Actions

Track important actions within features:

```tsx
// src/app/(app)/content-engine/page.tsx
export default function ContentEngine() {
  const track = useTrackFeatureManually();

  const handleGenerate = (type: string) => {
    track(`content-${type}`, `Generate ${type}`, `/content-engine`, "Content");
    // ... generate content
  };

  return (
    <div>
      <Button onClick={() => handleGenerate("blog")}>Generate Blog</Button>
      <Button onClick={() => handleGenerate("social")}>Generate Social</Button>
    </div>
  );
}
```

## Categories

Recommended categories for organizing features:

- **Core**: Dashboard, Profile, Settings
- **Marketing**: Marketing Plan, Campaigns
- **Analytics**: Brand Audit, Competitive Analysis
- **Content**: Content Engine, Blog Posts, Social Media
- **Research**: Research Agent, Knowledge Base
- **Tools**: Integrations, Utilities

## Best Practices

1. **Consistent IDs**: Use kebab-case for feature IDs (`marketing-plan`, not `Marketing Plan`)
2. **Descriptive Names**: Use human-readable names for display
3. **Accurate Paths**: Use the actual route path for navigation
4. **Meaningful Categories**: Group related features together
5. **Track Important Actions**: Focus on high-value user actions
6. **Respect Privacy**: Data stays local, never sent to servers

## Future Enhancements

Potential improvements for future iterations:

1. **Server-Side Storage**: Sync usage data across devices via DynamoDB
2. **AI Recommendations**: Use Bedrock to generate personalized suggestions
3. **Time-of-Day Patterns**: Track when users prefer certain features
4. **Workflow Detection**: Identify common feature sequences
5. **Predictive Suggestions**: Suggest next actions based on patterns
6. **Usage Analytics Dashboard**: Detailed analytics and visualizations
7. **A/B Testing**: Test different recommendation algorithms

## Demo

Visit `/usage-tracking-demo` to see the system in action and test all features.

## Testing

The system includes comprehensive testing:

```bash
# Run tests
npm test usage-tracking

# Test in browser
npm run dev
# Navigate to /usage-tracking-demo
```

## Troubleshooting

### Features not appearing

- Ensure features have been used at least 3 times
- Check that tracking is called correctly
- Verify localStorage is enabled

### Data not persisting

- Check browser localStorage quota
- Ensure localStorage is not disabled
- Try clearing and re-tracking

### Scores seem incorrect

- Scores decay over 30 days based on recency
- Frequency is weighted 60%, recency 40%
- Only features with ≥3 uses are shown

## Support

For questions or issues, refer to:

- Demo page: `/usage-tracking-demo`
- Source code: `src/lib/usage-tracking.ts`
- Hook implementation: `src/hooks/use-usage-tracking.ts`
