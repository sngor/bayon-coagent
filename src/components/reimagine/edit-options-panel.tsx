'use client';

/**
 * Edit Options Panel Component for Reimagine Image Toolkit
 * 
 * Features:
 * - Display all available edit types as cards
 * - Highlight AI suggestions with priority badges
 * - Show edit descriptions and use cases
 * - Handle edit selection and parameter input
 * - Pre-populate parameters from suggestions when clicked
 * 
 * Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 13.9
 */

import { useState, useCallback } from 'react';
import {
    Sparkles,
    Sofa,
    Sunset,
    Wand2,
    Eraser,
    Hammer,
    ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type EditType, type EditSuggestion, type EditParams } from '@/ai/schemas/reimagine-schemas';
import { cn } from '@/lib/utils/common';
import { HelpTooltip, HelpSection } from './help-tooltip';

interface EditOptionsPanelProps {
    imageId: string;
    suggestions: EditSuggestion[];
    onEditSelect: (editType: EditType, params?: Partial<EditParams>) => void;
}

// Edit type metadata for display
const EDIT_OPTIONS = [
    {
        type: 'virtual-staging' as EditType,
        icon: Sofa,
        title: 'Virtual Staging',
        description: 'Add furniture and decor to empty rooms',
        useCase: 'Perfect for vacant properties to help buyers visualize the space',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
    },
    {
        type: 'day-to-dusk' as EditType,
        icon: Sunset,
        title: 'Day to Dusk',
        description: 'Transform daytime photos to golden hour lighting',
        useCase: 'Create stunning twilight exterior shots that attract attention',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
    },
    {
        type: 'enhance' as EditType,
        icon: Wand2,
        title: 'Image Enhancement',
        description: 'Improve brightness, contrast, and overall quality',
        useCase: 'Make photos look professional with optimal lighting and sharpness',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
    },
    {
        type: 'item-removal' as EditType,
        icon: Eraser,
        title: 'Item Removal',
        description: 'Remove unwanted objects from photos',
        useCase: 'Clean up distractions like clutter, signs, or personal items',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
    },
    {
        type: 'virtual-renovation' as EditType,
        icon: Hammer,
        title: 'Virtual Renovation',
        description: 'Visualize potential property improvements',
        useCase: 'Show buyers the potential of fixer-upper properties',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
    },
];

export function EditOptionsPanel({
    imageId,
    suggestions,
    onEditSelect,
}: EditOptionsPanelProps) {
    const [selectedType, setSelectedType] = useState<EditType | null>(null);

    // Get suggestion for a specific edit type
    const getSuggestionForType = useCallback(
        (editType: EditType): EditSuggestion | undefined => {
            return suggestions.find((s) => s.editType === editType);
        },
        [suggestions]
    );

    // Check if an edit type is suggested
    const isSuggested = useCallback(
        (editType: EditType): boolean => {
            return suggestions.some((s) => s.editType === editType);
        },
        [suggestions]
    );

    // Get priority badge color
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-500 text-white';
            case 'medium':
                return 'bg-yellow-500 text-white';
            case 'low':
                return 'bg-blue-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    // Handle edit card click (Requirement 13.9)
    const handleEditClick = useCallback(
        (editType: EditType) => {
            setSelectedType(editType);

            // Get suggestion for this edit type
            const suggestion = getSuggestionForType(editType);

            // Pre-populate parameters from suggestion if available (Requirement 13.9)
            const suggestedParams = suggestion?.suggestedParams;

            // Call parent handler with edit type and suggested parameters
            onEditSelect(editType, suggestedParams);
        },
        [getSuggestionForType, onEditSelect]
    );

    // Sort edit options: suggested first (by priority), then others
    const sortedOptions = [...EDIT_OPTIONS].sort((a, b) => {
        const aSuggestion = getSuggestionForType(a.type);
        const bSuggestion = getSuggestionForType(b.type);

        // Both suggested: sort by priority
        if (aSuggestion && bSuggestion) {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[aSuggestion.priority] - priorityOrder[bSuggestion.priority];
        }

        // Only a is suggested
        if (aSuggestion) return -1;

        // Only b is suggested
        if (bSuggestion) return 1;

        // Neither suggested: maintain original order
        return 0;
    });

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <h2 className="font-headline text-2xl font-bold">Choose an Edit</h2>
                    <HelpTooltip
                        content="Select the type of edit you want to apply. AI-recommended edits are highlighted with priority badges. Click any edit card to get started."
                        side="right"
                    />
                </div>
                <p className="text-muted-foreground">
                    Select an editing operation to apply to your image
                </p>
            </div>

            {/* Help Section */}
            <HelpSection title="Need help choosing an edit?">
                <ul className="list-disc list-inside space-y-1">
                    <li><strong>Empty rooms?</strong> Use Virtual Staging to add furniture</li>
                    <li><strong>Daytime exterior?</strong> Try Day to Dusk for golden hour lighting</li>
                    <li><strong>Poor quality photo?</strong> Start with Image Enhancement</li>
                    <li><strong>Unwanted objects?</strong> Use Item Removal to clean up</li>
                    <li><strong>Dated features?</strong> Try Virtual Renovation to show potential</li>
                </ul>
            </HelpSection>

            {/* AI Suggestions Banner */}
            {suggestions.length > 0 && (
                <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <div className="rounded-full bg-primary/10 p-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <h3 className="font-headline font-semibold">AI Recommendations</h3>
                                <p className="text-sm text-muted-foreground">
                                    Based on your image analysis, we recommend {suggestions.length}{' '}
                                    {suggestions.length === 1 ? 'edit' : 'edits'} highlighted below
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Edit Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedOptions.map((option) => {
                    const suggestion = getSuggestionForType(option.type);
                    const isHighlighted = isSuggested(option.type);
                    const Icon = option.icon;

                    return (
                        <Card
                            key={option.type}
                            interactive
                            onClick={() => handleEditClick(option.type)}
                            className={cn(
                                'relative transition-all duration-200',
                                isHighlighted && 'border-primary/50 shadow-md',
                                selectedType === option.type && 'ring-2 ring-primary'
                            )}
                        >
                            {/* AI Suggestion Badge */}
                            {suggestion && (
                                <div className="absolute top-3 right-3 z-10">
                                    <Badge className={getPriorityColor(suggestion.priority)}>
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        {suggestion.priority}
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="pb-3">
                                <div className="flex items-start gap-3">
                                    <div className={cn('rounded-lg p-2', option.bgColor)}>
                                        <Icon className={cn('h-6 w-6', option.color)} />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <CardTitle className="text-lg">{option.title}</CardTitle>
                                        <CardDescription className="text-sm">
                                            {option.description}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                {/* Use Case */}
                                <p className="text-sm text-muted-foreground">{option.useCase}</p>

                                {/* AI Suggestion Reason */}
                                {suggestion && (
                                    <div className="rounded-lg bg-primary/5 p-3 space-y-1">
                                        <p className="text-xs font-medium text-primary">
                                            Why we recommend this:
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {suggestion.reason}
                                        </p>
                                        {suggestion.confidence && (
                                            <p className="text-xs text-muted-foreground">
                                                Confidence: {(suggestion.confidence * 100).toFixed(0)}%
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Select Button */}
                                <Button
                                    variant={isHighlighted ? 'default' : 'outline'}
                                    className="w-full"
                                    size="sm"
                                >
                                    Select
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* No Image Warning */}
            {!imageId && (
                <Card className="border-yellow-500/50 bg-yellow-500/5">
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground text-center">
                            Please upload an image first to enable editing options
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
