# Strand Specialization System

The Strand Specialization System enables the creation and management of specialized agent strands that are optimized for specific domains, agents, content types, or geographic regions.

## Overview

This system implements Requirements 3.1-3.5 from the AgentStrands Enhancement specification:

- **3.1**: Market-specific strand creation
- **3.2**: Agent-specific strand development
- **3.3**: Content-type routing logic
- **3.4**: Geographic specialization
- **3.5**: Automatic specialization detection

## Key Components

### StrandSpecializationManager

The main manager class that handles:

- Creating specialized strand variants
- Determining when specialization would improve performance
- Routing tasks to the most appropriate specialist
- Pruning unused specialized strands

### Specialization Types

1. **Market Specialization** (Requirement 3.1)

   - Luxury properties
   - First-time buyers
   - Investment properties
   - Commercial real estate

2. **Agent-Specific Specialization** (Requirement 3.2)

   - Learns individual agent's writing style
   - Adapts to tone and vocabulary preferences
   - Maintains content patterns

3. **Content-Type Specialization** (Requirement 3.3)

   - Blog posts
   - Social media
   - Listing descriptions
   - Email campaigns

4. **Geographic Specialization** (Requirement 3.4)
   - Local market knowledge
   - Neighborhood expertise
   - Regional preferences

## Usage

### Basic Usage

```typescript
import {
  getSpecializationManager,
  createMarketSpecialization,
  PREDEFINED_MARKET_SPECIALIZATIONS,
} from "@/aws/bedrock/specialization";
import { getAgentCore } from "@/aws/bedrock/agent-core";

// Get the specialization manager
const manager = getSpecializationManager();

// Get a base strand
const agentCore = getAgentCore();
const baseStrand = agentCore.getStrandsByType("content-generator")[0];

// Create a luxury market specialization
const luxuryConfig = createMarketSpecialization(
  PREDEFINED_MARKET_SPECIALIZATIONS.luxury
);

const specializedStrand = await manager.createSpecializedStrand(
  baseStrand,
  luxuryConfig
);
```

### Routing Tasks to Specialists

```typescript
import { createWorkerTask } from "@/aws/bedrock/worker-protocol";

// Create a task
const task = createWorkerTask({
  type: "content-generator",
  description: "Create a luxury listing description",
  input: {
    propertyType: "estate",
    price: 5000000,
    features: ["pool", "wine-cellar", "home-theater"],
  },
});

// Define task context
const context = {
  userId: "user123",
  agentProfile: {
    id: "agent456",
    marketFocus: "luxury",
    location: "Beverly Hills, CA",
  },
  contentType: "listing-description",
};

// Get the best specialist for this task
const decision = await manager.getSpecialistStrand(task, context);

console.log(`Selected: ${decision.selectedStrand.id}`);
console.log(`Reason: ${decision.reason}`);
console.log(`Confidence: ${decision.confidence}`);
```

### Creating Custom Specializations

```typescript
import {
  createAgentSpecificSpecialization,
  createContentTypeSpecialization,
  createGeographicSpecialization,
} from "@/aws/bedrock/specialization";

// Agent-specific specialization
const agentConfig = createAgentSpecificSpecialization({
  agentId: "agent123",
  stylePreferences: {
    tone: "professional-friendly",
    vocabulary: ["exceptional", "stunning", "remarkable"],
    avoidWords: ["cheap", "basic", "simple"],
    sentenceStructure: "varied",
  },
  contentPatterns: {
    openingStyle: "attention-grabbing-question",
    closingStyle: "strong-call-to-action",
    callToActionStyle: "urgent-but-not-pushy",
  },
  performanceHistory: [],
});

// Content-type specialization
const contentConfig = createContentTypeSpecialization({
  contentType: "video-script",
  format: "short-form",
  bestPractices: [
    "hook in first 3 seconds",
    "visual storytelling",
    "platform-specific length",
  ],
  templates: ["property-tour", "market-update", "agent-intro"],
  optimizationRules: {
    maxDuration: 60,
    includeSubtitles: true,
    callToActionTiming: "end",
  },
});

// Geographic specialization
const geoConfig = createGeographicSpecialization({
  region: "San Francisco Bay Area",
  localKnowledge: {
    neighborhoods: ["Pacific Heights", "Marina District", "Noe Valley"],
    schools: ["Lowell High School", "SOTA"],
    amenities: ["Golden Gate Park", "Ferry Building", "Presidio"],
    marketTrends: {
      avgPricePerSqFt: 1200,
      inventoryLevel: "low",
      daysOnMarket: 15,
    },
  },
  regionalPreferences: {
    language: "en-US",
    culturalNotes: ["tech-savvy audience", "sustainability-focused"],
  },
});
```

