'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, User, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Visitor } from '@/lib/open-house/types';
import { cn } from '@/lib/utils/common';
import { formatDistanceToNow } from 'date-fns';

/**
 * Check-In Timeline Component
 * 
 * Displays chronological list of visitor check-ins with timestamps
 * Validates Requirements: 11.3
 */

interface CheckInTimelineProps {
    visitors: Visitor[];
    className?: string;
    maxHeight?: string;
}

export function CheckInTimeline({
    visitors,
    className,
    maxHeight = '400px'
}: CheckInTimelineProps) {
    // Sort visitors by check-in time (most recent first)
    const sortedVisitors = [...visitors].sort((a, b) =>
        new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
    );

    const getInterestIcon = (level: 'low' | 'medium' | 'high') => {
        switch (level) {
            case 'high':
                return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'medium':
                return <Minus className="h-4 w-4 text-yellow-500" />;
            case 'low':
                return <TrendingDown className="h-4 w-4 text-gray-500" />;
        }
    };

    const getInterestColor = (level: 'low' | 'medium' | 'high') => {
        switch (level) {
            case 'high':
                return 'bg-green-500/10 text-green-700 border-green-500/20';
            case 'medium':
                return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
            case 'low':
                return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
        }
    };

    if (visitors.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Check-In Timeline
                    </CardTitle>
                    <CardDescription>
                        Chronological list of visitor arrivals
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <User className="h-12 w-12 text-muted-foreground/50 mb-3" />
                        <p className="text-sm text-muted-foreground">
                            No visitors yet
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Check-ins will appear here in real-time
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Check-In Timeline
                </CardTitle>
                <CardDescription>
                    {visitors.length} {visitors.length === 1 ? 'visitor' : 'visitors'} checked in
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="pr-4" style={{ maxHeight }}>
                    <div className="space-y-3">
                        {sortedVisitors.map((visitor, index) => {
                            const checkInDate = new Date(visitor.checkInTime);
                            const timeAgo = formatDistanceToNow(checkInDate, { addSuffix: true });
                            const isRecent = Date.now() - checkInDate.getTime() < 60000; // Within last minute

                            return (
                                <div
                                    key={visitor.visitorId}
                                    className={cn(
                                        'flex items-start gap-3 p-3 rounded-lg border transition-all duration-300',
                                        isRecent && 'bg-blue-500/5 border-blue-500/20 animate-in fade-in slide-in-from-top-2',
                                        !isRecent && 'bg-muted/30'
                                    )}
                                >
                                    {/* Timeline dot */}
                                    <div className="flex flex-col items-center gap-1 pt-1">
                                        <div className={cn(
                                            'h-3 w-3 rounded-full border-2',
                                            isRecent ? 'bg-blue-500 border-blue-500 animate-pulse' : 'bg-background border-muted-foreground'
                                        )} />
                                        {index < sortedVisitors.length - 1 && (
                                            <div className="w-0.5 h-full min-h-[20px] bg-border" />
                                        )}
                                    </div>

                                    {/* Visitor info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">
                                                    {visitor.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {visitor.email}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'text-xs shrink-0',
                                                    getInterestColor(visitor.interestLevel)
                                                )}
                                            >
                                                <span className="flex items-center gap-1">
                                                    {getInterestIcon(visitor.interestLevel)}
                                                    {visitor.interestLevel}
                                                </span>
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            <span>{timeAgo}</span>
                                            <span>•</span>
                                            <span>{checkInDate.toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}</span>
                                            {visitor.source === 'qr' && (
                                                <>
                                                    <span>•</span>
                                                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                                        QR
                                                    </Badge>
                                                </>
                                            )}
                                        </div>

                                        {visitor.notes && (
                                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                                {visitor.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
