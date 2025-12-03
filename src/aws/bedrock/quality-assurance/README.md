# Quality Assurance Strand

Comprehensive content validation system for ensuring accuracy, compliance, brand consistency, and SEO optimization.

## Overview

The Quality Assurance Strand provides automated quality checks on all generated content, validating against multiple criteria to ensure professional, compliant, and effective content.

## Features

### 1. Fact Checking

Comprehensive fact-checking system with:

- **Claim Extraction**: Automatically identifies factual claims (statistics, facts, quotes, dates)
- **Source Verification**: Verifies claims against reliable sources
- **Unverified Flagging**: Flags unverified, disputed, or false claims
- **Citation Management**: Generates properly formatted citations (inline, APA, MLA, etc.)
- **Source Reliability**: Assesses source credibility and reliability
- **Confidence Scoring**: Provides confidence scores for all verifications

See [Fact Checker Implementation Guide](./FACT_CHECKER_IMPLEMENTATION.md) for detailed documentation.

**Property 36**: Fact verification

### 2. Compliance Validation

Comprehensive compliance checking system with:

- **Fair Housing Act Compliance**: Detects violations for all 7 protected classes (race, color, religion, sex, handicap, familial status, national origin)
- **Discriminatory Language Detection**: Identifies economic discrimination, biased phrases, and exclusionary language
- **Legal Compliance Checking**: Validates required disclosures, truth in advertising, and state-specific requirements
- **Custom Pattern Matching**: Supports organization-specific compliance rules
- **Risk Assessment**: Provides legal and reputational risk scores with actionable recommendations
- **Educational Content**: Includes Fair Housing overview, regulations, and best practices

See [Compliance Validator Implementation Guide](./COMPLIANCE_VALIDATOR_IMPLEMENTATION.md) for detailed documentation.

**Property 37**: Compliance checking

### 3. Brand Consistency

- Voice and tone alignment
- Messaging standards validation
- Style guide compliance
- **Property 38**: Brand validation

### 4. SEO Optimization

- Keyword analysis and density
- Meta description generation
- Content structure optimization
- Readability scoring
- **Property 39**: SEO optimization

### 5. Quality Recommendations

- Specific, actionable suggestions
- Prioritized action items
- Detailed rationale for each recommendation
- **Property 40**: Quality recommendations

## Requirements Validated

- **8.1**: Verifies factual claims against reliable sources
- **8.2**: Checks for fair housing violations and discriminatory language
- **8.3**: Validates content against brand guidelines
- **8.4**: Analyzes and optimizes for SEO
- **8.5**: Provides specific recommendations for improvement

## Usage

### Basic Validation

```typescript
import { getQualityAssuranceStrand } from "./quality-assurance";

const qaStrand = getQualityAssuranceStrand();

const result = await qaStrand.validateContent({
  content: "Your content here...",
  validationTypes: ["factual", "grammar"],
  contentType: "blog",
});

console.log("Passed:", result.validation.passed);
console.log("Score:", result.validation.overallScore);
console.log("Recommendation:", result.finalRecommendation);
```

### Compliance Checking

```typescript
const result = await qaStrand.validateContent({
  content: "Your content here...",
  validationTypes: ["compliance"],
  complianceRules: {
    checkFairHousing: true,
    checkDiscriminatory: true,
    checkLegal: true,
  },
});

if (!result.compliance?.compliant) {
  result.compliance.violations.forEach((v) => {
    console.log(`${v.type}: ${v.message}`);
    console.log(`Fix: ${v.suggestion}`);
  });
}
```

### Detailed Compliance Checking

```typescript
// Get detailed compliance analysis with risk assessment
const detailedResult = await qaStrand.checkComplianceDetailed(
  "Your content here...",
  {
    checkFairHousing: true,
    checkDiscriminatory: true,
    checkLegal: true,
    customPatterns: [
      {
        pattern: "exclusive|luxury",
        message: "Economic descriptors may be discriminatory",
        severity: "warning",
      },
    ],
  },
  {
    strictMode: true,
    confidenceThreshold: 0.7,
    includeEducation: true,
  }
);

// Access detailed information
console.log("Overall Risk:", detailedResult.riskAssessment.overallRisk);
console.log("Legal Risk:", detailedResult.riskAssessment.legalRisk);

// View violations by protected class
Object.entries(detailedResult.violationsByClass).forEach(
  ([cls, violations]) => {
    if (violations.length > 0) {
      console.log(`${cls}: ${violations.length} violation(s)`);
    }
  }
);

// Get educational content
if (detailedResult.education) {
  console.log("Best Practices:", detailedResult.education.bestPractices);
}
```

### Brand Validation

```typescript
const brandGuidelines = {
  voice: {
    tone: "professional",
    formality: "semi-formal",
    personality: ["trustworthy", "expert"],
  },
  messaging: {
    keyMessages: ["Local expertise", "Client-first"],
    avoidPhrases: ["cheap", "bargain"],
    preferredTerminology: { house: "home" },
  },
  style: {
    sentenceLength: "medium",
    paragraphLength: "short",
    useOfEmojis: false,
    useOfExclamation: "minimal",
  },
};

const result = await qaStrand.validateContent({
  content: "Your content here...",
  validationTypes: ["brand"],
  brandGuidelines,
});

console.log("Brand Score:", result.brand?.overallBrandScore);
```

