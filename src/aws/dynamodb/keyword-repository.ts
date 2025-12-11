/**
 * Keyword Repository
 * 
 * Provides CRUD operations for saved keyword entities.
 * Manages keyword suggestions and saved keywords for SEO targeting.
 */

import { DynamoDBRepository } from './repository';
import { getSavedKeywordKeys } from './index';
import type { SavedKeyword } from '@/lib/types/common';

export class KeywordRepository {
    private repository: DynamoDBRepository;

    constructor() {
        this.repository = new DynamoDBRepository();
    }

    /**
     * Creates a new saved keyword
     * @param userId User ID
     * @param keywordData Keyword data
     * @returns Created saved keyword
     */
    async createSavedKeyword(
        userId: string,
        keywordData: Omit<SavedKeyword, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    ): Promise<SavedKeyword> {
        const keywordId = `${keywordData.keyword.replace(/\s+/g, '_')}_${Date.now()}`;
        const keys = getSavedKeywordKeys(userId, keywordId);

        const keyword: SavedKeyword = {
            id: keywordId,
            userId,
            ...keywordData,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        await this.repository.create(
            keys.PK,
            keys.SK,
            'SavedKeyword',
            keyword
        );

        return keyword;
    }

    /**
     * Gets a saved keyword by ID
     * @param userId User ID
     * @param keywordId Keyword ID
     * @returns Saved keyword or null if not found
     */
    async getSavedKeyword(
        userId: string,
        keywordId: string
    ): Promise<SavedKeyword | null> {
        const keys = getSavedKeywordKeys(userId, keywordId);
        return this.repository.get<SavedKeyword>(keys.PK, keys.SK);
    }

    /**
     * Queries all saved keywords for a user
     * @param userId User ID
     * @param limit Maximum number of results
     * @returns Array of saved keywords
     */
    async querySavedKeywords(
        userId: string,
        limit?: number
    ): Promise<SavedKeyword[]> {
        const pk = `USER#${userId}`;
        const skPrefix = 'KEYWORD#';

        const result = await this.repository.query<SavedKeyword>(
            pk,
            skPrefix,
            {
                limit,
                scanIndexForward: false, // Most recent first
            }
        );

        return result.items;
    }

    /**
     * Queries saved keywords by location
     * @param userId User ID
     * @param location Location to filter by
     * @returns Array of saved keywords for the location
     */
    async querySavedKeywordsByLocation(
        userId: string,
        location: string
    ): Promise<SavedKeyword[]> {
        const allKeywords = await this.querySavedKeywords(userId);

        // Filter by location (case-insensitive)
        const locationLower = location.toLowerCase();
        return allKeywords.filter(
            keyword => keyword.location.toLowerCase() === locationLower
        );
    }

    /**
     * Queries saved keywords by competition level
     * @param userId User ID
     * @param competition Competition level to filter by
     * @returns Array of saved keywords with the specified competition level
     */
    async querySavedKeywordsByCompetition(
        userId: string,
        competition: 'low' | 'medium' | 'high'
    ): Promise<SavedKeyword[]> {
        const allKeywords = await this.querySavedKeywords(userId);

        // Filter by competition level
        return allKeywords.filter(
            keyword => keyword.competition === competition
        );
    }

    /**
     * Searches saved keywords by keyword text
     * @param userId User ID
     * @param searchTerm Search term to match against keyword text
     * @returns Array of saved keywords matching the search term
     */
    async searchSavedKeywords(
        userId: string,
        searchTerm: string
    ): Promise<SavedKeyword[]> {
        const allKeywords = await this.querySavedKeywords(userId);

        // Search by keyword text (case-insensitive)
        const searchLower = searchTerm.toLowerCase();
        return allKeywords.filter(
            keyword => keyword.keyword.toLowerCase().includes(searchLower)
        );
    }

    /**
     * Checks if a keyword already exists for a user
     * @param userId User ID
     * @param keywordText Keyword text to check
     * @returns True if keyword exists, false otherwise
     */
    async keywordExists(
        userId: string,
        keywordText: string
    ): Promise<boolean> {
        const allKeywords = await this.querySavedKeywords(userId);

        // Check if keyword exists (case-insensitive)
        const keywordLower = keywordText.toLowerCase();
        return allKeywords.some(
            keyword => keyword.keyword.toLowerCase() === keywordLower
        );
    }

    /**
     * Updates a saved keyword
     * @param userId User ID
     * @param keywordId Keyword ID
     * @param updates Partial keyword data to update
     */
    async updateSavedKeyword(
        userId: string,
        keywordId: string,
        updates: Partial<Omit<SavedKeyword, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
    ): Promise<void> {
        const keys = getSavedKeywordKeys(userId, keywordId);
        await this.repository.update(keys.PK, keys.SK, updates);
    }

    /**
     * Deletes a saved keyword
     * @param userId User ID
     * @param keywordId Keyword ID
     */
    async deleteSavedKeyword(
        userId: string,
        keywordId: string
    ): Promise<void> {
        const keys = getSavedKeywordKeys(userId, keywordId);
        await this.repository.delete(keys.PK, keys.SK);
    }

    /**
     * Gets high-volume keywords (search volume >= 1000)
     * @param userId User ID
     * @param limit Maximum number of results
     * @returns Array of high-volume keywords
     */
    async getHighVolumeKeywords(
        userId: string,
        limit: number = 10
    ): Promise<SavedKeyword[]> {
        const allKeywords = await this.querySavedKeywords(userId);

        return allKeywords
            .filter(keyword => keyword.searchVolume >= 1000)
            .sort((a, b) => b.searchVolume - a.searchVolume)
            .slice(0, limit);
    }

    /**
     * Gets low-competition keywords
     * @param userId User ID
     * @param limit Maximum number of results
     * @returns Array of low-competition keywords
     */
    async getLowCompetitionKeywords(
        userId: string,
        limit: number = 10
    ): Promise<SavedKeyword[]> {
        const allKeywords = await this.querySavedKeywords(userId);

        return allKeywords
            .filter(keyword => keyword.competition === 'low')
            .sort((a, b) => b.searchVolume - a.searchVolume)
            .slice(0, limit);
    }

    /**
     * Gets keyword suggestions for content creation
     * Prioritizes keywords with good balance of volume and competition
     * @param userId User ID
     * @param location Optional location filter
     * @param limit Maximum number of results
     * @returns Array of suggested keywords
     */
    async getKeywordSuggestions(
        userId: string,
        location?: string,
        limit: number = 5
    ): Promise<SavedKeyword[]> {
        let keywords = await this.querySavedKeywords(userId);

        // Filter by location if provided
        if (location) {
            const locationLower = location.toLowerCase();
            keywords = keywords.filter(
                keyword => keyword.location.toLowerCase() === locationLower
            );
        }

        // Score keywords based on volume and competition
        // Low competition is better, higher volume is better
        const scoredKeywords = keywords.map(keyword => {
            let score = keyword.searchVolume;

            // Adjust score based on competition
            if (keyword.competition === 'low') {
                score *= 1.5; // Boost low competition
            } else if (keyword.competition === 'high') {
                score *= 0.5; // Penalize high competition
            }

            return { keyword, score };
        });

        // Sort by score descending and return top results
        return scoredKeywords
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.keyword);
    }
}

// Export singleton instance
export const keywordRepository = new KeywordRepository();