### Automatic Specialization Detection

```typescript
// Check if a strand should be specialized based on performance
const performanceData = [
  {
    timestamp: "2024-01-01T00:00:00Z",
    tasksCompleted: 10,
    successRate: 0.9,
    avgQualityScore: 0.85,
    avgExecutionTime: 2000,
    userSatisfaction: 0.8,
  },
  // ... more performance snapshots
];

const decision = manager.shouldSpecialize("strand_123", performanceData);

if (decision.shouldSpecialize) {
  console.log(`Should specialize: ${decision.reason}`);
  console.log(
    `Expected benefit: ${decision.expectedBenefit?.qualityImprovement}% quality improvement`
  );

  if (decision.suggestedConfig) {
    const specialized = await manager.createSpecializedStrand(
      baseStrand,
      decision.suggestedConfig
    );
  }
}
```

### Pruning Unused Specialists

```typescript
// Prune specialists that haven't been used recently
const prunedIds = await manager.pruneUnusedSpecialists();

console.log(`Pruned ${prunedIds.length} unused specialists`);
```

### Updating Performance

```typescript
// After a task completes, update the specialization performance
manager.updateSpecializationPerformance("specialized_strand_123", {
  timestamp: new Date().toISOString(),
  tasksCompleted: 1,
  successRate: 1.0,
  avgQualityScore: 0.92,
  avgExecutionTime: 1800,
  userSatisfaction: 0.95,
});
```

## Configuration

The specialization manager can be configured with custom settings:

```typescript
const manager = getSpecializationManager({
  minTasksForSpecialization: 30, // Require more tasks before specializing
  minPerformanceImprovement: 15, // Require 15% improvement
  maxSpecializationsPerBase: 10, // Allow more specializations
  minUtilizationRate: 0.05, // Lower threshold for pruning
  pruneAfterDays: 60, // Keep specialists longer
  autoDetectSpecializations: true, // Enable auto-detection
});
```

## Performance Tracking

Each specialized strand tracks its performance compared to the base strand:

```typescript
const specialized = manager.getSpecializedStrand("specialized_strand_123");

if (specialized) {
  const perf = specialized.specializationPerformance;

  console.log("Performance vs Base:");
  console.log(`Quality: +${perf.comparisonToBase.qualityImprovement}%`);
  console.log(`Speed: ${perf.comparisonToBase.speedChange}%`);
  console.log(
    `Satisfaction: +${perf.comparisonToBase.satisfactionImprovement}%`
  );
  console.log(`Utilization: ${(perf.utilizationRate * 100).toFixed(1)}%`);
}
```

## Integration with AgentCore

The specialization system integrates seamlessly with AgentCore:

```typescript
import { getAgentCore } from "@/aws/bedrock/agent-core";
import { getSpecializationManager } from "@/aws/bedrock/specialization";

const agentCore = getAgentCore();
const specManager = getSpecializationManager();

// Create specialized strands for all base strands
const baseStrands = agentCore.getAllStrands();

for (const baseStrand of baseStrands) {
  // Create market specializations
  for (const marketType of ["luxury", "first-time-buyers", "investment"]) {
    const config = getMarketSpecialization(marketType);
    await specManager.createSpecializedStrand(baseStrand, config);
  }
}

// When allocating tasks, use the specialization manager
const task = createWorkerTask({
  type: "content-generator",
  description: "Create content",
  input: {},
});

const context = {
  userId: "user123",
  agentProfile: { id: "agent456", marketFocus: "luxury" },
};

const decision = await specManager.getSpecialistStrand(task, context);
const selectedStrand = decision.selectedStrand;

// Use the selected strand with AgentCore
// ... execute task with selectedStrand
```

## Best Practices

1. **Start with predefined specializations**: Use the built-in market and content-type specializations before creating custom ones.

2. **Monitor performance**: Regularly check specialization performance to ensure they're providing value.

3. **Prune regularly**: Run `pruneUnusedSpecialists()` periodically to clean up unused specialists.

4. **Use context effectively**: Provide rich context when routing tasks to get the best specialist match.

5. **Let the system learn**: Enable auto-detection to let the system identify specialization opportunities.

6. **Balance specialization**: Don't over-specialize - too many specialists can increase complexity without benefit.

## Testing

The specialization system includes comprehensive property-based tests:

```bash
npm test -- specialization
```

See the test files for examples of property-based testing with fast-check.

## Future Enhancements

- Machine learning-based specialization detection
- Cross-specialization (e.g., luxury + geographic)
- Dynamic specialization merging
- Specialization recommendation engine
- Performance prediction models
