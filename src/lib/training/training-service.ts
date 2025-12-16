/**
 * Unified Training Service
 * Consolidates all training-related business logic
 */

import { z } from 'zod';
import { trainingRepository, withAuthenticatedUser } from './training-repository';
import { TrainingErrorHandler, type TrainingResult } from './error-handler';
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

export class TrainingService {
    // Course Management
    async enrollInCourse(courseId: string): Promise<TrainingResult<CourseProgress>> {
        const validation = courseEnrollmentSchema.safeParse({ courseId });
        if (!validation.success) {
            return TrainingErrorHandler.handleValidationError(validation.error);
        }

        return withAuthenticatedUser(async (userId) => {
            // Check if already enrolled
            const existing = await trainingRepository.getCourseProgress(userId, courseId);
            if (existing) {
                return existing;
            }

            return trainingRepository.createCourseProgress(userId, courseId);
        });
    }

    async updateLessonProgress(
        courseId: string,
        lessonId: string,
        progress: number
    ): Promise<TrainingResult<CourseProgress>> {
        const validation = lessonProgressSchema.safeParse({ courseId, lessonId, progress });
        if (!validation.success) {
            return TrainingErrorHandler.handleValidationError(validation.error);
        }

        return withAuthenticatedUser(async (userId) => {
            const existing = await trainingRepository.getCourseProgress(userId, courseId);
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
            };

            const updated = await trainingRepository.updateCourseProgress(userId, courseId, updates);

            // Issue certificate if course completed
            if (overallProgress === 100 && !existing.completedAt) {
                await trainingRepository.issueCertificate(userId, courseId, 'course');
            }

            return updated;
        });
    }

    // Tutorial Management
    async recordTutorialWatch(
        tutorialId: string,
        watchTime: number,
        totalDuration: number
    ): Promise<TrainingResult<TutorialProgress>> {
        const validation = tutorialWatchSchema.safeParse({ tutorialId, watchTime, totalDuration });
        if (!validation.success) {
            return TrainingErrorHandler.handleValidationError(validation.error);
        }

        return withAuthenticatedUser(async (userId) => {
            const isWatched = watchTime >= totalDuration * 0.8; // 80% completion threshold

            const updates: Partial<TutorialProgress> = {
                isWatched,
                watchedAt: isWatched ? new Date().toISOString() : undefined,
                watchTime,
                totalDuration,
            };

            return trainingRepository.upsertTutorialProgress(userId, tutorialId, updates);
        });
    }

    // Bookmark Management
    async bookmarkBestPractice(
        practiceId: string,
        notes?: string
    ): Promise<TrainingResult<BestPracticeBookmark>> {
        const validation = bookmarkSchema.safeParse({ practiceId, notes });
        if (!validation.success) {
            return TrainingErrorHandler.handleValidationError(validation.error);
        }

        return withAuthenticatedUser(async (userId) => {
            // TODO: Implement bookmark functionality in repository
            throw new Error('Bookmark functionality not yet implemented');
        });
    }

    // Analytics
    async getLearningAnalytics(): Promise<TrainingResult<any>> {
        return withAuthenticatedUser(async (userId) => {
            return trainingRepository.getLearningAnalytics(userId);
        });
    }

    // Progress Queries
    async getUserCourseProgress(limit = 50): Promise<TrainingResult<CourseProgress[]>> {
        return withAuthenticatedUser(async (userId) => {
            return trainingRepository.getUserCourseProgress(userId, limit);
        });
    }

    async getUserTutorialProgress(limit = 50): Promise<TrainingResult<TutorialProgress[]>> {
        return withAuthenticatedUser(async (userId) => {
            // TODO: Expose this method in repository
            throw new Error('Tutorial progress query not yet implemented');
        });
    }

    // Community Features
    async createCommunityPost(input: {
        content: string;
        category: 'question' | 'discussion' | 'success-story' | 'tip' | 'announcement';
        tags?: string[];
    }): Promise<TrainingResult<any>> {
        const validation = communityPostSchema.safeParse(input);
        if (!validation.success) {
            return TrainingErrorHandler.handleValidationError(validation.error);
        }

        return withAuthenticatedUser(async (userId) => {
            // TODO: Implement community post creation
            throw new Error('Community post creation not yet implemented');
        });
    }
}

// Singleton instance
export const trainingService = new TrainingService();

// Export commonly used functions
export const {
    enrollInCourse,
    updateLessonProgress,
    recordTutorialWatch,
    bookmarkBestPractice,
    getLearningAnalytics,
    getUserCourseProgress,
    createCommunityPost,
} = trainingService;