# Admin Platform Management - Infrastructure Setup

## Overview

This document describes the core infrastructure and database schema setup for the admin platform management system.

## Completed Components

### 1. Database Schema (DynamoDB)

Extended the existing single-table design with new entity types:

#### Analytics & Metrics

- **AnalyticsEvent**: User activity tracking with 90-day TTL
- **AggregatedMetrics**: Pre-computed daily metrics for fast queries

#### Support System

- **SupportTicket**: User support ticket management
- **TicketMessage**: Support ticket conversation history

#### Platform Configuration

- **FeatureFlag**: Feature toggle and rollout management
- **PlatformSetting**: Platform-wide configuration settings

#### Content & Moderation

- **ContentModeration**: Content moderation queue with status-based GSI

#### Audit & Compliance

- **AdminAuditLog**: Comprehensive admin action logging with 90-day TTL

#### Additional Entities

- **AdminAnnouncement**: Platform announcements
- **ABTestConfig**: A/B test configuration
- **ABTestAssignment**: User A/B test assignments
- **MaintenanceWindow**: Scheduled maintenance windows
- **APIKey**: API key management
- **UserFeedback**: User feedback submissions

### 2. Key Generation Functions

Created key generation functions in `src/aws/dynamodb/keys.ts`:

- `getAnalyticsEventKeys()` - Analytics event keys with user GSI
- `getAggregatedMetricsKeys()` - Daily metrics keys
- `getSupportTicketKeys()` - Support ticket keys with status GSI
- `getTicketMessageKeys()` - Ticket message keys
- `getFeatureFlagKeys()` - Feature flag keys
- `getPlatformSettingKeys()` - Platform setting keys
- `getContentModerationKeys()` - Content moderation keys with status GSI
- `getAdminAuditLogKeys()` - Audit log keys with admin and action type GSIs
- Additional key functions for announcements, A/B tests, maintenance, API keys, and feedback

### 3. Service Layer

Created admin services in `src/services/admin/`:

#### AnalyticsService (`analytics-service.ts`)

- `trackEvent()` - Track user events
- `getPlatformMetrics()` - Get aggregated metrics
- `getFeatureUsage()` - Get feature usage statistics
- `getUserEngagement()` - Get engagement metrics
- `storeAggregatedMetrics()` - Store pre-computed metrics

#### SupportTicketService (`support-ticket-service.ts`)

- `createTicket()` - Create new support ticket
- `getTickets()` - Query tickets with filtering
- `getTicket()` - Get ticket with full message history
- `addMessage()` - Add message to ticket
- `updateTicketStatus()` - Update ticket status
- `assignTicket()` - Assign ticket to admin

#### PlatformConfigService (`platform-config-service.ts`)

- `getFeatureFlags()` - Get all feature flags
- `setFeatureFlag()` - Create or update feature flag
- `isFeatureEnabled()` - Check if feature is enabled for user
- `getSettings()` - Get platform settings
- `updateSetting()` - Update platform setting

### 4. Database Schema Documentation

Created comprehensive documentation in `src/services/admin/README.md`:

- Entity descriptions and attributes
- Primary key patterns
- GSI patterns and access patterns
- TTL configuration
- Background job requirements
- Capacity planning guidelines
- Security considerations

### 5. Initialization Script

Created `scripts/init-admin-infrastructure.ts`:

- Verifies DynamoDB table exists
- Creates default feature flags
- Creates default platform settings
- Initializes analytics configuration
- Can be run for local development or production setup

### 6. Test Suite

Created comprehensive tests in `src/services/admin/__tests__/infrastructure.test.ts`:

- Key generation tests for all entity types
- Key pattern consistency tests
- TTL validation tests
- GSI key validation tests

**Test Results**: ✅ All 14 tests passing

## Access Patterns

### Analytics Events

1. Query all events for a date: `Query by PK (ANALYTICS#<date>)`
2. Query events for a user: `Query GSI1 by USER#<userId>`
3. Query events by type: `FilterExpression on eventType`

### Support Tickets

1. Get ticket by ID: `Get by PK (TICKET#<ticketId>)`
2. Query tickets by status: `Query GSI1 by TICKETS#<status>`
3. Query tickets by priority: `Query GSI1 with SK filter`
4. Query messages for ticket: `Query by PK with MESSAGE# prefix`

### Feature Flags

1. Get all feature flags: `Query by PK (CONFIG#FEATURE_FLAGS)`
2. Get specific flag: `Get by PK + SK`

### Platform Settings

1. Get all settings: `Query by PK (CONFIG#SETTINGS)`
2. Get settings by category: `Query by PK with SETTING#<category># prefix`
3. Get specific setting: `Get by PK + SK`

### Content Moderation

