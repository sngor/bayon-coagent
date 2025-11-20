'use client';

import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VirtualList } from '@/components/ui/virtual-list';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

export default function VirtualScrollDemoPage() {
    const largeDataset = useMemo(() =>
        Array.from({ length: 10000 }, (_, i) => ({
            id: i + 1,
            title: `Content Item #${i + 1}`,
            type: ['Blog Post', 'Social Media', 'Email', 'Article'][i % 4],
            date: new Date(2024, 0, 1 + (i % 365)).toLocaleDateString(),
        })),
        []
    );

    const renderItem = (item: any) => (
        <div className="p-4 border-b hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                </div>
                <Badge variant="outline">{item.type}</Badge>
            </div>
        </div>
    );

    return (
        <StandardPageLayout
            title="Virtual Scroll Demo"
            description="Efficiently render large lists with virtual scrolling"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Virtual List (10,000 Items)</CardTitle>
                        <CardDescription>
                            Only renders visible items for optimal performance
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <VirtualList
                                items={largeDataset}
                                renderItem={renderItem}
                                itemHeight={73}
                                containerHeight={500}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Performance Benefits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-sm">
                            <div>
                                <strong className="text-primary">Without Virtual Scroll:</strong>
                                <p className="text-muted-foreground">
                                    Rendering 10,000 DOM elements = Slow, laggy, high memory usage
                                </p>
                            </div>
                            <div>
                                <strong className="text-primary">With Virtual Scroll:</strong>
                                <p className="text-muted-foreground">
                                    Only renders ~10-20 visible items = Fast, smooth, low memory
                                </p>
                            </div>
                            <div className="pt-2">
                                <Badge variant="outline" className="text-xs">
                                    Performance Improvement: 100-1000x faster
                                </Badge>
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
                            <code>{`import { VirtualList } from '@/components/ui/virtual-list';

const items = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  title: \`Item \${i}\`,
}));

<VirtualList
  items={items}
  renderItem={(item) => (
    <div className="p-4 border-b">
      {item.title}
    </div>
  )}
  itemHeight={60}
  containerHeight={500}
/>`}</code>
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li>✓ Renders only visible items</li>
                            <li>✓ Smooth scrolling performance</li>
                            <li>✓ Low memory footprint</li>
                            <li>✓ Handles 10,000+ items easily</li>
                            <li>✓ Dynamic item heights (optional)</li>
                            <li>✓ Keyboard navigation support</li>
                            <li>✓ Mobile-optimized</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
