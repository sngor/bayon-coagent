# Market Notifications Integration Guide

## Quick Start

### 1. Add Notification Bell to Navigation

Update your main navigation component to include the notification bell:

```typescript
// src/app/(app)/layout.tsx or your navigation component

import { NotificationBell } from "@/components/ui/market-notifications";
import { useMarketNotifications } from "@/hooks/use-market-notifications";
import { useUser } from "@/aws/auth/use-user";

function Navigation() {
  const { user } = useUser();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    onOpenSettings,
  } = useMarketNotifications(user?.id, {
    autoRefresh: true,
    refreshInterval: 60000, // Refresh every minute
  });

  return (
    <nav className="flex items-center gap-4">
      {/* Other navigation items */}

      <NotificationBell
        unreadCount={unreadCount}
        notifications={notifications.slice(0, 10)} // Show last 10
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDismiss={dismissNotification}
        onOpenSettings={() => router.push("/settings/notifications")}
      />
    </nav>
  );
}
```

### 2. Create Notifications Settings Page

```typescript
// src/app/(app)/settings/notifications/page.tsx

"use client";

import { NotificationPreferencesForm } from "@/components/ui/notification-preferences";
import { useMarketNotifications } from "@/hooks/use-market-notifications";
import { useUser } from "@/aws/auth/use-user";

export default function NotificationSettingsPage() {
  const { user } = useUser();
  const { preferences, updatePreferences, loading } = useMarketNotifications(
    user?.id
  );

  if (loading || !preferences) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Notification Settings</h1>
      <NotificationPreferencesForm
        preferences={preferences}
        onUpdate={updatePreferences}
      />
    </div>
  );
}
```

### 3. Create Full Notifications Page

```typescript
// src/app/(app)/notifications/page.tsx

"use client";

import { NotificationList } from "@/components/ui/market-notifications";
import { useMarketNotifications } from "@/hooks/use-market-notifications";
import { useUser } from "@/aws/auth/use-user";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function NotificationsPage() {
  const { user } = useUser();

  const {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useMarketNotifications(user?.id);

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshNotifications}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>Mark All Read</Button>
          )}
        </div>
      </div>

      <NotificationList
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onDismiss={dismissNotification}
      />
    </div>
  );
}
```

## Background Monitoring

### Option 1: API Route with Cron Job

Create an API route that monitors market changes:

```typescript
// src/app/api/monitor-markets/route.ts

import { NextResponse } from "next/server";
import { getMarketNotificationsService } from "@/lib/market-notifications";
import { getPersonalizationEngine } from "@/lib/ai-personalization";

export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = getMarketNotificationsService();
    const engine = getPersonalizationEngine();

    // Get all users (implement pagination for production)
    const users = await getAllUsers(); // Your implementation

    for (const user of users) {
      const profile = await engine.getProfile(user.id);

      // Fetch market data for user's focus areas
      const marketData = await fetchMarketData(profile.marketFocus);

      // Monitor and send notifications
      await service.monitorMarketChanges(user.id, marketData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Market monitoring failed:", error);
    return NextResponse.json({ error: "Monitoring failed" }, { status: 500 });
  }
}
```

Configure Vercel Cron (vercel.json):

```json
{
  "crons": [
    {
      "path": "/api/monitor-markets",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Option 2: AWS EventBridge + Lambda

```typescript
// lambda/market-monitor.ts

import { getMarketNotificationsService } from "@/lib/market-notifications";

export async function handler(event: any) {
  const service = getMarketNotificationsService();

  // Process market changes from event
  const { userId, marketData } = event;

  await service.monitorMarketChanges(userId, marketData);

  return { statusCode: 200 };
}
```

## Manual Notification Sending

For testing or manual notifications:

```typescript
import { getMarketNotificationsService } from "@/lib/market-notifications";

