/**
 * AI Visibility Optimization Zod Schemas
 * 
 * Validation schemas for AI visibility data structures
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { z } from 'zod';

/**
 * AI Platform enum schema
 */
export const AIPlatformSchema = z.enum(['chatgpt', 'claude', 'perplexity', 'gemini', 'bing-chat']);

/**
 * AI Visibility Score Breakdown schema
 */
export const AIVisibilityScoreBreakdownSchema = z.object({
  schemaMarkup: z.number().min(0).max(100),
  contentOptimization: z.number().min(0).max(100),
  aiSearchPresence: z.number().min(0).max(100),
  knowledgeGraphIntegration: z.number().min(0).max(100),
  socialSignals: z.number().min(0).max(100),
  technicalSEO: z.number().min(0).max(100),
});

/**
 * AI Visibility Score schema
 */
export const AIVisibilityScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  breakdown: AIVisibilityScoreBreakdownSchema,
  calculatedAt: z.date(),
  trend: z.enum(['improving', 'declining', 'stable']),
  previousScore: z.number().min(0).max(100).optional(),
});

/**
 * AI Mention schema
 */
export const AIMentionSchema = z.object({
  id: z.string().min(1),
  platform: AIPlatformSchema,
  query: z.string().min(1),
  response: z.string().min(1),
  mentionContext: z.string().min(1),
  position: z.number().int().positive(),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  competitorsAlsoMentioned: z.array(z.string()),
  timestamp: z.date(),
  confidence: z.number().min(0).max(1),
});

/**
 * Recommendation category schema
 */
export const RecommendationCategorySchema = z.enum(['schema', 'content', 'technical', 'social', 'competitive']);

/**
 * Recommendation priority schema
 */
export const RecommendationPrioritySchema = z.enum(['high', 'medium', 'low']);

/**
 * Implementation difficulty schema
 */
export const ImplementationDifficultySchema = z.enum(['easy', 'medium', 'hard']);

/**
 * Recommendation status schema
 */
export const RecommendationStatusSchema = z.enum(['pending', 'in-progress', 'completed', 'dismissed']);

/**
 * Optimization Recommendation schema
 */
export const OptimizationRecommendationSchema = z.object({
  id: z.string().min(1),
  category: RecommendationCategorySchema,
  priority: RecommendationPrioritySchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  actionItems: z.array(z.string().min(1)),
  estimatedImpact: z.number().min(0).max(100),
  implementationDifficulty: ImplementationDifficultySchema,
  codeExample: z.string().optional(),
  resources: z.array(z.string().url()).optional(),
  status: RecommendationStatusSchema,
  createdAt: z.date(),
  completedAt: z.date().optional(),
});

/**
 * Schema type schema
 */
export const SchemaTypeSchema = z.enum([
  'RealEstateAgent', 
  'Person', 
  'LocalBusiness', 
  'Organization', 
  'Review', 
  'AggregateRating',
  'FAQPage',
  'Service',
  'Place',
  'City'
]);

/**
 * Postal Address schema
 */
export const PostalAddressSchema = z.object({
  '@type': z.literal('PostalAddress'),
  streetAddress: z.string().min(1),
  addressLocality: z.string().min(1),
  addressRegion: z.string().min(1),
  postalCode: z.string().min(1),
  addressCountry: z.string().min(1),
});

/**
 * Geographic Coordinates schema
 */
