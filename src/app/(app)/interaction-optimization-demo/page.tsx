'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OptimisticUIDemo } from '@/components/optimistic-ui-demo';
import {
    useDebounce,
    useThrottle,
    useDebouncedCallback,
    useThrottledCallback,
    measureInteractionTime,
} from '@/lib/interaction-optimization';
import { Badge } from '@/components/ui/badge';

/**
 * Interaction Optimization Demo Page
 * 
 * Demonstrates various interaction optimization techniques:
 * - Debounced search (300ms delay)
 * - Throttled scroll handling (100ms limit)
 * - Optimistic UI updates
 * - Performance measurement
 * 
 * Requirements: 17.2 - Ensure UI responds within 100ms to interactions
 */

export default function InteractionOptimizationDemo() {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [scrollCount, setScrollCount] = React.useState(0);
    const [clickCount, setClickCount] = React.useState(0);
    const [performanceLog, setPerformanceLog] = React.useState<string[]>([]);

    // Debounced search value
    const debouncedSearch = useDebounce(searchQuery, 300);

    // Throttled scroll handler
    const handleScroll = useThrottledCallback(() => {
        setScrollCount((prev) => prev + 1);
    }, 100);

    // Measured click handler
    const handleMeasuredClick = measureInteractionTime(
        'Button Click',
        () => {
            setClickCount((prev) => prev + 1);
            setPerformanceLog((prev) => [
                ...prev,
                `Click ${clickCount + 1} - Response time measured`,
            ]);
        }
    );

    // Sample data for search demo
    const sampleItems = [
        'Apple',
        'Banana',
        'Cherry',
        'Date',
        'Elderberry',
        'Fig',
        'Grape',
        'Honeydew',
        'Kiwi',
        'Lemon',
        'Mango',
        'Nectarine',
        'Orange',
        'Papaya',
        'Quince',
        'Raspberry',
        'Strawberry',
        'Tangerine',
    ];

    const filteredItems = React.useMemo(() => {
        if (!debouncedSearch) return sampleItems;
        return sampleItems.filter((item) =>
            item.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [debouncedSearch]);

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Interaction Optimization Demo
                </h1>
                <p className="text-muted-foreground mt-2">
                    Demonstrating techniques to ensure UI responds within 100ms to interactions
                </p>
            </div>

            {/* Debounced Search Demo */}
            <Card>
                <CardHeader>
                    <CardTitle>Debounced Search</CardTitle>
                    <CardDescription>
                        Type in the search box. The UI updates immediately, but the actual
                        search is debounced by 300ms to reduce unnecessary operations.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4 items-center">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search fruits..."
                            className="max-w-md"
                        />
                        <Badge variant="outline">
                            Immediate UI: {searchQuery.length} chars
                        </Badge>
                        <Badge variant="secondary">
                            Debounced Search: {debouncedSearch.length} chars
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {filteredItems.map((item) => (
                            <div
                                key={item}
                                className="p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                            >
                                {item}
                            </div>
                        ))}
                    </div>

                    {filteredItems.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No results found for "{debouncedSearch}"
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Throttled Scroll Demo */}
            <Card>
                <CardHeader>
                    <CardTitle>Throttled Scroll Handling</CardTitle>
                    <CardDescription>
                        Scroll in the box below. The scroll handler is throttled to run at
                        most once every 100ms, preventing performance issues.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div
                        className="h-64 overflow-y-auto border rounded-lg p-4 space-y-2"
                        onScroll={handleScroll}
                    >
                        {Array.from({ length: 50 }, (_, i) => (
                            <div key={i} className="p-2 bg-accent rounded">
                                Scroll item {i + 1}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4">
                        <Badge>Scroll events handled: {scrollCount}</Badge>
                        <p className="text-sm text-muted-foreground mt-2">
                            Without throttling, this would fire hundreds of times per second!
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Performance Measurement Demo */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance Measurement</CardTitle>
                    <CardDescription>
                        Click the button to see measured response times. We aim for &lt;100ms.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4 items-center">
                        <Button onClick={handleMeasuredClick}>
                            Click Me (Measured)
                        </Button>
                        <Badge>Clicks: {clickCount}</Badge>
                    </div>

                    {performanceLog.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Performance Log:</p>
                            <div className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                                {performanceLog.slice(-10).map((log, i) => (
                                    <div key={i}>{log}</div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground italic">
                                Check the browser console for detailed timing information
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Optimistic UI Demo */}
            <OptimisticUIDemo />

            {/* Best Practices */}
            <Card>
                <CardHeader>
                    <CardTitle>Best Practices for Responsive Interactions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <h3 className="font-semibold">1. Debounce Search Inputs</h3>
                        <p className="text-sm text-muted-foreground">
                            Use 300ms debounce for search inputs to reduce unnecessary API calls
                            while keeping the UI responsive.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold">2. Throttle Scroll/Resize Handlers</h3>
                        <p className="text-sm text-muted-foreground">
                            Limit scroll and resize handlers to run at most once every 100ms to
                            prevent performance degradation.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold">3. Use Optimistic UI Updates</h3>
                        <p className="text-sm text-muted-foreground">
                            Update the UI immediately when users take actions, then sync with the
                            server in the background. Revert if the operation fails.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold">4. Measure Performance</h3>
                        <p className="text-sm text-muted-foreground">
                            Use performance measurement tools to ensure interactions respond
                            within 100ms. Log warnings for slow operations.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold">5. Defer Non-Critical Work</h3>
                        <p className="text-sm text-muted-foreground">
                            Use requestIdleCallback to defer non-critical updates until the
                            browser is idle, keeping interactions snappy.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
