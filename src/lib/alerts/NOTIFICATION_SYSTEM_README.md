# Market Intelligence Alerts - Notification System

This document describes the notification system implementation for Market Intelligence Alerts, including email notifications, digest generation, and template management.

## Overview

The notification system provides comprehensive email notification capabilities for Market Intelligence Alerts, including:

- **Real-time notifications** for immediate alerts
- **Daily and weekly digests** for batched summaries
- **Email template management** with professional formatting
- **Notification preferences** with quiet hours and frequency control
- **Lambda-based processing** for scheduled digest generation

## Architecture

### Components

1. **NotificationService** (`notification-service.ts`)

   - Core service for sending notifications and managing preferences
   - Handles real-time alerts and digest generation
   - Integrates with AWS SES for email delivery

2. **SES Client** (`/aws/ses/client.ts`)

   - AWS SES integration for email operations
   - Template management and email sending
   - Support for both simple and templated emails

3. **Notification Types** (`notification-types.ts`)

   - TypeScript definitions for all notification-related data structures
   - Preferences, templates, digests, and queue management types

4. **Lambda Processor** (`/lambda/notification-processor.ts`)

   - Scheduled Lambda function for digest generation
   - Queue processing for delayed notifications
   - Handles daily/weekly digest scheduling

5. **UI Components**
   - `NotificationSettings` - User preference management
   - `DigestManagement` - Testing and template management

## Features

### Email Notifications

#### Real-time Notifications

- Sent immediately when new alerts are created
- Respects quiet hours settings
- Queued for later delivery during quiet periods
- Professional email templates with agent branding

#### Digest Emails

- **Daily Digest**: Summary of past 24 hours
- **Weekly Digest**: Summary of past 7 days
- Includes alert counts, priorities, and trends
- Only sent when there are alerts to include

### Notification Preferences

Users can configure:

- **Email notifications**: Enable/disable email alerts
- **Email address**: Custom email or use account email
- **Frequency**: Real-time, daily digest, or weekly digest
- **Alert types**: Choose which alert types to receive
- **Quiet hours**: Set times to avoid real-time notifications
- **Digest timing**: Choose when to receive digest emails

### Email Templates

Professional email templates include:

- Agent branding (logo, company name, contact info)
- Alert-specific content formatting
- Unsubscribe and preference management links
- Responsive HTML design with text fallbacks

## Usage

### Server Actions

```typescript
// Get notification preferences
const preferences = await getNotificationPreferencesAction();

// Update preferences
await updateNotificationPreferencesAction(formData);

// Send test notification
await sendTestNotificationAction();

// Send digests
await sendDailyDigestAction();
await sendWeeklyDigestAction();

// Initialize email templates
await initializeEmailTemplatesAction();
```

### Notification Service

```typescript
import { notificationService } from "@/lib/alerts/notification-service";

// Send real-time notification
await notificationService.sendRealTimeNotification(userId, alert);

// Send daily digest
await notificationService.sendDailyDigest(userId);

// Update preferences
await notificationService.updateNotificationPreferences(userId, preferences);
```

### UI Components

```tsx
import { NotificationSettings } from '@/components/alerts/notification-settings';
import { DigestManagement } from '@/components/alerts/digest-management';

// Notification preferences form
<NotificationSettings />

// Digest testing and management
<DigestManagement />
```

## Configuration

### Environment Variables

```bash
# SES Configuration
SES_FROM_EMAIL=noreply@bayoncoagent.com
SES_REPLY_TO_EMAIL=support@bayoncoagent.com
SES_REGION=us-east-1

# Application URLs
NEXT_PUBLIC_APP_URL=https://app.bayoncoagent.com
```

### AWS Resources

The system requires:

- **SES**: Email sending and template management
- **DynamoDB**: Notification preferences and queue storage
- **Lambda**: Scheduled digest processing
- **EventBridge**: Scheduling for digest generation

### Lambda Scheduling

- **Queue Processing**: Every 15 minutes
- **Daily Digest**: 9:00 AM UTC daily
- **Weekly Digest**: 9:00 AM UTC on Mondays

