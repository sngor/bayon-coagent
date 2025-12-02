'use client';

/**
 * Conflict Log Viewer Component
 * 
 * Displays conflict logs for agent review, showing:
 * - Local data vs server data
 * - Resolution strategy applied (last-write-wins)
 * - Timestamp of conflict
 * 
 * Validates Requirements 8.4
 */

import { useEffect, useState } from 'react';
import { useOfflineSync } from '@/lib/offline/use-offline-sync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Clock,
    Database,
    Laptop
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ConflictLog {
    id: string;
    operationId: string;
    sessionId: string;
    visitorId?: string;
    type: string;
    localData: any;
    serverData: any;
    resolution: 'last-write-wins' | 'manual';
    resolvedData: any;
    timestamp: number;
    userId: string;
}

export function ConflictLogViewer() {
    const { getConflicts } = useOfflineSync();
    const [conflicts, setConflicts] = useState<ConflictLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadConflicts();
    }, []);

    const loadConflicts = async () => {
        setLoading(true);
        try {
            const logs = await getConflicts();
            setConflicts(logs);
        } catch (error) {
            console.error('Failed to load conflicts:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleConflict = (id: string) => {
        setExpandedConflicts(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Conflict Log</CardTitle>
                    <CardDescription>Loading conflicts...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (conflicts.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Conflict Log</CardTitle>
                    <CardDescription>No conflicts detected</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        All offline operations synced without conflicts.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            Conflict Log
                        </CardTitle>
                        <CardDescription>
                            {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} resolved using last-write-wins strategy
                        </CardDescription>
                    </div>
                    <Button onClick={loadConflicts} variant="outline" size="sm">
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {conflicts.map((conflict) => (
                    <Collapsible
                        key={conflict.id}
                        open={expandedConflicts.has(conflict.id)}
                        onOpenChange={() => toggleConflict(conflict.id)}
                    >
                        <Card>
                            <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">
                                                        {conflict.type === 'updateVisitor' ? 'Visitor Update' : 'Session Update'}
                                                    </span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {conflict.resolution}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(conflict.timestamp, { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {expandedConflicts.has(conflict.id) ? (
                                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="space-y-4 pt-0">
                                    {/* Local Data */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Laptop className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm font-medium">Local Data (Applied)</span>
                                        </div>
                                        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-md p-3">
                                            <pre className="text-xs overflow-x-auto">
                                                {JSON.stringify(conflict.localData, null, 2)}
                                            </pre>
                                        </div>
                                    </div>

                                    {/* Server Data */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Database className="h-4 w-4 text-purple-500" />
                                            <span className="text-sm font-medium">Server Data (Overwritten)</span>
                                        </div>
                                        <div className="bg-purple-50 dark:bg-purple-950/20 rounded-md p-3">
                                            <pre className="text-xs overflow-x-auto">
                                                {JSON.stringify(conflict.serverData, null, 2)}
                                            </pre>
                                        </div>
                                    </div>

                                    {/* Resolution Info */}
                                    <div className="bg-muted rounded-md p-3">
                                        <p className="text-xs text-muted-foreground">
                                            <strong>Resolution:</strong> Last-write-wins strategy applied.
                                            The local data (most recent change) was used to update the server,
                                            overwriting the server's version.
                                        </p>
                                    </div>

                                    {/* Metadata */}
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Session ID:</span>
                                            <p className="font-mono">{conflict.sessionId.slice(0, 12)}...</p>
                                        </div>
                                        {conflict.visitorId && (
                                            <div>
                                                <span className="text-muted-foreground">Visitor ID:</span>
                                                <p className="font-mono">{conflict.visitorId.slice(0, 12)}...</p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-muted-foreground">Operation ID:</span>
                                            <p className="font-mono">{conflict.operationId.slice(0, 12)}...</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>
                ))}
            </CardContent>
        </Card>
    );
}
