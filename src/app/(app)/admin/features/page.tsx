'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { TabToggle, TabToggleContent } from '@/components/ui/tab-toggle';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
    Settings,
    CheckCircle,
    XCircle,
    Zap,
    BarChart3,
    Beaker,
    Target,
    Search,
    Filter,
    Plus,
    Eye,
    Edit,
    Play,
    Pause
} from 'lucide-react';

export default function AdminFeaturesPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const coreFeatures = [
        {
            id: 'studio',
            name: 'Studio (Content Creation)',
            description: 'AI-powered content generation for blog posts, social media, and marketing materials',
            status: 'enabled',
            usage: 85,
            users: 0
        },
        {
            id: 'market',
            name: 'Market Intelligence',
            description: 'Research and market analysis tools with AI-powered insights',
            status: 'enabled',
            usage: 72,
            users: 0
        },
        {
            id: 'brand',
            name: 'Brand Tools',
            description: 'Profile management, audit tools, and strategy generation',
            status: 'enabled',
            usage: 68,
            users: 0
        },
        {
            id: 'tools',
            name: 'Tools & Calculators',
            description: 'Mortgage calculator, ROI analysis, and property valuation tools',
            status: 'enabled',
            usage: 45,
            users: 0
        },
        {
            id: 'library',
            name: 'Library & Content Management',
            description: 'Content storage, templates, and media management',
            status: 'enabled',
            usage: 60,
            users: 0
        }
    ];

    const betaFeatures = [
        {
            id: 'mobile-enhancements',
            name: 'Mobile Enhancements',
            description: 'Touch gestures, offline sync, and mobile-optimized interfaces',
            status: 'beta',
            rollout: 25,
            users: 0
        },
        {
            id: 'client-portal',
            name: 'Client Portal',
            description: 'Client-facing dashboard for property updates and communication',
            status: 'disabled',
            rollout: 0,
            users: 0
        },
        {
            id: 'ai-enhancements',
            name: 'AI Enhancement Features',
            description: 'Advanced AI capabilities including voice processing and image analysis',
            status: 'disabled',
            rollout: 0,
            users: 0
        },
        {
            id: 'notification-system',
            name: 'Notification System',
            description: 'Real-time notifications and alert management',
            status: 'development',
            rollout: 0,
            users: 0
        }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'enabled': return 'text-green-600 border-green-600 bg-green-50 dark:bg-green-950/50';
            case 'beta': return 'text-yellow-600 border-yellow-600 bg-yellow-50 dark:bg-yellow-950/50';
            case 'disabled': return 'text-gray-600 border-gray-600 bg-gray-50 dark:bg-gray-950/50';
            case 'development': return 'text-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-950/50';
            default: return 'text-gray-600 border-gray-600 bg-gray-50 dark:bg-gray-950/50';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'enabled': return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'beta': return <Beaker className="h-4 w-4 text-yellow-600" />;
            case 'disabled': return <XCircle className="h-4 w-4 text-gray-600" />;
            case 'development': return <Settings className="h-4 w-4 text-blue-600" />;
            default: return <XCircle className="h-4 w-4 text-gray-600" />;
        }
    };

    return (
        <div className="space-y-8">
            {/* Feature Overview Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Features</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-green-600">5</div>
                        <p className="text-xs text-green-600 mt-1">Core features enabled</p>
                        <Progress value={100} className="mt-3 h-2" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Beta Features</CardTitle>
                        <Beaker className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-yellow-600">1</div>
                        <p className="text-xs text-yellow-600 mt-1">In beta testing</p>
                        <Progress value={25} className="mt-3 h-2" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Development</CardTitle>
                        <Settings className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-blue-600">1</div>
                        <p className="text-xs text-blue-600 mt-1">Under development</p>
                        <Progress value={50} className="mt-3 h-2" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">A/B Tests</CardTitle>
                        <Target className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-purple-600">0</div>
                        <p className="text-xs text-purple-600 mt-1">Active experiments</p>
                        <Progress value={0} className="mt-3 h-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Feature Management Interface */}
            <TabToggle
                defaultValue="core"
                tabs={[
                    { value: "core", label: "Core Features", icon: Zap },
                    { value: "beta", label: "Beta Features", icon: Beaker },
                    { value: "experiments", label: "A/B Tests", icon: Target },
                    { value: "rollouts", label: "Feature Rollouts", icon: BarChart3 }
                ]}
            >
                <div className="flex items-center justify-end mb-6">

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search features..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 w-64"
                            />
                        </div>
                        <Button variant="outline" size="sm">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            New Feature
                        </Button>
                    </div>
                </div>

                <TabToggleContent value="core" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Zap className="h-5 w-5 text-green-600" />
                                Core Platform Features
                            </CardTitle>
                            <CardDescription>Essential features that power the Bayon Coagent platform</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {coreFeatures.map((feature) => (
                                <div key={feature.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                                            {getStatusIcon(feature.status)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-medium">{feature.name}</h4>
                                                <Badge variant="outline" className={getStatusColor(feature.status)}>
                                                    {feature.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span>Usage: {feature.usage}%</span>
                                                <span>Users: {feature.users}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch checked={feature.status === 'enabled'} />
                                        <Button variant="ghost" size="sm">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabToggleContent>

                <TabToggleContent value="beta" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Beaker className="h-5 w-5 text-yellow-600" />
                                Beta Features & Experiments
                            </CardTitle>
                            <CardDescription>Features in testing phase with controlled rollouts</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {betaFeatures.map((feature) => (
                                <div key={feature.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                                            {getStatusIcon(feature.status)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-medium">{feature.name}</h4>
                                                <Badge variant="outline" className={getStatusColor(feature.status)}>
                                                    {feature.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span>Rollout: {feature.rollout}%</span>
                                                <span>Beta Users: {feature.users}</span>
                                            </div>
                                            {feature.rollout > 0 && (
                                                <Progress value={feature.rollout} className="mt-2 h-2 w-32" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {feature.status === 'beta' ? (
                                            <Button variant="outline" size="sm">
                                                <Pause className="h-4 w-4 mr-2" />
                                                Pause
                                            </Button>
                                        ) : feature.status === 'disabled' ? (
                                            <Button variant="outline" size="sm">
                                                <Play className="h-4 w-4 mr-2" />
                                                Enable
                                            </Button>
                                        ) : (
                                            <Button variant="outline" size="sm">
                                                <Settings className="h-4 w-4 mr-2" />
                                                Configure
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabToggleContent>

                <TabToggleContent value="experiments" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Target className="h-5 w-5 text-purple-600" />
                                A/B Testing & Experiments
                            </CardTitle>
                            <CardDescription>Controlled experiments to optimize user experience</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/50 rounded-full w-fit mx-auto mb-4">
                                    <Target className="h-8 w-8 text-purple-600" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">No Active A/B Tests</h3>
                                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                                    A/B testing framework is ready for implementation.
                                    Create experiments to test feature variations and optimize user experience.
                                </p>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create A/B Test
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabToggleContent>

                <TabToggleContent value="rollouts" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                                Feature Rollout Management
                            </CardTitle>
                            <CardDescription>Gradual feature deployment and user targeting</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-full w-fit mx-auto mb-4">
                                    <BarChart3 className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Rollout Management Coming Soon</h3>
                                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                                    Advanced rollout controls will allow gradual feature deployment
                                    with user targeting and automatic rollback capabilities.
                                </p>
                                <Button variant="outline">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Configure Rollouts
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabToggleContent>
            </TabToggle>
        </div>
    );
}