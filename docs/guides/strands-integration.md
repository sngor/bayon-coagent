# Strands Integration Implementation Guide

## Overview

This guide outlines the complete integration of Strands agents into the Bayon Coagent platform, following established architectural patterns and best practices.

## ✅ Completed Improvements

### 1. **Architecture & Design Patterns**

- **Factory Pattern**: `agent-factory.ts` - Centralized agent configuration management
- **Strategy Pattern**: `base-executor.ts` - Reusable execution logic for all agent types
- **Repository Pattern**: Integration with existing DynamoDB repository
- **Singleton Pattern**: Agent instance management following AWS client patterns

### 2. **Performance Optimizations**

- **Caching Layer**: `cache-manager.ts` - In-memory caching with TTL and cleanup
- **Connection Pooling**: Reusable executor instances
- **Retry Logic**: Exponential backoff for failed requests
- **Timeout Management**: Proper process cleanup and resource management

### 3. **Error Handling & Reliability**

- **Graceful Fallbacks**: Automatic fallback to Bedrock agents
- **Comprehensive Error Types**: Specific error messages for different failure modes
- **Health Monitoring**: Built-in health check functionality
- **Input Validation**: Zod schema validation at all layers

### 4. **Integration with Existing Patterns**

- **Server Actions**: `strands-actions.ts` - Follows established action patterns
- **React Hooks**: `use-strands-research.ts` - Consistent with existing hook patterns
- **Component Architecture**: `strands-research-form.tsx` - Uses shadcn/ui components
- **Schema Compatibility**: Maintains compatibility with existing Bedrock interfaces

## 🚀 Implementation Steps

### Step 1: Install Dependencies

```bash
# No additional dependencies required - uses existing tech stack
npm run typecheck  # Verify TypeScript compilation
```

### Step 2: Environment Configuration

Add to your `.env.local`:

```env
# Strands Agent Configuration
STRANDS_ENABLED=true
STRANDS_CACHE_TTL=600000  # 10 minutes
STRANDS_MAX_RETRIES=2
```

### Step 3: Python Agent Setup

1. Ensure Python 3.8+ is installed
2. Install required Python packages:

```bash
cd src/services/strands
pip install -r requirements.txt  # Create this file with dependencies
```

### Step 4: Integration Points

#### Research Hub Integration

```typescript
// In your research page component
import { StrandsResearchForm } from "@/components/research/strands-research-form";

export default function ResearchAgentPage() {
  return (
    <div className="space-y-6">
      <StrandsResearchForm
        onResult={(result) => {
          // Handle research completion
          console.log("Research completed:", result);
        }}
      />
    </div>
  );
}
```

#### Server Action Usage

```typescript
// In your form submission handler
import { executeResearchAction } from "@/app/strands-actions";

const handleResearch = async (formData: FormData) => {
  const result = await executeResearchAction({
    topic: formData.get("topic") as string,
    searchDepth: "advanced",
    includeMarketAnalysis: true,
    saveToLibrary: true,
  });

  if (result.success) {
    // Handle success
    router.push(`/library/reports/${result.data?.reportId}`);
  }
};
```

## 📊 Monitoring & Health Checks

### Health Check Endpoint

```typescript
// Add to your API routes
import { checkStrandsHealthAction } from "@/app/strands-actions";

export async function GET() {
  const health = await checkStrandsHealthAction();
  return Response.json(health);
}
```

### Performance Monitoring

```typescript
// Monitor cache performance
import { getCacheManager } from "@/services/strands/cache-manager";

const cacheStats = getCacheManager("research").getStats();
console.log("Cache hit rate:", cacheStats);
```

## 🔧 Configuration Options

### Agent Configuration

```typescript
// Customize agent behavior in agent-factory.ts
export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
  research: {
    type: "research",
    scriptPath: "src/services/strands/research-agent.py",
    timeout: 120000, // Adjust based on needs
    maxRetries: 2, // Adjust retry behavior
  },
  // Add other agent types...
};
```

### Cache Configuration

```typescript
// Customize caching behavior
const cacheManager = getCacheManager("research", {
  defaultTtl: 600000, // 10 minutes
  maxSize: 50, // Max cached items
  cleanupInterval: 60000, // Cleanup frequency
});
```

