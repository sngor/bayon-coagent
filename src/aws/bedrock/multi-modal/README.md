# Multi-Modal Processing Module

This module provides specialized agent strands for processing different media types including images, videos, audio, and documents. Each strand is designed to handle specific content types with deep expertise and integration with AWS Bedrock's multi-modal capabilities.

## Image Analysis Strand

The `ImageAnalysisStrand` provides comprehensive analysis of property images for real estate applications.

### Features

- **Quality Assessment**: Evaluates image quality across multiple dimensions

  - Resolution scoring
  - Lighting quality analysis
  - Composition assessment
  - Clarity/sharpness evaluation
  - Overall quality score

- **Content Identification**: Identifies what's in the image

  - Room type detection
  - Feature identification
  - Style classification
  - Condition assessment
  - Material recognition
  - Color scheme analysis

- **Improvement Suggestions**: Provides actionable recommendations

  - Staging advice
  - Lighting improvements
  - Angle/composition suggestions
  - Editing recommendations
  - Decluttering guidance
  - Repair priorities
  - Enhancement opportunities

- **Market Alignment**: Contextualizes recommendations based on agent profile
  - Local market trends
  - Target buyer preferences
  - Specialization-specific advice

### Usage

#### Basic Usage

```typescript
import { getImageAnalysisStrand } from "@/aws/bedrock/multi-modal";

const strand = getImageAnalysisStrand();

// Comprehensive analysis
const analysis = await strand.analyzeImage(
  {
    imageData: base64ImageData,
    imageFormat: "jpeg",
    analysisType: "comprehensive",
    propertyType: "Single Family Home",
    agentProfile: myAgentProfile,
  },
  userId
);

console.log("Quality:", analysis.quality);
console.log("Content:", analysis.content);
console.log("Suggestions:", analysis.suggestions);
```

#### Quality Assessment Only

```typescript
const quality = await strand.assessQuality(base64ImageData, "jpeg", userId);

console.log(`Overall Quality: ${(quality.overall * 100).toFixed(1)}%`);
```

#### Content Identification

```typescript
const content = await strand.identifyContent(
  base64ImageData,
  "jpeg",
  "Condominium",
  userId
);

console.log("Room Type:", content.roomType);
console.log("Materials:", content.materials);
console.log("Features:", content.features);
```

#### Improvement Suggestions

```typescript
const suggestions = await strand.suggestImprovements(
  base64ImageData,
  "jpeg",
  agentProfile,
  userId
);

suggestions.forEach((suggestion) => {
  console.log(`${suggestion.priority}: ${suggestion.description}`);
  console.log(`Cost: ${suggestion.estimatedCost}`);
  console.log(`Impact: ${suggestion.expectedImpact}`);
});
```

### Analysis Types

The strand supports four analysis types:

1. **`quality`**: Focus on image quality metrics only
2. **`content`**: Focus on identifying what's in the image
3. **`suggestions`**: Focus on improvement recommendations
4. **`comprehensive`**: Complete analysis including all aspects (default)

### Data Structures

#### ImageQualityMetrics

```typescript
interface ImageQualityMetrics {
  resolution: number; // 0-1 score
  lighting: number; // 0-1 score
  composition: number; // 0-1 score
  clarity: number; // 0-1 score
  overall: number; // 0-1 score (average)
}
```

#### ImageContent

```typescript
interface ImageContent {
  roomType: string; // e.g., "Kitchen", "Living Room"
  features: string[]; // Notable features
  style: string; // e.g., "Modern", "Traditional"
  condition: string; // e.g., "Excellent Condition"
  materials: string[]; // Materials identified
  colors: string[]; // Color scheme
}
```

#### ImageImprovement

```typescript
interface ImageImprovement {
  type:
    | "staging"
    | "lighting"
    | "angle"
    | "editing"
    | "declutter"
    | "repair"
    | "enhancement";
  description: string;
  rationale: string;
  estimatedCost: "low" | "medium" | "high";
  priority: "high" | "medium" | "low";
  expectedImpact: string;
}
```

### Integration with AgentCore

The `ImageAnalysisStrand` implements the `AgentStrand` interface and can be registered with AgentCore for automatic task allocation:

