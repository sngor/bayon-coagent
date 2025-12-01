/**
 * Keyword Suggestion System
 * 
 * Provides intelligent keyword suggestions during content creation.
 * Suggests relevant keywords from the user's saved list based on context.
 */

import { keywordRepository } from '@/aws/dynamodb/keyword-repository';
import type { SavedKeyword } from '@/lib/types/common';

export interface KeywordSuggestionOptions {
    location?: string;
    contentType?: 'blog-post' | 'market-update' | 'neighborhood-guide' | 'social-media';
    existingKeywords?: string[];
    limit?: number;
}

export interface KeywordSuggestionResult {
    suggestions: SavedKeyword[];
    relevanceScores: Map<string, number>;
}

/**
 * Gets keyword suggestions for content creation
 * @param userId User ID
 * @param options Suggestion options
 * @returns Keyword suggestions with relevance scores
 */
export async function getKeywordSuggestionsForContent(
    userId: string,
    options: KeywordSuggestionOptions = {}
): Promise<KeywordSuggestionResult> {
    const {
        location,
        contentType,
        existingKeywords = [],
        limit = 5,
    } = options;

    // Get base suggestions from repository
    let suggestions = await keywordRepository.getKeywordSuggestions(
        userId,
        location,
        limit * 2 // Get more than needed for filtering
    );

    // Filter out keywords that are already being used
    if (existingKeywords.length > 0) {
        const existingLower = existingKeywords.map(k => k.toLowerCase());
        suggestions = suggestions.filter(
            keyword => !existingLower.includes(keyword.keyword.toLowerCase())
        );
    }

    // Calculate relevance scores based on content type
    const relevanceScores = new Map<string, number>();

    for (const keyword of suggestions) {
        let score = 0;

        // Base score from search volume and competition
        score += keyword.searchVolume / 100;

        if (keyword.competition === 'low') {
            score += 50;
        } else if (keyword.competition === 'medium') {
            score += 25;
        }

        // Adjust score based on content type
        if (contentType) {
            score += calculateContentTypeRelevance(keyword.keyword, contentType);
        }

        relevanceScores.set(keyword.id, score);
    }

    // Sort by relevance score
    suggestions.sort((a, b) => {
        const scoreA = relevanceScores.get(a.id) || 0;
        const scoreB = relevanceScores.get(b.id) || 0;
        return scoreB - scoreA;
    });

    // Limit results
    suggestions = suggestions.slice(0, limit);

    return {
        suggestions,
        relevanceScores,
    };
}

/**
 * Calculates relevance score adjustment based on content type
 * @param keyword Keyword text
 * @param contentType Content type
 * @returns Score adjustment
 */
function calculateContentTypeRelevance(
    keyword: string,
    contentType: string
): number {
    const keywordLower = keyword.toLowerCase();
    let adjustment = 0;

    switch (contentType) {
        case 'blog-post':
            // Favor informational keywords
            if (keywordLower.includes('guide') ||
                keywordLower.includes('tips') ||
                keywordLower.includes('how to') ||
                keywordLower.includes('best')) {
                adjustment += 30;
            }
            break;

        case 'market-update':
            // Favor market-related keywords
            if (keywordLower.includes('market') ||
                keywordLower.includes('trends') ||
                keywordLower.includes('prices') ||
                keywordLower.includes('forecast')) {
                adjustment += 30;
            }
            break;

        case 'neighborhood-guide':
            // Favor location-specific keywords
            if (keywordLower.includes('neighborhood') ||
                keywordLower.includes('area') ||
                keywordLower.includes('community') ||
                keywordLower.includes('living in')) {
                adjustment += 30;
            }
            break;

        case 'social-media':
            // Favor shorter, more engaging keywords
            const wordCount = keyword.split(' ').length;
            if (wordCount <= 3) {
                adjustment += 20;
            }
            break;
    }

    return adjustment;
}

/**
 * Suggests keywords based on content text analysis
 * @param userId User ID
 * @param contentText Content text to analyze
 * @param limit Maximum number of suggestions
 * @returns Relevant keyword suggestions
 */
export async function suggestKeywordsFromContent(
    userId: string,
    contentText: string,
    limit: number = 5
): Promise<SavedKeyword[]> {
    // Get all saved keywords
    const allKeywords = await keywordRepository.querySavedKeywords(userId);

    if (allKeywords.length === 0) {
        return [];
    }

    const contentLower = contentText.toLowerCase();

    // Score keywords based on relevance to content
    const scoredKeywords = allKeywords.map(keyword => {
        let score = 0;

        // Check if keyword appears in content
        if (contentLower.includes(keyword.keyword.toLowerCase())) {
            score += 100; // High score for exact match
        }

        // Check if individual words from keyword appear in content
        const keywordWords = keyword.keyword.toLowerCase().split(' ');
        const matchingWords = keywordWords.filter(word =>
            contentLower.includes(word)
        );

        score += (matchingWords.length / keywordWords.length) * 50;

        // Factor in search volume and competition
        score += keyword.searchVolume / 100;

        if (keyword.competition === 'low') {
            score += 25;
        } else if (keyword.competition === 'medium') {
            score += 10;
        }

        return { keyword, score };
    });

    // Sort by score and return top results
    return scoredKeywords
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.keyword);
}

/**
 * Gets keyword suggestions for a specific location
 * @param userId User ID
 * @param location Location to get keywords for
 * @param limit Maximum number of suggestions
 * @returns Location-specific keyword suggestions
 */
export async function getLocationKeywords(
    userId: string,
    location: string,
    limit: number = 10
): Promise<SavedKeyword[]> {
    const keywords = await keywordRepository.querySavedKeywordsByLocation(
        userId,
        location
    );

    // Sort by search volume descending
    return keywords
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, limit);
}

/**
 * Gets opportunity keywords (low competition, decent volume)
 * @param userId User ID
 * @param minVolume Minimum search volume
 * @param limit Maximum number of suggestions
 * @returns Opportunity keyword suggestions
 */
export async function getOpportunityKeywords(
    userId: string,
    minVolume: number = 100,
    limit: number = 10
): Promise<SavedKeyword[]> {
    const allKeywords = await keywordRepository.querySavedKeywords(userId);

    return allKeywords
        .filter(keyword =>
            keyword.competition === 'low' &&
            keyword.searchVolume >= minVolume
        )
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, limit);
}
