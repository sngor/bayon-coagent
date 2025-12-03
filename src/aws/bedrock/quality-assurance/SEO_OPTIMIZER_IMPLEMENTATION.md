# SEO Optimizer - Implementation Guide

## Architecture Overview

The SEO Optimizer is a comprehensive system for analyzing and optimizing content for search engines. It integrates with the Quality Assurance Strand to provide automated SEO validation as part of the content quality workflow.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SEO Optimizer System                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              SEOOptimizer (Main Engine)                 │ │
│  │                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │   Keyword    │  │     Meta     │  │  Structure   │ │ │
│  │  │   Analyzer   │  │  Description │  │   Analyzer   │ │ │
│  │  │              │  │   Generator  │  │              │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  │                                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │ │
│  │  │ Suggestion   │  │    Scoring   │  │   Effort     │ │ │
│  │  │  Generator   │  │   Calculator │  │  Estimator   │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Integration with QA Strand                      │ │
│  │                                                          │ │
│  │  • optimizeSEO() - Basic optimization                   │ │
│  │  • optimizeSEODetailed() - Full analysis                │ │
│  │  • validateContent() - Integrated validation            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Bedrock Claude  │
                    │   3.5 Sonnet     │
                    └──────────────────┘
```

## Core Components

### 1. SEOOptimizer Class

The main engine that orchestrates all SEO analysis operations.

**Key Methods:**

```typescript
class SEOOptimizer {
    // Main entry point
    async optimizeSEO(content: string, config: SEOConfig): Promise<SEOOptimizationResult>

    // Component analyzers
    async analyzeKeywords(content: string, config: SEOConfig): Promise<KeywordAnalysis>
    async analyzeMetaDescription(content: string, config: SEOConfig, keywords: KeywordAnalysis): Promise<MetaDescriptionAnalysis>
    async analyzeStructure(content: string, config: SEOConfig): Promise<StructureAnalysis>

    // Suggestion generation
    async generateSuggestions(...): Promise<ContentSuggestion[]>

    // Scoring
    private calculateSEOScore(...): number
    private calculatePotentialScore(...): number

