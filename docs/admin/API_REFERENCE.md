# Admin Platform API Reference

## Table of Contents

1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Analytics API](#analytics-api)
5. [User Activity API](#user-activity-api)
6. [Content Moderation API](#content-moderation-api)
7. [Support Tickets API](#support-tickets-api)
8. [System Health API](#system-health-api)
9. [Platform Configuration API](#platform-configuration-api)
10. [Billing API](#billing-api)
11. [Bulk Operations API](#bulk-operations-api)
12. [Audit Logs API](#audit-logs-api)
13. [Engagement Reports API](#engagement-reports-api)
14. [API Keys API](#api-keys-api)
15. [Announcements API](#announcements-api)
16. [Feedback API](#feedback-api)
17. [Maintenance Mode API](#maintenance-mode-api)
18. [Error Codes](#error-codes)
19. [Rate Limiting](#rate-limiting)

---

## Introduction

The Admin Platform API provides programmatic access to all admin features through Next.js Server Actions. All actions are server-side only and require proper authentication and authorization.

### Base Concepts

- **Server Actions**: Functions marked with `"use server"` that run on the server
- **Type Safety**: Full TypeScript support with Zod validation
- **Authorization**: Role-based access control (Admin, SuperAdmin)
- **Audit Logging**: All actions are automatically logged

### API Location

All admin server actions are located in:

```
src/features/admin/actions/admin-actions.ts
```

### See Also

- [User Guide](./USER_GUIDE.md) - User workflows and common tasks
- [Developer Guide](./DEVELOPER_GUIDE.md) - Implementation details and extending the API
- [Testing Guide](./TESTING_GUIDE.md) - Testing API endpoints

---

## Authentication

### Requirements

All API calls require:

1. Valid JWT token from AWS Cognito
2. User role of `Admin` or `SuperAdmin`
3. Active session

### Authorization Levels

| Role       | Access Level         |
| ---------- | -------------------- |
| User       | No admin access      |
| Admin      | Basic admin features |
| SuperAdmin | Full system access   |

### Checking Authorization

```typescript
import { isAdmin, isSuperAdmin } from "@/lib/admin-authorization";

// Check if user is admin
const admin = await isAdmin();

// Check if user is super admin
const superAdmin = await isSuperAdmin();
```

### See Also

- [Developer Guide - Authentication & Authorization](./DEVELOPER_GUIDE.md#authentication--authorization) - Implementation details
- [User Guide - Getting Started](./USER_GUIDE.md#getting-started) - Accessing the admin platform

---

## Response Format

All server actions return a consistent response format:

```typescript
{
  success: boolean;
  data?: T;           // Response data (if successful)
  message?: string;   // Success message
  error?: string;     // Error message (if failed)
}
```

### Error Handling

```typescript
const result = await getPlatformAnalytics(startDate, endDate);

if (!result.success) {
  console.error(result.error);
  // Handle error
  return;
}

// Use result.data
const metrics = result.data;
```

---

## Analytics API

### getPlatformAnalytics

Get platform-wide analytics metrics for a date range.

**Authorization**: Admin, SuperAdmin

**Function Signature**:

```typescript
async function getPlatformAnalytics(
  startDate: string,
  endDate: string
): Promise<{
  success: boolean;
  data?: PlatformMetrics;
  error?: string;
}>;
```

**Parameters**:

- `startDate` (string, required): ISO 8601 date string (e.g., "2024-01-01")
- `endDate` (string, required): ISO 8601 date string (e.g., "2024-01-31")

**Response Data**:

```typescript
interface PlatformMetrics {
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
  };
  aiUsage: {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
  };
}
```

**Example**:

```typescript
import { getPlatformAnalytics } from "@/features/admin/actions/admin-actions";

const result = await getPlatformAnalytics("2024-01-01", "2024-01-31");

if (result.success) {
  console.log("Active Users:", result.data.activeUsers);
  console.log("Total Users:", result.data.totalUsers);
  console.log("Feature Usage:", result.data.featureUsage);
}
```

**Error Codes**:

- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User lacks Admin role
- `INVALID_DATE_RANGE`: Invalid or missing dates
- `QUERY_FAILED`: Database query error

---

### getFeatureUsageStats

Get detailed feature usage statistics.

**Authorization**: Admin, SuperAdmin

**Function Signature**:

```typescript
async function getFeatureUsageStats(
  startDate: string,
  endDate: string
): Promise<{
  success: boolean;
  data?: Record<string, number>;
  error?: string;
}>;
```

**Parameters**:

- `startDate` (string, required): ISO 8601 date string
- `endDate` (string, required): ISO 8601 date string

**Response Data**:

```typescript
{
  "studio/write": 1250,
  "studio/describe": 890,
  "studio/reimagine": 450,
  "brand/profile": 2100,
  "research/agent": 780,
  // ... more features
}
```

**Example**:

```typescript
const result = await getFeatureUsageStats("2024-01-01", "2024-01-31");

if (result.success) {
  const sortedFeatures = Object.entries(result.data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  console.log("Top 10 Features:", sortedFeatures);
}
```

---

## User Activity API

### getAllUserActivity

Get activity summary for all users with filtering and pagination.

**Authorization**: Admin, SuperAdmin

**Function Signature**:

```typescript
async function getAllUserActivity(options?: {
  activityLevel?: "active" | "inactive" | "dormant";
  sortBy?: "lastLogin" | "totalSessions" | "contentCreated";
  limit?: number;
  lastKey?: string;
}): Promise<{
  success: boolean;
  data?: {
    users: UserActivity[];
    lastKey?: string;
  };
  error?: string;
}>;
```

**Parameters**:

- `activityLevel` (string, optional): Filter by activity level
- `sortBy` (string, optional): Sort field (default: 'lastLogin')
- `limit` (number, optional): Results per page (default: 50, max: 100)
- `lastKey` (string, optional): Pagination cursor

**Response Data**:

```typescript
interface UserActivity {
  userId: string;
  email: string;
  name: string;
  lastLogin: number;
  totalSessions: number;
  totalContentCreated: number;
  featureUsage: Record<string, number>;
  aiUsage: {
    requests: number;
    tokens: number;
    cost: number;
  };
  activityLevel: "active" | "inactive" | "dormant";
  signupDate: number;
}
```

**Example**:

```typescript
// Get active users, sorted by sessions
const result = await getAllUserActivity({
  activityLevel: "active",
  sortBy: "totalSessions",
  limit: 50,
});

if (result.success) {
  result.data.users.forEach((user) => {
    console.log(`${user.name}: ${user.totalSessions} sessions`);
  });

  // Pagination
  if (result.data.lastKey) {
    const nextPage = await getAllUserActivity({
      activityLevel: "active",
      sortBy: "totalSessions",
      limit: 50,
      lastKey: result.data.lastKey,
    });
  }
}
```

---

### getUserActivityTimeline

Get detailed activity timeline for a specific user.

**Authorization**: Admin, SuperAdmin

**Function Signature**:

```typescript
async function getUserActivityTimeline(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  success: boolean;
  data?: UserActivityTimeline;
  error?: string;
}>;
```

**Parameters**:

- `userId` (string, required): User ID
- `startDate` (string, optional): Filter start date
- `endDate` (string, optional): Filter end date

**Response Data**:

```typescript
interface UserActivityTimeline {
  userId: string;
  events: Array<{
    timestamp: number;
    eventType: string;
    description: string;
    metadata: Record<string, any>;
  }>;
}
```

**Example**:

```typescript
const result = await getUserActivityTimeline(
  "user-123",
  "2024-01-01",
  "2024-01-31"
);

if (result.success) {
  result.data.events.forEach((event) => {
    const date = new Date(event.timestamp);
    console.log(`${date.toISOString()}: ${event.description}`);
  });
}
```

---

### exportUserActivityData

Export user activity data as CSV.

**Authorization**: Admin, SuperAdmin

**Function Signature**:

```typescript
async function exportUserActivityData(userIds?: string[]): Promise<{
  success: boolean;
  data?: string; // CSV content
  error?: string;
}>;
```

**Parameters**:

- `userIds` (string[], optional): Specific user IDs to export (default: all users)

**Response Data**: CSV string with columns:

- User ID
- Email
- Name
- Last Login
- Total Sessions
- Content Created
- AI Requests
- AI Tokens
- AI Cost
- Activity Level

**Example**:

```typescript
const result = await exportUserActivityData(["user-1", "user-2"]);

if (result.success) {
  // Download CSV
  const blob = new Blob([result.data], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "user-activity.csv";
  a.click();
}
```

---

## Content Moderation API

### getContentForModeration

Get content items for moderation with filtering.

**Authorization**: Admin, SuperAdmin

**Function Signature**:

```typescript
async function getContentForModeration(options?: {
  status?: "pending" | "approved" | "flagged" | "hidden";
  contentType?: string;
  limit?: number;
  lastKey?: string;
}): Promise<{
  success: boolean;
  data?: {
    items: ModerationItem[];
    lastKey?: string;
  };
  error?: string;
}>;
```

**Parameters**:

- `status` (string, optional): Filter by status
- `contentType` (string, optional): Filter by type
- `limit` (number, optional): Results per page (default: 50)
- `lastKey` (string, optional): Pagination cursor

**Response Data**:

```typescript
interface ModerationItem {
  contentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  contentType: "blog_post" | "social_media" | "description" | "image";
  title: string;
  content: string;
  createdAt: number;
  status: "pending" | "approved" | "flagged" | "hidden";
  moderatedBy?: string;
  moderatedAt?: number;
  moderationNote?: string;
}
```

**Example**:

```typescript
// Get pending content
const result = await getContentForModeration({
  status: "pending",
  limit: 20,
});

if (result.success) {
  console.log(`${result.data.items.length} items pending review`);
}
```

### See Also

- [User Guide - Content Moderation](./USER_GUIDE.md#content-moderation) - Moderation workflows and best practices
- [Developer Guide - Service Layer](./DEVELOPER_GUIDE.md#service-layer) - ContentModerationService implementation

---

### moderateContent

Take moderation action on content.

**Authorization**: Admin, SuperAdmin

**Function Signature**:

```typescript
async function moderateContent(
  contentId: string,
  action: "approve" | "flag" | "hide",
  reason?: string
): Promise<{
  success: boolean;
  message: string;
  error?: string;
}>;
```

**Parameters**:

- `contentId` (string, required): Content ID
- `action` (string, required): Moderation action
- `reason` (string, optional): Reason for flag/hide (required for flag and hide)

**Example**:

```typescript
// Approve content
const result = await moderateContent("content-123", "approve");

// Flag content
const result = await moderateContent(
  "content-456",
  "flag",
  "Contains inappropriate language"
);

// Hide content
const result = await moderateContent(
  "content-789",
  "hide",
  "Violates community guidelines"
);

if (result.success) {
  console.log(result.message);
}
```

---

## Support Tickets API

### createSupportTicket

Create a new support ticket.

**Authorization**: Any authenticated user

**Function Signature**:

```typescript
async function createSupportTicket(
  subject: string,
  description: string,
  category: "bug" | "feature_request" | "help" | "billing" | "other"
): Promise<{
  success: boolean;
  data?: SupportTicket;
  error?: string;
}>;
```

**Parameters**:

- `subject` (string, required): Ticket subject (5-200 chars)
- `description` (string, required): Detailed description (10-2000 chars)
- `category` (string, required): Ticket category

**Response Data**:

```typescript
interface SupportTicket {
  ticketId: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
  createdAt: number;
  updatedAt: number;
  assignedTo?: string;
  messages: TicketMessage[];
}
```

**Example**:

```typescript
const result = await createSupportTicket(
  "Cannot upload images",
  "When I try to upload images in the Reimagine tool, I get an error message.",
  "bug"
);

if (result.success) {
  console.log("Ticket created:", result.data.ticketId);
}
```

---

### getSupportTickets

Get all support tickets with filtering.

**Authorization**: Admin, SuperAdmin

**Function Signature**:

```typescript
async function getSupportTickets(options?: {
  status?: string;
  priority?: string;
  limit?: number;
  lastKey?: string;
}): Promise<{
  success: boolean;
  data?: {
    tickets: SupportTicket[];
    lastKey?: string;
  };
  error?: string;
}>;
```

**Parameters**:

- `status` (string, optional): Filter by status
- `priority` (string, optional): Filter by priority
- `limit` (number, optional): Results per page (default: 50)
- `lastKey` (string, optional): Pagination cursor

**Example**:

```typescript
// Get open urgent tickets
const result = await getSupportTickets({
  status: "open",
  priority: "urgent",
});

if (result.success) {
  result.data.tickets.forEach((ticket) => {
    console.log(`${ticket.ticketId}: ${ticket.subject}`);
  });
}
```

### See Also

- [User Guide - Support Tickets](./USER_GUIDE.md#support-tickets) - Ticket management workflows
- [Developer Guide - Service Layer](./DEVELOPER_GUIDE.md#service-layer) - SupportTicketService implementation

---

### respondToTicket

Add a response to a support ticket.

**Authorization**: Admin, SuperAdmin

**Function Signature**:

```typescript
async function respondToTicket(
  ticketId: string,
  message: string
): Promise<{
  success: boolean;
  message: string;
  error?: string;
}>;
```

**Parameters**:

- `ticketId` (string, required): Ticket ID
- `message` (string, required): Response message (10-5000 chars)

**Example**:

```typescript
const result = await respondToTicket(
  "ticket-123",
  "Thank you for reporting this issue. Our team is investigating and will have a fix deployed within 24 hours."
);

if (result.success) {
  console.log("Response sent, user notified via email");
}
```

---

### updateTicketStatus

Update the status of a support ticket.

**Authorization**: Admin, SuperAdmin

**Function Signature**:

```typescript
async function updateTicketStatus(
  ticketId: string,
  status: "open" | "in_progress" | "waiting_user" | "resolved" | "closed",
  resolutionNote?: string
): Promise<{
  success: boolean;
  message: string;
  error?: string;
}>;
```

**Parameters**:

- `ticketId` (string, required): Ticket ID
- `status` (string, required): New status
- `resolutionNote` (string, optional): Required when closing ticket

**Example**:

```typescript
// Close ticket with resolution
const result = await updateTicketStatus(
  "ticket-123",
  "closed",
  "Issue resolved by deploying fix in v2.1.5"
);

if (result.success) {
  console.log("Ticket closed and archived");
}
```

---

## System Health API

### getSystemHealthMetrics

Get real-time system health metrics.

**Authorization**: SuperAdmin only

**Function Signature**:

```typescript
async function getSystemHealthMetrics(): Promise<{
  success: boolean;
  data?: SystemHealthMetrics;
  error?: string;
}>;
```

**Response Data**:

```typescript
interface SystemHealthMetrics {
  timestamp: number;
  apiMetrics: {
    averageResponseTime: number;
    errorRate: number;
    requestsPerMinute: number;
    slowestEndpoints: Array<{
      endpoint: string;
      avgResponseTime: number;
    }>;
  };
  awsServices: {
    dynamodb: {
      status: "healthy" | "degraded" | "down";
      readCapacity: number;
      writeCapacity: number;
      throttledRequests: number;
    };
    bedrock: {
      status: "healthy" | "degraded" | "down";
      requestsPerMinute: number;
      tokensPerMinute: number;
      costPerHour: number;
    };
    s3: {
      status: "healthy" | "degraded" | "down";
      storageUsed: number;
      requestsPerMinute: number;
    };
  };
  errors: Array<{
    errorType: string;
    count: number;
    lastOccurrence: number;
    affectedUsers: number;
    stackTrace?: string;
  }>;
  alerts: Array<{
    severity: "info" | "warning" | "critical";
    message: string;
    timestamp: number;
  }>;
}
```

**Example**:

```typescript
const result = await getSystemHealthMetrics();

if (result.success) {
  const { apiMetrics, awsServices, alerts } = result.data;

  console.log("API Error Rate:", apiMetrics.errorRate);
  console.log("DynamoDB Status:", awsServices.dynamodb.status);
  console.log("Active Alerts:", alerts.length);

  // Check for critical alerts
  const critical = alerts.filter((a) => a.severity === "critical");
  if (critical.length > 0) {
    console.error("CRITICAL ALERTS:", critical);
  }
}
```

### See Also

- [User Guide - System Health](./USER_GUIDE.md#system-health) - Health monitoring workflows
- [Developer Guide - Performance Optimization](./DEVELOPER_GUIDE.md#performance-optimization) - Performance best practices

---

### getErrorLogs

Get error logs with filtering.

**Authorization**: SuperAdmin only

**Function Signature**:

```typescript
async function getErrorLogs(options?: {
  errorType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  data?: Array<{
    errorId: string;
    errorType: string;
    message: string;
    stackTrace: string;
    userId?: string;
    timestamp: number;
    metadata: Record<string, any>;
  }>;
  error?: string;
}>;
```

**Parameters**:

- `errorType` (string, optional): Filter by error type
- `startDate` (string, optional): Filter start date
- `endDate` (string, optional): Filter end date
- `limit` (number, optional): Max results (default: 100)

**Example**:

```typescript
// Get recent database errors
const result = await getErrorLogs({
  errorType: "DatabaseError",
  limit: 50,
});

if (result.success) {
  result.data.forEach((error) => {
    console.log(`${error.errorType}: ${error.message}`);
    console.log("Stack:", error.stackTrace);
  });
}
```

---

## Platform Configuration API

### getFeatureFlags

Get all feature flags.

**Authorization**: SuperAdmin only

**Function Signature**:

```typescript
async function getFeatureFlags(): Promise<{
  success: boolean;
  data?: FeatureFlag[];
  error?: string;
}>;
```

**Response Data**:

```typescript
interface FeatureFlag {
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

**Example**:

```typescript
const result = await getFeatureFlags();

if (result.success) {
  result.data.forEach((flag) => {
    console.log(
      `${flag.name}: ${flag.enabled ? "ON" : "OFF"} (${
        flag.rolloutPercentage
      }%)`
    );
  });
}
```

---

### updateFeatureFlag

Update a feature flag configuration.

**Authorization**: SuperAdmin only

**Function Signature**:

```typescript
async function updateFeatureFlag(
  flagId: string,
  config: Partial<FeatureFlag>
): Promise<{
  success: boolean;
  message: string;
  error?: string;
}>;
```

**Parameters**:

- `flagId` (string, required): Feature flag ID
- `config` (object, required): Partial configuration to update

**Example**:

```typescript
// Enable feature for 50% of users
const result = await updateFeatureFlag("new-dashboard", {
  enabled: true,
  rolloutPercentage: 50,
});

// Target specific users
const result = await updateFeatureFlag("beta-feature", {
  enabled: true,
  rolloutPercentage: 0,
  targetUsers: ["user-1", "user-2", "user-3"],
});

if (result.success) {
  console.log("Feature flag updated");
}
```

### See Also

- [User Guide - Platform Configuration](./USER_GUIDE.md#platform-configuration) - Feature flag management workflows
- [Developer Guide - Extending Features](./DEVELOPER_GUIDE.md#extending-features) - Adding new feature flags

---

### getPlatformSettings

Get platform settings by category.

**Authorization**: SuperAdmin only

**Function Signature**:

```typescript
async function getPlatformSettings(category?: string): Promise<{
  success: boolean;
  data?: PlatformSettings[];
  error?: string;
}>;
```

**Parameters**:

- `category` (string, optional): Filter by category (general, ai, billing, email, security)

**Response Data**:

```typescript
interface PlatformSettings {
  settingId: string;
  category: "general" | "ai" | "billing" | "email" | "security";
  key: string;
  value: any;
  description: string;
  updatedAt: number;
  updatedBy: string;
}
```

**Example**:

```typescript
// Get AI settings
const result = await getPlatformSettings("ai");

if (result.success) {
  result.data.forEach((setting) => {
    console.log(`${setting.key}: ${setting.value}`);
  });
}
```

---

### updatePlatformSetting

Update a platform setting.

**Authorization**: SuperAdmin only

**Function Signature**:

```typescript
async function updatePlatformSetting(
  settingId: string,
  value: any
): Promise<{
  success: boolean;
  message: string;
  error?: string;
}>;
```

**Parameters**:

- `settingId` (string, required): Setting ID
- `value` (any, required): New value (validated based on setting type)

**Example**:

```typescript
// Update max tokens per request
const result = await updatePlatformSetting("ai.maxTokensPerRequest", 4000);

if (result.success) {
  console.log("Setting updated");
}
```

---

## Billing API

### getBillingDashboardMetrics

Get billing dashboard metrics.

**Authorization**: SuperAdmin only

**Function Signature**:

```typescript
async function getBillingDashboardMetrics(): Promise<{
  success: boolean;
  data?: {
    totalRevenue: number;
    monthlyRevenue: number;
    activeSubscriptions: number;
    paymentFailures: number;
    churnRate: number;
    arpu: number;
  };
  error?: string;
}>;
```

**Example**:

```typescript
const result = await getBillingDashboardMetrics();

if (result.success) {
  console.log("Monthly Revenue:", result.data.monthlyRevenue);
  console.log("Active Subscriptions:", result.data.activeSubscriptions);
  console.log("Payment Failures:", result.data.paymentFailures);
}
```

### See Also

- [User Guide - Billing Management](./USER_GUIDE.md#billing-management) - Billing workflows and procedures
- [Developer Guide - Security Considerations](./DEVELOPER_GUIDE.md#security-considerations) - Secure billing implementation

---

### getUserBillingInfo

Get billing information for a specific user.

**Authorization**: SuperAdmin only

**Function Signature**:

```typescript
async function getUserBillingInfo(userId: string): Promise<{
  success: boolean;
  data?: {
    subscriptionStatus: string;
    planType: string;
    paymentHistory: Array<{
      date: number;
      amount: number;
      status: string;
    }>;
    nextBillingDate: number;
    lifetimeValue: number;
  };
  error?: string;
}>;
```

**Example**:

```typescript
const result = await getUserBillingInfo("user-123");

if (result.success) {
  console.log("Subscription:", result.data.subscriptionStatus);
  console.log("Plan:", result.data.planType);
  console.log("LTV:", result.data.lifetimeValue);
}
```

---

### grantTrialExtension

Grant a trial extension to a user.

**Authorization**: SuperAdmin only

**Function Signature**:

```typescript
async function grantTrialExtension(
  userId: string,
  days: number,
  reason: string
): Promise<{
  success: boolean;
  message: string;
  error?: string;
}>;
```

**Parameters**:

- `userId` (string, required): User ID
- `days` (number, required): Number of days to extend (1-90)
- `reason` (string, required): Reason for extension (for audit log)

**Example**:

```typescript
const result = await grantTrialExtension(
  "user-123",
  14,
  "Compensation for service outage"
);

if (result.success) {
  console.log("Trial extended by 14 days");
}
```

---

## Bulk Operations API

### sendBulkEmail

Send email to multiple users.

**Authorization**: Admin, SuperAdmin

**Function Signature**:

```typescript
async function sendBulkEmail(
  userIds: string[],
  subject: string,
  body: string,
  template?: string
): Promise<{
  success: boolean;
  data?: {
    sent: number;
    failed: number;
  };
  error?: string;
}>;
```

**Parameters**:

- `userIds` (string[], required): Array of user IDs (max 10,000)
- `subject` (string, required): Email subject
- `body` (string, required): Email body (HTML supported)
- `template` (string, optional): Email template name

**Example**:

```typescript
const result = await sendBulkEmail(
  ["user-1", "user-2", "user-3"],
  "New Feature Available",
  "<h1>Check out our new dashboard!</h1><p>We just launched...</p>"
);

if (result.success) {
  console.log(`Sent: ${result.data.sent}, Failed: ${result.data.failed}`);
}
```

### See Also

- [User Guide - Bulk Operations](./USER_GUIDE.md#bulk-operations) - Bulk operation workflows and best practices
- [Developer Guide - Performance Optimization](./DEVELOPER_GUIDE.md#performance-optimization) - Optimizing bulk operations

---

### exportBulkUserData

Export data for multiple users.

**Authorization**: Admin, SuperAdmin

**Function Signature**:

```typescript
async function exportBulkUserData(
  userIds: string[],
  fields: string[]
): Promise<{
  success: boolean;
  data?: string; // CSV content
  error?: string;
}>;
```

**Parameters**:

- `userIds` (string[], required): Array of user IDs
- `fields` (string[], required): Fields to include in export

**Available Fields**:

- `userId`, `email`, `name`, `lastLogin`, `totalSessions`
- `contentCreated`, `aiRequests`, `aiTokens`, `aiCost`
- `signupDate`, `activityLevel`

**Example**:

```typescript
const result = await exportBulkUserData(
  ["user-1", "user-2"],
  ["email", "name", "totalSessions", "contentCreated"]
);

if (result.success) {
  // Download CSV
  const blob = new Blob([result.data], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "users.csv";
  a.click();
}
```

---

## Audit Logs API

### getAuditLog

Get audit log entries with filtering.

**Authorization**: SuperAdmin only

**Function Signature**:

```typescript
async function getAuditLog(options?: {
  actionType?: string;
  adminId?: string;
  startDate?: string;
  endDate?: string;
  resourceId?: string;
  limit?: number;
  lastKey?: string;
}): Promise<{
  success: boolean;
  data?: {
    entries: AuditLogEntry[];
    lastKey?: string;
  };
  error?: string;
}>;
```

**Parameters**:

- `actionType` (string, optional): Filter by action type
- `adminId` (string, optional): Filter by admin user
- `startDate` (string, optional): Filter start date
- `endDate` (string, optional): Filter end date
- `resourceId` (string, optional): Filter by affected resource
- `limit` (number, optional): Results per page (default: 100)
- `lastKey` (string, optional): Pagination cursor

**Response Data**:

```typescript
interface AuditLogEntry {
  logId: string;
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
  metadata: Record<string, any>;
}
```

**Example**:

```typescript
// Get all feature flag changes in last 7 days
const result = await getAuditLog({
  actionType: "feature_flag_update",
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date().toISOString(),
});

if (result.success) {
  result.data.entries.forEach((entry) => {
    console.log(`${entry.adminName} updated ${entry.resourceId}`);
    console.log("Before:", entry.beforeValue);
    console.log("After:", entry.afterValue);
  });
}
```

### See Also

- [User Guide - Audit Logs](./USER_GUIDE.md#audit-logs) - Audit log review workflows
- [Developer Guide - Database Schema](./DEVELOPER_GUIDE.md#database-schema) - Audit log data structure

---

### exportAuditLog

Export audit log entries.

**Authorization**: SuperAdmin only

**Function Signature**:

```typescript
async function exportAuditLog(options?: {
  actionType?: string;
  adminId?: string;
  startDate?: string;
  endDate?: string;
  format?: "json" | "csv";
}): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}>;
```

**Parameters**:

- Same filters as `getAuditLog`
- `format` (string, optional): Export format (default: 'json')

**Example**:

```typescript
const result = await exportAuditLog({
  startDate: "2024-01-01",
  endDate: "2024-01-31",
  format: "csv",
});

if (result.success) {
  // Download file
  const blob = new Blob([result.data], {
    type: format === "json" ? "application/json" : "text/csv",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-log.${format}`;
  a.click();
}
```

---

## Engagement Reports API

For engagement report endpoints, see the Analytics API section above. Engagement reports are generated using `getPlatformAnalytics` and `getFeatureUsageStats` with appropriate date ranges.

### See Also

- [User Guide - Engagement Reports](./USER_GUIDE.md#engagement-reports) - Report generation workflows
- [Analytics API](#analytics-api) - Related analytics endpoints

---

## API Keys API

For API key management endpoints, see the Platform Configuration API section above. API keys are managed through platform settings.

### See Also

- [User Guide - API Integrations](./USER_GUIDE.md#api-integrations) - API key management workflows
- [Developer Guide - Security Considerations](./DEVELOPER_GUIDE.md#security-considerations) - Secure API key handling

---

## Announcements API

### createAnnouncement

Create and optionally schedule an announcement.

**Authorization**: Admin, SuperAdmin

**Function Signature**:

```typescript
async function createAnnouncement(
  title: string,
  content: string,
  targetAudience: "all" | "role" | "custom",
  targetValue?: string[],
  deliveryMethod: "email" | "in_app" | "both",
  scheduledFor?: string
): Promise<{
  success: boolean;
  data?: { announcementId: string };
  error?: string;
}>;
```

**Parameters**:

- `title` (string, required): Announcement title
- `content` (string, required): Announcement content (HTML supported)
- `targetAudience` (string, required): Targeting type
- `targetValue` (string[], optional): Target values (roles or user IDs)
- `deliveryMethod` (string, required): How to deliver
- `scheduledFor` (string, optional): ISO date string for scheduling

**Example**:

```typescript
// Send immediately to all users
const result = await createAnnouncement(
  "New Feature: AI Dashboard",
  "<p>We just launched a new AI-powered dashboard...</p>",
  "all",
  undefined,
  "both"
);

// Schedule for specific roles
const result = await createAnnouncement(
  "Admin Training Session",
  "<p>Join us for admin training on Friday...</p>",
  "role",
  ["admin", "superadmin"],
  "email",
  "2024-02-01T10:00:00Z"
);

if (result.success) {
  console.log("Announcement created:", result.data.announcementId);
}
```

### See Also

- [User Guide - Announcements](./USER_GUIDE.md#announcements) - Announcement creation and management workflows
- [Developer Guide - Service Layer](./DEVELOPER_GUIDE.md#service-layer) - AnnouncementService implementation

---

### getAnnouncementStats

Get performance statistics for an announcement.

**Authorization**: Admin, SuperAdmin

**Function Signature**:

```typescript
async function getAnnouncementStats(announcementId: string): Promise<{
  success: boolean;
  data?: {
    sent: number;
    opened: number;
    clicked: number;
  };
  error?: string;
}>;
```

**Example**:

```typescript
const result = await getAnnouncementStats("announcement-123");

if (result.success) {
  const { sent, opened, clicked } = result.data;
  const openRate = ((opened / sent) * 100).toFixed(1);
  const clickRate = ((clicked / sent) * 100).toFixed(1);

  console.log(`Sent: ${sent}`);
  console.log(`Open Rate: ${openRate}%`);
  console.log(`Click Rate: ${clickRate}%`);
}
```

---

## Feedback API

For feedback management endpoints, see the Support Tickets API section above. User feedback is managed through the support ticket system.

### See Also

- [User Guide - User Feedback](./USER_GUIDE.md#user-feedback) - Feedback management workflows
- [Support Tickets API](#support-tickets-api) - Related ticket management endpoints

---

## Maintenance Mode API

For maintenance mode endpoints, see the Platform Configuration API section above. Maintenance mode is controlled through platform settings.

### See Also

- [User Guide - Maintenance Mode](./USER_GUIDE.md#maintenance-mode) - Maintenance scheduling and management
- [Platform Configuration API](#platform-configuration-api) - Related configuration endpoints

---

## Error Codes

### Authentication Errors

| Code              | Description              | HTTP Status |
| ----------------- | ------------------------ | ----------- |
| `UNAUTHORIZED`    | User not authenticated   | 401         |
| `FORBIDDEN`       | User lacks required role | 403         |
| `SESSION_EXPIRED` | JWT token expired        | 401         |
| `INVALID_TOKEN`   | JWT token invalid        | 401         |

### Validation Errors

| Code                     | Description             | HTTP Status |
| ------------------------ | ----------------------- | ----------- |
| `INVALID_INPUT`          | Input validation failed | 400         |
| `MISSING_REQUIRED_FIELD` | Required field missing  | 400         |
| `INVALID_DATE_RANGE`     | Date range invalid      | 400         |
| `INVALID_EMAIL`          | Email format invalid    | 400         |
| `VALUE_OUT_OF_RANGE`     | Value exceeds limits    | 400         |

### Resource Errors

| Code              | Description                          | HTTP Status |
| ----------------- | ------------------------------------ | ----------- |
| `NOT_FOUND`       | Resource not found                   | 404         |
| `ALREADY_EXISTS`  | Resource already exists              | 409         |
| `CONFLICT`        | Resource conflict                    | 409         |
| `RESOURCE_LOCKED` | Resource locked by another operation | 423         |

### Database Errors

| Code                 | Description                   | HTTP Status |
| -------------------- | ----------------------------- | ----------- |
| `QUERY_FAILED`       | Database query failed         | 500         |
| `WRITE_FAILED`       | Database write failed         | 500         |
| `TRANSACTION_FAILED` | Transaction failed            | 500         |
| `THROTTLED`          | Request throttled by DynamoDB | 429         |

### External Service Errors

| Code                 | Description           | HTTP Status |
| -------------------- | --------------------- | ----------- |
| `AWS_SERVICE_ERROR`  | AWS service error     | 502         |
| `EMAIL_SEND_FAILED`  | Email delivery failed | 502         |
| `STRIPE_ERROR`       | Stripe API error      | 502         |
| `EXTERNAL_API_ERROR` | Third-party API error | 502         |

### See Also

- [Developer Guide - Error Handling](./DEVELOPER_GUIDE.md#error-handling) - Error handling implementation
- [User Guide - Troubleshooting](./USER_GUIDE.md#troubleshooting) - Common error solutions

---

## Rate Limiting

### Limits by Endpoint Category

| Category           | Requests per Minute | Burst |
| ------------------ | ------------------- | ----- |
| Analytics          | 60                  | 10    |
| User Activity      | 60                  | 10    |
| Content Moderation | 120                 | 20    |
| Support Tickets    | 120                 | 20    |
| System Health      | 30                  | 5     |
| Configuration      | 30                  | 5     |
| Billing            | 30                  | 5     |
| Bulk Operations    | 10                  | 2     |
| Audit Logs         | 30                  | 5     |

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

### Handling Rate Limits

```typescript
async function callAPIWithRetry(apiFunction, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const result = await apiFunction();

    if (result.success) {
      return result;
    }

    if (result.error === "RATE_LIMIT_EXCEEDED") {
      const waitTime = Math.pow(2, i) * 1000; // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      continue;
    }

    return result; // Other error, don't retry
  }

  throw new Error("Max retries exceeded");
}
```

### See Also

- [Developer Guide - Security Considerations](./DEVELOPER_GUIDE.md#security-considerations) - Rate limiting implementation
- [User Guide - System Health](./USER_GUIDE.md#system-health) - Monitoring API performance

---

## See Also

- [User Guide](./USER_GUIDE.md) - User workflows and common tasks
- [Developer Guide](./DEVELOPER_GUIDE.md) - Implementation details and extending the API
- [Testing Guide](./TESTING_GUIDE.md) - Testing API endpoints
- [README](./README.md) - Documentation overview and navigation

---

_Last Updated: December 2024_  
_API Version: 1.0_  
_Platform Version: 2.0_
