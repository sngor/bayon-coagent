# AI Generation Validation Agent

## Overview

The Enhanced Validation Agent provides comprehensive quality assessment for AI-generated content with detailed scoring across multiple dimensions:

- **Goal Alignment** - Does content meet the user's stated objective?
- **Social Media Optimization** - Engagement potential, shareability, and platform fit
- **SEO Effectiveness** - Keyword optimization, readability, structure, and meta elements
- **Quality Checks** - Completeness, coherence, and professionalism
- **Compliance** - Domain relevance, ethical standards, and guardrails

## Key Features

### 1. Detailed Score Breakdown

Every validation provides scores (0-100) for:

- Overall quality
- Goal alignment
- Social media optimization
- SEO effectiveness
- Content quality
- Compliance with guardrails

### 2. Social Media Scoring

Evaluates content for social media success:

- **Engagement Score** - Likelihood to generate interactions
- **Shareability Score** - Likelihood to be shared
- **Platform Fit** - Individual scores for Facebook, Instagram, LinkedIn, Twitter
- **Strengths & Improvements** - Specific feedback for optimization

### 3. SEO Scoring

Assesses search engine optimization:

- **Keyword Optimization** - Target keyword usage and placement
- **Readability** - Content structure and scannability
- **Structure** - Heading hierarchy and formatting
- **Meta Optimization** - Title, description, and meta elements
- **Suggested Keywords** - Additional keywords to consider
- **Strengths & Improvements** - Actionable SEO recommendations

### 4. Multi-Layer Validation

1. **Format Validation** (Fast, synchronous)

   - Length checks
   - Required elements
   - Format-specific validation (markdown, JSON, etc.)

2. **Guardrails Validation** (Fast, synchronous)

   - Domain compliance (real estate only)
   - PII detection
   - Ethical compliance (no guarantees, legal advice, discrimination)

3. **AI-Powered Deep Validation** (Slower, uses Bedrock)
   - Goal alignment analysis
   - Quality assessment
   - Social media optimization
   - SEO effectiveness
   - Factual consistency
   - Tone and style appropriateness

## Usage

### Basic Validation

```typescript
import { getValidationAgent } from "@/aws/bedrock/validation-agent-enhanced";

const validator = getValidationAgent();

const result = await validator.validate(generatedContent, {
  userGoal: "Create an engaging blog post about market trends",
  validateSocialMedia: true,
  validateSEO: true,
  contentType: "blog",
  targetKeywords: ["real estate", "market trends", "2024"],
});

console.log("Scores:", {
  overall: result.score,
  goalAlignment: result.scoreBreakdown.goalAlignment,
  socialMedia: result.scoreBreakdown.socialMedia,
  seo: result.scoreBreakdown.seo,
});

if (result.socialMediaScore) {
  console.log("Social Media:", {
    engagement: result.socialMediaScore.engagement,
    shareability: result.socialMediaScore.shareability,
    platformFit: result.socialMediaScore.platformFit,
  });
}

if (result.seoScore) {
  console.log("SEO:", {
    keywords: result.seoScore.keywordOptimization,
    readability: result.seoScore.readability,
    suggestedKeywords: result.seoScore.suggestedKeywords,
  });
}
```

### Integration with Content Generation

```typescript
import { generateBlogPostWithScores } from "@/app/actions-with-validation";

const result = await generateBlogPostWithScores({
  topic: "Top 10 Home Staging Tips",
  includeWebSearch: true,
});

// Access generated content
const content = result.content.blogPost;

// Access validation scores
const validation = result.validation;

if (validation.passed) {
  console.log("Content is ready to publish!");
  console.log(`Goal Alignment: ${validation.scoreBreakdown.goalAlignment}/100`);
  console.log(`Social Media: ${validation.scoreBreakdown.socialMedia}/100`);
  console.log(`SEO: ${validation.scoreBreakdown.seo}/100`);
} else {
  console.log("Content needs improvement:", validation.summary);
  validation.issues.forEach((issue) => {
    console.log(`- ${issue.message}`);
  });
}
```

### Content Type Presets

```typescript
import { getValidationPreset } from "@/app/actions-with-validation";

// Blog post validation
const blogConfig = getValidationPreset("blog");
// Includes: SEO validation, social media validation, 500+ chars, markdown format

// Social media validation
const socialConfig = getValidationPreset("social");
// Includes: High social media focus, platform-specific scoring, 50-2000 chars

// Listing description validation
const listingConfig = getValidationPreset("listing");
// Includes: Strong SEO focus, keyword optimization, 200+ chars

// Email validation
const emailConfig = getValidationPreset("email");
// Includes: Readability focus, HTML format, 100+ chars
```

### Displaying Validation Scores

```typescript
import { ValidationScoreDisplay } from "@/components/validation-score-display";

function MyComponent() {
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  return (
    <div>
      {validation && (
        <ValidationScoreDisplay validation={validation} showDetails={true} />
      )}
    </div>
  );
}
```

## Configuration Options

### ValidationConfig

```typescript
interface ValidationConfig {
  // Goal validation
  validateGoalAlignment?: boolean;
  userGoal?: string;

  // Quality checks
  minQualityScore?: number; // 0-100, default: 70
  checkCompleteness?: boolean;
  checkCoherence?: boolean;
  checkProfessionalism?: boolean;

  // Guardrails
  enforceGuardrails?: boolean;
  checkDomainCompliance?: boolean;
  checkEthicalCompliance?: boolean;

  // Format validation
  expectedFormat?: "markdown" | "html" | "plain" | "json";
  minLength?: number;
  maxLength?: number;
  requiredElements?: string[]; // e.g., ['introduction', 'conclusion']

  // Content checks
  checkFactualConsistency?: boolean;
  checkToneAndStyle?: boolean;
  targetAudience?: string;

  // Social media & SEO validation
  validateSocialMedia?: boolean;
  validateSEO?: boolean;
  contentType?:
    | "blog"
    | "social"
    | "listing"
    | "email"
    | "video-script"
    | "general";
  targetKeywords?: string[];

  // Strictness
  strictMode?: boolean; // If true, warnings become critical issues
}
```

