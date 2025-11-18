/**
 * Web Search Module
 * 
 * Exports search client and utilities for web search functionality
 */

export {
  SearchClient,
  getSearchClient,
  resetSearchClient,
  search,
  SearchError,
  type SearchResult,
  type SearchResponse,
  type SearchOptions,
} from './client';
