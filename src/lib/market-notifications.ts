/**
 * Market Notifications System
 * 
 * Monitors market changes relevant to agents and sends intelligent notifications
 * with AI-powered insights and priority determination.
 */

import { getRepository } from '@/aws/dynamodb/repository';
import { getBedrockClient } from '@/aws/bedrock/client';
import { EntityType } from '@/aws/dynamodb/types';
import { z } from 'zod';

/**
 * Entity type for notification preferences
 */
const NOTIFICATION_PREFERENCES_ENTITY_TYPE: EntityType = 'NotificationPreferences';

/**
 * Entity type for notification history
 */
const NOTIFICATION_HISTORY_ENTITY_TYPE: EntityType = 'NotificationHistory' as any;

/**
 * Notification priority levels
 */
export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Notification categories
 */
export type NotificationCategory =
  | 'market_trend'
  | 'competitor_activity'
  | 'opportunity'
  | 'warning'
  | 'insight'
  | 'recommendation';

/**
 * Notification delivery channels
 */
export type NotificationChannel = 'in_app' | 'email' | 'push';

/**
 * User notification preferences
 */
export interface NotificationPreferences {
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
  priorityThreshold: NotificationPriority; // Only notify for this priority and above
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  frequency: {
    maxPerDay: number;
    maxPerHour: number;
  };
  marketFocus: string[]; // Markets to monitor
  lastUpdated: number;
}

/**
 * Market notification
 */