    // Utilities
    toSEOOptimization(result: SEOOptimizationResult): SEOOptimization
}
```

### 2. Keyword Analyzer

Analyzes keyword usage and provides optimization recommendations.

**Analysis Process:**

1. **Extraction**: Identifies all keywords in content
2. **Classification**: Categorizes as primary or secondary
3. **Density Calculation**: Computes keyword density percentages
4. **Optimization**: Identifies overused, underused, and missing keywords
5. **Suggestions**: Recommends additional relevant keywords

**Optimal Density Ranges:**

- Primary keywords: 1-3%
- Secondary keywords: 0.5-1%

**Output:**

```typescript
{
    primary: string[];           // Main keywords
    secondary: string[];         // Supporting keywords
    density: Record<string, number>;  // Keyword → density %
    suggestions: string[];       // Recommended additions
    overused: string[];         // Reduce usage
    underused: string[];        // Increase usage
}
```

### 3. Meta Description Generator

Analyzes existing meta descriptions and generates optimized versions.

**Analysis Process:**

1. **Extraction**: Finds existing meta description in content
2. **Evaluation**: Scores current description (if exists)
3. **Generation**: Creates optimized meta description
4. **Validation**: Ensures optimal length and keyword inclusion
5. **Issue Identification**: Lists problems with current description

**Best Practices:**

- Length: 150-160 characters (optimal for search results)
- Keyword inclusion: Primary keywords naturally integrated
- Compelling: Action-oriented and engaging
- Accurate: Truthfully represents content

**Output:**

```typescript
{
    current?: string;           // Existing description
    suggested: string;          // Optimized version
    length: number;            // Character count
    includesKeywords: boolean; // Keyword presence
    currentScore?: number;     // Score if exists
    issues: string[];          // Problems found
}
```

### 4. Structure Analyzer

Evaluates content structure and readability.

**Analysis Process:**

1. **Heading Analysis**: Validates H1, H2, H3 hierarchy
2. **Paragraph Assessment**: Evaluates paragraph length
3. **Readability Calculation**: Computes Flesch Reading Ease score
4. **Structure Validation**: Checks proper organization
5. **Recommendations**: Suggests structural improvements

**Readability Scoring:**

- Uses Flesch Reading Ease formula
- Scale: 0-100 (higher = easier to read)
- Target: 60+ for general audience

**Output:**

```typescript
{
    hasH1: boolean;                    // H1 present
    headingHierarchy: boolean;         // Proper order
    headingCount: Record<string, number>;  // Distribution
    paragraphLength: 'good' | 'too-long' | 'too-short';
    avgParagraphLength: number;        // Words per paragraph
    readabilityScore: number;          // 0-100
    readabilityLevel: 'easy' | 'moderate' | 'difficult';
    suggestions: string[];             // Improvements
}
```

### 5. Suggestion Generator

Creates prioritized, actionable optimization recommendations.

**Suggestion Types:**

- **Keyword**: Keyword usage optimization
- **Structure**: Content organization improvements
- **Readability**: Clarity and ease of reading
- **Meta**: Meta description optimization
- **Links**: Internal/external link optimization
- **Images**: Image SEO optimization

**Priority Levels:**

- **High**: Critical for SEO performance (immediate action)
- **Medium**: Important improvements (near-term action)
- **Low**: Nice-to-have enhancements (future consideration)

**Output:**

```typescript
{
  type: "keyword" | "structure" | "readability" | "meta" | "links" | "images";
  message: string; // What needs improvement
  priority: "high" | "medium" | "low";
  action: string; // Specific action to take
  impact: string; // Expected improvement
}
```

### 6. Scoring Calculator

Computes overall SEO score and potential improvements.

**Scoring Formula:**

```
Overall Score = (Keyword Score × 0.4) + (Meta Score × 0.2) + (Structure Score × 0.4)
```

**Component Scores:**

**Keyword Score (40% weight):**

```
Score = 0.0
+ 0.3 if primary keywords present
+ 0.2 if secondary keywords present
+ 0.3 if no overused keywords
+ 0.2 if few underused keywords
```

**Meta Description Score (20% weight):**

```
Score = current meta description score (0-1)
      = 0 if no meta description exists
```

**Structure Score (40% weight):**

```
Score = 0.0
+ 0.25 if H1 present
+ 0.25 if heading hierarchy correct
+ 0.20 if paragraph length good
+ 0.30 × (readability score / 100)
```

**Potential Score:**

```
Potential = Current Score + Improvement Estimate

Improvement Estimate:
- High priority suggestions: +0.1 each
- Medium priority suggestions: +0.05 each
- Capped at 1.0 maximum
```

## Integration Points

### 1. Quality Assurance Strand Integration

The SEO Optimizer integrates seamlessly with the QA Strand:

```typescript
// In quality-assurance-strand.ts

async validateContent(input: QualityAssuranceInput): Promise<QualityAssuranceResult> {
    // ... other validations ...

    if (input.validationTypes.includes('seo') && input.targetKeywords) {
        const seo = await this.optimizeSEO(
            input.content,
            input.targetKeywords,
            input.contentType
        );
        // Include in result
    }
}

async optimizeSEO(
    content: string,
    targetKeywords: string[],
    contentType?: string
): Promise<SEOOptimization> {
    const seoOptimizer = getSEOOptimizer();
    const result = await seoOptimizer.optimizeSEO(content, {
        targetKeywords,
        contentType,
    });
    return seoOptimizer.toSEOOptimization(result);
}
```

### 2. Content Generation Workflow

```typescript
// Example workflow integration

