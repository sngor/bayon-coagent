'use client';

import { useState, useEffect } from 'react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTablet } from '@/hooks/use-tablet';
import {
    Tablet,
    Check,
    X,
    Info,
    RotateCw,
    Maximize2,
    Smartphone,
    Monitor,
    Grid3x3,
    Columns,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Tablet Optimization Test Page
 * 
 * This page demonstrates and tests tablet viewport optimizations
 * Requirements: 4.2, 4.4
 */
export default function TabletTestPage() {
    const { isTablet, orientation, isTabletPortrait, isTabletLandscape } = useTablet();
    const [viewportWidth, setViewportWidth] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);

    useEffect(() => {
        const updateViewport = () => {
            setViewportWidth(window.innerWidth);
            setViewportHeight(window.innerHeight);
        };

        updateViewport();
        window.addEventListener('resize', updateViewport);
        window.addEventListener('orientationchange', updateViewport);

        return () => {
            window.removeEventListener('resize', updateViewport);
            window.removeEventListener('orientationchange', updateViewport);
        };
    }, []);

    const getViewportCategory = () => {
        if (viewportWidth < 768) return 'mobile';
        if (viewportWidth >= 768 && viewportWidth <= 1024) return 'tablet';
        return 'desktop';
    };

    const viewportCategory = getViewportCategory();

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in-up">
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold font-headline">Tablet Optimization Test</h1>
                            <p className="text-muted-foreground">Testing tablet viewport responsiveness and orientation handling</p>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Viewport Detection Card */}
            <Card className={cn(
                "border-2 transition-all duration-300",
                isTablet ? "border-primary bg-primary/5" : "border-border"
            )}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {viewportCategory === 'mobile' && <Smartphone className="h-5 w-5" />}
                        {viewportCategory === 'tablet' && <Tablet className="h-5 w-5 text-primary" />}
                        {viewportCategory === 'desktop' && <Monitor className="h-5 w-5" />}
                        Current Viewport Detection
                    </CardTitle>
                    <CardDescription>
                        Real-time viewport and orientation detection
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border bg-background">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted-foreground">Viewport Size</span>
                                <Maximize2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-2xl font-bold">
                                {viewportWidth} × {viewportHeight}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Width × Height (pixels)
                            </p>
                        </div>

                        <div className="p-4 rounded-lg border bg-background">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-muted-foreground">Orientation</span>
                                <RotateCw className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-2xl font-bold capitalize">
                                {orientation}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {orientation === 'portrait' ? 'Height > Width' : 'Width > Height'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Badge
                            variant={viewportCategory === 'mobile' ? 'default' : 'outline'}
                            className={cn(
                                viewportCategory === 'mobile' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            )}
                        >
                            {viewportCategory === 'mobile' ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                            Mobile (&lt; 768px)
                        </Badge>
                        <Badge
                            variant={viewportCategory === 'tablet' ? 'default' : 'outline'}
                            className={cn(
                                viewportCategory === 'tablet' && 'bg-primary text-primary-foreground'
                            )}
                        >
                            {viewportCategory === 'tablet' ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                            Tablet (768px - 1024px)
                        </Badge>
                        <Badge
                            variant={viewportCategory === 'desktop' ? 'default' : 'outline'}
                            className={cn(
                                viewportCategory === 'desktop' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            )}
                        >
                            {viewportCategory === 'desktop' ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                            Desktop (&gt; 1024px)
                        </Badge>
                    </div>

                    {isTablet && (
                        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                            <div className="flex items-start gap-3">
                                <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-primary">Tablet Viewport Detected!</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        You are viewing this page in {orientation} orientation.
                                        Try rotating your device to see how layouts adapt.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Adaptive Grid Layout Test */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Grid3x3 className="h-5 w-5" />
                        Adaptive Grid Layouts
                    </CardTitle>
                    <CardDescription>
                        Grids adapt based on viewport: 1 column (mobile), 2-3 columns (tablet), 3-4 columns (desktop)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* 2-column tablet layout */}
                    <div>
                        <h3 className="font-headline text-sm font-semibold mb-3 text-muted-foreground">
                            Two-Column Tablet Layout
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 orientation-transition">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className="p-6 rounded-lg border bg-gradient-to-br from-primary/5 to-purple-600/5 text-center"
                                >
                                    <p className="font-semibold text-lg">Card {i}</p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {viewportCategory === 'mobile' && '1 column'}
                                        {viewportCategory === 'tablet' && '2 columns'}
                                        {viewportCategory === 'desktop' && '4 columns'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3-column tablet landscape layout */}
                    <div>
                        <h3 className="font-headline text-sm font-semibold mb-3 text-muted-foreground">
                            Three-Column Tablet Landscape Layout
                        </h3>
                        <div className="grid grid-cols-1 tablet-portrait:grid-cols-2 tablet-landscape:grid-cols-3 lg:grid-cols-3 gap-4 orientation-transition">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div
                                    key={i}
                                    className="p-6 rounded-lg border bg-gradient-to-br from-secondary/50 to-secondary/20 text-center"
                                >
                                    <p className="font-semibold text-lg">Item {i}</p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {viewportCategory === 'mobile' && '1 column'}
                                        {isTabletPortrait && '2 columns'}
                                        {isTabletLandscape && '3 columns'}
                                        {viewportCategory === 'desktop' && '3 columns'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dashboard-Style Layout Test */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Columns className="h-5 w-5" />
                        Dashboard-Style Layout
                    </CardTitle>
                    <CardDescription>
                        Simulates a dashboard with main content and sidebar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 orientation-transition">
                        {/* Main Content Area - Takes 2 columns on tablet/desktop */}
                        <div className="md:col-span-2 space-y-4">
                            <div className="p-6 rounded-lg border bg-primary/5">
                                <h3 className="font-headline font-semibold text-lg mb-2">Main Content Area</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    This area takes full width on mobile, 2/3 width on tablet and desktop
                                </p>
                                <div className="grid grid-cols-1 tablet:grid-cols-2 gap-4 orientation-transition">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="p-4 rounded-lg border bg-background"
                                        >
                                            <p className="font-medium">Metric {i}</p>
                                            <p className="text-2xl font-bold text-primary mt-2">
                                                {Math.floor(Math.random() * 100)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Area - Takes 1 column */}
                        <div className="md:col-span-1 space-y-4">
                            <div className="p-6 rounded-lg border bg-secondary/30">
                                <h3 className="font-headline font-semibold text-lg mb-2">Sidebar</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Full width on mobile, 1/3 width on tablet/desktop
                                </p>
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="p-3 rounded-lg border bg-background"
                                        >
                                            <p className="text-sm font-medium">Widget {i}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Orientation Change Test */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RotateCw className="h-5 w-5" />
                        Orientation Change Handling
                    </CardTitle>
                    <CardDescription>
                        Layouts smoothly adapt when device orientation changes
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg border bg-muted">
                        <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <div className="space-y-2">
                                <p className="text-sm font-medium">
                                    Current Orientation: <span className="text-primary font-bold capitalize">{orientation}</span>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    On a tablet device, rotate your screen to see layouts adapt smoothly with transitions.
                                    The orientation-transition class ensures smooth visual changes.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Visual orientation indicator */}
                    <div className="flex items-center justify-center p-8 rounded-lg border bg-gradient-to-br from-primary/10 to-purple-600/10">
                        <div className={cn(
                            "transition-all duration-500 ease-in-out",
                            orientation === 'portrait' ? "w-32 h-48" : "w-48 h-32"
                        )}>
                            <div className="w-full h-full rounded-lg border-4 border-primary bg-primary/20 flex items-center justify-center">
                                <div className="text-center">
                                    <RotateCw className="h-8 w-8 text-primary mx-auto mb-2" />
                                    <p className="text-sm font-semibold text-primary capitalize">
                                        {orientation}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Testing Instructions */}
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle>Testing Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-headline font-semibold mb-2">Desktop Browser Testing:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Open Chrome DevTools (F12)</li>
                            <li>Click the device toolbar icon (Ctrl+Shift+M)</li>
                            <li>Select an iPad or tablet device from the dropdown</li>
                            <li>Test both portrait and landscape orientations</li>
                            <li>Verify layouts adapt smoothly between orientations</li>
                        </ol>
                    </div>
                    <div>
                        <h4 className="font-headline font-semibold mb-2">Tablet Device Testing:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Open this page on your tablet device</li>
                            <li>Verify the viewport detection shows "Tablet"</li>
                            <li>Rotate your device between portrait and landscape</li>
                            <li>Observe smooth transitions in grid layouts</li>
                            <li>Check that no horizontal scrolling occurs</li>
                        </ol>
                    </div>
                    <div>
                        <h4 className="font-headline font-semibold mb-2">What to Verify:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Tablet viewport (768px-1024px) is correctly detected</li>
                            <li>Grids show 2 columns in portrait, 3 in landscape</li>
                            <li>Dashboard layout efficiently uses tablet screen space</li>
                            <li>Orientation changes trigger smooth transitions</li>
                            <li>All content remains accessible without scrolling issues</li>
                            <li>Touch targets remain adequately sized (44x44px minimum)</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
