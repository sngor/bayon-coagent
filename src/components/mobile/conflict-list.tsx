'use client';

/**
 * Conflict List Component for Mobile Enhancements
 * 
 * This component displays a list of all unresolved conflicts
 * and allows users to navigate to individual conflict resolution screens.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertTriangle,
    Clock,
    User,
    ChevronRight,
    RefreshCw,
    CheckCircle2
} from 'lucide-react';
import { ConflictData } from '@/lib/conflict-detection';
import { getUnresolvedConflicts, getConflictCount } from '@/lib/conflict-storage';
import { cn } from '@/lib/utils/common';

interface ConflictListProps {
    onSelectConflict: (conflict: ConflictData) => void;
    onRefresh?: () => void;
    className?: string;
}

export function ConflictList({
    onSelectConflict,
    onRefresh,
    className
}: ConflictListProps) {
    const [conflicts, setConflicts] = useState<ConflictData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadConflicts = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const unresolvedConflicts = await getUnresolvedConflicts();
            setConflicts(unresolvedConflicts);
        } catch (err) {
            console.error('Failed to load conflicts:', err);
            setError('Failed to load conflicts. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadConflicts();
    }, []);

    const handleRefresh = () => {
        loadConflicts();
        onRefresh?.();
    };

    const formatTimestamp = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    };

    const getConflictTypeColor = (type: ConflictData['conflictType']) => {
        switch (type) {
            case 'timestamp':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'content':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'both':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getConflictSummary = (conflict: ConflictData) => {
        const timeDiff = Math.abs(
            conflict.localVersion.timestamp - conflict.remoteVersion.timestamp
        );
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `Changes made ${hours}h ${minutes}m apart`;
        } else if (minutes > 0) {
            return `Changes made ${minutes}m apart`;
        } else {
            return 'Simultaneous changes detected';
        }
    };

    if (isLoading) {
        return (
            <div className={cn('space-y-4', className)}>
                <div className="flex items-center justify-between">
                    <h3 className="font-headline text-lg font-semibold">Sync Conflicts</h3>
                    <Button variant="outline" size="sm" disabled>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                    </Button>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-4">
                                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cn('space-y-4', className)}>
                <div className="flex items-center justify-between">
                    <h3 className="font-headline text-lg font-semibold">Sync Conflicts</h3>
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    if (conflicts.length === 0) {
        return (
            <div className={cn('space-y-4', className)}>
                <div className="flex items-center justify-between">
                    <h3 className="font-headline text-lg font-semibold">Sync Conflicts</h3>
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
                <Card>
                    <CardContent className="p-6 text-center">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h4 className="font-headline text-lg font-medium mb-2">No Conflicts</h4>
                        <p className="text-muted-foreground">
                            All your changes have been synced successfully. No conflicts to resolve.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className={cn('space-y-4', className)}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-headline text-lg font-semibold">Sync Conflicts</h3>
                    <p className="text-sm text-muted-foreground">
                        {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} need{conflicts.length === 1 ? 's' : ''} your attention
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <ScrollArea className="h-96">
                <div className="space-y-3">
                    {conflicts.map((conflict) => (
                        <Card
                            key={conflict.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => onSelectConflict(conflict)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            {conflict.type.charAt(0).toUpperCase() + conflict.type.slice(1)} Conflict
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {getConflictSummary(conflict)}
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className={cn('text-xs', getConflictTypeColor(conflict.conflictType))}
                                        >
                                            {conflict.conflictType}
                                        </Badge>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatTimestamp(conflict.detectedAt)}
                                        </span>
                                        {conflict.localVersion.metadata?.userId && (
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                Local: {conflict.localVersion.metadata.userId}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs font-medium">
                                        Tap to resolve
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

export default ConflictList;