async function sendCustomNotification(userId: string) {
  const service = getMarketNotificationsService();

  await service.sendNotification(userId, {
    title: "New Listing Alert",
    message: "A new property matching your criteria is available",
    category: "opportunity",
    priority: "high",
    aiInsight: "This property is priced 10% below market average",
    actionable: true,
    actionUrl: "/listings/123",
    actionLabel: "View Listing",
  });
}
```

## Customization

### Custom Notification Categories

Extend the notification categories:

```typescript
// In your code
type CustomCategory =
  | NotificationCategory
  | "client_activity"
  | "listing_update";

// Update the service to handle custom categories
```

### Custom Priority Logic

Override the AI priority determination:

```typescript
const analysis = await service.analyzeMarketChange(userId, event, context);

// Override priority based on custom logic
if (event.data.change > 10) {
  analysis.notification.priority = "critical";
}
```

### Custom Notification Templates

Create reusable notification templates:

```typescript
const templates = {
  priceIncrease: (market: string, change: number) => ({
    title: `Price Increase in ${market}`,
    message: `Average prices increased by ${change}% in ${market}`,
    category: "market_trend" as const,
    priority: change > 5 ? ("high" as const) : ("medium" as const),
    actionable: true,
    actionUrl: "/market-analysis",
    actionLabel: "View Analysis",
  }),
};

// Use template
await service.sendNotification(
  userId,
  templates.priceIncrease("Downtown", 5.2)
);
```

## Testing

### Unit Test Example

```typescript
import { MarketNotificationsService } from "@/lib/market-notifications";

describe("MarketNotificationsService", () => {
  it("should respect quiet hours", async () => {
    const service = new MarketNotificationsService();

    // Set quiet hours
    await service.updatePreferences(userId, {
      quietHours: {
        enabled: true,
        start: "22:00",
        end: "08:00",
      },
    });

    // Try to send medium priority notification during quiet hours
    const result = await service.sendNotification(userId, {
      title: "Test",
      message: "Test",
      category: "insight",
      priority: "medium",
      actionable: false,
    });

    expect(result).toBeNull(); // Should not send
  });
});
```

### Integration Test Example

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { NotificationBell } from "@/components/ui/market-notifications";

describe("NotificationBell", () => {
  it("should display unread count", () => {
    render(
      <NotificationBell
        unreadCount={5}
        notifications={[]}
        onMarkAsRead={() => {}}
        onMarkAllAsRead={() => {}}
        onDismiss={() => {}}
      />
    );

    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
```

## Performance Tips

1. **Pagination**: Limit notifications fetched at once
2. **Caching**: Cache preferences in React state
3. **Debouncing**: Debounce preference updates
4. **Lazy Loading**: Load notification list on demand
5. **Background Jobs**: Use queues for bulk operations

## Troubleshooting

### Notifications Not Appearing

1. Check browser console for errors
2. Verify user is authenticated
3. Check notification preferences are enabled
4. Verify DynamoDB permissions
5. Check CloudWatch logs for service errors

### AI Analysis Failing

1. Verify AWS Bedrock credentials
2. Check model ID is correct
3. Review prompt structure
4. Check token limits
5. Monitor Bedrock quotas

### Performance Issues

1. Implement pagination
2. Add caching layer
3. Optimize DynamoDB queries
4. Use background jobs
5. Monitor CloudWatch metrics

## Best Practices

1. **Start Conservative**: Begin with higher priority thresholds
2. **Monitor Feedback**: Track notification dismissal rates
3. **A/B Testing**: Test different notification strategies
4. **User Education**: Explain notification system to users
5. **Gradual Rollout**: Enable for small user groups first

## Support

- Demo Page: `/market-notifications-demo`
- Documentation: `src/lib/market-notifications-README.md`
- CloudWatch Logs: Check for service errors
- DynamoDB Console: Verify data storage

## Next Steps

1. ✅ Add notification bell to navigation
2. ✅ Create settings page
3. ✅ Set up background monitoring
4. ✅ Test with real users
5. ✅ Monitor metrics and adjust
6. ✅ Implement email/push channels
7. ✅ Add analytics dashboard
