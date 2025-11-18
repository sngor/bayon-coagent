'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    HouseIcon,
    ChartIcon,
    UsersIcon,
    ContentIcon,
    ToolsIcon,
    AISparkleIcon,
    SuccessIcon,
    EmptyStateHouseIcon,
    EmptyStateContentIcon,
    EmptyStateChartIcon,
} from '@/components/ui/real-estate-icons';

export default function RealEstateIconsDemoPage() {
    const [animated, setAnimated] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);

    const navigationIcons = [
        { Icon: HouseIcon, name: 'HouseIcon', description: 'Home, property, listings' },
        { Icon: ChartIcon, name: 'ChartIcon', description: 'Analytics, trends, metrics' },
        { Icon: UsersIcon, name: 'UsersIcon', description: 'Clients, contacts, community' },
        { Icon: ContentIcon, name: 'ContentIcon', description: 'Blog, social, marketing' },
        { Icon: ToolsIcon, name: 'ToolsIcon', description: 'Settings, utilities, tools' },
        { Icon: AISparkleIcon, name: 'AISparkleIcon', description: 'AI, automation, intelligence' },
    ];

    const emptyStateIcons = [
        { Icon: EmptyStateHouseIcon, name: 'EmptyStateHouseIcon', description: 'No properties' },
        { Icon: EmptyStateContentIcon, name: 'EmptyStateContentIcon', description: 'No content' },
        { Icon: EmptyStateChartIcon, name: 'EmptyStateChartIcon', description: 'No data' },
    ];

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Real Estate Icon Set</h1>
                <p className="text-lg text-muted-foreground">
                    Custom-designed, animated icons for real estate applications
                </p>
            </div>

            {/* Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Controls</CardTitle>
                    <CardDescription>Toggle animation and test different states</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="animated"
                            checked={animated}
                            onCheckedChange={setAnimated}
                        />
                        <Label htmlFor="animated">Enable Animations</Label>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => setShowSuccess(!showSuccess)}>
                            Toggle Success Icon
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="navigation" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="navigation">Navigation Icons</TabsTrigger>
                    <TabsTrigger value="empty">Empty States</TabsTrigger>
                    <TabsTrigger value="usage">Usage Examples</TabsTrigger>
                    <TabsTrigger value="sizes">Sizes</TabsTrigger>
                </TabsList>

                {/* Navigation Icons Tab */}
                <TabsContent value="navigation" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Navigation & Feature Icons</CardTitle>
                            <CardDescription>
                                Icons for navigation, features, and UI elements
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {navigationIcons.map(({ Icon, name, description }) => (
                                    <Card key={name} className="p-6">
                                        <div className="flex flex-col items-center text-center space-y-3">
                                            <div className="p-4 rounded-lg bg-primary/10">
                                                <Icon animated={animated} className="w-12 h-12 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{name}</h3>
                                                <p className="text-sm text-muted-foreground">{description}</p>
                                            </div>
                                            <code className="text-xs bg-muted px-2 py-1 rounded">
                                                {`<${name} />`}
                                            </code>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Success Icon */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Success Icon</CardTitle>
                            <CardDescription>
                                For successful operations and achievements
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center space-y-4">
                                {showSuccess && (
                                    <div className="flex items-center gap-4 p-6 rounded-lg bg-success/10">
                                        <SuccessIcon animated={animated} className="w-16 h-16 text-success" />
                                        <div>
                                            <h3 className="font-semibold text-lg">Success!</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Your operation completed successfully
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                    {`<SuccessIcon className="w-12 h-12 text-success" />`}
                                </code>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Empty States Tab */}
                <TabsContent value="empty" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Empty State Illustrations</CardTitle>
                            <CardDescription>
                                Friendly, illustrated icons for empty states
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {emptyStateIcons.map(({ Icon, name, description }) => (
                                    <Card key={name} className="p-6">
                                        <div className="flex flex-col items-center text-center space-y-3">
                                            <Icon className="w-32 h-32" />
                                            <div>
                                                <h3 className="font-semibold">{name}</h3>
                                                <p className="text-sm text-muted-foreground">{description}</p>
                                            </div>
                                            <code className="text-xs bg-muted px-2 py-1 rounded">
                                                {`<${name} />`}
                                            </code>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Usage Examples Tab */}
                <TabsContent value="usage" className="space-y-4">
                    {/* Navigation Example */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Navigation Example</CardTitle>
                            <CardDescription>Icons in a navigation menu</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {[
                                    { Icon: HouseIcon, label: 'Dashboard' },
                                    { Icon: ChartIcon, label: 'Analytics' },
                                    { Icon: UsersIcon, label: 'Clients' },
                                    { Icon: ContentIcon, label: 'Content' },
                                    { Icon: ToolsIcon, label: 'Settings' },
                                ].map(({ Icon, label }) => (
                                    <button
                                        key={label}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                                    >
                                        <Icon animated={animated} className="w-5 h-5" />
                                        <span className="font-medium">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Feature Cards Example */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Feature Cards Example</CardTitle>
                            <CardDescription>Icons highlighting features</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-primary/10">
                                            <AISparkleIcon animated={animated} className="w-8 h-8 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">AI-Powered Insights</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Get personalized recommendations based on your market
                                            </p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-lg bg-primary/10">
                                            <ChartIcon animated={animated} className="w-8 h-8 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">Market Analytics</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Track trends and performance metrics in real-time
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Empty State Example */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Empty State Example</CardTitle>
                            <CardDescription>Complete empty state with illustration</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12">
                                <EmptyStateHouseIcon className="w-32 h-32 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
                                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                                    Get started by adding your first property listing to showcase to potential clients
                                </p>
                                <Button>
                                    <HouseIcon animated={false} className="w-4 h-4 mr-2" />
                                    Add Property
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Sizes Tab */}
                <TabsContent value="sizes" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Icon Sizes</CardTitle>
                            <CardDescription>Different size variations</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {navigationIcons.slice(0, 3).map(({ Icon, name }) => (
                                    <div key={name} className="space-y-3">
                                        <h3 className="font-semibold">{name}</h3>
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <Icon animated={animated} className="w-4 h-4 text-primary mx-auto mb-1" />
                                                <Badge variant="outline">w-4 h-4</Badge>
                                            </div>
                                            <div className="text-center">
                                                <Icon animated={animated} className="w-6 h-6 text-primary mx-auto mb-1" />
                                                <Badge variant="outline">w-6 h-6</Badge>
                                            </div>
                                            <div className="text-center">
                                                <Icon animated={animated} className="w-8 h-8 text-primary mx-auto mb-1" />
                                                <Badge variant="outline">w-8 h-8</Badge>
                                            </div>
                                            <div className="text-center">
                                                <Icon animated={animated} className="w-12 h-12 text-primary mx-auto mb-1" />
                                                <Badge variant="outline">w-12 h-12</Badge>
                                            </div>
                                            <div className="text-center">
                                                <Icon animated={animated} className="w-16 h-16 text-primary mx-auto mb-1" />
                                                <Badge variant="outline">w-16 h-16</Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Color Variations */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Color Variations</CardTitle>
                            <CardDescription>Icons with different colors</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <HouseIcon animated={animated} className="w-12 h-12 text-primary mx-auto mb-2" />
                                    <Badge>Primary</Badge>
                                </div>
                                <div className="text-center">
                                    <ChartIcon animated={animated} className="w-12 h-12 text-success mx-auto mb-2" />
                                    <Badge>Success</Badge>
                                </div>
                                <div className="text-center">
                                    <UsersIcon animated={animated} className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                                    <Badge>Blue</Badge>
                                </div>
                                <div className="text-center">
                                    <ContentIcon animated={animated} className="w-12 h-12 text-purple-600 mx-auto mb-2" />
                                    <Badge>Purple</Badge>
                                </div>
                                <div className="text-center">
                                    <ToolsIcon animated={animated} className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                                    <Badge>Muted</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Code Examples */}
            <Card>
                <CardHeader>
                    <CardTitle>Code Examples</CardTitle>
                    <CardDescription>Copy and paste these examples</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">Import</h4>
                        <code className="block bg-muted p-3 rounded text-sm">
                            {`import { HouseIcon, ChartIcon, AISparkleIcon } from '@/components/ui/real-estate-icons';`}
                        </code>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">Basic Usage</h4>
                        <code className="block bg-muted p-3 rounded text-sm whitespace-pre">
                            {`<HouseIcon className="w-8 h-8 text-primary" />`}
                        </code>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">Static Icon (No Animation)</h4>
                        <code className="block bg-muted p-3 rounded text-sm whitespace-pre">
                            {`<ChartIcon animated={false} className="w-6 h-6" />`}
                        </code>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">In Navigation</h4>
                        <code className="block bg-muted p-3 rounded text-sm whitespace-pre">
                            {`<button className="flex items-center gap-2">
  <HouseIcon className="w-5 h-5" />
  <span>Dashboard</span>
</button>`}
                        </code>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">Empty State</h4>
                        <code className="block bg-muted p-3 rounded text-sm whitespace-pre">
                            {`<div className="text-center">
  <EmptyStateHouseIcon className="w-32 h-32 mx-auto" />
  <h3>No Properties Yet</h3>
  <Button>Add Property</Button>
</div>`}
                        </code>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
