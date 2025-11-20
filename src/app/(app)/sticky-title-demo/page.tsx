'use client';

import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStickyTitle } from '@/hooks/use-sticky-title';
import { useEffect, useRef, useState } from 'react';

export default function StickyTitleDemoPage() {
    const showInHeader = useStickyTitle();
    const [scrollPosition, setScrollPosition] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const main = document.querySelector('main');
            if (main) {
                setScrollPosition(main.scrollTop);
            }
        };

        const main = document.querySelector('main');
        main?.addEventListener('scroll', handleScroll);
        return () => main?.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <StandardPageLayout
            title="Sticky Title Demo"
            description="Title that sticks to top when scrolling"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Scroll Down to See Effect</CardTitle>
                        <CardDescription>
                            The page title will appear in the header when you scroll past it
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <p>Current scroll position: <code className="bg-muted px-2 py-1 rounded">{Math.round(scrollPosition)}px</code></p>
                            <p>Show in header: <code className="bg-muted px-2 py-1 rounded">{showInHeader ? 'Yes' : 'No'}</code></p>
                        </div>
                    </CardContent>
                </Card>

                {/* Spacer content to enable scrolling */}
                {Array.from({ length: 10 }, (_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <CardTitle>Content Section {i + 1}</CardTitle>
                            <CardDescription>Sample content to demonstrate scrolling</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
                                quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                            </p>
                        </CardContent>
                    </Card>
                ))}

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Example</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`import { useStickyTitle } from '@/hooks/use-sticky-title';

const showInHeader = useStickyTitle();

// Use in your header component
{showInHeader && (
  <div className="sticky top-0 z-10">
    <h1>Page Title</h1>
  </div>
)}`}</code>
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li>✓ Automatically detects scroll position</li>
                            <li>✓ Smooth transitions</li>
                            <li>✓ Performance optimized with IntersectionObserver</li>
                            <li>✓ Works with any content</li>
                            <li>✓ Mobile-friendly</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