export const GeoCoordinatesSchema = z.object({
  '@type': z.literal('GeoCoordinates'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

/**
 * Place schema
 */
export const PlaceSchema = z.object({
  '@type': z.literal('Place'),
  name: z.string().min(1),
  geo: GeoCoordinatesSchema.optional(),
});

/**
 * Person schema
 */
export const PersonSchema = z.object({
  '@type': z.literal('Person'),
  name: z.string().min(1),
});

/**
 * Rating schema
 */
export const RatingSchema = z.object({
  '@type': z.literal('Rating'),
  ratingValue: z.number().min(1).max(5),
  bestRating: z.number().optional(),
  worstRating: z.number().optional(),
});

/**
 * Aggregate Rating schema
 */
export const AggregateRatingSchema = z.object({
  '@type': z.literal('AggregateRating'),
  ratingValue: z.number().min(1).max(5),
  reviewCount: z.number().int().nonnegative(),
  bestRating: z.number().optional(),
  worstRating: z.number().optional(),
});

/**
 * Review schema
 */
export const ReviewSchema = z.object({
  '@type': z.literal('Review'),
  author: PersonSchema,
  reviewRating: RatingSchema,
  reviewBody: z.string().min(1),
  datePublished: z.string().datetime(),
});

/**
 * Organization schema
 */
export const OrganizationSchema = z.object({
  '@type': z.literal('Organization'),
  name: z.string().min(1),
  url: z.string().url().optional(),
});

/**
 * Educational Occupational Credential schema
 */
export const EducationalOccupationalCredentialSchema = z.object({
  '@type': z.literal('EducationalOccupationalCredential'),
  name: z.string().min(1),
  credentialCategory: z.string().min(1),
  recognizedBy: OrganizationSchema.optional(),
});

/**
 * Schema Markup schema
 */
export const SchemaMarkupSchema = z.object({
  '@context': z.string().url(),
  '@type': SchemaTypeSchema,
  '@id': z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url().optional(),
  telephone: z.string().optional(),
  email: z.string().email().optional(),
  address: PostalAddressSchema.optional(),
  geo: GeoCoordinatesSchema.optional(),
  sameAs: z.array(z.string().url()).optional(),
  knowsAbout: z.array(z.string()).optional(),
  areaServed: z.array(PlaceSchema).optional(),
  aggregateRating: AggregateRatingSchema.optional(),
  review: z.array(ReviewSchema).optional(),
  memberOf: OrganizationSchema.optional(),
  hasCredential: z.array(EducationalOccupationalCredentialSchema).optional(),
});

/**
 * Knowledge Graph Entity schema
 */
export const KnowledgeGraphEntitySchema: z.ZodType<any> = z.object({
  '@id': z.string().min(1),
  '@type': z.string().min(1),
  properties: z.record(z.any()),
  relationships: z.array(z.object({
    predicate: z.string().min(1),
    object: z.union([z.string(), z.lazy(() => KnowledgeGraphEntitySchema)]),
  })),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
  serviceArea: z.object({
    type: z.enum(['Polygon', 'Circle']),
    coordinates: z.array(z.array(z.number())),
    radius: z.number().positive().optional(),
  }).optional(),
});

/**
 * RDF Triple schema
 */
export const RDFTripleSchema = z.object({
  subject: z.string().min(1),
  predicate: z.string().min(1),
  object: z.union([z.string(), z.number(), z.boolean()]),
});

/**
 * Export format schema
 */
export const ExportFormatSchema = z.enum(['json-ld', 'rdf-xml', 'turtle', 'microdata']);

/**
 * Export Package schema
 */
export const ExportPackageSchema = z.object({
  jsonLD: z.string().min(1),
  rdfXML: z.string().min(1),
  turtle: z.string().min(1),
  microdata: z.string().min(1),
  instructions: z.string().min(1),
  platformGuides: z.record(z.string().min(1)),
});

/**
 * Validation Result schema
 */
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
});

/**
 * Competitor Analysis schema
 */
export const CompetitorAnalysisSchema = z.object({
  competitors: z.array(z.object({
    name: z.string().min(1),
    aiVisibilityScore: z.number().min(0).max(100),
    mentionFrequency: z.number().nonnegative(),
    strongAreas: z.array(z.string()),
    weakAreas: z.array(z.string()),
  })),
  userPosition: z.number().int().positive(),
  opportunities: z.array(z.string()),
  gaps: z.array(z.string()),
});

/**
 * AI Visibility Analysis schema
 */
export const AIVisibilityAnalysisSchema = z.object({
  userId: z.string().min(1),
  score: AIVisibilityScoreSchema,
  mentions: z.array(AIMentionSchema),
  recommendations: z.array(OptimizationRecommendationSchema),
  schemaAnalysis: z.object({
    current: z.array(SchemaMarkupSchema),
    missing: z.array(SchemaTypeSchema),
    errors: z.array(ValidationResultSchema),
  }),
  knowledgeGraph: z.array(KnowledgeGraphEntitySchema),
  analyzedAt: z.date(),
});

/**
 * AI Monitoring Configuration schema
 */
export const AIMonitoringConfigSchema = z.object({
  userId: z.string().min(1),
  platforms: z.array(AIPlatformSchema).min(1),
  queries: z.array(z.string().min(1)).min(1),
  frequency: z.number().int().positive().max(168), // Max once per week
  locations: z.array(z.string().min(1)),
  competitors: z.array(z.string().min(1)),
  alertThresholds: z.object({
    mentionDecrease: z.number().min(0).max(100),
    sentimentChange: z.number().min(0).max(100),
    competitorIncrease: z.number().min(0).max(100),
  }),
});

/**
 * Website Analysis schema
 */
export const WebsiteAnalysisSchema = z.object({
  url: z.string().url(),
  schemaMarkup: z.array(SchemaMarkupSchema),
  validationResults: z.array(ValidationResultSchema),
  missingSchemas: z.array(SchemaTypeSchema),
  technicalIssues: z.array(z.string()),
  recommendations: z.array(z.string()),
  analyzedAt: z.date(),
});

/**
 * Export Record schema
 */
export const ExportRecordSchema = z.object({
  exportId: z.string().min(1),
  userId: z.string().min(1),
  formats: z.array(ExportFormatSchema).min(1),
  schemaCount: z.number().int().nonnegative(),
  exportedAt: z.date(),
  validation: ValidationResultSchema,
  fileSize: z.number().int().nonnegative().optional(),
  downloadUrls: z.record(ExportFormatSchema, z.string().url()).optional(),
});

/**
 * Input schemas for API operations
 */

/**
 * Create AI Visibility Analysis input schema
 */
export const CreateAIVisibilityAnalysisInputSchema = z.object({
  userId: z.string().min(1),
  includeCompetitorAnalysis: z.boolean().default(true),
  websiteUrl: z.string().url().optional(),
});

/**
 * Update AI Monitoring Config input schema
 */
export const UpdateAIMonitoringConfigInputSchema = AIMonitoringConfigSchema.partial().extend({
  userId: z.string().min(1),
});

/**
 * Create Optimization Recommendation input schema
 */
export const CreateOptimizationRecommendationInputSchema = OptimizationRecommendationSchema.omit({
  id: true,
  createdAt: true,
  completedAt: true,
}).extend({
  userId: z.string().min(1),
});

/**
 * Update Recommendation Status input schema
 */
export const UpdateRecommendationStatusInputSchema = z.object({
  userId: z.string().min(1),
  recommendationId: z.string().min(1),
  status: RecommendationStatusSchema,
  completedAt: z.date().optional(),
});

/**
 * Generate Schema Markup input schema
 */
export const GenerateSchemaMarkupInputSchema = z.object({
  userId: z.string().min(1),
  schemaTypes: z.array(SchemaTypeSchema).min(1),
  includeTestimonials: z.boolean().default(true),
});

/**
 * Validate Schema Markup input schema
 */
export const ValidateSchemaMarkupInputSchema = z.object({
  schemaMarkup: SchemaMarkupSchema,
});

/**
 * Export Schema Data input schema
 */
export const ExportSchemaDataInputSchema = z.object({
  userId: z.string().min(1),
  formats: z.array(ExportFormatSchema).min(1),
  includeInstructions: z.boolean().default(true),
});

/**
 * Content analysis and optimization schemas
 */

/**
 * Real estate entity type schema
 */
export const RealEstateEntityTypeSchema = z.enum([
  'property',
  'neighborhood', 
  'market_term',
  'price_range',
  'property_type',
  'amenity',
  'school_district',
  'transportation',
  'local_business'
]);

/**
 * Real estate entity schema
 */
export const RealEstateEntitySchema = z.object({
  text: z.string().min(1),
  type: RealEstateEntityTypeSchema,
  startIndex: z.number().int().nonnegative(),
  endIndex: z.number().int().nonnegative(),
  confidence: z.number().min(0).max(1),
  suggestedSchema: SchemaTypeSchema.optional(),
  context: z.string().optional(),
});

/**
 * Geographic reference schema
 */
export const GeographicReferenceSchema = z.object({
  text: z.string().min(1),
  startIndex: z.number().int().nonnegative(),
  endIndex: z.number().int().nonnegative(),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
  type: z.enum(['city', 'neighborhood', 'address', 'landmark', 'region']),
  suggestedSchema: SchemaMarkupSchema,
});

/**
 * Semantic markup opportunity schema
 */
export const SemanticMarkupOpportunitySchema = z.object({
  id: z.string().min(1),
  contentSection: z.string().min(1),
  type: z.enum(['entity_markup', 'geographic_markup', 'faq_structure', 'review_markup', 'service_markup']),
  priority: z.enum(['high', 'medium', 'low']),
  description: z.string().min(1),
  implementation: z.string().min(1),
  expectedImpact: z.string().min(1),
  codeExample: z.string().optional(),
});

/**
 * Content optimization recommendation schema
 */
export const ContentOptimizationRecommendationSchema = z.object({
  id: z.string().min(1),
  contentType: z.enum(['faq', 'service_description', 'market_analysis', 'property_listing', 'blog_post']),
  title: z.string().min(1),
  description: z.string().min(1),
  aiOptimizationBenefits: z.array(z.string().min(1)),
  implementationSteps: z.array(z.string().min(1)),
  exampleContent: z.string().optional(),
  schemaMarkup: z.array(SchemaMarkupSchema).optional(),
});

/**
 * Content analysis result schema
 */
export const ContentAnalysisResultSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  content: z.string().min(1),
  contentType: z.string().min(1),
  entities: z.array(RealEstateEntitySchema),
  geographicReferences: z.array(GeographicReferenceSchema),
  markupOpportunities: z.array(SemanticMarkupOpportunitySchema),
  recommendations: z.array(ContentOptimizationRecommendationSchema),
  aiReadabilityScore: z.number().min(0).max(100),
  structureAnalysis: z.object({
    hasHeadings: z.boolean(),
    hasBulletPoints: z.boolean(),
    hasStructuredData: z.boolean(),
    paragraphCount: z.number().int().nonnegative(),
    averageSentenceLength: z.number().positive(),
  }),
  analyzedAt: z.date(),
});

