# Personalization Layer

The Personalization Layer provides comprehensive personalization capabilities for the Kiro AI Assistant, ensuring that all AI-generated responses are tailored to each agent's unique profile, market, specialization, and communication style.

## Overview

The personalization layer implements the following requirements:

- **Requirement 3.1**: Profile injection for all AI flows
- **Requirement 3.2**: Market prioritization for property suggestions
- **Requirement 3.3**: Specialization and core principle integration
- **Requirement 3.4**: Tone matching
- **Requirement 3.5**: Profile update propagation

## Features

### 1. Profile Injection for AI Flows

All worker agents (Data Analyst, Content Generator, Market Forecaster) automatically load and incorporate agent profiles when a `userId` is provided in the task context.

**Implementation:**

- Worker agents check for `task.context?.userId`
- If present, they load the agent profile from `AgentProfileRepository`
- Profile data is passed to AI prompts for personalization

**Example:**

```typescript
import { executeDataAnalystWorker } from "@/aws/bedrock/workers";

const task = {
  id: "task_123",
  type: "data-analyst",
  description: "Analyze market trends",
  input: { query: "What are the trends in Austin?", dataSource: "tavily" },
  context: { userId: "user_123" }, // Profile will be loaded automatically
  // ...
};

const result = await executeDataAnalystWorker(task);
```

### 2. Market Prioritization

Prioritizes property suggestions based on the agent's primary market and specialization.

**Functions:**

#### `prioritizeByMarket(properties, agentProfile)`

Prioritizes properties by market relevance, returning primary and secondary market properties.

```typescript
import { prioritizeByMarket } from "@/aws/bedrock/personalization";

const result = prioritizeByMarket(properties, agentProfile);

console.log(result.primaryMarketProperties); // Properties in agent's primary market
console.log(result.secondaryMarketProperties); // Other properties
console.log(result.primaryMarketCount); // Count of primary market properties
```

#### `filterByPrimaryMarket(properties, agentProfile, minRelevanceScore?)`

Filters properties to only include those in the agent's primary market.

```typescript
import { filterByPrimaryMarket } from "@/aws/bedrock/personalization";

const filtered = filterByPrimaryMarket(properties, agentProfile, 40);
// Returns only properties with relevance score >= 40
```

#### `prioritizeProperties(properties, agentProfile)`

Combines market prioritization and specialization ranking for comprehensive sorting.

```typescript
import { prioritizeProperties } from "@/aws/bedrock/personalization";

const prioritized = prioritizeProperties(properties, agentProfile);
// Returns properties sorted by combined market relevance (70%) + specialization match (30%)
```

**Market Relevance Scoring:**

- Primary market exact match: +50 points
- Market contains city/state: +20-40 points
- Specialization match: +30 points
- Price alignment with specialization: +20 points
- Maximum score: 100 points

### 3. Specialization and Core Principle Integration

Ensures content reflects the agent's specialization and core principle.

**Functions:**

#### `getSpecializationContext(agentProfile)`

Gets specialization-specific context including focus areas, target audience, and key messages.

```typescript
import { getSpecializationContext } from "@/aws/bedrock/personalization";

const context = getSpecializationContext(agentProfile);

console.log(context.focusAreas); // ['High-end properties', 'Exclusive neighborhoods', ...]
console.log(context.targetAudience); // 'High-net-worth individuals, executives, ...'
console.log(context.keyMessages); // ['Exceptional quality', 'Exclusive access', ...]
```

#### `injectSpecializationContext(content, agentProfile)`

Injects specialization and core principle into content if not already present.

```typescript
import { injectSpecializationContext } from "@/aws/bedrock/personalization";

const enhanced = injectSpecializationContext(originalContent, agentProfile);
// Adds specialization context at natural break points
```

#### `validateSpecializationAlignment(content, agentProfile)`

Validates that content reflects the agent's specialization and core principle.

```typescript
import { validateSpecializationAlignment } from "@/aws/bedrock/personalization";

const validation = validateSpecializationAlignment(content, agentProfile);

if (!validation.aligned) {
  console.log("Suggestions:", validation.suggestions);
}
```

#### `generateSpecializationRecommendations(agentProfile, context?)`

Generates specialization-specific recommendations for content creation.

```typescript
import { generateSpecializationRecommendations } from "@/aws/bedrock/personalization";

const recommendations = generateSpecializationRecommendations(agentProfile);
// Returns array of recommendations like:
// - 'Highlight premium features and exclusive amenities'
// - 'Emphasize privacy, security, and prestige'
```

**Specialization Types:**

- **luxury**: High-end properties, premium service, exclusivity
- **first-time-buyers**: Affordable homes, educational support, step-by-step guidance
- **investment**: ROI-focused, cash flow analysis, portfolio building
- **commercial**: Business properties, professional transactions, strategic locations
- **general**: Versatile expertise, comprehensive services

### 4. Tone Matching

Ensures AI responses match the agent's preferred communication tone.

**Functions:**

#### `getToneProfile(tone)`

Gets detailed tone profile with characteristics and vocabulary indicators.

