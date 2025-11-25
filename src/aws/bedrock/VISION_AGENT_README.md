# Vision Agent

The Vision Agent provides real-time AI analysis of property images using Claude's vision capabilities. It identifies visual elements, provides actionable recommendations, and aligns advice with current market trends.

## Features

- **Visual Element Identification**: Identifies materials, colors, lighting, size, and layout
- **Actionable Recommendations**: Provides 2-5 specific recommendations with cost estimates and priorities
- **Market Trend Alignment**: Grounds advice in current market trends from the agent's profile
- **Conversational Tone**: Maintains a helpful, immediate tone suitable for live interaction
- **Personalization**: Adapts analysis based on agent profile (market, specialization, tone)

## Requirements Validated

- **6.1**: Analyzes visual input and identifies key visual elements
- **6.2**: Identifies materials, colors, lighting, size, and layout
- **6.3**: Provides concise, actionable, and cost-effective recommendations
- **6.4**: Grounds advice in current market trends from Agent Profile Context
- **6.5**: Maintains conversational, immediate, and helpful tone

## Usage

### Basic Usage

```typescript
import { getVisionAgent } from "@/aws/bedrock/vision-agent";
import { getAgentProfileRepository } from "@/aws/dynamodb/agent-profile-repository";

// Get the agent profile
const profileRepo = getAgentProfileRepository();
const agentProfile = await profileRepo.getProfile(userId);

// Get the vision agent
const visionAgent = getVisionAgent();

// Analyze an image
const analysis = await visionAgent.analyzeWithProfile(
  imageBase64, // Base64 encoded image data
  "jpeg", // Image format
  "What improvements would you recommend for this kitchen?",
  agentProfile,
  "single-family", // Optional property type
  userId // Optional user ID for logging
);

console.log(analysis.visualElements);
console.log(analysis.recommendations);
console.log(analysis.marketAlignment);
console.log(analysis.answer);
```

### Using the Input Schema Directly

```typescript
import { getVisionAgent } from "@/aws/bedrock/vision-agent";
import type { VisionAnalysisInput } from "@/ai/schemas/vision-analysis-schemas";

const visionAgent = getVisionAgent();

const input: VisionAnalysisInput = {
  imageData: imageBase64,
  imageFormat: "jpeg",
  question: "How can I improve the curb appeal of this property?",
  agentProfile: {
    agentName: "Jane Smith",
    primaryMarket: "Seattle, WA",
    specialization: "luxury",
    preferredTone: "warm-consultative",
    corePrinciple: "Maximize client ROI with data-first strategies",
  },
  propertyType: "single-family",
};

const analysis = await visionAgent.analyze(input, userId);
```

## Input Schema

```typescript
interface VisionAnalysisInput {
  imageData: string; // Base64 encoded image
  imageFormat: "jpeg" | "png" | "webp" | "gif";
  question: string; // Question or analysis request
  agentProfile: {
    agentName: string;
    primaryMarket: string;
    specialization:
      | "luxury"
      | "first-time-buyers"
      | "investment"
      | "commercial"
      | "general";
    preferredTone:
      | "warm-consultative"
      | "direct-data-driven"
      | "professional"
      | "casual";
    corePrinciple: string;
  };
  propertyType?: string; // Optional property type
}
```

## Output Schema

```typescript
interface VisionAnalysisOutput {
  visualElements: {
    materials: string[]; // e.g., ['hardwood', 'granite', 'stainless steel']
    colors: string[]; // e.g., ['white', 'gray', 'natural wood']
    lighting: "natural" | "artificial" | "mixed";
    size: "small" | "medium" | "large";
    layout: string; // Description of layout
    notableFeatures?: string[]; // Additional features
  };
  recommendations: Array<{
    action: string; // Specific recommendation
    rationale: string; // Why this is valuable
    estimatedCost: "low" | "medium" | "high";
    priority: "high" | "medium" | "low";
    expectedImpact?: string; // Expected impact on value
  }>;
  marketAlignment: string; // Market trend analysis
  overallAssessment: string; // Overall property assessment
  answer: string; // Direct answer to question
}
```

## Common Use Cases

### 1. Staging Recommendations

```typescript
const analysis = await visionAgent.analyzeWithProfile(
  kitchenImageBase64,
  "jpeg",
  "What improvements would you recommend for staging this kitchen?",
  agentProfile
);

// Filter high-priority recommendations
const stagingPriorities = analysis.recommendations.filter(
  (rec) => rec.priority === "high"
);
```

### 2. Renovation Advice

