/**
 * AI Visibility Optimization Types
 * 
 * TypeScript interfaces for AI visibility data structures
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

/**
 * AI Platform types for monitoring
 */
export type AIPlatform = 'chatgpt' | 'claude' | 'perplexity' | 'gemini' | 'bing-chat';

/**
 * AI Visibility Score breakdown by category
 */
export interface AIVisibilityScoreBreakdown {
  /** Schema markup score (25% weight) */
  schemaMarkup: number;
  /** Content optimization score (20% weight) */
  contentOptimization: number;
  /** AI search presence score (20% weight) */
  aiSearchPresence: number;
  /** Knowledge graph integration score (15% weight) */
  knowledgeGraphIntegration: number;
  /** Social signals score (10% weight) */
  socialSignals: number;
  /** Technical SEO score (10% weight) */
  technicalSEO: number;
}

/**
 * Overall AI Visibility Score (0-100)
 */
export interface AIVisibilityScore {
  /** Overall score (0-100) */
  overall: number;
  /** Score breakdown by category */
  breakdown: AIVisibilityScoreBreakdown;
  /** When the score was calculated */
  calculatedAt: Date;
  /** Score trend compared to previous calculation */
  trend: 'improving' | 'declining' | 'stable';
  /** Previous score for comparison */
  previousScore?: number;
}

/**
 * AI Mention from monitoring
 */
export interface AIMention {
  /** Unique mention ID */
  id: string;
  /** AI platform where mention was found */
  platform: AIPlatform;
  /** Search query that generated the mention */
  query: string;
  /** AI response containing the mention */
  response: string;
  /** Context around the mention */
  mentionContext: string;
  /** Position in the response (1st, 2nd, 3rd mention) */
  position: number;
  /** Sentiment analysis of the mention */
  sentiment: 'positive' | 'neutral' | 'negative';
  /** Other competitors mentioned in same response */
  competitorsAlsoMentioned: string[];
  /** When the mention was detected */
  timestamp: Date;
  /** Confidence score of the mention detection (0-1) */
  confidence: number;
}

/**
 * Optimization recommendation categories
 */
export type RecommendationCategory = 'schema' | 'content' | 'technical' | 'social' | 'competitive';

/**
 * Recommendation priority levels
 */
export type RecommendationPriority = 'high' | 'medium' | 'low';

/**
 * Implementation difficulty levels
 */
export type ImplementationDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Recommendation status
 */
export type RecommendationStatus = 'pending' | 'in-progress' | 'completed' | 'dismissed';

/**
 * Optimization Recommendation
 */
export interface OptimizationRecommendation {
  /** Unique recommendation ID */
  id: string;
  /** Recommendation category */
  category: RecommendationCategory;
  /** Priority level */
  priority: RecommendationPriority;
  /** Recommendation title */
  title: string;
  /** Detailed description */
  description: string;
  /** Step-by-step action items */
  actionItems: string[];
  /** Expected score improvement */
  estimatedImpact: number;
  /** Implementation difficulty */
  implementationDifficulty: ImplementationDifficulty;
  /** Code example if applicable */
  codeExample?: string;
  /** Additional resources */
  resources?: string[];
  /** Current status */
  status: RecommendationStatus;
  /** When recommendation was created */
  createdAt: Date;
  /** When recommendation was completed */
  completedAt?: Date;
}

/**
 * Schema markup types
 */
export type SchemaType = 
  | 'RealEstateAgent' 
  | 'Person' 
  | 'LocalBusiness' 
  | 'Organization' 
  | 'Review' 
  | 'AggregateRating'
  | 'FAQPage'
  | 'Service'
  | 'Place'
  | 'City';

/**
 * Schema markup structure
 */
export interface SchemaMarkup {
  /** JSON-LD context */
  '@context': string;
  /** Schema type */
  '@type': SchemaType;
  /** Unique identifier */
  '@id'?: string;
  /** Name */
  name: string;
  /** Description */
  description?: string;
  /** Website URL */
  url?: string;
  /** Phone number */
  telephone?: string;
  /** Email address */
  email?: string;
  /** Postal address */
  address?: PostalAddress;
  /** Geographic coordinates */
  geo?: GeoCoordinates;
  /** Same as references (social profiles, etc.) */
  sameAs?: string[];
  /** Knowledge areas */
  knowsAbout?: string[];
  /** Service areas */
  areaServed?: Place[];
  /** Aggregate rating */
  aggregateRating?: AggregateRating;
  /** Reviews */
  review?: Review[];
  /** Organization membership */
  memberOf?: Organization;
  /** Credentials */
  hasCredential?: EducationalOccupationalCredential[];
}

/**
 * Postal Address schema
 */
export interface PostalAddress {
  '@type': 'PostalAddress';
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
}

/**
 * Geographic Coordinates schema
 */
export interface GeoCoordinates {
  '@type': 'GeoCoordinates';
  latitude: number;
  longitude: number;
}

/**
 * Place schema
 */
export interface Place {
  '@type': 'Place';
  name: string;
  geo?: GeoCoordinates;
}

