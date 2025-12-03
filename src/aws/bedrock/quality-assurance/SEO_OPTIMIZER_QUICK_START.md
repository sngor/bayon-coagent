# SEO Optimizer - Quick Start Guide

## Overview

The SEO Optimizer provides comprehensive SEO analysis and optimization recommendations for content. It analyzes keywords, generates meta descriptions, evaluates content structure, and provides actionable suggestions to improve search engine visibility.

## Quick Start

### 1. Basic Usage

```typescript
import { getSEOOptimizer } from "@/aws/bedrock/quality-assurance/seo-optimizer";

const optimizer = getSEOOptimizer();

const result = await optimizer.optimizeSEO(content, {
  targetKeywords: ["Austin real estate", "buy home Austin"],
  contentType: "blog",
});

console.log("SEO Score:", (result.currentScore * 100).toFixed(0) + "/100");
console.log("Priority Improvements:", result.priorityImprovements);
```

### 2. With Quality Assurance Strand

```typescript
import { getQualityAssuranceStrand } from "@/aws/bedrock/quality-assurance/quality-assurance-strand";

const qaStrand = getQualityAssuranceStrand();

const result = await qaStrand.validateContent({
  content: myContent,
  validationTypes: ["seo"],
  targetKeywords: ["real estate", "property listing"],
  contentType: "listing",
});

// Access SEO results
if (result.seo) {
  console.log("SEO Score:", result.seo.currentScore);
  console.log("Keywords:", result.seo.keywords);
  console.log("Meta Description:", result.seo.metaDescription.suggested);
}
```

### 3. Detailed Analysis

```typescript
const detailedResult = await qaStrand.optimizeSEODetailed(content, {
  targetKeywords: ["Austin homes", "real estate market"],
  contentType: "article",
  targetAudience: "home buyers",
  geographic: "Austin, Texas",
  analyzeLinks: true,
  analyzeImages: true,
  minReadabilityScore: 65,
});

console.log("Current Score:", detailedResult.currentScore);
console.log("Potential Score:", detailedResult.potentialScore);
console.log("Assessment:", detailedResult.assessment);
console.log("Estimated Effort:", detailedResult.estimatedEffort);
```

## Configuration Options

### SEOConfig

```typescript
interface SEOConfig {
  // Required: Keywords to optimize for
  targetKeywords: string[];

  // Optional: Content type for context
  contentType?: "blog" | "landing-page" | "product" | "article" | "listing";

  // Optional: Target audience
  targetAudience?: string;

  // Optional: Geographic focus
  geographic?: string;

  // Optional: Analyze links (default: false)
  analyzeLinks?: boolean;

  // Optional: Analyze images (default: false)
  analyzeImages?: boolean;

  // Optional: Minimum readability score target (default: 60)
  minReadabilityScore?: number;
}
```

## Understanding Results

### SEO Score

The overall SEO score (0-1) is calculated from:

- **Keyword Score (40%)**: Primary/secondary keywords, density, usage
- **Meta Description Score (20%)**: Quality and optimization of meta description
- **Structure Score (40%)**: Headings, paragraphs, readability

### Keyword Analysis

```typescript
result.keywords = {
    primary: ['main keyword 1', 'main keyword 2'],      // High-value keywords
    secondary: ['supporting keyword 1', ...],            // Supporting keywords
    density: { 'keyword': 2.5 },                        // Percentage density
    suggestions: ['add this keyword', ...],              // Recommended additions
    overused: ['keyword with too high density'],         // Reduce usage
    underused: ['keyword needing more usage'],           // Increase usage
}
```

**Optimal Density:**

- Primary keywords: 1-3%
- Secondary keywords: 0.5-1%

### Meta Description

```typescript
result.metaDescription = {
  current: "Existing meta description", // If present
  suggested: "Optimized meta description", // AI-generated
  length: 155, // Character count
  includesKeywords: true, // Keyword inclusion
  currentScore: 0.7, // Score if exists
  issues: ["Too short", "Missing keywords"], // Problems found
};
```

**Best Practices:**

- Length: 150-160 characters
- Include primary keywords naturally
- Compelling and action-oriented
- Accurately summarizes content

### Structure Analysis

```typescript
result.structure = {
    hasH1: true,                                        // H1 heading present
    headingHierarchy: true,                             // Proper H1→H2→H3 order
    headingCount: { h1: 1, h2: 3, h3: 5 },             // Heading distribution
    paragraphLength: 'good',                            // Assessment
    avgParagraphLength: 45,                             // Words per paragraph
    readabilityScore: 65,                               // Flesch Reading Ease
    readabilityLevel: 'moderate',                       // Difficulty level
    suggestions: ['Add more H2 subheadings', ...],      // Improvements
}
```

**Readability Scores:**

- 90-100: Very Easy (5th grade)
- 80-89: Easy (6th grade)
- 70-79: Fairly Easy (7th grade)
- 60-69: Standard (8th-9th grade)
- 50-59: Fairly Difficult (10th-12th grade)
- 30-49: Difficult (College)
- 0-29: Very Difficult (College graduate)

### Content Suggestions