```typescript
import { getAgentCore } from "@/aws/bedrock/agent-core";
import { getImageAnalysisStrand } from "@/aws/bedrock/multi-modal";

const agentCore = getAgentCore();
const imageStrand = getImageAnalysisStrand();

// The strand is now available for task allocation
// AgentCore will route image analysis tasks to this strand
```

### Capabilities

The strand declares the following capabilities:

- **Expertise**: image-analysis, quality-assessment, content-identification, visual-recommendations, property-photography, staging-advice
- **Task Types**: image-quality-assessment, content-identification, improvement-suggestions, comprehensive-analysis
- **Quality Score**: 0.92
- **Speed Score**: 0.85
- **Reliability Score**: 0.95
- **Max Concurrent Tasks**: 3
- **Preferred Model**: Claude 3.5 Sonnet

### Performance Metrics

The strand automatically tracks:

- Tasks completed
- Success rate
- Average execution time
- Current load
- Recent quality ratings

### Requirements Validated

This implementation validates the following requirements from the AgentStrands Enhancement specification:

- **Requirement 5.1**: WHEN a property image is uploaded, THEN the system SHALL analyze the image and suggest improvements or enhancements

### Correctness Properties

This implementation supports testing of the following correctness property:

- **Property 21: Image analysis completeness** - For any uploaded property image, the analysis should include quality metrics, content identification, and improvement suggestions

### Examples

See `image-analysis-example.ts` for comprehensive usage examples including:

1. Comprehensive image analysis
2. Quality assessment only
3. Content identification
4. Improvement suggestions
5. Batch image analysis
6. AgentCore integration

### Future Enhancements

Planned enhancements for the Image Analysis Strand:

- [ ] Support for video frame analysis
- [ ] Comparison analysis (before/after)
- [ ] Automated staging recommendations with product links
- [ ] Integration with image editing services
- [ ] Historical trend analysis for property types
- [ ] Competitive property comparison

## Video Script Generator Strand

The `VideoScriptGenerator` provides comprehensive video script generation for real estate content across multiple platforms.

### Features

- **Engagement Hook Generation**: Creates compelling hooks that grab attention in the first few seconds
- **Structured Section Creation**: Breaks content into clear, logical sections with timing
- **Call-to-Action Generation**: Creates clear, actionable CTAs for lead conversion
- **Platform-Specific Optimization**: Optimizes scripts for YouTube, Instagram, TikTok, Facebook, and LinkedIn
- **Duration-Based Adaptation**: Adjusts content to fit target duration
- **Real Estate Specialization**: Tailored for real estate content and agent profiles

### Usage

#### Basic Usage

```typescript
import { getVideoScriptGenerator } from "@/aws/bedrock/multi-modal";

const generator = getVideoScriptGenerator();

// Generate a complete video script
const script = await generator.generateScript(
  {
    topic: "Luxury waterfront property tour in Miami Beach",
    duration: 600, // 10 minutes
    style: "property-tour",
    platform: "youtube",
    targetAudience: "High-net-worth buyers",
    keyPoints: [
      "Panoramic ocean views",
      "Private beach access",
      "Smart home technology",
    ],
    agentProfile: myAgentProfile,
  },
  userId
);

console.log("Title:", script.title);
console.log("Hook:", script.hook);
console.log("Sections:", script.sections.length);
console.log("CTA:", script.callToAction);
```

#### Generate Just a Hook

```typescript
const hook = await generator.generateHook(
  "Why now is the best time to sell your home",
  3, // 3 seconds
  "market-update",
  userId
);
```

#### Generate a Call-to-Action

```typescript
const cta = await generator.generateCallToAction(
  "schedule a free home valuation consultation",
  agentProfile,
  userId
);
```

#### Optimize for Different Platform

```typescript
// Generate for YouTube
const youtubeScript = await generator.generateScript(
  {
    topic: "Top 5 neighborhoods for families",
    duration: 480,
    style: "educational",
    platform: "youtube",
  },
  userId
);

// Optimize for Instagram
const instagramScript = await generator.optimizeForPlatform(
  youtubeScript,
  "instagram",
  userId
);
```

### Video Styles

The generator supports multiple video styles:

- **`educational`**: Teaching and informative content
- **`promotional`**: Marketing and promotional videos
- **`storytelling`**: Narrative-driven content
- **`testimonial`**: Client success stories
- **`property-tour`**: Property walkthroughs
- **`market-update`**: Market trends and insights
- **`tips-and-tricks`**: Quick tips and advice
- **`behind-the-scenes`**: Day-in-the-life content

