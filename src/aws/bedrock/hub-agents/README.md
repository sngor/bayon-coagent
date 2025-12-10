# Hub Agent Registry

A performance-optimized, extensible registry for managing specialized AI agents across different hubs in the Bayon Coagent platform.

## 🚀 Features

- **Performance Optimized**: O(1) lookups with caching and indexing
- **Configurable Scoring**: Multiple scoring strategies for agent recommendations
- **Type Safe**: Full TypeScript support with strict typing
- **Extensible**: Easy to add new agents and scoring algorithms
- **Well Tested**: Comprehensive test coverage
- **Production Ready**: Error handling, validation, and monitoring

## 📁 Architecture

```
hub-agents/
├── hub-agent-registry.ts    # Main registry class
├── agent-configs.ts         # Agent configuration data
├── agent-cache.ts          # Performance caching layer
├── agent-scoring.ts        # Scoring strategies
├── examples/               # Usage examples
├── __tests__/             # Test files
└── README.md              # This file
```

## 🎯 Hub Agents

The registry manages 7 specialized agents:

| Agent         | Hub       | Expertise           | Personality                             |
| ------------- | --------- | ------------------- | --------------------------------------- |
| **Maya**      | Studio    | Content Creation    | Creative, enthusiastic, detail-oriented |
| **Alex**      | Brand     | Brand Strategy      | Strategic, analytical, results-driven   |
| **Dr. Sarah** | Research  | Market Research     | Analytical, thorough, insightful        |
| **Marcus**    | Market    | Market Intelligence | Sharp, intuitive, opportunity-focused   |
| **David**     | Tools     | Financial Analysis  | Precise, methodical, numbers-focused    |
| **Emma**      | Library   | Content Curation    | Organized, helpful, knowledge-focused   |
| **Riley**     | Assistant | General Assistance  | Friendly, adaptable, supportive         |

## 🔧 Usage

### Basic Agent Lookup

```typescript
import { HubAgentRegistry } from "./hub-agent-registry";

// Get agent by type
const studioAgent = HubAgentRegistry.getAgent("studio-creative");

// Get agent by hub
const brandAgent = HubAgentRegistry.getAgentByHub("brand");

// Get agents by expertise
const contentExperts =
  HubAgentRegistry.getAgentsByExpertise("content-creation");
```

### Smart Recommendations

```typescript
import {
  HubAgentRegistry,
  type AgentRecommendationContext,
} from "./hub-agent-registry";

// Context-aware recommendation
const context: AgentRecommendationContext = {
  taskType: "generate-content",
  hubContext: "studio",
  expertiseRequired: ["content-creation", "copywriting"],
};

const agent = HubAgentRegistry.getRecommendedAgent(context);

// Multiple recommendations with scores
const recommendations = HubAgentRegistry.getAgentRecommendations(context, 3);
```

### Performance Optimization

```typescript
// Prioritize speed for urgent tasks
const urgentContext: AgentRecommendationContext = {
  taskType: "generate-content",
  prioritizePerformance: true,
};

// Prioritize quality for important analysis
const qualityContext: AgentRecommendationContext = {
  taskType: "research-query",
  prioritizeQuality: true,
};
```

### Custom Scoring Strategies

```typescript
import {
  PerformanceScoringStrategy,
  QualityScoringStrategy,
} from "./agent-scoring";

// Set custom scoring strategy
HubAgentRegistry.setScoringStrategy(new QualityScoringStrategy());

// Or create your own
class CustomScoringStrategy implements AgentScoringStrategy {
  calculateScore(agent: HubAgentConfig, context: any): number {
    // Your custom scoring logic
    return score;
  }
}
```

## 📊 Performance Features

### Caching Layer

- **O(1) Lookups**: Indexed access for hub, expertise, and task type queries
- **Recommendation Caching**: Memoized results for repeated queries
- **LRU Cache**: Automatic cache management with size limits

### Scoring Strategies

- **WeightedScoringStrategy**: Balanced scoring (default)
- **PerformanceScoringStrategy**: Optimizes for speed and concurrency
- **QualityScoringStrategy**: Optimizes for quality and reliability

### Benchmarks

- **1000+ recommendations/second**: Optimized for high-frequency usage
- **Sub-millisecond lookups**: Cached results return instantly
- **Memory efficient**: Minimal memory footprint with smart indexing

## 🧪 Testing

```bash
# Run tests
npm test hub-agent-registry

# Run with coverage
npm run test:coverage hub-agent-registry
```

