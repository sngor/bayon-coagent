/**
 * Mobile Storage Demo Component
 * 
 * This component demonstrates how to use the IndexedDB schema and hooks
 * for mobile offline storage functionality.
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMobileStorage } from '@/hooks/use-mobile-storage';

export function MobileStorageDemo() {
    const {
        isSupported,
        isInitialized,
        initError,
        stats,
        refreshStats,
        queueOperation,
        cacheContent,
        saveDraft,
    } = useMobileStorage();

    const [demoStatus, setDemoStatus] = useState<string>('');

    useEffect(() => {
        if (isInitialized) {
            refreshStats();
        }
    }, [isInitialized, refreshStats]);

    const handleQueueDemo = async () => {
        try {
            setDemoStatus('Queueing operation...');
            const id = await queueOperation('photo', {
                filename: 'demo-photo.jpg',
                size: 1024000,
                timestamp: Date.now(),
            });
            setDemoStatus(`Queued operation with ID: ${id}`);
            await refreshStats();
        } catch (error) {
            setDemoStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleCacheDemo = async () => {
        try {
            setDemoStatus('Caching content...');
            const id = await cacheContent('market-stats', {
                location: 'San Francisco, CA',
                medianPrice: 1200000,
                inventoryLevel: 150,
                daysOnMarket: 25,
                priceTrend: 'up',
            }, 24, 'san-francisco-ca');
            setDemoStatus(`Cached content with ID: ${id}`);
            await refreshStats();
        } catch (error) {
            setDemoStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleDraftDemo = async () => {
        try {
            setDemoStatus('Saving draft...');
            const id = await saveDraft('blog', {
                title: 'Demo Blog Post',
                content: 'This is a demo blog post created for testing mobile storage.',
                tags: ['demo', 'mobile', 'storage'],
            });
            setDemoStatus(`Saved draft with ID: ${id}`);
            await refreshStats();
        } catch (error) {
            setDemoStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    if (!isSupported) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-red-600">IndexedDB Not Supported</CardTitle>
                    <CardDescription>
                        Your browser does not support IndexedDB, which is required for offline functionality.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (initError) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-red-600">Initialization Error</CardTitle>
                    <CardDescription>
                        Failed to initialize mobile storage: {initError.message}
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!isInitialized) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Initializing Mobile Storage...</CardTitle>
                    <CardDescription>
                        Setting up IndexedDB for offline functionality.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Mobile Storage Demo</CardTitle>
                    <CardDescription>
                        Demonstration of IndexedDB schema for mobile offline functionality.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            IndexedDB Supported
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Storage Initialized
                        </Badge>
                    </div>

                    {demoStatus && (
                        <div className="p-3 bg-gray-50 rounded-md text-sm">
                            <strong>Status:</strong> {demoStatus}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Sync Queue</CardTitle>
                        <CardDescription>
                            Operations pending synchronization
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Pending:</span>
                                <Badge variant="secondary">{stats?.syncQueue.pending || 0}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Failed:</span>
                                <Badge variant="destructive">{stats?.syncQueue.failed || 0}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Completed:</span>
                                <Badge variant="default">{stats?.syncQueue.completed || 0}</Badge>
                            </div>
                        </div>
                        <Button onClick={handleQueueDemo} className="w-full" size="sm">
                            Queue Demo Operation
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Cached Content</CardTitle>
                        <CardDescription>
                            Cached data for offline access
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Total Items:</span>
                            <Badge variant="secondary">{stats?.cachedContent || 0}</Badge>
                        </div>
                        <Button onClick={handleCacheDemo} className="w-full" size="sm">
                            Cache Demo Content
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Drafts</CardTitle>
                        <CardDescription>
                            Locally stored draft content
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Total:</span>
                                <Badge variant="secondary">{stats?.drafts.total || 0}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Unsynced:</span>
                                <Badge variant="outline">{stats?.drafts.unsynced || 0}</Badge>
                            </div>
                        </div>
                        <Button onClick={handleDraftDemo} className="w-full" size="sm">
                            Save Demo Draft
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button onClick={refreshStats} variant="outline" className="w-full">
                        Refresh Statistics
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}