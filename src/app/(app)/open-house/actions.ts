'use server';

import { getRepository } from '@/aws/dynamodb/repository';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { OpenHouseSession, SessionStatus } from '@/lib/open-house/types';
import {
    createOpenHouseSessionInputSchema,
    updateOpenHouseSessionInputSchema,
    formatZodErrors,
} from '@/lib/open-house/schemas';
import { generateSessionQRCode } from '@/lib/qr-code';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Creates a new open house session with QR code generation
 * Validates Requirements: 1.1, 4.1
 */
export async function createOpenHouseSession(
    input: z.infer<typeof createOpenHouseSessionInputSchema>
): Promise<{
    success: boolean;
    sessionId?: string;
    qrCodeUrl?: string;
    error?: string;
    errors?: Record<string, string[]>;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Validate input
        const validation = createOpenHouseSessionInputSchema.safeParse(input);
        if (!validation.success) {
            return {
                success: false,
                error: 'Validation failed',
                errors: formatZodErrors(validation.error),
            };
        }

        const validatedInput = validation.data;

        // Generate unique session ID
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Generate QR code and upload to S3
        let qrCodeUrl: string;
        try {
            qrCodeUrl = await generateSessionQRCode(sessionId, user.id);
        } catch (qrError) {
            console.error('QR code generation failed:', qrError);
            return {
                success: false,
                error: 'Failed to generate QR code. Please try again.',
            };
        }

        // Create session data
        const now = new Date().toISOString();
        const sessionData: OpenHouseSession = {
            sessionId,
            userId: user.id,
            propertyId: validatedInput.propertyId,
            propertyAddress: validatedInput.propertyAddress,
            scheduledDate: validatedInput.scheduledDate,
            scheduledStartTime: validatedInput.scheduledStartTime,
            scheduledEndTime: validatedInput.scheduledEndTime,
            status: SessionStatus.SCHEDULED,
            qrCodeUrl,
            visitorCount: 0,
            interestLevelDistribution: {
                high: 0,
                medium: 0,
                low: 0,
            },
            photos: [],
            notes: validatedInput.notes,
            templateId: validatedInput.templateId,
            createdAt: now,
            updatedAt: now,
        };

        // Store in DynamoDB
        const repository = getRepository();
        await repository.createOpenHouseSession(
            user.id,
            sessionId,
            sessionData
        );

        // Increment template usage count if template was used
        if (validatedInput.templateId) {
            await incrementTemplateUsage(validatedInput.templateId);
        }

        revalidatePath('/open-house/sessions');

        return {
            success: true,
            sessionId,
            qrCodeUrl,
        };
    } catch (error) {
        console.error('Error creating open house session:', error);
        return {
            success: false,
            error: 'Failed to create session. Please try again.',
        };
    }
}

/**
 * Updates an existing open house session
 * Validates Requirements: 1.1
 */
export async function updateOpenHouseSession(
    sessionId: string,
    input: z.infer<typeof updateOpenHouseSessionInputSchema>
): Promise<{
    success: boolean;
    error?: string;
    errors?: Record<string, string[]>;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Validate input
        const validation = updateOpenHouseSessionInputSchema.safeParse(input);
        if (!validation.success) {
            return {
                success: false,
                error: 'Validation failed',
                errors: formatZodErrors(validation.error),
            };
        }

        const validatedInput = validation.data;

        // Get existing session to verify ownership and status
        const repository = getRepository();
        const existingSession = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            sessionId
        );

        if (!existingSession) {
            return { success: false, error: 'Session not found' };
        }

        // Prevent updates to completed or cancelled sessions
        if (existingSession.status === SessionStatus.COMPLETED ||
            existingSession.status === SessionStatus.CANCELLED) {
            return {
                success: false,
                error: 'Cannot update a completed or cancelled session',
            };
        }

        // Prepare updates
        const updates: Partial<OpenHouseSession> = {
            ...validatedInput,
            updatedAt: new Date().toISOString(),
        };

        // Update in DynamoDB
        await repository.updateOpenHouseSession(
            user.id,
            sessionId,
            updates
        );

        revalidatePath('/open-house/sessions');
        revalidatePath(`/open-house/sessions/${sessionId}`);

        return { success: true };
    } catch (error) {
        console.error('Error updating open house session:', error);
        return {
            success: false,
            error: 'Failed to update session. Please try again.',
        };
    }
}

/**
 * Starts an open house session
 * Validates Requirements: 1.2
 */
export async function startOpenHouseSession(
    sessionId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get existing session
        const repository = getRepository();
        const session = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            sessionId
        );

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Validate state transition
        if (session.status !== SessionStatus.SCHEDULED) {
            return {
                success: false,
                error: `Cannot start a session with status: ${session.status}`,
            };
        }

        // Update session to active
        const now = new Date().toISOString();
        await repository.updateOpenHouseSession(
            user.id,
            sessionId,
            {
                status: SessionStatus.ACTIVE,
                actualStartTime: now,
                updatedAt: now,
            }
        );

        // Trigger webhook event for session started (Requirement 10.3)
        const { triggerWebhookEvent } = await import('./webhook-actions');
        const { WebhookEvent } = await import('@/lib/open-house/types');
        await triggerWebhookEvent(user.id, WebhookEvent.SESSION_STARTED, {
            sessionId,
            propertyAddress: session.propertyAddress,
            scheduledDate: session.scheduledDate,
            actualStartTime: now,
        });

        revalidatePath('/open-house/sessions');
        revalidatePath(`/open-house/sessions/${sessionId}`);

        return { success: true };
    } catch (error) {
        console.error('Error starting open house session:', error);
        return {
            success: false,
            error: 'Failed to start session. Please try again.',
        };
    }
}

/**
 * Ends an active open house session
 * Validates Requirements: 1.3
 */
export async function endOpenHouseSession(
    sessionId: string
): Promise<{
    success: boolean;
    duration?: number;
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get existing session
        const repository = getRepository();
        const session = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            sessionId
        );

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Validate state transition
        if (session.status !== SessionStatus.ACTIVE) {
            return {
                success: false,
                error: `Cannot end a session with status: ${session.status}`,
            };
        }

        if (!session.actualStartTime) {
            return {
                success: false,
                error: 'Session has no start time',
            };
        }

        // Calculate duration
        const now = new Date().toISOString();
        const startTime = new Date(session.actualStartTime);
        const endTime = new Date(now);
        const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

        // Update session to completed
        await repository.updateOpenHouseSession(
            user.id,
            sessionId,
            {
                status: SessionStatus.COMPLETED,
                actualEndTime: now,
                updatedAt: now,
            }
        );

        // Trigger webhook event for session ended (Requirement 10.3)
        const { triggerWebhookEvent } = await import('./webhook-actions');
        const { WebhookEvent } = await import('@/lib/open-house/types');
        await triggerWebhookEvent(user.id, WebhookEvent.SESSION_ENDED, {
            sessionId,
            propertyAddress: session.propertyAddress,
            scheduledDate: session.scheduledDate,
            actualStartTime: session.actualStartTime,
            actualEndTime: now,
            duration: durationMinutes,
            visitorCount: session.visitorCount,
            interestLevelDistribution: session.interestLevelDistribution,
        });

        revalidatePath('/open-house/sessions');
        revalidatePath(`/open-house/sessions/${sessionId}`);

        return {
            success: true,
            duration: durationMinutes,
        };
    } catch (error) {
        console.error('Error ending open house session:', error);
        return {
            success: false,
            error: 'Failed to end session. Please try again.',
        };
    }
}

/**
 * Gets all open house sessions for the current user
 */
export async function getOpenHouseSessions(
    status?: 'all' | 'scheduled' | 'active' | 'completed' | 'cancelled'
): Promise<{ sessions: OpenHouseSession[]; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { sessions: [], error: 'Not authenticated' };
        }

        const repository = getRepository();

        // If status is 'all' or undefined, get all sessions for the user
        if (!status || status === 'all') {
            const result = await repository.queryOpenHouseSessions<OpenHouseSession>(
                user.id,
                {
                    scanIndexForward: false, // Most recent first
                }
            );
            return { sessions: result.items };
        }

        // Otherwise, query by specific status using GSI1
        const result = await repository.queryOpenHouseSessionsByStatus<OpenHouseSession>(
            status,
            {
                scanIndexForward: false, // Most recent first
            }
        );

        // Filter by userId since GSI1 returns sessions from all users
        const userSessions = result.items.filter(
            (session) => session.userId === user.id
        );

        return { sessions: userSessions };
    } catch (error) {
        console.error('Error fetching open house sessions:', error);
        return {
            sessions: [],
            error: 'Failed to fetch sessions. Please try again.',
        };
    }
}

/**
 * Gets a single open house session by ID
 */
export async function getOpenHouseSession(
    sessionId: string
): Promise<{ session: OpenHouseSession | null; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { session: null, error: 'Not authenticated' };
        }

        const repository = getRepository();
        const session = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            sessionId
        );

        return { session };
    } catch (error) {
        console.error('Error fetching open house session:', error);
        return {
            session: null,
            error: 'Failed to fetch session. Please try again.',
        };
    }
}

/**
 * Deletes an open house session
 * Validates Requirements: 1.5
 */
export async function deleteOpenHouseSession(
    sessionId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // First, check if the session exists and is not active
        const session = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            sessionId
        );

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Prevent deletion of active sessions (Requirement 1.5)
        if (session.status === SessionStatus.ACTIVE) {
            return {
                success: false,
                error: 'Cannot delete an active session. Please end the session first.',
            };
        }

        // Delete the session
        await repository.deleteOpenHouseSession(user.id, sessionId);

        revalidatePath('/open-house/sessions');
        return { success: true };
    } catch (error) {
        console.error('Error deleting open house session:', error);
        return {
            success: false,
            error: 'Failed to delete session. Please try again.',
        };
    }
}

/**
 * Cancels a scheduled open house session
 * Validates Requirements: 9.5
 */
export async function cancelOpenHouseSession(
    sessionId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Get existing session
        const session = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            sessionId
        );

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Can only cancel scheduled or active sessions
        if (session.status === SessionStatus.COMPLETED) {
            return {
                success: false,
                error: 'Cannot cancel a completed session',
            };
        }

        if (session.status === SessionStatus.CANCELLED) {
            return {
                success: false,
                error: 'Session is already cancelled',
            };
        }

        // Update session to cancelled (preserves all data)
        const now = new Date().toISOString();
        await repository.updateOpenHouseSession(
            user.id,
            sessionId,
            {
                status: SessionStatus.CANCELLED,
                updatedAt: now,
            }
        );

        revalidatePath('/open-house/sessions');
        revalidatePath(`/open-house/sessions/${sessionId}`);

        return { success: true };
    } catch (error) {
        console.error('Error cancelling open house session:', error);
        return {
            success: false,
            error: 'Failed to cancel session. Please try again.',
        };
    }
}

/**
 * Starts a scheduled session early (before scheduled start time)
 * Validates Requirements: 9.4
 */
export async function startSessionEarly(
    sessionId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Get existing session
        const session = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            sessionId
        );

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Can only start scheduled sessions
        if (session.status !== SessionStatus.SCHEDULED) {
            return {
                success: false,
                error: `Cannot start a session with status: ${session.status}`,
            };
        }

        // Start the session with actual start time
        const now = new Date().toISOString();
        await repository.updateOpenHouseSession(
            user.id,
            sessionId,
            {
                status: SessionStatus.ACTIVE,
                actualStartTime: now,
                updatedAt: now,
            }
        );

        revalidatePath('/open-house/sessions');
        revalidatePath(`/open-house/sessions/${sessionId}`);

        return { success: true };
    } catch (error) {
        console.error('Error starting session early:', error);
        return {
            success: false,
            error: 'Failed to start session. Please try again.',
        };
    }
}

