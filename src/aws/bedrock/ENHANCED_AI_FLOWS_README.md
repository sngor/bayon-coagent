# Enhanced AI Flows - Multi-Agent Architecture

This document describes the enhanced AI flow architecture that provides more accurate, efficient, and sophisticated multi-agent coordination for complex tasks.

## Overview

The enhanced AI flows introduce a sophisticated multi-agent architecture with:

- **AgentCore**: Central coordination system for managing agent strands
- **Agent Strands**: Persistent agent contexts with memory and learning capabilities
- **Enhanced Orchestrator**: Intelligent workflow coordination with context sharing
- **Integration Layer**: Seamless adoption with backward compatibility

## Key Features

### 🧠 Agent Strands with Persistent Memory

Each agent maintains persistent context and learns from past executions:

```typescript
// Agent strands remember successful patterns and adapt over time
const dataAnalyst = new DataAnalystStrand(strand);
const result = await dataAnalyst.executeTask(task);
// The agent learns from this execution for future improvements
```

### 🎯 Intelligent Task Allocation

AgentCore automatically selects the best agent based on:

- Current performance metrics
- Capability matching
- Load balancing
- Historical success rates

```typescript
const agentCore = getAgentCore();
const bestAgent = await agentCore.allocateTask(task);
// Automatically selects optimal agent based on multiple factors
```

### 🔄 Context Sharing Between Agents

Agents can share insights and build on each other's work:

```typescript
// Data analyst findings are automatically shared with content generator
agentCore.shareContext(dataAnalystId, contentGeneratorId, {
  marketInsights: findings,
  confidence: 0.9,
});
```

### 📊 Adaptive Quality Management

Real-time quality assessment and adaptive execution:

```typescript
const result = await orchestrator.executeCompleteEnhancedWorkflow(
  prompt,
  profile,
  {
    qualityRequirements: {
      minimumConfidence: 0.8,
      requiresCitation: true,
      requiresPersonalization: true,
    },
    enableAdaptiveExecution: true,
  }
);
```

## Architecture Components

### 1. AgentCore

Central coordination system that manages all agent strands:

```typescript
import { getAgentCore } from "@/aws/bedrock";

const agentCore = getAgentCore();

// Get performance metrics
const metrics = agentCore.getAllStrands().map((strand) => ({
  type: strand.type,
  successRate: strand.metrics.successRate,
  avgExecutionTime: strand.metrics.avgExecutionTime,
  currentLoad: strand.metrics.currentLoad,
}));
```

### 2. Agent Strands

Specialized agents with persistent memory:

#### Data Analyst Strand

- Market analysis with trend recognition
- Statistical analysis with confidence scoring
- Learning from successful analysis patterns

#### Content Generator Strand

- Brand-consistent content creation
- Style learning and adaptation
- Personalization with agent profile integration

#### Market Forecaster Strand

- Prediction accuracy tracking
- Risk assessment with qualifying language
- Scenario-based forecasting

### 3. Enhanced Orchestrator

Intelligent workflow coordination:

```typescript
import { getEnhancedWorkflowOrchestrator } from "@/aws/bedrock";

const orchestrator = getEnhancedWorkflowOrchestrator();

const result = await orchestrator.executeCompleteEnhancedWorkflow(
  "Analyze the luxury real estate market in Miami and create a market report",
  agentProfile,
  {
    maxTasks: 4,
    priorityLevel: "high",
    qualityRequirements: {
      minimumConfidence: 0.85,
      requiresCitation: true,
    },
  }
);
```

## Usage Examples

### Enhanced Research Agent

```typescript
import { runEnhancedResearch } from "@/aws/bedrock";

const research = await runEnhancedResearch(
  "What are the current trends in the Miami luxury real estate market?",
  {
    researchDepth: "comprehensive",
    researchScope: {
      includeMarketData: true,
      includeTrendAnalysis: true,
      includeForecasting: true,
    },
    qualityRequirements: {
      minimumConfidence: 0.8,
      requiresCitation: true,
    },
  },
  agentProfile
);

console.log(research.researchReport);
console.log(research.keyFindings);
console.log(research.qualityMetrics);
```

### Enhanced Content Generation

```typescript
import { Content } from "@/aws/bedrock";

const content = await Content.generateContent(
  "market-update",
  "Create a market update for luxury properties in Miami",
  agentProfile,
  {
    includeMarketInsights: true,
    targetAudience: "investors",
    qualityRequirements: {
      minimumConfidence: 0.85,
      requiresPersonalization: true,
    },
  }
);

console.log(content.content);
console.log(content.qualityScore);
console.log(content.brandConsistency);
```

### Enhanced Market Analysis

```typescript
import { Market } from "@/aws/bedrock";

const analysis = await Market.analyzeMarket(
  "Analyze investment opportunities in Miami Beach condos",
  "Miami Beach",
  agentProfile,
  {
    includeForecasting: true,
    timeframe: "18 months",
    analysisDepth: "deep",
  }
);

console.log(analysis.analysis);
console.log(analysis.predictions);
console.log(analysis.opportunities);
```

## Integration with Existing Code

The enhanced flows are designed for seamless integration:

### Automatic Enhancement Detection

```typescript
import { FlowManager } from "@/aws/bedrock";

// Automatically uses multi-agent coordination when beneficial
const result = await FlowManager.executeFlow(
  "research",
  { query: "Complex market analysis query..." },
  agentProfile
);
```

### Backward Compatibility

```typescript
// Existing code continues to work unchanged
import { runResearchAgent } from "@/aws/bedrock/flows/run-research-agent";

const legacyResult = await runResearchAgent({ query: "Simple query" });

// Enhanced version provides additional capabilities
import { Research } from "@/aws/bedrock";

const enhancedResult = await Research.executeResearch(
  "Simple query",
  agentProfile,
  { enableMultiAgent: false } // Falls back to single-agent if needed
);
```

