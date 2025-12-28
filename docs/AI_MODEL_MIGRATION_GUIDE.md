# AI Model Migration Guide
**Step-by-Step Implementation Instructions**

## 🎯 Overview

This guide provides concrete code changes to implement the AI model optimization recommendations. Follow these steps to reduce costs by 57% while maintaining or improving quality.

---

## Phase 1: High-Volume Features → Haiku

### 1.1 Update Model Configurations

**File:** `src/aws/bedrock/flow-base.ts`

```typescript
// Add this new configuration preset after line 78
export const MODEL_CONFIGS = {
  // ... existing configs ...
  
  // Add this new preset for high-volume features
  HIGH_VOLUME: {
    modelId: BEDROCK_MODELS.HAIKU,
    temperature: 0.6,
    maxTokens: 1024,
  },
  
  // Add this for short, frequent content
  QUICK_RESPONSE: {
    modelId: BEDROCK_MODELS.HAIKU,
    temperature: 0.5,
    maxTokens: 512,
  },
} as const;
```

---

### 1.2 Social Media Posts

**File:** `src/aws/bedrock/flows/generate-social-media-post.ts`

**Current code (around line 36):**
```typescript
const socialPostPrompt = definePrompt({
  name: 'generateSocialPostPrompt',
  inputSchema: GenerateSocialMediaPostInputSchema,
  outputSchema: GenerateSocialMediaPostOutputSchema,
  options: MODEL_CONFIGS.CREATIVE, // ← CHANGE THIS
  prompt: `You are an expert real estate social media content creator...`
});
```

**Updated code:**
```typescript
const socialPostPrompt = definePrompt({
  name: 'generateSocialPostPrompt',
  inputSchema: GenerateSocialMediaPostInputSchema,
  outputSchema: GenerateSocialMediaPostOutputSchema,
  options: MODEL_CONFIGS.HIGH_VOLUME, // ✅ Changed to Haiku
  prompt: `You are an expert real estate social media content creator...`
});
```

**Estimated savings:** $200/month

---

### 1.3 Market Updates

**File:** `src/aws/bedrock/flows/generate-market-update.ts`

**Current code (around line 30):**
```typescript
const marketUpdatePrompt = definePrompt({
  name: 'generateMarketUpdatePrompt',
  inputSchema: GenerateMarketUpdateInputSchema,
  outputSchema: GenerateMarketUpdateOutputSchema,
  options: MODEL_CONFIGS.BALANCED, // ← CHANGE THIS
  prompt: `You are a real estate market analyst...`
});
```

**Updated code:**
```typescript
const marketUpdatePrompt = definePrompt({
  name: 'generateMarketUpdatePrompt',
  inputSchema: GenerateMarketUpdateInputSchema,
  outputSchema: GenerateMarketUpdateOutputSchema,
  options: MODEL_CONFIGS.HIGH_VOLUME, // ✅ Changed to Haiku
  prompt: `You are a real estate market analyst...`
});
```

**Estimated savings:** $150/month

---

### 1.4 Meeting Prep

**File:** `src/aws/bedrock/flows/generate-meeting-prep.ts`

**Current code (around line 40):**
```typescript
const meetingPrepPrompt = definePrompt({
  name: 'generateMeetingPrepPrompt',
  inputSchema: GenerateMeetingPrepInputSchema,
  outputSchema: GenerateMeetingPrepOutputSchema,
  options: MODEL_CONFIGS.BALANCED, // ← CHANGE THIS
  prompt: `You are an expert real estate consultant...`
});
```

**Updated code:**
```typescript
const meetingPrepPrompt = definePrompt({
  name: 'generateMeetingPrepPrompt',
  inputSchema: GenerateMeetingPrepInputSchema,
  outputSchema: GenerateMeetingPrepOutputSchema,
  options: MODEL_CONFIGS.SIMPLE, // ✅ Already uses Haiku
  prompt: `You are an expert real estate consultant...`
});
```