/**
 * Gets upcoming scheduled sessions that need reminders
 * Used by notification system
 * Validates Requirements: 9.2, 9.3
 */
export async function getUpcomingSessionsForReminders(): Promise<{
    sessions: OpenHouseSession[];
    error?: string;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { sessions: [], error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Get all scheduled sessions
        const result = await repository.queryOpenHouseSessionsByStatus<OpenHouseSession>(
            SessionStatus.SCHEDULED,
            {
                scanIndexForward: true, // Oldest first
            }
        );

        // Filter by userId and check if session is within reminder window
        const now = new Date();
        const reminderWindow = 60 * 60 * 1000; // 1 hour in milliseconds

        const upcomingSessions = result.items.filter((session) => {
            if (session.userId !== user.id) return false;

            const scheduledTime = new Date(session.scheduledStartTime);
            const timeDiff = scheduledTime.getTime() - now.getTime();

            // Session starts within the next hour
            return timeDiff > 0 && timeDiff <= reminderWindow;
        });

        return { sessions: upcomingSessions };
    } catch (error) {
        console.error('Error fetching upcoming sessions:', error);
        return {
            sessions: [],
            error: 'Failed to fetch upcoming sessions.',
        };
    }
}

/**
 * Checks in a visitor to an open house session
 * Validates Requirements: 2.1, 2.2, 2.3, 2.4
 */
export async function checkInVisitor(
    sessionId: string,
    input: z.infer<typeof import('@/lib/open-house/schemas').checkInVisitorInputSchema>
): Promise<{
    success: boolean;
    visitorId?: string;
    error?: string;
    errors?: Record<string, string[]>;
    code?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Validate input (Requirement 2.1, 2.2)
        const { checkInVisitorInputSchema } = await import('@/lib/open-house/schemas');
        const validation = checkInVisitorInputSchema.safeParse(input);
        if (!validation.success) {
            return {
                success: false,
                error: 'Validation failed',
                errors: formatZodErrors(validation.error),
            };
        }

        const validatedInput = validation.data;

        // Get the session to verify it exists and is active
        const repository = getRepository();
        const session = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            sessionId
        );

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Check if session allows check-ins (must be active)
        if (session.status !== SessionStatus.ACTIVE) {
            return {
                success: false,
                error: `Cannot check in visitors to a ${session.status} session. Please start the session first.`,
                code: 'SESSION_NOT_ACTIVE',
            };
        }

        // Check for duplicate email within the session (Requirement 2.4)
        const existingVisitors = await repository.queryVisitorsBySession<import('@/lib/open-house/types').Visitor>(
            user.id,
            sessionId
        );

        const duplicateEmail = existingVisitors.items.find(
            (visitor) => visitor.email.toLowerCase() === validatedInput.email.toLowerCase()
        );

        if (duplicateEmail) {
            return {
                success: false,
                error: 'A visitor with this email has already checked in to this session',
                code: 'DUPLICATE_EMAIL',
            };
        }

        // Generate unique visitor ID
        const visitorId = `visitor-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Create visitor data with check-in timestamp (Requirement 2.3)
        const now = new Date().toISOString();
        const visitorData: import('@/lib/open-house/types').Visitor = {
            visitorId,
            sessionId,
            userId: user.id,
            name: validatedInput.name,
            email: validatedInput.email,
            phone: validatedInput.phone,
            interestLevel: validatedInput.interestLevel,
            notes: validatedInput.notes,
            checkInTime: now, // Requirement 2.3
            followUpGenerated: false,
            followUpSent: false,
            source: validatedInput.source, // Requirement 2.1 - QR code source tracking
            createdAt: now,
            updatedAt: now,
        };

        // Store visitor in DynamoDB
        await repository.createVisitor(
            user.id,
            sessionId,
            visitorId,
            visitorData
        );

        // Update session statistics
        const newVisitorCount = session.visitorCount + 1;
        const newDistribution = { ...session.interestLevelDistribution };
        newDistribution[validatedInput.interestLevel] += 1;

        await repository.updateOpenHouseSession(
            user.id,
            sessionId,
            {
                visitorCount: newVisitorCount,
                interestLevelDistribution: newDistribution,
                updatedAt: now,
            }
        );

        // Automatic sequence enrollment (Requirement 15.2)
        // Find an active sequence matching the visitor's interest level
        const sequenceResult = await getActiveSequenceForInterestLevel(validatedInput.interestLevel);
        if (sequenceResult.sequence) {
            // Enroll the visitor in the sequence
            await enrollVisitorInSequence(visitorId, sessionId, sequenceResult.sequence.sequenceId);
        }

        // Trigger webhook event for visitor check-in (Requirement 10.3)
        const { triggerWebhookEvent } = await import('./webhook-actions');
        const { WebhookEvent } = await import('@/lib/open-house/types');
        await triggerWebhookEvent(user.id, WebhookEvent.VISITOR_CHECKED_IN, {
            sessionId,
            visitorId,
            visitor: {
                name: visitorData.name,
                email: visitorData.email,
                phone: visitorData.phone,
                interestLevel: visitorData.interestLevel,
                checkInTime: visitorData.checkInTime,
                source: visitorData.source,
            },
            session: {
                propertyAddress: session.propertyAddress,
                scheduledDate: session.scheduledDate,
            },
        });

        revalidatePath('/open-house/sessions');
        revalidatePath(`/open-house/sessions/${sessionId}`);
        revalidatePath(`/open-house/sessions/${sessionId}/visitors`);
        revalidatePath(`/open-house/sessions/${sessionId}/check-in`);

        return {
            success: true,
            visitorId,
        };
    } catch (error) {
        console.error('Error checking in visitor:', error);
        return {
            success: false,
            error: 'Failed to check in visitor. Please try again.',
        };
    }
}

/**
 * Gets all visitors for a session
 */
export async function getSessionVisitors(
    sessionId: string
): Promise<{
    visitors: import('@/lib/open-house/types').Visitor[];
    error?: string;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { visitors: [], error: 'Not authenticated' };
        }

        const repository = getRepository();
        const result = await repository.queryVisitorsBySession<import('@/lib/open-house/types').Visitor>(
            user.id,
            sessionId,
            {
                scanIndexForward: false, // Most recent first
            }
        );

        return { visitors: result.items };
    } catch (error) {
        console.error('Error fetching session visitors:', error);
        return {
            visitors: [],
            error: 'Failed to fetch visitors. Please try again.',
        };
    }
}

/**
 * Updates visitor information
 * Validates Requirements: 7.1, 7.2
 */
export async function updateVisitor(
    sessionId: string,
    visitorId: string,
    input: z.infer<typeof import('@/lib/open-house/schemas').updateVisitorInputSchema>
): Promise<{
    success: boolean;
    error?: string;
    errors?: Record<string, string[]>;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Validate input
        const { updateVisitorInputSchema } = await import('@/lib/open-house/schemas');
        const validation = updateVisitorInputSchema.safeParse(input);
        if (!validation.success) {
            return {
                success: false,
                error: 'Validation failed',
                errors: formatZodErrors(validation.error),
            };
        }

        const validatedInput = validation.data;

        // Get the session to verify it exists
        const repository = getRepository();
        const session = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            sessionId
        );

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Get existing visitor to verify it exists
        const existingVisitor = await repository.getVisitor<import('@/lib/open-house/types').Visitor>(
            user.id,
            sessionId,
            visitorId
        );

        if (!existingVisitor) {
            return { success: false, error: 'Visitor not found' };
        }

        // If email is being changed, check for duplicates
        if (validatedInput.email && validatedInput.email.toLowerCase() !== existingVisitor.email.toLowerCase()) {
            const allVisitors = await repository.queryVisitorsBySession<import('@/lib/open-house/types').Visitor>(
                user.id,
                sessionId
            );

            const newEmail = validatedInput.email.toLowerCase();
            const duplicateEmail = allVisitors.items.find(
                (visitor) =>
                    visitor.visitorId !== visitorId &&
                    visitor.email.toLowerCase() === newEmail
            );

            if (duplicateEmail) {
                return {
                    success: false,
                    error: 'A visitor with this email already exists in this session',
                };
            }
        }

        // If interest level is changing, we need to update session statistics
        const interestLevelChanged = validatedInput.interestLevel &&
            validatedInput.interestLevel !== existingVisitor.interestLevel;

        // Prepare updates with modification timestamp (Requirement 7.2)
        const now = new Date().toISOString();
        const updates: Partial<import('@/lib/open-house/types').Visitor> = {
            ...validatedInput,
            updatedAt: now,
        };

        // Update visitor in DynamoDB
        await repository.updateVisitor(
            user.id,
            sessionId,
            visitorId,
            updates
        );

        // Update session statistics if interest level changed (Requirement 7.4, 7.5)
        if (interestLevelChanged && validatedInput.interestLevel) {
            const newDistribution = { ...session.interestLevelDistribution };

            // Decrement old interest level
            newDistribution[existingVisitor.interestLevel] -= 1;

            // Increment new interest level
            newDistribution[validatedInput.interestLevel] += 1;

            await repository.updateOpenHouseSession(
                user.id,
                sessionId,
                {
                    interestLevelDistribution: newDistribution,
                    updatedAt: now,
                }
            );
        }

        revalidatePath('/open-house/sessions');
        revalidatePath(`/open-house/sessions/${sessionId}`);
        revalidatePath(`/open-house/sessions/${sessionId}/visitors`);

        return { success: true };
    } catch (error) {
        console.error('Error updating visitor:', error);
        return {
            success: false,
            error: 'Failed to update visitor. Please try again.',
        };
    }
}

/**
 * Appends notes to a visitor record
 * Validates Requirements: 7.3
 */
export async function appendVisitorNotes(
    sessionId: string,
    visitorId: string,
    newNotes: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Validate notes length
        if (!newNotes || newNotes.trim().length === 0) {
            return { success: false, error: 'Notes cannot be empty' };
        }

        if (newNotes.length > 1000) {
            return { success: false, error: 'Notes are too long (max 1000 characters)' };
        }

        // Get existing visitor
        const repository = getRepository();
        const existingVisitor = await repository.getVisitor<import('@/lib/open-house/types').Visitor>(
            user.id,
            sessionId,
            visitorId
        );

        if (!existingVisitor) {
            return { success: false, error: 'Visitor not found' };
        }

        // Append notes with timestamp (Requirement 7.3)
        const now = new Date().toISOString();
        const timestamp = new Date(now).toLocaleString();
        const noteWithTimestamp = `[${timestamp}] ${newNotes.trim()}`;

        const updatedNotes = existingVisitor.notes
            ? `${existingVisitor.notes}\n${noteWithTimestamp}`
            : noteWithTimestamp;

        // Update visitor with appended notes
        await repository.updateVisitor(
            user.id,
            sessionId,
            visitorId,
            {
                notes: updatedNotes,
                updatedAt: now,
            }
        );

        revalidatePath('/open-house/sessions');
        revalidatePath(`/open-house/sessions/${sessionId}`);
        revalidatePath(`/open-house/sessions/${sessionId}/visitors`);

        return { success: true };
    } catch (error) {
        console.error('Error appending visitor notes:', error);
        return {
            success: false,
            error: 'Failed to append notes. Please try again.',
        };
    }
}

/**
 * Deletes a visitor record
 * Validates Requirements: 7.1, 7.5
 */
export async function deleteVisitor(
    sessionId: string,
    visitorId: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Get the session to verify it exists
        const session = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            sessionId
        );

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Get existing visitor to get their interest level before deletion
        const existingVisitor = await repository.getVisitor<import('@/lib/open-house/types').Visitor>(
            user.id,
            sessionId,
            visitorId
        );

        if (!existingVisitor) {
            return { success: false, error: 'Visitor not found' };
        }

        // Delete the visitor
        await repository.deleteVisitor(user.id, sessionId, visitorId);

        // Update session statistics (Requirement 7.5)
        const now = new Date().toISOString();
        const newVisitorCount = Math.max(0, session.visitorCount - 1);
        const newDistribution = { ...session.interestLevelDistribution };
        newDistribution[existingVisitor.interestLevel] = Math.max(
            0,
            newDistribution[existingVisitor.interestLevel] - 1
        );

        await repository.updateOpenHouseSession(
            user.id,
            sessionId,
            {
                visitorCount: newVisitorCount,
                interestLevelDistribution: newDistribution,
                updatedAt: now,
            }
        );

        revalidatePath('/open-house/sessions');
        revalidatePath(`/open-house/sessions/${sessionId}`);
        revalidatePath(`/open-house/sessions/${sessionId}/visitors`);

        return { success: true };
    } catch (error) {
        console.error('Error deleting visitor:', error);
        return {
            success: false,
            error: 'Failed to delete visitor. Please try again.',
        };
    }
}

/**
 * Gets a single open house session by ID without authentication
 * This is used for public QR code check-in pages
 * Validates Requirements: 4.2
 */
export async function getPublicOpenHouseSession(
    sessionId: string
): Promise<{ session: OpenHouseSession | null; error?: string }> {
    try {
        const repository = getRepository();

        // Use GSI2 to query by sessionId without needing userId
        const session = await repository.getOpenHouseSessionBySessionId<OpenHouseSession>(
            sessionId
        );

        if (!session) {
            return { session: null, error: 'Session not found' };
        }

        return { session };
    } catch (error) {
        console.error('Error fetching public open house session:', error);
        return {
            session: null,
            error: 'Failed to fetch session. Please try again.',
        };
    }
}

// ============================================================================
// Follow-up Generation Actions
// ============================================================================

/**
 * Generates personalized follow-up content for a single visitor
 * Validates Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
export async function generateFollowUpContent(
    sessionId: string,
    visitorId: string,
    photoIds?: string[]
): Promise<{
    success: boolean;
    contentId?: string;
    content?: import('@/lib/open-house/types').FollowUpContent;
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Get the session
        const session = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            sessionId
        );

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Get the visitor
        const visitor = await repository.getVisitor<import('@/lib/open-house/types').Visitor>(
            user.id,
            sessionId,
            visitorId
        );

        if (!visitor) {
            return { success: false, error: 'Visitor not found' };
        }

        // Get user profile for agent information
        const userProfile = await repository.get<any>(user.id, 'PROFILE');

        if (!userProfile) {
            return { success: false, error: 'User profile not found' };
        }

        // Prepare input for Bedrock flow (Requirement 3.2)
        const { generateOpenHouseFollowUp } = await import('@/aws/bedrock/flows/generate-open-house-followup');

        const followUpInput = {
            visitor: {
                visitorId: visitor.visitorId,
                name: visitor.name,
                email: visitor.email,
                phone: visitor.phone,
                interestLevel: visitor.interestLevel,
                checkInTime: visitor.checkInTime,
                notes: visitor.notes || '',
            },
            session: {
                sessionId: session.sessionId,
                propertyAddress: session.propertyAddress,
                scheduledDate: session.scheduledDate,
                totalVisitors: session.visitorCount,
                highInterestCount: session.interestLevelDistribution.high,
            },
            property: {
                address: session.propertyAddress,
                price: undefined, // TODO: Get from property data if available
                bedrooms: undefined,
                bathrooms: undefined,
                squareFeet: undefined,
                features: undefined,
            },
            agent: {
                name: userProfile.name || userProfile.email || 'Agent',
                email: userProfile.email || user.email || '',
                phone: userProfile.phone || '',
                brokerage: userProfile.brokerage || undefined,
            },
            userId: user.id,
        };

        // Generate follow-up content using Bedrock (Requirements 3.1, 3.3, 3.4, 3.5)
        const generatedContent = await generateOpenHouseFollowUp(followUpInput);

        // Generate unique content ID
        const contentId = `content-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Store follow-up content in DynamoDB (Requirement 3.6)
        const now = new Date().toISOString();
        const { DeliveryStatus } = await import('@/lib/open-house/types');

        const followUpContent: import('@/lib/open-house/types').FollowUpContent = {
            contentId,
            sessionId,
            visitorId,
            userId: user.id,
            emailSubject: generatedContent.emailSubject,
            emailBody: generatedContent.emailBody,
            smsMessage: generatedContent.smsMessage || '',
            nextSteps: generatedContent.nextSteps,
            photoIds: photoIds && photoIds.length > 0 ? photoIds : undefined,
            generatedAt: now,
            deliveryStatus: DeliveryStatus.PENDING,
        };

        // Store in DynamoDB using the generic put method
        const timestamp = Date.now();
        await repository.put({
            PK: `USER#${user.id}`,
            SK: `FOLLOWUP#${sessionId}#${visitorId}`,
            EntityType: 'FollowUpContent',
            Data: followUpContent,
            CreatedAt: timestamp,
            UpdatedAt: timestamp,
        });

        // Update visitor to mark follow-up as generated (Requirement 3.6)
        await repository.updateVisitor(
            user.id,
            sessionId,
            visitorId,
            {
                followUpGenerated: true,
                updatedAt: now,
            }
        );

        revalidatePath('/open-house/sessions');
        revalidatePath(`/open-house/sessions/${sessionId}`);
        revalidatePath(`/open-house/sessions/${sessionId}/visitors`);

        return {
            success: true,
            contentId,
            content: followUpContent,
        };
    } catch (error) {
        console.error('Error generating follow-up content:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate follow-up content. Please try again.',
        };
    }
}

