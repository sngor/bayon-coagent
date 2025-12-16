/**
 * Training Service
 * Centralized service for training data management with caching
 */

import { cache } from 'react';
import { unstable_cache } from 'next/cache';

export interface TrainingProgress {
    userId: string;
    courseProgress: Record<string, number>;
    tutorialsWatched: string[];
    certificatesEarned: string[];
    lastActivity: string;
    totalLearningTime: number; // in minutes
}

export interface TrainingStats {
    coursesEnrolled: number;
    coursesCompleted: number;
    tutorialsWatched: number;
    certificatesEarned: number;
    averageScore: number;
    streakDays: number;
}

// Cache training data for 5 minutes with Next.js cache
export const getTrainingProgress = unstable_cache(
    async (userId: string): Promise<TrainingProgress | null> => {
        try {
            // In real implementation, this would fetch from DynamoDB
            // For now, return mock data
            return {
                userId,
                courseProgress: {
                    'real-estate-marketing-fundamentals': 75,
                    'social-media-for-real-estate': 100,
                },
                tutorialsWatched: ['getting-started-bayon', 'social-media-strategy'],
                certificatesEarned: ['social-media-certification'],
                lastActivity: new Date().toISOString(),
                totalLearningTime: 180, // 3 hours
            };
        } catch (error) {
            console.error('Error fetching training progress:', error);
            return null;
        }
    });

export const getTrainingStats = cache(async (userId: string): Promise<TrainingStats> => {
    try {
        const progress = await getTrainingProgress(userId);

        if (!progress) {
            return {
                coursesEnrolled: 0,
                coursesCompleted: 0,
                tutorialsWatched: 0,
                certificatesEarned: 0,
                averageScore: 0,
                streakDays: 0,
            };
        }

        const coursesEnrolled = Object.keys(progress.courseProgress).length;
        const coursesCompleted = Object.values(progress.courseProgress).filter(p => p === 100).length;
        const tutorialsWatched = progress.tutorialsWatched.length;
        const certificatesEarned = progress.certificatesEarned.length;

        // Calculate average score from completed courses
        const completedScores = Object.values(progress.courseProgress).filter(p => p === 100);
        const averageScore = completedScores.length > 0
            ? Math.round(completedScores.reduce((sum, score) => sum + score, 0) / completedScores.length)
            : 0;

        // Calculate streak (simplified - would need more sophisticated logic)
        const streakDays = 7; // Mock value

        return {
            coursesEnrolled,
            coursesCompleted,
            tutorialsWatched,
            certificatesEarned,
            averageScore,
            streakDays,
        };
    } catch (error) {
        console.error('Error calculating training stats:', error);
        return {
            coursesEnrolled: 0,
            coursesCompleted: 0,
            tutorialsWatched: 0,
            certificatesEarned: 0,
            averageScore: 0,
            streakDays: 0,
        };
    }
});

// Utility functions for training data
export function calculateCompletionPercentage(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
}

export function formatLearningTime(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
}

export function getNextRecommendation(progress: TrainingProgress): string | null {
    // Simple recommendation logic
    const completedCourses = Object.entries(progress.courseProgress)
        .filter(([_, progress]) => progress === 100)
        .map(([courseId]) => courseId);

    if (completedCourses.length === 0) {
        return 'Start with Real Estate Marketing Fundamentals';
    }

    if (!completedCourses.includes('social-media-for-real-estate')) {
        return 'Continue with Social Media for Real Estate';
    }

    return 'Explore Advanced Lead Generation Strategies';
}