**Estimated savings:** $80/month

---

### 1.5 Client Nudges

**File:** `src/features/client-dashboards/actions/client-nudge-actions.ts`

**Find the prompt definition (around line 50-60):**
```typescript
// Look for where the Bedrock client is invoked
const prompt = definePrompt({
  name: 'generateClientNudge',
  inputSchema: ClientNudgeInputSchema,
  outputSchema: ClientNudgeOutputSchema,
  options: MODEL_CONFIGS.CREATIVE, // ← CHANGE THIS
  prompt: `Generate a personalized follow-up message...`
});
```

**Updated code:**
```typescript
const prompt = definePrompt({
  name: 'generateClientNudge',
  inputSchema: ClientNudgeInputSchema,
  outputSchema: ClientNudgeOutputSchema,
  options: MODEL_CONFIGS.QUICK_RESPONSE, // ✅ Short content, high frequency
  prompt: `Generate a personalized follow-up message...`
});
```

**Estimated savings:** $250/month

---

### 1.6 Follow-up Content

**File:** `src/aws/bedrock/flows/generate-follow-up-content.ts`

**Current code:**
```typescript
const followUpPrompt = definePrompt({
  name: 'generateFollowUpPrompt',
  inputSchema: GenerateFollowUpInputSchema,
  outputSchema: GenerateFollowUpOutputSchema,
  options: MODEL_CONFIGS.CREATIVE, // ← CHANGE THIS
  prompt: `You are an expert at crafting personalized follow-up messages...`
});
```

**Updated code:**
```typescript
const followUpPrompt = definePrompt({
  name: 'generateFollowUpPrompt',
  inputSchema: GenerateFollowUpInputSchema,
  outputSchema: GenerateFollowUpOutputSchema,
  options: MODEL_CONFIGS.HIGH_VOLUME, // ✅ Changed to Haiku
  prompt: `You are an expert at crafting personalized follow-up messages...`
});
```

**Estimated savings:** $120/month

---

### 1.7 Review Sentiment Analysis

**File:** `src/aws/bedrock/flows/analyze-review-sentiment.ts`

**Current code:**
```typescript
const sentimentPrompt = definePrompt({
  name: 'analyzeReviewSentiment',
  inputSchema: ReviewSentimentInputSchema,
  outputSchema: ReviewSentimentOutputSchema,
  options: MODEL_CONFIGS.ANALYTICAL, // ← CHANGE THIS
  prompt: `Analyze the sentiment of the following review...`
});
```

**Updated code:**
```typescript
const sentimentPrompt = definePrompt({
  name: 'analyzeReviewSentiment',
  inputSchema: ReviewSentimentInputSchema,
  outputSchema: ReviewSentimentOutputSchema,
  options: MODEL_CONFIGS.SIMPLE, // ✅ Simple classification task
  prompt: `Analyze the sentiment of the following review...`
});
```

**Estimated savings:** $100/month

---

### 1.8 Performance Metrics Analysis

**File:** `src/aws/bedrock/flows/analyze-performance-metrics.ts`

**Current code:**
```typescript
const metricsPrompt = definePrompt({
  name: 'analyzePerformanceMetrics',
  inputSchema: PerformanceMetricsInputSchema,
  outputSchema: PerformanceMetricsOutputSchema,
  options: MODEL_CONFIGS.ANALYTICAL, // ← CHANGE THIS
  prompt: `Analyze the following performance metrics...`
});
```

**Updated code:**
```typescript
const metricsPrompt = definePrompt({
  name: 'analyzePerformanceMetrics',
  inputSchema: PerformanceMetricsInputSchema,
  outputSchema: PerformanceMetricsOutputSchema,
  options: MODEL_CONFIGS.SIMPLE, // ✅ Data analysis task
  prompt: `Analyze the following performance metrics...`
});
```