```typescript
const analysis = await visionAgent.analyzeWithProfile(
  bathroomImageBase64,
  "png",
  "What cost-effective renovations would increase the value of this bathroom?",
  agentProfile
);

// Find low-cost, high-impact improvements
const quickWins = analysis.recommendations.filter(
  (rec) => rec.estimatedCost === "low" && rec.priority === "high"
);
```

### 3. Curb Appeal Analysis

```typescript
const analysis = await visionAgent.analyzeWithProfile(
  exteriorImageBase64,
  "jpeg",
  "How can I improve the curb appeal of this property?",
  agentProfile,
  "single-family"
);

// Group by cost
const byEstimatedCost = {
  low: analysis.recommendations.filter((r) => r.estimatedCost === "low"),
  medium: analysis.recommendations.filter((r) => r.estimatedCost === "medium"),
  high: analysis.recommendations.filter((r) => r.estimatedCost === "high"),
};
```

### 4. Multi-Room Analysis

```typescript
const rooms = [
  { name: "Kitchen", imageBase64: kitchenImage, imageFormat: "jpeg" },
  { name: "Living Room", imageBase64: livingRoomImage, imageFormat: "jpeg" },
  { name: "Master Bedroom", imageBase64: bedroomImage, imageFormat: "jpeg" },
];

const analyses = await Promise.all(
  rooms.map((room) =>
    visionAgent.analyzeWithProfile(
      room.imageBase64,
      room.imageFormat,
      `What improvements would you recommend for this ${room.name}?`,
      agentProfile
    )
  )
);

// Aggregate all recommendations
const allRecommendations = analyses.flatMap((a) => a.recommendations);
```

## Image Format Support

The Vision Agent supports the following image formats:

- **JPEG** (`.jpg`, `.jpeg`)
- **PNG** (`.png`)
- **WebP** (`.webp`)
- **GIF** (`.gif`)

Images should be base64 encoded before passing to the agent.

## Performance Considerations

- **Image Size**: Larger images may take longer to process. Consider resizing images to a reasonable size (e.g., 1920x1080) before analysis.
- **Batch Processing**: When analyzing multiple images, use `Promise.all()` for parallel processing.
- **Caching**: Consider caching analysis results for frequently accessed images.
- **Token Usage**: Vision analysis typically uses more tokens than text-only requests. Monitor usage for cost optimization.

## Error Handling

```typescript
try {
  const analysis = await visionAgent.analyzeWithProfile(
    imageBase64,
    "jpeg",
    question,
    agentProfile
  );
} catch (error) {
  if (error instanceof BedrockError) {
    console.error("Bedrock API error:", error.message);
    // Handle API errors (throttling, timeout, etc.)
  } else if (error instanceof BedrockParseError) {
    console.error("Response parsing error:", error.message);
    // Handle schema validation errors
  } else {
    console.error("Unexpected error:", error);
  }
}
```

## Integration with Server Actions

```typescript
// src/app/vision-actions.ts
"use server";

import { getVisionAgent } from "@/aws/bedrock/vision-agent";
import { getAgentProfileRepository } from "@/aws/dynamodb/agent-profile-repository";
import { getCurrentUser } from "@/aws/auth/cognito-client";

export async function analyzePropertyImage(
  imageBase64: string,
  imageFormat: "jpeg" | "png" | "webp" | "gif",
  question: string,
  propertyType?: string
) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { error: "User not authenticated" };
    }

    // Get agent profile
    const profileRepo = getAgentProfileRepository();
    const agentProfile = await profileRepo.getProfile(user.userId);

    if (!agentProfile) {
      return {
        error: "Agent profile not found. Please create a profile first.",
      };
    }

    // Analyze image
    const visionAgent = getVisionAgent();
    const analysis = await visionAgent.analyzeWithProfile(
      imageBase64,
      imageFormat,
      question,
      agentProfile,
      propertyType,
      user.userId
    );

    return { success: true, data: analysis };
  } catch (error) {
    console.error("Vision analysis error:", error);
    return { error: "Failed to analyze image. Please try again." };
  }
}
```

## Testing

See `vision-agent-example.ts` for comprehensive usage examples and test scenarios.

## Related Files

- **Schemas**: `src/ai/schemas/vision-analysis-schemas.ts`
- **Examples**: `src/aws/bedrock/vision-agent-example.ts`
- **Client**: `src/aws/bedrock/client.ts` (vision capabilities)
- **Agent Profile**: `src/aws/dynamodb/agent-profile-repository.ts`