export interface MarketNotification {
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

/**
 * Market change event
 */
export interface MarketChangeEvent {
  type: 'price_change' | 'inventory_change' | 'trend_shift' | 'competitor_action';
  market: string;
  data: Record<string, any>;
  timestamp: number;
}

/**
 * Zod schema for AI notification analysis
 */
const NotificationAnalysisSchema = z.object({
  shouldNotify: z.boolean(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  category: z.enum([
    'market_trend',
    'competitor_activity',
    'opportunity',
    'warning',
    'insight',
    'recommendation',
  ]),
  title: z.string(),
  message: z.string(),
  aiInsight: z.string().optional(),
  actionable: z.boolean(),
  actionUrl: z.string().optional(),
  actionLabel: z.string().optional(),
  reasoning: z.string(),
});

/**
 * Market Notifications Service
 * 
 * Monitors market changes and sends intelligent notifications to agents
 */
export class MarketNotificationsService {
  private repository = getRepository();
  private bedrockClient = getBedrockClient();

  /**
   * Generates DynamoDB keys for notification preferences
   */
  private getPreferencesKeys(userId: string) {
    return {
      PK: `USER#${userId}`,
      SK: 'NOTIFICATION_PREFERENCES',
    };
  }

  /**
   * Generates DynamoDB keys for notification history
   */
  private getNotificationKeys(userId: string, notificationId: string) {
    return {
      PK: `USER#${userId}`,
      SK: `NOTIFICATION#${notificationId}`,
    };
  }

  /**
   * Gets notification preferences for a user
   * Creates default preferences if none exist
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const keys = this.getPreferencesKeys(userId);
    const preferences = await this.repository.get<NotificationPreferences>(
      keys.PK,
      keys.SK
    );

    if (preferences) {
      return preferences;
    }

    // Create default preferences
    const defaultPreferences: NotificationPreferences = {
      userId,
      enabled: true,
      channels: {
        in_app: true,
        email: false,
        push: false,
      },
      categories: {
        market_trend: true,
        competitor_activity: true,
        opportunity: true,
        warning: true,
        insight: true,
        recommendation: true,
      },
      priorityThreshold: 'medium',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
      frequency: {
        maxPerDay: 10,
        maxPerHour: 3,
      },
      marketFocus: [],
      lastUpdated: Date.now(),
    };

    await this.repository.create(
      keys.PK,
      keys.SK,
      NOTIFICATION_PREFERENCES_ENTITY_TYPE,
      defaultPreferences
    );

    return defaultPreferences;
  }

  /**
   * Updates notification preferences
   */
  async updatePreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<void> {
    const keys = this.getPreferencesKeys(userId);
    await this.repository.update(keys.PK, keys.SK, {
      ...updates,
      lastUpdated: Date.now(),
    });
  }

  /**
   * Checks if notifications are allowed based on preferences
   */
  private async canSendNotification(
    userId: string,
    priority: NotificationPriority,
    category: NotificationCategory
  ): Promise<boolean> {
    const preferences = await this.getPreferences(userId);

    // Check if notifications are enabled
    if (!preferences.enabled) {
      return false;
    }

    // Check if category is enabled
    if (!preferences.categories[category]) {
      return false;
    }

    // Check priority threshold
    const priorityLevels: NotificationPriority[] = [
      'low',
      'medium',
      'high',
      'critical',
    ];
    const notificationPriorityIndex = priorityLevels.indexOf(priority);
    const thresholdIndex = priorityLevels.indexOf(
      preferences.priorityThreshold
    );

    if (notificationPriorityIndex < thresholdIndex) {
      return false;
    }

    // Check quiet hours
    if (preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      const isInQuietHours = this.isTimeInRange(
        currentTime,
        preferences.quietHours.start,
        preferences.quietHours.end
      );

      if (isInQuietHours && priority !== 'critical') {
        return false;
      }
    }

    // Check frequency limits
    const recentNotifications = await this.getRecentNotifications(userId);
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const notificationsLastHour = recentNotifications.filter(
      (n) => n.createdAt > oneHourAgo
    ).length;
    const notificationsLastDay = recentNotifications.filter(
      (n) => n.createdAt > oneDayAgo
    ).length;

    if (notificationsLastHour >= preferences.frequency.maxPerHour) {
      return false;
    }

    if (notificationsLastDay >= preferences.frequency.maxPerDay) {
      return false;
    }

    return true;
  }

  /**
   * Checks if a time is within a range (handles overnight ranges)
   */
  private isTimeInRange(
    time: string,
    start: string,
    end: string
  ): boolean {
    if (start <= end) {
      return time >= start && time <= end;
    } else {
      // Overnight range (e.g., 22:00 to 08:00)
      return time >= start || time <= end;
    }
  }

  /**
   * Gets recent notifications for frequency checking
   */
  private async getRecentNotifications(
    userId: string
  ): Promise<MarketNotification[]> {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const result = await this.repository.query(
      `USER#${userId}`,
      'NOTIFICATION#'
    );

    const notifications = result.items
      .map((item) => (item as any).Data as MarketNotification)
      .filter((n) => n.createdAt > oneDayAgo);

    return notifications;
  }

  /**
   * Analyzes a market change event using AI to determine if notification is needed
   */
  async analyzeMarketChange(
    userId: string,
    event: MarketChangeEvent,
    userContext: {
      marketFocus: string[];
      recentActivity: string[];
      goals: string[];
    }
  ): Promise<{
    shouldNotify: boolean;
    notification?: Omit<MarketNotification, 'id' | 'userId' | 'createdAt' | 'read' | 'dismissed'>;
  }> {
    try {
      const prompt = this.buildMarketAnalysisPrompt(event, userContext);

      const result = await this.bedrockClient.invoke(
        prompt,
        NotificationAnalysisSchema,
        {
          temperature: 0.5,
          maxTokens: 1500,
        }
      );

      if (!result.shouldNotify) {
        return { shouldNotify: false };
      }

      return {
        shouldNotify: true,
        notification: {
          title: result.title,
          message: result.message,
          category: result.category,
          priority: result.priority,
          aiInsight: result.aiInsight,
          actionable: result.actionable,
          actionUrl: result.actionUrl,
          actionLabel: result.actionLabel,
          relatedData: event.data,
        },
      };
    } catch (error) {
      console.error('Failed to analyze market change:', error);
      return { shouldNotify: false };
    }
  }

  /**
   * Builds prompt for AI market analysis
   */
  private buildMarketAnalysisPrompt(
    event: MarketChangeEvent,
    userContext: {
      marketFocus: string[];
      recentActivity: string[];
      goals: string[];
    }
  ): string {
    return `You are an AI assistant analyzing market changes for a real estate agent.

Market Change Event:
- Type: ${event.type}
- Market: ${event.market}
- Data: ${JSON.stringify(event.data, null, 2)}
- Timestamp: ${new Date(event.timestamp).toISOString()}

Agent Context:
- Market Focus: ${userContext.marketFocus.join(', ') || 'Not specified'}
- Recent Activity: ${userContext.recentActivity.join(', ') || 'None'}
- Goals: ${userContext.goals.join(', ') || 'Not specified'}

Analyze this market change and determine:
1. Should we notify the agent about this change?
2. If yes, what priority level should it have?
3. What category does it fall into?
4. What should the notification say?
5. Is there an actionable insight or recommendation?

Consider:
- Is this change relevant to the agent's market focus?
- Is this change significant enough to warrant attention?
- Does this present an opportunity or warning?
- What action should the agent take?

Return your response as JSON matching this structure:
{
  "shouldNotify": true | false,
  "priority": "critical" | "high" | "medium" | "low",
  "category": "market_trend" | "competitor_activity" | "opportunity" | "warning" | "insight" | "recommendation",
  "title": "Brief notification title",
  "message": "Clear, actionable notification message",
  "aiInsight": "Optional deeper insight or context",
  "actionable": true | false,
  "actionUrl": "/path/to/relevant/feature" (optional),
  "actionLabel": "Action button text" (optional),
  "reasoning": "Why you made this decision"
}`;
  }

  /**
   * Creates and sends a notification to a user
   */
  async sendNotification(
    userId: string,
    notification: Omit<
      MarketNotification,
      'id' | 'userId' | 'createdAt' | 'read' | 'dismissed'
    >
  ): Promise<MarketNotification | null> {
    // Check if we can send this notification
    const canSend = await this.canSendNotification(
      userId,
      notification.priority,
      notification.category
    );

    if (!canSend) {
      return null;
    }

    // Create notification
    const notificationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullNotification: MarketNotification = {
      ...notification,
      id: notificationId,
      userId,
      createdAt: Date.now(),
      read: false,
      dismissed: false,
    };

    // Store in DynamoDB
    const keys = this.getNotificationKeys(userId, notificationId);
    await this.repository.create(
      keys.PK,
      keys.SK,
      NOTIFICATION_HISTORY_ENTITY_TYPE,
      fullNotification
    );

    // TODO: Send via other channels (email, push) based on preferences
    // This would integrate with email service and push notification service

    return fullNotification;
  }

  /**
   * Gets all notifications for a user
   */
  async getNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      limit?: number;
      category?: NotificationCategory;
    } = {}
  ): Promise<MarketNotification[]> {
    const result = await this.repository.query(
      `USER#${userId}`,
      'NOTIFICATION#',
      {
        scanIndexForward: false, // Most recent first
        limit: options.limit,
      }
    );

    let notifications = result.items.map(
      (item) => (item as any).Data as MarketNotification
    );

    // Filter by unread
    if (options.unreadOnly) {
      notifications = notifications.filter((n) => !n.read && !n.dismissed);
    }

    // Filter by category
    if (options.category) {
      notifications = notifications.filter(
        (n) => n.category === options.category
      );
    }

    // Filter expired notifications
    const now = Date.now();
    notifications = notifications.filter(
      (n) => !n.expiresAt || n.expiresAt > now
    );

    return notifications;
  }

