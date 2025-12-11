'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Settings, CheckCircle, XCircle, Target, Beaker, BarChart3, Zap, Plus, Eye, Edit } from 'lucide-react';

export function FeaturesClient() {
    const [loading, setLoading] = useState(true);
    const [features, setFeatures] = useState<any[]>([]);

    useEffect(() => {
        // Mock data loading
        setTimeout(() => {
            setFeatures([
                {
                    id: 'ai-content-generation',
                    name: 'AI Content Generation',
                    description: 'Generate blog posts, social media content, and marketing materials',
                    enabled: true,
                    category: 'AI Features',
                    usage: 85,
                    rolloutPercentage: 100
                },
                {
                    id: 'image-reimagining',
                    name: 'Image Reimagining',
                    description: 'AI-powered image editing and virtual staging',
                    enabled: true,
                    category: 'AI Features',
                    usage: 72,
                    rolloutPercentage: 100
                },
                {
                    id: 'market-analytics',
                    name: 'Market Analytics',
                    description: 'Advanced market insights and trend analysis',
                    enabled: false,
                    category: 'Analytics',
                    usage: 0,
                    rolloutPercentage: 0
                },
                {
                    id: 'competitor-tracking',
                    name: 'Competitor Tracking',
                    description: 'Monitor competitor activity and rankings',
                    enabled: true,
                    category: 'Intelligence',
                    usage: 45,
                    rolloutPercentage: 75
                }
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    const toggleFeature = (featureId: string) => {
        setFeatures(prev => prev.map(feature =>
            feature.id === featureId
                ? { ...feature, enabled: !feature.enabled }
                : feature
        ));
    };

    const getStatusColor = (enabled: boolean) => {
        return enabled
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'AI Features': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'Analytics': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'Intelligence': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Feature Management</h1>
                    <p className="text-muted-foreground">Control feature flags and rollout percentages</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading features...</div>
            ) : (
                <>
                    {/* Feature Overview */}
                    <div className="grid gap-6 md:grid-cols-4">
                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20" />
                            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Features</CardTitle>
                                <Settings className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="text-3xl font-bold text-blue-600">{features.length}</div>
                                <p className="text-xs text-blue-600 mt-1">Available features</p>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" />
                            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Enabled</CardTitle>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="text-3xl font-bold text-green-600">
                                    {features.filter(f => f.enabled).length}
                                </div>
                                <p className="text-xs text-green-600 mt-1">Active features</p>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20" />
                            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Disabled</CardTitle>
                                <XCircle className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="text-3xl font-bold text-red-600">
                                    {features.filter(f => !f.enabled).length}
                                </div>
                                <p className="text-xs text-red-600 mt-1">Inactive features</p>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20" />
                            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">In Testing</CardTitle>
                                <Beaker className="h-4 w-4 text-yellow-600" />
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="text-3xl font-bold text-yellow-600">
                                    {features.filter(f => f.rolloutPercentage > 0 && f.rolloutPercentage < 100).length}
                                </div>
                                <p className="text-xs text-yellow-600 mt-1">Partial rollout</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Features List */}
                    <div className="space-y-4">
                        {features.map((feature) => (
                            <Card key={feature.id} className="border-l-4 border-l-blue-500">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-lg">{feature.name}</h3>
                                                <Badge className={getStatusColor(feature.enabled)}>
                                                    {feature.enabled ? 'Enabled' : 'Disabled'}
                                                </Badge>
                                                <Badge className={getCategoryColor(feature.category)}>
                                                    {feature.category}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground text-sm mb-3">
                                                {feature.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <BarChart3 className="h-4 w-4" />
                                                    <span>Usage: {feature.usage}%</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Target className="h-4 w-4" />
                                                    <span>Rollout: {feature.rolloutPercentage}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm">
                                                <Eye className="h-4 w-4 mr-1" />
                                                View
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <Edit className="h-4 w-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Switch
                                                checked={feature.enabled}
                                                onCheckedChange={() => toggleFeature(feature.id)}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}