/**
 * Content Analysis Service
 * 
 * Implements semantic markup opportunity detection and real estate entity recognition
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { 
  ContentAnalysisResult,
  RealEstateEntity,
  RealEstateEntityType,
  GeographicReference,
  SemanticMarkupOpportunity,
  ContentOptimizationRecommendation,
  AIOptimizedContentStructure,
  SchemaMarkup,
  SchemaType
} from '../types';
import { 
  ContentAnalysisResultSchema,
  AnalyzeContentInput,
  GenerateContentRecommendationsInput
} from '../schemas';

/**
 * Real estate entity patterns for recognition
 */
const REAL_ESTATE_PATTERNS: Record<RealEstateEntityType, RegExp[]> = {
  property: [
    /\b(house|home|property|residence|estate|condo|condominium|townhouse|apartment|duplex|triplex|fourplex)\b/gi,
    /\b\d+\s+(bedroom|bed|br)\b/gi,
    /\b\d+\s+(bathroom|bath|ba)\b/gi,
    /\b\d+\s+sq\.?\s*ft\.?\b/gi,
    /\b\d+\s+square\s+feet\b/gi
  ],
  neighborhood: [
    /\b(neighborhood|district|area|community|subdivision|development)\b/gi,
    /\b[A-Z][a-z]+\s+(Heights|Hills|Park|Gardens|Grove|Valley|Ridge|Creek|Point|Bay|Beach)\b/g
  ],
  market_term: [
    /\b(market|real estate|housing|property values|home prices|appreciation|depreciation)\b/gi,
    /\b(buyer's market|seller's market|hot market|cold market)\b/gi,
    /\b(inventory|days on market|DOM|price per square foot)\b/gi
  ],
  price_range: [
    /\$[\d,]+(?:\s*-\s*\$[\d,]+)?/g,
    /\b(under|over|between)\s+\$[\d,]+/gi,
    /\b\$[\d,]+\s+(range|budget|price)\b/gi
  ],
  property_type: [
    /\b(single family|multi-family|commercial|residential|industrial|retail|office)\b/gi,
    /\b(luxury|starter|investment|vacation|rental)\s+(home|property)\b/gi
  ],
  amenity: [
    /\b(pool|spa|garage|fireplace|deck|patio|balcony|garden|yard)\b/gi,
    /\b(granite counters|hardwood floors|stainless steel|walk-in closet)\b/gi,
    /\b(central air|heating|cooling|HVAC)\b/gi
  ],
  school_district: [
    /\b[A-Z][a-z]+\s+(School District|Elementary|Middle School|High School|ISD)\b/g,
    /\b(top-rated|excellent|award-winning)\s+(schools?|district)\b/gi
  ],
  transportation: [
    /\b(highway|freeway|interstate|I-\d+|US-\d+|State Route)\b/gi,
    /\b(public transit|bus|train|subway|metro|light rail)\b/gi,
    /\b(airport|commute|walkable|bike-friendly)\b/gi
  ],
  local_business: [
    /\b(shopping|restaurants|dining|entertainment|parks|recreation)\b/gi,
    /\b(grocery store|mall|theater|gym|hospital|medical)\b/gi
  ]
};

/**
 * Geographic location patterns
 */
const GEOGRAPHIC_PATTERNS = {
  city: /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2}\b/g,
  neighborhood: /\b(in|near|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/gi,
  address: /\b\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Circle|Cir|Court|Ct)\b/gi,
  landmark: /\b(downtown|uptown|historic district|waterfront|lakefront|beachfront)\b/gi,
  region: /\b(north|south|east|west|central|upper|lower)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/gi
};

/**
 * Content Analysis Service
 */
