/**
 * Follow-up Sequence UI Components Usage Examples
 * 
 * This file demonstrates how to use the follow-up sequence UI components
 * in the Open House Enhancement feature.
 * 
 * Components:
 * - FollowUpSequenceBuilder: Create and edit sequences
 * - SequenceList: Display and manage sequences
 * - SequencePerformance: View sequence metrics
 */

import {
    FollowUpSequence,
    CreateFollowUpSequenceInput,
    InterestLevel,
    FollowUpType,
} from '@/lib/open-house/types';

// ============================================================================
// Example 1: Creating a New Sequence
// ============================================================================

/**
 * Example of creating a high-interest follow-up sequence
 * with 3 touchpoints over 7 days
 */
export const exampleHighInterestSequence: CreateFollowUpSequenceInput = {
    name: 'High Interest - Aggressive Follow-up',
    description: 'Fast-paced follow-up for highly interested visitors with urgency messaging',
    interestLevel: InterestLevel.HIGH,
    touchpoints: [
        {
            order: 1,
            delayMinutes: 60, // 1 hour after check-in
            type: FollowUpType.EMAIL,
            templatePrompt: `Send an immediate follow-up email thanking them for visiting. 
            Express excitement about their interest. Include property highlights and next steps. 
            Create urgency by mentioning other interested parties. Ask if they'd like to schedule 
            a private showing or make an offer.`,
        },
        {
            order: 2,
            delayMinutes: 1440, // 24 hours after first touchpoint (1 day)
            type: FollowUpType.SMS,
            templatePrompt: `Send a brief, friendly SMS checking in. Ask if they have any questions 
            about the property. Mention that you're available for a call or showing. Keep it short 
            and conversational.`,
        },
        {
            order: 3,
            delayMinutes: 4320, // 72 hours after second touchpoint (3 days)
            type: FollowUpType.EMAIL,
            templatePrompt: `Send a comprehensive follow-up with additional property information, 
            comparable sales data, and neighborhood insights. Include financing options and 
            inspection details. Offer to answer any questions and schedule a second showing.`,
        },
    ],
};

/**
 * Example of creating a medium-interest nurture sequence
 * with 4 touchpoints over 2 weeks
 */
export const exampleMediumInterestSequence: CreateFollowUpSequenceInput = {
    name: 'Medium Interest - Balanced Nurture',
    description: 'Balanced follow-up sequence that educates while gently encouraging action',
    interestLevel: InterestLevel.MEDIUM,
    touchpoints: [
        {
            order: 1,
            delayMinutes: 180, // 3 hours after check-in
            type: FollowUpType.EMAIL,
            templatePrompt: `Send a warm thank you email for visiting. Recap the property's 
            key features. Offer to answer any questions. Include links to additional photos 
            and virtual tour if available.`,
        },
        {
            order: 2,
            delayMinutes: 2880, // 48 hours after first touchpoint (2 days)
            type: FollowUpType.EMAIL,
            templatePrompt: `Share educational content about the neighborhood, schools, and 
            local amenities. Include market insights and why this property is a good value. 
            Maintain a helpful, informative tone.`,
        },
        {
            order: 3,
            delayMinutes: 5760, // 96 hours after second touchpoint (4 days)
            type: FollowUpType.SMS,
            templatePrompt: `Send a brief check-in asking if they'd like more information 
            or have any questions. Keep it low-pressure and friendly.`,
        },
        {
            order: 4,
            delayMinutes: 10080, // 168 hours after third touchpoint (7 days)
            type: FollowUpType.EMAIL,
            templatePrompt: `Send a final follow-up with a summary of the property's benefits, 
            recent price adjustments if any, and an invitation to schedule another viewing. 
            Let them know you're here to help when they're ready.`,
        },
    ],
};

/**
 * Example of creating a low-interest long-term nurture sequence
 * with 3 touchpoints over 1 month
 */
export const exampleLowInterestSequence: CreateFollowUpSequenceInput = {
    name: 'Low Interest - Long-term Nurture',
    description: 'Educational, relationship-building sequence for visitors who are just browsing',
    interestLevel: InterestLevel.LOW,
    touchpoints: [
        {
            order: 1,
            delayMinutes: 1440, // 24 hours after check-in (1 day)
            type: FollowUpType.EMAIL,
            templatePrompt: `Send a friendly thank you for visiting. Share general information 
            about the home buying process and what to look for in a property. Position yourself 
            as a helpful resource for their future search.`,
        },
        {
            order: 2,
            delayMinutes: 10080, // 168 hours after first touchpoint (7 days)
            type: FollowUpType.EMAIL,
            templatePrompt: `Share valuable content about the local real estate market, 
            upcoming open houses, and tips for first-time buyers. Focus on education and 
            building trust rather than selling.`,
        },
        {
            order: 3,
            delayMinutes: 20160, // 336 hours after second touchpoint (14 days)
            type: FollowUpType.EMAIL,
            templatePrompt: `Send a final check-in offering to keep them updated on new 
            listings that match their criteria. Invite them to reach out anytime they have 
            questions about real estate. Keep the door open for future engagement.`,
        },
    ],
};

