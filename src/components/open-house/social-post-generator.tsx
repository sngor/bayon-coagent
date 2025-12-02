'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Share2, Copy, Check, Facebook, Linkedin, Twitter, Instagram, Send, Calendar, AlertCircle } from 'lucide-react';
import { generateOpenHouseSocialPosts } from '@/app/(app)/open-house/actions';
import { publishOpenHouseSocialPost, scheduleOpenHouseSocialPost, getSocialConnections } from '@/app/(app)/open-house/social-publishing-actions';
import { toast } from '@/hooks/use-toast';
import type { GenerateOpenHouseSocialPostsOutput } from '@/aws/bedrock/flows/generate-open-house-marketing';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface SocialPostGeneratorProps {
    sessionId: string;
}

type Platform = 'facebook' | 'instagram' | 'linkedin' | 'twitter';

interface ConnectionStatus {
    platform: Platform;
    connected: boolean;
    username?: string;
}

interface PublishingStatus {
    platform: Platform;
    status: 'idle' | 'publishing' | 'success' | 'error';
    postUrl?: string;
    error?: string;
}

/**
 * Component for generating platform-optimized social media posts
 * Validates Requirements: 16.3
 */
export function SocialPostGenerator({ sessionId }: SocialPostGeneratorProps) {
    const [loading, setLoading] = useState(false);
    const [posts, setPosts] = useState<GenerateOpenHouseSocialPostsOutput | null>(null);
    const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([
        'facebook',
        'instagram',
        'linkedin',
        'twitter',
    ]);
    const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
    const [connections, setConnections] = useState<ConnectionStatus[]>([]);
    const [loadingConnections, setLoadingConnections] = useState(true);
    const [publishingStatus, setPublishingStatus] = useState<Record<Platform, PublishingStatus>>({} as any);
    const [showScheduleDialog, setShowScheduleDialog] = useState(false);
    const [schedulePlatform, setSchedulePlatform] = useState<Platform | null>(null);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

    // Load social media connections on mount
    useEffect(() => {
        loadConnections();
    }, []);

    const loadConnections = async () => {
        setLoadingConnections(true);
        try {
            const result = await getSocialConnections();
            if (result.success && result.connections) {
                setConnections(result.connections);
            }
        } catch (error) {
            console.error('Failed to load connections:', error);
        } finally {
            setLoadingConnections(false);
        }
    };

    const platformConfig = {
        facebook: {
            label: 'Facebook',
            icon: Facebook,
            description: 'Engaging posts with community focus',
        },
        instagram: {
            label: 'Instagram',
            icon: Instagram,
            description: 'Visual storytelling with hashtags',
        },
        linkedin: {
            label: 'LinkedIn',
            icon: Linkedin,
            description: 'Professional networking content',
        },
        twitter: {
            label: 'Twitter',
            icon: Twitter,
            description: 'Concise, impactful messages',
        },
    };

    const isConnected = (platform: Platform) => {
        return connections.find(c => c.platform === platform)?.connected || false;
    };

    const getConnectionUsername = (platform: Platform) => {
        return connections.find(c => c.platform === platform)?.username;
    };

    const togglePlatform = (platform: Platform) => {
        setSelectedPlatforms((prev) =>
            prev.includes(platform)
                ? prev.filter((p) => p !== platform)
                : [...prev, platform]
        );
    };

    const handleGenerate = async () => {
        if (selectedPlatforms.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Platforms Selected',
                description: 'Please select at least one platform',
            });
            return;
        }

        setLoading(true);
        try {
            const result = await generateOpenHouseSocialPosts(sessionId, selectedPlatforms);

            if (result.success && result.posts) {
                setPosts(result.posts);
                toast({
                    title: '✨ Posts Generated!',
                    description: `Created posts for ${selectedPlatforms.length} platform(s)`,
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Generation Failed',
                    description: result.error || 'Failed to generate social posts',
                });
            }
        } catch (error) {
            console.error('Social post generation error:', error);
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: 'An unexpected error occurred',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (platform: string, content: string) => {
        navigator.clipboard.writeText(content);
        setCopiedPlatform(platform);
        toast({
            title: '✨ Copied!',
            description: `${platformConfig[platform as Platform].label} post copied to clipboard`,
        });
        setTimeout(() => setCopiedPlatform(null), 2000);
    };

    const handlePublishNow = async (platform: Platform) => {
        if (!posts || !posts[platform]) {
            toast({
                variant: 'destructive',
                title: 'No Content',
                description: 'Please generate content first',
            });
            return;
        }

        if (!isConnected(platform)) {
            toast({
                variant: 'destructive',
                title: 'Not Connected',
                description: `Please connect your ${platformConfig[platform].label} account first`,
            });
            return;
        }

        setPublishingStatus(prev => ({
            ...prev,
            [platform]: { platform, status: 'publishing' }
        }));

        try {
            const result = await publishOpenHouseSocialPost(sessionId, platform, posts[platform]);

            if (result.success) {
                setPublishingStatus(prev => ({
                    ...prev,
                    [platform]: {
                        platform,
                        status: 'success',
                        postUrl: result.postUrl
                    }
                }));
                toast({
                    title: '✨ Published!',
                    description: `Post published to ${platformConfig[platform].label}`,
                });
            } else {
                setPublishingStatus(prev => ({
                    ...prev,
                    [platform]: {
                        platform,
                        status: 'error',
                        error: result.error
                    }
                }));
                toast({
                    variant: 'destructive',
                    title: 'Publishing Failed',
                    description: result.error || 'Failed to publish post',
                });
            }
        } catch (error) {
            console.error('Publishing error:', error);
            setPublishingStatus(prev => ({
                ...prev,
                [platform]: {
                    platform,
                    status: 'error',
                    error: 'An unexpected error occurred'
                }
            }));
            toast({
                variant: 'destructive',
                title: 'Publishing Failed',
                description: 'An unexpected error occurred',
            });
        }
    };

    const handleSchedule = (platform: Platform) => {
        if (!posts || !posts[platform]) {
            toast({
                variant: 'destructive',
                title: 'No Content',
                description: 'Please generate content first',
            });
            return;
        }

        if (!isConnected(platform)) {
            toast({
                variant: 'destructive',
                title: 'Not Connected',
                description: `Please connect your ${platformConfig[platform].label} account first`,
            });
            return;
        }

        setSchedulePlatform(platform);
        setShowScheduleDialog(true);
    };

    const handleScheduleSubmit = async () => {
        if (!schedulePlatform || !posts || !scheduleDate || !scheduleTime) {
            return;
        }

        const publishTime = new Date(`${scheduleDate}T${scheduleTime}`);
        if (publishTime <= new Date()) {
            toast({
                variant: 'destructive',
                title: 'Invalid Date',
                description: 'Please select a future date and time',
            });
            return;
        }

        try {
            const result = await scheduleOpenHouseSocialPost(
                sessionId,
                schedulePlatform,
                posts[schedulePlatform],
                publishTime
            );

            if (result.success) {
                toast({
                    title: '✨ Scheduled!',
                    description: `Post scheduled for ${platformConfig[schedulePlatform].label}`,
                });
                setShowScheduleDialog(false);
                setSchedulePlatform(null);
                setScheduleDate('');
                setScheduleTime('');
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Scheduling Failed',
                    description: result.error || 'Failed to schedule post',
                });
            }
        } catch (error) {
            console.error('Scheduling error:', error);
            toast({
                variant: 'destructive',
                title: 'Scheduling Failed',
                description: 'An unexpected error occurred',
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Connection Status Alert */}
            {!loadingConnections && connections.length > 0 && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-1">
                            <p className="font-semibold">Social Media Connections:</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {(Object.keys(platformConfig) as Platform[]).map((platform) => {
                                    const connected = isConnected(platform);
                                    const username = getConnectionUsername(platform);
                                    return (
                                        <span
                                            key={platform}
                                            className={`text-xs px-2 py-1 rounded-full ${connected
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                }`}
                                        >
                                            {platformConfig[platform].label}:{' '}
                                            {connected ? (username || 'Connected') : 'Not Connected'}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Platform Selection */}
            <div className="space-y-3">
                <Label>Select Platforms</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(Object.keys(platformConfig) as Platform[]).map((platform) => {
                        const config = platformConfig[platform];
                        const Icon = config.icon;
                        const isSelected = selectedPlatforms.includes(platform);
                        const connected = isConnected(platform);

                        return (
                            <div
                                key={platform}
                                className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                    }`}
                                onClick={() => togglePlatform(platform)}
                            >
                                <Checkbox
                                    id={platform}
                                    checked={isSelected}
                                    onCheckedChange={() => togglePlatform(platform)}
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Icon className="h-4 w-4" />
                                        <Label
                                            htmlFor={platform}
                                            className="font-semibold cursor-pointer"
                                        >
                                            {config.label}
                                        </Label>
                                        {connected && (
                                            <span className="text-xs text-green-600 dark:text-green-400">
                                                ● Connected
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {config.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Generate Button */}
            <Button
                onClick={handleGenerate}
                disabled={loading || selectedPlatforms.length === 0}
                className="w-full"
                size="lg"
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Posts...
                    </>
                ) : (
                    <>
                        <Share2 className="mr-2 h-4 w-4" />
                        Generate Social Posts
                    </>
                )}
            </Button>

            {/* Generated Posts */}
            {posts && (
                <Card>
                    <CardContent className="pt-6">
                        <Tabs defaultValue={selectedPlatforms[0]} className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                {selectedPlatforms.map((platform) => {
                                    const Icon = platformConfig[platform].icon;
                                    return (
                                        <TabsTrigger key={platform} value={platform}>
                                            <Icon className="h-4 w-4 mr-2" />
                                            {platformConfig[platform].label}
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>

                            {selectedPlatforms.map((platform) => {
                                const post = posts[platform];
                                if (!post) return null;

                                // Get the correct content field based on platform
                                const getPostContent = () => {
                                    if (platform === 'facebook' || platform === 'linkedin') {
                                        return (post as any).post;
                                    } else if (platform === 'instagram') {
                                        return (post as any).caption;
                                    } else if (platform === 'twitter') {
                                        return (post as any).tweet;
                                    }
                                    return '';
                                };

                                const content = getPostContent();

                                return (
                                    <TabsContent key={platform} value={platform} className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold">
                                                {platformConfig[platform].label} Post
                                            </h3>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCopy(platform, content)}
                                                disabled={copiedPlatform === platform}
                                            >
                                                {copiedPlatform === platform ? (
                                                    <>
                                                        <Check className="mr-2 h-4 w-4" />
                                                        Copied
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        Copy
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        <div className="p-4 rounded-lg border bg-muted/50 whitespace-pre-wrap">
                                            {content}
                                        </div>

                                        {post.hashtags && post.hashtags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {post.hashtags.map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-sm text-primary font-medium"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {platform === 'instagram' && (post as any).storyText && (
                                            <div className="p-3 rounded-lg border bg-muted/30">
                                                <p className="text-sm font-semibold mb-1">Story Text:</p>
                                                <p className="text-sm">{(post as any).storyText}</p>
                                            </div>
                                        )}

                                        <div className="text-sm text-muted-foreground">
                                            <span className="font-semibold">Call to Action:</span>{' '}
                                            {post.callToAction}
                                        </div>

                                        {/* Publishing Actions */}
                                        {isConnected(platform) && (
                                            <div className="flex gap-2 pt-4 border-t">
                                                <Button
                                                    onClick={() => handlePublishNow(platform)}
                                                    disabled={publishingStatus[platform]?.status === 'publishing'}
                                                    className="flex-1"
                                                >
                                                    {publishingStatus[platform]?.status === 'publishing' ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Publishing...
                                                        </>
                                                    ) : publishingStatus[platform]?.status === 'success' ? (
                                                        <>
                                                            <Check className="mr-2 h-4 w-4" />
                                                            Published
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Send className="mr-2 h-4 w-4" />
                                                            Publish Now
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleSchedule(platform)}
                                                    disabled={publishingStatus[platform]?.status === 'publishing'}
                                                >
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    Schedule
                                                </Button>
                                            </div>
                                        )}

                                        {/* Publishing Status */}
                                        {publishingStatus[platform]?.status === 'success' && publishingStatus[platform]?.postUrl && (
                                            <Alert className="mt-4">
                                                <Check className="h-4 w-4" />
                                                <AlertDescription>
                                                    Post published successfully!{' '}
                                                    <a
                                                        href={publishingStatus[platform].postUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="underline"
                                                    >
                                                        View post
                                                    </a>
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {publishingStatus[platform]?.status === 'error' && (
                                            <Alert variant="destructive" className="mt-4">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                    {publishingStatus[platform].error || 'Failed to publish post'}
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </TabsContent>
                                );
                            })}
                        </Tabs>
                    </CardContent>
                </Card>
            )}

            {/* Schedule Dialog */}
            <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule Post</DialogTitle>
                        <DialogDescription>
                            Choose when to publish this post to{' '}
                            {schedulePlatform && platformConfig[schedulePlatform].label}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="schedule-date">Date</Label>
                            <Input
                                id="schedule-date"
                                type="date"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="schedule-time">Time</Label>
                            <Input
                                id="schedule-time"
                                type="time"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleScheduleSubmit}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule Post
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
