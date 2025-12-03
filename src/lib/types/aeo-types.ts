/**
 * AEO (Answer Engine Optimization) Types
 * 
 * Types for AI visibility analysis, monitoring, and optimization
 */

/**
 * AEO Score - Overall AI visibility score
 */
export interface AEOScore {
    userId: string;
    score: number; // 0-100
    timestamp: string;
    breakdown: AEOScoreBreakdown;
    trend?: 'up' | 'down' | 'stable';
    previousScore?: number;
}

/**
 * AEO Score Breakdown by category
 */
export interface AEOScoreBreakdown {
    schemaMarkup: number; // 0-20
    googleBusinessProfile: number; // 0-20
    reviewsAndRatings: number; // 0-15
    socialMediaPresence: number; // 0-10
    contentFreshness: number; // 0-10
    napConsistency: number; // 0-10
    backlinkQuality: number; // 0-10
    faqContent: number; // 0-5
}

/**
 * AEO Analysis Request
 */
export interface AEOAnalysisRequest {
    userId: string;
    agentName: string;
    businessName?: string;
    website?: string;
    location?: string;
    googleBusinessProfileUrl?: string;
    socialMediaUrls?: string[];
}

/**
 * AEO Analysis Result
 */
export interface AEOAnalysisResult {
    score: AEOScore;
    recommendations: AEORecommendation[];
    insights: AEOInsight[];
    competitivePosition?: string;
}

/**
 * AEO Recommendation
 */
export interface AEORecommendation {
    id: string;
    userId: string;
    category: AEORecommendationCategory;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    impact: number; // Potential score improvement (0-20)
    effort: 'easy' | 'moderate' | 'difficult';
    actionItems: string[];
    status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
    createdAt: string;
    updatedAt?: string;
}

/**
 * AEO Recommendation Categories
 */
export type AEORecommendationCategory =
    | 'technical_seo'
    | 'content'
    | 'reviews'
    | 'social_proof'
    | 'authority'
    | 'local_seo'
    | 'structured_data';

/**
 * AEO Insight - Analysis findings
 */
export interface AEOInsight {
    type: 'strength' | 'weakness' | 'opportunity' | 'threat';
    category: string;
    message: string;
    details?: string;
}

/**
 * AI Mention - When agent is mentioned in AI search results
 */
export interface AEOMention {
    id: string;
    userId: string;
    source: AISearchSource;
    query: string;
    context: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    position?: number; // Position in response (1st, 2nd, 3rd, etc.)
    competingAgents?: string[];
    timestamp: string;
    url?: string;
}

/**
 * AI Search Sources
 */
export type AISearchSource =
    | 'chatgpt'
    | 'claude'
    | 'perplexity'
    | 'gemini'
    | 'bing_copilot'
    | 'other';

/**
 * AI Search Monitoring Request
 */
export interface AISearchMonitoringRequest {
    userId: string;
    agentName: string;
    location: string;
    queries?: string[]; // Custom queries to test
}

/**
 * AI Search Monitoring Result
 */
export interface AISearchMonitoringResult {
    mentions: AEOMention[];
    summary: AISearchSummary;
    timestamp: string;
}

/**
 * AI Search Summary Statistics
 */
export interface AISearchSummary {
    totalQueries: number;
    mentionCount: number;
    mentionRate: number; // Percentage (0-100)
    averagePosition?: number;
    sentimentBreakdown: {
        positive: number;
        neutral: number;
        negative: number;
    };
    topCompetitors: string[];
}

/**
 * AEO Competitor Comparison
 */
export interface AEOCompetitorComparison {
    userId: string;
    userScore: number;
    competitors: AEOCompetitorScore[];
    ranking: number; // User's ranking among competitors
    insights: string[];
    timestamp: string;
}

/**
 * Competitor AEO Score
 */
export interface AEOCompetitorScore {
    competitorId: string;
    competitorName: string;
    score: number;
    breakdown?: AEOScoreBreakdown;
    strengths: string[];
    weaknesses: string[];
}

/**
 * Schema Markup Types
 */
export interface SchemaMarkup {
    '@context': 'https://schema.org';
    '@type': string;
    [key: string]: any;
}

/**
 * LocalBusiness Schema
 */
export interface LocalBusinessSchema extends SchemaMarkup {
    '@type': 'RealEstateAgent' | 'LocalBusiness';
    name: string;
    image?: string;
    '@id'?: string;
    url?: string;
    telephone?: string;
    address?: {
        '@type': 'PostalAddress';
        streetAddress?: string;
        addressLocality?: string;
        addressRegion?: string;
        postalCode?: string;
        addressCountry?: string;
    };
    geo?: {
        '@type': 'GeoCoordinates';
        latitude: number;
        longitude: number;
    };
    openingHoursSpecification?: Array<{
        '@type': 'OpeningHoursSpecification';
        dayOfWeek: string[];
        opens: string;
        closes: string;
    }>;
    priceRange?: string;
    aggregateRating?: {
        '@type': 'AggregateRating';
        ratingValue: number;
        reviewCount: number;
    };
}

/**
 * Person Schema (for agent)
 */
export interface PersonSchema extends SchemaMarkup {
    '@type': 'Person';
    name: string;
    jobTitle?: string;
    worksFor?: {
        '@type': 'Organization';
        name: string;
    };
    url?: string;
    image?: string;
    sameAs?: string[]; // Social media URLs
    telephone?: string;
    email?: string;
    address?: {
        '@type': 'PostalAddress';
        addressLocality?: string;
        addressRegion?: string;
    };
}

/**
 * FAQPage Schema
 */
export interface FAQPageSchema extends SchemaMarkup {
    '@type': 'FAQPage';
    mainEntity: Array<{
        '@type': 'Question';
        name: string;
        acceptedAnswer: {
            '@type': 'Answer';
            text: string;
        };
    }>;
}

/**
 * AEO Content Optimization Request
 */
export interface AEOContentOptimizationRequest {
    content: string;
    contentType: 'blog_post' | 'social_media' | 'listing_description' | 'bio' | 'faq';
    targetKeywords?: string[];
    location?: string;
}

/**
 * AEO Content Optimization Result
 */
export interface AEOContentOptimizationResult {
    originalContent: string;
    optimizedContent: string;
    aeoScore: number; // 0-100
    improvements: string[];
    suggestions: string[];
    keywordDensity?: Record<string, number>;
}

/**
 * AEO History Entry
 */
export interface AEOHistoryEntry {
    timestamp: string;
    score: number;
    change: number;
    event?: string; // What triggered the change
}
