/**
 * Vision Agent for Real Estate Property Analysis
 * 
 * This agent provides real-time AI analysis of property images using Claude's vision capabilities.
 * It identifies visual elements, provides actionable recommendations, and aligns advice with
 * current market trends from the agent's profile.
 * 
 * Features:
 * - Visual element identification (materials, colors, lighting, size, layout)
 * - Actionable recommendations with cost estimates and priorities
 * - Market trend alignment based on agent profile
 * - Conversational, immediate, and helpful tone for live interaction
 * 
 * Requirements validated:
 * - 6.1: Analyzes visual input and identifies key visual elements
 * - 6.2: Identifies materials, colors, lighting, size, and layout
 * - 6.3: Provides concise, actionable, and cost-effective recommendations
 * - 6.4: Grounds advice in current market trends from Agent Profile Context
 * - 6.5: Maintains conversational, immediate, and helpful tone
 */

import { getBedrockClient } from './client';
import { MODEL_CONFIGS } from './flow-base';
import {
  VisionAnalysisInputSchema,
  VisionAnalysisOutputSchema,
  type VisionAnalysisInput,
  type VisionAnalysisOutput,
  type ImageFormat,
} from '@/ai/schemas/vision-analysis-schemas';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Vision Agent class for property image analysis
 */
export class VisionAgent {
  private readonly FLOW_NAME = 'vision-analysis';

  /**
   * Converts AgentProfile to the schema format expected by the vision analysis
   */
  private convertAgentProfile(profile: AgentProfile) {
    return {
      agentName: profile.agentName,
      primaryMarket: profile.primaryMarket,
      specialization: profile.specialization,
      preferredTone: profile.preferredTone,
      corePrinciple: profile.corePrinciple,
    };
  }

  /**
   * Constructs the system prompt for vision analysis
   */
  private constructSystemPrompt(agentProfile: VisionAnalysisInput['agentProfile']): string {
    return `You are a real estate property consultant with expertise in visual analysis and property improvement recommendations.

Your role is to analyze property images and provide immediate, actionable insights that help real estate agents advise their clients on property improvements, staging, and marketing strategies.

AGENT CONTEXT:
- Agent Name: ${agentProfile.agentName}
- Primary Market: ${agentProfile.primaryMarket}
- Specialization: ${agentProfile.specialization}
- Preferred Tone: ${agentProfile.preferredTone}
- Core Principle: ${agentProfile.corePrinciple}

ANALYSIS GUIDELINES:
1. Visual Element Identification:
   - Identify materials (e.g., hardwood, granite, stainless steel, tile)
   - Note colors and color schemes
   - Assess lighting (natural, artificial, or mixed)
   - Categorize size (small, medium, large)
   - Describe layout and spatial arrangement
   - Highlight notable features

2. Recommendations:
   - Provide 2-5 specific, actionable recommendations
   - Each recommendation should be practical and implementable
   - Categorize cost as low, medium, or high
   - Assign priority as high, medium, or low
   - Explain the rationale and expected impact
   - Focus on improvements that enhance marketability

3. Market Alignment:
   - Reference current trends in ${agentProfile.primaryMarket}
   - Consider the ${agentProfile.specialization} market segment
   - Align recommendations with local buyer preferences
   - Mention how improvements align with market expectations

4. Tone and Style:
   - Use a ${agentProfile.preferredTone} tone
   - Be conversational and immediate (suitable for live interaction)
   - Be helpful and supportive
   - Avoid overly technical jargon
   - Provide clear, direct answers

IMPORTANT: Respond with ONLY valid JSON matching the required schema. Do not include any markdown formatting, code blocks, or explanatory text.`;
  }

  /**
   * Constructs the user prompt for vision analysis
   */
  private constructUserPrompt(input: VisionAnalysisInput): string {
    let prompt = `Please analyze this property image and answer the following question:\n\n${input.question}`;

    if (input.propertyType) {
      prompt += `\n\nProperty Type: ${input.propertyType}`;
    }

    prompt += `\n\nProvide a comprehensive analysis including:
1. Visual elements (materials, colors, lighting, size, layout)
2. Actionable recommendations with cost estimates and priorities
3. Market alignment analysis for ${input.agentProfile.primaryMarket}
4. Overall assessment
5. Direct answer to the question`;

    return prompt;
  }

  /**
   * Analyzes a property image and provides recommendations
   * 
   * @param input - Vision analysis input with image data and question
   * @param userId - Optional user ID for execution logging
   * @returns Vision analysis output with visual elements, recommendations, and market alignment
   */
  async analyze(input: VisionAnalysisInput, userId?: string): Promise<VisionAnalysisOutput> {
    // Validate input
    const validatedInput = VisionAnalysisInputSchema.parse(input);

    // Get Bedrock client with analytical model configuration
    const client = getBedrockClient(MODEL_CONFIGS.ANALYTICAL.modelId);

    // Construct prompts
    const systemPrompt = this.constructSystemPrompt(validatedInput.agentProfile);
    const userPrompt = this.constructUserPrompt(validatedInput);

    // Prepare image content
    const imageContent = {
      data: validatedInput.imageData,
      format: validatedInput.imageFormat,
    };

    // Invoke Bedrock with vision capabilities
    const response = await client.invokeWithVision<VisionAnalysisOutput>(
      systemPrompt,
      userPrompt,
      imageContent,
      VisionAnalysisOutputSchema,
      {
        temperature: MODEL_CONFIGS.ANALYTICAL.temperature,
        maxTokens: MODEL_CONFIGS.ANALYTICAL.maxTokens,
        topP: 1,
        flowName: this.FLOW_NAME,
        executionMetadata: {
          userId,
          featureCategory: 'vision-analysis',
          temperature: MODEL_CONFIGS.ANALYTICAL.temperature,
          maxTokens: MODEL_CONFIGS.ANALYTICAL.maxTokens,
          topP: 1,
        },
      }
    );

    return response;
  }

  /**
   * Convenience method to analyze with an AgentProfile object
   * 
   * @param imageData - Base64 encoded image data
   * @param imageFormat - Image format
   * @param question - Question or analysis request
   * @param agentProfile - Agent profile for personalization
   * @param propertyType - Optional property type
   * @param userId - Optional user ID for execution logging
   * @returns Vision analysis output
   */
  async analyzeWithProfile(
    imageData: string,
    imageFormat: ImageFormat,
    question: string,
    agentProfile: AgentProfile,
    propertyType?: string,
    userId?: string
  ): Promise<VisionAnalysisOutput> {
    const input: VisionAnalysisInput = {
      imageData,
      imageFormat,
      question,
      agentProfile: this.convertAgentProfile(agentProfile),
      propertyType,
    };

    return this.analyze(input, userId);
  }
}

/**
 * Singleton instance of the Vision Agent
 */
let visionAgentInstance: VisionAgent | null = null;

/**
 * Gets the singleton Vision Agent instance
 */
export function getVisionAgent(): VisionAgent {
  if (!visionAgentInstance) {
    visionAgentInstance = new VisionAgent();
  }
  return visionAgentInstance;
}

/**
 * Resets the Vision Agent singleton (useful for testing)
 */
export function resetVisionAgent(): void {
  visionAgentInstance = null;
}
