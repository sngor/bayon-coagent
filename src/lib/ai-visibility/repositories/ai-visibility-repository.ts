/**
 * AI Visibility Repository
 * Handles all data access operations for AI visibility components
 */

import type { 
  SchemaMarkup, 
  KnowledgeGraphEntity, 
  ExportFormat,
  RollbackData 
} from '../profile-update-synchronizer';

export interface AIVisibilityRepository {
  // Schema operations
  saveSchemas(userId: string, schemas: SchemaMarkup[]): Promise<void>;
  getSchemas(userId: string): Promise<SchemaMarkup[]>;
  
  // Entity operations
  saveEntities(userId: string, entities: KnowledgeGraphEntity[]): Promise<void>;
  getEntities(userId: string): Promise<KnowledgeGraphEntity[]>;
  
  // Export operations
  saveExports(userId: string, exports: Record<ExportFormat, string>): Promise<void>;
  getExports(userId: string): Promise<Record<ExportFormat, string>>;
  
  // Rollback operations
  saveRollbackData(changeId: string, data: RollbackData): Promise<void>;
  getRollbackData(changeId: string): Promise<RollbackData | null>;
  
  // Batch operations
  saveBatch(userId: string, data: {
    schemas?: SchemaMarkup[];
    entities?: KnowledgeGraphEntity[];
    exports?: Record<ExportFormat, string>;
  }): Promise<void>;
}

export class DynamoDBVisibilityRepository implements AIVisibilityRepository {
  private async getRepository() {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    return getRepository();
  }

  async saveSchemas(userId: string, schemas: SchemaMarkup[]): Promise<void> {
    const repo = await this.getRepository();
    const timestamp = Date.now();

    const items = schemas.map(schema => ({
      PK: `USER#${userId}`,
      SK: `AI_SCHEMA#${schema['@type']}#${timestamp}`,
      Data: schema,
      EntityType: 'SchemaMarkup',
      CreatedAt: timestamp,
      UpdatedAt: timestamp,
      TTL: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
    }));

    await repo.batchWrite(items);
  }

  async getSchemas(userId: string): Promise<SchemaMarkup[]> {
    const repo = await this.getRepository();
    const result = await repo.query(`USER#${userId}`, 'AI_SCHEMA#');
    
    return result.items
      .map((item: any) => item.Data as SchemaMarkup)
      .filter(Boolean);
  }

  async saveEntities(userId: string, entities: KnowledgeGraphEntity[]): Promise<void> {
    const repo = await this.getRepository();
    const timestamp = Date.now();

    const items = entities.map(entity => ({
      PK: `USER#${userId}`,
      SK: `AI_ENTITY#${entity['@type']}#${timestamp}`,
      Data: entity,
      EntityType: 'KnowledgeGraphEntity',
      CreatedAt: timestamp,
      UpdatedAt: timestamp,
      TTL: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year TTL
    }));

    await repo.batchWrite(items);
  }

  async getEntities(userId: string): Promise<KnowledgeGraphEntity[]> {
    const repo = await this.getRepository();
    const result = await repo.query(`USER#${userId}`, 'AI_ENTITY#');
    
    return result.items
      .map((item: any) => item.Data as KnowledgeGraphEntity)
      .filter(Boolean);
  }

  async saveExports(userId: string, exports: Record<ExportFormat, string>): Promise<void> {
    const repo = await this.getRepository();
    const timestamp = Date.now();

    await repo.put({
      PK: `USER#${userId}`,
      SK: 'AI_EXPORTS',
      Data: exports,
      EntityType: 'AIVisibilityExports',
      CreatedAt: timestamp,
      UpdatedAt: timestamp,
      TTL: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days TTL
    });
  }

  async getExports(userId: string): Promise<Record<ExportFormat, string>> {
    const repo = await this.getRepository();
    const result = await repo.get(`USER#${userId}`, 'AI_EXPORTS');

    if (result && typeof result === 'object' && 'Data' in result) {
      return result.Data as Record<ExportFormat, string>;
    }

    return {
      'json-ld': '',
      'rdf-xml': '',
      'turtle': '',
      'microdata': ''
    };
  }

  async saveRollbackData(changeId: string, data: RollbackData): Promise<void> {
    const repo = await this.getRepository();
    const timestamp = Date.now();

    await repo.put({
      PK: `ROLLBACK#${changeId}`,
      SK: 'DATA',
      Data: data,
      EntityType: 'RollbackData',
      CreatedAt: timestamp,
      UpdatedAt: timestamp,
      TTL: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days TTL
    });
  }

  async getRollbackData(changeId: string): Promise<RollbackData | null> {
    const repo = await this.getRepository();
    const result = await repo.get(`ROLLBACK#${changeId}`, 'DATA');

    if (result && typeof result === 'object' && 'Data' in result) {
      return result.Data as RollbackData;
    }

    return null;
  }

  async saveBatch(userId: string, data: {
    schemas?: SchemaMarkup[];
    entities?: KnowledgeGraphEntity[];
    exports?: Record<ExportFormat, string>;
  }): Promise<void> {
    const operations: Promise<void>[] = [];

    if (data.schemas) {
      operations.push(this.saveSchemas(userId, data.schemas));
    }

    if (data.entities) {
      operations.push(this.saveEntities(userId, data.entities));
    }

    if (data.exports) {
      operations.push(this.saveExports(userId, data.exports));
    }

    await Promise.all(operations);
  }
}

// Factory function following the existing codebase pattern
export function createAIVisibilityRepository(): AIVisibilityRepository {
  return new DynamoDBVisibilityRepository();
}