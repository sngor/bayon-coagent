'use client';

/**
 * Sequences Content Component
 * 
 * Client component that manages the state and interactions for follow-up sequences.
 * Integrates SequenceList, SequenceBuilder, and SequencePerformance components.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { FollowUpSequenceBuilder } from '@/components/open-house/follow-up-sequence-builder';
import { SequenceList } from '@/components/open-house/sequence-list';
import { SequencePerformance } from '@/components/open-house/sequence-performance';
import { useToast } from '@/hooks/use-toast';
import {
    FollowUpSequence,
    SequenceEnrollment,
    CreateFollowUpSequenceInput,
    UpdateFollowUpSequenceInput,
} from '@/lib/open-house/types';
import {
    getFollowUpSequences,
    createFollowUpSequence,
    updateFollowUpSequence,
    deleteFollowUpSequence,
} from '@/app/(app)/open-house/actions';
import { Plus } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit' | 'performance';

export function SequencesContent() {
    const { toast } = useToast();
    const [sequences, setSequences] = useState<FollowUpSequence[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedSequence, setSelectedSequence] = useState<FollowUpSequence | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        loadSequences();
    }, []);

    const loadSequences = async () => {
        setIsLoading(true);
        try {
            const result = await getFollowUpSequences();
            if (result.error) {
                toast({
                    title: 'Error',
                    description: result.error,
                    variant: 'destructive',
                });
            } else {
                setSequences(result.sequences);
            }
        } catch (error) {
            console.error('Error loading sequences:', error);
            toast({
                title: 'Error',
                description: 'Failed to load sequences',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateClick = () => {
        setSelectedSequence(null);
        setViewMode('create');
        setDialogOpen(true);
    };

    const handleEditClick = (sequence: FollowUpSequence) => {
        setSelectedSequence(sequence);
        setViewMode('edit');
        setDialogOpen(true);
    };

    const handleViewPerformance = (sequence: FollowUpSequence) => {
        setSelectedSequence(sequence);
        setViewMode('performance');
        setDialogOpen(true);
    };

    const handleSaveSequence = async (data: CreateFollowUpSequenceInput) => {
        if (viewMode === 'create') {
            const result = await createFollowUpSequence(data);
            if (result.success) {
                await loadSequences();
                setDialogOpen(false);
            }
            return result;
        } else if (viewMode === 'edit' && selectedSequence) {
            const updateData: UpdateFollowUpSequenceInput = {
                name: data.name,
                description: data.description,
                interestLevel: data.interestLevel,
                touchpoints: data.touchpoints,
            };
            const result = await updateFollowUpSequence(selectedSequence.sequenceId, updateData);
            if (result.success) {
                await loadSequences();
                setDialogOpen(false);
            }
            return result;
        }
        return { success: false, error: 'Invalid operation' };
    };

    const handleDeleteSequence = async (sequenceId: string) => {
        const result = await deleteFollowUpSequence(sequenceId);
        if (result.success) {
            await loadSequences();
        }
        return result;
    };

    const handleToggleActive = async (sequenceId: string, active: boolean) => {
        const result = await updateFollowUpSequence(sequenceId, { active });
        if (result.success) {
            await loadSequences();
        }
        return result;
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedSequence(null);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-end">
                    <div className="h-10 w-40 bg-muted animate-pulse rounded-md" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {/* Actions */}
                <div className="flex justify-end">
                    <Button onClick={handleCreateClick}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Sequence
                    </Button>
                </div>

                {/* Sequence List */}
                <SequenceList
                    sequences={sequences}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteSequence}
                    onToggleActive={handleToggleActive}
                    onViewPerformance={handleViewPerformance}
                />
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen && (viewMode === 'create' || viewMode === 'edit')} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {viewMode === 'create' ? 'Create Follow-up Sequence' : 'Edit Follow-up Sequence'}
                        </DialogTitle>
                        <DialogDescription>
                            {viewMode === 'create'
                                ? 'Set up an automated sequence of follow-up messages for open house visitors'
                                : 'Update your follow-up sequence configuration'}
                        </DialogDescription>
                    </DialogHeader>
                    <FollowUpSequenceBuilder
                        initialData={
                            selectedSequence
                                ? {
                                    name: selectedSequence.name,
                                    description: selectedSequence.description,
                                    interestLevel: selectedSequence.interestLevel,
                                    touchpoints: selectedSequence.touchpoints.map((tp) => ({
                                        order: tp.order,
                                        delayMinutes: tp.delayMinutes,
                                        type: tp.type,
                                        templatePrompt: tp.templatePrompt,
                                    })),
                                }
                                : undefined
                        }
                        onSave={handleSaveSequence}
                        onCancel={handleCloseDialog}
                        isEditing={viewMode === 'edit'}
                    />
                </DialogContent>
            </Dialog>

            {/* Performance Dialog */}
            <Dialog open={dialogOpen && viewMode === 'performance'} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    {selectedSequence && (
                        <SequencePerformance
                            sequence={selectedSequence}
                            enrollments={[]} // TODO: Load actual enrollments in future task
                            onClose={handleCloseDialog}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