async function createOptimizedContent(topic: string, keywords: string[]) {
  // 1. Generate initial content
  const content = await generateContent(topic);

  // 2. Analyze SEO
  const seoResult = await optimizer.optimizeSEO(content, {
    targetKeywords: keywords,
    contentType: "blog",
  });

  // 3. Apply improvements if needed
  if (seoResult.currentScore < 0.7) {
    const improved = await applyImprovements(
      content,
      seoResult.priorityImprovements
    );
    return improved;
  }

  return content;
}
```

### 3. Batch Processing

```typescript
// Process multiple content pieces

async function optimizeContentLibrary(contents: Content[]) {
  const results = await Promise.all(
    contents.map(async (content) => {
      const result = await optimizer.optimizeSEO(content.text, {
        targetKeywords: content.keywords,
        contentType: content.type,
      });

      return {
        id: content.id,
        score: result.currentScore,
        needsWork: result.currentScore < 0.6,
        improvements: result.priorityImprovements,
      };
    })
  );

  return results;
}
```

## AI Integration

### Bedrock Claude Integration

The SEO Optimizer uses AWS Bedrock with Claude 3.5 Sonnet for intelligent analysis.

**Configuration:**

```typescript
{
    model: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    temperature: 0.3,  // Balanced creativity/consistency
    maxTokens: 1500-2000,  // Varies by analysis type
}
```

**Prompt Engineering:**

Each analysis type uses carefully crafted prompts:

1. **Keyword Analysis Prompt**:

   - Provides content and target keywords
   - Requests primary/secondary classification
   - Asks for density calculations
   - Requests optimization suggestions

2. **Meta Description Prompt**:

   - Provides content summary
   - Includes current meta (if exists)
   - Specifies requirements (length, keywords)
   - Requests optimized version

3. **Structure Analysis Prompt**:
   - Provides full content
   - Requests heading analysis
   - Asks for readability assessment
   - Requests improvement suggestions

**Structured Output:**

All prompts use Zod schemas for type-safe, structured responses:

```typescript
const schema = z.object({
  primary: z.array(z.string()),
  secondary: z.array(z.string()),
  density: z.record(z.number()),
  // ... more fields
});

const result = await client.invoke(prompt, schema, options);
```

## Performance Optimization

### 1. Parallel Processing

Multiple analyses run concurrently:

```typescript
const [keywords, metaDescription, structure] = await Promise.all([
  this.analyzeKeywords(content, config),
  this.analyzeMetaDescription(content, config, keywords),
  this.analyzeStructure(content, config),
]);
```

### 2. Singleton Pattern

Single optimizer instance reused:

```typescript
let seoOptimizerInstance: SEOOptimizer | null = null;

export function getSEOOptimizer(): SEOOptimizer {
  if (!seoOptimizerInstance) {
    seoOptimizerInstance = new SEOOptimizer();
  }
  return seoOptimizerInstance;
}
```

### 3. Efficient Token Usage

Optimized prompts minimize token consumption:

- Concise instructions
- Focused analysis requests
- Structured output format
- Appropriate max tokens

### 4. Caching Strategy

Results can be cached for repeated analysis:

```typescript
const cache = new Map<string, SEOOptimizationResult>();

async function getCachedOptimization(content: string, config: SEOConfig) {
  const key = generateCacheKey(content, config);

  if (cache.has(key)) {
    return cache.get(key);
  }

  const result = await optimizer.optimizeSEO(content, config);
  cache.set(key, result);
  return result;
}
```

## Error Handling

### Graceful Degradation

```typescript
try {
  const result = await optimizer.optimizeSEO(content, config);
  return result;
} catch (error) {
  console.error("SEO optimization failed:", error);

  // Return minimal result
  return {
    currentScore: 0.5,
    potentialScore: 0.5,
    keywords: { primary: [], secondary: [], density: {}, suggestions: [] },
    metaDescription: {
      suggested: "",
      length: 0,
      includesKeywords: false,
      issues: [],
    },
    structure: { hasH1: false, headingHierarchy: false /* ... */ },
    contentSuggestions: [],
    assessment: "SEO analysis unavailable",
    priorityImprovements: [],
    estimatedEffort: "unknown",
  };
}
```

### Validation

Input validation before processing:

```typescript
if (!content || content.trim().length === 0) {
  throw new Error("Content cannot be empty");
}

