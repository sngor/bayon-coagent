# MLS Status Sync Implementation

## Overview

The MLS Status Sync mechanism automatically synchronizes listing status changes from MLS systems to Bayon Coagent and handles automatic post unpublishing when listings are sold.

## Requirements Coverage

- **5.1**: Detect status changes within 15 minutes (polling interval)
- **5.2**: Update listing record when status changes to pending or sold
- **5.3**: Automatically unpublish social media posts when status changes to sold
- **5.4**: Restore listing when status changes from pending to active
- **5.5**: Prioritize MLS data as source of truth in conflicts

## Architecture

### Components

1. **MLS Connector** (`src/integrations/mls/connector.ts`)

   - `syncStatus()` method fetches current status from MLS API
   - Returns array of status updates with current MLS status

2. **Status Sync Actions** (`src/app/mls-status-sync-actions.ts`)

   - `syncMLSStatus()` - Sync status for a specific MLS connection
   - `syncAllMLSConnections()` - Sync all connections for a user
   - `syncListingStatus()` - Manually sync a single listing
   - `unpublishListingPosts()` - Unpublish all posts for a listing

3. **Cron API Route** (`src/app/api/cron/sync-mls-status/route.ts`)

   - Protected endpoint for scheduled sync jobs
   - Can be called by external cron services

4. **Scheduled Job Script** (`scripts/sync-mls-status.ts`)
   - Template for implementing scheduled sync
   - Documentation for production deployment options

## Status Sync Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Scheduled Job (Every 15 min)              │
│                                                              │
│  1. EventBridge/Cron triggers API route                     │
│  2. API route calls syncAllMLSConnections()                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    For Each MLS Connection                   │
│                                                              │
│  1. Get all listings for user                                │
│  2. Call MLS API to fetch current status                     │
│  3. Compare with stored status                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    For Each Status Change                    │
│                                                              │
│  1. Update listing status in DynamoDB                        │
│  2. If status = "sold":                                      │
│     - Query all published posts for listing                  │
│     - Unpublish from Facebook/Instagram/LinkedIn             │
│     - Update post status to "unpublished"                    │
│  3. If status changed from "pending" to "active":            │
│     - Log restoration event                                  │
└─────────────────────────────────────────────────────────────┘
```

## Conflict Resolution

**Requirement 5.5**: MLS data is always the source of truth

When a conflict is detected between local status and MLS status:

1. Local status is **always** updated to match MLS status
2. No user confirmation is required
3. Change is logged for audit purposes

Example:

- Local status: `active`
- MLS status: `sold`
- Result: Local status updated to `sold`, posts unpublished

## Post Unpublishing

When a listing status changes to `sold`:

1. Query all posts for the listing using GSI1 (LISTING#<listingId>)
2. For each post with status = "published":
   - Get OAuth connection for the platform
   - Call platform API to delete the post
   - Update post status to "unpublished" in DynamoDB
3. Return count of unpublished posts

### Platform-Specific Unpublishing

**Facebook:**

```
DELETE /{post-id}?access_token={token}
```

**Instagram:**

```
DELETE /{media-id}?access_token={token}
```

**LinkedIn:**

```
DELETE /ugcPosts/{post-id}
Headers: Authorization: Bearer {token}
```

## Status Restoration

**Requirement 5.4**: Restore listing when status changes from pending to active

When status changes from `pending` to `active`:

1. Update listing status to `active`
2. Log restoration event
3. Listing becomes available for publishing again

Note: Posts are NOT automatically re-published. User must manually publish again.

## Deployment Options

### Option 1: AWS Lambda + EventBridge (Recommended)

**Pros:**

- Serverless, scales automatically
- Native AWS integration
- Cost-effective for periodic jobs

**Setup:**

1. Create Lambda function that calls the sync logic
2. Set up EventBridge rule: `rate(15 minutes)`
3. Configure Lambda with DynamoDB and Cognito permissions

**Example Lambda Handler:**

```typescript
import { syncAllMLSConnections } from "./mls-status-sync-actions";

