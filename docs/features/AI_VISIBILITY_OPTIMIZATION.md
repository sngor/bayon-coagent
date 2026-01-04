# AI Visibility Optimization

## Overview

The AI Visibility Optimization feature helps real estate agents improve their discoverability across AI-powered search platforms including ChatGPT, Claude, Perplexity, Gemini, and Bing Chat. This comprehensive system generates structured data, monitors AI mentions, and provides actionable recommendations to enhance online visibility.

## Key Features

### 1. Schema Markup Generation

Automatically generates structured data in multiple formats to help AI systems understand and surface your professional information:

- **JSON-LD**: Schema.org compliant structured data for websites
- **RDF/XML & Turtle**: Semantic web formats for knowledge graphs
- **Microdata**: HTML-embedded structured data
- **Knowledge Graph**: Semantic relationships and entity linking

**Supported Schema Types:**
- `RealEstateAgent`: Professional agent information
- `Person`: Personal details and credentials
- `LocalBusiness`: Agency and business information
- `Organization`: Company structure and relationships
- `Review`: Client testimonials and ratings
- `AggregateRating`: Overall rating calculations

### 2. AI Search Monitoring

Real-time monitoring of AI platform mentions with comprehensive analytics:

**Monitored Platforms:**
- ChatGPT (OpenAI)
- Claude (Anthropic)
- Perplexity AI
- Google Gemini
- Microsoft Bing Chat

**Monitoring Features:**
- Location-based query templates
- Mention detection and context extraction
- Sentiment analysis and position tracking
- Competitive positioning analysis
- Trend analysis with historical data

### 3. Optimization Engine

AI-powered recommendations to improve visibility across all platforms:

**Scoring Algorithm:**
- Schema Markup: 25% weight
- Content Quality: 20% weight
- AI Presence: 20% weight
- Knowledge Graph: 15% weight
- Social Signals: 10% weight
- Technical SEO: 10% weight

**Recommendation Categories:**
- High Impact / Low Effort (Quick Wins)
- High Impact / High Effort (Strategic Initiatives)
- Low Impact / Low Effort (Maintenance Tasks)
- Low Impact / High Effort (Avoid)

### 4. Brand Hub Integration

Seamlessly integrates with existing Brand Hub features:

- **Profile Sync**: Automatic schema updates when profile changes
- **Testimonial Integration**: Auto-generates Review schemas from testimonials
- **NAP Consistency**: Coordinates with audit features
- **Competitive Analysis**: Enhances competitor discovery with AI visibility data

## Implementation

### Core Components

#### 1. Schema Generation Service
```typescript
// Location: src/lib/ai-visibility/schema-generator.ts
export class SchemaGeneratorService {
  generateRealEstateAgentSchema(profile: Profile): JsonLdSchema
  generatePersonSchema(profile: Profile): JsonLdSchema
  generateLocalBusinessSchema(profile: Profile): JsonLdSchema
  generateReviewSchemas(testimonials: Testimonial[]): JsonLdSchema[]
}
```

#### 2. AI Search Monitor
```typescript
// Location: src/lib/ai-visibility/ai-search-monitor.ts
export class AISearchMonitorService {
  monitorPlatform(platform: AIPlatform, queries: string[]): Promise<AIMention[]>
  analyzeCompetitivePosition(agent: string, competitors: string[]): Promise<CompetitiveAnalysis>
  trackMentionTrends(timeframe: TimeFrame): Promise<TrendAnalysis>
}
```

#### 3. Knowledge Graph Builder
```typescript
// Location: src/lib/ai-visibility/knowledge-graph-builder.ts
export class KnowledgeGraphBuilderService {
  buildAgentGraph(profile: Profile): KnowledgeGraph
  linkGeographicEntities(serviceAreas: string[]): GeographicEntity[]
  generateSameAsReferences(socialProfiles: SocialProfile[]): SameAsReference[]
}
```

#### 4. Brand Hub Integration
```typescript
// Location: src/lib/ai-visibility/brand-hub-integration.ts
export class BrandHubIntegrationService {
  handleProfileUpdate(event: BrandHubIntegrationEvent): Promise<IntegrationResult>
  handleTestimonialUpdate(event: BrandHubIntegrationEvent): Promise<IntegrationResult>
  handleAuditCompletion(event: BrandHubIntegrationEvent): Promise<IntegrationResult>
}
```

### UI Components

#### 1. AI Visibility Dashboard
```typescript
// Location: src/app/(app)/brand/audit/ai-visibility/page.tsx
// Main dashboard showing overall AI visibility score and platform breakdowns
```

#### 2. Sync Status Component
```typescript
// Location: src/components/brand/ai-visibility-sync-status.tsx
export function AIVisibilitySyncStatus({
  status: 'idle' | 'syncing' | 'success' | 'error' | 'warning',
  lastSync?: SynchronizationResult,
  onManualSync?: () => Promise<void>
})
```

#### 3. Integration Hook
```typescript
// Location: src/hooks/use-brand-hub-ai-integration.ts
export function useBrandHubAIIntegration(options?: BrandHubAIIntegrationOptions) {
  // Provides unified interface for AI visibility integration
}
```

### Server Actions

The following server actions have been enhanced to support AI visibility integration:

