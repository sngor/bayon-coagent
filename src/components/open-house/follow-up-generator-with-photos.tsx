'use client';

/**
 * FollowUpGeneratorWithPhotos Component
 * 
 * Enhanced follow-up generator that includes photo selection for follow-up content.
 * Allows users to select photos to include in personalized follow-up emails.
 * 
 * Validates Requirements: 3.1, 3.7, 12.4
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Mail, Image as ImageIcon } from 'lucide-react';
import { generateFollowUpContent } from '@/app/(app)/open-house/actions';
import { Visitor, FollowUpContent, SessionPhoto } from '@/lib/open-house/types';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { PhotoSelector } from './photo-selector';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

interface FollowUpGeneratorWithPhotosProps {
    sessionId: string;
    visitors: Visitor[];
    photos: SessionPhoto[];
    onContentGenerated?: (visitorId: string, content: FollowUpContent) => void;
}

export function FollowUpGeneratorWithPhotos({
    sessionId,
    visitors,
    photos,
    onContentGenerated,
}: FollowUpGeneratorWithPhotosProps) {
    const router = useRouter();
    const [generatingVisitorId, setGeneratingVisitorId] = useState<string | null>(null);
    const [selectedPhotoIds, setSelectedPhotoIds] = useState<Record<string, string[]>>({});
    const [photoDialogVisitorId, setPhotoDialogVisitorId] = useState<string | null>(null);

    const visitorsWithoutFollowUp = visitors.filter(v => !v.followUpGenerated);

    const handleGenerateSingle = async (visitorId: string) => {
        setGeneratingVisitorId(visitorId);

        try {
            const result = await generateFollowUpContent(
                sessionId,
                visitorId,
                selectedPhotoIds[visitorId]
            );

            if (result.success && result.content) {
                toast({
                    title: 'Follow-up Generated',
                    description: selectedPhotoIds[visitorId]?.length
                        ? `Follow-up created with ${selectedPhotoIds[visitorId].length} photo(s)`
                        : 'AI-powered follow-up content has been created successfully.',
                });

                if (onContentGenerated) {
                    onContentGenerated(visitorId, result.content);
                }

                router.refresh();
            } else {
                toast({
                    title: 'Generation Failed',
                    description: result.error || 'Failed to generate follow-up content.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setGeneratingVisitorId(null);
        }
    };

    const handlePhotoSelection = (visitorId: string, photoIds: string[]) => {
        setSelectedPhotoIds(prev => ({
            ...prev,
            [visitorId]: photoIds,
        }));
    };

    const getInterestLevelColor = (level: string) => {
        switch (level) {
            case 'high':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'medium':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'low':
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    if (visitors.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        AI Follow-up Generator
                    </CardTitle>
                    <CardDescription>
                        Generate personalized follow-up content with photos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No visitors to generate follow-ups for</p>
                        <p className="text-sm mt-1">Check in visitors to start generating follow-ups</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Follow-up Generator with Photos
                </CardTitle>
                <CardDescription>
                    Generate personalized follow-up content and include property photos
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {visitorsWithoutFollowUp.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {visitorsWithoutFollowUp.map((visitor) => {
                            const isGenerating = generatingVisitorId === visitor.visitorId;
                            const selectedCount = selectedPhotoIds[visitor.visitorId]?.length || 0;

                            return (
                                <AccordionItem
                                    key={visitor.visitorId}
                                    value={visitor.visitorId}
                                >
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center justify-between w-full pr-4">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium text-left">
                                                            {visitor.name}
                                                        </p>
                                                        <Badge
                                                            variant="outline"
                                                            className={getInterestLevelColor(
                                                                visitor.interestLevel
                                                            )}
                                                        >
                                                            {visitor.interestLevel}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground text-left">
                                                        {visitor.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {selectedCount > 0 && (
                                                    <Badge variant="secondary">
                                                        <ImageIcon className="h-3 w-3 mr-1" />
                                                        {selectedCount}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-4 pt-4">
                                            {/* Photo Selection */}
                                            {photos.length > 0 && (
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium">
                                                        Select Photos to Include (Optional)
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        Choose up to 3 photos to include in the follow-up email
                                                    </p>
                                                    <PhotoSelector
                                                        photos={photos}
                                                        selectedPhotoIds={selectedPhotoIds[visitor.visitorId] || []}
                                                        onSelectionChange={(photoIds) =>
                                                            handlePhotoSelection(visitor.visitorId, photoIds)
                                                        }
                                                        maxSelection={3}
                                                        showPreview={true}
                                                    />
                                                </div>
                                            )}

                                            {/* Generate Button */}
                                            <div className="flex justify-end pt-2">
                                                <Button
                                                    onClick={() => handleGenerateSingle(visitor.visitorId)}
                                                    disabled={isGenerating}
                                                >
                                                    {isGenerating ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Generating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="h-4 w-4 mr-2" />
                                                            Generate Follow-up
                                                            {selectedCount > 0 && ` with ${selectedCount} photo(s)`}
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>All visitors have follow-ups generated</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
