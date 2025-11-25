/**
 * Web Search Client Module
 * 
 * This module provides a client for web search functionality to replace
 * Google Search tool that was available in Genkit. Uses Tavily API for
 * AI-optimized search results.
 * 
 * Alternative APIs supported:
 * - Tavily (recommended for AI applications)
 * - Serper (Google Search API alternative)
 */

import { z } from 'zod';

/**
 * Search result from web search API
 */
export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  publishedDate?: string;
}

/**
 * Search response containing results and metadata
 */
export interface SearchResponse {
  query: string;
  results: SearchResult[];
  answer?: string; // AI-generated answer from Tavily
  images?: string[];
  followUpQuestions?: string[];
}

/**
 * Options for search requests
 */
export interface SearchOptions {
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
  includeAnswer?: boolean;
  includeImages?: boolean;
  includeDomains?: string[];
  excludeDomains?: string[];
}

/**
 * Error thrown when search API calls fail
 */
export class SearchError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'SearchError';
  }
}

/**
 * Web search client supporting multiple providers
 */
export class SearchClient {
  private apiKey: string;
  private provider: 'tavily' | 'serper';
  private baseUrl: string;

  constructor(provider: 'tavily' | 'serper' = 'tavily', apiKey?: string) {
    this.provider = provider;
    this.apiKey = apiKey || this.getApiKeyFromEnv();
    this.baseUrl = this.getBaseUrl();
  }

  /**
   * Gets API key from environment variables
   */
  private getApiKeyFromEnv(): string {
    const key = this.provider === 'tavily'
      ? process.env.TAVILY_API_KEY
      : process.env.SERPER_API_KEY;

    if (!key) {
      throw new SearchError(
        `Missing API key for ${this.provider}. Set ${this.provider === 'tavily' ? 'TAVILY_API_KEY' : 'SERPER_API_KEY'} environment variable.`
      );
    }

    return key;
  }

  /**
   * Gets base URL for the provider
   */
  private getBaseUrl(): string {
    return this.provider === 'tavily'
      ? 'https://api.tavily.com'
      : 'https://google.serper.dev';
  }

  /**
   * Performs a web search
   * 
   * @param query - The search query
   * @param options - Optional search configuration
   * @returns Search results with metadata
   */
  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    if (this.provider === 'tavily') {
      return this.searchTavily(query, options);
    } else {
      return this.searchSerper(query, options);
    }
  }

  /**
   * Searches using Tavily API
   */
  private async searchTavily(
    query: string,
    options: SearchOptions
  ): Promise<SearchResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const requestBody = {
        api_key: this.apiKey,
        query,
        search_depth: options.searchDepth || 'basic',
        max_results: options.maxResults || 5,
        include_answer: options.includeAnswer ?? false,
        include_images: options.includeImages ?? false,
        include_domains: options.includeDomains || [],
        exclude_domains: options.excludeDomains || [],
      };

      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new SearchError(
          `Tavily API error: ${errorText}`,
          'TAVILY_ERROR',
          response.status
        );
      }

      const data = await response.json();

      return {
        query,
        results: (data.results || []).map((r: any) => ({
          title: r.title,
          url: r.url,
          content: r.content,
          score: r.score,
          publishedDate: r.published_date,
        })),
        answer: data.answer,
        images: data.images || [],
        followUpQuestions: data.follow_up_questions || [],
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof SearchError) {
        throw error;
      }

      // Handle abort/timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw new SearchError(
          'Search request timed out after 30 seconds',
          'TIMEOUT',
          408
        );
      }

      // Handle connection reset errors
      if (error instanceof Error && (error.message.includes('ECONNRESET') || error.message.includes('aborted'))) {
        throw new SearchError(
          'Search connection was reset. Please try again.',
          'CONNECTION_RESET',
          503
        );
      }

      throw new SearchError(
        `Failed to search with Tavily: ${error instanceof Error ? error.message : String(error)}`,
        'SEARCH_FAILED',
        undefined,
        error
      );
    }
  }

  /**
   * Searches using Serper API
   */
  private async searchSerper(
    query: string,
    options: SearchOptions
  ): Promise<SearchResponse> {
    try {
      const requestBody = {
        q: query,
        num: options.maxResults || 5,
      };

      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new SearchError(
          `Serper API error: ${errorText}`,
          'SERPER_ERROR',
          response.status
        );
      }

      const data = await response.json();

      return {
        query,
        results: (data.organic || []).map((r: any) => ({
          title: r.title,
          url: r.link,
          content: r.snippet,
        })),
        answer: data.answerBox?.answer,
        images: (data.images || []).map((img: any) => img.imageUrl),
      };
    } catch (error) {
      if (error instanceof SearchError) {
        throw error;
      }

      throw new SearchError(
        `Failed to search with Serper: ${error instanceof Error ? error.message : String(error)}`,
        'SEARCH_FAILED',
        undefined,
        error
      );
    }
  }

  /**
   * Formats search results as a text summary for AI consumption
   * 
   * @param results - Search results to format
   * @param includeCitations - Whether to include source URLs
   * @returns Formatted text summary
   */
  formatResultsForAI(
    results: SearchResult[],
    includeCitations: boolean = true
  ): string {
    if (results.length === 0) {
      return 'No search results found.';
    }

    const formatted = results.map((result, index) => {
      const citation = includeCitations ? ` [${index + 1}]` : '';
      return `${result.title}${citation}\n${result.content}${includeCitations ? `\nSource: ${result.url}` : ''}`;
    });

    return formatted.join('\n\n---\n\n');
  }

  /**
   * Extracts citations from search results
   * 
   * @param results - Search results
   * @returns Array of citation strings
   */
  extractCitations(results: SearchResult[]): string[] {
    return results.map((result, index) =>
      `[${index + 1}] ${result.title} - ${result.url}`
    );
  }
}

/**
 * Creates a singleton search client instance
 */
let searchClientInstance: SearchClient | null = null;

/**
 * Gets the singleton search client instance
 * 
 * @param provider - Search provider to use (default: tavily)
 * @param apiKey - Optional API key (uses env var if not provided)
 * @returns Search client instance
 */
export function getSearchClient(
  provider: 'tavily' | 'serper' = 'tavily',
  apiKey?: string
): SearchClient {
  if (!searchClientInstance || apiKey) {
    searchClientInstance = new SearchClient(provider, apiKey);
  }
  return searchClientInstance;
}

/**
 * Resets the singleton instance (useful for testing)
 */
export function resetSearchClient(): void {
  searchClientInstance = null;
}

/**
 * Convenience function to perform a search
 */
export async function search(
  query: string,
  options?: SearchOptions
): Promise<SearchResponse> {
  const client = getSearchClient();
  return client.search(query, options);
}