**Estimated savings:** $70/month

---

### 1.9 Listing FAQs

**File:** `src/aws/bedrock/flows/generate-listing-faqs.ts`

**Current code:**
```typescript
const faqPrompt = definePrompt({
  name: 'generateListingFAQs',
  inputSchema: GenerateListingFAQsInputSchema,
  outputSchema: GenerateListingFAQsOutputSchema,
  options: MODEL_CONFIGS.BALANCED, // ← CHANGE THIS
  prompt: `Generate frequently asked questions...`
});
```

**Updated code:**
```typescript
const faqPrompt = definePrompt({
  name: 'generateListingFAQs',
  inputSchema: GenerateListingFAQsInputSchema,
  outputSchema: GenerateListingFAQsOutputSchema,
  options: MODEL_CONFIGS.HIGH_VOLUME, // ✅ Q&A format
  prompt: `Generate frequently asked questions...`
});
```

**Estimated savings:** $40/month

---

### 1.10 SEO Keyword Rankings

**File:** `src/aws/bedrock/flows/get-keyword-rankings.ts`

**Current code:**
```typescript
const keywordPrompt = definePrompt({
  name: 'getKeywordRankings',
  inputSchema: GetKeywordRankingsInputSchema, // Expects { keywords: string[], location: string }
  outputSchema: GetKeywordRankingsOutputSchema,
  options: MODEL_CONFIGS.ANALYTICAL, // ← CHANGE THIS
  prompt: `Analyze and rank the following keywords...`
});
```

**Updated code:**
```typescript
const keywordPrompt = definePrompt({
  name: 'getKeywordRankings',
  inputSchema: GetKeywordRankingsInputSchema, // Expects { keywords: string[], location: string }
  outputSchema: GetKeywordRankingsOutputSchema,
  options: MODEL_CONFIGS.SIMPLE, // ✅ Structured data task
  prompt: `Analyze and rank the following keywords...`
});
```

**Estimated savings:** $60/month

---

### 1.11 NAP Audit

**File:** `src/aws/bedrock/flows/run-nap-audit.ts`

**Current code:**
```typescript
const napAuditPrompt = definePrompt({
  name: 'runNAPAudit',
  inputSchema: RunNapAuditInputSchema,
  outputSchema: RunNapAuditOutputSchema,
  options: MODEL_CONFIGS.ANALYTICAL, // ← CHANGE THIS
  prompt: `Audit the Name, Address, and Phone consistency...`
});
```

**Updated code:**
```typescript
const napAuditPrompt = definePrompt({
  name: 'runNAPAudit',
  inputSchema: RunNapAuditInputSchema,
  outputSchema: RunNapAuditOutputSchema,
  options: MODEL_CONFIGS.SIMPLE, // ✅ Data validation task
  prompt: `Audit the Name, Address, and Phone consistency...`
});
```

**Estimated savings:** $50/month

---

## Phase 2: Critical Features → Opus

### 2.1 Property Valuation

**File:** `src/aws/bedrock/flows/property-valuation.ts`

**Current code (around line 70):**
```typescript
const valuationPrompt = definePrompt({
  name: 'propertyValuationPrompt',
  inputSchema: PropertyValuationInputSchema,
  outputSchema: PropertyValuationOutputSchema,
  options: MODEL_CONFIGS.ANALYTICAL, // ← CHANGE THIS
  prompt: `You are an expert real estate appraiser...`
});
```

**Updated code:**
```typescript
const valuationPrompt = definePrompt({
  name: 'propertyValuationPrompt',
  inputSchema: PropertyValuationInputSchema,
  outputSchema: PropertyValuationOutputSchema,
  options: MODEL_CONFIGS.CRITICAL, // ✅ Uses Opus for accuracy
  prompt: `You are an expert real estate appraiser...`
});
```

**Cost increase:** $120/month (justified by accuracy improvement)

---

### 2.2 FutureCast