export class ContentAnalyzer {
  /**
   * Analyze content for semantic markup opportunities and entity recognition
   */
  async analyzeContent(input: AnalyzeContentInput): Promise<ContentAnalysisResult> {
    const { userId, content, contentType, includeEntityRecognition, includeGeographicAnalysis, includeOptimizationRecommendations } = input;

    // Detect real estate entities
    const entities = includeEntityRecognition ? this.detectRealEstateEntities(content) : [];

    // Detect geographic references
    const geographicReferences = includeGeographicAnalysis ? this.detectGeographicReferences(content) : [];

    // Identify markup opportunities
    const markupOpportunities = this.identifyMarkupOpportunities(content, entities, geographicReferences);

    // Generate optimization recommendations
    const recommendations = includeOptimizationRecommendations ? 
      this.generateOptimizationRecommendations(contentType, entities, geographicReferences) : [];

    // Calculate AI readability score
    const aiReadabilityScore = this.calculateAIReadabilityScore(content);

    // Analyze content structure
    const structureAnalysis = this.analyzeContentStructure(content);

    const result: ContentAnalysisResult = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      content,
      contentType,
      entities,
      geographicReferences,
      markupOpportunities,
      recommendations,
      aiReadabilityScore,
      structureAnalysis,
      analyzedAt: new Date()
    };

    // Validate result
    ContentAnalysisResultSchema.parse(result);

