'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StickyTitleDemo() {
    return (
        <div className="space-y-8">
            <PageHeader
                title="Sticky Title Demo"
                description="Scroll down to see the page title appear in the topbar"
            />

            <Card>
                <CardHeader>
                    <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>
                        As you scroll down this page, the title "Sticky Title Demo" will automatically
                        appear in the topbar at the top of the screen.
                    </p>
                    <p>
                        This helps users maintain context about which page they're on, even when
                        they've scrolled past the original title.
                    </p>
                    <p className="text-muted-foreground text-sm">
                        Keep scrolling to see it in action...
                    </p>
                </CardContent>
            </Card>

            {/* Spacer content to enable scrolling */}
            {Array.from({ length: 10 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <CardTitle>Section {i + 1}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            This is placeholder content to demonstrate the sticky title feature.
                            The title should now be visible in the topbar above.
                        </p>
                        <div className="mt-4 space-y-2">
                            <div className="h-20 bg-muted rounded-md" />
                            <div className="h-20 bg-muted rounded-md" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
