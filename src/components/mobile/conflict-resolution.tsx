'use client';

/**
 * Conflict Resolution UI Component for Mobile Enhancements
 * 
 * This component displays both versions of conflicting content side-by-side
 * and allows users to choose a version or merge them manually.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Clock,
    User,
    Smartphone,
    Cloud,
    CheckCircle,
    XCircle,
    GitMerge,
    AlertTriangle
} from 'lucide-react';
import { ConflictData, ConflictResolution, createResolution, mergeContent } from '@/lib/conflict-detection';
import { resolveConflict } from '@/lib/conflict-storage';
import { cn } from '@/lib/utils/common';

interface ConflictResolutionProps {
    conflict: ConflictData;
    onResolved: (resolution: ConflictResolution) => void;
    onCancel?: () => void;
    className?: string;
}

export function ConflictResolution({
    conflict,
    onResolved,
    onCancel,
    className
}: ConflictResolutionProps) {
    const [selectedResolution, setSelectedResolution] = useState<'local' | 'remote' | 'merge' | null>(null);
    const [mergedContent, setMergedContent] = useState<string>('');
    const [isResolving, setIsResolving] = useState(false);
    const [showMergeEditor, setShowMergeEditor] = useState(false);

    // Initialize merged content when merge is selected
    useEffect(() => {
        if (selectedResolution === 'merge') {
            const merged = mergeContent(
                conflict.localVersion.content,
                conflict.remoteVersion.content,
                'combine'
            );
            setMergedContent(typeof merged === 'string' ? merged : JSON.stringify(merged, null, 2));
            setShowMergeEditor(true);
        } else {
            setShowMergeEditor(false);
        }
    }, [selectedResolution, conflict]);

    const handleResolve = async () => {
        if (!selectedResolution) return;

        setIsResolving(true);

        try {
            let resolvedContent: any;
            let resolutionType: ConflictResolution['resolution'];

            switch (selectedResolution) {
                case 'local':
                    resolvedContent = conflict.localVersion.content;
                    resolutionType = 'use-local';
                    break;
                case 'remote':
                    resolvedContent = conflict.remoteVersion.content;
                    resolutionType = 'use-remote';
                    break;
                case 'merge':
                    resolvedContent = mergedContent;
                    resolutionType = 'manual';
                    break;
                default:
                    throw new Error('Invalid resolution type');
            }

            const resolution = createResolution(
                conflict.id,
                resolutionType,
                resolvedContent,
                'user'
            );

            // Store the resolution
            await resolveConflict(conflict.id, resolution);

            // Notify parent component
            onResolved(resolution);
        } catch (error) {
            console.error('Failed to resolve conflict:', error);
            // TODO: Show error toast
        } finally {
            setIsResolving(false);
        }
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const formatContent = (content: any) => {
        if (typeof content === 'string') {
            return content;
        }
        return JSON.stringify(content, null, 2);
    };

    const getConflictTypeColor = (type: ConflictData['conflictType']) => {
        switch (type) {
            case 'timestamp':
                return 'bg-yellow-100 text-yellow-800';
            case 'content':
                return 'bg-blue-100 text-blue-800';
            case 'both':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className={cn('space-y-6', className)}>
            {/* Conflict Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                Sync Conflict Detected
                            </CardTitle>
                            <CardDescription>
                                Changes were made to the same content in multiple places
                            </CardDescription>
                        </div>
                        <Badge className={getConflictTypeColor(conflict.conflictType)}>
                            {conflict.conflictType} conflict
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">
                        <p>Detected: {formatTimestamp(conflict.detectedAt)}</p>
                        <p>Type: {conflict.type}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Version Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Local Version */}
                <Card className={cn(
                    'transition-all duration-200',
                    selectedResolution === 'local' && 'ring-2 ring-blue-500'
                )}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Smartphone className="h-4 w-4" />
                            Local Version
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(conflict.localVersion.timestamp)}
                            </span>
                            {conflict.localVersion.metadata?.userId && (
                                <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {conflict.localVersion.metadata.userId}
                                </span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-48 w-full rounded border p-3 bg-muted/50">
                            <pre className="text-xs whitespace-pre-wrap">
                                {formatContent(conflict.localVersion.content)}
                            </pre>
                        </ScrollArea>
                        <Button
                            variant={selectedResolution === 'local' ? 'default' : 'outline'}
                            size="sm"
                            className="mt-3 w-full"
                            onClick={() => setSelectedResolution('local')}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Use Local Version
                        </Button>
                    </CardContent>
                </Card>

                {/* Remote Version */}
                <Card className={cn(
                    'transition-all duration-200',
                    selectedResolution === 'remote' && 'ring-2 ring-blue-500'
                )}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Cloud className="h-4 w-4" />
                            Remote Version
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(conflict.remoteVersion.timestamp)}
                            </span>
                            {conflict.remoteVersion.metadata?.userId && (
                                <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {conflict.remoteVersion.metadata.userId}
                                </span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-48 w-full rounded border p-3 bg-muted/50">
                            <pre className="text-xs whitespace-pre-wrap">
                                {formatContent(conflict.remoteVersion.content)}
                            </pre>
                        </ScrollArea>
                        <Button
                            variant={selectedResolution === 'remote' ? 'default' : 'outline'}
                            size="sm"
                            className="mt-3 w-full"
                            onClick={() => setSelectedResolution('remote')}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Use Remote Version
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Merge Option */}
            <Card className={cn(
                'transition-all duration-200',
                selectedResolution === 'merge' && 'ring-2 ring-blue-500'
            )}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <GitMerge className="h-4 w-4" />
                        Manual Merge
                    </CardTitle>
                    <CardDescription>
                        Combine both versions or create your own resolution
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        variant={selectedResolution === 'merge' ? 'default' : 'outline'}
                        size="sm"
                        className="mb-4"
                        onClick={() => setSelectedResolution('merge')}
                    >
                        <GitMerge className="h-4 w-4 mr-2" />
                        Create Manual Merge
                    </Button>

                    {showMergeEditor && (
                        <div className="space-y-3">
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Edit the content below to create your merged version.
                                    Both versions have been combined for you to review and modify.
                                </AlertDescription>
                            </Alert>
                            <Textarea
                                value={mergedContent}
                                onChange={(e) => setMergedContent(e.target.value)}
                                className="min-h-48 font-mono text-xs"
                                placeholder="Edit the merged content..."
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
                {onCancel && (
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        disabled={isResolving}
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                )}
                <Button
                    onClick={handleResolve}
                    disabled={!selectedResolution || isResolving}
                    className="min-w-32"
                >
                    {isResolving ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Resolving...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Apply Resolution
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

export default ConflictResolution;