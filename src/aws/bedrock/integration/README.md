# Integration & Automation Layer

This module provides integration and automation capabilities for the AgentStrands system, including social media scheduling, CRM integration, campaign generation, and analytics integration.

## Components

### Social Media Scheduler

The `SocialMediaScheduler` manages scheduling and posting of content to social media platforms with automatic optimal time calculation and queue management.

**Features:**

- Schedule posts for specific times
- Calculate optimal posting times based on historical data
- Post immediately to multiple platforms
- Manage posting queue
- Update and cancel scheduled posts
- Queue statistics and analytics

**Requirements:** 12.1

### CRM Connector

The `CRMConnector` integrates with CRM systems to pull client data, personalize content, and sync activities back to the CRM.

**Features:**

- Multi-provider support (HubSpot, Follow Up Boss, Salesforce)
- Client data retrieval with intelligent caching
- Content personalization with variable replacement
- Activity syncing with automatic retry
- Batch operations for efficiency
- Preference-based customization

**Requirements:** 12.2

### Campaign Generator

The `CampaignGenerator` creates complete drip email campaigns from existing content library with intelligent sequencing and scheduling.

**Features:**

- Generate multi-email campaigns from templates
- Support for multiple campaign types (nurture, onboarding, listing promotion, etc.)
- Intelligent email sequencing with customizable delays
- Campaign scheduling and status management
- Content personalization and customization
- Campaign templates with best practices
- Recommendations for optimization

**Requirements:** 12.3

### Analytics Integrator

The `AnalyticsIntegrator` connects with analytics platforms to track content performance, generate strategy insights, and synchronize data automatically.

**Features:**

- Multi-platform analytics integration (Google Analytics, Facebook, Instagram, LinkedIn)
- Performance tracking with comprehensive metrics
- Automatic insight generation (trends, opportunities, warnings, recommendations)
- Data synchronization with configurable intervals
- Connection management and credential storage
- Filtering and querying of insights
- Demographics and engagement analysis

**Requirements:** 12.4

## Usage

### Basic Scheduling

```typescript
import { SocialMediaScheduler } from "@/aws/bedrock/integration";

const scheduler = new SocialMediaScheduler({
  autoOptimize: true,
  minPostDelay: 30, // minutes
});

// Schedule a post
const post = {
  userId: "user-123",
  content: "Check out this amazing property! 🏡",
  platform: "facebook",
  hashtags: ["RealEstate", "NewListing"],
};

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(14, 0, 0, 0);

const scheduled = await scheduler.schedulePost(post, tomorrow, [
  "facebook",
  "instagram",
]);
```

### Optimal Time Calculation

```typescript
// Get optimal posting time
const optimalTime = await scheduler.getOptimalTime(
  "user-123",
  "facebook",
  "market-update"
);

console.log("Recommended time:", optimalTime.recommendedTime);
console.log("Confidence:", optimalTime.confidence);
console.log("Reasoning:", optimalTime.reasoning);
console.log("Alternatives:", optimalTime.alternativeTimes);
```

### Immediate Posting

```typescript
// Post immediately to multiple platforms
const results = await scheduler.postNow(post, [
  "facebook",
  "instagram",
  "twitter",
]);

for (const result of results) {
  if (result.success) {
    console.log(`Posted to ${result.platform}: ${result.url}`);
  } else {
    console.error(`Failed to post to ${result.platform}: ${result.error}`);
  }
}
```

### Queue Management

```typescript
// Get current queue
const queue = await scheduler.getQueue("user-123");
console.log(`${queue.length} posts in queue`);

// Get queue statistics
const stats = await scheduler.getQueueStats("user-123");
console.log("Total scheduled:", stats.totalScheduled);
console.log("Next post:", stats.nextPostTime);
console.log("Platform breakdown:", stats.platformBreakdown);

// Update a scheduled post
await scheduler.updateScheduledPost("user-123", "post-id", {
  scheduledTime: newTime,
  platforms: ["facebook", "instagram", "linkedin"],
});

// Cancel a scheduled post
await scheduler.cancelPost("user-123", "post-id");
```

### CRM Integration

```typescript
import { CRMConnector } from "@/aws/bedrock/integration";

const connector = new CRMConnector({
  defaultProvider: "hubspot",
  autoSync: true,
  cacheTTL: 300, // 5 minutes
});

// Get client data
const clientData = await connector.getClientData(
  "contact-123", // CRM contact ID
  "user-456" // User ID
);

// Personalize content
const template = `
Hi {{firstName}},

