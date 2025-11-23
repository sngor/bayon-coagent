'use client';

/**
 * Social Publishing Dialog Component
 * 
 * Provides UI for publishing listings to social media platforms.
 * Features platform selection, content preview, hashtag editing, and real-time status updates.
 * 
 * Requirements:
 * - 7.1: Display platform selection options with preview
 * - 7.3: Create posts for all selected platforms
 * - 9.5: Allow users to edit hashtags before publishing
 */

import { useState, useEffect } from 'react';
import { Listing } from '@/integrations/mls/types';
import { Platform } from '@/integrations/social/types';
import {
    getPublishingPreview,
    publishListing,
    retryPublish,
    checkPlatformConnections,
    PublishingPreview,
    PublishingStatus,
} from '@/app/social-publishing-actions';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Facebook, Instagram, Linkedin, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialPublishingDialogProps {
    listing: Listing;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const PLATFORM_INFO = {
    facebook: {
        name: 'Facebook',
        icon: Facebook,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
    },
    instagram: {
        name: 'Instagram',
        icon: Instagram,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
    },
    linkedin: {
        name: 'LinkedIn',
        icon: Linkedin,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
    },
};

export function SocialPublishingDialog({
    listing,
    open,
    onOpenChange,
    onSuccess,
}: SocialPublishingDialogProps) {
    const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
    const [previews, setPreviews] = useState<PublishingPreview[]>([]);
    const [customHashtags, setCustomHashtags] = useState<Record<Platform, string>>({
        facebook: '',
        instagram: '',
        linkedin: '',
    });
    const [customContent, setCustomContent] = useState('');
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishingResults, setPublishingResults] = useState<PublishingStatus[]>([]);
    const [platformConnections, setPlatformConnections] = useState<Record<Platform, boolean>>({
        facebook: false,
        instagram: false,
        linkedin: false,
    });
    const [error, setError] = useState<string | null>(null);

    // Check platform connections on mount
    useEffect(() => {
        if (open) {
            checkConnections();
        }
    }, [open]);

    // Load preview when platforms are selected
    useEffect(() => {
        if (selectedPlatforms.length > 0 && open) {
            loadPreview();
        }
    }, [selectedPlatforms, open]);

    const checkConnections = async () => {
        const result = await checkPlatformConnections();
        if (result.success && result.connections) {
            setPlatformConnections(result.connections);
        }
    };

    const loadPreview = async () => {
        setIsLoadingPreview(true);
        setError(null);

        try {
            const result = await getPublishingPreview(
                listing.listingId || '',
                selectedPlatforms
            );

            if (result.success && result.previews) {
                setPreviews(result.previews);

                // Initialize custom hashtags with generated ones
                const hashtagsMap: Record<Platform, string> = {
                    facebook: '',
                    instagram: '',
                    linkedin: '',
                };

                result.previews.forEach(preview => {
                    hashtagsMap[preview.platform] = preview.hashtags.join(' ');
                });

                setCustomHashtags(hashtagsMap);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load preview');
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handlePlatformToggle = (platform: Platform) => {
        if (!platformConnections[platform]) {
            setError(`Please connect your ${PLATFORM_INFO[platform].name} account in settings first.`);
            return;
        }

        setSelectedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    const handlePublish = async () => {
        if (selectedPlatforms.length === 0) {
            setError('Please select at least one platform');
            return;
        }

        setIsPublishing(true);
        setError(null);
        setPublishingResults([]);

        try {
            // Prepare custom hashtags array
            const hashtagsArray = selectedPlatforms.map(platform =>
                customHashtags[platform]
                    .split(/\s+/)
                    .filter(tag => tag.startsWith('#'))
            ).flat();

            const result = await publishListing({
                listingId: listing.listingId || '',
                platforms: selectedPlatforms,
                customContent: customContent || undefined,
                customHashtags: hashtagsArray.length > 0 ? hashtagsArray : undefined,
            });

            setPublishingResults(result.results);

            if (result.success) {
                onSuccess?.();

                // Close dialog after 2 seconds if all succeeded
                const allSucceeded = result.results.every(r => r.status === 'success');
                if (allSucceeded) {
                    setTimeout(() => {
                        onOpenChange(false);
                    }, 2000);
                }
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to publish');
        } finally {
            setIsPublishing(false);
        }
    };

    const handleRetry = async (platform: Platform) => {
        setError(null);

        try {
            const result = await retryPublish(listing.listingId || '', platform);

            if (result.success && result.result) {
                // Update the result for this platform
                setPublishingResults(prev =>
                    prev.map(r => r.platform === platform ? result.result! : r)
                );
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to retry');
        }
    };

    const getPreviewForPlatform = (platform: Platform) => {
        return previews.find(p => p.platform === platform);
    };

    const getResultForPlatform = (platform: Platform) => {
        return publishingResults.find(r => r.platform === platform);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Publish to Social Media</DialogTitle>
                    <DialogDescription>
                        Select platforms and customize your post before publishing
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-6">
                    {/* Platform Selection */}
                    <div>
                        <h3 className="font-headline text-sm font-medium mb-3">Select Platforms</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {(Object.keys(PLATFORM_INFO) as Platform[]).map(platform => {
                                const info = PLATFORM_INFO[platform];
                                const Icon = info.icon;
                                const isConnected = platformConnections[platform];
                                const isSelected = selectedPlatforms.includes(platform);

                                return (
                                    <button
                                        key={platform}
                                        onClick={() => handlePlatformToggle(platform)}
                                        disabled={!isConnected}
                                        className={cn(
                                            'flex items-center gap-3 p-4 rounded-lg border-2 transition-all',
                                            isSelected
                                                ? 'border-primary bg-primary/5'
                                                : 'border-gray-200 hover:border-gray-300',
                                            !isConnected && 'opacity-50 cursor-not-allowed'
                                        )}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            disabled={!isConnected}
                                        />
                                        <Icon className={cn('h-5 w-5', info.color)} />
                                        <div className="flex-1 text-left">
                                            <div className="font-medium">{info.name}</div>
                                            {!isConnected && (
                                                <div className="text-xs text-muted-foreground">
                                                    Not connected
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Preview and Customization */}
                    {selectedPlatforms.length > 0 && (
                        <>
                            {isLoadingPreview ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span className="ml-2">Loading preview...</span>
                                </div>
                            ) : (
                                <Tabs defaultValue={selectedPlatforms[0]} className="w-full">
                                    <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${selectedPlatforms.length}, 1fr)` }}>
                                        {selectedPlatforms.map(platform => {
                                            const info = PLATFORM_INFO[platform];
                                            const Icon = info.icon;
                                            const result = getResultForPlatform(platform);

                                            return (
                                                <TabsTrigger key={platform} value={platform} className="flex items-center gap-2">
                                                    <Icon className={cn('h-4 w-4', info.color)} />
                                                    {info.name}
                                                    {result && (
                                                        result.status === 'success' ? (
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                        ) : result.status === 'failed' ? (
                                                            <XCircle className="h-4 w-4 text-red-600" />
                                                        ) : null
                                                    )}
                                                </TabsTrigger>
                                            );
                                        })}
                                    </TabsList>

                                    {selectedPlatforms.map(platform => {
                                        const preview = getPreviewForPlatform(platform);
                                        const result = getResultForPlatform(platform);

                                        if (!preview) return null;

                                        return (
                                            <TabsContent key={platform} value={platform} className="space-y-4">
                                                {/* Publishing Status */}
                                                {result && (
                                                    <Alert
                                                        variant={
                                                            result.status === 'success'
                                                                ? 'default'
                                                                : result.status === 'failed'
                                                                    ? 'destructive'
                                                                    : 'default'
                                                        }
                                                    >
                                                        {result.status === 'success' ? (
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        ) : result.status === 'failed' ? (
                                                            <XCircle className="h-4 w-4" />
                                                        ) : (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        )}
                                                        <AlertDescription>
                                                            {result.status === 'success' && (
                                                                <>
                                                                    Successfully published!{' '}
                                                                    {result.postUrl && (
                                                                        <a
                                                                            href={result.postUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="underline"
                                                                        >
                                                                            View post
                                                                        </a>
                                                                    )}
                                                                </>
                                                            )}
                                                            {result.status === 'failed' && (
                                                                <>
                                                                    {result.error}{' '}
                                                                    <Button
                                                                        variant="link"
                                                                        size="sm"
                                                                        onClick={() => handleRetry(platform)}
                                                                        className="p-0 h-auto"
                                                                    >
                                                                        Retry
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {result.status === 'publishing' && 'Publishing...'}
                                                        </AlertDescription>
                                                    </Alert>
                                                )}

                                                {/* Content Preview */}
                                                <div>
                                                    <label className="text-sm font-medium mb-2 block">
                                                        Content Preview
                                                    </label>
                                                    <Textarea
                                                        value={customContent || preview.content}
                                                        onChange={(e) => setCustomContent(e.target.value)}
                                                        rows={8}
                                                        className="font-sans"
                                                    />
                                                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                                        <span>
                                                            {preview.characterCount} characters
                                                            {preview.truncated && ' (truncated)'}
                                                        </span>
                                                        <span>{preview.imageCount} images</span>
                                                    </div>
                                                </div>

                                                {/* Hashtags */}
                                                <div>
                                                    <label className="text-sm font-medium mb-2 block">
                                                        Hashtags (editable)
                                                    </label>
                                                    <Textarea
                                                        value={customHashtags[platform]}
                                                        onChange={(e) =>
                                                            setCustomHashtags(prev => ({
                                                                ...prev,
                                                                [platform]: e.target.value,
                                                            }))
                                                        }
                                                        rows={3}
                                                        placeholder="#realestate #dreamhome"
                                                        className="font-mono text-sm"
                                                    />
                                                    <div className="mt-2 text-xs text-muted-foreground">
                                                        {customHashtags[platform].split(/\s+/).filter(t => t.startsWith('#')).length} hashtags
                                                    </div>
                                                </div>
                                            </TabsContent>
                                        );
                                    })}
                                </Tabs>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPublishing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handlePublish}
                        disabled={selectedPlatforms.length === 0 || isPublishing || isLoadingPreview}
                    >
                        {isPublishing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Publishing...
                            </>
                        ) : (
                            `Publish to ${selectedPlatforms.length} Platform${selectedPlatforms.length !== 1 ? 's' : ''}`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
