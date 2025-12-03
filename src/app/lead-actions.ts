'use server';

/**
 * Lead Management Server Actions
 * 
 * Handles lead data operations, interaction logging, and follow-up reminders.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { z } from 'zod';

// ============================================================================
// Schemas
// ============================================================================

const LeadSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    source: z.string(),
    propertyId: z.string().optional(),
    propertyAddress: z.string().optional(),
    message: z.string().optional(),
    qualityScore: z.number().min(0).max(100),
    urgency: z.enum(['low', 'medium', 'high', 'critical']),
    timestamp: z.number(),
    metadata: z.record(z.any()).optional(),
});

const LeadInteractionSchema = z.object({
    leadId: z.string(),
    type: z.enum(['view', 'call', 'sms', 'email', 'note']),
    content: z.string().optional(),
    followUpDate: z.number().optional(),
    followUpNote: z.string().optional(),
});

const FollowUpReminderSchema = z.object({
    leadId: z.string(),
    date: z.number(),
    note: z.string(),
    type: z.enum(['call', 'email', 'meeting', 'other']),
});

// ============================================================================
// Types
// ============================================================================

export interface Lead {
    id: string;
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    source: string;
    propertyId?: string;
    propertyAddress?: string;
    message?: string;
    qualityScore: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
    timestamp: number;
    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

export interface LeadInteraction {
    id: string;
    leadId: string;
    userId: string;
    type: 'view' | 'call' | 'sms' | 'email' | 'note';
    content?: string;
    timestamp: number;
    createdAt: string;
}

export interface FollowUpReminder {
    id: string;
    leadId: string;
    userId: string;
    date: number;
    note: string;
    type: 'call' | 'email' | 'meeting' | 'other';
    completed: boolean;
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// Lead Management Actions
// ============================================================================

/**
 * Get all leads for the current user
 */
export async function getLeads(): Promise<{ leads: Lead[] }> {
    try {
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }

        const repository = new DynamoDBRepository();
        const result = await repository.query<Lead>(
            `USER#${user.id}`,
            'LEAD#'
        );

        return { leads: result.items };
    } catch (error: any) {
        console.error('Error fetching leads:', error);
        throw new Error(error.message || 'Failed to fetch leads');
    }
}

/**
 * Get a single lead by ID
 */
export async function getLead(leadId: string): Promise<{ lead: Lead | null }> {
    try {
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }

        const repository = new DynamoDBRepository();
        const lead = await repository.get<Lead>(
            `USER#${user.id}`,
            `LEAD#${leadId}`
        );

        return { lead };
    } catch (error: any) {
        console.error('Error fetching lead:', error);
        throw new Error(error.message || 'Failed to fetch lead');
    }
}

/**
 * Create a new lead
 */
export async function createLead(
    data: Omit<Lead, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<{ lead: Lead; message: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }

        // Validate input
        const validated = LeadSchema.omit({ id: true }).parse(data);

        const leadId = `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const lead: Lead = {
            id: leadId,
            userId: user.id,
            ...validated,
            status: 'new',
            createdAt: now,
            updatedAt: now,
        };

        const repository = new DynamoDBRepository();
        await repository.create(
            `USER#${user.id}`,
            `LEAD#${leadId}`,
            'Lead',
            lead
        );

        return {
            lead,
            message: 'Lead created successfully',
        };
    } catch (error: any) {
        console.error('Error creating lead:', error);
        throw new Error(error.message || 'Failed to create lead');
    }
}

/**
 * Update lead status
 */
export async function updateLeadStatus(
    leadId: string,
    status: Lead['status']
): Promise<{ message: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }

        const repository = new DynamoDBRepository();
        await repository.update(
            `USER#${user.id}`,
            `LEAD#${leadId}`,
            {
                status,
                updatedAt: new Date().toISOString(),
            }
        );

        return { message: 'Lead status updated successfully' };
    } catch (error: any) {
        console.error('Error updating lead status:', error);
        throw new Error(error.message || 'Failed to update lead status');
    }
}

// ============================================================================
// Interaction Logging Actions
// ============================================================================

/**
 * Log a lead interaction
 */
