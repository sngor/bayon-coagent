"use client";

/**
 * Content Detail Modal Component
 * 
 * Comprehensive detail view for scheduled content with:
 * - Content preview with formatting
 * - Scheduling information with timezone display
 * - Inline editing with validation
 * - Quick actions (edit, reschedule, duplicate, delete)
 * - Performance metrics when available
 * 
 * Validates: Requirements 2.3
 */

import * as React from "react";
import { format } from "date-fns";
import {
    Calendar,
    Clock,
    Edit2,
    Copy,
    Trash2,
    ExternalLink,
    TrendingUp,
    Eye,
    Heart,
    Share2,
    MessageCircle,
    MousePointer,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/common";
import type {
    ScheduledContent,
    PublishChannel,
    ScheduledContentStatus,
    ContentCategory,
    PublishChannelType,
    EngagementMetrics,
} from "@/lib/types/content-workflow-types";

/**
 * Props for ContentDetailModal component
 */
export interface ContentDetailModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Callback when modal should close */
    onOpenChange: (open: boolean) => void;
    /** The scheduled content to display */
    content: ScheduledContent | null;
    /** Optional analytics data for the content */
    analytics?: {
        metrics: EngagementMetrics;
        lastUpdated: Date;
    };
    /** Callback when content is edited */
    onEdit?: (contentId: string, updates: Partial<ScheduledContent>) => Promise<void>;
    /** Callback when content is rescheduled */
    onReschedule?: (contentId: string, newTime: Date) => Promise<void>;
    /** Callback when content is duplicated */
    onDuplicate?: (contentId: string) => Promise<void>;
    /** Callback when content is deleted */
    onDelete?: (contentId: string) => Promise<void>;
    /** Whether actions are currently loading */
    isLoading?: boolean;
}

/**
 * Get status badge variant based on content status
 */
function getStatusBadgeVariant(status: ScheduledContentStatus): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case "scheduled":
            return "default";
        case "publishing":
            return "secondary";
        case "published":
            return "outline";
        case "failed":
            return "destructive";
        case "cancelled":
            return "secondary";
        default:
            return "default";
    }
}

/**
 * Get status icon based on content status
 */
function getStatusIcon(status: ScheduledContentStatus) {
    switch (status) {
        case "scheduled":
            return <Clock className="h-3 w-3" />;
        case "publishing":
            return <Loader2 className="h-3 w-3 animate-spin" />;
        case "published":
            return <CheckCircle2 className="h-3 w-3" />;
        case "failed":
            return <XCircle className="h-3 w-3" />;
        case "cancelled":
            return <AlertCircle className="h-3 w-3" />;
        default:
            return <Clock className="h-3 w-3" />;
    }
}

/**
 * Get channel icon based on channel type
 */
function getChannelIcon(type: PublishChannelType) {
    // Using generic icons since we don't have brand-specific ones
    return <Share2 className="h-4 w-4" />;
}

/**
 * Format content type for display
 */
