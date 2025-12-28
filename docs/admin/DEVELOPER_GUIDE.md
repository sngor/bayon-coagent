# Admin Platform Developer Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema](#database-schema)
4. [Service Layer](#service-layer)
5. [Server Actions](#server-actions)
6. [UI Components](#ui-components)
7. [Authentication & Authorization](#authentication--authorization)
8. [Error Handling](#error-handling)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Extending Features](#extending-features)
12. [Performance Optimization](#performance-optimization)
13. [Security Considerations](#security-considerations)

---

## Introduction

This guide provides technical documentation for developers building and extending the Admin Platform Management system. It covers architecture patterns, implementation details, and best practices.

### See Also

- [User Guide](./USER_GUIDE.md) - User-facing instructions and workflows
- [API Reference](./API_REFERENCE.md) - Complete API endpoint documentation
- [Testing Guide](./TESTING_GUIDE.md) - Testing procedures and best practices

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Database**: Amazon DynamoDB (single-table design)
- **Authentication**: AWS Cognito with JWT tokens
- **UI**: React 19, Tailwind CSS, shadcn/ui
- **Testing**: Jest, fast-check (property-based testing)
- **Monitoring**: AWS CloudWatch, X-Ray

### Project Structure

```
src/
├── app/(app)/admin/              # Admin UI pages
│   ├── analytics/
│   ├── users/
│   ├── content/
│   ├── support/
│   ├── system/
│   ├── config/
│   ├── billing/
│   ├── audit/
│   └── ...
├── features/admin/
│   └── actions/
│       └── admin-actions.ts      # Server actions
├── services/admin/               # Business logic services
```

│ ├── analytics-service.ts
│ ├── user-activity-service.ts
│ ├── content-moderation-service.ts
│ └── ...
├── lib/
│ └── admin-authorization.ts # Authorization utilities
└── middleware/
└── admin-auth.ts # Admin route protection

```

---

## Architecture Overview

### Layered Architecture

```

┌─────────────────────────────────────────┐
│ UI Layer (React Components) │
│ - Pages, Forms, Tables, Charts │
└─────────────────────────────────────────┘
↓
┌─────────────────────────────────────────┐
│ Server Actions Layer │
│ - Input validation (Zod) │
│ - Authorization checks │
│ - Error handling │
└─────────────────────────────────────────┘
↓
┌─────────────────────────────────────────┐
│ Service Layer │
│ - Business logic │
│ - Data transformations │
│ - External API calls │
└─────────────────────────────────────────┘
↓
┌─────────────────────────────────────────┐
│ Data Layer (DynamoDB) │
│ - Single-table design │
│ - GSIs for queries │
│ - TTL for auto-deletion │
└─────────────────────────────────────────┘

```

### Design Principles

1. **Separation of Concerns**: UI, business logic, and data access are separate
2. **Type Safety**: Full TypeScript coverage with strict mode
3. **Server-First**: Business logic runs on server via Server Actions
4. **Single Table Design**: All data in one DynamoDB table with GSIs
5. **Role-Based Access**: Authorization at multiple layers
6. **Audit Everything**: All admin actions logged immutably

---

## Database Schema

### Single-Table Design

All admin data is stored in the main DynamoDB table with the following patterns:

```

#### Analytics Events

```typescript
{
  PK: "ANALYTICS#2024-01-15",           // Date-based partition
  SK: "EVENT#1705334400000#evt-123",   // Timestamp + Event ID
  EntityType: "AnalyticsEvent",
  Data: {
    eventId: "evt-123",
    userId: "user-456",
    eventType: "page_view",
    eventData: { page: "/studio/write" },
    sessionId: "session-789",
    metadata: { userAgent: "...", ipAddress: "..." }
  },
  GSI1PK: "USER#user-456",              // Query by user
  GSI1SK: "EVENT#1705334400000",
  TTL: 1713110400                       // Auto-delete after 90 days
}
```

#### Aggregated Metrics

```typescript
{
  PK: "METRICS#2024-01-15",
  SK: "DAILY",
  EntityType: "DailyMetrics",
  Data: {
    date: "2024-01-15",
    activeUsers: 1250,
    newSignups: 45,
    featureUsage: {
      "studio/write": 890,
      "brand/profile": 1100
    },
    contentCreated: {
      total: 450,
      byType: { blog_post: 200, social_media: 250 }
    },
    aiUsage: {
      totalRequests: 3400,
      totalTokens: 1200000,
      totalCost: 24.50
    }
  }
}
```

#### Support Tickets

```typescript
// Ticket metadata
{
  PK: "TICKET#ticket-123",
  SK: "METADATA",
  EntityType: "SupportTicket",
  Data: {
    ticketId: "ticket-123",
    userId: "user-456",
    userName: "John Doe",
    userEmail: "john@example.com",
    subject: "Cannot upload images",
    description: "When I try to upload...",
    category: "bug",
    priority: "high",
    status: "open",
    createdAt: 1705334400000,
    updatedAt: 1705334400000,
    assignedTo: "admin-789"
  },
  GSI1PK: "TICKETS#open",               // Query by status
  GSI1SK: "high#1705334400000"          // Sort by priority + date
}

// Ticket messages
{
  PK: "TICKET#ticket-123",
  SK: "MESSAGE#1705334400000#msg-456",
  EntityType: "TicketMessage",
  Data: {
    messageId: "msg-456",
    authorId: "admin-789",
    authorName: "Admin User",
    authorRole: "admin",
    message: "Thank you for reporting...",
    timestamp: 1705334400000
  }
}
```

#### Feature Flags

```typescript
{
  PK: "CONFIG#FEATURE_FLAGS",
  SK: "FLAG#new-dashboard",
  EntityType: "FeatureFlag",
  Data: {
    flagId: "new-dashboard",
    name: "New Dashboard",
    description: "Redesigned analytics dashboard",
    enabled: true,
    rolloutPercentage: 50,
    targetUsers: ["user-1", "user-2"],
    targetRoles: ["admin"],
    createdAt: 1705334400000,
    updatedAt: 1705334400000,
    createdBy: "superadmin-123"
  }
}
```

#### Platform Settings

```typescript
{
  PK: "CONFIG#SETTINGS",
  SK: "SETTING#ai#maxTokensPerRequest",
  EntityType: "PlatformSetting",
  Data: {
    settingId: "ai.maxTokensPerRequest",
    category: "ai",
    key: "maxTokensPerRequest",
    value: 4000,
    description: "Maximum tokens per AI request",
    updatedAt: 1705334400000,
    updatedBy: "superadmin-123"
  }
}
```

#### Content Moderation Queue

```typescript
{
  PK: "USER#user-456",
  SK: "CONTENT#content-789",
  EntityType: "Content",
  Data: {
    contentId: "content-789",
    contentType: "blog_post",
    title: "Top 10 Real Estate Tips",
    content: "...",
    status: "pending",
    moderatedBy: null,
    moderatedAt: null,
    moderationNote: null,
    createdAt: 1705334400000
  },
  GSI1PK: "MODERATION#pending",         // Query by status
  GSI1SK: "1705334400000"               // Sort by date
}
```

#### Audit Logs

```typescript
{
  PK: "AUDIT#2024-01-15",               // Date-based partition
  SK: "LOG#1705334400000#log-123",
  EntityType: "AuditLog",
  Data: {
    logId: "log-123",
    timestamp: 1705334400000,
    adminId: "admin-456",
    adminName: "Admin User",
    actionType: "feature_flag_update",
    resourceType: "feature_flag",
    resourceId: "new-dashboard",
    beforeValue: { enabled: false, rolloutPercentage: 0 },
    afterValue: { enabled: true, rolloutPercentage: 50 },
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    metadata: {}
  },
  GSI1PK: "ADMIN#admin-456",            // Query by admin
  GSI1SK: "1705334400000",
  TTL: 1713110400                       // Retain 90 days minimum
}
```

### Global Secondary Indexes

**GSI1**: Query by alternate key

- PK: GSI1PK (e.g., "USER#user-id", "TICKETS#status", "ADMIN#admin-id")
- SK: GSI1SK (e.g., timestamp, priority+timestamp)
- Projection: ALL

### Key Generation Utilities

Located in `src/aws/dynamodb/keys.ts`:

```typescript
// Analytics keys
export function getAnalyticsEventKey(
  date: string,
  timestamp: number,
  eventId: string
) {
  return {
    PK: `ANALYTICS#${date}`,
    SK: `EVENT#${timestamp}#${eventId}`,
  };
}

// Support ticket keys
export function getSupportTicketKey(ticketId: string) {
  return {
    PK: `TICKET#${ticketId}`,
    SK: "METADATA",
  };
}

export function getTicketMessageKey(
  ticketId: string,
  timestamp: number,
  messageId: string
) {
  return {
    PK: `TICKET#${ticketId}`,
    SK: `MESSAGE#${timestamp}#${messageId}`,
  };
}

// Feature flag keys
export function getFeatureFlagKey(flagId: string) {
  return {
    PK: "CONFIG#FEATURE_FLAGS",
    SK: `FLAG#${flagId}`,
  };
}

// Audit log keys
export function getAuditLogKey(date: string, timestamp: number, logId: string) {
  return {
    PK: `AUDIT#${date}`,
    SK: `LOG#${timestamp}#${logId}`,
  };
}
```

---

## Service Layer

Services contain business logic and are located in `src/services/admin/`.

### Service Pattern

Each service follows this pattern:

```typescript
// src/services/admin/example-service.ts
import { getRepository } from "@/aws/dynamodb/repository";
import { createAuditLog } from "./audit-log-service";

export class ExampleService {
  private repository = getRepository();

  /**
   * Get items with filtering and pagination
   */
  async getItems(options?: {
    filter?: string;
    limit?: number;
    lastKey?: string;
  }): Promise<{
    items: Item[];
    lastKey?: string;
  }> {
    // Build query
    const params = {
      // DynamoDB query params
    };

    // Execute query
    const result = await this.repository.query(params);

    // Transform and return
    return {
      items: result.Items.map(this.transformItem),
      lastKey: result.LastEvaluatedKey,
    };
  }

  /**
   * Create or update item
   */
  async updateItem(
    itemId: string,
    data: Partial<Item>,
    adminId: string
  ): Promise<void> {
    // Get current item for audit log
    const current = await this.getItem(itemId);

    // Update item
    await this.repository.put({
      // Item data
    });

    // Create audit log
    await createAuditLog({
      adminId,
      actionType: "item_update",
      resourceType: "item",
      resourceId: itemId,
      beforeValue: current,
      afterValue: data,
    });
  }

  /**
   * Transform DynamoDB item to domain model
   */
  private transformItem(item: any): Item {
    return {
      id: item.Data.id,
      // ... other fields
    };
  }
}

// Export singleton instance
export const exampleService = new ExampleService();
```

### Existing Services

### See Also

- [API Reference](./API_REFERENCE.md) - Complete API endpoint documentation
- [User Guide](./USER_GUIDE.md) - User workflows for each service

#### AnalyticsService

**Location**: `src/services/admin/analytics-service.ts`

**Methods**:

- `trackEvent(event: AnalyticsEvent): Promise<void>`
- `getPlatformMetrics(startDate: Date, endDate: Date): Promise<PlatformMetrics>`
- `getFeatureUsage(startDate: Date, endDate: Date): Promise<Record<string, number>>`
- `getUserEngagement(startDate: Date, endDate: Date): Promise<EngagementMetrics>`

**Example**:

```typescript
import { analyticsService } from "@/services/admin/analytics-service";

// Track event
await analyticsService.trackEvent({
  eventId: "evt-123",
  userId: "user-456",
  eventType: "page_view",
  eventData: { page: "/studio/write" },
  timestamp: Date.now(),
  sessionId: "session-789",
  metadata: { userAgent: "...", ipAddress: "..." },
});

// Get metrics
const metrics = await analyticsService.getPlatformMetrics(
  new Date("2024-01-01"),
  new Date("2024-01-31")
);
```

#### UserActivityService

**Location**: `src/services/admin/user-activity-service.ts`

**Methods**:

- `getAllUserActivity(options): Promise<{ users: UserActivity[]; lastKey?: string }>`
- `getUserActivityTimeline(userId, startDate?, endDate?): Promise<UserActivityTimeline>`
- `exportUserActivity(userIds?): Promise<string>`

#### ContentModerationService

**Location**: `src/services/admin/content-moderation-service.ts`

**Methods**:

- `getContentForModeration(options): Promise<{ items: ModerationItem[]; lastKey?: string }>`
- `approveContent(contentId, adminId): Promise<void>`
- `flagContent(contentId, adminId, reason): Promise<void>`
- `hideContent(contentId, adminId, reason): Promise<void>`

#### SupportTicketService

**Location**: `src/services/admin/support-ticket-service.ts`

**Methods**:

- `createTicket(userId, subject, description, category): Promise<SupportTicket>`
- `getTickets(options): Promise<{ tickets: SupportTicket[]; lastKey?: string }>`
- `getTicket(ticketId): Promise<SupportTicket>`
- `addMessage(ticketId, authorId, message): Promise<void>`
- `updateTicketStatus(ticketId, status, adminId, resolutionNote?): Promise<void>`
- `assignTicket(ticketId, adminId): Promise<void>`

#### AuditLogService

**Location**: `src/services/admin/audit-log-service.ts`

**Purpose**: Provides comprehensive audit logging for all administrative actions with immutable entries, IP tracking, and flexible querying capabilities.

**Key Features**:
- Immutable audit log entries (no updates allowed)
- IP address and user agent tracking
- Multiple query patterns (by admin, action type, date range)
- Export functionality (JSON/CSV)
- Helper methods for common action types
- 90-day TTL for compliance

**Methods**:

- `createAuditLog(entry): Promise<AuditLogEntry>` - Creates immutable audit log entry
- `getAuditLog(filter?): Promise<{ entries: AuditLogEntry[]; lastKey?: string }>` - Query logs with filtering
- `exportAuditLog(filter?, format?): Promise<string>` - Export logs as JSON or CSV
- `getAuditLogStats(startDate, endDate): Promise<AuditLogStats>` - Get statistics and metrics

**Helper Methods**:
- `logUserAction()` - Log user management actions (create, update, delete, role changes)
- `logContentAction()` - Log content moderation actions (approve, flag, hide, delete)
- `logConfigAction()` - Log configuration changes (feature flags, settings, integrations)
- `logTicketAction()` - Log support ticket actions (create, update, close, assign)
- `logBillingAction()` - Log billing actions (trial extensions, refunds, cancellations)

**Query Patterns**:
- By admin ID: Uses GSI1 for efficient admin-specific queries
- By action type: Uses GSI2 for action-type filtering
- By date range: Queries primary table with date-based partitioning

**Example**:

```typescript
import { auditLogService } from "@/services/admin/audit-log-service";

// Create audit log entry
await auditLogService.createAuditLog({
  adminId: "admin-123",
  adminEmail: "admin@example.com",
  adminRole: "superadmin",
  actionType: "user_role_change",
  resourceType: "user",
  resourceId: "user-456",
  description: "Changed user role from User to Admin",
  beforeValue: { role: "User" },
  afterValue: { role: "Admin" },
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
});

// Query logs by admin
const adminLogs = await auditLogService.getAuditLog({
  adminId: "admin-123",
  limit: 50,
});

// Export logs as CSV
const csvData = await auditLogService.exportAuditLog(
  { startDate: new Date("2024-01-01"), endDate: new Date("2024-01-31") },
  "csv"
);

// Use helper method for user actions
await auditLogService.logUserAction(
  "admin-123",
  "admin@example.com",
  "superadmin",
  "role_change",
  "user-456",
  "Promoted user to Admin role",
  { role: "User" },
  { role: "Admin" },
  "192.168.1.1",
  "Mozilla/5.0..."
);
```

**Database Schema**:
- Primary Key: `AUDIT#<date>` / `<timestamp>#<auditId>`
- GSI1: Admin queries (`ADMIN#<adminId>` / `<timestamp>#<auditId>`)
- GSI2: Action type queries (`ACTION#<actionType>` / `<timestamp>#<auditId>`)
- TTL: 90 days from creation

---

## Server Actions

Server Actions are the API layer between UI and services. Located in `src/features/admin/actions/admin-actions.ts`.

For complete API endpoint documentation, see [API Reference](./API_REFERENCE.md).

### Server Action Pattern

```typescript
"use server";

import { z } from "zod";
import {
  isAdmin,
  isSuperAdmin,
  getCurrentUser,
} from "@/lib/admin-authorization";
import { exampleService } from "@/services/admin/example-service";

// Input validation schema
const UpdateItemSchema = z.object({
  itemId: z.string().min(1),
  data: z.object({
    name: z.string().min(1).max(100),
    value: z.number().min(0),
  }),
});

/**
 * Update an item
 * @requires Admin or SuperAdmin role
 */
export async function updateItem(
  itemId: string,
  data: { name: string; value: number }
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    // 1. Authorization check
    const admin = await isAdmin();
    if (!admin) {
      return {
        success: false,
        error: "Unauthorized: Admin role required",
      };
    }

    // 2. Input validation
    const validated = UpdateItemSchema.parse({ itemId, data });

    // 3. Get current user for audit
    const user = await getCurrentUser();

    // 4. Call service
    await exampleService.updateItem(
      validated.itemId,
      validated.data,
      user.userId
    );

    // 5. Return success
    return {
      success: true,
      message: "Item updated successfully",
    };
  } catch (error) {
    // 6. Error handling
    console.error("updateItem error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input: " + error.errors[0].message,
      };
    }

    return {
      success: false,
      error: "Failed to update item",
    };
  }
}
```

### Authorization Patterns

```typescript
// Require Admin or SuperAdmin
const admin = await isAdmin();
if (!admin) {
  return { success: false, error: "Unauthorized" };
}

// Require SuperAdmin only
const superAdmin = await isSuperAdmin();
if (!superAdmin) {
  return { success: false, error: "SuperAdmin role required" };
}

// Get current user (full object with id and email)
const user = await getCurrentUserServer();
if (!user) {
  return { success: false, error: "Authentication required" };
}

// Get current user ID only (lightweight)
const userId = await getCurrentUserId();
if (!userId) {
  return { success: false, error: "Authentication required" };
}
```

### Validation Patterns

```typescript
import { z } from "zod";

// Simple validation
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(120),
});

const validated = schema.parse(input);

// With custom error messages
const schema = z.object({
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject must be less than 200 characters"),
  category: z.enum(["bug", "feature_request", "help", "billing", "other"]),
});

// Optional fields
const schema = z.object({
  required: z.string(),
  optional: z.string().optional(),
  withDefault: z.number().default(0),
});
```

---

## UI Components

### Page Structure

Admin pages follow this structure:

```typescript
// src/app/(app)/admin/example/page.tsx
import { Suspense } from "react";
import { ExampleContent } from "./example-content";
import { ExampleSkeleton } from "./example-skeleton";

export default function ExamplePage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Page Title</h1>
        <p className="text-muted-foreground">Page description</p>
      </div>

      <Suspense fallback={<ExampleSkeleton />}>
        <ExampleContent />
      </Suspense>
    </div>
  );
}
```

### Client Component Pattern

```typescript
// src/app/(app)/admin/example/example-content.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getItems, updateItem } from "@/features/admin/actions/admin-actions";

export function ExampleContent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    setLoading(true);
    const result = await getItems();

    if (result.success) {
      setItems(result.data);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }

    setLoading(false);
  }

  async function handleUpdate(itemId: string, data: any) {
    const result = await updateItem(itemId, data);

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      });
      loadItems(); // Refresh
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>
          {/* Item display */}
          <Button
            onClick={() =>
              handleUpdate(item.id, {
                /* data */
              })
            }
          >
            Update
          </Button>
        </div>
      ))}
    </div>
  );
}
```

### Table Component Pattern

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function ItemsTable({ items }: { items: Item[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell>
              <Badge
                variant={item.status === "active" ? "default" : "secondary"}
              >
                {item.status}
              </Badge>
            </TableCell>
            <TableCell>
              {new Date(item.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Button size="sm" variant="ghost">
                Edit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## Authentication & Authorization

### Middleware Protection

Admin routes are protected by middleware:

```typescript
// src/middleware/admin-auth.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, getUserRole } from "@/aws/auth/cognito-client";

export async function adminAuthMiddleware(request: NextRequest) {
  // Get token from cookie
  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  try {
    // Verify token
    const payload = await verifyToken(token);

    // Check role
    const role = getUserRole(payload);

    if (role !== "admin" && role !== "superadmin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Check SuperAdmin-only routes
    if (
      request.nextUrl.pathname.startsWith("/admin/billing") ||
      request.nextUrl.pathname.startsWith("/admin/audit") ||
      request.nextUrl.pathname.startsWith("/admin/config")
    ) {
      if (role !== "superadmin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }
}
```

### Authorization Utilities

```typescript
// src/lib/admin-authorization.ts
import { getCurrentUser as getCognitoUser } from "@/aws/auth/cognito-client";

export async function getCurrentUser() {
  const user = await getCognitoUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user.role === "admin" || user.role === "superadmin";
  } catch {
    return false;
  }
}

export async function isSuperAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return user.role === "superadmin";
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error("Admin role required");
  }
}

export async function requireSuperAdmin() {
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    throw new Error("SuperAdmin role required");
  }
}
```

### Test Page Implementation

The Super Admin Test Page (`/super-admin/test-page`) is a diagnostic tool for debugging authentication and authorization issues:

```typescript
// src/app/(app)/super-admin/test-page.tsx
'use client';

import { useUser } from '@/aws/auth/use-user';
import { useAdmin } from '@/contexts/admin-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SuperAdminTestPage() {
    try {
        const { user, isUserLoading } = useUser();
        const { isSuperAdmin, isAdmin, role, isLoading: adminLoading } = useAdmin();

        // Loading state handling
        if (isUserLoading || adminLoading) {
            return <div className="p-8">Loading...</div>;
        }

        return (
            <div className="p-8 space-y-6">
                {/* User Information Display */}
                <Card>
                    <CardHeader>
                        <CardTitle>User Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>User ID: {user?.id || 'Not loaded'}</div>
                        <div>Email: {user?.email || 'Not loaded'}</div>
                        <div>User Loading: {isUserLoading ? 'Yes' : 'No'}</div>
                    </CardContent>
                </Card>

                {/* Admin Role Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Admin Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>Admin Loading: {adminLoading ? 'Yes' : 'No'}</div>
                        <div>Is Admin: {isAdmin ? 'Yes' : 'No'}</div>
                        <div>Is Super Admin: {isSuperAdmin ? 'Yes' : 'No'}</div>
                        <div>Role: {role || 'Not loaded'}</div>
                    </CardContent>
                </Card>

                {/* Access Status Display */}
                {!isSuperAdmin && (
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="text-red-800">Access Denied</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-red-600">You don't have super admin access.</p>
                        </CardContent>
                    </Card>
                )}

                {isSuperAdmin && (
                    <Card className="border-green-200 bg-green-50">
                        <CardHeader>
                            <CardTitle className="text-green-800">Access Granted</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-green-600">You have super admin access!</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    } catch (error) {
        // Error state handling
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
                <p className="text-red-600">
                    {error instanceof Error ? error.message : 'Unknown error'}
                </p>
            </div>
        );
    }
}
```

**Key Features**:
- **Dual Hook Integration**: Uses both `useUser()` and `useAdmin()` hooks to compare authentication states
- **Loading State Management**: Handles loading states from both authentication sources
- **Visual Status Indicators**: Color-coded cards show access status clearly
- **Error Boundary**: Catches and displays authentication errors gracefully
- **Debugging Information**: Shows all relevant auth/role data for troubleshooting

**Use Cases**:
- Debugging role assignment issues
- Verifying authentication flow
- Testing authorization changes
- Troubleshooting access problems

---

## Error Handling

### Service Layer Errors

```typescript
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

// Usage in service
if (!item) {
  throw new ServiceError("Item not found", "NOT_FOUND", 404);
}
```

### Server Action Error Handling

```typescript
export async function serverAction() {
  try {
    // Action logic
  } catch (error) {
    console.error("serverAction error:", error);

    // Handle specific errors
    if (error instanceof ServiceError) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input: " + error.errors[0].message,
      };
    }

    // Generic error
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
```

### UI Error Handling

```typescript
async function handleAction() {
  try {
    const result = await serverAction();

    if (!result.success) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    // Success handling
    toast({
      title: "Success",
      description: result.message,
    });
  } catch (error) {
    // Network or unexpected errors
    toast({
      title: "Error",
      description: "Something went wrong. Please try again.",
      variant: "destructive",
    });
  }
}
```

---

## Testing

### See Also

- [Testing Guide](./TESTING_GUIDE.md) - Complete testing procedures and commands
- [Testing Guide - Unit Tests](./TESTING_GUIDE.md#1-unit-tests) - Unit testing patterns
- [Testing Guide - Integration Tests](./TESTING_GUIDE.md#2-integration-tests) - Integration testing with fast-check

### Unit Tests

Located in `src/services/admin/__tests__/`

```typescript
// src/services/admin/__tests__/example-service.test.ts
import { exampleService } from "../example-service";
import { getRepository } from "@/aws/dynamodb/repository";

jest.mock("@/aws/dynamodb/repository");

describe("ExampleService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getItems", () => {
    it("should return items with pagination", async () => {
      const mockItems = [
        { PK: "ITEM#1", SK: "METADATA", Data: { id: "1", name: "Item 1" } },
        { PK: "ITEM#2", SK: "METADATA", Data: { id: "2", name: "Item 2" } },
      ];

      (getRepository().query as jest.Mock).mockResolvedValue({
        Items: mockItems,
        LastEvaluatedKey: { PK: "ITEM#2", SK: "METADATA" },
      });

      const result = await exampleService.getItems({ limit: 2 });

      expect(result.items).toHaveLength(2);
      expect(result.items[0].id).toBe("1");
      expect(result.lastKey).toBeDefined();
    });

    it("should handle empty results", async () => {
      (getRepository().query as jest.Mock).mockResolvedValue({
        Items: [],
        LastEvaluatedKey: undefined,
      });

      const result = await exampleService.getItems();

      expect(result.items).toHaveLength(0);
      expect(result.lastKey).toBeUndefined();
    });
  });

  describe("updateItem", () => {
    it("should update item and create audit log", async () => {
      const mockItem = {
        PK: "ITEM#1",
        SK: "METADATA",
        Data: { id: "1", name: "Old Name" },
      };

      (getRepository().get as jest.Mock).mockResolvedValue(mockItem);
      (getRepository().put as jest.Mock).mockResolvedValue({});

      await exampleService.updateItem("1", { name: "New Name" }, "admin-123");

      expect(getRepository().put).toHaveBeenCalledWith(
        expect.objectContaining({
          Data: expect.objectContaining({ name: "New Name" }),
        })
      );
    });
  });
});
```

### Property-Based Tests

Using fast-check for property-based testing:

```typescript
// src/services/admin/__tests__/example-service.pbt.test.ts
import * as fc from "fast-check";
import { exampleService } from "../example-service";

describe("ExampleService Property Tests", () => {
  it("should handle any valid item data", () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }),
          name: fc.string({ minLength: 1, maxLength: 100 }),
          value: fc.integer({ min: 0, max: 1000 }),
        }),
        async (item) => {
          // Property: Creating then retrieving should return same data
          await exampleService.createItem(item);
          const retrieved = await exampleService.getItem(item.id);

          expect(retrieved.name).toBe(item.name);
          expect(retrieved.value).toBe(item.value);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should correctly filter items", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            status: fc.constantFrom("active", "inactive", "pending"),
          })
        ),
        fc.constantFrom("active", "inactive", "pending"),
        async (items, filterStatus) => {
          // Setup: Create all items
          for (const item of items) {
            await exampleService.createItem(item);
          }

          // Property: Filtered results should only include matching status
          const result = await exampleService.getItems({
            status: filterStatus,
          });

          expect(
            result.items.every((item) => item.status === filterStatus)
          ).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});
```

### Integration Tests

```typescript
// src/services/admin/__tests__/integration.test.ts
import { analyticsService } from "../analytics-service";
import { userActivityService } from "../user-activity-service";

describe("Admin Platform Integration Tests", () => {
  it("should track events and reflect in user activity", async () => {
    const userId = "test-user-123";

    // Track multiple events
    await analyticsService.trackEvent({
      eventId: "evt-1",
      userId,
      eventType: "page_view",
      eventData: { page: "/studio/write" },
      timestamp: Date.now(),
      sessionId: "session-1",
      metadata: {},
    });

    await analyticsService.trackEvent({
      eventId: "evt-2",
      userId,
      eventType: "content_create",
      eventData: { type: "blog_post" },
      timestamp: Date.now(),
      sessionId: "session-1",
      metadata: {},
    });

    // Verify user activity reflects events
    const activity = await userActivityService.getUserActivityTimeline(userId);

    expect(activity.events).toHaveLength(2);
    expect(activity.events.some((e) => e.eventType === "page_view")).toBe(true);
    expect(activity.events.some((e) => e.eventType === "content_create")).toBe(
      true
    );
  });
});
```

---

## Deployment

### Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- SAM CLI installed
- Node.js 18+ and npm

### Infrastructure Setup

1. **Deploy DynamoDB Tables**:

```bash
npm run scripts/init-admin-infrastructure.ts
```

2. **Deploy Lambda Functions**:

```bash
sam build
sam deploy --guided
```

3. **Configure Environment Variables**:

```bash
# .env.production
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxx
DYNAMODB_TABLE_NAME=bayon-coagent-main
```

### Deployment Steps

1. **Build Application**:

```bash
npm run build
```

2. **Run Tests**:

```bash
npm test
npm run test:integration
```

3. **Deploy to Amplify**:

```bash
npm run deploy:amplify
```

4. **Verify Deployment**:

```bash
npm run deploy:test https://your-app-url.com
```

### Environment-Specific Configuration

**Development**:

```typescript
// Use LocalStack for local development
export const config = {
  dynamodbEndpoint: "http://localhost:4566",
  region: "us-east-1",
};
```

**Production**:

```typescript
// Use AWS services
export const config = {
  dynamodbEndpoint: undefined, // Use default AWS endpoint
  region: process.env.NEXT_PUBLIC_AWS_REGION,
};
```

### Monitoring Setup

1. **CloudWatch Dashboards**:

```bash
aws cloudwatch put-dashboard --dashboard-name admin-platform \
  --dashboard-body file://cloudwatch-dashboard.json
```

2. **Alarms**:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name admin-high-error-rate \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name ErrorRate \
  --namespace AdminPlatform \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

---

## Extending Features

### Adding a New Admin Feature

1. **Create Service**:

```typescript
// src/services/admin/new-feature-service.ts
export class NewFeatureService {
  async getItems() {
    // Implementation
  }

  async createItem(data: any) {
    // Implementation
  }
}

export const newFeatureService = new NewFeatureService();
```

2. **Create Server Actions**:

```typescript
// src/features/admin/actions/admin-actions.ts
export async function getNewFeatureItems() {
  const admin = await isAdmin();
  if (!admin) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const items = await newFeatureService.getItems();
    return { success: true, data: items };
  } catch (error) {
    return { success: false, error: "Failed to get items" };
  }
}
```

3. **Create UI Page**:

```typescript
// src/app/(app)/admin/new-feature/page.tsx
export default function NewFeaturePage() {
  return (
    <div>
      <h1>New Feature</h1>
      <NewFeatureContent />
    </div>
  );
}
```

4. **Add Navigation**:

```typescript
// src/app/(app)/admin/layout.tsx
const tabs = [
  // ... existing tabs
  { name: "New Feature", href: "/admin/new-feature" },
];
```

5. **Add Tests**:

```typescript
// src/services/admin/__tests__/new-feature-service.test.ts
describe("NewFeatureService", () => {
  it("should get items", async () => {
    // Test implementation
  });
});
```

### Adding a New Database Entity

1. **Define Key Pattern**:

```typescript
// src/aws/dynamodb/keys.ts
export function getNewEntityKey(entityId: string) {
  return {
    PK: `ENTITY#${entityId}`,
    SK: "METADATA",
  };
}
```

2. **Define TypeScript Interface**:

```typescript
// src/types/admin.ts
export interface NewEntity {
  entityId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}
```

3. **Implement CRUD Operations**:

```typescript
// In service
async createEntity(data: Omit<NewEntity, 'entityId' | 'createdAt' | 'updatedAt'>) {
  const entityId = generateId();
  const now = Date.now();

  await this.repository.put({
    ...getNewEntityKey(entityId),
    EntityType: 'NewEntity',
    Data: {
      entityId,
      ...data,
      createdAt: now,
      updatedAt: now
    }
  });

  return entityId;
}
```

### Adding a New Correctness Property

1. **Define Property in Design Doc**:

```markdown
### Property X: Description

_For any_ input, when action occurs, then result should satisfy condition.
**Validates: Requirements X.Y**
```

2. **Implement Property Test**:

```typescript
import * as fc from "fast-check";

it("Property X: Description", () => {
  fc.assert(
    fc.property(
      // Generators
      fc.string(),
      fc.integer(),
      async (input1, input2) => {
        // Test property
        const result = await service.action(input1, input2);
        expect(result).toSatisfy(condition);
      }
    ),
    { numRuns: 100 }
  );
});
```

3. **Tag Test with Property Reference**:

```typescript
/**
 * Feature: admin-platform-management, Property X: Description
 * Validates: Requirements X.Y
 */
it("Property X: Description", () => {
  // Test implementation
});
```

---

## Performance Optimization

### Caching Strategy

```typescript
// src/services/admin/cache-service.ts
export class CacheService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);

    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cacheService = new CacheService();
```

### Query Optimization

```typescript
// Use GSI for efficient queries
async function getTicketsByStatus(status: string) {
  return await repository.query({
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :pk",
    ExpressionAttributeValues: {
      ":pk": `TICKETS#${status}`,
    },
  });
}

// Use pagination for large result sets
async function getAllItems() {
  const items = [];
  let lastKey = undefined;

  do {
    const result = await repository.query({
      // Query params
      ExclusiveStartKey: lastKey,
      Limit: 100,
    });

    items.push(...result.Items);
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return items;
}

// Use batch operations
async function batchGetItems(itemIds: string[]) {
  const keys = itemIds.map((id) => getItemKey(id));

  return await repository.batchGet({
    RequestItems: {
      [tableName]: {
        Keys: keys,
      },
    },
  });
}
```

### Async Operations

```typescript
// Queue long-running operations
export async function exportLargeDataset(userIds: string[]) {
  // Queue job
  const jobId = await queueExportJob({
    userIds,
    requestedBy: currentUser.userId,
    requestedAt: Date.now(),
  });

  // Send email when complete
  await sendEmail({
    to: currentUser.email,
    subject: "Export Ready",
    body: `Your export is ready. Download: ${getDownloadUrl(jobId)}`,
  });

  return { jobId };
}
```

---

## Security Considerations

### Input Validation

Always validate input at multiple layers:

```typescript
// 1. Zod schema validation
const schema = z.object({
  email: z.string().email(),
  amount: z.number().min(0).max(10000),
});

// 2. Business logic validation
if (amount > user.balance) {
  throw new Error("Insufficient balance");
}

// 3. Database constraints
// Use DynamoDB condition expressions
await repository.put(item, {
  ConditionExpression: "attribute_not_exists(PK)",
});
```

### SQL Injection Prevention

DynamoDB is NoSQL, but still sanitize inputs:

```typescript
// Bad: String concatenation
const pk = `USER#${userId}`; // If userId contains #, could break

// Good: Use parameterized values
const params = {
  KeyConditionExpression: "PK = :pk",
  ExpressionAttributeValues: {
    ":pk": `USER#${sanitize(userId)}`,
  },
};
```

### XSS Prevention

Sanitize user-generated content:

```typescript
import DOMPurify from "isomorphic-dompurify";

// Sanitize HTML content
const sanitized = DOMPurify.sanitize(userInput);

// In React, use dangerouslySetInnerHTML carefully
<div dangerouslySetInnerHTML={{ __html: sanitized }} />;
```

### CSRF Protection

Next.js Server Actions have built-in CSRF protection, but verify:

```typescript
// Server Actions automatically include CSRF tokens
// No additional configuration needed
```

### Rate Limiting

Implement rate limiting for sensitive operations:

```typescript
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

async function checkRateLimit(userId: string, limit: number = 100) {
  const now = Date.now();
  const userLimit = rateLimiter.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimiter.set(userId, {
      count: 1,
      resetAt: now + 60000, // 1 minute
    });
    return true;
  }

  if (userLimit.count >= limit) {
    return false;
  }

  userLimit.count++;
  return true;
}
```

---

## Troubleshooting

### Common Issues

**Issue**: DynamoDB throttling errors

**Solution**:

```typescript
// Implement exponential backoff
async function queryWithRetry(params: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await repository.query(params);
    } catch (error) {
      if (error.name === "ProvisionedThroughputExceededException") {
        const delay = Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}
```

**Issue**: Large payload errors

**Solution**:

```typescript
// Paginate large responses
async function getLargeDataset() {
  const chunks = [];
  let lastKey = undefined;

  do {
    const result = await query({ lastKey, limit: 100 });
    chunks.push(result.items);
    lastKey = result.lastKey;
  } while (lastKey);

  return chunks.flat();
}
```

**Issue**: Memory leaks in long-running processes

**Solution**:

```typescript
// Clear caches periodically
setInterval(() => {
  cacheService.clear();
}, 60 * 60 * 1000); // Every hour

// Use WeakMap for object references
const cache = new WeakMap();
```

---

## OAuth Integration & Token Management

### Google Business Profile Integration

The platform integrates with Google Business Profile to allow agents to import reviews and manage their business presence. The OAuth flow has been optimized for proper token expiry handling.

#### Token Exchange Process

When users connect their Google Business Profile:

1. User initiates OAuth flow via "Connect" button
2. User is redirected to Google's consent screen
3. Google redirects back with authorization code
4. `exchangeGoogleTokenAction` exchanges code for tokens
5. Tokens are stored in DynamoDB with proper expiry calculation

#### Token Expiry Calculation

**Critical Implementation Detail**: Google's OAuth response includes `expiresIn` as seconds, but JavaScript timestamps use milliseconds. The token expiry is calculated as:

```typescript
const tokenData = {
  agentProfileId: userId,
  accessToken: result.accessToken,
  refreshToken: result.refreshToken || '',
  expiryDate: Date.now() + (result.expiresIn * 1000), // Convert seconds to milliseconds
};
```

This ensures accurate token expiry tracking and prevents premature token refresh attempts.

#### Token Storage Schema

```typescript
// DynamoDB Key Pattern
PK: "OAUTH#<userId>"
SK: "GOOGLE_BUSINESS"
EntityType: "OAuthToken"

// Token Data Structure
interface OAuthTokenData {
  agentProfileId: string;
  accessToken: string;
  refreshToken: string;
  expiryDate: number; // Unix timestamp in milliseconds
  provider?: string;
}
```

#### Automatic Token Refresh

The system automatically refreshes tokens when:
- Tokens are expired
- Tokens will expire within 5 minutes (buffer time)

```typescript
// Check if refresh is needed
const validTokens = await getValidOAuthTokens(userId, 'GOOGLE_BUSINESS');
if (validTokens) {
  // Use validTokens.accessToken for API calls
}
```

#### Error Handling

OAuth integration includes comprehensive error handling:

- **Token not found**: Returns `null`, user needs to reconnect
- **Refresh failed**: Logs error, returns `null`, user needs to re-authenticate
- **Network errors**: Throws descriptive error messages
- **Invalid refresh token**: User needs to re-authenticate

#### Security Considerations

- Tokens are stored with user-scoped partition keys
- Only authenticated users can access their own tokens
- 5-minute expiry buffer prevents API calls with expired tokens
- Failed refresh attempts are logged for monitoring

### See Also

- [OAuth Implementation Guide](../aws/dynamodb/OAUTH_IMPLEMENTATION.md) - Detailed technical implementation
- [Google Integration Setup](../guides/GOOGLE_INTEGRATION_GUIDE.md) - Setup instructions for developers

---

## See Also

### Internal Documentation

- [User Guide](./USER_GUIDE.md) - User-facing documentation and workflows
- [API Reference](./API_REFERENCE.md) - Complete API endpoint documentation
- [Testing Guide](./TESTING_GUIDE.md) - Testing procedures and best practices
- [README](./README.md) - Documentation overview and navigation

### External Resources

- [Next.js Documentation](https://nextjs.org/docs) - Next.js framework documentation
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html) - AWS DynamoDB optimization
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/) - Authentication and authorization
- [fast-check Documentation](https://fast-check.dev/) - Property-based testing library
- [Zod Documentation](https://zod.dev/) - TypeScript schema validation

---

_Last Updated: December 2024_  
_Version: 1.0_
