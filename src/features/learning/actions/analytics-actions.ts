'use server';

import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getUserCourseProgress } from './course-actions';
import { getUserTutorialProgress } from './tutorial-actions';
import { getUserCertificates } from './certificate-actions';

/**
 * Get learning analytics for user
 */
export async function getLearningAnalytics(): Promise<{
    success: boolean;
    analytics?: {
        coursesEnrolled: number;
        coursesCompleted: number;
        tutorialsWatched: number;
        certificatesEarned: number;
        totalLearningTime: number; // in minutes
        streakDays: number;
        lastActivity: string;
    };
    error?: string;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const [courseProgress, tutorialProgress, certificates] = await Promise.all([
            getUserCourseProgress(100),
            getUserTutorialProgress(100),
            getUserCertificates(100),
        ]);

        if (!courseProgress.success || !tutorialProgress.success || !certificates.success) {
            return { success: false, error: 'Failed to fetch learning data' };
        }

        const coursesEnrolled = courseProgress.progress?.length || 0;
        const coursesCompleted = courseProgress.progress?.filter(p => p.completedAt).length || 0;
        const tutorialsWatched = tutorialProgress.progress?.filter(p => p.isWatched).length || 0;
        const certificatesEarned = certificates.certificates?.length || 0;

        // Calculate total learning time (simplified)
        const totalLearningTime = tutorialProgress.progress?.reduce((total, p) => total + (p.watchTime / 60), 0) || 0;

        // Calculate streak (simplified - would need more sophisticated logic)
        const streakDays = 7; // Mock value

        // Get last activity
        const allActivities = [
            ...(courseProgress.progress?.map(p => p.lastAccessedAt) || []),
            ...(tutorialProgress.progress?.map(p => p.watchedAt).filter(Boolean) || []),
        ];
        const lastActivity: string = allActivities.length > 0
            ? allActivities.sort().reverse()[0]!
            : new Date().toISOString();

        return {
            success: true,
            analytics: {
                coursesEnrolled,
                coursesCompleted,
                tutorialsWatched,
                certificatesEarned,
                totalLearningTime: Math.round(totalLearningTime),
                streakDays,
                lastActivity,
            },
        };
    } catch (error) {
        console.error('Get learning analytics error:', error);
        return { success: false, error: 'Failed to get learning analytics' };
    }
}