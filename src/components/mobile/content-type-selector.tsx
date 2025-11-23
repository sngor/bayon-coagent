'use client';

import React, { useState } from 'react';
import { FileText, Share2, TrendingUp, StickyNote, ChevronRight, Loader2, Edit3, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { TOUCH_FRIENDLY_CLASSES } from '@/lib/mobile-optimization';
import type { VoiceToContentOutput } from '@/ai/schemas/voice-to-content-schemas';

export interface ContentTypeOption {
    type: 'blog' | 'social' | 'market-update' | 'notes';
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}

export interface ContentTypeSelectorProps {
    transcript: string;
    onContentGenerated: (content: VoiceToContentOutput) => void;
    onSaveToLibrary?: (content: VoiceToContentOutput) => void;
    isGenerating?: boolean;
    className?: string;
}

const CONTENT_TYPE_OPTIONS: ContentTypeOption[] = [
    {
        type: 'blog',
        label: 'Blog Post',
        description: 'Professional blog content with SEO optimization',
        icon: FileText,
        color: 'bg-blue-500'
    },
    {
        type: 'social',
        label: 'Social Media',
        description: 'Platform-optimized posts for social sharing',
        icon: Share2,
        color: 'bg-green-500'
    },
    {
        type: 'market-update',
        label: 'Market Update',
        description: 'Data-driven market analysis and insights',
        icon: TrendingUp,
        color: 'bg-purple-500'
    },
    {
        type: 'notes',
        label: 'Notes',
        description: 'Organized notes with action items',
        icon: StickyNote,
        color: 'bg-orange-500'
    }
];

export function ContentTypeSelector({
    transcript,
    onContentGenerated,
    onSaveToLibrary,
    isGenerating = false,
    className
}: ContentTypeSelectorProps) {
    const [selectedType, setSelectedType] = useState<ContentTypeOption | null>(null);
    const [generatedContent, setGeneratedContent] = useState<VoiceToContentOutput | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleTypeSelect = async (option: ContentTypeOption) => {
        setSelectedType(option);
        setGeneratedContent(null);

        // Generate content using the voice-to-content flow
        try {
            // Import the flow dynamically
            const { convertVoiceToContent } = await import('@/aws/bedrock/flows/voice-to-content');

            const result = await convertVoiceToContent({
                transcript,
                contentType: option.type,
                userId: 'current-user', // This should come from auth context
                tone: 'professional',
                length: 'medium'
            });

            setGeneratedContent(result);
            setEditedContent(result.content);
            onContentGenerated(result);
        } catch (error) {
            console.error('Content generation error:', error);
            // Handle error - could show toast notification
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        if (generatedContent) {
            const updatedContent = {
                ...generatedContent,
                content: editedContent,
                wordCount: editedContent.split(/\s+/).length
            };
            setGeneratedContent(updatedContent);
            onContentGenerated(updatedContent);
        }
        setIsEditing(false);
    };

    const handleSaveToLibrary = async () => {
        if (!generatedContent || !onSaveToLibrary) return;

        setIsSaving(true);
        try {
            await onSaveToLibrary(generatedContent);
        } catch (error) {
            console.error('Save to library error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBack = () => {
        setSelectedType(null);
        setGeneratedContent(null);
        setIsEditing(false);
    };

    if (generatedContent && selectedType) {
        return (
            <Card className={cn("w-full max-w-2xl mx-auto", className)}>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleBack}
                            variant="ghost"
                            size="sm"
                            className="p-2"
                        >
                            ←
                        </Button>
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", selectedType.color)}>
                            <selectedType.icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{generatedContent.title}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {selectedType.label} • {generatedContent.wordCount} words • {generatedContent.estimatedReadTime} min read
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Summary */}
                    <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Summary</p>
                        <p className="text-sm text-muted-foreground">{generatedContent.summary}</p>
                    </div>

                    {/* Key Points */}
                    {generatedContent.keyPoints.length > 0 && (
                        <div>
                            <p className="text-sm font-medium mb-2">Key Points</p>
                            <div className="space-y-1">
                                {generatedContent.keyPoints.map((point, index) => (
                                    <div key={index} className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                        <p className="text-sm">{point}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">Content</p>
                            <Button
                                onClick={isEditing ? handleSaveEdit : handleEdit}
                                variant="outline"
                                size="sm"
                                className="h-8"
                            >
                                {isEditing ? (
                                    <>
                                        <Save className="w-3 h-3 mr-1" />
                                        Save
                                    </>
                                ) : (
                                    <>
                                        <Edit3 className="w-3 h-3 mr-1" />
                                        Edit
                                    </>
                                )}
                            </Button>
                        </div>

                        {isEditing ? (
                            <Textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="min-h-[200px] text-sm"
                                placeholder="Edit your content..."
                            />
                        ) : (
                            <div className="p-3 bg-muted/30 rounded-lg max-h-60 overflow-y-auto">
                                <p className="text-sm whitespace-pre-wrap">{generatedContent.content}</p>
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    {generatedContent.tags.length > 0 && (
                        <div>
                            <p className="text-sm font-medium mb-2">Tags</p>
                            <div className="flex flex-wrap gap-1">
                                {generatedContent.tags.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Call to Action */}
                    {generatedContent.callToAction && (
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <p className="text-sm font-medium mb-1">Suggested Call-to-Action</p>
                            <p className="text-sm">{generatedContent.callToAction}</p>
                        </div>
                    )}

                    {/* Social Media Snippet */}
                    {generatedContent.socialMediaSnippet && (
                        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <p className="text-sm font-medium mb-1">Social Media Snippet</p>
                            <p className="text-sm">{generatedContent.socialMediaSnippet}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={handleBack}
                            variant="outline"
                            className={TOUCH_FRIENDLY_CLASSES.button}
                        >
                            Generate Another
                        </Button>

                        {onSaveToLibrary && (
                            <Button
                                onClick={handleSaveToLibrary}
                                disabled={isSaving}
                                className={TOUCH_FRIENDLY_CLASSES.button}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save to Library
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("w-full max-w-md mx-auto", className)}>
            <CardHeader>
                <CardTitle className="text-lg">Choose Content Type</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Select how you'd like to transform your voice memo
                </p>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Transcript Preview */}
                <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium mb-1 text-muted-foreground">TRANSCRIPT PREVIEW</p>
                    <p className="text-sm line-clamp-3">{transcript}</p>
                </div>

                {/* Content Type Options */}
                <div className="space-y-2">
                    {CONTENT_TYPE_OPTIONS.map((option) => (
                        <Button
                            key={option.type}
                            onClick={() => handleTypeSelect(option)}
                            disabled={isGenerating}
                            variant="outline"
                            className={cn(
                                "w-full h-auto p-4 justify-start",
                                TOUCH_FRIENDLY_CLASSES.button
                            )}
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", option.color)}>
                                    <option.icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="font-medium">{option.label}</p>
                                    <p className="text-xs text-muted-foreground">{option.description}</p>
                                </div>
                                {isGenerating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                            </div>
                        </Button>
                    ))}
                </div>

                {isGenerating && (
                    <div className="text-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                            Generating content...
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}