# AI Model Selection Summary
**Quick Reference Guide for Bayon CoAgent**

## 📊 At-a-Glance Recommendations

| # | Feature | Current | Recommended | Action | Monthly Savings |
|---|---------|---------|-------------|--------|-----------------|
| 1 | Blog Posts | Sonnet 3.5 v2 | ✅ Sonnet 3.5 v2 | Keep | - |
| 2 | Social Media | Sonnet 3.5 v2 | 💰 **Haiku** | Switch | ~$200 |
| 3 | Listing Descriptions | Sonnet 3.5 v2 | ✅ Sonnet 3.5 v2 | Keep | - |
| 4 | Video Scripts | Sonnet 3.5 v2 | ✅ Sonnet 3.5 v2 | Keep | - |
| 5 | Meeting Prep | Sonnet 3.5 v2 | 💰 **Haiku** | Switch | ~$80 |
| 6 | Property Valuation | Sonnet 3.5 v2 | 🎯 **Opus** | Upgrade | ($120) |
| 7 | Neighborhood Profiles | Sonnet 3.5 v2 | ✅ Sonnet 3.5 v2 | Keep | - |
| 8 | Market Updates | Sonnet 3.5 v2 | 💰 **Haiku** | Switch | ~$150 |
| 9 | Competitor Analysis | Sonnet 3.5 v2 | ✅ Sonnet 3.5 v2 | Keep | - |
| 10 | NAP Audit | Sonnet 3.5 v2 | 💰 **Haiku** | Switch | ~$50 |
| 11 | Photo Analysis | Claude | 🔄 **Gemini 1.5 Pro** | Switch | ~$30 |
| 12 | Day to Dusk | Gemini | ✅ Gemini Imagen | Keep | - |
| 13 | Virtual Staging | Gemini | ✅ Gemini Imagen | Keep | - |
| 14 | Photo Enhancement | Gemini | ✅ Gemini Imagen | Keep | - |
| 15 | Room Renovation | Gemini | ✅ Gemini Imagen | Keep | - |
| 16 | Object Removal | Gemini | ✅ Gemini Imagen | Keep | - |
| 17 | Header Images | Gemini | ✅ Gemini Imagen | Keep | - |
| 18 | Voice Role Play | Sonnet 3.5 v2 | 🔄 **Gemini 2.0 Flash** | Switch | ~$400 |
| 19 | Chat Assistant | Sonnet 3.5 v2 | 🎯 **Haiku + Sonnet** | Hybrid | ~$600 |
| 20 | Marketing Plans | Sonnet 3.5 v2 | ✅ Sonnet 3.5 v2 | Keep | - |
| 21 | SEO Keywords | Sonnet 3.5 v2 | 💰 **Haiku** | Switch | ~$60 |
| 22 | Listing FAQs | Sonnet 3.5 v2 | 💰 **Haiku** | Switch | ~$40 |
| 23 | FutureCast | Sonnet 3.5 v2 | 🎯 **Opus** | Upgrade | ($60) |
| 24 | Client Nudges | Sonnet 3.5 v2 | 💰 **Haiku** | Switch | ~$250 |
| 25 | Agent Bio | Sonnet 3.5 v2 | ✅ Sonnet 3.5 v2 | Keep | - |
| 26 | Social Proof | Sonnet 3.5 v2 | ✅ Sonnet 3.5 v2 | Keep | - |
| 27 | Transcription | AWS Transcribe | ✅ AWS Transcribe | Keep | - |
| 28 | Voice to Content | Sonnet 3.5 v2 | ✅ Sonnet 3.5 v2 | Keep | - |
| 29 | Review Sentiment | Sonnet 3.5 v2 | 💰 **Haiku** | Switch | ~$100 |
| 30 | Performance Metrics | Sonnet 3.5 v2 | 💰 **Haiku** | Switch | ~$70 |
| 31 | Training Plans | Sonnet 3.5 v2 | ✅ Sonnet 3.5 v2 | Keep | - |
| 32 | Neighborhood Guides | Sonnet 3.5 v2 | ✅ Sonnet 3.5 v2 | Keep | - |
| 33 | Follow-up Content | Sonnet 3.5 v2 | 💰 **Haiku** | Switch | ~$120 |
| 34 | Post Cards | Mixed | 🎯 **Gemini + Haiku** | Optimize | ~$40 |
| 35 | Renovation ROI | Sonnet 3.5 v2 | 🎯 **Opus** | Upgrade | ($40) |