if (!config.targetKeywords || config.targetKeywords.length === 0) {
  throw new Error("Target keywords are required");
}
```

## Testing Strategy

### Unit Tests

```typescript
describe("SEOOptimizer", () => {
  describe("analyzeKeywords", () => {
    it("should identify primary keywords", async () => {
      const result = await optimizer.analyzeKeywords(content, config);
      expect(result.primary).toContain("target keyword");
    });

    it("should calculate keyword density", async () => {
      const result = await optimizer.analyzeKeywords(content, config);
      expect(result.density["keyword"]).toBeGreaterThan(0);
    });
  });

  describe("analyzeMetaDescription", () => {
    it("should generate meta within optimal length", async () => {
      const result = await optimizer.analyzeMetaDescription(
        content,
        config,
        keywords
      );
      expect(result.length).toBeGreaterThanOrEqual(150);
      expect(result.length).toBeLessThanOrEqual(160);
    });
  });

  describe("calculateSEOScore", () => {
    it("should return score between 0 and 1", async () => {
      const result = await optimizer.optimizeSEO(content, config);
      expect(result.currentScore).toBeGreaterThanOrEqual(0);
      expect(result.currentScore).toBeLessThanOrEqual(1);
    });
  });
});
```

### Integration Tests

```typescript
describe("QA Strand SEO Integration", () => {
  it("should include SEO in validation", async () => {
    const result = await qaStrand.validateContent({
      content,
      validationTypes: ["seo"],
      targetKeywords: ["test"],
    });
    expect(result.seo).toBeDefined();
  });

  it("should provide actionable suggestions", async () => {
    const result = await qaStrand.optimizeSEODetailed(content, config);
    expect(result.contentSuggestions.length).toBeGreaterThan(0);
  });
});
```

## Deployment Considerations

### 1. Environment Configuration

```typescript
// config.ts
export const SEO_CONFIG = {
  minReadabilityScore: process.env.SEO_MIN_READABILITY || 60,
  maxKeywordDensity: process.env.SEO_MAX_DENSITY || 3,
  optimalMetaLength: {
    min: 150,
    max: 160,
  },
};
```

### 2. Monitoring

Track SEO optimization metrics:

```typescript
// metrics.ts
export function trackSEOMetrics(result: SEOOptimizationResult) {
  metrics.recordGauge("seo.score.current", result.currentScore);
  metrics.recordGauge("seo.score.potential", result.potentialScore);
  metrics.recordCounter(
    "seo.suggestions.high",
    result.contentSuggestions.filter((s) => s.priority === "high").length
  );
}
```

### 3. Rate Limiting

Implement rate limiting for API calls:

```typescript
const rateLimiter = new RateLimiter({
  maxRequests: 100,
  perSeconds: 60,
});

async function optimizeWithRateLimit(content: string, config: SEOConfig) {
  await rateLimiter.acquire();
  return await optimizer.optimizeSEO(content, config);
}
```

## Future Enhancements

### 1. Link Analysis

- Internal link structure
- External link quality
- Anchor text optimization

### 2. Image SEO

- Alt text analysis
- Image file name optimization
- Image size and format recommendations

### 3. Schema Markup

- Structured data recommendations
- Rich snippet optimization
- Schema validation

### 4. Competitor Analysis

- Comparative keyword analysis
- Content gap identification
- Ranking opportunity detection

### 5. Historical Tracking

- SEO score trends
- Improvement tracking
- Performance correlation

### 6. A/B Testing

- SEO variation testing
- Performance comparison
- Optimization validation

## Conclusion

The SEO Optimizer provides a comprehensive, AI-powered solution for content SEO analysis and optimization. Its modular architecture, intelligent analysis, and seamless integration make it a powerful tool for improving search engine visibility and content quality.