/**
 * Aggregate Rating schema
 */
export interface AggregateRating {
  '@type': 'AggregateRating';
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

/**
 * Review schema
 */
export interface Review {
  '@type': 'Review';
  author: Person;
  reviewRating: Rating;
  reviewBody: string;
  datePublished: string;
}

/**
 * Person schema
 */
export interface Person {
  '@type': 'Person';
  name: string;
}

/**
 * Rating schema
 */
export interface Rating {
  '@type': 'Rating';
  ratingValue: number;
  bestRating?: number;
  worstRating?: number;
}

/**
 * Organization schema
 */
export interface Organization {
  '@type': 'Organization';
  name: string;
  url?: string;
}

/**
 * Educational Occupational Credential schema
 */
export interface EducationalOccupationalCredential {
  '@type': 'EducationalOccupationalCredential';
  name: string;
  credentialCategory: string;
  recognizedBy?: Organization;
}

/**
 * Knowledge Graph Entity
 */
export interface KnowledgeGraphEntity {
  /** Entity ID */
  '@id': string;
  /** Entity type */
  '@type': string;
  /** Entity properties */
  properties: Record<string, any>;
  /** Entity relationships */
  relationships: {
    predicate: string;
    object: string | KnowledgeGraphEntity;
  }[];
  /** Geographic coordinates */
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  /** Service area definition */
  serviceArea?: {
    type: 'Polygon' | 'Circle';
    coordinates: number[][];
    radius?: number;
  };
}

/**
 * RDF Triple for semantic data
 */
export interface RDFTriple {
  subject: string;
  predicate: string;
  object: string | number | boolean;
}

/**
 * Export format types
 */
export type ExportFormat = 'json-ld' | 'rdf-xml' | 'turtle' | 'microdata';

/**
 * Export package containing multiple formats
 */
export interface ExportPackage {
  /** JSON-LD format */
  jsonLD: string;
  /** RDF/XML format */
  rdfXML: string;
  /** Turtle format */
  turtle: string;
  /** Microdata format */
  microdata: string;
  /** Implementation instructions */
  instructions: string;
  /** Platform-specific guides */
  platformGuides: Record<string, string>;
}

/**
 * Schema validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Suggestions for improvement */
  suggestions: string[];
}

/**
 * AI Visibility Analysis result
 */
export interface AIVisibilityAnalysis {
  /** User ID */
  userId: string;
  /** Overall visibility score */
  score: AIVisibilityScore;
  /** Recent AI mentions */
  mentions: AIMention[];
  /** Generated recommendations */
  recommendations: OptimizationRecommendation[];
  /** Schema markup analysis */
  schemaAnalysis: {
    current: SchemaMarkup[];
    missing: SchemaType[];
    errors: ValidationResult[];
  };
  /** Knowledge graph entities */
  knowledgeGraph: KnowledgeGraphEntity[];
  /** Analysis timestamp */
  analyzedAt: Date;
}

/**
 * Competitive analysis data
 */
export interface CompetitorAnalysis {
  /** Competitor information */
  competitors: {
    name: string;
    aiVisibilityScore: number;
    mentionFrequency: number;
    strongAreas: string[];
    weakAreas: string[];
  }[];
  /** User's position relative to competitors */
  userPosition: number;
  /** Market opportunities */
  opportunities: string[];
  /** Competitive gaps to exploit */
  gaps: string[];
}

/**
 * AI Monitoring Configuration
 */
export interface AIMonitoringConfig {
  /** User ID */
  userId: string;
  /** Platforms to monitor */
  platforms: AIPlatform[];
  /** Search queries to use */
  queries: string[];
  /** Monitoring frequency in hours */
  frequency: number;
  /** Geographic focus areas */
  locations: string[];
  /** Competitor names to track */
  competitors: string[];
  /** Alert thresholds */
  alertThresholds: {
    mentionDecrease: number;
    sentimentChange: number;
    competitorIncrease: number;
  };
}

/**
 * Website analysis result
 */
export interface WebsiteAnalysis {
  /** Website URL */
  url: string;
  /** Found schema markup */
  schemaMarkup: SchemaMarkup[];
  /** Schema validation results */
  validationResults: ValidationResult[];
  /** Missing schema opportunities */
  missingSchemas: SchemaType[];
  /** Technical SEO issues */
  technicalIssues: string[];
  /** Recommendations for improvement */
  recommendations: string[];
  /** Analysis timestamp */
  analyzedAt: Date;
}

/**
 * Export record for tracking schema exports
 */
export interface ExportRecord {
  /** Unique export ID */
  exportId: string;
  /** User ID */
  userId: string;
  /** Export formats included */
  formats: ExportFormat[];
  /** Number of schemas exported */
  schemaCount: number;
  /** Export timestamp */
  exportedAt: Date;
  /** Validation results */
  validation: ValidationResult;
  /** File size in bytes */
  fileSize?: number;
  /** Download URLs if stored */
  downloadUrls?: Record<ExportFormat, string>;
}

/**
 * Content analysis and optimization types
 */