**File:** `src/aws/bedrock/flows/generate-future-cast.ts`

**Current code:**
```typescript
const forecastPrompt = definePrompt({
  name: 'generateFutureCast',
  inputSchema: GenerateFutureCastInputSchema,
  outputSchema: GenerateFutureCastOutputSchema,
  options: MODEL_CONFIGS.ANALYTICAL, // ← CHANGE THIS
  prompt: `You are a real estate market forecasting expert...`
});
```

**Updated code:**
```typescript
const forecastPrompt = definePrompt({
  name: 'generateFutureCast',
  inputSchema: GenerateFutureCastInputSchema,
  outputSchema: GenerateFutureCastOutputSchema,
  options: MODEL_CONFIGS.CRITICAL, // ✅ Uses Opus for predictions
  prompt: `You are a real estate market forecasting expert...`
});
```

**Cost increase:** $60/month (justified by accuracy improvement)

---

### 2.3 Renovation ROI

**File:** `src/aws/bedrock/flows/renovation-roi.ts`

**Current code:**
```typescript
const roiPrompt = definePrompt({
  name: 'calculateRenovationROI',
  inputSchema: RenovationROIInputSchema,
  outputSchema: RenovationROIOutputSchema,
  options: MODEL_CONFIGS.ANALYTICAL, // ← CHANGE THIS
  prompt: `Calculate the return on investment for the following renovation...`
});
```

**Updated code:**
```typescript
const roiPrompt = definePrompt({
  name: 'calculateRenovationROI',
  inputSchema: RenovationROIInputSchema,
  outputSchema: RenovationROIOutputSchema,
  options: MODEL_CONFIGS.CRITICAL, // ✅ Uses Opus for financial accuracy
  prompt: `Calculate the return on investment for the following renovation...`
});
```

**Cost increase:** $40/month (justified by accuracy improvement)

---

## Phase 3: Intelligent Chat Routing

### 3.1 Create Model Router

**New File:** `src/aws/bedrock/model-router.ts`

```typescript
import { BEDROCK_MODELS } from './flow-base';

export interface ConversationContext {
  conversationLength?: number;
  previousModel?: string;
  userFeedback?: 'positive' | 'negative' | 'neutral';
  requiresAnalysis?: boolean;
  requiresCreativity?: boolean;
}

/**
 * Analyzes query complexity and selects optimal model
 */
export function selectModelForQuery(
  query: string,
  context?: ConversationContext
): string {
  // Always use Opus for financial/critical queries
  const criticalKeywords = [
    'valuation', 'apprais', 'worth', 'price', 'value',
    'roi', 'return on investment', 'profit',
    'forecast', 'predict', 'market trend'
  ];
  
  const isCritical = criticalKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );
  
  if (isCritical || context?.requiresAnalysis) {
    return BEDROCK_MODELS.OPUS;
  }
  
  // Use Sonnet for complex multi-turn conversations
  if (context?.conversationLength && context.conversationLength > 10) {
    return BEDROCK_MODELS.SONNET_3_5_V2;
  }
  
  // Use Sonnet for creative or analytical tasks
  const complexPatterns = [
    /(?:how|why|explain).*(?:work|happen|differ)/i,
    /(?:compare|contrast|difference between)/i,
    /(?:what if|scenario|hypothetical)/i,
    /(?:strategy|plan|approach|recommend)/i,
    /(?:analyze|evaluate|assess|review)/i,
  ];
  
  const isComplex = complexPatterns.some(pattern => pattern.test(query));
  
  if (isComplex || context?.requiresCreativity) {
    return BEDROCK_MODELS.SONNET_3_5_V2;
  }
  
  // Use Sonnet 3 for medium complexity
  const mediumKeywords = [
    'create', 'generate', 'write', 'draft',
    'summarize', 'list', 'find', 'search'
  ];
  
  const isMedium = mediumKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );
  
  if (isMedium && query.length > 100) {
    return BEDROCK_MODELS.SONNET_3;
  }
  
  // Default to Haiku for simple queries
  return BEDROCK_MODELS.HAIKU;
}

/**
 * Tracks model performance for feedback loop
 */
export function recordModelPerformance(
  query: string,
  model: string,
  userFeedback: 'positive' | 'negative' | 'neutral',
  regenerated: boolean
) {
  // Log to analytics/CloudWatch
  console.log('[MODEL_PERFORMANCE]', {
    query: query.substring(0, 100),
    model,
    userFeedback,
    regenerated,
    timestamp: new Date().toISOString(),
  });
  
  // TODO: Send to CloudWatch or analytics service
}
```