### Test Coverage

- ✅ Basic agent operations
- ✅ Expertise-based lookups
- ✅ Smart recommendations
- ✅ Scoring strategies
- ✅ Performance benchmarks
- ✅ Error handling
- ✅ Cache behavior

## 📈 Analytics

```typescript
// Get registry statistics
const stats = HubAgentRegistry.getAgentStats();
console.log("Total agents:", stats.totalAgents);
console.log("Average quality:", stats.averageQualityScore);
console.log("Agents by hub:", stats.agentsByHub);
```

## 🔒 Validation

```typescript
// Validate agent configuration
const validation = HubAgentRegistry.validateAgentConfig(config);
if (!validation.valid) {
  console.error("Validation errors:", validation.errors);
}
```

## 🚀 Real-World Examples

### Content Creation Flow

```typescript
// User wants to create a blog post
const blogContext: AgentRecommendationContext = {
  taskType: "generate-content",
  hubContext: "studio",
  expertiseRequired: ["blog-posts", "content-creation"],
};

const agent = HubAgentRegistry.getRecommendedAgent(blogContext);
// Returns: Maya (Studio Creative Agent)
```

### Market Research Flow

```typescript
// User needs market analysis
const researchContext: AgentRecommendationContext = {
  taskType: "research-query",
  hubContext: "research",
  expertiseRequired: ["market-research"],
  prioritizeQuality: true,
};

const agent = HubAgentRegistry.getRecommendedAgent(researchContext);
// Returns: Dr. Sarah (Research Analyst)
```

### Deal Analysis Flow

```typescript
// User wants quick ROI calculation
const dealContext: AgentRecommendationContext = {
  taskType: "calculate-roi",
  hubContext: "tools",
  prioritizePerformance: true,
};

const agent = HubAgentRegistry.getRecommendedAgent(dealContext);
// Returns: David (Financial Analysis Expert)
```

## 🔧 Configuration

### Adding New Agents

1. Add configuration to `agent-configs.ts`
2. Update `HubAgentType` union type
3. Register in the static initializer
4. Add tests for the new agent

### Custom Scoring

1. Implement `AgentScoringStrategy` interface
2. Add scoring logic in `calculateScore` method
3. Set strategy using `setScoringStrategy`

## 🐛 Error Handling

The registry includes comprehensive error handling:

- **Validation**: Agent configuration validation
- **Fallbacks**: General assistant fallback for unmatched queries
- **Type Safety**: Strict TypeScript typing prevents runtime errors
- **Graceful Degradation**: System continues working even with partial failures

## 📚 API Reference

### HubAgentRegistry

#### Static Methods

- `getAgent(type)` - Get agent by type
- `getAgentByHub(hub)` - Get agent by hub name
- `getAgentsByExpertise(expertise)` - Get agents with specific expertise
- `getAgentsByTaskType(taskType)` - Get agents that handle task type
- `getRecommendedAgent(context)` - Get best agent for context
- `getAgentRecommendations(context, limit)` - Get multiple recommendations
- `setScoringStrategy(strategy)` - Set custom scoring strategy
- `getAgentStats()` - Get registry statistics
- `validateAgentConfig(config)` - Validate agent configuration

### Types

- `HubAgentType` - Union of all agent types
- `HubAgentConfig` - Agent configuration interface
- `AgentRecommendationContext` - Recommendation context
- `AgentScoringStrategy` - Scoring strategy interface

## 🔄 Migration Guide

If upgrading from the previous version:

1. **Import Changes**: Import from new module structure
2. **Method Signatures**: `getRecommendedAgent` now accepts context object
3. **Performance**: Automatic performance improvements (no code changes needed)
4. **New Features**: Access to scoring strategies and analytics

### Before

```typescript
const agent = HubAgentRegistry.getRecommendedAgent(
  "generate-content",
  "studio",
  ["content-creation"]
);
```

### After

```typescript
const agent = HubAgentRegistry.getRecommendedAgent({
  taskType: "generate-content",
  hubContext: "studio",
  expertiseRequired: ["content-creation"],
});

// Legacy signature still supported
const agent = HubAgentRegistry.getRecommendedAgent(
  "generate-content",
  "studio",
  ["content-creation"]
);
```

## 🤝 Contributing

1. Add new agents to `agent-configs.ts`
2. Update types in `hub-agent-registry.ts`
3. Add comprehensive tests
4. Update documentation
5. Run performance benchmarks

## 📄 License

Part of the Bayon Coagent platform. See main project license.
