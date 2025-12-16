/**
 * Learning System Validation Schemas
 * Centralized Zod schemas for input validation
 */

import { z } from 'zod';

// Base validation rules
const idSchema = z.string().min(1, 'ID is required').max(100, 'ID too long');
const userIdSchema = z.string().uuid('Invalid user ID format');
const contentSchema = z.string().min(1, 'Content is required').max(5000, 'Content too long');

// Course validation
export const courseEnrollmentSchema = z.object({
    courseId: idSchema,
});

export const lessonProgressSchema = z.object({
    courseId: idSchema,
    lessonId: idSchema,
    progress: z.number().min(0, 'Progress cannot be negative').max(100, 'Progress cannot exceed 100'),
});

// Tutorial validation
export const tutorialWatchSchema = z.object({
    tutorialId: idSchema,
    watchTime: z.number().min(0, 'Watch time cannot be negative'),
    totalDuration: z.number().min(1, 'Total duration must be positive'),
});

// Bookmark validation
export const bookmarkSchema = z.object({
    practiceId: idSchema,
    notes: z.string().max(1000, 'Notes too long').optional(),
});

// Community post validation
export const communityPostSchema = z.object({
    content: contentSchema,
    category: z.enum(['question', 'discussion', 'success-story', 'tip', 'announcement'], {
        errorMap: () => ({ message: 'Invalid post category' })
    }),
    tags: z.array(z.string().min(1).max(50)).max(10, 'Too many tags').optional(),
});

export const communityReplySchema = z.object({
    postId: idSchema,
    content: z.string().min(1, 'Reply content is required').max(2000, 'Reply too long'),
});

// Role-play validation
export const rolePlayStartSchema = z.object({
    scenarioId: idSchema,
});

export const rolePlayMessageSchema = z.object({
    sessionId: idSchema,
    scenarioId: idSchema,
    scenarioTitle: z.string().min(1).max(200),
    personaName: z.string().min(1).max(100),
    personaBackground: z.string().min(1).max(1000),
    personaPersonality: z.string().min(1).max(200),
    personaGoals: z.array(z.string()).min(1).max(10),
    personaConcerns: z.array(z.string()).min(1).max(10),
    personaCommunicationStyle: z.string().min(1).max(200),
    messages: z.array(z.object({
        role: z.enum(['user', 'ai']),
        content: z.string().min(1),
        timestamp: z.string().datetime(),
    })).max(100, 'Too many messages in session'),
    message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
});

// Learning plan validation
export const learningPlanSchema = z.object({
    challenge: z.string().min(5, 'Challenge description too short').max(500, 'Challenge description too long'),
    plan: z.string().min(10, 'Plan too short').max(10000, 'Plan too long'),
    userId: userIdSchema,
});

// Progress tracking validation
export const progressUpdateSchema = z.object({
    moduleId: idSchema,
    completed: z.boolean(),
});

// Search and filtering validation
export const learningFiltersSchema = z.object({
    category: z.enum(['marketing', 'closing', 'professional', 'all']).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'all']).optional(),
    duration: z.enum(['short', 'medium', 'long', 'all']).optional(),
    completed: z.boolean().optional(),
    search: z.string().max(100, 'Search query too long').optional(),
});

// Pagination validation
export const paginationSchema = z.object({
    limit: z.number().min(1, 'Limit must be positive').max(100, 'Limit too high').default(50),
    offset: z.number().min(0, 'Offset cannot be negative').default(0),
});

// Analytics validation
export const analyticsDateRangeSchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
}).refine(
    (data) => {
        if (data.startDate && data.endDate) {
            return new Date(data.startDate) <= new Date(data.endDate);
        }
        return true;
    },
    {
        message: 'Start date must be before end date',
        path: ['endDate'],
    }
);

// Certificate validation
export const certificateRequestSchema = z.object({
    courseId: idSchema,
    certificateType: z.enum(['course', 'skill', 'achievement']),
});

// Validation helper functions
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    return {
        success: false,
        errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
    };
}

export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
    return (data: unknown) => {
        const validation = validateInput(schema, data);
        if (!validation.success) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        return validation.data;
    };
}

// Export commonly used validation functions
export const validateCourseEnrollment = createValidationMiddleware(courseEnrollmentSchema);
export const validateLessonProgress = createValidationMiddleware(lessonProgressSchema);
export const validateTutorialWatch = createValidationMiddleware(tutorialWatchSchema);
export const validateCommunityPost = createValidationMiddleware(communityPostSchema);
export const validateRolePlayMessage = createValidationMiddleware(rolePlayMessageSchema);
export const validateLearningPlan = createValidationMiddleware(learningPlanSchema);