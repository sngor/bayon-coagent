# Fact-Checking System Implementation

## Overview

The fact-checking system provides comprehensive verification of factual claims in content. It extracts claims, verifies them against reliable sources, flags unverified statements, and manages citations.

## Features

### 1. Claim Extraction

Automatically identifies and extracts factual claims from content:

- **Statistics and numbers**: Quantitative claims that can be verified
- **Factual statements**: Assertions about events, dates, or people
- **Quotes**: Attributed statements from sources
- **Market data**: Real estate market trends and statistics
- **Legal/regulatory statements**: Compliance-related claims

Each extracted claim includes:

- Exact claim text
- Location in content (character positions)
- Claim type classification
- Confidence score (0-1)
- Surrounding context

### 2. Source Verification

Verifies claims against reliable sources:

- **Verification statuses**:

  - `verified`: Claim confirmed by reliable sources
  - `unverified`: Cannot find supporting sources
  - `disputed`: Conflicting information found
  - `false`: Claim contradicted by sources
  - `needs-citation`: Claim likely true but needs citation

- **Source reliability assessment**:
  - Official sources (government, regulatory bodies)
  - News sources (reputable journalism)
  - Research sources (academic, industry studies)
  - Industry sources (trade associations, professional organizations)

### 3. Unverified Claim Flagging

Automatically flags problematic claims:

- **False claims**: Marked as errors requiring correction
- **Disputed claims**: Marked as warnings requiring revision
- **Unverified claims**: Marked as warnings requiring verification or removal
- **Claims needing citations**: Marked as info requiring source attribution

### 4. Citation Management

Generates properly formatted citations:

- **Supported formats**:

  - Inline citations
  - Footnotes
  - Endnotes
  - APA style
  - MLA style

- **Citation features**:
  - Automatic source grouping
  - Multiple claims per citation
  - Source reliability indicators
  - Date tracking

## Architecture

### Core Components

```typescript
FactChecker
├── extractClaims()      // Identifies factual claims
├── verifyClaims()       // Verifies against sources
├── generateCitations()  // Creates formatted citations
└── checkFacts()         // Main entry point
```

### Data Flow

```
Content Input
    ↓
Claim Extraction (AI-powered)
    ↓
Claim Verification (AI-powered with source checking)
    ↓
Citation Generation (format-specific)
    ↓
Result Compilation
    ↓
Fact Check Result
```

## Usage

### Basic Fact-Checking

```typescript
import { getFactChecker } from "./fact-checker";

const factChecker = getFactChecker();

const result = await factChecker.checkFacts(content, {
  verifyAll: true,
  claimConfidenceThreshold: 0.7,
  generateCitations: true,
  citationFormat: "inline",
  checkSourceReliability: true,
  domain: "real-estate",
});

console.log(`Overall score: ${result.overallScore}`);
console.log(`Unverified claims: ${result.unverifiedClaims.length}`);
console.log(`Problematic claims: ${result.problematicClaims.length}`);
```

### Integrated with Quality Assurance

```typescript
import { getQualityAssuranceStrand } from "./quality-assurance-strand";

const qaStrand = getQualityAssuranceStrand();

// Fact-checking is automatically included when 'factual' validation is requested
const result = await qaStrand.validateContent({
  content,
  validationTypes: ["factual", "grammar", "seo"],
  contentType: "blog",
});

// Or use fact-checking directly
const factCheckResult = await qaStrand.checkFacts(content, {
  verifyAll: true,
  generateCitations: true,
  citationFormat: "apa",
});
```

### Configuration Options

```typescript
interface FactCheckConfig {
  // Verify all claims or only flagged ones
  verifyAll: boolean;

  // Minimum confidence for claim extraction (0-1)
  claimConfidenceThreshold: number;

  // Whether to generate citations
  generateCitations: boolean;

  // Citation format
  citationFormat: "inline" | "footnote" | "endnote" | "apa" | "mla";

  // Check source reliability
  checkSourceReliability: boolean;

  // Content domain for context
  domain?: "real-estate" | "finance" | "legal" | "general";
}
```

## Result Structure

### FactCheckResult

```typescript
{
    // All extracted claims
    claims: FactualClaim[];

    // Verification results for each claim
    verifications: ClaimVerification[];

    // Claims needing attention
    unverifiedClaims: ClaimVerification[];

    // False or disputed claims
    problematicClaims: ClaimVerification[];

    // Generated citations
    citations: Citation[];

    // Overall accuracy score (0-1)
    overallScore: number;

    // Summary text
    summary: string;

    // Actionable recommendations
    recommendations: string[];
}
```

### ClaimVerification

```typescript
{
    // Original claim
    claim: FactualClaim;

    // Verification status
    status: 'verified' | 'unverified' | 'disputed' | 'false' | 'needs-citation';

    // Confidence in verification (0-1)
    confidence: number;

    // Supporting sources
    sources: SourceInfo[];

    // Explanation
    explanation: string;

    // Suggested correction (if false/disputed)
    suggestedCorrection?: string;

    // Suggested citation (if needs citation)
    suggestedCitation?: string;
}
```

## Integration Points

### 1. Quality Assurance Strand

The fact-checker is integrated into the QA strand's validation pipeline:

```typescript
// Automatic integration when 'factual' validation is requested
const result = await qaStrand.validateContent({
  content,
  validationTypes: ["factual"], // Triggers fact-checking
});

// Fact-check issues are merged into validation results
result.validation.issues; // Includes fact-check findings
result.validation.scoresByType.factual; // Fact-check score
```