**Legend:**
- ✅ **Keep** - Current model is optimal
- 💰 **Switch to Haiku** - Cost savings opportunity
- 🎯 **Upgrade to Opus** - Accuracy improvement needed
- 🔄 **Switch to Gemini** - Better suited for task

**Total Estimated Savings: $2,000/month (57% reduction)**

---

## 🎯 Priority Actions

### Phase 1: High-Impact Cost Savings (Week 1)
**Target Savings: ~$1,400/month**

1. **Client Nudges** → Haiku ($250/mo savings)
   - High volume, simple personalization
   - File: `src/features/client-dashboards/actions/client-nudge-actions.ts`

2. **Social Media Posts** → Haiku ($200/mo savings)
   - High volume, short content
   - File: `src/aws/bedrock/flows/generate-social-media-post.ts`

3. **Market Updates** → Haiku ($150/mo savings)
   - Regular updates, template-based
   - File: `src/aws/bedrock/flows/generate-market-update.ts`

4. **Follow-up Content** → Haiku ($120/mo savings)
   - Email templates, high frequency
   - File: `src/aws/bedrock/flows/generate-follow-up-content.ts`

5. **Review Sentiment** → Haiku ($100/mo savings)
   - Simple classification task
   - File: `src/aws/bedrock/flows/analyze-review-sentiment.ts`

6. **Chat Assistant** → Haiku/Sonnet Hybrid ($600/mo savings)
   - Route based on complexity
   - File: `src/lib/bayon-assistant-types.ts`

### Phase 2: Quality Improvements (Week 2)
**Target: Better accuracy on critical features**

1. **Property Valuation** → Opus
   - Critical financial decisions
   - File: `src/aws/bedrock/flows/property-valuation.ts`

2. **FutureCast** → Opus
   - Market predictions
   - File: `src/aws/bedrock/flows/generate-future-cast.ts`

3. **Renovation ROI** → Opus
   - Investment calculations
   - File: `src/aws/bedrock/flows/renovation-roi.ts`

### Phase 3: Multi-Modal Optimization (Week 3)
**Target: Better UX and capabilities**

1. **Photo Analysis** → Gemini 1.5 Pro
   - Superior vision capabilities
   - File: `src/aws/bedrock/flows/reimagine-analyze.ts`
   - Use: `src/aws/google-ai/flows/gemini-analyze.ts`

2. **Voice Role Play** → Gemini 2.0 Flash (Already Done ✅)
   - Native audio support
   - File: `src/hooks/use-gemini-live.ts`

---

## 📈 Cost Comparison Chart

### Current State
```
Content Generation  ████████████ $900
Analysis & Research ████████ $540
Visual Features     ████ $200
Interactive/Chat    ████████████████ $1,440
Marketing/SEO       ████████ $450
──────────────────────────────────
Total: $3,530/month
```

### After Optimization
```
Content Generation  ████ $350
Analysis & Research ████ $420
Visual Features     ████ $200
Interactive/Chat    ████ $480
Marketing/SEO       █ $80
──────────────────────────────────
Total: $1,530/month
Savings: $2,000/month (57% ↓)
```

---

## 🔧 Implementation Checklist

### Code Changes Required

#### 1. Update Model Configurations (`flow-base.ts`)
```typescript
// Add to MODEL_CONFIGS
HIGH_VOLUME: {
  modelId: BEDROCK_MODELS.HAIKU,
  temperature: 0.6,
  maxTokens: 1024,
},
```

