'use client';

import { useState } from 'react';
import {
    PageHeader,
    ContentSection,
    DataGrid,
    StatCard,
    ActionBar,
    FormSection,
    LoadingSection,
    EmptySection
} from '@/components/ui';
import { FormLayout, PageLayout } from '@/components/layouts';
import { StandardFormField } from '@/components/standard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Star,
    TrendingUp,
    Users,
    DollarSign,
    Home,
    Settings,
    User,
    Mail,
    Phone,
    Plus,
    Sparkles
} from 'lucide-react';

export function DesignSystemShowcase() {
    const [isLoading, setIsLoading] = useState(false);
    const [showEmpty, setShowEmpty] = useState(false);

    return (
        <PageLayout
            header={{
                title: "Design System Showcase",
                description: "Demonstration of all reusable components and patterns",
                icon: Settings,
                actions: (
                    <ActionBar>
                        <Button variant="outline">Export</Button>
                        <Button variant="ai">Generate Report</Button>
                    </ActionBar>
                )
            }}
            spacing="spacious"
        >
            <Tabs defaultValue="layouts" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="layouts">Layouts</TabsTrigger>
                    <TabsTrigger value="forms">Forms</TabsTrigger>
                    <TabsTrigger value="states">States</TabsTrigger>
                    <TabsTrigger value="data">Data Display</TabsTrigger>
                </TabsList>

                <TabsContent value="layouts" className="space-y-8">
                    <ContentSection
                        title="Page Headers"
                        description="Consistent page title and description patterns"
                    >
                        <div className="space-y-6 p-6 border rounded-lg bg-muted/20">
                            <PageHeader
                                title="Hub Page Example"
                                description="This is how hub pages should look with consistent styling"
                                icon={Home}
                                variant="hub"
                                actions={<Button size="sm">Action</Button>}
                            />

                            <PageHeader
                                title="Compact Header"
                                description="For smaller sections or modals"
                                icon={User}
                                variant="compact"
                            />
                        </div>
                    </ContentSection>

                    <ContentSection
                        title="Content Sections"
                        description="Organized content with optional headers and actions"
                    >
                        <DataGrid columns={2}>
                            <ContentSection
                                title="Default Section"
                                description="Standard content section"
                                icon={Star}
                                variant="default"
                            >
                                <p className="text-sm text-muted-foreground">
                                    This is the default content section style with clean spacing and typography.
                                </p>
                            </ContentSection>

                            <ContentSection
                                title="Card Section"
                                description="Elevated card style"
                                icon={TrendingUp}
                                variant="card"
                                actions={<Button size="sm" variant="outline">Edit</Button>}
                            >
                                <p className="text-sm text-muted-foreground">
                                    Card sections provide visual separation and work well for dashboard widgets.
                                </p>
                            </ContentSection>
                        </DataGrid>
                    </ContentSection>

                    <ContentSection
                        title="Data Grids"
                        description="Responsive grid layouts for organizing content"
                    >
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground">3-Column Grid</h4>
                            <DataGrid columns={3}>
                                <div className="p-4 border rounded-lg bg-card">Item 1</div>
                                <div className="p-4 border rounded-lg bg-card">Item 2</div>
                                <div className="p-4 border rounded-lg bg-card">Item 3</div>
                            </DataGrid>

                            <h4 className="text-sm font-medium text-muted-foreground">2-Column Grid</h4>
                            <DataGrid columns={2}>
                                <div className="p-4 border rounded-lg bg-card">Item A</div>
                                <div className="p-4 border rounded-lg bg-card">Item B</div>
                            </DataGrid>
                        </div>
                    </ContentSection>
                </TabsContent>

                <TabsContent value="forms" className="space-y-8">
                    <ContentSection
                        title="Form Layouts"
                        description="Consistent form patterns with proper spacing and validation"
                    >
                        <FormLayout
                            title="Example Form"
                            description="This demonstrates the standard form layout pattern"
                            actions={
                                <ActionBar>
                                    <Button variant="outline">Cancel</Button>
                                    <Button variant="ai">
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Generate
                                    </Button>
                                </ActionBar>
                            }
                        >
                            <FormSection title="Personal Information" icon={User}>
                                <DataGrid columns={2}>
                                    <StandardFormField label="First Name" id="firstName" required>
                                        <Input placeholder="John" />
                                    </StandardFormField>
                                    <StandardFormField label="Last Name" id="lastName" required>
                                        <Input placeholder="Smith" />
                                    </StandardFormField>
                                </DataGrid>
                            </FormSection>

                            <FormSection title="Contact Details" icon={Mail}>
                                <DataGrid columns={2}>
                                    <StandardFormField label="Email" id="email" required>
                                        <Input type="email" placeholder="john@example.com" />
                                    </StandardFormField>
                                    <StandardFormField label="Phone" id="phone">
                                        <Input type="tel" placeholder="(555) 123-4567" />
                                    </StandardFormField>
                                </DataGrid>
                            </FormSection>
                        </FormLayout>
                    </ContentSection>
                </TabsContent>

                <TabsContent value="states" className="space-y-8">
                    <ContentSection
                        title="Loading States"
                        description="Consistent loading indicators for different contexts"
                    >
                        <DataGrid columns={3}>
                            <LoadingSection
                                title="Loading..."
                                variant="default"
                                size="default"
                            />
                            <LoadingSection
                                title="Processing"
                                description="Please wait while we generate your content"
                                variant="card"
                            />
                            <LoadingSection
                                variant="minimal"
                                size="sm"
                            />
                        </DataGrid>
                    </ContentSection>

                    <ContentSection
                        title="Empty States"
                        description="Helpful empty states with clear calls to action"
                    >
                        <DataGrid columns={2}>
                            <EmptySection
                                title="No Reviews Yet"
                                description="Import your reviews from Zillow and other platforms to track your reputation."
                                icon={Star}
                                action={{
                                    label: "Import Reviews",
                                    onClick: () => console.log("Import clicked"),
                                    variant: "default"
                                }}
                                variant="card"
                            />
                            <EmptySection
                                title="Create Your First Post"
                                description="Get started by generating AI-powered social media content."
                                icon={Plus}
                                action={{
                                    label: "Generate Content",
                                    onClick: () => console.log("Generate clicked"),
                                    variant: "ai"
                                }}
                                variant="card"
                            />
                        </DataGrid>
                    </ContentSection>

                    <ContentSection
                        title="Interactive States"
                        description="Toggle between different states to see the patterns"
                    >
                        <ActionBar alignment="left">
                            <Button
                                variant={isLoading ? "default" : "outline"}
                                onClick={() => setIsLoading(!isLoading)}
                            >
                                Toggle Loading
                            </Button>
                            <Button
                                variant={showEmpty ? "default" : "outline"}
                                onClick={() => setShowEmpty(!showEmpty)}
                            >
                                Toggle Empty
                            </Button>
                        </ActionBar>

                        <div className="min-h-[200px] border rounded-lg">
                            {isLoading ? (
                                <LoadingSection
                                    title="Loading your data..."
                                    description="This may take a few moments"
                                    variant="default"
                                />
                            ) : showEmpty ? (
                                <EmptySection
                                    title="No Data Available"
                                    description="Try adjusting your filters or creating new content"
                                    icon={Users}
                                    action={{
                                        label: "Create Content",
                                        onClick: () => setShowEmpty(false),
                                        variant: "ai"
                                    }}
                                />
                            ) : (
                                <div className="p-8 text-center">
                                    <h3 className="text-lg font-semibold mb-2">Content Loaded</h3>
                                    <p className="text-muted-foreground">
                                        This is what your content looks like when everything is working properly.
                                    </p>
                                </div>
                            )}
                        </div>
                    </ContentSection>
                </TabsContent>

                <TabsContent value="data" className="space-y-8">
                    <ContentSection
                        title="Stat Cards"
                        description="Consistent metric display with trends and formatting"
                    >
                        <DataGrid columns={4}>
                            <StatCard
                                title="Total Revenue"
                                value={125000}
                                icon={DollarSign}
                                format="currency"
                                trend={{
                                    value: 12.5,
                                    direction: 'up',
                                    label: 'vs last month'
                                }}
                            />
                            <StatCard
                                title="Active Listings"
                                value={24}
                                icon={Home}
                                trend={{
                                    value: 8.3,
                                    direction: 'up',
                                    label: 'vs last month'
                                }}
                            />
                            <StatCard
                                title="Client Satisfaction"
                                value={4.8}
                                icon={Star}
                                format="number"
                                trend={{
                                    value: 2.1,
                                    direction: 'up',
                                    label: 'vs last quarter'
                                }}
                            />
                            <StatCard
                                title="Conversion Rate"
                                value={15.7}
                                icon={TrendingUp}
                                format="percentage"
                                trend={{
                                    value: 3.2,
                                    direction: 'down',
                                    label: 'vs last month'
                                }}
                            />
                        </DataGrid>
                    </ContentSection>

                    <ContentSection
                        title="Action Bars"
                        description="Consistent button groupings and alignments"
                    >
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium mb-2">Right Aligned (Default)</h4>
                                <ActionBar alignment="right">
                                    <Button variant="outline">Cancel</Button>
                                    <Button variant="default">Save</Button>
                                    <Button variant="ai">Generate</Button>
                                </ActionBar>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium mb-2">Space Between</h4>
                                <ActionBar alignment="between">
                                    <Button variant="outline">Back</Button>
                                    <div className="flex gap-2">
                                        <Button variant="outline">Cancel</Button>
                                        <Button variant="default">Continue</Button>
                                    </div>
                                </ActionBar>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium mb-2">Center Aligned</h4>
                                <ActionBar alignment="center">
                                    <Button variant="outline">Option 1</Button>
                                    <Button variant="default">Option 2</Button>
                                    <Button variant="ai">Option 3</Button>
                                </ActionBar>
                            </div>
                        </div>
                    </ContentSection>
                </TabsContent>
            </Tabs>
        </PageLayout>
    );
}