### 2. Content Generation Workflows

Can be used to validate AI-generated content:

```typescript
// Generate content
const generatedContent = await contentGenerator.generate(prompt);

// Verify facts
const factCheck = await factChecker.checkFacts(generatedContent, config);

// Only approve if fact-check passes
if (factCheck.overallScore >= 0.8 && factCheck.problematicClaims.length === 0) {
  await approveContent(generatedContent);
} else {
  await requestRevision(generatedContent, factCheck.recommendations);
}
```

### 3. Publishing Workflows

Ensure content accuracy before publication:

```typescript
// Pre-publication fact-check
const factCheck = await factChecker.checkFacts(contentToPublish, {
  verifyAll: true,
  generateCitations: true,
  citationFormat: "inline",
});

if (factCheck.problematicClaims.length > 0) {
  throw new Error("Cannot publish: contains false or disputed claims");
}

// Add citations to content
const contentWithCitations = addCitations(
  contentToPublish,
  factCheck.citations
);
await publish(contentWithCitations);
```

## Performance Considerations

### Batch Processing

Claims are verified in batches to optimize API usage:

```typescript
// Processes 5 claims at a time
const batchSize = 5;
for (let i = 0; i < claims.length; i += batchSize) {
  const batch = claims.slice(i, i + batchSize);
  const results = await Promise.all(
    batch.map((claim) => verifySingleClaim(claim))
  );
}
```

### Caching

Consider implementing caching for frequently verified claims:

```typescript
// Cache verification results by claim text
const verificationCache = new Map<string, ClaimVerification>();

// Check cache before verification
if (verificationCache.has(claim.claim)) {
  return verificationCache.get(claim.claim);
}

// Verify and cache
const verification = await verifySingleClaim(claim);
verificationCache.set(claim.claim, verification);
```

### Confidence Thresholds

Adjust thresholds based on content type:

```typescript
// High-stakes content (legal, financial)
const strictConfig = {
  claimConfidenceThreshold: 0.9,
  verifyAll: true,
};

// Marketing content
const relaxedConfig = {
  claimConfidenceThreshold: 0.7,
  verifyAll: false,
};
```

## Error Handling

### Graceful Degradation

```typescript
try {
  const result = await factChecker.checkFacts(content, config);
  return result;
} catch (error) {
  console.error("Fact-checking failed:", error);

  // Return partial result or skip fact-checking
  return {
    claims: [],
    verifications: [],
    unverifiedClaims: [],
    problematicClaims: [],
    citations: [],
    overallScore: 0.5, // Neutral score
    summary: "Fact-checking unavailable",
    recommendations: ["Manual fact-checking recommended"],
  };
}
```

### Timeout Handling

```typescript
const timeoutMs = 30000; // 30 seconds

const result = await Promise.race([
  factChecker.checkFacts(content, config),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Fact-check timeout")), timeoutMs)
  ),
]);
```

## Best Practices

### 1. Domain-Specific Configuration

Always specify the content domain for better accuracy:

```typescript
const config = {
  domain: "real-estate", // Improves claim extraction and verification
  // ... other config
};
```

### 2. Citation Management

Generate citations for all factual content:

```typescript
const config = {
  generateCitations: true,
  citationFormat: "inline", // Choose appropriate format
  // ... other config
};
```

### 3. Source Reliability

Enable source reliability checking for critical content:

```typescript
const config = {
  checkSourceReliability: true, // Validates source quality
  // ... other config
};
```

### 4. Threshold Tuning

Adjust confidence thresholds based on use case:

```typescript
// For listing descriptions (lower stakes)
claimConfidenceThreshold: 0.6;

// For blog posts (medium stakes)
claimConfidenceThreshold: 0.7;

// For legal content (high stakes)
claimConfidenceThreshold: 0.9;
```

## Testing

### Unit Tests

Test individual components:

```typescript
describe("FactChecker", () => {
  it("should extract claims from content", async () => {
    const claims = await factChecker.extractClaims(content, config);
    expect(claims.length).toBeGreaterThan(0);
    expect(claims[0]).toHaveProperty("claim");
    expect(claims[0]).toHaveProperty("location");
  });

  it("should verify claims", async () => {
    const verifications = await factChecker.verifyClaims(claims, config);
    expect(verifications.length).toBe(claims.length);
    expect(verifications[0]).toHaveProperty("status");
  });
});
```

### Integration Tests

Test with real content:

```typescript
describe("Fact-Checking Integration", () => {
  it("should handle real estate content", async () => {
    const content = "The median home price in Austin is $550,000.";
    const result = await factChecker.checkFacts(content, config);

    expect(result.claims.length).toBeGreaterThan(0);
    expect(result.overallScore).toBeGreaterThan(0);
  });
});
```

## Requirements Validation

This implementation validates:

- **Requirement 8.1**: Verifies factual claims against reliable sources and flags unverified statements
- **Property 36**: For any content containing factual claims, unverified claims are flagged with appropriate warnings

## Future Enhancements

1. **Real-time source checking**: Integration with live data sources
2. **Historical claim tracking**: Track claim verification over time
3. **Source credibility scoring**: Advanced source reliability algorithms
4. **Automated correction**: Suggest corrections based on verified sources
5. **Multi-language support**: Fact-checking in multiple languages
6. **Claim relationship mapping**: Identify related claims and contradictions

## Related Documentation

- [Quality Assurance Strand](./README.md)
- [Quality Assurance Types](./types.ts)
- [Usage Examples](./fact-checker-example.ts)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
