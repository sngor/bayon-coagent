# Market Notifications System

## Overview

The Market Notifications System provides AI-powered, proactive notifications about market changes relevant to real estate agents. It monitors market conditions, analyzes their significance using AI, and delivers intelligent notifications with actionable insights.

## Features

### 🤖 AI-Powered Analysis

- Automatically analyzes market changes for relevance and significance
- Uses AWS Bedrock (Claude) to determine notification priority
- Generates contextual insights and recommendations
- Considers user's market focus, goals, and recent activity

### 🎯 Smart Prioritization

- Four priority levels: Critical, High, Medium, Low
- AI determines priority based on impact and urgency
- Respects user-defined priority thresholds
- Critical notifications bypass quiet hours

### 📊 Multiple Notification Categories

- **Market Trends**: Price changes, inventory shifts, trend analysis
- **Competitor Activity**: Actions by competing agents
- **Opportunities**: New market opportunities
- **Warnings**: Important alerts and risks
- **Insights**: AI-generated tips and observations
- **Recommendations**: Personalized action suggestions

### ⚙️ Granular Preferences

- Enable/disable notifications globally
- Choose delivery channels (in-app, email, push)
- Select which categories to receive
- Set priority threshold
- Configure quiet hours
- Limit notification frequency (per hour/day)
- Specify market focus areas

### 🔔 Multiple Delivery Channels