### SEO Optimization

```typescript
const result = await qaStrand.validateContent({
  content: "Your content here...",
  validationTypes: ["seo"],
  targetKeywords: ["luxury homes", "downtown real estate"],
  contentType: "blog",
});

console.log("SEO Score:", result.seo?.currentScore);
result.seo?.contentSuggestions.forEach((s) => {
  console.log(`[${s.priority}] ${s.message}`);
});
```

### Comprehensive QA

```typescript
const result = await qaStrand.validateContent({
  content: "Your content here...",
  validationTypes: ["factual", "grammar", "compliance", "brand", "seo"],
  complianceRules: {
    /* ... */
  },
  brandGuidelines: {
    /* ... */
  },
  targetKeywords: ["keyword1", "keyword2"],
  contentType: "blog",
});

console.log("Final Recommendation:", result.finalRecommendation);
console.log("Summary:", result.summary);

result.actionItems.forEach((item) => {
  console.log(`[${item.priority}] ${item.action}`);
  console.log(`Rationale: ${item.rationale}`);
});
```

## Validation Types

- **factual**: Checks for unverified claims and questionable statements
- **grammar**: Checks for spelling, grammar, and clarity issues
- **compliance**: Validates against fair housing and legal requirements
- **brand**: Ensures consistency with brand guidelines
- **seo**: Optimizes for search engine visibility

## Result Structure

```typescript
interface QualityAssuranceResult {
  validation: ValidationResult; // Basic validation results
  compliance?: ComplianceResult; // Compliance check (if requested)
  brand?: BrandValidationResult; // Brand validation (if requested)
  seo?: SEOOptimization; // SEO analysis (if requested)
  finalRecommendation: "approve" | "approve-with-changes" | "reject";
  summary: string; // Overall summary
  actionItems: Array<{
    // Prioritized actions
    priority: "high" | "medium" | "low";
    action: string;
    rationale: string;
  }>;
}
```

## Integration

The Quality Assurance Strand integrates with:

- **Content Generation**: Validates all generated content before delivery
- **Collaborative Editing**: Provides real-time feedback during editing
- **Adaptive Routing**: Routes low-quality content for human review
- **Performance Analytics**: Tracks quality metrics over time

## Best Practices

1. **Always validate compliance** for public-facing content
2. **Use brand validation** to maintain consistent voice
3. **Run SEO optimization** for web content
4. **Review action items** in priority order
5. **Track quality scores** over time to measure improvement

## Performance

- Average execution time: 2-4 seconds
- Concurrent validations: Up to 5
- Quality score: 0.95
- Reliability score: 0.98

## Fact-Checking Usage

### Standalone Fact-Checking

```typescript
import { getQualityAssuranceStrand } from "./quality-assurance";

const qaStrand = getQualityAssuranceStrand();

// Direct fact-checking
const factCheckResult = await qaStrand.checkFacts(content, {
  verifyAll: true,
  claimConfidenceThreshold: 0.7,
  generateCitations: true,
  citationFormat: "apa",
  checkSourceReliability: true,
  domain: "real-estate",
});

console.log("Claims found:", factCheckResult.claims.length);
console.log("Unverified:", factCheckResult.unverifiedClaims.length);
console.log("Problematic:", factCheckResult.problematicClaims.length);
console.log("Overall score:", factCheckResult.overallScore);

// Review recommendations
factCheckResult.recommendations.forEach((rec) => {
  console.log(rec);
});

// Use generated citations
factCheckResult.citations.forEach((citation) => {
  console.log(`[${citation.id}] ${citation.text}`);
});
```

### Integrated Fact-Checking

```typescript
// Fact-checking is automatically included when 'factual' validation is requested
const result = await qaStrand.validateContent({
  content: "Your content here...",
  validationTypes: ["factual", "grammar"],
  contentType: "blog",
});

// Fact-check issues are merged into validation results
console.log("Factual score:", result.validation.scoresByType.factual);
```

## Compliance Validator Usage

### Standalone Compliance Validation

```typescript
import { getComplianceValidator } from "./compliance-validator";

const validator = getComplianceValidator();

const result = await validator.validateCompliance(content, {
  checkFairHousing: true,
  checkDiscriminatory: true,
  checkLegal: true,
});

console.log("Compliant:", result.compliant);
console.log("Score:", result.complianceScore);
console.log("Risk:", result.riskAssessment.overallRisk);

// Review violations
result.detailedViolations.forEach((violation) => {
  console.log(`${violation.severity}: ${violation.message}`);
  console.log(`Fix: ${violation.suggestion}`);
  if (violation.protectedClass) {
    console.log(`Protected Class: ${violation.protectedClass}`);
  }
});
```

### Quick Start

See [Compliance Validator Quick Start Guide](./COMPLIANCE_VALIDATOR_QUICK_START.md) for a beginner-friendly introduction.

## Examples

See example files for complete usage demonstrations:

- `quality-assurance-example.ts` - Quality assurance strand examples
- `fact-checker-example.ts` - Fact-checking examples
- `compliance-validator-example.ts` - Compliance validation examples
