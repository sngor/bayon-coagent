# Competitive Intelligence Integration Guide

## Overview

This guide explains how to integrate the Competitive Intelligence module into the Bayon Coagent platform and how it connects with other AgentStrands enhancement modules.

## Architecture Integration

### Module Location

```
src/aws/bedrock/
├── competitive-intelligence/     # Competitive Intelligence Module
│   ├── types.ts                 # Type definitions
│   ├── competitor-monitor.ts    # Competitor tracking
│   ├── gap-analyzer.ts          # Gap analysis
│   ├── differentiation-engine.ts # NEW: Strategy generation
│   ├── index.ts                 # Module exports
│   ├── README.md                # Documentation
│   ├── competitor-monitor-example.ts  # Usage examples
│   ├── gap-analyzer-example.ts  # Gap analysis examples
│   ├── differentiation-engine-example.ts # NEW: Strategy examples
│   ├── TASK_21_COMPLETION.md    # Monitor implementation
│   ├── TASK_22_COMPLETION.md    # Gap analyzer implementation
│   ├── TASK_23_COMPLETION.md    # NEW: Engine implementation
│   └── INTEGRATION_GUIDE.md     # This file
├── intelligence/                # Proactive Intelligence Layer
├── learning/                    # Learning & Feedback Layer
├── collaboration/               # Collaboration Layer
├── memory/                      # Memory & Context Layer
└── ...
```

### Data Flow

```
User Input
    ↓
Competitor Monitor
    ↓
├─→ Track Content → DynamoDB (Content Records)
├─→ Identify Patterns → Bedrock AI → Patterns
└─→ Analyze Competitor → Analysis Results → DynamoDB
    ↓
Intelligence Layer (Opportunities)
    ↓
Learning Layer (Strategy Learning)
    ↓
User Insights & Recommendations
```

## Integration with Other Modules

### 1. Intelligence Layer Integration

The Competitive Intelligence module feeds opportunities to the Intelligence Layer:

```typescript
import { createCompetitorMonitor } from "@/aws/bedrock/competitive-intelligence";
import { OpportunityDetector } from "@/aws/bedrock/intelligence";

const monitor = createCompetitorMonitor();
const detector = new OpportunityDetector();

// Analyze competitor
const analysis = await monitor.analyzeCompetitor(userId, competitorId);

// Convert patterns to opportunities
for (const pattern of analysis.patterns) {
  if (pattern.effectiveness && pattern.effectiveness > 0.7) {
    await detector.createOpportunity({
      type: "competitive",
      title: `Adopt Strategy: ${pattern.name}`,
      description: pattern.description,
      potentialImpact: pattern.effectiveness,
      confidence: pattern.confidence,
      supportingData: [
        {
          type: "competitor-activity",
          source: analysis.competitor.name,
          data: pattern,
          relevance: pattern.confidence,
          timestamp: pattern.identifiedAt,
        },
      ],
    });
  }
}
```

### 2. Learning Layer Integration

Learn from successful competitor strategies:

```typescript
import { createCompetitorMonitor } from "@/aws/bedrock/competitive-intelligence";
import { PreferenceEngine } from "@/aws/bedrock/learning";

const monitor = createCompetitorMonitor();
const engine = new PreferenceEngine();

// Analyze high-performing competitor content
const content = await monitor.getCompetitorContent(competitorId, {
  minEngagement: 200,
});

// Extract successful patterns
const patterns = await monitor.identifyPatterns(competitorId);

// Update user preferences based on successful patterns
for (const pattern of patterns) {
  if (pattern.effectiveness && pattern.effectiveness > 0.8) {
    await engine.updatePreferences(userId, {
      contentStyle: {
        // Adapt based on pattern
      },
      topicPreferences: {
        // Boost topics from successful patterns
      },
    });
  }
}
```

### 3. Memory Layer Integration

Store competitive insights in long-term memory:

```typescript
import { createCompetitorMonitor } from "@/aws/bedrock/competitive-intelligence";
import { LongTermMemoryStore } from "@/aws/bedrock/memory";

const monitor = createCompetitorMonitor();
const memory = new LongTermMemoryStore();

// Analyze competitor
const analysis = await monitor.analyzeCompetitor(userId, competitorId);

// Store insights in memory
await memory.persistMemory(strandId, {
  type: "knowledge",
  content: `Competitor ${
    analysis.competitor.name
  } posts ${analysis.summary.postingFrequency.toFixed(
    1
  )} times per week, primarily on ${
    analysis.summary.mostActiveChannels[0]
  }. Top topics: ${analysis.summary.topTopics.join(", ")}.`,
  importance: 0.8,
  tags: ["competitive-intelligence", "market-insights"],
});
```