Thanks for your interest in properties in {{location}}!

Based on your budget of ${{ budget }}, I've found some great options.

Best regards,
Your Agent
`;

const personalized = await connector.personalizeContent(template, {
  clientData,
  contentType: "email",
  variables: {
    location: "Downtown",
  },
});

console.log(personalized.content);

// Sync activity to CRM
const activity = {
  userId: "user-456",
  clientId: "contact-123",
  type: "email_sent",
  description: "Sent property listing email",
  timestamp: new Date().toISOString(),
  metadata: {
    subject: "New Listings in Your Area",
    listingIds: ["listing-1", "listing-2"],
  },
};

await connector.syncActivity(activity);
```

### Campaign Generation

```typescript
import { CampaignGenerator } from "@/aws/bedrock/integration";

const generator = new CampaignGenerator({
  defaultDelayDays: 3,
  maxCampaignLength: 10,
  autoSchedule: false,
});

// Generate a nurture campaign
const request = {
  userId: "user-123",
  campaignName: "New Lead Nurture Campaign",
  template: "nurture",
  targetAudience: "first-time-buyers",
  customization: {
    tone: "friendly",
    includeImages: true,
  },
};

const result = await generator.generateCampaign(request);

console.log("Campaign created:", result.campaign.name);
console.log("Number of emails:", result.campaign.emails.length);
console.log("Estimated duration:", result.estimatedDuration, "days");

// Schedule the campaign
const scheduleOptions = {
  startDate: new Date("2024-01-15"),
  sendTime: { hour: 9, minute: 0 },
  timezone: "America/New_York",
};

const scheduled = await generator.scheduleCampaign(
  "user-123",
  result.campaign.id,
  scheduleOptions
);

console.log("Campaign scheduled for:", scheduled.startDate);
```

### Campaign Templates

Available campaign templates:

- **nurture**: 5-email sequence for lead nurturing
- **onboarding**: 5-email welcome sequence
- **listing-promotion**: 5-email property promotion
- **market-update**: 4-email market insights series
- **seasonal**: 4-email seasonal campaign
- **custom**: Flexible custom campaign

### Campaign Management

```typescript
// List all campaigns
const campaigns = await generator.listCampaigns("user-123");

// List campaigns by status
const draftCampaigns = await generator.listCampaigns("user-123", "draft");
const activeCampaigns = await generator.listCampaigns("user-123", "active");

// Update campaign status
await generator.updateCampaignStatus("user-123", "campaign-id", "active");

// Delete a campaign
await generator.deleteCampaign("user-123", "campaign-id");
```

### Analytics Integration

```typescript
import { AnalyticsIntegrator } from "@/aws/bedrock/integration";

const integrator = new AnalyticsIntegrator({
  defaultProvider: "google-analytics",
  autoSync: true,
  syncInterval: 3600, // 1 hour
  autoGenerateInsights: true,
});

// Connect to analytics platform
const status = await integrator.connect("user-123", "google-analytics", {
  accessToken: "your-access-token",
  refreshToken: "your-refresh-token",
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
});

// Track content performance
const metrics = await integrator.trackPerformance(
  "user-123",
  "content-456",
  "facebook",
  "7d"
);

console.log("Views:", metrics.metrics.views);
console.log("Engagement Rate:", metrics.metrics.engagementRate);
console.log("Conversions:", metrics.metrics.conversions);

// Generate insights
const insights = await integrator.generateInsights("user-123", "30d");

for (const insight of insights) {
  console.log(`[${insight.type}] ${insight.title}`);
  console.log(`Impact: ${insight.impact}`);
  console.log("Recommendations:", insight.recommendations);
}

// Synchronize data
const result = await integrator.syncData("user-123");
console.log("Contents Synced:", result.contentsSynced);
console.log("Insights Generated:", result.insightsGenerated);

// Get filtered insights
const highImpact = await integrator.getInsights("user-123", {
  impact: "high",
  minConfidence: 0.7,
});

const warnings = await integrator.getInsights("user-123", {
  type: "warning",
});
```

## Configuration

### SocialMediaSchedulerConfig

```typescript
interface SocialMediaSchedulerConfig {
  // Default platforms to post to if not specified
  defaultPlatforms?: SocialMediaPlatform[];

  // Whether to automatically calculate optimal posting times
  autoOptimize?: boolean;

  // Maximum number of posts to queue per platform
  maxQueueSize?: number;

  // Minimum delay between posts (in minutes)
  minPostDelay?: number;
}
```

