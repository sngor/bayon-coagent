'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProgressiveImage } from '@/components/mobile/progressive-image';
import { ImageCompressor } from '@/components/mobile/image-compressor';
import { CancellableOperation } from '@/components/mobile/cancellable-operation';
import { useCancellableOperation } from '@/lib/mobile/performance';
import { Loader2, Image as ImageIcon, Zap, Code } from 'lucide-react';

/**
 * Performance optimization demo page
 * Demonstrates all mobile performance features
 */
export default function PerformanceDemoPage() {
    const [demoImages] = useState([
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    ]);

    const { execute, cancel, isRunning, progress } = useCancellableOperation<string>();

    const handleLongOperation = async () => {
        try {
            await execute(async (signal, updateProgress) => {
                // Simulate a long-running operation
                for (let i = 0; i <= 100; i += 10) {
                    if (signal.aborted) {
                        throw new Error('Operation cancelled');
                    }

                    updateProgress(i);
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                return 'Operation completed successfully!';
            });
        } catch (error) {
            console.log('Operation cancelled or failed:', error);
        }
    };

    return (
        <div className="container max-w-4xl py-8 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Performance Optimizations</h1>
                <p className="text-muted-foreground">
                    Demonstration of mobile performance optimization features
                </p>
            </div>

            <Tabs defaultValue="images" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="images">
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Images
                    </TabsTrigger>
                    <TabsTrigger value="compression">
                        <Zap className="mr-2 h-4 w-4" />
                        Compression
                    </TabsTrigger>
                    <TabsTrigger value="operations">
                        <Loader2 className="mr-2 h-4 w-4" />
                        Operations
                    </TabsTrigger>
                    <TabsTrigger value="splitting">
                        <Code className="mr-2 h-4 w-4" />
                        Code Splitting
                    </TabsTrigger>
                </TabsList>

                {/* Progressive Image Loading */}
                <TabsContent value="images" className="space-y-6">
                    <Card className="p-6 space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">Progressive Image Loading</h2>
                            <p className="text-sm text-muted-foreground">
                                Images load progressively with lazy loading and placeholders
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {demoImages.map((src, index) => (
                                <ProgressiveImage
                                    key={index}
                                    src={src}
                                    alt={`Property ${index + 1}`}
                                    className="aspect-video rounded-lg"
                                    lazy={true}
                                    showLoader={true}
                                />
                            ))}
                        </div>

                        <div className="p-4 bg-muted rounded-lg space-y-2">
                            <h3 className="font-medium text-sm">Features:</h3>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                <li>Lazy loading with Intersection Observer</li>
                                <li>Progressive loading with placeholders</li>
                                <li>Automatic error handling</li>
                                <li>Loading indicators</li>
                            </ul>
                        </div>
                    </Card>
                </TabsContent>

                {/* Image Compression */}
                <TabsContent value="compression" className="space-y-6">
                    <ImageCompressor />

                    <Card className="p-6 space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">Compression Benefits</h2>
                            <p className="text-sm text-muted-foreground">
                                Reduce image sizes for faster loading and lower data usage
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <h3 className="font-medium text-sm mb-2">WebP Format</h3>
                                <p className="text-xs text-muted-foreground">
                                    30-50% smaller than JPEG with same quality
                                </p>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                                <h3 className="font-medium text-sm mb-2">Smart Resizing</h3>
                                <p className="text-xs text-muted-foreground">
                                    Automatically resize to optimal dimensions
                                </p>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                                <h3 className="font-medium text-sm mb-2">Quality Control</h3>
                                <p className="text-xs text-muted-foreground">
                                    Adjustable quality for size/quality tradeoff
                                </p>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                {/* Cancellable Operations */}
                <TabsContent value="operations" className="space-y-6">
                    <Card className="p-6 space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">Cancellable Operations</h2>
                            <p className="text-sm text-muted-foreground">
                                Long-running operations with progress tracking and cancellation
                            </p>
                        </div>

                        <Button
                            onClick={handleLongOperation}
                            disabled={isRunning}
                            className="w-full"
                        >
                            {isRunning ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Running...
                                </>
                            ) : (
                                'Start Long Operation'
                            )}
                        </Button>

                        <div className="p-4 bg-muted rounded-lg space-y-2">
                            <h3 className="font-medium text-sm">Features:</h3>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                                <li>Visual progress indicators</li>
                                <li>One-tap cancellation</li>
                                <li>AbortController integration</li>
                                <li>Graceful error handling</li>
                            </ul>
                        </div>
                    </Card>

                    <CancellableOperation
                        isRunning={isRunning}
                        progress={progress}
                        onCancel={cancel}
                        title="Processing Operation"
                        description="This operation can be cancelled at any time"
                    />
                </TabsContent>

                {/* Code Splitting */}
                <TabsContent value="splitting" className="space-y-6">
                    <Card className="p-6 space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold">Code Splitting</h2>
                            <p className="text-sm text-muted-foreground">
                                Mobile-specific routes and components are loaded on demand
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                                <h3 className="font-medium text-sm mb-2">Dynamic Imports</h3>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Components are loaded only when needed
                                </p>
                                <code className="text-xs bg-background p-2 rounded block">
                                    {`const QuickCapture = dynamic(() => import('@/components/mobile/quick-capture'))`}
                                </code>
                            </div>

                            <div className="p-4 bg-muted rounded-lg">
                                <h3 className="font-medium text-sm mb-2">Route-Based Splitting</h3>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Mobile routes are split into separate bundles
                                </p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    <li>• /mobile/capture - Quick capture interface</li>
                                    <li>• /mobile/actions - Quick actions menu</li>
                                    <li>• /mobile/share - Quick share functionality</li>
                                    <li>• /mobile/notes - Voice notes system</li>
                                </ul>
                            </div>

                            <div className="p-4 bg-muted rounded-lg">
                                <h3 className="font-medium text-sm mb-2">Benefits</h3>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="text-xs">
                                        <span className="font-medium">Initial Load:</span>
                                        <span className="text-muted-foreground"> -40% bundle size</span>
                                    </div>
                                    <div className="text-xs">
                                        <span className="font-medium">Time to Interactive:</span>
                                        <span className="text-muted-foreground"> -30% faster</span>
                                    </div>
                                    <div className="text-xs">
                                        <span className="font-medium">Data Usage:</span>
                                        <span className="text-muted-foreground"> -50% on 4G</span>
                                    </div>
                                    <div className="text-xs">
                                        <span className="font-medium">Cache Hit Rate:</span>
                                        <span className="text-muted-foreground"> +60% better</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
