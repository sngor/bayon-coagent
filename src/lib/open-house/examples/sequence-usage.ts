/**
 * Follow-up Sequence Usage Examples
 * 
 * This file demonstrates how to use the follow-up sequence management actions
 * in UI components and other parts of the application.
 */

import {
    createFollowUpSequence,
    updateFollowUpSequence,
    deleteFollowUpSequence,
    getFollowUpSequences,
    getFollowUpSequence,
} from '@/app/(app)/open-house/actions';
import { InterestLevel, FollowUpType } from '@/lib/open-house/types';

// ============================================================================
// Example 1: Creating a High-Interest Sequence
// ============================================================================

export async function createHighInterestSequence() {
    const result = await createFollowUpSequence({
        name: "High Interest Follow-up",
        description: "Aggressive follow-up for hot leads who showed strong interest",
        interestLevel: InterestLevel.HIGH,
        touchpoints: [
            {
                order: 1,
                delayMinutes: 0,  // Immediate
                type: FollowUpType.EMAIL,
                templatePrompt: "Send a warm thank you email expressing excitement about their interest. Include property highlights and next steps. Emphasize urgency and limited availability."
            },
            {
                order: 2,
                delayMinutes: 60,  // 1 hour later
                type: FollowUpType.SMS,
                templatePrompt: "Send a brief SMS with a personal touch. Mention a specific feature they liked and offer to schedule a private showing."
            },
            {
                order: 3,
                delayMinutes: 1440,  // 24 hours later
                type: FollowUpType.EMAIL,
                templatePrompt: "Send detailed property information including comparable sales, neighborhood data, and financing options. Include a clear call-to-action to schedule a showing."
            },
            {
                order: 4,
                delayMinutes: 4320,  // 3 days later
                type: FollowUpType.EMAIL,
                templatePrompt: "Follow up with market insights and any new developments about the property. Create FOMO by mentioning other interested parties (if true)."
            }
        ]
    });

    if (result.success) {
        console.log('Sequence created:', result.sequenceId);
    } else {
        console.error('Failed to create sequence:', result.error);
    }

    return result;
}

// ============================================================================
// Example 2: Creating a Medium-Interest Sequence
// ============================================================================

export async function createMediumInterestSequence() {
    const result = await createFollowUpSequence({
        name: "Medium Interest Follow-up",
        description: "Balanced follow-up for visitors who showed moderate interest",
        interestLevel: InterestLevel.MEDIUM,
        touchpoints: [
            {
                order: 1,
                delayMinutes: 0,  // Immediate
                type: FollowUpType.EMAIL,
                templatePrompt: "Send a friendly thank you email. Provide property details and offer to answer any questions. Tone should be helpful but not pushy."
            },
            {
                order: 2,
                delayMinutes: 2880,  // 2 days later
                type: FollowUpType.EMAIL,
                templatePrompt: "Share additional information about the neighborhood, schools, and local amenities. Include links to helpful resources."
            },
            {
                order: 3,
                delayMinutes: 10080,  // 1 week later
                type: FollowUpType.EMAIL,
                templatePrompt: "Check in to see if they have any questions. Offer to schedule a private showing or provide more information."
            }
        ]
    });

    return result;
}

// ============================================================================
// Example 3: Creating a Low-Interest Sequence
// ============================================================================

export async function createLowInterestSequence() {
    const result = await createFollowUpSequence({
        name: "Low Interest Follow-up",
        description: "Educational follow-up for visitors who showed minimal interest",
        interestLevel: InterestLevel.LOW,
        touchpoints: [
            {
                order: 1,
                delayMinutes: 0,  // Immediate
                type: FollowUpType.EMAIL,
                templatePrompt: "Send a brief thank you email. Provide basic property information and offer to stay in touch for future opportunities."
            },
            {
                order: 2,
                delayMinutes: 10080,  // 1 week later
                type: FollowUpType.EMAIL,
                templatePrompt: "Share educational content about the home buying process, market trends, or neighborhood insights. Position yourself as a helpful resource."
            },
            {
                order: 3,
                delayMinutes: 43200,  // 1 month later
                type: FollowUpType.EMAIL,
                templatePrompt: "Send a market update or newsletter. Keep the relationship warm for future opportunities."
            }
        ]
    });

    return result;
}

// ============================================================================
// Example 4: Creating a Universal Sequence
// ============================================================================

export async function createUniversalSequence() {
    const result = await createFollowUpSequence({
        name: "Universal Follow-up",
        description: "General follow-up sequence for all visitors regardless of interest level",
        interestLevel: "all",
        touchpoints: [
            {
                order: 1,
                delayMinutes: 0,  // Immediate
                type: FollowUpType.EMAIL,
                templatePrompt: "Send a thank you email for attending. Provide property details and offer to answer questions."
            },
            {
                order: 2,
                delayMinutes: 4320,  // 3 days later
                type: FollowUpType.EMAIL,
                templatePrompt: "Follow up with additional information and check if they have any questions."
            }
        ]
    });

    return result;
}

