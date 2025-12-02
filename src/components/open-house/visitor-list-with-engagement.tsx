/**
 * Visitor List with Engagement Component
 * 
 * Displays visitors with follow-up status and engagement tracking.
 * Validates Requirements: 7.1, 13.3, 13.5
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Users,
    Search,
    Mail,
    Phone,
    Clock,
    Eye,
    MousePointerClick,
    Send,
    Loader2,
} from 'lucide-react';
import { Visitor, FollowUpContent } from '@/lib/open-house/types';
import { getFollowUpContent } from '@/app/(app)/open-house/actions';
import { EngagementIndicator } from './engagement-indicator';
import { formatDistanceToNow } from 'date-fns';

interface VisitorListWithEngagementProps {
    sessionId: string;
    visitors: Visitor[];
}

interface VisitorWithEngagement extends Visitor {
    followUpContent?: FollowUpContent | null;
}

export function VisitorListWithEngagement({
    sessionId,
    visitors,
}: VisitorListWithEngagementProps) {
    const [visitorsWithEngagement, setVisitorsWithEngagement] = useState<VisitorWithEngagement[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterInterest, setFilterInterest] = useState<'all' | 'high' | 'medium' | 'low'>('all');

    useEffect(() => {
        loadEngagementData();
    }, [visitors]);

    const loadEngagementData = async () => {
        setLoading(true);

        try {
            // Load follow-up content for each visitor
            const visitorsWithData = await Promise.all(
                visitors.map(async (visitor) => {
                    if (visitor.followUpGenerated) {
                        const result = await getFollowUpContent(sessionId, visitor.visitorId);
                        return {
                            ...visitor,
                            followUpContent: result.content,
                        };
                    }
                    return {
                        ...visitor,
                        followUpContent: null,
                    };
                })
            );

            setVisitorsWithEngagement(visitorsWithData);
        } catch (error) {
            console.error('Error loading engagement data:', error);
            // Still show visitors even if engagement data fails to load
            setVisitorsWithEngagement(visitors.map(v => ({ ...v, followUpContent: null })));
        } finally {
            setLoading(false);
        }
    };

    // Filter visitors
    const filteredVisitors = visitorsWithEngagement.filter((visitor) => {
        // Search filter
        const matchesSearch =
            searchQuery === '' ||
            visitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            visitor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            visitor.phone.includes(searchQuery);

        // Interest level filter
        const matchesInterest =
            filterInterest === 'all' || visitor.interestLevel === filterInterest;

        return matchesSearch && matchesInterest;
    });

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

    const getEngagementScore = (visitor: VisitorWithEngagement): number => {
        if (!visitor.followUpContent || !visitor.followUpContent.sentAt) return 0;
        let score = 1; // Sent
        if (visitor.followUpContent.openedAt) score += 1; // Opened
        if (visitor.followUpContent.clickedAt) score += 1; // Clicked
        return score;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (visitors.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No visitors yet</p>
                <p className="text-sm">
                    Visitors will appear here once they check in
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search visitors..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={filterInterest === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterInterest('all')}
                    >
                        All
                    </Button>
                    <Button
                        variant={filterInterest === 'high' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterInterest('high')}
                    >
                        <div className="h-3 w-3 rounded-full bg-green-500 mr-2" />
                        High
                    </Button>
                    <Button
                        variant={filterInterest === 'medium' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterInterest('medium')}
                    >
                        <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2" />
                        Medium
                    </Button>
                    <Button
                        variant={filterInterest === 'low' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterInterest('low')}
                    >
                        <div className="h-3 w-3 rounded-full bg-gray-500 mr-2" />
                        Low
                    </Button>
                </div>
            </div>

            {/* Visitor Cards */}
            <div className="grid grid-cols-1 gap-4">
                {filteredVisitors.map((visitor) => {
                    const engagementScore = getEngagementScore(visitor);

                    return (
                        <Card key={visitor.visitorId}>
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                    {/* Visitor Info */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-lg">{visitor.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge
                                                        variant="outline"
                                                        className={getInterestLevelColor(visitor.interestLevel)}
                                                    >
                                                        {visitor.interestLevel} interest
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {visitor.source === 'qr' ? 'QR Code' : 'Manual'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Mail className="h-4 w-4" />
                                                <span>{visitor.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="h-4 w-4" />
                                                <span>{visitor.phone}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                <span>
                                                    Checked in{' '}
                                                    {formatDistanceToNow(new Date(visitor.checkInTime), {
                                                        addSuffix: true,
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        {visitor.notes && (
                                            <div className="p-3 bg-muted rounded-lg text-sm">
                                                <p className="text-muted-foreground whitespace-pre-wrap">
                                                    {visitor.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Engagement Tracking */}
                                    <div className="lg:w-64 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Follow-up Status</span>
                                            {engagementScore > 0 && (
                                                <Badge variant="outline" className="gap-1">
                                                    {engagementScore === 3 && (
                                                        <>
                                                            <MousePointerClick className="h-3 w-3 text-green-500" />
                                                            <span className="text-green-500">Engaged</span>
                                                        </>
                                                    )}
                                                    {engagementScore === 2 && (
                                                        <>
                                                            <Eye className="h-3 w-3 text-blue-500" />
                                                            <span className="text-blue-500">Opened</span>
                                                        </>
                                                    )}
                                                    {engagementScore === 1 && (
                                                        <>
                                                            <Send className="h-3 w-3 text-gray-500" />
                                                            <span className="text-gray-500">Sent</span>
                                                        </>
                                                    )}
                                                </Badge>
                                            )}
                                        </div>

                                        {visitor.followUpContent ? (
                                            <EngagementIndicator
                                                sentAt={visitor.followUpContent.sentAt}
                                                openedAt={visitor.followUpContent.openedAt}
                                                clickedAt={visitor.followUpContent.clickedAt}
                                            />
                                        ) : visitor.followUpGenerated ? (
                                            <div className="text-sm text-muted-foreground">
                                                <Badge variant="outline" className="gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Generated, not sent
                                                </Badge>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground">
                                                No follow-up generated
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {filteredVisitors.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No visitors found</p>
                    <p className="text-sm">
                        Try adjusting your search or filter criteria
                    </p>
                </div>
            )}
        </div>
    );
}
