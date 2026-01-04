/**
 * AI Visibility Repository
 * 
 * DynamoDB operations for AI visibility data
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import type { DynamoDBItem, QueryResult } from '@/aws/dynamodb/types';
import {
  getAIVisibilityScoreKeys,
  getAIMentionKeys,
  getOptimizationRecommendationKeys,
  getSchemaMarkupKeys,
  getKnowledgeGraphEntityKeys,
  getAIMonitoringConfigKeys,
  getAIMonitoringJobKeys,
  getWebsiteAnalysisKeys,
  getCompetitorAnalysisKeys,
  getAIVisibilityAnalysisKeys,
  getExportRecordKeys,
} from '@/aws/dynamodb/keys';
import type {
  AIVisibilityScore,
  AIMention,
  OptimizationRecommendation,
  SchemaMarkup,
  KnowledgeGraphEntity,
  AIMonitoringConfig,
  WebsiteAnalysis,
  CompetitorAnalysis,
  AIVisibilityAnalysis,
  ExportRecord,
} from './types';

/**
 * Repository for AI Visibility data operations
 */
export class AIVisibilityRepository extends DynamoDBRepository {
  constructor() {
    super(); // Call parent constructor
  }
  // ==================== AI Visibility Score Operations ====================

  /**
   * Creates a new AI visibility score
   */
  async createAIVisibilityScore(
    userId: string,
    score: Omit<AIVisibilityScore, 'calculatedAt'>,
    isLatest: boolean = true
  ): Promise<DynamoDBItem<AIVisibilityScore>> {
    const calculatedAt = new Date().toISOString();
    const scoreData: AIVisibilityScore = {
      ...score,
      calculatedAt: new Date(calculatedAt),
    };

    const keys = getAIVisibilityScoreKeys(userId, calculatedAt, isLatest);
    
    return this.create(
      keys.PK,
      keys.SK,
      'AIVisibilityScore',
      scoreData,
      {
        GSI1PK: keys.GSI1PK,
        GSI1SK: keys.GSI1SK,
      }
    );
  }

  /**
   * Gets the latest AI visibility score for a user
   */
  async getLatestAIVisibilityScore(userId: string): Promise<AIVisibilityScore | null> {
    const keys = getAIVisibilityScoreKeys(userId, '', true);
    
    const result = await this.query<AIVisibilityScore>(
      keys.GSI1PK!,
      keys.GSI1SK,
      {
        indexName: 'GSI1',
        limit: 1,
        scanIndexForward: false,
      }
    );

    return result.items.length > 0 ? result.items[0] : null;
  }

  /**
   * Gets AI visibility score history for a user
   */
  async getAIVisibilityScoreHistory(
    userId: string,
    limit: number = 10
  ): Promise<QueryResult<AIVisibilityScore>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'AI_VISIBILITY_SCORE#';