/**
 * Example of creating a universal sequence for all interest levels
 */
export const exampleUniversalSequence: CreateFollowUpSequenceInput = {
    name: 'Universal Follow-up',
    description: 'General follow-up sequence that works for all visitor interest levels',
    interestLevel: 'all',
    touchpoints: [
        {
            order: 1,
            delayMinutes: 120, // 2 hours after check-in
            type: FollowUpType.EMAIL,
            templatePrompt: `Send a personalized thank you email. Recap the property's 
            highlights based on what they seemed interested in during the visit. Offer to 
            answer questions and provide additional information.`,
        },
        {
            order: 2,
            delayMinutes: 2880, // 48 hours after first touchpoint (2 days)
            type: FollowUpType.EMAIL,
            templatePrompt: `Follow up with additional property details, neighborhood 
            information, and answers to common questions. Gauge their level of interest 
            and adjust your approach accordingly.`,
        },
    ],
};

// ============================================================================
// Example 2: Using the SequenceBuilder Component
// ============================================================================

/**
 * Example of how to integrate the SequenceBuilder in a page
 */
export const sequenceBuilderExample = `
import { FollowUpSequenceBuilder } from '@/components/open-house/follow-up-sequence-builder';
import { createFollowUpSequence } from '@/app/(app)/open-house/actions';

function CreateSequencePage() {
    const handleSave = async (data) => {
        const result = await createFollowUpSequence(data);
        if (result.success) {
            // Navigate to sequences list or show success message
            router.push('/open-house/sequences');
        }
        return result;
    };

    return (
        <FollowUpSequenceBuilder
            onSave={handleSave}
            onCancel={() => router.back()}
        />
    );
}
`;

/**
 * Example of editing an existing sequence
 */
export const sequenceEditorExample = `
import { FollowUpSequenceBuilder } from '@/components/open-house/follow-up-sequence-builder';
import { updateFollowUpSequence } from '@/app/(app)/open-house/actions';

function EditSequencePage({ sequence }) {
    const handleSave = async (data) => {
        const result = await updateFollowUpSequence(sequence.sequenceId, data);
        if (result.success) {
            router.push('/open-house/sequences');
        }
        return result;
    };

    return (
        <FollowUpSequenceBuilder
            initialData={{
                name: sequence.name,
                description: sequence.description,
                interestLevel: sequence.interestLevel,
                touchpoints: sequence.touchpoints.map(tp => ({
                    order: tp.order,
                    delayMinutes: tp.delayMinutes,
                    type: tp.type,
                    templatePrompt: tp.templatePrompt,
                })),
            }}
            onSave={handleSave}
            onCancel={() => router.back()}
            isEditing={true}
        />
    );
}
`;

// ============================================================================
// Example 3: Using the SequenceList Component
// ============================================================================

/**
 * Example of displaying and managing sequences
 */
export const sequenceListExample = `
import { SequenceList } from '@/components/open-house/sequence-list';
import {
    getFollowUpSequences,
    deleteFollowUpSequence,
    updateFollowUpSequence,
} from '@/app/(app)/open-house/actions';

function SequencesPage() {
    const [sequences, setSequences] = useState([]);

    useEffect(() => {
        loadSequences();
    }, []);

    const loadSequences = async () => {
        const result = await getFollowUpSequences();
        setSequences(result.sequences);
    };

    const handleEdit = (sequence) => {
        router.push(\`/open-house/sequences/\${sequence.sequenceId}/edit\`);
    };

    const handleDelete = async (sequenceId) => {
        const result = await deleteFollowUpSequence(sequenceId);
        if (result.success) {
            await loadSequences();
        }
        return result;
    };

    const handleToggleActive = async (sequenceId, active) => {
        const result = await updateFollowUpSequence(sequenceId, { active });
        if (result.success) {
            await loadSequences();
        }
        return result;
    };

    const handleViewPerformance = (sequence) => {
        setSelectedSequence(sequence);
        setShowPerformance(true);
    };

    return (
        <SequenceList
            sequences={sequences}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
            onViewPerformance={handleViewPerformance}
        />
    );
}
`;

// ============================================================================
// Example 4: Using the SequencePerformance Component
// ============================================================================

/**
 * Example of displaying sequence performance metrics
 */