### 4. Analytics Layer Integration

Track competitive intelligence ROI:

```typescript
import { createCompetitorMonitor } from "@/aws/bedrock/competitive-intelligence";
import { PerformanceTracker } from "@/aws/bedrock/analytics";

const monitor = createCompetitorMonitor();
const tracker = new PerformanceTracker();

// Track analysis performance
const startTime = Date.now();
const analysis = await monitor.analyzeCompetitor(userId, competitorId);
const analysisTime = Date.now() - startTime;

await tracker.trackPerformance("competitive-intelligence", {
  executionTime: analysisTime,
  contentAnalyzed: analysis.metadata.contentAnalyzed,
  patternsFound: analysis.patterns.length,
  successRate: 1.0,
});
```

## API Integration

### Server Actions

Create server actions for Next.js integration:

```typescript
// src/app/actions/competitive-intelligence-actions.ts
"use server";

import { createCompetitorMonitor } from "@/aws/bedrock/competitive-intelligence";
import { getCurrentUser } from "@/aws/auth/cognito-client";

export async function addCompetitorAction(data: {
  name: string;
  businessType: "agent" | "team" | "brokerage";
  markets: string[];
  website?: string;
  socialProfiles?: Record<string, string>;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const monitor = createCompetitorMonitor();
  const competitor = await monitor.addCompetitor(user.userId, data);

  return { success: true, competitor };
}

export async function analyzeCompetitorAction(competitorId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const monitor = createCompetitorMonitor();
  const analysis = await monitor.analyzeCompetitor(user.userId, competitorId);

  return { success: true, analysis };
}

export async function getCompetitorsAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const monitor = createCompetitorMonitor();
  const competitors = await monitor.getCompetitors(user.userId);

  return { success: true, competitors };
}
```

### UI Components

Create React components for the Brand hub:

```typescript
// src/app/(app)/brand/competitors/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  getCompetitorsAction,
  analyzeCompetitorAction,
} from "@/app/actions/competitive-intelligence-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompetitors();
  }, []);

  async function loadCompetitors() {
    const result = await getCompetitorsAction();
    if (result.success) {
      setCompetitors(result.competitors);
    }
    setLoading(false);
  }

  async function analyzeCompetitor(competitorId: string) {
    const result = await analyzeCompetitorAction(competitorId);
    if (result.success) {
      // Show analysis results
      console.log("Analysis:", result.analysis);
    }
  }

  return (
    <div className="space-y-6">
      <h1>Competitor Analysis</h1>

      {competitors.map((competitor) => (
        <Card key={competitor.id}>
          <h3>{competitor.name}</h3>
          <p>
            {competitor.businessType} • {competitor.markets.join(", ")}
          </p>
          <Button onClick={() => analyzeCompetitor(competitor.id)}>
            Analyze
          </Button>
        </Card>
      ))}
    </div>
  );
}
```

## Database Schema

### DynamoDB Tables

The module uses the existing single-table design:

```typescript
// Competitor Record
{
    PK: "USER#user_123",
    SK: "COMPETITOR#comp_456",
    entityType: "CompetitorRecord",
    competitor: { /* Competitor data */ },
    latestAnalysis: { /* Analysis results */ },
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z"
}

// Content Record (with TTL)
{
    PK: "COMPETITOR#comp_456",
    SK: "CONTENT#2024-01-15T10:00:00Z#content_789",
    entityType: "CompetitorContentRecord",
    content: { /* Content data */ },
    createdAt: "2024-01-15T10:00:00Z",
    ttl: 1715774400  // 90 days from creation
}

// Analysis Record (with TTL)
{
    PK: "USER#user_123",
    SK: "ANALYSIS#2024-01-15T10:00:00Z",
    entityType: "CompetitiveAnalysisRecord",
    analysis: { /* Analysis data */ },
    createdAt: "2024-01-15T10:00:00Z",
    ttl: 1731590400  // 180 days from creation
}
```

### Query Patterns

```typescript
// Get all competitors for a user
query({
  PK: "USER#user_123",
  SK: { beginsWith: "COMPETITOR#" },
});

// Get all content for a competitor
query({
  PK: "COMPETITOR#comp_456",
  SK: { beginsWith: "CONTENT#" },
});

// Get all analyses for a user
query({
  PK: "USER#user_123",
  SK: { beginsWith: "ANALYSIS#" },
});
```

## Environment Configuration

No additional environment variables required. The module uses existing AWS configuration:

- `AWS_REGION`: AWS region for Bedrock and DynamoDB
- `USE_LOCAL_AWS`: Set to 'true' for LocalStack development
- Bedrock model: `anthropic.claude-3-5-sonnet-20241022-v2:0`

## Testing Integration

### Unit Tests

```typescript
// src/aws/bedrock/competitive-intelligence/__tests__/competitor-monitor.test.ts
import { createCompetitorMonitor } from "../competitor-monitor";

describe("CompetitorMonitor", () => {
  let monitor: ReturnType<typeof createCompetitorMonitor>;

  beforeEach(() => {
    monitor = createCompetitorMonitor();
  });

  it("should add a competitor", async () => {
    const competitor = await monitor.addCompetitor("user_123", {
      name: "Test Competitor",
      businessType: "agent",
      markets: ["Austin, TX"],
    });

    expect(competitor.id).toBeDefined();
    expect(competitor.name).toBe("Test Competitor");
  });

  // More tests...
});
```

### Integration Tests

```typescript
// Test with LocalStack
describe("CompetitorMonitor Integration", () => {
  it("should persist and retrieve competitors", async () => {
    const monitor = createCompetitorMonitor();

    const competitor = await monitor.addCompetitor("user_123", {
      name: "Test Competitor",
      businessType: "agent",
      markets: ["Austin, TX"],
    });

    const competitors = await monitor.getCompetitors("user_123");
    expect(competitors).toHaveLength(1);
    expect(competitors[0].id).toBe(competitor.id);
  });
});
```

## Deployment Considerations

### Performance

- **Batch Operations**: Use `analyzeMultipleCompetitors()` for parallel analysis
- **Caching**: Latest analysis cached in competitor record
- **TTL Cleanup**: Automatic cleanup reduces storage costs

### Monitoring

Track these metrics:

- Analysis execution time
- Content volume per competitor
- Pattern identification success rate
- AI token usage and costs
- Storage usage

### Cost Optimization

- Content TTL: 90 days (configurable)
- Analysis TTL: 180 days (configurable)
- Batch AI calls to reduce invocations
- Cache analysis results

### 3. Differentiation Engine Integration (Task 23 - COMPLETED)

The Differentiation Engine generates positioning strategies and recommendations:

```typescript
import { createDifferentiationEngine } from "@/aws/bedrock/competitive-intelligence";

const engine = createDifferentiationEngine();
const monitor = createCompetitorMonitor();
const gapAnalyzer = createGapAnalyzer();

// Get competitive data
const competitorAnalyses = await monitor.analyzeMultipleCompetitors(
  userId,
  competitorIds
);
const gaps = await gapAnalyzer.analyzeGaps(agentSummary, competitorAnalyses);

// Define agent profile
const agentProfile = {
  userId,
  name: "Sarah Johnson",
  markets: ["Austin", "Round Rock"],
  specializations: ["Luxury Homes", "First-Time Buyers"],
  uniqueSellingPoints: ["Interior design expertise"],
  targetAudience: ["Young professionals"],
  experience: 8,
};

// Generate differentiation strategy
const strategy = await engine.generateStrategy(
  agentProfile,
  agentSummary,
  competitorAnalyses,
  gaps,
  advantages
);

// Use strategy for content planning
console.log("Positioning:", strategy.positioning);
console.log("Content Recommendations:", strategy.contentRecommendations);
```

**Integration Points:**

- Uses CompetitorMonitor analyses
- Uses GapAnalyzer gaps
- Generates actionable strategies
- Provides content recommendations
- Defines success metrics

## Future Enhancements

Planned integrations:

1. **Automated Content Discovery**: Web scraping and API integrations
2. **Real-time Monitoring**: Webhook-based updates
3. **Benchmark Tracking**: Performance comparison (Task 24)
4. **Advantage Capitalization**: Leverage advantages (Task 25)
5. **Strategy Performance Tracking**: Monitor strategy effectiveness
6. **Multi-Strategy Generation**: Generate multiple strategic options

## Support

For questions or issues:

- Review the README: `src/aws/bedrock/competitive-intelligence/README.md`
- Check examples: `src/aws/bedrock/competitive-intelligence/competitor-monitor-example.ts`
- See design doc: `.kiro/specs/agentstrands-enhancement/design.md`
- Review requirements: `.kiro/specs/agentstrands-enhancement/requirements.md`

## Conclusion

The Competitive Intelligence module is designed for seamless integration with the existing Bayon Coagent platform and other AgentStrands enhancement modules. Follow this guide to integrate competitor monitoring into your workflows and leverage competitive insights to improve agent performance.
