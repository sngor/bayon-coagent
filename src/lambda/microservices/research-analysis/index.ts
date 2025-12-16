/**
 * Research and Analysis Microservices
 * 
 * This module exports all research and analysis microservices that provide
 * comprehensive research capabilities with streaming response support,
 * competitor analysis with batch processing, neighborhood analysis with
 * multi-source data aggregation, property valuation with market data integration,
 * and market intelligence with trend detection.
 */

// Service implementations
export { ResearchAgentService } from './research-agent-service';
export { CompetitorAnalysisService } from './competitor-analysis-service';
export { NeighborhoodAnalysisService } from './neighborhood-analysis-service';
export { PropertyValuationService } from './property-valuation-service';
export { MarketIntelligenceService } from './market-intelligence-service';

// Types and interfaces
export * from './types';

// Re-export specific types for external use
export type {
    ResearchQuery,
    ResearchResult,
} from './research-agent-service';

export type {
    CompetitorAnalysisRequest,
    CompetitorAnalysisResult,
    CompetitorProfile,
} from './competitor-analysis-service';

export type {
    NeighborhoodAnalysisRequest,
    NeighborhoodAnalysisResult,
    DataSourceConfig,
} from './neighborhood-analysis-service';

export type {
    PropertyValuationRequest,
    PropertyValuationResult,
    MarketDataSource,
} from './property-valuation-service';

export type {
    MarketIntelligenceRequest,
    MarketIntelligenceResult,
    TrendAnalysis,
    MarketPrediction,
} from './market-intelligence-service';

/**
 * Service Registry for Research and Analysis Microservices
 */
export const RESEARCH_ANALYSIS_SERVICES = {
    RESEARCH_AGENT: 'research-agent-service',
    COMPETITOR_ANALYSIS: 'competitor-analysis-service',
    NEIGHBORHOOD_ANALYSIS: 'neighborhood-analysis-service',
    PROPERTY_VALUATION: 'property-valuation-service',
    MARKET_INTELLIGENCE: 'market-intelligence-service',
} as const;

/**
 * Service Configuration
 */
export const SERVICE_CONFIG = {
    version: '1.0.0',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    batchSize: 10,
    maxConcurrentRequests: 100,
} as const;