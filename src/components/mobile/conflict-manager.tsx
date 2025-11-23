'use client';

/**
 * Conflict Manager Component for Mobile Enhancements
 * 
 * This component manages the overall conflict resolution workflow,
 * switching between the conflict list and individual conflict resolution views.
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { ConflictData, ConflictResolution } from '@/lib/conflict-detection';
import { ConflictList } from './conflict-list';
import { ConflictResolution as ConflictResolutionComponent } from './conflict-resolution';
import { cn } from '@/lib/utils';

interface ConflictManagerProps {
    onConflictResolved?: (resolution: ConflictResolution) => void;
    className?: string;
}

type ViewMode = 'list' | 'resolution';

export function ConflictManager({
    onConflictResolved,
    className
}: ConflictManagerProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedConflict, setSelectedConflict] = useState<ConflictData | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSelectConflict = useCallback((conflict: ConflictData) => {
        setSelectedConflict(conflict);
        setViewMode('resolution');
    }, []);

    const handleConflictResolved = useCallback((resolution: ConflictResolution) => {
        // Notify parent component
        onConflictResolved?.(resolution);

        // Refresh the conflict list
        setRefreshKey(prev => prev + 1);

        // Return to list view
        setViewMode('list');
        setSelectedConflict(null);
    }, [onConflictResolved]);

    const handleBackToList = useCallback(() => {
        setViewMode('list');
        setSelectedConflict(null);
    }, []);

    const handleRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    return (
        <div className={cn('space-y-4', className)}>
            {viewMode === 'list' ? (
                <ConflictList
                    key={refreshKey}
                    onSelectConflict={handleSelectConflict}
                    onRefresh={handleRefresh}
                />
            ) : (
                <div className="space-y-4">
                    {/* Back Navigation */}
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBackToList}
                            className="p-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h3 className="font-headline text-lg font-semibold">Resolve Conflict</h3>
                            <p className="text-sm text-muted-foreground">
                                Choose how to resolve this sync conflict
                            </p>
                        </div>
                    </div>

                    {/* Conflict Resolution */}
                    {selectedConflict && (
                        <ConflictResolutionComponent
                            conflict={selectedConflict}
                            onResolved={handleConflictResolved}
                            onCancel={handleBackToList}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Conflict Status Badge Component
 * 
 * A small badge component that shows the number of unresolved conflicts.
 * Can be used in navigation or status bars.
 */
interface ConflictStatusBadgeProps {
    conflictCount: number;
    onClick?: () => void;
    className?: string;
}

export function ConflictStatusBadge({
    conflictCount,
    onClick,
    className
}: ConflictStatusBadgeProps) {
    if (conflictCount === 0) {
        return null;
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            className={cn(
                'h-8 px-3 text-xs border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
                className
            )}
        >
            <AlertTriangle className="h-3 w-3 mr-1" />
            {conflictCount} conflict{conflictCount > 1 ? 's' : ''}
        </Button>
    );
}

/**
 * Conflict Alert Component
 * 
 * A prominent alert that can be shown when conflicts are detected.
 */
interface ConflictAlertProps {
    conflictCount: number;
    onResolve?: () => void;
    onDismiss?: () => void;
    className?: string;
}

export function ConflictAlert({
    conflictCount,
    onResolve,
    onDismiss,
    className
}: ConflictAlertProps) {
    if (conflictCount === 0) {
        return null;
    }

    return (
        <Card className={cn('border-amber-200 bg-amber-50', className)}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-800 text-base">
                    <AlertTriangle className="h-4 w-4" />
                    Sync Conflicts Detected
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <p className="text-sm text-amber-700 mb-4">
                    {conflictCount} conflict{conflictCount > 1 ? 's' : ''} need{conflictCount === 1 ? 's' : ''} your attention.
                    Your changes are safe, but you need to choose which version to keep.
                </p>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={onResolve}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        Resolve Now
                    </Button>
                    {onDismiss && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onDismiss}
                            className="border-amber-300 text-amber-700 hover:bg-amber-100"
                        >
                            Later
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default ConflictManager;