```typescript
result.contentSuggestions = [
  {
    type: "keyword" | "structure" | "readability" | "meta" | "links" | "images",
    message: "Description of the issue",
    priority: "high" | "medium" | "low",
    action: "Specific action to take",
    impact: "Expected improvement",
  },
];
```

**Priority Levels:**

- **High**: Critical for SEO performance
- **Medium**: Important improvements
- **Low**: Nice-to-have enhancements

## Common Use Cases

### 1. Blog Post Optimization

```typescript
const result = await optimizer.optimizeSEO(blogContent, {
  targetKeywords: ["real estate tips", "home buying guide"],
  contentType: "blog",
  targetAudience: "first-time home buyers",
  minReadabilityScore: 70, // Easy to read
});
```

### 2. Landing Page SEO

```typescript
const result = await optimizer.optimizeSEO(landingPageContent, {
  targetKeywords: ["Austin realtor", "buy home Austin"],
  contentType: "landing-page",
  geographic: "Austin, Texas",
  analyzeLinks: true,
});
```

### 3. Property Listing

```typescript
const result = await optimizer.optimizeSEO(listingContent, {
  targetKeywords: ["West Austin homes", "4 bedroom house"],
  contentType: "listing",
  geographic: "West Austin, Texas",
  minReadabilityScore: 75, // Very readable
});
```

### 4. Market Report

```typescript
const result = await optimizer.optimizeSEO(reportContent, {
  targetKeywords: ["Austin market report", "real estate trends"],
  contentType: "article",
  targetAudience: "real estate professionals",
  minReadabilityScore: 60, // Professional level
});
```

## Interpreting Scores

### Excellent (80-100%)

- Strong keyword optimization
- Well-structured content
- Optimized meta description
- High readability

**Action:** Minor tweaks only

### Good (60-79%)

- Solid foundation
- Some improvements needed
- Most elements in place

**Action:** Implement medium-priority suggestions

### Moderate (40-59%)

- Several issues to address
- Missing key elements
- Needs optimization

**Action:** Focus on high-priority improvements

### Poor (0-39%)

- Significant work required
- Major SEO issues
- Missing critical elements

**Action:** Complete overhaul needed

## Best Practices

### 1. Keyword Usage

- Use primary keywords in H1 and first paragraph
- Distribute keywords naturally throughout content
- Avoid keyword stuffing (>3% density)
- Use variations and related terms

### 2. Content Structure

- Always include one H1 heading
- Use H2 for main sections
- Use H3 for subsections
- Keep paragraphs 3-5 sentences
- Break up long content with headings

### 3. Meta Descriptions

- Keep between 150-160 characters
- Include primary keyword
- Make it compelling and actionable
- Accurately describe content
- Include a call-to-action

### 4. Readability

- Use shorter sentences
- Avoid jargon when possible
- Use active voice
- Break up text with lists and headings
- Target 60+ readability score

## Integration with Workflows

### Content Creation Workflow

```typescript
// 1. Generate content
const content = await generateContent(topic);

// 2. Optimize for SEO
const seoResult = await optimizer.optimizeSEO(content, {
  targetKeywords: keywords,
  contentType: "blog",
});

// 3. Apply high-priority improvements
if (seoResult.currentScore < 0.7) {
  // Implement suggestions
  const improvedContent = await applyImprovements(
    content,
    seoResult.priorityImprovements
  );
}

// 4. Validate final content
const finalResult = await qaStrand.validateContent({
  content: improvedContent,
  validationTypes: ["seo", "factual", "compliance"],
  targetKeywords: keywords,
});
```

### Batch Optimization

```typescript
const contents = await getContentLibrary();

for (const content of contents) {
  const result = await optimizer.optimizeSEO(content.text, {
    targetKeywords: content.keywords,
    contentType: content.type,
  });

  if (result.currentScore < 0.6) {
    console.log(`Content "${content.title}" needs optimization`);
    console.log("Priority improvements:", result.priorityImprovements);
  }
}
```

## Troubleshooting

### Low Keyword Score

- Add target keywords to content
- Use keywords in headings
- Ensure proper keyword density (1-3%)
- Add related keywords

### Low Structure Score

- Add H1 heading if missing
- Fix heading hierarchy
- Break up long paragraphs
- Improve readability

### Low Meta Score

- Add meta description if missing
- Include primary keywords
- Optimize length (150-160 chars)
- Make it compelling

## Performance Tips

1. **Batch Processing**: Process multiple pieces of content in parallel
2. **Caching**: Reuse optimizer instance (singleton pattern)
3. **Selective Analysis**: Only analyze what you need
4. **Incremental Improvements**: Focus on high-priority items first

## Next Steps

1. Review the [examples](./seo-optimizer-example.ts) for detailed usage
2. Check [Task 31 Completion](./TASK_31_COMPLETION.md) for implementation details
3. Integrate with your content workflow
4. Monitor SEO scores over time
5. Iterate based on results

## Support

For issues or questions:

1. Check the implementation in `seo-optimizer.ts`
2. Review examples in `seo-optimizer-example.ts`
3. See integration in `quality-assurance-strand.ts`
4. Refer to type definitions in `types.ts`