### Platform Optimization

Each platform has specific optimization parameters:

#### YouTube

- Optimal Duration: 8-15 minutes
- Hook Duration: 5 seconds
- Pacing: Medium
- CTA Placement: Multiple throughout
- Best for: Educational, in-depth content

#### Instagram

- Optimal Duration: 15-90 seconds
- Hook Duration: 2 seconds
- Pacing: Fast
- Format: Vertical (9:16)
- Best for: Visual-first, quick tips

#### TikTok

- Optimal Duration: 15-60 seconds
- Hook Duration: 1 second
- Pacing: Fast
- Format: Vertical (9:16)
- Best for: Entertaining, authentic content

#### Facebook

- Optimal Duration: 1-3 minutes
- Hook Duration: 3 seconds
- Pacing: Medium
- Format: Square (1:1) or horizontal
- Best for: Community-focused, shareable content

#### LinkedIn

- Optimal Duration: 30 seconds - 3 minutes
- Hook Duration: 3 seconds
- Pacing: Medium
- Best for: Professional, industry insights

### Data Structures

#### VideoScript

```typescript
interface VideoScript {
  title: string;
  hook: string;
  sections: ScriptSection[];
  callToAction: string;
  estimatedDuration: number;
  keywords: string[];
  description?: string;
  hashtags?: string[];
  platformNotes?: string[];
}
```

#### ScriptSection

```typescript
interface ScriptSection {
  title: string;
  content: string;
  duration: number;
  visualSuggestions: string[];
  brollSuggestions?: string[];
  onScreenText?: string[];
}
```

### Integration with AgentCore

The `VideoScriptGenerator` implements the `AgentStrand` interface:

```typescript
import { getAgentCore } from "@/aws/bedrock/agent-core";
import { getVideoScriptGenerator } from "@/aws/bedrock/multi-modal";

const agentCore = getAgentCore();
const videoGenerator = getVideoScriptGenerator();

// The strand is now available for task allocation
```

### Capabilities

The strand declares the following capabilities:

- **Expertise**: video-script-writing, engagement-hooks, storytelling, platform-optimization, real-estate-content, call-to-action-creation
- **Task Types**: video-script-generation, hook-creation, platform-optimization, content-structuring
- **Quality Score**: 0.90
- **Speed Score**: 0.88
- **Reliability Score**: 0.93
- **Max Concurrent Tasks**: 4
- **Preferred Model**: Claude 3.5 Sonnet

### Requirements Validated

This implementation validates the following requirements:

- **Requirement 5.2**: WHEN video content is requested, THEN the system SHALL generate optimized video scripts with engagement hooks and calls-to-action

### Correctness Properties

This implementation supports testing of the following correctness property:

- **Property 22: Video script structure** - For any generated video script, it should include an engagement hook, structured sections, and a call-to-action

### Examples

See `video-script-example.ts` for comprehensive usage examples including:

1. YouTube property tour script
2. TikTok quick tip
3. Instagram market update
4. Facebook educational video
5. Engagement hook generation
6. Call-to-action generation
7. Platform optimization
8. Testimonial video script
9. Behind-the-scenes content
10. LinkedIn professional insights

## Audio Content Creator Strand

The `AudioContentCreator` provides comprehensive audio content generation with voice optimization, pacing notes, and pronunciation guidance.

### Features

- **Voice-Optimized Script Generation**: Creates scripts specifically designed for natural voice delivery
- **Pacing and Timing Notes**: Provides detailed pacing instructions including pauses, emphasis, and speed variations
- **Pronunciation Guidance**: Offers phonetic pronunciations for difficult words and technical terms
- **Format-Specific Optimization**: Optimizes for podcasts, voiceovers, audio ads, audiobooks, voice messages, and radio spots
- **Real Estate Specialization**: Tailored for real estate content and agent profiles

### Usage

#### Basic Usage

