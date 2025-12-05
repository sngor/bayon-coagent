# Task 4: User Activity Tracking Service - Implementation Summary

## Overview

Successfully implemented a comprehensive user activity tracking service for the admin platform management system. This feature enables admins to monitor user engagement, track feature usage, and identify activity patterns across the platform.

## Completed Components

### 1. Database Schema Extensions

**File:** `src/aws/dynamodb/keys.ts`

Added key generation functions for user activity data:

- `getUserActivitySummaryKeys()` - Generates keys for user activity summaries with GSI support for activity level filtering
- `getUserActivityIndexKeys()` - Generates keys for efficient scanning of all user activities

**Key Patterns:**

```
PK: USER_ACTIVITY#<userId>, SK: SUMMARY
GSI1: PK: ACTIVITY_LEVEL#<level>, SK: <lastLogin>

PK: USER_ACTIVITY_INDEX, SK: <userId>
```

### 2. User Activity Service

**File:** `src/services/admin/user-activity-service.ts`

Implemented `UserActivityService` class with the following methods:

#### Core Methods:

- `getAllUserActivity()` - Retrieves activity summaries for all users with filtering and sorting
  - Supports filtering by activity level (active/inactive/dormant)
  - Supports sorting by lastLogin, totalSessions, or contentCreated
  - Implements pagination with limit and lastKey
- `getUserActivityTimeline()` - Gets detailed activity timeline for a specific user

  - Queries analytics events from GSI1
  - Filters by date range if provided
  - Formats events into human-readable descriptions

- `exportUserActivity()` - Exports user activity data as CSV
  - Supports exporting specific users or all users
  - Generates CSV with comprehensive metrics

#### Helper Methods:

- `categorizeActivityLevel()` - Determines activity level based on last login

  - Active: logged in within 7 days
  - Inactive: 7-30 days since login
  - Dormant: over 30 days since login

- `updateUserActivitySummary()` - Updates or creates user activity summary

  - Stores in both main activity table and index for efficient querying
  - Automatically categorizes activity level

- `calculateUserActivityFromEvents()` - Calculates activity summary from analytics events
  - Aggregates sessions, content creation, feature usage, and AI metrics
  - Designed to be called by background aggregation jobs

### 3. Server Actions

**File:** `src/features/admin/actions/admin-actions.ts`

Added three server actions for user activity:

- `getAllUserActivity()` - Fetches all user activity with filtering and sorting
- `getUserActivityTimeline()` - Fetches detailed timeline for a specific user
- `exportUserActivityData()` - Exports user activity as CSV

All actions include:

- Authentication checks
- Admin role verification
- Error handling with descriptive messages

### 4. User Activity Page

**File:** `src/app/(app)/admin/users/activity/page.tsx`

Created a comprehensive admin UI for user activity monitoring:

#### Features:

- **Stats Dashboard** - Four metric cards showing:

  - Active users count
  - Inactive users count
  - Dormant users count
  - Total AI requests across all users

- **User Activity Table** - Sortable table displaying:

  - User name and email
  - Activity level badge (color-coded)
  - Last login timestamp
  - Total sessions
  - Content created count
  - AI requests count
  - AI cost

- **Filters and Search**:

  - Search by name or email
  - Filter by activity level (all/active/inactive/dormant)
  - Sort by last login, total sessions, or content created
  - Export to CSV button

- **User Detail Sheet** - Sliding panel showing:
  - User information (email, activity level, signup date, last login)
  - Activity statistics (sessions, content, AI usage)
  - Feature usage breakdown
  - Activity timeline (last 50 events with icons and descriptions)

#### UI Components Used:

- Card, CardContent, CardHeader, CardTitle
- Table, TableBody, TableCell, TableHead, TableHeader, TableRow
- Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle
- Select, SelectContent, SelectItem, SelectTrigger, SelectValue
- Input, Badge, Button
- Lucide icons for visual indicators

## Data Flow

1. **Analytics Events** → Stored in DynamoDB with analytics event keys
2. **Background Job** → Aggregates events into user activity summaries
3. **User Activity Service** → Queries summaries with filtering/sorting
4. **Server Actions** → Provides authenticated access to service methods
5. **Admin UI** → Displays activity data with interactive filters and details

## Activity Level Categorization

The system automatically categorizes users based on their last login:

- **Active** (Green): Logged in within 7 days
- **Inactive** (Yellow): 7-30 days since last login
- **Dormant** (Red): Over 30 days since last login

## Key Features

### Filtering

- Filter by activity level using GSI1 for efficient queries
- Search by user name or email (client-side filtering)

### Sorting

- Sort by last login (most recent first)
- Sort by total sessions (highest first)
- Sort by content created (most productive first)

### Export

- Export all user activity or selected users to CSV
- Includes all metrics: sessions, content, AI usage, costs
- Formatted with headers and proper CSV escaping

### Timeline

- Shows last 50 events for selected user
- Color-coded icons by event type
- Human-readable descriptions
- Timestamp for each event

## Requirements Validated

This implementation satisfies the following requirements from the design document:

- **Requirement 2.1**: Display sortable table with last login, sessions, and feature usage ✓
- **Requirement 2.2**: Categorize users as active/inactive/dormant ✓
- **Requirement 2.3**: Display detailed activity timeline ✓
- **Requirement 2.4**: Display AI usage statistics (requests, tokens, cost) ✓
- **Requirement 2.5**: Export user activity data to CSV ✓

## Testing Considerations

### Unit Tests (Optional - Task 4.4)

- Test activity level categorization logic
- Test sorting functionality
- Test CSV export format
- Test timeline event formatting

### Property-Based Tests (Optional - Task 4.2)

- **Property 6**: Activity level categorization is correct for any last login date
- **Property 5**: User activity displays required fields for any set of users
- **Property 7**: User activity timeline displays all actions for any user

## Future Enhancements

1. **Real-time Updates**: Add WebSocket support for live activity monitoring
2. **Advanced Filters**: Add date range filters, team filters, role filters
3. **Activity Heatmap**: Visualize user activity patterns over time
4. **Engagement Scoring**: Calculate engagement scores based on multiple factors
5. **Automated Alerts**: Notify admins when users become dormant
6. **Bulk Actions**: Enable bulk operations on selected users
7. **Activity Comparison**: Compare activity between users or time periods

## Notes

- The service is designed to work with aggregated data for performance
- Background jobs should periodically call `calculateUserActivityFromEvents()` to update summaries
- The timeline query uses GSI1 on analytics events for efficient user-specific queries
- CSV export is limited to 1000 users by default to prevent memory issues
- Activity summaries are stored in two locations (main table + index) for flexible querying

## Files Modified/Created

### Created:

1. `src/services/admin/user-activity-service.ts` - Core service implementation
2. `src/app/(app)/admin/users/activity/page.tsx` - Admin UI page
3. `docs/admin/TASK_4_USER_ACTIVITY_SUMMARY.md` - This documentation

### Modified:

1. `src/aws/dynamodb/keys.ts` - Added user activity key functions
2. `src/features/admin/actions/admin-actions.ts` - Added server actions

## Completion Status

✅ Task 4.1: Create user activity service - COMPLETED
⏭️ Task 4.2: Write property test for activity categorization - SKIPPED (Optional)
✅ Task 4.3: Create user activity pages - COMPLETED
⏭️ Task 4.4: Write property test for activity display - SKIPPED (Optional)

**Overall Task 4 Status: COMPLETED**

All core functionality has been implemented and is ready for use. Optional property-based tests can be added later if needed.
