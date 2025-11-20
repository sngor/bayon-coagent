'use client';

import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IntelligentEmptyState } from '@/components/ui/intelligent-empty-state';
import { FileText, Search, Plus, Upload, Inbox, FolderOpen } from 'lucide-react';

export default function IntelligentEmptyStateDemoPage() {
    return (
        <StandardPageLayout
            title="Intelligent Empty States"
            description="Smart empty state designs with contextual actions"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Default Variant</CardTitle>
                        <CardDescription>Standard empty state with actions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <IntelligentEmptyState
                            icon={FileText}
                            title="No content yet"
                            description="Get started by creating your first piece of content. Our AI will help you craft engaging posts, articles, and more."
                            actions={[
                                {
                                    label: 'Create Content',
                                    onClick: () => alert('Create clicked'),
                                    icon: Plus,
                                },
                                {
                                    label: 'Browse Templates',
                                    onClick: () => alert('Browse clicked'),
                                    variant: 'outline',
                                },
                            ]}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Card Variant</CardTitle>
                        <CardDescription>Empty state within a card container</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <IntelligentEmptyState
                            variant="card"
                            icon={Search}
                            title="No results found"
                            description="We couldn't find any properties matching your search criteria. Try adjusting your filters or search terms."
                            actions={[
                                {
                                    label: 'Clear Filters',
                                    onClick: () => alert('Clear clicked'),
                                },
                            ]}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Minimal Variant</CardTitle>
                        <CardDescription>Compact empty state with less padding</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <IntelligentEmptyState
                            variant="minimal"
                            icon={Inbox}
                            title="Inbox is empty"
                            description="You're all caught up! No new notifications at this time."
                        />
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload State</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <IntelligentEmptyState
                                variant="minimal"
                                icon={Upload}
                                title="Upload your files"
                                description="Drag and drop files here or click to browse"
                                actions={[
                                    {
                                        label: 'Choose Files',
                                        onClick: () => alert('Upload clicked'),
                                        icon: Upload,
                                    },
                                ]}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Projects State</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <IntelligentEmptyState
                                variant="minimal"
                                icon={FolderOpen}
                                title="No projects"
                                description="Create your first project to organize your work"
                                actions={[
                                    {
                                        label: 'New Project',
                                        onClick: () => alert('New project clicked'),
                                        icon: Plus,
                                    },
                                ]}
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Example</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`import { IntelligentEmptyState } from '@/components/ui/intelligent-empty-state';
import { FileText, Plus } from 'lucide-react';

<IntelligentEmptyState
  icon={FileText}
  title="No content yet"
  description="Get started by creating your first piece of content."
  actions={[
    {
      label: 'Create Content',
      onClick: () => handleCreate(),
      icon: Plus,
    },
  ]}
  variant="default" // or "card" or "minimal"
/>`}</code>
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