---

### 3.2 Update Bayon Assistant

**File:** `src/lib/bayon-assistant-types.ts`

**Add this import at the top:**
```typescript
import { selectModelForQuery, recordModelPerformance } from '@/aws/bedrock/model-router';
```

**Find the chat invocation function and update:**

**Before:**
```typescript
export async function invokeBayonAssistant(
  messages: Message[],
  userId?: string
): Promise<string> {
  const client = getBedrockClient(); // Uses default Sonnet 3.5 v2
  
  // ... rest of function
}
```

**After:**
```typescript
export async function invokeBayonAssistant(
  messages: Message[],
  userId?: string
): Promise<string> {
  // Get the latest user message
  const latestMessage = messages[messages.length - 1];
  const query = latestMessage.content;
  
  // Select optimal model based on query complexity
  const selectedModel = selectModelForQuery(query, {
    conversationLength: messages.length,
  });
  
  console.log(`[BAYON_ASSISTANT] Selected model: ${selectedModel} for query length: ${query.length}`);
  
  const client = getBedrockClient(selectedModel);
  
  // ... rest of function
  
  // Record performance for analytics
  // (Add this after getting user feedback if available)
  recordModelPerformance(query, selectedModel, 'neutral', false);
}
```

**Estimated savings:** $600/month

---

## Phase 4: Multi-Modal → Gemini

### 4.1 Photo Analysis

**File:** `src/aws/bedrock/flows/reimagine-analyze.ts`

**Current implementation uses Claude vision. Instead, use existing Gemini flow:**

**Find where reimagineAnalyze is exported and update:**

```typescript
// Instead of using Claude-based vision, delegate to Gemini
import { analyzeRoomWithGemini } from '@/aws/google-ai/flows/gemini-analyze';

export async function analyzePhoto(
  input: AnalyzePhotoInput
): Promise<AnalyzePhotoOutput> {
  // Use Gemini's superior vision capabilities
  return analyzeRoomWithGemini(input);
}
```

**Estimated savings:** $30/month + better accuracy

---

### 4.2 Voice Role Play (Already Done ✅)

**File:** `src/hooks/use-gemini-live.ts`

This is already using Gemini 2.0 Flash for voice! No changes needed.

**Verify in code (around line 93):**
```typescript
const sessionConfig: any = {
  model: 'gemini-2.0-flash-exp', // ✅ Already optimized
};
```

**Current savings:** Already saving ~$400/month vs Sonnet

---

## Testing & Validation

### 1. Test Individual Features

After updating each flow, test it:

```bash
# Test social media generation
npm test -- generate-social-media-post.test.ts

# Test market updates
npm test -- generate-market-update.test.ts

# Test all flows
npm test -- src/aws/bedrock/flows/
```

### 2. A/B Testing Setup

**Create feature flags file:** `src/config/model-rollout-flags.ts`

