'use client';

/**
 * Tests Index Page
 * 
 * Testing tools for responsive design and device compatibility.
 * Only accessible in development mode.
 */

import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Smartphone, Tablet, TestTube2 } from 'lucide-react';

interface Test {
    name: string;
    path: string;
    description: string;
    icon: any;
}

const tests: Test[] = [
    {
        name: 'Mobile Test',
        path: '/mobile-test',
        description: 'Mobile responsiveness testing',
        icon: Smartphone,
    },
    {
        name: 'Tablet Test',
        path: '/tablet-test',
        description: 'Tablet responsiveness testing',
        icon: Tablet,
    },
];

export default function TestsIndexPage() {
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!isDevelopment) {
        return (
            <StandardPageLayout
                title="Tests"
                description="Testing tools are only available in development mode"
                spacing="default"
            >
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">
                            This page is only accessible in development mode.
                        </p>
                    </CardContent>
                </Card>
            </StandardPageLayout>
        );
    }

    return (
        <StandardPageLayout
            title="Testing Tools"
            description="Responsive design and device compatibility testing"
            spacing="default"
        >
            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Total Tests</CardDescription>
                            <CardTitle className="text-3xl">{tests.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Device Types</CardDescription>
                            <CardTitle className="text-3xl">2</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Environment</CardDescription>
                            <CardTitle className="text-xl">
                                <Badge variant="outline">Development</Badge>
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Test Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tests.map((test) => {
                        const Icon = test.icon;
                        return (
                            <Card key={test.path} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Icon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{test.name}</CardTitle>
                                            </div>
                                        </div>
                                    </div>
                                    <CardDescription className="mt-2">
                                        {test.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button asChild className="w-full">
                                        <Link href={test.path}>
                                            Run Test
                                            <TestTube2 className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>About Testing Tools</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            These testing tools help verify responsive design and device compatibility.
                            Use them to ensure the application works correctly across different screen
                            sizes and device types.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
