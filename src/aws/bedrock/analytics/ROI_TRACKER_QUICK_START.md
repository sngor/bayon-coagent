# ROI Tracker Quick Start Guide

## Installation

The ROI Tracker is part of the AgentStrands analytics system. No additional installation is required.

## Basic Setup

```typescript
import { createROITracker } from "@/aws/bedrock/analytics/roi-tracker";

// Create tracker instance
const roiTracker = createROITracker({
  tableName: "bayon-coagent-dev", // Your DynamoDB table
  retentionDays: 365, // Keep data for 1 year
});
```

## Quick Examples

### 1. Track a Lead (30 seconds)

```typescript
await roiTracker.trackOutcome({
  id: `outcome-${Date.now()}`,
  contentId: "blog-post-123",
  strandId: "content-generator",
  userId: "user-456",
  type: "lead-generated",
  value: 0,
  description: "User filled out contact form",
  occurredAt: new Date().toISOString(),
  metadata: {
    contentType: "blog-post",
    creationCost: 5.5,
    distributionCost: 0,
  },
});
```

### 2. Track a Sale (30 seconds)

```typescript
await roiTracker.trackOutcome({
  id: `outcome-${Date.now()}`,
  contentId: "listing-description-789",
  strandId: "listing-strand",
  userId: "user-456",
  type: "sale-closed",
  value: 15000, // Commission earned
  description: "Property sold",
  occurredAt: new Date().toISOString(),
  metadata: {
    contentType: "listing-description",
    propertyValue: 500000,
    commissionRate: 0.03,
    creationCost: 3.25,
    distributionCost: 200,
  },
});
```

### 3. Calculate ROI (10 seconds)

```typescript
const roi = await roiTracker.calculateROI("blog-post-123", "user-456");

console.log(`ROI: ${roi.roiPercentage}%`);
console.log(`Profit: $${roi.profit}`);
console.log(`Payback: ${roi.paybackPeriod} days`);
```

### 4. Generate Report (20 seconds)

```typescript
const report = await roiTracker.generateReport({
  userId: "user-456",
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date().toISOString(),
});

console.log(`Overall ROI: ${report.overallROI}%`);
console.log("Insights:", report.insights);
console.log("Recommendations:", report.recommendations);
```

## Common Outcome Types

```typescript
// Lead generation
type: "lead-generated";
value: 0;

// Property view
type: "property-viewed";
value: 0;

// Contact made
type: "contact-made";
value: 0;

// Appointment scheduled
type: "appointment-scheduled";
value: 0;

// Listing signed
type: "listing-signed";
value: 0;

// Sale closed
type: "sale-closed";
value: commissionAmount;

// Referral received
type: "referral-received";
value: referralValue;

// Engagement (clicks, shares)
type: "engagement";
value: 0;

// Brand awareness
type: "brand-awareness";
value: 0;
```

## Essential Metadata

Always include these fields in metadata:

```typescript
metadata: {
  contentType: 'blog-post',      // Type of content
  creationCost: 5.50,            // Cost to create
  distributionCost: 25.00,       // Cost to distribute
  // Optional but recommended:
  platform: 'website',           // Where published
  source: 'organic-search',      // Traffic source
  leadQuality: 'high',           // Lead quality
}
```

## Integration Checklist

- [ ] Track outcome when content is created (with costs)
- [ ] Track outcome when user views content
- [ ] Track outcome when user engages (clicks, shares)
- [ ] Track outcome when lead is generated
- [ ] Track outcome when sale closes (with revenue)
- [ ] Generate weekly/monthly reports
- [ ] Display ROI metrics in dashboard
- [ ] Act on insights and recommendations

## Next Steps

1. **Review Examples**: Check `roi-tracker-example.ts` for detailed examples
2. **Read Documentation**: See `ROI_TRACKER_IMPLEMENTATION.md` for full details
3. **Integrate**: Add ROI tracking to your content workflows
4. **Monitor**: Set up regular reporting and alerts
5. **Optimize**: Use insights to improve content strategy

## Common Patterns

### Pattern 1: Track Content Lifecycle

```typescript
// 1. Content created
await roiTracker.trackOutcome({
  type: "engagement",
  value: 0,
  metadata: { creationCost: 5.5, distributionCost: 0 },
});

// 2. User views content
await roiTracker.trackOutcome({
  type: "property-viewed",
  value: 0,
});

// 3. User becomes lead
await roiTracker.trackOutcome({
  type: "lead-generated",
  value: 0,
});

// 4. Sale closes
await roiTracker.trackOutcome({
  type: "sale-closed",
  value: 15000,
});

// 5. Check ROI
const roi = await roiTracker.calculateROI(contentId, userId);
```

### Pattern 2: Weekly Performance Review

```typescript
// Generate weekly report
const report = await roiTracker.generateReport({
  userId: "user-456",
  startDate: sevenDaysAgo,
  endDate: now,
});

// Review top performers
console.log("Top 5 Content:");
report.topPerformers.slice(0, 5).forEach((content) => {
  console.log(`${content.contentType}: ${content.roi}% ROI`);
});

// Review recommendations
console.log("\nActions to Take:");
report.recommendations.forEach((rec) => {
  console.log(`- ${rec}`);
});
```

### Pattern 3: Content Type Comparison

```typescript
// Compare blog posts vs social media
const blogReport = await roiTracker.generateReport({
  userId: "user-456",
  contentType: "blog-post",
});

const socialReport = await roiTracker.generateReport({
  userId: "user-456",
  contentType: "social-media-post",
});

console.log(`Blog ROI: ${blogReport.overallROI}%`);
console.log(`Social ROI: ${socialReport.overallROI}%`);
```

## Troubleshooting

**Q: ROI is always 0%**
A: Make sure you're tracking outcomes with revenue (sale-closed, referral-received)

**Q: Can't calculate ROI**
A: Ensure you included creationCost and distributionCost in the initial outcome metadata

**Q: Payback period is -1**
A: Content hasn't generated enough revenue to cover costs yet

**Q: Report shows no data**
A: Check that userId and date filters match your tracked outcomes

## Tips for Success

1. **Track Everything**: Track all outcomes, even small engagements
2. **Accurate Costs**: Include all costs (creation, distribution, promotion)
3. **Attribute Revenue**: Link sales back to the content that generated them
4. **Regular Reports**: Generate reports weekly to spot trends
5. **Act on Insights**: Use recommendations to optimize your strategy

## Support

Need help? Check these resources:

- Full documentation: `ROI_TRACKER_IMPLEMENTATION.md`
- Code examples: `roi-tracker-example.ts`
- Type definitions: `types.ts`
- Main design doc: `.kiro/specs/agentstrands-enhancement/design.md`