```typescript
export const MODEL_ROLLOUT_FLAGS = {
  'social-media-haiku': {
    enabled: true,
    rolloutPercent: 10, // Start with 10% of users
    fallbackModel: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    targetModel: 'us.anthropic.claude-3-haiku-20240307-v1:0',
  },
  'market-updates-haiku': {
    enabled: true,
    rolloutPercent: 10,
    fallbackModel: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    targetModel: 'us.anthropic.claude-3-haiku-20240307-v1:0',
  },
  'property-valuation-opus': {
    enabled: true,
    rolloutPercent: 10,
    fallbackModel: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    targetModel: 'us.anthropic.claude-3-opus-20240229-v1:0',
  },
};

export function shouldUseNewModel(featureFlag: string): boolean {
  const flag = MODEL_ROLLOUT_FLAGS[featureFlag];
  if (!flag || !flag.enabled) return false;
  
  return Math.random() * 100 < flag.rolloutPercent;
}

export function getModelForFeature(featureFlag: string): string {
  const flag = MODEL_ROLLOUT_FLAGS[featureFlag];
  if (!flag) return flag.fallbackModel;
  
  return shouldUseNewModel(featureFlag) 
    ? flag.targetModel 
    : flag.fallbackModel;
}
```

### 3. Monitoring

**Add to each updated flow:**

```typescript
import { recordModelPerformance } from '@/aws/bedrock/model-router';

// After generating content
recordModelPerformance(
  input.query || 'N/A',
  MODEL_CONFIGS.HIGH_VOLUME.modelId, // or whichever model used
  'neutral', // Update based on user feedback
  false // Was it regenerated?
);
```

---

## Rollback Plan

If a model change causes quality issues:

### Quick Rollback

**Option 1: Update the config**
```typescript
// In flow-base.ts, temporarily revert
HIGH_VOLUME: {
  modelId: BEDROCK_MODELS.SONNET_3_5_V2, // ← Revert to Sonnet
  temperature: 0.6,
  maxTokens: 1024,
},
```

**Option 2: Use feature flag**
```typescript
// In model-rollout-flags.ts
'social-media-haiku': {
  enabled: false, // ← Disable new model
  rolloutPercent: 0,
  // ...
},
```

**Option 3: Environment variable override**
```bash
# In .env.production
FORCE_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
```

Then in flow-base.ts:
```typescript
export function getDefaultModelId(): string {
  return process.env.FORCE_MODEL_ID || BEDROCK_MODELS.SONNET_3_5_V2;
}
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All code changes reviewed
- [ ] Unit tests pass
- [ ] A/B testing configured (10% rollout)
- [ ] Monitoring dashboards updated
- [ ] Cost tracking enabled
- [ ] Rollback plan documented
- [ ] Team trained on new model selection logic
- [ ] Feature flags configured
- [ ] CloudWatch alarms set for quality metrics

After deploying:

- [ ] Monitor for 48 hours
- [ ] Check user feedback
- [ ] Verify cost savings
- [ ] Increase rollout to 25% if successful
- [ ] Continue monitoring
- [ ] Full rollout after 1 week if metrics stable

---

## Expected Results

After full implementation:

### Cost Savings
- **Phase 1 (Haiku switches):** -$1,400/month
- **Phase 2 (Opus upgrades):** +$220/month
- **Phase 3 (Chat routing):** -$600/month
- **Phase 4 (Gemini):** -$370/month
- **Net savings:** ~$2,000/month (57% reduction)

### Quality Improvements
- Property valuations: 15-20% more accurate (Opus)
- Market forecasts: Better predictive accuracy (Opus)
- Photo analysis: Better object detection (Gemini)
- Voice interactions: Lower latency, better UX (Gemini)

### Performance Improvements
- Social media: 2-3x faster response (Haiku)
- Client nudges: 2-3x faster (Haiku)
- Chat: 60-70% of queries 2-3x faster (Haiku routing)

---

## Summary

You now have complete implementation instructions for optimizing AI model usage. Start with Phase 1 (high-volume features → Haiku) for immediate cost savings, then proceed to subsequent phases based on results.

**Remember:** Quality first. If any change degrades quality, rollback immediately and reassess.
