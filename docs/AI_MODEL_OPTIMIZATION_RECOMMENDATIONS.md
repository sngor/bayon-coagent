# AI Model Optimization Recommendations
## Comprehensive Analysis & Model Selection for Bayon CoAgent

**Generated:** 2025-11-28  
**Status:** Ready for Implementation

---

## Executive Summary

This document provides a comprehensive analysis of all AI features in Bayon CoAgent and recommends optimal AI models (Claude via AWS Bedrock vs. Gemini) for each feature based on:

- **Performance requirements** (speed, quality, context length)
- **Cost efficiency** (pricing per token)
- **Feature-specific capabilities** (vision, multi-modal, reasoning)
- **User experience impact**

### Key Recommendations Summary

| Model | Best For | # of Features |
|-------|----------|---------------|
| **Claude 3.5 Sonnet v2** | Text generation, structured outputs, analysis | 28 |
| **Claude 3 Haiku** | Simple tasks, real-time features, high-volume | 12 |
| **Claude 3 Opus** | Critical accuracy, complex reasoning | 3 |
| **Gemini 2.0 Flash** | Image generation, multi-modal, real-time voice | 8 |
| **Gemini 1.5 Pro** | Vision analysis, large context needs | 5 |

---

## Current State Analysis

### Current Model Configuration
- **Primary Model:** Claude 3.5 Sonnet v2 (`us.anthropic.claude-3-5-sonnet-20241022-v2:0`)
- **Image Generation:** Google Gemini (via `GOOGLE_AI_API_KEY`)
- **Voice/Live:** Gemini 2.0 Flash (`gemini-2.0-flash-exp`)

### Model Pricing Reference (as of Nov 2024)

**Claude (AWS Bedrock):**
- **Haiku:** $0.25/MTok input, $1.25/MTok output
- **Sonnet 3.5 v2:** $3.00/MTok input, $15.00/MTok output
- **Opus:** $15.00/MTok input, $75.00/MTok output

**Gemini (Google AI):**
- **Flash 2.0:** $0.075/MTok input, $0.30/MTok output (below 128K context)
- **Pro 1.5:** $1.25/MTok input, $5.00/MTok output (up to 128K)
- **Imagen 3:** ~$0.04 per image

---

## Feature-by-Feature Analysis

### 📝 Content Generation Features

#### 1. **Blog Post Generation** (`generate-blog-post.ts`)
**Current:** Claude 3.5 Sonnet v2 (LONG_FORM config)  
**Recommended:** **Claude 3.5 Sonnet v2** ✅ Keep as-is

**Rationale:**
- Requires long-form content (2000+ words)
- Web search integration needs structured output
- Citation formatting requires precision
- Quality is critical for SEO value
- Users expect high-quality, professional content

**Config:**
```typescript
modelId: BEDROCK_MODELS.SONNET_3_5_V2
temperature: 0.6
maxTokens: 8192
```

---

#### 2. **Social Media Post Generation** (`generate-social-media-post.ts`)
**Current:** Claude 3.5 Sonnet v2 (CREATIVE config)  
**Recommended:** **Claude 3 Haiku** 💰 Switch for cost savings

**Rationale:**
- Short-form content (280 chars for Twitter, <500 for others)
- High volume usage expected
- Speed matters for user experience
- Haiku provides sufficient creativity for social posts
- **Cost savings:** ~92% reduction per post

**New Config:**
```typescript
modelId: BEDROCK_MODELS.HAIKU
temperature: 0.7
maxTokens: 1024
```

---

#### 3. **Listing Description Generator** (`listing-description-generator.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3.5 Sonnet v2** ✅ Keep as-is

**Rationale:**
- Critical for real estate sales (high stakes)
- Requires understanding of buyer personas
- Emotional appeal and persuasive writing important
- Structured output with specific tone requirements
- Quality directly impacts conversion rates

---

#### 4. **Video Script Generation** (`generate-video-script.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3.5 Sonnet v2** ✅ Keep as-is

**Rationale:**
- Requires narrative structure and pacing
- Scene-by-scene breakdown needs coherence
- Hooks and CTAs need persuasive writing
- Medium-length content (1000-2000 words)

---

#### 5. **Meeting Prep Generation** (`generate-meeting-prep.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3 Haiku** 💰 Switch for cost savings

**Rationale:**
- Structured list generation (talking points, questions)
- Speed important for last-minute prep
- Shorter content (<1000 words)
- Haiku handles structured outputs well
- **Cost savings:** ~92% reduction