## 🎯 Hub Integration Points

### Studio Hub - Content Creation

```typescript
// Future: Integrate Strands content agent
import { executeContentAction } from "@/app/strands-actions";

const generateContent = async (type: "blog" | "social" | "email") => {
  const result = await executeContentAction({
    contentType: type,
    topic: "market trends",
    targetAudience: "first-time buyers",
  });
};
```

### Brand Hub - Listing Descriptions

```typescript
// Future: Integrate Strands listing agent
import { executeListingAction } from "@/app/strands-actions";

const generateListing = async (propertyData: PropertyData) => {
  const result = await executeListingAction({
    propertyDetails: propertyData,
    targetPersona: "growing-family",
    competitiveAnalysis: true,
  });
};
```

## 🔒 Security Considerations

### Input Sanitization

- All inputs validated with Zod schemas
- Maximum length limits on text inputs
- User authentication required for all actions

### Process Security

- Python processes run with limited permissions
- Timeout protection prevents resource exhaustion
- Error messages don't expose sensitive information

### Data Privacy

- User data isolated by userId
- Cache keys exclude sensitive information
- Research results can be shared across users (topic-based caching)

## 📈 Performance Benchmarks

### Expected Performance

- **Cache Hit**: ~50ms response time
- **Cache Miss**: 30-120 seconds (depending on research complexity)
- **Fallback to Bedrock**: Additional 10-30 seconds
- **Memory Usage**: ~10MB per cached result

### Optimization Recommendations

1. **Preload Common Queries**: Cache frequently requested topics
2. **Background Processing**: Consider queue-based processing for long research
3. **CDN Integration**: Cache static research content
4. **Database Indexing**: Optimize report queries in DynamoDB

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Test agent execution
import { ResearchAgentExecutor } from "@/services/strands/research-agent-service";

describe("ResearchAgentExecutor", () => {
  it("should execute research successfully", async () => {
    const executor = new ResearchAgentExecutor();
    const result = await executor.execute({
      topic: "test topic",
      userId: "test-user",
    });
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests

```typescript
// Test server actions
import { executeResearchAction } from "@/app/strands-actions";

describe("Research Actions", () => {
  it("should save research to library", async () => {
    const result = await executeResearchAction({
      topic: "Austin real estate trends",
      saveToLibrary: true,
    });
    expect(result.data?.reportId).toBeDefined();
  });
});
```

## 🚨 Troubleshooting

### Common Issues

1. **Python Process Fails**

   - Check Python installation and dependencies
   - Verify script permissions
   - Check environment variables

2. **Cache Issues**

   - Monitor memory usage
   - Check cleanup intervals
   - Verify TTL settings

3. **Fallback Not Working**
   - Ensure Bedrock agents are properly configured
   - Check import paths
   - Verify schema compatibility

### Debug Mode

```typescript
// Enable debug logging
process.env.STRANDS_DEBUG = "true";
```

## 🔄 Migration Path

### Phase 1: Research Agent (Current)

- ✅ Strands research agent with Bedrock fallback
- ✅ Integration with Research Hub
- ✅ Caching and performance optimization

### Phase 2: Content Generation (Next)

- 🔄 Strands content agent for Studio Hub
- 🔄 Blog post and social media generation
- 🔄 Integration with Library Hub

### Phase 3: Listing Descriptions (Future)

- ⏳ Strands listing agent for Studio → Describe
- ⏳ Persona-driven descriptions
- ⏳ Market analysis integration

### Phase 4: Full Integration (Future)

- ⏳ All agents running on Strands
- ⏳ Bedrock as fallback only
- ⏳ Advanced orchestration and workflows

## 📚 Additional Resources

- [Strands Documentation](https://docs.strands.ai)
- [Bayon Coagent Architecture Guide](./docs/README.md)
- [AWS Service Integration Patterns](./docs/aws-integration.md)
- [Component Library Reference](./docs/component-library.md)

---

This integration maintains full compatibility with existing Bayon Coagent patterns while providing enhanced AI capabilities through Strands agents.
