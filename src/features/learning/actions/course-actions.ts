'use server';

import { z } from 'zod';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getRepository } from '@/aws/dynamodb/repository';
import type { CourseProgress } from '@/app/learning-actions';

// Validation schemas
const courseEnrollmentSchema = z.object({
    courseId: z.string().min(1, 'Course ID is required'),
});

const lessonProgressSchema = z.object({
    courseId: z.string().min(1, 'Course ID is required'),
    lessonId: z.string().min(1, 'Lesson ID is required'),
    progress: z.number().min(0).max(100),
});

// DynamoDB Keys
function getCourseProgressKeys(userId: string, courseId: string) {
    return {
        PK: `USER#${userId}`,
        SK: `COURSE_PROGRESS#${courseId}`,
    };
}

/**
 * Enroll user in a course
 */
export async function enrollInCourse(
    courseId: string
): Promise<{ success: boolean; progress?: CourseProgress; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const validated = courseEnrollmentSchema.safeParse({ courseId });
        if (!validated.success) {
            return {
                success: false,
                error: `Validation error: ${validated.error.errors.map(e => e.message).join(', ')}`
            };
        }

        const progressId = `progress-${Date.now()}`;
        const progress: CourseProgress = {
            id: progressId,
            userId: user.id,
            courseId,
            progress: 0,
            completedLessons: [],
            lastAccessedAt: new Date().toISOString(),
            enrolledAt: new Date().toISOString(),
        };

        const repository = getRepository();
        const keys = getCourseProgressKeys(user.id, courseId);
        await repository.put({
            PK: keys.PK,
            SK: keys.SK,
            EntityType: 'CourseProgress',
            Data: progress,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
            GSI1PK: `USER#${user.id}`,
            GSI1SK: `COURSE_PROGRESS#${progress.enrolledAt}`,
        });

        return { success: true, progress };
    } catch (error) {
        console.error('Enroll in course error:', error);
        return { success: false, error: 'Failed to enroll in course' };
    }
}

/**
 * Update lesson progress
 */
export async function updateLessonProgress(
    courseId: string,
    lessonId: string,
    progress: number
): Promise<{ success: boolean; courseProgress?: CourseProgress; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const validated = lessonProgressSchema.safeParse({ courseId, lessonId, progress });
        if (!validated.success) {
            return {
                success: false,
                error: `Validation error: ${validated.error.errors.map(e => e.message).join(', ')}`
            };
        }

        const repository = getRepository();
        const keys = getCourseProgressKeys(user.id, courseId);
        const existingProgress = await repository.get<CourseProgress>(keys.PK, keys.SK);

        if (!existingProgress) {
            return { success: false, error: 'Course enrollment not found' };
        }

        // Update completed lessons
        const completedLessons = [...existingProgress.completedLessons];
        if (progress === 100 && !completedLessons.includes(lessonId)) {
            completedLessons.push(lessonId);
        }

        // Calculate overall course progress (simplified - in reality would be based on lesson weights)
        const totalLessons = 10; // This would come from course metadata
        const overallProgress = Math.round((completedLessons.length / totalLessons) * 100);

        const updatedProgress: CourseProgress = {
            ...existingProgress,
            progress: overallProgress,
            completedLessons,
            lastAccessedAt: new Date().toISOString(),
            completedAt: overallProgress === 100 ? new Date().toISOString() : existingProgress.completedAt,
        };

        await repository.update(keys.PK, keys.SK, updatedProgress);

        // Issue certificate if course is completed
        if (overallProgress === 100 && !existingProgress.completedAt) {
            // Import certificate action when needed
            // await issueCertificate(user.id, courseId, 'course');
        }

        return { success: true, courseProgress: updatedProgress };
    } catch (error) {
        console.error('Update lesson progress error:', error);
        return { success: false, error: 'Failed to update lesson progress' };
    }
}

/**
 * Get user's course progress
 */
export async function getUserCourseProgress(
    limit: number = 50
): Promise<{ success: boolean; progress?: CourseProgress[]; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const repository = getRepository();
        const pk = `USER#${user.id}`;
        const results = await repository.query<CourseProgress>(pk, 'COURSE_PROGRESS#', {
            limit,
            scanIndexForward: false, // Get newest first
        });

        return { success: true, progress: results.items };
    } catch (error) {
        console.error('Get user course progress error:', error);
        return { success: false, error: 'Failed to get course progress' };
    }
}