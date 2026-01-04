/**
 * Fallback Manager for AI Visibility Services
 * 
 * Provides fallback mechanisms for unavailable services
 * Requirements: All error handling scenarios
 */

import { 
  AIVisibilityError, 
  ServiceUnavailableError, 
  AIPlatformError,
  SchemaGenerationError,
  logError 
} from './errors';
import type { 
  SchemaMarkup, 
  AIMention, 
  OptimizationRecommendation, 
  AIVisibilityScore,
  ExportPackage,
  WebsiteAnalysis,
  KnowledgeGraphEntity
} from './types';

/**
 * Fallback strategy types
 */
export type FallbackStrategy = 
  | 'cached_data'
  | 'simplified_output' 
  | 'default_values'
  | 'alternative_service'
  | 'graceful_degradation';

/**
 * Fallback configuration for different services
 */
export interface FallbackConfig {
  strategy: FallbackStrategy;
  cacheExpiryHours?: number;
  simplificationLevel?: 'minimal' | 'moderate' | 'aggressive';
  alternativeServices?: string[];
  gracefulMessage?: string;
}

/**
 * Service availability status
 */
export interface ServiceStatus {
  available: boolean;
  lastChecked: Date;
  errorCount: number;
  lastError?: string;
  estimatedRecovery?: Date;
}

/**
 * Fallback manager class
 */
export class FallbackManager {
  private serviceStatus: Map<string, ServiceStatus> = new Map();
  private cachedData: Map<string, { data: any; timestamp: Date; expiryHours: number }> = new Map();
  
  /**
   * Default fallback configurations
   */
  private readonly fallbackConfigs: Record<string, FallbackConfig> = {
    schemaGeneration: {
      strategy: 'simplified_output',
      simplificationLevel: 'moderate',
      gracefulMessage: 'Generated basic schema markup. Some advanced features may be limited.',
    },
    aiPlatformMonitoring: {
      strategy: 'cached_data',
      cacheExpiryHours: 24,
      gracefulMessage: 'Using cached AI monitoring data. Real-time data may be unavailable.',
    },
    websiteAnalysis: {
      strategy: 'default_values',
      gracefulMessage: 'Website analysis unavailable. Using default recommendations.',
    },
    knowledgeGraph: {
      strategy: 'simplified_output',
      simplificationLevel: 'minimal',
      gracefulMessage: 'Generated simplified knowledge graph. Some relationships may be missing.',
    },
    exportGeneration: {
      strategy: 'alternative_service',
      alternativeServices: ['json-ld-only', 'basic-export'],
      gracefulMessage: 'Some export formats may be unavailable. Core formats are still supported.',
    },
    optimizationEngine: {
      strategy: 'cached_data',
      cacheExpiryHours: 48,
      gracefulMessage: 'Using cached recommendations. New analysis may be delayed.',
    },
  };

  /**
   * Execute operation with fallback support
   */
  async executeWithFallback<T>(
    operation: () => Promise<T>,
    serviceName: string,
    fallbackData?: Partial<T>,
    userId?: string
  ): Promise<T> {
    try {
      // Check service availability
      if (!this.isServiceAvailable(serviceName)) {
        return this.handleServiceUnavailable<T>(serviceName, fallbackData, userId);
      }

      // Try the main operation
      const result = await operation();
      
      // Mark service as available and cache result if applicable
      this.markServiceAvailable(serviceName);
      this.cacheResult(serviceName, result, userId);
      
      return result;
    } catch (error) {
      // Mark service as unavailable
      this.markServiceUnavailable(serviceName, error);
      
      // Apply fallback strategy
      return this.applyFallbackStrategy<T>(serviceName, error, fallbackData, userId);
    }
  }

  /**
   * Handle service unavailable scenario
   */
  private async handleServiceUnavailable<T>(
    serviceName: string,
    fallbackData?: Partial<T>,
    userId?: string
  ): Promise<T> {
    const config = this.fallbackConfigs[serviceName];
    
    logError(
      new ServiceUnavailableError(
        `Service ${serviceName} is marked as unavailable`,
        serviceName
      ),
      { userId, fallbackStrategy: config?.strategy }
    );

    return this.applyFallbackStrategy<T>(
      serviceName,
      new ServiceUnavailableError(`${serviceName} unavailable`, serviceName),
      fallbackData,
      userId
    );
  }