**Default values:**

- `defaultPlatforms`: `['facebook', 'instagram']`
- `autoOptimize`: `true`
- `maxQueueSize`: `100`
- `minPostDelay`: `30` minutes

### CampaignGeneratorConfig

```typescript
interface CampaignGeneratorConfig {
  // Default delay between emails (in days)
  defaultDelayDays?: number;

  // Maximum number of emails in a campaign
  maxCampaignLength?: number;

  // Whether to automatically schedule campaigns
  autoSchedule?: boolean;

  // Default campaign template to use
  defaultTemplate?: CampaignTemplate;
}
```

**Default values:**

- `defaultDelayDays`: `3` days
- `maxCampaignLength`: `10` emails
- `autoSchedule`: `false`
- `defaultTemplate`: `'nurture'`

### AnalyticsIntegratorConfig

```typescript
interface AnalyticsIntegratorConfig {
  // Default analytics provider to use
  defaultProvider?: AnalyticsProvider;

  // Whether to automatically sync data
  autoSync?: boolean;

  // Sync interval in seconds
  syncInterval?: number;

  // Maximum number of retries for failed operations
  maxRetries?: number;

  // Whether to generate insights automatically
  autoGenerateInsights?: boolean;
}
```

**Default values:**

- `defaultProvider`: `'google-analytics'`
- `autoSync`: `true`
- `syncInterval`: `3600` seconds (1 hour)
- `maxRetries`: `3`
- `autoGenerateInsights`: `true`

## Data Storage

The scheduler stores data in DynamoDB using the following key patterns:

### Scheduled Posts

```
PK: USER#<userId>
SK: SCHEDULED_POST#<postId>
EntityType: ScheduledPost
```

### Post Analytics

```
PK: USER#<userId>
SK: POST_ANALYTICS#<platform>#<postId>
EntityType: PostAnalytics
```

### Email Campaigns

```
PK: USER#<userId>
SK: CAMPAIGN#<campaignId>
EntityType: EmailCampaign
```

### Analytics Credentials

```
PK: USER#<userId>
SK: ANALYTICS_CREDENTIALS#<provider>
EntityType: AnalyticsCredentials
```

### Performance Metrics

```
PK: USER#<userId>
SK: ANALYTICS#<metricsId>
EntityType: AnalyticsMetrics
```

### Strategy Insights

```
PK: USER#<userId>
SK: INSIGHT#<insightId>
EntityType: StrategyInsight
```

## Optimal Time Algorithm

The scheduler calculates optimal posting times using:

1. **Historical Performance Analysis**

   - Analyzes past post engagement by hour and day
   - Identifies patterns in user behavior
   - Calculates average engagement rates

2. **Pattern Recognition**

   - Best performing hour of day
   - Best performing day of week
   - Engagement trends over time

3. **Confidence Scoring**

   - Based on volume of historical data
   - Minimum 30% confidence for new users
   - Up to 100% confidence with 50+ posts

4. **Alternative Suggestions**
   - Provides 4 alternative times
   - Adjacent hours on same day
   - Same time on adjacent days

## Platform Support

Currently supported platforms:

- Facebook
- Instagram
- Twitter
- LinkedIn
- YouTube
- TikTok

**Note:** Platform API integration is required for actual posting. The current implementation includes mock posting functionality.

## Error Handling

The scheduler handles various error conditions:

- **Validation Errors**

  - Scheduled time in the past
  - Queue size exceeded
  - Minimum post delay violation

- **Platform Errors**

  - API failures
  - Authentication issues
  - Rate limiting

- **Data Errors**
  - Missing user data
  - Invalid post format
  - Storage failures

## Campaign Sequencing

The campaign generator uses intelligent sequencing based on campaign type:

1. **Email Timing**

   - Configurable delays between emails
   - Default 3-day spacing
   - Customizable per email

2. **Content Flow**

   - Introduction → Value → Social Proof → Call-to-Action
   - Template-specific sequences
   - Logical progression

3. **Optimization**
   - Recommendations for improvement
   - Duration analysis
   - Content variety checks

## Examples

See `social-media-scheduler-example.ts` for comprehensive usage examples including:

1. Schedule with optimal time
2. Schedule for specific time
3. Post immediately
4. Manage queue
5. Update scheduled post
6. Cancel scheduled post
7. Batch schedule posts