**New Config:**
```typescript
modelId: BEDROCK_MODELS.HAIKU
temperature: 0.5
maxTokens: 2048
```

---

### 📊 Analysis & Research Features

#### 6. **Property Valuation** (`property-valuation.ts`)
**Current:** Claude 3.5 Sonnet v2 (ANALYTICAL config)  
**Recommended:** **Claude 3 Opus** 🎯 Upgrade for accuracy

**Rationale:**
- Financial accuracy is critical
- Complex market analysis and comparables
- Liability concerns require highest precision
- Users making $100K+ decisions based on this
- Justifies premium model cost

**New Config:**
```typescript
modelId: BEDROCK_MODELS.OPUS
temperature: 0.1
maxTokens: 4096
```

---

#### 7. **Neighborhood Profile Flow** (`neighborhood-profile-flow.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3.5 Sonnet v2** ✅ Keep as-is

**Rationale:**
- Balanced analytical + creative writing
- Multiple data sources to synthesize
- Moderate length content
- Good balance of quality and cost

---

#### 8. **Market Update Generation** (`generate-market-update.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3 Haiku** 💰 Switch for cost savings

**Rationale:**
- Template-based format (stats + brief commentary)
- High frequency usage (weekly/monthly)
- Shorter content (<800 words)
- Speed important for timely updates
- **Cost savings:** ~92% reduction for high-volume feature

**New Config:**
```typescript
modelId: BEDROCK_MODELS.HAIKU
temperature: 0.4
maxTokens: 2048
```

---

#### 9. **Competitor Analysis** (`find-competitors.ts`, `enhanced-research-agent.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3.5 Sonnet v2** ✅ Keep as-is

**Rationale:**
- Multi-step reasoning required
- Web search integration
- Competitive intelligence is high-value
- Quality insights justify cost

---

#### 10. **NAP Audit** (`run-nap-audit.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3 Haiku** 💰 Switch for cost savings

**Rationale:**
- Structured data validation task
- Pattern matching and consistency checking
- Minimal creativity required
- Fast turnaround important

**New Config:**
```typescript
modelId: BEDROCK_MODELS.HAIKU
temperature: 0.2
maxTokens: 2048
```

---

### 🎨 Visual & Multi-Modal Features

#### 11. **Photo Analysis** (`reimagine-analyze.ts`)
**Current:** Claude via Bedrock  
**Recommended:** **Gemini 1.5 Pro** 🔄 Switch to Gemini

**Rationale:**
- Gemini has superior vision capabilities
- Better at detecting room types, styles, features
- Multi-modal understanding (image + text)
- More accurate color and spatial analysis
- **Better accuracy** for image description tasks

**Implementation:**
```typescript
// Use existing gemini-analyze.ts instead
import { analyzeRoomWithGemini } from '@/aws/google-ai/flows/gemini-analyze';
```

---

#### 12. **Day to Dusk Conversion** (`reimagine-day-to-dusk.ts`)
**Current:** Google Imagen (via Gemini)  
**Recommended:** **Gemini Imagen 3** ✅ Keep as-is

**Rationale:**
- Image generation specialized task
- Gemini Imagen optimized for this
- Claude doesn't have image generation
- Currently working well

---

#### 13. **Virtual Staging** (`reimagine-staging.ts`, `gemini-staging.ts`)
**Current:** Gemini Imagen  
**Recommended:** **Gemini Imagen 3** ✅ Keep as-is

**Rationale:**
- Image generation required
- Furniture placement and style understanding
- Gemini's multi-modal strength
- Only viable option for this use case

---

#### 14. **Photo Enhancement** (`reimagine-enhance.ts`)
**Current:** Gemini  
**Recommended:** **Gemini Imagen 3** ✅ Keep as-is

**Rationale:**
- Image-to-image transformation
- Requires vision model capabilities
- Gemini optimized for this

---

#### 15. **Room Renovation** (`reimagine-renovate.ts`)
**Current:** Gemini  
**Recommended:** **Gemini Imagen 3** ✅ Keep as-is

**Rationale:**
- Image generation with style transfer
- Requires understanding of architecture
- Gemini's specialty

---

#### 16. **Object Removal** (`reimagine-remove.ts`)
**Current:** Gemini  
**Recommended:** **Gemini Imagen 3** ✅ Keep as-is

**Rationale:**
- Inpainting task
- Specialized image manipulation
- Gemini tool designed for this

