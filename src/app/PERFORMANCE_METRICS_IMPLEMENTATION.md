# Performance Metrics Implementation

## Overview

The Performance Metrics system tracks listing engagement across social media platforms, providing insights into views, shares, and inquiries. This implementation fulfills Requirements 4.1-4.5 from the MLS Social Integration specification.

## Architecture

### Components

1. **Types** (`src/lib/performance-metrics-types.ts`)

   - `PerformanceMetrics`: Daily metrics for a listing
   - `PlatformMetrics`: Platform-specific metrics
   - `AggregatedMetrics`: Aggregated metrics over time periods
   - `MetricEvent`: Individual metric event data

2. **Utilities** (`src/lib/performance-metrics.ts`)

   - Date formatting and manipulation
   - Metrics aggregation
   - Metric increment logic

3. **Server Actions** (`src/app/performance-metrics-actions.ts`)

   - `recordViewEvent()`: Records a view event
   - `recordShareEvent()`: Records a share event
   - `recordInquiryEvent()`: Records an inquiry event
   - `getAggregatedMetrics()`: Gets aggregated metrics for a time period
   - `getAllListingsMetrics()`: Gets metrics for all listings
   - `getMetricsForDateRange()`: Gets metrics for a custom date range

4. **UI Component** (`src/components/listing-metrics-display.tsx`)

   - Displays metrics with time period selection
   - Shows overall metrics and platform breakdown
   - Includes daily breakdown for weekly/monthly views

5. **DynamoDB Repository** (already implemented in `src/aws/dynamodb/repository.ts`)
   - `savePerformanceMetrics()`: Creates/updates metrics
   - `getPerformanceMetrics()`: Gets metrics for a specific date
   - `queryPerformanceMetrics()`: Queries metrics across dates

## Data Model

### DynamoDB Schema

```
PK: USER#<userId>
SK: METRICS#<listingId>#<date>

Attributes:
- listingId: string
- date: string (YYYY-MM-DD)
- views: number
- shares: number
- inquiries: number
- platforms: {
    facebook?: {
      views: number
      shares: number
      inquiries: number
      lastUpdated: number
    }
    instagram?: { ... }
    linkedin?: { ... }
  }
- updatedAt: number
```

### Key Pattern

The sort key pattern `METRICS#<listingId>#<date>` allows efficient querying:

- Query all metrics for a listing: `METRICS#listing-123#`
- Query metrics for a specific date: `METRICS#listing-123#2024-01-15`

## Usage

### Recording Events

```typescript
import {
  recordViewEvent,
  recordShareEvent,
  recordInquiryEvent,
} from "@/app/performance-metrics-actions";

// Record a view
await recordViewEvent(userId, listingId, "facebook", "social-media");

// Record a share
await recordShareEvent(userId, listingId, "instagram");

// Record an inquiry
await recordInquiryEvent(userId, listingId, "linkedin", {
  name: "John Doe",
  email: "john@example.com",
});
```

### Retrieving Metrics

```typescript
import { getAggregatedMetrics } from "@/app/performance-metrics-actions";

// Get weekly metrics
const result = await getAggregatedMetrics(userId, listingId, "weekly");

if (result.metrics) {
  console.log(`Total Views: ${result.metrics.totalViews}`);
  console.log(`Total Shares: ${result.metrics.totalShares}`);
  console.log(`Total Inquiries: ${result.metrics.totalInquiries}`);
}
```

### Displaying Metrics in UI

```tsx
import { ListingMetricsDisplay } from "@/components/listing-metrics-display";

<ListingMetricsDisplay userId={userId} listingId={listingId} />;
```

## Time Periods

The system supports three time periods:

- **Daily**: Current day only
- **Weekly**: Last 7 days (including today)
- **Monthly**: Last 30 days (including today)

## Platform Support

Metrics can be tracked for three platforms:

- **Facebook**: Views, shares, inquiries
- **Instagram**: Views, shares, inquiries
- **LinkedIn**: Views, shares, inquiries

