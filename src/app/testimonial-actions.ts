'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import {
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
    getTestimonial,
} from '@/aws/dynamodb/testimonial-repository';
import {
    createTestimonialRequest,
    getTestimonialRequestByToken,
    updateTestimonialRequestStatus,
} from '@/aws/dynamodb/testimonial-request-repository';
import { uploadFile, deleteFile } from '@/aws/s3/client';
import { sendEmail } from '@/aws/ses/client';
import {
    generateTestimonialRequestEmail,
    generateTestimonialConfirmationEmail,
    generateTestimonialSubmittedNotification,
} from '@/lib/email-templates/testimonial-reminder';
import { getRepository } from '@/aws/dynamodb/repository';
import { getUserProfileKeys } from '@/aws/dynamodb/keys';
import type { Testimonial, TestimonialRequest } from '@/lib/types/common/common';

/**
 * Action result type
 */
type ActionResult<T = any> = {
    message: string;
    data?: T;
    errors: Record<string, string[]>;
};

/**
 * Maps errors to user-friendly messages
 */
const handleError = (error: any, defaultMessage: string): string => {
    const isDev = process.env.NODE_ENV === 'development';
    const originalErrorMessage = error instanceof Error ? error.message : String(error);
    const devSuffix = isDev ? ` (Error: ${originalErrorMessage})` : '';

    if (error instanceof Error) {
        const lowerCaseMessage = error.message.toLowerCase();

        // DynamoDB errors
        if (lowerCaseMessage.includes('dynamodb') || lowerCaseMessage.includes('provisioned throughput')) {
            return 'Database service is temporarily unavailable. Please try again.' + devSuffix;
        }

        // S3 errors
        if (lowerCaseMessage.includes('s3') || lowerCaseMessage.includes('bucket')) {
            return 'File storage service is temporarily unavailable. Please try again.' + devSuffix;
        }

        // Email errors
        if (lowerCaseMessage.includes('ses') || lowerCaseMessage.includes('email')) {
            return 'Email service is temporarily unavailable. Please try again.' + devSuffix;
        }

        // Network errors
        if (lowerCaseMessage.includes('network') || lowerCaseMessage.includes('econnrefused')) {
            return 'Network connection error. Please check your internet connection and try again.' + devSuffix;
        }

        // Return the original error message if it's user-friendly
        if (error.message && error.message.length < 200 && !error.message.includes('Error:')) {
            return error.message;
        }
    }

    console.error('Testimonial Action Error:', error);
    return defaultMessage + devSuffix;
};

/**
 * Validation schemas
 */
const createTestimonialSchema = z.object({
    clientName: z.string().min(1, 'Client name is required'),
    testimonialText: z.string().min(10, 'Testimonial must be at least 10 characters'),
    dateReceived: z.string().min(1, 'Date received is required'),
    clientPhotoUrl: z.string().optional(),
    isFeatured: z.boolean().default(false),
    displayOrder: z.number().optional(),
    tags: z.array(z.string()).default([]),
    requestId: z.string().optional(),
});

const updateTestimonialSchema = z.object({
    testimonialId: z.string().min(1, 'Testimonial ID is required'),
    clientName: z.string().min(1, 'Client name is required').optional(),
    testimonialText: z.string().min(10, 'Testimonial must be at least 10 characters').optional(),
    clientPhotoUrl: z.string().optional(),
    isFeatured: z.boolean().optional(),
    displayOrder: z.number().optional(),
    tags: z.array(z.string()).optional(),
});

const deleteTestimonialSchema = z.object({
    testimonialId: z.string().min(1, 'Testimonial ID is required'),
});

const uploadClientPhotoSchema = z.object({
    testimonialId: z.string().min(1, 'Testimonial ID is required'),
    photoData: z.string().min(1, 'Photo data is required'),
    fileName: z.string().min(1, 'File name is required'),
});

const sendTestimonialRequestSchema = z.object({
    clientName: z.string().min(1, 'Client name is required'),
    clientEmail: z.string().email('Valid email address is required'),
});

const submitTestimonialSchema = z.object({
    token: z.string().min(1, 'Submission token is required'),
    testimonialText: z.string().min(10, 'Testimonial must be at least 10 characters'),
});

/**
 * Creates a new testimonial
 * Requirements: 1.1
 */
export async function createTestimonialAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<Testimonial>> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to create testimonials'] },
            };
        }

        // Parse and validate input
        const validatedFields = createTestimonialSchema.safeParse({
            clientName: formData.get('clientName'),
            testimonialText: formData.get('testimonialText'),
            dateReceived: formData.get('dateReceived'),
            clientPhotoUrl: formData.get('clientPhotoUrl') || undefined,
            isFeatured: formData.get('isFeatured') === 'true',
            displayOrder: formData.get('displayOrder') ? Number(formData.get('displayOrder')) : undefined,
            tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
            requestId: formData.get('requestId') || undefined,
        });

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        // Create testimonial
        const testimonialId = uuidv4();
        const testimonial = await createTestimonial(
            user.id,
            testimonialId,
            validatedFields.data
        );

        return {
            message: 'success',
            data: testimonial,
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to create testimonial');
        return {
            message: errorMessage,
            errors: {},
        };
    }
}