/**
 * Generates follow-up content for all visitors in a session
 * Validates Requirements: 3.7
 */
export async function generateBulkFollowUps(
    sessionId: string
): Promise<{
    success: boolean;
    results?: import('@/lib/open-house/types').FollowUpResult[];
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Get the session
        const session = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            sessionId
        );

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Get all visitors for the session
        const visitorsResult = await repository.queryVisitorsBySession<import('@/lib/open-house/types').Visitor>(
            user.id,
            sessionId
        );

        const visitors = visitorsResult.items;

        if (visitors.length === 0) {
            return {
                success: true,
                results: [],
            };
        }

        // Generate follow-up for each visitor (Requirement 3.7)
        const results: import('@/lib/open-house/types').FollowUpResult[] = [];

        for (const visitor of visitors) {
            // Skip if follow-up already generated
            if (visitor.followUpGenerated) {
                results.push({
                    visitorId: visitor.visitorId,
                    success: true,
                    contentId: undefined, // Already exists
                });
                continue;
            }

            // Generate follow-up for this visitor
            const result = await generateFollowUpContent(sessionId, visitor.visitorId);

            results.push({
                visitorId: visitor.visitorId,
                success: result.success,
                contentId: result.contentId,
                error: result.error,
            });

            // Add a small delay between generations to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        revalidatePath('/open-house/sessions');
        revalidatePath(`/open-house/sessions/${sessionId}`);
        revalidatePath(`/open-house/sessions/${sessionId}/visitors`);

        return {
            success: true,
            results,
        };
    } catch (error) {
        console.error('Error generating bulk follow-ups:', error);
        return {
            success: false,
            error: 'Failed to generate bulk follow-ups. Please try again.',
        };
    }
}

/**
 * Gets follow-up content for a visitor
 */
export async function getFollowUpContent(
    sessionId: string,
    visitorId: string
): Promise<{
    content: import('@/lib/open-house/types').FollowUpContent | null;
    error?: string;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { content: null, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Get follow-up content
        const content = await repository.get<import('@/lib/open-house/types').FollowUpContent>(
            `USER#${user.id}`,
            `FOLLOWUP#${sessionId}#${visitorId}`
        );

        return { content };
    } catch (error) {
        console.error('Error fetching follow-up content:', error);
        return {
            content: null,
            error: 'Failed to fetch follow-up content. Please try again.',
        };
    }
}

// ============================================================================
// Follow-up Sequence Management Actions
// ============================================================================

/**
 * Creates a new follow-up sequence
 * Validates Requirements: 15.1
 */
export async function createFollowUpSequence(
    input: z.infer<typeof import('@/lib/open-house/schemas').createFollowUpSequenceInputSchema>
): Promise<{
    success: boolean;
    sequenceId?: string;
    error?: string;
    errors?: Record<string, string[]>;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Validate input
        const { createFollowUpSequenceInputSchema } = await import('@/lib/open-house/schemas');
        const validation = createFollowUpSequenceInputSchema.safeParse(input);
        if (!validation.success) {
            return {
                success: false,
                error: 'Validation failed',
                errors: formatZodErrors(validation.error),
            };
        }

        const validatedInput = validation.data;

        // Generate unique sequence ID
        const sequenceId = `sequence-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Generate touchpoint IDs and prepare touchpoints
        const touchpoints: import('@/lib/open-house/types').FollowUpTouchpoint[] = validatedInput.touchpoints.map((tp) => ({
            touchpointId: `touchpoint-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            order: tp.order,
            delayMinutes: tp.delayMinutes,
            type: tp.type,
            templatePrompt: tp.templatePrompt,
        }));

        // Create sequence data (Requirement 15.1)
        const now = new Date().toISOString();
        const sequenceData: import('@/lib/open-house/types').FollowUpSequence = {
            sequenceId,
            userId: user.id,
            name: validatedInput.name,
            description: validatedInput.description,
            interestLevel: validatedInput.interestLevel,
            touchpoints,
            active: true, // New sequences are active by default
            createdAt: now,
            updatedAt: now,
        };

        // Store in DynamoDB
        const repository = getRepository();
        await repository.createFollowUpSequence(
            user.id,
            sequenceId,
            sequenceData
        );

        revalidatePath('/open-house/sequences');

        return {
            success: true,
            sequenceId,
        };
    } catch (error) {
        console.error('Error creating follow-up sequence:', error);
        return {
            success: false,
            error: 'Failed to create sequence. Please try again.',
        };
    }
}

/**
 * Updates an existing follow-up sequence
 * Validates Requirements: 15.4
 */