  /**
   * Apply fallback strategy based on configuration
   */
  private async applyFallbackStrategy<T>(
    serviceName: string,
    error: any,
    fallbackData?: Partial<T>,
    userId?: string
  ): Promise<T> {
    const config = this.fallbackConfigs[serviceName];
    
    if (!config) {
      throw new ServiceUnavailableError(
        `No fallback strategy configured for ${serviceName}`,
        serviceName,
        undefined,
        error
      );
    }

    switch (config.strategy) {
      case 'cached_data':
        return this.getCachedDataFallback<T>(serviceName, userId, error);
        
      case 'simplified_output':
        return this.getSimplifiedOutputFallback<T>(serviceName, config, fallbackData, error);
        
      case 'default_values':
        return this.getDefaultValuesFallback<T>(serviceName, fallbackData, error);
        
      case 'alternative_service':
        return this.getAlternativeServiceFallback<T>(serviceName, config, fallbackData, error);
        
      case 'graceful_degradation':
        return this.getGracefulDegradationFallback<T>(serviceName, config, fallbackData, error);
        
      default:
        throw new ServiceUnavailableError(
          `Unknown fallback strategy: ${config.strategy}`,
          serviceName,
          undefined,
          error
        );
    }
  }

  /**
   * Get cached data as fallback
   */
  private getCachedDataFallback<T>(serviceName: string, userId?: string, error?: any): T {
    const cacheKey = userId ? `${serviceName}:${userId}` : serviceName;
    const cached = this.cachedData.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      logError(
        new ServiceUnavailableError(
          `Using cached data for ${serviceName}`,
          serviceName,
          undefined,
          error
        ),
        { cacheAge: Date.now() - cached.timestamp.getTime(), userId }
      );
      
      return cached.data;
    }
    