/**
 * Real estate entity types for recognition
 */
export type RealEstateEntityType = 
  | 'property' 
  | 'neighborhood' 
  | 'market_term' 
  | 'price_range' 
  | 'property_type' 
  | 'amenity' 
  | 'school_district' 
  | 'transportation' 
  | 'local_business';

/**
 * Detected real estate entity
 */
export interface RealEstateEntity {
  /** Entity text */
  text: string;
  /** Entity type */
  type: RealEstateEntityType;
  /** Start position in content */
  startIndex: number;
  /** End position in content */
  endIndex: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Suggested schema markup */
  suggestedSchema?: SchemaType;
  /** Additional context */
  context?: string;
}

/**
 * Geographic reference in content
 */
export interface GeographicReference {
  /** Location text */
  text: string;
  /** Start position in content */
  startIndex: number;
  /** End position in content */
  endIndex: number;
  /** Detected coordinates */
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  /** Location type */
  type: 'city' | 'neighborhood' | 'address' | 'landmark' | 'region';
  /** Suggested schema markup */
  suggestedSchema: SchemaMarkup;
}

/**
 * Semantic markup opportunity
 */
export interface SemanticMarkupOpportunity {
  /** Opportunity ID */
  id: string;
  /** Content section */
  contentSection: string;
  /** Opportunity type */
  type: 'entity_markup' | 'geographic_markup' | 'faq_structure' | 'review_markup' | 'service_markup';
  /** Priority level */
  priority: 'high' | 'medium' | 'low';
  /** Description of opportunity */
  description: string;
  /** Suggested implementation */
  implementation: string;
  /** Expected impact */
  expectedImpact: string;
  /** Code example */
  codeExample?: string;
}

/**
 * Content optimization recommendation
 */
export interface ContentOptimizationRecommendation {
  /** Recommendation ID */
  id: string;
  /** Content type */
  contentType: 'faq' | 'service_description' | 'market_analysis' | 'property_listing' | 'blog_post';
  /** Recommendation title */
  title: string;
  /** Detailed description */
  description: string;
  /** AI optimization benefits */
  aiOptimizationBenefits: string[];
  /** Implementation steps */
  implementationSteps: string[];
  /** Example content */
  exampleContent?: string;
  /** Schema markup to include */
  schemaMarkup?: SchemaMarkup[];
}

/**
 * Content analysis result
 */
export interface ContentAnalysisResult {
  /** Analysis ID */
  id: string;
  /** User ID */
  userId: string;
  /** Analyzed content */
  content: string;
  /** Content type */
  contentType: string;
  /** Detected entities */
  entities: RealEstateEntity[];
  /** Geographic references */
  geographicReferences: GeographicReference[];
  /** Markup opportunities */
  markupOpportunities: SemanticMarkupOpportunity[];
  /** Optimization recommendations */
  recommendations: ContentOptimizationRecommendation[];
  /** AI readability score (0-100) */
  aiReadabilityScore: number;
  /** Structure analysis */
  structureAnalysis: {
    hasHeadings: boolean;
    hasBulletPoints: boolean;
    hasStructuredData: boolean;
    paragraphCount: number;
    averageSentenceLength: number;
  };
  /** Analysis timestamp */
  analyzedAt: Date;
}

/**
 * AI-optimized content structure
 */
export interface AIOptimizedContentStructure {
  /** Content sections */
  sections: {
    /** Section type */
    type: 'heading' | 'paragraph' | 'list' | 'faq' | 'structured_data';
    /** Section content */
    content: string;
    /** Schema markup for section */
    schemaMarkup?: SchemaMarkup;
    /** AI optimization notes */
    optimizationNotes?: string[];
  }[];
  /** Overall structure score */
  structureScore: number;
  /** Improvement suggestions */
  improvements: string[];
}

/**
 * Content template types
 */

/**
 * Template variable for customization
 */
export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    options?: string[];
  };
}

/**
 * Template validation rule
 */
export interface ValidationRule {
  field: string;
  rule: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  customValidator?: (value: any) => boolean;
}

/**
 * SEO optimization configuration
 */
export interface SEOOptimization {
  type: 'heading_structure' | 'keyword_density' | 'meta_tags' | 'internal_links' | 'schema_markup';
  description: string;
  implementation: string;
  aiSystemBenefit: string;
}

/**
 * Content template structure
 */
export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  contentType: 'faq' | 'service_description' | 'market_analysis' | 'property_listing' | 'blog_post';
  category: string;
  tags: string[];
  structure: AIOptimizedContentStructure;
  schemaMarkup: SchemaMarkup[];
  aiOptimizationFeatures: string[];
  variables: TemplateVariable[];
  validationRules: ValidationRule[];
  seoOptimizations: SEOOptimization[];
}

/**
 * Template generation result
 */
export interface TemplateGenerationResult {
  content: string;
  schemaMarkup: SchemaMarkup[];
  metadata: {
    wordCount: number;
    readingTime: number;
    aiReadabilityScore: number;
    seoScore: number;
  };
  validationResults: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  };
}