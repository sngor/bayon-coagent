/**
 * Centralized Training Repository
 * Consolidates all training-related database operations
 */

import { getRepository } from '@/aws/dynamodb/repository';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import type {
    CourseProgress,
    TutorialProgress,
    BestPracticeBookmark,
    LearningCertificate
} from '@/app/learning-actions';

export class TrainingRepository {
    private repository = getRepository();

    // Key generators
    private getCourseProgressKeys(userId: string, courseId: string) {
        return {
            PK: `USER#${userId}`,
            SK: `COURSE_PROGRESS#${courseId}`,
        };
    }

    private getTutorialProgressKeys(userId: string, tutorialId: string) {
        return {
            PK: `USER#${userId}`,
            SK: `TUTORIAL_PROGRESS#${tutorialId}`,
        };
    }

    private getBookmarkKeys(userId: string, practiceId: string) {
        return {
            PK: `USER#${userId}`,
            SK: `BOOKMARK#${practiceId}`,
        };
    }

    private getCertificateKeys(userId: string, certificateId: string) {
        return {
            PK: `USER#${userId}`,
            SK: `CERTIFICATE#${certificateId}`,
        };
    }

    // Course Progress Operations
    async createCourseProgress(userId: string, courseId: string): Promise<CourseProgress> {
        const progressId = `progress-${Date.now()}`;
        const progress: CourseProgress = {
            id: progressId,
            userId,
            courseId,
            progress: 0,
            completedLessons: [],
            lastAccessedAt: new Date().toISOString(),
            enrolledAt: new Date().toISOString(),
        };

        const keys = this.getCourseProgressKeys(userId, courseId);
        await this.repository.put({
            PK: keys.PK,
            SK: keys.SK,
            EntityType: 'CourseProgress',
            Data: progress,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
            GSI1PK: `USER#${userId}`,
            GSI1SK: `COURSE_PROGRESS#${progress.enrolledAt}`,
        });

        return progress;
    }

    async updateCourseProgress(userId: string, courseId: string, updates: Partial<CourseProgress>): Promise<CourseProgress> {
        const keys = this.getCourseProgressKeys(userId, courseId);
        const existing = await this.repository.get<CourseProgress>(keys.PK, keys.SK);

        if (!existing) {
            throw new Error('Course progress not found');
        }

        const updated = { ...existing, ...updates, lastAccessedAt: new Date().toISOString() };
        await this.repository.update(keys.PK, keys.SK, updated);
        return updated;
    }

    async getCourseProgress(userId: string, courseId: string): Promise<CourseProgress | null> {
        const keys = this.getCourseProgressKeys(userId, courseId);
        return await this.repository.get<CourseProgress>(keys.PK, keys.SK);
    }

    async getUserCourseProgress(userId: string, limit = 50): Promise<CourseProgress[]> {
        const pk = `USER#${userId}`;
        const results = await this.repository.query<CourseProgress>(pk, 'COURSE_PROGRESS#', {
            limit,
            scanIndexForward: false,
        });
        return results.items;
    }

    // Tutorial Progress Operations
    async upsertTutorialProgress(userId: string, tutorialId: string, progress: Partial<TutorialProgress>): Promise<TutorialProgress> {
        const keys = this.getTutorialProgressKeys(userId, tutorialId);
        const existing = await this.repository.get<TutorialProgress>(keys.PK, keys.SK);

        const tutorialProgress: TutorialProgress = {
            id: existing?.id || `tutorial-${Date.now()}`,
            userId,
            tutorialId,
            isWatched: false,
            watchTime: 0,
            totalDuration: 0,
            ...existing,
            ...progress,
        };

        if (existing) {
            await this.repository.update(keys.PK, keys.SK, tutorialProgress);
        } else {
            await this.repository.put({
                PK: keys.PK,
                SK: keys.SK,
                EntityType: 'TutorialProgress',
                Data: tutorialProgress,
                CreatedAt: Date.now(),
                UpdatedAt: Date.now(),
                GSI1PK: `USER#${userId}`,
                GSI1SK: `TUTORIAL_PROGRESS#${tutorialProgress.watchedAt || new Date().toISOString()}`,
            });
        }

        return tutorialProgress;
    }

    // Certificate Operations
    async issueCertificate(
        userId: string,
        courseId: string,
        certificateType: 'course' | 'skill' | 'achievement'
    ): Promise<LearningCertificate> {
        const certificateId = `cert-${Date.now()}`;
        const certificate: LearningCertificate = {
            id: certificateId,
            userId,
            courseId,
            certificateType,
            title: `Course Completion Certificate`,
            description: `Successfully completed the course requirements`,
            issuedAt: new Date().toISOString(),
            credentialUrl: `https://certificates.bayon.ai/${certificateId}`,
            badgeUrl: `https://badges.bayon.ai/${certificateId}.png`,
        };

        const keys = this.getCertificateKeys(userId, certificateId);
        await this.repository.put({
            PK: keys.PK,
            SK: keys.SK,
            EntityType: 'TrainingCertificate',
            Data: certificate,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
            GSI1PK: `USER#${userId}`,
            GSI1SK: `CERTIFICATE#${certificate.issuedAt}`,
        });

        return certificate;
    }

    // Analytics
    async getLearningAnalytics(userId: string) {
        const [courseProgress, tutorialProgress, certificates] = await Promise.all([
            this.getUserCourseProgress(userId, 100),
            this.getUserTutorialProgress(userId, 100),
            this.getUserCertificates(userId, 100),
        ]);

        const coursesEnrolled = courseProgress.length;
        const coursesCompleted = courseProgress.filter(p => p.completedAt).length;
        const tutorialsWatched = tutorialProgress.filter(p => p.isWatched).length;
        const certificatesEarned = certificates.length;

        const totalLearningTime = tutorialProgress.reduce((total, p) => total + (p.watchTime / 60), 0);

        const allActivities = [
            ...courseProgress.map(p => p.lastAccessedAt),
            ...tutorialProgress.map(p => p.watchedAt).filter(Boolean),
        ];
        const lastActivity = allActivities.length > 0
            ? allActivities.sort().reverse()[0]!
            : new Date().toISOString();

        return {
            coursesEnrolled,
            coursesCompleted,
            tutorialsWatched,
            certificatesEarned,
            totalLearningTime: Math.round(totalLearningTime),
            streakDays: 7, // TODO: Implement proper streak calculation
            lastActivity,
        };
    }

    private async getUserTutorialProgress(userId: string, limit = 50): Promise<TutorialProgress[]> {
        const pk = `USER#${userId}`;
        const results = await this.repository.query<TutorialProgress>(pk, 'TUTORIAL_PROGRESS#', {
            limit,
            scanIndexForward: false,
        });
        return results.items;
    }

    private async getUserCertificates(userId: string, limit = 50): Promise<LearningCertificate[]> {
        const pk = `USER#${userId}`;
        const results = await this.repository.query<LearningCertificate>(pk, 'CERTIFICATE#', {
            limit,
            scanIndexForward: false,
        });
        return results.items;
    }
}

// Singleton instance
export const trainingRepository = new TrainingRepository();

// Helper function for authenticated operations
export async function withAuthenticatedUser<T>(
    operation: (userId: string) => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const data = await operation(user.id);
        return { success: true, data };
    } catch (error) {
        console.error('Training operation error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Operation failed'
        };
    }
}