```typescript
import { getToneProfile } from "@/aws/bedrock/personalization";

const profile = getToneProfile("warm-consultative");

console.log(profile.characteristics); // ['Friendly and approachable', ...]
console.log(profile.vocabularyIndicators); // ['happy to', 'excited to', ...]
console.log(profile.formalityLevel); // 'semi-formal'
```

#### `detectTone(content)`

Detects the tone of content with confidence scores.

```typescript
import { detectTone } from "@/aws/bedrock/personalization";

const detection = detectTone(content);

console.log(detection.tone); // 'warm-consultative' | 'direct-data-driven' | 'professional' | 'casual' | 'mixed' | 'unknown'
console.log(detection.confidence); // 0.0 - 1.0
console.log(detection.scores); // Scores for each tone
```

#### `validateTone(content, preferredTone)`

Validates that content matches the preferred tone.

```typescript
import { validateTone } from "@/aws/bedrock/personalization";

const validation = validateTone(content, agentProfile.preferredTone);

if (!validation.matches) {
  console.log("Detected tone:", validation.detectedTone);
  console.log("Suggestions:", validation.suggestions);
}
```

#### `getTonePromptInstructions(preferredTone)`

Gets tone-specific instructions for AI prompts.

```typescript
import { getTonePromptInstructions } from "@/aws/bedrock/personalization";

const instructions = getTonePromptInstructions(agentProfile.preferredTone);
// Returns formatted instructions to include in system prompts
```

**Tone Types:**

- **warm-consultative**: Friendly, empathetic, relationship-focused
- **direct-data-driven**: Factual, analytical, numbers-focused
- **professional**: Polished, formal, expertise-focused
- **casual**: Approachable, conversational, relatable

### 5. Profile Update Propagation

Ensures profile updates are immediately reflected in subsequent AI responses.

**Implementation:**

- `AgentProfileRepository.updateProfile()` automatically invalidates the cache
- Next request fetches fresh profile data
- No manual cache clearing needed in most cases

**Functions:**

#### `validateProfileUpdatePropagation(userId, expectedUpdates)`

Validates that profile updates are immediately available (useful for testing).

```typescript
import { validateProfileUpdatePropagation } from "@/aws/bedrock/personalization";

const validation = await validateProfileUpdatePropagation(userId, {
  preferredTone: "casual",
  primaryMarket: "Denver, CO",
});

console.log(validation.success); // true if all updates applied
console.log(validation.appliedUpdates); // ['preferredTone', 'primaryMarket']
```

#### `createProfileUpdateEvent(userId, previousProfile, updates)`

Creates a profile update event for logging/tracking.

```typescript
import { createProfileUpdateEvent } from "@/aws/bedrock/personalization";

const event = createProfileUpdateEvent(userId, previousProfile, updates);
// Use for audit logging or analytics
```

#### `getProfileUpdateRecommendations(agentProfile, usageContext?)`

Gets recommendations for profile updates based on usage patterns.

```typescript
import { getProfileUpdateRecommendations } from "@/aws/bedrock/personalization";

const recommendations = getProfileUpdateRecommendations(agentProfile, {
  marketsQueried: ["Denver, CO", "Boulder, CO", "Fort Collins, CO"],
  specializationMismatches: 8,
});

// Returns suggestions like:
// - 'Consider updating primary market - you frequently query: Denver, CO, Boulder, CO'
```

## Integration with Worker Agents

### Data Analyst Worker

The Data Analyst Worker uses agent profile to:

- Prioritize search results for the agent's primary market
- Include market context in analysis
- Align insights with agent's specialization

### Content Generator Worker

The Content Generator Worker uses agent profile to:

- Incorporate agent name, market, and core principle
- Match the preferred tone
- Reflect specialization in content
- Generate personalized, client-facing content

### Market Forecaster Worker

The Market Forecaster Worker uses agent profile to:

- Tailor forecasts to the agent's primary market
- Align recommendations with specialization
- Include qualifying language appropriate for the tone

## Usage Examples

### Complete Workflow Example

```typescript
import { getAgentProfileRepository } from "@/aws/dynamodb/agent-profile-repository";
import { executeContentGeneratorWorker } from "@/aws/bedrock/workers";
import {
  validateTone,
  validateSpecializationAlignment,
} from "@/aws/bedrock/personalization";

// 1. Load agent profile
const profileRepo = getAgentProfileRepository();
const agentProfile = await profileRepo.getProfile(userId);

// 2. Generate content with profile
const task = {
  id: "task_123",
  type: "content-generator",
  description: "Generate listing description",
  input: {
    contentType: "listing",
    context: { property: propertyData },
    agentProfile, // Profile is passed directly
  },
  context: { userId },
  // ...
};

const result = await executeContentGeneratorWorker(task);

// 3. Validate personalization
const toneValidation = validateTone(
  result.output.content,
  agentProfile.preferredTone
);
const specializationValidation = validateSpecializationAlignment(
  result.output.content,
  agentProfile
);

if (!toneValidation.matches) {
  console.warn("Tone mismatch:", toneValidation.suggestions);
}

if (!specializationValidation.aligned) {
  console.warn(
    "Specialization not reflected:",
    specializationValidation.suggestions
  );
}
```

