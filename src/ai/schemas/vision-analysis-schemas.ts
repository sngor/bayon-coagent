/**
 * Zod schemas for Vision Analysis Agent
 * 
 * This agent handles real-time property image/video analysis including:
 * - Visual element identification (materials, colors, lighting, size, layout)
 * - Actionable recommendations for property improvements
 * - Market trend alignment
 * - Cost estimation and priority assignment
 */

import { z } from 'zod';

/**
 * Image format types supported by Claude vision
 */
export const ImageFormatSchema = z.enum(['jpeg', 'png', 'webp', 'gif']);

export type ImageFormat = z.infer<typeof ImageFormatSchema>;

/**
 * Lighting types
 */
export const LightingTypeSchema = z.enum(['natural', 'artificial', 'mixed']);

export type LightingType = z.infer<typeof LightingTypeSchema>;

/**
 * Size categories
 */
export const SizeCategorySchema = z.enum(['small', 'medium', 'large']);

export type SizeCategory = z.infer<typeof SizeCategorySchema>;

/**
 * Cost estimation categories
 */
export const CostEstimationSchema = z.enum(['low', 'medium', 'high']);

export type CostEstimation = z.infer<typeof CostEstimationSchema>;

/**
 * Priority levels
 */
export const PriorityLevelSchema = z.enum(['high', 'medium', 'low']);

export type PriorityLevel = z.infer<typeof PriorityLevelSchema>;

/**
 * Agent profile schema for personalization
 */
export const AgentProfileContextSchema = z.object({
  agentName: z.string(),
  primaryMarket: z.string(),
  specialization: z.enum(['luxury', 'first-time-buyers', 'investment', 'commercial', 'general']),
  preferredTone: z.enum(['warm-consultative', 'direct-data-driven', 'professional', 'casual']),
  corePrinciple: z.string(),
});

export type AgentProfileContext = z.infer<typeof AgentProfileContextSchema>;

/**
 * Visual elements identified in the image
 */
export const VisualElementsSchema = z.object({
  /** Materials identified in the property */
  materials: z.array(z.string()).describe('Materials identified in the property (e.g., hardwood, granite, stainless steel)'),
  
  /** Colors present in the space */
  colors: z.array(z.string()).describe('Colors present in the space'),
  
  /** Lighting type */
  lighting: LightingTypeSchema.describe('Type of lighting in the space'),
  
  /** Size category of the space */
  size: SizeCategorySchema.describe('Size category of the space'),
  
  /** Layout description */
  layout: z.string().describe('Description of the layout and spatial arrangement'),
  
  /** Additional notable features */
  notableFeatures: z.array(z.string()).optional().describe('Additional notable features or characteristics'),
});

export type VisualElements = z.infer<typeof VisualElementsSchema>;

/**
 * Recommendation for property improvement
 */
export const RecommendationSchema = z.object({
  /** Recommended action */
  action: z.string().describe('Specific actionable recommendation'),
  
  /** Rationale for the recommendation */
  rationale: z.string().describe('Explanation of why this recommendation is valuable'),
  
  /** Estimated cost category */
  estimatedCost: CostEstimationSchema.describe('Estimated cost category for implementing this recommendation'),
  
  /** Priority level */
  priority: PriorityLevelSchema.describe('Priority level for this recommendation'),
  
  /** Expected impact */
  expectedImpact: z.string().optional().describe('Expected impact on property value or marketability'),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

/**
 * Input schema for Vision Analysis Agent
 */
export const VisionAnalysisInputSchema = z.object({
  /** Base64 encoded image data */
  imageData: z.string().describe('Base64 encoded image data'),
  
  /** Image format */
  imageFormat: ImageFormatSchema.describe('Format of the image'),
  
  /** Question or analysis request from the user */
  question: z.string().describe('Question or specific analysis request from the user'),
  
  /** Agent profile for personalization and market context */
  agentProfile: AgentProfileContextSchema.describe('Agent profile for personalization and market context'),
  
  /** Optional property type context */
  propertyType: z.string().optional().describe('Type of property (e.g., single-family, condo, commercial)'),
});

export type VisionAnalysisInput = z.infer<typeof VisionAnalysisInputSchema>;

/**
 * Output schema for Vision Analysis Agent
 */
export const VisionAnalysisOutputSchema = z.object({
  /** Visual elements identified in the image */
  visualElements: VisualElementsSchema.describe('Visual elements identified in the image'),
  
  /** Actionable recommendations */
  recommendations: z.array(RecommendationSchema).describe('Actionable recommendations for property improvements'),
  
  /** Market alignment analysis */
  marketAlignment: z.string().describe('Analysis of how the property aligns with current market trends in the agent\'s primary market'),
  
  /** Overall assessment */
  overallAssessment: z.string().describe('Overall assessment of the property based on the visual analysis'),
  
  /** Direct answer to the user's question */
  answer: z.string().describe('Direct answer to the user\'s specific question'),
});

export type VisionAnalysisOutput = z.infer<typeof VisionAnalysisOutputSchema>;