export async function updateFollowUpSequence(
    sequenceId: string,
    input: z.infer<typeof import('@/lib/open-house/schemas').updateFollowUpSequenceInputSchema>
): Promise<{
    success: boolean;
    error?: string;
    errors?: Record<string, string[]>;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Validate input
        const { updateFollowUpSequenceInputSchema } = await import('@/lib/open-house/schemas');
        const validation = updateFollowUpSequenceInputSchema.safeParse(input);
        if (!validation.success) {
            return {
                success: false,
                error: 'Validation failed',
                errors: formatZodErrors(validation.error),
            };
        }

        const validatedInput = validation.data;

        // Get existing sequence to verify ownership
        const repository = getRepository();
        const existingSequence = await repository.getFollowUpSequence<import('@/lib/open-house/types').FollowUpSequence>(
            user.id,
            sequenceId
        );

        if (!existingSequence) {
            return { success: false, error: 'Sequence not found' };
        }

        // Prepare updates
        const now = new Date().toISOString();
        const updates: Partial<import('@/lib/open-house/types').FollowUpSequence> = {
            updatedAt: now,
        };

        // Add non-touchpoint fields
        if (validatedInput.name !== undefined) {
            updates.name = validatedInput.name;
        }
        if (validatedInput.description !== undefined) {
            updates.description = validatedInput.description;
        }
        if (validatedInput.interestLevel !== undefined) {
            updates.interestLevel = validatedInput.interestLevel;
        }
        if (validatedInput.active !== undefined) {
            updates.active = validatedInput.active;
        }

        // If touchpoints are being updated, generate IDs for new touchpoints
        if (validatedInput.touchpoints) {
            const touchpoints: import('@/lib/open-house/types').FollowUpTouchpoint[] = validatedInput.touchpoints.map((tp) => ({
                touchpointId: `touchpoint-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                order: tp.order,
                delayMinutes: tp.delayMinutes,
                type: tp.type,
                templatePrompt: tp.templatePrompt,
            }));
            updates.touchpoints = touchpoints;
        }

        // Update in DynamoDB (Requirement 15.4 - modifications don't affect existing enrollments)
        await repository.updateFollowUpSequence(
            user.id,
            sequenceId,
            updates
        );

        revalidatePath('/open-house/sequences');

        return { success: true };
    } catch (error) {
        console.error('Error updating follow-up sequence:', error);
        return {
            success: false,
            error: 'Failed to update sequence. Please try again.',
        };
    }
}

/**
 * Deletes a follow-up sequence
 */
export async function deleteFollowUpSequence(
    sequenceId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Verify the sequence exists and belongs to the user
        const sequence = await repository.getFollowUpSequence<import('@/lib/open-house/types').FollowUpSequence>(
            user.id,
            sequenceId
        );

        if (!sequence) {
            return { success: false, error: 'Sequence not found' };
        }

        // Delete the sequence
        await repository.deleteFollowUpSequence(user.id, sequenceId);

        revalidatePath('/open-house/sequences');
        return { success: true };
    } catch (error) {
        console.error('Error deleting follow-up sequence:', error);
        return {
            success: false,
            error: 'Failed to delete sequence. Please try again.',
        };
    }
}

/**
 * Gets all follow-up sequences for the current user
 */
export async function getFollowUpSequences(): Promise<{
    sequences: import('@/lib/open-house/types').FollowUpSequence[];
    error?: string;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { sequences: [], error: 'Not authenticated' };
        }

        const repository = getRepository();
        const result = await repository.queryFollowUpSequences<import('@/lib/open-house/types').FollowUpSequence>(
            user.id,
            {
                scanIndexForward: false, // Most recent first
            }
        );

        return { sequences: result.items };
    } catch (error) {
        console.error('Error fetching follow-up sequences:', error);
        return {
            sequences: [],
            error: 'Failed to fetch sequences. Please try again.',
        };
    }
}

/**
 * Gets a single follow-up sequence by ID
 */
export async function getFollowUpSequence(
    sequenceId: string
): Promise<{
    sequence: import('@/lib/open-house/types').FollowUpSequence | null;
    error?: string;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { sequence: null, error: 'Not authenticated' };
        }

        const repository = getRepository();
        const sequence = await repository.getFollowUpSequence<import('@/lib/open-house/types').FollowUpSequence>(
            user.id,
            sequenceId
        );

        return { sequence };
    } catch (error) {
        console.error('Error fetching follow-up sequence:', error);
        return {
            sequence: null,
            error: 'Failed to fetch sequence. Please try again.',
        };
    }
}

// ==================== Sequence Enrollment Actions ====================

/**
 * Enrolls a visitor in a follow-up sequence
 * Validates Requirements: 15.2
 */
export async function enrollVisitorInSequence(
    visitorId: string,
    sessionId: string,
    sequenceId: string
): Promise<{
    success: boolean;
    enrollmentId?: string;
    error?: string;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Get the sequence to verify it exists and is active
        const sequence = await repository.getFollowUpSequence<import('@/lib/open-house/types').FollowUpSequence>(
            user.id,
            sequenceId
        );

        if (!sequence) {
            return { success: false, error: 'Sequence not found' };
        }

        if (!sequence.active) {
            return { success: false, error: 'Sequence is not active' };
        }

        // Check if visitor is already enrolled in this sequence
        const existingEnrollments = await repository.querySequenceEnrollmentsByVisitor<import('@/lib/open-house/types').SequenceEnrollment>(
            user.id,
            visitorId
        );

        const alreadyEnrolled = existingEnrollments.items.some(
            (enrollment) => enrollment.sequenceId === sequenceId && !enrollment.completedAt
        );

        if (alreadyEnrolled) {
            return { success: false, error: 'Visitor is already enrolled in this sequence' };
        }

        // Create enrollment
        const enrollmentId = `enrollment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const now = new Date().toISOString();

        // Calculate next touchpoint time (first touchpoint delay from check-in)
        const firstTouchpoint = sequence.touchpoints[0];
        const nextTouchpointAt = new Date(
            Date.now() + firstTouchpoint.delayMinutes * 60 * 1000
        ).toISOString();

        const enrollment: import('@/lib/open-house/types').SequenceEnrollment = {
            enrollmentId,
            sequenceId,
            visitorId,
            sessionId,
            userId: user.id,
            currentTouchpointIndex: 0,
            nextTouchpointAt,
            paused: false,
            createdAt: now,
            updatedAt: now,
        };

        await repository.createSequenceEnrollment(
            user.id,
            enrollmentId,
            enrollment,
            sequenceId,
            visitorId
        );

        // Update visitor record with enrollment ID
        const visitor = await repository.getVisitor<import('@/lib/open-house/types').Visitor>(
            user.id,
            sessionId,
            visitorId
        );

        if (visitor) {
            await repository.updateVisitor(
                user.id,
                sessionId,
                visitorId,
                {
                    sequenceEnrollmentId: enrollmentId,
                    updatedAt: now,
                }
            );
        }

        revalidatePath(`/open-house/sessions/${sessionId}/visitors`);

        return { success: true, enrollmentId };
    } catch (error) {
        console.error('Error enrolling visitor in sequence:', error);
        return {
            success: false,
            error: 'Failed to enroll visitor in sequence. Please try again.',
        };
    }
}

/**
 * Pauses a sequence enrollment
 * Validates Requirements: 15.5
 */
export async function pauseSequenceEnrollment(
    enrollmentId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Get the enrollment
        const enrollment = await repository.getSequenceEnrollment<import('@/lib/open-house/types').SequenceEnrollment>(
            user.id,
            enrollmentId
        );

        if (!enrollment) {
            return { success: false, error: 'Enrollment not found' };
        }

        // Update enrollment to paused
        const updatedEnrollment: import('@/lib/open-house/types').SequenceEnrollment = {
            ...enrollment,
            paused: true,
            updatedAt: new Date().toISOString(),
        };

        await repository.updateSequenceEnrollment(
            user.id,
            enrollmentId,
            updatedEnrollment,
            enrollment.sequenceId,
            enrollment.visitorId
        );

        revalidatePath(`/open-house/sessions/${enrollment.sessionId}/visitors`);

        return { success: true };
    } catch (error) {
        console.error('Error pausing sequence enrollment:', error);
        return {
            success: false,
            error: 'Failed to pause sequence enrollment. Please try again.',
        };
    }
}

/**
 * Resumes a paused sequence enrollment
 * Validates Requirements: 15.5
 */
export async function resumeSequenceEnrollment(
    enrollmentId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Get the enrollment
        const enrollment = await repository.getSequenceEnrollment<import('@/lib/open-house/types').SequenceEnrollment>(
            user.id,
            enrollmentId
        );

        if (!enrollment) {
            return { success: false, error: 'Enrollment not found' };
        }

        // Update enrollment to resumed
        const updatedEnrollment: import('@/lib/open-house/types').SequenceEnrollment = {
            ...enrollment,
            paused: false,
            updatedAt: new Date().toISOString(),
        };

        await repository.updateSequenceEnrollment(
            user.id,
            enrollmentId,
            updatedEnrollment,
            enrollment.sequenceId,
            enrollment.visitorId
        );

        revalidatePath(`/open-house/sessions/${enrollment.sessionId}/visitors`);

        return { success: true };
    } catch (error) {
        console.error('Error resuming sequence enrollment:', error);
        return {
            success: false,
            error: 'Failed to resume sequence enrollment. Please try again.',
        };
    }
}

/**
 * Gets all active sequence enrollments that need touchpoint execution
 * This is used by the background job to process pending touchpoints
 * Validates Requirements: 15.3
 */
export async function getPendingTouchpoints(): Promise<{
    enrollments: import('@/lib/open-house/types').SequenceEnrollment[];
    error?: string;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { enrollments: [], error: 'Not authenticated' };
        }

        const repository = getRepository();
        const now = new Date().toISOString();

        // Query all enrollments for the user
        const result = await repository.querySequenceEnrollments<import('@/lib/open-house/types').SequenceEnrollment>(
            user.id
        );

        // Filter for enrollments that are due for execution
        const pendingEnrollments = result.items.filter(
            (enrollment) =>
                !enrollment.paused &&
                !enrollment.completedAt &&
                enrollment.nextTouchpointAt &&
                enrollment.nextTouchpointAt <= now
        );

        return { enrollments: pendingEnrollments };
    } catch (error) {
        console.error('Error fetching pending touchpoints:', error);
        return {
            enrollments: [],
            error: 'Failed to fetch pending touchpoints. Please try again.',
        };
    }
}

/**
 * Executes a touchpoint for a sequence enrollment
 * Validates Requirements: 15.3
 */
export async function executeTouchpoint(
    enrollmentId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Get the enrollment
        const enrollment = await repository.getSequenceEnrollment<import('@/lib/open-house/types').SequenceEnrollment>(
            user.id,
            enrollmentId
        );

        if (!enrollment) {
            return { success: false, error: 'Enrollment not found' };
        }

        if (enrollment.paused) {
            return { success: false, error: 'Enrollment is paused' };
        }

        if (enrollment.completedAt) {
            return { success: false, error: 'Enrollment is already completed' };
        }

        // Get the sequence
        const sequence = await repository.getFollowUpSequence<import('@/lib/open-house/types').FollowUpSequence>(
            user.id,
            enrollment.sequenceId
        );

        if (!sequence) {
            return { success: false, error: 'Sequence not found' };
        }

        // Get the current touchpoint
        const currentTouchpoint = sequence.touchpoints[enrollment.currentTouchpointIndex];
        if (!currentTouchpoint) {
            return { success: false, error: 'Touchpoint not found' };
        }

        // Get visitor and session data
        const visitor = await repository.getVisitor<import('@/lib/open-house/types').Visitor>(
            user.id,
            enrollment.sessionId,
            enrollment.visitorId
        );

        if (!visitor) {
            return { success: false, error: 'Visitor not found' };
        }

        const session = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            enrollment.sessionId
        );

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Generate follow-up content using the touchpoint template prompt
        const followUpResult = await generateFollowUpContent(
            enrollment.sessionId,
            enrollment.visitorId
        );

        if (!followUpResult.success || !followUpResult.content) {
            return {
                success: false,
                error: 'Failed to generate follow-up content for touchpoint',
            };
        }

        // TODO: Send the follow-up (email or SMS based on touchpoint type)
        // This will be implemented in task 20

        // Update enrollment to next touchpoint
        const nextIndex = enrollment.currentTouchpointIndex + 1;
        const isComplete = nextIndex >= sequence.touchpoints.length;

        let nextTouchpointAt: string | undefined;
        if (!isComplete) {
            const nextTouchpoint = sequence.touchpoints[nextIndex];
            nextTouchpointAt = new Date(
                Date.now() + nextTouchpoint.delayMinutes * 60 * 1000
            ).toISOString();
        }

        const updatedEnrollment: import('@/lib/open-house/types').SequenceEnrollment = {
            ...enrollment,
            currentTouchpointIndex: nextIndex,
            nextTouchpointAt,
            completedAt: isComplete ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString(),
        };

        await repository.updateSequenceEnrollment(
            user.id,
            enrollmentId,
            updatedEnrollment,
            enrollment.sequenceId,
            enrollment.visitorId
        );

        revalidatePath(`/open-house/sessions/${enrollment.sessionId}/visitors`);

        return { success: true };
    } catch (error) {
        console.error('Error executing touchpoint:', error);
        return {
            success: false,
            error: 'Failed to execute touchpoint. Please try again.',
        };
    }
}