// ============================================================================
// Example 5: Updating a Sequence
// ============================================================================

export async function updateSequenceName(sequenceId: string) {
    const result = await updateFollowUpSequence(sequenceId, {
        name: "Updated High Interest Follow-up",
        description: "Updated description with new strategy"
    });

    if (result.success) {
        console.log('Sequence updated successfully');
    } else {
        console.error('Failed to update sequence:', result.error);
    }

    return result;
}

// ============================================================================
// Example 6: Disabling a Sequence
// ============================================================================

export async function disableSequence(sequenceId: string) {
    // Disable the sequence without deleting it
    const result = await updateFollowUpSequence(sequenceId, {
        active: false
    });

    return result;
}

// ============================================================================
// Example 7: Updating Touchpoints
// ============================================================================

export async function updateSequenceTouchpoints(sequenceId: string) {
    const result = await updateFollowUpSequence(sequenceId, {
        touchpoints: [
            {
                order: 1,
                delayMinutes: 0,
                type: FollowUpType.EMAIL,
                templatePrompt: "New immediate email prompt"
            },
            {
                order: 2,
                delayMinutes: 120,  // 2 hours later (changed from 1 hour)
                type: FollowUpType.EMAIL,
                templatePrompt: "New follow-up email prompt"
            }
        ]
    });

    // Note: This will only affect NEW enrollments
    // Existing enrollments will continue with the old touchpoints
    return result;
}

// ============================================================================
// Example 8: Fetching All Sequences
// ============================================================================

export async function listAllSequences() {
    const result = await getFollowUpSequences();

    if (result.error) {
        console.error('Failed to fetch sequences:', result.error);
        return [];
    }

    console.log(`Found ${result.sequences.length} sequences`);
    result.sequences.forEach(seq => {
        console.log(`- ${seq.name} (${seq.interestLevel}) - ${seq.touchpoints.length} touchpoints`);
    });

    return result.sequences;
}

// ============================================================================
// Example 9: Fetching a Single Sequence
// ============================================================================

export async function getSequenceDetails(sequenceId: string) {
    const result = await getFollowUpSequence(sequenceId);

    if (result.error) {
        console.error('Failed to fetch sequence:', result.error);
        return null;
    }

    if (result.sequence) {
        console.log('Sequence:', result.sequence.name);
        console.log('Touchpoints:', result.sequence.touchpoints.length);
        result.sequence.touchpoints.forEach((tp, index) => {
            console.log(`  ${index + 1}. ${tp.type} after ${tp.delayMinutes} minutes`);
        });
    }

    return result.sequence;
}

// ============================================================================
// Example 10: Deleting a Sequence
// ============================================================================

export async function removeSequence(sequenceId: string) {
    // Confirm with user before deleting
    const confirmed = confirm('Are you sure you want to delete this sequence?');

    if (!confirmed) {
        return { success: false, error: 'Deletion cancelled by user' };
    }

    const result = await deleteFollowUpSequence(sequenceId);

    if (result.success) {
        console.log('Sequence deleted successfully');
    } else {
        console.error('Failed to delete sequence:', result.error);
    }

    return result;
}

// ============================================================================
// Example 11: Creating Sequences for All Interest Levels
// ============================================================================

export async function setupDefaultSequences() {
    const sequences = await Promise.all([
        createHighInterestSequence(),
        createMediumInterestSequence(),
        createLowInterestSequence(),
    ]);

    const successful = sequences.filter(s => s.success).length;
    console.log(`Created ${successful} out of 3 default sequences`);

    return sequences;
}

// ============================================================================
// Example 12: Validating Sequence Configuration
// ============================================================================

export function validateSequenceConfig(config: {
    name: string;
    touchpoints: Array<{ order: number; delayMinutes: number; type: string; templatePrompt: string }>;
}) {
    const errors: string[] = [];

    // Check name
    if (!config.name || config.name.length === 0) {
        errors.push('Sequence name is required');
    }
    if (config.name.length > 100) {
        errors.push('Sequence name must be 100 characters or less');
    }

    // Check touchpoints
    if (!config.touchpoints || config.touchpoints.length === 0) {
        errors.push('At least one touchpoint is required');
    }

    // Check touchpoint order is sequential
    const orders = config.touchpoints.map(t => t.order).sort((a, b) => a - b);
    const isSequential = orders.every((order, index) => order === index + 1);
    if (!isSequential) {
        errors.push('Touchpoint orders must be sequential starting from 1');
    }

    // Check delay minutes are non-negative
    const hasNegativeDelay = config.touchpoints.some(t => t.delayMinutes < 0);
    if (hasNegativeDelay) {
        errors.push('Delay minutes must be non-negative');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
