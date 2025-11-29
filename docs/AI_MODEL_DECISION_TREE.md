# AI Model Selection Decision Tree 🌳

## Visual Guide for Choosing the Right AI Model

```
                        ┌─────────────────────────────────┐
                        │   What type of task is this?    │
                        └──────────────┬──────────────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                │                      │                      │
                ▼                      ▼                      ▼
    ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
    │  TEXT GENERATION  │  │  IMAGE / VISION   │  │   VOICE / AUDIO   │
    └─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘
              │                      │                        │
              │                      │                        │
    ┌─────────▼─────────┐            │                        │
    │  Critical accuracy │            │                        │
    │  or financial?     │            │                        │
    └─────────┬─────────┘            │                        │
              │                      │                        │
        ┌─────┴─────┐                │                        │
        │           │                │                        │
       YES         NO                │                        │
        │           │                │                        │
        │     ┌─────▼─────────┐      │                        │
        │     │  High volume   │      │                        │
        │     │  (100s/day)?   │      │                        │
        │     └─────┬─────────┘      │                        │
        │           │                │                        │
        │     ┌─────┴─────┐          │                        │
        │     │           │          │                        │
        │    YES         NO          │                        │
        │     │           │          │                        │
        │     │           │          │                        │
        ▼     ▼           ▼          │                        │
    ┌────────────┐ ┌────────────┐ ┌────────────┐             │
    │   OPUS     │ │   HAIKU    │ │ SONNET 3.5 │             │
    │   $$$      │ │    $       │ │    $$      │             │
    │  Accuracy  │ │   Speed    │ │  Balanced  │             │
    └────────────┘ └────────────┘ └────────────┘             │
                                                              │
                                  ┌─────────────────┴─────────┴─────┐
                                  │                                 │
                            ┌─────▼─────────┐               ┌───────▼────────┐
                            │  Generate     │               │  Real-time     │
                            │  images?      │               │  interaction?  │
                            └─────┬─────────┘               └───────┬────────┘
                                  │                                 │
                            ┌─────┴─────┐                          YES
                            │           │                           │
                           YES         NO                           │
                            │           │                           │
                            │     ┌─────▼─────────┐                 │
                            │     │  Analyze      │                 │
                            │     │  photos?      │                 │
                            │     └─────┬─────────┘                 │
                            │           │                           │
                            │     ┌─────┴─────┐                     │
                            │     │           │                     │
                            │    YES         NO                     │
                            │     │           │                     │
                            ▼     ▼           ▼                     ▼
                      ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                      │ GEMINI IMAGEN│  │ GEMINI 1.5   │  │ GEMINI 2.0   │
                      │    Text→Img  │  │    PRO       │  │    FLASH     │
                      │              │  │   Vision     │  │   Audio I/O  │
                      └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Quick Reference Table

| Task Type | Question to Ask | Recommended Model | Cost | Use Cases |
|-----------|----------------|-------------------|------|-----------|
| **Critical Text** | Financial/legal accuracy needed? | **Claude Opus** | $$$ | Property valuation, ROI, forecasts |
| **High-Volume Text** | Generate 100s per day? | **Claude Haiku** | $ | Social posts, emails, nudges |
| **Balanced Text** | Quality matters but not critical? | **Claude Sonnet 3.5** | $$ | Blog posts, descriptions, guides |
| **Image Generation** | Need to create images? | **Gemini Imagen 3** | ~$0.04/img | Staging, renovation, headers |
| **Image Analysis** | Need to understand photos? | **Gemini 1.5 Pro** | $$ | Photo analysis, room detection |
| **Voice/Audio** | Real-time conversation? | **Gemini 2.0 Flash** | $ | Voice role-play, live chat |

---

## Model Characteristics

### Claude 3 Haiku 🟢
**When to use:** High-volume, simple tasks
```
✓ 2-3x faster than Sonnet
✓ 92% cheaper than Sonnet  
✓ Great for structured outputs
✓ 200K context window
✗ Less creative than Sonnet
✗ Limited reasoning depth
```

**Best for:**
- Social media posts (short content)
- Email templates and follow-ups
- Client nudges (personalized messages)
- Simple data analysis
- Q&A generation
- Sentiment classification

---

### Claude 3.5 Sonnet v2 🟣
**When to use:** Balanced quality and cost
```
✓ Excellent reasoning
✓ High-quality creative writing
✓ Good at long-form content
✓ 200K context window
✓ Structured output support
~ Moderate cost ($3/$15 per MTok)
```

**Best for:**
- Blog posts (1500+ words)
- Listing descriptions
- Neighborhood guides
- Video scripts
- Marketing plans
- Training content

---

### Claude 3 Opus 🟡
**When to use:** Critical accuracy required
```
✓ Highest reasoning capability
✓ Best at complex analysis
✓ Ideal for financial tasks
✓ Most accurate outputs
✗ 5x more expensive than Sonnet
✗ Slower response time
```

**Best for:**
- Property valuations ($100K+ decisions)
- Market forecasting
- ROI calculations
- Legal/compliance content
- Complex competitive analysis

---

### Gemini 2.0 Flash 🔴
**When to use:** Real-time, multi-modal needs
```
✓ Native audio I/O support
✓ Extremely low latency
✓ 95% cheaper than Sonnet
✓ 1M context window
✓ Multi-modal (text + audio)
~ Newer model, less proven
```

**Best for:**
- Voice conversations
- Real-time role-play
- Live coaching sessions
- Audio transcription + analysis
- Interactive tutoring

---

### Gemini 1.5 Pro 🔵
**When to use:** Vision and large context
```
✓ Superior image understanding
✓ 2M context window
✓ Multi-modal capabilities
✓ Better than Claude for vision
~ More expensive for text-only
```

**Best for:**
- Photo analysis (room detection)
- Property photo categorization
- Visual style identification
- Document processing with images
- Large document analysis

---

### Gemini Imagen 3 🟢
**When to use:** Image generation only
```
✓ High-quality image generation
✓ Style control
✓ Inpainting/outpainting
✓ Real estate optimized
✗ No text generation
```

**Best for:**
- Virtual staging
- Day-to-dusk conversion
- Room renovation mockups
- Property photo enhancement
- Header image creation

---

## Decision Flowchart (Text Format)

### Step 1: Identify Task Category
```
Is it primarily:
├─ Text generation? → Go to Step 2
├─ Image generation? → Use Gemini Imagen 3
├─ Image analysis? → Use Gemini 1.5 Pro
└─ Voice/audio? → Use Gemini 2.0 Flash
```

### Step 2: For Text Tasks, Assess Criticality
```
Does it involve:
├─ Financial calculations? → Use Claude Opus
├─ Legal/compliance? → Use Claude Opus
├─ Property valuations? → Use Claude Opus
└─ Other? → Go to Step 3
```

### Step 3: For Non-Critical Text, Check Volume
```
How many per day:
├─ 100+ requests/day? → Use Claude Haiku
├─ 10-100 requests/day? → Go to Step 4
└─ < 10 requests/day? → Use Claude Sonnet (cost not critical)
```

### Step 4: For Medium Volume, Check Complexity
```
Does it require:
├─ Long-form content (1000+ words)? → Use Claude Sonnet
├─ Creative writing? → Use Claude Sonnet
├─ Multi-step reasoning? → Use Claude Sonnet
├─ Simple templates/structure? → Use Claude Haiku
└─ Short content (< 500 words)? → Use Claude Haiku
```

---

## Interactive Chat: Intelligent Routing 🔀

For chat/assistant features, route dynamically:

```python
def select_model_for_chat(query, conversation_history):
    # Critical keywords → Opus
    if any(word in query.lower() for word in 
          ['valuation', 'appraisal', 'roi', 'forecast', 'price']):
        return 'Claude Opus'
    
    # Complex queries → Sonnet
    if (len(conversation_history) > 10 or 
        any(word in query.lower() for word in 
           ['analyze', 'compare', 'explain why', 'strategy'])):
        return 'Claude Sonnet 3.5'
    
    # Default to Haiku (70% of queries)
    return 'Claude Haiku'
