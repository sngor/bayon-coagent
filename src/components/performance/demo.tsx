'use client';

/**
 * Performance Components Demo
 * 
 * This file demonstrates the usage of all performance-optimized components.
 * Use this as a reference for implementing these components in your features.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
    LazyComponent,
    SimpleVirtualList,
    OptimizedImage,
    HeroImage,
    CardImage,
    AvatarImage,
    PropertyImage,
} from '@/components/performance';
import { StandardLoadingState } from '@/components/standard/loading-state';
import { Zap, List, Image as ImageIcon } from 'lucide-react';

// Mock data
const generateMockItems = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        title: `Item ${i + 1}`,
        description: `This is the description for item ${i + 1}`,
        imageUrl: `https://picsum.photos/seed/${i}/400/300`,
    }));
};

/**
 * Demo: LazyComponent
 */
function LazyComponentDemo() {
    const [showLazy, setShowLazy] = useState(false);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    LazyComponent Demo
                </CardTitle>
                <CardDescription>
                    Dynamic imports with loading fallback and error boundary
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <Button onClick={() => setShowLazy(!showLazy)}>
                        {showLazy ? 'Hide' : 'Load'} Heavy Component
                    </Button>
                    <Badge variant="outline">
                        {showLazy ? 'Loaded' : 'Not Loaded'}
                    </Badge>
                </div>

                {showLazy && (
                    <div className="border rounded-lg p-4">
                        <LazyComponent
                            loader={() =>
                                // Simulate heavy component with delay
                                new Promise<{ default: React.ComponentType<any> }>((resolve) => {
                                    setTimeout(() => {
                                        resolve({
                                            default: () => (
                                                <div className="space-y-2">
                                                    <h3 className="font-semibold">Heavy Component Loaded!</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        This component was loaded dynamically when you clicked the button.
                                                    </p>
                                                    <div className="grid grid-cols-3 gap-2 mt-4">
                                                        {Array.from({ length: 6 }).map((_, i) => (
                                                            <div key={i} className="h-20 bg-primary/10 rounded" />
                                                        ))}
                                                    </div>
                                                </div>
                                            ),
                                        });
                                    }, 1000);
                                })
                            }
                            fallback={
                                <div className="flex items-center justify-center p-8">
                                    <StandardLoadingState variant="spinner" text="Loading component..." />
                                </div>
                            }
                            onLoad={() => console.log('Component loaded')}
                        />
                    </div>
                )}

                <div className="text-xs text-muted-foreground space-y-1">
                    <p>✓ Reduces initial bundle size</p>
                    <p>✓ Loads on demand</p>
                    <p>✓ Built-in error handling</p>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Demo: VirtualList
 */
function VirtualListDemo() {
    const [itemCount, setItemCount] = useState(1000);
    const items = React.useMemo(() => generateMockItems(itemCount), [itemCount]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <List className="h-5 w-5" />
                    VirtualList Demo
                </CardTitle>
                <CardDescription>
                    Efficiently render large lists (only visible items)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setItemCount(100)}
                    >
                        100 items
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setItemCount(1000)}
                    >
                        1,000 items
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setItemCount(10000)}
                    >
                        10,000 items
                    </Button>
                    <Badge>{itemCount.toLocaleString()} items</Badge>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <SimpleVirtualList
                        items={items}
                        itemHeight={80}
                        height={400}
                        renderItem={(item, index) => (
                            <div className="p-4 border-b hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium">{item.title}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        overscan={3}
                    />
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                    <p>✓ Renders only ~10-15 items (not {itemCount.toLocaleString()})</p>
                    <p>✓ Maintains 60fps scrolling</p>
                    <p>✓ Reduces DOM nodes by 98%+</p>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Demo: OptimizedImage
 */
function OptimizedImageDemo() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    OptimizedImage Demo
                </CardTitle>
                <CardDescription>
                    Next.js Image wrapper with consistent sizing and loading
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Tabs defaultValue="basic">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Basic</TabsTrigger>
                        <TabsTrigger value="presets">Presets</TabsTrigger>
                        <TabsTrigger value="responsive">Responsive</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium mb-2">With Shimmer</p>
                                <OptimizedImage
                                    src="https://picsum.photos/seed/demo1/400/300"
                                    alt="Demo image"
                                    width={400}
                                    height={300}
                                    aspectRatio="4/3"
                                    showShimmer
                                />
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-2">Without Shimmer</p>
                                <OptimizedImage
                                    src="https://picsum.photos/seed/demo2/400/300"
                                    alt="Demo image"
                                    width={400}
                                    height={300}
                                    aspectRatio="4/3"
                                    showShimmer={false}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="presets" className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium mb-2">Hero Image (16:9)</p>
                                <HeroImage
                                    src="https://picsum.photos/seed/hero/1920/1080"
                                    alt="Hero"
                                    priority
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm font-medium mb-2">Card Image</p>
                                    <CardImage
                                        src="https://picsum.photos/seed/card/400/300"
                                        alt="Card"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-2">Property Image</p>
                                    <PropertyImage
                                        src="https://picsum.photos/seed/property/800/450"
                                        alt="Property"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-2">Avatar Image</p>
                                    <div className="flex justify-center">
                                        <AvatarImage
                                            src="https://picsum.photos/seed/avatar/96/96"
                                            alt="Avatar"
                                            size={96}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="responsive" className="space-y-4">
                        <div>
                            <p className="text-sm font-medium mb-2">
                                Responsive Image (resize window to see effect)
                            </p>
                            <OptimizedImage
                                src="https://picsum.photos/seed/responsive/1200/800"
                                alt="Responsive"
                                width={1200}
                                height={800}
                                aspectRatio="3/2"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="text-xs text-muted-foreground space-y-1">
                    <p>✓ Prevents layout shift</p>
                    <p>✓ Lazy loading by default</p>
                    <p>✓ Error handling with fallback</p>
                    <p>✓ Shimmer loading effect</p>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Main Demo Component
 */
export function PerformanceComponentsDemo() {
    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Performance Components Demo</h1>
                <p className="text-muted-foreground">
                    Explore performance-optimized components for the Bayon Coagent application.
                </p>
            </div>

            <div className="grid gap-8">
                <LazyComponentDemo />
                <VirtualListDemo />
                <OptimizedImageDemo />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Performance Impact</CardTitle>
                    <CardDescription>
                        Expected improvements when using these components
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <h3 className="font-semibold">LazyComponent</h3>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• 30-50% smaller initial bundle</li>
                                <li>• 1-2s faster TTI</li>
                                <li>• Progressive loading</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold">VirtualList</h3>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• 98%+ fewer DOM nodes</li>
                                <li>• 60fps scrolling</li>
                                <li>• Handles 10,000+ items</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold">OptimizedImage</h3>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• CLS &lt; 0.1</li>
                                <li>• 40-60% less bandwidth</li>
                                <li>• 20-30% faster LCP</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default PerformanceComponentsDemo;
