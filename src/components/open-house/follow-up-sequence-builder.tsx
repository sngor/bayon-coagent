'use client';

/**
 * Follow-up Sequence Builder Component
 * 
 * Allows agents to create and edit automated follow-up sequences
 * with multiple touchpoints and timing configuration.
 * 
 * Validates Requirements: 15.1
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    InterestLevel,
    FollowUpType,
    CreateFollowUpSequenceInput,
    CreateFollowUpTouchpointInput,
} from '@/lib/open-house/types';
import { Plus, Trash2, GripVertical, Mail, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils/common';

interface FollowUpSequenceBuilderProps {
    initialData?: {
        name: string;
        description?: string;
        interestLevel: InterestLevel | 'all';
        touchpoints: CreateFollowUpTouchpointInput[];
    };
    onSave: (data: CreateFollowUpSequenceInput) => Promise<{ success: boolean; error?: string }>;
    onCancel: () => void;
    isEditing?: boolean;
}

export function FollowUpSequenceBuilder({
    initialData,
    onSave,
    onCancel,
    isEditing = false,
}: FollowUpSequenceBuilderProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [interestLevel, setInterestLevel] = useState<InterestLevel | 'all'>(
        initialData?.interestLevel || 'all'
    );
    const [touchpoints, setTouchpoints] = useState<CreateFollowUpTouchpointInput[]>(
        initialData?.touchpoints || [
            {
                order: 1,
                delayMinutes: 60, // 1 hour default
                type: FollowUpType.EMAIL,
                templatePrompt: '',
            },
        ]
    );

    const handleAddTouchpoint = () => {
        const newOrder = touchpoints.length + 1;
        setTouchpoints([
            ...touchpoints,
            {
                order: newOrder,
                delayMinutes: 1440, // 24 hours default
                type: FollowUpType.EMAIL,
                templatePrompt: '',
            },
        ]);
    };

    const handleRemoveTouchpoint = (index: number) => {
        if (touchpoints.length === 1) {
            toast({
                title: 'Cannot remove',
                description: 'A sequence must have at least one touchpoint',
                variant: 'destructive',
            });
            return;
        }

        const updated = touchpoints.filter((_, i) => i !== index);
        // Reorder remaining touchpoints
        const reordered = updated.map((tp, i) => ({ ...tp, order: i + 1 }));
        setTouchpoints(reordered);
    };

    const handleUpdateTouchpoint = (
        index: number,
        field: keyof CreateFollowUpTouchpointInput,
        value: any
    ) => {
        const updated = [...touchpoints];
        updated[index] = { ...updated[index], [field]: value };
        setTouchpoints(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!name.trim()) {
            toast({
                title: 'Validation error',
                description: 'Sequence name is required',
                variant: 'destructive',
            });
            return;
        }

        const hasEmptyPrompts = touchpoints.some((tp) => !tp.templatePrompt.trim());
        if (hasEmptyPrompts) {
            toast({
                title: 'Validation error',
                description: 'All touchpoints must have a template prompt',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await onSave({
                name: name.trim(),
                description: description.trim() || undefined,
                interestLevel,
                touchpoints,
            });

            if (result.success) {
                toast({
                    title: isEditing ? 'Sequence updated' : 'Sequence created',
                    description: `Your follow-up sequence has been ${isEditing ? 'updated' : 'created'} successfully`,
                });
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to save sequence',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error saving sequence:', error);
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDelay = (minutes: number): string => {
        if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (remainingMinutes === 0) {
            if (hours < 24) {
                return `${hours} hour${hours !== 1 ? 's' : ''}`;
            }
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            if (remainingHours === 0) {
                return `${days} day${days !== 1 ? 's' : ''}`;
            }
            return `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
        }
        return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Sequence Details</CardTitle>
                    <CardDescription>
                        Configure the basic information for your follow-up sequence
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Sequence Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., High Interest Follow-up"
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe when and how this sequence should be used"
                            maxLength={500}
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="interestLevel">Interest Level</Label>
                        <Select
                            value={interestLevel}
                            onValueChange={(value) =>
                                setInterestLevel(value as InterestLevel | 'all')
                            }
                        >
                            <SelectTrigger id="interestLevel">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Interest Levels</SelectItem>
                                <SelectItem value={InterestLevel.HIGH}>High Interest</SelectItem>
                                <SelectItem value={InterestLevel.MEDIUM}>Medium Interest</SelectItem>
                                <SelectItem value={InterestLevel.LOW}>Low Interest</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            Visitors with this interest level will be automatically enrolled
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Touchpoints */}
            <Card>
                <CardHeader>
                    <CardTitle>Touchpoints</CardTitle>
                    <CardDescription>
                        Define the sequence of follow-up messages and their timing
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {touchpoints.map((touchpoint, index) => (
                        <TouchpointEditor
                            key={index}
                            touchpoint={touchpoint}
                            index={index}
                            totalTouchpoints={touchpoints.length}
                            onUpdate={handleUpdateTouchpoint}
                            onRemove={handleRemoveTouchpoint}
                            formatDelay={formatDelay}
                        />
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddTouchpoint}
                        className="w-full"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Touchpoint
                    </Button>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : isEditing ? 'Update Sequence' : 'Create Sequence'}
                </Button>
            </div>
        </form>
    );
}

