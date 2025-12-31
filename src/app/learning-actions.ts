'use server';

import { z } from 'zod';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getRepository } from '@/aws/dynamodb/repository';
import { learningRepository, withAuthenticatedUser } from '@/lib/learning/learning-repository';
import { LearningErrorHandler } from '@/lib/learning/error-handler';

// Learning Types with better validation
export type CourseProgress = {
    id: string;
    userId: string;
    courseId: string;
    progress: number; // 0-100
    completedLessons: readonly string[];
    lastAccessedAt: string;
    enrolledAt: string;
    completedAt?: string;
    certificateIssued?: boolean;
};

export type TutorialProgress = {
    id: string;
    userId: string;
    tutorialId: string;
    isWatched: boolean;
    watchedAt?: string;
    watchTime: number; // in seconds
    totalDuration: number; // in seconds
};

export type BestPracticeBookmark = {
    id: string;
    userId: string;
    practiceId: string;
    bookmarkedAt: string;
    notes?: string;
};

export type LearningCertificate = {
    id: string;
    userId: string;
    courseId: string;
    certificateType: 'course' | 'skill' | 'achievement';
    title: string;
    description: string;
    issuedAt: string;
    expiresAt?: string;
    credentialUrl?: string;
    badgeUrl?: string;
};

// Validation schemas
const courseEnrollmentSchema = z.object({
    courseId: z.string().min(1, 'Course ID is required'),
});

const lessonProgressSchema = z.object({
    courseId: z.string().min(1, 'Course ID is required'),
    lessonId: z.string().min(1, 'Lesson ID is required'),
    progress: z.number().min(0).max(100),
});

const tutorialWatchSchema = z.object({
    tutorialId: z.string().min(1, 'Tutorial ID is required'),
    watchTime: z.number().min(0),
    totalDuration: z.number().min(0),
});

const bookmarkSchema = z.object({
    practiceId: z.string().min(1, 'Practice ID is required'),
    notes: z.string().optional(),
});

// DynamoDB Keys
function getCourseProgressKeys(userId: string, courseId: string) {
    return {
        PK: `USER#${userId}`,
        SK: `COURSE_PROGRESS#${courseId}`,
    };
}

function getTutorialProgressKeys(userId: string, tutorialId: string) {
    return {
        PK: `USER#${userId}`,
        SK: `TUTORIAL_PROGRESS#${tutorialId}`,
    };
}

function getBookmarkKeys(userId: string, practiceId: string) {
    return {
        PK: `USER#${userId}`,
        SK: `BOOKMARK#${practiceId}`,
    };
}

function getCertificateKeys(userId: string, certificateId: string) {
    return {
        PK: `USER#${userId}`,
        SK: `CERTIFICATE#${certificateId}`,
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
            await issueCertificate(user.id, courseId, 'course');
        }

        return { success: true, courseProgress: updatedProgress };
    } catch (error) {
        console.error('Update lesson progress error:', error);
        return { success: false, error: 'Failed to update lesson progress' };
    }
}

/**
 * Record tutorial watch progress
 */
export async function recordTutorialWatch(
    tutorialId: string,
    watchTime: number,
    totalDuration: number
): Promise<{ success: boolean; progress?: TutorialProgress; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const validated = tutorialWatchSchema.safeParse({ tutorialId, watchTime, totalDuration });
        if (!validated.success) {
            return {
                success: false,
                error: `Validation error: ${validated.error.errors.map(e => e.message).join(', ')}`
            };
        }

        const repository = getRepository();
        const keys = getTutorialProgressKeys(user.id, tutorialId);
        const existingProgress = await repository.get<TutorialProgress>(keys.PK, keys.SK);

        const isWatched = watchTime >= totalDuration * 0.8; // 80% completion threshold

        const progress: TutorialProgress = {
            id: existingProgress?.id || `tutorial-${Date.now()}`,
            userId: user.id,
            tutorialId,
            isWatched,
            watchedAt: isWatched ? new Date().toISOString() : existingProgress?.watchedAt,
            watchTime: Math.max(watchTime, existingProgress?.watchTime || 0),
            totalDuration,
        };

        if (existingProgress) {
            await repository.update(keys.PK, keys.SK, progress);
        } else {
            await repository.put({
                PK: keys.PK,
                SK: keys.SK,
                EntityType: 'TutorialProgress',
                Data: progress,
                CreatedAt: Date.now(),
                UpdatedAt: Date.now(),
                GSI1PK: `USER#${user.id}`,
                GSI1SK: `TUTORIAL_PROGRESS#${progress.watchedAt || new Date().toISOString()}`,
            });
        }

        return { success: true, progress };
    } catch (error) {
        console.error('Record tutorial watch error:', error);
        return { success: false, error: 'Failed to record tutorial progress' };
    }
}