/**
 * AI-optimized content structure schema
 */
export const AIOptimizedContentStructureSchema = z.object({
  sections: z.array(z.object({
    type: z.enum(['heading', 'paragraph', 'list', 'faq', 'structured_data']),
    content: z.string().min(1),
    schemaMarkup: SchemaMarkupSchema.optional(),
    optimizationNotes: z.array(z.string()).optional(),
  })),
  structureScore: z.number().min(0).max(100),
  improvements: z.array(z.string()),
});

/**
 * Analyze content input schema
 */
export const AnalyzeContentInputSchema = z.object({
  userId: z.string().min(1),
  content: z.string().min(1),
  contentType: z.string().min(1),
  includeEntityRecognition: z.boolean().default(true),
  includeGeographicAnalysis: z.boolean().default(true),
  includeOptimizationRecommendations: z.boolean().default(true),
});

/**
 * Generate content recommendations input schema
 */
export const GenerateContentRecommendationsInputSchema = z.object({
  userId: z.string().min(1),
  contentType: z.enum(['faq', 'service_description', 'market_analysis', 'property_listing', 'blog_post']),
  targetKeywords: z.array(z.string()).optional(),
  location: z.string().optional(),
  specialization: z.string().optional(),
});

/**
 * Template variable schema
 */
export const TemplateVariableSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['text', 'number', 'boolean', 'array', 'object']),
  required: z.boolean(),
  description: z.string().min(1),
  defaultValue: z.any().optional(),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    options: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * Validation rule schema
 */
