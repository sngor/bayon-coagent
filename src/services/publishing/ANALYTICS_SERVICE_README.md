# Content Analytics Service

## Overview

The Content Analytics Service provides comprehensive analytics tracking and aggregation for content workflow features. It implements Requirements 5.1, 5.2, and 5.4 from the content workflow features specification.

## Location

- **Primary Implementation**: `src/services/analytics/analytics-service.ts`
- **Content Workflow Export**: `src/services/publishing/content-analytics-service.ts`

The service is implemented in the core analytics module and re-exported through the content workflow publishing directory for organizational consistency with other content workflow services (scheduling, template, enhanced-publishing).

## Core Functionality

### 1. Track Publication (Requirement 5.1)

Tracks content publication with comprehensive metadata capture.

```typescript
import { trackPublication } from "@/services/publishing/content-analytics-service";

const result = await trackPublication({
  userId: "user-123",
  contentId: "content-456",
  contentType: ContentCategory.BLOG_POST,
  channel: PublishChannelType.FACEBOOK,
  publishedAt: new Date(),
  initialMetrics: {
    views: 0,
    likes: 0,
    shares: 0,
    comments: 0,
    clicks: 0,
  },
  platformPostId: "fb-post-789",
  publishedUrl: "https://facebook.com/posts/789",
  metadata: {
    title: "My Blog Post",
    tags: ["real-estate", "market-update"],
    aiModel: "claude-3-5-sonnet",
  },
});
```

**Features:**

- Comprehensive metadata capture
- Initial metrics tracking
- Platform post ID and URL storage
- GSI indexing for efficient queries
- Enhanced error handling with retry logic
- Fallback to local storage on failure

### 2. Get Content Analytics (Requirement 5.2)

Retrieves analytics with real-time metric aggregation.

```typescript
import { getContentAnalytics } from "@/services/publishing/content-analytics-service";

const result = await getContentAnalytics({
  userId: "user-123",
  contentId: "content-456",
  includeChannelBreakdown: true,
  includeTrendData: true,
});

// Result includes:
// - Analytics for all channels
// - Engagement rate calculations
// - Trend data over time
// - Channel-specific breakdowns
```

**Features:**

- Multi-channel aggregation
- Engagement rate calculation
- Trend data enrichment
- Channel breakdown analysis
- Industry benchmark comparison

### 3. Get Analytics by Type (Requirement 5.2, 5.4)

Retrieves analytics grouped by content type with advanced filtering.

```typescript
import { getAnalyticsByType } from "@/services/publishing/content-analytics-service";

const result = await getAnalyticsByType({
  userId: "user-123",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-01-31"),
  contentTypes: [ContentCategory.BLOG_POST, ContentCategory.SOCIAL_MEDIA],
  channels: [PublishChannelType.FACEBOOK, PublishChannelType.LINKEDIN],
  groupBy: "week",
  includeTopPerformers: true,
  limit: 10,
});

// Result includes:
// - Aggregated metrics by content type
// - Top performing content
// - Trend data over time
// - Channel-specific breakdowns
```

**Features:**

- Time range filtering
- Content type filtering
- Channel filtering
- Grouping by day/week/month
- Top performer identification
- Metric aggregation

### 4. Time Range Filtering (Requirement 5.4)

Supports preset time ranges and custom date ranges.

```typescript
import {
  getAnalyticsForTimeRange,
  TimeRangePreset,
} from "@/services/publishing/content-analytics-service";

// Using presets
const last7Days = await getAnalyticsForTimeRange(
  "user-123",
  TimeRangePreset.LAST_7_DAYS
);

const last30Days = await getAnalyticsForTimeRange(
  "user-123",
  TimeRangePreset.LAST_30_DAYS
);

const last90Days = await getAnalyticsForTimeRange(
  "user-123",
  TimeRangePreset.LAST_90_DAYS
);

// Using custom range
const customRange = await getAnalyticsForTimeRange(
  "user-123",
  TimeRangePreset.CUSTOM,
  new Date("2024-01-01"),
  new Date("2024-01-31")
);
```

