'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    Image,
    Video,
    CheckCircle,
    XCircle,
    Flag,
    Eye,
    User,
    Calendar
} from 'lucide-react';
import { ContentItem } from '@/types/content-moderation';

const CONTENT_TYPES = {
    blog_post: { label: 'Blog Post', icon: FileText },
    social_media: { label: 'Social Media', icon: Flag },
    listing_description: { label: 'Listing', icon: FileText },
    image: { label: 'Image', icon: Image },
    video: { label: 'Video', icon: Video }
} as const;

const STATUS_CONFIG = {
    pending: { label: 'Pending', variant: 'secondary' as const, icon: Flag },
    approved: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
    rejected: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle },
    flagged: { label: 'Flagged', variant: 'destructive' as const, icon: Flag }
} as const;

interface ContentModerationCardProps {
    item: ContentItem;
    onModerate: (contentId: string, action: 'approve' | 'reject', reason?: string) => Promise<void>;
    onViewDetails: (contentId: string) => void;
}

export function ContentModerationCard({ item, onModerate, onViewDetails }: ContentModerationCardProps) {
    const getTypeIcon = (type: ContentItem['type']) => {
        const IconComponent = CONTENT_TYPES[type]?.icon || FileText;
        return <IconComponent className="h-4 w-4" />;
    };

    const getStatusBadge = (status: ContentItem['status']) => {
        const config = STATUS_CONFIG[status];
        const IconComponent = config.icon;
        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <IconComponent className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    const canModerate = item.status === 'pending' || item.status === 'flagged';

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            {getTypeIcon(item.type)}
                            <CardTitle className="text-lg">{item.title}</CardTitle>
                            {getStatusBadge(item.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {item.userName} ({item.userEmail})
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(item.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {canModerate ? (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onModerate(item.id, 'approve')}
                                >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => onModerate(item.id, 'reject')}
                                >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                </Button>
                            </>
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onViewDetails(item.id)}
                            >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.content}
                </p>
                {item.flagReason && (
                    <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded">
                        <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                            <Flag className="h-4 w-4" />
                            Flag Reason
                        </div>
                        <p className="text-sm text-destructive/80 mt-1">{item.flagReason}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}