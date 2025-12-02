'use client';

/**
 * Sequence List Component
 * 
 * Displays and manages all follow-up sequences for the agent.
 * Allows viewing, editing, activating/deactivating, and deleting sequences.
 * 
 * Validates Requirements: 15.1, 15.6
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
    FollowUpSequence,
    InterestLevel,
    FollowUpType,
} from '@/lib/open-house/types';
import {
    Edit,
    Trash2,
    Power,
    PowerOff,
    Mail,
    MessageSquare,
    Clock,
    Target,
} from 'lucide-react';
import { cn } from '@/lib/utils/common';

interface SequenceListProps {
    sequences: FollowUpSequence[];
    onEdit: (sequence: FollowUpSequence) => void;
    onDelete: (sequenceId: string) => Promise<{ success: boolean; error?: string }>;
    onToggleActive: (sequenceId: string, active: boolean) => Promise<{ success: boolean; error?: string }>;
    onViewPerformance: (sequence: FollowUpSequence) => void;
}

export function SequenceList({
    sequences,
    onEdit,
    onDelete,
    onToggleActive,
    onViewPerformance,
}: SequenceListProps) {
    const { toast } = useToast();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sequenceToDelete, setSequenceToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [togglingSequence, setTogglingSequence] = useState<string | null>(null);

    const handleDeleteClick = (sequenceId: string) => {
        setSequenceToDelete(sequenceId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!sequenceToDelete) return;

        setIsDeleting(true);
        try {
            const result = await onDelete(sequenceToDelete);
            if (result.success) {
                toast({
                    title: 'Sequence deleted',
                    description: 'The follow-up sequence has been deleted successfully',
                });
                setDeleteDialogOpen(false);
                setSequenceToDelete(null);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to delete sequence',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error deleting sequence:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleActive = async (sequenceId: string, currentActive: boolean) => {
        setTogglingSequence(sequenceId);
        try {
            const result = await onToggleActive(sequenceId, !currentActive);
            if (result.success) {
                toast({
                    title: currentActive ? 'Sequence deactivated' : 'Sequence activated',
                    description: currentActive
                        ? 'New visitors will not be enrolled in this sequence'
                        : 'New visitors will be automatically enrolled in this sequence',
                });
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to update sequence',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error toggling sequence:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setTogglingSequence(null);
        }
    };

    if (sequences.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Target className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No sequences yet</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                        Create your first follow-up sequence to automatically engage with open house visitors
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sequences.map((sequence) => (
                    <SequenceCard
                        key={sequence.sequenceId}
                        sequence={sequence}
                        onEdit={() => onEdit(sequence)}
                        onDelete={() => handleDeleteClick(sequence.sequenceId)}
                        onToggleActive={() => handleToggleActive(sequence.sequenceId, sequence.active)}
                        onViewPerformance={() => onViewPerformance(sequence)}
                        isToggling={togglingSequence === sequence.sequenceId}
                    />
                ))}
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete sequence?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this follow-up sequence. Existing enrollments will not be affected.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

interface SequenceCardProps {
    sequence: FollowUpSequence;
    onEdit: () => void;
    onDelete: () => void;
    onToggleActive: () => void;
    onViewPerformance: () => void;
    isToggling: boolean;
}

function SequenceCard({
    sequence,
    onEdit,
    onDelete,
    onToggleActive,
    onViewPerformance,
    isToggling,
}: SequenceCardProps) {
    const getInterestLevelBadge = (level: InterestLevel | 'all') => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
            all: { variant: 'outline', label: 'All Levels' },
            [InterestLevel.HIGH]: { variant: 'default', label: 'High Interest' },
            [InterestLevel.MEDIUM]: { variant: 'secondary', label: 'Medium Interest' },
            [InterestLevel.LOW]: { variant: 'outline', label: 'Low Interest' },
        };
        const config = variants[level];
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const formatDelay = (minutes: number): string => {
        if (minutes < 60) {
            return `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours}h`;
        }
        const days = Math.floor(hours / 24);
        return `${days}d`;
    };

    const getTotalDuration = () => {
        const total = sequence.touchpoints.reduce((sum, tp) => sum + tp.delayMinutes, 0);
        return formatDelay(total);
    };

    return (
        <Card className={cn('relative', !sequence.active && 'opacity-60')}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{sequence.name}</CardTitle>
                        {sequence.description && (
                            <CardDescription className="line-clamp-2">
                                {sequence.description}
                            </CardDescription>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleActive}
                        disabled={isToggling}
                        className={cn(
                            'h-8 w-8 p-0',
                            sequence.active ? 'text-green-600' : 'text-muted-foreground'
                        )}
                        title={sequence.active ? 'Deactivate sequence' : 'Activate sequence'}
                    >
                        {sequence.active ? (
                            <Power className="h-4 w-4" />
                        ) : (
                            <PowerOff className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Interest Level */}
                <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    {getInterestLevelBadge(sequence.interestLevel)}
                </div>

                {/* Touchpoints Summary */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Touchpoints</span>
                        <span className="font-medium">{sequence.touchpoints.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total duration</span>
                        <span className="font-medium">{getTotalDuration()}</span>
                    </div>
                </div>

                {/* Touchpoint Types */}
                <div className="flex flex-wrap gap-2">
                    {sequence.touchpoints.map((tp, index) => (
                        <div
                            key={tp.touchpointId}
                            className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
                        >
                            {tp.type === FollowUpType.EMAIL ? (
                                <Mail className="h-3 w-3" />
                            ) : (
                                <MessageSquare className="h-3 w-3" />
                            )}
                            <span>{index + 1}</span>
                            <Clock className="h-3 w-3 ml-1 text-muted-foreground" />
                            <span className="text-muted-foreground">{formatDelay(tp.delayMinutes)}</span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onViewPerformance}
                        className="flex-1"
                    >
                        Performance
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onEdit}
                        className="flex-1"
                    >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onDelete}
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                {/* Status Badge */}
                {sequence.active && (
                    <div className="absolute top-2 right-2">
                        <Badge variant="default" className="bg-green-600">
                            Active
                        </Badge>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