/**
 * Bookmark a best practice
 */
export async function bookmarkBestPractice(
    practiceId: string,
    notes?: string
): Promise<{ success: boolean; bookmark?: BestPracticeBookmark; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const validated = bookmarkSchema.safeParse({ practiceId, notes });
        if (!validated.success) {
            return {
                success: false,
                error: `Validation error: ${validated.error.errors.map(e => e.message).join(', ')}`
            };
        }

        const bookmarkId = `bookmark-${Date.now()}`;
        const bookmark: BestPracticeBookmark = {
            id: bookmarkId,
            userId: user.id,
            practiceId,
            bookmarkedAt: new Date().toISOString(),
            notes,
        };

        const repository = getRepository();
        const keys = getBookmarkKeys(user.id, practiceId);
        await repository.create(keys.PK, keys.SK, 'BestPracticeBookmark', bookmark);

        return { success: true, bookmark };
    } catch (error) {
        console.error('Bookmark best practice error:', error);
        return { success: false, error: 'Failed to bookmark best practice' };
    }
}

/**
 * Remove bookmark
 */
export async function removeBookmark(
    practiceId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const repository = getRepository();
        const keys = getBookmarkKeys(user.id, practiceId);
        await repository.delete(keys.PK, keys.SK);

        return { success: true };
    } catch (error) {
        console.error('Remove bookmark error:', error);
        return { success: false, error: 'Failed to remove bookmark' };
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

/**
 * Get user's tutorial progress
 */
export async function getUserTutorialProgress(
    limit: number = 50
): Promise<{ success: boolean; progress?: TutorialProgress[]; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const repository = getRepository();
        const pk = `USER#${user.id}`;
        const results = await repository.query<TutorialProgress>(pk, 'TUTORIAL_PROGRESS#', {
            limit,
            scanIndexForward: false,
        });

        return { success: true, progress: results.items };
    } catch (error) {
        console.error('Get user tutorial progress error:', error);
        return { success: false, error: 'Failed to get tutorial progress' };
    }
}

/**
 * Get user's bookmarks
 */
export async function getUserBookmarks(
    limit: number = 50
): Promise<{ success: boolean; bookmarks?: BestPracticeBookmark[]; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const repository = getRepository();
        const pk = `USER#${user.id}`;
        const results = await repository.query<BestPracticeBookmark>(pk, 'BOOKMARK#', {
            limit,
            scanIndexForward: false,
        });

        return { success: true, bookmarks: results.items };
    } catch (error) {
        console.error('Get user bookmarks error:', error);
        return { success: false, error: 'Failed to get bookmarks' };
    }
}

/**
 * Issue a certificate
 */
async function issueCertificate(
    userId: string,
    courseId: string,
    certificateType: 'course' | 'skill' | 'achievement'
): Promise<{ success: boolean; certificate?: LearningCertificate; error?: string }> {
    try {
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

        const repository = getRepository();
        const keys = getCertificateKeys(userId, certificateId);
        await repository.create(keys.PK, keys.SK, 'TrainingCertificate' as any, certificate);

        return { success: true, certificate };
    } catch (error) {
        console.error('Issue certificate error:', error);
        return { success: false, error: 'Failed to issue certificate' };
    }
}

/**
 * Get user's certificates
 */
export async function getUserCertificates(
    limit: number = 50
): Promise<{ success: boolean; certificates?: LearningCertificate[]; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const repository = getRepository();
        const pk = `USER#${user.id}`;
        const results = await repository.query<LearningCertificate>(pk, 'CERTIFICATE#', {
            limit,
            scanIndexForward: false,
        });

        return { success: true, certificates: results.items };
    } catch (error) {
        console.error('Get user certificates error:', error);
        return { success: false, error: 'Failed to get certificates' };
    }
}

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

/**
 * Generate learning plan
 */
