/**
 * AI Visibility Scoring Utilities
 * 
 * Utility functions for calculating AI visibility scores
 * Requirements: 1.2, 1.3
 */

import type {
  AIVisibilityScore,
  AIVisibilityScoreBreakdown,
  AIMention,
  SchemaMarkup,
  KnowledgeGraphEntity,
} from '../types';

/**
 * Score weights for different categories (must sum to 100%)
 */
export const SCORE_WEIGHTS = {
  schemaMarkup: 0.25,        // 25%
  contentOptimization: 0.20,  // 20%
  aiSearchPresence: 0.20,     // 20%
  knowledgeGraphIntegration: 0.15, // 15%
  socialSignals: 0.10,        // 10%
  technicalSEO: 0.10,         // 10%
} as const;

/**
 * Calculates the overall AI visibility score from breakdown scores
 */
export function calculateOverallScore(breakdown: AIVisibilityScoreBreakdown): number {
  const weightedSum = 
    breakdown.schemaMarkup * SCORE_WEIGHTS.schemaMarkup +
    breakdown.contentOptimization * SCORE_WEIGHTS.contentOptimization +
    breakdown.aiSearchPresence * SCORE_WEIGHTS.aiSearchPresence +
    breakdown.knowledgeGraphIntegration * SCORE_WEIGHTS.knowledgeGraphIntegration +
    breakdown.socialSignals * SCORE_WEIGHTS.socialSignals +
    breakdown.technicalSEO * SCORE_WEIGHTS.technicalSEO;

  return Math.round(weightedSum * 100) / 100; // Round to 2 decimal places
}

/**
 * Validates that score weights sum to 100%
 */