**Supported Presets:**

- `LAST_7_DAYS` - Last 7 days
- `LAST_30_DAYS` - Last 30 days
- `LAST_90_DAYS` - Last 90 days
- `CUSTOM` - Custom date range

### 5. Engagement Rate Calculation with Benchmarking

Calculates engagement rates and compares against industry benchmarks.

```typescript
import { getBenchmarkComparison } from "@/services/publishing/content-analytics-service";

const comparison = getBenchmarkComparison(
  ContentCategory.BLOG_POST,
  PublishChannelType.FACEBOOK,
  0.05 // 5% engagement rate
);

// Returns:
// {
//     engagementRate: 0.05,
//     benchmark: 'good' | 'average' | 'excellent',
//     percentile: 75,
//     industryAverage: 0.03,
//     recommendation: 'Your content is performing above average...'
// }
```

**Features:**

- Industry benchmark comparison
- Percentile ranking
- Performance recommendations
- Content type specific benchmarks
- Channel specific benchmarks

## Additional Features

### A/B Testing

```typescript
import {
  createABTest,
  getABTestResults,
  trackABTestMetrics,
} from "@/services/publishing/content-analytics-service";

// Create A/B test (max 3 variations)
const test = await createABTest({
  userId: "user-123",
  name: "Headline Test",
  contentType: ContentCategory.BLOG_POST,
  variations: [
    { name: "Variation A", content: "Headline A" },
    { name: "Variation B", content: "Headline B" },
    { name: "Variation C", content: "Headline C" },
  ],
  targetMetric: "clicks",
  minimumSampleSize: 100,
  confidenceLevel: 0.95,
});

// Track metrics for variation
await trackABTestMetrics("user-123", test.data.id, variationId, {
  views: 100,
  clicks: 15,
  likes: 5,
});

// Get results with statistical analysis
const results = await getABTestResults({
  userId: "user-123",
  testId: test.data.id,
  includeStatisticalAnalysis: true,
});
```

### ROI Tracking

```typescript
import {
  trackROIEvent,
  getROIAnalytics,
  exportROIData,
} from "@/services/publishing/content-analytics-service";

// Track ROI event
await trackROIEvent({
  userId: "user-123",
  contentId: "content-456",
  contentType: ContentCategory.BLOG_POST,
  eventType: ROIEventType.LEAD,
  value: 500,
  currency: "USD",
  clientInfo: {
    clientId: "client-789",
    clientName: "John Doe",
  },
  attributionModel: "last-touch",
});

// Get ROI analytics
const roiAnalytics = await getROIAnalytics({
  userId: "user-123",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-01-31"),
  includeConversionFunnel: true,
});

// Export ROI data
const exportData = await exportROIData({
  userId: "user-123",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-01-31"),
  format: "csv",
  includeDetails: true,
});
```

### External Analytics Sync

```typescript
import { syncExternalAnalytics } from "@/services/publishing/content-analytics-service";

// Sync analytics from external platforms
const syncResult = await syncExternalAnalytics({
  userId: "user-123",
  channel: PublishChannelType.FACEBOOK,
  contentIds: ["content-1", "content-2"],
  forceSync: false,
});

// Result includes:
// - Items synced count
// - Sync status
// - Rate limit information
// - Error details if any
```

## Data Models

### Analytics Entity

```typescript
interface Analytics {
  id: string;
  userId: string;
  contentId: string;
  contentType: ContentCategory;
  channel: PublishChannelType;
  publishedAt: Date;
  metrics: EngagementMetrics;
  platformMetrics?: Record<string, any>;
  lastSynced: Date;
  syncStatus: AnalyticsSyncStatus;
  GSI3PK?: string; // ANALYTICS#<contentType>
  GSI3SK?: string; // DATE#<publishedAt>
}
```