export async function handler(event: any) {
  // Iterate through all users with MLS connections
  // Call syncAllMLSConnections() for each user
  return { statusCode: 200, body: "Sync completed" };
}
```

### Option 2: Vercel Cron + API Route

**Pros:**

- Simple setup for Vercel deployments
- No additional infrastructure

**Setup:**

1. Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-mls-status",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

2. Set `CRON_SECRET` environment variable
3. Deploy to Vercel

### Option 3: AWS ECS Scheduled Task

**Pros:**

- Full control over execution environment
- Can run longer-duration jobs

**Setup:**

1. Create ECS task definition
2. Set up EventBridge rule to trigger task
3. Configure task with appropriate IAM role

## Manual Sync

Users can manually trigger sync for a specific listing:

```typescript
import { syncListingStatus } from "@/app/mls-status-sync-actions";

const result = await syncListingStatus(listingId);
```

This is useful for:

- Testing status sync
- Immediate sync after known status change
- Troubleshooting sync issues

## Error Handling

### Authentication Errors

- If MLS token is expired, sync fails with clear error message
- User must re-authenticate in Settings

### Network Errors

- Individual listing failures don't stop the entire sync
- Errors are logged and included in sync result
- Sync continues with remaining listings

### Post Unpublishing Errors

- If unpublishing fails for one platform, others still proceed
- Failed unpublish attempts are logged
- Post status remains "published" if unpublish fails

## Monitoring

### Metrics to Track

- Total listings synced per job
- Number of status changes detected
- Number of posts unpublished
- Sync duration
- Error rate

### Logging

All sync operations log to CloudWatch:

- Sync start/end timestamps
- Status changes detected
- Posts unpublished
- Errors encountered

### Alerts

Set up CloudWatch alarms for:

- Sync job failures
- High error rate (>10%)
- Long sync duration (>5 minutes)

## Testing

### Unit Tests

Test individual functions:

- `syncSingleListing()` with different status transitions
- `unpublishListingPosts()` with various post states
- Conflict resolution logic

### Integration Tests

Test complete sync flow:

- Mock MLS API responses
- Verify database updates
- Verify post unpublishing

### Manual Testing

1. Create test listing with status "active"
2. Publish to social media
3. Change status in MLS to "sold"
4. Trigger manual sync
5. Verify:
   - Listing status updated to "sold"
   - Social media posts deleted
   - Post status updated to "unpublished"

## Security Considerations

### API Route Protection

- Cron endpoint protected by `CRON_SECRET`
- Only authorized cron services can trigger sync

### OAuth Token Security

- Tokens stored encrypted in DynamoDB
- Tokens refreshed automatically when expired
- Failed token refresh requires user re-authentication

### Rate Limiting

- Respect MLS API rate limits
- Implement exponential backoff for retries
- Batch requests when possible

## Performance Optimization

### Batch Processing

- Process listings in batches of 50
- Parallel processing of status checks (with rate limiting)

### Caching

- Cache MLS connection tokens
- Cache OAuth connections during sync job

### Query Optimization

- Use GSI for efficient post lookups by listing
- Limit query results to active posts only

## Future Enhancements

1. **Smart Sync Intervals**

   - Sync more frequently for recently updated listings
   - Reduce frequency for stable listings

2. **Webhook Support**

   - Replace polling with webhooks when MLS supports it
   - Instant status updates instead of 15-minute delay

3. **Notification System**

   - Notify users when listings are marked as sold
   - Alert users when posts are unpublished

4. **Sync History**

   - Store sync history for audit trail
   - Display sync status in UI

5. **Selective Sync**
   - Allow users to exclude specific listings from sync
   - Pause sync for specific connections

## Troubleshooting

### Sync Not Running

- Check cron job configuration
- Verify `CRON_SECRET` is set
- Check CloudWatch logs for errors

### Status Not Updating

- Verify MLS connection is active
- Check MLS API credentials
- Verify listing exists in MLS

### Posts Not Unpublishing

- Check OAuth connections are active
- Verify platform API credentials
- Check post IDs are valid

### High Error Rate

- Check MLS API status
- Verify network connectivity
- Review error logs for patterns
