'use server';

import { z } from 'zod';
import type { MediaAnalytics, MediaMention } from '../types/media-types';
import { mediaMonitoringService } from '../services/media-monitoring-service';
import { mediaMentionRepository } from '../repositories/media-mention-repository';
import { mediaAnalyticsService } from '../services/media-analytics-service';
import { getUserIdFromSession } from '@/aws/auth/server';

/**
 * Fetch fresh media mentions and save to database
 */
export async function syncMediaMentionsAction(
    query: string = 'real estate'
): Promise<{ success: boolean; count: number; error?: string }> {
    try {
        const userId = await getUserIdFromSession();
        if (!userId) {
            return { success: false, count: 0, error: 'Not authenticated' };
        }

        // Fetch last 7 days of news
        const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const mentions = await mediaMonitoringService.fetchMediaMentionsForUser(
            userId,
            query,
            from
        );

        // Save to database
        await mediaMentionRepository.saveBatch(mentions);

        return { success: true, count: mentions.length };
    } catch (error: any) {
        console.error('Failed to sync media mentions:', error);
        return {
            success: false,
            count: 0,
            error: error.message || 'Failed to sync mentions',
        };
    }
}

/**
 * Get media analytics for a user
 */
export async function getMediaAnalyticsAction(
    period: '24h' | '7d' | '30d' | '90d' = '7d'
): Promise<{
    success: boolean;
    data?: MediaAnalytics;
    error?: string;
}> {
    try {
        const userId = await getUserIdFromSession();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const analytics = await mediaAnalyticsService.generateAnalytics(userId, period);

        return { success: true, data: analytics };
    } catch (error: any) {
        console.error('Failed to get media analytics:', error);
        return {
            success: false,
            error: error.message || 'Failed to get analytics',
        };
    }
}

/**
 * Get recent media mentions
 */
export async function getRecentMentionsAction(
    limit: number = 10
): Promise<{
    success: boolean;
    data?: MediaMention[];
    error?: string;
}> {
    try {
        const userId = await getUserIdFromSession();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const mentions = await mediaMentionRepository.getRecent(userId, limit);

        return { success: true, data: mentions };
    } catch (error: any) {
        console.error('Failed to get recent mentions:', error);
        return {
            success: false,
            error: error.message || 'Failed to get mentions',
        };
    }
}

/**
 * Get mentions by time range
 */
export async function getMentionsByTimeRangeAction(
    startTime: number,
    endTime?: number
): Promise<{
    success: boolean;
    data?: MediaMention[];
    error?: string;
}> {
    try {
        const userId = await getUserIdFromSession();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        const mentions = await mediaMentionRepository.getByUserAndTimeRange(
            userId,
            startTime,
            endTime
        );

        return { success: true, data: mentions };
    } catch (error: any) {
        console.error('Failed to get mentions by time range:', error);
        return {
            success: false,
            error: error.message || 'Failed to get mentions',
        };
    }
}

/**
 * Delete a media mention
 */
export async function deleteMentionAction(
    mentionId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const userId = await getUserIdFromSession();
        if (!userId) {
            return { success: false, error: 'Not authenticated' };
        }

        await mediaMentionRepository.delete(userId, mentionId);

        return { success: true };
    } catch (error: any) {
        console.error('Failed to delete mention:', error);
        return {
            success: false,
            error: error.message || 'Failed to delete mention',
        };
    }
}

/**
 * Initialize media monitoring for a new user
 * Fetches initial set of media mentions
 */
export async function initializeMediaMonitoringAction(): Promise<{
    success: boolean;
    count: number;
    error?: string;
}> {
    try {
        const userId = await getUserIdFromSession();
        if (!userId) {
            return { success: false, count: 0, error: 'Not authenticated' };
        }

        // Fetch last 30 days of news
        const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const mentions = await mediaMonitoringService.fetchMediaMentionsForUser(
            userId,
            'real estate',
            from
        );

        // Save to database
        await mediaMentionRepository.saveBatch(mentions);

        return { success: true, count: mentions.length };
    } catch (error: any) {
        console.error('Failed to initialize media monitoring:', error);
        return {
            success: false,
            count: 0,
            error: error.message || 'Failed to initialize',
        };
    }
}