    return this.query<AIVisibilityScore>(pk, skPrefix, {
      limit,
      scanIndexForward: false, // Most recent first
    });
  }

  /**
   * Gets score history for trend analysis
   */
  async getScoreHistory(
    userId: string,
    limit: number = 10,
    timeRangeDays?: number
  ): Promise<Array<{ userId: string; score: AIVisibilityScore; timestamp: Date }>> {
    const result = await this.getAIVisibilityScoreHistory(userId, limit);
    
    let items = result.items.map(item => ({
      userId,
      score: item,
      timestamp: item.calculatedAt,
    }));

    // Filter by time range if specified
    if (timeRangeDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeRangeDays);
      items = items.filter(item => item.timestamp >= cutoffDate);
    }

    return items;
  }

  /**
   * Stores score history entry
   */
  async storeScoreHistory(historyEntry: {
    userId: string;
    score: AIVisibilityScore;
    timestamp: Date;
    context?: {
      changesImplemented?: string[];
      externalFactors?: string[];
    };
  }): Promise<void> {
    // Store as a regular AI visibility score
    await this.createAIVisibilityScore(
      historyEntry.userId,
      historyEntry.score,
      false // Not the latest, just historical
    );
  }

  // ==================== AI Mention Operations ====================

  /**
   * Creates a new AI mention
   */
  async createAIMention(
    userId: string,
    mention: Omit<AIMention, 'id' | 'timestamp'>
  ): Promise<DynamoDBItem<AIMention>> {
    const mentionId = `mention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    const mentionData: AIMention = {
      ...mention,
      id: mentionId,
      timestamp: new Date(timestamp),
    };

    const keys = getAIMentionKeys(userId, mentionId, mention.platform, timestamp);
    
    return this.create(
      keys.PK,
      keys.SK,
      'AIMention',
      mentionData,
      {
        GSI1PK: keys.GSI1PK,
        GSI1SK: keys.GSI1SK,
        GSI2PK: keys.GSI2PK,
        GSI2SK: keys.GSI2SK,
      }
    );
  }

  /**
   * Gets AI mentions for a user
   */
  async getAIMentions(
    userId: string,
    limit: number = 50
  ): Promise<QueryResult<AIMention>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'AI_MENTION#';

    return this.query<AIMention>(pk, skPrefix, {
      limit,
      scanIndexForward: false, // Most recent first
    });
  }

  /**
   * Gets AI mentions by platform
   */
  async getAIMentionsByPlatform(
    platform: string,
    limit: number = 50
  ): Promise<QueryResult<AIMention>> {
    const gsi2pk = `AI_MENTION#${platform}`;

    return this.query<AIMention>(gsi2pk, undefined, {
      indexName: 'GSI2',
      limit,
      scanIndexForward: false, // Most recent first
    });
  }

  /**
   * Gets AI mentions by date range
   */
  async getAIMentionsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
    limit: number = 100
  ): Promise<QueryResult<AIMention>> {
    const gsi1pk = `USER#${userId}`;

    return this.query<AIMention>(gsi1pk, 'AI_MENTION_BY_DATE#', {
      indexName: 'GSI1',
      limit,
      scanIndexForward: false,
      filterExpression: 'GSI1SK BETWEEN :startDate AND :endDate',
      expressionAttributeValues: {
        ':startDate': `AI_MENTION_BY_DATE#${startDate}`,
        ':endDate': `AI_MENTION_BY_DATE#${endDate}`,
      },
    });
  }

  // ==================== Optimization Recommendation Operations ====================

  /**
   * Creates a new optimization recommendation
   */
  async createOptimizationRecommendation(
    userId: string,
    recommendation: Omit<OptimizationRecommendation, 'id' | 'createdAt'>
  ): Promise<DynamoDBItem<OptimizationRecommendation>> {
    const recommendationId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();
    
    const recommendationData: OptimizationRecommendation = {
      ...recommendation,
      id: recommendationId,
      createdAt: new Date(createdAt),
    };

    const keys = getOptimizationRecommendationKeys(
      userId,
      recommendationId,
      recommendation.priority,
      createdAt,
      recommendation.status,
      recommendation.category
    );
    
    return this.create(
      keys.PK,
      keys.SK,
      'OptimizationRecommendation',
      recommendationData,
      {
        GSI1PK: keys.GSI1PK,
        GSI1SK: keys.GSI1SK,
        GSI2PK: keys.GSI2PK,
        GSI2SK: keys.GSI2SK,
      }
    );
  }

  /**
   * Gets optimization recommendations for a user
   */
  async getOptimizationRecommendations(
    userId: string,
    limit: number = 50
  ): Promise<QueryResult<OptimizationRecommendation>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'AI_RECOMMENDATION#';

    return this.query<OptimizationRecommendation>(pk, skPrefix, {
      limit,
      scanIndexForward: false, // Most recent first
    });
  }

  /**
   * Gets recommendations by status
   */
  async getRecommendationsByStatus(
    userId: string,
    status: string,
    limit: number = 50
  ): Promise<QueryResult<OptimizationRecommendation>> {
    const gsi1pk = `USER#${userId}`;
    const gsi1skPrefix = `AI_REC_BY_STATUS#${status}#`;

    return this.query<OptimizationRecommendation>(gsi1pk, gsi1skPrefix, {
      indexName: 'GSI1',
      limit,
      scanIndexForward: false,
    });
  }

  /**
   * Gets recommendations by category
   */
  async getRecommendationsByCategory(
    category: string,
    limit: number = 50
  ): Promise<QueryResult<OptimizationRecommendation>> {
    const gsi2pk = `AI_REC#${category}`;

    return this.query<OptimizationRecommendation>(gsi2pk, undefined, {
      indexName: 'GSI2',
      limit,
      scanIndexForward: false,
    });
  }

  /**
   * Updates recommendation status
   */
  async updateRecommendationStatus(
    userId: string,
    recommendationId: string,
    priority: string,
    createdAt: string,
    status: string,
    completedAt?: Date
  ): Promise<void> {
    const keys = getOptimizationRecommendationKeys(userId, recommendationId, priority, createdAt);
    
    const updates: any = { status };
    if (completedAt) {
      updates.completedAt = completedAt;
    }

    await this.update(keys.PK, keys.SK, updates);
  }

  // ==================== Schema Markup Operations ====================

  /**
   * Creates schema markup
   */
  async createSchemaMarkup(
    userId: string,
    schemaType: string,
    markup: Omit<SchemaMarkup, '@id'>
  ): Promise<DynamoDBItem<SchemaMarkup>> {
    const schemaId = `schema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const schemaData: SchemaMarkup = {
      ...markup,
      '@id': `#${schemaId}`,
    };

    const keys = getSchemaMarkupKeys(userId, schemaId, schemaType);
    
    return this.create(
      keys.PK,
      keys.SK,
      'SchemaMarkup',
      schemaData,
      {
        GSI1PK: keys.GSI1PK,
        GSI1SK: keys.GSI1SK,
      }
    );
  }

  /**
   * Gets schema markup for a user
   */
  async getSchemaMarkup(userId: string): Promise<QueryResult<SchemaMarkup>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'SCHEMA_MARKUP#';

    return this.query<SchemaMarkup>(pk, skPrefix);
  }

  /**
   * Gets schema markup by type
   */
  async getSchemaMarkupByType(
    userId: string,
    schemaType: string
  ): Promise<QueryResult<SchemaMarkup>> {
    const gsi1pk = `USER#${userId}`;
    const gsi1sk = `SCHEMA_BY_TYPE#${schemaType}`;

    return this.query<SchemaMarkup>(gsi1pk, gsi1sk, {
      indexName: 'GSI1',
    });
  }

  // ==================== Knowledge Graph Operations ====================

  /**
   * Creates a knowledge graph entity
   */
  async createKnowledgeGraphEntity(
    userId: string,
    entityType: string,
    entity: Omit<KnowledgeGraphEntity, '@id'>
  ): Promise<DynamoDBItem<KnowledgeGraphEntity>> {
    const entityId = `kg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const entityData: KnowledgeGraphEntity = {
      ...entity,
      '@id': `#${entityId}`,
    };

    const keys = getKnowledgeGraphEntityKeys(userId, entityId, entityType);
    
    return this.create(
      keys.PK,
      keys.SK,
      'KnowledgeGraphEntity',
      entityData,
      {
        GSI1PK: keys.GSI1PK,
        GSI1SK: keys.GSI1SK,
      }
    );
  }

  /**
   * Gets knowledge graph entities for a user
   */
  async getKnowledgeGraphEntities(userId: string): Promise<QueryResult<KnowledgeGraphEntity>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'KNOWLEDGE_GRAPH#';

    return this.query<KnowledgeGraphEntity>(pk, skPrefix);
  }

  /**
   * Gets knowledge graph entities by type
   */
  async getKnowledgeGraphEntitiesByType(
    userId: string,
    entityType: string
  ): Promise<QueryResult<KnowledgeGraphEntity>> {
    const gsi1pk = `USER#${userId}`;
    const gsi1sk = `KG_BY_TYPE#${entityType}`;

    return this.query<KnowledgeGraphEntity>(gsi1pk, gsi1sk, {
      indexName: 'GSI1',
    });
  }

  // ==================== AI Monitoring Configuration Operations ====================

  /**
   * Creates or updates AI monitoring configuration
   */
  async saveAIMonitoringConfig(
    userId: string,
    config: Omit<AIMonitoringConfig, 'userId'>
  ): Promise<DynamoDBItem<AIMonitoringConfig>> {
    const configData: AIMonitoringConfig = {
      ...config,
      userId,
    };

    const keys = getAIMonitoringConfigKeys(userId);
    
    return this.create(
      keys.PK,
      keys.SK,
      'AIMonitoringConfig',
      configData
    );
  }

  /**
   * Gets AI monitoring configuration for a user
   */
  async getAIMonitoringConfig(userId: string): Promise<AIMonitoringConfig | null> {
    const keys = getAIMonitoringConfigKeys(userId);
    return this.get<AIMonitoringConfig>(keys.PK, keys.SK);
  }

  // ==================== Website Analysis Operations ====================

  /**
   * Creates website analysis
   */
  async createWebsiteAnalysis(
    userId: string,
    analysis: Omit<WebsiteAnalysis, 'analyzedAt'>,
    isLatest: boolean = true
  ): Promise<DynamoDBItem<WebsiteAnalysis>> {
    const timestamp = new Date().toISOString();
    const analysisData: WebsiteAnalysis = {
      ...analysis,
      analyzedAt: new Date(timestamp),
    };

    const keys = getWebsiteAnalysisKeys(userId, timestamp, isLatest);
    
    return this.create(
      keys.PK,
      keys.SK,
      'WebsiteAnalysis',
      analysisData,
      {
        GSI1PK: keys.GSI1PK,
        GSI1SK: keys.GSI1SK,
      }
    );
  }

  /**
   * Gets the latest website analysis for a user
   */
  async getLatestWebsiteAnalysis(userId: string): Promise<WebsiteAnalysis | null> {
    const keys = getWebsiteAnalysisKeys(userId, '', true);
    
    const result = await this.query<WebsiteAnalysis>(
      keys.GSI1PK!,
      keys.GSI1SK,
      {
        indexName: 'GSI1',
        limit: 1,
      }
    );

    return result.items.length > 0 ? result.items[0] : null;
  }

  // ==================== Competitor Analysis Operations ====================

  /**
   * Creates competitor analysis
   */
  async createCompetitorAnalysis(
    userId: string,
    analysis: CompetitorAnalysis,
    isLatest: boolean = true
  ): Promise<DynamoDBItem<CompetitorAnalysis>> {
    const timestamp = new Date().toISOString();

    const keys = getCompetitorAnalysisKeys(userId, timestamp, isLatest);
    
    return this.create(
      keys.PK,
      keys.SK,
      'CompetitorAnalysis',
      analysis,
      {
        GSI1PK: keys.GSI1PK,
        GSI1SK: keys.GSI1SK,
      }
    );
  }

  /**
   * Gets the latest competitor analysis for a user
   */
  async getLatestCompetitorAnalysis(userId: string): Promise<CompetitorAnalysis | null> {
    const keys = getCompetitorAnalysisKeys(userId, '', true);
    
    const result = await this.query<CompetitorAnalysis>(
      keys.GSI1PK!,
      keys.GSI1SK,
      {
        indexName: 'GSI1',
        limit: 1,
      }
    );

    return result.items.length > 0 ? result.items[0] : null;
  }

  // ==================== AI Visibility Analysis Operations ====================

  /**
   * Creates comprehensive AI visibility analysis
   */
  async createAIVisibilityAnalysis(
    userId: string,
    analysis: Omit<AIVisibilityAnalysis, 'analyzedAt'>,
    isLatest: boolean = true
  ): Promise<DynamoDBItem<AIVisibilityAnalysis>> {
    const timestamp = new Date().toISOString();
    const analysisData: AIVisibilityAnalysis = {
      ...analysis,
      analyzedAt: new Date(timestamp),
    };

    const keys = getAIVisibilityAnalysisKeys(userId, timestamp, isLatest);
    
    return this.create(
      keys.PK,
      keys.SK,
      'AIVisibilityAnalysis',
      analysisData,
      {
        GSI1PK: keys.GSI1PK,
        GSI1SK: keys.GSI1SK,
      }
    );
  }

  /**
   * Gets the latest AI visibility analysis for a user
   */
  async getLatestAIVisibilityAnalysis(userId: string): Promise<AIVisibilityAnalysis | null> {
    const keys = getAIVisibilityAnalysisKeys(userId, '', true);
    
    const result = await this.query<AIVisibilityAnalysis>(
      keys.GSI1PK!,
      keys.GSI1SK,
      {
        indexName: 'GSI1',
        limit: 1,
      }
    );

    return result.items.length > 0 ? result.items[0] : null;
  }

  /**
   * Gets AI visibility analysis history for a user
   */
  async getAIVisibilityAnalysisHistory(
    userId: string,
    limit: number = 10
  ): Promise<QueryResult<AIVisibilityAnalysis>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'AI_VISIBILITY_ANALYSIS#';

    return this.query<AIVisibilityAnalysis>(pk, skPrefix, {
      limit,
      scanIndexForward: false, // Most recent first
    });
  }

  // ==================== Export Record Operations ====================

  /**
   * Creates an export record
   */
  async createExportRecord(
    userId: string,
    exportRecord: Omit<ExportRecord, 'userId'>
  ): Promise<DynamoDBItem<ExportRecord>> {
    const exportData: ExportRecord = {
      ...exportRecord,
      userId,
    };

    const keys = getExportRecordKeys(
      userId,
      exportRecord.exportId,
      exportRecord.exportedAt.toISOString()
    );
    
    return this.create(
      keys.PK,
      keys.SK,
      'ExportRecord',
      exportData,
      {
        GSI1PK: keys.GSI1PK,
        GSI1SK: keys.GSI1SK,
      }
    );
  }

  /**
   * Gets export records for a user
   */
  async getExportRecords(
    userId: string,
    limit: number = 50
  ): Promise<QueryResult<ExportRecord>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'EXPORT_RECORD#';

    return this.query<ExportRecord>(pk, skPrefix, {
      limit,
      scanIndexForward: false, // Most recent first
    });
  }

  /**
   * Gets export records by date range
   */
  async getExportRecordsByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
    limit: number = 100
  ): Promise<QueryResult<ExportRecord>> {
    const gsi1pk = `USER#${userId}`;

    return this.query<ExportRecord>(gsi1pk, 'EXPORT_BY_DATE#', {
      indexName: 'GSI1',
      limit,
      scanIndexForward: false,
      filterExpression: 'GSI1SK BETWEEN :startDate AND :endDate',
      expressionAttributeValues: {
        ':startDate': `EXPORT_BY_DATE#${startDate}`,
        ':endDate': `EXPORT_BY_DATE#${endDate}`,
      },
    });
  }

  /**
   * Gets a specific export record
   */
  async getExportRecord(
    userId: string,
    exportId: string,
    exportedAt: string
  ): Promise<ExportRecord | null> {
    const keys = getExportRecordKeys(userId, exportId, exportedAt);
    return this.get<ExportRecord>(keys.PK, keys.SK);
  }
}