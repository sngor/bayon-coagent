'use client';

import * as React from 'react';
import { PageHeader } from './page-header';
import { SectionContainer } from './section-container';
import { GridLayout } from './grid-layout';
import { ContentWrapper } from './content-wrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Settings, Users } from 'lucide-react';

/**
 * Demo component showcasing the layout component library
 * 
 * This demonstrates:
 * - PageHeader with different variants
 * - SectionContainer with different variants
 * - GridLayout with different column counts
 * - ContentWrapper with different max widths
 */
export function LayoutComponentsDemo() {
    return (
        <div className="space-y-12 p-8">
            {/* PageHeader Demo */}
            <ContentWrapper maxWidth="default">
                <div className="space-y-8">
                    <h2 className="text-2xl font-bold">PageHeader Component</h2>

                    {/* Default variant */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Default Variant</h3>
                        <PageHeader
                            title="Dashboard"
                            description="Welcome to your dashboard"
                            icon={Home}
                            actions={<Button>New Item</Button>}
                            variant="default"
                        />
                    </div>

                    {/* Hub variant */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Hub Variant</h3>
                        <PageHeader
                            title="Content Studio"
                            description="Create AI-powered content for your real estate business"
                            icon={Settings}
                            actions={
                                <div className="flex gap-2">
                                    <Button variant="outline">Templates</Button>
                                    <Button>New Content</Button>
                                </div>
                            }
                            variant="hub"
                            breadcrumbs={[
                                { label: 'Home', href: '/' },
                                { label: 'Studio', href: '/studio' },
                                { label: 'Write' },
                            ]}
                        />
                    </div>

                    {/* Compact variant */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Compact Variant</h3>
                        <PageHeader
                            title="Settings"
                            description="Manage your account settings"
                            icon={Users}
                            variant="compact"
                        />
                    </div>
                </div>
            </ContentWrapper>

            {/* SectionContainer Demo */}
            <ContentWrapper maxWidth="default">
                <div className="space-y-8">
                    <h2 className="text-2xl font-bold">SectionContainer Component</h2>

                    <GridLayout columns={3} gap="lg">
                        {/* Default variant */}
                        <SectionContainer
                            title="Default Section"
                            description="Basic section container"
                            variant="default"
                        >
                            <p className="text-sm text-muted-foreground">
                                This is a default section container with no elevation or border.
                            </p>
                        </SectionContainer>

                        {/* Elevated variant */}
                        <SectionContainer
                            title="Elevated Section"
                            description="Section with shadow"
                            variant="elevated"
                            headerAction={<Button variant="ghost" size="sm">View All</Button>}
                        >
                            <p className="text-sm text-muted-foreground">
                                This section has a shadow for elevation effect.
                            </p>
                        </SectionContainer>

                        {/* Bordered variant */}
                        <SectionContainer
                            title="Bordered Section"
                            description="Section with border"
                            variant="bordered"
                            footer={
                                <div className="flex justify-end">
                                    <Button variant="link" size="sm">Learn More →</Button>
                                </div>
                            }
                        >
                            <p className="text-sm text-muted-foreground">
                                This section has a border and includes a footer.
                            </p>
                        </SectionContainer>
                    </GridLayout>
                </div>
            </ContentWrapper>

            {/* GridLayout Demo */}
            <ContentWrapper maxWidth="default">
                <div className="space-y-8">
                    <h2 className="text-2xl font-bold">GridLayout Component</h2>

                    {/* 2 columns */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">2 Columns</h3>
                        <GridLayout columns={2} gap="md">
                            {[1, 2].map((i) => (
                                <Card key={i}>
                                    <CardHeader>
                                        <CardTitle>Card {i}</CardTitle>
                                        <CardDescription>2-column grid layout</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            Content for card {i}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </GridLayout>
                    </div>

                    {/* 3 columns */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">3 Columns</h3>
                        <GridLayout columns={3} gap="lg">
                            {[1, 2, 3].map((i) => (
                                <Card key={i}>
                                    <CardHeader>
                                        <CardTitle>Card {i}</CardTitle>
                                        <CardDescription>3-column grid layout</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            Content for card {i}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </GridLayout>
                    </div>

                    {/* 4 columns */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">4 Columns</h3>
                        <GridLayout columns={4} gap="sm">
                            {[1, 2, 3, 4].map((i) => (
                                <Card key={i}>
                                    <CardHeader>
                                        <CardTitle>Card {i}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            4-column grid
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </GridLayout>
                    </div>
                </div>
            </ContentWrapper>

            {/* ContentWrapper Demo */}
            <div className="space-y-8">
                <h2 className="text-2xl font-bold text-center">ContentWrapper Component</h2>

                {/* Narrow */}
                <ContentWrapper maxWidth="narrow">
                    <Card>
                        <CardHeader>
                            <CardTitle>Narrow Width</CardTitle>
                            <CardDescription>max-w-3xl</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                This content is constrained to a narrow width, ideal for reading-focused content.
                            </p>
                        </CardContent>
                    </Card>
                </ContentWrapper>

                {/* Default */}
                <ContentWrapper maxWidth="default">
                    <Card>
                        <CardHeader>
                            <CardTitle>Default Width</CardTitle>
                            <CardDescription>max-w-7xl</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                This is the default content width, suitable for most pages.
                            </p>
                        </CardContent>
                    </Card>
                </ContentWrapper>

                {/* Wide */}
                <ContentWrapper maxWidth="wide">
                    <Card>
                        <CardHeader>
                            <CardTitle>Wide Width</CardTitle>
                            <CardDescription>max-w-[1600px]</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                This content uses a wider container, great for dashboards and data-heavy pages.
                            </p>
                        </CardContent>
                    </Card>
                </ContentWrapper>

                {/* Full width */}
                <ContentWrapper maxWidth="full" fullWidth>
                    <Card>
                        <CardHeader>
                            <CardTitle>Full Width</CardTitle>
                            <CardDescription>No max-width constraint</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                This content spans the full width of the viewport.
                            </p>
                        </CardContent>
                    </Card>
                </ContentWrapper>
            </div>
        </div>
    );
}