    throw new ServiceUnavailableError(
      `No valid cached data available for ${serviceName}`,
      serviceName,
      undefined,
      error
    );
  }

  /**
   * Get simplified output as fallback
   */
  private getSimplifiedOutputFallback<T>(
    serviceName: string,
    config: FallbackConfig,
    fallbackData?: Partial<T>,
    error?: any
  ): T {
    switch (serviceName) {
      case 'schemaGeneration':
        return this.getSimplifiedSchemaMarkup(config.simplificationLevel) as T;
        
      case 'knowledgeGraph':
        return this.getSimplifiedKnowledgeGraph(fallbackData) as T;
        
      case 'aiPlatformMonitoring':
        return this.getSimplifiedAIMentions() as T;
        
      default:
        if (fallbackData) {
          return fallbackData as T;
        }
        throw new ServiceUnavailableError(
          `No simplified output available for ${serviceName}`,
          serviceName,
          undefined,
          error
        );
    }
  }

  /**
   * Get default values as fallback
   */
  private getDefaultValuesFallback<T>(
    serviceName: string,
    fallbackData?: Partial<T>,
    error?: any
  ): T {
    switch (serviceName) {
      case 'websiteAnalysis':
        return this.getDefaultWebsiteAnalysis() as T;
        
      case 'optimizationEngine':
        return this.getDefaultRecommendations() as T;
        
      case 'aiVisibilityScore':
        return this.getDefaultVisibilityScore() as T;
        
      default:
        if (fallbackData) {
          return { ...this.getGenericDefaults(), ...fallbackData } as T;
        }
        throw new ServiceUnavailableError(
          `No default values available for ${serviceName}`,
          serviceName,
          undefined,
          error
        );
    }
  }

  /**
   * Get alternative service as fallback
   */
  private async getAlternativeServiceFallback<T>(
    serviceName: string,
    config: FallbackConfig,
    fallbackData?: Partial<T>,
    error?: any
  ): Promise<T> {
    if (!config.alternativeServices || config.alternativeServices.length === 0) {
      throw new ServiceUnavailableError(
        `No alternative services configured for ${serviceName}`,
        serviceName,
        undefined,
        error
      );
    }

    // Try alternative services in order
    for (const altService of config.alternativeServices) {
      try {
        return await this.tryAlternativeService<T>(altService, fallbackData);
      } catch (altError) {
        logError(
          new ServiceUnavailableError(
            `Alternative service ${altService} also failed`,
            altService,
            undefined,
            altError
          ),
          { originalService: serviceName }
        );
      }
    }

    throw new ServiceUnavailableError(
      `All alternative services failed for ${serviceName}`,
      serviceName,
      undefined,
      error
    );
  }

  /**
   * Get graceful degradation fallback
   */
  private getGracefulDegradationFallback<T>(
    serviceName: string,
    config: FallbackConfig,
    fallbackData?: Partial<T>,
    error?: any
  ): T {
    // Return minimal viable data with degradation notice
    const degradedData = {
      ...this.getGenericDefaults(),
      ...fallbackData,
      _degraded: true,
      _degradationMessage: config.gracefulMessage || `${serviceName} is temporarily unavailable`,
      _originalError: error?.message,
    } as T;

    return degradedData;
  }

  /**
   * Service availability management
   */
  private isServiceAvailable(serviceName: string): boolean {
    const status = this.serviceStatus.get(serviceName);
    
    if (!status) {
      return true; // Assume available if no status recorded
    }

    // Check if service should be retried
    if (!status.available && status.estimatedRecovery && new Date() > status.estimatedRecovery) {
      return true;
    }

    return status.available;
  }

  private markServiceAvailable(serviceName: string): void {
    this.serviceStatus.set(serviceName, {
      available: true,
      lastChecked: new Date(),
      errorCount: 0,
      lastError: undefined,
      estimatedRecovery: undefined,
    });
  }

  private markServiceUnavailable(serviceName: string, error: any): void {
    const existing = this.serviceStatus.get(serviceName) || {
      available: true,
      lastChecked: new Date(),
      errorCount: 0,
    };

    const errorCount = existing.errorCount + 1;
    const estimatedRecovery = new Date();
    
    // Exponential backoff for recovery time
    estimatedRecovery.setMinutes(estimatedRecovery.getMinutes() + Math.pow(2, Math.min(errorCount, 6)));

    this.serviceStatus.set(serviceName, {
      available: false,
      lastChecked: new Date(),
      errorCount,
      lastError: error?.message || 'Unknown error',
      estimatedRecovery,
    });
  }

  /**
   * Cache management
   */
  private cacheResult(serviceName: string, result: any, userId?: string): void {
    const config = this.fallbackConfigs[serviceName];
    
    if (config?.strategy === 'cached_data' && config.cacheExpiryHours) {
      const cacheKey = userId ? `${serviceName}:${userId}` : serviceName;
      
      this.cachedData.set(cacheKey, {
        data: result,
        timestamp: new Date(),
        expiryHours: config.cacheExpiryHours,
      });
    }
  }

  private isCacheValid(cached: { timestamp: Date; expiryHours: number }): boolean {
    const expiryTime = new Date(cached.timestamp);
    expiryTime.setHours(expiryTime.getHours() + cached.expiryHours);
    
    return new Date() < expiryTime;
  }

  /**
   * Simplified output generators
   */
  private getSimplifiedSchemaMarkup(level?: string): SchemaMarkup[] {
    const baseSchema: SchemaMarkup = {
      '@context': 'https://schema.org',
      '@type': 'RealEstateAgent',
      name: 'Real Estate Professional',
      description: 'Professional real estate services',
    };

    return [baseSchema];
  }

  private getSimplifiedKnowledgeGraph(fallbackData?: any): KnowledgeGraphEntity[] {
    return [{
      '@id': '#agent-entity',
      '@type': 'Agent',
      properties: fallbackData || {},
      relationships: [],
    }];
  }

  private getSimplifiedAIMentions(): AIMention[] {
    return []; // Return empty array when AI monitoring is unavailable
  }

  /**
   * Default value generators
   */
  private getDefaultWebsiteAnalysis(): WebsiteAnalysis {
    return {
      url: '',
      schemaMarkup: [],
      validationResults: [],
      missingSchemas: [],
      technicalIssues: ['Analysis unavailable - service temporarily down'],
      recommendations: ['Try again later when the analysis service is restored'],
      analyzedAt: new Date(),
    };
  }

  private getDefaultRecommendations(): OptimizationRecommendation[] {
    return [{
      id: 'fallback-rec-1',
      category: 'schema',
      priority: 'medium',
      title: 'Add Basic Schema Markup',
      description: 'Add basic RealEstateAgent schema markup to improve AI visibility.',
      actionItems: [
        'Add RealEstateAgent schema to your website',
        'Include your name and contact information',
        'Add service area information',
      ],
      estimatedImpact: 10,
      implementationDifficulty: 'easy',
      status: 'pending',
      createdAt: new Date(),
    }];
  }

  private getDefaultVisibilityScore(): AIVisibilityScore {
    return {
      overall: 50,
      breakdown: {
        schemaMarkup: 30,
        contentOptimization: 50,
        aiSearchPresence: 40,
        knowledgeGraphIntegration: 20,
        socialSignals: 60,
        technicalSEO: 70,
      },
      calculatedAt: new Date(),
      trend: 'stable',
    };
  }

  private getGenericDefaults(): Record<string, any> {
    return {
      timestamp: new Date().toISOString(),
      status: 'degraded',
      message: 'Service temporarily unavailable',
    };
  }

  /**
   * Alternative service handlers
   */
  private async tryAlternativeService<T>(serviceName: string, fallbackData?: Partial<T>): Promise<T> {
    switch (serviceName) {
      case 'json-ld-only':
        return this.generateJSONLDOnly(fallbackData) as T;
        
      case 'basic-export':
        return this.generateBasicExport(fallbackData) as T;
        
      default:
        throw new ServiceUnavailableError(
          `Unknown alternative service: ${serviceName}`,
          serviceName
        );
    }
  }

  private generateJSONLDOnly(fallbackData?: any): ExportPackage {
    const basicSchema = this.getSimplifiedSchemaMarkup()[0];
    
    return {
      jsonLD: JSON.stringify(basicSchema, null, 2),
      rdfXML: '<!-- RDF/XML export unavailable -->',
      turtle: '# Turtle export unavailable',
      microdata: '<!-- Microdata export unavailable -->',
      instructions: 'Only JSON-LD format is available. Other formats are temporarily unavailable.',
      platformGuides: {
        wordpress: 'Add the JSON-LD script to your WordPress header.',
        squarespace: 'Add the JSON-LD script to your Squarespace code injection.',
      },
    };
  }

  private generateBasicExport(fallbackData?: any): ExportPackage {
    return {
      jsonLD: '{}',
      rdfXML: '',
      turtle: '',
      microdata: '',
      instructions: 'Export service is temporarily unavailable. Please try again later.',
      platformGuides: {},
    };
  }

  /**
   * Get service status for monitoring
   */
  getServiceStatus(serviceName?: string): Map<string, ServiceStatus> | ServiceStatus | null {
    if (serviceName) {
      return this.serviceStatus.get(serviceName) || null;
    }
    return new Map(this.serviceStatus);
  }

  /**
   * Clear cache for a service
   */
  clearCache(serviceName?: string, userId?: string): void {
    if (serviceName && userId) {
      this.cachedData.delete(`${serviceName}:${userId}`);
    } else if (serviceName) {
      // Clear all cache entries for this service
      const keys = Array.from(this.cachedData.keys());
      for (const key of keys) {
        if (key.startsWith(`${serviceName}:`)) {
          this.cachedData.delete(key);
        }
      }
    } else {
      this.cachedData.clear();
    }
  }

  /**
   * Reset service status
   */
  resetServiceStatus(serviceName?: string): void {
    if (serviceName) {
      this.serviceStatus.delete(serviceName);
    } else {
      this.serviceStatus.clear();
    }
  }
}

/**
 * Singleton fallback manager instance
 */
export const fallbackManager = new FallbackManager();