export async function logLeadInteraction(
    data: z.infer<typeof LeadInteractionSchema>
): Promise<{ interaction: LeadInteraction; message: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }

        // Validate input
        const validated = LeadInteractionSchema.parse(data);

        const interactionId = `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const interaction: LeadInteraction = {
            id: interactionId,
            leadId: validated.leadId,
            userId: user.id,
            type: validated.type,
            content: validated.content,
            timestamp: Date.now(),
            createdAt: now,
        };

        const repository = new DynamoDBRepository();

        // Save interaction
        await repository.create(
            `USER#${user.id}`,
            `INTERACTION#${interactionId}`,
            'LeadInteraction',
            interaction
        );

        // Update lead status if this is the first contact
        if (validated.type === 'call' || validated.type === 'sms' || validated.type === 'email') {
            const lead = await repository.get<Lead>(
                `USER#${user.id}`,
                `LEAD#${validated.leadId}`
            );

            if (lead && lead.status === 'new') {
                await repository.update(
                    `USER#${user.id}`,
                    `LEAD#${validated.leadId}`,
                    {
                        status: 'contacted',
                        updatedAt: new Date().toISOString(),
                    }
                );
            }
        }

        // Create follow-up reminder if specified
        if (validated.followUpDate && validated.followUpNote) {
            await createFollowUpReminder({
                leadId: validated.leadId,
                date: validated.followUpDate,
                note: validated.followUpNote,
                type: validated.type === 'call' ? 'call' : 'email',
            });
        }

        return {
            interaction,
            message: 'Interaction logged successfully',
        };
    } catch (error: any) {
        console.error('Error logging interaction:', error);
        throw new Error(error.message || 'Failed to log interaction');
    }
}

/**
 * Get interactions for a lead
 */
export async function getLeadInteractions(
    leadId: string
): Promise<{ interactions: LeadInteraction[] }> {
    try {
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }

        const repository = new DynamoDBRepository();
        const result = await repository.query<LeadInteraction>(
            `USER#${user.id}`,
            'INTERACTION#'
        );

        // Filter by leadId (in a real implementation, use GSI for better performance)
        const interactions = result.items.filter((i: LeadInteraction) => i.leadId === leadId);

        return { interactions };
    } catch (error: any) {
        console.error('Error fetching interactions:', error);
        throw new Error(error.message || 'Failed to fetch interactions');
    }
}

// ============================================================================
// Follow-up Reminder Actions
// ============================================================================

/**
 * Create a follow-up reminder
 */
export async function createFollowUpReminder(
    data: z.infer<typeof FollowUpReminderSchema>
): Promise<{ reminder: FollowUpReminder; message: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }

        // Validate input
        const validated = FollowUpReminderSchema.parse(data);

        const reminderId = `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const reminder: FollowUpReminder = {
            id: reminderId,
            leadId: validated.leadId,
            userId: user.id,
            date: validated.date,
            note: validated.note,
            type: validated.type,
            completed: false,
            createdAt: now,
            updatedAt: now,
        };

        const repository = new DynamoDBRepository();
        await repository.create(
            `USER#${user.id}`,
            `REMINDER#${reminderId}`,
            'FollowUpReminder',
            reminder,
            {
                // Use GSI for querying by date
                GSI1PK: `USER#${user.id}#REMINDERS`,
                GSI1SK: `DATE#${validated.date}`,
            }
        );

        return {
            reminder,
            message: 'Follow-up reminder created successfully',
        };
    } catch (error: any) {
        console.error('Error creating reminder:', error);
        throw new Error(error.message || 'Failed to create reminder');
    }
}

/**
 * Get upcoming follow-up reminders
 */
export async function getUpcomingReminders(): Promise<{ reminders: FollowUpReminder[] }> {
    try {
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }

        const repository = new DynamoDBRepository();
        const result = await repository.query<FollowUpReminder>(
            `USER#${user.id}`,
            'REMINDER#'
        );

        // Filter for incomplete reminders
        const reminders = result.items.filter((r: FollowUpReminder) => !r.completed);

        return { reminders };
    } catch (error: any) {
        console.error('Error fetching reminders:', error);
        throw new Error(error.message || 'Failed to fetch reminders');
    }
}

/**
 * Mark reminder as completed
 */
export async function completeReminder(
    reminderId: string
): Promise<{ message: string }> {
    try {
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            throw new Error('User not authenticated');
        }

        const repository = new DynamoDBRepository();
        await repository.update(
            `USER#${user.id}`,
            `REMINDER#${reminderId}`,
            {
                completed: true,
                updatedAt: new Date().toISOString(),
            }
        );

        return { message: 'Reminder marked as completed' };
    } catch (error: any) {
        console.error('Error completing reminder:', error);
        throw new Error(error.message || 'Failed to complete reminder');
    }
}