## Performance Monitoring

### Agent Metrics

```typescript
import { FlowManager } from "@/aws/bedrock";

const metrics = FlowManager.getAgentMetrics();

console.log("Overall Performance:", metrics.overallPerformance);
console.log("Agent Strands:", metrics.strands);
console.log("Recommendations:", metrics.recommendations);
```

### Quality Tracking

```typescript
// All enhanced flows return detailed quality metrics
const result = await runEnhancedResearch(query, options, profile);

console.log("Quality Metrics:", {
  overallQuality: result.qualityMetrics.overallQuality,
  confidenceLevel: result.qualityMetrics.confidenceLevel,
  completeness: result.qualityMetrics.completeness,
  factualAccuracy: result.qualityMetrics.factualAccuracy,
});
```

## Configuration

### Agent Strand Configuration

```typescript
import { getAgentCore } from "@/aws/bedrock";

const agentCore = getAgentCore();

// Configure allocation strategy
agentCore.setAllocationStrategy("hybrid"); // 'round-robin', 'load-balanced', 'capability-based', 'performance-based', 'hybrid'
```

### Quality Requirements

```typescript
const qualityRequirements = {
  minimumConfidence: 0.8, // Minimum confidence threshold
  requiresCitation: true, // Require source citations
  requiresPersonalization: true, // Require agent profile integration
  factCheckingLevel: "rigorous", // 'basic', 'standard', 'rigorous'
};
```

### Execution Preferences

```typescript
const executionPreferences = {
  priorityLevel: "high", // 'low', 'medium', 'high', 'critical'
  maxExecutionTime: 120000, // Maximum execution time in ms
  enableAdaptiveExecution: true, // Enable adaptive quality management
  contextSharingEnabled: true, // Enable context sharing between agents
};
```

## Best Practices

### 1. Use Multi-Agent for Complex Tasks

```typescript
// Good: Complex analysis benefits from multiple agents
const complexAnalysis = await FlowManager.executeFlow(
  "research",
  {
    query:
      "Comprehensive market analysis with forecasting and investment recommendations",
    researchDepth: "comprehensive",
  },
  agentProfile,
  { enableMultiAgent: true }
);

// Good: Simple queries can use single agents for speed
const simpleQuery = await FlowManager.executeFlow(
  "research",
  { query: "What is the average home price in Miami?" },
  agentProfile,
  { enableMultiAgent: false }
);
```

### 2. Set Appropriate Quality Requirements

```typescript
// High-stakes content requires higher quality thresholds
const criticalContent = await Content.generateContent(
  "client-communication",
  instructions,
  agentProfile,
  {
    qualityRequirements: {
      minimumConfidence: 0.9,
      requiresCitation: true,
      requiresPersonalization: true,
    },
    executionPreferences: {
      priorityLevel: "critical",
    },
  }
);
```

### 3. Monitor Agent Performance

```typescript
// Regular performance monitoring
setInterval(() => {
  const metrics = FlowManager.getAgentMetrics();

  if (metrics.overallPerformance.avgSuccessRate < 0.8) {
    console.warn("Agent performance below threshold:", metrics.recommendations);
  }
}, 300000); // Check every 5 minutes
```

### 4. Leverage Context Sharing

```typescript
// Enable context sharing for related tasks
const marketAnalysis = await Market.analyzeMarket(query, market, profile, {
  contextSharing: { enabled: true, shareWithFutureRequests: true },
});

// Subsequent content generation benefits from shared market context
const marketUpdate = await Content.generateContent(
  "market-update",
  "Create update based on recent analysis",
  profile,
  { includeMarketInsights: true } // Uses shared context
);
```

## Migration Guide

### Phase 1: Enable Enhanced Flows

```typescript
// Start using enhanced integration layer
import { Research, Content, Market } from "@/aws/bedrock";

// Replace existing calls gradually
// Old: runResearchAgent(input)
// New: Research.executeResearch(query, profile, options)
```

### Phase 2: Optimize Quality Requirements

```typescript
// Add quality requirements to critical flows
const options = {
  qualityRequirements: {
    minimumConfidence: 0.8,
    requiresCitation: true,
    requiresPersonalization: true,
  },
};
```

### Phase 3: Enable Multi-Agent Coordination

```typescript
// Enable multi-agent for complex tasks
const options = {
  enableMultiAgent: true,
  executionPreferences: {
    enableAdaptiveExecution: true,
  },
};
```

### Phase 4: Monitor and Optimize

```typescript
// Implement performance monitoring
const metrics = FlowManager.getAgentMetrics();
// Use metrics to optimize agent allocation and quality thresholds
```

## Troubleshooting

### Common Issues

1. **High Execution Time**: Check agent load balancing and consider increasing maxExecutionTime
2. **Low Quality Scores**: Review quality requirements and agent performance metrics
3. **Context Sharing Failures**: Verify context sharing is enabled and agents support the required context types

### Debug Mode

```typescript
// Enable detailed logging for debugging
const result = await runEnhancedResearch(
  query,
  {
    executionPreferences: {
      enableAdaptiveExecution: true,
      // Add debug logging in development
    },
  },
  profile
);

console.log("Execution Details:", result.executionDetails);
console.log("Agent Performance:", result.agentPerformance);
```

## Future Enhancements

- **Learning Optimization**: Automatic hyperparameter tuning based on performance
- **Cross-Session Memory**: Persistent learning across user sessions
- **Advanced Context Sharing**: Semantic context matching and transformation
- **Real-time Adaptation**: Dynamic workflow modification based on intermediate results
- **Performance Prediction**: Predictive modeling for execution time and quality

---

For more information, see the individual component documentation in their respective files.
