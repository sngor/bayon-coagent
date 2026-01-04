# AI Visibility Quick Reference

## Overview

AI Visibility Optimization helps real estate agents improve their discoverability across AI-powered search platforms like ChatGPT, Claude, Perplexity, Gemini, and Bing Chat.

## Quick Access

**Location**: Brand Hub → Audit → AI Visibility  
**URL**: `/brand/audit/ai-visibility`

## Key Components

### 1. AI Visibility Score

Overall score (0-100) based on:
- Schema Markup (25%)
- Content Quality (20%) 
- AI Presence (20%)
- Knowledge Graph (15%)
- Social Signals (10%)
- Technical SEO (10%)

### 2. Platform Monitoring

Tracks mentions across:
- ChatGPT (OpenAI)
- Claude (Anthropic)
- Perplexity AI
- Google Gemini
- Microsoft Bing Chat

### 3. Schema Generation

Automatically generates:
- JSON-LD structured data
- RDF/XML semantic data
- Turtle format
- Microdata markup
- Knowledge graph entities

### 4. Optimization Recommendations

Categorized by impact and effort:
- **Quick Wins**: High impact, low effort
- **Strategic**: High impact, high effort
- **Maintenance**: Low impact, low effort
- **Avoid**: Low impact, high effort

## Common Actions

### Check AI Visibility Status
```typescript
// Navigate to Brand → Audit → AI Visibility
// View overall score and platform breakdowns
```

### Generate Schema Markup
```typescript
// Automatic generation when profile updates
// Manual trigger available in dashboard
// Export in multiple formats (JSON-LD, RDF, etc.)
```

### Monitor AI Mentions
```typescript
// Real-time tracking across AI platforms
// Sentiment analysis and position tracking
// Competitive comparison
```

### Implement Recommendations
```typescript
// Prioritized list with step-by-step guides
// Impact tracking for implemented changes
// Progress monitoring
```

## Integration Points

### Profile Updates
- Automatic schema regeneration
- Knowledge graph updates
- AI platform re-monitoring

### Testimonials
- Auto-generates Review schemas
- Updates aggregate ratings
- Enhances social proof signals

### NAP Audit
- Coordinates consistency checks
- Identifies AI visibility impacts
- Provides unified recommendations

### Competitive Analysis
- AI visibility comparison
- Gap analysis
- Opportunity identification

## API Endpoints

### Schema Generation
```bash
POST /api/ai-visibility/generate-schemas
GET /api/ai-visibility/schemas/{userId}
```

### AI Monitoring
```bash
POST /api/ai-visibility/monitor
GET /api/ai-visibility/mentions
GET /api/ai-visibility/competitive-analysis
```

### Optimization
```bash
GET /api/ai-visibility/score/{userId}
GET /api/ai-visibility/recommendations
POST /api/ai-visibility/track-implementation
```

## Server Actions

### Core Actions
```typescript
// Enhanced existing actions
updateProfileAction() // Triggers AI visibility sync
updateTestimonialAction() // Generates Review schemas
runNapAuditAction() // Includes AI visibility analysis

// New AI-specific actions
generateAIVisibilitySchemas()
monitorAIPlatforms()
getOptimizationRecommendations()
trackImplementationProgress()
```

## Components

### Dashboard Component
```typescript
<AIVisibilityDashboard 
  userId={userId}
  showRecommendations={true}
  enableMonitoring={true}
/>
```

### Sync Status Component
```typescript
<AIVisibilitySyncStatus
  status="success" | "syncing" | "error"
  lastSync={synchronizationResult}
  onManualSync={handleSync}
/>
```

### Integration Hook
```typescript
const {
  integrateProfileUpdate,
  integrateTestimonialUpdate,
  isIntegrating
} = useBrandHubAIIntegration({
  showNotifications: true,
  autoIntegrate: true
});
```

## File Locations

### Core Services
```
src/lib/ai-visibility/
├── schema-generator.ts           # Schema markup generation
├── ai-search-monitor.ts         # AI platform monitoring
├── knowledge-graph-builder.ts   # Semantic data building
├── optimization-engine.ts       # Scoring and recommendations
└── brand-hub-integration.ts     # Brand Hub coordination
```

### UI Components
```
src/components/brand/
├── ai-visibility-sync-status.tsx    # Sync status display
├── ai-visibility-dashboard.tsx      # Main dashboard
└── ai-visibility-recommendations.tsx # Optimization suggestions
```

### Hooks
```
src/hooks/
└── use-brand-hub-ai-integration.ts  # Integration management
```

### Pages
```
src/app/(app)/brand/audit/ai-visibility/
├── page.tsx                     # Main AI visibility page
├── monitoring/                  # AI platform monitoring
├── schemas/                     # Schema management
└── recommendations/             # Optimization recommendations
```

## Troubleshooting

### Common Issues

**Schema Generation Fails**
- Check profile completeness
- Verify required fields
- Review validation errors

**AI Monitoring Not Working**
- Verify API keys configured
- Check rate limit status
- Review query templates

**Sync Status Stuck**
- Check Brand Hub integration
- Review event handling logs
- Verify DynamoDB permissions

### Debug Commands

```typescript
// Enable debug logging
localStorage.setItem('ai-visibility-debug', 'true');

// Check sync status
const status = await getAIVisibilitySyncStatus(userId);

// Validate schemas
const validation = await validateGeneratedSchemas(schemas);

// Test AI monitoring
const mentions = await testAIPlatformMonitoring(platform, queries);
```

## Performance Notes

- Schema generation cached for 24 hours
- AI monitoring cached for 6 hours
- Recommendations updated on profile changes
- Batch processing for multiple queries
- Rate limiting respects platform limits

## Related Documentation

- [AI Visibility Optimization](../features/AI_VISIBILITY_OPTIMIZATION.md)
- [Brand Hub Architecture](../ARCHITECTURE.md#brand-hub-architecture)
- [Schema Markup Guide](../guides/schema-markup.md)
- [Performance Optimization](../optimization/ai-visibility-performance.md)