/**
 * Updates an existing testimonial
 * Preserves the original dateReceived field
 * Requirements: 1.4
 */
export async function updateTestimonialAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<void>> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to update testimonials'] },
            };
        }

        // Parse and validate input
        const validatedFields = updateTestimonialSchema.safeParse({
            testimonialId: formData.get('testimonialId'),
            clientName: formData.get('clientName') || undefined,
            testimonialText: formData.get('testimonialText') || undefined,
            clientPhotoUrl: formData.get('clientPhotoUrl') || undefined,
            isFeatured: formData.get('isFeatured') ? formData.get('isFeatured') === 'true' : undefined,
            displayOrder: formData.get('displayOrder') ? Number(formData.get('displayOrder')) : undefined,
            tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : undefined,
        });

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const { testimonialId, ...updates } = validatedFields.data;

        // Update testimonial (dateReceived is automatically preserved by repository)
        await updateTestimonial(user.id, testimonialId, updates);

        return {
            message: 'success',
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to update testimonial');
        return {
            message: errorMessage,
            errors: {},
        };
    }
}

/**
 * Deletes a testimonial and associated S3 assets
 * Requirements: 1.5
 */
export async function deleteTestimonialAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<void>> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to delete testimonials'] },
            };
        }

        // Parse and validate input
        const validatedFields = deleteTestimonialSchema.safeParse({
            testimonialId: formData.get('testimonialId'),
        });

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const { testimonialId } = validatedFields.data;

        // Get testimonial to check for S3 assets
        const testimonial = await getTestimonial(user.id, testimonialId);

        if (!testimonial) {
            return {
                message: 'Testimonial not found',
                errors: {},
            };
        }

        // Delete S3 assets if they exist
        if (testimonial.clientPhotoUrl) {
            try {
                // Extract S3 key from URL
                const url = new URL(testimonial.clientPhotoUrl);
                const key = url.pathname.substring(1); // Remove leading slash
                await deleteFile(key);
            } catch (s3Error) {
                console.error('Failed to delete S3 asset:', s3Error);
                // Continue with testimonial deletion even if S3 deletion fails
            }
        }

        // Delete testimonial from DynamoDB
        await deleteTestimonial(user.id, testimonialId);

        return {
            message: 'success',
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to delete testimonial');
        return {
            message: errorMessage,
            errors: {},
        };
    }
}

/**
 * Uploads a client photo to S3 and associates it with a testimonial
 * Requirements: 1.2
 */
export async function uploadClientPhotoAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<{ url: string }>> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to upload photos'] },
            };
        }

        // Parse and validate input
        const validatedFields = uploadClientPhotoSchema.safeParse({
            testimonialId: formData.get('testimonialId'),
            photoData: formData.get('photoData'),
            fileName: formData.get('fileName'),
        });

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const { testimonialId, photoData, fileName } = validatedFields.data;

        // Validate file format
        const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const base64Match = photoData.match(/^data:(image\/[a-z]+);base64,(.+)$/);

        if (!base64Match) {
            return {
                message: 'Invalid photo format. Please provide a base64-encoded image.',
                errors: { photoData: ['Invalid format'] },
            };
        }

        const contentType = base64Match[1];
        const base64Data = base64Match[2];

        if (!validFormats.includes(contentType)) {
            return {
                message: 'Invalid image format. Supported formats: JPEG, PNG, WebP',
                errors: { photoData: ['Invalid format'] },
            };
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64');

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (buffer.length > maxSize) {
            return {
                message: 'Image is too large. Maximum size is 5MB.',
                errors: { photoData: ['File too large'] },
            };
        }

        // Generate S3 key
        const fileExtension = contentType.split('/')[1];
        const s3Key = `users/${user.id}/testimonials/${testimonialId}/client-photo.${fileExtension}`;

        // Upload to S3
        const url = await uploadFile(s3Key, buffer, contentType);

        // Update testimonial with photo URL
        await updateTestimonial(user.id, testimonialId, {
            clientPhotoUrl: url,
        });

        return {
            message: 'success',
            data: { url },
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to upload photo');
        return {
            message: errorMessage,
            errors: {},
        };
    }
}

/**
 * Sends a testimonial request email to a client
 * Requirements: 2.1
 */
