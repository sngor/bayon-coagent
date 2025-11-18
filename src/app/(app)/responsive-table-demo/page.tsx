'use client';

import { PageHeader } from '@/components/page-header';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    ResponsiveTableWrapper,
    ResponsiveTableCards,
} from '@/components/ui/responsive-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Demo page for responsive table components
 * Requirements: 16.4, 21.4
 */

type Agent = {
    id: string;
    name: string;
    agency: string;
    reviews: number;
    rating: number;
    status: 'Active' | 'Inactive';
};

const sampleAgents: Agent[] = [
    {
        id: '1',
        name: 'John Smith',
        agency: 'Seattle Homes Realty',
        reviews: 245,
        rating: 4.8,
        status: 'Active',
    },
    {
        id: '2',
        name: 'Sarah Johnson',
        agency: 'Pacific Northwest Properties',
        reviews: 189,
        rating: 4.9,
        status: 'Active',
    },
    {
        id: '3',
        name: 'Michael Chen',
        agency: 'Urban Living Real Estate',
        reviews: 312,
        rating: 4.7,
        status: 'Active',
    },
    {
        id: '4',
        name: 'Emily Rodriguez',
        agency: 'Coastal Properties Group',
        reviews: 156,
        rating: 4.6,
        status: 'Inactive',
    },
    {
        id: '5',
        name: 'David Thompson',
        agency: 'Mountain View Realty',
        reviews: 278,
        rating: 4.9,
        status: 'Active',
    },
];

export default function ResponsiveTableDemoPage() {
    return (
        <div className="space-y-8 animate-fade-in-up">
            <PageHeader
                title="Responsive Table Demo"
                description="Demonstrating responsive table patterns for mobile and desktop viewports."
            />

            {/* Scrollable Table Demo */}
            <Card>
                <CardHeader>
                    <CardTitle>Scrollable Table (Default)</CardTitle>
                    <CardDescription>
                        On mobile, this table becomes horizontally scrollable with visual indicators.
                        Try resizing your browser window to see the effect.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveTableWrapper mobileLayout="scroll" showScrollIndicator={true}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[150px]">Agent Name</TableHead>
                                    <TableHead className="min-w-[180px]">Agency</TableHead>
                                    <TableHead className="text-center whitespace-nowrap">Reviews</TableHead>
                                    <TableHead className="text-center whitespace-nowrap">Rating</TableHead>
                                    <TableHead className="text-center whitespace-nowrap">Status</TableHead>
                                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sampleAgents.map((agent) => (
                                    <TableRow key={agent.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium whitespace-nowrap">{agent.name}</TableCell>
                                        <TableCell className="text-muted-foreground whitespace-nowrap">
                                            {agent.agency}
                                        </TableCell>
                                        <TableCell className="text-center font-semibold">
                                            {agent.reviews}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                <span className="font-semibold">{agent.rating}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={agent.status === 'Active' ? 'default' : 'secondary'}
                                                className={cn(
                                                    agent.status === 'Active' &&
                                                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                )}
                                            >
                                                {agent.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm">
                                                View <ExternalLink className="ml-2 h-3 w-3" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ResponsiveTableWrapper>
                </CardContent>
            </Card>

            {/* Card-Based Layout Demo */}
            <Card>
                <CardHeader>
                    <CardTitle>Card-Based Layout (Mobile Alternative)</CardTitle>
                    <CardDescription>
                        On mobile, data is displayed as cards. On desktop, it shows as a traditional table.
                        This is ideal for tables with many columns or complex data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveTableCards
                        data={sampleAgents}
                        columns={[
                            {
                                key: 'name',
                                label: 'Agent Name',
                                render: (value) => <span className="font-medium">{String(value)}</span>,
                            },
                            {
                                key: 'agency',
                                label: 'Agency',
                                render: (value) => (
                                    <span className="text-muted-foreground">{String(value)}</span>
                                ),
                            },
                            {
                                key: 'reviews',
                                label: 'Reviews',
                                render: (value) => <span className="font-semibold">{String(value)}</span>,
                            },
                            {
                                key: 'rating',
                                label: 'Rating',
                                render: (value) => (
                                    <div className="flex items-center justify-end gap-1">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <span className="font-semibold">{String(value)}</span>
                                    </div>
                                ),
                            },
                            {
                                key: 'status',
                                label: 'Status',
                                render: (value, item) => (
                                    <Badge
                                        variant={item.status === 'Active' ? 'default' : 'secondary'}
                                        className={cn(
                                            item.status === 'Active' &&
                                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                        )}
                                    >
                                        {String(value)}
                                    </Badge>
                                ),
                            },
                        ]}
                        keyExtractor={(agent) => agent.id}
                        breakpoint="md"
                        onCardClick={(agent) => console.log('Clicked:', agent.name)}
                    />
                </CardContent>
            </Card>

            {/* Compact Table Demo */}
            <Card>
                <CardHeader>
                    <CardTitle>Compact Scrollable Table</CardTitle>
                    <CardDescription>
                        A simpler table with fewer columns works well with horizontal scrolling on mobile.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveTableWrapper mobileLayout="scroll" showScrollIndicator={true}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[150px]">Agent</TableHead>
                                    <TableHead className="text-center whitespace-nowrap">Reviews</TableHead>
                                    <TableHead className="text-center whitespace-nowrap">Rating</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sampleAgents.map((agent) => (
                                    <TableRow key={agent.id}>
                                        <TableCell>
                                            <div className="font-medium whitespace-nowrap">{agent.name}</div>
                                            <div className="text-sm text-muted-foreground whitespace-nowrap">
                                                {agent.agency}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-semibold">
                                            {agent.reviews}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                <span className="font-semibold">{agent.rating}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ResponsiveTableWrapper>
                </CardContent>
            </Card>

            {/* Implementation Notes */}
            <Card>
                <CardHeader>
                    <CardTitle>Implementation Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2">Scrollable Tables</h3>
                        <p className="text-sm text-muted-foreground">
                            Use <code className="bg-muted px-1 py-0.5 rounded">ResponsiveTableWrapper</code> with{' '}
                            <code className="bg-muted px-1 py-0.5 rounded">mobileLayout="scroll"</code> for tables
                            that need to maintain their structure on mobile. Best for tables with 3-6 columns.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Card-Based Layouts</h3>
                        <p className="text-sm text-muted-foreground">
                            Use <code className="bg-muted px-1 py-0.5 rounded">ResponsiveTableCards</code> for
                            tables with many columns or complex data. This provides a better mobile experience by
                            showing data in a vertical card layout.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Best Practices</h3>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                            <li>Use <code className="bg-muted px-1 py-0.5 rounded">whitespace-nowrap</code> on cells that shouldn't wrap</li>
                            <li>Set <code className="bg-muted px-1 py-0.5 rounded">min-w-[...]</code> on columns to ensure readability</li>
                            <li>Enable scroll indicators to help users discover horizontal scrolling</li>
                            <li>Consider card layouts for tables with 7+ columns</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