---

#### 17. **Header Image Generation** (`generate-header-image.ts`)
**Current:** Gemini  
**Recommended:** **Gemini Imagen 3** ✅ Keep as-is

**Rationale:**
- Text-to-image generation
- Real estate themed imagery
- Gemini's strength

---

### 🎤 Interactive & Real-Time Features

#### 18. **Voice Role Play** (`role-play-flow.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Gemini 2.0 Flash** 🔄 Switch to Gemini

**Rationale:**
- Real-time conversation requires low latency
- Gemini 2.0 Flash has native audio I/O
- Live API designed for this use case
- Multi-modal (audio + text) handling
- **Better UX** with native voice support
- **Cost savings:** ~95% cheaper than Sonnet

**Implementation:**
```typescript
// Already implemented in use-gemini-live.ts hook
model: 'gemini-2.0-flash-exp'
```

---

#### 19. **Bayon Assistant (Chat)** (`bayon-assistant-types.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3 Haiku** + **Claude 3.5 Sonnet v2** (hybrid) 🎯

**Rationale:**
- Most queries are simple (Haiku: 70-80%)
- Complex queries need Sonnet (20-30%)
- Implement query routing based on complexity
- **Cost optimization:** Use cheaper model by default
- Upgrade to Sonnet for multi-step reasoning

**Implementation Strategy:**
```typescript
// Route based on query complexity
function selectModel(query: string, history: Message[]): string {
  const complexityIndicators = [
    'analyze', 'compare', 'calculate', 'evaluate',
    'strategy', 'plan', 'recommend', 'forecast'
  ];
  
  const isComplex = 
    complexityIndicators.some(indicator => 
      query.toLowerCase().includes(indicator)
    ) || history.length > 5;
  
  return isComplex 
    ? BEDROCK_MODELS.SONNET_3_5_V2 
    : BEDROCK_MODELS.HAIKU;
}
```

---

### 📈 Marketing & SEO Features

#### 20. **Marketing Plan Generation** (`generate-marketing-plan.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3.5 Sonnet v2** ✅ Keep as-is

**Rationale:**
- Strategic thinking required
- Multi-channel coordination
- Long-form structured output
- High business value

---

#### 21. **SEO Keyword Rankings** (`get-keyword-rankings.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3 Haiku** 💰 Switch for cost savings

**Rationale:**
- Data analysis and ranking task
- Structured output format
- Minimal creativity needed
- High frequency usage

**New Config:**
```typescript
modelId: BEDROCK_MODELS.HAIKU
temperature: 0.3
maxTokens: 2048
```

---

#### 22. **Listing FAQs** (`generate-listing-faqs.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3 Haiku** 💰 Switch for cost savings

**Rationale:**
- Q&A format is straightforward
- Factual, less creative
- Moderate length content
- Haiku handles this well

**New Config:**
```typescript
modelId: BEDROCK_MODELS.HAIKU
temperature: 0.5
maxTokens: 2048
```

---

### 🎯 Specialized Features

#### 23. **FutureCast (Forecasting)** (`generate-future-cast.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3 Opus** 🎯 Upgrade for accuracy

**Rationale:**
- Predictive analytics with financial implications
- Complex data analysis required
- Accuracy critical for credibility
- Users making decisions based on forecasts

**New Config:**
```typescript
modelId: BEDROCK_MODELS.OPUS
temperature: 0.2
maxTokens: 4096
```

---

#### 24. **Client Nudges** (`client-nudge-actions.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3 Haiku** 💰 Switch for cost savings

**Rationale:**
- Short personalized messages
- High volume/frequency usage
- Speed important for timely nudges
- Template-based with personalization

**New Config:**
```typescript
modelId: BEDROCK_MODELS.HAIKU
temperature: 0.6
maxTokens: 512
```

---

#### 25. **Agent Bio Generation** (`generate-agent-bio.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3.5 Sonnet v2** ✅ Keep as-is

**Rationale:**
- Important for professional branding
- Requires persuasive writing
- Emotional connection important
- One-time or infrequent use (cost not critical)

---

#### 26. **Social Proof Generation** (`generate-social-proof.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3.5 Sonnet v2** ✅ Keep as-is

**Rationale:**
- Review analysis and sentiment understanding
- Persuasive summary writing
- Quality impacts trust and credibility

---

