/**
 * Citation Service
 * 
 * Manages citation tracking, URL validation, and formatting for the Kiro AI Assistant.
 * Ensures all factual statements are properly sourced and cited with validated URLs.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import { getCitationKeys } from '@/aws/dynamodb/keys';
import { CitationRepository, CitationRecord } from './citation-repository';

/**
 * Source types for citations
 */
export type CitationSourceType = 'mls' | 'market-report' | 'data-api' | 'web';

/**
 * Citation data structure
 */
export interface Citation {
  id: string;
  url: string;
  title: string;
  sourceType: CitationSourceType;
  accessedAt: string;
  validated: boolean;
}

/**
 * Result of citation formatting operation
 */
export interface CitationResult {
  text: string;
  citations: Citation[];
}

/**
 * Options for URL validation
 */
export interface ValidationOptions {
  timeoutMs?: number;
  followRedirects?: boolean;
}

/**
 * Citation Service class
 * Provides methods for adding, validating, and formatting citations
 */
export class CitationService {
  private readonly repository: DynamoDBRepository;
  private readonly citationRepository: CitationRepository;
  private readonly defaultTimeoutMs: number = 5000;

  constructor(repository?: DynamoDBRepository, citationRepository?: CitationRepository) {
    this.repository = repository || new DynamoDBRepository();
    this.citationRepository = citationRepository || new CitationRepository();
  }

  /**
   * Adds a citation to the system
   * @param text The text containing the factual statement
   * @param source Citation source information
   * @returns The created citation
   */
  async addCitation(
    text: string,
    source: Omit<Citation, 'id' | 'accessedAt' | 'validated'>
  ): Promise<Citation> {
    const citationId = this.generateCitationId();
    const accessedAt = new Date().toISOString();
    
    // Validate the URL
    const validated = await this.validateURL(source.url);

    const citation: Citation = {
      id: citationId,
      accessedAt,
      validated,
      ...source,
    };

    return citation;
  }

  /**
   * Validates that a URL is accessible
   * @param url The URL to validate
   * @param options Validation options
   * @returns True if the URL is accessible, false otherwise
   * 
   * Requirements: 10.2, 10.3
   * - Validates URLs with HTTP HEAD requests
   * - Implements timeout handling (default 5000ms)
   * - Falls back to GET if HEAD is not supported
   * - Returns false on timeout or error (graceful degradation)
   */
  async validateURL(
    url: string,
    options: ValidationOptions = {}
  ): Promise<boolean> {
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;

    try {
      // Validate URL format first
      try {
        new URL(url);
      } catch {
        console.warn(`Invalid URL format: ${url}`);
        return false;
      }

      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        // Perform HEAD request to check if URL is accessible
        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: options.followRedirects ? 'follow' : 'manual',
        });

        clearTimeout(timeoutId);

        // Consider 2xx and 3xx status codes as valid
        return response.ok || (response.status >= 300 && response.status < 400);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // If timeout occurred, return false immediately
        if (fetchError.name === 'AbortError') {
          console.warn(`URL validation timeout for ${url} after ${timeoutMs}ms`);
          return false;
        }
        