export const sequencePerformanceExample = `
import { SequencePerformance } from '@/components/open-house/sequence-performance';

function PerformanceDialog({ sequence, enrollments, onClose }) {
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <SequencePerformance
                    sequence={sequence}
                    enrollments={enrollments}
                    onClose={onClose}
                />
            </DialogContent>
        </Dialog>
    );
}
`;

// ============================================================================
// Example 5: Complete Integration Example
// ============================================================================

/**
 * Complete example showing all components working together
 */
export const completeIntegrationExample = `
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { FollowUpSequenceBuilder } from '@/components/open-house/follow-up-sequence-builder';
import { SequenceList } from '@/components/open-house/sequence-list';
import { SequencePerformance } from '@/components/open-house/sequence-performance';
import {
    getFollowUpSequences,
    createFollowUpSequence,
    updateFollowUpSequence,
    deleteFollowUpSequence,
} from '@/app/(app)/open-house/actions';

export function SequencesManagement() {
    const [sequences, setSequences] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const [selectedSequence, setSelectedSequence] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        loadSequences();
    }, []);

    const loadSequences = async () => {
        const result = await getFollowUpSequences();
        setSequences(result.sequences);
    };

    const handleCreate = () => {
        setSelectedSequence(null);
        setViewMode('create');
        setDialogOpen(true);
    };

    const handleEdit = (sequence) => {
        setSelectedSequence(sequence);
        setViewMode('edit');
        setDialogOpen(true);
    };

    const handleViewPerformance = (sequence) => {
        setSelectedSequence(sequence);
        setViewMode('performance');
        setDialogOpen(true);
    };

    const handleSave = async (data) => {
        if (viewMode === 'create') {
            const result = await createFollowUpSequence(data);
            if (result.success) {
                await loadSequences();
                setDialogOpen(false);
            }
            return result;
        } else {
            const result = await updateFollowUpSequence(selectedSequence.sequenceId, data);
            if (result.success) {
                await loadSequences();
                setDialogOpen(false);
            }
            return result;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={handleCreate}>Create Sequence</Button>
            </div>

            <SequenceList
                sequences={sequences}
                onEdit={handleEdit}
                onDelete={async (id) => {
                    const result = await deleteFollowUpSequence(id);
                    if (result.success) await loadSequences();
                    return result;
                }}
                onToggleActive={async (id, active) => {
                    const result = await updateFollowUpSequence(id, { active });
                    if (result.success) await loadSequences();
                    return result;
                }}
                onViewPerformance={handleViewPerformance}
            />

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {(viewMode === 'create' || viewMode === 'edit') && (
                        <FollowUpSequenceBuilder
                            initialData={selectedSequence ? {
                                name: selectedSequence.name,
                                description: selectedSequence.description,
                                interestLevel: selectedSequence.interestLevel,
                                touchpoints: selectedSequence.touchpoints.map(tp => ({
                                    order: tp.order,
                                    delayMinutes: tp.delayMinutes,
                                    type: tp.type,
                                    templatePrompt: tp.templatePrompt,
                                })),
                            } : undefined}
                            onSave={handleSave}
                            onCancel={() => setDialogOpen(false)}
                            isEditing={viewMode === 'edit'}
                        />
                    )}
                    {viewMode === 'performance' && selectedSequence && (
                        <SequencePerformance
                            sequence={selectedSequence}
                            enrollments={[]}
                            onClose={() => setDialogOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
`;

// ============================================================================
// Best Practices
// ============================================================================

/**
 * Best practices for using follow-up sequence UI components:
 * 
 * 1. Sequence Design:
 *    - Start with 2-3 touchpoints and expand based on performance
 *    - Space touchpoints appropriately (1 hour, 1 day, 3 days, 1 week)
 *    - Match tone to interest level (urgent for high, educational for low)
 *    - Use email for detailed content, SMS for quick check-ins
 * 
 * 2. Template Prompts:
 *    - Be specific about the message tone and content
 *    - Include context about property and visitor interest
 *    - Specify call-to-action (schedule showing, ask questions, etc.)
 *    - Keep prompts under 500 characters for best AI results
 * 
 * 3. Performance Monitoring:
 *    - Review completion rates weekly
 *    - Identify drop-off points in the sequence
 *    - A/B test different timing and messaging
 *    - Adjust based on visitor feedback
 * 
 * 4. User Experience:
 *    - Provide clear feedback on save/update operations
 *    - Show loading states during async operations
 *    - Validate input before submission
 *    - Allow easy editing and deactivation
 * 
 * 5. Error Handling:
 *    - Display user-friendly error messages
 *    - Provide recovery options for failed operations
 *    - Log errors for debugging
 *    - Prevent data loss with confirmation dialogs
 */