### Engagement Metrics

```typescript
interface EngagementMetrics {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  saves?: number;
  engagementRate: number;
  reach?: number;
  impressions?: number;
}
```

### Type Analytics

```typescript
interface TypeAnalytics {
  contentType: ContentCategory;
  totalPublished: number;
  avgEngagement: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  engagementRate: number;
  topPerforming: ContentSummary[];
  trendData: TrendDataPoint[];
  lastUpdated: Date;
}
```

## DynamoDB Schema

### Primary Keys

```
PK: USER#<userId>
SK: ANALYTICS#<contentId>#<channel>
```

### GSI3 (Content Type Analytics)

```
GSI3PK: ANALYTICS#<contentType>
GSI3SK: DATE#<publishedAt>
```

This GSI enables efficient queries for:

- All analytics for a specific content type
- Analytics within a date range
- Aggregation by content type

## Error Handling

The service uses enterprise-grade error handling with:

1. **Retry Logic**: Automatic retries with exponential backoff
2. **Circuit Breaker**: Prevents cascading failures
3. **Fallback Mechanisms**: Local storage fallback on database failures
4. **Structured Logging**: Comprehensive error logging with context
5. **User-Friendly Messages**: Clear error messages for users

## Rate Limiting

External analytics sync includes rate limiting:

- **Facebook/Instagram**: 200 requests/hour, 10 requests/minute
- **LinkedIn**: 500 requests/hour, 20 requests/minute
- **Twitter**: 300 requests/hour, 15 requests/minute

Rate limits are automatically managed with:

- Request queuing
- Exponential backoff
- Retry after rate limit reset

## Performance Considerations

1. **Caching**: Results are cached where appropriate
2. **Batch Operations**: Multiple analytics can be tracked in batches
3. **Efficient Queries**: Uses GSI indexes for fast lookups
4. **Lazy Loading**: Trend data and breakdowns loaded on demand
5. **Pagination**: Large result sets are paginated

## Testing

Tests are located at:

- `src/__tests__/analytics-service.test.ts` - Core service tests
- `src/__tests__/content-analytics-service-integration.test.ts` - Integration tests
- `src/__tests__/content-workflow-properties.test.ts` - Property-based tests

## Integration with Other Services

The analytics service integrates with:

1. **Scheduling Service**: Tracks scheduled content publication
2. **Publishing Service**: Records publication events
3. **Template Service**: Tracks template usage analytics
4. **OAuth Manager**: Syncs external platform analytics

## Usage in Server Actions

```typescript
// In server actions
import { trackPublication } from "@/services/publishing/content-analytics-service";

export async function publishContentAction(params: PublishParams) {
  "use server";

  // Publish content
  const publishResult = await publishContent(params);

  // Track analytics
  if (publishResult.success) {
    await trackPublication({
      userId: params.userId,
      contentId: params.contentId,
      contentType: params.contentType,
      channel: params.channel,
      publishedAt: new Date(),
      platformPostId: publishResult.postId,
      publishedUrl: publishResult.postUrl,
    });
  }

  return publishResult;
}
```

## Future Enhancements

Planned improvements include:

1. **Real-time Analytics**: WebSocket-based real-time updates
2. **Predictive Analytics**: ML-based performance predictions
3. **Advanced Segmentation**: Audience segmentation analysis
4. **Competitive Analysis**: Benchmark against competitors
5. **Custom Metrics**: User-defined custom metrics
6. **Data Export**: Enhanced export formats (Excel, PDF)
7. **Visualization**: Built-in chart generation
8. **Alerts**: Automated performance alerts

## Support

For issues or questions:

- Check the design document: `.kiro/specs/content-workflow-features/design.md`
- Review requirements: `.kiro/specs/content-workflow-features/requirements.md`
- See implementation tasks: `.kiro/specs/content-workflow-features/tasks.md`