Platform-specific metrics are optional. If no platform is specified, only the total metrics are incremented.

## Aggregation

Metrics are aggregated across multiple days:

1. **Total Metrics**: Sum of all views, shares, and inquiries
2. **Platform Breakdown**: Sum by platform
3. **Daily Breakdown**: Individual day metrics (for weekly/monthly views)

## Requirements Validation

### ✅ Requirement 4.1: View Event Recording

- `recordViewEvent()` records view events with timestamp and source
- Platform-specific tracking supported
- Stored in DynamoDB with date partitioning

### ✅ Requirement 4.2: Share Count Increment

- `recordShareEvent()` increments share count
- Platform is recorded for each share
- Atomic increment operations

### ✅ Requirement 4.3: Inquiry Association

- `recordInquiryEvent()` associates inquiries with listings
- Platform tracking included
- Additional inquiry data can be stored

### ✅ Requirement 4.4: Metrics Retrieval Completeness

- `getAggregatedMetrics()` returns all metric types
- Platform breakdown included
- Daily breakdown available

### ✅ Requirement 4.5: Metrics Time Aggregation

- Daily, weekly, and monthly aggregation supported
- Custom date ranges supported via `getMetricsForDateRange()`
- Efficient querying using DynamoDB key patterns

## Testing

Unit tests are provided in `src/lib/__tests__/performance-metrics.test.ts`:

```bash
npm test -- src/lib/__tests__/performance-metrics.test.ts
```

Tests cover:

- Date formatting and manipulation
- Metric increment logic
- Aggregation across multiple days
- Platform-specific tracking
- Edge cases (empty data, month boundaries, etc.)

## Integration Points

### Library Hub

The metrics display component should be integrated into the listing detail view in the Library hub:

```tsx
// In src/app/(app)/library/listings/[listingId]/page.tsx
import { ListingMetricsDisplay } from "@/components/listing-metrics-display";

<ListingMetricsDisplay userId={user.id} listingId={listingId} />;
```

### Social Publishing

When posts are published, view events can be automatically recorded:

```typescript
// After successful post
await recordViewEvent(userId, listingId, platform, "social-post");
```

### External Tracking

For tracking views from external sources (e.g., website, email campaigns):

```typescript
// API endpoint or webhook
await recordViewEvent(userId, listingId, undefined, "website");
```

## Performance Considerations

1. **Write Efficiency**: Each event creates/updates a single DynamoDB item
2. **Read Efficiency**: Date-based partitioning allows efficient range queries
3. **Aggregation**: Aggregation is done in-memory after fetching daily metrics
4. **Caching**: Consider caching aggregated metrics for frequently accessed listings

## Future Enhancements

1. **Real-time Updates**: WebSocket support for live metric updates
2. **Advanced Analytics**: Conversion rates, engagement trends, peak times
3. **Comparative Analysis**: Compare listings, time periods, platforms
4. **Export**: CSV/PDF export of metrics data
5. **Alerts**: Notifications for metric thresholds (e.g., high engagement)
6. **Heatmaps**: Visual representation of engagement over time
7. **Attribution**: Track inquiry sources and conversion paths

## Error Handling

All server actions return a consistent response format:

```typescript
{
  success: boolean;
  error?: string;
  // ... additional data
}
```

Errors are logged to console and returned to the caller for appropriate handling.

## Security

- All operations require `userId` for data isolation
- Server actions enforce user authentication
- DynamoDB access controlled via IAM policies
- No sensitive data stored in metrics (only counts and timestamps)

## Monitoring

Monitor these metrics in CloudWatch:

- Event recording success/failure rates
- Query performance and latency
- DynamoDB read/write capacity usage
- Error rates by operation type

## Example Scenarios

See `src/app/performance-metrics-example.ts` for complete usage examples including:

- Recording individual events
- Retrieving metrics for different time periods
- Getting metrics for all listings
- Tracking complete user journeys