See `campaign-generator-example.ts` for comprehensive usage examples including:

1. Generate nurture campaign
2. Listing promotion campaign
3. Schedule campaign
4. Manage campaigns
5. Update campaign status
6. Custom campaign
7. Seasonal campaign
8. Delete campaign

See `analytics-integrator-example.ts` for comprehensive usage examples including:

1. Connect to analytics platform
2. Track content performance
3. Generate strategy insights
4. Synchronize data
5. Retrieve insights with filters
6. Check connection status
7. Disconnect from analytics
8. Multi-platform tracking

## Testing

Run tests with:

```bash
npm test -- social-media-scheduler
npm test -- campaign-generator
npm test -- analytics-integrator
```

## Future Enhancements

Planned features:

- Platform API integration
- Advanced analytics
- Content performance prediction
- A/B testing for post variations
- Automated content optimization
- Multi-account management

**Campaign Generator:**

- AI-powered content generation for emails
- Email service provider (ESP) integration
- A/B testing for email variations
- Advanced personalization with CRM data
- Performance tracking and optimization
- Template marketplace

### Workflow Automation

The `WorkflowAutomationEngine` provides a multi-step workflow engine that executes automated workflows with quality gate checks and comprehensive monitoring.

**Features:**

- Multi-step workflow execution with dependency management
- Automatic retry logic with configurable backoff
- Quality gate checks (approval, validation, threshold)
- Workflow monitoring and metrics tracking
- Pause/resume/cancel workflow control
- Predefined workflow templates
- Optional steps that don't block completion
- Step-level error handling and recovery

**Requirements:** 12.5

## Related Components

- **CRM Connector**: Client data integration ✓ Implemented
- **Campaign Generator**: Email campaign automation ✓ Implemented
- **Analytics Integrator**: Performance tracking ✓ Implemented
- **Workflow Automation**: Multi-step workflows ✓ Implemented

### Workflow Automation Usage

```typescript
import {
  WorkflowAutomationEngine,
  WORKFLOW_TEMPLATES,
} from "@/aws/bedrock/integration";

const engine = new WorkflowAutomationEngine();

// Create workflow from template
const workflow = await engine.createWorkflow(
  "user-123",
  WORKFLOW_TEMPLATES["content-to-social"],
  {
    topic: "Spring Market Update",
    platform: "facebook",
  }
);

// Execute workflow
const result = await engine.executeWorkflow(workflow.id, {
  autoApprove: true,
  notifyOnCompletion: true,
});

console.log("Status:", result.status);
console.log("Completed steps:", result.metrics.completedSteps);
console.log("Total duration:", result.metrics.totalDuration, "ms");

// Monitor workflows
const activeWorkflows = await engine.listWorkflows("user-123", "active");

// Pause/resume workflow
await engine.pauseWorkflow(workflow.id);
await engine.resumeWorkflow(workflow.id);

// Cancel workflow
await engine.cancelWorkflow(workflow.id);
```

### Predefined Workflow Templates

- **content-to-social**: Generate content and post to social media
- **listing-campaign**: Complete listing promotion campaign
- **market-analysis-report**: Generate comprehensive market analysis

See `WORKFLOW_AUTOMATION_IMPLEMENTATION.md` for detailed documentation.

## Requirements Validation

This implementation satisfies:

**Requirement 12.1:** WHEN content is approved, THEN the system SHALL support automatic scheduling and posting to social media platforms at optimal times

**Property 56:** Automatic scheduling - For any approved content with scheduling enabled, the content should be posted to configured platforms at the optimal time.

**Requirement 12.3:** WHEN email campaigns are needed, THEN the system SHALL generate complete drip campaigns from existing content library with appropriate sequencing

**Property 58:** Campaign generation completeness - For any email campaign request, the generated drip campaign should include all necessary emails in proper sequence.

**Requirement 12.4:** WHEN content is published, THEN the system SHALL integrate with analytics platforms to track performance and inform future content strategy

**Property 59:** Analytics integration - For any published content, performance data should be tracked via analytics integration and used to inform future strategy.

**Requirement 12.5:** WHERE automation is configured, THEN the system SHALL execute multi-step workflows without manual intervention while maintaining quality standards

**Property 60:** Workflow automation - For any configured multi-step workflow, all steps should execute automatically without manual intervention while maintaining quality standards.