```typescript
import { getAudioContentCreator } from "@/aws/bedrock/multi-modal";

const creator = getAudioContentCreator();

// Generate a complete audio script
const script = await creator.generateScript(
  {
    topic: "First-Time Home Buyer Tips for 2024",
    duration: 1200, // 20 minutes
    format: "podcast",
    style: "conversational",
    targetAudience: "First-time home buyers aged 25-35",
    keyPoints: [
      "Understanding your budget",
      "Working with an agent",
      "Making competitive offers",
    ],
    tone: "friendly",
    agentProfile: myAgentProfile,
  },
  userId
);

console.log("Title:", script.title);
console.log("Duration:", script.estimatedDuration);
console.log("Pronunciation Guide:", script.pronunciationGuide);
console.log("Pacing Notes:", script.overallPacingNotes);
```

#### Generate Podcast Script

```typescript
const podcastScript = await creator.generatePodcastScript(
  "Austin Real Estate Market Update",
  600, // 10 minutes
  agentProfile,
  userId
);
```

#### Generate Audio Advertisement

```typescript
const audioAd = await creator.generateAudioAd(
  "Open House This Weekend - Stunning 4BR Home",
  30, // 30 seconds
  agentProfile,
  userId
);
```

#### Generate Voiceover

```typescript
const voiceover = await creator.generateVoiceoverScript(
  "Luxury Waterfront Estate - Virtual Tour",
  180, // 3 minutes
  "storytelling",
  userId
);
```

#### Optimize Existing Text for Voice

```typescript
const existingText = `
  Welcome to 123 Oak Street, a beautifully renovated home...
`;

const optimizedScript = await creator.optimizeForVoice(
  existingText,
  "voiceover",
  userId
);
```

### Audio Formats

The creator supports multiple audio formats:

- **`podcast`**: Long-form conversational content (15-60 minutes)
- **`voiceover`**: Narration for video content (30 seconds - 5 minutes)
- **`audio-ad`**: Short promotional spots (15-60 seconds)
- **`audiobook`**: Extended narration (30 minutes - 2 hours)
- **`voice-message`**: Personal messages (30 seconds - 3 minutes)
- **`radio-spot`**: Radio advertisements (30-60 seconds)

### Audio Styles

The creator supports multiple delivery styles:

- **`conversational`**: Natural, casual tone
- **`professional`**: Formal, authoritative delivery
- **`storytelling`**: Narrative-driven content
- **`educational`**: Teaching and informative
- **`promotional`**: Marketing and sales-focused
- **`interview`**: Q&A format
- **`narrative`**: Story-based delivery

### Data Structures

#### AudioScript

```typescript
interface AudioScript {
  title: string;
  opening: string;
  segments: AudioSegment[];
  closing: string;
  estimatedDuration: number;
  pronunciationGuide: PronunciationGuide[];
  overallPacingNotes: string[];
  deliveryTips: string[];
  targetAudience?: string;
  keyMessages?: string[];
}
```

#### AudioSegment

```typescript
interface AudioSegment {
  title: string;
  content: string;
  duration: number;
  pacingNotes: PacingNote[];
  deliveryStyle: string;
  musicSuggestions?: string[];
  soundEffects?: string[];
}
```

#### PacingNote

```typescript
interface PacingNote {
  location: string;
  type: "pause" | "slow-down" | "speed-up" | "emphasis" | "breath";
  duration?: number; // For pauses
  instruction: string;
}
```

#### PronunciationGuide

```typescript
interface PronunciationGuide {
  word: string;
  pronunciation: string;
  notes?: string;
}
```

### Integration with AgentCore

The `AudioContentCreator` implements the `AgentStrand` interface:

```typescript
import { getAgentCore } from "@/aws/bedrock/agent-core";
import { getAudioContentCreator } from "@/aws/bedrock/multi-modal";

const agentCore = getAgentCore();
const audioCreator = getAudioContentCreator();

// The strand is now available for task allocation
```

### Capabilities

The strand declares the following capabilities:

- **Expertise**: audio-script-writing, voice-optimization, podcast-production, pacing-guidance, pronunciation-coaching, audio-storytelling
- **Task Types**: audio-script-generation, podcast-script-creation, voiceover-writing, audio-ad-creation
- **Quality Score**: 0.91
- **Speed Score**: 0.87
- **Reliability Score**: 0.94
- **Max Concurrent Tasks**: 4
- **Preferred Model**: Claude 3.5 Sonnet

### Requirements Validated

This implementation validates the following requirements:

- **Requirement 5.3**: WHEN audio content is needed, THEN the system SHALL create podcast scripts or audio content optimized for voice delivery

### Correctness Properties

