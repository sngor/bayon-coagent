/**
 * AI Visibility Optimization Module
 * 
 * Main exports for AI visibility functionality
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

// Type exports from types.ts
export type {
  AIPlatform,
  AIVisibilityScoreBreakdown,
  AIVisibilityScore,
  AIMention,
  RecommendationCategory,
  RecommendationPriority,
  ImplementationDifficulty,
  RecommendationStatus,
  OptimizationRecommendation,
  SchemaType,
  SchemaMarkup,
  PostalAddress,
  GeoCoordinates,
  Place,
  AggregateRating,
  Review,
  Person,
  Rating,
  Organization,
  EducationalOccupationalCredential,
  KnowledgeGraphEntity,
  RDFTriple,
  ExportFormat,
  ExportPackage,
  ValidationResult,
  AIVisibilityAnalysis,
  CompetitorAnalysis,
  AIMonitoringConfig,
  WebsiteAnalysis,
  ExportRecord,
  // Content analysis types
  RealEstateEntityType,
  RealEstateEntity,
  GeographicReference,
  SemanticMarkupOpportunity,
  ContentOptimizationRecommendation,
  ContentAnalysisResult,
  AIOptimizedContentStructure,
  // Template types
  TemplateVariable,
  ValidationRule,
  SEOOptimization,
  ContentTemplate,
  TemplateGenerationResult,
} from './types';

// Schema exports from schemas.ts
export {
  AIPlatformSchema,
  AIVisibilityScoreBreakdownSchema,
  AIVisibilityScoreSchema,
  AIMentionSchema,
  RecommendationCategorySchema,
  RecommendationPrioritySchema,
  ImplementationDifficultySchema,
  RecommendationStatusSchema,
  OptimizationRecommendationSchema,
  SchemaTypeSchema,
  PostalAddressSchema,
  GeoCoordinatesSchema,
  PlaceSchema,
  PersonSchema,
  RatingSchema,
  AggregateRatingSchema,
  ReviewSchema,
  OrganizationSchema,
  EducationalOccupationalCredentialSchema,
  SchemaMarkupSchema,
  KnowledgeGraphEntitySchema,
  RDFTripleSchema,
  ExportFormatSchema,
  ExportPackageSchema,
  ValidationResultSchema,
  CompetitorAnalysisSchema,
  AIVisibilityAnalysisSchema,
  AIMonitoringConfigSchema,
  WebsiteAnalysisSchema,
  ExportRecordSchema,
  CreateAIVisibilityAnalysisInputSchema,
  UpdateAIMonitoringConfigInputSchema,
  CreateOptimizationRecommendationInputSchema,
  UpdateRecommendationStatusInputSchema,
  GenerateSchemaMarkupInputSchema,
  ValidateSchemaMarkupInputSchema,
  ExportSchemaDataInputSchema,
  // Content analysis schemas
  RealEstateEntityTypeSchema,
  RealEstateEntitySchema,
  GeographicReferenceSchema,
  SemanticMarkupOpportunitySchema,
  ContentOptimizationRecommendationSchema,
  ContentAnalysisResultSchema,
  AIOptimizedContentStructureSchema,
  AnalyzeContentInputSchema,
  GenerateContentRecommendationsInputSchema,
  // Template schemas
  TemplateVariableSchema,
  ValidationRuleSchema,
  SEOOptimizationSchema,
  ContentTemplateSchema,
  TemplateGenerationResultSchema,
  GenerateTemplateContentInputSchema,
} from './schemas';

// Schema-inferred types (avoid duplicate exports)
export type {
  CreateAIVisibilityAnalysisInput,
  UpdateAIMonitoringConfigInput,
  CreateOptimizationRecommendationInput,
  UpdateRecommendationStatusInput,
  GenerateSchemaMarkupInput,
  ValidateSchemaMarkupInput,
  ExportSchemaDataInput,
  // Content analysis input types
  AnalyzeContentInput,
  GenerateContentRecommendationsInput,
  // Template input types
  GenerateTemplateContentInput,
} from './schemas';

// Repository exports
export { AIVisibilityRepository } from './repository';

// Service exports
export { AISearchMonitorService, getAISearchMonitorService, resetAISearchMonitorService } from './services/ai-search-monitor';
export { CompetitiveAnalysisService, getCompetitiveAnalysisService, resetCompetitiveAnalysisService } from './services/competitive-analysis';
export { AIVisibilityScoringEngine, getAIVisibilityScoringEngine, resetAIVisibilityScoringEngine } from './services/ai-visibility-scoring-engine';
export { OptimizationEngineService, getOptimizationEngineService, resetOptimizationEngineService } from './services/optimization-engine';
export { 
  MultiFormatExportService, 
  getMultiFormatExportService, 
  resetMultiFormatExportService,
  type ExportResult,
  type PlatformIntegration,
  type ExportConfiguration,
} from './services/multi-format-export';

// Content analysis services
export { ContentAnalyzer, contentAnalyzer } from './services/content-analyzer';
export { GeographicSchemaGenerator, geographicSchemaGenerator } from './services/geographic-schema-generator';
export { AIContentRecommendationsService, aiContentRecommendationsService } from './services/ai-content-recommendations';

// Template services
export { ContentTemplatesService, contentTemplatesService } from './services/content-templates';
export { TemplateValidator, templateValidator } from './services/template-validator';

// Website analysis services
export { 
  AdvancedWebsiteCrawler, 
  websiteCrawler,
  crawlAndAnalyzeWebsite,
  detectSchemaInHtml,
  validateWebsiteSchemas,
  setupWebsiteRevalidation,
  type WebsiteCrawlerService,
  type CrawledPage,
  type CrawlConfig,
  type SchemaDetectionResult,
  type TechnicalSEOIssue,
  type RevalidationConfig,
} from './services/website-crawler';

export {
  AdvancedWebsiteAnalysisService,
  websiteAnalysisService,
  analyzeWebsiteComprehensively,
  quickValidateWebsiteSchemas,
  setupWebsiteRevalidation,
  type WebsiteAnalysisService,
  type WebsiteAnalysisConfig,
  type ComprehensiveWebsiteAnalysis,
  type PrioritizedAction,
  type RevalidationSchedule,
  type AnalysisComparison,
} from './services/website-analysis';

// Schema validation services
export { 
  AdvancedSchemaValidator,
  schemaValidator,
  validateSchemaMarkup,
  getDetailedValidationReport,
  validateMultipleSchemas,
  type SchemaValidatorService,
  type DetailedValidationReport,
  type ValidationError,
  type ValidationWarning,
  type ValidationSuggestion,
} from './services/schema-validator';

// Service interface exports (to be implemented in future tasks)
export type { SchemaGeneratorService } from './services/schema-generator';
export type { KnowledgeGraphBuilderService } from './services/knowledge-graph-builder';

// Utility exports
export * from './utils/validation';
export * from './utils/scoring';
export * from './utils/export-formats';

// Error handling and reliability exports
export * from './errors';
export * from './retry-manager';
export * from './fallback-manager';
export * from './error-handler';
export * from './error-monitoring';

// Constants
export const AI_VISIBILITY_CONSTANTS = {
  SCORE_WEIGHTS: {
    schemaMarkup: 0.25,
    contentOptimization: 0.20,
    aiSearchPresence: 0.20,
    knowledgeGraphIntegration: 0.15,
    socialSignals: 0.10,
    technicalSEO: 0.10,
  },
  PLATFORMS: ['chatgpt', 'claude', 'perplexity', 'gemini', 'bing-chat'] as const,
  SCHEMA_TYPES: ['RealEstateAgent', 'Person', 'LocalBusiness', 'Organization', 'Review', 'AggregateRating', 'FAQPage', 'Service', 'Place', 'City'] as const,
  EXPORT_FORMATS: ['json-ld', 'rdf-xml', 'turtle', 'microdata'] as const,
} as const;