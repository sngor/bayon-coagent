'use client';

/**
 * Conflict Resolution Demo Component
 * 
 * This component demonstrates the conflict resolution system
 * by creating sample conflicts and showing the resolution UI.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ConflictManager } from './conflict-manager';
import { ConflictData, ConflictResolution, generateContentHash } from '@/lib/conflict-detection';
import { storeConflict } from '@/lib/conflict-storage';
import { Info, Plus, Trash2 } from 'lucide-react';

export function ConflictDemo() {
    const [isCreatingConflict, setIsCreatingConflict] = useState(false);
    const [lastResolution, setLastResolution] = useState<ConflictResolution | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const createSampleConflict = async () => {
        setIsCreatingConflict(true);

        try {
            const baseTime = Date.now();
            const conflictId = `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            // Create a sample conflict
            const sampleConflict: ConflictData = {
                id: conflictId,
                type: 'content',
                localVersion: {
                    id: 'content-123',
                    content: {
                        title: 'Local Blog Post Title',
                        body: 'This is the content that was edited locally on the mobile device. It includes some important changes that the user made while offline.',
                        tags: ['local', 'mobile', 'offline'],
                        lastEditedBy: 'Mobile User'
                    },
                    timestamp: baseTime - 2 * 60 * 1000, // 2 minutes ago
                    contentHash: generateContentHash({
                        title: 'Local Blog Post Title',
                        body: 'This is the content that was edited locally on the mobile device. It includes some important changes that the user made while offline.',
                        tags: ['local', 'mobile', 'offline']
                    }),
                    source: 'local',
                    metadata: {
                        userId: 'user-123',
                        deviceId: 'mobile-device-1'
                    }
                },
                remoteVersion: {
                    id: 'content-123',
                    content: {
                        title: 'Remote Blog Post Title',
                        body: 'This is the content that was edited remotely on another device or by another user. It has different changes that conflict with the local version.',
                        tags: ['remote', 'web', 'collaborative'],
                        lastEditedBy: 'Web User'
                    },
                    timestamp: baseTime - 1 * 60 * 1000, // 1 minute ago
                    contentHash: generateContentHash({
                        title: 'Remote Blog Post Title',
                        body: 'This is the content that was edited remotely on another device or by another user. It has different changes that conflict with the local version.',
                        tags: ['remote', 'web', 'collaborative']
                    }),
                    source: 'remote',
                    metadata: {
                        userId: 'user-456',
                        lastModifiedBy: 'Web User'
                    }
                },
                conflictType: 'both',
                detectedAt: baseTime,
                resolved: false
            };

            // Store the conflict
            await storeConflict(sampleConflict);

            // Refresh the conflict manager
            setRefreshKey(prev => prev + 1);

            console.log('Sample conflict created:', sampleConflict);
        } catch (error) {
            console.error('Failed to create sample conflict:', error);
        } finally {
            setIsCreatingConflict(false);
        }
    };

    const handleConflictResolved = (resolution: ConflictResolution) => {
        setLastResolution(resolution);
        console.log('Conflict resolved:', resolution);
    };

    return (
        <div className="space-y-6 p-4 max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Conflict Resolution System Demo
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            This demo shows how the conflict resolution system works when offline changes
                            conflict with remote changes. You can create sample conflicts and resolve them
                            using the UI below.
                        </AlertDescription>
                    </Alert>

                    <div className="flex gap-2">
                        <Button
                            onClick={createSampleConflict}
                            disabled={isCreatingConflict}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            {isCreatingConflict ? 'Creating...' : 'Create Sample Conflict'}
                        </Button>
                    </div>

                    {lastResolution && (
                        <Alert className="bg-green-50 border-green-200">
                            <Info className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                <strong>Last Resolution:</strong> {lastResolution.resolution}
                                {' '}(resolved at {new Date(lastResolution.resolvedAt).toLocaleTimeString()})
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <Separator />

            {/* Conflict Manager */}
            <ConflictManager
                key={refreshKey}
                onConflictResolved={handleConflictResolved}
            />
        </div>
    );
}

export default ConflictDemo;