This implementation supports testing of the following correctness property:

- **Property 23: Audio optimization** - For any generated audio content, the script should be optimized for voice delivery (appropriate pacing, pronunciation notes, pauses)

### Examples

See `audio-content-example.ts` for comprehensive usage examples including:

1. Podcast episode generation
2. Audio advertisement creation
3. Property voiceover scripts
4. Text optimization for voice
5. Market update podcasts
6. Voice messages for clients
7. Pacing and pronunciation features

### Voice Optimization Features

The AudioContentCreator provides several key voice optimization features:

1. **Conversational Language**: Scripts written for natural speech, not reading
2. **Pacing Control**: Strategic pauses, emphasis markers, and speed variations
3. **Pronunciation Guidance**: Phonetic spellings for difficult words
4. **Delivery Tips**: Energy level, tone, and emotion guidance
5. **Breath Marks**: Natural breathing points for longer passages
6. **Format-Specific Optimization**: Tailored to each audio format's best practices

## Document Processor Strand

The `DocumentProcessor` provides comprehensive document processing capabilities including key insight extraction, summarization, and knowledge base integration.

### Features

- **Key Insight Extraction**: Extracts facts, statistics, recommendations, warnings, opportunities, and trends
- **Document Summarization**: Creates brief and detailed summaries with key points
- **Entity Extraction**: Identifies people, places, organizations, and properties
- **Knowledge Base Integration**: Indexes documents for searchable content
- **Action Item Extraction**: Identifies actionable tasks and deadlines
- **Multi-Format Support**: Handles PDF, DOCX, TXT, MD, HTML, and JSON documents
- **Real Estate Specialization**: Optimized for real estate documents (contracts, reports, appraisals, etc.)

### Usage

#### Basic Usage

```typescript
import { getDocumentProcessor } from "@/aws/bedrock/multi-modal";

const processor = getDocumentProcessor();

// Process a document comprehensively
const analysis = await processor.processDocument(
  {
    content: documentText,
    format: "txt",
    documentType: "market-report",
    filename: "q4-2024-market-report.txt",
    focus: "comprehensive",
    agentProfile: myAgentProfile,
  },
  userId
);

console.log("Title:", analysis.metadata.title);
console.log("Summary:", analysis.summary.brief);
console.log("Insights:", analysis.insights.length);
console.log("Quality Score:", analysis.qualityScore);
```

#### Extract Insights Only

```typescript
const insights = await processor.extractInsights(
  documentContent,
  "pdf",
  userId
);

// Filter high-importance insights
const criticalInsights = insights.filter(
  (insight) => insight.importance === "high"
);
```

#### Generate Summary

```typescript
const summary = await processor.summarizeDocument(
  articleContent,
  "txt",
  userId
);

console.log("Brief:", summary.brief);
console.log("Key Points:", summary.keyPoints);
console.log("Topics:", summary.topics);
```

#### Index for Knowledge Base

```typescript
const entry = await processor.indexDocument(
  documentContent,
  "docx",
  "buyer-guide.docx",
  agentProfile,
  userId
);

// Entry is now searchable
console.log("Indexed:", entry.id);
console.log("Chunks:", entry.contentChunks.length);
```

#### Search Indexed Documents

```typescript
const results = await processor.searchDocuments("first-time buyer tips", 10);

results.forEach((result) => {
  console.log(result.metadata.title);
  console.log(result.summary);
});
```

### Document Types

The processor supports multiple document categories:

- **`contract`**: Legal contracts and agreements
- **`listing-agreement`**: Property listing agreements
- **`market-report`**: Market analysis and reports
- **`property-disclosure`**: Property disclosure documents
- **`inspection-report`**: Property inspection reports
- **`appraisal`**: Property appraisals and valuations
- **`research-paper`**: Research and analysis papers
- **`article`**: Articles and blog posts
- **`guide`**: How-to guides and tutorials
- **`presentation`**: Presentation materials
- **`general`**: General documents

### Processing Focus Options

The processor supports different processing focuses:

- **`comprehensive`**: Complete analysis across all dimensions (default)
- **`insights`**: Prioritizes deep insight extraction
- **`summary`**: Prioritizes summarization and key points
- **`indexing`**: Prioritizes metadata extraction and knowledge base integration

### Data Structures

#### DocumentAnalysis