## Email Templates

### Template Types

1. **Real-time Alert** (`alert-real-time`)

   - Individual alert notifications
   - Alert-specific content formatting
   - Immediate delivery

2. **Daily Digest** (`alert-daily-digest`)

   - 24-hour alert summary
   - Alert counts by type and priority
   - Scheduled delivery

3. **Weekly Digest** (`alert-weekly-digest`)
   - 7-day alert summary
   - Trend analysis and insights
   - Weekly scheduled delivery

### Template Variables

Common variables available in all templates:

- `{{agentName}}` - Agent's name
- `{{agentEmail}}` - Agent's email
- `{{agentPhone}}` - Agent's phone (optional)
- `{{companyName}}` - Company name (optional)
- `{{logoUrl}}` - Company logo URL (optional)
- `{{unsubscribeUrl}}` - Unsubscribe link
- `{{preferencesUrl}}` - Preferences management link

Alert-specific variables:

- `{{alertType}}` - Type of alert
- `{{alertData}}` - Alert-specific data
- `{{digestDate}}` - Date for digest emails
- `{{totalAlerts}}` - Total alert count
- `{{alertsByType}}` - Breakdown by alert type

## Data Models

### NotificationPreferences

```typescript
interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  emailAddress?: string;
  frequency: "real-time" | "daily" | "weekly";
  digestTime?: string; // HH:MM format
  enabledAlertTypes: AlertType[];
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    timezone: string;
  };
  updatedAt: string;
}
```

### DigestData

```typescript
interface DigestData {
  userId: string;
  period: "daily" | "weekly";
  startDate: string;
  endDate: string;
  alerts: Alert[];
  summary: {
    totalCount: number;
    highPriorityCount: number;
    countsByType: Record<AlertType, number>;
    countsByPriority: Record<string, number>;
  };
  generatedAt: string;
}
```

## Testing

### Unit Tests

- Notification service functionality
- Template generation and validation
- Preference management
- Digest data creation

### Integration Tests

- End-to-end notification flow
- Email template rendering
- Digest generation and scheduling
- Preference persistence

### Manual Testing

- Use the notification settings page at `/settings/notifications`
- Test real-time notifications with the "Send Test Email" button
- Test digest generation with the digest management interface
- Verify email delivery and formatting

## Monitoring

### CloudWatch Metrics

- Lambda function invocations and errors
- SES email sending metrics
- DynamoDB read/write operations
- Dead letter queue messages

### Alarms

- Notification processor errors
- High email bounce rates
- Template creation failures
- Queue processing delays

## Security

### Email Security

- All emails include unsubscribe links
- Preference management requires authentication
- No sensitive data in email content
- Rate limiting on email sending

### Data Protection

- Notification preferences encrypted at rest
- Email addresses handled securely
- Audit logging for preference changes
- GDPR-compliant unsubscribe process

## Troubleshooting

### Common Issues

1. **Emails not sending**

   - Check SES configuration and verified domains
   - Verify IAM permissions for SES operations
   - Check CloudWatch logs for errors

2. **Templates not found**

   - Run template initialization
   - Verify SES template creation permissions
   - Check template names match configuration

3. **Digest not generating**

   - Check Lambda function logs
   - Verify EventBridge scheduling
   - Ensure users have digest frequency enabled

4. **Preferences not saving**
   - Check DynamoDB permissions
   - Verify table configuration
   - Check for validation errors

### Debug Commands

```bash
# Check Lambda logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/bayon-coagent-notification

# List SES templates
aws ses list-templates

# Check DynamoDB items
aws dynamodb scan --table-name BayonCoAgent --filter-expression "SK = :sk" --expression-attribute-values '{":sk":{"S":"SETTINGS#NOTIFICATIONS"}}'
```

## Future Enhancements

- SMS notifications via SNS
- Push notifications for mobile app
- Advanced template customization
- A/B testing for email content
- Analytics dashboard for notification metrics
- Integration with marketing automation platforms
