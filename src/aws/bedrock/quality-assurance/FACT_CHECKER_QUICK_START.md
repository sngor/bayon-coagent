# Fact-Checking System - Quick Start Guide

## What is it?

A comprehensive fact-checking system that automatically verifies factual claims in content, flags unverified statements, and generates proper citations.

## Quick Usage

### 1. Basic Fact-Check

```typescript
import { getFactChecker } from "./fact-checker";

const factChecker = getFactChecker();

const result = await factChecker.checkFacts(
  "The median home price in Austin is $550,000, up 15% from last year.",
  {
    verifyAll: true,
    claimConfidenceThreshold: 0.7,
    generateCitations: true,
    citationFormat: "inline",
    checkSourceReliability: true,
    domain: "real-estate",
  }
);

console.log(`Score: ${result.overallScore}`);
console.log(`Unverified: ${result.unverifiedClaims.length}`);
console.log(`Problematic: ${result.problematicClaims.length}`);
```

### 2. Via Quality Assurance Strand

```typescript
import { getQualityAssuranceStrand } from "./quality-assurance-strand";

const qaStrand = getQualityAssuranceStrand();

// Automatic integration
const result = await qaStrand.validateContent({
  content: "Your content here...",
  validationTypes: ["factual"], // Triggers fact-checking
  contentType: "blog",
});

// Or direct access
const factCheck = await qaStrand.checkFacts(content);
```

## What You Get

### FactCheckResult

```typescript
{
    claims: [
        {
            claim: "The median home price in Austin is $550,000",
            location: { start: 0, end: 50 },
            type: "statistic",
            confidence: 0.95
        }
    ],
    verifications: [
        {
            claim: {...},
            status: "verified" | "unverified" | "disputed" | "false" | "needs-citation",
            confidence: 0.85,
            sources: [...],
            explanation: "...",
            suggestedCorrection: "...",
            suggestedCitation: "..."
        }
    ],
    unverifiedClaims: [...],      // Claims needing attention
    problematicClaims: [...],     // False or disputed claims
    citations: [...],             // Generated citations
    overallScore: 0.85,           // 0-1 accuracy score
    summary: "Found 2 claims...", // Summary text
    recommendations: [...]        // What to fix
}
```

## Configuration Options

```typescript
{
    // Verify all claims or only flagged ones
    verifyAll: true,

    // Minimum confidence for claim extraction (0-1)
    claimConfidenceThreshold: 0.7,

    // Generate citations
    generateCitations: true,

    // Citation format
    citationFormat: 'inline' | 'footnote' | 'endnote' | 'apa' | 'mla',

    // Check source reliability
    checkSourceReliability: true,

    // Content domain
    domain: 'real-estate' | 'finance' | 'legal' | 'general'
}
```

## Common Use Cases

### 1. Pre-Publication Check

```typescript
const factCheck = await factChecker.checkFacts(contentToPublish, config);

if (factCheck.problematicClaims.length > 0) {
  throw new Error("Cannot publish: contains false claims");
}

if (factCheck.overallScore < 0.8) {
  console.warn("Low fact-check score, review recommended");
}
```

### 2. Content Validation

```typescript
const result = await qaStrand.validateContent({
  content,
  validationTypes: ["factual", "grammar", "seo"],
});

if (result.validation.scoresByType.factual < 0.7) {
  console.log("Factual issues found:");
  result.validation.issues
    .filter((i) => i.type === "factual")
    .forEach((issue) => console.log(issue.message));
}
```

### 3. Citation Generation

```typescript
const factCheck = await factChecker.checkFacts(content, {
  generateCitations: true,
  citationFormat: "apa",
  // ... other config
});

// Add citations to content
let contentWithCitations = content;
factCheck.citations.forEach((citation) => {
  contentWithCitations += `\n\n${citation.text}`;
});
```

## Verification Statuses

- **verified**: Claim confirmed by reliable sources ✅
- **unverified**: Cannot find supporting sources ⚠️
- **disputed**: Conflicting information found ⚠️
- **false**: Claim contradicted by sources ❌
- **needs-citation**: Claim likely true but needs citation ℹ️

## Citation Formats

- **inline**: (Source, 2024)
- **footnote**: Numbered footnotes
- **endnote**: Numbered endnotes
- **apa**: American Psychological Association style
- **mla**: Modern Language Association style

## Performance Tips

1. **Batch processing**: Claims are automatically batched (5 at a time)
2. **Adjust thresholds**: Lower threshold = more claims extracted
3. **Domain-specific**: Always specify domain for better accuracy
4. **Cache results**: Consider caching for frequently verified claims

## Error Handling

```typescript
try {
  const result = await factChecker.checkFacts(content, config);
  return result;
} catch (error) {
  console.error("Fact-checking failed:", error);
  // Fallback to manual review
  return {
    overallScore: 0.5,
    summary: "Fact-checking unavailable",
    recommendations: ["Manual fact-checking recommended"],
    // ... other fields
  };
}
```

## Best Practices

1. ✅ Always specify the content domain
2. ✅ Generate citations for factual content
3. ✅ Enable source reliability checking
4. ✅ Review recommendations before publishing
5. ✅ Adjust thresholds based on content type
6. ✅ Handle errors gracefully

## When to Use

### Use Fact-Checking For:

- Blog posts with statistics
- Market reports
- Property descriptions with claims
- Educational content
- Press releases
- Any content with verifiable facts

### Skip Fact-Checking For:

- Opinion pieces
- Creative writing
- Personal stories
- Purely descriptive content
- Content without factual claims

## Next Steps

- Read [Full Implementation Guide](./FACT_CHECKER_IMPLEMENTATION.md)
- See [Usage Examples](./fact-checker-example.ts)
- Review [QA Strand Documentation](./README.md)

## Support

For issues or questions:

1. Check the implementation guide
2. Review the examples
3. Consult the QA strand documentation