```typescript
interface DocumentAnalysis {
  metadata: DocumentMetadata;
  summary: DocumentSummary;
  insights: DocumentInsight[];
  entities: {
    people: string[];
    places: string[];
    organizations: string[];
    properties: string[];
  };
  actionItems: string[];
  questions: string[];
  relatedTopics: string[];
  qualityScore: number;
}
```

#### DocumentInsight

```typescript
interface DocumentInsight {
  category:
    | "key-fact"
    | "statistic"
    | "recommendation"
    | "warning"
    | "opportunity"
    | "trend";
  content: string;
  importance: "high" | "medium" | "low";
  sourceLocation?: string;
  tags: string[];
  confidence: number;
}
```

#### KnowledgeBaseEntry

```typescript
interface KnowledgeBaseEntry {
  id: string;
  metadata: DocumentMetadata;
  summary: string;
  contentChunks: {
    text: string;
    embedding?: number[];
    metadata: Record<string, any>;
  }[];
  insights: DocumentInsight[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

### Integration with AgentCore

The `DocumentProcessor` implements the `AgentStrand` interface:

```typescript
import { getAgentCore } from "@/aws/bedrock/agent-core";
import { getDocumentProcessor } from "@/aws/bedrock/multi-modal";

const agentCore = getAgentCore();
const docProcessor = getDocumentProcessor();

// The strand is now available for task allocation
```

### Capabilities

The strand declares the following capabilities:

- **Expertise**: document-analysis, insight-extraction, knowledge-management, document-indexing, content-summarization, entity-extraction
- **Task Types**: document-processing, insight-extraction, document-summarization, knowledge-base-integration
- **Quality Score**: 0.93
- **Speed Score**: 0.84
- **Reliability Score**: 0.96
- **Max Concurrent Tasks**: 3
- **Preferred Model**: Claude 3.5 Sonnet

### Requirements Validated

This implementation validates the following requirements:

- **Requirement 5.4**: WHEN documents are uploaded, THEN the system SHALL extract key insights and integrate them into the knowledge base

### Correctness Properties

This implementation supports testing of the following correctness property:

- **Property 24: Document insight extraction** - For any uploaded document, key insights should be extracted and stored in the knowledge base with proper indexing

### Examples

See `document-processor-example.ts` for comprehensive usage examples including:

1. Market report processing
2. Inspection report analysis
3. Article summarization
4. Knowledge base indexing
5. Document search
6. Multiple document processing
7. Real-world integration examples

### Knowledge Base Integration

Documents are automatically prepared for knowledge base integration:

1. **Content Chunking**: Documents split into ~500-word chunks for efficient search
2. **Metadata Extraction**: Rich metadata enables filtering and categorization
3. **Tag Generation**: Automatic tagging for topic-based discovery
4. **Insight Indexing**: Key insights separately indexed for quick access
5. **Related Topics**: Automatic linking to related content

### Real Estate Specialization

The Document Processor is optimized for real estate content:

- **Market Reports**: Extracts metrics, trends, forecasts
- **Inspection Reports**: Identifies issues, costs, recommendations
- **Contracts**: Highlights key terms, deadlines, obligations
- **Listing Agreements**: Extracts terms, commissions, exclusivity
- **Appraisals**: Captures valuations, comparables, adjustments
- **Market Research**: Identifies trends, opportunities, insights

## Architecture

All multi-modal strands follow a consistent architecture:

1. **Implement AgentStrand Interface**: Each strand implements the standard `AgentStrand` interface for compatibility with AgentCore
2. **Leverage Existing Services**: Strands build on existing services (VisionAgent, etc.) rather than duplicating functionality
3. **Provide Specialized Methods**: Each strand exposes domain-specific methods for its content type
4. **Track Performance**: All strands track their own performance metrics
5. **Support Personalization**: Strands accept agent profiles for personalized results

## Testing

Property-based tests for multi-modal strands are located in:

- `src/aws/bedrock/__tests__/multi-modal/`

Unit tests validate:

- Quality assessment accuracy
- Content identification correctness
- Suggestion relevance
- Integration with underlying services
- Performance metrics tracking

## Contributing

When adding new multi-modal strands:

1. Implement the `AgentStrand` interface
2. Add appropriate capabilities and expertise
3. Create comprehensive examples
4. Write property-based tests
5. Update this README
6. Export from `index.ts`
