'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Removed unused Textarea import
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
import { toast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { saveContentToLibraryAction, getUserProjectsAction, type SaveContentInput } from '@/app/library-actions';

interface SaveToLibraryDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    content: string;
    contentType: SaveContentInput['type'];
    suggestedName?: string;
    onSaved?: (savedItem: { id: string; name: string; type: string }) => void;
}

interface Project {
    id: string;
    name: string;
    createdAt: string;
}

export function SaveToLibraryDialog({
    isOpen,
    onOpenChange,
    content,
    contentType,
    suggestedName,
    onSaved,
}: SaveToLibraryDialogProps) {
    const [name, setName] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);

    // Load projects when dialog opens
    useEffect(() => {
        if (isOpen) {
            loadProjects();
            // Set suggested name if provided
            if (suggestedName) {
                setName(suggestedName);
            } else {
                // Generate a default name
                const typeNames = {
                    'blog-post': 'Blog Post',
                    'social-media': 'Social Media Post',
                    'video-script': 'Video Script',
                    'market-update': 'Market Update',
                    'neighborhood-guide': 'Neighborhood Guide',
                    'website-content': 'Website Content',
                    'listing-description': 'Listing Description',
                    'post-card': 'Post Card',
                    'open-house-flyer': 'Open House Flyer',
                    'email-invite': 'Email Invitation',
                };
                const typeName = typeNames[contentType] || 'Content';
                const timestamp = new Date().toLocaleDateString();
                setName(`${typeName} - ${timestamp}`);
            }
        }
    }, [isOpen, suggestedName, contentType]);

    const loadProjects = async () => {
        setIsLoadingProjects(true);
        try {
            const result = await getUserProjectsAction();
            if (result.success) {
                setProjects(result.data);
            } else {
                console.error('Failed to load projects:', result.error);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setIsLoadingProjects(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast({
                title: 'Name Required',
                description: 'Please enter a name for your content.',
                variant: 'destructive',
            });
            return;
        }

        if (!content.trim()) {
            toast({
                title: 'No Content',
                description: 'There is no content to save.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await saveContentToLibraryAction({
                type: contentType,
                content: content.trim(),
                name: name.trim(),
                projectId: selectedProjectId || undefined,
                metadata: {
                    savedFrom: 'studio',
                    savedAt: new Date().toISOString(),
                },
            });

            if (result.success && result.data) {
                toast({
                    title: 'Content Saved!',
                    description: `"${result.data.name}" has been added to your library.`,
                });

                onSaved?.(result.data);
                onOpenChange(false);

                // Reset form
                setName('');
                setSelectedProjectId('');
            } else {
                toast({
                    title: 'Save Failed',
                    description: result.error || 'Failed to save content to library.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error saving content:', error);
            toast({
                title: 'Save Failed',
                description: 'An unexpected error occurred while saving.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getContentPreview = () => {
        const maxLength = 200;
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Save className="h-5 w-5" />
                        Save to Library
                    </DialogTitle>
                    <DialogDescription>
                        Save this content to your library for future use and organization.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Content Preview */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Content Preview</Label>
                        <div className="p-3 bg-muted rounded-md text-sm max-h-32 overflow-y-auto">
                            {getContentPreview()}
                        </div>
                    </div>

                    {/* Name Input */}
                    <div className="space-y-2">
                        <Label htmlFor="content-name">Name *</Label>
                        <Input
                            id="content-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter a descriptive name..."
                            className="w-full"
                        />
                    </div>

                    {/* Project Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="project-select">Project (Optional)</Label>
                        <Select
                            value={selectedProjectId}
                            onValueChange={setSelectedProjectId}
                            disabled={isLoadingProjects}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : "Select a project (optional)"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">No Project (Uncategorized)</SelectItem>
                                {projects.map((project) => (
                                    <SelectItem key={project.id} value={project.id}>
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Organize your content by adding it to a project folder.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading || !name.trim()}
                        className="min-w-[100px]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}