```typescript
// Enhanced actions in src/app/actions.ts

// Profile updates trigger AI visibility sync
export async function updateProfileAction(...)

// Testimonial updates generate Review schemas
export async function updateTestimonialAction(...)

// NAP audit results inform AI visibility recommendations
export async function runNapAuditAction(...)

// Strategy generation aligns with AI visibility goals
export async function generateMarketingPlanAction(...)
```

## Usage Guide

### 1. Initial Setup

1. **Complete Brand Profile**: Ensure all profile fields are filled out
2. **Add Testimonials**: Import or add client testimonials for Review schemas
3. **Run NAP Audit**: Verify consistency across all platforms
4. **Generate Initial Schemas**: System automatically creates structured data

### 2. Monitoring Setup

1. Navigate to **Brand → Audit → AI Visibility**
2. Configure monitoring preferences:
   - Select AI platforms to monitor
   - Set query frequency (daily/weekly)
   - Define competitive analysis scope
3. Review initial AI visibility score and recommendations

### 3. Optimization Workflow

1. **Review Recommendations**: Check prioritized optimization suggestions
2. **Implement Quick Wins**: Start with high-impact, low-effort improvements
3. **Monitor Progress**: Track AI visibility score improvements
4. **Competitive Analysis**: Compare performance against competitors
5. **Iterate**: Continuously refine based on performance data

### 4. Integration with Other Features

- **Profile Updates**: Changes automatically trigger schema regeneration
- **New Testimonials**: Automatically generate Review schemas
- **Strategy Planning**: AI visibility data informs marketing strategy
- **Content Creation**: Optimize content for AI platform preferences

## API Reference

### Schema Generation

```typescript
// Generate all schemas for a user profile
POST /api/ai-visibility/generate-schemas
{
  "userId": "string",
  "formats": ["json-ld", "rdf-xml", "turtle", "microdata"]
}

// Response
{
  "schemas": {
    "json-ld": { ... },
    "rdf-xml": "...",
    "turtle": "...",
    "microdata": "..."
  },
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": []
  }
}
```

### AI Monitoring

```typescript
// Trigger AI platform monitoring
POST /api/ai-visibility/monitor
{
  "userId": "string",
  "platforms": ["chatgpt", "claude", "perplexity", "gemini", "bing"],
  "queries": ["string[]"]
}

// Get monitoring results
GET /api/ai-visibility/mentions?userId=string&timeframe=7d

// Response
{
  "mentions": [
    {
      "platform": "chatgpt",
      "query": "real estate agent in [location]",
      "position": 3,
      "context": "...",
      "sentiment": "positive",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ],
  "summary": {
    "totalMentions": 15,
    "averagePosition": 2.3,
    "sentimentScore": 0.8
  }
}
```

### Competitive Analysis

```typescript
// Run competitive analysis
POST /api/ai-visibility/competitive-analysis
{
  "userId": "string",
  "competitors": ["competitor1", "competitor2"],
  "location": "string"
}

// Response
{
  "analysis": {
    "userScore": 85,
    "competitorScores": [78, 82],
    "gaps": ["schema markup", "social presence"],
    "opportunities": ["local content", "testimonial optimization"]
  }
}
```

## Performance Considerations

### Caching Strategy

- **Schema Generation**: 24-hour TTL cache for generated schemas
- **AI Monitoring**: 6-hour cache for platform responses
- **Competitive Analysis**: Daily cache refresh
- **Recommendations**: Cache until profile changes

### Rate Limiting

- **AI Platform APIs**: Respects individual platform rate limits
- **Batch Processing**: Groups multiple queries for efficiency
- **Exponential Backoff**: Handles temporary API failures gracefully

### Cost Management

- **Query Optimization**: Intelligent query selection based on relevance
- **Monitoring Frequency**: Configurable intervals to balance cost and freshness
- **Platform Prioritization**: Focus on most impactful platforms first

## Troubleshooting

### Common Issues

1. **Schema Validation Errors**
   - Check profile completeness
   - Verify required fields are populated
   - Review Schema.org specification compliance

2. **AI Monitoring Failures**
   - Verify API keys are configured
   - Check rate limit status
   - Review query template formatting

3. **Integration Sync Issues**
   - Check Brand Hub integration status
   - Verify event handling configuration
   - Review synchronization logs

### Debug Tools

```typescript
// Enable debug logging
localStorage.setItem('ai-visibility-debug', 'true');

// Check sync status
const status = await getAIVisibilitySyncStatus(userId);

// Validate schemas
const validation = await validateGeneratedSchemas(schemas);
```

## Future Enhancements

### Planned Features

1. **Advanced Analytics**: Deeper insights into AI platform behavior
2. **Automated Optimization**: Self-improving recommendations based on results
3. **Multi-Language Support**: Schema generation in multiple languages
4. **Voice Search Optimization**: Optimization for voice-based AI assistants
5. **Real-Time Alerts**: Immediate notifications for significant changes

### Integration Roadmap

1. **CRM Integration**: Sync with popular real estate CRMs
2. **Website Plugins**: Direct integration with WordPress, Squarespace, etc.
3. **Social Media Automation**: Automatic posting of optimized content
4. **Email Marketing**: AI visibility insights in email campaigns

## Related Documentation

- [Brand Hub Architecture](../ARCHITECTURE.md#brand-hub)
- [Schema Markup Guide](../guides/schema-markup.md)
- [AI Platform APIs](../api/ai-platforms.md)
- [Performance Optimization](../optimization/ai-visibility-performance.md)
- [Troubleshooting Guide](../troubleshooting/ai-visibility.md)