export const ValidationRuleSchema = z.object({
  field: z.string().min(1),
  rule: z.enum(['required', 'minLength', 'maxLength', 'pattern', 'custom']),
  value: z.any().optional(),
  message: z.string().min(1),
  customValidator: z.function().optional(),
});

/**
 * SEO optimization schema
 */
export const SEOOptimizationSchema = z.object({
  type: z.enum(['heading_structure', 'keyword_density', 'meta_tags', 'internal_links', 'schema_markup']),
  description: z.string().min(1),
  implementation: z.string().min(1),
  aiSystemBenefit: z.string().min(1),
});

/**
 * Content template schema
 */
export const ContentTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  contentType: z.enum(['faq', 'service_description', 'market_analysis', 'property_listing', 'blog_post']),
  category: z.string().min(1),
  tags: z.array(z.string()),
  structure: AIOptimizedContentStructureSchema,
  schemaMarkup: z.array(SchemaMarkupSchema),
  aiOptimizationFeatures: z.array(z.string()),
  variables: z.array(TemplateVariableSchema),
  validationRules: z.array(ValidationRuleSchema),
  seoOptimizations: z.array(SEOOptimizationSchema),
});

/**
 * Template generation result schema
 */
export const TemplateGenerationResultSchema = z.object({
  content: z.string().min(1),
  schemaMarkup: z.array(SchemaMarkupSchema),
  metadata: z.object({
    wordCount: z.number().int().nonnegative(),
    readingTime: z.number().int().nonnegative(),
    aiReadabilityScore: z.number().min(0).max(100),
    seoScore: z.number().min(0).max(100),
  }),
  validationResults: z.object({
    isValid: z.boolean(),
    errors: z.array(z.string()),
    warnings: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
});

/**
 * Generate template content input schema
 */
export const GenerateTemplateContentInputSchema = z.object({
  templateId: z.string().min(1),
  variables: z.record(z.any()),
  validateOutput: z.boolean().default(true),
});

/**
 * Type inference helpers (for internal use only - types exported from types.ts)
 */
type AIPlatform = z.infer<typeof AIPlatformSchema>;
type AIVisibilityScoreBreakdown = z.infer<typeof AIVisibilityScoreBreakdownSchema>;
type AIVisibilityScore = z.infer<typeof AIVisibilityScoreSchema>;
type AIMention = z.infer<typeof AIMentionSchema>;
type OptimizationRecommendation = z.infer<typeof OptimizationRecommendationSchema>;
type SchemaMarkup = z.infer<typeof SchemaMarkupSchema>;
type KnowledgeGraphEntity = z.infer<typeof KnowledgeGraphEntitySchema>;
type AIVisibilityAnalysis = z.infer<typeof AIVisibilityAnalysisSchema>;
type AIMonitoringConfig = z.infer<typeof AIMonitoringConfigSchema>;
type WebsiteAnalysis = z.infer<typeof WebsiteAnalysisSchema>;

// Input type exports
export type CreateAIVisibilityAnalysisInput = z.infer<typeof CreateAIVisibilityAnalysisInputSchema>;
export type UpdateAIMonitoringConfigInput = z.infer<typeof UpdateAIMonitoringConfigInputSchema>;
export type CreateOptimizationRecommendationInput = z.infer<typeof CreateOptimizationRecommendationInputSchema>;
export type UpdateRecommendationStatusInput = z.infer<typeof UpdateRecommendationStatusInputSchema>;
export type GenerateSchemaMarkupInput = z.infer<typeof GenerateSchemaMarkupInputSchema>;
export type ValidateSchemaMarkupInput = z.infer<typeof ValidateSchemaMarkupInputSchema>;
export type ExportSchemaDataInput = z.infer<typeof ExportSchemaDataInputSchema>;
export type AnalyzeContentInput = z.infer<typeof AnalyzeContentInputSchema>;
export type GenerateContentRecommendationsInput = z.infer<typeof GenerateContentRecommendationsInputSchema>;
export type GenerateTemplateContentInput = z.infer<typeof GenerateTemplateContentInputSchema>;