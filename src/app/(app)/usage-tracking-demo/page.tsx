'use client';

import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UsageTracking, UsageStats } from '@/components/ui/usage-tracking';
import type { UsageLimit } from '@/components/ui/usage-tracking';

export default function UsageTrackingDemoPage() {
    // Sample usage limits
    const usageLimits: UsageLimit[] = [
        {
            feature: 'AI Content Generation',
            used: 45,
            limit: 50,
            period: 'monthly',
            resetDate: new Date('2024-12-01'),
        },
        {
            feature: 'Image Reimagine',
            used: 8,
            limit: 20,
            period: 'monthly',
            resetDate: new Date('2024-12-01'),
        },
        {
            feature: 'Marketing Plans',
            used: 2,
            limit: 5,
            period: 'monthly',
            resetDate: new Date('2024-12-01'),
        },
        {
            feature: 'Brand Audits',
            used: 10,
            limit: 10,
            period: 'monthly',
            resetDate: new Date('2024-12-01'),
        },
    ];

    const usageStats = [
        {
            label: 'Content Created',
            value: 127,
            previousValue: 98,
        },
        {
            label: 'AI Requests',
            value: 234,
            previousValue: 189,
        },
        {
            label: 'Engagement Rate',
            value: 8.5,
            previousValue: 7.2,
            format: 'percentage' as const,
        },
    ];

    // Different scenarios
    const lowUsage: UsageLimit[] = [
        {
            feature: 'Blog Posts',
            used: 5,
            limit: 50,
            period: 'monthly',
            resetDate: new Date('2024-12-01'),
        },
        {
            feature: 'Social Media Posts',
            used: 12,
            limit: 100,
            period: 'monthly',
            resetDate: new Date('2024-12-01'),
        },
    ];

    const nearLimit: UsageLimit[] = [
        {
            feature: 'AI Generations',
            used: 42,
            limit: 50,
            period: 'monthly',
            resetDate: new Date('2024-12-01'),
        },
    ];

    const atLimit: UsageLimit[] = [
        {
            feature: 'Premium Features',
            used: 10,
            limit: 10,
            period: 'monthly',
            resetDate: new Date('2024-12-01'),
        },
    ];

    return (
        <StandardPageLayout
            title="Usage Tracking Demo"
            description="Monitor feature usage and limits with visual indicators"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Usage Statistics</CardTitle>
                        <CardDescription>
                            Overview of your activity with trend indicators
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UsageStats stats={usageStats} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Mixed Usage Levels</CardTitle>
                        <CardDescription>
                            Showing different usage states with visual indicators
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UsageTracking limits={usageLimits} />
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Low Usage</CardTitle>
                            <CardDescription>Plenty of capacity remaining</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UsageTracking limits={lowUsage} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Near Limit</CardTitle>
                            <CardDescription>Warning indicator at 80%+</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UsageTracking limits={nearLimit} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>At Limit</CardTitle>
                            <CardDescription>Limit reached indicator</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UsageTracking limits={atLimit} />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li>✓ Visual progress bars for each feature</li>
                            <li>✓ Color-coded warnings (green → amber → red)</li>
                            <li>✓ Usage count and limit display</li>
                            <li>✓ Period indicators (daily, weekly, monthly)</li>
                            <li>✓ Reset date information</li>
                            <li>✓ Trend indicators with percentage change</li>
                            <li>✓ Responsive grid layout</li>
                            <li>✓ Accessible status badges</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Example</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`import { UsageTracking, UsageStats } from '@/components/ui/usage-tracking';

const limits = [
  {
    feature: 'AI Content Generation',
    used: 45,
    limit: 50,
    period: 'monthly',
    resetDate: new Date('2024-12-01'),
  },
];

const stats = [
  {
    label: 'Content Created',
    value: 127,
    previousValue: 98,
  },
];

<UsageStats stats={stats} />
<UsageTracking limits={limits} />`}</code>
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