export function validateScoreWeights(): boolean {
  const totalWeight = Object.values(SCORE_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  return Math.abs(totalWeight - 1.0) < 0.001; // Allow for floating point precision
}

/**
 * Calculates schema markup score based on completeness and quality
 */
export function calculateSchemaMarkupScore(
  schemaMarkup: SchemaMarkup[],
  profileCompleteness: number = 100
): number {
  if (schemaMarkup.length === 0) {
    return 0;
  }

  // Base score for having schema markup
  let score = 30;

  // Required schema types for real estate agents
  const requiredSchemas = ['RealEstateAgent', 'Person', 'LocalBusiness'] as const;
  const presentSchemas = schemaMarkup.map(s => s['@type']);
  const requiredPresent = requiredSchemas.filter(type => presentSchemas.includes(type));
  
  // Score for required schemas (40 points max)
  score += (requiredPresent.length / requiredSchemas.length) * 40;

  // Score for optional schemas (20 points max)
  const optionalSchemas = ['Organization', 'Review', 'AggregateRating'] as const;
  const optionalPresent = optionalSchemas.filter(type => presentSchemas.includes(type));
  score += (optionalPresent.length / optionalSchemas.length) * 20;

  // Score for data completeness (10 points max)
  const completenessBonus = (profileCompleteness / 100) * 10;
  score += completenessBonus;

  return Math.min(100, Math.round(score));
}

/**
 * Calculates AI search presence score based on mentions
 */
export function calculateAISearchPresenceScore(
  mentions: AIMention[],
  timeWindowDays: number = 30
): number {
  if (mentions.length === 0) {
    return 0;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays);

  const recentMentions = mentions.filter(m => m.timestamp >= cutoffDate);
  
  if (recentMentions.length === 0) {
    return 0;
  }

  // Base score for having mentions
  let score = 20;

  // Score for mention frequency (30 points max)
  const mentionFrequency = recentMentions.length / timeWindowDays;
  const frequencyScore = Math.min(30, mentionFrequency * 10);
  score += frequencyScore;

  // Score for platform diversity (25 points max)
  const platforms = new Set(recentMentions.map(m => m.platform));
  const platformDiversityScore = (platforms.size / 5) * 25; // 5 total platforms
  score += platformDiversityScore;

  // Score for positive sentiment (15 points max)
  const positiveMentions = recentMentions.filter(m => m.sentiment === 'positive');
  const sentimentScore = (positiveMentions.length / recentMentions.length) * 15;
  score += sentimentScore;

  // Score for high positions (10 points max)
  const topPositions = recentMentions.filter(m => m.position <= 3);
  const positionScore = (topPositions.length / recentMentions.length) * 10;
  score += positionScore;

  return Math.min(100, Math.round(score));
}

/**
 * Calculates knowledge graph integration score
 */
export function calculateKnowledgeGraphScore(
  entities: KnowledgeGraphEntity[],
  hasGeographicData: boolean = false,
  hasCertifications: boolean = false
): number {
  if (entities.length === 0) {
    return 0;
  }

  // Base score for having entities
  let score = 25;

  // Score for entity diversity (30 points max)
  const entityTypes = new Set(entities.map(e => e['@type']));
  const typeScore = Math.min(30, entityTypes.size * 10);
  score += typeScore;

  // Score for relationships (25 points max)
  const totalRelationships = entities.reduce((sum, e) => sum + e.relationships.length, 0);
  const relationshipScore = Math.min(25, totalRelationships * 2);
  score += relationshipScore;

  // Score for geographic data (10 points max)
  if (hasGeographicData) {
    score += 10;
  }

  // Score for certifications and credentials (10 points max)
  if (hasCertifications) {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Calculates content optimization score
 */
export function calculateContentOptimizationScore(
  hasStructuredContent: boolean = false,
  hasFAQContent: boolean = false,
  hasLocationContent: boolean = false,
  hasExpertiseContent: boolean = false,
  semanticMarkupCoverage: number = 0
): number {
  let score = 0;

  // Score for structured content (25 points)
  if (hasStructuredContent) {
    score += 25;
  }

  // Score for FAQ content (20 points)
  if (hasFAQContent) {
    score += 20;
  }

  // Score for location-specific content (20 points)
  if (hasLocationContent) {
    score += 20;
  }

  // Score for expertise demonstration (20 points)
  if (hasExpertiseContent) {
    score += 20;
  }

  // Score for semantic markup coverage (15 points max)
  const semanticScore = (semanticMarkupCoverage / 100) * 15;
  score += semanticScore;

  return Math.min(100, Math.round(score));
}

/**
 * Calculates social signals score
 */
export function calculateSocialSignalsScore(
  socialProfiles: number = 0,
  socialEngagement: number = 0,
  reviewCount: number = 0,
  averageRating: number = 0
): number {
  let score = 0;

  // Score for social profile presence (30 points max)
  const profileScore = Math.min(30, socialProfiles * 6); // Up to 5 profiles
  score += profileScore;

  // Score for social engagement (25 points max)
  const engagementScore = Math.min(25, socialEngagement / 10);
  score += engagementScore;

  // Score for reviews (25 points max)
  const reviewScore = Math.min(25, reviewCount * 2);
  score += reviewScore;

  // Score for rating quality (20 points max)
  if (averageRating > 0) {
    const ratingScore = (averageRating / 5) * 20;
    score += ratingScore;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Calculates technical SEO score
 */
export function calculateTechnicalSEOScore(
  hasSSL: boolean = false,
  mobileOptimized: boolean = false,
  pageSpeedScore: number = 0,
  hasStructuredData: boolean = false,
  hasMetaTags: boolean = false
): number {
  let score = 0;

  // Score for SSL certificate (20 points)
  if (hasSSL) {
    score += 20;
  }

  // Score for mobile optimization (20 points)
  if (mobileOptimized) {
    score += 20;
  }

  // Score for page speed (25 points max)
  const speedScore = (pageSpeedScore / 100) * 25;
  score += speedScore;

  // Score for structured data (20 points)
  if (hasStructuredData) {
    score += 20;
  }

  // Score for proper meta tags (15 points)
  if (hasMetaTags) {
    score += 15;
  }

  return Math.min(100, Math.round(score));
}

/**
 * Determines score trend by comparing current and previous scores
 */
export function calculateScoreTrend(
  currentScore: number,
  previousScore?: number,
  threshold: number = 2
): 'improving' | 'declining' | 'stable' {
  if (!previousScore) {
    return 'stable';
  }

  const difference = currentScore - previousScore;

  if (Math.abs(difference) <= threshold) {
    return 'stable';
  }

  return difference > 0 ? 'improving' : 'declining';
}

/**
 * Creates a complete AI visibility score with all components
 */
export function createAIVisibilityScore(
  breakdown: AIVisibilityScoreBreakdown,
  previousScore?: number
): AIVisibilityScore {
  const overall = calculateOverallScore(breakdown);
  const trend = calculateScoreTrend(overall, previousScore);

  return {
    overall,
    breakdown,
    calculatedAt: new Date(),
    trend,
    previousScore,
  };
}

/**
 * Validates that all breakdown scores are within valid range (0-100)
 */
export function validateBreakdownScores(breakdown: AIVisibilityScoreBreakdown): boolean {
  const scores = Object.values(breakdown);
  return scores.every(score => score >= 0 && score <= 100);
}

/**
 * Gets score category based on overall score
 */
export function getScoreCategory(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

/**
 * Gets score color for UI display
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981'; // green-500
  if (score >= 60) return '#F59E0B'; // amber-500
  if (score >= 40) return '#EF4444'; // red-500
  return '#6B7280'; // gray-500
}

/**
 * Calculates score improvement potential for each category
 */
export function calculateImprovementPotential(breakdown: AIVisibilityScoreBreakdown): Record<keyof AIVisibilityScoreBreakdown, number> {
  return {
    schemaMarkup: Math.max(0, 100 - breakdown.schemaMarkup),
    contentOptimization: Math.max(0, 100 - breakdown.contentOptimization),
    aiSearchPresence: Math.max(0, 100 - breakdown.aiSearchPresence),
    knowledgeGraphIntegration: Math.max(0, 100 - breakdown.knowledgeGraphIntegration),
    socialSignals: Math.max(0, 100 - breakdown.socialSignals),
    technicalSEO: Math.max(0, 100 - breakdown.technicalSEO),
  };
}