### Property Prioritization Example

```typescript
import { prioritizeProperties } from "@/aws/bedrock/personalization";
import { getAgentProfileRepository } from "@/aws/dynamodb/agent-profile-repository";

// Load profile
const profileRepo = getAgentProfileRepository();
const agentProfile = await profileRepo.getProfile(userId);

// Get properties from MLS or other source
const properties = await fetchProperties();

// Prioritize based on agent's market and specialization
const prioritized = prioritizeProperties(properties, agentProfile);

// Display top matches
console.log("Top 5 matches for", agentProfile.agentName);
prioritized.slice(0, 5).forEach((property, index) => {
  console.log(`${index + 1}. ${property.address}`);
  console.log(`   Market Relevance: ${property.marketRelevanceScore}/100`);
  console.log(
    `   Specialization Match: ${property.specializationMatch ? "Yes" : "No"}`
  );
});
```

### Profile Update Example

```typescript
import { getAgentProfileRepository } from "@/aws/dynamodb/agent-profile-repository";
import { validateProfileUpdatePropagation } from "@/aws/bedrock/personalization";

const profileRepo = getAgentProfileRepository();

// Update profile
await profileRepo.updateProfile(userId, {
  preferredTone: "casual",
  primaryMarket: "Denver, CO",
});

// Validate updates are immediately available
const validation = await validateProfileUpdatePropagation(userId, {
  preferredTone: "casual",
  primaryMarket: "Denver, CO",
});

if (validation.success) {
  console.log("Profile updates applied successfully");
} else {
  console.error("Missing updates:", validation.missingUpdates);
}

// Next AI request will use updated profile automatically
```

## Testing

### Unit Tests

Test individual personalization functions:

```typescript
import {
  calculateMarketRelevance,
  detectTone,
  validateSpecializationAlignment,
} from "@/aws/bedrock/personalization";

describe("Market Prioritization", () => {
  it("should score primary market properties highly", () => {
    const property = {
      id: "1",
      market: "Austin, TX",
      city: "Austin",
      state: "TX",
      // ...
    };

    const agentProfile = {
      primaryMarket: "Austin, TX",
      // ...
    };

    const score = calculateMarketRelevance(property, agentProfile);
    expect(score).toBeGreaterThanOrEqual(50);
  });
});

describe("Tone Detection", () => {
  it("should detect warm-consultative tone", () => {
    const content =
      "I'm happy to help you find the perfect home for your family!";
    const detection = detectTone(content);

    expect(detection.tone).toBe("warm-consultative");
    expect(detection.confidence).toBeGreaterThan(0.5);
  });
});
```

### Integration Tests

Test personalization in complete workflows:

```typescript
import { executeContentGeneratorWorker } from "@/aws/bedrock/workers";
import { validateTone } from "@/aws/bedrock/personalization";

describe("Content Generation with Personalization", () => {
  it("should generate content matching agent tone", async () => {
    const task = {
      // ... task setup with agentProfile
    };

    const result = await executeContentGeneratorWorker(task);
    const validation = validateTone(
      result.output.content,
      agentProfile.preferredTone
    );

    expect(validation.matches).toBe(true);
  });
});
```

## Performance Considerations

### Caching

- Agent profiles are cached for 5 minutes in `AgentProfileRepository`
- Cache is automatically invalidated on profile updates
- Profile retrieval target: < 500ms (p95)

### Optimization Tips

1. **Batch Property Prioritization**: Prioritize properties in batches rather than one at a time
2. **Reuse Profile**: Load profile once per request, pass to all workers
3. **Lazy Loading**: Only load profile when personalization is needed
4. **Monitor Performance**: Use `AgentProfileRepository.getPerformanceStats()` to track retrieval times

## Requirements Validation

This implementation satisfies the following requirements:

- ✅ **Requirement 3.1**: Profile injection for all AI flows
- ✅ **Requirement 3.2**: Market prioritization for property suggestions
- ✅ **Requirement 3.3**: Specialization and core principle integration
- ✅ **Requirement 3.4**: Tone matching
- ✅ **Requirement 3.5**: Profile update propagation

## Future Enhancements

1. **Machine Learning**: Use ML to improve market relevance scoring based on user feedback
2. **A/B Testing**: Test different personalization strategies
3. **Analytics**: Track personalization effectiveness metrics
4. **Multi-Market Support**: Support agents with multiple primary markets
5. **Dynamic Tone Adjustment**: Adjust tone based on content type and audience
6. **Personalization Templates**: Pre-built templates for common use cases

## Related Documentation

- [Agent Profile Repository](../dynamodb/agent-profile-repository.ts)
- [Worker Agents](./workers/README.md)
- [Workflow Orchestrator](./ORCHESTRATOR_README.md)
- [Design Document](../../.kiro/specs/kiro-ai-assistant/design.md)