## Validation Result Structure

```typescript
interface ValidationResult {
  passed: boolean;
  score: number; // 0-100, overall quality score

  scoreBreakdown: {
    overall: number;
    goalAlignment: number;
    socialMedia: number;
    seo: number;
    quality: number;
    compliance: number;
  };

  socialMediaScore?: {
    score: number;
    engagement: number;
    shareability: number;
    platformFit: {
      facebook: number;
      instagram: number;
      linkedin: number;
      twitter: number;
    };
    strengths: string[];
    improvements: string[];
  };

  seoScore?: {
    score: number;
    keywordOptimization: number;
    readability: number;
    structure: number;
    metaOptimization: number;
    strengths: string[];
    improvements: string[];
    suggestedKeywords?: string[];
  };

  issues: ValidationIssue[];
  summary: string;
  recommendations?: string[];
}
```

## Score Interpretation

### Overall Scores (0-100)

- **90-100**: Excellent - Ready to publish, minimal issues
- **80-89**: Very Good - Minor improvements suggested
- **70-79**: Good - Some improvements recommended
- **60-69**: Fair - Significant improvements needed
- **0-59**: Poor - Major revisions required

### Social Media Scores

- **Engagement (0-100)**: Likelihood to generate likes, comments, shares

  - 80+: Highly engaging, likely to go viral
  - 60-79: Good engagement potential
  - <60: May not generate much interaction

- **Shareability (0-100)**: Likelihood to be shared

  - 80+: Highly shareable content
  - 60-79: Moderately shareable
  - <60: Low share potential

- **Platform Fit (0-100)**: How well content suits each platform
  - 80+: Perfect fit for platform style and audience
  - 60-79: Good fit with minor adjustments
  - <60: Needs significant adaptation

### SEO Scores

- **Keyword Optimization (0-100)**: Target keyword usage

  - 80+: Excellent keyword placement and density
  - 60-79: Good keyword usage
  - <60: Insufficient keyword optimization

- **Readability (0-100)**: Content structure and scannability

  - 80+: Highly readable and scannable
  - 60-79: Good readability
  - <60: Difficult to read or scan

- **Structure (0-100)**: Heading hierarchy and formatting

  - 80+: Perfect structure with clear hierarchy
  - 60-79: Good structure
  - <60: Poor structure or organization

- **Meta Optimization (0-100)**: Title, description, meta elements
  - 80+: Excellent meta elements
  - 60-79: Good meta elements
  - <60: Missing or poor meta elements

## Best Practices

### 1. Always Validate Generated Content

```typescript
// ✅ Good
const result = await generateContent(input);
const validation = await validateContent(result, config);
if (!validation.passed) {
  // Handle validation failure
}

// ❌ Bad
const result = await generateContent(input);
// No validation - content may have issues
```

### 2. Use Content-Specific Configurations

```typescript
// ✅ Good - Use presets for content types
const config = getValidationPreset("blog");

// ❌ Bad - Generic config for all content
const config = DEFAULT_VALIDATION_CONFIG;
```

### 3. Show Scores to Users

```typescript
// ✅ Good - Display detailed scores
<ValidationScoreDisplay validation={validation} showDetails={true} />

// ❌ Bad - Hide validation results
// Users don't know content quality
```

### 4. Act on Recommendations

```typescript
// ✅ Good - Use recommendations to improve
if (validation.recommendations) {
  validation.recommendations.forEach((rec) => {
    console.log("Suggestion:", rec);
  });
}

// ❌ Bad - Ignore recommendations
// Miss opportunities to improve content
```

### 5. Target Keywords for SEO

```typescript
// ✅ Good - Provide target keywords
const config = {
  validateSEO: true,
  targetKeywords: ["real estate", "home staging", "2024 trends"],
};

// ❌ Bad - No keywords provided
const config = {
  validateSEO: true,
  // No targetKeywords - less effective SEO validation
};
```

## Performance Considerations

- **Format & Guardrails Validation**: Fast (<100ms), runs synchronously
- **AI-Powered Validation**: Slower (2-5 seconds), uses Bedrock API
- **Caching**: AI validation responses are not cached due to content variability
- **Batch Validation**: Use `validateMultipleVersions()` for comparing multiple versions

## Error Handling

```typescript
try {
  const validation = await validator.validate(content, config);

  if (!validation.passed) {
    // Handle validation failure
    console.error("Validation failed:", validation.summary);
    validation.issues.forEach((issue) => {
      if (issue.severity === "critical") {
        // Handle critical issues
      }
    });
  }
} catch (error) {
  // Handle validation error
  console.error("Validation error:", error);
  // Fallback: allow content but warn user
}
```

## Testing

```bash
# Run validation agent tests
npm test src/aws/bedrock/validation-agent.test.ts

# Test with real content
npm run test:validation
```

## Future Enhancements

- [ ] A/B testing support with automatic winner selection
- [ ] Historical score tracking and trends
- [ ] Custom validation rules per user/organization
- [ ] Integration with content scheduling based on scores
- [ ] Automated content improvement suggestions
- [ ] Multi-language validation support
- [ ] Industry-specific validation profiles