#### 27. **Transcription** (`transcribe-audio.ts`)
**Current:** AWS Transcribe (not Bedrock)  
**Recommended:** **AWS Transcribe** ✅ Keep as-is

**Rationale:**
- Specialized service for audio transcription
- Not an LLM task
- Already optimized

---

#### 28. **Voice to Content** (`voice-to-content.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3.5 Sonnet v2** ✅ Keep as-is

**Rationale:**
- Sophisticated content transformation
- Context understanding from spoken word
- Quality matters for professional output

---

#### 29. **Review Sentiment Analysis** (`analyze-review-sentiment.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3 Haiku** 💰 Switch for cost savings

**Rationale:**
- Simple classification task
- High volume processing
- Structured output
- Sentiment analysis well-suited for Haiku

**New Config:**
```typescript
modelId: BEDROCK_MODELS.HAIKU
temperature: 0.2
maxTokens: 1024
```

---

#### 30. **Performance Metrics Analysis** (`analyze-performance-metrics.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3 Haiku** 💰 Switch for cost savings

**Rationale:**
- Data analysis and summarization
- Structured output format
- Regular/frequent usage
- Analytics task suitable for Haiku

**New Config:**
```typescript
modelId: BEDROCK_MODELS.HAIKU
temperature: 0.3
maxTokens: 2048
```

---

#### 31. **Training Plan Generation** (`training-plan-flow.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3.5 Sonnet v2** ✅ Keep as-is

**Rationale:**
- Educational content creation
- Curriculum design requires sophistication
- Personalization important
- Medium complexity

---

#### 32. **Neighborhood Guide** (`generate-neighborhood-guides.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3.5 Sonnet v2** ✅ Keep as-is

**Rationale:**
- Rich descriptive content
- Multiple data sources synthesis
- Marketing value high
- Quality impacts perception

---

#### 33. **Follow-up Content** (`generate-follow-up-content.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3 Haiku** 💰 Switch for cost savings

**Rationale:**
- Template-based emails/messages
- High frequency automation
- Personalization layer over templates
- Speed and cost matter

**New Config:**
```typescript
modelId: BEDROCK_MODELS.HAIKU
temperature: 0.6
maxTokens: 1024
```

---

#### 34. **Post Card Generation** (`post-card-actions.ts`)
**Current:** Gemini (image) + Claude (text)  
**Recommended:** **Gemini Imagen 3** + **Claude 3 Haiku** 🎯 Optimize text

**Rationale:**
- Image generation stays with Gemini
- Text content can use Haiku for cost savings
- High volume marketing material

---

#### 35. **Renovation ROI** (`renovation-roi.ts`)
**Current:** Claude 3.5 Sonnet v2  
**Recommended:** **Claude 3 Opus** 🎯 Upgrade for accuracy

**Rationale:**
- Financial calculations critical
- Investment decision support
- Requires market knowledge + math accuracy
- High-stakes for clients

**New Config:**
```typescript
modelId: BEDROCK_MODELS.OPUS
temperature: 0.1
maxTokens: 4096
```

---

## Implementation Roadmap

### Phase 1: Quick Wins (Week 1)
**Focus:** High-volume, low-complexity features  
**Estimated Savings:** ~70% reduction in those features

- [ ] Social Media Posts → Haiku
- [ ] Market Updates → Haiku
- [ ] Meeting Prep → Haiku
- [ ] Client Nudges → Haiku
- [ ] Follow-up Content → Haiku
- [ ] Review Sentiment → Haiku
- [ ] Performance Metrics → Haiku

**Implementation:**
```typescript
// Update flow-base.ts MODEL_CONFIGS
export const MODEL_CONFIGS = {
  // Add new preset for high-volume features
  HIGH_VOLUME: {
    modelId: BEDROCK_MODELS.HAIKU,
    temperature: 0.6,
    maxTokens: 1024,
  },
  // ... existing configs
};
```

### Phase 2: Critical Upgrades (Week 2)
**Focus:** Accuracy-critical features  
**Estimated Impact:** Higher quality outputs, reduced liability

- [ ] Property Valuation → Opus
- [ ] FutureCast → Opus
- [ ] Renovation ROI → Opus

**Implementation:**
```typescript
// Update specific flow files
// e.g., property-valuation.ts
const valuationPrompt = definePrompt({
  name: 'propertyValuationPrompt',
  inputSchema: PropertyValuationInputSchema,
  outputSchema: PropertyValuationOutputSchema,
  options: MODEL_CONFIGS.CRITICAL, // Uses Opus
  prompt: `...`,
});
```