1. Get content by user: `Query by PK (USER#<userId>)`
2. Query moderation queue by status: `Query GSI1 by MODERATION#<status>`

### Admin Audit Logs

1. Query logs by date: `Query by PK (AUDIT#<date>)`
2. Query logs by admin: `Query GSI1 by AUDIT#<adminId>`
3. Query logs by action type: `Query GSI2 by AUDIT#<actionType>`

## Global Secondary Indexes

### GSI1

- **Purpose**: User queries, status queries, admin queries
- **Keys**: GSI1PK (partition), GSI1SK (sort)
- **Projection**: ALL
- **Used by**: AnalyticsEvent, SupportTicket, ContentModeration, AdminAuditLog

### GSI2

- **Purpose**: Action type queries for audit logs
- **Keys**: GSI2PK (partition), GSI2SK (sort)
- **Projection**: ALL
- **Used by**: AdminAuditLog

## TTL Configuration

Automatic deletion after 90 days:

- **AnalyticsEvent**: `TTL = timestamp/1000 + (90 * 24 * 60 * 60)`
- **AdminAuditLog**: `TTL = timestamp/1000 + (90 * 24 * 60 * 60)`

## Default Configuration

### Feature Flags

- `admin-analytics` - Admin Analytics Dashboard (enabled for Admin, SuperAdmin)
- `admin-support-tickets` - Support Ticket System (enabled for Admin, SuperAdmin)
- `admin-content-moderation` - Content Moderation (enabled for Admin, SuperAdmin)
- `admin-system-health` - System Health Monitoring (enabled for SuperAdmin only)
- `admin-billing` - Billing Management (enabled for SuperAdmin only)

### Platform Settings

- `general.platform_name` - "Bayon Coagent"
- `general.maintenance_mode` - false
- `analytics.retention_days` - 90
- `analytics.aggregation_interval` - "hourly"
- `email.admin_alert_email` - "admin@bayoncoagent.com"
- `email.support_email` - "support@bayoncoagent.com"
- `security.session_timeout` - 3600 seconds
- `security.max_login_attempts` - 5

## Usage

### Local Development

1. Start LocalStack:

```bash
npm run localstack:start
```

2. Initialize admin infrastructure:

```bash
tsx scripts/init-admin-infrastructure.ts
```

3. Run tests:

```bash
npm test -- src/services/admin/__tests__/infrastructure.test.ts
```

### Production Deployment

The infrastructure will be automatically created when deploying to AWS. The initialization script can be run as part of the deployment process to set up default configuration.

## Next Steps

1. ✅ Core infrastructure and database schema - **COMPLETED**
2. ⏭️ Implement analytics event tracking system (Task 2)
3. ⏭️ Build analytics dashboard UI (Task 3)
4. ⏭️ Implement user activity tracking service (Task 4)
5. ⏭️ Build content moderation system (Task 5)

## Files Created

### Services

- `src/services/admin/analytics-service.ts`
- `src/services/admin/support-ticket-service.ts`
- `src/services/admin/platform-config-service.ts`
- `src/services/admin/index.ts`

### Documentation

- `src/services/admin/README.md`
- `docs/admin/INFRASTRUCTURE_SETUP.md` (this file)

### Scripts

- `scripts/init-admin-infrastructure.ts`

### Tests

- `src/services/admin/__tests__/infrastructure.test.ts`

### Updated Files

- `src/aws/dynamodb/keys.ts` - Added admin key generation functions
- `src/aws/dynamodb/types.ts` - Added admin entity types

## Security Notes

1. All admin operations require Admin or SuperAdmin role
2. All admin actions are logged with IP address and user agent
3. Sensitive data is automatically deleted after 90 days via TTL
4. API keys are stored as hashed values only
5. User data is encrypted at rest and in transit

## Performance Considerations

1. Analytics events use date-based partitioning to distribute load
2. Aggregated metrics are pre-computed for fast dashboard queries
3. Feature flags should be cached in memory to reduce read load
4. Support tickets use status-based GSI for efficient queue queries
5. Audit logs use multiple GSIs for flexible querying

## Monitoring

The following metrics should be monitored:

1. **Write Capacity**: Analytics events (high volume)
2. **Read Capacity**: Analytics dashboard queries (medium volume)
3. **TTL Deletes**: Verify old data is being deleted
4. **GSI Performance**: Monitor GSI query latency
5. **Storage**: Track table size growth

## Troubleshooting

### Issue: Tests failing

**Solution**: Ensure all dependencies are installed: `npm install`

### Issue: LocalStack not starting

**Solution**: Check Docker is running: `docker ps`

### Issue: Table not found

**Solution**: Run main initialization: `npm run localstack:init`

### Issue: Permission denied on script

**Solution**: Make script executable: `chmod +x scripts/init-admin-infrastructure.ts`
