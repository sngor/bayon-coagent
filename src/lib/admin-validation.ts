import { z } from 'zod';

// Team validation schemas
export const teamCreateSchema = z.object({
    name: z.string()
        .min(1, 'Team name is required')
        .min(2, 'Team name must be at least 2 characters')
        .max(50, 'Team name must be less than 50 characters')
        .regex(/^[a-zA-Z0-9\s-_]+$/, 'Team name can only contain letters, numbers, spaces, hyphens, and underscores'),
    adminId: z.string()
        .min(1, 'Team admin is required')
        .uuid('Invalid admin ID format')
});

export const teamUpdateSchema = teamCreateSchema.extend({
    id: z.string().uuid('Invalid team ID format')
});

// Content moderation validation schemas
export const contentModerationSchema = z.object({
    contentId: z.string().min(1, 'Content ID is required'),
    action: z.enum(['approve', 'reject'], {
        errorMap: () => ({ message: 'Action must be either approve or reject' })
    }),
    reason: z.string().optional()
        .refine((val, ctx) => {
            if (ctx.parent.action === 'reject' && (!val || val.trim().length === 0)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Reason is required when rejecting content'
                });
                return false;
            }
            return true;
        })
});

// Announcement validation schemas
export const announcementCreateSchema = z.object({
    title: z.string()
        .min(1, 'Title is required')
        .min(5, 'Title must be at least 5 characters')
        .max(100, 'Title must be less than 100 characters'),
    content: z.string()
        .min(1, 'Content is required')
        .min(10, 'Content must be at least 10 characters')
        .max(1000, 'Content must be less than 1000 characters'),
    priority: z.enum(['low', 'medium', 'high'], {
        errorMap: () => ({ message: 'Priority must be low, medium, or high' })
    }),
    targetAudience: z.enum(['all', 'admins', 'users'], {
        errorMap: () => ({ message: 'Target audience must be all, admins, or users' })
    }),
    scheduledFor: z.date()
        .min(new Date(), 'Scheduled date must be in the future')
});

// Generic validation helper
export function validateAdminInput<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
    try {
        const validatedData = schema.parse(data);
        return { success: true, data: validatedData };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                errors: error.errors.map(err => err.message)
            };
        }
        return {
            success: false,
            errors: ['Validation failed']
        };
    }
}

// Form validation hook
export function useAdminFormValidation<T>(schema: z.ZodSchema<T>) {
    const validate = (data: unknown) => validateAdminInput(schema, data);

    const validateField = (fieldName: keyof T, value: unknown) => {
        const fieldSchema = schema.shape?.[fieldName as string];
        if (!fieldSchema) return { success: true, errors: [] };

        return validateAdminInput(fieldSchema, value);
    };

    return { validate, validateField };
}