    return result;
  }

  /**
   * Detect real estate entities in content
   */
  private detectRealEstateEntities(content: string): RealEstateEntity[] {
    const entities: RealEstateEntity[] = [];

    for (const [entityType, patterns] of Object.entries(REAL_ESTATE_PATTERNS)) {
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const entity: RealEstateEntity = {
            text: match[0],
            type: entityType as RealEstateEntityType,
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            confidence: this.calculateEntityConfidence(match[0], entityType as RealEstateEntityType),
            suggestedSchema: this.getSuggestedSchemaForEntity(entityType as RealEstateEntityType),
            context: this.extractEntityContext(content, match.index, match[0].length)
          };
          entities.push(entity);
        }
      }
    }

    // Remove duplicates and sort by confidence
    return this.deduplicateEntities(entities)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Detect geographic references in content
   */
  private detectGeographicReferences(content: string): GeographicReference[] {
    const references: GeographicReference[] = [];

    for (const [locationType, pattern] of Object.entries(GEOGRAPHIC_PATTERNS)) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const reference: GeographicReference = {
          text: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          type: locationType as any,
          suggestedSchema: this.generateGeographicSchema(match[0], locationType)
        };
        references.push(reference);
      }
    }

    return references;
  }

  /**
   * Identify semantic markup opportunities
   */
  private identifyMarkupOpportunities(
    content: string, 
    entities: RealEstateEntity[], 
    geographicReferences: GeographicReference[]
  ): SemanticMarkupOpportunity[] {
    const opportunities: SemanticMarkupOpportunity[] = [];

    // Entity markup opportunities
    const entityGroups = this.groupEntitiesByType(entities);
    for (const [entityType, entityList] of Object.entries(entityGroups)) {
      if (entityList.length > 0) {
        opportunities.push({
          id: `entity_${entityType}_${Date.now()}`,
          contentSection: this.extractContentSection(content, entityList[0].startIndex),
          type: 'entity_markup',
          priority: this.getEntityPriority(entityType as RealEstateEntityType),
          description: `Add schema markup for ${entityType} entities`,
          implementation: `Wrap ${entityType} references with appropriate schema.org markup`,
          expectedImpact: `Improved AI understanding of ${entityType} context`,
          codeExample: this.generateEntityMarkupExample(entityType as RealEstateEntityType, entityList[0].text)
        });
      }
    }

    // Geographic markup opportunities
    if (geographicReferences.length > 0) {
      opportunities.push({
        id: `geographic_${Date.now()}`,
        contentSection: this.extractContentSection(content, geographicReferences[0].startIndex),
        type: 'geographic_markup',
        priority: 'high',
        description: 'Add geographic schema markup for location references',
        implementation: 'Include Place and GeoCoordinates schema for locations',
        expectedImpact: 'Enhanced location-based AI search visibility',
        codeExample: this.generateGeographicMarkupExample(geographicReferences[0])
      });
    }

    // FAQ structure opportunities
    if (this.detectFAQOpportunity(content)) {
      opportunities.push({
        id: `faq_${Date.now()}`,
        contentSection: 'FAQ section',
        type: 'faq_structure',
        priority: 'high',
        description: 'Structure content as FAQ with schema markup',
        implementation: 'Convert Q&A content to FAQPage schema format',
        expectedImpact: 'Direct answers in AI search results',
        codeExample: this.generateFAQMarkupExample()
      });
    }

    return opportunities;
  }

  /**
   * Generate optimization recommendations based on content analysis
   */
  private generateOptimizationRecommendations(
    contentType: string,
    entities: RealEstateEntity[],
    geographicReferences: GeographicReference[]
  ): ContentOptimizationRecommendation[] {
    const recommendations: ContentOptimizationRecommendation[] = [];

    // Content-type specific recommendations
    switch (contentType.toLowerCase()) {
      case 'faq':
        recommendations.push({
          id: `faq_rec_${Date.now()}`,
          contentType: 'faq',
          title: 'Optimize FAQ for AI Search',
          description: 'Structure FAQ content for maximum AI visibility',
          aiOptimizationBenefits: [
            'Direct answers in AI search results',
            'Featured snippets in search engines',
            'Improved semantic understanding'
          ],
          implementationSteps: [
            'Use clear question-answer format',
            'Add FAQPage schema markup',
            'Include relevant keywords naturally',
            'Provide comprehensive answers'
          ],
          exampleContent: this.generateFAQExample(),
          schemaMarkup: [this.generateFAQSchema()]
        });
        break;

      case 'service_description':
        recommendations.push({
          id: `service_rec_${Date.now()}`,
          contentType: 'service_description',
          title: 'Enhance Service Description for AI',
          description: 'Optimize service descriptions for AI understanding',
          aiOptimizationBenefits: [
            'Better service discovery in AI search',
            'Clear value proposition communication',
            'Enhanced local search visibility'
          ],
          implementationSteps: [
            'Use structured headings and bullet points',
            'Include Service schema markup',
            'Add geographic and specialization details',
            'Include client testimonials with Review schema'
          ]
        });
        break;

      case 'market_analysis':
        recommendations.push({
          id: `market_rec_${Date.now()}`,
          contentType: 'market_analysis',
          title: 'Structure Market Analysis for AI',
          description: 'Format market analysis for AI comprehension',
          aiOptimizationBenefits: [
            'Authority in market knowledge',
            'Data-driven insights recognition',
            'Local expertise demonstration'
          ],
          implementationSteps: [
            'Use clear data presentation',
            'Include statistical markup',
            'Add geographic context',
            'Structure with headings and sections'
          ]
        });
        break;
    }

    return recommendations;
  }

  /**
   * Calculate AI readability score
   */
  private calculateAIReadabilityScore(content: string): number {
    let score = 0;
    const factors = {
      hasHeadings: /^#{1,6}\s+.+$/m.test(content) ? 15 : 0,
      hasBulletPoints: /^[\*\-\+]\s+.+$/m.test(content) ? 10 : 0,
      hasNumbers: /\b\d+\b/.test(content) ? 10 : 0,
      hasStructuredData: /<script[^>]*type="application\/ld\+json"/.test(content) ? 20 : 0,
      sentenceLength: this.calculateSentenceLengthScore(content),
      paragraphLength: this.calculateParagraphLengthScore(content),
      keywordDensity: this.calculateKeywordDensityScore(content)
    };

    score = Object.values(factors).reduce((sum, value) => sum + value, 0);
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Analyze content structure
   */
  private analyzeContentStructure(content: string) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    return {
      hasHeadings: /^#{1,6}\s+.+$/m.test(content) || /<h[1-6]/.test(content),
      hasBulletPoints: /^[\*\-\+]\s+.+$/m.test(content) || /<[uo]l/.test(content),
      hasStructuredData: /<script[^>]*type="application\/ld\+json"/.test(content),
      paragraphCount: paragraphs.length,
      averageSentenceLength: sentences.length > 0 ? 
        sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length : 0
    };
  }

  /**
   * Helper methods
   */

  private calculateEntityConfidence(text: string, entityType: RealEstateEntityType): number {
    // Base confidence based on entity type importance
    const baseConfidence = {
      property: 0.9,
      neighborhood: 0.8,
      market_term: 0.7,
      price_range: 0.9,
      property_type: 0.8,
      amenity: 0.6,
      school_district: 0.7,
      transportation: 0.6,
      local_business: 0.5
    };

    let confidence = baseConfidence[entityType] || 0.5;

    // Adjust based on text characteristics
    if (text.length > 20) confidence -= 0.1; // Longer text might be less precise
    if (/\b(luxury|premium|exclusive)\b/i.test(text)) confidence += 0.1; // High-value terms
    if (/\$[\d,]+/.test(text)) confidence += 0.1; // Contains price information

    return Math.min(1, Math.max(0, confidence));
  }

  private getSuggestedSchemaForEntity(entityType: RealEstateEntityType): SchemaType | undefined {
    const schemaMapping: Record<RealEstateEntityType, SchemaType | undefined> = {
      property: 'RealEstateAgent',
      neighborhood: 'LocalBusiness',
      market_term: undefined,
      price_range: undefined,
      property_type: 'RealEstateAgent',
      amenity: undefined,
      school_district: 'Organization',
      transportation: undefined,
      local_business: 'LocalBusiness'
    };

    return schemaMapping[entityType];
  }

  private extractEntityContext(content: string, startIndex: number, length: number): string {
    const contextStart = Math.max(0, startIndex - 50);
    const contextEnd = Math.min(content.length, startIndex + length + 50);
    return content.substring(contextStart, contextEnd).trim();
  }

  private deduplicateEntities(entities: RealEstateEntity[]): RealEstateEntity[] {
    const seen = new Set<string>();
    return entities.filter(entity => {
      const key = `${entity.text.toLowerCase()}_${entity.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private generateGeographicSchema(text: string, locationType: string): SchemaMarkup {
    return {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: text.trim(),
      description: `${locationType} location reference`
    };
  }

  private groupEntitiesByType(entities: RealEstateEntity[]): Record<string, RealEstateEntity[]> {
    return entities.reduce((groups, entity) => {
      if (!groups[entity.type]) groups[entity.type] = [];
      groups[entity.type].push(entity);
      return groups;
    }, {} as Record<string, RealEstateEntity[]>);
  }

  private extractContentSection(content: string, index: number): string {
    const lines = content.split('\n');
    let currentPos = 0;
    
    for (const line of lines) {
      if (currentPos + line.length >= index) {
        return line.trim();
      }
      currentPos += line.length + 1; // +1 for newline
    }
    
    return content.substring(Math.max(0, index - 100), index + 100);
  }

  private getEntityPriority(entityType: RealEstateEntityType): 'high' | 'medium' | 'low' {
    const priorityMap: Record<RealEstateEntityType, 'high' | 'medium' | 'low'> = {
      property: 'high',
      neighborhood: 'high',
      market_term: 'medium',
      price_range: 'high',
      property_type: 'medium',
      amenity: 'low',
      school_district: 'medium',
      transportation: 'low',
      local_business: 'low'
    };

    return priorityMap[entityType] || 'low';
  }

  private generateEntityMarkupExample(entityType: RealEstateEntityType, text: string): string {
    switch (entityType) {
      case 'property':
        return `<span itemscope itemtype="https://schema.org/Residence">
  <span itemprop="name">${text}</span>
</span>`;
      case 'neighborhood':
        return `<span itemscope itemtype="https://schema.org/Place">
  <span itemprop="name">${text}</span>
</span>`;
      default:
        return `<span itemscope itemtype="https://schema.org/Thing">
  <span itemprop="name">${text}</span>
</span>`;
    }
  }

  private generateGeographicMarkupExample(reference: GeographicReference): string {
    return `<span itemscope itemtype="https://schema.org/Place">
  <span itemprop="name">${reference.text}</span>
  ${reference.coordinates ? `
  <span itemprop="geo" itemscope itemtype="https://schema.org/GeoCoordinates">
    <meta itemprop="latitude" content="${reference.coordinates.latitude}">
    <meta itemprop="longitude" content="${reference.coordinates.longitude}">
  </span>` : ''}
</span>`;
  }

  private detectFAQOpportunity(content: string): boolean {
    const faqPatterns = [
      /\bwhat\s+is\b/gi,
      /\bhow\s+(?:do|does|can|to)\b/gi,
      /\bwhy\s+(?:do|does|should)\b/gi,
      /\bwhen\s+(?:do|does|should)\b/gi,
      /\bwhere\s+(?:do|does|can)\b/gi,
      /\?\s*$/gm
    ];

    let questionCount = 0;
    for (const pattern of faqPatterns) {
      const matches = content.match(pattern);
      if (matches) questionCount += matches.length;
    }

    return questionCount >= 3; // At least 3 questions suggest FAQ opportunity
  }

  private generateFAQMarkupExample(): string {
    return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is the average home price in this area?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "The average home price in this area is $450,000, with prices ranging from $350,000 to $650,000 depending on size and location."
    }
  }]
}
</script>`;
  }

  private generateFAQExample(): string {
    return `## Frequently Asked Questions

### What is the current market trend in our area?
The local real estate market is showing strong growth with a 5% increase in home values over the past year. Inventory remains low, creating a competitive environment for buyers.

### How long does it typically take to sell a home?
On average, homes in our market sell within 30-45 days. Well-priced and properly staged homes often receive multiple offers within the first week.

### What should I consider when buying my first home?
First-time buyers should focus on location, budget, and future needs. Consider factors like school districts, commute times, and neighborhood amenities.`;
  }

  private generateFAQSchema(): SchemaMarkup {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      name: 'Real Estate FAQ',
      description: 'Frequently asked questions about real estate'
    };
  }

  private calculateSentenceLengthScore(content: string): number {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0;

    const avgLength = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length;
    
    // Optimal sentence length for AI is 15-25 words
    if (avgLength >= 15 && avgLength <= 25) return 15;
    if (avgLength >= 10 && avgLength <= 30) return 10;
    return 5;
  }

  private calculateParagraphLengthScore(content: string): number {
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (paragraphs.length === 0) return 0;

    const avgLength = paragraphs.reduce((sum, p) => sum + p.trim().split(/\s+/).length, 0) / paragraphs.length;
    
    // Optimal paragraph length for AI is 50-150 words
    if (avgLength >= 50 && avgLength <= 150) return 10;
    if (avgLength >= 30 && avgLength <= 200) return 7;
    return 3;
  }

  private calculateKeywordDensityScore(content: string): number {
    const words = content.toLowerCase().split(/\s+/);
    const realEstateKeywords = ['real estate', 'property', 'home', 'house', 'market', 'agent', 'realtor'];
    
    let keywordCount = 0;
    for (const word of words) {
      if (realEstateKeywords.some(keyword => word.includes(keyword))) {
        keywordCount++;
      }
    }

    const density = keywordCount / words.length;
    
    // Optimal keyword density is 1-3%
    if (density >= 0.01 && density <= 0.03) return 10;
    if (density >= 0.005 && density <= 0.05) return 7;
    return 3;
  }
}

/**
 * Export singleton instance
 */
export const contentAnalyzer = new ContentAnalyzer();