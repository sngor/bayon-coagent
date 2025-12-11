/**
 * AEO (Answer Engine Optimization) Repository
 * 
 * Provides CRUD operations for AEO-related data in DynamoDB
 */

import { getRepository } from './repository';
import {
    getAEOScoreKeys,
    getAEOMentionKeys,
    getAEORecommendationKeys,
    getAEOAnalysisKeys,
    getAEOCompetitorScoreKeys,
} from './index';
import type {
    AEOScore,
    AEOMention,
    AEORecommendation,
    AEOAnalysisResult,
    AEOCompetitorScore,
    AEOHistoryEntry,
} from '@/lib/types/aeo-types';

const repository = getRepository();

// ==================== AEO Score Operations ====================

/**
 * Save AEO score
 */
export async function saveAEOScore(score: AEOScore): Promise<void> {
    const keys = getAEOScoreKeys(score.userId, score.timestamp, true);
    await repository.put({
        ...keys,
        Data: score,
        EntityType: 'AEOScore',
    });
}

/**
 * Get latest AEO score for a user
 */
export async function getLatestAEOScore(userId: string): Promise<AEOScore | null> {
    const result = await repository.query({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': `USER#${userId}`,
            ':sk': 'AEO#SCORE#',
        },
        ScanIndexForward: false, // Descending order (latest first)
        Limit: 1,
    });

    if (result.items.length === 0) {
        return null;
    }

    return result.items[0].Data as AEOScore;
}

/**
 * Get AEO score history for a user
 */
export async function getAEOScoreHistory(
    userId: string,
    limit: number = 10
): Promise<AEOHistoryEntry[]> {
    const result = await repository.query({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': `USER#${userId}`,
            ':sk': 'AEO#SCORE#',
        },
        ScanIndexForward: false, // Descending order (latest first)
        Limit: limit,
    });

    return result.items.map((item) => {
        const score = item.Data as AEOScore;
        return {
            timestamp: score.timestamp,
            score: score.score,
            change: score.previousScore ? score.score - score.previousScore : 0,
        };
    });
}

// ==================== AEO Mention Operations ====================

/**
 * Save AEO mention
 */
export async function saveAEOMention(mention: AEOMention): Promise<void> {
    const keys = getAEOMentionKeys(mention.userId, mention.id, mention.source, mention.timestamp);
    await repository.put({
        ...keys,
        Data: mention,
        EntityType: 'AEOMention',
    });
}

/**
 * Get AEO mentions for a user
 */
export async function getAEOMentions(
    userId: string,
    limit: number = 20
): Promise<AEOMention[]> {
    const result = await repository.query({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': `USER#${userId}`,
            ':sk': 'AEO#MENTION#',
        },
        ScanIndexForward: false, // Descending order (latest first)
        Limit: limit,
    });

    return result.items.map((item) => item.Data as AEOMention);
}

/**
 * Get AEO mentions by source
 */
export async function getAEOMentionsBySource(
    userId: string,
    source: string,
    limit: number = 20
): Promise<AEOMention[]> {
    const result = await repository.query({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :gsi1pk',
        ExpressionAttributeValues: {
            ':gsi1pk': `AEO#MENTION#${source}`,
        },
        ScanIndexForward: false,
        Limit: limit,
    });

    // Filter by userId since GSI doesn't include it in the key
    return result.items
        .map((item) => item.Data as AEOMention)
        .filter((mention) => mention.userId === userId);
}

// ==================== AEO Recommendation Operations ====================

/**
 * Save AEO recommendation
 */
export async function saveAEORecommendation(recommendation: AEORecommendation): Promise<void> {
    const keys = getAEORecommendationKeys(recommendation.userId, recommendation.id);
    await repository.put({
        ...keys,
        Data: recommendation,
        EntityType: 'AEORecommendation',
    });
}

/**
 * Save multiple AEO recommendations
 */
export async function saveAEORecommendations(recommendations: AEORecommendation[]): Promise<void> {
    const items = recommendations.map((rec) => ({
        ...getAEORecommendationKeys(rec.userId, rec.id),
        Data: rec,
        EntityType: 'AEORecommendation',
    }));

    await repository.batchPut(items);
}