/**
 * Gets active sequences for a specific interest level
 * Used during visitor check-in to determine which sequence to enroll in
 */
export async function getActiveSequenceForInterestLevel(
    interestLevel: import('@/lib/open-house/types').InterestLevel | 'all'
): Promise<{
    sequence: import('@/lib/open-house/types').FollowUpSequence | null;
    error?: string;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { sequence: null, error: 'Not authenticated' };
        }

        const repository = getRepository();
        const result = await repository.queryFollowUpSequences<import('@/lib/open-house/types').FollowUpSequence>(
            user.id
        );

        // Find an active sequence matching the interest level
        // Priority: exact match > "all" > none
        const exactMatch = result.items.find(
            (seq) => seq.active && seq.interestLevel === interestLevel
        );

        if (exactMatch) {
            return { sequence: exactMatch };
        }

        const allMatch = result.items.find(
            (seq) => seq.active && seq.interestLevel === 'all'
        );

        return { sequence: allMatch || null };
    } catch (error) {
        console.error('Error fetching active sequence:', error);
        return {
            sequence: null,
            error: 'Failed to fetch active sequence. Please try again.',
        };
    }
}

// ============================================================================
// Follow-up Sending Actions
// ============================================================================

/**
 * Sends a follow-up email to a visitor
 * Validates Requirements: 13.1, 13.2, 13.3, 13.4
 */
export async function sendFollowUp(
    sessionId: string,
    visitorId: string,
    contentId?: string
): Promise<{
    success: boolean;
    deliveryStatus?: import('@/lib/open-house/types').DeliveryStatus;
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Get the visitor
        const visitor = await repository.getVisitor<import('@/lib/open-house/types').Visitor>(
            user.id,
            sessionId,
            visitorId
        );

        if (!visitor) {
            return { success: false, error: 'Visitor not found' };
        }

        // Get follow-up content (either provided contentId or fetch existing)
        let followUpContent: import('@/lib/open-house/types').FollowUpContent | null = null;

        if (contentId) {
            // Get specific content by ID
            followUpContent = await repository.get<import('@/lib/open-house/types').FollowUpContent>(
                `USER#${user.id}`,
                `FOLLOWUP#${sessionId}#${visitorId}`
            );
        } else {
            // Try to get existing follow-up content
            followUpContent = await repository.get<import('@/lib/open-house/types').FollowUpContent>(
                `USER#${user.id}`,
                `FOLLOWUP#${sessionId}#${visitorId}`
            );

            // If no content exists, generate it first
            if (!followUpContent) {
                const generateResult = await generateFollowUpContent(sessionId, visitorId);
                if (!generateResult.success || !generateResult.content) {
                    return {
                        success: false,
                        error: 'Failed to generate follow-up content. Please try again.',
                    };
                }
                followUpContent = generateResult.content;
            }
        }

        if (!followUpContent) {
            return { success: false, error: 'Follow-up content not found' };
        }

        // Get user profile for agent email settings (Requirement 13.1)
        const userProfile = await repository.get<any>(user.id, 'PROFILE');

        if (!userProfile) {
            return { success: false, error: 'User profile not found' };
        }

        // Get agent email from profile or user
        const agentEmail = userProfile.email || user.email;
        const agentName = userProfile.name || agentEmail || 'Agent';

        if (!agentEmail) {
            return {
                success: false,
                error: 'Agent email not configured. Please update your profile.',
            };
        }

        // Add engagement tracking to email body (Requirement 13.5)
        const {
            prepareTrackedEmailBody,
            isHtmlEmail,
            convertTextToHtml,
        } = await import('@/lib/open-house/engagement-tracking');

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // Ensure email body is HTML for tracking
        let emailBody = followUpContent.emailBody;
        if (!isHtmlEmail(emailBody)) {
            emailBody = convertTextToHtml(emailBody);
        }

        // Add tracking pixel and wrap links with tracking
        const trackedEmailBody = prepareTrackedEmailBody(
            emailBody,
            sessionId,
            visitorId,
            baseUrl
        );

        // Send email using AWS SES (Requirement 13.1)
        const { sendEmail: sendSESEmail } = await import('@/aws/ses/client');
        const { DeliveryStatus } = await import('@/lib/open-house/types');

        let messageId: string;
        let deliveryStatus: import('@/lib/open-house/types').DeliveryStatus;

        try {
            // Send the email with retry logic (Requirement 13.4)
            messageId = await withRetry(
                () => sendSESEmail(
                    visitor.email,
                    followUpContent!.emailSubject,
                    trackedEmailBody, // Use tracked email body
                    agentEmail,
                    true // isHtml
                ),
                {
                    maxRetries: 3,
                    backoffMs: 1000,
                    onRetry: (attempt, error) => {
                        console.warn(`Email send attempt ${attempt} failed:`, error);
                    }
                }
            );

            deliveryStatus = DeliveryStatus.SENT;
        } catch (sendError) {
            // Log error for retry (Requirement 13.4)
            console.error('Failed to send follow-up email after retries:', sendError);

            // Update content with failed status
            const now = new Date().toISOString();
            const timestamp = Date.now();

            await repository.put({
                PK: `USER#${user.id}`,
                SK: `FOLLOWUP#${sessionId}#${visitorId}`,
                EntityType: 'FollowUpContent',
                Data: {
                    ...followUpContent,
                    sentAt: now,
                    deliveryStatus: DeliveryStatus.FAILED,
                },
                CreatedAt: timestamp,
                UpdatedAt: timestamp,
            });

            return {
                success: false,
                deliveryStatus: DeliveryStatus.FAILED,
                error: sendError instanceof Error ? sendError.message : 'Failed to send email. Please try again.',
            };
        }

        // Update follow-up content with send tracking (Requirement 13.3)
        const now = new Date().toISOString();
        const timestamp = Date.now();

        await repository.put({
            PK: `USER#${user.id}`,
            SK: `FOLLOWUP#${sessionId}#${visitorId}`,
            EntityType: 'FollowUpContent',
            Data: {
                ...followUpContent,
                sentAt: now,
                deliveryStatus,
            },
            CreatedAt: timestamp,
            UpdatedAt: timestamp,
        });

        // Update visitor record to mark follow-up as sent (Requirement 13.3)
        await repository.updateVisitor(
            user.id,
            sessionId,
            visitorId,
            {
                followUpSent: true,
                followUpSentAt: now,
                updatedAt: now,
            }
        );

        revalidatePath('/open-house/sessions');
        revalidatePath(`/open-house/sessions/${sessionId}`);
        revalidatePath(`/open-house/sessions/${sessionId}/visitors`);

        return {
            success: true,
            deliveryStatus,
        };
    } catch (error) {
        console.error('Error sending follow-up:', error);
        return {
            success: false,
            error: 'Failed to send follow-up. Please try again.',
        };
    }
}

/**
 * Sends follow-up emails to multiple visitors with personalization
 * Validates Requirements: 13.2, 13.3, 13.4
 */
export async function sendBulkFollowUps(
    sessionId: string,
    visitorIds: string[]
): Promise<{
    success: boolean;
    results?: Array<{
        visitorId: string;
        success: boolean;
        deliveryStatus?: import('@/lib/open-house/types').DeliveryStatus;
        error?: string;
    }>;
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        if (visitorIds.length === 0) {
            return {
                success: true,
                results: [],
            };
        }

        // Send follow-up to each visitor individually with personalization (Requirement 13.2)
        const results: Array<{
            visitorId: string;
            success: boolean;
            deliveryStatus?: import('@/lib/open-house/types').DeliveryStatus;
            error?: string;
        }> = [];

        for (const visitorId of visitorIds) {
            // Send individual follow-up
            const result = await sendFollowUp(sessionId, visitorId);

            results.push({
                visitorId,
                success: result.success,
                deliveryStatus: result.deliveryStatus,
                error: result.error,
            });

            // Add a small delay between sends to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        revalidatePath('/open-house/sessions');
        revalidatePath(`/open-house/sessions/${sessionId}`);
        revalidatePath(`/open-house/sessions/${sessionId}/visitors`);

        return {
            success: true,
            results,
        };
    } catch (error) {
        console.error('Error sending bulk follow-ups:', error);
        return {
            success: false,
            error: 'Failed to send bulk follow-ups. Please try again.',
        };
    }
}

/**
 * Retries sending a failed follow-up
 * Validates Requirements: 13.4
 */
export async function retryFailedFollowUp(
    sessionId: string,
    visitorId: string
): Promise<{
    success: boolean;
    deliveryStatus?: import('@/lib/open-house/types').DeliveryStatus;
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Get follow-up content
        const followUpContent = await repository.get<import('@/lib/open-house/types').FollowUpContent>(
            `USER#${user.id}`,
            `FOLLOWUP#${sessionId}#${visitorId}`
        );

        if (!followUpContent) {
            return { success: false, error: 'Follow-up content not found' };
        }

        const { DeliveryStatus } = await import('@/lib/open-house/types');

        // Only retry if status is FAILED
        if (followUpContent.deliveryStatus !== DeliveryStatus.FAILED) {
            return {
                success: false,
                error: 'Follow-up is not in failed status',
            };
        }

        // Attempt to send again
        const result = await sendFollowUp(sessionId, visitorId);

        return result;
    } catch (error) {
        console.error('Error retrying failed follow-up:', error);
        return {
            success: false,
            error: 'Failed to retry follow-up. Please try again.',
        };
    }
}

/**
 * Gets all follow-up content for a session with delivery status
 */
export async function getSessionFollowUps(
    sessionId: string
): Promise<{
    followUps: Array<{
        visitor: import('@/lib/open-house/types').Visitor;
        content: import('@/lib/open-house/types').FollowUpContent | null;
    }>;
    error?: string;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { followUps: [], error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Get all visitors for the session
        const visitorsResult = await repository.queryVisitorsBySession<import('@/lib/open-house/types').Visitor>(
            user.id,
            sessionId
        );

        const visitors = visitorsResult.items;

        // Get follow-up content for each visitor
        const followUps = await Promise.all(
            visitors.map(async (visitor) => {
                const content = await repository.get<import('@/lib/open-house/types').FollowUpContent>(
                    `USER#${user.id}`,
                    `FOLLOWUP#${sessionId}#${visitor.visitorId}`
                );

                return {
                    visitor,
                    content,
                };
            })
        );

        return { followUps };
    } catch (error) {
        console.error('Error fetching session follow-ups:', error);
        return {
            followUps: [],
            error: 'Failed to fetch follow-ups. Please try again.',
        };
    }
}

/**
 * Records email engagement (opens, clicks)
 * Validates Requirements: 13.5
 */
export async function recordFollowUpEngagement(
    sessionId: string,
    visitorId: string,
    engagementType: 'open' | 'click'
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Get follow-up content
        const followUpContent = await repository.get<import('@/lib/open-house/types').FollowUpContent>(
            `USER#${user.id}`,
            `FOLLOWUP#${sessionId}#${visitorId}`
        );

        if (!followUpContent) {
            return { success: false, error: 'Follow-up content not found' };
        }

        // Update engagement timestamp
        const now = new Date().toISOString();
        const timestamp = Date.now();

        const updates: Partial<import('@/lib/open-house/types').FollowUpContent> = {};

        if (engagementType === 'open' && !followUpContent.openedAt) {
            updates.openedAt = now;
        } else if (engagementType === 'click' && !followUpContent.clickedAt) {
            updates.clickedAt = now;
        }

        if (Object.keys(updates).length > 0) {
            await repository.put({
                PK: `USER#${user.id}`,
                SK: `FOLLOWUP#${sessionId}#${visitorId}`,
                EntityType: 'FollowUpContent',
                Data: {
                    ...followUpContent,
                    ...updates,
                },
                CreatedAt: timestamp,
                UpdatedAt: timestamp,
            });
        }

        return { success: true };
    } catch (error) {
        console.error('Error recording follow-up engagement:', error);
        return {
            success: false,
            error: 'Failed to record engagement. Please try again.',
        };
    }
}

