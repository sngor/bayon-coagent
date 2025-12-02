'use client';

/**
 * FollowUpHistory Component
 * 
 * Displays history of generated and sent follow-ups for a session.
 * Shows delivery status, engagement tracking, and allows viewing content.
 * 
 * Validates Requirements: 3.1, 13.3, 13.5
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Mail,
    MessageSquare,
    Clock,
    CheckCircle2,
    XCircle,
    Eye,
    MousePointerClick,
    Send,
    Loader2,
} from 'lucide-react';
import { FollowUpContent, Visitor } from '@/lib/open-house/types';
import { format, formatDistanceToNow } from 'date-fns';
import { FollowUpPreview } from './follow-up-preview';
import { getFollowUpContent } from '@/app/(app)/open-house/actions';

interface FollowUpHistoryProps {
    sessionId: string;
    visitors: Visitor[];
}

interface FollowUpWithVisitor {
    content: FollowUpContent;
    visitor: Visitor;
}

export function FollowUpHistory({ sessionId, visitors }: FollowUpHistoryProps) {
    const [followUps, setFollowUps] = useState<FollowUpWithVisitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadFollowUps();
    }, [sessionId, visitors]);

    const loadFollowUps = async () => {
        setLoading(true);
        setError(null);

        try {
            const followUpsData: FollowUpWithVisitor[] = [];

            // Load follow-up content for each visitor who has one generated
            for (const visitor of visitors) {
                if (visitor.followUpGenerated) {
                    const result = await getFollowUpContent(sessionId, visitor.visitorId);
                    if (result.content) {
                        followUpsData.push({
                            content: result.content,
                            visitor,
                        });
                    }
                }
            }

            // Sort by generation date (most recent first)
            followUpsData.sort((a, b) =>
                new Date(b.content.generatedAt).getTime() - new Date(a.content.generatedAt).getTime()
            );

            setFollowUps(followUpsData);
        } catch (err) {
            setError('Failed to load follow-up history');
            console.error('Error loading follow-ups:', err);
        } finally {
            setLoading(false);
        }
    };

    const getDeliveryStatusIcon = (status?: string) => {
        switch (status) {
            case 'sent':
            case 'delivered':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const getDeliveryStatusColor = (status?: string) => {
        switch (status) {
            case 'sent':
            case 'delivered':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'pending':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'failed':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
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

    const stats = {
        total: followUps.length,
        sent: followUps.filter(f => f.content.sentAt).length,
        pending: followUps.filter(f => !f.content.sentAt).length,
        opened: followUps.filter(f => f.content.openedAt).length,
        clicked: followUps.filter(f => f.content.clickedAt).length,
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Follow-up History
                    </CardTitle>
                    <CardDescription>
                        Track generated and sent follow-ups
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Follow-up History
                    </CardTitle>
                    <CardDescription>
                        Track generated and sent follow-ups
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <XCircle className="h-12 w-12 mx-auto mb-2 text-destructive opacity-50" />
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <Button variant="outline" size="sm" onClick={loadFollowUps} className="mt-4">
                            Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (followUps.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Follow-up History
                    </CardTitle>
                    <CardDescription>
                        Track generated and sent follow-ups
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No follow-ups generated yet</p>
                        <p className="text-sm mt-1">Generate follow-ups to see them here</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Follow-up History
                </CardTitle>
                <CardDescription>
                    Track generated and sent follow-ups
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-xs text-muted-foreground">Generated</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-green-500">{stats.sent}</p>
                        <p className="text-xs text-muted-foreground">Sent</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-blue-500">{stats.opened}</p>
                        <p className="text-xs text-muted-foreground">Opened</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-purple-500">{stats.clicked}</p>
                        <p className="text-xs text-muted-foreground">Clicked</p>
                    </div>
                </div>

                <Separator />

                {/* Follow-up List */}
                <div className="space-y-4">
                    {followUps.map(({ content, visitor }) => (
                        <div
                            key={content.contentId}
                            className="p-4 border rounded-lg space-y-3"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium">{visitor.name}</p>
                                        <Badge
                                            variant="outline"
                                            className={getInterestLevelColor(visitor.interestLevel)}
                                        >
                                            {visitor.interestLevel}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className={getDeliveryStatusColor(content.deliveryStatus)}
                                        >
                                            {getDeliveryStatusIcon(content.deliveryStatus)}
                                            <span className="ml-1">
                                                {content.deliveryStatus || 'pending'}
                                            </span>
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{visitor.email}</p>
                                </div>
                                <FollowUpPreview content={content} visitor={visitor} />
                            </div>

                            {/* Email Subject */}
                            <div className="flex items-start gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{content.emailSubject}</p>
                                </div>
                            </div>

                            {/* SMS if available */}
                            {content.smsMessage && content.smsMessage.trim() !== '' && (
                                <div className="flex items-start gap-2">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {content.smsMessage}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                        Generated {formatDistanceToNow(new Date(content.generatedAt), { addSuffix: true })}
                                    </span>
                                </div>
                                {content.sentAt && (
                                    <div className="flex items-center gap-1">
                                        <Send className="h-3 w-3" />
                                        <span>
                                            Sent {formatDistanceToNow(new Date(content.sentAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                )}
                                {content.openedAt && (
                                    <div className="flex items-center gap-1 text-blue-500">
                                        <Eye className="h-3 w-3" />
                                        <span>
                                            Opened {formatDistanceToNow(new Date(content.openedAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                )}
                                {content.clickedAt && (
                                    <div className="flex items-center gap-1 text-purple-500">
                                        <MousePointerClick className="h-3 w-3" />
                                        <span>
                                            Clicked {formatDistanceToNow(new Date(content.clickedAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
