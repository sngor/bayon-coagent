# MLS Status Sync - Quick Start Guide

## Overview

The MLS Status Sync feature automatically keeps your listings in sync with your MLS system and handles automatic post unpublishing when listings are sold.

## Key Features

✅ **Automatic Status Detection** - Polls MLS every 15 minutes for status changes  
✅ **Auto-Unpublish Sold Listings** - Removes social media posts when listings sell  
✅ **Status Restoration** - Handles pending → active transitions  
✅ **Conflict Resolution** - MLS data is always the source of truth  
✅ **Error Handling** - Continues syncing even if individual listings fail

## Quick Start

### 1. Server Actions (For UI Integration)

```typescript
import {
  syncMLSStatus,
  syncAllMLSConnections,
  syncListingStatus,
} from "@/app/mls-status-sync-actions";

// Sync all listings for a specific MLS connection
const result = await syncMLSStatus(connectionId);

// Sync all MLS connections for current user
const result = await syncAllMLSConnections();

// Manually sync a single listing
const result = await syncListingStatus(listingId);
```

### 2. API Route (For Cron Jobs)

```bash
# Set up cron secret
export CRON_SECRET="your-secret-key"

# Call the API endpoint
curl -X POST https://your-domain.com/api/cron/sync-mls-status \
  -H "Authorization: Bearer your-secret-key"
```

### 3. Scheduled Job Setup

#### Option A: Vercel Cron (Easiest)

Add to `vercel.json`:

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

#### Option B: AWS EventBridge + Lambda

1. Create Lambda function
2. Set up EventBridge rule: `rate(15 minutes)`
3. Configure IAM permissions

#### Option C: External Cron Service

Use services like:

- Cron-job.org
- EasyCron
- AWS EventBridge

## How It Works

### Status Sync Flow

```
1. Scheduled job triggers every 15 minutes
2. For each MLS connection:
   a. Fetch all user's listings
   b. Query MLS API for current status
   c. Compare with stored status
3. For each status change:
   a. Update listing in DynamoDB
   b. If sold → unpublish all social posts
   c. If pending → active → log restoration
4. Return sync results
```

### Status Transitions

| Old Status | New Status | Action                          |
| ---------- | ---------- | ------------------------------- |
| active     | sold       | Update status + Unpublish posts |
| active     | pending    | Update status only              |
| pending    | active     | Update status + Log restoration |
| pending    | sold       | Update status + Unpublish posts |
| sold       | active     | Update status (relisting)       |

### Post Unpublishing

When a listing is marked as sold:

1. Query all posts for the listing
2. For each published post:
   - Get OAuth connection for platform
   - Call platform API to delete post
   - Update post status to "unpublished"
3. Return count of unpublished posts

## Response Format

```typescript
{
  success: boolean;
  message: string;
  data: {
    totalListings: number;
    updatedListings: number;
    unpublishedPosts: number;
    restoredListings: number;
    errors: Array<{
      listingId: string;
      mlsNumber: string;
      error: string;
    }>;
    statusChanges: Array<{
      listingId: string;
      mlsNumber: string;
      oldStatus: ListingStatus;
      newStatus: ListingStatus;
    }>;
  }
}
```

## Error Handling

### Common Errors

**MLS Token Expired**

```
Error: "MLS connection expired. Please re-authenticate."
Solution: User must reconnect MLS in Settings
```

**OAuth Connection Missing**

```
Warning: "No facebook connection found for unpublishing post"
Solution: Post remains published, user can manually delete
```

**Network Timeout**

```
Error: "Network error: Request timeout"
Solution: Sync continues with remaining listings
```

### Error Recovery

- Individual listing failures don't stop the sync
- Errors are logged and returned in response
- Next sync attempt will retry failed listings

## Testing

### Manual Sync Test

```typescript
// In your component or API route
import { syncListingStatus } from "@/app/mls-status-sync-actions";

const result = await syncListingStatus("listing-123");
console.log(result);
```

### Unit Tests

```bash
npm test -- src/app/__tests__/mls-status-sync-actions.test.ts
```

### Integration Test

1. Create test listing with status "active"
2. Publish to social media
3. Change status in MLS to "sold"
4. Trigger manual sync
5. Verify:
   - Listing status = "sold"
   - Social posts deleted
   - Post status = "unpublished"

## Monitoring

### Key Metrics

- **Sync Duration**: Should be < 5 minutes
- **Error Rate**: Should be < 10%
- **Status Changes**: Track per sync job
- **Posts Unpublished**: Track per sync job

### CloudWatch Logs

All sync operations log to CloudWatch:

```
Starting MLS status sync job...
Syncing status for 25 listings...
Listing MLS-001 marked as sold, unpublished 3 posts
Status sync complete: 2 updated, 3 posts unpublished, 0 restored
```

### Alerts

Set up alerts for:

- Sync job failures
- High error rate
- Long sync duration

## Security

### API Protection

- Cron endpoint protected by `CRON_SECRET`
- Only authorized services can trigger sync
- Set in environment variables

### Token Security

- MLS tokens stored encrypted
- OAuth tokens refreshed automatically
- Failed refresh requires re-authentication

## Performance

### Optimization Tips

1. **Batch Processing**: Process 50 listings at a time
2. **Parallel Queries**: Use Promise.all for status checks
3. **Rate Limiting**: Respect MLS API limits
4. **Caching**: Cache connections during sync

### Expected Performance

- 100 listings: ~30 seconds
- 500 listings: ~2 minutes
- 1000 listings: ~4 minutes

## Troubleshooting

### Sync Not Running

1. Check cron job configuration
2. Verify `CRON_SECRET` is set
3. Check CloudWatch logs

### Status Not Updating

1. Verify MLS connection is active
2. Check MLS API credentials
3. Verify listing exists in MLS

### Posts Not Unpublishing

1. Check OAuth connections are active
2. Verify platform API credentials
3. Check post IDs are valid

## API Reference

### syncMLSStatus(connectionId)

Sync status for a specific MLS connection.

**Parameters:**

- `connectionId` (string): MLS connection ID

**Returns:** `SyncActionResponse<SyncResult>`

### syncAllMLSConnections()

Sync all MLS connections for the current user.

**Returns:** `SyncActionResponse<AggregatedResults>`

### syncListingStatus(listingId)

Manually sync a single listing.

**Parameters:**

- `listingId` (string): Listing ID

**Returns:** `SyncActionResponse<SingleListingResult>`

## Best Practices

1. **Set Up Monitoring**: Track sync metrics and errors
2. **Test Thoroughly**: Test with real MLS data before production
3. **Handle Errors Gracefully**: Don't fail entire sync for one error
4. **Log Everything**: Comprehensive logging for debugging
5. **Secure Endpoints**: Always use CRON_SECRET in production

## Support

For issues or questions:

1. Check CloudWatch logs
2. Review error messages in sync response
3. Test with manual sync first
4. Verify MLS and OAuth connections

## Related Documentation

- [MLS Integration](./MLS_IMPORT_IMPLEMENTATION.md)
- [Social Publishing](./SOCIAL_PUBLISHING_WORKFLOW_IMPLEMENTATION.md)
- [OAuth Setup](./SOCIAL_OAUTH_IMPLEMENTATION.md)
