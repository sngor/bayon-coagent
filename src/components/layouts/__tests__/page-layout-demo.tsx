import * as React from "react";
import { PageLayout } from "../page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Demo component showcasing the PageLayout component
 * This demonstrates all features: title, description, breadcrumbs, and action area
 */
export function PageLayoutDemo() {
    return (
        <div className="p-8 space-y-12">
            {/* Example 1: Full featured layout */}
            <div>
                <h2 className="text-xl font-semibold mb-4">
                    Example 1: Full Featured Layout
                </h2>
                <PageLayout
                    title="Marketing Plan"
                    description="Create and manage your comprehensive marketing strategy"
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Marketing", href: "/marketing" },
                        { label: "Marketing Plan" },
                    ]}
                    action={
                        <Button variant="default" size="lg">
                            Generate New Plan
                        </Button>
                    }
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Marketing Plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                This is where your marketing plan content would appear.
                            </p>
                        </CardContent>
                    </Card>
                </PageLayout>
            </div>

            {/* Example 2: Simple layout without breadcrumbs */}
            <div>
                <h2 className="text-xl font-semibold mb-4">
                    Example 2: Simple Layout (No Breadcrumbs)
                </h2>
                <PageLayout
                    title="Dashboard"
                    description="Welcome back! Here's your overview"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Metric 1</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">42</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Metric 2</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">128</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Metric 3</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">96%</p>
                            </CardContent>
                        </Card>
                    </div>
                </PageLayout>
            </div>

            {/* Example 3: Layout with action but no description */}
            <div>
                <h2 className="text-xl font-semibold mb-4">
                    Example 3: With Action, No Description
                </h2>
                <PageLayout
                    title="Content Engine"
                    breadcrumbs={[
                        { label: "Home", href: "/" },
                        { label: "Content Engine" },
                    ]}
                    action={
                        <div className="flex gap-2">
                            <Button variant="outline">Save Draft</Button>
                            <Button variant="default">Publish</Button>
                        </div>
                    }
                >
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground">Content creation area</p>
                        </CardContent>
                    </Card>
                </PageLayout>
            </div>

            {/* Example 4: Minimal layout */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Example 4: Minimal Layout</h2>
                <PageLayout title="Settings">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground">Settings content</p>
                        </CardContent>
                    </Card>
                </PageLayout>
            </div>
        </div>
    );
}