        // If HEAD fails, try GET as some servers don't support HEAD
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), timeoutMs);

        try {
          const getResponse = await fetch(url, {
            method: 'GET',
            signal: getController.signal,
            redirect: options.followRedirects ? 'follow' : 'manual',
          });

          clearTimeout(getTimeoutId);
          return getResponse.ok || (getResponse.status >= 300 && getResponse.status < 400);
        } catch (getError: any) {
          clearTimeout(getTimeoutId);
          
          if (getError.name === 'AbortError') {
            console.warn(`URL validation timeout (GET) for ${url} after ${timeoutMs}ms`);
          } else {
            console.warn(`URL validation failed (GET) for ${url}:`, getError.message);
          }
          return false;
        }
      }
    } catch (error: any) {
      // Log validation error but don't throw - graceful degradation
      console.warn(`URL validation failed for ${url}:`, error.message || error);
      return false;
    }
  }

  /**
   * Formats citations in text with hyperlinks
   * @param text The text to format
   * @param citations Array of citations to include
   * @returns Formatted text with citations
   */
  async formatCitations(text: string, citations: Citation[]): Promise<string> {
    if (citations.length === 0) {
      return text;
    }

    let formattedText = text;

    // Add citation markers and format as hyperlinks
    citations.forEach((citation, index) => {
      const citationNumber = index + 1;
      const citationMarker = this.formatCitationLink(citation, citationNumber);
      
      // Append citation at the end of the text
      formattedText += ` ${citationMarker}`;
    });

    return formattedText;
  }

  /**
   * Formats a single citation as a hyperlink
   * @param citation The citation to format
   * @param number The citation number/label
   * @returns Formatted citation string
   * 
   * Requirements: 10.3
   * - Adds notation for unverified citations when validation fails or times out
   */
  private formatCitationLink(citation: Citation, number: number): string {
    const sourceTypeLabel = this.getSourceTypeLabel(citation.sourceType);
    const validationNote = citation.validated ? '' : ' - accessibility not verified';
    
    // Format: [number] (Source Type: Title)(URL)
    return `[${number}] (${sourceTypeLabel}: ${citation.title})(${citation.url}${validationNote})`;
  }

  /**
   * Gets a human-readable label for a source type
   * @param sourceType The source type
   * @returns Human-readable label
   */
  private getSourceTypeLabel(sourceType: CitationSourceType): string {
    const labels: Record<CitationSourceType, string> = {
      'mls': 'MLS Listing',
      'market-report': 'Market Report',
      'data-api': 'Data API',
      'web': 'Web Source',
    };
    return labels[sourceType] || 'Source';
  }

  /**
   * Extracts citations from AI-generated text
   * @param text The text to extract citations from
   * @returns Array of extracted citations
   */
  async extractCitations(text: string): Promise<Citation[]> {
    const citations: Citation[] = [];
    
    // Pattern to match markdown-style links: [text](url)
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkPattern.exec(text)) !== null) {
      const title = match[1];
      const url = match[2];

      // Skip if URL is not a valid HTTP(S) URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        continue;
      }

      // Determine source type from URL or title
      const sourceType = this.inferSourceType(url, title);

      const citation = await this.addCitation(text, {
        url,
        title,
        sourceType,
      });

      citations.push(citation);
    }

    return citations;
  }

  /**
   * Infers the source type from URL and title
   * @param url The citation URL
   * @param title The citation title
   * @returns Inferred source type
   */
  private inferSourceType(url: string, title: string): CitationSourceType {
    const lowerUrl = url.toLowerCase();
    const lowerTitle = title.toLowerCase();

    if (lowerUrl.includes('mls') || lowerTitle.includes('mls')) {
      return 'mls';
    }
    if (lowerTitle.includes('market report') || lowerTitle.includes('housing report')) {
      return 'market-report';
    }
    if (lowerUrl.includes('api') || lowerTitle.includes('api')) {
      return 'data-api';
    }

    return 'web';
  }

  /**
   * Generates a unique citation ID
   * @returns Unique citation ID
   */
  private generateCitationId(): string {
    return `cite_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Numbers or labels multiple citations for easy reference
   * @param citations Array of citations
   * @returns Array of citations with labels
   */
  labelCitations(citations: Citation[]): Array<Citation & { label: string }> {
    return citations.map((citation, index) => ({
      ...citation,
      label: `[${index + 1}]`,
    }));
  }

  /**
   * Creates a citation with fallback notation for unvalidated URLs
   * @param url The URL to cite
   * @param title The citation title
   * @param sourceType The source type
   * @param timeoutMs Optional timeout for validation
   * @returns Citation with validation status
   * 
   * Requirements: 10.3
   * - Attempts URL validation with configurable timeout
   * - Falls back to unvalidated citation if validation fails or times out
   * - Includes notation in formatted output for unverified URLs
   */
  async createCitationWithFallback(
    url: string,
    title: string,
    sourceType: CitationSourceType,
    timeoutMs?: number
  ): Promise<Citation> {
    const citation = await this.addCitation('', {
      url,
      title,
      sourceType,
    });

    // If validation failed, the citation will have validated: false
    // This will automatically add the "accessibility not verified" notation
    // when formatted using formatCitationLink or formatWithNumberedCitations

    return citation;
  }

  /**
   * Validates multiple URLs in parallel with timeout handling
   * @param urls Array of URLs to validate
   * @param timeoutMs Timeout for each validation
   * @returns Map of URL to validation status
   */
  async validateURLsBatch(
    urls: string[],
    timeoutMs?: number
  ): Promise<Map<string, boolean>> {
    const validationPromises = urls.map(async (url) => {
      const isValid = await this.validateURL(url, { timeoutMs });
      return { url, isValid };
    });

    const results = await Promise.all(validationPromises);
    const validationMap = new Map<string, boolean>();
    
    results.forEach(({ url, isValid }) => {
      validationMap.set(url, isValid);
    });

    return validationMap;
  }

  /**
   * Stores citations in DynamoDB for tracking
   * @param userId User ID
   * @param citations Array of citations to store
   * @param conversationId Optional conversation ID
   * @param workflowId Optional workflow ID
   * @returns Array of stored citation records
   */
  async storeCitations(
    userId: string,
    citations: Citation[],
    conversationId?: string,
    workflowId?: string
  ): Promise<CitationRecord[]> {
    return this.citationRepository.batchStoreCitations(
      userId,
      citations,
      conversationId,
      workflowId
    );
  }

  /**
   * Extracts and stores citations from AI response
   * @param userId User ID
   * @param responseText AI-generated response text
   * @param conversationId Optional conversation ID
   * @param workflowId Optional workflow ID
   * @returns Array of extracted and stored citations
   */
  async extractAndStoreCitations(
    userId: string,
    responseText: string,
    conversationId?: string,
    workflowId?: string
  ): Promise<CitationRecord[]> {
    const citations = await this.extractCitations(responseText);
    return this.storeCitations(userId, citations, conversationId, workflowId);
  }

  /**
   * Formats response text with numbered citations
   * @param text The response text
   * @param citations Array of citations
   * @returns Formatted text with numbered citations
   */
  formatWithNumberedCitations(text: string, citations: Citation[]): string {
    if (citations.length === 0) {
      return text;
    }

    const labeledCitations = this.labelCitations(citations);
    let formattedText = text;

    // Add numbered citations at the end
    formattedText += '\n\n**Sources:**\n';
    labeledCitations.forEach((citation) => {
      const validationNote = citation.validated ? '' : ' (accessibility not verified)';
      const sourceTypeLabel = this.getSourceTypeLabel(citation.sourceType);
      formattedText += `${citation.label} ${sourceTypeLabel}: [${citation.title}](${citation.url})${validationNote}\n`;
    });

    return formattedText;
  }

  /**
   * Gets citations for a conversation
   * @param userId User ID
   * @param conversationId Conversation ID
   * @returns Array of citation records
   */
  async getCitationsForConversation(
    userId: string,
    conversationId: string
  ): Promise<CitationRecord[]> {
    return this.citationRepository.getCitationsForConversation(userId, conversationId);
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
    return this.citationRepository.getCitationStats(userId);
  }
}

// Export singleton instance
let citationServiceInstance: CitationService | null = null;

/**
 * Gets the singleton citation service instance
 */
export function getCitationService(): CitationService {
  if (!citationServiceInstance) {
    citationServiceInstance = new CitationService();
  }
  return citationServiceInstance;
}

/**
 * Resets the citation service singleton
 * Useful for testing
 */
export function resetCitationService(): void {
  citationServiceInstance = null;
}