// ============================================================================
// Analytics Actions
// ============================================================================

/**
 * Get session-level analytics
 * Validates Requirements: 5.4
 */
export async function getSessionAnalytics(
    sessionId: string
): Promise<{
    success: boolean;
    data?: import('@/lib/open-house/types').SessionAnalytics;
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Get session
        const session = await repository.get<OpenHouseSession>(
            `USER#${user.id}`,
            `OPENHOUSE#${sessionId}`
        );

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Get all visitors for this session
        const visitorsResult = await repository.queryVisitorsBySessionGSI<import('@/lib/open-house/types').Visitor>(
            sessionId,
            { limit: 1000 } // Get all visitors
        );

        const visitors = visitorsResult.items;

        // Calculate analytics using utility functions
        const { calculateSessionAnalytics } = await import('@/lib/open-house-analytics');
        const analytics = calculateSessionAnalytics(session, visitors);

        return {
            success: true,
            data: analytics,
        };
    } catch (error) {
        console.error('Error getting session analytics:', error);
        return {
            success: false,
            error: 'Failed to load analytics. Please try again.',
        };
    }
}

/**
 * Get dashboard analytics with date range filters
 * Validates Requirements: 5.1, 5.3, 5.4, 5.5
 */
export async function getDashboardAnalytics(
    filters?: {
        startDate?: string;
        endDate?: string;
        propertyId?: string;
        status?: string;
    }
): Promise<{
    success: boolean;
    data?: import('@/lib/open-house/types').DashboardAnalytics;
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Query all sessions for the user
        const sessionsResult = await repository.queryOpenHouseSessions<OpenHouseSession>(
            user.id,
            { limit: 1000 } // Get all sessions
        );

        let sessions = sessionsResult.items;

        // Apply filters
        const {
            filterSessionsByDateRange,
        } = await import('@/lib/open-house-analytics');

        // Filter by date range
        if (filters?.startDate || filters?.endDate) {
            sessions = filterSessionsByDateRange(
                sessions,
                filters.startDate,
                filters.endDate
            );
        }

        // Filter by status
        if (filters?.status) {
            sessions = sessions.filter(s => s.status === filters.status);
        }

        // Filter by property ID
        if (filters?.propertyId) {
            sessions = sessions.filter(s => s.propertyId === filters.propertyId);
        }

        // Get all visitors for these sessions
        const allVisitors: import('@/lib/open-house/types').Visitor[] = [];

        for (const session of sessions) {
            const visitorsResult = await repository.queryVisitorsBySessionGSI<import('@/lib/open-house/types').Visitor>(
                session.sessionId,
                { limit: 1000 }
            );
            allVisitors.push(...visitorsResult.items);
        }

        // Apply date range filter to visitors if specified
        let filteredVisitors = allVisitors;
        if (filters?.startDate || filters?.endDate) {
            const { filterVisitorsByDateRange } = await import('@/lib/open-house-analytics');
            filteredVisitors = filterVisitorsByDateRange(
                allVisitors,
                filters.startDate,
                filters.endDate
            );
        }

        // Calculate complete dashboard analytics
        const { calculateCompleteDashboardAnalytics } = await import('@/lib/open-house-analytics');
        const analytics = calculateCompleteDashboardAnalytics(sessions, filteredVisitors);

        return {
            success: true,
            data: analytics,
        };
    } catch (error) {
        console.error('Error getting dashboard analytics:', error);
        return {
            success: false,
            error: 'Failed to load dashboard analytics. Please try again.',
        };
    }
}

/**
 * Get property performance comparison
 * Compares multiple properties based on their open house performance
 * Validates Requirements: 5.5
 */
export async function getPropertyPerformanceComparison(
    propertyAddresses?: string[],
    dateRange?: {
        startDate?: string;
        endDate?: string;
    }
): Promise<{
    success: boolean;
    data?: import('@/lib/open-house/types').PropertyPerformance[];
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Query all sessions for the user
        const sessionsResult = await repository.queryOpenHouseSessions<OpenHouseSession>(
            user.id,
            { limit: 1000 }
        );

        let sessions = sessionsResult.items;

        // Apply date range filter
        if (dateRange?.startDate || dateRange?.endDate) {
            const { filterSessionsByDateRange } = await import('@/lib/open-house-analytics');
            sessions = filterSessionsByDateRange(
                sessions,
                dateRange.startDate,
                dateRange.endDate
            );
        }

        // Filter by specific properties if provided
        if (propertyAddresses && propertyAddresses.length > 0) {
            sessions = sessions.filter(s =>
                propertyAddresses.includes(s.propertyAddress)
            );
        }

        // Get all visitors for these sessions
        const visitorsBySession = new Map<string, import('@/lib/open-house/types').Visitor[]>();

        for (const session of sessions) {
            const visitorsResult = await repository.queryVisitorsBySessionGSI<import('@/lib/open-house/types').Visitor>(
                session.sessionId,
                { limit: 1000 }
            );
            visitorsBySession.set(session.sessionId, visitorsResult.items);
        }

        // Calculate property performance
        const { calculateTopPerformingProperties } = await import('@/lib/open-house-analytics');
        const propertyPerformance = calculateTopPerformingProperties(
            sessions,
            visitorsBySession,
            propertyAddresses ? propertyAddresses.length : 10 // Return all if specific properties requested
        );

        return {
            success: true,
            data: propertyPerformance,
        };
    } catch (error) {
        console.error('Error getting property performance comparison:', error);
        return {
            success: false,
            error: 'Failed to load property performance. Please try again.',
        };
    }
}

/**
 * Get top performing properties
 * Returns the top N properties by visitor count
 * Validates Requirements: 5.5
 */
export async function getTopPerformingProperties(
    limit: number = 5,
    dateRange?: {
        startDate?: string;
        endDate?: string;
    }
): Promise<{
    success: boolean;
    data?: import('@/lib/open-house/types').PropertyPerformance[];
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Query all sessions for the user
        const sessionsResult = await repository.queryOpenHouseSessions<OpenHouseSession>(
            user.id,
            { limit: 1000 }
        );

        let sessions = sessionsResult.items;

        // Apply date range filter
        if (dateRange?.startDate || dateRange?.endDate) {
            const { filterSessionsByDateRange } = await import('@/lib/open-house-analytics');
            sessions = filterSessionsByDateRange(
                sessions,
                dateRange.startDate,
                dateRange.endDate
            );
        }

        // Get all visitors for these sessions
        const visitorsBySession = new Map<string, import('@/lib/open-house/types').Visitor[]>();

        for (const session of sessions) {
            const visitorsResult = await repository.queryVisitorsBySessionGSI<import('@/lib/open-house/types').Visitor>(
                session.sessionId,
                { limit: 1000 }
            );
            visitorsBySession.set(session.sessionId, visitorsResult.items);
        }

        // Calculate top performing properties
        const { calculateTopPerformingProperties } = await import('@/lib/open-house-analytics');
        const topProperties = calculateTopPerformingProperties(
            sessions,
            visitorsBySession,
            limit
        );

        return {
            success: true,
            data: topProperties,
        };
    } catch (error) {
        console.error('Error getting top performing properties:', error);
        return {
            success: false,
            error: 'Failed to load top performing properties. Please try again.',
        };
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Retry utility with exponential backoff
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries: number;
        backoffMs: number;
        onRetry?: (attempt: number, error: any) => void;
    }
): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (attempt < options.maxRetries) {
                // Call onRetry callback if provided
                if (options.onRetry) {
                    options.onRetry(attempt, error);
                }

                // Wait with exponential backoff
                const delay = options.backoffMs * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Exports a session summary as a PDF report
 * Validates Requirements: 6.1
 * 
 * Generates a comprehensive PDF report containing:
 * - Session details (property, date/time, duration)
 * - Statistics (visitor count, interest distribution)
 * - Complete visitor list with contact information
 * - Session notes
 * 
 * The PDF is uploaded to S3 and a presigned download URL is returned.
 * 
 * @param sessionId - The ID of the session to export
 * @returns Success status and download URL, or error message
 */
export async function exportSessionPDF(
    sessionId: string
): Promise<{
    success: boolean;
    url?: string;
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get session data
        const repository = getRepository();
        const session = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            sessionId
        );

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Get all visitors for the session
        const visitorsResult = await repository.queryVisitorsBySession<import('@/lib/open-house/types').Visitor>(
            user.id,
            sessionId,
            {
                scanIndexForward: true, // Chronological order
                limit: 1000, // Support up to 1000 visitors
            }
        );

        const visitors = visitorsResult.items;

        // Generate PDF
        const { generateSessionPDF } = await import('@/lib/open-house/pdf-export');
        const pdfBuffer = generateSessionPDF(session, visitors);

        // Upload to S3
        const { uploadFile, getPresignedDownloadUrl } = await import('@/aws/s3/client');

        // Generate S3 key with timestamp to avoid collisions
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const s3Key = `open-house-exports/${user.id}/${sessionId}/session-report-${timestamp}.pdf`;

        // Upload PDF to S3
        await uploadFile(
            s3Key,
            pdfBuffer,
            'application/pdf',
            {
                sessionId,
                userId: user.id,
                exportedAt: new Date().toISOString(),
            }
        );

        // Generate presigned download URL (valid for 1 hour)
        const filename = `open-house-${session.propertyAddress.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.pdf`;
        const downloadUrl = await getPresignedDownloadUrl(
            s3Key,
            filename,
            3600 // 1 hour expiration
        );

        return {
            success: true,
            url: downloadUrl,
        };
    } catch (error) {
        console.error('Error exporting session PDF:', error);
        return {
            success: false,
            error: 'Failed to generate PDF export. Please try again.',
        };
    }
}

/**
 * Export Visitor CSV
 * 
 * Generates a CSV file containing all visitor information for a session.
 * Supports permission-based field filtering.
 * 
 * Validates Requirements: 6.2, 6.3
 * 
 * The CSV includes:
 * - Visitor ID
 * - Name, email, phone
 * - Interest level
 * - Check-in time and source
 * - Follow-up status
 * - Notes
 * - Timestamps
 * 
 * The CSV is uploaded to S3 and a presigned download URL is returned.
 * 
 * @param sessionId - The ID of the session to export
 * @param fields - Optional field configuration for permission-based filtering
 * @returns Success status and download URL, or error message
 */
export async function exportVisitorCSV(
    sessionId: string,
    fields?: Partial<import('@/lib/open-house/csv-export').CsvExportFields>
): Promise<{
    success: boolean;
    url?: string;
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get session data (to verify it exists and belongs to user)
        const repository = getRepository();
        const session = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            sessionId
        );

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Get all visitors for the session
        const visitorsResult = await repository.queryVisitorsBySession<import('@/lib/open-house/types').Visitor>(
            user.id,
            sessionId,
            {
                scanIndexForward: true, // Chronological order
                limit: 1000, // Support up to 1000 visitors
            }
        );

        const visitors = visitorsResult.items;

        // Generate CSV
        const { generateVisitorCSVBuffer } = await import('@/lib/open-house/csv-export');
        const csvBuffer = generateVisitorCSVBuffer(visitors, fields);

        // Upload to S3
        const { uploadFile, getPresignedDownloadUrl } = await import('@/aws/s3/client');

        // Generate S3 key with timestamp to avoid collisions
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const s3Key = `open-house-exports/${user.id}/${sessionId}/visitors-${timestamp}.csv`;

        // Upload CSV to S3
        await uploadFile(
            s3Key,
            csvBuffer,
            'text/csv',
            {
                sessionId,
                userId: user.id,
                exportedAt: new Date().toISOString(),
            }
        );

        // Generate presigned download URL (valid for 1 hour)
        const filename = `open-house-visitors-${session.propertyAddress.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.csv`;
        const downloadUrl = await getPresignedDownloadUrl(
            s3Key,
            filename,
            3600 // 1 hour expiration
        );

        return {
            success: true,
            url: downloadUrl,
        };
    } catch (error) {
        console.error('Error exporting visitor CSV:', error);
        return {
            success: false,
            error: 'Failed to generate CSV export. Please try again.',
        };
    }
}

