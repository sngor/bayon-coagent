# DynamoDB Hooks - Usage Examples

This document provides practical examples of using the DynamoDB React hooks in real-world scenarios.

## Basic Examples

### Example 1: User Profile Display

```tsx
"use client";

import { useItem } from "@/aws/dynamodb";
import { useMemo } from "react";

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

export function UserProfileCard({ userId }: { userId: string }) {
  const pk = useMemo(() => `USER#${userId}`, [userId]);
  const sk = useMemo(() => "PROFILE", []);

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useItem<UserProfile>(pk, sk);

  if (isLoading) {
    return <div className="animate-pulse">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">
        <p>Error loading profile: {error.message}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  if (!profile) {
    return <div>Profile not found</div>;
  }

  return (
    <div className="profile-card">
      {profile.avatar && <img src={profile.avatar} alt={profile.name} />}
      <h2>{profile.name}</h2>
      <p>{profile.email}</p>
    </div>
  );
}
```

### Example 2: Saved Content List with Pagination

```tsx
"use client";

import { useQuery } from "@/aws/dynamodb";
import { useMemo } from "react";

interface SavedContent {
  title: string;
  description: string;
  createdAt: number;
  type: "blog" | "social" | "video";
}

export function SavedContentList({ userId }: { userId: string }) {
  const pk = useMemo(() => `USER#${userId}`, [userId]);
  const skPrefix = useMemo(() => "CONTENT#", []);

  const {
    data: content,
    isLoading,
    error,
    hasMore,
    loadMore,
    refetch,
  } = useQuery<SavedContent>(pk, skPrefix, {
    limit: 20,
    scanIndexForward: false, // Most recent first
  });

  if (isLoading && !content) {
    return <div>Loading content...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  if (!content || content.length === 0) {
    return <div>No saved content yet</div>;
  }

  return (
    <div>
      <div className="content-grid">
        {content.map((item) => (
          <div key={item.id} className="content-card">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <span className="badge">{item.type}</span>
            <time>{new Date(item.createdAt).toLocaleDateString()}</time>
          </div>
        ))}
      </div>

      {hasMore && (
        <button onClick={loadMore} disabled={isLoading}>
          {isLoading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
```

## Advanced Examples

### Example 3: Real-time Dashboard with Polling

```tsx
"use client";

import { useQuery } from "@/aws/dynamodb";
import { useMemo } from "react";

interface Project {
  name: string;
  status: "active" | "completed" | "archived";
  progress: number;
  updatedAt: number;
}

export function ProjectDashboard({ userId }: { userId: string }) {
  const pk = useMemo(() => `USER#${userId}`, [userId]);
  const skPrefix = useMemo(() => "PROJECT#", []);

  // Enable polling to show real-time updates
  const {
    data: projects,
    isLoading,
    error,
  } = useQuery<Project>(pk, skPrefix, {
    enablePolling: true,
    pollingInterval: 10000, // Poll every 10 seconds
    scanIndexForward: false,
  });

  if (isLoading) return <div>Loading projects...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!projects || projects.length === 0) return <div>No projects</div>;

  const activeProjects = projects.filter((p) => p.status === "active");
  const completedProjects = projects.filter((p) => p.status === "completed");

  return (
    <div className="dashboard">
      <div className="stats">
        <div>Active: {activeProjects.length}</div>
        <div>Completed: {completedProjects.length}</div>
      </div>

      <div className="project-list">
        {projects.map((project) => (
          <div key={project.id} className={`project-card ${project.status}`}>
            <h3>{project.name}</h3>
            <div className="progress-bar">
              <div style={{ width: `${project.progress}%` }} />
            </div>
            <span>{project.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 4: Filtered Query with Custom Options

```tsx
"use client";

import { useQuery } from "@/aws/dynamodb";
import { useMemo, useState } from "react";

interface Review {
  agentId: string;
  rating: number;
  comment: string;
  source: string;
  createdAt: number;
}

export function ReviewsList({ agentId }: { agentId: string }) {
  const [minRating, setMinRating] = useState(0);

  const pk = useMemo(() => `REVIEW#${agentId}`, [agentId]);
  const skPrefix = useMemo(() => "REVIEW#", []);

  // Use filter expression to filter by rating
  const filterExpression = useMemo(
    () => (minRating > 0 ? "#data.#rating >= :minRating" : undefined),
    [minRating]
  );

  const expressionAttributeNames = useMemo(
    () =>
      minRating > 0 ? { "#data": "Data", "#rating": "rating" } : undefined,
    [minRating]
  );

  const expressionAttributeValues = useMemo(
    () => (minRating > 0 ? { ":minRating": minRating } : undefined),
    [minRating]
  );

  const {
    data: reviews,
    isLoading,
    error,
  } = useQuery<Review>(pk, skPrefix, {
    filterExpression,
    expressionAttributeNames,
    expressionAttributeValues,
    scanIndexForward: false,
  });

  return (
    <div>
      <div className="filters">
        <label>
          Minimum Rating:
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
          >
            <option value={0}>All</option>
            <option value={3}>3+ Stars</option>
            <option value={4}>4+ Stars</option>
            <option value={5}>5 Stars</option>
          </select>
        </label>
      </div>

      {isLoading && <div>Loading reviews...</div>}
      {error && <div>Error: {error.message}</div>}

      {reviews && (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review.id} className="review-card">
              <div className="rating">{"⭐".repeat(review.rating)}</div>
              <p>{review.comment}</p>
              <small>
                {review.source} -{" "}
                {new Date(review.createdAt).toLocaleDateString()}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Example 5: Optimistic Updates with Cache Invalidation

```tsx
"use client";

import { useItem } from "@/aws/dynamodb";
import { getRepository } from "@/aws/dynamodb";
import { getCache } from "@/aws/dynamodb/hooks/cache";
import { useMemo, useState } from "react";

interface AgentProfile {
  name: string;
  bio: string;
  phone: string;
  email: string;
}

export function EditableAgentProfile({ userId }: { userId: string }) {
  const pk = useMemo(() => `USER#${userId}`, [userId]);
  const sk = useMemo(() => "AGENT#main", []);

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useItem<AgentProfile>(pk, sk);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (updates: Partial<AgentProfile>) => {
    setIsSaving(true);

    try {
      const repository = getRepository();
      await repository.update(pk, sk, updates);

      // Invalidate cache to force refetch
      const cache = getCache();
      cache.invalidate(pk, sk);

      // Refetch to get latest data
      await refetch();

      alert("Profile updated successfully!");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!profile) return <div>Profile not found</div>;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        handleSave({
          name: formData.get("name") as string,
          bio: formData.get("bio") as string,
          phone: formData.get("phone") as string,
        });
      }}
    >
      <input name="name" defaultValue={profile.name} />
      <textarea name="bio" defaultValue={profile.bio} />
      <input name="phone" defaultValue={profile.phone} />

      <button type="submit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
```

### Example 6: Conditional Rendering Based on Data

```tsx
"use client";

import { useItem, useQuery } from "@/aws/dynamodb";
import { useMemo } from "react";

interface UserProfile {
  name: string;
  isPremium: boolean;
}

interface MarketingPlan {
  title: string;
  status: string;
}

export function UserDashboard({ userId }: { userId: string }) {
  const profilePk = useMemo(() => `USER#${userId}`, [userId]);
  const profileSk = useMemo(() => "PROFILE", []);

  const { data: profile, isLoading: profileLoading } = useItem<UserProfile>(
    profilePk,
    profileSk
  );

  const plansPk = useMemo(() => `USER#${userId}`, [userId]);
  const plansPrefix = useMemo(() => "PLAN#", []);

  // Only fetch plans if user is premium
  const shouldFetchPlans = profile?.isPremium ?? false;

  const { data: plans, isLoading: plansLoading } = useQuery<MarketingPlan>(
    shouldFetchPlans ? plansPk : null,
    shouldFetchPlans ? plansPrefix : null
  );

  if (profileLoading) return <div>Loading...</div>;
  if (!profile) return <div>Profile not found</div>;

  return (
    <div>
      <h1>Welcome, {profile.name}!</h1>

      {profile.isPremium ? (
        <div>
          <h2>Your Marketing Plans</h2>
          {plansLoading ? (
            <div>Loading plans...</div>
          ) : plans && plans.length > 0 ? (
            <ul>
              {plans.map((plan) => (
                <li key={plan.id}>
                  {plan.title} - {plan.status}
                </li>
              ))}
            </ul>
          ) : (
            <div>No plans yet</div>
          )}
        </div>
      ) : (
        <div>
          <p>Upgrade to Premium to access Marketing Plans!</p>
          <button>Upgrade Now</button>
        </div>
      )}
    </div>
  );
}
```

## Performance Optimization Examples

### Example 7: Disabling Cache for Frequently Updated Data

```tsx
"use client";

import { useItem } from "@/aws/dynamodb";
import { useMemo } from "react";

interface LiveMetrics {
  activeUsers: number;
  requestsPerSecond: number;
  errorRate: number;
}

export function LiveMetricsDashboard({ systemId }: { systemId: string }) {
  const pk = useMemo(() => `SYSTEM#${systemId}`, [systemId]);
  const sk = useMemo(() => "METRICS", []);

  // Disable cache for live data that changes frequently
  const { data: metrics, isLoading } = useItem<LiveMetrics>(pk, sk, {
    enablePolling: true,
    pollingInterval: 2000, // Poll every 2 seconds
    enableCache: false, // Don't cache live data
  });

  if (isLoading) return <div>Loading metrics...</div>;
  if (!metrics) return <div>No metrics available</div>;

  return (
    <div className="metrics-dashboard">
      <div className="metric">
        <h3>Active Users</h3>
        <p>{metrics.activeUsers}</p>
      </div>
      <div className="metric">
        <h3>Requests/sec</h3>
        <p>{metrics.requestsPerSecond}</p>
      </div>
      <div className="metric">
        <h3>Error Rate</h3>
        <p>{(metrics.errorRate * 100).toFixed(2)}%</p>
      </div>
    </div>
  );
}
```

### Example 8: Custom Cache TTL for Different Data Types

```tsx
"use client";

import { useItem } from "@/aws/dynamodb";
import { useMemo } from "react";

interface StaticConfig {
  theme: string;
  features: string[];
}

interface DynamicData {
  notifications: number;
  messages: number;
}

export function AppLayout({ userId }: { userId: string }) {
  const configPk = useMemo(() => "SYSTEM", []);
  const configSk = useMemo(() => "CONFIG", []);

  // Cache static config for 5 minutes
  const { data: config } = useItem<StaticConfig>(configPk, configSk, {
    enableCache: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
  });

  const dataPk = useMemo(() => `USER#${userId}`, [userId]);
  const dataSk = useMemo(() => "DYNAMIC", []);

  // Cache dynamic data for only 10 seconds
  const { data: dynamicData } = useItem<DynamicData>(dataPk, dataSk, {
    enablePolling: true,
    pollingInterval: 10000,
    enableCache: true,
    cacheTTL: 10 * 1000, // 10 seconds
  });

  return (
    <div className={config?.theme}>
      <header>
        <span>Notifications: {dynamicData?.notifications ?? 0}</span>
        <span>Messages: {dynamicData?.messages ?? 0}</span>
      </header>
      {/* Rest of layout */}
    </div>
  );
}
```

## Error Handling Examples

### Example 9: Comprehensive Error Handling

```tsx
"use client";

import { useQuery } from "@/aws/dynamodb";
import { DynamoDBError, ThroughputExceededError } from "@/aws/dynamodb";
import { useMemo } from "react";

export function RobustDataList({ userId }: { userId: string }) {
  const pk = useMemo(() => `USER#${userId}`, [userId]);
  const skPrefix = useMemo(() => "DATA#", []);

  const { data, isLoading, error, refetch } = useQuery(pk, skPrefix);

  if (isLoading) return <div>Loading...</div>;

  if (error) {
    if (error instanceof ThroughputExceededError) {
      return (
        <div className="error-card">
          <h3>Service Temporarily Busy</h3>
          <p>We're experiencing high traffic. Please try again in a moment.</p>
          <button onClick={refetch}>Retry</button>
        </div>
      );
    }

    if (
      error instanceof DynamoDBError &&
      error.code === "ValidationException"
    ) {
      return (
        <div className="error-card">
          <h3>Invalid Request</h3>
          <p>There was a problem with your request. Please contact support.</p>
        </div>
      );
    }

    // Generic error
    return (
      <div className="error-card">
        <h3>Something went wrong</h3>
        <p>{error.message}</p>
        <button onClick={refetch}>Try Again</button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  return (
    <div>
      {data.map((item) => (
        <div key={item.id}>{JSON.stringify(item)}</div>
      ))}
    </div>
  );
}
```

## Testing Examples

### Example 10: Component with Hooks (for testing)

```tsx
"use client";

import { useItem } from "@/aws/dynamodb";
import { useMemo } from "react";

interface User {
  name: string;
  email: string;
}

export function UserDisplay({ userId }: { userId: string }) {
  const pk = useMemo(() => `USER#${userId}`, [userId]);
  const sk = useMemo(() => "PROFILE", []);

  const { data, isLoading, error } = useItem<User>(pk, sk);

  // Expose data-testid for testing
  return (
    <div data-testid="user-display">
      {isLoading && <div data-testid="loading">Loading...</div>}
      {error && <div data-testid="error">{error.message}</div>}
      {data && (
        <div data-testid="user-data">
          <h2 data-testid="user-name">{data.name}</h2>
          <p data-testid="user-email">{data.email}</p>
        </div>
      )}
    </div>
  );
}
```

These examples demonstrate the flexibility and power of the DynamoDB hooks for various use cases in a Next.js application.