export async function generateLearningPlanAction(
    challenge: string
): Promise<{ success: boolean; data?: { plan: string }; errors?: string[]; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        if (!challenge.trim()) {
            return { success: false, errors: ['Challenge description is required'] };
        }

        // Simulate AI generation (in real implementation, this would call Bedrock)
        const plan = `
# Personalized Learning Plan: ${challenge}

## Overview
This learning plan is designed to help you overcome the challenge: "${challenge}"

## Learning Objectives
- Understand the core concepts related to ${challenge}
- Develop practical skills to address this challenge
- Build confidence in handling similar situations

## Action Steps
1. **Assessment Phase** (Week 1)
   - Identify specific areas of improvement
   - Set measurable goals
   - Gather relevant resources

2. **Learning Phase** (Weeks 2-3)
   - Study best practices and techniques
   - Review case studies and examples
   - Practice with mock scenarios

3. **Implementation Phase** (Week 4)
   - Apply learned concepts in real situations
   - Track progress and results
   - Adjust approach based on feedback

## Resources
- Industry best practices guides
- Video tutorials and webinars
- Practice exercises and role-play scenarios
- Peer learning opportunities

## Success Metrics
- Improved confidence in handling ${challenge}
- Measurable improvement in related skills
- Positive feedback from clients or colleagues
- Successful application of learned techniques

## Next Steps
1. Review this plan and customize it to your specific needs
2. Schedule dedicated learning time in your calendar
3. Begin with the assessment phase
4. Track your progress regularly
        `;

        return {
            success: true,
            data: { plan: plan.trim() }
        };
    } catch (error) {
        console.error('Generate learning plan error:', error);
        return { success: false, error: 'Failed to generate learning plan' };
    }
}

/**
 * Save learning plan
 */
export async function saveLearningPlanAction(
    challenge: string,
    plan: string,
    userId: string
): Promise<{ success: boolean; errors?: string[]; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id || user.id !== userId) {
            return { success: false, error: 'Authentication required' };
        }

        if (!challenge.trim() || !plan.trim()) {
            return { success: false, errors: ['Challenge and plan are required'] };
        }

        const repository = getRepository();
        const planId = `plan-${Date.now()}`;
        const learningPlan = {
            id: planId,
            userId: user.id,
            challenge,
            plan,
            createdAt: new Date().toISOString(),
            type: 'learning-plan'
        };

        await repository.create(
            `USER#${user.id}`,
            `LEARNING_PLAN#${planId}`,
            'SavedContent',
            learningPlan
        );

        return { success: true };
    } catch (error) {
        console.error('Save learning plan error:', error);
        return { success: false, error: 'Failed to save learning plan' };
    }
}

/**
 * Save learning progress for a module
 */
export async function saveLearningProgressAction(
    moduleId: string,
    completed: boolean
): Promise<{ success: boolean; error?: string }> {
    return withAuthenticatedUser(async (userId) => {
        await learningRepository.saveLearningProgress(userId, moduleId, completed);
        return { success: true };
    });
}

/**
 * Community-specific actions
 */

// Community post schemas
const createPostSchema = z.object({
    content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
    category: z.enum(['question', 'discussion', 'success-story', 'tip', 'announcement']),
    tags: z.array(z.string()).optional(),
});

const likePostSchema = z.object({
    postId: z.string().min(1, 'Post ID is required'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type LikePostInput = z.infer<typeof likePostSchema>;

/**
 * Create a new community post
 */
export async function createCommunityPost(input: CreatePostInput): Promise<{
    success: boolean;
    post?: any;
    error?: string;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const validated = createPostSchema.safeParse(input);
        if (!validated.success) {
            return {
                success: false,
                error: `Validation error: ${validated.error.errors.map(e => e.message).join(', ')}`
            };
        }

        const postId = `post-${Date.now()}`;
        const post = {
            id: postId,
            userId: user.id,
            content: validated.data.content,
            category: validated.data.category,
            tags: validated.data.tags || [],
            likes: 0,
            replies: 0,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
        };

        const repository = getRepository();
        await repository.create(
            `USER#${user.id}`,
            `COMMUNITY_POST#${postId}`,
            'CommunityPost',
            post
        );

        return { success: true, post };
    } catch (error) {
        console.error('Create community post error:', error);
        return { success: false, error: 'Failed to create post' };
    }
}

/**
 * Like/unlike a community post
 */
export async function togglePostLike(input: LikePostInput): Promise<{
    success: boolean;
    isLiked?: boolean;
    likes?: number;
    error?: string;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user?.id) {
            return { success: false, error: 'Authentication required' };
        }

        const validated = likePostSchema.safeParse(input);
        if (!validated.success) {
            return {
                success: false,
                error: `Validation error: ${validated.error.errors.map(e => e.message).join(', ')}`
            };
        }

        // In a real implementation, this would check if user already liked the post
        // and update the like count accordingly
        // This is a simplified implementation
        // Real implementation would need to track likes properly
        return {
            success: true,
            isLiked: true,
            likes: 1
        };
    } catch (error) {
        console.error('Toggle post like error:', error);
        return { success: false, error: 'Failed to toggle like' };
    }
}