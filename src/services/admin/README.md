# Admin Platform Management - Database Schema

This document describes the DynamoDB schema for the admin platform management system.

## Overview

The admin platform uses the existing single-table design pattern with the following new entity types:

- **AnalyticsEvent**: User activity tracking
- **AggregatedMetrics**: Pre-computed daily/weekly metrics
- **SupportTicket**: User support tickets
- **TicketMessage**: Support ticket messages
- **FeatureFlag**: Feature toggle configuration
- **PlatformSetting**: Platform-wide settings
- **ContentModeration**: Content moderation queue
- **AdminAuditLog**: Admin action audit trail
- **AdminAnnouncement**: Platform announcements
- **ABTestConfig**: A/B test configuration
- **ABTestAssignment**: User A/B test assignments
- **MaintenanceWindow**: Scheduled maintenance windows
- **APIKey**: API key management
- **UserFeedback**: User feedback submissions

## Table Structure

### Analytics Events

**Purpose**: Track user events for analytics and metrics

**Primary Key Pattern**:

- PK: `ANALYTICS#<date>` (e.g., `ANALYTICS#2024-01-15`)
- SK: `EVENT#<timestamp>#<eventId>`

**GSI1 Pattern** (Query by User):

- GSI1PK: `USER#<userId>`
- GSI1SK: `EVENT#<timestamp>`

**TTL**: Automatically deleted after 90 days

**Attributes**:

```typescript
{
  eventId: string;
  userId: string;
  eventType: "page_view" |
    "feature_use" |
    "content_create" |
    "ai_request" |
    "error";
  eventData: Record<string, any>;
  timestamp: number;
  sessionId: string;
  metadata: {
    userAgent: string;
    ipAddress: string;
    platform: string;
  }
}
```

**Access Patterns**:

1. Query all events for a date: Query by PK
2. Query events for a user: Query GSI1 by user ID
3. Query events by type: Use FilterExpression on eventType

### Aggregated Metrics

**Purpose**: Store pre-computed daily metrics for fast dashboard queries

**Primary Key Pattern**:

- PK: `METRICS#<date>` (e.g., `METRICS#2024-01-15`)
- SK: `DAILY`

**Attributes**:

```typescript
{
  date: string;
  activeUsers: number;
  totalUsers: number;
  newSignups24h: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  averageSessionDuration: number;
  featureUsage: Record<string, number>;
  contentCreated: {
    total: number;
    byType: Record<string, number>;
  }
  aiUsage: {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
  }
}
```

**Access Patterns**:

1. Get metrics for a date: Get by PK + SK
2. Get metrics for date range: Query by PK prefix

### Support Tickets

**Purpose**: Manage user support tickets and conversations

**Primary Key Pattern**:

- PK: `TICKET#<ticketId>`
- SK: `METADATA`

**GSI1 Pattern** (Query by Status):

- GSI1PK: `TICKETS#<status>`
- GSI1SK: `<priority>#<createdAt>`

**Attributes**:

```typescript
{
  ticketId: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  description: string;
  category: 'bug' | 'feature_request' | 'help' | 'billing' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  createdAt: number;
  updatedAt: number;
  assignedTo?: string;
}
```

**Access Patterns**:

1. Get ticket by ID: Get by PK + SK
2. Query tickets by status: Query GSI1 by status
3. Query tickets by priority: Query GSI1 with SK filter

### Ticket Messages

**Purpose**: Store conversation history for support tickets

**Primary Key Pattern**:

- PK: `TICKET#<ticketId>`
- SK: `MESSAGE#<timestamp>#<messageId>`

**Attributes**:

```typescript
{
  messageId: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: 'user' | 'admin';
  message: string;
  timestamp: number;
  attachments?: string[];
}
```

**Access Patterns**:

1. Query all messages for a ticket: Query by PK with SK prefix `MESSAGE#`

### Feature Flags

**Purpose**: Control feature rollout and A/B testing

**Primary Key Pattern**:

- PK: `CONFIG#FEATURE_FLAGS`
- SK: `FLAG#<flagId>`

**Attributes**:

```typescript
{
  flagId: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetUsers?: string[];
  targetRoles?: string[];
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}
```

**Access Patterns**:

1. Get all feature flags: Query by PK
2. Get specific flag: Get by PK + SK

### Platform Settings

**Purpose**: Store platform-wide configuration settings

**Primary Key Pattern**:

- PK: `CONFIG#SETTINGS`
- SK: `SETTING#<category>#<key>`

