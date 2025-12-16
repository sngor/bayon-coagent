/**
 * Unified Learning Service
 * Consolidates all learning-related business logic
 */

import { z } from 'zod';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getRepository } from '@/aws/dynamodb/repository';
import { LearningErrorHandler, type LearningResult } from './error-handler';
import type {
    CourseProgress,
    TutorialProgress,
    BestPracticeBookmark,
    LearningCertificate
} from '@/app/learning-actions';

// Validation schemas
export const courseEnrollmentSchema = z.object({
    courseId: z.string().min(1, 'Course ID is required'),
});

export const lessonProgressSchema = z.object({
    courseId: z.string().min(1, 'Course ID is required'),
    lessonId: z.string().min(1, 'Lesson ID is required'),
    progress: z.number().min(0).max(100),
});

export const tutorialWatchSchema = z.object({
    tutorialId: z.string().min(1, 'Tutorial ID is required'),
    watchTime: z.number().min(0),
    totalDuration: z.number().min(0),
});

export const bookmarkSchema = z.object({
    practiceId: z.string().min(1, 'Practice ID is required'),
    notes: z.string().optional(),
});

export const communityPostSchema = z.object({
    content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
    category: z.enum(['question', 'discussion', 'success-story', 'tip', 'announcement']),
    tags: z.array(z.string()).optional(),
});

export class LearningService {
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

    // Course Management
    async enrollInCourse(courseId: string): Promise<LearningResult<CourseProgress>> {
        const validation = courseEnrollmentSchema.safeParse({ courseId });
        if (!validation.success) {
            return LearningErrorHandler.handleValidationError(validation.error);
        }

        return this.withAuthenticatedUser(async (userId) => {
            // Check if already enrolled
            const existing = await this.getCourseProgress(userId, courseId);
            if (existing) {
                return existing;
            }

            return this.createCourseProgress(userId, courseId);
        });
    }

    async updateLessonProgress(
        courseId: string,
        lessonId: string,
        progress: number
    ): Promise<LearningResult<CourseProgress>> {
        const validation = lessonProgressSchema.safeParse({ courseId, lessonId, progress });
        if (!validation.success) {
            return LearningErrorHandler.handleValidationError(validation.error);
        }

        return this.withAuthenticatedUser(async (userId) => {
            const existing = await this.getCourseProgress(userId, courseId);
            if (!existing) {
                throw new Error('Course enrollment not found');
            }

            // Update completed lessons
            const completedLessons = [...existing.completedLessons];
            if (progress === 100 && !completedLessons.includes(lessonId)) {
                completedLessons.push(lessonId);
            }

            // Calculate overall progress (simplified)
            const totalLessons = 10; // TODO: Get from course metadata
            const overallProgress = Math.round((completedLessons.length / totalLessons) * 100);

            const updates: Partial<CourseProgress> = {
                progress: overallProgress,
                completedLessons,
                completedAt: overallProgress === 100 ? new Date().toISOString() : existing.completedAt,
                lastAccessedAt: new Date().toISOString(),
            };

            const updated = await this.updateCourseProgress(userId, courseId, updates);

            // Issue certificate if course completed
            if (overallProgress === 100 && !existing.completedAt) {
                await this.issueCertificate(userId, courseId, 'course');
            }

            return updated;
        });
    }

    // Private helper methods
    private async createCourseProgress(userId: string, courseId: string): Promise<CourseProgress> {
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

    private async updateCourseProgress(userId: string, courseId: string, updates: Partial<CourseProgress>): Promise<CourseProgress> {
        const keys = this.getCourseProgressKeys(userId, courseId);
        const existing = await this.repository.get<CourseProgress>(keys.PK, keys.SK);

        if (!existing) {
            throw new Error('Course progress not found');
        }

        const updated = { ...existing, ...updates, lastAccessedAt: new Date().toISOString() };
        await this.repository.update(keys.PK, keys.SK, updated);
        return updated;
    }

    private async getCourseProgress(userId: string, courseId: string): Promise<CourseProgress | null> {
        const keys = this.getCourseProgressKeys(userId, courseId);
        return await this.repository.get<CourseProgress>(keys.PK, keys.SK);
    }

    private async issueCertificate(
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
            EntityType: 'LearningCertificate', // Updated entity type
            Data: certificate,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
            GSI1PK: `USER#${userId}`,
            GSI1SK: `CERTIFICATE#${certificate.issuedAt}`,
        });

        return certificate;
    }

    // Helper function for authenticated operations
    private async withAuthenticatedUser<T>(
        operation: (userId: string) => Promise<T>
    ): Promise<LearningResult<T>> {
        try {
            const user = await getCurrentUserServer();
            if (!user?.id) {
                return LearningErrorHandler.handleAuthError();
            }

            const data = await operation(user.id);
            return { success: true, data };
        } catch (error) {
            console.error('Learning operation error:', error);
            return LearningErrorHandler.handleGenericError('Learning operation', error);
        }
    }
}

// Singleton instance
export const learningService = new LearningService();

// Export commonly used functions
export const {
    enrollInCourse,
    updateLessonProgress,
} = learningService;