// ============================================================================
// Session Template Management Actions
// ============================================================================

/**
 * Creates a new session template
 * 
 * Validates Requirements: 14.1
 * 
 * Session templates allow agents to save common open house configurations
 * for quick reuse. Templates store property type, typical duration, and
 * custom fields that can be used to pre-populate session creation forms.
 * 
 * @param input - Template configuration data
 * @returns Success status and template ID, or error message
 */
export async function createSessionTemplate(
    input: z.infer<typeof import('@/lib/open-house/schemas').createSessionTemplateInputSchema>
): Promise<{
    success: boolean;
    templateId?: string;
    error?: string;
    errors?: Record<string, string[]>;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Validate input
        const { createSessionTemplateInputSchema, formatZodErrors } = await import('@/lib/open-house/schemas');
        const validation = createSessionTemplateInputSchema.safeParse(input);
        if (!validation.success) {
            return {
                success: false,
                error: 'Validation failed',
                errors: formatZodErrors(validation.error),
            };
        }

        const validatedInput = validation.data;

        // Generate unique template ID
        const templateId = `template-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Create template data
        const now = new Date().toISOString();
        const templateData: import('@/lib/open-house/types').SessionTemplate = {
            templateId,
            userId: user.id,
            name: validatedInput.name,
            description: validatedInput.description,
            propertyType: validatedInput.propertyType,
            typicalDuration: validatedInput.typicalDuration,
            customFields: validatedInput.customFields || {},
            usageCount: 0,
            createdAt: now,
            updatedAt: now,
        };

        // Store in DynamoDB
        const repository = getRepository();
        await repository.createSessionTemplate(
            user.id,
            templateId,
            templateData
        );

        revalidatePath('/open-house/templates');

        return {
            success: true,
            templateId,
        };
    } catch (error) {
        console.error('Error creating session template:', error);
        return {
            success: false,
            error: 'Failed to create template. Please try again.',
        };
    }
}

/**
 * Updates an existing session template
 * 
 * Validates Requirements: 14.3
 * 
 * Template modifications only affect future sessions created from the template.
 * Existing sessions created from the template remain unchanged, ensuring
 * historical data integrity.
 * 
 * @param templateId - The ID of the template to update
 * @param updates - Partial template data to update
 * @returns Success status or error message
 */
export async function updateSessionTemplate(
    templateId: string,
    updates: z.infer<typeof import('@/lib/open-house/schemas').updateSessionTemplateInputSchema>
): Promise<{
    success: boolean;
    error?: string;
    errors?: Record<string, string[]>;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Validate input
        const { updateSessionTemplateInputSchema, formatZodErrors } = await import('@/lib/open-house/schemas');
        const validation = updateSessionTemplateInputSchema.safeParse(updates);
        if (!validation.success) {
            return {
                success: false,
                error: 'Validation failed',
                errors: formatZodErrors(validation.error),
            };
        }

        const validatedUpdates = validation.data;

        // Verify template exists and belongs to user
        const repository = getRepository();
        const existingTemplate = await repository.getSessionTemplate<import('@/lib/open-house/types').SessionTemplate>(
            user.id,
            templateId
        );

        if (!existingTemplate) {
            return {
                success: false,
                error: 'Template not found',
            };
        }

        // Update template with timestamp
        const updateData = {
            ...validatedUpdates,
            updatedAt: new Date().toISOString(),
        };

        await repository.updateSessionTemplate(
            user.id,
            templateId,
            updateData
        );

        revalidatePath('/open-house/templates');

        return {
            success: true,
        };
    } catch (error) {
        console.error('Error updating session template:', error);
        return {
            success: false,
            error: 'Failed to update template. Please try again.',
        };
    }
}

/**
 * Deletes a session template
 * 
 * Validates Requirements: 14.5
 * 
 * Deleting a template removes it from the user's template list but preserves
 * historical data from sessions that were created using the template. The
 * templateId reference in existing sessions remains intact for tracking purposes.
 * 
 * @param templateId - The ID of the template to delete
 * @returns Success status or error message
 */
export async function deleteSessionTemplate(
    templateId: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Verify template exists and belongs to user
        const repository = getRepository();
        const existingTemplate = await repository.getSessionTemplate<import('@/lib/open-house/types').SessionTemplate>(
            user.id,
            templateId
        );

        if (!existingTemplate) {
            return {
                success: false,
                error: 'Template not found',
            };
        }

        // Delete template from DynamoDB
        await repository.deleteSessionTemplate(user.id, templateId);

        revalidatePath('/open-house/templates');

        return {
            success: true,
        };
    } catch (error) {
        console.error('Error deleting session template:', error);
        return {
            success: false,
            error: 'Failed to delete template. Please try again.',
        };
    }
}

/**
 * Gets a single session template by ID
 * 
 * @param templateId - The ID of the template to retrieve
 * @returns Template data or null if not found
 */
export async function getSessionTemplate(
    templateId: string
): Promise<{
    success: boolean;
    template?: import('@/lib/open-house/types').SessionTemplate;
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get template from DynamoDB
        const repository = getRepository();
        const template = await repository.getSessionTemplate<import('@/lib/open-house/types').SessionTemplate>(
            user.id,
            templateId
        );

        if (!template) {
            return {
                success: false,
                error: 'Template not found',
            };
        }

        return {
            success: true,
            template,
        };
    } catch (error) {
        console.error('Error getting session template:', error);
        return {
            success: false,
            error: 'Failed to retrieve template. Please try again.',
        };
    }
}

/**
 * Lists all session templates for the current user
 * 
 * @returns List of templates or error message
 */
export async function listSessionTemplates(): Promise<{
    success: boolean;
    templates?: import('@/lib/open-house/types').SessionTemplate[];
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Query all templates for user
        const repository = getRepository();
        const result = await repository.querySessionTemplates<import('@/lib/open-house/types').SessionTemplate>(
            user.id,
            {
                scanIndexForward: false, // Most recent first
                limit: 100, // Reasonable limit for templates
            }
        );

        return {
            success: true,
            templates: result.items,
        };
    } catch (error) {
        console.error('Error listing session templates:', error);
        return {
            success: false,
            error: 'Failed to retrieve templates. Please try again.',
        };
    }
}

/**
 * Increments the usage count for a template
 * 
 * This is called internally when a session is created from a template.
 * It tracks how many times each template has been used.
 * 
 * @param templateId - The ID of the template to increment
 */
export async function incrementTemplateUsage(
    templateId: string
): Promise<void> {
    try {
        const user = await getCurrentUserServer();
        if (!user) return;

        const repository = getRepository();
        const template = await repository.getSessionTemplate<import('@/lib/open-house/types').SessionTemplate>(
            user.id,
            templateId
        );

        if (template) {
            await repository.updateSessionTemplate(
                user.id,
                templateId,
                {
                    usageCount: (template.usageCount || 0) + 1,
                    updatedAt: new Date().toISOString(),
                }
            );
        }
    } catch (error) {
        console.error('Error incrementing template usage:', error);
        // Don't throw - this is a non-critical operation
    }
}

/**
 * Updates template performance metrics based on completed sessions
 * 
 * Validates Requirements: 14.4
 * 
 * This function calculates and updates the averageVisitors and averageInterestLevel
 * for a template based on all completed sessions that were created from it.
 * 
 * @param templateId - The ID of the template to update metrics for
 */
export async function updateTemplateMetrics(
    templateId: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const repository = getRepository();

        // Get the template
        const template = await repository.getSessionTemplate<import('@/lib/open-house/types').SessionTemplate>(
            user.id,
            templateId
        );

        if (!template) {
            return { success: false, error: 'Template not found' };
        }

        // Get all sessions for the user
        const sessionsResult = await repository.queryOpenHouseSessions<OpenHouseSession>(
            user.id,
            {
                scanIndexForward: false,
            }
        );

        // Filter sessions created from this template
        const templateSessions = sessionsResult.items.filter(
            (session) => session.templateId === templateId
        );

        if (templateSessions.length === 0) {
            // No sessions yet, keep metrics undefined
            return { success: true };
        }

        // Calculate average visitors
        const totalVisitors = templateSessions.reduce(
            (sum, session) => sum + session.visitorCount,
            0
        );
        const averageVisitors = totalVisitors / templateSessions.length;

        // Calculate average interest level (low=1, medium=2, high=3)
        let totalInterestScore = 0;
        let totalVisitorsWithInterest = 0;

        templateSessions.forEach((session) => {
            const dist = session.interestLevelDistribution;
            totalInterestScore += dist.low * 1 + dist.medium * 2 + dist.high * 3;
            totalVisitorsWithInterest += dist.low + dist.medium + dist.high;
        });

        const averageInterestLevel =
            totalVisitorsWithInterest > 0
                ? totalInterestScore / totalVisitorsWithInterest
                : undefined;

        // Update template with calculated metrics
        await repository.updateSessionTemplate(
            user.id,
            templateId,
            {
                averageVisitors,
                averageInterestLevel,
                updatedAt: new Date().toISOString(),
            }
        );

        revalidatePath('/open-house/templates');

        return { success: true };
    } catch (error) {
        console.error('Error updating template metrics:', error);
        return {
            success: false,
            error: 'Failed to update template metrics.',
        };
    }
}

// ============================================================================
// Photo Management Actions
// ============================================================================

/**
 * Uploads a photo and associates it with an open house session
 * Generates AI description for the photo
 * Validates Requirements: 12.1, 12.2
 * 
 * @param sessionId - The ID of the session to associate the photo with
 * @param file - The photo file as Buffer or base64 string
 * @param contentType - The MIME type of the file
 * @returns Success status with photo data, or error message
 */
export async function uploadSessionPhoto(
    sessionId: string,
    file: Buffer | string,
    contentType: string
): Promise<{
    success: boolean;
    photo?: import('@/lib/open-house/types').SessionPhoto;
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get the session to verify ownership
        const repository = getRepository();
        const session = await repository.getOpenHouseSession(user.id, sessionId);

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Generate unique photo ID
        const photoId = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Prepare S3 key
        const s3Key = `open-house/${user.id}/${sessionId}/photos/${photoId}.jpg`;

        // Convert base64 to Buffer if needed
        let buffer: Buffer;
        if (typeof file === 'string') {
            // Remove data URL prefix if present
            const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
            buffer = Buffer.from(base64Data, 'base64');
        } else {
            buffer = file;
        }

        // Upload to S3
        const { uploadFile } = await import('@/aws/s3/client');
        const url = await uploadFile(s3Key, buffer, contentType, {
            userId: user.id,
            sessionId,
            photoId,
            uploadedAt: new Date().toISOString(),
        });

        // Generate AI description
        let aiDescription: string | undefined;
        try {
            const visionAgent = getVisionAgent();
            const profileRepo = getAgentProfileRepository();
            const agentProfile = await profileRepo.getProfile(user.id);

            if (agentProfile) {
                // Convert buffer to base64 for vision API
                const base64Image = buffer.toString('base64');

                const analysis = await visionAgent.analyzeWithProfile(
                    base64Image,
                    'jpeg',
                    'Provide a brief description of this property photo, focusing on key features and visual elements.',
                    agentProfile,
                    undefined,
                    user.id
                );

                // Use the answer as the description
                aiDescription = analysis.answer;
            }
        } catch (error) {
            console.error('Error generating AI description:', error);
            // Continue without AI description if it fails
        }

        // Create photo object
        const photo: import('@/lib/open-house/types').SessionPhoto = {
            photoId,
            s3Key,
            url,
            aiDescription,
            capturedAt: new Date().toISOString(),
        };

        // Update session with new photo
        const updatedPhotos = [...session.photos, photo];
        await repository.updateOpenHouseSession(user.id, sessionId, {
            photos: updatedPhotos,
            updatedAt: new Date().toISOString(),
        });

        revalidatePath(`/open-house/sessions/${sessionId}`);

        return {
            success: true,
            photo,
        };
    } catch (error) {
        console.error('Error uploading session photo:', error);
        return {
            success: false,
            error: 'Failed to upload photo. Please try again.',
        };
    }
}

/**
 * Retrieves all photos for a session
 * Validates Requirements: 12.3
 * 
 * @param sessionId - The ID of the session
 * @returns Success status with photos array, or error message
 */
export async function getSessionPhotos(
    sessionId: string
): Promise<{
    success: boolean;
    photos?: import('@/lib/open-house/types').SessionPhoto[];
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get the session
        const repository = getRepository();
        const session = await repository.getOpenHouseSession(user.id, sessionId);

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        return {
            success: true,
            photos: session.photos || [],
        };
    } catch (error) {
        console.error('Error retrieving session photos:', error);
        return {
            success: false,
            error: 'Failed to retrieve photos.',
        };
    }
}

/**
 * Deletes a photo from a session
 * 
 * @param sessionId - The ID of the session
 * @param photoId - The ID of the photo to delete
 * @returns Success status or error message
 */
export async function deleteSessionPhoto(
    sessionId: string,
    photoId: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get the session
        const repository = getRepository();
        const session = await repository.getOpenHouseSession(user.id, sessionId);

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Find the photo
        const photo = session.photos.find((p: any) => p.photoId === photoId);
        if (!photo) {
            return { success: false, error: 'Photo not found' };
        }

        // Delete from S3
        const { deleteFile } = await import('@/aws/s3/client');
        await deleteFile(photo.s3Key);

        // Remove from session
        const updatedPhotos = session.photos.filter((p: any) => p.photoId !== photoId);
        await repository.updateOpenHouseSession(user.id, sessionId, {
            photos: updatedPhotos,
            updatedAt: new Date().toISOString(),
        });

        revalidatePath(`/open-house/sessions/${sessionId}`);

        return { success: true };
    } catch (error) {
        console.error('Error deleting session photo:', error);
        return {
            success: false,
            error: 'Failed to delete photo.',
        };
    }
}

// ============================================================================
// MARKETING GENERATION ACTIONS
// ============================================================================

/**
 * Generates a professional open house flyer
 * Validates Requirements: 16.1, 16.2, 16.5, 16.6
 * 
 * @param sessionId - The ID of the open house session
 * @param options - Flyer generation options (template, QR code, images)
 * @returns Success status with flyer content, or error message
 */
export async function generateOpenHouseFlyer(
    sessionId: string,
    options?: {
        includeQRCode?: boolean;
        includePropertyImages?: boolean;
        template?: 'modern' | 'classic' | 'luxury';
    }
): Promise<{
    success: boolean;
    flyer?: import('@/aws/bedrock/flows/generate-open-house-marketing').GenerateOpenHouseFlyerOutput;
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get the session
        const repository = getRepository();
        const session = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            sessionId
        );

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Get user profile for agent information and branding
        const profile = await repository.getItem<{
            name?: string;
            email?: string;
            phone?: string;
            brokerage?: string;
            licenseNumber?: string;
            brandColors?: {
                primary?: string;
                secondary?: string;
            };
            tagline?: string;
        }>(user.id, 'PROFILE');

        // Prepare agent information (Requirement 16.2)
        const agentInfo = {
            name: profile?.name || user.email || 'Agent',
            email: profile?.email || user.email || '',
            phone: profile?.phone || '',
            brokerage: profile?.brokerage,
            licenseNumber: profile?.licenseNumber,
        };

        // Prepare branding information (Requirement 16.5)
        const branding = profile?.brandColors || profile?.tagline ? {
            primaryColor: profile.brandColors?.primary,
            secondaryColor: profile.brandColors?.secondary,
            tagline: profile.tagline,
        } : undefined;

        // Prepare property information
        const propertyInfo = {
            address: session.propertyAddress,
            propertyId: session.propertyId,
            // Additional property details would come from property data if available
        };

        // Generate flyer using Bedrock flow
        const { generateOpenHouseFlyer: generateFlyerFlow } = await import(
            '@/aws/bedrock/flows/generate-open-house-marketing'
        );

        const flyerInput = {
            session: {
                sessionId: session.sessionId,
                propertyAddress: session.propertyAddress,
                scheduledDate: session.scheduledDate,
                scheduledStartTime: session.scheduledStartTime,
                scheduledEndTime: session.scheduledEndTime,
            },
            property: propertyInfo,
            agent: agentInfo,
            branding,
            options: {
                includeQRCode: options?.includeQRCode ?? true,
                includePropertyImages: options?.includePropertyImages ?? true,
                template: options?.template ?? 'modern',
            },
            userId: user.id,
        };

        const flyer = await generateFlyerFlow(flyerInput);

        // Save to Library hub (Requirement 16.6)
        const contentId = `content-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const now = new Date().toISOString();

        await repository.putItem({
            PK: `USER#${user.id}`,
            SK: `CONTENT#${contentId}`,
            contentId,
            userId: user.id,
            type: 'open-house-flyer',
            title: `Open House Flyer - ${session.propertyAddress}`,
            sessionId: session.sessionId,
            content: flyer,
            createdAt: now,
            updatedAt: now,
        });

        revalidatePath('/library/content');

        return {
            success: true,
            flyer,
        };
    } catch (error) {
        console.error('Error generating open house flyer:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate flyer. Please try again.',
        };
    }
}

