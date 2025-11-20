'use client';

/**
 * Demo Index Page
 * 
 * Central hub for all UI component demos and test pages.
 * Only accessible in development mode.
 */

import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
    Sparkles,
    BarChart3,
    Hash,
    Zap,
    PartyPopper,
    MessageSquare,
    AlertCircle,
    ThumbsUp,
    Layers,
    Palette,
    Wand2,
    MousePointer2,
    Bell,
    TrendingUp,
    Smartphone,
    User,
    Search as SearchIcon,
    LineChart,
    Type,
    Activity,
    Users,
    Workflow,
    Eye,
    Layout,
    Home,
} from 'lucide-react';

interface Demo {
    name: string;
    path: string;
    description: string;
    category: 'UI Components' | 'Animations' | 'Interactions' | 'Testing' | 'AI Features' | 'Data Display';
    icon: any;
    tags: string[];
}

const demos: Demo[] = [
    // Animations
    {
        name: 'Animated Charts',
        path: '/animated-chart-demo',
        description: 'Smooth animated charts and sparklines',
        category: 'Animations',
        icon: BarChart3,
        tags: ['charts', 'animation', 'data-viz'],
    },
    {
        name: 'Animated Numbers',
        path: '/animated-number-demo',
        description: 'Animated number counters with formatting',
        category: 'Animations',
        icon: Hash,
        tags: ['numbers', 'animation', 'counters'],
    },
    {
        name: 'Animation Performance',
        path: '/animation-performance-demo',
        description: 'Performance testing for animations',
        category: 'Animations',
        icon: Zap,
        tags: ['performance', 'animation', 'testing'],
    },
    {
        name: 'Celebration Effects',
        path: '/celebration-demo',
        description: 'Success celebrations and confetti effects',
        category: 'Animations',
        icon: PartyPopper,
        tags: ['celebration', 'confetti', 'success'],
    },
    {
        name: 'Icon Animations',
        path: '/icon-animations-demo',
        description: 'Animated icon effects and transitions',
        category: 'Animations',
        icon: Wand2,
        tags: ['icons', 'animation', 'effects'],
    },

    // UI Components
    {
        name: 'Contextual Tooltips',
        path: '/contextual-tooltip-demo',
        description: 'Smart contextual tooltip system',
        category: 'UI Components',
        icon: MessageSquare,
        tags: ['tooltips', 'help', 'ui'],
    },
    {
        name: 'Error Handling',
        path: '/error-handling-demo',
        description: 'Error handling UI patterns',
        category: 'UI Components',
        icon: AlertCircle,
        tags: ['errors', 'feedback', 'ui'],
    },
    {
        name: 'Feedback Cues',
        path: '/feedback-cue-demo',
        description: 'User feedback and notification cues',
        category: 'UI Components',
        icon: ThumbsUp,
        tags: ['feedback', 'notifications', 'ui'],
    },
    {
        name: 'Sticky Title',
        path: '/sticky-title-demo',
        description: 'Sticky title behavior on scroll',
        category: 'UI Components',
        icon: Type,
        tags: ['scroll', 'sticky', 'ui'],
    },
    {
        name: 'Typography',
        path: '/typography-demo',
        description: 'Typography system showcase',
        category: 'UI Components',
        icon: Type,
        tags: ['typography', 'fonts', 'design'],
    },
    {
        name: 'Typography Reference',
        path: '/typography-reference',
        description: 'Complete typography reference guide',
        category: 'UI Components',
        icon: Type,
        tags: ['typography', 'reference', 'design'],
    },

    // Data Display
    {
        name: 'Responsive Tables',
        path: '/responsive-table-demo',
        description: 'Responsive table patterns',
        category: 'Data Display',
        icon: Layout,
        tags: ['tables', 'responsive', 'data'],
    },
    {
        name: 'Virtual Scroll',
        path: '/virtual-scroll-demo',
        description: 'Virtual scrolling for large lists',
        category: 'Data Display',
        icon: Activity,
        tags: ['scroll', 'performance', 'lists'],
    },

    // Interactions
    {
        name: 'Interaction Optimization',
        path: '/interaction-optimization-demo',
        description: 'Optimized interaction patterns',
        category: 'Interactions',
        icon: MousePointer2,
        tags: ['interactions', 'optimization', 'ux'],
    },
    {
        name: 'Market Notifications',
        path: '/market-notifications-demo',
        description: 'Market notification components',
        category: 'Interactions',
        icon: Bell,
        tags: ['notifications', 'market', 'alerts'],
    },
    {
        name: 'Micro Interactions',
        path: '/micro-interactions-test',
        description: 'Micro-interaction testing',
        category: 'Interactions',
        icon: MousePointer2,
        tags: ['micro-interactions', 'ux', 'testing'],
    },
];

export default function DemosIndexPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    // Check if in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';

    const categories = ['All', ...Array.from(new Set(demos.map(d => d.category)))];

    const filteredDemos = useMemo(() => {
        return demos.filter(demo => {
            const matchesSearch =
                demo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                demo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                demo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory = selectedCategory === 'All' || demo.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, selectedCategory]);

    if (!isDevelopment) {
        return (
            <StandardPageLayout
                title="Demos"
                description="Component demos are only available in development mode"
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
            title="Component Demos"
            description="Explore all UI components, animations, and interaction patterns"
            spacing="default"
        >
            <div className="space-y-6">
                {/* Search and Filter */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <Input
                                placeholder="Search demos by name, description, or tags..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="max-w-md"
                            />

                            <div className="flex flex-wrap gap-2">
                                {categories.map((category) => (
                                    <Button
                                        key={category}
                                        variant={selectedCategory === category ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setSelectedCategory(category)}
                                    >
                                        {category}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Total Demos</CardDescription>
                            <CardTitle className="text-3xl">{demos.length}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Categories</CardDescription>
                            <CardTitle className="text-3xl">{categories.length - 1}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Filtered Results</CardDescription>
                            <CardTitle className="text-3xl">{filteredDemos.length}</CardTitle>
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

                {/* Demo Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDemos.map((demo) => {
                        const Icon = demo.icon;
                        return (
                            <Card key={demo.path} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Icon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{demo.name}</CardTitle>
                                                <Badge variant="secondary" className="mt-1 text-xs">
                                                    {demo.category}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <CardDescription className="mt-2">
                                        {demo.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-1">
                                            {demo.tags.map((tag) => (
                                                <Badge key={tag} variant="outline" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                        <Button asChild className="w-full">
                                            <Link href={demo.path}>
                                                View Demo
                                                <Eye className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {filteredDemos.length === 0 && (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-center text-muted-foreground">
                                No demos found matching your search criteria.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </StandardPageLayout>
    );
}
