# SEO Developer Guide

## Overview

This guide provides technical documentation for the SEO Optimization features, including API endpoints, data models, AI flows, scoring algorithms, and integration patterns.

## Table of Contents

1. [Architecture](#architecture)
2. [Data Models](#data-models)
3. [API Reference](#api-reference)
4. [AI Flows](#ai-flows)
5. [SEO Scoring Algorithm](#seo-scoring-algorithm)
6. [Repository Layer](#repository-layer)
7. [UI Components](#ui-components)
8. [Integration Guide](#integration-guide)
9. [Testing](#testing)

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                             │
│  SEODashboard, SEOAnalysisCard, KeywordSuggestionPanel      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Server Actions                          │
│  analyzeSEOAction, generateKeywordSuggestionsAction, etc.    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      AI Flows (Bedrock)                      │
│  analyzeSEO, generateKeywordSuggestions, generateMetaDesc    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   SEO Scoring & Analysis                     │
│  scoring.ts, recommendations.ts, keyword-suggestions.ts      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Repository Layer                         │
│  SEORepository, KeywordRepository                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│                    DynamoDB (entities)                       │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### SEOAnalysis Entity

```typescript
interface SEOAnalysis {
  id: string; // UUID
  userId: string; // Agent's user ID
  contentId: string; // Reference to blog post or content
  contentType: "blog-post" | "market-update" | "neighborhood-guide";
  score: number; // 0-100 SEO score
  recommendations: SEORecommendation[];
  analyzedAt: string; // ISO 8601 timestamp
  previousScore?: number; // Previous score for tracking
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

interface SEORecommendation {
  priority: "high" | "medium" | "low";
  category:
    | "title"
    | "headings"
    | "keywords"
    | "readability"
    | "meta"
    | "length";
  message: string; // Human-readable recommendation
  currentValue?: string; // Current state
  suggestedValue?: string; // Suggested improvement
}
```

**DynamoDB Keys**:

```typescript
PK: USER#<userId>
SK: SEO#<analysisId>
EntityType: SEOAnalysis
```

**Indexes**:

- GSI1: Analyses by contentId
- GSI2: Analyses by score (for dashboard queries)

### SavedKeyword Entity

```typescript
interface SavedKeyword {
  id: string; // UUID
  userId: string; // Agent's user ID
  keyword: string; // The keyword phrase
  searchVolume: number; // Estimated monthly searches
  competition: "low" | "medium" | "high";
  location: string; // Geographic area (from profile)
  addedAt: string; // ISO 8601 timestamp
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}
```

**DynamoDB Keys**:

```typescript
PK: USER#<userId>
SK: KEYWORD#<keywordId>
EntityType: SavedKeyword
```

## API Reference

### Server Actions

All server actions are located in `src/app/seo-actions.ts`.

#### analyzeSEOAction

Analyzes content and generates SEO recommendations.

```typescript
async function analyzeSEOAction(
  contentId: string,
  contentType: string,
  content: string
): Promise<ActionResult<SEOAnalysis>>;
```

**Parameters**:

- `contentId`: ID of the content being analyzed
- `contentType`: Type of content ('blog-post', 'market-update', etc.)
- `content`: The content text to analyze

**Returns**:

```typescript
{
  message: string;
  data?: SEOAnalysis;
  errors?: string[];
}
```

**Example**:

```typescript
const result = await analyzeSEOAction(
  "post-123",
  "blog-post",
  "Your blog post content here..."
);

if (result.data) {
  console.log("SEO Score:", result.data.score);
  console.log("Recommendations:", result.data.recommendations);
}
```

#### generateKeywordSuggestionsAction

Generates location-based keyword suggestions.

```typescript
async function generateKeywordSuggestionsAction(
  location: string
): Promise<ActionResult<SavedKeyword[]>>;
```

**Parameters**:

- `location`: Geographic area (e.g., "Seattle, WA")

**Returns**:

```typescript
{
  message: string;
  data?: SavedKeyword[];
  errors?: string[];
}
```

#### generateMetaDescriptionAction

Generates an optimized meta description.

```typescript
async function generateMetaDescriptionAction(
  content: string,
  primaryKeyword: string
): Promise<ActionResult<{ metaDescription: string }>>;
```

**Parameters**:

- `content`: The content to generate a description for
- `primaryKeyword`: Primary keyword to include

**Returns**:

```typescript
{
  message: string;
  data?: { metaDescription: string };
  errors?: string[];
}
```

#### validateSchemaMarkupAction

Validates schema markup on a page.

```typescript
async function validateSchemaMarkupAction(
  pageType: "profile" | "blog-post" | "testimonials"
): Promise<ActionResult<{ isValid: boolean; errors: string[] }>>;
```

**Parameters**:

- `pageType`: Type of page to validate

**Returns**:

```typescript
{
  message: string;
  data?: { isValid: boolean; errors: string[] };
  errors?: string[];
}
```

## AI Flows

### analyzeSEO Flow

**Location**: `src/aws/bedrock/flows/analyze-seo.ts`

**Purpose**: Analyzes content and generates SEO recommendations.

**Input Schema**:

```typescript
const AnalyzeSEOInputSchema = z.object({
  content: z.string(),
  title: z.string(),
  metaDescription: z.string().optional(),
  targetKeywords: z.array(z.string()).optional(),
});
```

**Output Schema**:

```typescript
const AnalyzeSEOOutputSchema = z.object({
  score: z.number().min(0).max(100),
  recommendations: z.array(
    z.object({
      priority: z.enum(["high", "medium", "low"]),
      category: z.enum([
        "title",
        "headings",
        "keywords",
        "readability",
        "meta",
        "length",
      ]),
      message: z.string(),
      currentValue: z.string().optional(),
      suggestedValue: z.string().optional(),
    })
  ),
  strengths: z.array(z.string()),
});
```

**Usage**:

```typescript
import { analyzeSEO } from "@/aws/bedrock/flows/analyze-seo";

const analysis = await analyzeSEO({
  title: "Seattle Real Estate Market Trends 2024",
  content: "Your blog post content...",
  metaDescription: "Optional meta description",
  targetKeywords: ["Seattle real estate", "market trends"],
});
```

**Model Configuration**: ANALYTICAL (temperature 0.2)

### generateKeywordSuggestions Flow

**Location**: `src/aws/bedrock/flows/generate-keyword-suggestions.ts`

**Purpose**: Generates location-based keyword suggestions.

**Input Schema**:

```typescript
const GenerateKeywordSuggestionsInputSchema = z.object({
  location: z.string().describe("Geographic area (city, state)"),
  agentSpecialties: z.array(z.string()).optional(),
});
```

**Output Schema**:

```typescript
const GenerateKeywordSuggestionsOutputSchema = z.object({
  keywords: z.array(
    z.object({
      keyword: z.string(),
      searchVolume: z.number(),
      competition: z.enum(["low", "medium", "high"]),
      rationale: z.string(),
    })
  ),
});
```

**Usage**:

```typescript
import { generateKeywordSuggestions } from "@/aws/bedrock/flows/generate-keyword-suggestions";

const keywords = await generateKeywordSuggestions({
  location: "Seattle, WA",
  agentSpecialties: ["luxury homes", "waterfront properties"],
});
```

**Model Configuration**: ANALYTICAL (temperature 0.2)

### generateMetaDescription Flow

**Location**: `src/aws/bedrock/flows/generate-meta-description.ts`

**Purpose**: Generates optimized meta descriptions.

**Input Schema**:

```typescript
const GenerateMetaDescriptionInputSchema = z.object({
  content: z.string().describe("Blog post or page content"),
  primaryKeyword: z.string(),
  agentName: z.string(),
  location: z.string(),
});
```

**Output Schema**:

```typescript
const GenerateMetaDescriptionOutputSchema = z.object({
  metaDescription: z.string().describe("150-160 character meta description"),
  characterCount: z.number(),
});
```

**Usage**:

```typescript
import { generateMetaDescription } from "@/aws/bedrock/flows/generate-meta-description";

const metaDesc = await generateMetaDescription({
  content: "Your blog post content...",
  primaryKeyword: "Seattle first-time home buyer",
  agentName: "John Smith",
  location: "Seattle, WA",
});
```

**Model Configuration**: CREATIVE (temperature 0.7)

## SEO Scoring Algorithm

**Location**: `src/lib/seo/scoring.ts`

### calculateSEOScore Function

Calculates a composite SEO score (0-100) based on multiple factors.

```typescript
function calculateSEOScore(content: {
  title: string;
  content: string;
  metaDescription?: string;
  keywords?: string[];
}): number;
```

### Scoring Factors

1. **Title Optimization** (20 points)

   - Optimal length: 50-60 characters
   - Scoring: Linear scale, max points at 50-60 chars
   - Penalty for too short (<30) or too long (>70)

2. **Heading Structure** (15 points)

   - Presence of H1 (required): 5 points
   - Presence of H2s: 5 points
   - Presence of H3s: 5 points
   - Proper hierarchy enforced

3. **Keyword Density** (20 points)

   - Optimal: 1-2% of content
   - Scoring: Gaussian curve, peak at 1.5%
   - Penalty for keyword stuffing (>3%)

4. **Readability** (20 points)

   - Flesch Reading Ease score
   - Average sentence length
   - Paragraph length
   - Use of transition words

5. **Content Length** (15 points)

   - Optimal: 1500+ words
   - Minimum: 300 words
   - Linear scale between min and optimal

6. **Meta Description** (10 points)
   - Presence: 5 points
   - Optimal length (150-160 chars): 5 points

### Example

```typescript
import { calculateSEOScore } from "@/lib/seo/scoring";

const score = calculateSEOScore({
  title: "Seattle Real Estate Market Trends 2024",
  content: "Your blog post content...",
  metaDescription: "Discover the latest Seattle real estate trends...",
  keywords: ["Seattle real estate", "market trends"],
});

console.log("SEO Score:", score); // 0-100
```

### Recommendation Generation

**Location**: `src/lib/seo/recommendations.ts`

```typescript
function generateRecommendations(
  content: ContentInput,
  score: number
): SEORecommendation[];
```

Generates prioritized recommendations based on scoring analysis:

- **High Priority**: Issues causing score < 60
- **Medium Priority**: Issues causing score 60-79
- **Low Priority**: Optimizations for score 80+

## Repository Layer

### SEORepository

**Location**: `src/aws/dynamodb/seo-repository.ts`

#### Methods

**createAnalysis**:

```typescript
async createAnalysis(
  analysis: Omit<SEOAnalysis, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SEOAnalysis>
```

**getAnalysis**:

```typescript
async getAnalysis(
  userId: string,
  analysisId: string
): Promise<SEOAnalysis | null>
```

**getAnalysisByContentId**:

```typescript
async getAnalysisByContentId(
  userId: string,
  contentId: string
): Promise<SEOAnalysis | null>
```

**queryAnalyses**:

```typescript
async queryAnalyses(
  userId: string,
  options?: {
    limit?: number;
    sortBy?: 'score' | 'analyzedAt';
    order?: 'asc' | 'desc';
  }
): Promise<SEOAnalysis[]>
```

**updateAnalysis**:

```typescript
async updateAnalysis(
  userId: string,
  analysisId: string,
  updates: Partial<SEOAnalysis>
): Promise<SEOAnalysis>
```

**getAverageScore**:

```typescript
async getAverageScore(userId: string): Promise<number>
```

Calculates average SEO score across all analyses for a user.

### KeywordRepository

**Location**: `src/aws/dynamodb/keyword-repository.ts`

#### Methods

**createSavedKeyword**:

```typescript
async createSavedKeyword(
  keyword: Omit<SavedKeyword, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SavedKeyword>
```

**querySavedKeywords**:

```typescript
async querySavedKeywords(
  userId: string,
  options?: {
    limit?: number;
    sortBy?: 'searchVolume' | 'addedAt';
    order?: 'asc' | 'desc';
  }
): Promise<SavedKeyword[]>
```

**deleteSavedKeyword**:

```typescript
async deleteSavedKeyword(
  userId: string,
  keywordId: string
): Promise<void>
```

**searchKeywords**:

```typescript
async searchKeywords(
  userId: string,
  query: string
): Promise<SavedKeyword[]>
```

Searches saved keywords by keyword text.

## UI Components

### SEODashboard

Displays overall SEO performance metrics.

**Location**: `src/components/seo-dashboard.tsx`

**Props**:

```typescript
interface SEODashboardProps {
  userId: string;
  analyses: SEOAnalysis[];
}
```

**Features**:

- Average SEO score across all content
- Top-performing content (score >= 80)
- Underperforming content (score < 60)
- Score trend over time
- Quick actions to improve content

### SEOAnalysisCard

Displays SEO analysis results for a single piece of content.

**Location**: `src/components/seo-analysis-card.tsx`

**Props**:

```typescript
interface SEOAnalysisCardProps {
  analysis: SEOAnalysis;
  onApplyRecommendation?: (recommendation: SEORecommendation) => void;
}
```

**Features**:

- Visual score indicator (0-100)
- Color-coded score badge
- Recommendations list with priorities
- Score history chart
- Apply recommendation buttons

### SEORecommendationList

Displays prioritized SEO recommendations.

**Location**: `src/components/seo-recommendation-list.tsx`

**Props**:

```typescript
interface SEORecommendationListProps {
  recommendations: SEORecommendation[];
  onApply?: (recommendation: SEORecommendation) => void;
}
```

**Features**:

- Grouped by priority (high, medium, low)
- Color-coded priority badges
- Current vs. suggested values
- One-click apply buttons
- Expandable details

### KeywordSuggestionPanel

Displays keyword suggestions with metrics.

**Location**: `src/components/keyword-suggestion-panel.tsx`

**Props**:

```typescript
interface KeywordSuggestionPanelProps {
  keywords: SavedKeyword[];
  onSave?: (keyword: SavedKeyword) => void;
  onInsert?: (keyword: string) => void;
}
```

**Features**:

- Keyword list with search volume
- Competition level indicators
- Save to library button
- Insert into content button
- Filter by competition level

### MetaDescriptionEditor

Editor for meta descriptions with validation.

**Location**: `src/components/meta-description-editor.tsx`

**Props**:

```typescript
interface MetaDescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  primaryKeyword?: string;
}
```

**Features**:

- Character counter (150-160 optimal)
- Visual length indicator
- Keyword presence check
- Auto-generate button
- Preview in search result format

### SchemaMarkupValidator

Validates and displays schema markup.

**Location**: `src/components/schema-markup-validator.tsx`

**Props**:

```typescript
interface SchemaMarkupValidatorProps {
  pageType: "profile" | "blog-post" | "testimonials";
  schemaData: any;
}
```

**Features**:

- Validation status indicator
- Error list with fix suggestions
- Schema preview (JSON-LD)
- Test with Google Rich Results button
- Copy schema to clipboard

## Integration Guide

### Adding SEO Analysis to Content Creation

**Step 1: Import components and actions**

```typescript
import { SEOAnalysisCard } from "@/components/seo-analysis-card";
import { analyzeSEOAction } from "@/app/seo-actions";
```

**Step 2: Trigger analysis on content save**

```typescript
const handleSave = async (content: BlogPost) => {
  // Save content first
  await saveContent(content);

  // Analyze SEO
  const analysis = await analyzeSEOAction(
    content.id,
    "blog-post",
    content.body
  );

  if (analysis.data) {
    setAnalysis(analysis.data);
  }
};
```

**Step 3: Display analysis results**

```typescript
{
  analysis && (
    <SEOAnalysisCard
      analysis={analysis}
      onApplyRecommendation={handleApplyRecommendation}
    />
  );
}
```

### Implementing Keyword Suggestions

**Step 1: Generate keywords**

```typescript
import { generateKeywordSuggestionsAction } from "@/app/seo-actions";

const handleGenerateKeywords = async () => {
  const result = await generateKeywordSuggestionsAction(userLocation);

  if (result.data) {
    setKeywords(result.data);
  }
};
```

**Step 2: Display suggestions**

```typescript
<KeywordSuggestionPanel
  keywords={keywords}
  onSave={handleSaveKeyword}
  onInsert={handleInsertKeyword}
/>
```

**Step 3: Handle keyword insertion**

```typescript
const handleInsertKeyword = (keyword: string) => {
  // Insert keyword at cursor position
  const newContent = insertAtCursor(content, keyword);
  setContent(newContent);
};
```

### Adding Meta Description Generation

**Step 1: Generate meta description**

```typescript
import { generateMetaDescriptionAction } from "@/app/seo-actions";

const handleGenerateMetaDesc = async () => {
  const result = await generateMetaDescriptionAction(content, primaryKeyword);

  if (result.data) {
    setMetaDescription(result.data.metaDescription);
  }
};
```

**Step 2: Display editor**

```typescript
<MetaDescriptionEditor
  value={metaDescription}
  onChange={setMetaDescription}
  primaryKeyword={primaryKeyword}
/>
```

### Implementing Schema Markup

**Step 1: Generate schema**

```typescript
import { generateArticleSchema } from "@/lib/schema/generators";

const schema = generateArticleSchema({
  headline: post.title,
  description: post.metaDescription,
  author: {
    name: user.name,
    url: user.profileUrl,
  },
  datePublished: post.publishedAt,
  publisher: {
    name: user.agencyName,
    logo: user.agencyLogo,
  },
});
```

**Step 2: Add to page**

```typescript
export default function BlogPostPage({ post }: { post: BlogPost }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <article>{/* Post content */}</article>
    </>
  );
}
```

**Step 3: Validate schema**

```typescript
import { validateSchemaMarkupAction } from "@/app/seo-actions";

const validation = await validateSchemaMarkupAction("blog-post");

if (!validation.data?.isValid) {
  console.error("Schema errors:", validation.data?.errors);
}
```

## Testing

### Unit Tests

**Testing SEO Scoring**:

```typescript
import { calculateSEOScore } from "@/lib/seo/scoring";

describe("calculateSEOScore", () => {
  it("returns 100 for perfect content", () => {
    const score = calculateSEOScore({
      title: "Perfect Title Length Here",
      content: generatePerfectContent(1500),
      metaDescription: generatePerfectMetaDesc(155),
      keywords: ["keyword1", "keyword2"],
    });

    expect(score).toBeGreaterThanOrEqual(95);
  });

  it("penalizes short content", () => {
    const score = calculateSEOScore({
      title: "Short Title",
      content: "Too short",
      metaDescription: "Short",
      keywords: [],
    });

    expect(score).toBeLessThan(40);
  });
});
```

**Testing AI Flows**:

```typescript
import { analyzeSEO } from "@/aws/bedrock/flows/analyze-seo";

describe("analyzeSEO", () => {
  it("generates recommendations for poor content", async () => {
    const analysis = await analyzeSEO({
      title: "Bad",
      content: "Short content",
    });

    expect(analysis.score).toBeLessThan(60);
    expect(analysis.recommendations.length).toBeGreaterThan(0);
    expect(analysis.recommendations[0].priority).toBe("high");
  });
});
```

**Testing Repositories**:

```typescript
import { SEORepository } from "@/aws/dynamodb/seo-repository";

describe("SEORepository", () => {
  it("creates and retrieves analysis", async () => {
    const repo = new SEORepository();
    const analysis = await repo.createAnalysis({
      userId: "user-123",
      contentId: "post-123",
      contentType: "blog-post",
      score: 75,
      recommendations: [],
      analyzedAt: new Date().toISOString(),
    });

    const retrieved = await repo.getAnalysis("user-123", analysis.id);
    expect(retrieved).toEqual(analysis);
  });
});
```

### Integration Tests

**Testing Full SEO Workflow**:

```typescript
describe("SEO Analysis Workflow", () => {
  it("analyzes content and stores results", async () => {
    // 1. Create content
    const content = await createBlogPost({
      title: "Test Post",
      body: "Content here...",
    });

    // 2. Analyze SEO
    const analysis = await analyzeSEOAction(
      content.id,
      "blog-post",
      content.body
    );

    expect(analysis.data).toBeDefined();
    expect(analysis.data?.score).toBeGreaterThan(0);

    // 3. Verify stored in database
    const stored = await seoRepo.getAnalysisByContentId(userId, content.id);

    expect(stored).toBeDefined();
    expect(stored?.score).toBe(analysis.data?.score);
  });
});
```

### Property-Based Tests

See `src/__tests__/seo-*.test.ts` for property-based tests using fast-check.

**Example**:

```typescript
import fc from "fast-check";

describe("SEO Score Properties", () => {
  it("score is always between 0 and 100", () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          content: fc.string({ minLength: 100, maxLength: 5000 }),
        }),
        (input) => {
          const score = calculateSEOScore(input);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Error Handling

### Common Errors

**SEOAnalysisError**:

```typescript
class SEOAnalysisError extends Error {
  constructor(message: string) {
    super(`SEO analysis failed: ${message}`);
    this.name = "SEOAnalysisError";
  }
}
```

**KeywordGenerationError**:

```typescript
class KeywordGenerationError extends Error {
  constructor(message: string) {
    super(`Keyword generation failed: ${message}`);
    this.name = "KeywordGenerationError";
  }
}
```

**SchemaValidationError**:

```typescript
class SchemaValidationError extends Error {
  constructor(errors: string[]) {
    super(`Schema validation failed: ${errors.join(", ")}`);
    this.name = "SchemaValidationError";
  }
}
```

### Error Handling Pattern

```typescript
try {
  const analysis = await analyzeSEOAction(contentId, contentType, content);
  return { success: true, data: analysis };
} catch (error) {
  if (error instanceof SEOAnalysisError) {
    return { success: false, error: "Failed to analyze content" };
  } else if (error instanceof BedrockError) {
    return { success: false, error: "AI service unavailable" };
  } else {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
```

## Performance Considerations

### Caching

**SEO Analyses**:

- Cache analysis results for 1 hour
- Invalidate on content update
- Use content hash to detect changes

**Keyword Suggestions**:

- Cache generated keywords for 24 hours
- Invalidate when user location changes
- Share cache across similar locations

**Meta Descriptions**:

- Cache generated descriptions
- Invalidate on content or keyword changes

### Optimization

**Bedrock Calls**:

- Batch multiple analyses when possible
- Implement request queuing for rate limiting
- Use streaming for real-time feedback

**Database Queries**:

- Use GSI for dashboard queries
- Implement pagination for large result sets
- Cache average score calculations

**Client-Side**:

- Debounce analysis triggers (wait for user to stop typing)
- Show loading states during AI operations
- Implement optimistic UI updates

## Security

### Input Validation

All inputs validated with Zod schemas:

```typescript
const AnalyzeContentSchema = z.object({
  contentId: z.string().uuid(),
  contentType: z.enum(["blog-post", "market-update", "neighborhood-guide"]),
  content: z.string().min(100).max(50000),
});
```

### Authorization

Users can only access their own SEO data:

```typescript
const analysis = await seoRepo.getAnalysis(userId, analysisId);
if (analysis.userId !== session.user.id) {
  throw new ForbiddenError();
}
```

### Rate Limiting

Implement rate limiting for expensive operations:

```typescript
const rateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000, // 1 minute
});

await rateLimiter.check(userId, "seo-analysis");
```

## Related Documentation

- [SEO User Guide](../guides/SEO_USER_GUIDE.md)
- [SEO AI Flows](./SEO_AI_FLOWS.md)
- [Schema Markup Documentation](../../src/lib/schema/README.md)
- [Testimonials Developer Guide](./TESTIMONIALS_DEVELOPER_GUIDE.md)

## Support

For questions or issues:

- Check existing tests for usage examples
- Review implementation summaries in `.kiro/specs/testimonial-seo-features/`
- Consult the design document for architectural decisions
- See [SEO AI Flows](./SEO_AI_FLOWS.md) for detailed AI flow documentation