#### 2. Update Individual Flows
For each "Switch to Haiku" recommendation:
```typescript
// Change from:
options: MODEL_CONFIGS.CREATIVE,

// To:
options: MODEL_CONFIGS.HIGH_VOLUME,
```

For each "Upgrade to Opus" recommendation:
```typescript
// Change from:
options: MODEL_CONFIGS.BALANCED,

// To:
options: MODEL_CONFIGS.CRITICAL,
```

#### 3. Add Intelligent Routing
Create new file: `src/aws/bedrock/model-router.ts`
```typescript
export function selectModelForQuery(
  query: string,
  context?: ConversationContext
): string {
  // Implementation from main doc
}
```

#### 4. Update Gemini Flows
```typescript
// For photo analysis, use:
import { analyzeRoomWithGemini } from '@/aws/google-ai/flows/gemini-analyze';

// Instead of Claude-based analysis
```

---

## 📊 Success Metrics

Track these metrics post-implementation:

### Cost Metrics
- [ ] Monthly AI spend reduced by 50%+
- [ ] Cost per feature tracked in CloudWatch
- [ ] Token usage optimized (fewer regenerations)

### Quality Metrics
- [ ] User satisfaction scores maintained or improved
- [ ] Regeneration rate < 10% for all features
- [ ] Accuracy on financial features improved (Opus upgrade)

### Performance Metrics
- [ ] Average response time reduced on high-volume features
- [ ] P95 latency < 3 seconds for all features
- [ ] Zero quality regressions

---

## 🚀 Quick Start Commands

### 1. View Full Recommendations
```bash
cat docs/AI_MODEL_OPTIMIZATION_RECOMMENDATIONS.md
```

### 2. Search for Features to Update
```bash
# Find all social media generation references
grep -r "generateSocialMediaPost" src/

# Find all model config usages
grep -r "MODEL_CONFIGS" src/aws/bedrock/flows/
```

### 3. Test Model Changes
```bash
# Run tests for a specific flow
npm test -- generate-social-media-post.test.ts

# Test all flows
npm test -- flows/
```

---

## 💡 Key Insights

### When to Use Each Model

**Claude 3 Haiku** - Use when:
- Content is < 1000 words
- High volume/frequency
- Template-based with personalization
- Speed matters more than creativity
- Examples: Social posts, emails, simple analysis

**Claude 3.5 Sonnet v2** - Use when:
- Balanced quality and cost needed
- Medium complexity content
- Creative writing required
- Multi-step reasoning
- Examples: Blog posts, descriptions, guides

**Claude 3 Opus** - Use when:
- Accuracy is critical
- Financial implications
- Complex reasoning required
- Liability concerns
- Examples: Valuations, forecasts, ROI analysis

**Gemini 2.0 Flash** - Use when:
- Real-time interaction needed
- Voice/audio processing
- Low latency critical
- Multi-modal requirements
- Examples: Voice chat, live interactions

**Gemini 1.5 Pro** - Use when:
- Vision analysis required
- Large context needed (> 200K tokens)
- Image understanding critical
- Examples: Photo analysis, document processing

**Gemini Imagen 3** - Use when:
- Image generation required
- Visual transformations needed
- Style transfer
- Examples: All Reimagine features, header images

---

## 🔍 Before You Change

### Validation Steps
1. **Review current performance**
   - Check CloudWatch logs for current quality
   - Document user feedback
   - Measure current costs

2. **A/B test the change**
   - Roll out to 10% of users first
   - Compare metrics side-by-side
   - Get user feedback

3. **Monitor closely**
   - Watch for quality regressions
   - Track regeneration rates
   - Monitor user satisfaction

4. **Have rollback ready**
   - Keep old model as fallback
   - Use feature flags
   - Can revert in < 5 minutes

---

## 📞 Questions or Issues?

If you encounter problems:
1. Check the full recommendations doc for details
2. Review the implementation examples
3. Test changes in development first
4. Monitor metrics closely after deployment

Remember: **Quality over savings**. If a model change degrades quality, revert immediately.