interface TouchpointEditorProps {
    touchpoint: CreateFollowUpTouchpointInput;
    index: number;
    totalTouchpoints: number;
    onUpdate: (index: number, field: keyof CreateFollowUpTouchpointInput, value: any) => void;
    onRemove: (index: number) => void;
    formatDelay: (minutes: number) => string;
}

function TouchpointEditor({
    touchpoint,
    index,
    totalTouchpoints,
    onUpdate,
    onRemove,
    formatDelay,
}: TouchpointEditorProps) {
    const [delayInput, setDelayInput] = useState({
        days: Math.floor(touchpoint.delayMinutes / 1440),
        hours: Math.floor((touchpoint.delayMinutes % 1440) / 60),
        minutes: touchpoint.delayMinutes % 60,
    });

    const handleDelayChange = (field: 'days' | 'hours' | 'minutes', value: string) => {
        const numValue = parseInt(value) || 0;
        const updated = { ...delayInput, [field]: numValue };
        setDelayInput(updated);

        const totalMinutes = updated.days * 1440 + updated.hours * 60 + updated.minutes;
        onUpdate(index, 'delayMinutes', totalMinutes);
    };

    return (
        <div className="relative rounded-lg border p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">Touchpoint {index + 1}</Badge>
                    {touchpoint.type === FollowUpType.EMAIL ? (
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
                {totalTouchpoints > 1 && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(index)}
                        className="h-8 w-8 p-0"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Type Selection */}
            <div className="space-y-2">
                <Label>Type</Label>
                <Select
                    value={touchpoint.type}
                    onValueChange={(value) => onUpdate(index, 'type', value as FollowUpType)}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={FollowUpType.EMAIL}>Email</SelectItem>
                        <SelectItem value={FollowUpType.SMS}>SMS</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Timing Configuration */}
            <div className="space-y-2">
                <Label>
                    Delay {index === 0 ? 'after check-in' : 'after previous touchpoint'}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                        <Label htmlFor={`days-${index}`} className="text-xs text-muted-foreground">
                            Days
                        </Label>
                        <Input
                            id={`days-${index}`}
                            type="number"
                            min="0"
                            value={delayInput.days}
                            onChange={(e) => handleDelayChange('days', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`hours-${index}`} className="text-xs text-muted-foreground">
                            Hours
                        </Label>
                        <Input
                            id={`hours-${index}`}
                            type="number"
                            min="0"
                            max="23"
                            value={delayInput.hours}
                            onChange={(e) => handleDelayChange('hours', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`minutes-${index}`} className="text-xs text-muted-foreground">
                            Minutes
                        </Label>
                        <Input
                            id={`minutes-${index}`}
                            type="number"
                            min="0"
                            max="59"
                            value={delayInput.minutes}
                            onChange={(e) => handleDelayChange('minutes', e.target.value)}
                        />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    Total delay: {formatDelay(touchpoint.delayMinutes)}
                </p>
            </div>

            {/* Template Prompt */}
            <div className="space-y-2">
                <Label htmlFor={`prompt-${index}`}>Template Prompt *</Label>
                <Textarea
                    id={`prompt-${index}`}
                    value={touchpoint.templatePrompt}
                    onChange={(e) => onUpdate(index, 'templatePrompt', e.target.value)}
                    placeholder="Describe what this follow-up should say. AI will generate personalized content based on this prompt."
                    maxLength={2000}
                    rows={4}
                    required
                />
                <p className="text-xs text-muted-foreground">
                    Example: "Send a friendly follow-up thanking them for visiting and asking if they have any questions about the property"
                </p>
            </div>
        </div>
    );
}