/**
 * Get AEO recommendations for a user
 */
export async function getAEORecommendations(userId: string): Promise<AEORecommendation[]> {
    const result = await repository.query({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': `USER#${userId}`,
            ':sk': 'AEO#RECOMMENDATION#',
        },
    });

    return result.items.map((item) => item.Data as AEORecommendation);
}

/**
 * Update AEO recommendation status
 */
export async function updateAEORecommendationStatus(
    userId: string,
    recommendationId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'dismissed'
): Promise<void> {
    const keys = getAEORecommendationKeys(userId, recommendationId);
    await repository.update({
        ...keys,
        UpdateExpression: 'SET #data.#status = :status, #data.#updatedAt = :updatedAt',
        ExpressionAttributeNames: {
            '#data': 'Data',
            '#status': 'status',
            '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
            ':status': status,
            ':updatedAt': new Date().toISOString(),
        },
    });
}

// ==================== AEO Analysis Operations ====================

/**
 * Save complete AEO analysis result
 */
export async function saveAEOAnalysis(
    userId: string,
    analysisId: string,
    result: AEOAnalysisResult
): Promise<void> {
    // Save the score
    await saveAEOScore(result.score);

    // Save all recommendations
    if (result.recommendations.length > 0) {
        await saveAEORecommendations(result.recommendations);
    }

    // Save the complete analysis for reference
    const keys = getAEOAnalysisKeys(userId, analysisId);
    await repository.put({
        ...keys,
        Data: result,
        EntityType: 'AEOAnalysis',
    });
}

/**
 * Get AEO analysis by ID
 */
export async function getAEOAnalysis(
    userId: string,
    analysisId: string
): Promise<AEOAnalysisResult | null> {
    const keys = getAEOAnalysisKeys(userId, analysisId);
    return await repository.get<AEOAnalysisResult>(keys.PK, keys.SK);
}

// ==================== AEO Competitor Operations ====================

/**
 * Save competitor AEO score
 */
export async function saveAEOCompetitorScore(
    userId: string,
    competitorScore: AEOCompetitorScore,
    timestamp: string
): Promise<void> {
    const keys = getAEOCompetitorScoreKeys(userId, competitorScore.competitorId, timestamp);
    await repository.put({
        ...keys,
        Data: competitorScore,
        EntityType: 'AEOCompetitorScore',
    });
}

/**
 * Get competitor AEO scores
 */
export async function getAEOCompetitorScores(
    userId: string,
    competitorId?: string
): Promise<AEOCompetitorScore[]> {
    const sk = competitorId ? `AEO#COMPETITOR#${competitorId}#` : 'AEO#COMPETITOR#';

    const result = await repository.query({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': `USER#${userId}`,
            ':sk': sk,
        },
        ScanIndexForward: false, // Latest first
    });

    return result.items.map((item) => item.Data as AEOCompetitorScore);
}

// ==================== Helper Functions ====================

/**
 * Calculate AEO score trend
 */
export async function calculateAEOTrend(
    userId: string
): Promise<'up' | 'down' | 'stable'> {
    const history = await getAEOScoreHistory(userId, 2);

    if (history.length < 2) {
        return 'stable';
    }

    const [latest, previous] = history;
    const diff = latest.score - previous.score;

    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'stable';
}

/**
 * Get AEO statistics for a user
 */
export async function getAEOStatistics(userId: string): Promise<{
    currentScore: number | null;
    trend: 'up' | 'down' | 'stable';
    totalMentions: number;
    pendingRecommendations: number;
    completedRecommendations: number;
}> {
    const [latestScore, mentions, recommendations] = await Promise.all([
        getLatestAEOScore(userId),
        getAEOMentions(userId, 100),
        getAEORecommendations(userId),
    ]);

    const trend = await calculateAEOTrend(userId);

    return {
        currentScore: latestScore?.score ?? null,
        trend,
        totalMentions: mentions.length,
        pendingRecommendations: recommendations.filter((r) => r.status === 'pending').length,
        completedRecommendations: recommendations.filter((r) => r.status === 'completed').length,
    };
}