- **In-App**: Real-time notifications in the application
- **Email**: Digest or immediate email notifications
- **Push**: Mobile push notifications (future)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Market Data Sources                       │
│  (Price Changes, Inventory, Trends, Competitor Actions)     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              MarketNotificationsService                      │
│  • Monitors market changes                                   │
│  • Analyzes with AI (AWS Bedrock)                           │
│  • Determines notification priority                          │
│  • Checks user preferences                                   │
│  • Sends notifications                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    DynamoDB Storage                          │
│  • Notification preferences (USER#id / NOTIFICATION_PREFS)  │
│  • Notification history (USER#id / NOTIFICATION#id)         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   React Components                           │
│  • NotificationBell (header icon with badge)                │
│  • NotificationList (full list view)                        │
│  • NotificationPreferencesForm (settings)                   │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### Basic Setup

```typescript
import { useMarketNotifications } from "@/hooks/use-market-notifications";
import { NotificationBell } from "@/components/ui/market-notifications";

function MyComponent() {
  const { user } = useUser();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useMarketNotifications(user?.userId, {
    autoRefresh: true,
    refreshInterval: 60000, // 1 minute
  });

  return (
    <NotificationBell
      unreadCount={unreadCount}
      notifications={notifications}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
      onDismiss={dismissNotification}
    />
  );
}
```

### Monitoring Market Changes

```typescript
import { getMarketNotificationsService } from "@/lib/market-notifications";
import { getPersonalizationEngine } from "@/lib/ai-personalization";

async function monitorMarket(userId: string) {
  const service = getMarketNotificationsService();
  const engine = getPersonalizationEngine();

  // Get user context
  const profile = await engine.getProfile(userId);

  // Create market change event
  const event = {
    type: "price_change",
    market: "Downtown",
    data: {
      change: 5.2, // 5.2% increase
      averagePrice: 450000,
      inventoryLevel: "low",
    },
    timestamp: Date.now(),
  };

  // Analyze with AI
  const analysis = await service.analyzeMarketChange(userId, event, {
    marketFocus: profile.marketFocus,
    recentActivity: [],
    goals: profile.goals.shortTerm,
  });

  // Send notification if needed
  if (analysis.shouldNotify && analysis.notification) {
    await service.sendNotification(userId, analysis.notification);
  }
}
```

### Managing Preferences

```typescript
import { NotificationPreferencesForm } from "@/components/ui/notification-preferences";

function SettingsPage() {
  const { user } = useUser();
  const { preferences, updatePreferences } = useMarketNotifications(
    user?.userId
  );

  if (!preferences) return <Loading />;

  return (
    <NotificationPreferencesForm
      preferences={preferences}
      onUpdate={updatePreferences}
    />
  );
}
```

### Displaying Notifications

```typescript
import { NotificationList } from "@/components/ui/market-notifications";

function NotificationsPage() {
  const { user } = useUser();
  const { notifications, markAsRead, dismissNotification } =
    useMarketNotifications(user?.userId);

  return (
    <NotificationList
      notifications={notifications}
      onMarkAsRead={markAsRead}
      onDismiss={dismissNotification}
    />
  );
}
```

## Data Models

### NotificationPreferences

```typescript
interface NotificationPreferences {
  userId: string;
  enabled: boolean;
  channels: {
    in_app: boolean;
    email: boolean;
    push: boolean;
  };
  categories: {
    market_trend: boolean;
    competitor_activity: boolean;
    opportunity: boolean;
    warning: boolean;
    insight: boolean;
    recommendation: boolean;
  };
  priorityThreshold: "critical" | "high" | "medium" | "low";
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
  frequency: {
    maxPerDay: number;
    maxPerHour: number;
  };
  marketFocus: string[];
  lastUpdated: number;
}
```

### MarketNotification

```typescript
interface MarketNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  aiInsight?: string;
  actionable: boolean;
  actionUrl?: string;
  actionLabel?: string;
  relatedData?: Record<string, any>;
  createdAt: number;
  expiresAt?: number;
  read: boolean;
  dismissed: boolean;
}
```

## AI Integration

The system uses AWS Bedrock (Claude 3.5 Sonnet) to:

1. **Analyze Market Changes**: Determine if a market change is significant enough to notify the user
2. **Prioritize Notifications**: Assign appropriate priority levels based on impact
3. **Generate Insights**: Create contextual insights and recommendations
4. **Suggest Actions**: Recommend specific actions the agent should take

### AI Prompt Structure

```
You are an AI assistant analyzing market changes for a real estate agent.

Market Change Event:
- Type: price_change
- Market: Downtown
- Data: { change: 5.2, averagePrice: 450000 }

Agent Context:
- Market Focus: Downtown, Suburbs
- Recent Activity: Generated marketing plan, Created blog post
- Goals: Increase listings, Build authority

Analyze and determine:
1. Should we notify? (relevance + significance)
2. Priority level? (impact + urgency)
3. Category? (market_trend, opportunity, etc.)
4. What to say? (clear, actionable message)
5. Recommended action? (specific next step)
```

## DynamoDB Schema

### Notification Preferences

- **PK**: `USER#<userId>`
- **SK**: `NOTIFICATION_PREFERENCES`
- **EntityType**: `NotificationPreferences`

### Notification History

- **PK**: `USER#<userId>`
- **SK**: `NOTIFICATION#<notificationId>`
- **EntityType**: `NotificationHistory`

## Best Practices

### 1. Frequency Management

- Set reasonable frequency limits to avoid overwhelming users
- Default: 3 per hour, 10 per day
- Critical notifications bypass frequency limits

### 2. Quiet Hours

- Respect user's quiet hours for non-critical notifications
- Critical notifications always come through
- Default: 22:00 - 08:00

### 3. Priority Thresholds

- Allow users to set minimum priority level
- Higher thresholds = fewer, more important notifications
- Default: Medium

### 4. Market Relevance

- Only notify about markets in user's focus areas
- Use AI to determine relevance to user's goals
- Consider recent activity and patterns

### 5. Actionability

- Every notification should have a clear next step
- Include action buttons when possible
- Link to relevant features

## Future Enhancements

### Planned Features

- [ ] Email digest notifications
- [ ] Mobile push notifications
- [ ] SMS notifications for critical alerts
- [ ] Notification scheduling
- [ ] Advanced filtering and search
- [ ] Notification templates
- [ ] Bulk actions
- [ ] Export notification history
- [ ] Analytics dashboard

### Integration Opportunities

- [ ] Calendar integration for scheduled notifications
- [ ] CRM integration for client-related notifications
- [ ] MLS integration for listing alerts
- [ ] Social media integration for engagement notifications

## Testing

### Unit Tests

```bash
npm test src/lib/market-notifications.test.ts
```

### Integration Tests

```bash
npm test src/hooks/use-market-notifications.test.ts
```

### Demo Page

Visit `/market-notifications-demo` to see the system in action with simulated market changes.

## Troubleshooting

### Notifications Not Appearing

1. Check if notifications are enabled in preferences
2. Verify priority threshold isn't too high
3. Check frequency limits haven't been exceeded
4. Ensure category is enabled
5. Check if in quiet hours

### AI Analysis Failing

1. Verify AWS Bedrock credentials
2. Check network connectivity
3. Review CloudWatch logs for errors
4. Ensure model ID is correct

### Performance Issues

1. Implement notification pagination
2. Add caching for preferences
3. Use background jobs for monitoring
4. Optimize DynamoDB queries

## Support

For issues or questions:

- Check the demo page: `/market-notifications-demo`
- Review CloudWatch logs
- Contact development team

## License

Internal use only - Co-agent Marketer Platform