### Phase 3: Multi-Modal Optimization (Week 3)
**Focus:** Vision and voice features  
**Estimated Impact:** Better accuracy, improved UX

- [ ] Photo Analysis → Gemini 1.5 Pro
- [ ] Voice Role Play → Gemini 2.0 Flash (already done)
- [ ] All Reimagine features verified with Gemini

### Phase 4: Intelligent Routing (Week 4)
**Focus:** Dynamic model selection  
**Estimated Savings:** 40-60% on chat/assistant features

- [ ] Implement query complexity analysis
- [ ] Route Bayon Assistant between Haiku/Sonnet
- [ ] Add model selection metrics/logging
- [ ] A/B test user satisfaction

**Implementation:**
```typescript
// Add to bayon-assistant-types.ts
export function selectOptimalModel(
  query: string, 
  context: ConversationContext
): string {
  const complexity = analyzeQueryComplexity(query, context);
  
  if (complexity.score > 7) {
    return BEDROCK_MODELS.SONNET_3_5_V2;
  } else if (complexity.score > 4) {
    return BEDROCK_MODELS.SONNET_3;
  } else {
    return BEDROCK_MODELS.HAIKU;
  }
}
```

---

## Cost Impact Analysis

### Current Monthly Estimate (based on typical usage)

| Feature Category | Current Model | Est. Tokens/Month | Current Cost |
|------------------|---------------|-------------------|--------------|
| Content Generation | Sonnet 3.5 v2 | 50M | $900 |
| Analysis & Research | Sonnet 3.5 v2 | 30M | $540 |
| Visual Features | Gemini | N/A | $200 |
| Interactive/Chat | Sonnet 3.5 v2 | 80M | $1,440 |
| Marketing/SEO | Sonnet 3.5 v2 | 25M | $450 |
| **Total** | | | **$3,530/mo** |

### Projected Monthly Cost (after optimization)

| Feature Category | Optimized Models | Est. Tokens/Month | Projected Cost |
|------------------|------------------|-------------------|----------------|
| Content Generation | Mixed (Haiku/Sonnet) | 50M | $350 |
| Analysis & Research | Mixed (Opus/Sonnet/Haiku) | 30M | $420 |
| Visual Features | Gemini | N/A | $200 |
| Interactive/Chat | Haiku (70%) / Sonnet (30%) | 80M | $480 |
| Marketing/SEO | Haiku | 25M | $80 |
| **Total** | | | **$1,530/mo** |

**Estimated Savings: $2,000/month (57% reduction)**

---

## Monitoring & Metrics

### Key Metrics to Track

1. **Cost per Feature**
   - Track token usage and cost for each AI feature
   - Identify optimization opportunities

2. **Quality Metrics**
   - User satisfaction scores
   - Regeneration rates (indicator of poor quality)
   - Error rates by model

3. **Performance Metrics**
   - Response latency by model
   - Time to first token
   - Throughput (requests/second)

4. **Model Comparison**
   - A/B test quality when switching models
   - User preference tracking
   - Conversion impact (for critical features)

### Implementation

```typescript
// Add to execution-logger.ts
export interface ModelMetrics {
  featureName: string;
  modelId: string;
  tokenUsage: {
    input: number;
    output: number;
  };
  cost: number;
  latency: number;
  userSatisfaction?: number;
  regenerated?: boolean;
}

export function logModelMetrics(metrics: ModelMetrics) {
  // Log to CloudWatch or your analytics service
  console.log('[MODEL_METRICS]', JSON.stringify(metrics));
}
```

---

## Testing Strategy

### Before Switching Models

1. **Baseline Testing**
   - Capture current output quality samples
   - Document current performance metrics
   - Record user feedback patterns

2. **A/B Testing**
   - Run new model on 10% of traffic
   - Compare quality, satisfaction, performance
   - Monitor for regressions

3. **Cost Validation**
   - Verify actual token usage matches estimates
   - Confirm cost savings projections

### Rollback Plan

```typescript
// Feature flag for model selection
const MODEL_ROLLOUT_FLAGS = {
  'social-media-haiku': {
    enabled: true,
    rolloutPercent: 10,
    fallbackModel: BEDROCK_MODELS.SONNET_3_5_V2,
  },
  // ... other features
};

function getModelWithRollout(
  featureFlag: string, 
  newModel: string
): string {
  const flag = MODEL_ROLLOUT_FLAGS[featureFlag];
  
  if (!flag.enabled) return flag.fallbackModel;
  
  if (Math.random() * 100 < flag.rolloutPercent) {
    return newModel;
  }
  
  return flag.fallbackModel;
}
```