```

**Expected distribution:**
- 70% Haiku (simple queries)
- 25% Sonnet (complex queries)
- 5% Opus (critical queries)

**Savings:** ~$600/month on chat features

---

## Cost Optimization Matrix

### By Use Case

| Use Case | Current | Optimized | Monthly Savings |
|----------|---------|-----------|-----------------|
| Social Media (500/day) | Sonnet | Haiku | $200 |
| Client Nudges (1000/day) | Sonnet | Haiku | $250 |
| Market Updates (100/day) | Sonnet | Haiku | $150 |
| Blog Posts (20/day) | Sonnet | Sonnet ✓ | - |
| Property Valuations (10/day) | Sonnet | Opus | ($120) |
| Chat Messages (2000/day) | Sonnet | Mixed | $600 |
| **Total** | | | **+$1,930/mo** |

---

## Implementation Priority

### 🚀 Phase 1: Quick Wins (Week 1)
**Focus:** High-volume → Haiku  
**Impact:** $1,400/month savings

1. Social media posts
2. Client nudges  
3. Market updates
4. Follow-up emails

---

### 🎯 Phase 2: Quality Upgrades (Week 2)
**Focus:** Critical → Opus  
**Impact:** Better accuracy (worth the $220/mo cost)

1. Property valuations
2. Market forecasts
3. ROI calculations

---

### 🔄 Phase 3: Smart Routing (Week 3)
**Focus:** Chat → Dynamic  
**Impact:** $600/month savings

1. Implement model router
2. Add complexity analysis
3. Monitor and tune

---

### 🎨 Phase 4: Multi-Modal (Week 4)
**Focus:** Vision/Voice → Gemini  
**Impact:** $370/month savings + better UX

1. Photo analysis → Gemini Pro
2. Voice features → Gemini Flash (already done)

---

## Monitoring Checklist

Track these metrics:

- [ ] **Cost per feature** (daily)
- [ ] **User satisfaction** (weekly surveys)
- [ ] **Regeneration rate** (< 10% target)
- [ ] **Response latency** (P95 < 3 seconds)
- [ ] **Error rate** (< 1% target)
- [ ] **Quality scores** (user ratings)

---

## Quick Command Reference

```bash
# Find all model configurations
grep -r "MODEL_CONFIGS" src/aws/bedrock/flows/

# Find specific model usage
grep -r "BEDROCK_MODELS.SONNET_3_5_V2" src/

# Test a flow after changes
npm test -- generate-social-media-post.test.ts

# View model costs in CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AIModels \
  --metric-name TokenUsage
```

---

## Summary Decision Table

| If your task is... | Use this model | Why |
|-------------------|----------------|-----|
| Critical accuracy (money) | Opus | Best reasoning, worth the cost |
| High volume (100s/day) | Haiku | 92% cheaper, fast enough |
| Long-form content | Sonnet | Best quality/cost balance |
| Image generation | Gemini Imagen | Only option |
| Photo analysis | Gemini Pro | Better vision than Claude |
| Real-time voice | Gemini Flash | Native audio, low latency |
| General chat | Route: Haiku/Sonnet | 70/30 split saves 60% |

---

**Final Recommendation:** Use this decision tree every time you add or modify an AI feature. Start with the most cost-effective model that meets your quality requirements, then upgrade only if needed.
