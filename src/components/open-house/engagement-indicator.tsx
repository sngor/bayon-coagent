/**
 * Engagement Indicator Component
 * 
 * Displays engagement status (opened, clicked) for follow-up emails.
 * Validates Requirements: 13.5, 15.5
 */

'use client';

import { Mail, MousePointerClick, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface EngagementIndicatorProps {
    sentAt?: string;
    openedAt?: string;
    clickedAt?: string;
    compact?: boolean;
}

export function EngagementIndicator({
    sentAt,
    openedAt,
    clickedAt,
    compact = false,
}: EngagementIndicatorProps) {
    if (!sentAt) {
        return null;
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    if (compact) {
        return (
            <TooltipProvider>
                <div className="flex items-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Badge variant="outline" className="gap-1">
                                <Mail className="h-3 w-3" />
                                Sent
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Sent: {formatDate(sentAt)}</p>
                        </TooltipContent>
                    </Tooltip>

                    {openedAt && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
                                    <Mail className="h-3 w-3" />
                                    Opened
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Opened: {formatDate(openedAt)}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {clickedAt && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
                                    <MousePointerClick className="h-3 w-3" />
                                    Clicked
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Clicked: {formatDate(clickedAt)}</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </TooltipProvider>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Sent:</span>
                <span className="font-medium">{formatDate(sentAt)}</span>
            </div>

            {openedAt && (
                <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-muted-foreground">Opened:</span>
                    <span className="font-medium text-blue-600">{formatDate(openedAt)}</span>
                </div>
            )}

            {clickedAt && (
                <div className="flex items-center gap-2 text-sm">
                    <MousePointerClick className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">Clicked:</span>
                    <span className="font-medium text-green-600">{formatDate(clickedAt)}</span>
                </div>
            )}

            {!openedAt && !clickedAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>No engagement yet</span>
                </div>
            )}
        </div>
    );
}