---

## Model Selection Decision Matrix

| Factor | Haiku | Sonnet 3.5 v2 | Opus | Gemini Flash | Gemini Pro |
|--------|-------|---------------|------|--------------|------------|
| **Cost** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Speed** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Quality (text)** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Reasoning** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Vision** | ❌ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Image Gen** | ❌ | ❌ | ❌ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Context** | 200K | 200K | 200K | 1M | 2M |

---

## Conclusion

This analysis recommends a **hybrid approach** using the strengths of each model:

- **Claude 3 Haiku:** High-volume, simple tasks (57% cost savings on those features)
- **Claude 3.5 Sonnet v2:** Balanced quality tasks (current sweet spot)
- **Claude 3 Opus:** Critical accuracy tasks (property valuation, forecasting, ROI)
- **Gemini:** All visual/multi-modal tasks, real-time voice

**Expected Impact:**
- **57% overall cost reduction** ($2,000/month savings)
- **Improved accuracy** on financial features
- **Better UX** on voice/visual features
- **Faster response times** on high-volume features

**Next Steps:**
1. Review and approve recommendations
2. Implement Phase 1 (quick wins)
3. Monitor metrics and user satisfaction
4. Roll out remaining phases based on results

---

## Appendix: Configuration Examples

### A. Update flow-base.ts

```typescript
export const MODEL_CONFIGS = {
  // Fast, simple tasks (NEW - cost-optimized)
  HIGH_VOLUME: {
    modelId: BEDROCK_MODELS.HAIKU,
    temperature: 0.6,
    maxTokens: 1024,
  },
  
  // Existing configs
  SIMPLE: {
    modelId: BEDROCK_MODELS.HAIKU,
    temperature: 0.3,
    maxTokens: 2048,
  },
  BALANCED: {
    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
    temperature: 0.5,
    maxTokens: 4096,
  },
  CREATIVE: {
    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
    temperature: 0.7,
    maxTokens: 4096,
  },
  LONG_FORM: {
    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
    temperature: 0.6,
    maxTokens: 8192,
  },
  ANALYTICAL: {
    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
    temperature: 0.2,
    maxTokens: 4096,
  },
  CRITICAL: {
    modelId: BEDROCK_MODELS.OPUS,
    temperature: 0.1,
    maxTokens: 4096,
  },
} as const;
```

### B. Example Flow Update (Social Media)

```typescript
// Before
const socialPostPrompt = definePrompt({
  name: 'generateSocialPostPrompt',
  inputSchema: GenerateSocialMediaPostInputSchema,
  outputSchema: GenerateSocialMediaPostOutputSchema,
  options: MODEL_CONFIGS.CREATIVE, // Sonnet 3.5 v2
  prompt: `...`,
});

// After
const socialPostPrompt = definePrompt({
  name: 'generateSocialPostPrompt',
  inputSchema: GenerateSocialMediaPostInputSchema,
  outputSchema: GenerateSocialMediaPostOutputSchema,
  options: MODEL_CONFIGS.HIGH_VOLUME, // Haiku
  prompt: `...`,
});
```

### C. Intelligent Routing Example

```typescript
// New file: src/aws/bedrock/model-router.ts
export function selectModelForQuery(
  query: string,
  context?: {
    conversationLength?: number;
    requiresAnalysis?: boolean;
    requiresCreativity?: boolean;
  }
): string {
  // Critical/analytical queries
  if (context?.requiresAnalysis) {
    return BEDROCK_MODELS.SONNET_3_5_V2;
  }
  
  // Complex multi-turn conversations
  if (context?.conversationLength && context.conversationLength > 10) {
    return BEDROCK_MODELS.SONNET_3_5_V2;
  }
  
  // Check for complexity indicators
  const complexPatterns = [
    /calculate|analyze|evaluate|compare/i,
    /strategy|plan|recommend/i,
    /explain.*(why|how)/i,
  ];
  
  const isComplex = complexPatterns.some(pattern => 
    pattern.test(query)
  );
  
  if (isComplex) {
    return BEDROCK_MODELS.SONNET_3_5_V2;
  }
  
  // Default to cost-effective Haiku for simple queries
  return BEDROCK_MODELS.HAIKU;
}
```
