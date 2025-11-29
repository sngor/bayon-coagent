'use client';

/**
 * Template Save Modal Component
 * 
 * Provides an intuitive interface for saving content creation configurations as templates.
 * Features preview generation, metadata capture, and categorization with search-friendly tags.
 * 
 * Requirements:
 * - 9.1: Save custom prompts and content templates
 * - 9.2: Store all prompt parameters and content structure
 * - Smart positioning and user-friendly interface
 * - Preview generation for easy identification
 * - Descriptive naming and categorization
 */

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, Sparkles, Tag, X } from 'lucide-react';
import { ContentCategory, TemplateConfiguration } from '@/lib/content-workflow-types';
import { saveTemplateAction } from '@/features/content-engine/actions/content-workflow-actions';

interface TemplateSaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaved: (templateId: string) => void;
    contentType: ContentCategory;
    configuration: TemplateConfiguration;
    initialName?: string;
    previewContent?: string;
}

export function TemplateSaveModal({
    isOpen,
    onClose,
    onSaved,
    contentType,
    configuration,
    initialName = '',
    previewContent = ''
}: TemplateSaveModalProps) {
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState('');
    const [isSeasonal, setIsSeasonal] = useState(false);

    // Content type display names
    const contentTypeLabels: Record<ContentCategory, string> = {
        [ContentCategory.MARKET_UPDATE]: 'Market Update',
        [ContentCategory.BLOG_POST]: 'Blog Post',
        [ContentCategory.VIDEO_SCRIPT]: 'Video Script',
        [ContentCategory.NEIGHBORHOOD_GUIDE]: 'Neighborhood Guide',
        [ContentCategory.SOCIAL_MEDIA]: 'Social Media Post',
        [ContentCategory.LISTING_DESCRIPTION]: 'Listing Description',
        [ContentCategory.NEWSLETTER]: 'Newsletter',
        [ContentCategory.EMAIL_TEMPLATE]: 'Email Template'
    };

    const handleAddTag = () => {
        if (currentTag.trim() && !tags.includes(currentTag.trim())) {
            setTags([...tags, currentTag.trim()]);
            setCurrentTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleSave = () => {
        if (!name.trim()) {
            toast({
                variant: 'destructive',
                title: 'Name Required',
                description: 'Please enter a name for your template.',
            });
            return;
        }

        startTransition(async () => {
            try {
                const result = await saveTemplateAction(
                    name.trim(),
                    description.trim(),
                    contentType,
                    configuration,
                    isSeasonal,
                    tags.length > 0 ? tags : undefined
                );

                if (result.success) {
                    toast({
                        title: 'Template Saved!',
                        description: `"${name}" has been saved to your template library.`,
                    });

                    onSaved(result.data?.templateId || '');
                    handleClose();
                } else {
                    throw new Error(result.message || 'Failed to save template');
                }
            } catch (error) {
                console.error('Failed to save template:', error);
                toast({
                    variant: 'destructive',
                    title: 'Save Failed',
                    description: error instanceof Error ? error.message : 'Could not save template. Please try again.',
                });
            }
        });
    };

    const handleClose = () => {
        setName(initialName);
        setDescription('');
        setTags([]);
        setCurrentTag('');
        setIsSeasonal(false);
        onClose();
    };

    // Generate preview text based on configuration
    const generatePreviewText = () => {
        const { promptParameters, stylePreferences } = configuration;
        const parts = [];

        if (stylePreferences.tone) {
            parts.push(`Tone: ${stylePreferences.tone}`);
        }
        if (stylePreferences.targetAudience) {
            parts.push(`Audience: ${stylePreferences.targetAudience}`);
        }
        if (stylePreferences.length) {
            parts.push(`Length: ${stylePreferences.length}`);
        }
        if (promptParameters.topic) {
            parts.push(`Topic: ${promptParameters.topic}`);
        }

        return parts.join(' • ');
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Save as Template
                    </DialogTitle>
                    <DialogDescription>
                        Save this configuration as a reusable template for future content creation.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Template Preview Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Template Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">{contentTypeLabels[contentType]}</Badge>
                                {isSeasonal && <Badge variant="outline">Seasonal</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {generatePreviewText() || 'Configuration details will appear here'}
                            </p>
                            {previewContent && (
                                <div className="mt-3 p-3 bg-muted/50 rounded-md">
                                    <p className="text-xs text-muted-foreground mb-1">Content Preview:</p>
                                    <p className="text-sm line-clamp-3">{previewContent}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Template Details Form */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="template-name">Template Name *</Label>
                            <Input
                                id="template-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={`e.g., ${contentTypeLabels[contentType]} - Professional Tone`}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="template-description">Description</Label>
                            <Textarea
                                id="template-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe when and how to use this template..."
                                rows={3}
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="template-tags">Tags</Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                        <Tag className="h-3 w-3" />
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="ml-1 hover:text-destructive"
                                            aria-label={`Remove ${tag} tag`}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    id="template-tags"
                                    value={currentTag}
                                    onChange={(e) => setCurrentTag(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Add tags for easy searching..."
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddTag}
                                    disabled={!currentTag.trim()}
                                >
                                    Add
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Press Enter or click Add to include tags. Use tags like "professional", "casual", "luxury", etc.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="seasonal-toggle">Template Type</Label>
                            <Select value={isSeasonal ? 'seasonal' : 'general'} onValueChange={(value) => setIsSeasonal(value === 'seasonal')}>
                                <SelectTrigger id="seasonal-toggle">
                                    <SelectValue placeholder="Select template type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">General Template</SelectItem>
                                    <SelectItem value="seasonal">Seasonal Template</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Seasonal templates are suggested during relevant time periods.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isPending || !name.trim()}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Template
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}