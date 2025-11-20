'use client';

import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useDebouncedCallback } from '@/lib/interaction-optimization';
import { Loader2, Zap } from 'lucide-react';

export default function InteractionOptimizationDemoPage() {
    const [searchValue, setSearchValue] = useState('');
    const [debouncedValue, setDebouncedValue] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const debouncedSearch = useDebouncedCallback((value: string) => {
        setIsSearching(true);
        setTimeout(() => {
            setDebouncedValue(value);
            setIsSearching(false);
        }, 500);
    }, 300);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchValue(value);
        debouncedSearch(value);
    };

    return (
        <StandardPageLayout
            title="Interaction Optimization Demo"
            description="Optimized interaction patterns for better UX"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Debounced Input</CardTitle>
                        <CardDescription>
                            Reduces API calls by waiting for user to stop typing
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                value={searchValue}
                                onChange={handleSearch}
                                placeholder="Type to search..."
                            />
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
                                <span>
                                    Immediate value: <code className="bg-muted px-2 py-1 rounded">{searchValue || '(empty)'}</code>
                                </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Debounced value (300ms): <code className="bg-muted px-2 py-1 rounded">{debouncedValue || '(empty)'}</code>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Optimistic UI Updates</CardTitle>
                        <CardDescription>
                            Update UI immediately, sync with server in background
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                When user clicks "Like", the UI updates instantly (optimistic) while the
                                request is sent to the server in the background.
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline">
                                    ❤️ Like (Instant feedback)
                                </Button>
                                <Button variant="outline">
                                    💾 Save (Instant feedback)
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Request Deduplication</CardTitle>
                        <CardDescription>
                            Prevent duplicate requests for the same data
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                If multiple components request the same data, only one request is made
                                and the result is shared.
                            </p>
                            <div className="bg-muted p-4 rounded-lg">
                                <code className="text-sm">
                                    {`// Without deduplication: 3 requests
Component A: fetch('/api/profile')
Component B: fetch('/api/profile')
Component C: fetch('/api/profile')

// With deduplication: 1 request
All components share the same request`}
                                </code>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Throttling</CardTitle>
                        <CardDescription>
                            Limit how often a function can execute
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Useful for scroll events, resize handlers, and other high-frequency events.
                            </p>
                            <div className="bg-muted p-4 rounded-lg">
                                <code className="text-sm">
                                    {`// Throttle scroll handler to run max once per 100ms
const handleScroll = throttle(() => {
  // Update scroll position
}, 100);`}
                                </code>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Performance Metrics</CardTitle>
                        <CardDescription>
                            Target response times for optimal UX
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <strong>Instant Feedback</strong>
                                    <p className="text-muted-foreground">Button clicks, toggles</p>
                                </div>
                                <code className="text-primary">&lt;16ms</code>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <strong>Quick Response</strong>
                                    <p className="text-muted-foreground">Form validation, search</p>
                                </div>
                                <code className="text-primary">&lt;100ms</code>
                            </div>
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <strong>Acceptable Delay</strong>
                                    <p className="text-muted-foreground">Page navigation, data fetch</p>
                                </div>
                                <code className="text-primary">&lt;1s</code>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Example</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`import { useDebouncedCallback } from '@/lib/interaction-optimization';

// Debounce search
const debouncedSearch = useDebouncedCallback((query) => {
  fetchResults(query);
}, 300);

<Input onChange={(e) => debouncedSearch(e.target.value)} />

// Optimistic update
const handleLike = async () => {
  setLiked(true); // Instant UI update
  try {
    await api.like(postId); // Background sync
  } catch (error) {
    setLiked(false); // Rollback on error
  }
};`}</code>
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Best Practices</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li>✓ <strong>Debounce</strong> search inputs and autocomplete</li>
                            <li>✓ <strong>Throttle</strong> scroll and resize handlers</li>
                            <li>✓ <strong>Optimistic updates</strong> for user actions</li>
                            <li>✓ <strong>Request deduplication</strong> for shared data</li>
                            <li>✓ <strong>Loading states</strong> for async operations</li>
                            <li>✓ <strong>Error recovery</strong> with rollback</li>
                            <li>✓ <strong>Measure performance</strong> with metrics</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
