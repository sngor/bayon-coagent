# SEO AI Flows

This document describes the SEO AI flows implemented for the Bayon Coagent platform.

## Overview

Three AI-powered flows provide comprehensive SEO optimization for real estate content:

1. **analyzeSEO** - Analyzes content and generates SEO recommendations
2. **generateKeywordSuggestions** - Creates location-based keyword suggestions
3. **generateMetaDescription** - Generates optimized meta descriptions

## Usage

### 1. Analyze SEO

Analyzes blog posts and content for SEO optimization.

```typescript
import { analyzeSEO } from "@/aws/bedrock/flows/analyze-seo";

const analysis = await analyzeSEO({
  title: "Seattle Real Estate Market Trends 2024",
  content: "Your blog post content here...",
  metaDescription: "Optional existing meta description",
  targetKeywords: ["Seattle real estate", "market trends"],
});

console.log("SEO Score:", analysis.score); // 0-100
console.log("Recommendations:", analysis.recommendations);
console.log("Strengths:", analysis.strengths);
```

**Output:**

```typescript
{
  score: 75,
  recommendations: [
    {
      priority: 'high',
      category: 'title',
      message: 'Title is too long at 72 characters',
      currentValue: 'Current title here',
      suggestedValue: 'Shorter, optimized title here'
    }
  ],
  strengths: [
    'Strong use of subheadings',
    'Good keyword density'
  ]
}
```

**Evaluation Factors:**

- Title optimization (50-60 chars optimal)
- Heading structure (H1, H2, H3)
- Keyword usage (1-2% density)
- Readability (sentence clarity, paragraph length)
- Content length (1500+ words optimal)

### 2. Generate Keyword Suggestions

Creates location-based keyword suggestions for real estate agents.

```typescript
import { generateKeywordSuggestions } from "@/aws/bedrock/flows/generate-keyword-suggestions";

const keywords = await generateKeywordSuggestions({
  location: "Seattle, WA",
  agentSpecialties: ["luxury homes", "waterfront properties"],
});

console.log("Keywords:", keywords.keywords);
```

**Output:**

```typescript
{
  keywords: [
    {
      keyword: "Seattle luxury homes for sale",
      searchVolume: 2400,
      competition: "high",
      rationale: "High-intent keyword for luxury market in Seattle",
    },
    {
      keyword: "Capitol Hill homes for sale Seattle",
      searchVolume: 480,
      competition: "medium",
      rationale: "Neighborhood-specific with good balance",
    },
  ];
}
```

**Features:**

- 10-15 keyword suggestions per request
- Mix of short-tail (2-3 words) and long-tail (4-6 words)
- Realistic search volume estimates
- Competition level assessment
- Rationale for each keyword

### 3. Generate Meta Description

Creates optimized meta descriptions for search results.

```typescript
import { generateMetaDescription } from "@/aws/bedrock/flows/generate-meta-description";

const metaDesc = await generateMetaDescription({
  content: "Your blog post or page content...",
  primaryKeyword: "Seattle first-time home buyer",
  agentName: "John Smith",
  location: "Seattle, WA",
});

console.log("Meta Description:", metaDesc.metaDescription);
console.log("Character Count:", metaDesc.characterCount);
```

**Output:**

```typescript
{
  metaDescription: 'Seattle first-time home buyer? Get expert guidance from John Smith on down payments, neighborhoods, and the entire buying process. Start your journey today!',
  characterCount: 155
}
```

**Requirements:**

- 150-160 characters (optimal for search results)
- Includes primary keyword naturally
- Contains call-to-action
- References agent name and location
- Professional yet engaging tone

## Model Configuration

All flows use Claude 3.5 Sonnet via AWS Bedrock:

- **analyzeSEO**: ANALYTICAL config (temperature 0.2) for objective analysis
- **generateKeywordSuggestions**: ANALYTICAL config (temperature 0.2) for data-driven suggestions
- **generateMetaDescription**: CREATIVE config (temperature 0.7) for engaging copy

## Error Handling

All flows include comprehensive error handling:

```typescript
try {
  const analysis = await analyzeSEO({ ... });
} catch (error) {
  if (error instanceof BedrockParseError) {
    // AI response validation failed
    console.error('Invalid AI response:', error.message);
  } else if (error instanceof BedrockError) {
    // Bedrock API error
    console.error('AI service error:', error.message);
  } else {
    // Other errors
    console.error('Unexpected error:', error);
  }
}
```

## Integration with Server Actions

These flows are typically called from server actions:

```typescript
// src/app/seo-actions.ts
"use server";

import { analyzeSEO } from "@/aws/bedrock/flows/analyze-seo";

export async function analyzeSEOAction(
  contentId: string,
  contentType: string,
  content: string
): Promise<ActionResult<SEOAnalysis>> {
  try {
    const analysis = await analyzeSEO({
      title: content.title,
      content: content.body,
      metaDescription: content.metaDescription,
      targetKeywords: content.keywords,
    });

    // Store analysis in DynamoDB
    await seoRepository.createAnalysis({
      contentId,
      contentType,
      ...analysis,
    });

    return {
      message: "SEO analysis complete",
      data: analysis,
    };
  } catch (error) {
    return {
      message: "Failed to analyze SEO",
      errors: [error.message],
    };
  }
}
```

## Best Practices

1. **Cache Results**: SEO analysis can be expensive. Cache results and only re-analyze when content changes significantly.

2. **Batch Keywords**: Generate keywords once per agent and store them. Don't regenerate on every content creation.

3. **Validate Meta Descriptions**: Always check character count before displaying to users.

4. **Handle Timeouts**: Bedrock calls can take 5-15 seconds. Show loading states to users.

5. **Log Failures**: Track failed analyses to identify patterns and improve prompts.

## Performance

Typical execution times:

- **analyzeSEO**: 8-12 seconds
- **generateKeywordSuggestions**: 12-18 seconds
- **generateMetaDescription**: 2-4 seconds

## Cost Tracking

All flows automatically log token usage for cost tracking:

```typescript
{
  flowName: 'analyzeSEOPrompt',
  modelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
  executionTimeMs: 9460,
  tokenUsage: { input: 773, output: 385 }
}
```

## Related Files

- **Schemas**: `src/ai/schemas/seo-schemas.ts`
- **Flows**:
  - `src/aws/bedrock/flows/analyze-seo.ts`
  - `src/aws/bedrock/flows/generate-keyword-suggestions.ts`
  - `src/aws/bedrock/flows/generate-meta-description.ts`
- **Repository**: `src/aws/dynamodb/seo-repository.ts`
- **Scoring**: `src/lib/seo/scoring.ts`
- **Recommendations**: `src/lib/seo/recommendations.ts`

## Testing

Run the flows in development:

```bash
# Set up environment
export USE_LOCAL_AWS=false
export AWS_REGION=us-west-2

# Test in Node.js
npx tsx -e "
import { analyzeSEO } from './src/aws/bedrock/flows/analyze-seo';
const result = await analyzeSEO({
  title: 'Test Title',
  content: 'Test content...'
});
console.log(result);
"
```

## Future Enhancements

- [ ] Add support for image alt text optimization
- [ ] Include internal linking suggestions
- [ ] Add competitor keyword analysis
- [ ] Implement A/B testing for meta descriptions
- [ ] Add schema markup validation