**Attributes**:

```typescript
{
  settingId: string;
  category: "general" | "ai" | "billing" | "email" | "security";
  key: string;
  value: any;
  description: string;
  updatedAt: number;
  updatedBy: string;
}
```

**Access Patterns**:

1. Get all settings: Query by PK
2. Get settings by category: Query by PK with SK prefix `SETTING#<category>#`
3. Get specific setting: Get by PK + SK

### Content Moderation

**Purpose**: Queue for content moderation

**Primary Key Pattern**:

- PK: `USER#<userId>`
- SK: `CONTENT#<contentId>`

**GSI1 Pattern** (Moderation Queue):

- GSI1PK: `MODERATION#<status>`
- GSI1SK: `<createdAt>`

**Attributes**:

```typescript
{
  contentId: string;
  userId: string;
  contentType: 'blog_post' | 'social_media' | 'description' | 'image';
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'flagged' | 'hidden';
  moderatedBy?: string;
  moderatedAt?: number;
  moderationNote?: string;
  createdAt: number;
}
```

**Access Patterns**:

1. Get content by user: Query by PK
2. Query moderation queue by status: Query GSI1 by status

### Admin Audit Log

**Purpose**: Track all administrative actions for compliance

**Primary Key Pattern**:

- PK: `AUDIT#<date>`
- SK: `<timestamp>#<auditId>`

**GSI1 Pattern** (Query by Admin):

- GSI1PK: `AUDIT#<adminId>`
- GSI1SK: `<timestamp>`

**GSI2 Pattern** (Query by Action Type):

- GSI2PK: `AUDIT#<actionType>`
- GSI2SK: `<timestamp>`

**TTL**: Automatically deleted after 90 days

**Attributes**:

```typescript
{
  auditId: string;
  timestamp: number;
  adminId: string;
  adminName: string;
  actionType: string;
  resourceType: string;
  resourceId: string;
  beforeValue?: any;
  afterValue?: any;
  ipAddress: string;
  userAgent: string;
}
```

**Access Patterns**:

1. Query audit logs by date: Query by PK
2. Query logs by admin: Query GSI1 by admin ID
3. Query logs by action type: Query GSI2 by action type

## Global Secondary Indexes (GSI)

The admin platform uses the existing GSI structure:

### GSI1

- **Purpose**: Alternate access patterns (user queries, status queries)
- **Keys**: GSI1PK (partition), GSI1SK (sort)
- **Projection**: ALL

### GSI2

- **Purpose**: Action type queries for audit logs
- **Keys**: GSI2PK (partition), GSI2SK (sort)
- **Projection**: ALL

## Background Jobs

The following background jobs are required:

### 1. Metrics Aggregation Job

- **Frequency**: Hourly
- **Purpose**: Aggregate analytics events into daily metrics
- **Implementation**: EventBridge + Lambda

### 2. Data Cleanup Job

- **Frequency**: Daily
- **Purpose**: Clean up expired data (TTL backup)
- **Implementation**: EventBridge + Lambda

### 3. Announcement Delivery Job

- **Frequency**: As scheduled
- **Purpose**: Send scheduled announcements
- **Implementation**: EventBridge + Lambda

## TTL Configuration

The following entities use TTL for automatic deletion:

1. **AnalyticsEvent**: 90 days retention
2. **AdminAuditLog**: 90 days retention

TTL is set in seconds (Unix timestamp) and stored in the `TTL` attribute.

## Capacity Planning

### Write Capacity

- Analytics events: High volume (1000s per day)
- Support tickets: Low volume (10s per day)
- Audit logs: Medium volume (100s per day)

### Read Capacity

- Analytics dashboard: Medium (cached with 5-minute TTL)
- Support tickets: Low
- Feature flags: High (cached in memory)

## Migration Notes

No migration is required as this is a new feature. The schema extends the existing single-table design without affecting existing entities.

## Testing

To test the schema locally:

1. Start LocalStack: `npm run localstack:start`
2. Initialize tables: `npm run localstack:init`
3. Run tests: `npm test`

## Security Considerations

1. **Access Control**: All admin operations require Admin or SuperAdmin role
2. **Audit Logging**: All admin actions are logged with IP and user agent
3. **Data Retention**: Sensitive data is automatically deleted after 90 days
4. **API Keys**: Stored as hashed values, never in plain text
5. **PII Protection**: User data is encrypted at rest and in transit