  /**
   * Marks a notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const keys = this.getNotificationKeys(userId, notificationId);
    await this.repository.update(keys.PK, keys.SK, {
      read: true,
    });
  }

  /**
   * Marks all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.getNotifications(userId, {
      unreadOnly: true,
    });

    await Promise.all(
      notifications.map((n) => this.markAsRead(userId, n.id))
    );
  }

  /**
   * Dismisses a notification
   */
  async dismissNotification(
    userId: string,
    notificationId: string
  ): Promise<void> {
    const keys = this.getNotificationKeys(userId, notificationId);
    await this.repository.update(keys.PK, keys.SK, {
      dismissed: true,
    });
  }

  /**
   * Gets unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.getNotifications(userId, {
      unreadOnly: true,
    });
    return notifications.length;
  }

  /**
   * Monitors market changes and sends notifications
   * This would be called periodically (e.g., via cron job or event trigger)
   */
  async monitorMarketChanges(
    userId: string,
    marketData: {
      priceChanges?: Array<{ market: string; change: number }>;
      inventoryChanges?: Array<{ market: string; change: number }>;
      trendShifts?: Array<{ market: string; trend: string }>;
      competitorActions?: Array<{ market: string; action: string }>;
    }
  ): Promise<MarketNotification[]> {
    const preferences = await this.getPreferences(userId);
    const notifications: MarketNotification[] = [];

    // Get user context for AI analysis
    const userContext = {
      marketFocus: preferences.marketFocus,
      recentActivity: [], // Would come from personalization engine
      goals: [], // Would come from personalization engine
    };

    // Analyze price changes
    if (marketData.priceChanges) {
      for (const change of marketData.priceChanges) {
        const event: MarketChangeEvent = {
          type: 'price_change',
          market: change.market,
          data: { change: change.change },
          timestamp: Date.now(),
        };

        const analysis = await this.analyzeMarketChange(
          userId,
          event,
          userContext
        );

        if (analysis.shouldNotify && analysis.notification) {
          const notification = await this.sendNotification(
            userId,
            analysis.notification
          );
          if (notification) {
            notifications.push(notification);
          }
        }
      }
    }

    // Similar logic for other market changes...

    return notifications;
  }
}

/**
 * Singleton instance
 */
let serviceInstance: MarketNotificationsService | null = null;

/**
 * Gets the singleton market notifications service instance
 */
export function getMarketNotificationsService(): MarketNotificationsService {
  if (!serviceInstance) {
    serviceInstance = new MarketNotificationsService();
  }
  return serviceInstance;
}

/**
 * Resets the singleton instance (useful for testing)
 */
export function resetMarketNotificationsService(): void {
  serviceInstance = null;
}