/**
 * Generates platform-optimized social media posts for open house
 * Validates Requirements: 16.1, 16.3, 16.5, 16.6
 * 
 * @param sessionId - The ID of the open house session
 * @param platforms - Array of platforms to generate posts for
 * @returns Success status with social posts, or error message
 */
export async function generateOpenHouseSocialPosts(
    sessionId: string,
    platforms: ('facebook' | 'instagram' | 'linkedin' | 'twitter')[]
): Promise<{
    success: boolean;
    posts?: import('@/aws/bedrock/flows/generate-open-house-marketing').GenerateOpenHouseSocialPostsOutput;
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Validate platforms
        if (!platforms || platforms.length === 0) {
            return {
                success: false,
                error: 'At least one platform must be specified',
            };
        }

        // Get the session
        const repository = getRepository();
        const session = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            sessionId
        );

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Get user profile for agent information
        const profile = await repository.getItem<{
            name?: string;
            email?: string;
            phone?: string;
            brokerage?: string;
        }>(user.id, 'PROFILE');

        // Prepare agent information (Requirement 16.3)
        const agentInfo = {
            name: profile?.name || user.email || 'Agent',
            email: profile?.email || user.email || '',
            phone: profile?.phone || '',
            brokerage: profile?.brokerage,
        };

        // Prepare property information
        const propertyInfo = {
            address: session.propertyAddress,
            propertyId: session.propertyId,
        };

        // Generate social posts using Bedrock flow
        const { generateOpenHouseSocialPosts: generatePostsFlow } = await import(
            '@/aws/bedrock/flows/generate-open-house-marketing'
        );

        const postsInput = {
            session: {
                sessionId: session.sessionId,
                propertyAddress: session.propertyAddress,
                scheduledDate: session.scheduledDate,
                scheduledStartTime: session.scheduledStartTime,
                scheduledEndTime: session.scheduledEndTime,
            },
            property: propertyInfo,
            agent: agentInfo,
            platforms,
            userId: user.id,
        };

        const posts = await generatePostsFlow(postsInput);

        // Save to Library hub (Requirement 16.6)
        const contentId = `content-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const now = new Date().toISOString();

        await repository.putItem({
            PK: `USER#${user.id}`,
            SK: `CONTENT#${contentId}`,
            contentId,
            userId: user.id,
            type: 'open-house-social-posts',
            title: `Social Posts - ${session.propertyAddress}`,
            sessionId: session.sessionId,
            platforms,
            content: posts,
            createdAt: now,
            updatedAt: now,
        });

        revalidatePath('/library/content');

        return {
            success: true,
            posts,
        };
    } catch (error) {
        console.error('Error generating social posts:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate social posts. Please try again.',
        };
    }
}

/**
 * Generates a personalized email invitation for open house
 * Validates Requirements: 16.1, 16.4, 16.5, 16.6
 * 
 * @param sessionId - The ID of the open house session
 * @param options - Email invitation options
 * @returns Success status with email invitation, or error message
 */
export async function generateOpenHouseEmailInvite(
    sessionId: string,
    options?: {
        includeCalendarAttachment?: boolean;
        includeRSVPLink?: boolean;
        personalMessage?: string;
        recipientType?: 'general' | 'past_client' | 'sphere_of_influence';
    }
): Promise<{
    success: boolean;
    invitation?: import('@/aws/bedrock/flows/generate-open-house-marketing').GenerateOpenHouseEmailInviteOutput;
    error?: string;
}> {
    try {
        // Authenticate user
        const user = await getCurrentUserServer();
        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get the session
        const repository = getRepository();
        const session = await repository.getOpenHouseSession<OpenHouseSession>(
            user.id,
            sessionId
        );

        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Get user profile for agent information and branding
        const profile = await repository.getItem<{
            name?: string;
            email?: string;
            phone?: string;
            brokerage?: string;
        }>(user.id, 'PROFILE');

        // Prepare agent information (Requirement 16.4)
        const agentInfo = {
            name: profile?.name || user.email || 'Agent',
            email: profile?.email || user.email || '',
            phone: profile?.phone || '',
            brokerage: profile?.brokerage,
        };

        // Prepare property information
        const propertyInfo = {
            address: session.propertyAddress,
            propertyId: session.propertyId,
        };

        // Generate email invitation using Bedrock flow
        const { generateOpenHouseEmailInvite: generateInviteFlow } = await import(
            '@/aws/bedrock/flows/generate-open-house-marketing'
        );

        const inviteInput = {
            session: {
                sessionId: session.sessionId,
                propertyAddress: session.propertyAddress,
                scheduledDate: session.scheduledDate,
                scheduledStartTime: session.scheduledStartTime,
                scheduledEndTime: session.scheduledEndTime,
            },
            property: propertyInfo,
            agent: agentInfo,
            options: {
                includeCalendarAttachment: options?.includeCalendarAttachment ?? true,
                includeRSVPLink: options?.includeRSVPLink ?? true,
                personalMessage: options?.personalMessage,
                recipientType: options?.recipientType ?? 'general',
            },
            userId: user.id,
        };

        const invitation = await generateInviteFlow(inviteInput);

        // Save to Library hub (Requirement 16.6)
        const contentId = `content-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const now = new Date().toISOString();

        await repository.putItem({
            PK: `USER#${user.id}`,
            SK: `CONTENT#${contentId}`,
            contentId,
            userId: user.id,
            type: 'open-house-email-invite',
            title: `Email Invitation - ${session.propertyAddress}`,
            sessionId: session.sessionId,
            content: invitation,
            createdAt: now,
            updatedAt: now,
        });

        revalidatePath('/library/content');

        return {
            success: true,
            invitation,
        };
    } catch (error) {
        console.error('Error generating email invitation:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate email invitation. Please try again.',
        };
    }
}