export async function sendTestimonialRequestAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<TestimonialRequest>> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to send testimonial requests'] },
            };
        }

        // Parse and validate input
        const validatedFields = sendTestimonialRequestSchema.safeParse({
            clientName: formData.get('clientName'),
            clientEmail: formData.get('clientEmail'),
        });

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const { clientName, clientEmail } = validatedFields.data;

        // Get agent profile for email
        const repository = getRepository();
        const profileKeys = getUserProfileKeys(user.id);
        const profile = await repository.get<{ name?: string; agencyName?: string }>(profileKeys.PK, profileKeys.SK);

        if (!profile) {
            return {
                message: 'Profile not found. Please complete your profile before sending requests.',
                errors: { profile: ['Profile required'] },
            };
        }

        const agentName = profile.name || 'Your Agent';
        const agencyName = profile.agencyName;

        // Create testimonial request
        const requestId = uuidv4();
        const request = await createTestimonialRequest(user.id, requestId, {
            clientName,
            clientEmail,
        });

        // Generate email
        const emailData = {
            clientName,
            agentName,
            agencyName,
            submissionLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${request.submissionLink}`,
            expiresAt: request.expiresAt,
        };

        const { subject, html, text } = generateTestimonialRequestEmail(emailData);

        // Send email
        const fromEmail = process.env.SES_FROM_EMAIL || 'noreply@bayoncoagent.com';
        await sendEmail(clientEmail, subject, html, fromEmail, true);

        return {
            message: 'success',
            data: request,
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to send testimonial request');
        return {
            message: errorMessage,
            errors: {},
        };
    }
}

/**
 * Submits a testimonial through a public submission link
 * Requirements: 2.3
 */
export async function submitTestimonialAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<Testimonial>> {
    try {
        // Parse and validate input
        const validatedFields = submitTestimonialSchema.safeParse({
            token: formData.get('token'),
            testimonialText: formData.get('testimonialText'),
        });

        if (!validatedFields.success) {
            return {
                message: 'Validation failed',
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const { token, testimonialText } = validatedFields.data;

        // Get testimonial request by token
        const request = await getTestimonialRequestByToken(token);

        if (!request) {
            return {
                message: 'Invalid or expired submission link',
                errors: { token: ['Invalid link'] },
            };
        }

        // Check if request is still valid
        const now = new Date();
        const expiresAt = new Date(request.expiresAt);

        if (now > expiresAt) {
            // Update status to expired
            await updateTestimonialRequestStatus(request.userId, request.id, 'expired');
            return {
                message: 'This submission link has expired. Please contact the agent for a new link.',
                errors: { token: ['Link expired'] },
            };
        }

        if (request.status !== 'pending') {
            return {
                message: 'This testimonial has already been submitted',
                errors: { token: ['Already submitted'] },
            };
        }

        // Create testimonial
        const testimonialId = uuidv4();
        const testimonial = await createTestimonial(request.userId, testimonialId, {
            clientName: request.clientName,
            testimonialText,
            dateReceived: new Date().toISOString(),
            isFeatured: false,
            tags: [],
            requestId: request.id,
        });

        // Update request status
        await updateTestimonialRequestStatus(
            request.userId,
            request.id,
            'submitted',
            { submittedAt: new Date().toISOString() }
        );

        // Get agent profile for confirmation and notification emails
        const repository = getRepository();
        const profileKeys = getUserProfileKeys(request.userId);
        const profile = await repository.get<{ name?: string; agencyName?: string; email?: string }>(profileKeys.PK, profileKeys.SK);

        if (profile) {
            const agentName = profile.name || 'Your Agent';
            const agencyName = profile.agencyName;
            const agentEmail = profile.email;
            const fromEmail = process.env.SES_FROM_EMAIL || 'noreply@bayoncoagent.com';

            // Send confirmation email to client
            const confirmationEmail = generateTestimonialConfirmationEmail({
                clientName: request.clientName,
                agentName,
                agencyName,
            });

            try {
                await sendEmail(request.clientEmail, confirmationEmail.subject, confirmationEmail.html, fromEmail, true);
            } catch (emailError) {
                console.error('Failed to send confirmation email to client:', emailError);
                // Don't fail the submission if email fails
            }

            // Send notification email to agent
            if (agentEmail) {
                const testimonialUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/brand/testimonials`;
                const notificationEmail = generateTestimonialSubmittedNotification({
                    agentName,
                    agentEmail,
                    clientName: request.clientName,
                    testimonialText,
                    submittedAt: new Date().toISOString(),
                    testimonialUrl,
                });

                try {
                    await sendEmail(agentEmail, notificationEmail.subject, notificationEmail.html, fromEmail, true);
                } catch (emailError) {
                    console.error('Failed to send notification email to agent:', emailError);
                    // Don't fail the submission if email fails
                }
            }
        }

        return {
            message: 'success',
            data: testimonial,
            errors: {},
        };
    } catch (error) {
        const errorMessage = handleError(error, 'Failed to submit testimonial');
        return {
            message: errorMessage,
            errors: {},
        };
    }
}
