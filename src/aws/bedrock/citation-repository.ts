/**
 * Citation Repository
 * 
 * Handles DynamoDB storage and retrieval of citation records.
 * Provides methods for storing citations, tracking usage, and querying citation history.
 * 
 * Requirements: 10.4
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import { getCitationKeys } from '@/aws/dynamodb/keys';
import { Citation, CitationSourceType } from './citation-service';

/**
 * Citation record stored in DynamoDB
 */
export interface CitationRecord extends Citation {
  userId: string;
  usedInConversation?: string;
  usedInWorkflow?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Options for querying citations
 */
export interface CitationQueryOptions {
  limit?: number;
  conversationId?: string;
  sourceType?: CitationSourceType;
}

/**
 * Citation Repository class
 * Manages citation storage and retrieval in DynamoDB
 */
export class CitationRepository {
  private readonly repository: DynamoDBRepository;

  constructor(repository?: DynamoDBRepository) {
    this.repository = repository || new DynamoDBRepository();
  }

  /**
   * Stores a citation in DynamoDB
   * @param userId User ID
   * @param citation Citation to store
   * @param conversationId Optional conversation ID
   * @param workflowId Optional workflow ID
   * @returns The stored citation record
   */
  async storeCitation(
    userId: string,
    citation: Citation,
    conversationId?: string,
    workflowId?: string
  ): Promise<CitationRecord> {
    const keys = getCitationKeys(userId, citation.id);
    const now = new Date().toISOString();

    const record: CitationRecord = {
      ...citation,
      userId,
      usedInConversation: conversationId,
      usedInWorkflow: workflowId,
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.create(
      keys.PK,
      keys.SK,
      'Citation',
      record
    );

    return record;
  }

  /**
   * Retrieves a citation by ID
   * @param userId User ID
   * @param citationId Citation ID
   * @returns The citation record or null if not found
   */
  async getCitation(
    userId: string,
    citationId: string
  ): Promise<CitationRecord | null> {
    const keys = getCitationKeys(userId, citationId);
    return this.repository.get<CitationRecord>(keys.PK, keys.SK);
  }

  /**
   * Queries citations for a user
   * @param userId User ID
   * @param options Query options
   * @returns Array of citation records
   */
  async queryCitations(
    userId: string,
    options: CitationQueryOptions = {}
  ): Promise<CitationRecord[]> {
    const pk = `USER#${userId}`;
    const skPrefix = 'CITATION#';

    const result = await this.repository.query<CitationRecord>(
      pk,
      skPrefix,
      {
        limit: options.limit,
        scanIndexForward: false, // Most recent first
      }
    );

    let citations = result.items;

    // Filter by conversation ID if provided
    if (options.conversationId) {
      citations = citations.filter(
        (c) => c.usedInConversation === options.conversationId
      );
    }

    // Filter by source type if provided
    if (options.sourceType) {
      citations = citations.filter(
        (c) => c.sourceType === options.sourceType
      );
    }

    return citations;
  }

  /**
   * Gets citations for a specific conversation
   * @param userId User ID
   * @param conversationId Conversation ID
   * @returns Array of citation records
   */
  async getCitationsForConversation(
    userId: string,
    conversationId: string
  ): Promise<CitationRecord[]> {
    return this.queryCitations(userId, { conversationId });
  }

  /**
   * Updates a citation record
   * @param userId User ID
   * @param citationId Citation ID
   * @param updates Partial citation data to update
   */
  async updateCitation(
    userId: string,
    citationId: string,
    updates: Partial<CitationRecord>
  ): Promise<void> {
    const keys = getCitationKeys(userId, citationId);
    await this.repository.update(keys.PK, keys.SK, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Deletes a citation record
   * @param userId User ID
   * @param citationId Citation ID
   */
  async deleteCitation(userId: string, citationId: string): Promise<void> {
    const keys = getCitationKeys(userId, citationId);
    await this.repository.delete(keys.PK, keys.SK);
  }

  /**
   * Batch stores multiple citations
   * @param userId User ID
   * @param citations Array of citations to store
   * @param conversationId Optional conversation ID
   * @param workflowId Optional workflow ID
   * @returns Array of stored citation records
   */
  async batchStoreCitations(
    userId: string,
    citations: Citation[],
    conversationId?: string,
    workflowId?: string
  ): Promise<CitationRecord[]> {
    const records: CitationRecord[] = [];

    for (const citation of citations) {
      const record = await this.storeCitation(
        userId,
        citation,
        conversationId,
        workflowId
      );
      records.push(record);
    }

    return records;
  }

  /**
   * Gets citation statistics for a user
   * @param userId User ID
   * @returns Citation statistics
   */
  async getCitationStats(userId: string): Promise<{
    total: number;
    bySourceType: Record<CitationSourceType, number>;
    validated: number;
    unvalidated: number;
  }> {
    const citations = await this.queryCitations(userId);

    const stats = {
      total: citations.length,
      bySourceType: {
        'mls': 0,
        'market-report': 0,
        'data-api': 0,
        'web': 0,
      } as Record<CitationSourceType, number>,
      validated: 0,
      unvalidated: 0,
    };

    citations.forEach((citation) => {
      stats.bySourceType[citation.sourceType]++;
      if (citation.validated) {
        stats.validated++;
      } else {
        stats.unvalidated++;
      }
    });

    return stats;
  }
}

// Export singleton instance
let citationRepositoryInstance: CitationRepository | null = null;

/**
 * Gets the singleton citation repository instance
 */
export function getCitationRepository(): CitationRepository {
  if (!citationRepositoryInstance) {
    citationRepositoryInstance = new CitationRepository();
  }
  return citationRepositoryInstance;
}

/**
 * Resets the citation repository singleton
 * Useful for testing
 */
export function resetCitationRepository(): void {
  citationRepositoryInstance = null;
}