function formatContentType(type: ContentCategory): string {
    return type
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

/**
 * Content Detail Modal Component
 */
export function ContentDetailModal({
    open,
    onOpenChange,
    content,
    analytics,
    onEdit,
    onReschedule,
    onDuplicate,
    onDelete,
    isLoading = false,
}: ContentDetailModalProps) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editedTitle, setEditedTitle] = React.useState("");
    const [editedContent, setEditedContent] = React.useState("");
    const [editedPublishTime, setEditedPublishTime] = React.useState("");

    // Reset editing state when content changes
    React.useEffect(() => {
        if (content) {
            setEditedTitle(content.title);
            setEditedContent(content.content);
            setEditedPublishTime(format(new Date(content.publishTime), "yyyy-MM-dd'T'HH:mm"));
            setIsEditing(false);
        }
    }, [content]);

    if (!content) {
        return null;
    }

    const handleSaveEdit = async () => {
        if (!onEdit) return;

        try {
            const updates: Partial<ScheduledContent> = {};

            if (editedTitle !== content.title) {
                updates.title = editedTitle;
            }

            if (editedContent !== content.content) {
                updates.content = editedContent;
            }

            const newPublishTime = new Date(editedPublishTime);
            if (newPublishTime.getTime() !== new Date(content.publishTime).getTime()) {
                updates.publishTime = newPublishTime;
            }

            if (Object.keys(updates).length > 0) {
                await onEdit(content.id, updates);
            }

            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save edits:", error);
        }
    };

    const handleCancelEdit = () => {
        setEditedTitle(content.title);
        setEditedContent(content.content);
        setEditedPublishTime(format(new Date(content.publishTime), "yyyy-MM-dd'T'HH:mm"));
        setIsEditing(false);
    };

    const handleReschedule = async () => {
        if (!onReschedule) return;

        const newTime = new Date(editedPublishTime);
        if (newTime.getTime() !== new Date(content.publishTime).getTime()) {
            await onReschedule(content.id, newTime);
        }
    };

    const handleDuplicate = async () => {
        if (!onDuplicate) return;
        await onDuplicate(content.id);
    };

    const handleDelete = async () => {
        if (!onDelete) return;

        // Confirm deletion
        if (window.confirm("Are you sure you want to delete this scheduled content?")) {
            await onDelete(content.id);
            onOpenChange(false);
        }
    };

    // Get user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] p-0">
                <ScrollArea className="max-h-[90vh]">
                    <div className="p-6">
                        <DialogHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-title">Title</Label>
                                            <Input
                                                id="edit-title"
                                                value={editedTitle}
                                                onChange={(e) => setEditedTitle(e.target.value)}
                                                placeholder="Content title"
                                                className="text-lg font-semibold"
                                            />
                                        </div>
                                    ) : (
                                        <DialogTitle className="text-2xl">{content.title}</DialogTitle>
                                    )}

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant={getStatusBadgeVariant(content.status)} className="gap-1">
                                            {getStatusIcon(content.status)}
                                            {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
                                        </Badge>
                                        <Badge variant="outline">{formatContentType(content.contentType)}</Badge>
                                        {content.metadata?.tags?.map((tag) => (
                                            <Badge key={tag} variant="secondary">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>

                        <Separator className="my-6" />

                        {/* Scheduling Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Scheduling Information
                            </h3>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="publish-time" className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Publish Time
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            id="publish-time"
                                            type="datetime-local"
                                            value={editedPublishTime}
                                            onChange={(e) => setEditedPublishTime(e.target.value)}
                                            min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                                        />
                                    ) : (
                                        <p className="text-sm">
                                            {format(new Date(content.publishTime), "PPP 'at' p")}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Timezone: {userTimezone}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Created
                                    </Label>
                                    <p className="text-sm">
                                        {format(new Date(content.createdAt), "PPP 'at' p")}
                                    </p>
                                </div>
                            </div>

                            {/* Channels */}
                            <div className="space-y-2">
                                <Label>Publishing Channels</Label>
                                <div className="flex flex-wrap gap-2">
                                    {content.channels.map((channel) => (
                                        <Badge
                                            key={`${channel.type}-${channel.accountId}`}
                                            variant="outline"
                                            className="gap-2"
                                        >
                                            {getChannelIcon(channel.type)}
                                            <span className="capitalize">{channel.type}</span>
                                            <span className="text-muted-foreground">• {channel.accountName}</span>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Content Preview */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Content Preview
                            </h3>

                            {isEditing ? (
                                <div className="space-y-2">
                                    <Label htmlFor="edit-content">Content</Label>
                                    <Textarea
                                        id="edit-content"
                                        value={editedContent}
                                        onChange={(e) => setEditedContent(e.target.value)}
                                        placeholder="Content text"
                                        rows={10}
                                        className="font-mono text-sm"
                                    />
                                </div>
                            ) : (
                                <div className="rounded-lg border bg-muted/50 p-4">
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                        {content.content}
                                    </p>
                                </div>
                            )}

                            {/* Media URLs */}
                            {content.metadata?.mediaUrls && content.metadata.mediaUrls.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Attached Media</Label>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {content.metadata.mediaUrls.map((url, index) => (
                                            <a
                                                key={index}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 rounded-md border p-2 text-sm hover:bg-accent transition-colors"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                <span className="truncate">Media {index + 1}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Hashtags */}
                            {content.metadata?.hashtags && content.metadata.hashtags.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Hashtags</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {content.metadata.hashtags.map((tag) => (
                                            <Badge key={tag} variant="secondary">
                                                #{tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Performance Metrics */}
                        {analytics && content.status === "published" && (
                            <>
                                <Separator className="my-6" />
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                            Performance Metrics
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Last updated: {format(new Date(analytics.lastUpdated), "PPp")}
                                        </p>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <div className="flex items-center gap-3 rounded-lg border p-3">
                                            <div className="rounded-full bg-blue-500/10 p-2">
                                                <Eye className="h-4 w-4 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Views</p>
                                                <p className="text-lg font-semibold">
                                                    {analytics.metrics.views.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 rounded-lg border p-3">
                                            <div className="rounded-full bg-red-500/10 p-2">
                                                <Heart className="h-4 w-4 text-red-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Likes</p>
                                                <p className="text-lg font-semibold">
                                                    {analytics.metrics.likes.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 rounded-lg border p-3">
                                            <div className="rounded-full bg-green-500/10 p-2">
                                                <Share2 className="h-4 w-4 text-green-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Shares</p>
                                                <p className="text-lg font-semibold">
                                                    {analytics.metrics.shares.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 rounded-lg border p-3">
                                            <div className="rounded-full bg-purple-500/10 p-2">
                                                <MessageCircle className="h-4 w-4 text-purple-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Comments</p>
                                                <p className="text-lg font-semibold">
                                                    {analytics.metrics.comments.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 rounded-lg border p-3">
                                            <div className="rounded-full bg-orange-500/10 p-2">
                                                <MousePointer className="h-4 w-4 text-orange-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Clicks</p>
                                                <p className="text-lg font-semibold">
                                                    {analytics.metrics.clicks.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 rounded-lg border p-3">
                                            <div className="rounded-full bg-teal-500/10 p-2">
                                                <TrendingUp className="h-4 w-4 text-teal-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Engagement Rate</p>
                                                <p className="text-lg font-semibold">
                                                    {(analytics.metrics.engagementRate * 100).toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Publish Results */}
                        {content.publishResults && content.publishResults.length > 0 && (
                            <>
                                <Separator className="my-6" />
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        Publishing Results
                                    </h3>

                                    <div className="space-y-2">
                                        {content.publishResults.map((result, index) => (
                                            <div
                                                key={index}
                                                className={cn(
                                                    "flex items-center justify-between rounded-lg border p-3",
                                                    result.success ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {result.success ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4 text-red-500" />
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-medium capitalize">
                                                            {result.channel.type}
                                                        </p>
                                                        {result.error && (
                                                            <p className="text-xs text-muted-foreground">{result.error}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {result.publishedUrl && (
                                                    <a
                                                        href={result.publishedUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        View Post
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Action Buttons */}
                        <DialogFooter className="mt-6 gap-2">
                            {isEditing ? (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={handleCancelEdit}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSaveEdit}
                                        disabled={isLoading}
                                    >
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {content.status === "scheduled" && (
                                        <>
                                            <Button
                                                variant="outline"
                                                onClick={() => setIsEditing(true)}
                                                disabled={isLoading}
                                                className="gap-2"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleDuplicate}
                                                disabled={isLoading || !onDuplicate}
                                                className="gap-2"
                                            >
                                                <Copy className="h-4 w-4" />
                                                Duplicate
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                onClick={handleDelete}
                                                disabled={isLoading || !onDelete}
                                                className="gap-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </Button>
                                        </>
                                    )}

                                    {content.status === "published" && onDuplicate && (
                                        <Button
                                            variant="outline"
                                            onClick={handleDuplicate}
                                            disabled={isLoading}
                                            className="gap-2"
                                        >
                                            <Copy className="h-4 w-4" />
                                            Duplicate
                                        </Button>
                                    )}
                                </>
                            )}
                        </DialogFooter>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
